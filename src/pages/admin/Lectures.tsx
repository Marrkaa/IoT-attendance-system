import { useState } from 'react';
import { Plus, Clock, MapPin, Users } from 'lucide-react';
import { mockLectures, mockRooms, mockUsers, mockEnrollments } from '../../mock-data/data';
import { PageHeader, Modal, Avatar } from '../../components';
import { formatTime } from '../../utils';

export const LecturesPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedLectureId, setSelectedLectureId] = useState<string | null>(null);

  const lecturers = mockUsers.filter(u => u.role === 'Lecturer');
  const students = mockUsers.filter(u => u.role === 'Student');

  const openAssign = (lectureId: string) => {
    setSelectedLectureId(lectureId);
    setAssignModalOpen(true);
  };

  const enrolledStudentIds = (lectureId: string) =>
    mockEnrollments.filter(e => e.lectureId === lectureId).map(e => e.studentId);

  return (
    <div>
      <PageHeader
        title="Lecture Management"
        subtitle="Create and manage lectures, assign students"
        action={<button className="btn btn-primary" onClick={() => setModalOpen(true)}><Plus size={16} /> Create Lecture</button>}
      />

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
              {mockLectures.map(l => (
                <tr key={l.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{l.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.description}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Avatar firstName={l.lecturer?.firstName || ''} lastName={l.lecturer?.lastName || ''} size={28} />
                      <span style={{ fontSize: '0.875rem' }}>{l.lecturer?.firstName} {l.lecturer?.lastName}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
                      <MapPin size={14} color="var(--text-muted)" /> {l.room?.name}
                    </span>
                  </td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
                      <Clock size={14} color="var(--text-muted)" />
                      {formatTime(l.startTime)} - {formatTime(l.endTime)}
                    </span>
                  </td>
                  <td>
                    <span className="badge" style={{ backgroundColor: '#EEF2FF', color: 'var(--primary)' }}>
                      {enrolledStudentIds(l.id).length} students
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>Edit</button>
                      <button className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }} onClick={() => openAssign(l.id)}>
                        <Users size={12} /> Assign
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Lecture Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Lecture" size="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Title</label>
            <input className="form-input" placeholder="Lecture title" />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Description</label>
            <input className="form-input" placeholder="Short description" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Lecturer</label>
              <select className="form-input">
                <option value="">Select lecturer...</option>
                {lecturers.map(l => <option key={l.id} value={l.id}>{l.firstName} {l.lastName}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Room</label>
              <select className="form-input">
                <option value="">Select room...</option>
                {mockRooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.capacity} seats)</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Day</label>
              <select className="form-input">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Start Time</label>
              <input type="time" className="form-input" defaultValue="10:00" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">End Time</label>
              <input type="time" className="form-input" defaultValue="11:30" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => setModalOpen(false)}>Create Lecture</button>
          </div>
        </div>
      </Modal>

      {/* Assign Students Modal */}
      <Modal isOpen={assignModalOpen} onClose={() => setAssignModalOpen(false)} title="Assign Students" size="md">
        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Select students to enroll in <strong>{mockLectures.find(l => l.id === selectedLectureId)?.title}</strong>
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
            {students.map(s => {
              const isEnrolled = selectedLectureId ? enrolledStudentIds(selectedLectureId).includes(s.id) : false;
              return (
                <label key={s.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)', cursor: 'pointer',
                  background: isEnrolled ? '#EEF2FF' : 'white',
                }}>
                  <input type="checkbox" defaultChecked={isEnrolled} style={{ width: '16px', height: '16px' }} />
                  <Avatar firstName={s.firstName} lastName={s.lastName} size={28} />
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{s.firstName} {s.lastName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.email}</div>
                  </div>
                </label>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
            <button className="btn btn-outline" onClick={() => setAssignModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => setAssignModalOpen(false)}>Save Assignments</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
