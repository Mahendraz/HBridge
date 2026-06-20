import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { Family } from '@/models';
import { updateFamilySchema } from '@/lib/validation/family';
import connectToDatabase from '@/lib/db/mongodb';
import { handleApiError } from '@/lib/utils/error-handler';
import mongoose from 'mongoose';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/families/[id] - Retrieve a specific family
export const GET = withAnyAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid family ID' }, { status: 400 });
    }

    const family = await Family.findById(id)
      .populate('primaryParents', 'name email')
      .populate('children', 'name dateOfBirth')
      .populate('extendedMembers.userId', 'name email');

    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    // Check permission to view family
    const canView = family.canUserAccess(new mongoose.Types.ObjectId(user.userId)) ||
                    user.role === 'admin';

    if (!canView) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: { family }
    });

  } catch (error) {
    return handleApiError(error);
  }
});

// PUT /api/families/[id] - Update a family
export const PUT = withAnyAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid family ID' }, { status: 400 });
    }

    const body = await request.json();
    
    const validationResult = updateFamilySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const family = await Family.findById(id);

    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    // Check permission to update family
    const isPrimaryParent = family.primaryParents.some(
      parentId => parentId.toString() === user.userId
    );
    const canUpdate = isPrimaryParent || user.role === 'admin';

    if (!canUpdate) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const updateData = validationResult.data;

    // Update the family
    if (updateData.familyName) {
      family.familyName = updateData.familyName;
    }

    if (updateData.settings) {
      Object.assign(family.settings, updateData.settings);
    }

    await family.save();

    // Populate the response
    await family.populate('primaryParents', 'name email');
    await family.populate('children', 'name dateOfBirth');
    await family.populate('extendedMembers.userId', 'name email');

    return NextResponse.json({
      success: true,
      data: { family },
      message: 'Family updated successfully'
    });

  } catch (error) {
    return handleApiError(error);
  }
});

// DELETE /api/families/[id] - Delete a family
export const DELETE = withAnyAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid family ID' }, { status: 400 });
    }

    const family = await Family.findById(id);

    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    // Check permission to delete family (only primary parents or admin)
    const isPrimaryParent = family.primaryParents.some(
      parentId => parentId.toString() === user.userId
    );
    const canDelete = isPrimaryParent || user.role === 'admin';

    if (!canDelete) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await Family.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Family deleted successfully'
    });

  } catch (error) {
    return handleApiError(error);
  }
});