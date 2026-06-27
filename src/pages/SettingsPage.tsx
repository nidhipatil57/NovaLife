import { useState, useEffect, useRef } from 'react';
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
  { name: 'Light', color: '#FAF6F0', accent: '#4A90E2' },
];

export default function SettingsPage() {
  const [activeTheme, setActiveTheme] = useState(() => {
    return localStorage.getItem('novalife_theme') || 'Dark';
  });
  const [notifications, setNotifications] = useState({ email: true, push: true, desktop: false, sms: false });

  // Profile Form States
  const [profileName, setProfileName] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileTimezone, setProfileTimezone] = useState('Asia/Kolkata (IST)');
  const [profileOccupation, setProfileOccupation] = useState('Student');
  const [profileWeeklyFocusTarget, setProfileFocusTarget] = useState(20);
  const [profileDailyTaskTarget, setProfileDailyTaskTarget] = useState(5);
  const [profileAiCoachTone, setProfileAiCoachTone] = useState('Motivational');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Profile Picture States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Change Password States (Modal)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Delete Account States (Modal)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [googleConnected, setGoogleConnected] = useState(false);
  const [loadingCalendar, setLoadingCalendar] = useState(true);

  // Sync user profile values
  useEffect(() => {
    if (user) {
      setProfileName(user.displayName || '');
      setProfileBio(user.bio || 'Student | Aspiring Developer | Productivity Enthusiast');
      setProfileTimezone(user.timezone || 'Asia/Kolkata (IST)');
      setProfileOccupation(user.occupation || 'Student');
      setProfileFocusTarget(user.weeklyFocusTarget || 20);
      setProfileDailyTaskTarget(user.dailyTaskTarget || 5);
      setProfileAiCoachTone(user.aiCoachTone || 'Motivational');
    }
  }, [user]);

  // Close avatar menu clicking outside
  useEffect(() => {
    const handleCloseMenu = () => setIsAvatarMenuOpen(false);
    document.addEventListener('click', handleCloseMenu);
    return () => document.removeEventListener('click', handleCloseMenu);
  }, []);

  // Sync actual browser notification status on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifications(prev => ({
        ...prev,
        desktop: Notification.permission === 'granted'
      }));
    }
  }, []);

  // Fetch Google Calendar status
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
        updateUser({ hasGoogleCalendar: false });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleNotification = async (key: string, val: boolean) => {
    if (key === 'desktop') {
      if (!val) {
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

  // Profile Data Save
  const handleSaveProfile = async () => {
    if (!profileName.trim()) {
      setProfileStatus({ text: 'Display Name cannot be empty.', type: 'error' });
      return;
    }
    setSavingProfile(true);
    setProfileStatus(null);
    try {
      const token = localStorage.getItem('novalife_token');
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          displayName: profileName,
          bio: profileBio,
          timezone: profileTimezone,
          occupation: profileOccupation,
          weeklyFocusTarget: profileWeeklyFocusTarget,
          dailyTaskTarget: profileDailyTaskTarget,
          aiCoachTone: profileAiCoachTone
        })
      });
      const data = await res.json();
      if (res.ok) {
        updateUser({
          displayName: profileName,
          bio: profileBio,
          timezone: profileTimezone,
          occupation: profileOccupation,
          weeklyFocusTarget: profileWeeklyFocusTarget,
          dailyTaskTarget: profileDailyTaskTarget,
          aiCoachTone: profileAiCoachTone
        });
        setProfileStatus({ text: 'Changes saved successfully.', type: 'success' });
      } else {
        setProfileStatus({ text: data.error || 'Failed to update profile.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setProfileStatus({ text: 'Network error.', type: 'error' });
    } finally {
      setSavingProfile(false);
    }
  };

  // Avatar Upload / Drag / Crop logic
  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (user?.avatarUrl) {
      setIsAvatarMenuOpen(prev => !prev);
    } else {
      handleTriggerFileSelect();
    }
  };

  const handleTriggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setIsAdjustModalOpen(true);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setIsAvatarMenuOpen(false);
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  // Dragging event handlers for crop preview
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleApplyAdjustment = () => {
    if (!selectedImage) return;

    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 150;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 150, 150);

        // Center canvas
        ctx.translate(75, 75);
        
        let imgWidth = img.width;
        let imgHeight = img.height;
        const scaleToFit = Math.max(150 / imgWidth, 150 / imgHeight);
        imgWidth = imgWidth * scaleToFit;
        imgHeight = imgHeight * scaleToFit;

        // Apply scale & zoom
        ctx.scale(zoom, zoom);
        ctx.translate(offset.x / zoom, offset.y / zoom);

        ctx.drawImage(img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);

        const croppedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        
        setSavingProfile(true);
        try {
          const token = localStorage.getItem('novalife_token');
          const res = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              displayName: profileName,
              bio: profileBio,
              timezone: profileTimezone,
              avatarUrl: croppedBase64
            })
          });
          const data = await res.json();
          if (res.ok) {
            updateUser({ avatarUrl: croppedBase64 });
            setIsAdjustModalOpen(false);
            setSelectedImage(null);
            setZoom(1);
            setOffset({ x: 0, y: 0 });
          } else {
            alert(data.error || 'Failed to update avatar.');
          }
        } catch (err) {
          console.error(err);
          alert('Network error.');
        } finally {
          setSavingProfile(false);
        }
      }
    };
    img.src = selectedImage;
  };

  const handleRemoveAvatar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSavingProfile(true);
    setIsAvatarMenuOpen(false);
    try {
      const token = localStorage.getItem('novalife_token');
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          displayName: profileName,
          bio: profileBio,
          timezone: profileTimezone,
          avatarUrl: null
        })
      });
      const data = await res.json();
      if (res.ok) {
        updateUser({ avatarUrl: null });
      } else {
        alert(data.error || 'Failed to remove photo.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePasswordSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordStatus({ text: 'All password fields are required.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    setSavingPassword(true);
    setPasswordStatus(null);
    try {
      const token = localStorage.getItem('novalife_token');
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordStatus({ text: 'Password changed successfully!', type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setIsPasswordModalOpen(false);
          setPasswordStatus(null);
        }, 1500);
      } else {
        setPasswordStatus({ text: data.error || 'Failed to change password.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setPasswordStatus({ text: 'Network error.', type: 'error' });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccountSubmit = async () => {
    if (deleteText !== 'DELETE') return;
    setDeletingAccount(true);
    try {
      const token = localStorage.getItem('novalife_token');
      const res = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        logout();
        navigate('/login');
      } else {
        alert('Failed to delete account. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Failed to delete account.');
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleThemeChange = (themeName: string) => {
    setActiveTheme(themeName);
    localStorage.setItem('novalife_theme', themeName);
    if (themeName === 'Light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
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

      <div className="settings-layout-columns">
        <div className="settings-column left">
          {/* Profile */}
          <div className="settings-section widget">
            <h4>👤 Profile</h4>
            <div className="profile-card">
              
              {/* Interactive Profile Photo Container */}
              <div className="avatar-wrapper" onClick={handleAvatarClick}>
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="profile-avatar-large-img" />
                ) : (
                  <div className="profile-avatar-large">{userInitials}</div>
                )}
                <div className="avatar-edit-overlay" title="Edit Profile Picture">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </div>

                {isAvatarMenuOpen && user?.avatarUrl && (
                  <div className="avatar-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="dropdown-item" onClick={handleTriggerFileSelect}>
                      Change Photo
                    </button>
                    <button type="button" className="dropdown-item delete-item" onClick={handleRemoveAvatar}>
                      Remove Photo
                    </button>
                  </div>
                )}
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />

              <div className="profile-info">
                <div className="profile-info-grid">
                  <div className="form-row">
                    <label>Display Name</label>
                    <input 
                      type="text" 
                      value={profileName} 
                      onChange={(e) => setProfileName(e.target.value)} 
                      className="settings-input" 
                      placeholder="Your name" 
                    />
                  </div>
                  <div className="form-row">
                    <label>Email</label>
                    <input 
                      type="email" 
                      value={userEmail} 
                      className="settings-input" 
                      disabled 
                      style={{ opacity: 0.6, cursor: 'not-allowed' }} 
                    />
                  </div>
                  <div className="form-row" style={{ gridColumn: 'span 2' }}>
                    <label>Bio</label>
                    <input 
                      type="text" 
                      value={profileBio} 
                      onChange={(e) => setProfileBio(e.target.value)} 
                      className="settings-input" 
                      placeholder="Tell us about yourself" 
                    />
                  </div>
                  <div className="form-row">
                    <label>Occupation / Role</label>
                    <input 
                      type="text" 
                      value={profileOccupation} 
                      onChange={(e) => setProfileOccupation(e.target.value)} 
                      className="settings-input" 
                      placeholder="e.g. Student, Developer" 
                    />
                  </div>
                  <div className="form-row">
                    <label>Timezone</label>
                    <CustomSelect
                      value={profileTimezone}
                      onChange={setProfileTimezone}
                      options={timezoneOptions}
                    />
                  </div>
                  <div className="form-row">
                    <label>AI Coach Tone</label>
                    <CustomSelect
                      value={profileAiCoachTone}
                      onChange={setProfileAiCoachTone}
                      options={[
                        { label: 'Motivational & Inspiring', value: 'Motivational', icon: '🔥' },
                        { label: 'Direct & Strict Coach', value: 'Strict', icon: '👊' },
                        { label: 'Friendly & Supportive', value: 'Friendly', icon: '🤝' },
                        { label: 'Data-driven & Analytical', value: 'Analytical', icon: '📊' },
                      ]}
                    />
                  </div>
                  <div className="form-row">
                    <label>Daily Task Target</label>
                    <CustomSelect
                      value={String(profileDailyTaskTarget)}
                      onChange={(val) => setProfileDailyTaskTarget(parseInt(val))}
                      options={[
                        { label: '3 Tasks / day', value: '3', icon: '🎯' },
                        { label: '5 Tasks / day', value: '5', icon: '🎯' },
                        { label: '8 Tasks / day', value: '8', icon: '🎯' },
                        { label: '10 Tasks / day', value: '10', icon: '🎯' },
                      ]}
                    />
                  </div>
                  <div className="form-row" style={{ gridColumn: 'span 2' }}>
                    <label>Weekly Focus Target</label>
                    <CustomSelect
                      value={String(profileWeeklyFocusTarget)}
                      onChange={(val) => setProfileFocusTarget(parseInt(val))}
                      options={[
                        { label: '5 Hours / week', value: '5', icon: '⏱️' },
                        { label: '10 Hours / week', value: '10', icon: '⏱️' },
                        { label: '20 Hours / week', value: '20', icon: '⏱️' },
                        { label: '30 Hours / week', value: '30', icon: '⏱️' },
                        { label: '40 Hours / week', value: '40', icon: '⏱️' },
                      ]}
                    />
                  </div>
                </div>

                {profileStatus && (
                  <p className={`profile-status-msg ${profileStatus.type}`}>
                    {profileStatus.text}
                  </p>
                )}

                <button 
                  className="btn-sm btn-primary save-profile-btn" 
                  onClick={handleSaveProfile} 
                  disabled={savingProfile}
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>

          {/* Theme */}
          <div className="settings-section widget">
            <h4>🎨 Theme</h4>
            <p className="settings-desc">Choose your visual aesthetic.</p>
            <div className="theme-options">
              {themes.map(t => (
                <div key={t.name}
                  className={`theme-option ${activeTheme === t.name ? 'active' : ''}`}
                  onClick={() => handleThemeChange(t.name)}>
                  <div className="theme-preview" style={{ background: t.color }}>
                    <div className="theme-accent" style={{ background: t.accent }}></div>
                  </div>
                  <span className="theme-name">{t.name}</span>
                  {activeTheme === t.name && <div className="theme-check">✓</div>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="settings-column right">
          {/* Calendar Integrations */}
          <div className="settings-section widget calendar-integration-box">
            <h4>📅 Calendar Integration</h4>
            <p className="settings-desc">Keep your schedule synchronized automatically.</p>
            <div className="google-calendar-card">
              <div className="gcal-header">
                <div className="gcal-logo-wrapper">
                  <svg className="gcal-svg-icon" viewBox="0 0 24 24" width="36" height="36">
                    <path fill="#4285F4" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                    <rect x="7" y="10" width="2" height="2" fill="#4285F4"/>
                    <rect x="11" y="10" width="2" height="2" fill="#4285F4"/>
                    <rect x="15" y="10" width="2" height="2" fill="#4285F4"/>
                    <rect x="7" y="14" width="2" height="2" fill="#4285F4"/>
                    <rect x="11" y="14" width="2" height="2" fill="#4285F4"/>
                    <rect x="15" y="14" width="2" height="2" fill="#4285F4"/>
                  </svg>
                </div>
                <div className="gcal-meta">
                  <span className="gcal-title">Google Calendar</span>
                  <p className="gcal-desc">Import and sync deadlines, tasks, and productivity blocks.</p>
                </div>
              </div>
              <div className="gcal-action-row">
                {loadingCalendar ? (
                  <span className="gcal-status checking">Checking Connection...</span>
                ) : googleConnected ? (
                  <>
                    <span className="gcal-status connected">🟢 Connected</span>
                    <button className="btn-sm btn-danger disconnect-btn" onClick={handleDisconnectGoogle}>
                      Disconnect
                    </button>
                  </>
                ) : (
                  <>
                    <span className="gcal-status disconnected">⚫ Disconnected</span>
                    <button className="btn-sm btn-primary connect-btn" onClick={() => {
                      window.location.href = `/api/auth/google/connect?token=${localStorage.getItem('novalife_token')}`;
                    }}>
                      Connect
                    </button>
                  </>
                )}
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
            <p className="settings-desc">Manage your account credentials and system presence.</p>
            <div className="privacy-actions">
              <button className="btn-secondary btn-sm" onClick={() => setIsPasswordModalOpen(true)}>
                🔑 Change Password
              </button>
              <button 
                className="btn-secondary btn-sm logout-btn" 
                onClick={handleLogout}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                  <path d="M9 4H4v16h5" />
                  <path d="M20 12H9" />
                  <path d="M13 8l-4 4 4 4" />
                </svg>
                Log Out
              </button>
              <button className="btn-secondary btn-sm delete-btn" onClick={() => setIsDeleteModalOpen(true)}>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Photo Adjustment Modal */}
      {isAdjustModalOpen && (
        <div className="settings-modal-overlay" onClick={() => {
          setIsAdjustModalOpen(false);
          setSelectedImage(null);
        }}>
          <div className="settings-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>📐 Adjust Profile Picture</h4>
              <button className="modal-close-btn" onClick={() => {
                setIsAdjustModalOpen(false);
                setSelectedImage(null);
              }}>✕</button>
            </div>
            <div className="modal-body" style={{ alignItems: 'center' }}>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '12px' }}>
                Drag your photo to adjust position. Use slider to zoom.
              </p>

              <div 
                className="avatar-crop-container"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUpOrLeave}
                style={{
                  width: '160px',
                  height: '160px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  position: 'relative',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '2px solid var(--accent-blue)',
                  boxShadow: 'var(--shadow-lg)'
                }}
              >
                {selectedImage && (
                  <img 
                    src={selectedImage} 
                    alt="Adjustment Preview" 
                    draggable={false}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transformOrigin: 'center center',
                      transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                      userSelect: 'none',
                      pointerEvents: 'none'
                    }}
                  />
                )}
              </div>

              <div style={{ width: '100%', marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                  <span>Zoom</span>
                  <span>{Math.round(zoom * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="3" 
                  step="0.01" 
                  value={zoom} 
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-sm btn-primary" 
                onClick={handleApplyAdjustment} 
                disabled={savingProfile}
              >
                {savingProfile ? 'Applying...' : 'Apply & Save'}
              </button>
              <button className="btn-sm btn-secondary" onClick={() => {
                setIsAdjustModalOpen(false);
                setSelectedImage(null);
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal Box */}
      {isPasswordModalOpen && (
        <div className="settings-modal-overlay" onClick={() => {
          setIsPasswordModalOpen(false);
          setPasswordStatus(null);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }}>
          <div className="settings-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>🔑 Change Password</h4>
              <button className="modal-close-btn" onClick={() => {
                setIsPasswordModalOpen(false);
                setPasswordStatus(null);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
              }}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label>Current Password</label>
                <input 
                  type="password" 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)} 
                  className="settings-input" 
                  placeholder="Enter current password" 
                />
              </div>
              <div className="form-row">
                <label>New Password</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  className="settings-input" 
                  placeholder="Enter new password" 
                />
              </div>
              <div className="form-row">
                <label>Confirm New Password</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  className="settings-input" 
                  placeholder="Confirm new password" 
                />
              </div>
              {passwordStatus && (
                <p className={`password-status-msg ${passwordStatus.type}`} style={{ margin: '12px 0 0 0' }}>
                  {passwordStatus.text}
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn-sm btn-primary" 
                onClick={handleChangePasswordSubmit} 
                disabled={savingPassword}
              >
                {savingPassword ? 'Updating...' : 'Update Password'}
              </button>
              <button className="btn-sm btn-secondary" onClick={() => {
                setIsPasswordModalOpen(false);
                setPasswordStatus(null);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal Box */}
      {isDeleteModalOpen && (
        <div className="settings-modal-overlay" onClick={() => {
          setIsDeleteModalOpen(false);
          setDeleteText('');
        }}>
          <div className="settings-modal-card delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4 style={{ color: 'var(--accent-red)' }}>⚠️ Delete Account</h4>
              <button className="modal-close-btn" onClick={() => {
                setIsDeleteModalOpen(false);
                setDeleteText('');
              }}>✕</button>
            </div>
            <div className="modal-body">
              <p className="delete-warning-text">
                Are you sure you want to delete your account? All your important data and statistics will be lost.
              </p>
              <div className="form-row">
                <label>Type <strong style={{ color: 'var(--accent-red)' }}>DELETE</strong> to confirm deletion</label>
                <input 
                  type="text" 
                  value={deleteText} 
                  onChange={(e) => setDeleteText(e.target.value)} 
                  className="settings-input" 
                  placeholder="Type DELETE" 
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className={`delete-permanently-btn ${deleteText === 'DELETE' ? 'unlocked' : 'locked'}`}
                disabled={deleteText !== 'DELETE' || deletingAccount}
                onClick={handleDeleteAccountSubmit}
              >
                {deletingAccount ? 'Deleting...' : 'Delete Permanently'}
              </button>
              <button className="btn-sm btn-secondary" onClick={() => {
                setIsDeleteModalOpen(false);
                setDeleteText('');
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
