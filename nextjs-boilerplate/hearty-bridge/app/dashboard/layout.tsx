"use client";

import { ReactNode } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/lib/contexts/auth-context";
import { usePermissions } from "@/lib/utils/permissions";
import { usePathname } from "next/navigation";

interface Props {
  children: ReactNode;
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
      allowedRoles={['super_admin', 'admin', 'therapist', 'parent']}
      title={title}
      description={description}
    >
      {children}
    </DashboardLayout>
  );
}