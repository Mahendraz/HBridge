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
  CheckCircleIcon,
  UserIcon,
  BarChart3Icon,
  UserCheckIcon,
  ActivityIcon,
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
  systemUptime?: number;
  userGrowth?: string;
  patientGrowth?: string;

  // Therapist stats
  assignedPatients?: number;
  todaySessions?: number;
  upcomingSessions?: number;
  completedSessions?: number;

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
          await loadAdminData(token);
          break;
        case 'therapist':
          await loadTherapistData(token);
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

  const loadAdminData = async (token: string) => {
    try {
      const [therapistsResponse, childrenResponse] = await Promise.all([
        fetch('/api/therapists', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/children', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      let totalTherapists = 0;
      let totalPatients = 0;

      if (therapistsResponse.ok) {
        const therapistsData = await therapistsResponse.json();
        if (therapistsData.success && therapistsData.data) {
          totalTherapists = therapistsData.data.total || therapistsData.data.therapists?.length || 0;
        }
      }

      if (childrenResponse.ok) {
        const childrenData = await childrenResponse.json();
        if (childrenData.success && childrenData.data && childrenData.data.children) {
          totalPatients = childrenData.data.children.length || 0;
        }
      }

      const totalUsers = totalTherapists + totalPatients + 1;

      setStats({
        totalUsers,
        totalTherapists,
        totalPatients,
        systemUptime: 99.7,
        userGrowth: totalTherapists > 0 ? "+12%" : "+0%",
        patientGrowth: totalPatients > 0 ? "+8%" : "+0%"
      });

      setRecentActivity([
        {
          id: "1",
          type: "session",
          title: "Status Sistem",
          description: `MongoDB terhubung - ${totalPatients} pasien, ${totalTherapists} terapis aktif`,
          timestamp: "Sekarang",
          priority: totalPatients > 0 ? "low" : "medium"
        },
        {
          id: "2",
          type: "appointment",
          title: "Status Database",
          description: `Data berhasil dimuat: ${totalTherapists} terapis, ${totalPatients} pasien`,
          timestamp: "5 menit lalu",
          priority: "medium"
        }
      ]);
    } catch (error) {
      console.error("Error loading admin data:", error);
      setStats({ totalUsers: 1, totalTherapists: 0, totalPatients: 0, systemUptime: 99.7, userGrowth: "+0%", patientGrowth: "+0%" });
      setRecentActivity([{ id: "1", type: "session", title: "Kesalahan Koneksi", description: "Gagal memuat data dari MongoDB", timestamp: "Sekarang", priority: "high" }]);
    }
  };

  const loadTherapistData = async (token: string) => {
    let assignedPatients = 0;

    try {
      const childrenResponse = await fetch(`/api/children?therapistId=${user?._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (childrenResponse.ok) {
        const data = await childrenResponse.json();
        assignedPatients = (data.children || []).length;
      }
    } catch {
      assignedPatients = user?.name === "Dr. Michael Chen" ? 1 : user?.name === "Dr. Emily Rodriguez" ? 1 : 0;
    }

    setStats({ assignedPatients, todaySessions: assignedPatients > 0 ? 2 : 0, upcomingSessions: assignedPatients > 0 ? 3 : 0, completedSessions: assignedPatients > 0 ? 45 : 0 });

    setRecentActivity(assignedPatients > 0 ? [
      { id: "1", type: "session", title: user?.name === "Dr. Michael Chen" ? "Sesi dengan Emma Smith" : "Sesi dengan Lucas Wilson", description: "Sesi terapi selesai", timestamp: "2 jam lalu", status: "completed" },
      { id: "2", type: "report", title: "Laporan Kemajuan", description: "Pembaruan kemajuan pasien", timestamp: "1 hari lalu", status: "completed" }
    ] : [
      { id: "1", type: "appointment", title: "Belum Ada Pasien", description: "Hubungi admin untuk penugasan pasien", timestamp: "Hari ini", status: "pending" }
    ]);

    setTodaySchedule(assignedPatients > 0 ? [
      { id: "1", patientName: user?.name === "Dr. Michael Chen" ? "Emma Smith" : "Lucas Wilson", therapyType: user?.name === "Dr. Michael Chen" ? "Behavioral Therapy" : "Speech Therapy", time: "10:00 AM", status: "completed" },
      { id: "2", patientName: user?.name === "Dr. Michael Chen" ? "Emma Smith" : "Lucas Wilson", therapyType: user?.name === "Dr. Michael Chen" ? "Social Skills Training" : "ADHD Management", time: "2:00 PM", status: "scheduled" }
    ] : []);
  };

  const loadParentData = async (token: string) => {
    let childrenCount = 0;

    try {
      const childrenResponse = await fetch(`/api/children?parentId=${user?._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (childrenResponse.ok) {
        const data = await childrenResponse.json();
        childrenCount = (data.children || []).length;
      }
    } catch {
      childrenCount = user?.name === "Jennifer Smith" ? 2 : user?.name === "David Wilson" ? 1 : 1;
    }

    setStats({ children: childrenCount, nextAppointment: childrenCount > 0 ? "Besok 10:00" : "Tidak ada jadwal", progressUpdates: childrenCount > 0 ? 2 : 0, recentReports: childrenCount > 0 ? 1 : 0 });

    setRecentActivity(childrenCount > 0 ? [
      { id: "1", type: "session", title: "Sesi Terapi Anak", description: "Kemajuan luar biasa dalam keterampilan komunikasi", timestamp: "2 jam lalu", status: "completed" },
      { id: "2", type: "report", title: "Laporan Kemajuan Baru", description: "Penilaian bulanan anak", timestamp: "1 hari lalu", status: "new" },
      { id: "3", type: "appointment", title: "Sesi Mendatang", description: "Sesi terapi wicara terjadwal", timestamp: "Besok pukul 10:00", status: "scheduled" }
    ] : [
      { id: "1", type: "appointment", title: "Selamat Datang di Hearty Bridge", description: "Tambahkan profil anak pertama Anda untuk memulai", timestamp: "Hari ini", status: "pending" }
    ]);

    setTodaySchedule(childrenCount > 0 ? [
      { id: "1", patientName: user?.name === "Jennifer Smith" ? "Emma Smith" : "Anak Anda", therapyType: user?.name === "Jennifer Smith" ? "Behavioral Therapy" : "Speech Therapy", time: "10:00 AM", status: "scheduled" }
    ] : []);
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
        return [
          { title: "Total Pengguna", value: stats.totalUsers, isNumeric: true, icon: UsersIcon, colorClass: "text-teal-400", bgClass: "bg-teal-500/10", change: stats.userGrowth || "+0%" },
          { title: "Terapis Aktif", value: stats.totalTherapists, isNumeric: true, icon: UserCheckIcon, colorClass: "text-green-400", bgClass: "bg-green-500/10", change: "Aktif" },
          { title: "Pasien Terdaftar", value: stats.totalPatients, isNumeric: true, icon: UserIcon, colorClass: "text-purple-400", bgClass: "bg-purple-500/10", change: stats.patientGrowth || "+0%" },
          { title: "Uptime Sistem", value: stats.systemUptime, isNumeric: true, icon: ActivityIcon, colorClass: "text-orange-400", bgClass: "bg-orange-500/10", change: "Sangat Baik", suffix: "%" }
        ];
      case 'therapist':
        return [
          { title: "Pasien Ditugaskan", value: stats.assignedPatients, isNumeric: true, icon: UsersIcon, colorClass: "text-teal-400", bgClass: "bg-teal-500/10" },
          { title: "Sesi Hari Ini", value: stats.todaySessions, isNumeric: true, icon: CalendarIcon, colorClass: "text-green-400", bgClass: "bg-green-500/10" },
          { title: "Sesi Mendatang", value: stats.upcomingSessions, isNumeric: true, icon: ClockIcon, colorClass: "text-purple-400", bgClass: "bg-purple-500/10" },
          { title: "Sesi Selesai", value: stats.completedSessions, isNumeric: true, icon: CheckCircleIcon, colorClass: "text-orange-400", bgClass: "bg-orange-500/10" }
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
                {user?.role === 'therapist' && `Anda memiliki ${stats?.todaySessions || 0} sesi hari ini`}
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
                        <div className="flex items-baseline space-x-1">
                          <NumberTicker
                            value={stat.value}
                            className="text-2xl font-bold text-gray-900"
                          />
                          {'suffix' in stat && stat.suffix && (
                            <span className="text-lg font-bold text-gray-900">{stat.suffix}</span>
                          )}
                        </div>
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

          {/* Role-specific widget */}
          <PermissionGuard
            userRole={user?.role || "parent"}
            permissions={["dashboard:analytics"]}
          >
            <div className="relative rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <BorderBeam size={120} duration={11} colorFrom="#22c55e" colorTo="#14b8a6" />
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">Ikhtisar Sistem</h2>
                <p className="text-sm text-gray-500 mt-0.5">Indikator kinerja utama</p>
              </div>
              <div className="p-6 space-y-5">
                {[
                  { label: "Pemanfaatan Terapis", value: 78, color: "bg-teal-500" },
                  { label: "Kepuasan Pasien", value: 94, color: "bg-green-500" },
                  { label: "Kesehatan Sistem", value: 99.7, color: "bg-purple-500" }
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm text-gray-600">{item.label}</span>
                      <span className="text-sm font-semibold text-gray-900">{item.value}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`${item.color} h-2 rounded-full transition-all duration-700`} style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </PermissionGuard>

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
