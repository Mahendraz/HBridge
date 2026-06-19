import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { Document } from '@/models';
import { documentSearchSchema } from '@/lib/validation/document';
import connectToDatabase from '@/lib/db/mongodb';
import { handleApiError } from '@/lib/utils/error-handler';

// GET /api/documents/search - Search documents
export const GET = withAnyAuth(async (request: NextRequest, user: any) => {
  try {

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const queryParams = {
      query: searchParams.get('query'),
      childId: searchParams.get('childId'),
      type: searchParams.get('type'),
      accessLevel: searchParams.get('accessLevel'),
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0')
    };

    const validationResult = documentSearchSchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { query, childId, type, accessLevel, limit, offset } = validationResult.data;

    // Build search query
    const searchQuery: any = {
      $text: { $search: query }
    };

    // Add filters
    if (childId) {
      searchQuery.childId = childId;
    }

    if (type) {
      searchQuery.type = type;
    }

    // Filter by access level based on user role
    if (accessLevel) {
      searchQuery.accessLevel = accessLevel;
    } else {
      // Default access filtering based on user role
      if (user.role === 'parent') {
        searchQuery.accessLevel = { $in: ['parent-only', 'shared'] };
      } else if (user.role === 'therapist') {
        searchQuery.accessLevel = { $in: ['therapist-only', 'shared'] };
      }
      // Admin can search all
    }

    // For non-admin users, only search documents they have access to
    if (user.role !== 'admin') {
      searchQuery.$or = [
        { uploadedBy: user.id },
        searchQuery // Include existing search criteria
      ];
    }

    const documents = await Document.find(searchQuery, {
      score: { $meta: 'textScore' }
    })
      .populate('uploadedBy', 'name email')
      .populate('childId', 'name')
      .sort({ score: { $meta: 'textScore' } })
      .skip(offset)
      .limit(limit);

    const total = await Document.countDocuments(searchQuery);

    return NextResponse.json({
      success: true,
      data: {
        documents,
        query,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
});