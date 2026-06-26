import { NextResponse } from 'next/server';

const disabled = () => NextResponse.json({ success: false, error: 'Fitur pesan telah dinonaktifkan' }, { status: 410 });

export const GET  = disabled;
export const POST = disabled;
