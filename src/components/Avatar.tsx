import { getInitials } from '../utils';

interface AvatarProps {
  firstName: string;
  lastName: string;
  size?: number;
  bg?: string;
  color?: string;
}

export const Avatar = ({ firstName, lastName, size = 36, bg = 'var(--primary)', color = 'white' }: AvatarProps) => (
  <div style={{
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    background: bg,
    color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: `${size * 0.35}px`,
    flexShrink: 0,
  }}>
    {getInitials(firstName, lastName)}
  </div>
);
