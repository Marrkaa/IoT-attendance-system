import type { Room } from '../types';
import { apiClient } from './api';
import { mockRooms } from '../mock-data/data';

const USE_MOCK = true;

export const roomService = {
  getAll: async (): Promise<Room[]> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return [...mockRooms];
    }

    return apiClient.get<Room[]>('/rooms');
  },

  getById: async (id: string): Promise<Room> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const room = mockRooms.find(r => r.id === id);
      if (!room) throw new Error('Auditorija nerasta');
      return room;
    }

    return apiClient.get<Room>(`/rooms/${id}`);
  },

  create: async (data: { name: string; capacity: number; location: string }): Promise<Room> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newRoom: Room = { ...data, id: `r${Date.now()}` };
      mockRooms.push(newRoom);
      return newRoom;
    }

    return apiClient.post<Room>('/rooms', data);
  },

  update: async (id: string, data: Partial<Room>): Promise<Room> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const index = mockRooms.findIndex(r => r.id === id);
      if (index === -1) throw new Error('Auditorija nerasta');
      mockRooms[index] = { ...mockRooms[index], ...data };
      return mockRooms[index];
    }

    return apiClient.put<Room>(`/rooms/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    if (USE_MOCK) return;
    await apiClient.delete(`/rooms/${id}`);
  },
};
