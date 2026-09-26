"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { usePermissions } from "@/lib/utils/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { HistoryIcon, XCircleIcon, SearchIcon, XIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { CategoryIcon, formatLogTime } from "@/components/activity-log/category-meta";
import {
  AUDIT_CATEGORIES,
  AUDIT_CATEGORY_LABELS,
  AUDIT_ROLES,
  AUDIT_ROLE_LABELS,
  type AuditCategory,
  type AuditLogItem,
} from "@/lib/audit-log-categories";

const PAGE_SIZE = 25;

interface Filters {
  categories: AuditCategory[];
  q: string;
  from: string;
  to: string;
  actorId: string;
  role: string;
  page: number;
}

interface LogsResult {
  logs: AuditLogItem[];
  totalPages: number;
  total: number;
  categoryCounts: Partial<Record<AuditCategory, number>>;
  actors: { id: string; name: string; role: string }[];
  error: string | null;
}

const EMPTY_FILTERS: Filters = { categories: [], q: "", from: "", to: "", actorId: "", role: "", page: 1 };

function buildQuery(f: Filters) {
  const params = new URLSearchParams({ page: String(f.page), limit: String(PAGE_SIZE) });
  if (f.categories.length) params.set("category", f.categories.join(","));
  if (f.q) params.set("q", f.q);
  if (f.from) params.set("from", f.from);
  if (f.to) params.set("to", f.to);
  if (f.actorId) params.set("actorId", f.actorId);
  if (f.role) params.set("role", f.role);
  return params.toString();
}

async function fetchLogs(query: string): Promise<LogsResult> {
  const empty = { logs: [], totalPages: 1, total: 0, categoryCounts: {}, actors: [] };
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/super-admin/activity-logs?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      return { ...empty, error: result.error || "Gagal memuat log aktivitas" };
    }
    return {
      logs: result.logs ?? [],
      totalPages: result.pagination?.totalPages ?? 1,
      total: result.pagination?.total ?? 0,
      categoryCounts: result.categoryCounts ?? {},
      actors: result.actors ?? [],
      error: null,
    };
  } catch {
    return { ...empty, error: "Terjadi kesalahan. Coba lagi." };
  }
}

/** Kelompokkan log per hari (WIB) supaya daftar panjang mudah dipindai. */
function groupByDay(logs: AuditLogItem[]) {
  const groups: { day: string; items: AuditLogItem[] }[] = [];
  for (const log of logs) {
    const day = new Date(log.createdAt).toLocaleDateString("id-ID", {
      weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta",
    });
    const last = groups[groups.length - 1];
    if (last?.day === day) last.items.push(log);
    else groups.push({ day, items: [log] });
  }
  return groups;
}

export default function ActivityLogsPage() {
  const { user } = useAuth();
  const permissions = usePermissions(user?.role ?? "parent");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [loaded, setLoaded] = useState<(LogsResult & { key: string }) | null>(null);

  const queryKey = buildQuery(filters);
  const loading = loaded?.key !== queryKey;
  const canView = permissions.hasPermission("dashboard:activity");

  useEffect(() => {
    if (!canView) return;
    let cancelled = false;
    fetchLogs(queryKey).then((result) => {
      if (!cancelled) setLoaded({ key: queryKey, ...result });
    });
    return () => { cancelled = true; };
  }, [queryKey, canView]);

  // Debounce pencarian teks.
  useEffect(() => {
    const q = searchInput.trim();
    const timer = setTimeout(() => {
      setFilters((f) => (f.q === q ? f : { ...f, q, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const update = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch, page: patch.page ?? 1 }));

  const toggleCategory = (c: AuditCategory) =>
    update({
      categories: filters.categories.includes(c)
        ? filters.categories.filter((x) => x !== c)
        : [...filters.categories, c],
    });

  const resetFilters = () => {
    setSearchInput("");
    setFilters(EMPTY_FILTERS);
  };

  if (!canView) {
    return (
      <div className="py-20 text-center text-gray-500">
        <XCircleIcon className="h-10 w-10 mx-auto mb-3 text-red-400" />
        <p className="font-medium text-gray-700">Akses Ditolak</p>
        <p className="text-sm">Halaman ini hanya untuk Super Admin.</p>
      </div>
    );
  }

  const logs = loaded?.logs ?? [];
  const counts = loaded?.categoryCounts ?? {};
  const totalAll = Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0);
  const hasFilters =
    filters.categories.length > 0 || filters.q || filters.from || filters.to || filters.actorId || filters.role;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <HistoryIcon className="h-6 w-6 text-teal-600" />
          Log Aktivitas
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Semua aktivitas yang tercatat di sistem. Pilih kategori atau pakai filter untuk mempersempit.
        </p>
      </div>

      {/* Kategori */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => update({ categories: [] })}
          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
            filters.categories.length === 0
              ? "border-teal-600 bg-teal-600 text-white"
              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          Semua <span className="opacity-75">({totalAll})</span>
        </button>
        {AUDIT_CATEGORIES.map((c) => {
          const active = filters.categories.includes(c);
          return (
            <button
              key={c}
              type="button"
              onClick={() => toggleCategory(c)}
              aria-pressed={active}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "border-teal-600 bg-teal-50 text-teal-700"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {AUDIT_CATEGORY_LABELS[c]} <span className="opacity-60">({counts[c] ?? 0})</span>
            </button>
          );
        })}
      </div>

      {/* Filter lain */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari judul, nama…"
              aria-label="Cari log"
              className="h-10 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            />
          </div>
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            Dari tanggal
            <input
              type="date"
              value={filters.from}
              max={filters.to || undefined}
              onChange={(e) => update({ from: e.target.value })}
              className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            Sampai tanggal
            <input
              type="date"
              value={filters.to}
              min={filters.from || undefined}
              onChange={(e) => update({ to: e.target.value })}
              className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            Role pelaku
            <select
              value={filters.role}
              onChange={(e) => update({ role: e.target.value })}
              className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
            >
              <option value="">Semua role</option>
              {AUDIT_ROLES.map((r) => (
                <option key={r} value={r}>{AUDIT_ROLE_LABELS[r]}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            Pelaku
            <select
              value={filters.actorId}
              onChange={(e) => update({ actorId: e.target.value })}
              className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
            >
              <option value="">Semua pelaku</option>
              {(loaded?.actors ?? []).map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </label>
          {hasFilters && (
            <div className="sm:col-span-2 lg:col-span-5">
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700"
              >
                <XIcon className="h-4 w-4" /> Reset filter
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {loaded?.error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{loaded.error}</div>
      )}

      {/* Daftar */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="h-3 w-72 max-w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <HistoryIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-600">
              {hasFilters ? "Tidak ada aktivitas yang cocok dengan filter" : "Belum ada aktivitas tercatat"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupByDay(logs).map((group) => (
            <section key={group.day}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{group.day}</h2>
              <Card>
                <CardContent className="p-0 divide-y divide-gray-100">
                  {group.items.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 sm:p-4">
                      <CategoryIcon category={log.category} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-0.5 sm:gap-3">
                          <p className="text-sm font-medium text-gray-900 break-words">{log.title}</p>
                          <span className="text-xs text-gray-400 flex-shrink-0">{formatLogTime(log.createdAt)}</span>
                        </div>
                        {log.description && (
                          <p className="text-xs text-gray-600 mt-0.5 break-words">{log.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-xs text-gray-500">
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">
                            {AUDIT_CATEGORY_LABELS[log.category] ?? log.category}
                          </span>
                          <span>
                            oleh <span className="font-medium text-gray-700">{log.actor.name || "—"}</span>
                            {" "}({AUDIT_ROLE_LABELS[log.actor.role] ?? log.actor.role})
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && (loaded?.totalPages ?? 1) > 1 && (
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={filters.page <= 1}
            onClick={() => update({ page: filters.page - 1 })}
          >
            <ChevronLeftIcon className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Sebelumnya</span>
          </Button>
          <span className="text-sm text-gray-500 text-center">
            Halaman {filters.page} dari {loaded?.totalPages} · {loaded?.total} aktivitas
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={filters.page >= (loaded?.totalPages ?? 1)}
            onClick={() => update({ page: filters.page + 1 })}
          >
            <span className="hidden sm:inline">Berikutnya</span><ChevronRightIcon className="h-4 w-4 sm:ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
