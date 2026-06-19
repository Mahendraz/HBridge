"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { usePermissions, PermissionGuard } from "@/lib/utils/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CogIcon,
  UserIcon,
  CreditCardIcon,
  MailIcon,
  PhoneIcon,
  KeyIcon,
  SaveIcon,
  EyeIcon,
  EyeOffIcon
} from "lucide-react";

interface UserSettings {
  profile: {
    name: string;
    email: string;
    phone: string;
    timezone: string;
    language: string;
  };
}

interface SystemSettings {
  general: {
    siteName: string;
    supportEmail: string;
    timezone: string;
    maintenanceMode: boolean;
  };
  scheduling: {
    defaultSessionDuration: number;
    bufferTime: number;
    workingHours: {
      start: string;
      end: string;
    };
    workingDays: string[];
  };
  security: {
    passwordPolicy: {
      minLength: number;
      requireNumbers: boolean;
      requireSymbols: boolean;
      requireUppercase: boolean;
    };
    sessionTimeout: number;
    maxLoginAttempts: number;
  };
  billing: {
    currency: string;
    taxRate: number;
    paymentMethods: string[];
    invoiceSettings: {
      autoSend: boolean;
      reminderDays: number;
    };
  };
}

export default function SettingsPage() {
  const { user } = useAuth();
  const permissions = usePermissions(user?.role || "parent");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // User settings state
  const [userSettings, setUserSettings] = useState<UserSettings>({
    profile: {
      name: "",
      email: "",
      phone: "",
      timezone: "UTC",
      language: "id"
    },
  });

  // System settings state (admin only)
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    general: {
      siteName: "Hearty Bridge",
      supportEmail: "support@heartybridge.com",
      timezone: "UTC",
      maintenanceMode: false
    },
    scheduling: {
      defaultSessionDuration: 60,
      bufferTime: 15,
      workingHours: {
        start: "09:00",
        end: "17:00"
      },
      workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"]
    },
    security: {
      passwordPolicy: {
        minLength: 8,
        requireNumbers: true,
        requireSymbols: true,
        requireUppercase: true
      },
      sessionTimeout: 24,
      maxLoginAttempts: 5
    },
    billing: {
      currency: "IDR",
      taxRate: 0.11,
      paymentMethods: ["credit_card", "bank_transfer"],
      invoiceSettings: {
        autoSend: true,
        reminderDays: 7
      }
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);

      // Fetch user settings
      if (user) {
        setUserSettings(prev => ({
          ...prev,
          profile: {
            ...prev.profile,
            name: user.name,
            email: user.email,
            phone: user.phone || ""
          }
        }));
      }

      // Fetch system settings if admin
      if (permissions.hasPermission("settings:system")) {
        const response = await fetch('/api/settings/system');
        if (response.ok) {
          const data = await response.json();
          setSystemSettings(data);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveUserSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/settings/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userSettings)
      });

      if (response.ok) {
        // Show success message
        console.log('Settings saved successfully');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const saveSystemSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/settings/system', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(systemSettings)
      });

      if (response.ok) {
        // Show success message
        console.log('System settings saved successfully');
      }
    } catch (error) {
      console.error('Error saving system settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const getPageTitle = () => {
    if (permissions.hasPermission("settings:system")) {
      return "Pengaturan Sistem";
    }
    return "Pengaturan Akun";
  };

  const getPageDescription = () => {
    if (permissions.hasPermission("settings:system")) {
      return "Kelola konfigurasi dan preferensi sistem";
    }
    return "Kelola preferensi dan pengaturan akun Anda";
  };

  if (loading) {
    return (

        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Memuat pengaturan...</p>
          </div>
        </div>

    );
  }

  return (

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
          <p className="text-gray-600">{getPageDescription()}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <UserIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Profil</span>
            </TabsTrigger>

            <PermissionGuard
              userRole={user?.role || "parent"}
              permissions={["settings:system"]}
            >
              <TabsTrigger value="system" className="flex items-center space-x-2">
                <CogIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Sistem</span>
              </TabsTrigger>

              <TabsTrigger value="security" className="flex items-center space-x-2">
                <KeyIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Keamanan</span>
              </TabsTrigger>

              <TabsTrigger value="billing" className="flex items-center space-x-2">
                <CreditCardIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Tagihan</span>
              </TabsTrigger>
            </PermissionGuard>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserIcon className="h-5 w-5 mr-2" />
                  Informasi Profil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Nama Lengkap</label>
                    <Input
                      value={userSettings.profile.name}
                      onChange={(e) => setUserSettings(prev => ({
                        ...prev,
                        profile: { ...prev.profile, name: e.target.value }
                      }))}
                      placeholder="Masukkan nama lengkap Anda"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Alamat Email</label>
                    <div className="relative">
                      <MailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        type="email"
                        value={userSettings.profile.email}
                        onChange={(e) => setUserSettings(prev => ({
                          ...prev,
                          profile: { ...prev.profile, email: e.target.value }
                        }))}
                        className="pl-10"
                        placeholder="Masukkan email Anda"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Nomor Telepon</label>
                    <div className="relative">
                      <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        type="tel"
                        value={userSettings.profile.phone}
                        onChange={(e) => setUserSettings(prev => ({
                          ...prev,
                          profile: { ...prev.profile, phone: e.target.value }
                        }))}
                        className="pl-10"
                        placeholder="Masukkan nomor telepon Anda"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Zona Waktu</label>
                    <Select
                      value={userSettings.profile.timezone}
                      onValueChange={(value) => setUserSettings(prev => ({
                        ...prev,
                        profile: { ...prev.profile, timezone: value }
                      }))}
                      options={[
                        { value: "UTC", label: "UTC" },
                        { value: "Asia/Jakarta", label: "WIB (Jakarta)" },
                        { value: "Asia/Makassar", label: "WITA (Makassar)" },
                        { value: "Asia/Jayapura", label: "WIT (Jayapura)" },
                        { value: "America/New_York", label: "Eastern Time" }
                      ]}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={saveUserSettings} disabled={saving}>
                    <SaveIcon className="h-4 w-4 mr-2" />
                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings (Admin Only) */}
          <PermissionGuard
            userRole={user?.role || "parent"}
            permissions={["settings:system"]}
          >
            <TabsContent value="system" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CogIcon className="h-5 w-5 mr-2" />
                    Pengaturan Sistem Umum
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Nama Situs</label>
                      <Input
                        value={systemSettings.general.siteName}
                        onChange={(e) => setSystemSettings(prev => ({
                          ...prev,
                          general: { ...prev.general, siteName: e.target.value }
                        }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Email Dukungan</label>
                      <Input
                        type="email"
                        value={systemSettings.general.supportEmail}
                        onChange={(e) => setSystemSettings(prev => ({
                          ...prev,
                          general: { ...prev.general, supportEmail: e.target.value }
                        }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Zona Waktu Default</label>
                      <Select
                        value={systemSettings.general.timezone}
                        onValueChange={(value) => setSystemSettings(prev => ({
                          ...prev,
                          general: { ...prev.general, timezone: value }
                        }))}
                        options={[
                          { value: "UTC", label: "UTC" },
                          { value: "Asia/Jakarta", label: "WIB (Jakarta)" },
                          { value: "Asia/Makassar", label: "WITA (Makassar)" },
                          { value: "Asia/Jayapura", label: "WIT (Jayapura)" },
                          { value: "America/New_York", label: "Eastern Time" }
                        ]}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Mode Pemeliharaan</label>
                        <input
                          type="checkbox"
                          checked={systemSettings.general.maintenanceMode}
                          onChange={(e) => setSystemSettings(prev => ({
                            ...prev,
                            general: { ...prev.general, maintenanceMode: e.target.checked }
                          }))}
                          className="h-4 w-4 text-teal-600 focus:ring-teal-600 border-gray-300 rounded"
                        />
                      </div>
                      <p className="text-xs text-gray-500">Aktifkan untuk menempatkan sistem dalam mode pemeliharaan</p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={saveSystemSettings} disabled={saving}>
                      <SaveIcon className="h-4 w-4 mr-2" />
                      {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </PermissionGuard>
        </Tabs>
      </div>

  );
}
