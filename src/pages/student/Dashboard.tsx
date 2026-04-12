import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../store/AuthContext';
import { Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';
import { PageHeader, StatCard, StatusBadge } from '../../components';
import { attendanceService } from '../../services/attendanceService';
import { apiClient } from '../../services/api';
import { lectureService } from '../../services/lectureService';
import { formatTime, formatClock } from '../../utils';
import type { AttendanceRecord, AttendanceStats, Lecture, Enrollment } from '../../types';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [recent, setRecent] = useState<AttendanceRecord[]>([]);
  const [enrolledLectures, setEnrolledLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [st, recs, enrollments] = await Promise.all([
        attendanceService.getStudentStats(user.id),
        attendanceService.getByStudent(user.id),
        apiClient.get<Enrollment[]>(`/enrollments/student/${user.id}`),
      ]);
      setStats(st);
      setRecent(recs.slice(0, 10));
      const lectureIds = enrollments.map((e) => e.lectureId);
      const lectures = await lectureService.getAll();
      setEnrolledLectures(lectures.filter((l) => lectureIds.includes(l.id)));
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const percentage = stats?.attendancePercentage ?? 0;

  return (
    <div>
      <PageHeader
        title="Student Dashboard"
        subtitle="Track your attendance and upcoming classes"
        action={
          <button type="button" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={16} /> View Full Schedule
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" style={{ marginBottom: '2rem' }}>
        <StatCard title="Overall Attendance" value={`${percentage}%`} subtitle="Target: 80%" gradient />
        <StatCard title="Present" value={stats?.attendedLectures ?? 0} icon={<CheckCircle size={32} />} iconBg="#D1FAE5" iconColor="#065F46" />
        <StatCard title="Late" value={stats?.lateLectures ?? 0} icon={<Clock size={32} />} iconBg="#FEF3C7" iconColor="#92400E" />
        <StatCard title="Absent" value={stats?.absentLectures ?? 0} icon={<XCircle size={32} />} iconBg="#FEE2E2" iconColor="#991B1B" />
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          <div className="card">
            <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h3 className="card-title">Recent Attendance</h3>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Lecture</th>
                    <th>Date</th>
                    <th>Check-in</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.length > 0 ? recent.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{r.lecture?.title ?? '—'}</div>
                      </td>
                      <td style={{ fontSize: '0.875rem' }}>{r.date}</td>
                      <td style={{ fontSize: '0.875rem' }}>
                        {r.checkInTime ? formatTime(r.checkInTime) : '—'}
                      </td>
                      <td><StatusBadge status={r.status} /></td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No records yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h3 className="card-title">My Lectures</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {enrolledLectures.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Not enrolled in any lectures yet.</p>
              )}
              {enrolledLectures.map((lecture) => (
                <div key={lecture.id} style={{ display: 'flex', gap: '1rem', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{
                    background: 'var(--primary)', color: 'white', padding: '0.5rem', borderRadius: 'var(--radius-md)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '60px',
                  }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][lecture.dayOfWeek ?? 0]}
                    </span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{formatClock(lecture.startTime)}</span>
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem', color: 'var(--primary)' }}>{lecture.title}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} /> {formatClock(lecture.startTime)} – {formatClock(lecture.endTime)}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lecture.room?.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
