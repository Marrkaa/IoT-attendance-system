import { Download, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PageHeader, StatCard } from '../../components';
import { mockLectures, weeklyAttendanceData } from '../../mock-data/data';

const COLORS = { present: '#10B981', late: '#F59E0B', absent: '#EF4444' };

const pieData = [
  { name: 'Present', value: 78, color: COLORS.present },
  { name: 'Late', value: 12, color: COLORS.late },
  { name: 'Absent', value: 10, color: COLORS.absent },
];

export const StatsPage = () => {
  return (
    <div>
      <PageHeader
        title="Attendance Statistics"
        subtitle="Analytics and reporting"
        action={<button className="btn btn-primary"><Download size={16} /> Generate Report</button>}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" style={{ marginBottom: '2rem' }}>
        <StatCard
          title="Avg. Attendance"
          value="87%"
          subtitle="+3% this week"
          icon={<TrendingUp size={32} />}
          iconBg="#D1FAE5"
          iconColor="#065F46"
        />
        <StatCard title="Total Sessions" value={48} subtitle="This semester" />
        <StatCard title="At-Risk Students" value={3} subtitle="Below 75% threshold" iconBg="#FEE2E2" iconColor="#991B1B" />
        <StatCard title="Active Courses" value={mockLectures.length} subtitle="Being tracked" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Weekly Bar Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Weekly Attendance Overview</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weeklyAttendanceData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="present" name="Present" fill={COLORS.present} radius={[4, 4, 0, 0]} />
              <Bar dataKey="late" name="Late" fill={COLORS.late} radius={[4, 4, 0, 0]} />
              <Bar dataKey="absent" name="Absent" fill={COLORS.absent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Overall Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-course breakdown */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Per-Course Breakdown</h3>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Sessions</th>
                <th>Avg. Present</th>
                <th>Avg. Late</th>
                <th>Avg. Absent</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              {mockLectures.map(l => {
                const rate = 80 + Math.floor(Math.random() * 15);
                return (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 500 }}>{l.title}</td>
                    <td>24</td>
                    <td><span className="badge badge-success">{(rate * 0.24).toFixed(1)}</span></td>
                    <td><span className="badge badge-warning">{((100 - rate) * 0.12).toFixed(1)}</span></td>
                    <td><span className="badge badge-danger">{((100 - rate) * 0.12).toFixed(1)}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${rate}%`, background: 'var(--success)', borderRadius: '3px' }}></div>
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{rate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
