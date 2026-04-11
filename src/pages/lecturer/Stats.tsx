import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../store/AuthContext';
import { TrendingUp } from 'lucide-react';
import { PageHeader, StatCard } from '../../components';
import { apiClient } from '../../services/api';
import { attendanceService } from '../../services/attendanceService';
import type { Lecture, DailyAttendanceSummary } from '../../types';

function firstOfMonth(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}
function lastOfMonth(d: Date): string {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
}

interface LectureStat {
  lecture: Lecture;
  present: number;
  late: number;
  absent: number;
  total: number;
  rate: number;
}

export const StatsPage = () => {
  const { user } = useAuth();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [stats, setStats] = useState<LectureStat[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const from = firstOfMonth(now);
  const to = lastOfMonth(now);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const list = await apiClient.get<Lecture[]>(`/lectures?lecturerId=${user.id}`);
      setLectures(list);

      const results: LectureStat[] = [];
      for (const l of list) {
        try {
          const summary: DailyAttendanceSummary[] = await attendanceService.getDailySummary(l.id, from, to);
          const p = summary.reduce((s, d) => s + d.present, 0);
          const la = summary.reduce((s, d) => s + d.late, 0);
          const a = summary.reduce((s, d) => s + d.absent, 0);
          const t = p + la + a;
          results.push({ lecture: l, present: p, late: la, absent: a, total: t, rate: t > 0 ? Math.round(((p + la) / t) * 100) : 0 });
        } catch {
          results.push({ lecture: l, present: 0, late: 0, absent: 0, total: 0, rate: 0 });
        }
      }
      setStats(results);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [user?.id, from, to]);

  useEffect(() => { void load(); }, [load]);

  const totalRecords = stats.reduce((s, st) => s + st.total, 0);
  const totalPresent = stats.reduce((s, st) => s + st.present, 0);
  const totalLate = stats.reduce((s, st) => s + st.late, 0);
  const avgRate = totalRecords > 0 ? Math.round(((totalPresent + totalLate) / totalRecords) * 100) : 0;
  const atRisk = stats.filter((s) => s.rate > 0 && s.rate < 75).length;

  return (
    <div>
      <PageHeader
        title="Attendance Statistics"
        subtitle={`Overview for ${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" style={{ marginBottom: '2rem' }}>
        <StatCard
          title="Avg. Attendance"
          value={`${avgRate}%`}
          subtitle="This month"
          icon={<TrendingUp size={32} />}
          iconBg="#D1FAE5"
          iconColor="#065F46"
        />
        <StatCard title="Total Records" value={totalRecords} subtitle="This month" />
        <StatCard title="At-Risk Lectures" value={atRisk} subtitle="Below 75%" iconBg="#FEE2E2" iconColor="#991B1B" />
        <StatCard title="Active Courses" value={lectures.length} subtitle="Assigned to you" />
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>
      ) : (
        <div className="card">
          <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <h3 className="card-title">Per-Course Breakdown</h3>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Present</th>
                  <th>Late</th>
                  <th>Absent</th>
                  <th>Total</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.lecture.id}>
                    <td style={{ fontWeight: 500 }}>{s.lecture.title}</td>
                    <td><span className="badge badge-success">{s.present}</span></td>
                    <td><span className="badge badge-warning">{s.late}</span></td>
                    <td><span className="badge badge-danger">{s.absent}</span></td>
                    <td>{s.total}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden', maxWidth: '100px' }}>
                          <div style={{ height: '100%', width: `${s.rate}%`, background: s.rate >= 75 ? 'var(--success)' : 'var(--danger)', borderRadius: '3px' }} />
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{s.rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {stats.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ color: 'var(--text-muted)', padding: '1rem' }}>No data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
