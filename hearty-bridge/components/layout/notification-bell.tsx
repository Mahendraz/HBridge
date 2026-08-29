"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BellIcon } from "lucide-react";
import { useAuth } from "@/lib/contexts/auth-context";

interface NotificationItem {
  _id: string;
  type: "new_invoice" | "new_comment" | "new_report";
  title: string;
  body: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

const POLL_INTERVAL_MS = 20000;
const PANEL_WIDTH = 256; // px, matches w-64 — deliberately no wider than the
// desktop sidebar (lg:w-64) so the panel never has to spill past it into the
// main content area (it can still cover the sidebar's own nav links while open,
// same as any dropdown covering its own menu — that's fine).

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export function NotificationBell() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);

  // The panel is `fixed` and positioned from the button's actual screen
  // coordinates rather than `absolute` inside whatever narrow column happens
  // to contain it — the bell renders both in the desktop sidebar and the
  // mobile off-canvas drawer, and a dropdown anchored the old way overflowed
  // both: covering the page's own heading/content on desktop, and colliding
  // with the drawer's close button on mobile. Clamped to the *host column's*
  // right edge (sidebar or drawer), not just the viewport edge, so it never
  // reaches past that boundary into real page content — worst case it covers
  // the sidebar/drawer's own nav links while open, which is fine.
  const updatePanelPosition = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const margin = 8;
    const isDesktopSidebar = window.innerWidth >= 1024; // matches the `lg` breakpoint dashboard-sidebar.tsx uses to switch from the mobile drawer to the fixed lg:w-64 sidebar
    const hostRight = isDesktopSidebar ? 256 : Math.min(window.innerWidth, 320); // lg:w-64 sidebar, or the mobile drawer's max-w-xs
    const left = Math.max(
      margin,
      Math.min(rect.left, hostRight - PANEL_WIDTH - margin, window.innerWidth - PANEL_WIDTH - margin)
    );
    setPanelPos({ top: rect.bottom + margin, left });
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    try {
      const res = await fetch("/api/notifications?limit=15", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data?.success) {
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch {
      // silent — polling will retry
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePanelPosition();
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);
    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [isOpen, updatePanelPosition]);

  const markAllRead = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
    } catch {
      // best-effort
    }
  };

  const markOneRead = async (notification: NotificationItem) => {
    if (notification.isRead) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    setNotifications((prev) => prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await fetch(`/api/notifications/${notification._id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // best-effort
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="relative flex items-center justify-center h-9 w-9 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifikasi"
      >
        <BellIcon className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && panelPos && (
        <div
          className="fixed z-[60] w-64 max-h-96 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg"
          style={{ top: panelPos.top, left: panelPos.left }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Notifikasi</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-400">Belum ada notifikasi</p>
            </div>
          ) : (
            <ul>
              {notifications.map((n) => (
                <li key={n._id}>
                  <a
                    href={n.link || "#"}
                    onClick={() => markOneRead(n)}
                    className={`block px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors ${
                      n.isRead ? "" : "bg-teal-50/60"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.isRead && <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-teal-500 flex-shrink-0" />}
                      <div className={`flex-1 min-w-0 ${n.isRead ? "pl-3.5" : ""}`}>
                        <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                        {n.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>}
                        <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
