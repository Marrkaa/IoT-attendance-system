import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../store/AuthContext';
import { Radio } from 'lucide-react';
import { PageHeader } from '../../components';
import { attendanceService } from '../../services/attendanceService';
import { apiClient } from '../../services/api';
import type { Lecture, LiveAttendanceData } from '../../types';

const POLL_MS = 4000;

export const LiveAttendancePage = () => {
  const { user } = useAuth();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [selectedLectureId, setSelectedLectureId] = useState('');
  const [live, setLive] = useState<LiveAttendanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeLecture = lectures.find((l) => l.id === selectedLectureId);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await apiClient.get<Lecture[]>(`/lectures?lecturerId=${user.id}`);
        if (cancelled) return;
        setLectures(list);
        setSelectedLectureId((prev) => {
          if (!list.length) return '';
          if (prev && list.some((l) => l.id === prev)) return prev;
          return list[0].id;
        });
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load lectures');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const refreshLive = useCallback(async () => {
    if (!selectedLectureId) return;
    try {
      const rows = await attendanceService.getLiveAttendance(selectedLectureId);
      setLive(rows);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load live attendance');
    }
  }, [selectedLectureId]);

  useEffect(() => {
    if (!selectedLectureId) return;
    refreshLive();
    const id = window.setInterval(refreshLive, POLL_MS);
    return () => window.clearInterval(id);
  }, [selectedLectureId, refreshLive]);

  const connectedCount = live.filter((r) => r.status === 'Connected').length;

  return (
    <div>
      <PageHeader
        title="Live attendance"
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <select
              className="form-input"
              style={{ width: 'auto', minWidth: '220px' }}
              value={selectedLectureId}
              onChange={(e) => setSelectedLectureId(e.target.value)}
              disabled={!lectures.length}
            >
              {lectures.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--success)',
                  animation: 'pulse 2s infinite',
                }}
              />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Connected now: <strong>{connectedCount}</strong> / {live.length}
              </span>
            </div>
          </div>
        }
      />

      {error && (
        <div className="badge badge-danger" style={{ display: 'block', marginBottom: '1rem', padding: '0.75rem' }}>
          {error}
        </div>
      )}

      {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>}

      {!loading && !lectures.length && (
        <div className="card" style={{ padding: '1rem' }}>
          <p style={{ margin: 0 }}>No lectures assigned to this lecturer (or the API returned an empty list).</p>
        </div>
      )}

      {activeLecture && (
        <div
          className="card mb-6"
          style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)', border: 'none' }}
        >
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary)', margin: '0 0 0.25rem' }}>
            {activeLecture.title}
          </h2>
          {activeLecture.room?.name && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>{activeLecture.room.name}</p>
          )}
        </div>
      )}

      <div className="table-container card">
        <table className="table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Status</th>
              <th>MAC</th>
              <th>Signal</th>
              <th>Since / duration</th>
            </tr>
          </thead>
          <tbody>
            {live.length === 0 && selectedLectureId && (
              <tr>
                <td colSpan={5} style={{ color: 'var(--text-muted)', padding: '1rem' }}>
                  No students enrolled in this lecture, or there is no connection data yet.
                </td>
              </tr>
            )}
            {live.map((row) => (
              <tr key={row.studentId}>
                <td style={{ fontWeight: 500 }}>{row.studentName}</td>
                <td>
                  <span
                    className={row.status === 'Connected' ? 'badge badge-success' : 'badge'}
                    style={{
                      background: row.status === 'Connected' ? undefined : 'var(--border)',
                      color: row.status === 'Connected' ? undefined : 'var(--text-secondary)',
                    }}
                  >
                    {row.status === 'Connected' ? 'Connected' : 'Not connected'}
                  </span>
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.deviceMac ?? '—'}</td>
                <td>
                  {row.signalStrengthDbm != null ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Radio size={14} />
                      {row.signalStrengthDbm} dBm
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td>
                  {row.connectedSince
                    ? `${new Date(row.connectedSince).toLocaleTimeString('en-US')} · ~${Math.round(row.connectionMinutes ?? 0)} min`
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
