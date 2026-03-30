import { useAuth } from '../../store/AuthContext';
import { Users, Server, AlertCircle, RefreshCw, BookOpen } from 'lucide-react';
import { mockLectures, mockRooms, mockUsers, mockAttendance } from '../../mock-data/data';
import { PageHeader, StatCard } from '../../components';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { monthlyAttendanceData } from '../../mock-data/data';

export const AdminDashboard = () => {
  const { user } = useAuth();

  const onlineRooms = mockRooms.filter(r => r.isOnline).length;

  return (
    <div>
      <PageHeader
        title="System Overview"
        subtitle={`Welcome back, ${user?.firstName}!`}
        action={<button className="btn btn-outline"><RefreshCw size={16} /> Update Status</button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" style={{ marginBottom: '2rem' }}>
        <StatCard title="Total Users" value={mockUsers.length} icon={<Users size={32} />} iconBg="#EEF2FF" iconColor="var(--primary)" />
        <StatCard title="Active IoT Nodes" value={`${onlineRooms}/${mockRooms.length}`} icon={<Server size={32} />} iconBg="#D1FAE5" iconColor="#065F46" />
        <StatCard title="Lectures" value={mockLectures.length} icon={<BookOpen size={32} />} iconBg="#FEF3C7" iconColor="#92400E" />
        <StatCard title="System Alerts" value={0} icon={<AlertCircle size={32} />} iconBg="#FEE2E2" iconColor="#991B1B" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Monthly trend chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Monthly Attendance Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyAttendanceData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar dataKey="rate" name="Attendance %" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Room status */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Room Status</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {mockRooms.map(room => (
              <div key={room.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{room.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{room.location}</div>
                </div>
                <span className={`badge ${room.isOnline ? 'badge-success' : 'badge-danger'}`}>
                  {room.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Connections</h3>
          <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>View All</button>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Location</th>
                <th>Signal</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {mockAttendance.filter(a => a.signalStrength && a.signalStrength < 0).slice(0, 5).map((a) => (
                <tr key={a.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{a.student?.firstName} {a.student?.lastName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.student?.email}</div>
                  </td>
                  <td><span className="badge" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>Student</span></td>
                  <td>{a.lecture?.room?.name}</td>
                  <td><span style={{ color: a.signalStrength! > -60 ? 'var(--success)' : 'var(--warning)' }}>{a.signalStrength}dBm</span></td>
                  <td><span className={`badge ${a.status === 'Present' ? 'badge-success' : a.status === 'Late' ? 'badge-warning' : 'badge-danger'}`}>{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
