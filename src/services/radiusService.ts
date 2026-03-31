import type { RadiusAccount } from '../types';
import { apiClient } from './api';
import { mockRadiusAccounts, mockUsers } from '../mock-data/data';

const USE_MOCK = true;

export interface RadiusAccountView extends RadiusAccount {
  userEmail?: string;
  userName?: string;
}

export const radiusService = {
  /** Administratoriaus: RADIUS paskyros peržiūra pagal naudotoją */
  getAccountByUserId: async (userId: string): Promise<RadiusAccountView | null> => {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      const acc = mockRadiusAccounts.find((a) => a.userId === userId);
      if (!acc) return null;
      const u = mockUsers.find((x) => x.id === userId);
      return {
        ...acc,
        userEmail: u?.email,
        userName: u ? `${u.firstName} ${u.lastName}` : undefined,
      };
    }
    return apiClient.get<RadiusAccountView | null>(`/radius/account/${userId}`);
  },

  listAccountsWithUsers: async (): Promise<RadiusAccountView[]> => {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
      return mockRadiusAccounts.map((acc) => {
        const u = mockUsers.find((x) => x.id === acc.userId);
        return {
          ...acc,
          userEmail: u?.email,
          userName: u ? `${u.firstName} ${u.lastName}` : undefined,
        };
      });
    }
    const { userService } = await import('./userService');
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
        /* nėra RADIUS paskyros */
      }
    }
    return out;
  },

  setEnabled: async (userId: string, enabled: boolean): Promise<void> => {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      const acc = mockRadiusAccounts.find((a) => a.userId === userId);
      if (acc) acc.isEnabled = enabled;
      return;
    }
    await apiClient.put(`/radius/account/${userId}/toggle?enabled=${enabled}`);
  },
};
