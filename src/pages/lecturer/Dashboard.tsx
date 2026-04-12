import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../store/AuthContext';
import { Clock } from 'lucide-react';
import { PageHeader, StatCard } from '../../components';
import { apiClient } from '../../services/api';
import { attendanceService } from '../../services/attendanceService';
import { formatClock } from '../../utils';
import type { Lecture, AttendanceRecord } from '../../types';
import { useNavigate } from 'react-router-dom';

export const LecturerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const weekdayToIndex = (d: string): number => {
    // JS: Sun=0..Sat=6; backend schedules: Mon=0..Sun=6
    const js = new Date(`${d}T00:00:00`).getDay();
    return (js + 6) % 7;
  };

  const isLectureOnDate = (lecture: Lecture, date: string): boolean => {
    if (!lecture.schedules || lecture.schedules.length === 0) return false;
    const dayIndex = weekdayToIndex(date);
    return lecture.schedules.some((s) => {
      if (s.dayOfWeek !== dayIndex) return false;
      if (s.validFrom && s.validFrom > date) return false;
      if (s.validUntil && s.validUntil < date) return false;
      return true;
    });
  };

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const list = await apiClient.get<Lecture[]>(`/lectures?lecturerId=${user.id}`);
      setLectures(list);
      const serverDate = await attendanceService.getServerDate();
      const lecturesToday = list.filter((l) => isLectureOnDate(l, serverDate));

      const allRecords: AttendanceRecord[] = [];
      for (const l of lecturesToday) {
        try {
          const recs = await attendanceService.getByLecture(l.id, serverDate);
          allRecords.push(...recs);
        } catch {
          /* no records for today yet */
        }
      }
      setTodayRecords(allRecords);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const present = todayRecords.filter((r) => r.status === 'Present').length;
  const late = todayRecords.filter((r) => r.status === 'Late').length;
  const absent = todayRecords.filter((r) => r.status === 'Absent').length;
  const total = todayRecords.length;
  const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="Lecturer Dashboard"
        subtitle={`Welcome, ${user?.firstName}! Here is your overview for today.`}
        action={
          <button type="button" className="btn btn-primary" onClick={() => navigate('/lecturer/attendance')}>
            <Clock size={16} /> Live Attendance
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" style={{ marginBottom: '2rem' }}>
        <StatCard title="Your Lectures" value={lectures.length} subtitle="Total assigned" gradient />
        <StatCard title="Today's Rate" value={`${rate}%`} subtitle={`${present + late} of ${total} attended`} />
        <StatCard title="Present" value={present} subtitle="Today" iconBg="#D1FAE5" iconColor="#065F46" />
        <StatCard title="Late / Absent" value={`${late} / ${absent}`} subtitle="Today" iconBg="#FEE2E2" iconColor="#991B1B" />
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>
      ) : (
        <div className="card">
          <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <h3 className="card-title">Your Lectures</h3>
          </div>
          {lectures.length === 0 ? (
            <p style={{ padding: '1rem', color: 'var(--text-muted)' }}>No lectures assigned to you yet.</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Lecture</th>
                    <th>Room</th>
                    <th>Schedule</th>
                    <th>Enrolled</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lectures.map((l) => (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 500 }}>{l.title}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{l.room?.name ?? '—'}</td>
                      <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {l.schedules && l.schedules.length > 0
                          ? l.schedules.map((s) => {
                              const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                              return `${days[s.dayOfWeek]} ${formatClock(s.startTime)}–${formatClock(s.endTime)}`;
                            }).join(', ')
                          : l.startTime
                            ? `${formatClock(l.startTime)}–${formatClock(l.endTime)}`
                            : '—'}
                      </td>
                      <td>{l.enrolledCount ?? '—'}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                          onClick={() => navigate('/lecturer/reports', { state: { lectureId: l.id } })}
                        >
                          View Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
