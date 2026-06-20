import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { MediaFile } from '@/models';
import { uploadMediaSchema, mediaQuerySchema } from '@/lib/validation/media';
import connectToDatabase from '@/lib/db/mongodb';
import { handleApiError } from '@/lib/utils/error-handler';

// GET /api/media - Retrieve media files with filtering
export const GET = withAnyAuth(async (request: NextRequest, user: any) => {
  try {

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const queryParams = {
      childId: searchParams.get('childId'),
      type: searchParams.get('type'),
      isPublic: searchParams.get('isPublic') === 'true' ? true : undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
      sortBy: searchParams.get('sortBy') || 'uploadedAt',
      sortOrder: searchParams.get('sortOrder') || 'desc'
    };

    const validationResult = mediaQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const query: any = {};
    
    // Filter by child ID if provided
    if (queryParams.childId) {
      query.childId = queryParams.childId;
    }

    // Filter by media type if provided
    if (queryParams.type) {
      query.type = queryParams.type;
    }

    // Filter by public/private status if provided
    if (queryParams.isPublic !== undefined) {
      query.isPublic = queryParams.isPublic;
    }

    // For non-admin users, only show their own uploads or public media
    if (user.role !== 'admin') {
      if (!query.isPublic) {
        query.$or = [
          { uploadedBy: user.userId },
          { isPublic: true }
        ];
      }
    }

    // Build sort object
    const sortOrder = queryParams.sortOrder === 'asc' ? 1 : -1;
    const sort: any = {};
    sort[queryParams.sortBy] = sortOrder;

    const mediaFiles = await MediaFile.find(query)
      .populate('uploadedBy', 'name email')
      .populate('childId', 'name')
      .sort(sort)
      .skip(queryParams.offset)
      .limit(queryParams.limit);

    const total = await MediaFile.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: {
        mediaFiles,
        pagination: {
          total,
          limit: queryParams.limit,
          offset: queryParams.offset,
          hasMore: queryParams.offset + queryParams.limit < total
        }
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/media - Upload a new media file
export const POST = withAnyAuth(async (request: NextRequest, user: any) => {
  try {

    await connectToDatabase();

    const body = await request.json();
    
    const validationResult = uploadMediaSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const {
      fileName,
      originalName,
      mimeType,
      size,
      type,
      childId,
      tags,
      description,
      isPublic,
      metadata
    } = validationResult.data;

    // Note: In a real implementation, you would handle the actual file upload here
    // This could involve uploading to AWS S3, Google Cloud Storage, etc.
    // For now, we're assuming the file has already been uploaded and we have the URL
    const fileUrl = `/uploads/media/${fileName}`;

    const mediaFile = new MediaFile({
      fileName,
      originalName,
      mimeType,
      size,
      url: fileUrl,
      type,
      childId: childId || undefined,
      uploadedBy: user.userId,
      tags: tags || [],
      description,
      isPublic: isPublic || false,
      metadata: metadata || {}
    });

    await mediaFile.save();

    // Populate the response
    await mediaFile.populate('uploadedBy', 'name email');
    if (childId) {
      await mediaFile.populate('childId', 'name');
    }

    return NextResponse.json({
      success: true,
      data: { mediaFile },
      message: 'Media file uploaded successfully'
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
});