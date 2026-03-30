import type { Room } from '../types';
import { mockRooms } from '../mock-data/data';
import { simulateDelay } from './api';

export const roomService = {
  getAll: async (): Promise<Room[]> => {
    await simulateDelay();
    return [...mockRooms];
  },

  getById: async (id: string): Promise<Room | undefined> => {
    await simulateDelay();
    return mockRooms.find(r => r.id === id);
  },

  create: async (data: Omit<Room, 'id'>): Promise<Room> => {
    await simulateDelay();
    const newRoom: Room = { ...data, id: `r${Date.now()}` };
    mockRooms.push(newRoom);
    return newRoom;
  },

  update: async (id: string, data: Partial<Room>): Promise<Room> => {
    await simulateDelay();
    const index = mockRooms.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Room not found');
    mockRooms[index] = { ...mockRooms[index], ...data };
    return mockRooms[index];
  },
};
