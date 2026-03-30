import { Calendar, Clock, MapPin } from 'lucide-react';
import { PageHeader } from '../../components';
import { mockSchedules } from '../../mock-data/data';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

const lectureColors = [
  { bg: '#EEF2FF', border: 'var(--primary)', text: 'var(--primary)' },
  { bg: '#D1FAE5', border: 'var(--success)', text: '#065F46' },
  { bg: '#FEF3C7', border: 'var(--warning)', text: '#92400E' },
  { bg: '#FCE7F3', border: '#EC4899', text: '#9D174D' },
  { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' },
];

export const SchedulesPage = () => {
  const getScheduleForSlot = (dayIndex: number, hour: string) => {
    return mockSchedules.filter(s => {
      const startHour = parseInt(s.startTime.split(':')[0]);
      const slotHour = parseInt(hour.split(':')[0]);
      return s.dayOfWeek === dayIndex && startHour === slotHour;
    });
  };

  const getLectureColorIndex = (lectureId: string): number => {
    const ids = [...new Set(mockSchedules.map(s => s.lectureId))];
    return ids.indexOf(lectureId) % lectureColors.length;
  };

  return (
    <div>
      <PageHeader
        title="Schedule Management"
        subtitle="Weekly timetable overview"
        action={<button className="btn btn-primary"><Calendar size={16} /> Add Schedule Entry</button>}
      />

      <div className="card" style={{ overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(5, 1fr)', gap: '1px', background: 'var(--border)', minWidth: '700px' }}>
          {/* Header row */}
          <div style={{ background: 'var(--bg-card)', padding: '0.75rem', fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-muted)' }}></div>
          {days.map(day => (
            <div key={day} style={{ background: 'var(--bg-card)', padding: '0.75rem', fontWeight: 600, fontSize: '0.875rem', textAlign: 'center', color: 'var(--text-primary)' }}>
              {day}
            </div>
          ))}

          {/* Time slots */}
          {hours.map(hour => (
            <div key={hour} style={{ display: 'contents' }}>
              <div style={{ background: 'var(--bg-card)', padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start' }}>
                {hour}
              </div>
              {days.map((day, dayIndex) => {
                const schedules = getScheduleForSlot(dayIndex, hour);
                return (
                  <div key={`${day}-${hour}`} style={{ background: 'var(--bg-card)', padding: '0.5rem', minHeight: '60px' }}>
                    {schedules.map(schedule => {
                      const colorIdx = getLectureColorIndex(schedule.lectureId);
                      const colors = lectureColors[colorIdx];
                      return (
                        <div key={schedule.id} style={{
                          background: colors.bg,
                          borderLeft: `3px solid ${colors.border}`,
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.5rem',
                          fontSize: '0.75rem',
                          marginBottom: '0.25rem',
                        }}>
                          <div style={{ fontWeight: 600, color: colors.text, marginBottom: '0.25rem' }}>
                            {schedule.lecture?.title}
                          </div>
                          <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <MapPin size={10} /> {schedule.lecture?.room?.name}
                          </div>
                          <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.125rem' }}>
                            <Clock size={10} /> {schedule.startTime} - {schedule.endTime}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
