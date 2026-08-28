/**
 * Unified Role-Based Access Control (RBAC) System
 * Eliminates duplicate files and provides dynamic permissions
 */

import React from "react";
import type { UserRole } from "@/lib/types/auth";

export type { UserRole };

export type Permission =
  // Dashboard permissions
  | "dashboard:view"
  | "dashboard:analytics"
  | "dashboard:activity"

  // Announcement permissions
  | "announcements:view"
  | "announcements:manage"

  // Patient management permissions
  | "patients:view"
  | "patients:create"
  | "patients:edit"
  | "patients:edit_medical_only"
  | "patients:delete"
  | "patients:delete_own"
  | "patients:assign"
  | "patients:view_own"
  | "patients:view_assigned"

  // Therapist management permissions
  | "therapists:view"
  | "therapists:view_own"
  | "therapists:create"
  | "therapists:edit"
  | "therapists:delete"
  | "therapists:invite"
  | "therapists:assign_patients"
  | "therapists:manage_leave"

  // Schedule management permissions
  | "schedules:view"
  | "schedules:edit"
  | "schedules:create"
  | "schedules:view_own"
  | "schedules:manage_all"

  // Reports permissions
  | "reports:view"
  | "reports:create"
  | "reports:edit"
  | "reports:edit_own"
  | "reports:delete"
  | "reports:view_own"
  | "reports:view_all"
  | "reports:view_seen_by"
  | "reports:resolve_comment"
  | "reports:export"
  | "reports:system_analytics"

  // Session permissions
  | "sessions:view"
  | "sessions:create"
  | "sessions:edit"
  | "sessions:view_own"
  | "sessions:view_assigned"
  | "sessions:bulk_schedule"

  // Family/Parent permissions
  | "families:view"
  | "families:create"
  | "families:edit"
  | "families:view_own"

  // Settings permissions
  | "settings:view"
  | "settings:edit"
  | "settings:system"

  // User management permissions
  | "users:view"
  | "users:create"
  | "users:edit"
  | "users:delete"
  | "users:manage_roles"

  // Financial permissions
  | "billing:view"
  | "billing:manage"
  | "billing:view_own"

  // Invoice permissions
  | "invoices:manage"
  | "invoices:view_own"

  // Token / package-balance permissions
  | "tokens:manage"

  // Assessment permissions
  | "assessments:view"
  | "assessments:view_own"
  | "assessments:create"
  | "assessments:edit"
  | "assessments:edit_own"
  | "assessments:delete"
  | "assessments:manage"

  // Therapist leave-request permissions
  | "leaves:view_all"
  | "leaves:view_own"
  | "leaves:manage"

  // Attendance permissions
  | "attendance:view"
  | "attendance:checkin"

  // Package management (super_admin only)
  | "packages:view"
  | "packages:create"
  | "packages:edit"
  | "packages:delete"

  // Super admin financial access
  | "financial:view_all"
  | "financial:view_proofs";

// Role-to-permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    // All admin permissions
    "dashboard:view",
    "dashboard:analytics",
    "announcements:view",
    "announcements:manage",
    "patients:view",
    "patients:create",
    "patients:edit",
    "patients:delete",
    "patients:assign",
    "therapists:view",
    "therapists:create",
    "therapists:edit",
    "therapists:delete",
    "therapists:invite",
    "therapists:assign_patients",
    "schedules:view",
    "schedules:edit",
    "schedules:create",
    "schedules:manage_all",
    "reports:view",
    "reports:create",
    "reports:edit",
    "reports:delete",
    "reports:view_all",
    "reports:view_seen_by",
    "reports:resolve_comment",
    "reports:export",
    "reports:system_analytics",
    "sessions:view",
    "sessions:create",
    "sessions:edit",
    "sessions:bulk_schedule",
    "families:view",
    "families:create",
    "families:edit",
    "settings:view",
    "settings:edit",
    "settings:system",
    "users:view",
    "users:create",
    "users:edit",
    "users:delete",
    "users:manage_roles",
    "billing:view",
    "billing:manage",
    "invoices:manage",
    "tokens:manage",
    "assessments:view",
    "assessments:create",
    "assessments:edit",
    "assessments:delete",
    "assessments:manage",
    // Super admin exclusive
    "dashboard:activity",
    "leaves:view_all",
    "leaves:manage",
    "therapists:manage_leave",
    "packages:view",
    "packages:create",
    "packages:edit",
    "packages:delete",
    "financial:view_all",
    "financial:view_proofs",
  ],

  admin: [
    // Dashboard
    "dashboard:view",
    "dashboard:analytics",

    // Announcements
    "announcements:view",
    "announcements:manage",

    // Patient management
    "patients:view",
    "patients:create",
    "patients:edit",
    "patients:delete",
    "patients:assign",

    // Therapist management
    "therapists:view",
    "therapists:create",
    "therapists:edit",
    "therapists:delete",
    "therapists:invite",
    "therapists:assign_patients",

    // Schedule management
    "schedules:view",
    "schedules:edit",
    "schedules:create",
    "schedules:manage_all",

    // Reports
    "reports:view",
    "reports:create",
    "reports:edit",
    "reports:delete",
    "reports:view_all",
    "reports:view_seen_by",
    "reports:resolve_comment",
    "reports:export",
    "reports:system_analytics",

    // Sessions
    "sessions:view",
    "sessions:create",
    "sessions:edit",
    "sessions:bulk_schedule",

    // Families
    "families:view",
    "families:create",
    "families:edit",

    // Settings
    "settings:view",
    "settings:edit",
    "settings:system",

    // User management
    "users:view",
    "users:create",
    "users:edit",
    "users:delete",
    "users:manage_roles",

    // Financial
    "billing:view",
    "billing:manage",

    // Invoices
    "invoices:manage",
    "tokens:manage",

    // Assessments
    "assessments:view",
    "assessments:create",
    "assessments:edit",
    "assessments:delete",
    "assessments:manage",

    // Therapist leave requests — view only; approval/creation is super_admin-only
    "leaves:view_all",

    // Attendance
    "attendance:view",
    "attendance:checkin"
  ],

  therapist: [
    // Dashboard
    "dashboard:view",

    // Announcements (view only)
    "announcements:view",

    // Patients (only assigned)
    "patients:view_assigned",
    "patients:edit", // TODO: overbroad vs reality — the children/[id] PUT route
    // actually restricts therapists to medicalInfo fields only. Narrow this to
    // "patients:edit_medical_only" below when the children edit page/route is
    // migrated onto PermissionChecker (tracked in the refactor plan, Part C follow-on).
    "patients:edit_medical_only",

    // Schedule (own only)
    "schedules:view_own",
    "schedules:edit", // Can edit own schedule only

    // Reports (own and assigned patients)
    "reports:view",
    "reports:create",
    "reports:edit_own",
    "reports:view_own",
    "reports:view_seen_by",
    "reports:resolve_comment", // enforced per-record via canActOnOwnRecord() — own reports only

    // Sessions (assigned patients)
    "sessions:view_assigned",
    "sessions:create",
    "sessions:edit",

    // Assessments (own assigned assessments)
    "assessments:view_own",
    "assessments:edit_own",

    // Therapist self-service
    "therapists:view_own",
    "leaves:view_own",

    // Settings (limited)
    "settings:view",

    // Attendance
    "attendance:view",
    "attendance:checkin"
  ],

  parent: [
    // Dashboard
    "dashboard:view",

    // Announcements (view only)
    "announcements:view",

    // Own children only
    "patients:view_own",
    "patients:delete_own", // parent can remove their own child record

    // Own family info
    "families:view_own",
    "families:edit", // Can edit own family info

    // Sessions for own children
    "sessions:view_own",

    // Reports for own children
    "reports:view_own",

    // Assessments for own children
    "assessments:view_own",

    // Schedule viewing for assigned therapists
    "schedules:view",

    // Settings (limited)
    "settings:view",

    // Own billing
    "billing:view_own",

    // Invoices
    "invoices:view_own"
  ]
};

// Permission categories for UI organization
export const PERMISSION_CATEGORIES = {
  "Patient Management": [
    "patients:view",
    "patients:create", 
    "patients:edit",
    "patients:delete",
    "patients:assign",
    "patients:view_own",
    "patients:view_assigned"
  ],
  "Therapist Management": [
    "therapists:view",
    "therapists:create",
    "therapists:edit", 
    "therapists:delete",
    "therapists:invite",
    "therapists:assign_patients"
  ],
  "Scheduling": [
    "schedules:view",
    "schedules:edit",
    "schedules:create",
    "schedules:view_own",
    "schedules:manage_all"
  ],
  "Reports & Analytics": [
    "reports:view",
    "reports:create",
    "reports:view_own",
    "reports:view_all",
    "reports:export",
    "reports:system_analytics",
    "dashboard:analytics"
  ],
  "Settings & Administration": [
    "settings:view",
    "settings:edit",
    "settings:system",
    "users:view",
    "users:create",
    "users:edit",
    "users:delete",
    "users:manage_roles"
  ]
};

/**
 * Ownership check for "can THIS user act on THIS specific record" — the one
 * thing PermissionChecker (role-only) can't answer, since it's constructed from
 * a role alone with no record context. Elevated roles always pass; everyone else
 * must be the record's owner. Exported as a plain function (not a PermissionChecker
 * method) so API routes can import it directly too, not just React components.
 */
export function canActOnOwnRecord(
  userRole: UserRole,
  userId: string,
  ownerId: string | null | undefined,
  elevatedRoles: UserRole[] = ["admin", "super_admin"]
): boolean {
  if (elevatedRoles.includes(userRole)) return true;
  return !!ownerId && ownerId === userId;
}

/**
 * Permission checker class
 */
export class PermissionChecker {
  private userRole: UserRole;
  private permissions: Permission[];

  constructor(userRole: UserRole) {
    this.userRole = userRole;
    this.permissions = ROLE_PERMISSIONS[userRole] || [];
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: Permission): boolean {
    return this.permissions.includes(permission);
  }

  /**
   * Check if user has any of the provided permissions
   */
  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Check if user has all of the provided permissions
   */
  hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  /**
   * Get all permissions for user
   */
  getAllPermissions(): Permission[] {
    return [...this.permissions];
  }

  /**
   * Check if user can view a specific resource
   */
  canView(resource: string): boolean {
    const viewPermissions: Record<string, Permission[]> = {
      "patients": ["patients:view", "patients:view_own", "patients:view_assigned"],
      "therapists": ["therapists:view", "therapists:view_own"],
      "schedules": ["schedules:view", "schedules:view_own", "schedules:manage_all"],
      "reports": ["reports:view", "reports:view_own", "reports:view_all"],
      "assessments": ["assessments:view", "assessments:view_own"],
      "settings": ["settings:view", "settings:edit", "settings:system"],
      "billing": ["billing:view", "billing:manage", "billing:view_own"],
      "invoices": ["invoices:manage", "invoices:view_own", "billing:view", "billing:view_own"]
    };

    const resourcePermissions = viewPermissions[resource];
    return resourcePermissions ? this.hasAnyPermission(resourcePermissions) : false;
  }

  /**
   * Check if user can edit a specific resource
   */
  canEdit(resource: string): boolean {
    const editPermissions: Record<string, Permission[]> = {
      "patients": ["patients:edit", "patients:edit_medical_only"],
      "therapists": ["therapists:edit"],
      "schedules": ["schedules:edit", "schedules:manage_all"],
      "reports": ["reports:edit", "reports:edit_own"],
      "assessments": ["assessments:edit", "assessments:edit_own"],
      "settings": ["settings:edit", "settings:system"],
      "billing": ["billing:manage"],
      "invoices": ["invoices:manage"]
    };

    const resourcePermissions = editPermissions[resource];
    return resourcePermissions ? this.hasAnyPermission(resourcePermissions) : false;
  }

  /**
   * Check if user can create a specific resource
   */
  canCreate(resource: string): boolean {
    const createPermissions: Record<string, Permission[]> = {
      "patients": ["patients:create"],
      "therapists": ["therapists:create", "therapists:invite"],
      "schedules": ["schedules:create", "schedules:manage_all"],
      "reports": ["reports:create"],
      "assessments": ["assessments:create", "assessments:manage"],
      "users": ["users:create"]
    };

    const resourcePermissions = createPermissions[resource];
    return resourcePermissions ? this.hasAnyPermission(resourcePermissions) : false;
  }

  /**
   * Check if user can delete a specific resource
   */
  canDelete(resource: string): boolean {
    const deletePermissions: Record<string, Permission[]> = {
      "patients": ["patients:delete", "patients:delete_own"],
      "therapists": ["therapists:delete"],
      "assessments": ["assessments:delete"],
      "users": ["users:delete"]
    };

    const resourcePermissions = deletePermissions[resource];
    return resourcePermissions ? this.hasAnyPermission(resourcePermissions) : false;
  }

  /**
   * Get navigation items based on permissions
   */
  getNavigationItems() {
    // Role-specific navigation items
    const navigationByRole: Record<UserRole, Array<{
      name: string;
      href: string;
      icon: string;
      permissions: Permission[];
    }>> = {
      super_admin: [
        {
          name: "Dashboard",
          href: "/dashboard",
          icon: "HomeIcon",
          permissions: ["dashboard:view"]
        },
        {
          name: "Pasien",
          href: "/dashboard/patients",
          icon: "UserIcon",
          permissions: ["patients:view"]
        },
        {
          name: "Terapis",
          href: "/dashboard/therapists",
          icon: "UsersIcon",
          permissions: ["therapists:view"]
        },
        {
          name: "Jadwal",
          href: "/dashboard/schedules",
          icon: "CalendarIcon",
          permissions: ["schedules:manage_all"]
        },
        {
          name: "Laporan",
          href: "/dashboard/reports",
          icon: "BarChart3Icon",
          permissions: ["reports:view_all"]
        },
        {
          name: "Absensi",
          href: "/dashboard/attendance",
          icon: "ClipboardCheckIcon",
          permissions: ["attendance:view"]
        },
        {
          name: "Invoicing",
          href: "/dashboard/invoices",
          icon: "ReceiptIcon",
          permissions: ["invoices:manage"]
        },
        {
          name: "Kelola Paket",
          href: "/dashboard/super-admin/packages",
          icon: "PackageIcon",
          permissions: ["packages:view"]
        },
        {
          name: "Laporan Keuangan",
          href: "/dashboard/super-admin/financial",
          icon: "DollarSignIcon",
          permissions: ["financial:view_all"]
        },
      ],

      admin: [
        {
          name: "Dashboard",
          href: "/dashboard",
          icon: "HomeIcon",
          permissions: ["dashboard:view"]
        },
        {
          name: "Pasien",
          href: "/dashboard/patients", 
          icon: "UserIcon",
          permissions: ["patients:view"]
        },
        {
          name: "Terapis",
          href: "/dashboard/therapists",
          icon: "UsersIcon", 
          permissions: ["therapists:view"]
        },
        {
          name: "Jadwal",
          href: "/dashboard/schedules",
          icon: "CalendarIcon",
          permissions: ["schedules:manage_all"]
        },
        {
          name: "Laporan",
          href: "/dashboard/reports",
          icon: "BarChart3Icon",
          permissions: ["reports:view_all"]
        },
        {
          name: "Absensi",
          href: "/dashboard/attendance",
          icon: "ClipboardCheckIcon",
          permissions: ["attendance:view"]
        },
        {
          name: "Invoicing",
          href: "/dashboard/invoices",
          icon: "ReceiptIcon",
          permissions: ["invoices:manage"]
        }
      ],
      therapist: [
        {
          name: "Dashboard",
          href: "/dashboard",
          icon: "HomeIcon",
          permissions: ["dashboard:view"]
        },
        {
          name: "Pasien",
          href: "/dashboard/patients", 
          icon: "UserIcon",
          permissions: ["patients:view_assigned"]
        },
        {
          name: "Jadwal",
          href: "/dashboard/schedules",
          icon: "CalendarIcon",
          permissions: ["schedules:view_own"]
        },
        {
          name: "Laporan",
          href: "/dashboard/reports",
          icon: "FileTextIcon",
          permissions: ["reports:view_own"]
        },
        {
          name: "Absensi",
          href: "/dashboard/attendance",
          icon: "ClipboardCheckIcon",
          permissions: ["attendance:view"]
        }
      ],
      parent: [
        {
          name: "Dashboard",
          href: "/dashboard",
          icon: "HomeIcon",
          permissions: ["dashboard:view"]
        },
        {
          name: "Anak Saya",
          href: "/dashboard/patients", 
          icon: "BabyIcon",
          permissions: ["patients:view_own"]
        },
        {
          name: "Janji Temu",
          href: "/dashboard/schedules",
          icon: "CalendarIcon",
          permissions: ["schedules:view"]
        },
        {
          name: "Laporan Progress",
          href: "/dashboard/reports",
          icon: "FileTextIcon",
          permissions: ["reports:view_own"]
        },
        {
          name: "Invoice",
          href: "/dashboard/invoices",
          icon: "ReceiptIcon",
          permissions: ["invoices:view_own"]
        }
      ]
    };

    const roleItems = navigationByRole[this.userRole] || [];
    return roleItems.filter(item => this.hasAnyPermission(item.permissions));
  }

  /**
   * Get dashboard widgets based on permissions
   */
  getDashboardWidgets() {
    const widgets: Array<{
      name: string;
      component: string;
      permissions: Permission[];
      priority: number;
    }> = [
      {
        name: "System Analytics",
        component: "SystemAnalyticsWidget",
        permissions: ["dashboard:analytics"],
        priority: 1
      },
      {
        name: "My Patients",
        component: "MyPatientsWidget", 
        permissions: ["patients:view_assigned", "patients:view_own"],
        priority: 2
      },
      {
        name: "Schedule Overview",
        component: "ScheduleWidget",
        permissions: ["schedules:view", "schedules:view_own"],
        priority: 3
      },
      {
        name: "Recent Reports",
        component: "ReportsWidget",
        permissions: ["reports:view", "reports:view_own"],
        priority: 4
      },
      {
        name: "Quick Actions", 
        component: "QuickActionsWidget",
        permissions: ["dashboard:view"],
        priority: 5
      }
    ];

    return widgets
      .filter(widget => this.hasAnyPermission(widget.permissions))
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Filter data based on role restrictions
   */
  filterData<T extends { assignedTherapistId?: string; parentId?: string; therapistId?: string }>(
    data: T[], 
    userId: string,
    dataType: 'patients' | 'sessions' | 'reports'
  ): T[] {
    // Ensure data is an array
    if (!Array.isArray(data)) {
      console.warn('filterData received non-array data:', data);
      return [];
    }

    switch (this.userRole) {
      case 'super_admin':
      case 'admin':
        // Admins and super_admins can see everything
        return data;

      case 'therapist':
        // Therapists only see assigned patients/sessions
        return data.filter(item => 
          item.assignedTherapistId === userId || item.therapistId === userId
        );
        
      case 'parent':
        // Parents only see their own data
        return data.filter(item => 
          item.parentId === userId
        );
        
      default:
        return [];
    }
  }

  /**
   * Get role-specific dashboard title
   */
  getDashboardTitle(): string {
    switch (this.userRole) {
      case 'super_admin':
        return 'Super Administrasi';
      case 'admin':
        return 'Administrasi Sistem';
      case 'therapist':
        return 'Praktik Terapi';
      case 'parent':
        return 'Dashboard Keluarga';
      default:
        return 'Dashboard';
    }
  }

  /**
   * Get role-specific dashboard description
   */
  getDashboardDescription(): string {
    switch (this.userRole) {
      case 'super_admin':
        return 'Manajemen penuh sistem, paket, dan laporan keuangan';
      case 'admin':
        return 'Manajemen sistem komprehensif dan analitik';
      case 'therapist':
        return 'Kelola pasien dan sesi terapi yang ditugaskan';
      case 'parent':
        return 'Pantau perkembangan terapi dan janji temu anak Anda';
      default:
        return 'Selamat datang di Hearty Bridge';
    }
  }

  /**
   * Check if feature is available for role
   */
  isFeatureAvailable(feature: string): boolean {
    const featureMap: Record<string, Permission[]> = {
      "patient_creation": ["patients:create"],
      "therapist_management": ["therapists:view", "therapists:edit"],
      "system_settings": ["settings:system"],
      "bulk_actions": ["patients:delete", "therapists:delete"],
      "analytics": ["dashboard:analytics", "reports:system_analytics"],
      "billing": ["billing:view", "billing:manage", "billing:view_own"],
      "user_management": ["users:view", "users:create", "users:edit"]
    };

    const requiredPermissions = featureMap[feature];
    return requiredPermissions ? this.hasAnyPermission(requiredPermissions) : false;
  }
}

/**
 * Hook for easy permission checking in components.
 * Memoized on userRole — callers pass the returned PermissionChecker into
 * useEffect/useCallback dependency arrays, and an unmemoized `new` here would
 * hand back a fresh reference every render, defeating that memoization and
 * re-running those effects/callbacks on every render instead of only when the
 * role actually changes.
 */
export function usePermissions(userRole: UserRole) {
  return React.useMemo(() => new PermissionChecker(userRole), [userRole]);
}

/**
 * Permission-based component wrapper
 */
export function withPermissions<T extends {}>(
  Component: React.ComponentType<T>,
  requiredPermissions: Permission[]
): React.ComponentType<T & { userRole: UserRole }> {
  return function PermissionWrapper(props: T & { userRole: UserRole }): React.JSX.Element {
    const { userRole, ...componentProps } = props;
    const permissions = new PermissionChecker(userRole);
    
    if (!permissions.hasAnyPermission(requiredPermissions)) {
      return React.createElement('div', { className: "p-8 text-center" },
        React.createElement('div', { className: "text-gray-600 text-lg" }, "Akses Ditolak"),
        React.createElement('div', { className: "text-gray-500 text-sm" },
          "Anda tidak memiliki izin untuk melihat konten ini"
        )
      );
    }
    
    return React.createElement(Component, componentProps as unknown as T);
  };
}

/**
 * Conditional rendering based on permissions
 */
export function PermissionGuard({ 
  userRole, 
  permissions, 
  children, 
  fallback = null 
}: {
  userRole: UserRole;
  permissions: Permission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}): React.JSX.Element {
  const permissionChecker = new PermissionChecker(userRole);
  
  if (permissionChecker.hasAnyPermission(permissions)) {
    return React.createElement(React.Fragment, null, children);
  }
  
  return React.createElement(React.Fragment, null, fallback);
}