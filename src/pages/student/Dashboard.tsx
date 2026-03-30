import { useAuth } from '../../store/AuthContext';
import { Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';
import { mockAttendance, mockLectures, mockEnrollments } from '../../mock-data/data';
import { PageHeader, StatCard, StatusBadge } from '../../components';
import { formatTime } from '../../utils';

export const StudentDashboard = () => {
  const { user } = useAuth();

  const studentRecords = mockAttendance.filter(r => r.studentId === user?.id);

  const present = studentRecords.filter(r => r.status === 'Present').length;
  const late = studentRecords.filter(r => r.status === 'Late').length;
  const absent = studentRecords.filter(r => r.status === 'Absent').length;
  const total = studentRecords.length;
  const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  const enrolledLectureIds = mockEnrollments
    .filter(e => e.studentId === user?.id)
    .map(e => e.lectureId);
  const enrolledLectures = mockLectures.filter(l => enrolledLectureIds.includes(l.id));

  return (
    <div>
      <PageHeader
        title="Student Dashboard"
        subtitle="Track your attendance and history"
        action={
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={16} /> View Full Schedule
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" style={{ marginBottom: '2rem' }}>
        <StatCard title="Overall Attendance" value={`${percentage}%`} subtitle="Target: 80%" gradient />
        <StatCard title="Present" value={present} icon={<CheckCircle size={32} />} iconBg="#D1FAE5" iconColor="#065F46" />
        <StatCard title="Late" value={late} icon={<Clock size={32} />} iconBg="#FEF3C7" iconColor="#92400E" />
        <StatCard title="Absent" value={absent} icon={<XCircle size={32} />} iconBg="#FEE2E2" iconColor="#991B1B" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <h3 className="card-title">Recent Attendance History</h3>
            <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>View All</button>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Lecture</th>
                  <th>Date / Time</th>
                  <th>Instructor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {studentRecords.length > 0 ? studentRecords.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{record.lecture?.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{record.lecture?.room?.name}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{new Date(record.lecture!.startTime).toLocaleDateString()}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatTime(record.timestamp)}
                      </div>
                    </td>
                    <td>{record.lecture?.lecturer?.firstName} {record.lecture?.lecturer?.lastName}</td>
                    <td><StatusBadge status={record.status} /></td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No recent records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <h3 className="card-title">Upcoming Classes</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {enrolledLectures.map(lecture => (
              <div key={lecture.id} style={{ display: 'flex', gap: '1rem', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ background: 'var(--primary)', color: 'white', padding: '0.5rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '60px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>{new Date(lecture.startTime).toLocaleString('default', { month: 'short' })}</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{new Date(lecture.startTime).getDate()}</span>
                </div>
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem', color: 'var(--primary)' }}>{lecture.title}</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={12} /> {formatTime(lecture.startTime)} - {formatTime(lecture.endTime)}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lecture.room?.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
