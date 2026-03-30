import type { AttendanceStatus } from '../types';
import { clsx, type ClassValue } from 'clsx';

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

export const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

export const formatDateTime = (iso: string): string =>
  `${formatDate(iso)} ${formatTime(iso)}`;

export const getStatusColor = (status: AttendanceStatus) => {
  switch (status) {
    case 'Present': return 'badge-success';
    case 'Late': return 'badge-warning';
    case 'Absent': return 'badge-danger';
  }
};

export const getRoleColor = (role: string) => {
  switch (role) {
    case 'Administrator': return { bg: '#FEE2E2', color: '#991B1B' };
    case 'Lecturer': return { bg: '#DBEAFE', color: '#1E40AF' };
    case 'Student': return { bg: '#D1FAE5', color: '#065F46' };
    default: return { bg: '#F3F4F6', color: '#374151' };
  }
};

export const getInitials = (firstName: string, lastName: string) =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

export const signalStrengthLabel = (dbm: number): string => {
  if (dbm > -50) return 'Excellent';
  if (dbm > -60) return 'Good';
  if (dbm > -70) return 'Fair';
  return 'Weak';
};

export const signalStrengthPercent = (dbm: number): number =>
  Math.min(100, Math.max(0, Math.abs(dbm + 90) * 2));

export const getRoleDashboardPath = (role: string): string => {
  switch (role) {
    case 'Administrator': return '/admin/dashboard';
    case 'Lecturer': return '/lecturer/dashboard';
    case 'Student': return '/student/dashboard';
    default: return '/';
  }
};
