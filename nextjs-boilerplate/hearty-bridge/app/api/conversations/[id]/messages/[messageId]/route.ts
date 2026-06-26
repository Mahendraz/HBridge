import { NextResponse } from 'next/server';

const disabled = () => NextResponse.json({ success: false, error: 'Fitur pesan telah dinonaktifkan' }, { status: 410 });

export const GET    = disabled;
export const PUT    = disabled;
export const DELETE = disabled;
