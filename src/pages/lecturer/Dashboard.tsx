import { useState } from 'react';
import { useAuth } from '../../store/AuthContext';
import { CheckCircle, BarChart2, Video } from 'lucide-react';
import { mockLectures, mockAttendance } from '../../mock-data/data';
import { PageHeader, StatusBadge } from '../../components';
import { formatTime } from '../../utils';
import type { AttendanceStatus } from '../../types';

export const LecturerDashboard = () => {
  const { user } = useAuth();
  const lecturerLectures = mockLectures.filter(l => l.lecturerId === user?.id);
  const activeLecture = lecturerLectures[0];
  const lectureAttendance = mockAttendance.filter(a => a.lectureId === activeLecture?.id);

  const totalStudents = lectureAttendance.length;
  const present = lectureAttendance.filter(a => a.status === 'Present').length;
  const late = lectureAttendance.filter(a => a.status === 'Late').length;

  const [overrides, setOverrides] = useState<Record<string, AttendanceStatus>>({});

  const handleOverride = (recordId: string, status: AttendanceStatus) => {
    setOverrides(prev => ({ ...prev, [recordId]: status }));
  };

  return (
    <div>
      <PageHeader
        title="Lecturer Dashboard"
        subtitle={`Welcome, ${user?.firstName}! Manage your classes and attendance.`}
        action={<button className="btn btn-primary"><Video size={16} /> Start Live Session</button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <h3 className="card-title" style={{ color: 'var(--primary)' }}>Active Lecture: {activeLecture?.title}</h3>
            <span className="badge badge-success" style={{ padding: '0.35rem 0.75rem' }}>Ongoing</span>
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div><strong>Time:</strong> {activeLecture && `${formatTime(activeLecture.startTime)} - ${formatTime(activeLecture.endTime)}`}</div>
            <div><strong>Location:</strong> {activeLecture?.room?.name}</div>
            <div><strong>Enrolled:</strong> {activeLecture?.enrolledCount} students</div>
            <div><strong>Your courses:</strong> {lecturerLectures.length}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Attendance Rate</h3>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: totalStudents > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
            {totalStudents > 0 ? Math.round(((present + late) / totalStudents) * 100) : 0}%
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{present} present, {late} late out of {totalStudents}</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <div>
            <h3 className="card-title">Live Attendance Tracker</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Real-time data from IoT Node</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline" style={{ fontSize: '0.75rem' }}><CheckCircle size={14} /> Mark All Present</button>
            <button className="btn btn-outline" style={{ fontSize: '0.75rem' }}><BarChart2 size={14} /> Export CSV</button>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Status</th>
                <th>Time Recorded</th>
                <th>Connection</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {lectureAttendance.map((record) => {
                const currentStatus = overrides[record.id] || record.status;
                return (
                  <tr key={record.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{record.student?.firstName} {record.student?.lastName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{record.student?.email}</div>
                    </td>
                    <td><StatusBadge status={currentStatus} /></td>
                    <td>{formatTime(record.timestamp)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '6px', height: '6px', borderRadius: '50%',
                          backgroundColor: record.signalStrength! > -60 ? 'var(--success)' : record.signalStrength === 0 ? 'var(--danger)' : 'var(--warning)'
                        }}></div>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                          {record.signalStrength !== 0 ? `${record.signalStrength} dBm` : 'No signal'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <select
                        className="form-input"
                        style={{ padding: '0.25rem 0.5rem', width: 'auto', display: 'inline-block' }}
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
