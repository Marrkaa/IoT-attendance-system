import type { StudentDevice } from '../../types';

interface Props {
  devices: StudentDevice[];
  showStudentColumn?: boolean;
  onToggleActive?: (device: StudentDevice) => void;
  onDelete?: (device: StudentDevice) => void;
}

export function DeviceManagementTable({
  devices,
  showStudentColumn = true,
  onToggleActive,
  onDelete,
}: Props) {
  const getDisplayDeviceName = (deviceName?: string | null) => {
    if (!deviceName) return '—';
    if (deviceName.trim().toLowerCase() === 'hotspot (radius)') return '—';
    return deviceName;
  };

  if (devices.length === 0) {
    return (
      <p style={{ color: 'var(--text-secondary)', padding: '1rem 0' }}>
        No devices yet. Add your phone’s Wi‑Fi MAC so the system can correlate signal readings with you.
      </p>
    );
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>MAC address</th>
            <th>Device</th>
            {showStudentColumn && <th>Student</th>}
            <th>Status</th>
            <th>Last seen</th>
            {(onToggleActive || onDelete) && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {devices.map((d) => (
            <tr key={d.id}>
              <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.85rem' }}>{d.macAddress}</td>
              <td>{getDisplayDeviceName(d.deviceName)}</td>
              {showStudentColumn && <td>{d.studentName ?? d.studentId}</td>}
              <td>
                <span className={`badge ${d.isActive ? 'badge-success' : ''}`} style={d.isActive ? undefined : { background: '#F3F4F6', color: '#6B7280' }}>
                  {d.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {d.lastSeen ? new Date(d.lastSeen).toLocaleString('en-US') : '—'}
              </td>
              {(onToggleActive || onDelete) && (
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {onToggleActive && (
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                        onClick={() => onToggleActive(d)}
                      >
                        {d.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', color: 'var(--danger, #c00)' }}
                        onClick={() => onDelete(d)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
