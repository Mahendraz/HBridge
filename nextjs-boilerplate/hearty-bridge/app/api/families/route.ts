import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { Family, Child, User } from '@/models';
import { createFamilySchema } from '@/lib/validation/family';
import connectToDatabase from '@/lib/db/mongodb';
import { handleApiError } from '@/lib/utils/error-handler';

// GET /api/families - Retrieve families for the authenticated user
export const GET = withAnyAuth(async (request: NextRequest, user: any) => {
  try {

    await connectToDatabase();

    let families;
    
    if (user.role === 'admin') {
      // Admins can see all families
      families = await Family.find({})
        .populate('primaryParents', 'name email')
        .populate('children', 'name dateOfBirth')
        .populate('extendedMembers.userId', 'name email')
        .sort({ createdAt: -1 });
    } else {
      // Regular users can only see families they're part of
      families = await Family.findByMember(user.id);
    }

    return NextResponse.json({
      success: true,
      data: { families }
    });

  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/families - Create a new family
export const POST = withAnyAuth(async (request: NextRequest, user: any) => {
  try {

    await connectToDatabase();

    const body = await request.json();
    
    const validationResult = createFamilySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { familyName, primaryParents, children, settings } = validationResult.data;

    // Verify that the user is one of the primary parents or is an admin
    if (user.role !== 'admin' && !primaryParents.includes(user.id)) {
      return NextResponse.json({ 
        error: 'You can only create families where you are a primary parent' 
      }, { status: 403 });
    }

    // Verify all primary parents exist and are parents
    const parents = await User.find({ 
      _id: { $in: primaryParents }, 
      role: 'parent', 
      isActive: true 
    });
    
    if (parents.length !== primaryParents.length) {
      return NextResponse.json({ 
        error: 'One or more primary parents not found or invalid' 
      }, { status: 400 });
    }

    // If children are provided, verify they exist and belong to one of the primary parents
    if (children && children.length > 0) {
      const childRecords = await Child.find({
        _id: { $in: children },
        parentId: { $in: primaryParents },
        isActive: true
      });
      
      if (childRecords.length !== children.length) {
        return NextResponse.json({ 
          error: 'One or more children not found or do not belong to the primary parents' 
        }, { status: 400 });
      }
    }

    const family = new Family({
      familyName,
      primaryParents,
      children: children || [],
      extendedMembers: [],
      familyTree: [],
      settings: {
        visibility: settings?.visibility || 'private',
        allowMemberInvites: settings?.allowMemberInvites ?? true,
        requireApproval: settings?.requireApproval ?? true,
        sharePhotos: settings?.sharePhotos ?? false,
        shareDocuments: settings?.shareDocuments ?? false
      }
    });

    await family.save();

    // Populate the response
    await family.populate('primaryParents', 'name email');
    await family.populate('children', 'name dateOfBirth');

    return NextResponse.json({
      success: true,
      data: { family },
      message: 'Family created successfully'
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
});