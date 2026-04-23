import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../store/AuthContext';
import { Users, Server, AlertCircle, RefreshCw, BookOpen } from 'lucide-react';
import { PageHeader, StatCard, StatusBadge } from '../../components';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { userService } from '../../services/userService';
import { roomService } from '../../services/roomService';
import { lectureService } from '../../services/lectureService';
import { attendanceService } from '../../services/attendanceService';
import { iotNodeService } from '../../services/iotNodeService';
import type { AttendanceRecord, Lecture, Room, User } from '../../types';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);
  const [liveSignalByStudentId, setLiveSignalByStudentId] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [allUsers, allRooms, allLectures] = await Promise.all([
        userService.getAll(),
        roomService.getAll(),
        lectureService.getAll(),
      ]);
      setUsers(allUsers);
      setRooms(allRooms);
      setLectures(allLectures);

      const allRecords: AttendanceRecord[] = [];
      for (const lecture of allLectures) {
        try {
          const recs = await attendanceService.getByLecture(lecture.id);
          allRecords.push(...recs);
        } catch {
          // ignore single-lecture failures so dashboard still loads
        }
      }

      allRecords.sort((a, b) => {
        const ta = new Date(a.checkInTime ?? a.timestamp ?? 0).getTime();
        const tb = new Date(b.checkInTime ?? b.timestamp ?? 0).getTime();
        return tb - ta;
      });
      setRecentRecords(allRecords.slice(0, 8));

      // Live signal fallback (from latest station dump / router status).
      const nodeIds = Array.from(
        new Set(
          allRooms
            .map((r) => r.ioTNode?.id)
            .filter((id): id is string => Boolean(id))
        )
      );
      const statuses = await Promise.all(
        nodeIds.map((id) => iotNodeService.getRouterStatus(id).catch(() => null))
      );
      const signalMap: Record<string, number> = {};
      for (const status of statuses) {
        if (!status) continue;
        for (const client of status.clients) {
          if (!client.matchedStudentId) continue;
          const current = signalMap[client.matchedStudentId];
          if (current == null || client.signalStrengthDbm > current) {
            signalMap[client.matchedStudentId] = client.signalStrengthDbm;
          }
        }
      }
      setLiveSignalByStudentId(signalMap);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onlineRooms = rooms.filter((r) => r.ioTNode?.status === 'Online').length;
  const lectureById = (id?: string) => (id ? lectures.find((l) => l.id === id) : undefined);

  const monthlyAttendanceData = Array.from({ length: 6 }).map((_, idx) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - idx));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthRows = recentRecords.filter((r) => (r.date ?? '').startsWith(key));
    const attended = monthRows.filter((r) => r.status === 'Present' || r.status === 'Late').length;
    const rate = monthRows.length > 0 ? Math.round((attended * 100) / monthRows.length) : 0;
    return { month: d.toLocaleString('en-US', { month: 'short' }), rate };
  });

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" style={{ marginBottom: '2rem' }}>
        <StatCard title="Total Users" value={users.length} icon={<Users size={32} />} iconBg="#EEF2FF" iconColor="var(--primary)" />
        <StatCard title="Active IoT Nodes" value={`${onlineRooms}/${rooms.length}`} icon={<Server size={32} />} iconBg="#D1FAE5" iconColor="#065F46" />
        <StatCard title="Lectures" value={lectures.length} icon={<BookOpen size={32} />} iconBg="#FEF3C7" iconColor="#92400E" />
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
            {rooms.map((room) => (
              <div key={room.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{room.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{room.location}</div>
                </div>
                <span className={`badge ${room.ioTNode?.status === 'Online' ? 'badge-success' : 'badge-danger'}`}>
                  {room.ioTNode?.status === 'Online' ? 'Online' : 'Offline'}
                </span>
              </div>
            ))}
            {rooms.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No rooms created yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Attendance Records</h3>
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
              {recentRecords.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{r.student?.firstName} {r.student?.lastName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.student?.email}</div>
                  </td>
                  <td><span className="badge" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>Student</span></td>
                  <td>{r.lecture?.room?.name ?? lectureById(r.lectureId)?.room?.name ?? '—'}</td>
                  <td>
                    {(() => {
                      const historical = r.avgSignalStrengthDbm ?? r.signalStrengthDbm;
                      const live = liveSignalByStudentId[r.studentId];
                      const signal = (historical && historical !== 0) ? historical : live;
                      return signal == null || signal === 0 ? '—' : `${Math.round(signal)} dBm`;
                    })()}
                  </td>
                  <td><StatusBadge status={r.status} /></td>
                </tr>
              ))}
              {recentRecords.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ color: 'var(--text-muted)', padding: '1rem' }}>
                    No attendance records yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
