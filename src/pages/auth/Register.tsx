import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, UserPlus } from 'lucide-react';
import type { Role } from '../../types';

export const Register = () => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Student' as Role,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    // Simulate registration
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '1rem 0' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#D1FAE5', color: '#065F46', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <UserPlus size={24} />
        </div>
        <h2 className="card-title" style={{ marginBottom: '0.5rem' }}>Registration Successful</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          Your account has been created. Please wait for administrator approval.
        </p>
        <Link to="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="card-title" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Create Account</h2>

      {error && (
        <div className="badge badge-danger" style={{ display: 'block', textAlign: 'center', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="firstName">First name</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }}>
                <User size={18} />
              </div>
              <input id="firstName" name="firstName" type="text" className="form-input" style={{ paddingLeft: '2.5rem' }} value={form.firstName} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="lastName">Last name</label>
            <input id="lastName" name="lastName" type="text" className="form-input" value={form.lastName} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="regEmail">Email address</label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }}>
              <Mail size={18} />
            </div>
            <input id="regEmail" name="email" type="email" className="form-input" style={{ paddingLeft: '2.5rem' }} value={form.email} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="role">Role</label>
          <select id="role" name="role" className="form-input" value={form.role} onChange={handleChange}>
            <option value="Student">Student</option>
            <option value="Lecturer">Lecturer</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="regPassword">Password</label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }}>
              <Lock size={18} />
            </div>
            <input id="regPassword" name="password" type="password" className="form-input" style={{ paddingLeft: '2.5rem' }} value={form.password} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label className="form-label" htmlFor="confirmPassword">Confirm password</label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }}>
              <Lock size={18} />
            </div>
            <input id="confirmPassword" name="confirmPassword" type="password" className="form-input" style={{ paddingLeft: '2.5rem' }} value={form.confirmPassword} onChange={handleChange} required />
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ height: '42px' }}>
          {loading ? 'Creating account...' : (
            <>
              <UserPlus size={18} />
              Create Account
            </>
          )}
        </button>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/" style={{ color: 'var(--primary)', fontWeight: 500 }}>Sign in</Link>
        </div>
      </form>
    </div>
  );
};
