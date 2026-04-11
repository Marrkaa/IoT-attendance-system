import { useCallback, useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { PageHeader, StatusBadge } from '../../components';
import { attendanceService } from '../../services/attendanceService';
import type { AttendanceRecord, AttendanceStats } from '../../types';

export const HistoryPage = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [filter, setFilter] = useState<'All' | 'Present' | 'Late' | 'Absent'>('All');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [recs, st] = await Promise.all([
        attendanceService.getByStudent(user.id),
        attendanceService.getStudentStats(user.id),
      ]);
      setRecords(recs);
      setStats(st);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = filter === 'All' ? records : records.filter((r) => r.status === filter);
  const rate = stats?.attendancePercentage ?? 0;

  const lectureBreakdown = records.reduce<Record<string, { name: string; present: number; late: number; absent: number }>>((acc, r) => {
    const name = r.lecture?.title ?? 'Unknown';
    if (!acc[name]) acc[name] = { name, present: 0, late: 0, absent: 0 };
    if (r.status === 'Present') acc[name].present++;
    else if (r.status === 'Late') acc[name].late++;
    else acc[name].absent++;
    return acc;
  }, {});

  const bestCourse = Object.values(lectureBreakdown).reduce<{ name: string; rate: number } | null>((best, c) => {
    const total = c.present + c.late + c.absent;
    const cRate = total > 0 ? Math.round(((c.present + c.late) / total) * 100) : 0;
    if (!best || cRate > best.rate) return { name: c.name, rate: cRate };
    return best;
  }, null);

  return (
    <div>
      <PageHeader
        title="Attendance History"
        subtitle="Your complete attendance record"
        action={
          <button type="button" className="btn btn-outline">
            <Calendar size={16} /> Export
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" style={{ marginBottom: '1.5rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Attendance Rate</p>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: rate >= 80 ? 'var(--success)' : rate >= 60 ? 'var(--warning)' : 'var(--danger)', margin: '0.25rem 0' }}>
            {rate}%
          </h3>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Records</p>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0.25rem 0' }}>{records.length}</h3>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Best Course</p>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--success)', margin: '0.25rem 0' }}>
            {bestCourse ? bestCourse.name : '—'}
          </h3>
          {bestCourse && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{bestCourse.rate}% rate</p>}
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Lectures</p>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0.25rem 0' }}>{Object.keys(lectureBreakdown).length}</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>With records</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <h3 className="card-title">Detailed Records</h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {(['All', 'Present', 'Late', 'Absent'] as const).map((f) => (
              <button
                key={f}
                type="button"
                className={`btn ${filter === f ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Loading…</p>
        ) : filtered.length === 0 ? (
          <p style={{ padding: '1rem', color: 'var(--text-muted)' }}>No records found.</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Lecture</th>
                  <th>Check-in</th>
                  <th>Duration</th>
                  <th>Signal</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 500 }}>{r.date}</td>
                    <td>{r.lecture?.title ?? '—'}</td>
                    <td style={{ fontSize: '0.875rem' }}>
                      {r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString('en-US') : '—'}
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>
                      {r.connectionDurationMinutes != null ? `${r.connectionDurationMinutes.toFixed(1)} min` : '—'}
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>
                      {r.avgSignalStrengthDbm != null
                        ? `${r.avgSignalStrengthDbm.toFixed(0)} dBm`
                        : r.signalStrengthDbm != null
                          ? `${r.signalStrengthDbm} dBm`
                          : '—'}
                    </td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
