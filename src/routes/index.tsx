import type { Role } from '../types';
import { Home, Users, BookOpen, Calendar, Clock, BarChart2 } from 'lucide-react';
import type { ComponentType } from 'react';

export interface NavItem {
  path: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
}

export const getNavItems = (role: Role): NavItem[] => {
  switch (role) {
    case 'Administrator':
      return [
        { path: '/admin/dashboard', label: 'Dashboard', icon: Home },
        { path: '/admin/users', label: 'Users', icon: Users },
        { path: '/admin/rooms', label: 'Rooms', icon: Home },
        { path: '/admin/lectures', label: 'Lectures', icon: BookOpen },
        { path: '/admin/schedules', label: 'Schedules', icon: Calendar },
      ];
    case 'Lecturer':
      return [
        { path: '/lecturer/dashboard', label: 'Dashboard', icon: Home },
        { path: '/lecturer/attendance', label: 'Live Attendance', icon: Clock },
        { path: '/lecturer/stats', label: 'Statistics', icon: BarChart2 },
        { path: '/lecturer/reports', label: 'Reports', icon: BarChart2 },
      ];
    case 'Student':
      return [
        { path: '/student/dashboard', label: 'Dashboard', icon: Home },
        { path: '/student/lectures', label: 'My Lectures', icon: BookOpen },
        { path: '/student/history', label: 'History', icon: Calendar },
      ];
    default:
      return [];
  }
};

export const getRoleDashboardPath = (role: Role): string => {
  switch (role) {
    case 'Administrator': return '/admin/dashboard';
    case 'Lecturer': return '/lecturer/dashboard';
    case 'Student': return '/student/dashboard';
  }
};
