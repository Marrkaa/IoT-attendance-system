/**
 * Attendance service — /api/attendance endpoints (real API, no mock data).
 */
import type { AttendanceRecord, AttendanceStats, LiveAttendanceData, DailyAttendanceSummary } from '../types';
import { apiClient } from './api';

export const attendanceService = {
  getByLecture: async (lectureId: string, date?: string): Promise<AttendanceRecord[]> => {
    const params = date ? `?date=${date}` : '';
    return apiClient.get<AttendanceRecord[]>(`/attendance/lecture/${lectureId}${params}`);
  },

  getByStudent: async (studentId: string, lectureId?: string): Promise<AttendanceRecord[]> => {
    const params = lectureId ? `?lectureId=${lectureId}` : '';
    return apiClient.get<AttendanceRecord[]>(`/attendance/student/${studentId}${params}`);
  },

  getStudentStats: async (studentId: string, lectureId?: string): Promise<AttendanceStats> => {
    const params = lectureId ? `?lectureId=${lectureId}` : '';
    return apiClient.get<AttendanceStats>(`/attendance/stats/${studentId}${params}`);
  },

  manualMark: async (data: {
    studentId: string;
    lectureId: string;
    scheduleId: string;
    date: string;
    status: string;
    reason?: string;
  }): Promise<AttendanceRecord> => {
    return apiClient.post<AttendanceRecord>('/attendance/manual', data);
  },

  updateStatus: async (id: string, status: string, reason?: string): Promise<AttendanceRecord> => {
    return apiClient.put<AttendanceRecord>(`/attendance/${id}`, { status, reason });
  },

  getLiveAttendance: async (lectureId: string): Promise<LiveAttendanceData[]> => {
    return apiClient.get<LiveAttendanceData[]>(`/attendance/live/${lectureId}`);
  },

  getDailySummary: async (lectureId: string, startDate: string, endDate: string): Promise<DailyAttendanceSummary[]> => {
    return apiClient.get<DailyAttendanceSummary[]>(
      `/attendance/summary/${lectureId}?startDate=${startDate}&endDate=${endDate}`
    );
  },
};
