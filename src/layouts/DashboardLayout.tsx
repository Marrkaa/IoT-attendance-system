import { useState } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { LogOut, Menu } from 'lucide-react';
import { getNavItems } from '../routes';
import type { Role } from '../types';

export const DashboardLayout = ({ allowedRoles }: { allowedRoles: Role[] }) => {
  const { user, logout, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  if (loading) {
    return <div className="app-container justify-center items-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  const navItems = getNavItems(user.role);

  return (
    <div className="app-container">
      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="sidebar-header">
          <span style={{ display: sidebarOpen ? 'block' : 'none' }}>IoT Attendance</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-wrapper">
        <header className="topbar">
          <div className="flex items-center" style={{ gap: '1rem' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="btn btn-outline"
              style={{ padding: '0.5rem', border: 'none' }}
            >
              <Menu size={20} />
            </button>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{user.role} Portal</h2>
          </div>
          <div className="flex items-center" style={{ gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600 }}>{user.firstName} {user.lastName}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.role}</div>
            </div>
            <button onClick={logout} className="btn btn-outline" style={{ padding: '0.5rem' }} title="Logout">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <div className="main-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
