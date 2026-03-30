import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { authService } from '../../services/authService';
import { Mail, Lock, LogIn } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('admin@school.edu');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await authService.login(email, password);
      login(user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="card-title" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Welcome Back</h2>

      {error && (
        <div className="badge badge-danger" style={{ display: 'block', textAlign: 'center', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="email">Email address</label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }}>
              <Mail size={18} />
            </div>
            <input
              id="email"
              type="email"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '0.5rem' }}>
          <label className="form-label" htmlFor="password">Password</label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }}>
              <Lock size={18} />
            </div>
            <input
              id="password"
              type="password"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
          <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 500 }}>
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={loading}
          style={{ height: '42px' }}
        >
          {loading ? 'Signing in...' : (
            <>
              <LogIn size={18} />
              Sign in
            </>
          )}
        </button>

        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 500 }}>Register</Link>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <p>Demo accounts (password: <strong>password</strong>):</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem', fontSize: '0.75rem' }}>
            <code>admin@school.edu</code>
            <code>lecturer@school.edu</code>
            <code>student1@school.edu</code>
          </div>
        </div>
      </form>
    </div>
  );
};
