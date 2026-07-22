import { NextRequest } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import Child from '@/models/Child';
import mongoose from 'mongoose';

export const GET = withAnyAuth(
  withErrorHandling(async (_req: NextRequest, user: any) => {
    if (user.role === 'parent') return SuccessResponse.ok({ birthdays: [] });

    await connectToDatabase();

    const query: Record<string, unknown> = { isActive: true };
    if (user.role === 'therapist') {
      query.therapistId = new mongoose.Types.ObjectId(user.userId);
    }

    const children = await Child.find(query)
      .select('name dateOfBirth photoUrl')
      .lean();

    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const thisYear = todayMidnight.getFullYear();

    const birthdays = (children as any[])
      .map((child) => {
        const dob = new Date(child.dateOfBirth);
        const bdayThisYear = new Date(thisYear, dob.getMonth(), dob.getDate());
        const isFutureOrToday = bdayThisYear >= todayMidnight;
        const daysUntil = isFutureOrToday
          ? Math.floor((bdayThisYear.getTime() - todayMidnight.getTime()) / 86400000)
          : Math.floor(
              (new Date(thisYear + 1, dob.getMonth(), dob.getDate()).getTime() - todayMidnight.getTime()) / 86400000
            );
        const turningAge = (isFutureOrToday ? thisYear : thisYear + 1) - dob.getFullYear();
        return {
          childId: child._id.toString(),
          name: child.name as string,
          daysUntilBirthday: daysUntil,
          turningAge,
          photoUrl: (child.photoUrl as string | null) ?? null,
        };
      })
      .filter((c) => c.daysUntilBirthday >= 0 && c.daysUntilBirthday <= 7)
      .sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);

    return SuccessResponse.ok({ birthdays });
  })
);
