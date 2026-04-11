/**
 * Studentų įstojimai į paskaitas — /api/enrollments.
 * Admin kuria šaliną; sąrašai naudojami „Assign students“ modale.
 */
import type { Enrollment } from '../types';
import { apiClient } from './api';

export const enrollmentService = {
  getByLecture: async (lectureId: string): Promise<Enrollment[]> => {
    return apiClient.get<Enrollment[]>(`/enrollments/lecture/${lectureId}`);
  },

  getByStudent: async (studentId: string): Promise<Enrollment[]> => {
    return apiClient.get<Enrollment[]>(`/enrollments/student/${studentId}`);
  },

  create: async (data: { studentId: string; lectureId: string }): Promise<Enrollment> => {
    return apiClient.post<Enrollment>('/enrollments', data);
  },

  delete: async (enrollmentId: string): Promise<void> => {
    await apiClient.delete(`/enrollments/${enrollmentId}`);
  },
};
