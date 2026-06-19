"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { usePermissions, PermissionGuard } from "@/lib/utils/permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Select } from "@/components/ui/select";
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
  tokenBalance?: number;
  createdAt?: string;
}

export default function UnifiedPatientsPage() {
  const { user } = useAuth();
  const permissions = usePermissions(user?.role || "parent");

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
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
    if (user?.role === 'admin') fetchAllParents();
  }, [user]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/children', {
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
                frequency: "2x/minggu",
                progress: child.progressScore || 50,
                nextSession: child.nextSession || new Date().toISOString()
              }
            ] : [],
            notes: child.notes || '',
            sessionsThisMonth: child.sessionsThisMonth || ((child.therapist || child.therapistId) ? 6 : 0),
            lastSession: child.lastSession,
            nextSession: child.nextSession,
            progressScore: child.progressScore || 0,
            tokenBalance: child.tokenBalance ?? 0,
            createdAt: child.createdAt
          };
          });
          setPatients(convertedPatients);
        }
      } else {
        console.error('Failed to fetch patients:', response.statusText);
        // Fallback to empty array
        setPatients([]);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Memuat pasien...</p>
        </div>
      </div>
    );
  }

  // If no patients loaded, use empty array
  if (patients.length === 0 && !loading) {
    console.log('No patients loaded from API');
  }

  // Filter patients based on role
  const getFilteredPatients = () => {
    let filtered = patients;

    // Role-based filtering
    if (user?.role === "parent") {
      // Parents only see their own children
      filtered = patients.filter(patient => patient.parent?.name === user.name);
    }
    // Admin and therapist see all patients (therapist is view-only)

    // Search filtering
    if (searchTerm.trim()) {
      filtered = filtered.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filtering
    if (statusFilter !== "all") {
      filtered = filtered.filter(patient => patient.status === statusFilter);
    }

    return filtered;
  };

  const filteredPatients = getFilteredPatients();

  // For therapist: derive unique parents from their assigned patients
  // For admin: use allParents (fetched separately, includes parents with no children)
  const displayParents = user?.role === 'admin'
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
      })();

  const getPageTitle = () => {
    switch (user?.role) {
      case "admin": return "Kelola Semua Pasien";
      case "therapist": return "Pasien yang Ditugaskan";
      case "parent": return "Anak Saya";
      default: return "Pasien";
    }
  };

  const getPageDescription = () => {
    switch (user?.role) {
      case "admin": return "Kelola semua pasien dalam sistem";
      case "therapist": return "Kelola pasien yang ditugaskan dan sesi terapi Anda";
      case "parent": return "Kelola profil dan pantau perkembangan anak Anda";
      default: return "Manajemen pasien";
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "text-green-600";
    if (progress >= 60) return "text-teal-600";
    if (progress >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressBgColor = (progress: number) => {
    if (progress >= 80) return "bg-green-600";
    if (progress >= 60) return "bg-teal-600";
    if (progress >= 40) return "bg-yellow-600";
    return "bg-red-600";
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
          {user?.role === "admin" && (
            <Button variant="outline" onClick={() => setShowCreateParentModal(true)}>
              <UserPlusIcon className="h-4 w-4 mr-2" />
              Tambah Orang Tua
            </Button>
          )}
          {user?.role !== "admin" && (
            <PermissionGuard userRole={user?.role || "parent"} permissions={["patients:create"]}>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => { fetchParents(); setShowCreatePatientModal(true); }}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                {user?.role === "parent" ? "Tambah Anak" : "Tambah Pasien"}
              </Button>
            </PermissionGuard>
          )}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <BabyIcon className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{filteredPatients.length}</h3>
              <p className="text-gray-600">
                {user?.role === "parent" ? "Total Anak" : "Total Pasien"}
              </p>
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
            <div className="flex-1">
              <Input
                placeholder={user?.role === "parent" ? "Cari nama anak..." : "Cari pasien..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
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
              <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <BabyIcon className="h-8 w-8 text-teal-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-gray-900">{child.name}</CardTitle>
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
                          (child.tokenBalance ?? 0) > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {child.tokenBalance ?? 0} Token
                        </span>
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
                  <Button size="sm" variant="outline">Hubungi</Button>
                </div>

                {/* Current Programs */}
                {child.currentPrograms && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Program Terapi Saat Ini</h3>
                    <div className="space-y-3">
                      {child.currentPrograms.map((program) => (
                        <div key={program.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-medium text-gray-900">{program.name}</h4>
                              <p className="text-sm text-gray-600">Frekuensi: {program.frequency}</p>
                            </div>
                            <div className="text-right">
                              <span className={`text-lg font-bold ${getProgressColor(program.progress)}`}>
                                {program.progress}%
                              </span>
                              <p className="text-xs text-gray-500">Progress</p>
                            </div>
                          </div>

                          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${getProgressBgColor(program.progress)}`}
                              style={{ width: `${program.progress}%` }}
                            ></div>
                          </div>

                          <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center text-gray-600">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              Sesi berikutnya: {new Date(program.nextSession).toLocaleDateString('id-ID')}
                            </div>
                            <Button size="sm" variant="outline">Lihat Detail</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  <Link href={`/dashboard/patients/${child.id}`}>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
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
                      {user?.role === 'admin' && (
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
                            <div className="flex items-center space-x-3">
                              <BabyIcon className="h-5 w-5 text-teal-500" />
                              <div>
                                <p className="font-medium text-sm text-gray-900">{child.name}</p>
                                <p className="text-xs text-gray-500">
                                  {child.age} thn &bull; {child.gender === 'male' ? 'L' : 'P'} &bull; {child.diagnosis}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                (child.tokenBalance ?? 0) > 0
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {child.tokenBalance ?? 0} Token
                              </span>
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
                    {user?.role === 'admin' ? 'Belum ada orang tua terdaftar' : 'Tidak ada pasien yang ditugaskan'}
                  </p>
                  <p className="text-sm mt-1">
                    {user?.role === 'admin'
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
              className="bg-green-600 hover:bg-green-700"
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
