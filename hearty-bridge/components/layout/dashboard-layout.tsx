"use client";

import { ReactNode } from "react";
import { DashboardSidebar } from "./dashboard-sidebar";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { UserRole } from "@/lib/types/auth";

interface DashboardLayoutProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  title?: string;
  description?: string;
}

export function DashboardLayout({ 
  children, 
  allowedRoles = [],
  title,
  description 
}: DashboardLayoutProps) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <div className="min-h-screen bg-gray-50">
        <DashboardSidebar />
        
        {/* Main content */}
        <div className="lg:pl-64">
          {/* Header */}
          {(title || description) && (
            <div className="bg-white shadow-sm border-b border-gray-200">
              <div className="px-6 py-6">
                {title && (
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="text-gray-600">
                    {description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Page content */}
          <main className="px-6 py-6 w-full">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}