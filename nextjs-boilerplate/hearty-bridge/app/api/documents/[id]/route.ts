import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { Document, Child } from '@/models';
import { updateDocumentSchema } from '@/lib/validation/document';
import connectToDatabase from '@/lib/db/mongodb';
import { handleApiError } from '@/lib/utils/error-handler';
import mongoose from 'mongoose';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/documents/[id] - Retrieve a specific document
export const GET = withAnyAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    const document = await Document.findById(id)
      .populate('uploadedBy', 'name email')
      .populate('childId', 'name');

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check access permissions
    let hasAccess = false;

    if (user.role === 'admin') {
      hasAccess = true;
    } else if (document.uploadedBy._id.toString() === user.userId) {
      hasAccess = true;
    } else {
      // Check access level permissions
      if (user.role === 'parent' && ['parent-only', 'shared'].includes(document.accessLevel)) {
        // Verify parent has access to the child
        if (document.childId) {
          const child = await Child.findById(document.childId);
          hasAccess = child?.parentId.toString() === user.userId;
        } else {
          hasAccess = true;
        }
      } else if (user.role === 'therapist' && ['therapist-only', 'shared'].includes(document.accessLevel)) {
        // Verify therapist has access to the child
        if (document.childId) {
          const child = await Child.findById(document.childId);
          hasAccess = child?.therapistId?.toString() === user.userId;
        } else {
          hasAccess = true;
        }
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: { document }
    });

  } catch (error) {
    return handleApiError(error);
  }
});

// PUT /api/documents/[id] - Update a document
export const PUT = withAnyAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    const body = await request.json();
    
    const validationResult = updateDocumentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const document = await Document.findById(id);

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check permission to update document
    const canUpdate = document.uploadedBy.toString() === user.userId || user.role === 'admin';

    if (!canUpdate) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const updateData = validationResult.data;

    // Update document properties
    if (updateData.title !== undefined) document.title = updateData.title;
    if (updateData.type !== undefined) document.type = updateData.type;
    if (updateData.expiryDate !== undefined) {
      document.expiryDate = updateData.expiryDate ? new Date(updateData.expiryDate) : undefined;
    }
    if (updateData.tags !== undefined) document.tags = updateData.tags;
    if (updateData.description !== undefined) document.description = updateData.description;
    if (updateData.isConfidential !== undefined) document.isConfidential = updateData.isConfidential;
    if (updateData.accessLevel !== undefined) document.accessLevel = updateData.accessLevel;
    if (updateData.metadata !== undefined) {
      document.metadata = { ...document.metadata, ...updateData.metadata };
    }

    await document.save();

    // Populate the response
    await document.populate('uploadedBy', 'name email');
    await document.populate('childId', 'name');

    return NextResponse.json({
      success: true,
      data: { document },
      message: 'Document updated successfully'
    });

  } catch (error) {
    return handleApiError(error);
  }
});

// DELETE /api/documents/[id] - Delete a document
export const DELETE = withAnyAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    const document = await Document.findById(id);

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check permission to delete document
    const canDelete = document.uploadedBy.toString() === user.userId || user.role === 'admin';

    if (!canDelete) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await Document.findByIdAndDelete(id);

    // Note: In a real implementation, you would also delete the actual file from storage

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    return handleApiError(error);
  }
});