/**
 * Savaitės tinklelis: scheduleService.getAll() + lectureService.getAll() sąjunga pagal lectureId
 * (API schedule DTO neturi įdėtos Lecture, kad išvengtų ciklų — todėl pavadinimai imami iš atskiros užklausos).
 * Galima pridėti slotą modale arba pašalinti slotą iš kortelės.
 */
import { Fragment, useCallback, useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, Trash2 } from 'lucide-react';
import { PageHeader, Modal } from '../../components';
import { scheduleService } from '../../services/scheduleService';
import { lectureService } from '../../services/lectureService';
import type { Schedule, Lecture } from '../../types';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const timeSlots = [
  { start: '09:00', end: '10:30', label: '09:00 - 10:30' },
  { start: '11:00', end: '12:30', label: '11:00 - 12:30' },
  { start: '13:30', end: '15:00', label: '13:30 - 15:00' },
  { start: '15:30', end: '17:00', label: '15:30 - 17:00' },
];

const lectureColors = [
  { bg: '#EEF2FF', border: 'var(--primary)', text: 'var(--primary)' },
  { bg: '#D1FAE5', border: 'var(--success)', text: '#065F46' },
  { bg: '#FEF3C7', border: 'var(--warning)', text: '#92400E' },
  { bg: '#FCE7F3', border: '#EC4899', text: '#9D174D' },
  { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' },
];

export const SchedulesPage = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ lectureId: '', dayOfWeek: 0, startTime: '09:00', endTime: '10:30' });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sch, lec] = await Promise.all([scheduleService.getAll(), lectureService.getAll()]);
      setSchedules(sch);
      setLectures(lec);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const lectureById = (id: string) => lectures.find((l) => l.id === id);

  const toMinutes = (time: string): number => {
    const [h, m] = time.split(':').map((v) => parseInt(v, 10));
    return h * 60 + m;
  };

  const getScheduleForSlot = (dayIndex: number, slotStart: string, slotEnd: string) =>
    schedules.filter((s) => {
      if (s.dayOfWeek !== dayIndex) return false;
      const scheduleStart = toMinutes(s.startTime);
      const scheduleEnd = toMinutes(s.endTime);
      const gridStart = toMinutes(slotStart);
      const gridEnd = toMinutes(slotEnd);
      // Show entry in slot if there is any overlap.
      return scheduleStart < gridEnd && scheduleEnd > gridStart;
    });

  const getLectureColorIndex = (lectureId: string): number => {
    const ids = [...new Set(schedules.map((s) => s.lectureId))];
    return Math.max(0, ids.indexOf(lectureId)) % lectureColors.length;
  };

  const addSchedule = async () => {
    if (!form.lectureId) return;
    setSaving(true);
    setError(null);
    try {
      await scheduleService.create({
        lectureId: form.lectureId,
        dayOfWeek: form.dayOfWeek,
        startTime: form.startTime,
        endTime: form.endTime,
      });
      setModalOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create schedule');
    } finally {
      setSaving(false);
    }
  };

  const removeSchedule = async (id: string) => {
    if (!confirm('Remove this time slot?')) return;
    setError(null);
    try {
      await scheduleService.delete(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  return (
    <div>
      <PageHeader
        title="Schedule Management"
        subtitle="Weekly slots from the database. Create lecture first, then add or adjust slots here."
        action={
          <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Calendar size={16} /> Add schedule entry
          </button>
        }
      />

      {error && (
        <div className="badge badge-danger" style={{ display: 'block', marginBottom: '1rem', padding: '0.75rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `80px repeat(${days.length}, 1fr)`,
              gridAutoRows: '72px',
              border: '1px solid var(--border)',
              minWidth: '980px',
            }}
          >
            <div
              style={{
                background: 'var(--bg-card)',
                padding: '0.75rem',
                fontWeight: 600,
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                borderRight: '1px solid var(--border)',
                borderBottom: '1px solid var(--border)',
                boxSizing: 'border-box',
              }}
            />
            {days.map((day) => (
              <div
                key={day}
                style={{
                  background: 'var(--bg-card)',
                  padding: '0.75rem',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  textAlign: 'center',
                  color: 'var(--text-primary)',
                  borderRight: '1px solid var(--border)',
                  borderBottom: '1px solid var(--border)',
                  boxSizing: 'border-box',
                }}
              >
                {day}
              </div>
            ))}

            {timeSlots.map((slot) => (
              <Fragment key={slot.label}>
                <div
                  style={{
                    background: 'var(--bg-card)',
                    padding: '0.75rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: '72px',
                    lineHeight: 1.2,
                    boxSizing: 'border-box',
                    borderRight: '1px solid var(--border)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  {slot.label}
                </div>
                {days.map((day, dayIndex) => {
                  const slotSchedules = getScheduleForSlot(dayIndex, slot.start, slot.end);
                  return (
                    <div
                      key={`${day}-${slot.label}`}
                      style={{
                        background: 'var(--bg-card)',
                        padding: '0.5rem',
                        minHeight: '60px',
                        borderRight: '1px solid var(--border)',
                        borderBottom: '1px solid var(--border)',
                        boxSizing: 'border-box',
                      }}
                    >
                      {slotSchedules.map((schedule) => {
                        const lec = lectureById(schedule.lectureId);
                        const colorIdx = getLectureColorIndex(schedule.lectureId);
                        const colors = lectureColors[colorIdx];
                        return (
                          <div
                            key={schedule.id}
                            style={{
                              background: colors.bg,
                              borderLeft: `3px solid ${colors.border}`,
                              borderRadius: 'var(--radius-sm)',
                              padding: '0.5rem',
                              fontSize: '0.75rem',
                              marginBottom: '0.25rem',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.25rem' }}>
                              <div style={{ fontWeight: 600, color: colors.text, marginBottom: '0.25rem' }}>{lec?.title ?? 'Lecture'}</div>
                              <button
                                type="button"
                                className="btn btn-outline"
                                style={{ padding: '0.1rem 0.25rem', fontSize: '0.65rem', lineHeight: 1 }}
                                title="Remove slot"
                                onClick={() => void removeSchedule(schedule.id)}
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                            <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <MapPin size={10} /> {lec?.room?.name ?? '—'}
                            </div>
                            <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.125rem' }}>
                              <Clock size={10} /> {schedule.startTime} – {schedule.endTime}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => !saving && setModalOpen(false)} title="Add schedule entry">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Lecture</label>
            <select className="form-input" value={form.lectureId} onChange={(e) => setForm((f) => ({ ...f, lectureId: e.target.value }))}>
              <option value="">Select…</option>
              {lectures.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Day (0 = Monday)</label>
            <select className="form-input" value={form.dayOfWeek} onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: parseInt(e.target.value, 10) }))}>
              {days.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Start</label>
              <input type="time" className="form-input" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">End</label>
              <input type="time" className="form-input" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void addSchedule()} disabled={saving || !form.lectureId}>
              {saving ? 'Saving…' : 'Add'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
