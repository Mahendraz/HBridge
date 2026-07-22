import { NextRequest } from 'next/server';
import { ErrorResponse } from '@/lib/utils/error-handler';

// Public self-registration is disabled.
// Accounts are created by admins via POST /api/admin/users.
export async function POST() {
  return ErrorResponse.forbidden(
    'Self-registration is disabled. Please contact an administrator to create an account.'
  );
}

export async function GET() {
  return ErrorResponse.methodNotAllowed(['POST']);
}

export async function PUT() {
  return ErrorResponse.methodNotAllowed(['POST']);
}

export async function DELETE() {
  return ErrorResponse.methodNotAllowed(['POST']);
}
