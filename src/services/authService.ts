import type { User, AuthResponse } from '../types';
import { apiClient } from './api';
import { mockUsers } from '../mock-data/data';

const USE_MOCK = false; // Switch to false when backend is running

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 800));
      const user = mockUsers.find(u => u.email === email);
      if (user && password === 'password') return user;
      throw new Error('Invalid email or password');
    }

    const response = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    localStorage.setItem('token', response.token);
    return response.user;
  },

  register: async (email: string, password: string, firstName: string, lastName: string): Promise<User> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 800));
      const newUser: User = {
        id: `u${Date.now()}`,
        email, firstName, lastName,
        role: 'Student',
        isActive: true,
      };
      return newUser;
    }

    const response = await apiClient.post<AuthResponse>('/auth/register', {
      email, password, firstName, lastName,
    });
    localStorage.setItem('token', response.token);
    return response.user;
  },

  getCurrentUser: async (): Promise<User | null> => {
    if (USE_MOCK) {
      const stored = localStorage.getItem('iot_user');
      return stored ? JSON.parse(stored) : null;
    }

    const token = localStorage.getItem('token');
    if (!token) return null;
    return apiClient.get<User>('/auth/me');
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem('iot_user');
    localStorage.removeItem('token');
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    if (USE_MOCK) return;
    await apiClient.post('/auth/change-password', { currentPassword, newPassword });
  },
};
