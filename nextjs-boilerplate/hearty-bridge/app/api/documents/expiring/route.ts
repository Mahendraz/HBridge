import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { Document } from '@/models';
import connectToDatabase from '@/lib/db/mongodb';
import { handleApiError } from '@/lib/utils/error-handler';

// GET /api/documents/expiring - Get documents expiring soon
export const GET = withAnyAuth(async (request: NextRequest, user: any) => {
  try {

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (days < 1 || days > 365) {
      return NextResponse.json({ 
        error: 'Days parameter must be between 1 and 365' 
      }, { status: 400 });
    }

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    // Build query based on user role
    const query: any = {
      expiryDate: {
        $lte: futureDate,
        $gte: new Date()
      }
    };

    // Filter by access level based on user role
    if (user.role === 'parent') {
      query.accessLevel = { $in: ['parent-only', 'shared'] };
    } else if (user.role === 'therapist') {
      query.accessLevel = { $in: ['therapist-only', 'shared'] };
    }
    // Admin can see all

    // For non-admin users, only show documents they uploaded or have access to
    if (user.role !== 'admin') {
      query.$or = [
        { uploadedBy: user.id },
        query // Include existing criteria
      ];
    }

    const documents = await Document.find(query)
      .populate('uploadedBy', 'name email')
      .populate('childId', 'name')
      .sort({ expiryDate: 1 })
      .limit(limit);

    // Add days until expiry to each document
    const documentsWithExpiry = documents.map(doc => ({
      ...doc.toObject(),
      daysUntilExpiry: doc.getDaysUntilExpiry(),
      isExpiring: doc.isExpiring()
    }));

    return NextResponse.json({
      success: true,
      data: {
        documents: documentsWithExpiry,
        daysFilter: days,
        total: documentsWithExpiry.length
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
});