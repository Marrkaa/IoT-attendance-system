/**
 * Admin paskaitos: lectureService + scheduleService + enrollmentService + userService.
 * Sukūrimas: POST paskaita, tada (nebūtina) POST pirmas tvarkaraščio slotas.
 * Įstojimai: modale sinchronizuojami su /api/enrollments (create/delete).
 */
import { useCallback, useEffect, useState } from 'react';
import { Plus, Clock, MapPin, Users, Trash2 } from 'lucide-react';
import { lectureService } from '../../services/lectureService';
import { roomService } from '../../services/roomService';
import { userService } from '../../services/userService';
import { scheduleService } from '../../services/scheduleService';
import { enrollmentService } from '../../services/enrollmentService';
import { PageHeader, Modal, Avatar, ConfirmDialog } from '../../components';
import { formatClock } from '../../utils';
import type { Lecture, Room, User, Enrollment } from '../../types';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const LecturesPage = () => {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [lecturers, setLecturers] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    lecturerId: '',
    roomId: '',
    dayOfWeek: 0,
    startTime: '10:00',
    endTime: '11:30',
  });

  const [editLecture, setEditLecture] = useState<Lecture | null>(null);
  const [editScheduleId, setEditScheduleId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    lecturerId: '',
    roomId: '',
    dayOfWeek: 0,
    startTime: '10:00',
    endTime: '11:30',
  });

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignLectureId, setAssignLectureId] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [assignChecks, setAssignChecks] = useState<Record<string, boolean>>({});

  const [deleteTarget, setDeleteTarget] = useState<Lecture | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [lec, rms, lecUsers, studUsers] = await Promise.all([
        lectureService.getAll(),
        roomService.getAll(),
        userService.getAll('Lecturer'),
        userService.getAll('Student'),
      ]);
      setLectures(lec);
      setRooms(rms);
      setLecturers(lecUsers);
      setStudents(studUsers);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openAssign = async (lectureId: string) => {
    setAssignLectureId(lectureId);
    setError(null);
    try {
      const list = await enrollmentService.getByLecture(lectureId);
      setEnrollments(list);
      const m: Record<string, boolean> = {};
      for (const s of students) {
        m[s.id] = list.some((e) => e.studentId === s.id);
      }
      setAssignChecks(m);
      setAssignOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load enrollments');
    }
  };

  const saveAssignments = async () => {
    if (!assignLectureId) return;
    setSaving(true);
    setError(null);
    try {
      for (const s of students) {
        const want = assignChecks[s.id] ?? false;
        const ex = enrollments.find((e) => e.studentId === s.id);
        if (want && !ex) {
          await enrollmentService.create({ studentId: s.id, lectureId: assignLectureId });
        }
        if (!want && ex) {
          await enrollmentService.delete(ex.id);
        }
      }
      setAssignOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save enrollments');
    } finally {
      setSaving(false);
    }
  };

  const submitCreate = async () => {
    if (!createForm.title.trim() || !createForm.lecturerId || !createForm.roomId) return;
    setSaving(true);
    setError(null);
    try {
      const lec = await lectureService.create({
        title: createForm.title.trim(),
        description: createForm.description.trim() || undefined,
        lecturerId: createForm.lecturerId,
        roomId: createForm.roomId,
      });
      await scheduleService.create({
        lectureId: lec.id,
        dayOfWeek: createForm.dayOfWeek,
        startTime: createForm.startTime,
        endTime: createForm.endTime,
      });
      setCreateOpen(false);
      setCreateForm({
        title: '',
        description: '',
        lecturerId: '',
        roomId: '',
        dayOfWeek: 0,
        startTime: '10:00',
        endTime: '11:30',
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = async (l: Lecture) => {
    let firstSlot = l.schedules?.[0];
    if (!firstSlot) {
      try {
        const slots = await scheduleService.getAll(l.id);
        firstSlot = slots[0];
      } catch {
        firstSlot = undefined;
      }
    }

    setEditLecture(l);
    setEditScheduleId(firstSlot?.id ?? null);
    setEditForm({
      title: l.title,
      description: l.description ?? '',
      lecturerId: l.lecturerId,
      roomId: l.roomId,
      dayOfWeek: firstSlot?.dayOfWeek ?? 0,
      startTime: firstSlot?.startTime ?? l.startTime ?? '10:00',
      endTime: firstSlot?.endTime ?? l.endTime ?? '11:30',
    });
  };

  const submitEdit = async () => {
    if (!editLecture || !editForm.title.trim() || !editForm.lecturerId || !editForm.roomId) return;
    setSaving(true);
    setError(null);
    try {
      await lectureService.update(editLecture.id, {
        title: editForm.title,
        description: editForm.description || undefined,
        lecturerId: editForm.lecturerId,
        roomId: editForm.roomId,
      });
      if (editScheduleId) {
        await scheduleService.update(editScheduleId, {
          dayOfWeek: editForm.dayOfWeek,
          startTime: editForm.startTime,
          endTime: editForm.endTime,
        });
      } else {
        await scheduleService.create({
          lectureId: editLecture.id,
          dayOfWeek: editForm.dayOfWeek,
          startTime: editForm.startTime,
          endTime: editForm.endTime,
        });
      }
      setEditLecture(null);
      setEditScheduleId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      await lectureService.delete(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Lecture Management"
        subtitle="Create lectures, set weekly time slot, assign students — all persisted via API."
        action={
          <button type="button" className="btn btn-primary" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Create Lecture
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
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Lecture</th>
                  <th>Lecturer</th>
                  <th>Room</th>
                  <th>Time</th>
                  <th>Enrolled</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lectures.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{l.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.description}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Avatar firstName={l.lecturer?.firstName || ''} lastName={l.lecturer?.lastName || ''} size={28} />
                        <span style={{ fontSize: '0.875rem' }}>
                          {l.lecturer?.firstName} {l.lecturer?.lastName}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
                        <MapPin size={14} color="var(--text-muted)" /> {l.room?.name ?? '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
                        <Clock size={14} color="var(--text-muted)" />
                        {formatClock(l.startTime)} – {formatClock(l.endTime)}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ backgroundColor: '#EEF2FF', color: 'var(--primary)' }}>
                        {l.enrolledCount ?? 0} students
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="button" className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }} onClick={() => void openEdit(l)}>
                          Edit
                        </button>
                        <button type="button" className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }} onClick={() => void openAssign(l.id)}>
                          <Users size={12} /> Assign
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', color: 'var(--danger)' }}
                          onClick={() => setDeleteTarget(l)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={createOpen} onClose={() => !saving && setCreateOpen(false)} title="Create Lecture" size="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Title</label>
            <input
              className="form-input"
              placeholder="Lecture title"
              value={createForm.title}
              onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Description</label>
            <input
              className="form-input"
              placeholder="Short description"
              value={createForm.description}
              onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Lecturer</label>
              <select
                className="form-input"
                value={createForm.lecturerId}
                onChange={(e) => setCreateForm((f) => ({ ...f, lecturerId: e.target.value }))}
              >
                <option value="">Select lecturer…</option>
                {lecturers.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.firstName} {x.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Room</label>
              <select
                className="form-input"
                value={createForm.roomId}
                onChange={(e) => setCreateForm((f) => ({ ...f, roomId: e.target.value }))}
              >
                <option value="">Select room…</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.capacity} seats)
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            First weekly slot (you can add more on Schedule Management):
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Day</label>
              <select
                className="form-input"
                value={createForm.dayOfWeek}
                onChange={(e) => setCreateForm((f) => ({ ...f, dayOfWeek: parseInt(e.target.value, 10) }))}
              >
                {WEEKDAYS.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Start</label>
              <input type="time" className="form-input" value={createForm.startTime} onChange={(e) => setCreateForm((f) => ({ ...f, startTime: e.target.value }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">End</label>
              <input type="time" className="form-input" value={createForm.endTime} onChange={(e) => setCreateForm((f) => ({ ...f, endTime: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => setCreateOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void submitCreate()} disabled={saving}>
              {saving ? 'Saving…' : 'Create Lecture'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={editLecture !== null} onClose={() => !saving && setEditLecture(null)} title="Edit Lecture" size="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Title</label>
            <input className="form-input" value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Description</label>
            <input className="form-input" value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Lecturer</label>
              <select className="form-input" value={editForm.lecturerId} onChange={(e) => setEditForm((f) => ({ ...f, lecturerId: e.target.value }))}>
                {lecturers.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.firstName} {x.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Room</label>
              <select className="form-input" value={editForm.roomId} onChange={(e) => setEditForm((f) => ({ ...f, roomId: e.target.value }))}>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Day</label>
              <select
                className="form-input"
                value={editForm.dayOfWeek}
                onChange={(e) => setEditForm((f) => ({ ...f, dayOfWeek: parseInt(e.target.value, 10) }))}
              >
                {WEEKDAYS.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Start</label>
              <input
                type="time"
                className="form-input"
                value={editForm.startTime}
                onChange={(e) => setEditForm((f) => ({ ...f, startTime: e.target.value }))}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">End</label>
              <input
                type="time"
                className="form-input"
                value={editForm.endTime}
                onChange={(e) => setEditForm((f) => ({ ...f, endTime: e.target.value }))}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => setEditLecture(null)} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void submitEdit()} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={assignOpen} onClose={() => !saving && setAssignOpen(false)} title="Assign Students" size="md">
        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Enroll students in <strong>{lectures.find((l) => l.id === assignLectureId)?.title}</strong>
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
            {students.map((s) => (
              <label
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  background: assignChecks[s.id] ? '#EEF2FF' : 'white',
                }}
              >
                <input
                  type="checkbox"
                  checked={assignChecks[s.id] ?? false}
                  onChange={(e) => setAssignChecks((prev) => ({ ...prev, [s.id]: e.target.checked }))}
                  style={{ width: '16px', height: '16px' }}
                />
                <Avatar firstName={s.firstName} lastName={s.lastName} size={28} />
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                    {s.firstName} {s.lastName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.email}</div>
                </div>
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => setAssignOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void saveAssignments()} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
        title="Delete Lecture"
        message={`Delete "${deleteTarget?.title}"? Enrollments and schedules for this lecture will be removed.`}
        loading={deleting}
      />
    </div>
  );
};
