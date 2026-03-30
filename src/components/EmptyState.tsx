import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
}

export const EmptyState = ({ icon, title, description }: EmptyStateProps) => (
  <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
    {icon && <div style={{ marginBottom: '1rem', opacity: 0.5 }}>{icon}</div>}
    <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>{title}</h3>
    {description && <p style={{ fontSize: '0.875rem' }}>{description}</p>}
  </div>
);
