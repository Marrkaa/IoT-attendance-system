import type { AttendanceRecord, AttendanceStats, AttendanceStatus } from '../types';
import { mockAttendance } from '../mock-data/data';
import { simulateDelay } from './api';

export const attendanceService = {
  getByLecture: async (lectureId: string): Promise<AttendanceRecord[]> => {
    await simulateDelay();
    return mockAttendance.filter(a => a.lectureId === lectureId);
  },

  getByStudent: async (studentId: string): Promise<AttendanceRecord[]> => {
    await simulateDelay();
    return mockAttendance.filter(a => a.studentId === studentId);
  },

  getStudentStats: async (studentId: string): Promise<AttendanceStats> => {
    await simulateDelay();
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
  },

  updateStatus: async (recordId: string, status: AttendanceStatus): Promise<AttendanceRecord> => {
    await simulateDelay();
    const record = mockAttendance.find(a => a.id === recordId);
    if (!record) throw new Error('Record not found');
    record.status = status;
    return record;
  },

  getAll: async (): Promise<AttendanceRecord[]> => {
    await simulateDelay();
    return [...mockAttendance];
  },
};
