import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CustomSelect } from '../components/ui/CustomSelect';
import './SettingsPage.css';

const timezoneOptions = [
  { label: 'Asia/Kolkata (IST)', value: 'Asia/Kolkata (IST)', icon: '🌐' },
  { label: 'UTC (GMT)', value: 'UTC (GMT)', icon: '🌐' },
  { label: 'America/New_York (EST)', value: 'America/New_York (EST)', icon: '🌐' },
  { label: 'Europe/London (BST)', value: 'Europe/London (BST)', icon: '🌐' },
  { label: 'Asia/Tokyo (JST)', value: 'Asia/Tokyo (JST)', icon: '🌐' },
];

const themes = [
  { name: 'Dark', color: '#070B14', accent: '#3B82F6' },
  { name: 'Midnight', color: '#0a0e1a', accent: '#8B5CF6' },
  { name: 'Cyberpunk', color: '#120018', accent: '#EC4899' },
  { name: 'Aurora', color: '#050a15', accent: '#06B6D4' },
];

const aiPersonalities = [
  { name: 'Professional', emoji: '💼', desc: 'Clean and focused advice' },
  { name: 'Motivational', emoji: '🔥', desc: 'High energy encouragement' },
  { name: 'Friendly', emoji: '😊', desc: 'Warm and supportive' },
  { name: 'Strict', emoji: '⚡', desc: '"Stop procrastinating. Start now."' },
];

export default function SettingsPage() {
  const [activeTheme, setActiveTheme] = useState('Dark');
  const [aiMode, setAiMode] = useState('Motivational');
  const [notifications, setNotifications] = useState({ email: true, push: true, desktop: false, sms: false });

  // Sync actual browser notification status on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifications(prev => ({
        ...prev,
        desktop: Notification.permission === 'granted'
      }));
    }
  }, []);

  const [timezone, setTimezone] = useState('Asia/Kolkata (IST)');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [googleConnected, setGoogleConnected] = useState(false);
  const [loadingCalendar, setLoadingCalendar] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const token = localStorage.getItem('novalife_token');
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setGoogleConnected(!!data.user.hasGoogleCalendar);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingCalendar(false);
      }
    };
    fetchStatus();
  }, []);

  const handleDisconnectGoogle = async () => {
    try {
      const token = localStorage.getItem('novalife_token');
      const res = await fetch('/api/auth/google/disconnect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setGoogleConnected(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleNotification = async (key: string, val: boolean) => {
    if (key === 'desktop') {
      if (!val) {
        // User wants to turn on desktop notifications
        if (!('Notification' in window)) {
          alert('This browser does not support desktop notifications.');
          return;
        }
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification('🔔 NovaLife Notifications Enabled', {
            body: 'You will now receive desktop notifications from NovaLife!',
            icon: '/favicon.ico'
          });
          setNotifications(prev => ({ ...prev, desktop: true }));
        } else {
          alert('Notification permission denied. Please allow notifications in your browser settings.');
          setNotifications(prev => ({ ...prev, desktop: false }));
        }
      } else {
        // User is turning it off
        setNotifications(prev => ({ ...prev, desktop: false }));
      }
    } else {
      setNotifications(prev => ({ ...prev, [key]: !val }));
    }
  };

  const sendTestNotification = () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications.');
      return;
    }
    if (Notification.permission === 'granted') {
      new Notification('⚡ NovaLife Focus Check', {
        body: 'Success! Desktop notifications are working perfectly on your laptop.',
        icon: '/favicon.ico'
      });
    } else if (Notification.permission === 'denied') {
      alert('Notification permission is blocked. Please enable notifications in your browser URL bar settings.');
    } else {
      alert('Notifications are not enabled yet. Toggle the switch to request permission.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || 'user@example.com';
  const userInitials = displayName.charAt(0).toUpperCase();

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h2>⚙️ <span className="gradient-text">Settings</span></h2>
          <p>Personalize your NovaLife experience.</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Profile */}
        <div className="settings-section widget">
          <h4>👤 Profile</h4>
          <div className="profile-card">
            <div className="profile-avatar-large">{userInitials}</div>
            <div className="profile-info">
              <div className="form-row">
                <label>Display Name</label>
                <input type="text" defaultValue={displayName} className="settings-input" placeholder="Your name" />
              </div>
              <div className="form-row">
                <label>Email</label>
                <input type="email" defaultValue={userEmail} className="settings-input" readOnly style={{ opacity: 0.6 }} />
              </div>
              <div className="form-row">
                <label>Bio</label>
                <input type="text" defaultValue="Student | Aspiring Developer | Productivity Enthusiast" className="settings-input" />
              </div>
              <div className="form-row">
                <label>Timezone</label>
                <CustomSelect
                  value={timezone}
                  onChange={setTimezone}
                  options={timezoneOptions}
                />
              </div>
            </div>
          </div>
        </div>

        {/* AI Personality */}
        <div className="settings-section widget">
          <h4>🤖 AI Personality</h4>
          <p className="settings-desc">Choose how NovaLife AI communicates with you.</p>
          <div className="ai-personality-grid">
            {aiPersonalities.map(p => (
              <div key={p.name}
                className={`personality-card ${aiMode === p.name ? 'active' : ''}`}
                onClick={() => setAiMode(p.name)}>
                <span className="personality-emoji">{p.emoji}</span>
                <span className="personality-name">{p.name}</span>
                <span className="personality-desc">{p.desc}</span>
                {aiMode === p.name && <div className="personality-check">✓</div>}
              </div>
            ))}
          </div>
          {aiMode === 'Strict' && (
            <div className="ai-example-msg">
              <p>⚡ "Stop scrolling. Open your Physics assignment. Now. You have 2 hours left."</p>
            </div>
          )}
          {aiMode === 'Motivational' && (
            <div className="ai-example-msg motivational">
              <p>🔥 "You're doing amazing! Keep that momentum going — every task you complete brings you closer to greatness!"</p>
            </div>
          )}
        </div>

        {/* Theme */}
        <div className="settings-section widget">
          <h4>🎨 Theme</h4>
          <p className="settings-desc">Choose your visual aesthetic.</p>
          <div className="theme-options">
            {themes.map(t => (
              <div key={t.name}
                className={`theme-option ${activeTheme === t.name ? 'active' : ''}`}
                onClick={() => setActiveTheme(t.name)}>
                <div className="theme-preview" style={{ background: t.color }}>
                  <div className="theme-accent" style={{ background: t.accent }}></div>
                </div>
                <span className="theme-name">{t.name}</span>
                {activeTheme === t.name && <div className="theme-check">✓</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Integrations */}
        <div className="settings-section widget">
          <h4>📅 Calendar Integrations</h4>
          <div className="integration-list">
            <div className={`integration-item ${googleConnected ? 'connected' : ''}`}>
              <span>📅 Google Calendar</span>
              {loadingCalendar ? (
                <span className="int-status" style={{ opacity: 0.5 }}>Checking...</span>
              ) : googleConnected ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="int-status connected">Connected</span>
                  <button className="btn-sm btn-danger" onClick={handleDisconnectGoogle} style={{ padding: '2px 8px', fontSize: '11px' }}>Disconnect</button>
                </div>
              ) : (
                <button className="btn-sm btn-secondary" onClick={() => {
                  window.location.href = `/api/auth/google/connect?token=${localStorage.getItem('novalife_token')}`;
                }}>Connect</button>
              )}
            </div>
            <div className="integration-item">
              <span>📧 Outlook</span>
              <button className="btn-sm btn-secondary">Connect</button>
            </div>
            <div className="integration-item">
              <span>🍎 Apple Calendar</span>
              <button className="btn-sm btn-secondary">Connect</button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="settings-section widget">
          <h4>🔔 Notifications</h4>
          <div className="notif-options">
            {Object.entries(notifications).map(([key, val]) => (
              <div key={key} className="notif-row">
                <span className="notif-label">{key.charAt(0).toUpperCase() + key.slice(1)} Notifications</span>
                <div className={`block-toggle ${val ? 'on' : ''}`} onClick={() => handleToggleNotification(key, val)}>
                  <div className="toggle-thumb"></div>
                </div>
              </div>
            ))}
          </div>
          {notifications.desktop && (
            <button 
              className="btn-secondary btn-sm" 
              style={{ marginTop: '16px', alignSelf: 'flex-start' }}
              onClick={sendTestNotification}
            >
              ⚡ Test Desktop Notification
            </button>
          )}
        </div>

        {/* Data & Privacy */}
        <div className="settings-section widget">
          <h4>🔒 Data & Privacy</h4>
          <p className="settings-desc">Manage your account and data.</p>
          <div className="privacy-actions">
            <button className="btn-secondary btn-sm">📥 Export Data</button>
            <button className="btn-secondary btn-sm">🔑 Change Password</button>
            <button className="btn-secondary btn-sm logout-btn" onClick={handleLogout}>🚪 Log Out</button>
            <button className="btn-secondary btn-sm delete-btn">Delete Account</button>
          </div>
        </div>
      </div>
    </div>
  );
}
