import type { User } from '../types';
import { apiClient } from './api';
import { mockUsers } from '../mock-data/data';

const USE_MOCK = true;

export const userService = {
  getAll: async (role?: string, search?: string): Promise<User[]> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      let users = [...mockUsers];
      if (role) users = users.filter(u => u.role === role);
      if (search) users = users.filter(u =>
        `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase()));
      return users;
    }

    const params = new URLSearchParams();
    if (role) params.set('role', role);
    if (search) params.set('search', search);
    return apiClient.get<User[]>(`/users?${params}`);
  },

  getById: async (id: string): Promise<User> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const user = mockUsers.find(u => u.id === id);
      if (!user) throw new Error('User not found');
      return user;
    }

    return apiClient.get<User>(`/users/${id}`);
  },

  create: async (data: { email: string; password: string; firstName: string; lastName: string; role: string }): Promise<User> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newUser: User = { id: `u${Date.now()}`, ...data, role: data.role as User['role'], isActive: true };
      mockUsers.push(newUser);
      return newUser;
    }

    return apiClient.post<User>('/users', data);
  },

  update: async (id: string, data: Partial<User>): Promise<User> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const index = mockUsers.findIndex(u => u.id === id);
      if (index === -1) throw new Error('User not found');
      mockUsers[index] = { ...mockUsers[index], ...data };
      return mockUsers[index];
    }

    return apiClient.put<User>(`/users/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return;
    }

    await apiClient.delete(`/users/${id}`);
  },
};
