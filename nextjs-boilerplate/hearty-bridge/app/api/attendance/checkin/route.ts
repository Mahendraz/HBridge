import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import Attendance from '@/models/Attendance';
import mongoose from 'mongoose';

/** Haversine formula — returns distance in metres between two GPS points */
function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6_371_000; // Earth's mean radius in metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Convert a UTC Date to WIB (UTC+7) wall-clock string */
function toWIBISOString(utcDate: Date): string {
  const wib = new Date(utcDate.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString(); // treat as if it's already "local"
}

/**
 * POST /api/attendance/checkin
 * Body: { lat: number, lng: number }
 */
export const POST = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    // Only admin and therapist may check-in
    if (user.role === 'parent') {
      return ErrorResponse.forbidden('Orang tua tidak perlu absen');
    }

    const body = await req.json();
    const { lat, lng } = body as { lat: unknown; lng: unknown };

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return ErrorResponse.badRequest('lat dan lng harus berupa angka');
    }

    // --- Office coordinates from env ---
    const officeLat = parseFloat(process.env.OFFICE_LATITUDE ?? '');
    const officeLng = parseFloat(process.env.OFFICE_LONGITUDE ?? '');
    const officeRadius = parseFloat(process.env.OFFICE_RADIUS_METERS ?? '100');

    if (isNaN(officeLat) || isNaN(officeLng)) {
      console.error('[attendance/checkin] OFFICE_LATITUDE / OFFICE_LONGITUDE not set in .env');
      return ErrorResponse.badRequest(
        'Koordinat kantor belum dikonfigurasi. Hubungi administrator.'
      );
    }

    // --- Determine WIB date and time ---
    const nowUTC = new Date();
    const wibISOString = toWIBISOString(nowUTC);
    const dateStr = wibISOString.split('T')[0]; // 'YYYY-MM-DD'

    // WIB hour and minute for on-time check (≤ 09:00)
    const wibDate = new Date(nowUTC.getTime() + 7 * 60 * 60 * 1000);
    const wibHour = wibDate.getUTCHours();
    const wibMinute = wibDate.getUTCMinutes();
    const isOnTime = wibHour < 9 || (wibHour === 9 && wibMinute === 0);
    const status: 'on-time' | 'late' = isOnTime ? 'on-time' : 'late';

    // --- Distance check ---
    const distanceMeters = haversineMeters(lat, lng, officeLat, officeLng);
    const isWithinLocation = distanceMeters <= officeRadius;

    await connectToDatabase();

    // Check duplicate
    const existing = await Attendance.findOne({
      userId: new mongoose.Types.ObjectId(user.userId),
      date: dateStr,
    });
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Anda sudah melakukan check-in hari ini',
          data: {
            status: existing.status,
            checkInAt: existing.checkInAt,
          },
        },
        { status: 409 }
      );
    }

    const record = await Attendance.create({
      userId:          new mongoose.Types.ObjectId(user.userId),
      userName:        user.name || '',
      userRole:        user.role as 'admin' | 'therapist',
      date:            dateStr,
      checkInAt:       nowUTC,
      checkInLocation: { lat, lng },
      isWithinLocation,
      status,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          status,
          isWithinLocation,
          distanceMeters: Math.round(distanceMeters),
          checkInAt: record.checkInAt,
          date: dateStr,
        },
      },
      { status: 201 }
    );
  })
);
