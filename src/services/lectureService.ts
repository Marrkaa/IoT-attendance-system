/**
 * Paskaitos — /api/lectures + susiję įstojimai per getEnrollments.
 * Po GET uždedame startTime/endTime/dayOfWeek iš pirmo tvarkaraščio slotų,
 * kad senesnės lentelės (formatTime) veiktų be keitimų visur.
 */
import type { Lecture, Enrollment } from '../types';
import { apiClient } from './api';

function applyScheduleDefaults(lec: Lecture): Lecture {
  const s = lec.schedules?.[0];
  return {
    ...lec,
    dayOfWeek: s?.dayOfWeek ?? lec.dayOfWeek ?? 0,
    startTime: s?.startTime ?? lec.startTime ?? '09:00',
    endTime: s?.endTime ?? lec.endTime ?? '10:00',
  };
}

export const lectureService = {
  getAll: async (lecturerId?: string): Promise<Lecture[]> => {
    const params = lecturerId ? `?lecturerId=${lecturerId}` : '';
    const list = await apiClient.get<Lecture[]>(`/lectures${params}`);
    return list.map(applyScheduleDefaults);
  },

  getById: async (id: string): Promise<Lecture> => {
    const lec = await apiClient.get<Lecture>(`/lectures/${id}`);
    return applyScheduleDefaults(lec);
  },

  getByStudent: async (studentId: string): Promise<Lecture[]> => {
    const enrollments = await apiClient.get<Enrollment[]>(`/enrollments/student/${studentId}`);
    return enrollments
      .map((e) => (e.lecture ? applyScheduleDefaults(e.lecture) : null))
      .filter((x): x is Lecture => x != null);
  },

  getEnrollments: async (lectureId: string): Promise<Enrollment[]> => {
    return apiClient.get<Enrollment[]>(`/enrollments/lecture/${lectureId}`);
  },

  create: async (data: {
    title: string;
    description?: string;
    lecturerId: string;
    roomId: string;
  }): Promise<Lecture> => {
    const lec = await apiClient.post<Lecture>('/lectures', data);
    return applyScheduleDefaults(lec);
  },

  update: async (id: string, data: Partial<Lecture>): Promise<Lecture> => {
    const lec = await apiClient.put<Lecture>(`/lectures/${id}`, data);
    return applyScheduleDefaults(lec);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/lectures/${id}`);
  },
};
