import type { RadiusAccount } from '../types';
import { apiClient } from './api';
import { userService } from './userService';

export interface RadiusAccountView extends RadiusAccount {
  userEmail?: string;
  userName?: string;
}

export const radiusService = {
  /** Admin: list RADIUS accounts with user info */
  getAccountByUserId: async (userId: string): Promise<RadiusAccountView | null> => {
    return apiClient.get<RadiusAccountView | null>(`/radius/account/${userId}`);
  },

  listAccountsWithUsers: async (): Promise<RadiusAccountView[]> => {
    const users = await userService.getAll('Student');
    const out: RadiusAccountView[] = [];
    for (const u of users) {
      try {
        const acc = await apiClient.get<RadiusAccount>(`/radius/account/${u.id}`);
        out.push({
          ...acc,
          userEmail: u.email,
          userName: `${u.firstName} ${u.lastName}`,
        });
      } catch {
        /* no RADIUS account */
      }
    }
    return out;
  },

  setEnabled: async (userId: string, enabled: boolean): Promise<void> => {
    await apiClient.put(`/radius/account/${userId}/toggle?enabled=${enabled}`);
  },
};
