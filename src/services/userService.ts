import type { User } from '../types';
import { mockUsers } from '../mock-data/data';
import { simulateDelay } from './api';

// Mock implementation — replace with apiClient calls when backend is ready
export const userService = {
  getAll: async (): Promise<User[]> => {
    await simulateDelay();
    return [...mockUsers];
  },

  getById: async (id: string): Promise<User | undefined> => {
    await simulateDelay();
    return mockUsers.find(u => u.id === id);
  },

  getByRole: async (role: string): Promise<User[]> => {
    await simulateDelay();
    return mockUsers.filter(u => u.role === role);
  },

  create: async (data: Omit<User, 'id'>): Promise<User> => {
    await simulateDelay();
    const newUser: User = { ...data, id: `u${Date.now()}` };
    mockUsers.push(newUser);
    return newUser;
  },

  update: async (id: string, data: Partial<User>): Promise<User> => {
    await simulateDelay();
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');
    mockUsers[index] = { ...mockUsers[index], ...data };
    return mockUsers[index];
  },
};
