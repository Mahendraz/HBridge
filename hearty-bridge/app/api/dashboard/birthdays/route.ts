import { NextRequest } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import Child from '@/models/Child';
import User from '@/models/User';
import mongoose from 'mongoose';

// Therapist birthday reminder window: H-3 up to and including the day itself.
const THERAPIST_REMINDER_DAYS = 3;

/**
 * Days from today (local midnight) until the next occurrence of a birth date
 * stored as UTC midnight. A Feb 29 birthday falls on Feb 28 in non-leap years.
 */
function nextBirthday(dob: Date, todayMidnight: Date): { daysUntil: number; turningAge: number } {
  const month = dob.getUTCMonth();
  const day = dob.getUTCDate();
  const occurrence = (year: number) => {
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return month === 1 && day === 29 && !isLeap ? new Date(year, 1, 28) : new Date(year, month, day);
  };
  const thisYear = todayMidnight.getFullYear();
  let target = occurrence(thisYear);
  let year = thisYear;
  if (target < todayMidnight) {
    year = thisYear + 1;
    target = occurrence(year);
  }
  return {
    daysUntil: Math.round((target.getTime() - todayMidnight.getTime()) / 86400000),
    turningAge: year - dob.getUTCFullYear(),
  };
}

export const GET = withAnyAuth(
  withErrorHandling(async (_req: NextRequest, user: any) => {
    if (user.role === 'parent') return SuccessResponse.ok({ birthdays: [], therapistBirthdays: [] });

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

    // Therapist birthdays — super_admin only. Enforced here, not just in the UI,
    // so a therapist can never receive a reminder about their own birthday.
    let therapistBirthdays: {
      therapistId: string;
      name: string;
      daysUntilBirthday: number;
      turningAge: number;
    }[] = [];
    if (user.role === 'super_admin') {
      const therapists = await User.find({
        role: 'therapist',
        isActive: true,
        'profile.dateOfBirth': { $ne: null },
      })
        .select('name profile.dateOfBirth')
        .lean<{ _id: mongoose.Types.ObjectId; name: string; profile: { dateOfBirth: Date } }[]>();

      therapistBirthdays = therapists
        .map((t) => {
          const { daysUntil, turningAge } = nextBirthday(new Date(t.profile.dateOfBirth), todayMidnight);
          return {
            therapistId: t._id.toString(),
            name: t.name,
            daysUntilBirthday: daysUntil,
            turningAge,
          };
        })
        .filter((t) => t.daysUntilBirthday >= 0 && t.daysUntilBirthday <= THERAPIST_REMINDER_DAYS)
        .sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);
    }

    return SuccessResponse.ok({ birthdays, therapistBirthdays });
  })
);
