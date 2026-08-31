"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { usePermissions } from "@/lib/utils/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUpIcon, XCircleIcon, UsersIcon, WalletIcon, ReceiptIcon, ClockIcon } from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface TrendPoint {
  month: string;
  newPatients: number;
  activePatientsCumulative: number;
}

interface FinancialTrendPoint {
  month: string;
  revenue: number;
  invoiced: number;
  cumulativeRevenue: number;
}

interface FinancialOutstanding {
  total: number;
  count: number;
}

const MONTH_LABEL: Record<string, string> = {
  "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr", "05": "Mei", "06": "Jun",
  "07": "Jul", "08": "Agu", "09": "Sep", "10": "Okt", "11": "Nov", "12": "Des",
};

function formatMonth(ym: string): string {
  const [y, m] = ym.split("-");
  return `${MONTH_LABEL[m] ?? m} ${y.slice(2)}`;
}

function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

function formatRupiahCompact(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    notation: "compact",
  }).format(n);
}

/** Bar-chart-shaped placeholder for a chart panel's own loading state — each
 * chart on this page fetches independently, so only that panel shows this. */
function ChartSkeleton() {
  const heights = [45, 70, 55, 85, 60, 95, 50, 75, 65, 90, 55, 80];
  return (
    <div style={{ width: "100%", height: 360 }} className="flex items-end gap-2 px-2 pb-6">
      {heights.map((h, i) => (
        <Skeleton key={i} className="flex-1" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

// ── Loading Skeleton ─────────────────────────────────────────────────────────
// Full-page skeleton for the initial load, matching the same header + stat
// cards + chart shape every other dashboard page uses.

function AnalyticsSkeleton({ canViewFinancial }: { canViewFinancial: boolean }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-40 rounded-md" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-5 flex items-center gap-4">
              <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-5 w-14" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-64" />
        </CardHeader>
        <CardContent>
          <ChartSkeleton />
        </CardContent>
      </Card>

      {canViewFinancial && (
        <>
          <div className="pt-2 space-y-2">
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-4 w-80" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-5 flex items-center gap-4">
                  <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-36" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-56" />
            </CardHeader>
            <CardContent>
              <ChartSkeleton />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default function PatientAnalyticsPage() {
  const { user } = useAuth();
  const permissions = usePermissions(user?.role ?? "parent");
  const [months, setMonths] = useState(12);
  const [data, setData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canViewFinancial = permissions.hasPermission("financial:view_all");
  const [financialData, setFinancialData] = useState<FinancialTrendPoint[]>([]);
  const [outstanding, setOutstanding] = useState<FinancialOutstanding | null>(null);
  const [financialLoading, setFinancialLoading] = useState(true);
  const [financialError, setFinancialError] = useState<string | null>(null);

  const fetchTrend = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/super-admin/analytics/patient-trend?months=${months}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setData(result.data);
      } else {
        setError(result.error || "Gagal memuat data analitik.");
      }
    } catch {
      setError("Terjadi kesalahan saat memuat data.");
    } finally {
      setLoading(false);
    }
  }, [months]);

  const fetchFinancialTrend = useCallback(async () => {
    setFinancialLoading(true);
    setFinancialError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/super-admin/analytics/financial-trend?months=${months}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setFinancialData(result.data);
        setOutstanding(result.outstanding);
      } else {
        setFinancialError(result.error || "Gagal memuat data keuangan.");
      }
    } catch {
      setFinancialError("Terjadi kesalahan saat memuat data keuangan.");
    } finally {
      setFinancialLoading(false);
    }
  }, [months]);

  useEffect(() => {
    fetchTrend();
  }, [fetchTrend]);

  useEffect(() => {
    if (canViewFinancial) fetchFinancialTrend();
  }, [canViewFinancial, fetchFinancialTrend]);

  if (!permissions.hasPermission("reports:system_analytics")) {
    return (
      <div className="py-20 text-center text-gray-500">
        <XCircleIcon className="h-10 w-10 mx-auto mb-3 text-red-400" />
        <p className="font-medium text-gray-700">Akses Ditolak</p>
        <p className="text-sm">Halaman ini hanya untuk Admin/Super Admin.</p>
      </div>
    );
  }

  if (loading) {
    return <AnalyticsSkeleton canViewFinancial={canViewFinancial} />;
  }

  const latest = data[data.length - 1];
  const totalNew = data.reduce((sum, p) => sum + p.newPatients, 0);
  const chartData = data.map((p) => ({ ...p, label: formatMonth(p.month) }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUpIcon className="h-6 w-6 text-teal-600" />
            Tren Pasien
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Pantau kenaikan atau penurunan jumlah pasien aktif dari waktu ke waktu.
          </p>
        </div>
        <select
          value={months}
          onChange={(e) => setMonths(parseInt(e.target.value))}
          className="border border-gray-200 rounded-md px-3 py-2 text-sm"
        >
          <option value={6}>6 bulan terakhir</option>
          <option value={12}>12 bulan terakhir</option>
          <option value={24}>24 bulan terakhir</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-5 flex items-center gap-4">
            <div className="p-2 bg-teal-100 rounded-lg">
              <UsersIcon className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Pasien Aktif Saat Ini</p>
              <p className="text-lg font-bold text-gray-900">{latest?.activePatientsCumulative ?? "—"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUpIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Pasien Baru ({months} Bulan Terakhir)</p>
              <p className="text-lg font-bold text-gray-900">{totalNew}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pasien Baru per Bulan &amp; Total Pasien Aktif</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="py-10 text-center text-sm text-red-600">{error}</div>
          ) : chartData.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">Belum ada data pasien.</div>
          ) : (
            <div style={{ width: "100%", height: 360 }}>
              <ResponsiveContainer>
                <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: -8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="newPatients" name="Pasien Baru" fill="#5eead4" radius={[4, 4, 0, 0]} />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="activePatientsCumulative"
                    name="Total Pasien Aktif"
                    stroke="#0d9488"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {canViewFinancial && (
        <>
          <div className="pt-2">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <WalletIcon className="h-5 w-5 text-teal-600" />
              Progres Keuangan Bulanan
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Pendapatan yang diterima dan ditagihkan per bulan, khusus Super Admin.
            </p>
          </div>

          {financialLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-5 flex items-center gap-4">
                    <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3 w-36" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-5 flex items-center gap-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <WalletIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Pendapatan ({months} Bulan Terakhir)</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatRupiahCompact(financialData.reduce((sum, p) => sum + p.revenue, 0))}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 flex items-center gap-4">
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <ReceiptIcon className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Ditagihkan Bulan Ini</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatRupiahCompact(financialData[financialData.length - 1]?.invoiced ?? 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 flex items-center gap-4">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <ClockIcon className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Belum Tertagih ({outstanding?.count ?? 0} invoice)</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatRupiahCompact(outstanding?.total ?? 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Pendapatan per Bulan &amp; Kumulatif</CardTitle>
            </CardHeader>
            <CardContent>
              {financialError ? (
                <div className="py-10 text-center text-sm text-red-600">{financialError}</div>
              ) : financialLoading ? (
                <ChartSkeleton />
              ) : financialData.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">Belum ada data keuangan.</div>
              ) : (
                <div style={{ width: "100%", height: 360 }}>
                  <ResponsiveContainer>
                    <ComposedChart
                      data={financialData.map((p) => ({ ...p, label: formatMonth(p.month) }))}
                      margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) => formatRupiahCompact(v)}
                        width={80}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) => formatRupiahCompact(v)}
                        width={80}
                      />
                      <Tooltip formatter={(value) => formatRupiah(Number(value))} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="revenue" name="Pendapatan Diterima" fill="#5eead4" radius={[4, 4, 0, 0]} />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="cumulativeRevenue"
                        name="Kumulatif Pendapatan"
                        stroke="#0d9488"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
