import { useState } from 'react';
import { UserPlus, Search, Edit2 } from 'lucide-react';
import { mockUsers } from '../../mock-data/data';
import { PageHeader, RoleBadge, Modal, Avatar } from '../../components';
import type { Role, User } from '../../types';

export const UsersPage = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'All'>('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', role: 'Student' as Role });

  const filtered = mockUsers
    .filter(u => roleFilter === 'All' || u.role === roleFilter)
    .filter(u => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setEditUser(null);
    setForm({ firstName: '', lastName: '', email: '', role: 'Student' });
    setModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditUser(user);
    setForm({ firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role });
    setModalOpen(true);
  };

  const handleSave = () => {
    // In real app: call userService.create or userService.update
    setModalOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Manage students, lecturers, and administrators"
        action={<button className="btn btn-primary" onClick={openCreate}><UserPlus size={16} /> Add User</button>}
      />

      <div className="card">
        <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <div style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }}>
                <Search size={16} />
              </div>
              <input
                type="text"
                className="form-input"
                placeholder="Search users..."
                style={{ paddingLeft: '2.25rem' }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {(['All', 'Student', 'Lecturer', 'Administrator'] as const).map(r => (
              <button
                key={r}
                className={`btn ${roleFilter === r ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                onClick={() => setRoleFilter(r)}
              >
                {r}
              </button>
            ))}
          </div>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{filtered.length} users</span>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Avatar firstName={u.firstName} lastName={u.lastName} size={32} />
                      <span style={{ fontWeight: 500 }}>{u.firstName} {u.lastName}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td><RoleBadge role={u.role} /></td>
                  <td>
                    <span className={`badge ${u.isActive !== false ? 'badge-success' : 'badge-danger'}`}>
                      {u.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }} onClick={() => openEdit(u)}>
                      <Edit2 size={12} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editUser ? 'Edit User' : 'Add User'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">First Name</label>
              <input className="form-input" value={form.firstName} onChange={e => setForm(prev => ({ ...prev, firstName: e.target.value }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Last Name</label>
              <input className="form-input" value={form.lastName} onChange={e => setForm(prev => ({ ...prev, lastName: e.target.value }))} />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Role</label>
            <select className="form-input" value={form.role} onChange={e => setForm(prev => ({ ...prev, role: e.target.value as Role }))}>
              <option value="Student">Student</option>
              <option value="Lecturer">Lecturer</option>
              <option value="Administrator">Administrator</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>{editUser ? 'Save Changes' : 'Create User'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
