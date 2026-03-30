import type { Lecture, Enrollment } from '../types';
import { mockLectures, mockEnrollments, mockUsers } from '../mock-data/data';
import { simulateDelay } from './api';

export const lectureService = {
  getAll: async (): Promise<Lecture[]> => {
    await simulateDelay();
    return [...mockLectures];
  },

  getById: async (id: string): Promise<Lecture | undefined> => {
    await simulateDelay();
    return mockLectures.find(l => l.id === id);
  },

  getByLecturer: async (lecturerId: string): Promise<Lecture[]> => {
    await simulateDelay();
    return mockLectures.filter(l => l.lecturerId === lecturerId);
  },

  getByStudent: async (studentId: string): Promise<Lecture[]> => {
    await simulateDelay();
    const enrolledLectureIds = mockEnrollments
      .filter(e => e.studentId === studentId)
      .map(e => e.lectureId);
    return mockLectures.filter(l => enrolledLectureIds.includes(l.id));
  },

  getEnrollments: async (lectureId: string): Promise<Enrollment[]> => {
    await simulateDelay();
    return mockEnrollments
      .filter(e => e.lectureId === lectureId)
      .map(e => ({ ...e, student: mockUsers.find(u => u.id === e.studentId) }));
  },

  create: async (data: Omit<Lecture, 'id'>): Promise<Lecture> => {
    await simulateDelay();
    const newLecture: Lecture = { ...data, id: `l${Date.now()}` };
    mockLectures.push(newLecture);
    return newLecture;
  },
};
