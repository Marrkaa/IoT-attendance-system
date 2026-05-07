import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../store/AuthContext';
import { useLocation } from 'react-router-dom';
import { Calendar, Download, PenLine, UserPlus } from 'lucide-react';
import * as XLSX from 'xlsx';
import { PageHeader, StatusBadge, Modal } from '../../components';
import { apiClient } from '../../services/api';
import { attendanceService } from '../../services/attendanceService';
import { enrollmentService } from '../../services/enrollmentService';
import type {
  AttendanceRecord,
  AttendanceStatus,
  DailyAttendanceSummary,
  Enrollment,
  Lecture,
  Schedule,
} from '../../types';

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

function backendDayOfWeekFromIsoDate(dateIso: string): number {
  const d = new Date(`${dateIso}T12:00:00`);
  return (d.getDay() + 6) % 7;
}

/** Earliest schedule slot for that calendar day (0=Mon) from lecture.schedules returned by the API. */
function scheduleForWeekday(lecture: Lecture | undefined, dateIso: string): Schedule | undefined {
  if (!lecture?.schedules?.length) return undefined;
  const dow = backendDayOfWeekFromIsoDate(dateIso);
  const slots = lecture.schedules.filter((s) => s.dayOfWeek === dow);
  if (slots.length === 0) return undefined;
  return [...slots].sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
}

function escapeCsvField(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  const s = String(value);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

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
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualStudentId, setManualStudentId] = useState('');
  const [manualDate, setManualDate] = useState('');
  const [manualStatus, setManualStatus] = useState<AttendanceStatus>('Absent');
  const [manualReason, setManualReason] = useState('');
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('Present');
  const [editReason, setEditReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    if (!selectedLectureId) {
      setEnrollments([]);
      return;
    }
    void enrollmentService.getByLecture(selectedLectureId).then(setEnrollments).catch(() => setEnrollments([]));
  }, [selectedLectureId]);

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

  const openEdit = (r: AttendanceRecord) => {
    setFormError(null);
    setEditStatus(r.status);
    setEditReason('');
    setEditRecord(r);
  };

  const saveEdit = async () => {
    if (!editRecord) return;
    setSaving(true);
    setFormError(null);
    try {
      await attendanceService.updateStatus(
        editRecord.id,
        editStatus,
        editReason.trim() || undefined,
      );
      setEditRecord(null);
      await fetchReport();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const openManual = () => {
    setFormError(null);
    setManualReason('');
    setManualStatus('Absent');
    setManualDate(dateFrom);
    const firstEnr = enrollments[0];
    setManualStudentId(firstEnr?.studentId ?? '');
    setManualOpen(true);
  };

  const saveManual = async () => {
    if (!selectedLectureId || !manualStudentId || !manualDate || !selectedLecture) {
      setFormError('Choose a student and a date.');
      return;
    }
    if (manualDate < dateFrom || manualDate > dateTo) {
      setFormError('Date must be within the selected From–To range.');
      return;
    }
    const sch = scheduleForWeekday(selectedLecture, manualDate);
    if (!sch) {
      setFormError('No lecture schedule applies to the weekday of the selected date.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await attendanceService.manualMark({
        studentId: manualStudentId,
        lectureId: selectedLectureId,
        scheduleId: sch.id,
        date: manualDate,
        status: manualStatus,
        reason: manualReason.trim() || undefined,
      });
      setManualOpen(false);
      await fetchReport();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    const headerCols = [
      'Date',
      'Student',
      'Email',
      'Status',
      'Check-in',
      'Check-out',
      'Duration (min)',
    ];
    const header = headerCols.map(escapeCsvField).join(',');
    const rows = records.map((r) =>
      [
        r.date,
        r.student ? `${r.student.firstName} ${r.student.lastName}` : r.studentId,
        r.student?.email ?? '',
        r.status,
        r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString('en-US') : '',
        r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString('en-US') : '',
        r.connectionDurationMinutes != null ? r.connectionDurationMinutes.toFixed(1) : '',
      ].map(escapeCsvField)
        .join(',')
    );
    const body = [header, ...rows].join('\r\n');
    const filename = `attendance_${(selectedLecture?.title ?? 'report').replace(/[\\/:"*?<>|]+/g, '_')}_${dateFrom}_${dateTo}.csv`;
    const blob = new Blob(['\uFEFF', body], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, filename);
  };

  const exportXlsx = () => {
    const rows = records.map((r) => ({
      Date: r.date ?? '',
      Student: r.student ? `${r.student.firstName} ${r.student.lastName}` : r.studentId,
      Email: r.student?.email ?? '',
      Status: r.status,
      'Check-in': r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString('en-US') : '',
      'Check-out': r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString('en-US') : '',
      'Duration (min)': r.connectionDurationMinutes != null ? Number(r.connectionDurationMinutes.toFixed(1)) : '',
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
    XLSX.writeFile(workbook, `attendance_${selectedLecture?.title ?? 'report'}_${dateFrom}_${dateTo}.xlsx`);
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
          <button type="button" className="btn btn-outline" onClick={exportXlsx} disabled={records.length === 0}>
            <Download size={14} /> Export XLSX
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={openManual}
            disabled={!selectedLectureId || enrollments.length === 0}
          >
            <UserPlus size={14} /> Manual entry
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
          <div style={{ padding: '1rem' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              No attendance records for the selected period.
            </p>
            {enrollments.length > 0 && selectedLectureId && (
              <button type="button" className="btn btn-outline" onClick={openManual}>
                <UserPlus size={14} /> Add manual record
              </button>
            )}
          </div>
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
                  <th style={{ width: '110px' }}>Actions</th>
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
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          title="Edit status / manual override"
                          onClick={() => openEdit(r)}
                        >
                          <PenLine size={12} /> Edit
                        </button>
                        {r.isManualOverride && (
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Manual</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={editRecord != null}
        onClose={() => { if (!saving) { setEditRecord(null); setFormError(null); } }}
        title="Edit status"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {editRecord && (
            <>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {editRecord.student?.firstName} {editRecord.student?.lastName} · {editRecord.date}
              </p>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Status</label>
                <select
                  className="form-input"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as AttendanceStatus)}
                >
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Reason (optional)</label>
                <input
                  className="form-input"
                  type="text"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="e.g. sick leave, excuse note…"
                />
              </div>
            </>
          )}
          {formError && <div className="badge badge-danger">{formError}</div>}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline" disabled={saving} onClick={() => { setEditRecord(null); setFormError(null); }}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void saveEdit()}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={manualOpen}
        onClose={() => { if (!saving) { setManualOpen(false); setFormError(null); } }}
        title="Manual attendance entry"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Creates or updates one record for an enrolled student on a given date using the lecture&apos;s weekly schedule slot for that weekday.
          </p>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Student</label>
            <select
              className="form-input"
              value={manualStudentId}
              onChange={(e) => setManualStudentId(e.target.value)}
            >
              {enrollments.map((en) => (
                <option key={en.id} value={en.studentId}>
                  {en.student ? `${en.student.firstName} ${en.student.lastName} (${en.student.email})` : en.studentId}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Date ({dateFrom} – {dateTo})</label>
            <input
              className="form-input"
              type="date"
              min={dateFrom}
              max={dateTo}
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Status</label>
            <select
              className="form-input"
              value={manualStatus}
              onChange={(e) => setManualStatus(e.target.value as AttendanceStatus)}
            >
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Reason (optional)</label>
            <input
              className="form-input"
              type="text"
              value={manualReason}
              onChange={(e) => setManualReason(e.target.value)}
            />
          </div>
          {formError && <div className="badge badge-danger">{formError}</div>}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline" disabled={saving} onClick={() => { setManualOpen(false); setFormError(null); }}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void saveManual()}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
