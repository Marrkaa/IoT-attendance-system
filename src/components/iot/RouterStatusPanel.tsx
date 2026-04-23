import type { IoTNode, RouterStatus } from '../../types';
import { Wifi, Users, Activity } from 'lucide-react';

interface Props {
  node: IoTNode | null;
  status: RouterStatus | null;
  loading?: boolean;
}

export function RouterStatusPanel({ node, status, loading }: Props) {
  if (loading) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading router status…
      </div>
    );
  }

  if (!node || !status) {
    return (
      <div className="card" style={{ padding: '1.5rem' }}>
        Select an IoT node from the list.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <Wifi size={22} />
          <div>
            <div style={{ fontWeight: 600 }}>{node.hostname}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="var(--text-secondary)" />
            <span>Status: <strong>{status.status}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} color="var(--text-secondary)" />
            <span>Connected clients: <strong>{status.connectedClients}</strong></span>
          </div>
          {status.lastPolled && (
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Last updated: {new Date(status.lastPolled).toLocaleString('en-US')}
            </span>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
          Connected clients (from latest station dump)
        </div>
        {status.clients.length === 0 ? (
          <div style={{ padding: '1.5rem', color: 'var(--text-secondary)' }}>No active clients or no data received yet.</div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>MAC</th>
                  <th>IP</th>
                  <th>Hostname</th>
                  <th>Signal strength (dBm)</th>
                  <th>User</th>
                </tr>
              </thead>
              <tbody>
                {status.clients.map((c) => (
                  <tr key={c.macAddress}>
                    <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.85rem' }}>{c.macAddress}</td>
                    <td>{c.ipAddress ?? '—'}</td>
                    <td>{c.hostname ?? '—'}</td>
                    <td>{c.signalStrengthDbm}</td>
                    <td>
                      {c.matchedStudentName ? (
                        <span className="badge badge-success">{c.matchedStudentName}</span>
                      ) : (
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Unknown</span>
                      )}
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
