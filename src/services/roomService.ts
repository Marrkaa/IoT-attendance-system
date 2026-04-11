/**
 * Auditorijos — visada iš /api/rooms (admin CRUD).
 * Pastaba: backend kol kas neturi „router MAC“ lauko kambaryje — jis siejamas per IoT mazgą (room.ioTNode).
 */
import type { Room } from '../types';
import { apiClient } from './api';

export type CreateRoomPayload = { name: string; capacity: number; location: string };
export type UpdateRoomPayload = { name?: string; capacity?: number; location?: string };

export const roomService = {
  getAll: async (): Promise<Room[]> => {
    return apiClient.get<Room[]>('/rooms');
  },

  getById: async (id: string): Promise<Room> => {
    return apiClient.get<Room>(`/rooms/${id}`);
  },

  create: async (data: CreateRoomPayload): Promise<Room> => {
    return apiClient.post<Room>('/rooms', data);
  },

  update: async (id: string, data: UpdateRoomPayload): Promise<Room> => {
    return apiClient.put<Room>(`/rooms/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/rooms/${id}`);
  },
};
