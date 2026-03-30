import type { AttendanceStatus, Role } from '../types';
import { getStatusColor, getRoleColor } from '../utils';

interface StatusBadgeProps {
  status: AttendanceStatus;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => (
  <span className={`badge ${getStatusColor(status)}`}>{status}</span>
);

interface RoleBadgeProps {
  role: Role;
}

export const RoleBadge = ({ role }: RoleBadgeProps) => {
  const { bg, color } = getRoleColor(role);
  return <span className="badge" style={{ backgroundColor: bg, color }}>{role}</span>;
};
