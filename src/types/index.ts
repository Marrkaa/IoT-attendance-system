export type Role = 'Student' | 'Lecturer' | 'Administrator';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  avatarUrl?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  location: string;
  routerMac?: string;
  isOnline?: boolean;
  ioTNode?: IoTNode;
  createdAt?: string;
}

export interface IoTNode {
  id: string;
  roomId: string;
  macAddress: string;
  hostname: string;
  ipAddress?: string;
  status: 'Online' | 'Offline' | 'Maintenance';
  lastSeen?: string;
  firmwareVersion?: string;
  model: string;
  hotspotSsid: string;
  signalThresholdDbm: number;
  connectedDevicesCount: number;
}

export interface Lecture {
  id: string;
  title: string;
  description?: string;
  lecturerId: string;
  roomId: string;
  /** Jei API grąžina tik schedules — užpildoma iš pirmo sloto rodymui lentelėse */
  startTime?: string;
  endTime?: string;
  dayOfWeek?: number; // 0=Monday ... 6=Sunday (sutampa su backend Schedule)
  lecturer?: User;
  room?: Room;
  enrolledCount?: number;
  schedules?: Schedule[];
}

export interface Schedule {
  id: string;
  lectureId: string;
  dayOfWeek: number; // 0=Monday ... 6=Sunday
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  validFrom?: string;
  validUntil?: string;
  lecture?: Lecture;
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
  scheduleId?: string;
  date?: string;
  timestamp: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  signalStrength: number;
  signalStrengthDbm?: number;
  avgSignalStrengthDbm?: number;
  connectionDurationMinutes?: number;
  isManualOverride?: boolean;
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

export interface StudentDevice {
  id: string;
  studentId: string;
  macAddress: string;
  deviceName?: string;
  isActive: boolean;
  registeredAt: string;
  lastSeen?: string;
  studentName?: string;
}

export interface RadiusAccount {
  id: string;
  userId: string;
  radiusUsername: string;
  isEnabled: boolean;
  createdAt: string;
}

export interface WifiConnectionLog {
  id: string;
  iotNodeId: string;
  clientMacAddress: string;
  clientIpAddress?: string;
  clientHostname?: string;
  signalStrengthDbm: number;
  eventType: 'Connected' | 'Disconnected' | 'SignalUpdate';
  timestamp: string;
  wifiInterface?: string;
}

export interface LiveAttendanceData {
  studentId: string;
  studentName: string;
  deviceMac?: string;
  signalStrengthDbm?: number;
  connectedSince?: string;
  connectionMinutes?: number;
  status: 'Connected' | 'Disconnected';
}

export interface RouterStatus {
  ioTNodeId: string;
  status: string;
  connectedClients: number;
  lastPolled?: string;
  clients: ConnectedClient[];
}

export interface ConnectedClient {
  macAddress: string;
  ipAddress?: string;
  hostname?: string;
  signalStrengthDbm: number;
  matchedStudentName?: string;
  matchedStudentId?: string;
}

export interface DailyAttendanceSummary {
  date: string;
  present: number;
  late: number;
  absent: number;
  total: number;
}

// Auth types
export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

// API response wrapper
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
