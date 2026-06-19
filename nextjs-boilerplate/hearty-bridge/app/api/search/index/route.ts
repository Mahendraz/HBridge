import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { SearchIndex } from '@/models';
import { indexContentSchema, updateIndexSchema, bulkIndexOperationSchema } from '@/lib/validation/search';
import connectToDatabase from '@/lib/db/mongodb';
import { handleApiError } from '@/lib/utils/error-handler';
import mongoose from 'mongoose';

// POST /api/search/index - Index content for search
export const POST = withAnyAuth(async (request: NextRequest, user: any) => {
  try {

    await connectToDatabase();

    const body = await request.json();
    
    const validationResult = indexContentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { entityType, entityId, content, tags, metadata, permissions } = validationResult.data;

    // Check if user has permission to index this content
    if (user.role !== 'admin') {
      // Only allow users to index content they own or have permission to modify
      if (metadata?.uploadedBy && metadata.uploadedBy !== user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const searchIndex = await SearchIndex.indexEntity(
      entityType,
      new mongoose.Types.ObjectId(entityId),
      content,
      tags,
      {
        ...metadata,
        indexedBy: user.id,
        indexedAt: new Date()
      }
    );

    // Set permissions
    if (permissions) {
      searchIndex.permissions = {
        viewableBy: permissions.viewableBy?.map((id: string) => new mongoose.Types.ObjectId(id)) || [],
        roles: permissions.roles || []
      };
      await searchIndex.save();
    }

    return NextResponse.json({
      success: true,
      data: { searchIndex },
      message: 'Content indexed successfully'
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
});

// PUT /api/search/index - Update indexed content
export const PUT = withAnyAuth(async (request: NextRequest, user: any) => {
  try {

    await connectToDatabase();

    const body = await request.json();
    
    const validationResult = updateIndexSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { entityId, content, tags, metadata, permissions } = validationResult.data;

    const searchIndex = await SearchIndex.updateEntityIndex(
      new mongoose.Types.ObjectId(entityId),
      content,
      tags,
      {
        ...metadata,
        updatedBy: user.id,
        updatedAt: new Date()
      }
    );

    if (!searchIndex) {
      return NextResponse.json({ error: 'Search index entry not found' }, { status: 404 });
    }

    // Update permissions if provided
    if (permissions) {
      searchIndex.permissions = {
        viewableBy: permissions.viewableBy?.map((id: string) => new mongoose.Types.ObjectId(id)) || searchIndex.permissions.viewableBy,
        roles: permissions.roles || searchIndex.permissions.roles
      };
      await searchIndex.save();
    }

    return NextResponse.json({
      success: true,
      data: { searchIndex },
      message: 'Search index updated successfully'
    });

  } catch (error) {
    return handleApiError(error);
  }
});

// DELETE /api/search/index - Remove content from search index
export const DELETE = withAnyAuth(async (request: NextRequest, user: any) => {
  try {

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get('entityId');

    if (!entityId) {
      return NextResponse.json({ error: 'Entity ID is required' }, { status: 400 });
    }

    // Check if user has permission to remove this content
    if (user.role !== 'admin') {
      const searchIndex = await SearchIndex.findOne({ entityId });
      if (searchIndex && searchIndex.metadata?.uploadedBy !== user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    await SearchIndex.removeEntityFromIndex(new mongoose.Types.ObjectId(entityId));

    return NextResponse.json({
      success: true,
      message: 'Content removed from search index'
    });

  } catch (error) {
    return handleApiError(error);
  }
});