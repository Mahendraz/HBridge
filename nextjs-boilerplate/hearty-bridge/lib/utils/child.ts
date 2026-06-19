import { IChild } from '@/models/Child';
import { IUser } from '@/models/User';

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return Math.max(0, age);
}

/**
 * Format child data for API response (safe object without sensitive data)
 */
export function formatChildForResponse(child: IChild, includePrivateInfo: boolean = false) {
  const baseInfo: any = {
    id: child._id.toString(),
    name: child.name,
    dateOfBirth: child.dateOfBirth.toISOString(),
    gender: child.gender,
    age: child.getAge(),
    isActive: child.isActive,
    createdAt: child.createdAt?.toISOString(),
    updatedAt: child.updatedAt?.toISOString(),
  };

  // Add populated parent info if available
  if (child.parentId && typeof child.parentId === 'object') {
    const parent = child.parentId as any;
    baseInfo.parent = {
      id: parent._id.toString(),
      name: parent.name,
      email: parent.email,
      phone: parent.phone,
    };
  } else if (child.parentId) {
    baseInfo.parentId = (child.parentId as any).toString();
  }

  // Add populated therapist info if available
  if (child.therapistId) {
    if (typeof child.therapistId === 'object') {
      const therapist = child.therapistId as any;
      baseInfo.therapist = {
        id: therapist._id.toString(),
        name: therapist.name,
        email: therapist.email,
        specialization: therapist.profile?.specialization,
        clinic: therapist.profile?.clinic,
      };
    } else if (child.therapistId) {
      baseInfo.therapistId = (child.therapistId as any).toString();
    }
  }

  // Include private medical and contact information if authorized
  if (includePrivateInfo) {
    if (child.medicalInfo) {
      baseInfo.medicalInfo = {
        conditions: child.medicalInfo.conditions || [],
        medications: child.medicalInfo.medications || [],
        allergies: child.medicalInfo.allergies || [],
        notes: child.medicalInfo.notes || '',
      };
    }

    if (child.contactInfo?.emergencyContact) {
      baseInfo.contactInfo = {
        emergencyContact: {
          name: child.contactInfo.emergencyContact.name || '',
          phone: child.contactInfo.emergencyContact.phone || '',
          relationship: child.contactInfo.emergencyContact.relationship || '',
        }
      };
    }
  }

  return baseInfo;
}

/**
 * Format multiple children for API response
 */
export function formatChildrenForResponse(
  children: IChild[], 
  includePrivateInfo: boolean = false
) {
  return children.map(child => formatChildForResponse(child, includePrivateInfo));
}

/**
 * Check if user has access to child based on role and relationship
 */
export function canAccessChild(
  user: { userId: string; role: 'parent' | 'therapist' | 'admin' },
  child: IChild
): boolean {
  // Parents can only access their own children
  if (user.role === 'parent') {
    return child.parentId.toString() === user.userId;
  }

  // Therapists can access children assigned to them
  if (user.role === 'therapist') {
    return child.therapistId?.toString() === user.userId;
  }

  return false;
}

/**
 * Check if user can modify child based on role and relationship
 */
export function canModifyChild(
  user: { userId: string; role: 'parent' | 'therapist' },
  child: IChild
): boolean {
  // Only parents can modify their children's basic info
  if (user.role === 'parent') {
    return child.parentId.toString() === user.userId;
  }

  // Therapists can only modify medical notes and therapy-related info for assigned children
  if (user.role === 'therapist') {
    return child.therapistId?.toString() === user.userId;
  }

  return false;
}

/**
 * Check if user can assign/unassign therapist to child
 */
export function canAssignTherapist(
  user: { userId: string; role: 'parent' | 'therapist' },
  child: IChild
): boolean {
  // Only parents can assign therapists to their children
  return user.role === 'parent' && child.parentId.toString() === user.userId;
}

/**
 * Validate that a therapist can be assigned to a child
 */
export function canTherapistBeAssigned(
  therapist: IUser,
  child: IChild
): { valid: boolean; reason?: string } {
  if (!therapist.isActive) {
    return { valid: false, reason: 'Therapist account is not active' };
  }

  if (therapist.role !== 'therapist') {
    return { valid: false, reason: 'User is not a therapist' };
  }

  // Could add additional business rules here:
  // - Maximum number of children per therapist
  // - Specialization matching
  // - Geographic restrictions
  // - Age-specific requirements

  return { valid: true };
}

/**
 * Generate child search query based on user role and permissions
 */
export function buildChildSearchQuery(
  user: { userId: string; role: 'parent' | 'therapist' | 'admin' },
  filters: {
    search?: string;
    therapistId?: string;
    hasTherapist?: boolean;
  } = {}
): any {
  const query: any = { isActive: true };

  // Role-based filtering
  if (user.role === 'parent') {
    // Parents can only see their own children
    query.parentId = user.userId;
  } else if (user.role === 'therapist') {
    // Therapists can see children assigned to them or unassigned children
    if (filters.therapistId) {
      query.therapistId = filters.therapistId;
    } else if (filters.hasTherapist === false) {
      query.therapistId = null;
    } else if (filters.hasTherapist === true) {
      query.therapistId = { $ne: null };
    } else {
      // Default: show assigned children and available children
      query.$or = [
        { therapistId: user.userId },
        { therapistId: null }
      ];
    }
  }

  // Search functionality
  if (filters.search) {
    query.name = { $regex: filters.search, $options: 'i' };
  }

  return query;
}

/**
 * Generate sort object for MongoDB query
 */
export function buildChildSortQuery(
  sortBy: 'name' | 'dateOfBirth' | 'createdAt' = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc'
): any {
  const sortQuery: any = {};
  sortQuery[sortBy] = sortOrder === 'asc' ? 1 : -1;
  
  // Secondary sort by name for consistent ordering
  if (sortBy !== 'name') {
    sortQuery.name = 1;
  }
  
  return sortQuery;
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  page: number,
  limit: number,
  totalCount: number
) {
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  
  return {
    currentPage: page,
    totalPages,
    totalCount,
    limit,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null,
  };
}

/**
 * Sanitize and prepare child data for database storage
 */
export function prepareChildDataForStorage(data: any) {
  const sanitized = { ...data };

  // Sanitize name
  if (sanitized.name) {
    sanitized.name = sanitized.name.trim().replace(/\s+/g, ' ');
  }

  // Sanitize medical information
  if (sanitized.medicalInfo) {
    if (sanitized.medicalInfo.conditions) {
      sanitized.medicalInfo.conditions = sanitized.medicalInfo.conditions
        .filter((condition: string) => condition.trim().length > 0)
        .map((condition: string) => condition.trim());
    }
    
    if (sanitized.medicalInfo.medications) {
      sanitized.medicalInfo.medications = sanitized.medicalInfo.medications
        .filter((medication: string) => medication.trim().length > 0)
        .map((medication: string) => medication.trim());
    }
    
    if (sanitized.medicalInfo.allergies) {
      sanitized.medicalInfo.allergies = sanitized.medicalInfo.allergies
        .filter((allergy: string) => allergy.trim().length > 0)
        .map((allergy: string) => allergy.trim());
    }
    
    if (sanitized.medicalInfo.notes) {
      sanitized.medicalInfo.notes = sanitized.medicalInfo.notes.trim();
    }
  }

  // Sanitize contact information
  if (sanitized.contactInfo?.emergencyContact) {
    const contact = sanitized.contactInfo.emergencyContact;
    if (contact.name) contact.name = contact.name.trim();
    if (contact.phone) contact.phone = contact.phone.replace(/\s/g, '');
    if (contact.relationship) contact.relationship = contact.relationship.trim();
  }

  return sanitized;
}

/**
 * Get child statistics for dashboard
 */
export function calculateChildStats(children: IChild[]) {
  const stats = {
    total: children.length,
    withTherapist: 0,
    withoutTherapist: 0,
    byGender: { male: 0, female: 0 },
    byAgeGroup: {
      infant: 0,      // 0-2 years
      toddler: 0,     // 3-5 years
      child: 0,       // 6-12 years
      teenager: 0,    // 13-18 years
    }
  };

  children.forEach(child => {
    // Therapist assignment
    if (child.therapistId) {
      stats.withTherapist++;
    } else {
      stats.withoutTherapist++;
    }

    // Gender distribution
    stats.byGender[child.gender]++;

    // Age group distribution
    const age = child.getAge();
    if (age <= 2) {
      stats.byAgeGroup.infant++;
    } else if (age <= 5) {
      stats.byAgeGroup.toddler++;
    } else if (age <= 12) {
      stats.byAgeGroup.child++;
    } else {
      stats.byAgeGroup.teenager++;
    }
  });

  return stats;
}

/**
 * Validate child age constraints
 */
export function validateChildAge(dateOfBirth: Date): { valid: boolean; message?: string } {
  const age = calculateAge(dateOfBirth);
  
  if (age > 18) {
    return { valid: false, message: 'Child must be 18 years old or younger' };
  }

  if (age < 0) {
    return { valid: false, message: 'Date of birth cannot be in the future' };
  }

  return { valid: true };
}

/**
 * Generate activity log message for child operations
 */
export function generateChildActivityLog(
  operation: 'created' | 'updated' | 'deleted' | 'assigned_therapist' | 'unassigned_therapist',
  child: IChild,
  user: { name: string; email: string; role: string },
  additionalInfo?: any
): string {
  const timestamp = new Date().toISOString();
  
  switch (operation) {
    case 'created':
      return `[${timestamp}] Child "${child.name}" created by ${user.name} (${user.email})`;
    case 'updated':
      return `[${timestamp}] Child "${child.name}" updated by ${user.name} (${user.email})`;
    case 'deleted':
      return `[${timestamp}] Child "${child.name}" deleted by ${user.name} (${user.email})`;
    case 'assigned_therapist':
      return `[${timestamp}] Therapist assigned to "${child.name}" by ${user.name} (${user.email})`;
    case 'unassigned_therapist':
      return `[${timestamp}] Therapist unassigned from "${child.name}" by ${user.name} (${user.email})`;
    default:
      return `[${timestamp}] Child "${child.name}" ${operation} by ${user.name} (${user.email})`;
  }
}