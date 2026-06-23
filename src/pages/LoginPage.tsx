import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

declare global {
  interface Window {
    google: any;
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const { login, loginWithGoogle, loginWithGitHub } = useAuth();

  useEffect(() => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: "173999487458-i11ov984fr2anm4fedlsgot4688ri3q5.apps.googleusercontent.com",
        callback: async (response: any) => {
          try {
            setErrorMsg('');
            await loginWithGoogle(response.credential);
            navigate('/dashboard');
          } catch (err: any) {
            setErrorMsg(err.message || 'Google Sign-In failed.');
          }
        }
      });

      window.google.accounts.id.renderButton(
        document.getElementById("google-login-button"),
        { theme: "dark", size: "large", width: 360 }
      );
    }
  }, [loginWithGoogle, navigate]);

  const handleGitHubSignIn = async () => {
    try {
      await loginWithGitHub();
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error during GitHub sign-in:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMsg('');
      await login(email);
      navigate('/dashboard');
    } catch (error: any) {
      setErrorMsg(error.message || 'Login failed.');
    }
  };

  return (
    <div className="auth-page">
      {/* Background Effects */}
      <div className="auth-aurora">
        <div className="aurora-blob aurora-1"></div>
        <div className="aurora-blob aurora-2"></div>
      </div>

      {/* Stars */}
      <div className="auth-stars">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="star" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${6 + Math.random() * 6}s`,
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
          }} />
        ))}
      </div>

      <div className="auth-container">
        {/* Left Side — Animated Illustration */}
        <div className="auth-illustration">
          <div className="auth-orb-container">
            <div className="auth-orb">
              <div className="auth-orb-inner"></div>
            </div>
            <div className="auth-orb-glow"></div>
          </div>
          <h2 className="auth-hero-text">
            Welcome back to <span className="gradient-text-aurora">NovaLife</span>
          </h2>
          <p className="auth-hero-sub">Your AI Life Manager awaits. Let's get productive.</p>
          
          <div className="auth-feature-pills">
            <span className="auth-pill">🧠 AI Planning</span>
            <span className="auth-pill">📅 Calendar Sync</span>
            <span className="auth-pill">🎯 Goal Tracking</span>
          </div>
        </div>

        {/* Right Side — Login Card */}
        <div className="auth-card glass-card-static">
          <div className="auth-card-header">
            <Link to="/" className="auth-logo">
              <div className="logo-orb" style={{ width: 28, height: 28 }}></div>
              <span className="logo-text">Nova<span className="gradient-text">Life</span></span>
            </Link>
            <h3>Sign in to your account</h3>
            <p>Enter your credentials to continue</p>
          </div>

          {errorMsg && (
            <div className="auth-error-message" style={{ color: '#ff6b6b', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center', fontWeight: 500 }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 7l-10 7L2 7" />
                </svg>
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="label-row">
                <label htmlFor="password">Password</label>
                <a href="#" className="forgot-link">Forgot password?</a>
              </div>
              <div className="input-wrapper">
                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="remember-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span className="checkmark"></span>
                Remember me
              </label>
            </div>

            <button type="submit" className="btn-primary auth-submit">
              Sign In
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </form>

          <div className="auth-divider">
            <span>or continue with</span>
          </div>

          <div className="oauth-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', width: '100%', maxWidth: '360px', margin: '0 auto' }}>
            <div className="google-btn-wrapper">
              <div 
                id="google-login-button" 
                style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '100%', 
                  opacity: 0, 
                  zIndex: 10,
                  cursor: 'pointer',
                  overflow: 'hidden'
                }}
              ></div>
              <button 
                type="button" 
                className="oauth-btn" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  justifyContent: 'center', 
                  margin: 0
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google
              </button>
            </div>
            <button type="button" className="oauth-btn" onClick={handleGitHubSignIn} style={{ width: '100%', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--text-primary)"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
              GitHub
            </button>
          </div>

          <p className="auth-footer-text">
            Don't have an account? <Link to="/signup">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
