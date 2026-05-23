import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { authService } from '../../services/authService';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const token = await authService.forgotPassword(email);
      setResetLink(`${window.location.origin}/reset-password/${token}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  if (resetLink) {
    return (
      <div style={{ padding: '1rem 0' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#DBEAFE', color: '#1E40AF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <Send size={24} />
        </div>
        <h2 className="card-title" style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Reset Link Generated</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>
          Copy the link below and open it in your browser:
        </p>
        <div style={{ background: '#F1F5F9', borderRadius: 'var(--radius-md)', padding: '0.75rem', fontSize: '0.75rem', wordBreak: 'break-all', marginBottom: '1rem', color: 'var(--primary)' }}>
          <a href={resetLink}>{resetLink}</a>
        </div>
        <Link to="/" className="btn btn-primary btn-block" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center' }}>
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="card-title" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Reset Password</h2>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Enter your email and we'll send you a reset link.
      </p>

      {error && (
        <div className="badge badge-danger" style={{ display: 'block', textAlign: 'center', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label className="form-label" htmlFor="resetEmail">Email address</label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }}>
              <Mail size={18} />
            </div>
            <input
              id="resetEmail"
              type="email"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="your@email.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ height: '42px' }}>
          {loading ? 'Sending...' : (
            <>
              <Send size={18} />
              Send Reset Link
            </>
          )}
        </button>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link to="/" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <ArrowLeft size={14} /> Back to Login
          </Link>
        </div>
      </form>
    </div>
  );
};
