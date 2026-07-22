import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/models/User';
import { withAnyAuth } from '@/lib/middleware/auth';
import { profileUpdateSchema } from '@/lib/validation/auth';
import { 
  withErrorHandling, 
  ErrorResponse, 
  SuccessResponse, 
  handleValidationError, 
  logRequest,
  ErrorCodes
} from '@/lib/utils/error-handler';

export const GET = withAnyAuth(withErrorHandling(async (request: NextRequest, currentUser) => {
  // Log the request
  logRequest('GET', '/api/auth/me', {
    id: currentUser.userId,
    email: currentUser.email,
    role: currentUser.role
  });

  // Connect to database
  await connectToDatabase();

  // Find user in database to get the latest information
  const user = await User.findById(currentUser.userId).select('-password');
  
  if (!user) {
    return ErrorResponse.notFound("User not found", ErrorCodes.USER_NOT_FOUND);
  }

  // Check if user is still active
  if (!user.isActive) {
    return ErrorResponse.unauthorized("User account has been deactivated", ErrorCodes.ACCOUNT_DEACTIVATED);
  }

  // Return user profile
  return SuccessResponse.ok({
    user: user.toSafeObject()
  });
}));

// PUT route for updating user profile
export const PUT = withAnyAuth(withErrorHandling(async (request: NextRequest, currentUser) => {
  // Log the request
  logRequest('PUT', '/api/auth/me', {
    id: currentUser.userId,
    email: currentUser.email,
    role: currentUser.role
  });

  // Connect to database
  await connectToDatabase();

  // Parse and validate request body
  const body = await request.json();
  
  const validationResult = profileUpdateSchema.safeParse(body);
  if (!validationResult.success) {
    return handleValidationError(validationResult.error);
  }

  const validatedData = validationResult.data;

  // Find user to get current data
  const user = await User.findById(currentUser.userId);
  if (!user) {
    return ErrorResponse.notFound("User not found", ErrorCodes.USER_NOT_FOUND);
  }

  // Prepare updates object
  const updates: any = {};
  
  if (validatedData.name) {
    updates.name = validatedData.name.trim();
  }

  if (validatedData.phone !== undefined) {
    updates.phone = validatedData.phone?.trim();
  }

  if (validatedData.avatar !== undefined) {
    updates.avatar = validatedData.avatar?.trim();
  }

  // Handle profile updates for therapists
  if (user.role === 'therapist' && validatedData.profile) {
    const profileUpdates: any = {};
    
    if (validatedData.profile.specialization !== undefined) {
      profileUpdates.specialization = validatedData.profile.specialization?.trim();
    }

    if (validatedData.profile.clinic !== undefined) {
      profileUpdates.clinic = validatedData.profile.clinic?.trim();
    }

    if (validatedData.profile.experience !== undefined) {
      profileUpdates.experience = validatedData.profile.experience;
    }

    if (Object.keys(profileUpdates).length > 0) {
      updates.profile = { ...user.profile, ...profileUpdates };
    }
  }

  // Update user
  const updatedUser = await User.findByIdAndUpdate(
    currentUser.userId,
    { $set: updates },
    { 
      new: true, 
      runValidators: true,
      select: '-password'
    }
  );

  if (!updatedUser) {
    return ErrorResponse.internalServerError("Failed to update user profile");
  }

  return SuccessResponse.ok({
    user: updatedUser.toSafeObject()
  }, "Profile updated successfully");
}));

// Handle unsupported methods
export async function POST() {
  return ErrorResponse.methodNotAllowed(['GET', 'PUT']);
}

export async function DELETE() {
  return ErrorResponse.methodNotAllowed(['GET', 'PUT']);
}