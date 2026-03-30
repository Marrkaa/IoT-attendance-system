import { Calendar, Clock } from 'lucide-react';
import { useState } from 'react';
import type { AttendanceStatus } from '../../types';
import { PageHeader, StatusBadge } from '../../components';
import { formatDate } from '../../utils';

interface HistoryEntry {
  id: string;
  date: string;
  lecture: string;
  room: string;
  time: string;
  instructor: string;
  status: AttendanceStatus;
  signal: number;
}

const mockHistory: HistoryEntry[] = [
  { id: '1', date: '2026-03-28', lecture: 'Introduction to IoT', room: 'Room A-101', time: '10:00 - 11:30', instructor: 'Dr. Jane Doe', status: 'Present', signal: -42 },
  { id: '2', date: '2026-03-28', lecture: 'Advanced Networking', room: 'Lab B-204', time: '13:00 - 14:30', instructor: 'Dr. Jane Doe', status: 'Present', signal: -55 },
  { id: '3', date: '2026-03-27', lecture: 'Introduction to IoT', room: 'Room A-101', time: '10:00 - 11:30', instructor: 'Dr. Jane Doe', status: 'Late', signal: -72 },
  { id: '4', date: '2026-03-26', lecture: 'Advanced Networking', room: 'Lab B-204', time: '13:00 - 14:30', instructor: 'Dr. Jane Doe', status: 'Present', signal: -48 },
  { id: '5', date: '2026-03-25', lecture: 'Introduction to IoT', room: 'Room A-101', time: '10:00 - 11:30', instructor: 'Dr. Jane Doe', status: 'Present', signal: -39 },
  { id: '6', date: '2026-03-24', lecture: 'Embedded Systems', room: 'Auditorium C-001', time: '09:00 - 10:30', instructor: 'Prof. Mark Wilson', status: 'Absent', signal: 0 },
  { id: '7', date: '2026-03-21', lecture: 'Introduction to IoT', room: 'Room A-101', time: '10:00 - 11:30', instructor: 'Dr. Jane Doe', status: 'Present', signal: -50 },
  { id: '8', date: '2026-03-20', lecture: 'Advanced Networking', room: 'Lab B-204', time: '13:00 - 14:30', instructor: 'Dr. Jane Doe', status: 'Present', signal: -44 },
  { id: '9', date: '2026-03-19', lecture: 'Embedded Systems', room: 'Auditorium C-001', time: '09:00 - 10:30', instructor: 'Prof. Mark Wilson', status: 'Present', signal: -46 },
  { id: '10', date: '2026-03-18', lecture: 'Introduction to IoT', room: 'Room A-101', time: '10:00 - 11:30', instructor: 'Dr. Jane Doe', status: 'Late', signal: -68 },
];

export const HistoryPage = () => {
  const [filter, setFilter] = useState<'All' | AttendanceStatus>('All');

  const filtered = filter === 'All' ? mockHistory : mockHistory.filter(h => h.status === filter);

  const presentCount = mockHistory.filter(h => h.status === 'Present').length;
  const totalCount = mockHistory.length;
  const rate = Math.round(((presentCount + mockHistory.filter(h => h.status === 'Late').length) / totalCount) * 100);

  return (
    <div>
      <PageHeader
        title="Attendance History"
        subtitle="Your complete attendance record"
        action={<button className="btn btn-outline"><Calendar size={16} /> Export</button>}
      />

      {/* Monthly summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" style={{ marginBottom: '1.5rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>March 2026</p>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)', margin: '0.25rem 0' }}>{rate}%</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Attendance rate</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sessions</p>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0.25rem 0' }}>{totalCount}</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>This month</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Best Course</p>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--success)', margin: '0.25rem 0' }}>Intro to IoT</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>92% rate</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Streak</p>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--success)', margin: '0.25rem 0' }}>5</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Days present in a row</p>
        </div>
      </div>

      {/* Filter + Table */}
      <div className="card">
        <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <h3 className="card-title">Detailed Records</h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {(['All', 'Present', 'Late', 'Absent'] as const).map(f => (
              <button
                key={f}
                className={`btn ${filter === f ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Lecture</th>
                <th>Room</th>
                <th>Time</th>
                <th>Signal</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(h => (
                <tr key={h.id}>
                  <td style={{ fontWeight: 500 }}>{formatDate(h.date)}</td>
                  <td>{h.lecture}</td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
                      <Clock size={14} color="var(--text-muted)" /> {h.room}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.875rem' }}>{h.time}</td>
                  <td>{h.signal !== 0 ? `${h.signal} dBm` : '—'}</td>
                  <td><StatusBadge status={h.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
