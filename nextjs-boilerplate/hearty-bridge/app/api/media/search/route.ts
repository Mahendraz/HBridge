import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { MediaFile } from '@/models';
import { mediaSearchSchema } from '@/lib/validation/media';
import connectToDatabase from '@/lib/db/mongodb';
import { handleApiError } from '@/lib/utils/error-handler';

// GET /api/media/search - Search media files
export const GET = withAnyAuth(async (request: NextRequest, user: any) => {
  try {

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const queryParams = {
      query: searchParams.get('query'),
      childId: searchParams.get('childId'),
      type: searchParams.get('type'),
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0')
    };

    const validationResult = mediaSearchSchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { query, childId, type, limit, offset } = validationResult.data;

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

    // For non-admin users, only show their own uploads or public media
    if (user.role !== 'admin') {
      searchQuery.$and = [
        searchQuery.$and || {},
        {
          $or: [
            { uploadedBy: user.userId },
            { isPublic: true }
          ]
        }
      ];
    }

    const mediaFiles = await MediaFile.find(searchQuery, {
      score: { $meta: 'textScore' }
    })
      .populate('uploadedBy', 'name email')
      .populate('childId', 'name')
      .sort({ score: { $meta: 'textScore' } })
      .skip(offset)
      .limit(limit);

    const total = await MediaFile.countDocuments(searchQuery);

    return NextResponse.json({
      success: true,
      data: {
        mediaFiles,
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