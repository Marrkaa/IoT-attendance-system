import type { AttendanceRecord, AttendanceStats, LiveAttendanceData, DailyAttendanceSummary } from '../types';
import { apiClient } from './api';
import { mockAttendance } from '../mock-data/data';

const USE_MOCK = true;

export const attendanceService = {
  getByLecture: async (lectureId: string, date?: string): Promise<AttendanceRecord[]> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockAttendance.filter(a => a.lectureId === lectureId);
    }

    const params = date ? `?date=${date}` : '';
    return apiClient.get<AttendanceRecord[]>(`/attendance/lecture/${lectureId}${params}`);
  },

  getByStudent: async (studentId: string, lectureId?: string): Promise<AttendanceRecord[]> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      let records = mockAttendance.filter(a => a.studentId === studentId);
      if (lectureId) records = records.filter(a => a.lectureId === lectureId);
      return records;
    }

    const params = lectureId ? `?lectureId=${lectureId}` : '';
    return apiClient.get<AttendanceRecord[]>(`/attendance/student/${studentId}${params}`);
  },

  getStudentStats: async (studentId: string, lectureId?: string): Promise<AttendanceStats> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const records = mockAttendance.filter(a => a.studentId === studentId);
      const present = records.filter(r => r.status === 'Present').length;
      const late = records.filter(r => r.status === 'Late').length;
      const absent = records.filter(r => r.status === 'Absent').length;
      const total = records.length;
      return {
        totalLectures: total,
        attendedLectures: present,
        lateLectures: late,
        absentLectures: absent,
        attendancePercentage: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
      };
    }

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
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockAttendance[0];
    }

    return apiClient.post<AttendanceRecord>('/attendance/manual', data);
  },

  updateStatus: async (id: string, status: string, reason?: string): Promise<AttendanceRecord> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const record = mockAttendance.find(a => a.id === id);
      if (!record) throw new Error('Įrašas nerastas');
      return { ...record, status: status as AttendanceRecord['status'] };
    }

    return apiClient.put<AttendanceRecord>(`/attendance/${id}`, { status, reason });
  },

  getLiveAttendance: async (lectureId: string): Promise<LiveAttendanceData[]> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return [];
    }

    return apiClient.get<LiveAttendanceData[]>(`/attendance/live/${lectureId}`);
  },

  getDailySummary: async (lectureId: string, startDate: string, endDate: string): Promise<DailyAttendanceSummary[]> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return [];
    }

    return apiClient.get<DailyAttendanceSummary[]>(
      `/attendance/summary/${lectureId}?startDate=${startDate}&endDate=${endDate}`
    );
  },

  getAll: async (): Promise<AttendanceRecord[]> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return [...mockAttendance];
    }

    return apiClient.get<AttendanceRecord[]>('/attendance');
  },
};
