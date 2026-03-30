import type { User } from '../types';
import { mockUsers } from '../mock-data/data';

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const user = mockUsers.find(u => u.email === email);
    
    if (user && password === 'password') {
      return user;
    }
    
    throw new Error('Invalid email or password');
  },
  
  getCurrentUser: async (): Promise<User | null> => {
    const stored = localStorage.getItem('iot_user');
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem('iot_user');
  }
};
