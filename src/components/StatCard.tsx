import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  iconBg?: string;
  iconColor?: string;
  gradient?: boolean;
}

export const StatCard = ({ title, value, subtitle, icon, iconBg = '#EEF2FF', iconColor = 'var(--primary)', gradient }: StatCardProps) => {
  if (gradient) {
    return (
      <div className="card" style={{ padding: '2rem 1.5rem', textAlign: 'center', background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', color: 'white' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'rgba(255,255,255,0.85)' }}>{title}</h3>
        <div style={{ fontSize: '3rem', fontWeight: 800 }}>{value}</div>
        {subtitle && <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'rgba(255,255,255,0.7)' }}>{subtitle}</p>}
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
      {icon && (
        <div className="flex justify-center" style={{ marginBottom: '1rem' }}>
          <div style={{ background: iconBg, padding: '1rem', borderRadius: '50%', color: iconColor }}>
            {icon}
          </div>
        </div>
      )}
      <h3 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{value}</h3>
      <p style={{ color: 'var(--text-secondary)' }}>{title}</p>
      {subtitle && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{subtitle}</p>}
    </div>
  );
};
