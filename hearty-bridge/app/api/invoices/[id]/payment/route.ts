import { NextRequest } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import Invoice from '@/models/Invoice';
import mongoose from 'mongoose';
import { uploadToR2, getR2SignedUrl } from '@/lib/services/r2-storage';

function getInvoiceId(req: NextRequest): string {
  const parts = new URL(req.url).pathname.split('/');
  const idx = parts.indexOf('invoices');
  return idx >= 0 && parts[idx + 1] ? parts[idx + 1] : '';
}

/**
 * POST /api/invoices/[id]/payment
 * Parent only: submit payment proof image/PDF + optional message.
 */
export const POST = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    if (user.role !== 'parent') return ErrorResponse.forbidden();

    const id = getInvoiceId(req);
    if (!id || !mongoose.isValidObjectId(id)) {
      return ErrorResponse.badRequest('Invalid invoice ID');
    }

    await connectToDatabase();

    const invoice = await Invoice.findById(id).lean();
    if (!invoice) return ErrorResponse.notFound('Invoice');
    if ((invoice as any).parentId?.toString() !== user.userId) return ErrorResponse.forbidden();
    if ((invoice as any).status === 'paid') return ErrorResponse.badRequest('Invoice sudah lunas');

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const message = ((formData.get('message') as string | null) ?? '').trim();

    if (!file || !file.size) return ErrorResponse.badRequest('File bukti pembayaran diperlukan');

    const ALLOWED = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
    if (!ALLOWED.includes(file.type)) {
      return ErrorResponse.badRequest('Hanya JPG, PNG, WebP, atau PDF yang diizinkan');
    }

    if (file.size > 5 * 1024 * 1024) {
      return ErrorResponse.badRequest('Ukuran file maksimal 5MB');
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
    const key = `invoices/${id}/payment-proof-${Date.now()}.${ext}`;

    const uploadedKey = await uploadToR2(buffer, key, file.type);
    if (!uploadedKey) return ErrorResponse.internalServerError('Gagal mengupload file');

    const db = mongoose.connection.db;
    if (!db) return ErrorResponse.internalServerError('Database not connected');

    await db.collection('invoices').updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: { paymentProofKey: uploadedKey, paymentMessage: message, paymentSubmittedAt: new Date() } }
    );

    return SuccessResponse.ok({ message: 'Bukti pembayaran berhasil dikirim' });
  })
);

/**
 * GET /api/invoices/[id]/payment
 * Admin/therapist or matching parent: returns a 1-hour signed URL for the proof file.
 */
export const GET = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    const id = getInvoiceId(req);
    if (!id || !mongoose.isValidObjectId(id)) return ErrorResponse.badRequest('Invalid invoice ID');

    await connectToDatabase();

    const invoice = await Invoice.findById(id).lean();
    if (!invoice) return ErrorResponse.notFound('Invoice');

    if (user.role === 'parent') {
      if ((invoice as any).parentId?.toString() !== user.userId) return ErrorResponse.forbidden();
    } else if (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'therapist') {
      return ErrorResponse.forbidden();
    }

    if (!(invoice as any).paymentProofKey) {
      return ErrorResponse.notFound('Bukti pembayaran belum diunggah');
    }

    const url = await getR2SignedUrl((invoice as any).paymentProofKey, 3600);
    if (!url) return ErrorResponse.internalServerError('Gagal mendapatkan URL');

    return SuccessResponse.ok({ url, message: (invoice as any).paymentMessage ?? '' });
  })
);
