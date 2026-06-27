import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { Family, User } from '@/models';
import { addFamilyMemberSchema } from '@/lib/validation/family';
import connectToDatabase from '@/lib/db/mongodb';
import { handleApiError } from '@/lib/utils/error-handler';
import mongoose from 'mongoose';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/families/[id]/members - Get all family members
export const GET = withAnyAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2];

    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid family ID' }, { status: 400 });
    }

    const family = await Family.findById(id)
      .populate('primaryParents', 'name email role')
      .populate('extendedMembers.userId', 'name email role')
      .populate('children', 'name dateOfBirth');

    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    // Check permission to view family members
    const canView = family.canUserAccess(new mongoose.Types.ObjectId(user.userId)) ||
                    user.role === 'admin' || user.role === 'super_admin';

    if (!canView) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Format response with all member types
    const members = {
      primaryParents: family.primaryParents,
      children: family.children,
      extendedMembers: family.extendedMembers.filter(member => member.isActive)
    };

    return NextResponse.json({
      success: true,
      data: { members, familyName: family.familyName }
    });

  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/families/[id]/members - Add a member to the family
export const POST = withAnyAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2];

    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid family ID' }, { status: 400 });
    }

    const body = await request.json();
    
    const validationResult = addFamilyMemberSchema.safeParse(body);
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

    // Check permission to add members
    const isPrimaryParent = family.primaryParents.some(
      parentId => parentId.toString() === user.userId
    );
    const hasManagePermission = family.extendedMembers.some(
      member => member.userId?.toString() === user.userId &&
                member.isActive && 
                member.permissions.includes('manage-family')
    );
    const canAddMembers = isPrimaryParent || hasManagePermission || user.role === 'admin' || user.role === 'super_admin';

    if (!canAddMembers) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const memberData = validationResult.data;

    // If userId is provided, verify the user exists
    if (memberData.userId) {
      const userExists = await User.findById(memberData.userId);
      if (!userExists) {
        return NextResponse.json({ error: 'User not found' }, { status: 400 });
      }

      // Check if user is already a member
      const isAlreadyMember = family.extendedMembers.some(
        member => member.userId?.toString() === memberData.userId
      );
      if (isAlreadyMember) {
        return NextResponse.json({ error: 'User is already a family member' }, { status: 400 });
      }
    }

    // Add the member to the family
    family.addMember({
      userId: memberData.userId ? new mongoose.Types.ObjectId(memberData.userId) : undefined,
      name: memberData.name,
      relationship: memberData.relationship,
      contactInfo: memberData.contactInfo,
      role: memberData.role,
      permissions: memberData.permissions || [],
      isActive: true
    });

    await family.save();

    // Populate the response
    await family.populate('extendedMembers.userId', 'name email');

    return NextResponse.json({
      success: true,
      data: { 
        family: {
          _id: family._id,
          familyName: family.familyName,
          extendedMembers: family.extendedMembers
        }
      },
      message: 'Family member added successfully'
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
});