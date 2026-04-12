import type { StudentDevice } from '../types';
import { apiClient } from './api';

export const deviceService = {
  getAll: async (): Promise<StudentDevice[]> => {
    return apiClient.get<StudentDevice[]>('/devices');
  },

  getByStudent: async (studentId: string): Promise<StudentDevice[]> => {
    return apiClient.get<StudentDevice[]>(`/devices/student/${studentId}`);
  },

  register: async (data: {
    studentId: string;
    macAddress: string;
    deviceName?: string;
  }): Promise<StudentDevice> => {
    return apiClient.post<StudentDevice>('/devices', {
      studentId: data.studentId,
      macAddress: data.macAddress,
      deviceName: data.deviceName,
    });
  },

  update: async (
    id: string,
    data: { deviceName?: string; isActive?: boolean }
  ): Promise<StudentDevice> => {
    return apiClient.put<StudentDevice>(`/devices/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/devices/${id}`);
  },
};
