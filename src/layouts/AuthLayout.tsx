import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { getRoleDashboardPath } from '../routes';

export const AuthLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-container justify-center items-center">
        <div className="card">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={getRoleDashboardPath(user.role)} replace />;
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">IoT Attendance</h1>
          <p className="auth-subtitle">Smart attendance tracking system</p>
        </div>
        <div className="card">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
