import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate password reset request
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    setSent(true);
  };

  if (sent) {
    return (
      <div style={{ textAlign: 'center', padding: '1rem 0' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#DBEAFE', color: '#1E40AF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <Send size={24} />
        </div>
        <h2 className="card-title" style={{ marginBottom: '0.5rem' }}>Check Your Email</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          We've sent a password reset link to <strong>{email}</strong>. Please check your inbox.
        </p>
        <Link to="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>
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
