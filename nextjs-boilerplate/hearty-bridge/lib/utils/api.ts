// API utility functions for making authenticated requests

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = "/api") {
    this.baseURL = baseURL;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { "Authorization": `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const data: ApiResponse<T> = await response.json();
    
    if (!response.ok) {
      throw new ApiError(response.status, data.error || data.message || "Request failed");
    }

    if (!data.success) {
      throw new ApiError(response.status, data.error || data.message || "Request failed");
    }

    return data.data as T;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<T>(response);
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();

// Child management API functions
export interface ChildData {
  id?: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  medicalConditions?: string;
  allergies?: string;
  currentMedications?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  preferredTherapyType: string;
  referralSource?: string;
  goals?: string;
}

export interface Child extends ChildData {
  id: string;
  parentId: string;
  therapistId?: string;
  status: "active" | "paused" | "completed";
  createdAt: string;
  updatedAt: string;
}

export const childrenApi = {
  // Get all children for the authenticated parent
  getChildren: (): Promise<Child[]> => 
    apiClient.get("/children"),

  // Get a specific child by ID
  getChild: (id: string): Promise<Child> => 
    apiClient.get(`/children/${id}`),

  // Create a new child profile
  createChild: (childData: Omit<ChildData, "id">): Promise<Child> => 
    apiClient.post("/children", childData),

  // Update an existing child profile
  updateChild: (id: string, childData: Partial<ChildData>): Promise<Child> => 
    apiClient.put(`/children/${id}`, childData),

  // Delete a child profile
  deleteChild: (id: string): Promise<void> => 
    apiClient.delete(`/children/${id}`),

  // Get child progress data
  getChildProgress: (id: string): Promise<any> => 
    apiClient.get(`/children/${id}/progress`),

  // Get child session history
  getChildSessions: (id: string): Promise<any[]> => 
    apiClient.get(`/children/${id}/sessions`),
};

// Therapist API functions
export const therapistApi = {
  // Get all clients for the authenticated therapist
  getClients: (): Promise<any[]> => 
    apiClient.get("/therapist/clients"),

  // Get a specific client by ID
  getClient: (id: string): Promise<any> => 
    apiClient.get(`/therapist/clients/${id}`),

  // Update client progress
  updateClientProgress: (id: string, progressData: any): Promise<any> => 
    apiClient.put(`/therapist/clients/${id}/progress`, progressData),

  // Add session notes
  addSessionNotes: (clientId: string, notes: any): Promise<any> => 
    apiClient.post(`/therapist/clients/${clientId}/notes`, notes),
};

// Dashboard data API functions
export const dashboardApi = {
  // Get unified dashboard data (role-based filtering done server-side)
  getDashboard: (): Promise<any> => 
    apiClient.get("/dashboard"),
};

// Error handling utility
export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return "An unexpected error occurred";
};