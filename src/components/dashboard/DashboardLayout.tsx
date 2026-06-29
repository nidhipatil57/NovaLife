import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import VoiceAssistant from './VoiceAssistant';
import './DashboardLayout.css';

const navItems = [
  { icon: '🏠', label: 'Dashboard', path: '/dashboard' },
  { icon: '✅', label: 'Tasks', path: '/tasks' },
  { icon: '📅', label: 'Calendar', path: '/calendar' },
  { icon: '🎯', label: 'Goals', path: '/goals' },
  { icon: '🔄', label: 'Habits', path: '/habits' },
  { icon: '💰', label: 'Finance', path: '/finance' },
  { icon: '🎧', label: 'Focus', path: '/focus' },
  { icon: '📊', label: 'Analytics', path: '/analytics' },
  { divider: true },
  { icon: '🤖', label: 'AI Assistant', path: '/ai-assistant' },
  { icon: '🧠', label: 'Brain Dump', path: '/brain-dump' },
  { icon: '🚨', label: 'Rescue Mode', path: '/rescue' },
  { divider: true },
  { icon: '⚙️', label: 'Settings', path: '/settings' },
];



function HeaderClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const dayName = time.toLocaleDateString(undefined, { weekday: 'long' });
  const dateStr = time.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = time.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  return (
    <div className="dash-header-clock">
      <span className="clock-icon">🕒</span>
      <span className="clock-day">{dayName}</span>
      <span className="clock-separator">,</span>
      <span className="clock-date">{dateStr}</span>
      <span className="clock-separator">•</span>
      <span className="clock-time">{timeStr}</span>
    </div>
  );
}

export default function DashboardLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const mainRef = useRef<HTMLDivElement>(null);
  const scrollPositionsRef = useRef<Record<string, number>>({});
  const isRestoringRef = useRef<boolean>(false);

  // 1. Listen for scroll events to record position in real-time
  useEffect(() => {
    const mainElement = mainRef.current;
    if (!mainElement) return;

    const handleScroll = () => {
      const currentScroll = mainElement.scrollTop;
      // Do not record 0 scroll position if we are currently restoring scroll
      if (currentScroll > 0 || (!isRestoringRef.current && currentScroll === 0)) {
        scrollPositionsRef.current[location.pathname] = currentScroll;
      }
    };

    mainElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      mainElement.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname]);

  // 2. Restore scroll position for the current route robustly
  useEffect(() => {
    const mainElement = mainRef.current;
    if (!mainElement) return;

    const targetScrollTop = scrollPositionsRef.current[location.pathname] || 0;
    isRestoringRef.current = true;

    let attempts = 0;
    const maxAttempts = 90; // Up to 1.5 seconds at 60fps
    let rafId: number;

    const attemptRestore = () => {
      if (!mainElement) return;
      mainElement.scrollTop = targetScrollTop;

      const currentScroll = mainElement.scrollTop;
      const maxScroll = mainElement.scrollHeight - mainElement.clientHeight;

      // Stop trying if we are close to the target, or reached the bottom limits of the current container height, or exceeded max attempts
      if (
        Math.abs(currentScroll - targetScrollTop) < 2 ||
        (targetScrollTop > maxScroll && Math.abs(currentScroll - maxScroll) < 2) ||
        attempts >= maxAttempts
      ) {
        isRestoringRef.current = false;
      } else {
        attempts++;
        rafId = requestAnimationFrame(attemptRestore);
      }
    };

    // Observe element resize to re-apply scroll when dynamic asynchronous components finish loading
    const resizeObserver = new ResizeObserver(() => {
      if (mainElement) {
        mainElement.scrollTop = targetScrollTop;
      }
    });

    resizeObserver.observe(mainElement);
    rafId = requestAnimationFrame(attemptRestore);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const userInitials = displayName.charAt(0).toUpperCase();

  return (
    <div className={`dashboard-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className={`dash-sidebar glass-card-static ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-top">
          <div className="sidebar-logo">
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
              <div className="logo-orb" style={{ width: 24, height: 24 }}></div>
              {!collapsed && <span className="logo-text" style={{ fontSize: '1rem' }}>Nova<span className="gradient-text">Life</span></span>}
            </Link>
          </div>
          <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
            {collapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, i) => {
            if ('divider' in item && item.divider) {
              return <div key={i} className="sidebar-divider" />;
            }
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={i}
                to={item.path!}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <span className="sidebar-icon">{item.icon}</span>
                {!collapsed && <span className="sidebar-label">{item.label}</span>}
                {isActive && <div className="sidebar-active-indicator" />}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          {!collapsed ? (
            <div className="sidebar-user" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Link to="/settings" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', cursor: 'pointer', color: 'inherit' }}>
                <div className="user-avatar-small">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Profile" />
                  ) : (
                    userInitials
                  )}
                </div>
                <div>
                  <div className="user-name" style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
                </div>
              </Link>
              <button 
                onClick={handleLogout} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', fontSize: '1.1rem', transition: 'transform 0.2s' }} 
                title="Log Out"
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                  <path d="M9 4H4v16h5" />
                  <path d="M20 12H9" />
                  <path d="M13 8l-4 4 4 4" />
                </svg>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', width: '100%' }}>
              <Link to="/settings" className="user-avatar-small" style={{ margin: '0 auto', textDecoration: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Profile" />
                ) : (
                  userInitials
                )}
              </Link>
              <button 
                onClick={handleLogout} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', fontSize: '1rem', color: 'var(--text-secondary)', transition: 'transform 0.2s' }} 
                title="Log Out"
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                  <path d="M9 4H4v16h5" />
                  <path d="M20 12H9" />
                  <path d="M13 8l-4 4 4 4" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="dash-main" ref={mainRef}>
        <div className="dash-top-bar">
          <HeaderClock />
        </div>
        <Outlet />
      </main>
      <VoiceAssistant />
    </div>
  );
}
