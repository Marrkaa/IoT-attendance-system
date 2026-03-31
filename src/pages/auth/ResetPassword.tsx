import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Lock, CheckCircle } from 'lucide-react';

export const ResetPassword = () => {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    setSuccess(true);
  };

  if (!token) {
    return (
      <div style={{ textAlign: 'center', padding: '1rem 0' }}>
        <h2 className="card-title" style={{ marginBottom: '0.5rem' }}>Invalid Link</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          This password reset link is invalid or has expired.
        </p>
        <Link to="/forgot-password" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          Request New Link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '1rem 0' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#D1FAE5', color: '#065F46', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <CheckCircle size={24} />
        </div>
        <h2 className="card-title" style={{ marginBottom: '0.5rem' }}>Password Reset Successful</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          Your password has been changed. You can now sign in with your new password.
        </p>
        <Link to="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="card-title" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Set New Password</h2>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Enter your new password below.
      </p>

      {error && (
        <div className="badge badge-danger" style={{ display: 'block', textAlign: 'center', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="newPassword">New Password</label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }}>
              <Lock size={18} />
            </div>
            <input
              id="newPassword"
              type="password"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label className="form-label" htmlFor="confirmNewPassword">Confirm Password</label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }}>
              <Lock size={18} />
            </div>
            <input
              id="confirmNewPassword"
              type="password"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ height: '42px' }}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Remember your password? <Link to="/" style={{ color: 'var(--primary)', fontWeight: 500 }}>Sign in</Link>
        </div>
      </form>
    </div>
  );
};
