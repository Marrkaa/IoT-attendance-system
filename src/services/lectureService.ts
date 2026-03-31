import type { Lecture, Enrollment } from '../types';
import { apiClient } from './api';
import { mockLectures, mockEnrollments, mockUsers } from '../mock-data/data';

const USE_MOCK = true;

export const lectureService = {
  getAll: async (lecturerId?: string): Promise<Lecture[]> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (lecturerId) return mockLectures.filter(l => l.lecturerId === lecturerId);
      return [...mockLectures];
    }

    const params = lecturerId ? `?lecturerId=${lecturerId}` : '';
    return apiClient.get<Lecture[]>(`/lectures${params}`);
  },

  getById: async (id: string): Promise<Lecture> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const lecture = mockLectures.find(l => l.id === id);
      if (!lecture) throw new Error('Paskaita nerasta');
      return lecture;
    }

    return apiClient.get<Lecture>(`/lectures/${id}`);
  },

  getByStudent: async (studentId: string): Promise<Lecture[]> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const enrolledLectureIds = mockEnrollments
        .filter(e => e.studentId === studentId)
        .map(e => e.lectureId);
      return mockLectures.filter(l => enrolledLectureIds.includes(l.id));
    }

    const enrollments = await apiClient.get<Enrollment[]>(`/enrollments/student/${studentId}`);
    return enrollments.map(e => e.lecture!).filter(Boolean);
  },

  getEnrollments: async (lectureId: string): Promise<Enrollment[]> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockEnrollments
        .filter(e => e.lectureId === lectureId)
        .map(e => ({ ...e, student: mockUsers.find(u => u.id === e.studentId) }));
    }

    return apiClient.get<Enrollment[]>(`/enrollments/lecture/${lectureId}`);
  },

  create: async (data: { title: string; description?: string; lecturerId: string; roomId: string }): Promise<Lecture> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newLecture: Lecture = {
        ...data,
        id: `l${Date.now()}`,
        dayOfWeek: 0,
        startTime: '08:00',
        endTime: '09:30',
      };
      mockLectures.push(newLecture);
      return newLecture;
    }

    return apiClient.post<Lecture>('/lectures', data);
  },

  update: async (id: string, data: Partial<Lecture>): Promise<Lecture> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const index = mockLectures.findIndex(l => l.id === id);
      if (index === -1) throw new Error('Paskaita nerasta');
      mockLectures[index] = { ...mockLectures[index], ...data };
      return mockLectures[index];
    }

    return apiClient.put<Lecture>(`/lectures/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    if (USE_MOCK) return;
    await apiClient.delete(`/lectures/${id}`);
  },
};
