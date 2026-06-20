"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileTextIcon } from "lucide-react";

interface SlotInfo {
  patientId: string;
  patientName: string;
  therapistId: string;
  therapistName: string;
  therapyType: string;
  hour: number;
  day: string;
}

interface SessionReportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (reportId: string, sessionDate: string, patientId: string) => void;
  slot: SlotInfo;
  sessionDate: string; // YYYY-MM-DD
}

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];
  return `${d} ${months[m - 1]} ${y}`;
}

const DAY_ID: Record<string, string> = {
  senin: "Senin", selasa: "Selasa", rabu: "Rabu",
  kamis: "Kamis", jumat: "Jumat", sabtu: "Sabtu",
};

export default function SessionReportModal({
  open,
  onClose,
  onSuccess,
  slot,
  sessionDate,
}: SessionReportModalProps) {
  const defaultTitle = `Laporan Sesi — ${slot.patientName} — ${formatDisplayDate(sessionDate)}`;

  const [title, setTitle] = useState(defaultTitle);
  const [therapyType, setTherapyType] = useState(slot.therapyType);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "completed">("completed");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when slot/date changes
  React.useEffect(() => {
    setTitle(`Laporan Sesi — ${slot.patientName} — ${formatDisplayDate(sessionDate)}`);
    setTherapyType(slot.therapyType);
    setDescription("");
    setStatus("completed");
    setError(null);
  }, [slot.patientId, sessionDate]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Judul laporan wajib diisi.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          type: "therapy-notes",
          status,
          childId: slot.patientId,
          childName: slot.patientName,
          therapistId: slot.therapistId,
          therapistName: slot.therapistName,
          therapyType,
          sessionDate,
          sessionHour: slot.hour,
        }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        onSuccess(result.data._id, sessionDate, slot.patientId);
        onClose();
      } else {
        setError(result.error || result.message || "Gagal menyimpan laporan.");
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileTextIcon className="h-5 w-5 text-teal-600" />
            Buat Laporan Sesi
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Session info (readonly) */}
          <div className="rounded-lg bg-teal-50 border border-teal-100 px-4 py-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Pasien</span>
              <span className="font-medium text-gray-800">{slot.patientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tanggal Sesi</span>
              <span className="font-medium text-gray-800">
                {DAY_ID[slot.day]}, {formatDisplayDate(sessionDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Jam</span>
              <span className="font-medium text-gray-800">{slot.hour}:00</span>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Editable fields */}
          <div>
            <label className="text-sm font-medium text-gray-700">Judul Laporan *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
              placeholder="Judul laporan"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Jenis Terapi</label>
            <select
              value={therapyType}
              onChange={(e) => setTherapyType(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Pilih jenis terapi...</option>
              <option value="OT">OT (Terapi Okupasi)</option>
              <option value="TW">TW (Terapi Wicara)</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Catatan / Deskripsi</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              placeholder="Tuliskan catatan sesi terapi di sini..."
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Status</label>
            <div className="flex gap-4 mt-2">
              {(["completed", "draft"] as const).map((s) => (
                <label key={s} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="report-status"
                    checked={status === s}
                    onChange={() => setStatus(s)}
                    className="accent-teal-600"
                  />
                  {s === "completed" ? "Selesai" : "Draft"}
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan Laporan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
