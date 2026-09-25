"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ReceiptIcon, CalendarIcon } from "lucide-react";

export interface UnpaidInvoiceSummary {
  id: string;
  invoiceNumber: string;
  childName: string;
  packageType: string;
  amount: number;
  dueDate: string;
  status: "unpaid" | "overdue";
}

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Pop-up of the parent's unpaid invoices (ORT-7). Opens every time the
 * dashboard is opened while something is still unpaid; closing it only hides
 * it until the next visit. Paid ones live under Invoice → Riwayat.
 */
export function UnpaidInvoicePopup({ invoices }: { invoices: UnpaidInvoiceSummary[] }) {
  const [open, setOpen] = useState(true);
  if (invoices.length === 0) return null;

  const total = invoices.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ReceiptIcon className="h-5 w-5 text-amber-600" />
            {invoices.length} invoice belum lunas
          </DialogTitle>
          <DialogDescription>
            Total tagihan {formatRupiah(total)}. Silakan lakukan pembayaran dan unggah bukti transfer di halaman invoice.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {invoices.map((inv) => (
            <div key={inv.id} className="rounded-lg border border-gray-200 px-3 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{inv.childName}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {inv.packageType} · <span className="font-mono">{inv.invoiceNumber}</span>
                  </p>
                </div>
                <p className="text-sm font-bold text-teal-700 shrink-0">{formatRupiah(inv.amount)}</p>
              </div>
              <p className={`text-xs mt-1 flex items-center gap-1 ${inv.status === "overdue" ? "text-red-600 font-medium" : "text-gray-500"}`}>
                <CalendarIcon className="h-3 w-3 flex-shrink-0" />
                {inv.status === "overdue" ? "Lewat jatuh tempo" : "Jatuh tempo"} {formatDate(inv.dueDate)}
              </p>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Tutup
          </Button>
          <Link href="/dashboard/invoices" className="w-full sm:w-auto">
            <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white">Lihat &amp; Bayar</Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
