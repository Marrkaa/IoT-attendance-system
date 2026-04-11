/**
 * Admin tvarkaraščiai — tiesioginiai kvietimai į backend /api/schedules.
 * Čia saugomi savaitės slotai (diena + nuo/iki laiko) susietai su paskaita.
 */
import type { Schedule } from '../types';
import { apiClient } from './api';

export type CreateSchedulePayload = {
  lectureId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  validFrom?: string | null;
  validUntil?: string | null;
};

export type UpdateSchedulePayload = {
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  validFrom?: string | null;
  validUntil?: string | null;
};

export const scheduleService = {
  getAll: async (lectureId?: string): Promise<Schedule[]> => {
    const q = lectureId ? `?lectureId=${encodeURIComponent(lectureId)}` : '';
    return apiClient.get<Schedule[]>(`/schedules${q}`);
  },

  getById: async (id: string): Promise<Schedule> => {
    return apiClient.get<Schedule>(`/schedules/${id}`);
  },

  create: async (data: CreateSchedulePayload): Promise<Schedule> => {
    return apiClient.post<Schedule>('/schedules', data);
  },

  update: async (id: string, data: UpdateSchedulePayload): Promise<Schedule> => {
    return apiClient.put<Schedule>(`/schedules/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/schedules/${id}`);
  },
};
