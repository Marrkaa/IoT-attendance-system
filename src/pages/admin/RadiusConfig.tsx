import { useEffect, useState } from 'react';
import { PageHeader } from '../../components';
import { RadiusInfoCard } from '../../components/iot/RadiusInfoCard';
import { radiusService, type RadiusAccountView } from '../../services/radiusService';

export function RadiusConfigPage() {
  const [accounts, setAccounts] = useState<RadiusAccountView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setAccounts(await radiusService.listAccountsWithUsers());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (a: RadiusAccountView) => {
    try {
      await radiusService.setEnabled(a.userId, !a.isEnabled);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  return (
    <div>
      <RadiusInfoCard />

      {error && (
        <div className="card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', borderLeft: '4px solid #DC2626', background: '#FEF2F2' }}>
          {error}
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
          RADIUS accounts (students)
        </div>
        {loading ? (
          <div style={{ padding: '1.5rem', color: 'var(--text-secondary)' }}>Loading…</div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email (RADIUS username)</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id}>
                    <td>{a.userName ?? '—'}</td>
                    <td style={{ fontSize: '0.875rem' }}>{a.radiusUsername}</td>
                    <td>
                      <span className={`badge ${a.isEnabled ? 'badge-success' : ''}`} style={a.isEnabled ? undefined : { background: '#F3F4F6', color: '#6B7280' }}>
                        {a.isEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {new Date(a.createdAt).toLocaleDateString('en-US')}
                    </td>
                    <td>
                      <button type="button" className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} onClick={() => toggle(a)}>
                        {a.isEnabled ? 'Disable hotspot' : 'Enable hotspot'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
