export type Role = 'Student' | 'Lecturer' | 'Administrator';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  avatarUrl?: string;
  isActive?: boolean;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  location: string;
  routerMac?: string;
  isOnline?: boolean;
}

export interface IoTNode {
  id: string;
  roomId: string;
  macAddress: string;
  status: 'online' | 'offline' | 'maintenance';
  connectedDevices: number;
  lastSeen: string;
}

export interface Lecture {
  id: string;
  title: string;
  description: string;
  lecturerId: string;
  roomId: string;
  startTime: string;
  endTime: string;
  dayOfWeek?: number; // 0=Mon ... 4=Fri
  lecturer?: User;
  room?: Room;
  enrolledCount?: number;
}

export interface Enrollment {
  id: string;
  studentId: string;
  lectureId: string;
  enrolledAt: string;
  student?: User;
  lecture?: Lecture;
}

export type AttendanceStatus = 'Present' | 'Late' | 'Absent';

export interface AttendanceRecord {
  id: string;
  lectureId: string;
  studentId: string;
  status: AttendanceStatus;
  timestamp: string;
  signalStrength?: number;
  connectionDurationMinutes?: number;
  student?: User;
  lecture?: Lecture;
}

export interface AttendanceStats {
  totalLectures: number;
  attendedLectures: number;
  lateLectures: number;
  absentLectures: number;
  attendancePercentage: number;
}

export interface Schedule {
  id: string;
  lectureId: string;
  dayOfWeek: number; // 0=Monday ... 4=Friday
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  lecture?: Lecture;
}

// API response wrapper for future backend integration
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
}
