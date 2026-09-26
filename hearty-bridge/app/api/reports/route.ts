import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import { Report, Child, User } from '@/models';
import ReportComment from '@/models/ReportComment';
import mongoose from 'mongoose';
import { getR2SignedUrl } from '@/lib/services/r2-storage';
import { notify } from '@/lib/utils/notify';
import { logActivity } from '@/lib/utils/audit-log';

async function injectSignedUrls(reports: any[]): Promise<any[]> {
  return Promise.all(
    reports.map(async (report) => {
      if (!report.mediaFiles?.length) return report;
      const mediaFiles = await Promise.all(
        report.mediaFiles.map(async (m: any) => {
          if (!m.gcsPath) return m;
          const signedUrl = await getR2SignedUrl(m.gcsPath);
          if (!signedUrl) {
            console.warn('[injectSignedUrls] Failed to get signed URL for key:', m.gcsPath);
          }
          return { ...m, url: signedUrl ?? m.url };
        })
      );
      return { ...report, mediaFiles };
    })
  );
}

/**
 * GET /api/reports
 * Returns all reports the current user is allowed to see.
 *   admin     → all reports
 *   therapist → only their own reports
 *   parent    → only reports for their children
 */
export const GET = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    await connectToDatabase();

    const url = new URL(req.url);
    // `|| default` also catches NaN; limit=0 would mean "no limit" to Mongo.
    const page  = Math.max(1, parseInt(url.searchParams.get('page')  || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10) || 50));
    const skip  = (page - 1) * limit;
    const sessionDateFrom = url.searchParams.get('sessionDateFrom');
    const sessionDateTo   = url.searchParams.get('sessionDateTo');

    const query: Record<string, any> = { isActive: true };

    if (sessionDateFrom && sessionDateTo) {
      query.sessionDate = {
        $gte: new Date(sessionDateFrom + 'T00:00:00.000Z'),
        $lte: new Date(sessionDateTo   + 'T23:59:59.999Z'),
      };
    }

    if (user.role === 'parent') {
      const Child = mongoose.models.Child ||
        mongoose.model('Child', new mongoose.Schema({ parentId: mongoose.Schema.Types.ObjectId }));
      const children = await Child.find({
        parentId: new mongoose.Types.ObjectId(user.userId),
      }).select('_id').lean();
      const childIds = (children as any[]).map((c) => c._id);
      query.childId = { $in: childIds };
      query.status = 'completed';
    } else if (user.role === 'therapist') {
      query.therapistId = new mongoose.Types.ObjectId(user.userId);
    }

    // ?needsReply=1 (staff only): reports with root comments not yet marked
    // "Selesai", newest comment first. Driven by the comments index, so the
    // default list below stays a plain createdAt sort.
    const needsReply = url.searchParams.get('needsReply') === '1' && user.role !== 'parent';

    type LeanReport = { _id: mongoose.Types.ObjectId };
    let reports: unknown[];
    let total: number;
    if (needsReply) {
      const commentMatch: Record<string, unknown> = { isResolved: false, isActive: true, parentCommentId: null };
      if (user.role === 'therapist') commentMatch.therapistId = new mongoose.Types.ObjectId(user.userId);
      const latestByReport = await ReportComment.aggregate<{ _id: mongoose.Types.ObjectId; lastCommentAt: Date }>([
        { $match: commentMatch },
        { $group: { _id: '$reportId', lastCommentAt: { $max: '$createdAt' } } },
      ]);
      const lastCommentAt = new Map(latestByReport.map((r) => [r._id.toString(), r.lastCommentAt]));
      const matched = await Report.find({ ...query, _id: { $in: latestByReport.map((r) => r._id) } })
        .lean<LeanReport[]>();
      matched.sort(
        (a, b) =>
          new Date(lastCommentAt.get(b._id.toString()) ?? 0).getTime() -
          new Date(lastCommentAt.get(a._id.toString()) ?? 0).getTime()
      );
      total = matched.length;
      reports = matched.slice(skip, skip + limit).map((r) => ({
        ...r,
        lastCommentAt: lastCommentAt.get(r._id.toString()) ?? null,
      }));
    } else {
      [reports, total] = await Promise.all([
        Report.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Report.countDocuments(query),
      ]);
    }

    const reportsWithUrls = await injectSignedUrls(reports);

    // Inject unresolved comment count per report — parents never see this badge
    // (they lack reports:resolve_comment), so skip the aggregation for them entirely.
    const countMap = new Map<string, number>();
    if (user.role !== 'parent') {
      const reportIds = (reports as any[]).map((r) => r._id);
      const commentCounts = await ReportComment.aggregate([
        {
          $match: {
            reportId: { $in: reportIds },
            isResolved: false,
            isActive: true,
            parentCommentId: null,
          },
        },
        { $group: { _id: '$reportId', count: { $sum: 1 } } },
      ]);
      for (const c of commentCounts as any[]) countMap.set(c._id.toString(), c.count);
    }
    // Parents don't have the resolve_comment permission — omit the field entirely
    // rather than relying on the frontend alone to hide the badge.
    const enriched = reportsWithUrls.map((r: any) => ({
      ...r,
      ...(user.role === 'parent' ? {} : { unresolvedCommentCount: countMap.get(r._id?.toString() ?? '') ?? 0 }),
    }));

    return NextResponse.json({
      success: true,
      data: enriched,
      total,
      page,
      limit,
    });
  })
);

/**
 * POST /api/reports
 * Create a new report. Only admin and therapist roles are allowed.
 */
export const POST = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    if (user.role === 'parent') {
      return NextResponse.json(
        { success: false, error: 'Parents cannot create reports' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const body = await req.json();

    const {
      title,
      description,
      content,
      type,
      status,
      childId,
      therapistId,
      dueDate,
      sessionDate,
      sessionHour,
      tags,
    } = body;

    if (!title || !childId) {
      return NextResponse.json(
        { success: false, error: 'title and childId are required' },
        { status: 400 }
      );
    }

    if (typeof childId !== 'string' || !mongoose.isValidObjectId(childId)) {
      return NextResponse.json({ success: false, error: 'Invalid child ID' }, { status: 400 });
    }

    // Therapist can only create reports for children in their schedule
    if (user.role === 'therapist') {
      const WeeklySchedule = mongoose.models.WeeklySchedule ||
        mongoose.model('WeeklySchedule', new mongoose.Schema({ therapistId: String, patientId: String }));
      const slot = await WeeklySchedule.findOne({
        therapistId: user.userId,
        patientId: childId,
      }).lean();
      if (!slot) {
        return NextResponse.json(
          { success: false, error: 'Anda hanya dapat membuat laporan untuk pasien yang ada di jadwal Anda.' },
          { status: 403 }
        );
      }
    }

    const child = await Child.findOne({ _id: childId, isActive: true }).select('name').lean();
    if (!child) {
      return NextResponse.json({ success: false, error: 'Child not found' }, { status: 404 });
    }

    // Authorship is the caller for therapists — a report can't be signed with
    // a colleague's name. Admins may file one for a therapist, who must exist.
    let authorId = user.userId as string;
    let authorName = user.name || '';
    if (user.role !== 'therapist' && therapistId) {
      if (typeof therapistId !== 'string' || !mongoose.isValidObjectId(therapistId)) {
        return NextResponse.json({ success: false, error: 'Invalid therapist ID' }, { status: 400 });
      }
      const therapist = await User.findOne({ _id: therapistId, role: 'therapist', isActive: true }).select('name').lean();
      if (!therapist) {
        return NextResponse.json({ success: false, error: 'Therapist not found' }, { status: 400 });
      }
      authorId = therapistId;
      authorName = (therapist as any).name || '';
    }

    const report = new Report({
      title: title.trim(),
      description: description?.trim() || '',
      content: content?.trim() || '',
      type: (type === 'assessment' ? 'assessment' : type === 'hero_bridge' ? 'hero_bridge' : 'progress'),
      status: status || 'draft',
      childId: new mongoose.Types.ObjectId(childId),
      childName: (child as any).name || '',
      therapistId: new mongoose.Types.ObjectId(authorId),
      therapistName: authorName,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      sessionDate: sessionDate ? new Date(sessionDate + 'T00:00:00.000Z') : undefined,
      sessionHour: sessionHour ?? undefined,
      tags: Array.isArray(tags) ? tags.map((t: string) => t.trim()).filter(Boolean) : [],
      mediaFiles: [],
      isActive: true,
    });

    await report.save();

    if (report.status === 'completed') {
      const child = await Child.findById(report.childId).select('parentId').lean();
      const parentId = (child as any)?.parentId;
      if (parentId) {
        await notify({
          recipientId: parentId,
          type: 'new_report',
          title: `Laporan baru: ${report.title}`,
          body: `Laporan terapi ${report.childName} sudah tersedia.`,
          link: '/dashboard/reports',
        });
      }
    }

    logActivity(req, {
      category: 'report',
      action: 'report.created',
      title: `Laporan dibuat — ${report.childName}`,
      description: `${report.title} · ${report.type}`,
      actor: user,
      target: { type: 'report', id: report._id, name: report.title },
      metadata: { childId: report.childId.toString(), therapistName: report.therapistName, status: report.status },
    });

    return NextResponse.json(
      { success: true, data: report },
      { status: 201 }
    );
  })
);
