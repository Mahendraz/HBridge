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
  
  // Only show title and description for main dashboard page
  const isMainDashboard = pathname === '/dashboard';
  
  let title = undefined;
  let description = undefined;
  
  if (isMainDashboard && user?.role) {
    const permissions = usePermissions(user.role);
    title = permissions.getDashboardTitle();
    description = permissions.getDashboardDescription();
  }
  
  return (
    <DashboardLayout 
      allowedRoles={['admin', 'therapist', 'parent']}
      title={title}
      description={description}
    >
      {children}
    </DashboardLayout>
  );
}