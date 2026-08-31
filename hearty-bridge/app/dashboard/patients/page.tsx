"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import { usePermissions, PermissionGuard } from "@/lib/utils/permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Select } from "@/components/ui/select";
import { fetchWithTimeout } from "@/lib/utils/fetch-with-timeout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  BabyIcon,
  PlusIcon,
  CalendarIcon,
  UserIcon,
  TrendingUpIcon,
  ClockIcon,
  FileTextIcon,
  MoreVerticalIcon,
  EyeIcon,
  SearchIcon,
  UserPlusIcon,
  PhoneIcon,
  MailIcon,
  UsersIcon
} from "lucide-react";
import Link from "next/link";

interface Patient {
  id: string;
  name: string;
  age?: number;
  birthDate?: string;
  gender?: string;
  diagnosis: string;
  status: 'active' | 'inactive' | 'pending';
  assignedTherapist?: {
    id: string;
    name: string;
    specialty: string;
  };
  parent?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  currentPrograms?: Array<{
    id: string;
    name: string;
    frequency: string;
    progress: number;
    nextSession: string;
  }>;
  recentProgress?: Record<string, number>;
  totalSessions?: number;
  sessionsThisMonth?: number;
  lastSession?: string;
  nextSession?: string;
  progressScore?: number;
  photoUrl?: string | null;
  tokenBalance?: number;
  tokenExpiry?: string | null;
  sessionProgress?: { completed: number; total: number } | null;
  therapyBalance?: Record<string, number>;
  createdAt?: string;
  weeklyFrequency?: number;
}

export default function UnifiedPatientsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const permissions = usePermissions(user?.role || "parent");

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateParentModal, setShowCreateParentModal] = useState(false);
  const [createParentForm, setCreateParentForm] = useState({
    name: '', email: '', password: '', phone: '',
  });
  const [createParentError, setCreateParentError] = useState<string | null>(null);
  const [isCreatingParent, setIsCreatingParent] = useState(false);

  const [showCreatePatientModal, setShowCreatePatientModal] = useState(false);
  const [createPatientForm, setCreatePatientForm] = useState({
    name: '', dateOfBirth: '', gender: 'male', diagnosis: '', parentId: '',
  });
  const [createPatientError, setCreatePatientError] = useState<string | null>(null);
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);
  const [parentsList, setParentsList] = useState<Array<{ _id: string; name: string; email: string }>>([]);
  const [allParents, setAllParents] = useState<Array<{ _id: string; name: string; email: string; phone?: string }>>([]);

  useEffect(() => {
    fetchPatients();
    if (permissions.hasPermission('users:view')) fetchAllParents();
    if (user?.role === 'parent') fetchCompletedSessions();
  }, [user, permissions]);

  // Server-side search (?search= on /api/children) — the client-side filter
  // below only ever saw the first page (limit=100) it had already fetched, so
  // clinics with more active children than that got no results for anyone past
  // the most-recently-created ones. Search fires on Enter (or the button), not
  // on every keystroke — searchTerm only updates local input state until then.
  const [submittedSearch, setSubmittedSearch] = useState("");
  const runSearch = () => {
    setSubmittedSearch(searchTerm);
    fetchPatients(searchTerm);
  };

  const fetchCompletedSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/reports?limit=1000', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const result = await res.json();
        const reports: any[] = result.data || [];
        setCompletedSessions(reports.length);
      }
    } catch {
      setCompletedSessions(0);
    }
  };

  const fetchPatients = async (search?: string) => {
    try {
      setLoading(true);
      setLoadError(null);
      const token = localStorage.getItem('token');

      const params = new URLSearchParams({ limit: '100' });
      if (search?.trim()) params.set('search', search.trim());

      const response = await fetchWithTimeout(`/api/children?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        // SuccessResponse.ok spreads data into root; mock fallback wraps in result.data
        const childrenData = result.children || result.data?.children;
        if (result.success && childrenData) {
          // Convert MongoDB children data to patient format
          const convertedPatients = childrenData.map((child: any) => {
            console.log('Converting MongoDB child:', child);
            const age = child.dateOfBirth ?
              new Date().getFullYear() - new Date(child.dateOfBirth).getFullYear() : 0;

            return {
            id: child.id || child._id,
            name: child.name,
            age: age,
            birthDate: child.dateOfBirth || new Date().toISOString().split('T')[0],
            gender: child.gender || "Tidak Diketahui",
            diagnosis: child.medicalInfo?.conditions?.[0] || 'Belum ada diagnosa',
            status: child.status || (child.isActive ? 'active' : 'inactive'),
            assignedTherapist: child.therapist ? {
              id: child.therapist.id,
              name: child.therapist.name,
              specialty: child.therapist.specialization || 'General Therapy'
            } : undefined,
            parent: {
              id: child.parent?.id || child.parentId || '',
              name: child.parent?.name || 'Unknown Parent',
              email: child.parent?.email || '',
              phone: child.parent?.phone || '',
            },
            currentPrograms: (child.therapist || child.therapistId) ? [
              {
                id: "1",
                name: 'General Therapy',
                frequency: child.weeklyFrequency ? `${child.weeklyFrequency}x/minggu` : 'Belum terjadwal',
                progress: child.progressScore || 50,
                nextSession: child.nextSession || new Date().toISOString()
              }
            ] : [],
            notes: child.notes || '',
            sessionsThisMonth: child.sessionsThisMonth ?? 0,
            lastSession: child.lastSession,
            nextSession: child.nextSession,
            progressScore: child.progressScore || 0,
            photoUrl: child.photoUrl ?? null,
            tokenBalance: child.tokenBalance ?? 0,
            tokenExpiry: child.tokenExpiry ?? null,
            sessionProgress: child.sessionProgress ?? null,
            therapyBalance: child.therapyBalance ?? {},
            createdAt: child.createdAt,
            weeklyFrequency: child.weeklyFrequency ?? 0
          };
          });
          setPatients(convertedPatients);
        }
      } else {
        console.error('Failed to fetch patients:', response.statusText);
        setLoadError('Gagal memuat data pasien. Silakan coba lagi.');
        setPatients([]);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      setLoadError(
        error instanceof Error && error.message.startsWith('Request timed out')
          ? 'Memuat data pasien terlalu lama. Periksa koneksi Anda dan coba lagi.'
          : 'Terjadi kesalahan saat memuat data pasien.'
      );
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateParent = async () => {
    if (!createParentForm.name || !createParentForm.email || !createParentForm.password) {
      setCreateParentError('Nama, email, dan password wajib diisi.');
      return;
    }
    setCreateParentError(null);
    setIsCreatingParent(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: createParentForm.name,
          email: createParentForm.email,
          password: createParentForm.password,
          role: 'parent',
          phone: createParentForm.phone || undefined,
        }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setShowCreateParentModal(false);
        setCreateParentForm({ name: '', email: '', password: '', phone: '' });
        await fetchAllParents();
      } else {
        setCreateParentError(result.error || result.message || 'Gagal membuat akun orang tua.');
      }
    } catch {
      setCreateParentError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsCreatingParent(false);
    }
  };

  const fetchParents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users?role=parent', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        setParentsList(result.users || []);
      }
    } catch {
      // silently fail - dropdown will be empty
    }
  };

  const fetchAllParents = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/users?role=parent', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const result = await res.json();
        setAllParents(result.users || []);
      }
    } catch {
      // silently fail
    }
  };

  const handleCreatePatient = async () => {
    if (!createPatientForm.name || !createPatientForm.dateOfBirth || !createPatientForm.parentId) {
      setCreatePatientError('Nama, tanggal lahir, dan orang tua wajib diisi.');
      return;
    }
    setCreatePatientError(null);
    setIsCreatingPatient(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: createPatientForm.name,
          dateOfBirth: createPatientForm.dateOfBirth,
          gender: createPatientForm.gender,
          parentId: createPatientForm.parentId,
          medicalInfo: { conditions: createPatientForm.diagnosis ? [createPatientForm.diagnosis] : [] },
        }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setShowCreatePatientModal(false);
        setCreatePatientForm({ name: '', dateOfBirth: '', gender: 'male', diagnosis: '', parentId: '' });
        fetchPatients();
      } else {
        const msg = result.details?.[0]?.message || result.error || result.message || 'Gagal membuat data pasien.';
        setCreatePatientError(msg);
      }
    } catch {
      setCreatePatientError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsCreatingPatient(false);
    }
  };

  // Show loading state
  if (loading) {
    return <PatientsSkeleton />;
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <p className="text-red-600">{loadError}</p>
          <Button variant="outline" onClick={() => fetchPatients(submittedSearch)}>
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  // Filter patients based on role
  const getFilteredPatients = () => {
    let filtered = patients;

    // Role-based filtering is handled server-side by /api/children.
    // Admin and therapist see all patients (therapist is view-only).
    // Search is also server-side now (see the debounced fetchPatients(searchTerm)
    // effect above) — it needs the full dataset, not just whatever page/limit
    // happens to already be loaded client-side.

    // Status filtering
    if (statusFilter !== "all") {
      filtered = filtered.filter(patient => patient.status === statusFilter);
    }

    return filtered;
  };

  const filteredPatients = getFilteredPatients();

  // For therapist: derive unique parents from their assigned patients
  // For admin: use allParents (fetched separately, includes parents with no children)
  const displayParents = (permissions.hasPermission('users:view')
    ? allParents
    : (() => {
        const map = new Map<string, { _id: string; name: string; email: string; phone?: string }>();
        filteredPatients.forEach(p => {
          if (p.parent?.id) {
            map.set(p.parent.id, {
              _id: p.parent.id,
              name: p.parent.name || 'Orang Tua',
              email: p.parent.email || '',
              phone: p.parent.phone,
            });
          }
        });
        return Array.from(map.values());
      })()
  // A submitted search already narrowed `patients` server-side (by child name
  // or parent name) — without this, every parent still rendered a card, most
  // just showing "Belum ada anak terdaftar", which reads as "search did nothing".
  ).filter(parent =>
    !submittedSearch.trim() || filteredPatients.some(p => p.parent?.id === parent._id)
  );

  const getPageTitle = () => {
    switch (user?.role) {
      case "super_admin":
      case "admin": return "Kelola Semua Pasien";
      case "therapist": return "Pasien yang Ditugaskan";
      case "parent": return "Anak Saya";
      default: return "Pasien";
    }
  };

  const getPageDescription = () => {
    switch (user?.role) {
      case "super_admin":
      case "admin": return "Kelola semua pasien dalam sistem";
      case "therapist": return "Kelola pasien yang ditugaskan dan sesi terapi Anda";
      case "parent": return "Kelola profil dan pantau perkembangan anak Anda";
      default: return "Manajemen pasien";
    }
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{getPageTitle()}</h1>
          <p className="text-gray-600">{getPageDescription()}</p>
        </div>

        <div className="flex gap-2">
          {permissions.hasPermission('users:create') && (
            <Button variant="outline" onClick={() => setShowCreateParentModal(true)}>
              <UserPlusIcon className="h-4 w-4 mr-2" />
              Tambah Orang Tua
            </Button>
          )}
          {user?.role !== "admin" && user?.role !== "super_admin" && (
            <PermissionGuard userRole={user?.role || "parent"} permissions={["patients:create"]}>
              <Button
                className="bg-green-700 hover:bg-green-800"
                onClick={() => { fetchParents(); setShowCreatePatientModal(true); }}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                {user?.role === "parent" ? "Tambah Anak" : "Tambah Pasien"}
              </Button>
            </PermissionGuard>
          )}
        </div>
      </div>

      {/* Overview Stats — parent view shows session stats, others show general stats */}
      {user?.role === "parent" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CalendarIcon className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{completedSessions}</h3>
                <p className="text-gray-600">Sesi yang Sudah Dilalui</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ClockIcon className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {filteredPatients.reduce((sum, p) => sum + (p.sessionProgress?.completed || 0), 0)}
                  <span className="text-lg text-gray-400">
                    /{filteredPatients.reduce((sum, p) => sum + (p.tokenBalance || 0), 0)}
                  </span>
                </h3>
                <p className="text-gray-600">Sesi Terlaksana / Dibeli</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BabyIcon className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{filteredPatients.length}</h3>
                <p className="text-gray-600">Total Pasien</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CalendarIcon className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {filteredPatients.reduce((sum, patient) => sum + (patient.sessionsThisMonth || 0), 0)}
                </h3>
                <p className="text-gray-600">Sesi Bulan Ini</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUpIcon className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {Math.round(filteredPatients.reduce((sum, patient) =>
                    sum + (patient.currentPrograms?.reduce((pSum, program) => pSum + program.progress, 0) || 0) /
                    (patient.currentPrograms?.length || 1), 0
                  ) / (filteredPatients.length || 1))}%
                </h3>
                <p className="text-gray-600">Rata-rata Progress</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <SearchIcon className="h-5 w-5 text-gray-600 mr-2" />
            Cari &amp; Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder={user?.role === "parent" ? "Cari nama anak... (tekan Enter)" : "Cari pasien atau orang tua... (tekan Enter)"}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); runSearch(); } }}
                className="w-full"
              />
              <Button type="button" variant="outline" onClick={runSearch}>
                <SearchIcon className="h-4 w-4" />
              </Button>
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
              options={[
                { value: "all", label: "Semua Status" },
                { value: "active", label: "Aktif" },
                { value: "inactive", label: "Tidak Aktif" },
                { value: "pending", label: "Tertunda" }
              ]}
              className="w-full sm:w-48"
            />
          </div>
        </CardContent>
      </Card>

      {/* Patient Cards - Role-specific rendering */}
      <div className="space-y-6">
        {user?.role === "parent" ? (
          // Parent view: Children cards with detailed progress
          filteredPatients.map((child) => (
            <Card key={child.id} className="overflow-hidden">
              <CardHeader className="bg-linear-to-r from-green-50 to-teal-50">
                <div className="flex justify-between items-start">
                  <div
                    className="flex items-center space-x-4 cursor-pointer group"
                    onClick={() => router.push(`/dashboard/patients/${child.id}`)}
                    title="Lihat detail profil"
                  >
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-teal-200 bg-teal-50 flex items-center justify-center shrink-0 relative">
                      <span className="text-2xl font-bold text-teal-600">{child.name.charAt(0).toUpperCase()}</span>
                      {child.photoUrl && (
                        <img src={child.photoUrl} alt={child.name} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-xl text-gray-900 group-hover:text-teal-700 group-hover:underline">{child.name}</CardTitle>
                      <CardDescription className="flex items-center space-x-4">
                        <span>{calculateAge(child.birthDate || "")} tahun ({child.gender})</span>
                        <span>•</span>
                        <span>Lahir: {new Date(child.birthDate || "").toLocaleDateString('id-ID')}</span>
                      </CardDescription>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">
                          {child.diagnosis}
                        </Badge>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          child.sessionProgress
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {child.sessionProgress
                            ? `${child.sessionProgress.completed}/${child.sessionProgress.total} sesi`
                            : 'Belum ada sesi'}
                        </span>
                        {!!child.weeklyFrequency && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                            Terapi {child.weeklyFrequency}x/minggu
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreVerticalIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Assigned Therapist */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <UserIcon className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">Terapis yang Ditugaskan</p>
                      <p className="text-sm text-gray-600">
                        {child.assignedTherapist?.name} - {child.assignedTherapist?.specialty}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!child.assignedTherapist?.id}
                    onClick={() => {
                      if (child.assignedTherapist?.id) {
                        router.push(
                          `/dashboard/messages?therapistId=${child.assignedTherapist.id}&childId=${child.id}`
                        );
                      }
                    }}
                  >
                    Hubungi
                  </Button>
                </div>

                {/* Active packages */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Paket Terapi Aktif</h3>
                  {child.therapyBalance && Object.keys(child.therapyBalance).length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(child.therapyBalance).map(([type, total]) => (
                        <div key={type} className="flex-1 min-w-[120px] rounded-xl border border-teal-100 bg-teal-50 p-3 text-center">
                          <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-1">{type}</p>
                          <p className="text-2xl font-bold text-teal-800">{total}</p>
                          <p className="text-xs text-teal-600">sesi tersisa</p>
                          {child.sessionProgress && (
                            <p className="text-xs text-gray-500 mt-1">
                              {child.sessionProgress.completed} terlaksana
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border-2 border-dashed border-gray-200 py-6 text-center">
                      <p className="text-sm text-gray-400">Belum ada paket terapi aktif</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  <Link href={`/dashboard/patients/${child.id}`}>
                    <Button size="sm" className="bg-green-700 hover:bg-green-800">
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Lihat Detail
                    </Button>
                  </Link>
                  <Link href={`/dashboard/patients/${child.id}/progress`}>
                    <Button size="sm" variant="outline">
                      <TrendingUpIcon className="h-4 w-4 mr-1" />
                      Lihat Progress
                    </Button>
                  </Link>
                  <Link href={`/dashboard/appointments?patientId=${child.id}`}>
                    <Button size="sm" variant="outline">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Jadwal Sesi
                    </Button>
                  </Link>
                  <Link href={`/dashboard/reports?patientId=${child.id}`}>
                    <Button size="sm" variant="outline">
                      <FileTextIcon className="h-4 w-4 mr-1" />
                      Laporan
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          // Admin + Therapist view: grouped by parent
          <div className="space-y-4">
            {displayParents.map(parent => {
              const children = filteredPatients.filter(
                p => p.parent?.id === parent._id || p.parent?.id === parent._id.toString()
              );
              return (
                <Card key={parent._id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">
                          {parent.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{parent.name}</h3>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                            <span><MailIcon className="inline h-3 w-3 mr-1" />{parent.email}</span>
                            {parent.phone && <span><PhoneIcon className="inline h-3 w-3 mr-1" />{parent.phone}</span>}
                          </div>
                        </div>
                      </div>
                      {permissions.hasPermission('patients:edit') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setCreatePatientForm(prev => ({ ...prev, parentId: parent._id }));
                            fetchParents();
                            setShowCreatePatientModal(true);
                          }}
                        >
                          <PlusIcon className="h-4 w-4 mr-1" />
                          Tambah Anak
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {children.length === 0 ? (
                      <p className="text-sm text-gray-400 italic py-2">Belum ada anak terdaftar</p>
                    ) : (
                      <div className="space-y-2">
                        {children.map(child => (
                          <div key={child.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div
                              className="flex items-center space-x-3 cursor-pointer group flex-1 min-w-0"
                              onClick={() => router.push(`/dashboard/patients/${child.id}`)}
                              title="Lihat detail profil"
                            >
                              <div className="w-9 h-9 rounded-full overflow-hidden border border-teal-200 bg-teal-50 flex items-center justify-center shrink-0 relative">
                                <span className="text-sm font-bold text-teal-600">{child.name.charAt(0).toUpperCase()}</span>
                                {child.photoUrl && (
                                  <img src={child.photoUrl} alt={child.name} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm text-gray-900 group-hover:text-teal-700 group-hover:underline truncate">{child.name}</p>
                                <p className="text-xs text-gray-500">
                                  {child.age} thn &bull; {child.gender === 'male' ? 'L' : 'P'} &bull; {child.diagnosis}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                child.sessionProgress
                                  ? 'bg-teal-100 text-teal-800'
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                {child.sessionProgress
                                  ? `${child.sessionProgress.completed}/${child.sessionProgress.total} sesi`
                                  : 'Belum ada sesi'}
                              </span>
                              {!!child.weeklyFrequency && (
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                                  {child.weeklyFrequency}x/minggu
                                </span>
                              )}
                              <Badge variant={child.status === 'active' ? 'default' : 'secondary'}>
                                {child.status === 'active' ? 'Aktif' : child.status === 'inactive' ? 'Tidak Aktif' : 'Tertunda'}
                              </Badge>
                              <Link href={`/dashboard/patients/${child.id}`}>
                                <Button size="sm" variant="outline">
                                  <EyeIcon className="h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            {displayParents.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  <UsersIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium text-gray-900">
                    {permissions.hasPermission('users:view') ? 'Belum ada orang tua terdaftar' : 'Tidak ada pasien yang ditugaskan'}
                  </p>
                  <p className="text-sm mt-1">
                    {permissions.hasPermission('users:view')
                      ? 'Tambahkan orang tua terlebih dahulu, lalu tambahkan anak mereka.'
                      : 'Hubungi admin untuk penugasan pasien.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Create Patient Modal */}
      <Dialog open={showCreatePatientModal} onOpenChange={setShowCreatePatientModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Data Pasien</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {createPatientError && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {createPatientError}
              </div>
            )}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Nama Anak <span className="text-red-500">*</span></label>
              <Input
                placeholder="Nama lengkap anak"
                value={createPatientForm.name}
                onChange={(e) => setCreatePatientForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Tanggal Lahir <span className="text-red-500">*</span></label>
              <DatePicker
                value={createPatientForm.dateOfBirth}
                onChange={(val) => setCreatePatientForm(prev => ({ ...prev, dateOfBirth: val }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Jenis Kelamin <span className="text-red-500">*</span></label>
              <select
                value={createPatientForm.gender}
                onChange={(e) => setCreatePatientForm(prev => ({ ...prev, gender: e.target.value }))}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="male">Laki-laki</option>
                <option value="female">Perempuan</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Diagnosa / Kondisi</label>
              <Input
                placeholder="Contoh: Autisme Spektrum"
                value={createPatientForm.diagnosis}
                onChange={(e) => setCreatePatientForm(prev => ({ ...prev, diagnosis: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Orang Tua <span className="text-red-500">*</span></label>
              <select
                value={createPatientForm.parentId}
                onChange={(e) => setCreatePatientForm(prev => ({ ...prev, parentId: e.target.value }))}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">-- Pilih Orang Tua --</option>
                {parentsList.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.email})
                  </option>
                ))}
              </select>
              {parentsList.length === 0 && (
                <p className="text-xs text-amber-600">Belum ada akun orang tua. Buat akun orang tua terlebih dahulu.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreatePatientModal(false)} disabled={isCreatingPatient}>
              Batal
            </Button>
            <Button
              className="bg-green-700 hover:bg-green-800"
              onClick={handleCreatePatient}
              disabled={isCreatingPatient}
            >
              {isCreatingPatient ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Parent Modal */}
      <Dialog open={showCreateParentModal} onOpenChange={setShowCreateParentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Akun Orang Tua</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {createParentError && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {createParentError}
              </div>
            )}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Nama Lengkap <span className="text-red-500">*</span></label>
              <Input
                placeholder="Nama lengkap orang tua"
                value={createParentForm.name}
                onChange={(e) => setCreateParentForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={createParentForm.email}
                onChange={(e) => setCreateParentForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Password Awal <span className="text-red-500">*</span></label>
              <Input
                type="password"
                placeholder="Min. 8 karakter"
                value={createParentForm.password}
                onChange={(e) => setCreateParentForm(prev => ({ ...prev, password: e.target.value }))}
              />
              <p className="text-xs text-gray-500">Pengguna akan diminta mengganti password saat pertama kali login.</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Nomor Telepon</label>
              <Input
                type="tel"
                placeholder="+62812xxxxxxxx"
                value={createParentForm.phone}
                onChange={(e) => setCreateParentForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateParentModal(false)} disabled={isCreatingParent}>
              Batal
            </Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              onClick={handleCreateParent}
              disabled={isCreatingParent}
            >
              {isCreatingParent ? "Membuat..." : "Buat Akun"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Loading Skeleton ─────────────────────────────────────────────────────────

function PatientsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <Skeleton className="h-7 w-12" />
                <Skeleton className="h-4 w-28" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and filter */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full rounded-md" />
        </CardContent>
      </Card>

      {/* Patient cards */}
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="bg-gray-50">
              <div className="flex items-center space-x-4">
                <Skeleton className="w-16 h-16 rounded-full shrink-0" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3.5 w-56" />
                  <div className="flex gap-2 mt-2">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
