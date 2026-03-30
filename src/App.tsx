import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './store/AuthContext';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';

// Admin Pages
import { AdminDashboard } from './pages/admin/Dashboard';
import { UsersPage } from './pages/admin/Users';
import { RoomsPage } from './pages/admin/Rooms';
import { LecturesPage } from './pages/admin/Lectures';
import { SchedulesPage } from './pages/admin/Schedules';

// Lecturer Pages
import { LecturerDashboard } from './pages/lecturer/Dashboard';
import { LiveAttendancePage } from './pages/lecturer/LiveAttendance';
import { StatsPage } from './pages/lecturer/Stats';
import { ReportsPage } from './pages/lecturer/Reports';

// Student Pages
import { StudentDashboard } from './pages/student/Dashboard';
import { StudentLecturesPage } from './pages/student/Lectures';
import { HistoryPage } from './pages/student/History';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<DashboardLayout allowedRoles={['Administrator']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/rooms" element={<RoomsPage />} />
            <Route path="/admin/lectures" element={<LecturesPage />} />
            <Route path="/admin/schedules" element={<SchedulesPage />} />
          </Route>

          {/* Lecturer Routes */}
          <Route element={<DashboardLayout allowedRoles={['Lecturer']} />}>
            <Route path="/lecturer/dashboard" element={<LecturerDashboard />} />
            <Route path="/lecturer/attendance" element={<LiveAttendancePage />} />
            <Route path="/lecturer/stats" element={<StatsPage />} />
            <Route path="/lecturer/reports" element={<ReportsPage />} />
          </Route>

          {/* Student Routes */}
          <Route element={<DashboardLayout allowedRoles={['Student']} />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/lectures" element={<StudentLecturesPage />} />
            <Route path="/student/history" element={<HistoryPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
