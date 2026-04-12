import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Clock, MapPin, User } from 'lucide-react';
import { PageHeader } from '../../components';
import { apiClient } from '../../services/api';
import { lectureService } from '../../services/lectureService';
import { useAuth } from '../../store/AuthContext';
import { formatClock } from '../../utils';
import type { Lecture, Enrollment } from '../../types';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const StudentLecturesPage = () => {
  const { user } = useAuth();
  const [enrolledLectures, setEnrolledLectures] = useState<Lecture[]>([]);
  const [allLectures, setAllLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [enrollments, lectures] = await Promise.all([
        apiClient.get<Enrollment[]>(`/enrollments/student/${user.id}`),
        lectureService.getAll(),
      ]);
      const enrolledIds = new Set(enrollments.map((e) => e.lectureId));
      setEnrolledLectures(lectures.filter((l) => enrolledIds.has(l.id)));
      setAllLectures(lectures.filter((l) => !enrolledIds.has(l.id)));
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <p style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading…</p>;

  return (
    <div>
      <PageHeader
        title="My Lectures"
        subtitle={`You are enrolled in ${enrolledLectures.length} lectures`}
        action={
          <button type="button" className="btn btn-outline">
            <BookOpen size={16} /> Browse Catalog
          </button>
        }
      />

      <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Enrolled Lectures</h2>
      {enrolledLectures.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>You are not enrolled in any lectures yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" style={{ marginBottom: '2rem' }}>
          {enrolledLectures.map((lecture) => (
            <div className="card" key={lecture.id}>
              <div className="card-header">
                <h3 className="card-title" style={{ color: 'var(--primary)' }}>{lecture.title}</h3>
                <span className="badge badge-success">Enrolled</span>
              </div>
              {lecture.description && (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{lecture.description}</p>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <User size={14} />
                  <span>{lecture.lecturer ? `${lecture.lecturer.firstName} ${lecture.lecturer.lastName}` : '—'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <MapPin size={14} />
                  <span>{lecture.room?.name ?? '—'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <Clock size={14} />
                  <span>{formatClock(lecture.startTime)} – {formatClock(lecture.endTime)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <BookOpen size={14} />
                  <span>{lecture.dayOfWeek !== undefined ? DAY_NAMES[lecture.dayOfWeek] : 'TBD'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {allLectures.length > 0 && (
        <>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Available Lectures</h2>
          <div className="card">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Lecture</th>
                    <th>Lecturer</th>
                    <th>Schedule</th>
                    <th>Room</th>
                    <th>Enrolled</th>
                  </tr>
                </thead>
                <tbody>
                  {allLectures.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{l.title}</div>
                        {l.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.description}</div>}
                      </td>
                      <td style={{ fontSize: '0.875rem' }}>{l.lecturer ? `${l.lecturer.firstName} ${l.lecturer.lastName}` : '—'}</td>
                      <td style={{ fontSize: '0.875rem' }}>
                        {l.dayOfWeek !== undefined ? DAY_NAMES[l.dayOfWeek] : '—'}, {formatClock(l.startTime)}
                      </td>
                      <td style={{ fontSize: '0.875rem' }}>{l.room?.name ?? '—'}</td>
                      <td>
                        <span className="badge" style={{ backgroundColor: '#EEF2FF', color: 'var(--primary)' }}>
                          {l.enrolledCount ?? 0} students
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
