"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading";
import { useAuth } from "@/lib/contexts/auth-context";
import {
  UsersIcon,
  CalendarIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserCheckIcon,
  FileTextIcon,
  HeartIcon,
  BarChart3Icon,
  DollarSignIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  UserPlusIcon,
  ReceiptIcon,
  CakeIcon,
} from "lucide-react";
import Link from "next/link";
import { BorderBeam } from "@/components/magicui/border-beam";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { usePermissions } from "@/lib/utils/permissions";
import type { UserRole } from "@/lib/types/auth";
import { AnnouncementWall } from "@/components/dashboard/announcement-wall";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TodaySlot {
  patientName: string;
  therapyType: string;
  hour: number;
  sessionNumber?: number;
  totalSessions: number;
  // admin/super_admin only (undefined for therapist):
  parentPhone?: string;
  therapistName?: string;
}

interface ScheduleSlot {
  patientName: string;
  therapyType: string;
  hour: number;
  sessionNumber?: number;
  totalSessions: number;
  therapistName?: string; // present in admin/super_admin weekly view
}

interface ActivityItem {
  id: string;
  type: "session_completed" | "report_created" | "user_registered" | "invoice_paid";
  title: string;
  description: string;
  actor: string;
  timestamp: string;
}

interface ChildInfo {
  childId: string;
  childName: string;
}

interface WeeklyReport {
  id: string;
  childName: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
}

interface UpcomingScheduleItem {
  childName: string;
  day: string;
  date: string;
  hour: number;
  therapistName: string;
  therapyType: string;
  sessionNumber: number;
  totalSessions: number;
}

interface BirthdayItem {
  childId: string;
  name: string;
  daysUntilBirthday: number;
  turningAge: number;
  photoUrl: string | null;
}

interface DashboardData {
  role: string;
  // admin / super_admin
  activePatients?: number;
  therapyToday?: { completed: number; scheduled: number };
  therapyThisWeek?: { completed: number; planned: number };
  todaySchedule?: TodaySlot[];
  financialSummary?: { totalRevenue: number; pendingInvoices: number };
  recentActivity?: ActivityItem[];
  // therapist (reuses todaySchedule — parentPhone/therapistName will be undefined)
  sessionToday?: { completed: number; planned: number };
  sessionThisWeek?: { completed: number; planned: number };
  weeklySchedule?: Record<string, ScheduleSlot[]>;
  missingReports?: Array<{
    childId: string;
    childName: string;
    therapyType: string;
    day: string;
    slotDate: string;
    hour: number;
    sessionNumber: number;
    totalSessions: number;
  }>;
  // parent
  children?: ChildInfo[];
  weeklyReports?: WeeklyReport[];
  upcomingSchedule?: UpcomingScheduleItem[];
  unseenInvoiceCount?: number;
  sessionBalances?: Array<{ childId: string; childName: string; remaining: number }>;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DAY_ORDER = ["senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
const DAY_LABELS: Record<string, string> = {
  senin: "Senin", selasa: "Selasa", rabu: "Rabu",
  kamis: "Kamis", jumat: "Jumat", sabtu: "Sabtu",
};

function slotTime(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(amount);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function UnifiedDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [birthdays, setBirthdays] = useState<BirthdayItem[]>([]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
      if (user.role !== "parent") loadBirthdays();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token");

      const res = await fetch("/api/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("dashboard/stats failed");
      const json = await res.json();
      setData(json.data ?? null);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBirthdays = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("/api/dashboard/birthdays", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const json = await res.json();
      setBirthdays(json.birthdays ?? []);
    } catch {
      // silent fail — birthday widget is non-critical
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const role = user?.role ?? "parent";

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="relative rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <BorderBeam size={150} duration={6} colorFrom="#14b8a6" colorTo="#22c55e" />
        <div className="p-6 flex items-center space-x-4">
          <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
            <HeartIcon className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <h1 className={role === "parent" ? "text-2xl md:text-3xl font-bold text-gray-900" : "text-xl font-bold text-gray-900"}>
              {role === "parent" ? "Halo Parent!" : `Selamat datang kembali, ${user?.name?.split(" ")[0]}!`}
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {role === "admin" && "Kelola sistem praktik terapi Anda"}
              {role === "super_admin" && "Pantau keseluruhan sistem dan keuangan"}
              {role === "therapist" && `${data?.sessionToday?.planned ?? 0} sesi terjadwal hari ini`}
              {role === "parent" && `${data?.children?.length ?? 0} anak terdaftar`}
            </p>
          </div>
        </div>
      </div>

      {/* Announcement Wall — shared by all four roles, so it belongs above
          the role-forking content below, not inside any one role's section. */}
      <AnnouncementWall />

      {/* Birthday Reminders */}
      {(role === "admin" || role === "super_admin" || role === "therapist") && birthdays.length > 0 && (
        <BirthdayReminderWidget birthdays={birthdays} />
      )}

      {/* Stats Cards */}
      {(role === "admin" || role === "super_admin") && data && (
        <AdminStatsCards data={data} role={role} />
      )}
      {role === "therapist" && data && (
        <TherapistStatsCards data={data} />
      )}
      {/* parent: no stats */}

      {/* Main Content */}
      {(role === "admin" || role === "super_admin") && data && (
        <AdminMainContent data={data} role={role} />
      )}
      {role === "therapist" && data && (
        <TherapistMainContent data={data} />
      )}
      {role === "parent" && data && (
        <ParentMainContent data={data} />
      )}
    </div>
  );
}

// ── Birthday Reminder Widget ──────────────────────────────────────────────────

function BirthdayReminderWidget({ birthdays }: { birthdays: BirthdayItem[] }) {
  return (
    <div className="relative rounded-2xl border border-rose-200 bg-rose-50 shadow-sm overflow-hidden">
      <BorderBeam size={120} duration={8} colorFrom="#f43f5e" colorTo="#fb923c" />
      <div className="p-4 flex items-center gap-3 border-b border-rose-100">
        <div className="h-9 w-9 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
          <CakeIcon className="h-5 w-5 text-rose-500" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-rose-900">Ulang Tahun Mendatang</h2>
          <p className="text-xs text-rose-600">{birthdays.length} pasien dalam 7 hari ke depan</p>
        </div>
      </div>
      <div className="p-4">
        <div className="flex flex-wrap gap-2">
          {birthdays.map((b) => (
            <BirthdayCard key={b.childId} item={b} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BirthdayCard({ item }: { item: BirthdayItem }) {
  const label =
    item.daysUntilBirthday === 0
      ? "Hari ini! 🎉"
      : item.daysUntilBirthday === 1
      ? "Besok"
      : `${item.daysUntilBirthday} hari lagi`;

  const isToday = item.daysUntilBirthday === 0;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
        isToday
          ? "bg-rose-100 border-rose-300 shadow-sm"
          : "bg-white border-rose-100"
      }`}
    >
      {/* Avatar */}
      <div className="relative w-9 h-9 rounded-full overflow-hidden bg-rose-200 flex items-center justify-center flex-shrink-0">
        {item.photoUrl ? (
          <img src={item.photoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-bold text-rose-600">{item.name.charAt(0).toUpperCase()}</span>
        )}
      </div>
      {/* Info */}
      <div className="min-w-0">
        <p className={`text-sm font-semibold truncate ${isToday ? "text-rose-900" : "text-gray-900"}`}>
          {item.name}
        </p>
        <p className={`text-xs ${isToday ? "text-rose-700 font-medium" : "text-rose-500"}`}>
          {label} · Ulang tahun ke-{item.turningAge}
        </p>
      </div>
    </div>
  );
}

// ── Admin Stats Cards ─────────────────────────────────────────────────────────

function AdminStatsCards({ data, role }: { data: DashboardData; role: string }) {
  const permissions = usePermissions(role as UserRole);
  const cards = [
    {
      title: "Pasien Aktif",
      value: data.activePatients ?? 0,
      isNumeric: true,
      icon: UsersIcon,
      colorClass: "text-teal-400",
      bgClass: "bg-teal-500/10",
      sub: "Terdaftar di sistem",
    },
    {
      title: "Terapi Hari Ini",
      value: `${data.therapyToday?.completed ?? 0} / ${data.therapyToday?.scheduled ?? 0}`,
      isNumeric: false,
      icon: CalendarIcon,
      colorClass: "text-green-400",
      bgClass: "bg-green-500/10",
      sub: "terlaksana / terjadwal",
    },
    {
      title: "Terapi Minggu Ini",
      value: `${data.therapyThisWeek?.completed ?? 0} / ${data.therapyThisWeek?.planned ?? 0}`,
      isNumeric: false,
      icon: BarChart3Icon,
      colorClass: "text-purple-400",
      bgClass: "bg-purple-500/10",
      sub: "terlaksana / terencana",
    },
    ...(permissions.hasPermission("financial:view_all") && data.financialSummary
      ? [
          {
            title: "Total Pendapatan",
            value: formatRupiah(data.financialSummary.totalRevenue),
            isNumeric: false,
            icon: DollarSignIcon,
            colorClass: "text-emerald-400",
            bgClass: "bg-emerald-500/10",
            sub: "Invoice lunas",
          },
          {
            title: "Tagihan Pending",
            value: data.financialSummary.pendingInvoices,
            isNumeric: true,
            icon: AlertCircleIcon,
            colorClass: "text-orange-400",
            bgClass: "bg-orange-500/10",
            sub: "Belum dibayar",
          },
        ]
      : []),
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div key={i} className="relative rounded-xl border border-gray-200 bg-white p-5 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <BorderBeam size={100} duration={8 + i} colorFrom="#14b8a6" colorTo="#22c55e" />
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 truncate">{card.title}</p>
                <div className="mt-1">
                  {card.isNumeric && typeof card.value === "number" ? (
                    <NumberTicker value={card.value} className="text-2xl font-bold text-gray-900" />
                  ) : (
                    <p className="text-lg font-bold text-gray-900 truncate">{card.value}</p>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
              </div>
              <div className={`h-10 w-10 rounded-xl ${card.bgClass} flex items-center justify-center flex-shrink-0 ml-3`}>
                <Icon className={`h-5 w-5 ${card.colorClass}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Therapist Stats Cards ─────────────────────────────────────────────────────

function TherapistStatsCards({ data }: { data: DashboardData }) {
  const cards = [
    {
      title: "Sesi Hari Ini",
      value: `${data.sessionToday?.completed ?? 0} / ${data.sessionToday?.planned ?? 0}`,
      icon: CalendarIcon,
      colorClass: "text-teal-400",
      bgClass: "bg-teal-500/10",
      sub: "terlaksana / terencana",
    },
    {
      title: "Sesi Minggu Ini",
      value: `${data.sessionThisWeek?.completed ?? 0} / ${data.sessionThisWeek?.planned ?? 0}`,
      icon: BarChart3Icon,
      colorClass: "text-green-400",
      bgClass: "bg-green-500/10",
      sub: "terlaksana / terencana",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div key={i} className="relative rounded-xl border border-gray-200 bg-white p-5 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <BorderBeam size={100} duration={8 + i} colorFrom="#14b8a6" colorTo="#22c55e" />
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
              </div>
              <div className={`h-10 w-10 rounded-xl ${card.bgClass} flex items-center justify-center flex-shrink-0 ml-3`}>
                <Icon className={`h-5 w-5 ${card.colorClass}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Admin Main Content ────────────────────────────────────────────────────────

function AdminMainContent({ data, role }: { data: DashboardData; role: string }) {
  const permissions = usePermissions(role as UserRole);
  const appointments = data.todaySchedule ?? [];

  return (
    <div className="space-y-6">
      {/* Quick actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/dashboard/patients?action=create">
          <button className="flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-5 py-2.5 transition-colors">
            <UserPlusIcon className="h-4 w-4" />
            Tambah Pasien
          </button>
        </Link>
        <Link href="/dashboard/schedules">
          <button className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-700 text-sm font-semibold px-5 py-2.5 transition-colors">
            <CalendarDaysIcon className="h-4 w-4" />
            Lihat Jadwal
          </button>
        </Link>
      </div>

      {/* Jadwal Hari Ini */}
      <div className="relative rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <BorderBeam size={120} duration={9} colorFrom="#14b8a6" colorTo="#22c55e" />
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Jadwal Hari Ini</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {appointments.length} sesi terjadwal hari ini
          </p>
        </div>
        <div className="overflow-x-auto">
          {appointments.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left py-3 px-6 font-medium text-gray-500 text-xs uppercase tracking-wide">Pasien</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wide">No. Telp Ortu</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wide">Terapis</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wide">Jenis</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wide">Jam</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wide">Pertemuan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {appointments.map((apt, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-6 font-medium text-gray-900">{apt.patientName}</td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-xs">{apt.parentPhone}</td>
                    <td className="py-3 px-4 text-gray-600">{apt.therapistName}</td>
                    <td className="py-3 px-4">
                      <Badge className={`text-xs font-semibold ${apt.therapyType === "OT" ? "bg-blue-100 text-blue-700" : apt.therapyType === "HB" ? "bg-emerald-100 text-emerald-700" : "bg-purple-100 text-purple-700"}`}>
                        {apt.therapyType}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-medium">{slotTime(apt.hour)}</td>
                    <td className="py-3 px-4">
                      <span className="text-gray-900 font-semibold">{apt.sessionNumber}</span>
                      <span className="text-gray-400">/{apt.totalSessions || "—"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <CalendarIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Tidak ada jadwal hari ini</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity — super_admin only */}
      {permissions.hasPermission("dashboard:activity") && data.recentActivity && data.recentActivity.length > 0 && (
        <RecentActivityWidget activities={data.recentActivity} />
      )}
    </div>
  );
}

// ── Recent Activity Widget (super_admin only) ─────────────────────────────────

function RecentActivityWidget({ activities }: { activities: ActivityItem[] }) {
  const iconMap: Record<string, React.ReactNode> = {
    session_completed: <CheckCircleIcon className="h-4 w-4 text-teal-500" />,
    report_created:    <FileTextIcon    className="h-4 w-4 text-green-500" />,
    user_registered:   <UserCheckIcon   className="h-4 w-4 text-blue-500" />,
    invoice_paid:      <ReceiptIcon     className="h-4 w-4 text-emerald-500" />,
  };

  return (
    <div className="relative rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <BorderBeam size={120} duration={11} colorFrom="#14b8a6" colorTo="#8b5cf6" />
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">Aktivitas Terbaru</h2>
        <p className="text-sm text-gray-500 mt-0.5">Semua aktivitas sistem terkini</p>
      </div>
      <div className="p-6">
        <div className="space-y-2">
          {activities.map(a => (
            <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0 mt-0.5">{iconMap[a.type] ?? null}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{a.title}</p>
                <p className="text-xs text-gray-500 truncate">{a.description}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(a.timestamp).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Therapist Main Content ────────────────────────────────────────────────────

function TherapistMainContent({ data }: { data: DashboardData }) {
  const todaySlots     = data.todaySchedule  ?? [];
  const weeklySlots    = data.weeklySchedule ?? {};
  const missingReports = data.missingReports ?? [];
  const SHOW_MAX = 3;
  const [showAll, setShowAll] = useState(false);
  const visibleMissing = showAll ? missingReports : missingReports.slice(0, SHOW_MAX);
  const hiddenCount    = missingReports.length - SHOW_MAX;

  return (
    <div className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Jadwal Hari Ini */}
      <div className="relative rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <BorderBeam size={120} duration={9} colorFrom="#14b8a6" colorTo="#22c55e" />
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Jadwal Hari Ini</h2>
          <p className="text-sm text-gray-500 mt-0.5">{todaySlots.length} pasien hari ini</p>
        </div>
        <div className="p-6">
          {todaySlots.length > 0 ? (
            <div className="space-y-3">
              {todaySlots.map((slot, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${i === 0 ? "bg-teal-50 border-teal-100" : "bg-gray-50 border-gray-100"}`}>
                  <div>
                    <p className={`text-sm font-semibold ${i === 0 ? "text-teal-900" : "text-gray-900"}`}>{slot.patientName}</p>
                    <p className={`text-xs ${i === 0 ? "text-teal-700" : "text-gray-500"}`}>
                      {slot.therapyType} · Pertemuan {slot.sessionNumber ?? "?"}/{slot.totalSessions || "?"}
                    </p>
                  </div>
                  <p className={`text-sm font-medium ${i === 0 ? "text-teal-800" : "text-gray-700"}`}>{slotTime(slot.hour)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CalendarIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Tidak ada jadwal hari ini</p>
            </div>
          )}
        </div>
      </div>

      {/* Jadwal Minggu Ini */}
      <div className="relative rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <BorderBeam size={120} duration={12} colorFrom="#14b8a6" colorTo="#8b5cf6" />
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Jadwal Minggu Ini</h2>
          <p className="text-sm text-gray-500 mt-0.5">Semua sesi minggu ini per hari</p>
        </div>
        <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
          {DAY_ORDER.filter(day => (weeklySlots[day]?.length ?? 0) > 0).map(day => (
            <div key={day}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{DAY_LABELS[day]}</h3>
              <div className="space-y-1.5">
                {weeklySlots[day].map((slot, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-gray-900 truncate">{slot.patientName}</span>
                      <Badge className={`text-xs flex-shrink-0 ${slot.therapyType === "OT" ? "bg-blue-100 text-blue-700" : slot.therapyType === "HB" ? "bg-emerald-100 text-emerald-700" : "bg-purple-100 text-purple-700"}`}>
                        {slot.therapyType}
                      </Badge>
                      {slot.totalSessions > 0 && (
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {slot.sessionNumber ?? 0}/{slot.totalSessions}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500 flex-shrink-0 ml-2">{slotTime(slot.hour)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {DAY_ORDER.every(day => (weeklySlots[day]?.length ?? 0) === 0) && (
            <div className="text-center py-8">
              <BarChart3Icon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Belum ada jadwal minggu ini</p>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Laporan belum dibuat minggu ini */}
    {missingReports.length > 0 && (
      <div className="relative rounded-2xl border border-amber-200 bg-white shadow-sm overflow-hidden">
        <BorderBeam size={120} duration={10} colorFrom="#f59e0b" colorTo="#ef4444" />
        <div className="p-6 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircleIcon className="h-5 w-5 text-amber-500" />
            <h2 className="text-base font-semibold text-gray-900">Laporan Belum Dibuat Minggu Ini</h2>
          </div>
          <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5">
            {missingReports.length} sesi
          </span>
        </div>
        <div className="p-6 space-y-2">
          {visibleMissing.map((p, idx) => {
            const dateLabel = new Date(p.slotDate + "T00:00:00").toLocaleDateString("id-ID", {
              weekday: "long", day: "numeric", month: "short", year: "numeric",
            });
            return (
              <div key={`${p.childId}_${p.slotDate}_${p.therapyType}_${idx}`} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <UserCheckIcon className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{p.childName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      <span className={`font-medium ${p.therapyType === "OT" ? "text-blue-600" : p.therapyType === "HB" ? "text-emerald-600" : "text-purple-600"}`}>
                        {p.therapyType}
                      </span>
                      {" · "}{dateLabel}{" · "}{slotTime(p.hour)}
                      {" · "}Sesi {p.sessionNumber}/{p.totalSessions || "?"}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/dashboard/reports/new?childId=${p.childId}&childName=${encodeURIComponent(p.childName)}&sessionDate=${p.slotDate}`}
                  className="flex-shrink-0 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg px-3 py-1.5 transition-colors"
                >
                  + Buat
                </Link>
              </div>
            );
          })}
          {hiddenCount > 0 && (
            <button
              onClick={() => setShowAll(v => !v)}
              className="w-full text-sm text-amber-700 hover:text-amber-900 font-medium py-2 text-center"
            >
              {showAll ? "Sembunyikan" : `Lihat ${hiddenCount} sesi lainnya`}
            </button>
          )}
        </div>
      </div>
    )}
    </div>
  );
}

// ── Parent Main Content ───────────────────────────────────────────────────────

function ParentMainContent({ data }: { data: DashboardData }) {
  const weeklyReports      = data.weeklyReports    ?? [];
  const upcomingSchedule   = data.upcomingSchedule ?? [];
  const unseenInvoiceCount = data.unseenInvoiceCount ?? 0;
  const sessionBalances    = data.sessionBalances  ?? [];

  return (
    <div className="space-y-6">
      {/* Notifikasi invoice belum dilihat */}
      {unseenInvoiceCount > 0 && (
        <Link href="/dashboard/invoices">
          <div className="flex items-center gap-3 p-4 rounded-2xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <ReceiptIcon className="h-5 w-5 text-amber-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900">
                {unseenInvoiceCount} invoice baru belum dilihat
              </p>
              <p className="text-xs text-amber-700 mt-0.5">Klik untuk melihat detail invoice Anda</p>
            </div>
            <Badge className="bg-amber-500 text-white flex-shrink-0">{unseenInvoiceCount}</Badge>
          </div>
        </Link>
      )}

      {/* Sisa Sesi Anda */}
      {sessionBalances.length > 0 && (
        <div className="relative rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <BorderBeam size={120} duration={10} colorFrom="#22c55e" colorTo="#14b8a6" />
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Sisa Sesi Anda</h2>
            <p className="text-sm text-gray-500 mt-0.5">Jumlah sesi terapi yang tersisa dari paket aktif</p>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sessionBalances.map((b) => (
              <div key={b.childId} className="rounded-xl border border-gray-100 bg-gray-50 px-5 py-4 text-center">
                <p className="text-4xl font-bold text-teal-600">{b.remaining}</p>
                <p className="text-xs text-gray-500 mt-1">sesi tersisa</p>
                <p className="text-sm font-medium text-gray-900 mt-2 truncate">{b.childName}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Laporan minggu ini */}
      <div className="relative rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <BorderBeam size={120} duration={10} colorFrom="#14b8a6" colorTo="#8b5cf6" />
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Laporan Minggu Ini</h2>
          <p className="text-sm text-gray-500 mt-0.5">Laporan terapi yang diterbitkan minggu ini</p>
        </div>
        <div className="p-6">
          {weeklyReports.length > 0 ? (
            <div className="space-y-2">
              {weeklyReports.map((r) => (
                <Link key={r.id} href={`/dashboard/reports`}>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100 cursor-pointer">
                    <div className="h-9 w-9 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                      <FileTextIcon className="h-5 w-5 text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">{r.childName}</p>
                        <Badge className={`text-xs flex-shrink-0 ${r.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {r.status === "completed" ? "Selesai" : "Draft"}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{r.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className="text-xs bg-blue-100 text-blue-700">{r.type}</Badge>
                        <span className="text-xs text-gray-400">
                          {new Date(r.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <FileTextIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Belum ada laporan minggu ini</p>
              <p className="text-xs text-gray-400 mt-1">Laporan akan muncul di sini setelah terapis menerbitkannya</p>
            </div>
          )}
        </div>
      </div>

      {/* Jadwal mendatang */}
      <div className="relative rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <BorderBeam size={120} duration={10} colorFrom="#14b8a6" colorTo="#22c55e" />
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Jadwal Hari Ini &amp; Mendatang</h2>
          <p className="text-sm text-gray-500 mt-0.5">Jadwal terapi anak-anak Anda</p>
        </div>
        <div className="p-6">
          {upcomingSchedule.length > 0 ? (
            <div className="space-y-3">
              {upcomingSchedule.map((apt, i) => (
                <div key={i} className={`flex items-center justify-between p-4 rounded-xl border ${i === 0 ? "bg-teal-50 border-teal-100" : "bg-gray-50 border-gray-100"}`}>
                  <div>
                    <p className={`text-sm font-semibold ${i === 0 ? "text-teal-900" : "text-gray-900"}`}>
                      {apt.childName}
                    </p>
                    <p className={`text-xs mt-0.5 ${i === 0 ? "text-teal-700" : "text-gray-500"}`}>
                      Terapis: {apt.therapistName}
                    </p>
                    <p className={`text-xs ${i === 0 ? "text-teal-600" : "text-gray-400"}`}>
                      Pertemuan {apt.sessionNumber}/{apt.totalSessions} · {apt.therapyType}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${i === 0 ? "text-teal-800" : "text-gray-700"}`}>
                      {DAY_LABELS[apt.day] ?? apt.day}
                    </p>
                    <p className={`text-xs mt-0.5 ${i === 0 ? "text-teal-600" : "text-gray-500"}`}>
                      {apt.date
                        ? new Date(apt.date + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" })
                        : ""} · {slotTime(apt.hour)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <CalendarIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Tidak ada jadwal mendatang</p>
              <p className="text-xs text-gray-400 mt-1">Hubungi terapis untuk menjadwalkan sesi</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
