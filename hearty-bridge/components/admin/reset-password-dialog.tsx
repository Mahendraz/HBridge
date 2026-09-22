"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  KeyRoundIcon,
  ShuffleIcon,
  CopyIcon,
  CheckIcon,
  AlertCircleIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";

export interface ResetPasswordTarget {
  _id: string;
  name: string;
  email: string;
}

interface ResetPasswordDialogProps {
  /** User yang mau direset. `null` = dialog tertutup. */
  target: ResetPasswordTarget | null;
  onClose: () => void;
}

/**
 * Isi dialog reset password. Dipisah dari wrapper-nya supaya bisa di-remount
 * lewat `key={target._id}` — dengan begitu seluruh state (termasuk password
 * sementara yang sudah terbit) otomatis bersih tiap kali dialog dibuka untuk
 * user yang berbeda, tanpa perlu effect yang nyetel ulang state satu per satu.
 */
function ResetPasswordBody({ target, onClose }: { target: ResetPasswordTarget; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forceChange, setForceChange] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    if (password && password.length < 8) {
      setError("Password minimal 8 karakter, atau kosongkan untuk digenerate otomatis.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/users/${target._id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          newPassword: password.trim() || undefined,
          mustChangePassword: forceChange,
        }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setIssued(result.data?.tempPassword ?? result.tempPassword ?? password);
      } else {
        setError(result.error || result.message || "Gagal mereset password.");
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!issued) return;
    try {
      await navigator.clipboard.writeText(issued);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Gagal menyalin. Salin manual dari kotak di atas.");
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <KeyRoundIcon className="h-5 w-5 text-teal-600" />
          Reset Password
        </DialogTitle>
        <DialogDescription>
          {issued
            ? `Password baru untuk ${target.name} sudah aktif.`
            : `Atur password sementara untuk ${target.name}${target.email ? ` (${target.email})` : ""}.`}
        </DialogDescription>
      </DialogHeader>

      {issued ? (
        <div className="space-y-4 py-2">
          <div>
            <p className="text-sm text-gray-600 mb-1.5">
              Password sementara — catat sekarang, tidak bisa dilihat lagi setelah dialog ini ditutup.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-base bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 break-all">
                {issued}
              </code>
              <Button variant="outline" size="sm" onClick={handleCopy} title="Salin">
                {copied ? (
                  <CheckIcon className="h-4 w-4 text-green-600" />
                ) : (
                  <CopyIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            {forceChange
              ? "User akan diminta membuat password baru saat login berikutnya."
              : "User bisa langsung login dengan password ini tanpa diminta menggantinya."}
          </p>
          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircleIcon className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 py-2">
          <Input
            label="Password baru"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Kosongkan untuk generate otomatis"
            helperText="Minimal 8 karakter."
            autoComplete="new-password"
          />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setPassword("");
                setShowPassword(false);
              }}
            >
              <ShuffleIcon className="h-4 w-4 mr-1.5" />
              Generate otomatis
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPassword((v) => !v)}
              disabled={!password}
            >
              {showPassword ? (
                <EyeOffIcon className="h-4 w-4 mr-1.5" />
              ) : (
                <EyeIcon className="h-4 w-4 mr-1.5" />
              )}
              {showPassword ? "Sembunyikan" : "Lihat"}
            </Button>
          </div>

          <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={forceChange}
              onChange={(e) => setForceChange(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span>
              Wajib ganti password saat login berikutnya
              <span className="block text-xs text-gray-500">
                Disarankan tetap aktif supaya admin tidak menyimpan password user.
              </span>
            </span>
          </label>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircleIcon className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      <DialogFooter>
        {issued ? (
          <Button onClick={onClose}>Selesai</Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Mereset..." : "Reset Password"}
            </Button>
          </>
        )}
      </DialogFooter>
    </>
  );
}

/**
 * Dialog reset password untuk admin & super admin.
 *
 * Admin boleh mengetik password sementara sendiri atau mengosongkannya supaya
 * server yang generate. Password hasilnya cuma ditampilkan sekali di sini —
 * begitu dialog ditutup, yang tersisa di database hanya hash-nya.
 */
export function ResetPasswordDialog({ target, onClose }: ResetPasswordDialogProps) {
  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="sm">
        {target && <ResetPasswordBody key={target._id} target={target} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

export default ResetPasswordDialog;
