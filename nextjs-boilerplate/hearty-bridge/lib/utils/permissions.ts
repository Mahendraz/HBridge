/**
 * Unified Role-Based Access Control (RBAC) System
 * Eliminates duplicate files and provides dynamic permissions
 */

import React from "react";

export type UserRole = "admin" | "therapist" | "parent";

export type Permission = 
  // Dashboard permissions
  | "dashboard:view"
  | "dashboard:analytics"
  
  // Patient management permissions
  | "patients:view"
  | "patients:create"
  | "patients:edit"
  | "patients:delete"
  | "patients:assign"
  | "patients:view_own"
  | "patients:view_assigned"
  
  // Therapist management permissions
  | "therapists:view"
  | "therapists:create"
  | "therapists:edit"
  | "therapists:delete"
  | "therapists:invite"
  | "therapists:assign_patients"
  
  // Schedule management permissions
  | "schedules:view"
  | "schedules:edit"
  | "schedules:create"
  | "schedules:view_own"
  | "schedules:manage_all"
  
  // Reports permissions
  | "reports:view"
  | "reports:create"
  | "reports:view_own"
  | "reports:view_all"
  | "reports:export"
  | "reports:system_analytics"
  
  // Session permissions
  | "sessions:view"
  | "sessions:create"
  | "sessions:edit"
  | "sessions:view_own"
  | "sessions:view_assigned"
  
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
  
  // Communication permissions
  | "messages:view"
  | "messages:send"
  | "messages:view_own"
  
  // Financial permissions
  | "billing:view"
  | "billing:manage"
  | "billing:view_own";

// Role-to-permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    // Dashboard
    "dashboard:view",
    "dashboard:analytics",
    
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
    "reports:view_all",
    "reports:export",
    "reports:system_analytics",
    
    // Sessions
    "sessions:view",
    "sessions:create",
    "sessions:edit",
    
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
    
    // Communication
    "messages:view",
    "messages:send",
    
    // Financial
    "billing:view",
    "billing:manage"
  ],
  
  therapist: [
    // Dashboard
    "dashboard:view",
    
    // Patients (only assigned)
    "patients:view_assigned",
    "patients:edit", // Can edit assigned patients only
    
    // Schedule (own only)
    "schedules:view_own",
    "schedules:edit", // Can edit own schedule only
    
    // Reports (own and assigned patients)
    "reports:view",
    "reports:create",
    "reports:view_own",
    
    // Sessions (assigned patients)
    "sessions:view_assigned",
    "sessions:create",
    "sessions:edit",
    
    // Settings (limited)
    "settings:view",
    
    // Communication (assigned patients/families)
    "messages:view_own",
    "messages:send"
  ],
  
  parent: [
    // Dashboard
    "dashboard:view",
    
    // Own children only
    "patients:view_own",
    
    // Own family info
    "families:view_own",
    "families:edit", // Can edit own family info
    
    // Sessions for own children
    "sessions:view_own",
    
    // Reports for own children
    "reports:view_own",
    
    // Schedule viewing for assigned therapists
    "schedules:view",
    
    // Settings (limited)
    "settings:view",
    
    // Communication with assigned therapists
    "messages:view_own",
    "messages:send",
    
    // Own billing
    "billing:view_own"
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
      "therapists": ["therapists:view"],
      "schedules": ["schedules:view", "schedules:view_own", "schedules:manage_all"],
      "reports": ["reports:view", "reports:view_own", "reports:view_all"],
      "settings": ["settings:view", "settings:edit", "settings:system"],
      "billing": ["billing:view", "billing:manage", "billing:view_own"]
    };

    const resourcePermissions = viewPermissions[resource];
    return resourcePermissions ? this.hasAnyPermission(resourcePermissions) : false;
  }

  /**
   * Check if user can edit a specific resource
   */
  canEdit(resource: string): boolean {
    const editPermissions: Record<string, Permission[]> = {
      "patients": ["patients:edit"],
      "therapists": ["therapists:edit"],
      "schedules": ["schedules:edit", "schedules:manage_all"],
      "reports": ["reports:create"],
      "settings": ["settings:edit", "settings:system"],
      "billing": ["billing:manage"]
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
      "patients": ["patients:delete"],
      "therapists": ["therapists:delete"],
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
          name: "Pengaturan",
          href: "/dashboard/settings",
          icon: "CogIcon",
          permissions: ["settings:system"]
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
          name: "Pesan",
          href: "/dashboard/messages",
          icon: "MailIcon",
          permissions: ["messages:view_own"]
        },
        {
          name: "Pengaturan",
          href: "/dashboard/settings",
          icon: "CogIcon",
          permissions: ["settings:view"]
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
          name: "Pesan",
          href: "/dashboard/messages",
          icon: "MailIcon",
          permissions: ["messages:view_own"]
        },
        {
          name: "Pengaturan",
          href: "/dashboard/settings",
          icon: "CogIcon",
          permissions: ["settings:view"]
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
      case 'admin':
        // Admins can see everything
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
 * Hook for easy permission checking in components
 */
export function usePermissions(userRole: UserRole) {
  return new PermissionChecker(userRole);
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