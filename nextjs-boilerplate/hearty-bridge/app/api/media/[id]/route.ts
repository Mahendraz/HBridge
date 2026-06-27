import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { MediaFile } from '@/models';
import { updateMediaSchema } from '@/lib/validation/media';
import connectToDatabase from '@/lib/db/mongodb';
import { handleApiError } from '@/lib/utils/error-handler';
import mongoose from 'mongoose';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/media/[id] - Retrieve a specific media file
export const GET = withAnyAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid media file ID' }, { status: 400 });
    }

    const mediaFile = await MediaFile.findById(id)
      .populate('uploadedBy', 'name email')
      .populate('childId', 'name');

    if (!mediaFile) {
      return NextResponse.json({ error: 'Media file not found' }, { status: 404 });
    }

    // Check permission to view media file
    const canView = mediaFile.isPublic ||
                    mediaFile.uploadedBy._id.toString() === user.userId ||
                    (user.role === 'admin' || user.role === 'super_admin');

    if (!canView) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: { mediaFile }
    });

  } catch (error) {
    return handleApiError(error);
  }
});

// PUT /api/media/[id] - Update a media file
export const PUT = withAnyAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid media file ID' }, { status: 400 });
    }

    const body = await request.json();
    
    const validationResult = updateMediaSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const mediaFile = await MediaFile.findById(id);

    if (!mediaFile) {
      return NextResponse.json({ error: 'Media file not found' }, { status: 404 });
    }

    // Check permission to update media file
    const canUpdate = mediaFile.uploadedBy.toString() === user.userId || (user.role === 'admin' || user.role === 'super_admin');

    if (!canUpdate) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const updateData = validationResult.data;

    // Update the media file
    Object.assign(mediaFile, updateData);
    await mediaFile.save();

    // Populate the response
    await mediaFile.populate('uploadedBy', 'name email');
    await mediaFile.populate('childId', 'name');

    return NextResponse.json({
      success: true,
      data: { mediaFile },
      message: 'Media file updated successfully'
    });

  } catch (error) {
    return handleApiError(error);
  }
});

// DELETE /api/media/[id] - Delete a media file
export const DELETE = withAnyAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid media file ID' }, { status: 400 });
    }

    const mediaFile = await MediaFile.findById(id);

    if (!mediaFile) {
      return NextResponse.json({ error: 'Media file not found' }, { status: 404 });
    }

    // Check permission to delete media file
    const canDelete = mediaFile.uploadedBy.toString() === user.userId || (user.role === 'admin' || user.role === 'super_admin');

    if (!canDelete) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await MediaFile.findByIdAndDelete(id);

    // Note: In a real implementation, you would also delete the actual file from storage
    // This could involve deleting from AWS S3, Google Cloud Storage, etc.

    return NextResponse.json({
      success: true,
      message: 'Media file deleted successfully'
    });

  } catch (error) {
    return handleApiError(error);
  }
});