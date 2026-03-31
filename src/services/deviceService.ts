import type { StudentDevice } from '../types';
import { apiClient } from './api';
import { mockStudentDevices, mockUsers } from '../mock-data/data';

const USE_MOCK = true;

export const deviceService = {
  getAll: async (): Promise<StudentDevice[]> => {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
      return mockStudentDevices.map((d) => {
        const u = mockUsers.find((x) => x.id === d.studentId);
        return {
          ...d,
          studentName: u ? `${u.firstName} ${u.lastName}` : d.studentName,
        };
      });
    }
    return apiClient.get<StudentDevice[]>('/devices');
  },

  getByStudent: async (studentId: string): Promise<StudentDevice[]> => {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
      return mockStudentDevices.filter((d) => d.studentId === studentId);
    }
    return apiClient.get<StudentDevice[]>(`/devices/student/${studentId}`);
  },

  register: async (data: {
    studentId: string;
    macAddress: string;
    deviceName?: string;
  }): Promise<StudentDevice> => {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 500));
      const mac = data.macAddress.toUpperCase().trim();
      if (mockStudentDevices.some((d) => d.macAddress === mac)) {
        throw new Error('Šis MAC adresas jau registruotas.');
      }
      const student = mockUsers.find((u) => u.id === data.studentId);
      const created: StudentDevice = {
        id: `sd${Date.now()}`,
        studentId: data.studentId,
        macAddress: mac,
        deviceName: data.deviceName,
        isActive: true,
        registeredAt: new Date().toISOString(),
        studentName: student ? `${student.firstName} ${student.lastName}` : undefined,
      };
      mockStudentDevices.push(created);
      return created;
    }
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
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
      const i = mockStudentDevices.findIndex((d) => d.id === id);
      if (i === -1) throw new Error('Įrenginys nerastas');
      mockStudentDevices[i] = { ...mockStudentDevices[i], ...data };
      return mockStudentDevices[i];
    }
    return apiClient.put<StudentDevice>(`/devices/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
      const i = mockStudentDevices.findIndex((d) => d.id === id);
      if (i === -1) throw new Error('Įrenginys nerastas');
      mockStudentDevices.splice(i, 1);
      return;
    }
    await apiClient.delete(`/devices/${id}`);
  },
};
