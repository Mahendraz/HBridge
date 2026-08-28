"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { usePermissions } from "@/lib/utils/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUpIcon, XCircleIcon, UsersIcon } from "lucide-react";
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

const MONTH_LABEL: Record<string, string> = {
  "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr", "05": "Mei", "06": "Jun",
  "07": "Jul", "08": "Agu", "09": "Sep", "10": "Okt", "11": "Nov", "12": "Des",
};

function formatMonth(ym: string): string {
  const [y, m] = ym.split("-");
  return `${MONTH_LABEL[m] ?? m} ${y.slice(2)}`;
}

export default function PatientAnalyticsPage() {
  const { user } = useAuth();
  const permissions = usePermissions(user?.role ?? "parent");
  const [months, setMonths] = useState(12);
  const [data, setData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchTrend();
  }, [fetchTrend]);

  if (!permissions.hasPermission("reports:system_analytics")) {
    return (
      <div className="py-20 text-center text-gray-500">
        <XCircleIcon className="h-10 w-10 mx-auto mb-3 text-red-400" />
        <p className="font-medium text-gray-700">Akses Ditolak</p>
        <p className="text-sm">Halaman ini hanya untuk Admin/Super Admin.</p>
      </div>
    );
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
          ) : loading ? (
            <div className="py-10 text-center text-sm text-gray-400">Memuat data...</div>
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
    </div>
  );
}
