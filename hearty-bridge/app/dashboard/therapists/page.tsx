"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { usePermissions, PermissionGuard } from "@/lib/utils/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  UserPlusIcon,
  UserIcon,
  PhoneIcon,
  MailIcon,
  EditIcon,
  PowerIcon,
  CalendarOffIcon,
  UmbrellaIcon,
  BanIcon,
  XIcon,
  PlusIcon,
  AlertCircleIcon,
} from "lucide-react";

interface Therapist {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  specializations: string[];
  status: 'active' | 'inactive' | 'on-leave';
  currentLeave?: string | null;
  assignedPatients: number;
  maxPatients: number;
}

interface LeaveRecord {
  _id: string;
  userId: string;
  userName: string;
  type: 'cuti' | 'inactive';
  startDate: string;
  endDate: string | null;
  reason: string;
  status: 'active' | 'cancelled';
  createdByName: string;
}

export default function TherapistsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const permissions = usePermissions(user?.role || "parent");
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [filteredTherapists, setFilteredTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [specializationFilter, setSpecializationFilter] = useState("all");
  const [stats, setStats] = useState({ total: 0, active: 0 });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '', email: '', password: '', specialization: '',
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Edit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTherapist, setEditingTherapist] = useState<Therapist | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', specialization: '' });
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Deactivate state
  const [confirmDeactivate, setConfirmDeactivate] = useState<Therapist | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  // Leave management state
  const [leaveModalTherapist, setLeaveModalTherapist] = useState<Therapist | null>(null);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    type: 'cuti' as 'cuti' | 'inactive',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [leaveFormError, setLeaveFormError] = useState<string | null>(null);
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [cancellingLeaveId, setCancellingLeaveId] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchTherapists();
  }, [user]);

  useEffect(() => {
    filterTherapists();
  }, [therapists, searchTerm, statusFilter, specializationFilter]);

  if (authLoading) {
    return <div className="p-8 text-center text-gray-400">Memuat...</div>;
  }

  if (!permissions.hasPermission("therapists:view")) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-500 text-lg">Akses Ditolak</div>
        <div className="text-gray-600 text-sm">
          Anda tidak memiliki izin untuk melihat konten ini
        </div>
      </div>
    );
  }

  const fetchTherapists = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/therapists', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        // SuccessResponse.ok spreads fields into root (no .data wrapper)
        const data = result.success && result.therapists ? result.therapists : [];
        setTherapists(data);
        setStats({
          total: result.total ?? data.length,
          active: result.active ?? data.filter((t: any) => t.status === 'active').length,
        });
      } else {
        console.error('Failed to fetch therapists:', response.statusText);
        setTherapists([]);
      }
    } catch (error) {
      console.error('Error fetching therapists:', error);
      setTherapists([]);
    } finally {
      setLoading(false);
    }
  };

  const filterTherapists = () => {
    let filtered = [...therapists];

    if (searchTerm) {
      filtered = filtered.filter(therapist =>
        therapist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        therapist.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        therapist.specializations.some(spec =>
          spec.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(therapist => therapist.status === statusFilter);
    }

    if (specializationFilter !== "all") {
      filtered = filtered.filter(therapist =>
        therapist.specializations.includes(specializationFilter)
      );
    }

    setFilteredTherapists(filtered);
  };

  const handleCreateTherapist = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) {
      setCreateError('Nama, email, dan password wajib diisi.');
      return;
    }
    setCreateError(null);
    setIsCreating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: createForm.name,
          email: createForm.email,
          password: createForm.password,
          role: 'therapist',
          specialization: createForm.specialization || undefined,
        }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setShowCreateModal(false);
        setCreateForm({ name: '', email: '', password: '', specialization: '' });
        fetchTherapists();
      } else {
        setCreateError(result.error || result.message || 'Gagal membuat akun terapis.');
      }
    } catch {
      setCreateError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsCreating(false);
    }
  };

  const openEditModal = (therapist: Therapist) => {
    setEditingTherapist(therapist);
    setEditForm({
      name: therapist.name,
      email: therapist.email,
      phone: therapist.phone || '',
      specialization: therapist.specializations.join(', '),
    });
    setEditError(null);
    setShowEditModal(true);
  };

  const handleEditTherapist = async () => {
    if (!editingTherapist || !editForm.name || !editForm.email) {
      setEditError('Nama dan email wajib diisi.');
      return;
    }
    setEditError(null);
    setIsEditing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${editingTherapist._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone || undefined,
          specialization: editForm.specialization || undefined,
        }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setShowEditModal(false);
        setEditingTherapist(null);
        fetchTherapists();
      } else {
        setEditError(result.error || result.message || 'Gagal memperbarui data terapis.');
      }
    } catch {
      setEditError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeactivateTherapist = async () => {
    if (!confirmDeactivate) return;
    setIsDeactivating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${confirmDeactivate._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        setConfirmDeactivate(null);
        fetchTherapists();
      }
    } catch {
      // silently fail
    } finally {
      setIsDeactivating(false);
    }
  };

  // ── Leave management ──────────────────────────────────────────────────────

  const openLeaveModal = async (therapist: Therapist) => {
    setLeaveModalTherapist(therapist);
    setLeaves([]);
    setLeaveForm({ type: 'cuti', startDate: '', endDate: '', reason: '' });
    setLeaveFormError(null);
    setLeaveLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/therapist-leaves?userId=${therapist._id}&status=all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const result = await res.json();
        setLeaves(result.leaves ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLeaveLoading(false);
    }
  };

  const handleCreateLeave = async () => {
    if (!leaveModalTherapist || !leaveForm.startDate) {
      setLeaveFormError('Tanggal mulai wajib diisi.');
      return;
    }
    if (leaveForm.endDate && leaveForm.endDate < leaveForm.startDate) {
      setLeaveFormError('Tanggal selesai tidak boleh sebelum tanggal mulai.');
      return;
    }
    setLeaveFormError(null);
    setLeaveSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/therapist-leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          userId: leaveModalTherapist._id,
          type: leaveForm.type,
          startDate: leaveForm.startDate,
          endDate: leaveForm.endDate || null,
          reason: leaveForm.reason,
        }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setLeaveForm({ type: 'cuti', startDate: '', endDate: '', reason: '' });
        await openLeaveModal(leaveModalTherapist);
        fetchTherapists();
      } else {
        setLeaveFormError(result.error || 'Gagal menyimpan cuti.');
      }
    } catch {
      setLeaveFormError('Terjadi kesalahan.');
    } finally {
      setLeaveSubmitting(false);
    }
  };

  const handleCancelLeave = async (leaveId: string) => {
    setCancellingLeaveId(leaveId);
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/therapist-leaves/${leaveId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (leaveModalTherapist) await openLeaveModal(leaveModalTherapist);
      fetchTherapists();
    } catch {
      // silently fail
    } finally {
      setCancellingLeaveId(null);
    }
  };

  const handleReactivateTherapist = async (therapist: Therapist) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/admin/users/${therapist._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isActive: true }),
      });
      fetchTherapists();
    } catch {
      // silently fail
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':   return 'bg-green-100 text-green-700 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-500 border-gray-200';
      case 'on-leave': return 'bg-amber-100 text-amber-700 border-amber-200';
      default:         return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':   return 'Aktif';
      case 'inactive': return 'Tidak Aktif';
      case 'on-leave': return 'Cuti';
      default: return status;
    }
  };

  const TherapistCard = ({
    therapist,
    onEdit,
    onDeactivate,
    onReactivate,
    onManageLeave,
  }: {
    therapist: Therapist;
    onEdit: (t: Therapist) => void;
    onDeactivate: (t: Therapist) => void;
    onReactivate: (t: Therapist) => void;
    onManageLeave: (t: Therapist) => void;
  }) => (
    <Card className={`hover:shadow-md transition-shadow ${therapist.status === 'inactive' && !therapist.currentLeave ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
              therapist.status === 'on-leave' ? 'bg-amber-100 text-amber-700' :
              therapist.status === 'inactive' ? 'bg-gray-100 text-gray-400' :
              'bg-teal-100 text-teal-700'
            }`}>
              {therapist.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 leading-snug truncate">
                {therapist.name}
              </p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {therapist.specializations.slice(0, 2).map((spec, i) => (
                  <Badge key={i} variant="outline" className="text-xs text-teal-700 border-teal-300 px-1.5">
                    {spec}
                  </Badge>
                ))}
                {therapist.specializations.length > 2 && (
                  <Badge variant="outline" className="text-xs text-gray-500 px-1.5">
                    +{therapist.specializations.length - 2}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <span className={`shrink-0 mt-0.5 text-xs font-medium px-2 py-1 rounded-full border ${getStatusBadge(therapist.status)}`}>
            {getStatusLabel(therapist.status)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <MailIcon className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="truncate">{therapist.email}</span>
          </div>
          {therapist.phone && therapist.phone !== '+1-555-0000' ? (
            <div className="flex items-center gap-2 text-gray-600">
              <PhoneIcon className="h-4 w-4 text-gray-400 shrink-0" />
              <span>{therapist.phone}</span>
            </div>
          ) : null}
        </div>

        <div className="pt-3 border-t border-gray-100">
          <div className="text-center bg-gray-50 rounded-lg py-2.5">
            <p className="text-lg font-bold text-gray-900">{therapist.assignedPatients}</p>
            <p className="text-xs text-gray-500">Pasien Aktif</p>
          </div>
        </div>

        <PermissionGuard userRole={user?.role || "parent"} permissions={["therapists:edit"]}>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(therapist)}>
              <EditIcon className="h-4 w-4 mr-1.5" />
              Edit
            </Button>
            {/* Leave management — super_admin only */}
            {user?.role === 'super_admin' && (
              <Button
                variant="outline"
                size="sm"
                className="text-amber-600 border-amber-200 hover:bg-amber-50"
                onClick={() => onManageLeave(therapist)}
                title="Kelola Cuti / Nonaktif"
              >
                <CalendarOffIcon className="h-4 w-4" />
              </Button>
            )}
            {therapist.status === 'inactive' && !therapist.currentLeave ? (
              <Button
                variant="outline"
                size="sm"
                className="text-green-700 border-green-300 hover:bg-green-50"
                onClick={() => onReactivate(therapist)}
                title="Aktifkan kembali"
              >
                <PowerIcon className="h-4 w-4" />
              </Button>
            ) : therapist.status === 'active' ? (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => onDeactivate(therapist)}
                title="Nonaktifkan akun"
              >
                <PowerIcon className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </PermissionGuard>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Memuat terapis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Terapis</h1>
          <p className="text-gray-600">Kelola terapis dan penugasan mereka</p>
        </div>

        <PermissionGuard
          userRole={user?.role || "parent"}
          permissions={["therapists:create", "therapists:invite"]}
        >
          <Button onClick={() => setShowCreateModal(true)}>
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Tambah Terapis
          </Button>
        </PermissionGuard>
      </div>

      {/* Summary */}
      <p className="text-sm text-gray-500">
        {stats.total} terapis terdaftar · {stats.active} aktif
      </p>

      {/* Therapists Grid */}
      {filteredTherapists.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada terapis ditemukan</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== "all" || specializationFilter !== "all"
                ? "Coba sesuaikan kriteria pencarian Anda."
                : "Mulai dengan menambahkan terapis pertama Anda."
              }
            </p>

            <PermissionGuard
              userRole={user?.role || "parent"}
              permissions={["therapists:create", "therapists:invite"]}
            >
              <Button onClick={() => setShowCreateModal(true)}>
                <UserPlusIcon className="h-5 w-5 mr-2" />
                Tambah Terapis
              </Button>
            </PermissionGuard>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTherapists.map(therapist => (
            <TherapistCard
              key={therapist._id}
              therapist={therapist}
              onEdit={openEditModal}
              onDeactivate={setConfirmDeactivate}
              onReactivate={handleReactivateTherapist}
              onManageLeave={openLeaveModal}
            />
          ))}
        </div>
      )}

      {/* Edit Therapist Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <EditIcon className="h-5 w-5 text-teal-600" />
              Edit Data Terapis
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {editError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {editError}
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700">Nama Lengkap *</label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nama terapis"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email *</label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@contoh.com"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">No. Telepon</label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+62..."
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Spesialisasi</label>
              <Input
                value={editForm.specialization}
                onChange={(e) => setEditForm(f => ({ ...f, specialization: e.target.value }))}
                placeholder="cth. Terapi Wicara, Fisioterapi"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Pisahkan dengan koma untuk beberapa spesialisasi.</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)} disabled={isEditing}>
              Batal
            </Button>
            <Button onClick={handleEditTherapist} disabled={isEditing}>
              {isEditing ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirm Dialog */}
      <Dialog open={!!confirmDeactivate} onOpenChange={(open) => !open && setConfirmDeactivate(null)}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Nonaktifkan Terapis</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            Nonaktifkan <span className="font-semibold">{confirmDeactivate?.name}</span>? Terapis tidak bisa login hingga diaktifkan kembali.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeactivate(null)} disabled={isDeactivating}>
              Batal
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeactivateTherapist}
              disabled={isDeactivating}
            >
              {isDeactivating ? 'Memproses...' : 'Nonaktifkan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Management Modal */}
      <Dialog open={!!leaveModalTherapist} onOpenChange={(open) => !open && setLeaveModalTherapist(null)}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarOffIcon className="h-5 w-5 text-amber-500" />
              Cuti &amp; Nonaktif — {leaveModalTherapist?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-1">
            {/* Existing leaves */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Riwayat Cuti</p>
              {leaveLoading ? (
                <p className="text-sm text-gray-400 text-center py-4">Memuat...</p>
              ) : leaves.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Belum ada riwayat cuti.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {leaves.map((lv) => {
                    const start = new Date(lv.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                    const end = lv.endDate
                      ? new Date(lv.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'Sampai dicabut';
                    const isActive = lv.status === 'active';
                    return (
                      <div
                        key={lv._id}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${
                          isActive ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200 opacity-60'
                        }`}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {lv.type === 'cuti'
                            ? <UmbrellaIcon className="h-4 w-4 text-amber-500" />
                            : <BanIcon className="h-4 w-4 text-red-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${lv.type === 'cuti' ? 'text-amber-700' : 'text-red-700'}`}>
                              {lv.type === 'cuti' ? 'Cuti' : 'Nonaktif'}
                            </span>
                            {!isActive && (
                              <span className="text-[10px] text-gray-400 font-medium">Dibatalkan</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-700 mt-0.5">{start} – {end}</p>
                          {lv.reason && <p className="text-xs text-gray-500 mt-0.5 truncate">{lv.reason}</p>}
                        </div>
                        {isActive && (
                          <button
                            onClick={() => handleCancelLeave(lv._id)}
                            disabled={cancellingLeaveId === lv._id}
                            className="flex-shrink-0 text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                            title="Batalkan cuti"
                          >
                            {cancellingLeaveId === lv._id ? '...' : <XIcon className="h-4 w-4" />}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add new leave form */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Tambah Baru</p>
              {leaveFormError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 mb-3">
                  <AlertCircleIcon className="h-4 w-4 shrink-0" />
                  {leaveFormError}
                </div>
              )}
              <div className="space-y-3">
                {/* Type */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Tipe</label>
                  <div className="flex gap-2 mt-1">
                    {(['cuti', 'inactive'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setLeaveForm(f => ({ ...f, type: t }))}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                          leaveForm.type === t
                            ? t === 'cuti' ? 'bg-amber-100 border-amber-400 text-amber-800' : 'bg-red-100 border-red-400 text-red-800'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {t === 'cuti' ? <UmbrellaIcon className="h-3.5 w-3.5" /> : <BanIcon className="h-3.5 w-3.5" />}
                        {t === 'cuti' ? 'Cuti' : 'Nonaktif'}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Date range */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Mulai *</label>
                    <input
                      type="date"
                      value={leaveForm.startDate}
                      onChange={(e) => setLeaveForm(f => ({ ...f, startDate: e.target.value }))}
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Selesai <span className="text-gray-400">(kosong = sampai dicabut)</span></label>
                    <input
                      type="date"
                      value={leaveForm.endDate}
                      min={leaveForm.startDate}
                      onChange={(e) => setLeaveForm(f => ({ ...f, endDate: e.target.value }))}
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>
                {/* Reason */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Keterangan</label>
                  <input
                    type="text"
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm(f => ({ ...f, reason: e.target.value }))}
                    placeholder="Alasan cuti / nonaktif (opsional)"
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveModalTherapist(null)} disabled={leaveSubmitting}>
              Tutup
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleCreateLeave}
              disabled={leaveSubmitting || !leaveForm.startDate}
            >
              {leaveSubmitting ? 'Menyimpan...' : (
                <><PlusIcon className="h-4 w-4 mr-1.5" />Simpan Cuti</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Therapist Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlusIcon className="h-5 w-5 text-teal-600" />
              Tambah Akun Terapis
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {createError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {createError}
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700">Nama Lengkap *</label>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nama terapis"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email *</label>
              <Input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@contoh.com"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Password Awal *</label>
              <Input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Minimal 8 karakter"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Terapis harus mengganti password ini saat login pertama.</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Spesialisasi</label>
              <Input
                value={createForm.specialization}
                onChange={(e) => setCreateForm(f => ({ ...f, specialization: e.target.value }))}
                placeholder="cth. Terapi Wicara, Fisioterapi"
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)} disabled={isCreating}>
              Batal
            </Button>
            <Button onClick={handleCreateTherapist} disabled={isCreating}>
              {isCreating ? 'Membuat...' : 'Buat Akun'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
