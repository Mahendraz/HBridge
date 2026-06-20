import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { MediaFile } from '@/models';
import { bulkMediaOperationSchema } from '@/lib/validation/media';
import connectToDatabase from '@/lib/db/mongodb';
import { handleApiError } from '@/lib/utils/error-handler';

// POST /api/media/bulk - Perform bulk operations on media files
export const POST = withAnyAuth(async (request: NextRequest, user: any) => {
  try {

    await connectToDatabase();

    const body = await request.json();
    
    const validationResult = bulkMediaOperationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { mediaIds, operation, data } = validationResult.data;

    // Find all media files that the user has permission to modify
    const query: any = {
      _id: { $in: mediaIds }
    };

    // For non-admin users, only allow operations on their own uploads
    if (user.role !== 'admin') {
      query.uploadedBy = user.userId;
    }

    const mediaFiles = await MediaFile.find(query);

    if (mediaFiles.length === 0) {
      return NextResponse.json({ 
        error: 'No media files found or access denied' 
      }, { status: 404 });
    }

    if (mediaFiles.length !== mediaIds.length) {
      return NextResponse.json({ 
        error: `Only ${mediaFiles.length} out of ${mediaIds.length} media files can be modified` 
      }, { status: 403 });
    }

    let updatedCount = 0;
    let results: any[] = [];

    switch (operation) {
      case 'delete':
        for (const mediaFile of mediaFiles) {
          await MediaFile.findByIdAndDelete(mediaFile._id);
          updatedCount++;
          results.push({
            id: mediaFile._id,
            status: 'deleted'
          });
        }
        break;

      case 'updateTags':
        if (!data?.tags) {
          return NextResponse.json({ 
            error: 'Tags data is required for updateTags operation' 
          }, { status: 400 });
        }
        
        for (const mediaFile of mediaFiles) {
          mediaFile.tags = data.tags;
          await mediaFile.save();
          updatedCount++;
          results.push({
            id: mediaFile._id,
            status: 'updated',
            tags: mediaFile.tags
          });
        }
        break;

      case 'updateVisibility':
        if (data?.isPublic === undefined) {
          return NextResponse.json({ 
            error: 'isPublic data is required for updateVisibility operation' 
          }, { status: 400 });
        }
        
        for (const mediaFile of mediaFiles) {
          mediaFile.isPublic = data.isPublic;
          await mediaFile.save();
          updatedCount++;
          results.push({
            id: mediaFile._id,
            status: 'updated',
            isPublic: mediaFile.isPublic
          });
        }
        break;

      default:
        return NextResponse.json({ 
          error: 'Unsupported operation' 
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        operation,
        updatedCount,
        results
      },
      message: `Successfully ${operation === 'delete' ? 'deleted' : 'updated'} ${updatedCount} media files`
    });

  } catch (error) {
    return handleApiError(error);
  }
});