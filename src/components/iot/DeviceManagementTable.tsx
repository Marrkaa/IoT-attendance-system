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
  if (devices.length === 0) {
    return (
      <p style={{ color: 'var(--text-secondary)', padding: '1rem 0' }}>
        Įrenginių nėra. Pridėkite mobiliojo telefono MAC adresą, kad sistema galėtų sieti Wi-Fi signalą su jumis.
      </p>
    );
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>MAC adresas</th>
            <th>Įrenginys</th>
            {showStudentColumn && <th>Studentas</th>}
            <th>Būsena</th>
            <th>Paskutinį kartą matytas</th>
            {(onToggleActive || onDelete) && <th>Veiksmai</th>}
          </tr>
        </thead>
        <tbody>
          {devices.map((d) => (
            <tr key={d.id}>
              <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.85rem' }}>{d.macAddress}</td>
              <td>{d.deviceName ?? '—'}</td>
              {showStudentColumn && <td>{d.studentName ?? d.studentId}</td>}
              <td>
                <span className={`badge ${d.isActive ? 'badge-success' : ''}`} style={d.isActive ? undefined : { background: '#F3F4F6', color: '#6B7280' }}>
                  {d.isActive ? 'Aktyvus' : 'Neaktyvus'}
                </span>
              </td>
              <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {d.lastSeen ? new Date(d.lastSeen).toLocaleString('lt-LT') : '—'}
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
                        {d.isActive ? 'Išjungti' : 'Įjungti'}
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', color: 'var(--danger, #c00)' }}
                        onClick={() => onDelete(d)}
                      >
                        Šalinti
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
