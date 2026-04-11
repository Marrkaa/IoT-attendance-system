import type {
  User,
  Lecture,
  AttendanceRecord,
  Room,
  Schedule,
  Enrollment,
  IoTNode,
  StudentDevice,
  RouterStatus,
  ConnectedClient,
  RadiusAccount,
} from '../types';

export const mockUsers: User[] = [
  { id: '1', email: 'admin@school.edu', firstName: 'System', lastName: 'Admin', role: 'Administrator', isActive: true },
  { id: '2', email: 'lecturer@school.edu', firstName: 'Dr. Jane', lastName: 'Doe', role: 'Lecturer', isActive: true },
  { id: '3', email: 'student1@school.edu', firstName: 'Alice', lastName: 'Smith', role: 'Student', isActive: true },
  { id: '4', email: 'student2@school.edu', firstName: 'Bob', lastName: 'Johnson', role: 'Student', isActive: true },
  { id: '5', email: 'student3@school.edu', firstName: 'Charlie', lastName: 'Brown', role: 'Student', isActive: true },
  { id: '6', email: 'student4@school.edu', firstName: 'Diana', lastName: 'Lee', role: 'Student', isActive: true },
  { id: '7', email: 'student5@school.edu', firstName: 'Eve', lastName: 'Garcia', role: 'Student', isActive: false },
  { id: '8', email: 'lecturer2@school.edu', firstName: 'Prof. Mark', lastName: 'Wilson', role: 'Lecturer', isActive: true },
  { id: '9', email: 'student6@school.edu', firstName: 'Frank', lastName: 'Miller', role: 'Student', isActive: true },
  { id: '10', email: 'student7@school.edu', firstName: 'Grace', lastName: 'Chen', role: 'Student', isActive: true },
];

export const mockRooms: Room[] = [
  { id: 'r1', name: 'Room A-101', capacity: 50, location: 'Building A, Floor 1', routerMac: 'AA:BB:CC:DD:01:01', isOnline: true },
  { id: 'r2', name: 'Lab B-204', capacity: 30, location: 'Building B, Floor 2', routerMac: 'AA:BB:CC:DD:02:04', isOnline: true },
  { id: 'r3', name: 'Auditorium C-001', capacity: 120, location: 'Building C, Ground Floor', routerMac: 'AA:BB:CC:DD:03:01', isOnline: true },
  { id: 'r4', name: 'Lab D-310', capacity: 25, location: 'Building D, Floor 3', routerMac: 'AA:BB:CC:DD:04:10', isOnline: false },
];

const today = new Date();
const makeTime = (h: number, m: number) => {
  const d = new Date(today);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

export const mockLectures: Lecture[] = [
  {
    id: 'l1',
    title: 'Introduction to IoT',
    description: 'Basics of Internet of Things and smart devices.',
    lecturerId: '2',
    roomId: 'r1',
    startTime: makeTime(10, 0),
    endTime: makeTime(11, 30),
    dayOfWeek: 0,
    lecturer: mockUsers[1],
    room: mockRooms[0],
    enrolledCount: 18,
  },
  {
    id: 'l2',
    title: 'Advanced Networking',
    description: 'Deep dive into protocols and network security.',
    lecturerId: '2',
    roomId: 'r2',
    startTime: makeTime(13, 0),
    endTime: makeTime(14, 30),
    dayOfWeek: 2,
    lecturer: mockUsers[1],
    room: mockRooms[1],
    enrolledCount: 12,
  },
  {
    id: 'l3',
    title: 'Embedded Systems',
    description: 'Programming microcontrollers and embedded platforms.',
    lecturerId: '8',
    roomId: 'r3',
    startTime: makeTime(9, 0),
    endTime: makeTime(10, 30),
    dayOfWeek: 1,
    lecturer: mockUsers[7],
    room: mockRooms[2],
    enrolledCount: 24,
  },
  {
    id: 'l4',
    title: 'Data Structures & Algorithms',
    description: 'Core CS concepts: trees, graphs, sorting, and complexity.',
    lecturerId: '8',
    roomId: 'r1',
    startTime: makeTime(14, 0),
    endTime: makeTime(15, 30),
    dayOfWeek: 3,
    lecturer: mockUsers[7],
    room: mockRooms[0],
    enrolledCount: 22,
  },
  {
    id: 'l5',
    title: 'Cloud Computing',
    description: 'AWS, Azure, and cloud architecture patterns.',
    lecturerId: '2',
    roomId: 'r3',
    startTime: makeTime(11, 0),
    endTime: makeTime(12, 30),
    dayOfWeek: 4,
    lecturer: mockUsers[1],
    room: mockRooms[2],
    enrolledCount: 30,
  },
];

export const mockEnrollments: Enrollment[] = [
  { id: 'e1', studentId: '3', lectureId: 'l1', enrolledAt: '2026-02-01T00:00:00Z' },
  { id: 'e2', studentId: '3', lectureId: 'l2', enrolledAt: '2026-02-01T00:00:00Z' },
  { id: 'e3', studentId: '3', lectureId: 'l3', enrolledAt: '2026-02-01T00:00:00Z' },
  { id: 'e4', studentId: '4', lectureId: 'l1', enrolledAt: '2026-02-01T00:00:00Z' },
  { id: 'e5', studentId: '4', lectureId: 'l2', enrolledAt: '2026-02-01T00:00:00Z' },
  { id: 'e6', studentId: '5', lectureId: 'l1', enrolledAt: '2026-02-01T00:00:00Z' },
  { id: 'e7', studentId: '5', lectureId: 'l3', enrolledAt: '2026-02-01T00:00:00Z' },
  { id: 'e8', studentId: '6', lectureId: 'l2', enrolledAt: '2026-02-01T00:00:00Z' },
  { id: 'e9', studentId: '6', lectureId: 'l4', enrolledAt: '2026-02-01T00:00:00Z' },
  { id: 'e10', studentId: '9', lectureId: 'l1', enrolledAt: '2026-02-01T00:00:00Z' },
  { id: 'e11', studentId: '9', lectureId: 'l5', enrolledAt: '2026-02-01T00:00:00Z' },
  { id: 'e12', studentId: '10', lectureId: 'l3', enrolledAt: '2026-02-01T00:00:00Z' },
  { id: 'e13', studentId: '10', lectureId: 'l5', enrolledAt: '2026-02-01T00:00:00Z' },
];

export const mockAttendance: AttendanceRecord[] = [
  { id: 'a1', lectureId: 'l1', studentId: '3', status: 'Present', timestamp: makeTime(9, 55), signalStrength: -45, connectionDurationMinutes: 85, student: mockUsers[2], lecture: mockLectures[0] },
  { id: 'a2', lectureId: 'l1', studentId: '4', status: 'Late', timestamp: makeTime(10, 15), signalStrength: -70, connectionDurationMinutes: 60, student: mockUsers[3], lecture: mockLectures[0] },
  { id: 'a3', lectureId: 'l1', studentId: '5', status: 'Present', timestamp: makeTime(9, 50), signalStrength: -42, connectionDurationMinutes: 90, student: mockUsers[4], lecture: mockLectures[0] },
  { id: 'a4', lectureId: 'l1', studentId: '9', status: 'Absent', timestamp: makeTime(10, 0), signalStrength: 0, connectionDurationMinutes: 0, student: mockUsers[8], lecture: mockLectures[0] },
  { id: 'a5', lectureId: 'l2', studentId: '3', status: 'Present', timestamp: makeTime(12, 58), signalStrength: -50, connectionDurationMinutes: 88, student: mockUsers[2], lecture: mockLectures[1] },
  { id: 'a6', lectureId: 'l2', studentId: '4', status: 'Present', timestamp: makeTime(12, 55), signalStrength: -48, connectionDurationMinutes: 90, student: mockUsers[3], lecture: mockLectures[1] },
  { id: 'a7', lectureId: 'l2', studentId: '6', status: 'Late', timestamp: makeTime(13, 20), signalStrength: -65, connectionDurationMinutes: 55, student: mockUsers[5], lecture: mockLectures[1] },
  { id: 'a8', lectureId: 'l3', studentId: '3', status: 'Present', timestamp: makeTime(8, 55), signalStrength: -38, connectionDurationMinutes: 90, student: mockUsers[2], lecture: mockLectures[2] },
  { id: 'a9', lectureId: 'l3', studentId: '5', status: 'Present', timestamp: makeTime(8, 58), signalStrength: -44, connectionDurationMinutes: 88, student: mockUsers[4], lecture: mockLectures[2] },
  { id: 'a10', lectureId: 'l3', studentId: '10', status: 'Absent', timestamp: makeTime(9, 0), signalStrength: 0, connectionDurationMinutes: 0, student: mockUsers[9], lecture: mockLectures[2] },
  { id: 'a11', lectureId: 'l4', studentId: '6', status: 'Present', timestamp: makeTime(13, 55), signalStrength: -52, connectionDurationMinutes: 85, student: mockUsers[5], lecture: mockLectures[3] },
  { id: 'a12', lectureId: 'l5', studentId: '9', status: 'Late', timestamp: makeTime(11, 12), signalStrength: -68, connectionDurationMinutes: 70, student: mockUsers[8], lecture: mockLectures[4] },
  { id: 'a13', lectureId: 'l5', studentId: '10', status: 'Present', timestamp: makeTime(10, 55), signalStrength: -40, connectionDurationMinutes: 90, student: mockUsers[9], lecture: mockLectures[4] },
];

/** IoT / Teltonika RUTX11 nodes (hotspot + station dump integration) */
export const mockIoTNodes: IoTNode[] = [
  {
    id: 'iot1',
    roomId: 'r1',
    macAddress: '10:11:22:33:44:01',
    hostname: 'rutx-a101',
    ipAddress: '192.168.50.1',
    status: 'Online',
    lastSeen: new Date().toISOString(),
    firmwareVersion: 'RUTX_R_00.02.7',
    model: 'RUTX11',
    hotspotSsid: 'IoT-A101',
    signalThresholdDbm: -70,
    connectedDevicesCount: 8,
  },
  {
    id: 'iot2',
    roomId: 'r2',
    macAddress: '10:11:22:33:44:02',
    hostname: 'rutx-b204',
    ipAddress: '192.168.51.1',
    status: 'Online',
    lastSeen: new Date().toISOString(),
    firmwareVersion: 'RUTX_R_00.02.7',
    model: 'RUTX11',
    hotspotSsid: 'IoT-B204',
    signalThresholdDbm: -72,
    connectedDevicesCount: 4,
  },
  {
    id: 'iot3',
    roomId: 'r3',
    macAddress: '10:11:22:33:44:03',
    hostname: 'rutx-c001',
    ipAddress: '192.168.52.1',
    status: 'Maintenance',
    lastSeen: undefined,
    firmwareVersion: 'RUTX_R_00.02.6',
    model: 'RUTX11',
    hotspotSsid: 'IoT-C001',
    signalThresholdDbm: -68,
    connectedDevicesCount: 0,
  },
];

/** Student mobile devices (MAC linked to attendance) */
export const mockStudentDevices: StudentDevice[] = [
  {
    id: 'sd1',
    studentId: '3',
    macAddress: 'AA:BB:CC:DD:EE:01',
    deviceName: 'iPhone 14',
    isActive: true,
    registeredAt: '2026-01-15T10:00:00Z',
    lastSeen: new Date().toISOString(),
    studentName: 'Alice Smith',
  },
  {
    id: 'sd2',
    studentId: '4',
    macAddress: 'AA:BB:CC:DD:EE:02',
    deviceName: 'Samsung Galaxy',
    isActive: true,
    registeredAt: '2026-01-16T12:00:00Z',
    lastSeen: new Date().toISOString(),
    studentName: 'Bob Johnson',
  },
  {
    id: 'sd3',
    studentId: '5',
    macAddress: 'AA:BB:CC:DD:EE:03',
    deviceName: 'Pixel 8',
    isActive: false,
    registeredAt: '2026-01-10T09:00:00Z',
    studentName: 'Charlie Brown',
  },
];

/** RADIUS accounts (hotspot login; matches backend RadiusAccount) */
export const mockRadiusAccounts: RadiusAccount[] = [
  { id: 'ra1', userId: '3', radiusUsername: 'student1@school.edu', isEnabled: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'ra2', userId: '4', radiusUsername: 'student2@school.edu', isEnabled: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'ra3', userId: '5', radiusUsername: 'student3@school.edu', isEnabled: true, createdAt: '2026-01-01T00:00:00Z' },
];

const mockConnectedClients: ConnectedClient[] = [
  { macAddress: 'AA:BB:CC:DD:EE:01', ipAddress: '192.168.50.42', hostname: 'iphone', signalStrengthDbm: -48, matchedStudentName: 'Alice Smith', matchedStudentId: '3' },
  { macAddress: 'AA:BB:CC:DD:EE:99', ipAddress: '192.168.50.43', hostname: 'android', signalStrengthDbm: -62, matchedStudentName: undefined, matchedStudentId: undefined },
];

/** Demo router status (GET /api/iot-nodes/{id}/status) */
export function buildMockRouterStatus(ioTNodeId: string): RouterStatus {
  const node = mockIoTNodes.find((n) => n.id === ioTNodeId);
  return {
    ioTNodeId,
    status: node?.status ?? 'Offline',
    connectedClients: node?.connectedDevicesCount ?? 0,
    lastPolled: node?.lastSeen ?? new Date().toISOString(),
    clients: node?.status === 'Online' ? [...mockConnectedClients] : [],
  };
}

export const mockSchedules: Schedule[] = [
  { id: 's1', lectureId: 'l1', dayOfWeek: 0, startTime: '10:00', endTime: '11:30', lecture: mockLectures[0] },
  { id: 's2', lectureId: 'l2', dayOfWeek: 2, startTime: '13:00', endTime: '14:30', lecture: mockLectures[1] },
  { id: 's3', lectureId: 'l3', dayOfWeek: 1, startTime: '09:00', endTime: '10:30', lecture: mockLectures[2] },
  { id: 's4', lectureId: 'l4', dayOfWeek: 3, startTime: '14:00', endTime: '15:30', lecture: mockLectures[3] },
  { id: 's5', lectureId: 'l5', dayOfWeek: 4, startTime: '11:00', endTime: '12:30', lecture: mockLectures[4] },
  { id: 's6', lectureId: 'l1', dayOfWeek: 3, startTime: '10:00', endTime: '11:30', lecture: mockLectures[0] },
  { id: 's7', lectureId: 'l3', dayOfWeek: 4, startTime: '09:00', endTime: '10:30', lecture: mockLectures[2] },
];

// Weekly attendance stats for charts
export const weeklyAttendanceData = [
  { day: 'Mon', present: 18, late: 2, absent: 4 },
  { day: 'Tue', present: 20, late: 3, absent: 1 },
  { day: 'Wed', present: 15, late: 5, absent: 4 },
  { day: 'Thu', present: 22, late: 1, absent: 1 },
  { day: 'Fri', present: 19, late: 3, absent: 2 },
];

// Monthly attendance stats for charts
export const monthlyAttendanceData = [
  { month: 'Jan', rate: 82 },
  { month: 'Feb', rate: 85 },
  { month: 'Mar', rate: 88 },
  { month: 'Apr', rate: 84 },
  { month: 'May', rate: 90 },
];
