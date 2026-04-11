/**
 * User management — /api/users (supports role and search filters).
 */
import type { User } from '../types';
import { apiClient } from './api';

export const userService = {
  getAll: async (role?: string, search?: string): Promise<User[]> => {
    const params = new URLSearchParams();
    if (role) params.set('role', role);
    if (search) params.set('search', search);
    const q = params.toString();
    return apiClient.get<User[]>(`/users${q ? `?${q}` : ''}`);
  },

  getById: async (id: string): Promise<User> => {
    return apiClient.get<User>(`/users/${id}`);
  },

  create: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
  }): Promise<User> => {
    return apiClient.post<User>('/users', data);
  },

  update: async (id: string, data: Partial<User>): Promise<User> => {
    return apiClient.put<User>(`/users/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};
