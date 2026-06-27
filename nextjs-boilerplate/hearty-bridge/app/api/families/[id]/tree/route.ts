import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { Family } from '@/models';
import { updateFamilyTreeSchema } from '@/lib/validation/family';
import connectToDatabase from '@/lib/db/mongodb';
import { handleApiError } from '@/lib/utils/error-handler';
import mongoose from 'mongoose';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/families/[id]/tree - Get family tree
export const GET = withAnyAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2];

    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid family ID' }, { status: 400 });
    }

    const family = await Family.findById(id);

    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    // Check permission to view family tree
    const canView = family.canUserAccess(new mongoose.Types.ObjectId(user.userId)) ||
                    user.role === 'admin' || user.role === 'super_admin';

    if (!canView) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        familyTree: family.familyTree,
        familyName: family.familyName
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
});

// PUT /api/families/[id]/tree - Update family tree
export const PUT = withAnyAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2];

    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid family ID' }, { status: 400 });
    }

    const body = await request.json();
    
    const validationResult = updateFamilyTreeSchema.safeParse(body);
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

    // Check permission to update family tree
    const isPrimaryParent = family.primaryParents.some(
      parentId => parentId.toString() === user.userId
    );
    const hasManagePermission = family.extendedMembers.some(
      member => member.userId?.toString() === user.userId &&
                member.isActive && 
                member.permissions.includes('manage-family')
    );
    const canUpdate = isPrimaryParent || hasManagePermission || user.role === 'admin' || user.role === 'super_admin';

    if (!canUpdate) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { familyTree } = validationResult.data;

    // Validate family tree structure
    const memberIds = familyTree.map(node => node.memberId);
    const uniqueIds = new Set(memberIds);
    
    if (memberIds.length !== uniqueIds.size) {
      return NextResponse.json({ 
        error: 'Family tree cannot contain duplicate members' 
      }, { status: 400 });
    }

    // Validate parent-child relationships
    for (const node of familyTree) {
      for (const parentId of node.parentIds) {
        if (!memberIds.includes(parentId)) {
          return NextResponse.json({ 
            error: `Invalid parent reference: ${parentId} not found in family tree` 
          }, { status: 400 });
        }
      }
    }

    // Update the family tree
    family.familyTree = familyTree;
    await family.save();

    return NextResponse.json({
      success: true,
      data: { familyTree: family.familyTree },
      message: 'Family tree updated successfully'
    });

  } catch (error) {
    return handleApiError(error);
  }
});