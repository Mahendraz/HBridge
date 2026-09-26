import {
  UserCogIcon,
  LogInIcon,
  BabyIcon,
  CalendarIcon,
  UserCheckIcon,
  ClipboardCheckIcon,
  FileTextIcon,
  ClipboardListIcon,
  ReceiptIcon,
  PlaneIcon,
  MegaphoneIcon,
  UserXIcon,
  type LucideIcon,
} from "lucide-react";
import type { AuditCategory } from "@/lib/audit-log-categories";

/** Ikon & warna per kategori log, dipakai widget dashboard dan halaman Log Aktivitas. */
export const CATEGORY_META: Record<AuditCategory, { icon: LucideIcon; className: string }> = {
  account:          { icon: UserCogIcon,        className: "bg-blue-50 text-blue-600" },
  auth:             { icon: LogInIcon,          className: "bg-slate-100 text-slate-600" },
  child:            { icon: BabyIcon,           className: "bg-pink-50 text-pink-600" },
  schedule:         { icon: CalendarIcon,       className: "bg-indigo-50 text-indigo-600" },
  child_attendance: { icon: UserCheckIcon,      className: "bg-teal-50 text-teal-600" },
  staff_attendance: { icon: ClipboardCheckIcon, className: "bg-cyan-50 text-cyan-600" },
  report:           { icon: FileTextIcon,       className: "bg-green-50 text-green-600" },
  assessment:       { icon: ClipboardListIcon,  className: "bg-violet-50 text-violet-600" },
  finance:          { icon: ReceiptIcon,        className: "bg-emerald-50 text-emerald-600" },
  leave:            { icon: PlaneIcon,          className: "bg-amber-50 text-amber-600" },
  announcement:     { icon: MegaphoneIcon,      className: "bg-orange-50 text-orange-600" },
  deletion:         { icon: UserXIcon,          className: "bg-red-50 text-red-600" },
};

export function CategoryIcon({ category, className = "" }: { category: AuditCategory; className?: string }) {
  const meta = CATEGORY_META[category] ?? CATEGORY_META.account;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${meta.className} ${className}`}>
      <Icon className="h-4 w-4" />
    </span>
  );
}

export function formatLogTime(value: string) {
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}
