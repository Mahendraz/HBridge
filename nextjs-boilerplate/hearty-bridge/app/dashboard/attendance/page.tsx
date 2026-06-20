"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MapPinIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  ClipboardCheckIcon,
  UserIcon,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────── */

interface AttendanceRecord {
  _id: string;
  userId: string;
  userName: string;
  userRole: "admin" | "therapist";
  date: string;
  checkInAt: string;
  checkInLocation: { lat: number; lng: number };
  isWithinLocation: boolean;
  status: "on-time" | "late";
}

interface AbsentEntry {
  userId: string;
  userName: string;
  userRole: string;
  date: string;
  status: "absent";
}

interface AdminData {
  date: string;
  records: AttendanceRecord[];
  absent: AbsentEntry[];
  summary: { onTime: number; late: number; absent: number };
}


interface HistoryRecord extends AttendanceRecord {}

interface CheckInResult {
  status: "on-time" | "late";
  isWithinLocation: boolean;
  distanceMeters: number;
  checkInAt: string;
}

/* ─── Helpers ─────────────────────────────────────────────────── */

function todayWIB(): string {
  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().split("T")[0];
}

function formatCheckInTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00+07:00").toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Returns Mon–Sat (YYYY-MM-DD) for the week containing dateStr */
function getWeekDays(dateStr: string): string[] {
  const [y, m, d] = dateStr.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  const dow = base.getUTCDay(); // 0=Sun … 6=Sat
  const toMon = dow === 0 ? -6 : 1 - dow;
  return Array.from({ length: 6 }, (_, i) => {
    const dt = new Date(base);
    dt.setUTCDate(base.getUTCDate() + toMon + i);
    return dt.toISOString().split("T")[0];
  });
}

function shortDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${parseInt(d)}/${parseInt(m)}`;
}

const ID_SHORT_DAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

/* ─── Status badge ────────────────────────────────────────────── */

function StatusBadge({ status }: { status: "on-time" | "late" | "absent" }) {
  if (status === "on-time")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
        <CheckCircleIcon className="h-3 w-3" />
        Tepat Waktu
      </span>
    );
  if (status === "late")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
        <ClockIcon className="h-3 w-3" />
        Terlambat
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
      <XCircleIcon className="h-3 w-3" />
      Tidak Hadir
    </span>
  );
}

function WeeklyStatusCell({ status, isFuture }: { status: "on-time" | "late" | "absent" | null; isFuture: boolean }) {
  if (isFuture) return <span className="text-gray-300 text-xs">—</span>;
  if (status === "on-time")
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-green-700">
        <CheckCircleIcon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Tepat</span>
      </span>
    );
  if (status === "late")
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-yellow-600">
        <ClockIcon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Tlmbt</span>
      </span>
    );
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-red-500">
      <XCircleIcon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Absen</span>
    </span>
  );
}

/* ─── Main page ───────────────────────────────────────────────── */

export default function AttendancePage() {
  const { user } = useAuth();

  const [selectedDate, setSelectedDate] = useState<string>(todayWIB());
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [weeklyRecords, setWeeklyRecords] = useState<Record<string, AttendanceRecord[]>>({});
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Check-in state
  const [checking, setChecking] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [checkInResult, setCheckInResult] = useState<CheckInResult | null>(null);

  /* ─ Fetch ─ */

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Admin and therapist: fetch all staff data + weekly recap + own history
      const weekDays = getWeekDays(selectedDate);
      const [mainRes, histRes, ...weeklyRaw] = await Promise.all([
        fetch(`/api/attendance?date=${selectedDate}`, { headers }),
        fetch(`/api/attendance?history=true`, { headers }),
        ...weekDays.map((d) => fetch(`/api/attendance?date=${d}`, { headers })),
      ]);
      if (mainRes.ok) {
        const r = await mainRes.json();
        if (r.success) setAdminData(r.data);
      }
      if (histRes.ok) {
        const r = await histRes.json();
        if (r.success) setHistory(r.data.history || []);
      }
      const wMap: Record<string, AttendanceRecord[]> = {};
      for (let i = 0; i < weekDays.length; i++) {
        try {
          const r = await weeklyRaw[i].json();
          wMap[weekDays[i]] = r.success ? (r.data.records ?? []) : [];
        } catch {
          wMap[weekDays[i]] = [];
        }
      }
      setWeeklyRecords(wMap);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [user, selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ─ Check-in handler ─ */

  const doCheckIn = async (lat: number, lng: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lat, lng }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setCheckInResult(result.data);
        fetchData();
      } else if (res.status === 409) {
        fetchData(); // refresh agar UI tampil "Sudah Check-in"
      } else {
        setGpsError(result.error || "Gagal check-in. Silakan coba lagi.");
      }
    } catch {
      setGpsError("Terjadi kesalahan jaringan. Silakan coba lagi.");
    } finally {
      setChecking(false);
    }
  };

  const handleCheckIn = () => {
    setGpsError(null);
    setCheckInResult(null);

    if (typeof window === "undefined" || !navigator.geolocation) {
      setGpsError("GPS tidak tersedia di browser Anda.");
      return;
    }

    setChecking(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => doCheckIn(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        setChecking(false);
        if (err.code === 1) {
          setGpsError(
            "Izin lokasi ditolak. Aktifkan izin lokasi di browser Anda."
          );
        } else if (err.code === 2) {
          setGpsError("Lokasi tidak tersedia. Pastikan GPS aktif.");
        } else {
          setGpsError("GPS timeout. Silakan coba lagi.");
        }
      },
      { timeout: 15_000, enableHighAccuracy: true }
    );
  };

  // Mock: kirim koordinat langsung tanpa GPS (untuk testing)
  const handleMockCheckIn = (scenario: "in" | "out") => {
    setGpsError(null);
    setCheckInResult(null);
    setChecking(true);
    // "in"  → koordinat sama persis dengan OFFICE_LATITUDE/LONGITUDE di .env
    // "out" → koordinat ~20km dari kantor (Bandung arah selatan)
    const coords =
      scenario === "in"
        ? { lat: 1.1244132, lng: 104.0203694 }
        : { lat: 1.5, lng: 104.5 };
    doCheckIn(coords.lat, coords.lng);
  };

  if (!user) return null;

  const today = todayWIB();
  const isToday = selectedDate === today;

  /* ─ My check-in status (admin + therapist both use adminData) ─ */
  const myTodayRecord =
    adminData?.date === today
      ? (adminData.records.find((r) => r.userId === user._id) ?? null)
      : null;
  const alreadyCheckedIn = myTodayRecord !== null;

  /* ─ Build unified table rows for admin ─ */
  const adminRows: Array<
    | (AttendanceRecord & { status: "on-time" | "late" })
    | (AbsentEntry & { status: "absent" })
  > = adminData
    ? [
        ...adminData.records,
        ...adminData.absent,
      ].sort((a, b) => {
        // present rows first, then absent
        if (a.status === "absent" && b.status !== "absent") return 1;
        if (b.status === "absent" && a.status !== "absent") return -1;
        // within present, sort by check-in time
        const aTime =
          "checkInAt" in a ? new Date(a.checkInAt).getTime() : Infinity;
        const bTime =
          "checkInAt" in b ? new Date(b.checkInAt).getTime() : Infinity;
        return aTime - bTime;
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardCheckIcon className="h-6 w-6 text-teal-600" />
            Absensi
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Monitor kehadiran semua staff
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            max={today}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCwIcon
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* ── MY CHECK-IN PANEL (admin + therapist) ── */}
      {isToday && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-teal-600" />
              Status Saya Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {alreadyCheckedIn && myTodayRecord ? (
              <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                <CheckCircleIcon className="h-8 w-8 text-green-500 shrink-0" />
                <div>
                  <p className="font-semibold text-green-800">
                    Sudah Check-in
                  </p>
                  <p className="text-sm text-green-700">
                    Jam masuk:{" "}
                    <strong>{formatCheckInTime(myTodayRecord.checkInAt)}</strong>{" "}
                    WIB
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <StatusBadge status={myTodayRecord.status} />
                    {myTodayRecord.isWithinLocation ? (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPinIcon className="h-3 w-3 text-green-500" />
                        Lokasi valid
                      </span>
                    ) : (
                      <span className="text-xs text-yellow-600 flex items-center gap-1">
                        <AlertCircleIcon className="h-3 w-3" />
                        Di luar area kantor
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <XCircleIcon className="h-8 w-8 text-gray-400 shrink-0" />
                  <div>
                    <p className="font-medium text-gray-700">Belum Check-in</p>
                    <p className="text-sm text-gray-500">
                      Check-in sebelum 09:00 WIB untuk status Tepat Waktu
                    </p>
                  </div>
                </div>

                {/* Check-in result message */}
                {checkInResult && (
                  <div
                    className={`rounded-lg px-4 py-3 text-sm ${
                      checkInResult.isWithinLocation
                        ? "bg-green-50 text-green-800"
                        : "bg-yellow-50 text-yellow-800"
                    }`}
                  >
                    <p className="font-semibold">
                      {checkInResult.isWithinLocation
                        ? "✅ Check-in berhasil!"
                        : "⚠️ Check-in tercatat — lokasi di luar area"}
                    </p>
                    <p className="mt-0.5">
                      Status:{" "}
                      <strong>
                        {checkInResult.status === "on-time"
                          ? "Tepat Waktu"
                          : "Terlambat"}
                      </strong>
                      {!checkInResult.isWithinLocation &&
                        ` · Jarak dari kantor: ${checkInResult.distanceMeters}m`}
                    </p>
                  </div>
                )}

                {gpsError && (
                  <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                    <AlertCircleIcon className="h-4 w-4 shrink-0 mt-0.5" />
                    {gpsError}
                  </div>
                )}

                <Button
                  className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white"
                  onClick={handleCheckIn}
                  disabled={checking}
                >
                  {checking ? (
                    <>
                      <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                      Mendapatkan lokasi...
                    </>
                  ) : (
                    <>
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      Check In Sekarang
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-400">
                  Browser akan meminta izin lokasi GPS saat Anda menekan
                  tombol.
                </p>

                {/* ── Mock buttons (testing only) ── */}
                <div className="mt-4 rounded-lg border border-dashed border-orange-300 bg-orange-50 p-3 space-y-2">
                  <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">
                    Mode Testing — hapus sebelum produksi
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-orange-400 text-orange-700 hover:bg-orange-100 text-xs"
                      onClick={() => handleMockCheckIn("in")}
                      disabled={checking}
                    >
                      Mock: Di Dalam Kantor
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-orange-400 text-orange-700 hover:bg-orange-100 text-xs"
                      onClick={() => handleMockCheckIn("out")}
                      disabled={checking}
                    >
                      Mock: Di Luar Area
                    </Button>
                  </div>
                  <p className="text-xs text-orange-500">
                    Melewati GPS — langsung kirim koordinat tetap ke API.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── STAFF OVERVIEW (admin + therapist) ── */}
      {(user.role === "admin" || user.role === "therapist") && (
        <>
          {/* Summary cards */}
          {adminData && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-700">
                      {adminData.summary.onTime}
                    </p>
                    <p className="text-sm text-gray-500">Tepat Waktu</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <ClockIcon className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-700">
                      {adminData.summary.late}
                    </p>
                    <p className="text-sm text-gray-500">Terlambat</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <XCircleIcon className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-700">
                      {adminData.summary.absent}
                    </p>
                    <p className="text-sm text-gray-500">Tidak Hadir</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Staff attendance table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Rekap Kehadiran — {formatDate(selectedDate)}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <RefreshCwIcon className="h-5 w-5 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-400">Memuat...</span>
                </div>
              ) : adminRows.length === 0 ? (
                <p className="text-sm text-gray-400 italic py-6 text-center">
                  Belum ada data untuk tanggal ini
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">
                          Nama
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">
                          Role
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">
                          Jam Masuk
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">
                          Status
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">
                          Lokasi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {adminRows.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {row.userName}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="capitalize text-xs">
                              {row.userRole}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {"checkInAt" in row && row.checkInAt
                              ? formatCheckInTime(row.checkInAt)
                              : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={row.status} />
                          </td>
                          <td className="px-4 py-3">
                            {"isWithinLocation" in row ? (
                              row.isWithinLocation ? (
                                <span className="text-green-600 text-xs flex items-center gap-1">
                                  <MapPinIcon className="h-3 w-3" />
                                  Valid
                                </span>
                              ) : (
                                <span className="text-yellow-600 text-xs flex items-center gap-1">
                                  <AlertCircleIcon className="h-3 w-3" />
                                  Di luar area
                                </span>
                              )
                            ) : (
                              <span className="text-gray-300 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
          {/* ── Weekly recap table ── */}
          {(() => {
            const weekDays = getWeekDays(selectedDate);
            // Build unified staff list from current adminData
            const allStaff: { userId: string; userName: string; userRole: string }[] = adminData
              ? [
                  ...adminData.records.map((r) => ({ userId: r.userId, userName: r.userName, userRole: r.userRole })),
                  ...adminData.absent.map((r) => ({ userId: r.userId, userName: r.userName, userRole: r.userRole })),
                ]
              : [];

            if (allStaff.length === 0) return null;

            return (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Rekap Mingguan — {shortDate(weekDays[0])} s/d {shortDate(weekDays[5])}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Nama</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                          {weekDays.map((day, i) => (
                            <th
                              key={day}
                              className={`px-3 py-3 font-medium text-center whitespace-nowrap ${
                                day === selectedDate
                                  ? "text-teal-700 bg-teal-50"
                                  : "text-gray-600"
                              }`}
                            >
                              <div className="text-xs">{ID_SHORT_DAYS[i]}</div>
                              <div className="text-xs font-normal">{shortDate(day)}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {allStaff.map((staff) => (
                          <tr key={staff.userId} className="hover:bg-gray-50">
                            <td className="px-4 py-2.5 font-medium text-gray-900 whitespace-nowrap">
                              {staff.userName}
                            </td>
                            <td className="px-4 py-2.5">
                              <Badge variant="outline" className="capitalize text-xs">
                                {staff.userRole}
                              </Badge>
                            </td>
                            {weekDays.map((day) => {
                              const rec = weeklyRecords[day]?.find((r) => r.userId === staff.userId);
                              const isFuture = day > today;
                              return (
                                <td
                                  key={day}
                                  className={`px-3 py-2.5 text-center ${
                                    day === selectedDate ? "bg-teal-50/50" : ""
                                  }`}
                                >
                                  <WeeklyStatusCell
                                    status={rec ? rec.status : isFuture ? null : "absent"}
                                    isFuture={isFuture}
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-2 border-t flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><CheckCircleIcon className="h-3 w-3 text-green-600" /> Tepat Waktu</span>
                    <span className="flex items-center gap-1"><ClockIcon className="h-3 w-3 text-yellow-500" /> Terlambat</span>
                    <span className="flex items-center gap-1"><XCircleIcon className="h-3 w-3 text-red-500" /> Tidak Hadir</span>
                    <span className="flex items-center gap-1 text-gray-300">— Akan Datang</span>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </>
      )}

      {/* ── PERSONAL HISTORY (therapist) ── */}
      {user.role !== "admin" && history.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Riwayat Absensi (30 Hari Terakhir)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Tanggal
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Jam Masuk
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Lokasi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {history.map((rec) => (
                    <tr key={rec._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700">
                        {formatDate(rec.date)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatCheckInTime(rec.checkInAt)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={rec.status} />
                      </td>
                      <td className="px-4 py-3">
                        {rec.isWithinLocation ? (
                          <span className="text-green-600 text-xs flex items-center gap-1">
                            <MapPinIcon className="h-3 w-3" />
                            Valid
                          </span>
                        ) : (
                          <span className="text-yellow-600 text-xs flex items-center gap-1">
                            <AlertCircleIcon className="h-3 w-3" />
                            Di luar area
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {user.role !== "admin" && !loading && history.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-gray-500">
            <ClipboardCheckIcon className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-700">Belum ada riwayat absensi</p>
            <p className="text-sm mt-1">
              Lakukan check-in pertama Anda hari ini.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
