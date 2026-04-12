import type { User, AuthResponse } from '../types';
import { apiClient } from './api';

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    localStorage.setItem('token', response.token);
    return response.user;
  },

  register: async (email: string, password: string, firstName: string, lastName: string): Promise<User> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', {
      email, password, firstName, lastName,
    });
    localStorage.setItem('token', response.token);
    return response.user;
  },

  getCurrentUser: async (): Promise<User | null> => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return apiClient.get<User>('/auth/me');
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem('iot_user');
    localStorage.removeItem('token');
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/change-password', { currentPassword, newPassword });
  },
};
