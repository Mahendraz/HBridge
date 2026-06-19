"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading";
import { useAuth } from "@/lib/contexts/auth-context";
import { usePermissions, PermissionGuard } from "@/lib/utils/permissions";
import {
  UsersIcon,
  CalendarIcon,
  ClockIcon,
  TrendingUpIcon,
  AlertCircleIcon,
  UserIcon,
  BarChart3Icon,
  UserCheckIcon,
  FileTextIcon,
  HeartIcon,
  BabyIcon
} from "lucide-react";
import Link from "next/link";
import { BorderBeam } from "@/components/magicui/border-beam";
import { MagicCard } from "@/components/magicui/magic-card";
import { NumberTicker } from "@/components/magicui/number-ticker";

interface DashboardStats {
  // Admin stats
  totalUsers?: number;
  totalTherapists?: number;
  totalPatients?: number;
  userGrowth?: string;
  patientGrowth?: string;

  // Parent stats
  children?: number;
  nextAppointment?: string;
  progressUpdates?: number;
  recentReports?: number;
}

interface RecentActivity {
  id: string;
  type: "session" | "report" | "appointment" | "message";
  title: string;
  description: string;
  timestamp: string;
  status?: string;
  priority?: "high" | "medium" | "low";
}

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permissions: string[];
  variant: "default" | "secondary" | "outline";
}

interface ScheduleItem {
  id: string;
  patientName: string;
  therapyType: string;
  time: string;
  status: "in-progress" | "scheduled" | "completed";
}

export default function UnifiedDashboard() {
  const { user } = useAuth();
  const permissions = usePermissions(user?.role || "parent");

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      switch (user?.role) {
        case 'admin':
        case 'therapist':
          await loadAdminData(token);
          break;
        case 'parent':
          await loadParentData(token);
          break;
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ── helpers ─────────────────────────────────────────────────────────────────
  const DAY_MAP: Record<number, string> = {
    1: 'senin', 2: 'selasa', 3: 'rabu', 4: 'kamis', 5: 'jumat', 6: 'sabtu',
  };
  const DAY_ORDER = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
  const DAY_LABELS: Record<string, string> = {
    senin: 'Senin', selasa: 'Selasa', rabu: 'Rabu',
    kamis: 'Kamis', jumat: 'Jumat', sabtu: 'Sabtu',
  };
  const todayKey = DAY_MAP[new Date().getDay()] ?? '';

  function slotTime(hour: number) {
    return `${String(hour).padStart(2, '0')}:00`;
  }

  // ── Admin ────────────────────────────────────────────────────────────────────
  const loadAdminData = async (token: string) => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [statsRes, scheduleRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/weekly-schedule', { headers }),
      ]);

      if (!statsRes.ok) throw new Error('admin/stats failed');
      const result = await statsRes.json();
      const d = result.data ?? result;

      const totalUsers      = d.users?.total      ?? 0;
      const totalTherapists = d.users?.therapists  ?? 0;
      const userGrowth      = d.users?.growth      ?? '+0%';
      const patientGrowth   = d.patients?.growth   ?? '+0%';

      // Count unique active patients from weekly schedule
      let totalPatients = 0;
      if (scheduleRes.ok) {
        const sj = await scheduleRes.json();
        const slots: any[] = sj.data ?? [];
        const uniqueIds = new Set(slots.map((s: any) => s.patientId).filter(Boolean));
        totalPatients = uniqueIds.size;
      }

      setStats({ totalUsers, totalTherapists, totalPatients, userGrowth, patientGrowth });

      const rawActivity: RecentActivity[] = (d.recentActivity ?? []).slice(0, 5).map((a: any) => ({
        id:          String(a.id),
        type:        'session' as const,
        title:       a.title,
        description: a.description,
        timestamp:   a.timestamp
          ? new Date(a.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'Baru saja',
        priority: a.priority ?? 'low',
      }));

      setRecentActivity(
        rawActivity.length > 0 ? rawActivity : [{
          id: '1', type: 'session',
          title: 'Status Sistem',
          description: `${totalPatients} pasien · ${totalTherapists} terapis aktif`,
          timestamp: 'Sekarang', priority: 'low',
        }]
      );
    } catch (error) {
      console.error('Error loading admin data:', error);
      setStats({ totalUsers: 0, totalTherapists: 0, totalPatients: 0, userGrowth: '+0%', patientGrowth: '+0%' });
      setRecentActivity([{
        id: '1', type: 'session',
        title: 'Kesalahan Koneksi',
        description: 'Gagal memuat data dari server',
        timestamp: 'Sekarang', priority: 'high',
      }]);
    }
  };

  // ── Parent ───────────────────────────────────────────────────────────────────
  const loadParentData = async (token: string) => {
    const headers = { 'Authorization': `Bearer ${token}` };

    const [childrenRes, reportsRes, scheduleRes] = await Promise.allSettled([
      fetch('/api/children', { headers }),
      fetch('/api/reports', { headers }),
      fetch('/api/weekly-schedule', { headers }),
    ]);

    // ── children ──
    let childrenCount = 0;
    if (childrenRes.status === 'fulfilled' && childrenRes.value.ok) {
      const j = await childrenRes.value.json();
      childrenCount = (j.data?.children ?? j.children ?? []).length;
    }

    // ── reports ──
    let recentReports  = 0;
    let progressUpdates = 0;
    const activity: RecentActivity[] = [];

    if (reportsRes.status === 'fulfilled' && reportsRes.value.ok) {
      const j = await reportsRes.value.json();
      const reports: any[] = j.data ?? [];
      recentReports = reports.length;

      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      progressUpdates = reports.filter((r) => new Date(r.createdAt).getTime() > sevenDaysAgo).length;

      reports.slice(0, 3).forEach((r) => {
        activity.push({
          id:          String(r._id),
          type:        'report',
          title:       r.title,
          description: `Terapis: ${r.therapistName ?? '—'}`,
          timestamp:   new Date(r.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
          status:      r.status,
        });
      });
    }

    // ── schedule ──
    let nextAppointment = 'Tidak ada jadwal';
    const scheduleToday: ScheduleItem[] = [];

    if (scheduleRes.status === 'fulfilled' && scheduleRes.value.ok) {
      const j = await scheduleRes.value.json();
      const slots: any[] = j.data ?? [];

      // Today's slots
      const today = slots
        .filter((s) => s.day === todayKey)
        .sort((a, b) => a.hour - b.hour);

      today.forEach((s) => {
        scheduleToday.push({
          id:          String(s._id ?? s.id ?? Math.random()),
          patientName: s.patientName,
          therapyType: s.therapyType,
          time:        slotTime(s.hour),
          status:      'scheduled',
        });
      });

      // Next appointment (today or upcoming)
      const todayIdx = DAY_ORDER.indexOf(todayKey);
      const upcoming = slots
        .filter((s) => DAY_ORDER.indexOf(s.day) >= todayIdx)
        .sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) || a.hour - b.hour);

      if (upcoming.length > 0) {
        const next = upcoming[0];
        const isToday = next.day === todayKey;
        nextAppointment = isToday
          ? `Hari ini ${slotTime(next.hour)}`
          : `${DAY_LABELS[next.day] ?? next.day} ${slotTime(next.hour)}`;

        // Add upcoming session to activity if room
        if (activity.length < 3) {
          activity.push({
            id:          `sched-${next._id ?? next.id}`,
            type:        'appointment',
            title:       `Sesi ${next.therapyType}`,
            description: `${next.patientName} · Terapis: ${next.therapistName}`,
            timestamp:   nextAppointment,
            status:      'scheduled',
          });
        }
      }
    }

    if (activity.length === 0) {
      activity.push({
        id: '1', type: 'appointment',
        title:       childrenCount > 0 ? 'Belum Ada Laporan' : 'Selamat Datang di Hearty Bridge',
        description: childrenCount > 0
          ? 'Belum ada laporan dari terapis untuk anak Anda'
          : 'Hubungi admin untuk menambahkan profil anak',
        timestamp: 'Hari ini', status: 'pending',
      });
    }

    setStats({ children: childrenCount, nextAppointment, progressUpdates, recentReports });
    setRecentActivity(activity);
    setTodaySchedule(scheduleToday);
  };

  const getQuickActions = (): QuickAction[] => {
    const allActions: QuickAction[] = [
      { title: "Tambah Pasien Baru", description: "Daftarkan pasien baru di sistem", href: "/dashboard/patients?action=create", icon: UserIcon, permissions: ["patients:create"], variant: "default" },
      { title: "Undang Terapis", description: "Kirim undangan ke terapis baru", href: "/dashboard/therapists?action=invite", icon: UserCheckIcon, permissions: ["therapists:invite"], variant: "secondary" },
      { title: "Laporan Sistem", description: "Lihat analitik sistem komprehensif", href: "/dashboard/reports?type=system", icon: BarChart3Icon, permissions: ["reports:system_analytics"], variant: "outline" },
      { title: "Lihat Jadwal Saya", description: "Kelola janji temu dan ketersediaan Anda", href: "/dashboard/schedules", icon: CalendarIcon, permissions: ["schedules:view_own"], variant: "default" },
      { title: "Buat Laporan", description: "Buat laporan kemajuan pasien", href: "/dashboard/reports?action=create", icon: FileTextIcon, permissions: ["reports:create"], variant: "secondary" },
      { title: "Lihat Pasien Ditugaskan", description: "Lihat semua pasien yang ditugaskan", href: "/dashboard/patients", icon: UsersIcon, permissions: ["patients:view_assigned"], variant: "outline" },
      { title: "Anak Saya", description: "Lihat profil anak-anak Anda", href: "/dashboard/patients", icon: BabyIcon, permissions: ["patients:view_own"], variant: "default" },
      { title: "Janji Temu Mendatang", description: "Lihat sesi terapi yang dijadwalkan", href: "/dashboard/schedules", icon: CalendarIcon, permissions: ["schedules:view"], variant: "secondary" },
      { title: "Laporan Kemajuan", description: "Tinjau kemajuan terapi", href: "/dashboard/reports", icon: TrendingUpIcon, permissions: ["reports:view_own"], variant: "outline" }
    ];
    return allActions.filter(action => permissions.hasAnyPermission(action.permissions as any));
  };

  const getStatsCards = () => {
    if (!stats) return [];

    switch (user?.role) {
      case 'admin':
      case 'therapist':
        return [
          { title: "Total Pengguna", value: stats.totalUsers, isNumeric: true, icon: UsersIcon, colorClass: "text-teal-400", bgClass: "bg-teal-500/10", change: stats.userGrowth || "+0%" },
          { title: "Terapis Aktif", value: stats.totalTherapists, isNumeric: true, icon: UserCheckIcon, colorClass: "text-green-400", bgClass: "bg-green-500/10", change: "Aktif" },
          { title: "Pasien Aktif", value: stats.totalPatients, isNumeric: true, icon: UserIcon, colorClass: "text-purple-400", bgClass: "bg-purple-500/10", change: "Dari jadwal" }
        ];
      case 'parent':
        return [
          { title: "Anak Saya", value: stats.children, isNumeric: true, icon: BabyIcon, colorClass: "text-teal-400", bgClass: "bg-teal-500/10" },
          { title: "Janji Temu Berikutnya", value: stats.nextAppointment, isNumeric: false, icon: CalendarIcon, colorClass: "text-green-400", bgClass: "bg-green-500/10" },
          { title: "Pembaruan Kemajuan", value: stats.progressUpdates, isNumeric: true, icon: TrendingUpIcon, colorClass: "text-purple-400", bgClass: "bg-purple-500/10" },
          { title: "Laporan Terbaru", value: stats.recentReports, isNumeric: true, icon: FileTextIcon, colorClass: "text-orange-400", bgClass: "bg-orange-500/10" }
        ];
      default:
        return [];
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="relative rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <BorderBeam size={150} duration={6} colorFrom="#14b8a6" colorTo="#22c55e" />
          <div className="p-6 flex items-center space-x-4">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
              <HeartIcon className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Selamat datang kembali, {user?.name?.split(' ')[0]}!
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {user?.role === 'admin' && "Kelola sistem praktik terapi Anda"}
                {user?.role === 'therapist' && `Kelola pasien dan sesi terapi Anda`}
                {user?.role === 'parent' && `Pantau perkembangan ${stats?.children || 0} anak Anda`}
              </p>
            </div>
          </div>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {getStatsCards().map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="relative rounded-xl border border-gray-200 bg-white p-5 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <BorderBeam size={100} duration={8 + index} colorFrom="#14b8a6" colorTo="#22c55e" />
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 truncate">{stat.title}</p>
                    <div className="mt-1">
                      {stat.isNumeric && typeof stat.value === 'number' ? (
                        <NumberTicker
                          value={stat.value}
                          className="text-2xl font-bold text-gray-900"
                        />
                      ) : (
                        <p className="text-lg font-bold text-gray-900 truncate">{stat.value}</p>
                      )}
                    </div>
                    {'change' in stat && stat.change && (
                      <p className={`text-xs mt-1 font-medium ${
                        String(stat.change).startsWith('+') ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {stat.change}
                      </p>
                    )}
                  </div>
                  <div className={`h-10 w-10 rounded-xl ${stat.bgClass} flex items-center justify-center flex-shrink-0 ml-3`}>
                    <Icon className={`h-5 w-5 ${stat.colorClass}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Tindakan Cepat</h2>
            <p className="text-sm text-gray-500 mt-0.5">Tindakan yang sering digunakan untuk peran Anda</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {getQuickActions().slice(0, 3).map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link key={index} href={action.href}>
                    <MagicCard
                      className="rounded-xl border border-gray-100 cursor-pointer p-4 group"
                      gradientColor="rgba(20, 184, 166, 0.08)"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="h-9 w-9 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-100 transition-colors">
                          <Icon className="h-5 w-5 text-teal-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{action.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{action.description}</p>
                        </div>
                      </div>
                    </MagicCard>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

      {/* Activity + Schedule Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="relative rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <BorderBeam size={120} duration={9} colorFrom="#14b8a6" colorTo="#22c55e" />
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Aktivitas Terbaru</h2>
              <p className="text-sm text-gray-500 mt-0.5">Pembaruan dan notifikasi terbaru Anda</p>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-xl border border-gray-50 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0 mt-0.5">
                      {activity.type === "session" && <CalendarIcon className="h-4 w-4 text-teal-500" />}
                      {activity.type === "report" && <FileTextIcon className="h-4 w-4 text-green-500" />}
                      {activity.type === "appointment" && <ClockIcon className="h-4 w-4 text-orange-500" />}
                      {activity.type === "message" && <AlertCircleIcon className="h-4 w-4 text-purple-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                        {activity.priority && (
                          <Badge
                            variant="default"
                            className={`text-xs ml-2 flex-shrink-0 ${
                              activity.priority === 'high' ? 'bg-red-100 text-red-700 border-red-200' :
                              activity.priority === 'medium' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                              'bg-gray-100 text-gray-600 border-gray-200'
                            }`}
                          >
                            {activity.priority}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Schedule widget for non-admin */}
          <PermissionGuard
            userRole={user?.role || "parent"}
            permissions={["schedules:view", "schedules:view_own"]}
            fallback={
              <div className="relative rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-base font-semibold text-gray-900">Akses Cepat</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Akses fitur yang paling sering digunakan</p>
                </div>
                <div className="p-6 space-y-2">
                  {getQuickActions().slice(3, 6).map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <Link key={index} href={action.href}>
                        <button className="w-full flex items-center space-x-2 rounded-lg border border-gray-100 bg-gray-50 hover:bg-gray-100 px-4 py-2.5 text-sm text-gray-700 font-medium transition-colors text-left">
                          <Icon className="h-4 w-4 text-teal-600 flex-shrink-0" />
                          <span>{action.title}</span>
                        </button>
                      </Link>
                    );
                  })}
                </div>
              </div>
            }
          >
            <div className="relative rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <BorderBeam size={120} duration={12} colorFrom="#14b8a6" colorTo="#8b5cf6" />
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">
                  {user?.role === 'therapist' ? 'Jadwal Hari Ini' : 'Janji Temu Mendatang'}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {user?.role === 'therapist' ? 'Janji temu Anda hari ini' : 'Sesi terapi mendatang anak Anda'}
                </p>
              </div>
              <div className="p-6">
                {todaySchedule.length > 0 ? (
                  <div className="space-y-3">
                    {todaySchedule.map((item, index) => (
                      <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl ${
                        index === 0 ? 'bg-teal-50 border border-teal-100' : 'bg-gray-50 border border-gray-100'
                      }`}>
                        <div>
                          <p className={`text-sm font-semibold ${index === 0 ? 'text-teal-900' : 'text-gray-900'}`}>
                            {item.patientName}
                          </p>
                          <p className={`text-xs ${index === 0 ? 'text-teal-700' : 'text-gray-500'}`}>
                            {item.therapyType}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${index === 0 ? 'text-teal-800' : 'text-gray-700'}`}>
                            {item.time}
                          </p>
                          <Badge
                            variant="default"
                            className={`text-xs mt-0.5 ${
                              item.status === 'completed' ? 'bg-green-100 text-green-700' :
                              item.status === 'in-progress' ? 'bg-teal-100 text-teal-700' :
                              'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {item.status === 'completed' ? 'Selesai' :
                             item.status === 'in-progress' ? 'Berlangsung' :
                             user?.role === 'therapist' ? 'Dijadwalkan' : 'Besok'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">Tidak ada janji temu hari ini</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {user?.role === 'therapist' ? 'Jadwal Anda kosong hari ini' : 'Tidak ada sesi terapi yang dijadwalkan'}
                    </p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Link href="/dashboard/schedules">
                    <button className="w-full rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 py-2 transition-colors">
                      Lihat Jadwal Lengkap
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </PermissionGuard>
        </div>
    </div>
  );
}
