import { useCallback, useEffect, useState } from 'react';
import { UserPlus, Search, Edit2, Trash2 } from 'lucide-react';
import { userService } from '../../services/userService';
import { PageHeader, RoleBadge, Modal, Avatar } from '../../components';
import type { Role, User } from '../../types';

const DEFAULT_PASSWORD = 'password';

export const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'All'>('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', role: 'Student' as Role, password: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await userService.getAll());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = users
    .filter((u) => roleFilter === 'All' || u.role === roleFilter)
    .filter((u) => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setEditUser(null);
    setForm({ firstName: '', lastName: '', email: '', role: 'Student', password: DEFAULT_PASSWORD });
    setModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditUser(user);
    setForm({ firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, password: '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (editUser) {
        await userService.update(editUser.id, {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          role: form.role,
        });
      } else {
        if (!form.password.trim()) {
          setError('Password is required for new users');
          setSaving(false);
          return;
        }
        await userService.create({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          role: form.role,
          password: form.password,
        });
      }
      setModalOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (user: User) => {
    setError(null);
    try {
      await userService.update(user.id, { isActive: !(user.isActive ?? true) });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Toggle failed');
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Delete ${user.firstName} ${user.lastName}? This cannot be undone.`)) return;
    setError(null);
    try {
      await userService.delete(user.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Manage students, lecturers, and administrators"
        action={
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <UserPlus size={16} /> Add User
          </button>
        }
      />

      {error && (
        <div className="badge badge-danger" style={{ display: 'block', marginBottom: '1rem', padding: '0.75rem' }}>
          {error}
        </div>
      )}

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
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {(['All', 'Student', 'Lecturer', 'Administrator'] as const).map((r) => (
              <button
                key={r}
                type="button"
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

        {loading ? (
          <p style={{ padding: '1.5rem', color: 'var(--text-secondary)' }}>Loading…</p>
        ) : (
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
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Avatar firstName={u.firstName} lastName={u.lastName} size={32} />
                        <span style={{ fontWeight: 500 }}>
                          {u.firstName} {u.lastName}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td>
                      <RoleBadge role={u.role} />
                    </td>
                    <td>
                      <span className={`badge ${u.isActive !== false ? 'badge-success' : 'badge-danger'}`}>
                        {u.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                          onClick={() => openEdit(u)}
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                          onClick={() => void toggleActive(u)}
                        >
                          {u.isActive !== false ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', color: 'var(--danger)' }}
                          onClick={() => void handleDelete(u)}
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => !saving && setModalOpen(false)} title={editUser ? 'Edit User' : 'Add User'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">First Name</label>
              <input
                className="form-input"
                value={form.firstName}
                onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Last Name</label>
              <input
                className="form-input"
                value={form.lastName}
                onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
              />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>
          {!editUser && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Initial password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Default: <code>{DEFAULT_PASSWORD}</code>. The user should change it after first login.
              </p>
            </div>
          )}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Role</label>
            <select
              className="form-input"
              value={form.role}
              onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as Role }))}
            >
              <option value="Student">Student</option>
              <option value="Lecturer">Lecturer</option>
              <option value="Administrator">Administrator</option>
            </select>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end',
              borderTop: '1px solid var(--border)',
              paddingTop: '1rem',
            }}
          >
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void handleSave()} disabled={saving}>
              {saving ? 'Saving…' : editUser ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
