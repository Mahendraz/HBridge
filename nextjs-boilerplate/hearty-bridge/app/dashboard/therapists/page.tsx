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
} from "lucide-react";

interface Therapist {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  specializations: string[];
  status: 'active' | 'inactive' | 'on-leave';
  assignedPatients: number;
  maxPatients: number;
}

export default function TherapistsPage() {
  const { user } = useAuth();
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

  // Only allow admin access to this page
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

  useEffect(() => {
    fetchTherapists();
  }, []);

  useEffect(() => {
    filterTherapists();
  }, [therapists, searchTerm, statusFilter, specializationFilter]);

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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'on-leave': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'inactive': return 'Tidak Aktif';
      case 'on-leave': return 'Cuti';
      default: return status;
    }
  };

  const TherapistCard = ({ therapist }: { therapist: Therapist }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar initial */}
            <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-lg shrink-0">
              {therapist.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 leading-snug truncate">
                {therapist.name}
              </p>
              {/* Specialization badges — max 2 + overflow count */}
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
          <Badge variant={getStatusBadgeVariant(therapist.status)} className="shrink-0 mt-0.5">
            {getStatusLabel(therapist.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contact info */}
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

        {/* Stats */}
        <div className="pt-3 border-t border-gray-100">
          <div className="text-center bg-gray-50 rounded-lg py-2.5">
            <p className="text-lg font-bold text-gray-900">{therapist.assignedPatients}</p>
            <p className="text-xs text-gray-500">Pasien Aktif</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            Lihat Profil
          </Button>
          <PermissionGuard
            userRole={user?.role || "parent"}
            permissions={["therapists:edit"]}
          >
            <Button variant="outline" size="sm">
              <EditIcon className="h-4 w-4" />
            </Button>
          </PermissionGuard>
        </div>
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
            <TherapistCard key={therapist._id} therapist={therapist} />
          ))}
        </div>
      )}

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
