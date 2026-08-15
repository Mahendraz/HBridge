"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  UsersIcon,
  UserPlusIcon,
  ChartBarIcon,
  CogIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
  CalendarIcon,
  FileTextIcon,
  HeartIcon,
  BabyIcon,
  ShieldCheckIcon,
  UserIcon,
  BarChart3Icon,
  MailIcon,
  ClipboardCheckIcon,
  ReceiptIcon,
  PackageIcon,
  DollarSignIcon,
} from "lucide-react";
import { useAuth } from "@/lib/contexts/auth-context";
import { UserRole } from "@/lib/types/auth";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/lib/utils/permissions";

const iconMap = {
  HomeIcon,
  UserIcon,
  UsersIcon,
  CalendarIcon,
  ChartBarIcon,
  BarChart3Icon,
  CogIcon,
  MailIcon,
  BabyIcon,
  FileTextIcon,
  ShieldCheckIcon,
  ClipboardCheckIcon,
  ReceiptIcon,
  PackageIcon,
  DollarSignIcon,
};

interface DashboardSidebarProps {
  className?: string;
}

export function DashboardSidebar({ className }: DashboardSidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [commentBadge, setCommentBadge] = useState(0);
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const permissions = usePermissions(user?.role ?? "parent");

  useEffect(() => {
    if (!user || !permissions.hasPermission('reports:resolve_comment')) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;
    fetch('/api/reports/comments/unresolved-count', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setCommentBadge(d?.count ?? 0))
      .catch(() => {});
  }, [user, pathname, permissions]);

  if (!user) return null;

  const navigationItems = permissions.getNavigationItems();

  const isCurrentPage = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center h-16 px-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <HeartIcon className="h-8 w-8 text-teal-600" />
          <span className="text-xl font-bold text-gray-900">Hearty Bridge</span>
        </div>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-700 font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.name}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user.role === 'super_admin' ? 'Super Admin' : user.role}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap] || HomeIcon;
          const current = isCurrentPage(item.href);
          
          const showBadge = item.href === '/dashboard/reports' && commentBadge > 0;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                current
                  ? "bg-teal-100 text-teal-800"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Icon
                className={`mr-3 h-5 w-5 transition-colors ${
                  current ? "text-teal-600" : "text-gray-500 group-hover:text-gray-700"
                }`}
              />
              {item.name}
              {showBadge && (
                <span className="ml-auto text-[10px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5 leading-none">
                  {commentBadge > 99 ? '99+' : commentBadge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="w-full justify-start text-gray-600 hover:text-gray-900"
        >
          <LogOutIcon className="mr-3 h-4 w-4" />
          Keluar
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(true)}
          className="bg-white shadow-md"
        >
          <MenuIcon className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white hover:text-gray-200"
              >
                <XIcon className="h-6 w-6" />
              </Button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={`hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200 ${className || ""}`}>
        <SidebarContent />
      </div>
    </>
  );
}