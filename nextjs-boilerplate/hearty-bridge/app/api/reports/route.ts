import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import { Report } from '@/models';
import ReportComment from '@/models/ReportComment';
import mongoose from 'mongoose';
import { getR2SignedUrl } from '@/lib/services/r2-storage';

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
    const page  = Math.max(1, parseInt(url.searchParams.get('page')  || '1'));
    const limit = Math.min(100, parseInt(url.searchParams.get('limit') || '50'));
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
    } else if (user.role === 'therapist') {
      query.therapistId = new mongoose.Types.ObjectId(user.userId);
    }

    const [reports, total] = await Promise.all([
      Report.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Report.countDocuments(query),
    ]);

    const reportsWithUrls = await injectSignedUrls(reports);

    // Inject unresolved comment count per report
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
    const countMap = new Map<string, number>(
      commentCounts.map((c: any) => [c._id.toString(), c.count])
    );
    const enriched = reportsWithUrls.map((r: any) => ({
      ...r,
      unresolvedCommentCount: countMap.get(r._id?.toString() ?? '') ?? 0,
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
      childName,
      therapistId,
      therapistName,
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

    const report = new Report({
      title: title.trim(),
      description: description?.trim() || '',
      content: content?.trim() || '',
      type: type || (sessionDate ? 'therapy-notes' : 'progress'),
      status: status || 'draft',
      childId: new mongoose.Types.ObjectId(childId),
      childName: childName?.trim() || '',
      therapistId: new mongoose.Types.ObjectId(therapistId || user.userId),
      therapistName: therapistName?.trim() || user.name || '',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      sessionDate: sessionDate ? new Date(sessionDate + 'T00:00:00.000Z') : undefined,
      sessionHour: sessionHour ?? undefined,
      tags: Array.isArray(tags) ? tags.map((t: string) => t.trim()).filter(Boolean) : [],
      mediaFiles: [],
      isActive: true,
    });

    await report.save();

    return NextResponse.json(
      { success: true, data: report },
      { status: 201 }
    );
  })
);
