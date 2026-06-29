import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

const steps = [
  { title: 'Who are you?', subtitle: 'Help us personalize your experience' },
  { title: 'What are your goals?', subtitle: 'Select all that apply' },
  { title: 'Your schedule', subtitle: 'Tell us about your typical day' },
  { title: 'Connect calendars', subtitle: 'Sync your existing calendars' },
];

const roles = [
  { emoji: '🎓', name: 'Student' },
  { emoji: '💼', name: 'Professional' },
  { emoji: '🚀', name: 'Entrepreneur' },
];

const goals = [
  '🏋️ Fitness', '📚 Learning', '💼 Career', '📝 Exams',
  '🧘 Wellness', '💰 Finance', '🎨 Creative', '🌍 Travel',
  '🤝 Social', '💡 Side Projects',
];

const calendars = [
  { icon: '📅', name: 'Google Calendar', desc: 'Connect your Google account' },
  { icon: '📧', name: 'Outlook', desc: 'Connect Microsoft Outlook' },
  { icon: '🍎', name: 'Apple Calendar', desc: 'Sync iCloud calendar' },
];

export default function SignupPage() {
  const [step, setStep] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const stepParam = params.get('step');
    return stepParam ? parseInt(stepParam, 10) : 0;
  });
  const [role, setRole] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const { signup, loginWithGoogle } = useAuth();

  useEffect(() => {
    if (step === 0 && window.google) {
      window.google.accounts.id.initialize({
        client_id: "173999487458-i11ov984fr2anm4fedlsgot4688ri3q5.apps.googleusercontent.com",
        callback: async (response: any) => {
          try {
            setErrorMsg('');
            const { user } = await loginWithGoogle(response.credential);
            setName(user.displayName);
            setEmail(user.email);
            setStep(1);
          } catch (err: any) {
            setErrorMsg(err.message || 'Google Sign-Up failed.');
          }
        }
      });

      setTimeout(() => {
        const btnElem = document.getElementById("google-signup-button");
        if (btnElem && window.google) {
          window.google.accounts.id.renderButton(
            btnElem,
            { theme: "dark", size: "large", width: 400 }
          );
        }
      }, 50);
    }
  }, [step, loginWithGoogle]);

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMsg('');
      await signup(name, email);
      setStep(1);
    } catch (error: any) {
      setErrorMsg(error.message || 'Signup failed.');
    }
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev =>
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const toggleCalendar = (cal: string) => {
    setSelectedCalendars(prev =>
      prev.includes(cal) ? prev.filter(c => c !== cal) : [...prev, cal]
    );
  };

  const handleComplete = () => {
    navigate('/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="auth-aurora">
        <div className="aurora-blob aurora-1"></div>
        <div className="aurora-blob aurora-2"></div>
      </div>
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

      <div className="auth-card glass-card-static" style={{ maxWidth: 520, width: '100%', position: 'relative', zIndex: 2 }}>
        <div className="auth-card-header">
          <Link to="/" className="auth-logo">
            <div className="logo-orb" style={{ width: 28, height: 28 }}></div>
            <span className="logo-text">Nova<span className="gradient-text">Life</span></span>
          </Link>

          {step === 0 ? (
            <>
              <h3>Create your account</h3>
              <p>Start your journey with NovaLife</p>
            </>
          ) : (
            <>
              <h3>{steps[step - 1]?.title}</h3>
              <p>{steps[step - 1]?.subtitle}</p>
            </>
          )}
        </div>

        {/* Step 0: Create Account */}
        {step === 0 && (
          <div className="step-content-wrapper">
            {errorMsg && (
              <div className="auth-error-message" style={{ color: '#ff6b6b', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center', fontWeight: 500 }}>
                {errorMsg}
              </div>
            )}
            <form onSubmit={handleAccountSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input id="name" type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="signup-email">Email</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 7l-10 7L2 7" />
                  </svg>
                  <input id="signup-email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="signup-password">Password</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input id="signup-password" type="password" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </div>
              <button type="submit" className="btn-primary auth-submit">Continue</button>
            </form>

            <div className="auth-divider">
              <span>or continue with</span>
            </div>

            <div className="oauth-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', width: '100%', maxWidth: '400px', margin: '0 auto' }}>
              <div className="google-btn-wrapper">
                <div 
                  id="google-signup-button" 
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
            </div>
            <p className="auth-footer-text">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
        )}

        {/* Step 1: Role Selection */}
        {step === 1 && (
          <div className="step-content-wrapper" key="step1">
            <div className="signup-progress">
              <div className="progress-step active">1</div>
              <div className={`progress-connector ${step > 1 ? 'active' : ''}`}></div>
              <div className={`progress-step ${step > 1 ? 'active' : ''}`}>2</div>
              <div className={`progress-connector ${step > 2 ? 'active' : ''}`}></div>
              <div className={`progress-step ${step > 2 ? 'active' : ''}`}>3</div>
              <div className={`progress-connector ${step > 3 ? 'active' : ''}`}></div>
              <div className={`progress-step ${step > 3 ? 'active' : ''}`}>4</div>
            </div>

            <div className="ai-onboard-message">
              <div className="ai-onboard-avatar"></div>
              <div className="ai-onboard-text">
                Hi {name || 'there'}! 👋 Let's design your ideal life. First, tell me about yourself.
              </div>
            </div>

            <div className="role-grid">
              {roles.map((r) => (
                <div
                  key={r.name}
                  className={`role-card ${role === r.name ? 'selected' : ''}`}
                  onClick={() => setRole(r.name)}
                >
                  <span className="role-emoji">{r.emoji}</span>
                  <span className="role-name">{r.name}</span>
                </div>
              ))}
            </div>

            <div className="step-buttons">
              <button className="btn-secondary" onClick={() => setStep(0)}>Back</button>
              <button className="btn-primary" onClick={() => setStep(2)} disabled={!role}>Continue</button>
            </div>
          </div>
        )}

        {/* Step 2: Goals */}
        {step === 2 && (
          <div className="step-content-wrapper" key="step2">
            <div className="signup-progress">
              <div className="progress-step completed">✓</div>
              <div className="progress-connector active"></div>
              <div className="progress-step active">2</div>
              <div className="progress-connector"></div>
              <div className="progress-step">3</div>
              <div className="progress-connector"></div>
              <div className="progress-step">4</div>
            </div>

            <div className="ai-onboard-message">
              <div className="ai-onboard-avatar"></div>
              <div className="ai-onboard-text">
                Great choice! Now, what areas of life do you want to level up?
              </div>
            </div>

            <div className="goal-tags">
              {goals.map((g) => (
                <button
                  key={g}
                  className={`goal-tag ${selectedGoals.includes(g) ? 'selected' : ''}`}
                  onClick={() => toggleGoal(g)}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="step-buttons">
              <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
              <button className="btn-primary" onClick={() => setStep(3)}>Continue</button>
            </div>
          </div>
        )}

        {/* Step 3: Schedule */}
        {step === 3 && (
          <div className="step-content-wrapper" key="step3">
            <div className="signup-progress">
              <div className="progress-step completed">✓</div>
              <div className="progress-connector active"></div>
              <div className="progress-step completed">✓</div>
              <div className="progress-connector active"></div>
              <div className="progress-step active">3</div>
              <div className="progress-connector"></div>
              <div className="progress-step">4</div>
            </div>

            <div className="ai-onboard-message">
              <div className="ai-onboard-avatar"></div>
              <div className="ai-onboard-text">
                Let me understand your rhythm. When do you work best?
              </div>
            </div>

            <div className="schedule-grid">
              <div className="schedule-field">
                <label>Wake up time</label>
                <input type="time" defaultValue="07:00" />
              </div>
              <div className="schedule-field">
                <label>Sleep time</label>
                <input type="time" defaultValue="23:00" />
              </div>
              <div className="schedule-field">
                <label>Work hours start</label>
                <input type="time" defaultValue="09:00" />
              </div>
              <div className="schedule-field">
                <label>Work hours end</label>
                <input type="time" defaultValue="17:00" />
              </div>
            </div>

            <div className="step-buttons">
              <button className="btn-secondary" onClick={() => setStep(2)}>Back</button>
              <button className="btn-primary" onClick={() => setStep(4)}>Continue</button>
            </div>
          </div>
        )}

        {/* Step 4: Calendar Integration */}
        {step === 4 && (
          <div className="step-content-wrapper" key="step4">
            <div className="signup-progress">
              <div className="progress-step completed">✓</div>
              <div className="progress-connector active"></div>
              <div className="progress-step completed">✓</div>
              <div className="progress-connector active"></div>
              <div className="progress-step completed">✓</div>
              <div className="progress-connector active"></div>
              <div className="progress-step active">4</div>
            </div>

            <div className="ai-onboard-message">
              <div className="ai-onboard-avatar"></div>
              <div className="ai-onboard-text">
                Almost there! Connect your calendars so I can sync your schedule seamlessly.
              </div>
            </div>

            <div className="calendar-grid">
              {calendars.map((c) => (
                <div
                  key={c.name}
                  className={`calendar-option ${selectedCalendars.includes(c.name) ? 'selected' : ''}`}
                  onClick={() => toggleCalendar(c.name)}
                >
                  <span className="cal-icon">{c.icon}</span>
                  <div>
                    <div className="cal-name">{c.name}</div>
                    <div className="cal-desc">{c.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="step-buttons">
              <button className="btn-secondary" onClick={() => setStep(3)}>Back</button>
              <button className="btn-primary" onClick={handleComplete}>
                Launch NovaLife 🚀
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
