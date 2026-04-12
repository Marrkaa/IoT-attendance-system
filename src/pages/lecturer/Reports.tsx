import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../store/AuthContext';
import { useLocation } from 'react-router-dom';
import { Calendar, Download } from 'lucide-react';
import { PageHeader, StatusBadge } from '../../components';
import { apiClient } from '../../services/api';
import { attendanceService } from '../../services/attendanceService';
import type { Lecture, AttendanceRecord, DailyAttendanceSummary } from '../../types';

function mondayOfWeek(d: Date): string {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().slice(0, 10);
}

function sundayOfWeek(d: Date): string {
  const day = d.getDay();
  const diff = d.getDate() + (day === 0 ? 0 : 7 - day);
  const sunday = new Date(d);
  sunday.setDate(diff);
  return sunday.toISOString().slice(0, 10);
}

function firstOfMonth(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function lastOfMonth(d: Date): string {
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return last.toISOString().slice(0, 10);
}

type RangeMode = 'day' | 'week' | 'month' | 'custom';

export const ReportsPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const preselectedLectureId = (location.state as { lectureId?: string } | null)?.lectureId;

  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [selectedLectureId, setSelectedLectureId] = useState(preselectedLectureId ?? '');
  const [rangeMode, setRangeMode] = useState<RangeMode>('week');
  const [dateFrom, setDateFrom] = useState(mondayOfWeek(new Date()));
  const [dateTo, setDateTo] = useState(sundayOfWeek(new Date()));
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<DailyAttendanceSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLectures, setLoadingLectures] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const list = await apiClient.get<Lecture[]>(`/lectures?lecturerId=${user.id}`);
        setLectures(list);
        if (!selectedLectureId && list.length > 0) setSelectedLectureId(list[0].id);
      } catch { /* silent */ }
      finally { setLoadingLectures(false); }
    })();
  }, [user?.id]);

  const applyRangeMode = (mode: RangeMode) => {
    setRangeMode(mode);
    const now = new Date();
    if (mode === 'day') {
      const d = now.toISOString().slice(0, 10);
      setDateFrom(d);
      setDateTo(d);
    } else if (mode === 'week') {
      setDateFrom(mondayOfWeek(now));
      setDateTo(sundayOfWeek(now));
    } else if (mode === 'month') {
      setDateFrom(firstOfMonth(now));
      setDateTo(lastOfMonth(now));
    }
  };

  const fetchReport = useCallback(async () => {
    if (!selectedLectureId || !dateFrom || !dateTo) return;
    setLoading(true);
    try {
      const [recs, sum] = await Promise.all([
        attendanceService.getByLecture(selectedLectureId),
        attendanceService.getDailySummary(selectedLectureId, dateFrom, dateTo),
      ]);
      const from = dateFrom;
      const to = dateTo;
      setRecords(recs.filter((r) => {
        const d = r.date ?? '';
        return d >= from && d <= to;
      }));
      setSummary(sum);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [selectedLectureId, dateFrom, dateTo]);

  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

  useEffect(() => {
    if (!selectedLectureId) return;
    const id = window.setInterval(() => {
      void fetchReport();
    }, 10000);
    return () => window.clearInterval(id);
  }, [selectedLectureId, fetchReport]);

  const present = records.filter((r) => r.status === 'Present').length;
  const late = records.filter((r) => r.status === 'Late').length;
  const absent = records.filter((r) => r.status === 'Absent').length;
  const total = records.length;
  const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  const selectedLecture = lectures.find((l) => l.id === selectedLectureId);

  const exportCsv = () => {
    const header = 'Date,Student,Email,Status,Check-in,Check-out,Duration (min)\n';
    const rows = records.map((r) =>
      [
        r.date,
        r.student ? `${r.student.firstName} ${r.student.lastName}` : r.studentId,
        r.student?.email ?? '',
        r.status,
        r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString('en-US') : '',
        r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString('en-US') : '',
        r.connectionDurationMinutes?.toFixed(1) ?? '',
      ].join(',')
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${selectedLecture?.title ?? 'report'}_${dateFrom}_${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="Attendance Reports"
        subtitle="View detailed attendance records for your lectures"
      />

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0, minWidth: '200px' }}>
            <label className="form-label">Lecture</label>
            <select
              className="form-input"
              value={selectedLectureId}
              onChange={(e) => setSelectedLectureId(e.target.value)}
              disabled={loadingLectures}
            >
              {lectures.map((l) => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {(['day', 'week', 'month', 'custom'] as const).map((m) => (
              <button
                key={m}
                type="button"
                className={`btn ${rangeMode === m ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem', textTransform: 'capitalize' }}
                onClick={() => applyRangeMode(m)}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">From</label>
            <input
              type="date"
              className="form-input"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setRangeMode('custom'); }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">To</label>
            <input
              type="date"
              className="form-input"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setRangeMode('custom'); }}
            />
          </div>

          <button type="button" className="btn btn-outline" onClick={exportCsv} disabled={records.length === 0}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6" style={{ marginBottom: '1.5rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rate</p>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: rate >= 75 ? 'var(--success)' : 'var(--danger)' }}>{rate}%</h3>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Records</p>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{total}</h3>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Present</p>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--success)' }}>{present}</h3>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Late</p>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--warning)' }}>{late}</h3>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Absent</p>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--danger)' }}>{absent}</h3>
        </div>
      </div>

      {/* Daily summary */}
      {summary.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
            <h3 className="card-title"><Calendar size={16} /> Daily Summary</h3>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Present</th>
                  <th>Late</th>
                  <th>Absent</th>
                  <th>Total</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((d) => {
                  const dayRate = d.total > 0 ? Math.round(((d.present + d.late) / d.total) * 100) : 0;
                  return (
                    <tr key={d.date}>
                      <td style={{ fontWeight: 500 }}>{d.date}</td>
                      <td><span className="badge badge-success">{d.present}</span></td>
                      <td><span className="badge badge-warning">{d.late}</span></td>
                      <td><span className="badge badge-danger">{d.absent}</span></td>
                      <td>{d.total}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ flex: 1, height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden', maxWidth: '80px' }}>
                            <div style={{ height: '100%', width: `${dayRate}%`, background: dayRate >= 75 ? 'var(--success)' : 'var(--danger)', borderRadius: '3px' }} />
                          </div>
                          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{dayRate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detailed records */}
      <div className="card">
        <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
          <h3 className="card-title">Student Records</h3>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{records.length} records</span>
        </div>

        {loading ? (
          <p style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Loading…</p>
        ) : records.length === 0 ? (
          <p style={{ padding: '1rem', color: 'var(--text-muted)' }}>No attendance records found for the selected period.</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Check-in</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{r.student ? `${r.student.firstName} ${r.student.lastName}` : '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.student?.email}</div>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>{r.date}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td style={{ fontSize: '0.875rem' }}>
                      {r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString('en-US') : '—'}
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>
                      {r.connectionDurationMinutes != null ? `${r.connectionDurationMinutes.toFixed(1)} min` : '—'}
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
};
