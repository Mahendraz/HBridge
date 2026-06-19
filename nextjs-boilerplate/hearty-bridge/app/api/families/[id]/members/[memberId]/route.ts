import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { Family } from '@/models';
import { updateFamilyMemberSchema } from '@/lib/validation/family';
import connectToDatabase from '@/lib/db/mongodb';
import { handleApiError } from '@/lib/utils/error-handler';
import mongoose from 'mongoose';

interface RouteParams {
  params: {
    id: string;
    memberId: string;
  };
}

// GET /api/families/[id]/members/[memberId] - Get a specific family member
export const GET = withAnyAuth(async (request: NextRequest, user: any) => {
  try {

    await connectToDatabase();

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 3];
    const memberId = pathParts[pathParts.length - 1];

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(memberId)) {
      return NextResponse.json({ error: 'Invalid family or member ID' }, { status: 400 });
    }

    const family = await Family.findById(id)
      .populate('extendedMembers.userId', 'name email role');

    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    // Check permission to view family
    const canView = family.canUserAccess(new mongoose.Types.ObjectId(user.id)) || 
                    user.role === 'admin';

    if (!canView) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const member = family.extendedMembers.find(
      member => member._id?.toString() === memberId
    );

    if (!member) {
      return NextResponse.json({ error: 'Family member not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { member }
    });

  } catch (error) {
    return handleApiError(error);
  }
});

// PUT /api/families/[id]/members/[memberId] - Update a family member
export const PUT = withAnyAuth(async (request: NextRequest, user: any) => {
  try {

    await connectToDatabase();

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 3];
    const memberId = pathParts[pathParts.length - 1];

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(memberId)) {
      return NextResponse.json({ error: 'Invalid family or member ID' }, { status: 400 });
    }

    const body = await request.json();
    
    const validationResult = updateFamilyMemberSchema.safeParse(body);
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

    // Check permission to update family members
    const isPrimaryParent = family.primaryParents.some(
      parentId => parentId.toString() === user.id
    );
    const hasManagePermission = family.extendedMembers.some(
      member => member.userId?.toString() === user.id && 
                member.isActive && 
                member.permissions.includes('manage-family')
    );
    const canUpdate = isPrimaryParent || hasManagePermission || user.role === 'admin';

    if (!canUpdate) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const member = family.extendedMembers.find(
      member => member._id?.toString() === memberId
    );

    if (!member) {
      return NextResponse.json({ error: 'Family member not found' }, { status: 404 });
    }

    const updateData = validationResult.data;

    // Update member properties
    if (updateData.name !== undefined) member.name = updateData.name;
    if (updateData.relationship !== undefined) member.relationship = updateData.relationship;
    if (updateData.contactInfo !== undefined) {
      member.contactInfo = member.contactInfo || {};
      Object.assign(member.contactInfo, updateData.contactInfo);
    }
    if (updateData.role !== undefined) member.role = updateData.role;
    if (updateData.permissions !== undefined) member.permissions = updateData.permissions;
    if (updateData.isActive !== undefined) member.isActive = updateData.isActive;

    await family.save();

    // Populate the response
    await family.populate('extendedMembers.userId', 'name email');

    const updatedMember = family.extendedMembers.find(
      member => member._id?.toString() === memberId
    );

    return NextResponse.json({
      success: true,
      data: { member: updatedMember },
      message: 'Family member updated successfully'
    });

  } catch (error) {
    return handleApiError(error);
  }
});

// DELETE /api/families/[id]/members/[memberId] - Remove a family member
export const DELETE = withAnyAuth(async (request: NextRequest, user: any) => {
  try {

    await connectToDatabase();

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 3];
    const memberId = pathParts[pathParts.length - 1];

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(memberId)) {
      return NextResponse.json({ error: 'Invalid family or member ID' }, { status: 400 });
    }

    const family = await Family.findById(id);

    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    // Check permission to remove family members
    const isPrimaryParent = family.primaryParents.some(
      parentId => parentId.toString() === user.id
    );
    const hasManagePermission = family.extendedMembers.some(
      member => member.userId?.toString() === user.id && 
                member.isActive && 
                member.permissions.includes('manage-family')
    );
    const canRemove = isPrimaryParent || hasManagePermission || user.role === 'admin';

    if (!canRemove) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const memberExists = family.extendedMembers.some(
      member => member._id?.toString() === memberId
    );

    if (!memberExists) {
      return NextResponse.json({ error: 'Family member not found' }, { status: 404 });
    }

    // Remove the member
    family.removeMember(memberId);
    await family.save();

    return NextResponse.json({
      success: true,
      message: 'Family member removed successfully'
    });

  } catch (error) {
    return handleApiError(error);
  }
});