"use client";

import { ReactNode } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/lib/contexts/auth-context";
import { usePermissions, PermissionChecker, type Permission } from "@/lib/utils/permissions";
import type { UserRole } from "@/lib/types/auth";
import { usePathname } from "next/navigation";

interface Props {
  children: ReactNode;
}

const ALL_ROLES: UserRole[] = ['super_admin', 'admin', 'therapist', 'parent'];

// Routes with a verified single-permission whole-page gate already enforced inside
// the page itself (see each page's own `hasPermission(...)` early-return). Mirroring
// that same permission here — rather than hardcoding role names again — means this
// list can only ever agree with the page, never drift from it. Routes NOT listed
// here keep today's permissive behavior (any authenticated role reaches the layout;
// finer-grained gating happens inside the page/API), since most pages gate specific
// content rather than the whole page and guessing at a stricter rule here risks
// locking out a legitimate view we haven't verified.
const ROUTE_PERMISSIONS: Array<{ prefix: string; permission: Permission }> = [
  { prefix: '/dashboard/super-admin/packages', permission: 'packages:view' },
  { prefix: '/dashboard/super-admin/financial', permission: 'financial:view_all' },
  { prefix: '/dashboard/therapists', permission: 'therapists:view' },
];

function allowedRolesForPath(pathname: string): UserRole[] {
  const match = ROUTE_PERMISSIONS.find(
    (r) => pathname === r.prefix || pathname.startsWith(r.prefix + '/')
  );
  if (!match) return ALL_ROLES;
  return ALL_ROLES.filter((role) => new PermissionChecker(role).hasPermission(match.permission));
}

export default function Layout({ children }: Props) {
  const { user } = useAuth();
  const pathname = usePathname();
  const permissions = usePermissions(user?.role || 'parent');

  // Only show title and description for main dashboard page
  const isMainDashboard = pathname === '/dashboard';

  const title = isMainDashboard && user?.role ? permissions.getDashboardTitle() : undefined;
  const description = isMainDashboard && user?.role ? permissions.getDashboardDescription() : undefined;

  return (
    <DashboardLayout
      allowedRoles={allowedRolesForPath(pathname)}
      title={title}
      description={description}
    >
      {children}
    </DashboardLayout>
  );
}