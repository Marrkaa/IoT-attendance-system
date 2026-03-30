import { useState } from 'react';
import { useAuth } from '../../store/AuthContext';
import { mockAttendance, mockLectures } from '../../mock-data/data';
import { CheckCircle, BarChart2, Radio } from 'lucide-react';
import { PageHeader, StatusBadge, Avatar } from '../../components';
import { formatTime, signalStrengthPercent } from '../../utils';
import type { AttendanceStatus } from '../../types';

export const LiveAttendancePage = () => {
  const { user } = useAuth();
  const lecturerLectures = mockLectures.filter(l => l.lecturerId === user?.id);
  const [selectedLectureId, setSelectedLectureId] = useState(lecturerLectures[0]?.id || '');
  const activeLecture = mockLectures.find(l => l.id === selectedLectureId);
  const lectureAttendance = mockAttendance.filter(a => a.lectureId === selectedLectureId);

  const [overrides, setOverrides] = useState<Record<string, AttendanceStatus>>({});

  const handleOverride = (recordId: string, status: AttendanceStatus) => {
    setOverrides(prev => ({ ...prev, [recordId]: status }));
  };

  return (
    <div>
      <PageHeader
        title="Live Attendance"
        subtitle="Real-time IoT tracking for current session"
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <select className="form-input" style={{ width: 'auto' }} value={selectedLectureId} onChange={e => setSelectedLectureId(e.target.value)}>
              {lecturerLectures.map(l => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)', animation: 'pulse 2s infinite' }}></div>
              <span style={{ fontSize: '0.875rem', color: 'var(--success)', fontWeight: 500 }}>IoT Node Active</span>
            </div>
          </div>
        }
      />

      {/* Active session info */}
      {activeLecture && (
        <div className="card mb-6" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)', border: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>{activeLecture.title}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {activeLecture.room?.name} &bull; {formatTime(activeLecture.startTime)} - {formatTime(activeLecture.endTime)}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary"><CheckCircle size={14} /> Mark All Present</button>
              <button className="btn btn-outline"><BarChart2 size={14} /> Report</button>
            </div>
          </div>
        </div>
      )}

      {/* Student cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" style={{ marginBottom: '1.5rem' }}>
        {lectureAttendance.map(record => {
          const currentStatus = overrides[record.id] || record.status;
          return (
            <div className="card" key={record.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Avatar
                firstName={record.student?.firstName || ''}
                lastName={record.student?.lastName || ''}
                size={48}
                bg={currentStatus === 'Present' ? '#D1FAE5' : currentStatus === 'Late' ? '#FEF3C7' : '#FEE2E2'}
                color={currentStatus === 'Present' ? '#065F46' : currentStatus === 'Late' ? '#92400E' : '#991B1B'}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{record.student?.firstName} {record.student?.lastName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{record.student?.email}</div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Radio size={12} color={record.signalStrength! > -60 ? 'var(--success)' : record.signalStrength === 0 ? 'var(--danger)' : 'var(--warning)'} />
                    {record.signalStrength !== 0 ? `${record.signalStrength} dBm` : 'No signal'}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>{record.connectionDurationMinutes} min connected</span>
                </div>
                {/* Signal strength bar */}
                <div style={{ marginTop: '0.5rem', height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '2px',
                    width: `${signalStrengthPercent(record.signalStrength || -90)}%`,
                    background: record.signalStrength! > -60 ? 'var(--success)' : record.signalStrength === 0 ? 'var(--danger)' : 'var(--warning)',
                    transition: 'width 0.5s ease'
                  }}></div>
                </div>
              </div>
              <div>
                <StatusBadge status={currentStatus} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Full table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Connections</h3>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Status</th>
                <th>Detected At</th>
                <th>Signal</th>
                <th>Duration</th>
                <th>Override</th>
              </tr>
            </thead>
            <tbody>
              {lectureAttendance.map(record => {
                const currentStatus = overrides[record.id] || record.status;
                return (
                  <tr key={record.id}>
                    <td style={{ fontWeight: 500 }}>{record.student?.firstName} {record.student?.lastName}</td>
                    <td><StatusBadge status={currentStatus} /></td>
                    <td>{new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                    <td>{record.signalStrength !== 0 ? `${record.signalStrength} dBm` : '—'}</td>
                    <td>{record.connectionDurationMinutes} min</td>
                    <td>
                      <select
                        className="form-input"
                        style={{ padding: '0.25rem 0.5rem', width: 'auto' }}
                        value={currentStatus}
                        onChange={e => handleOverride(record.id, e.target.value as AttendanceStatus)}
                      >
                        <option value="Present">Present</option>
                        <option value="Late">Late</option>
                        <option value="Absent">Absent</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
