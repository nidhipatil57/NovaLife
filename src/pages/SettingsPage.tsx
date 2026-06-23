import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './SettingsPage.css';

const themes = [
  { name: 'Dark', color: '#070B14', active: true },
  { name: 'Midnight', color: '#0a0e1a' },
  { name: 'Cyberpunk', color: '#120018' },
  { name: 'Aurora', color: '#050a15' },
];

const aiPersonalities = [
  { name: 'Professional', emoji: '💼', desc: 'Clean and focused advice' },
  { name: 'Motivational', emoji: '🔥', desc: 'High energy encouragement' },
  { name: 'Friendly', emoji: '😊', desc: 'Warm and supportive' },
  { name: 'Strict', emoji: '⚡', desc: '"Stop procrastinating. Start now."' },
];

export default function SettingsPage() {
  const [aiMode, setAiMode] = useState('Motivational');
  const [notifications, setNotifications] = useState({ email: true, push: true, desktop: true, sms: false });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
            <div className="profile-avatar">{userInitials}</div>
            <div className="profile-info">
              <div className="form-row">
                <label>Name</label>
                <input type="text" defaultValue={displayName} className="settings-input" />
              </div>
              <div className="form-row">
                <label>Email</label>
                <input type="email" defaultValue={userEmail} className="settings-input" />
              </div>
              <div className="form-row">
                <label>Bio</label>
                <input type="text" defaultValue="Student | Aspiring Developer | Productivity Enthusiast" className="settings-input" />
              </div>
              <div className="form-row">
                <label>Timezone</label>
                <select className="settings-input"><option>Asia/Kolkata (IST)</option></select>
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
              <div key={p.name} className={`personality-card ${aiMode === p.name ? 'active' : ''}`} onClick={() => setAiMode(p.name)}>
                <span className="personality-emoji">{p.emoji}</span>
                <span className="personality-name">{p.name}</span>
                <span className="personality-desc">{p.desc}</span>
              </div>
            ))}
          </div>
          {aiMode === 'Strict' && (
            <div className="ai-example-msg">
              <p>⚡ "Stop scrolling. Open your Physics assignment. Now. You have 2 hours left."</p>
            </div>
          )}
        </div>

        {/* Theme */}
        <div className="settings-section widget">
          <h4>🎨 Theme</h4>
          <div className="theme-options">
            {themes.map(t => (
              <div key={t.name} className={`theme-option ${t.active ? 'active' : ''}`}>
                <div className="theme-preview" style={{ background: t.color }}></div>
                <span>{t.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Integrations */}
        <div className="settings-section widget">
          <h4>📅 Calendar Integrations</h4>
          <div className="integration-list">
            <div className="integration-item connected">
              <span>📅 Google Calendar</span>
              <span className="int-status connected">Connected</span>
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
                <div className={`block-toggle ${val ? 'on' : ''}`} onClick={() => setNotifications(prev => ({ ...prev, [key]: !val }))}>
                  <div className="toggle-thumb"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data & Privacy */}
        <div className="settings-section widget">
          <h4>🔒 Data & Privacy</h4>
          <div className="privacy-actions">
            <button className="btn-secondary btn-sm">📥 Export Data</button>
            <button className="btn-secondary btn-sm">🔑 Change Password</button>
            <button className="btn-secondary btn-sm" onClick={handleLogout} style={{ color: 'var(--accent-orange, #ff9f43)' }}>🚪 Log Out</button>
            <button className="btn-secondary btn-sm" style={{ color: 'var(--accent-red)' }}>🗑️ Delete Account</button>
          </div>
        </div>
      </div>
    </div>
  );
}
