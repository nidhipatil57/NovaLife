import { useState, useEffect, useRef } from 'react';
import './FocusPage.css';

interface FocusSession {
  id: string;
  name: string;
  notes: string;
  duration: number; // in seconds
  date: string;
}

const sounds = [
  { name: 'Rain', icon: '🌧️', url: 'https://cdn.jsdelivr.net/gh/YoyoZhang24/RelaX50@master/audios/rain.mp3' },
  { name: 'Cafe', icon: '☕', url: 'https://cdn.jsdelivr.net/gh/stu442/pomodoro-web@master/public/sounds/coffeeshop.mp3' },
  { name: 'Forest', icon: '🌲', url: 'https://cdn.jsdelivr.net/gh/karthiknvd/noctune@master/sounds/forest.mp3' },
  { name: 'Lo-fi', icon: '🎵', url: 'https://cdn.jsdelivr.net/gh/YoyoZhang24/RelaX50@master/audios/lofi.mp3' },
  { name: 'White Noise', icon: '📻', url: 'https://cdn.jsdelivr.net/gh/karthiknvd/noctune@master/sounds/wind.mp3' },
  { name: 'Ocean', icon: '🌊', url: 'https://cdn.jsdelivr.net/gh/YoyoZhang24/RelaX50@master/audios/sea.mp3' },
];

const defaultBlockedSites = [
  { name: 'Instagram', icon: '📸' },
  { name: 'YouTube', icon: '▶️' },
  { name: 'Twitter', icon: '🐦' },
  { name: 'Reddit', icon: '🔴' },
  { name: 'TikTok', icon: '🎵' },
];

export default function FocusPage() {
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSounds, setActiveSounds] = useState<string[]>([]);
  const [blockedSites, setBlockedSites] = useState<Record<string, boolean>>({
    Instagram: true, YouTube: true, Twitter: true, Reddit: false, TikTok: true,
  });
  
  // Custom focus sessions state loaded from localStorage
  const [pastSessions, setPastSessions] = useState<FocusSession[]>(() => {
    const saved = localStorage.getItem('past_focus_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  // Modal states
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [selectedSession, setSelectedSession] = useState<FocusSession | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioPlayersRef = useRef<Record<string, HTMLAudioElement | null>>({});

  // Cleanup audio players on unmount
  useEffect(() => {
    return () => {
      Object.values(audioPlayersRef.current).forEach(player => {
        if (player) {
          player.pause();
        }
      });
    };
  }, []);

  // Timer count-up logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const startTimer = () => {
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resumeTimer = () => {
    setIsRunning(true);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsElapsed(0);
  };

  const finishSession = () => {
    setIsRunning(false);
    setSessionName('');
    setSessionNotes('');
    setShowFinishModal(true);
  };

  const saveSession = () => {
    if (!sessionName.trim()) return;
    const newSession: FocusSession = {
      id: Date.now().toString(),
      name: sessionName.trim(),
      notes: sessionNotes.trim(),
      duration: secondsElapsed,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    const updated = [newSession, ...pastSessions];
    setPastSessions(updated);
    localStorage.setItem('past_focus_sessions', JSON.stringify(updated));
    setShowFinishModal(false);
    setSecondsElapsed(0);
  };

  const deleteSession = (id: string) => {
    if (window.confirm('Are you sure you want to delete this focus session?')) {
      const updated = pastSessions.filter(s => s.id !== id);
      setPastSessions(updated);
      localStorage.setItem('past_focus_sessions', JSON.stringify(updated));
      if (selectedSession && selectedSession.id === id) {
        setSelectedSession(null);
      }
    }
  };

  const cancelSaveSession = () => {
    setShowFinishModal(false);
  };

  const toggleSound = (name: string) => {
    const isActive = activeSounds.includes(name);
    if (isActive) {
      const player = audioPlayersRef.current[name];
      if (player) {
        player.pause();
        audioPlayersRef.current[name] = null;
      }
      setActiveSounds(prev => prev.filter(s => s !== name));
    } else {
      const soundDef = sounds.find(s => s.name === name);
      if (soundDef) {
        try {
          const player = new Audio(soundDef.url);
          player.loop = true;
          player.volume = 0.5;
          player.play().catch(err => {
            console.error(`Error playing audio ${name}:`, err);
          });
          audioPlayersRef.current[name] = player;
          setActiveSounds(prev => [...prev, name]);
        } catch (e) {
          console.error("Audio initialization failed:", e);
        }
      }
    }
  };

  const toggleBlockedSite = (name: string) => {
    setBlockedSites(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const formatTimeDigits = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatDuration = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    const pieces = [];
    if (hrs > 0) pieces.push(`${hrs}h`);
    if (mins > 0 || hrs > 0) pieces.push(`${mins}m`);
    pieces.push(`${secs}s`);
    return pieces.join(' ');
  };

  // SVG Progress Ring logic: loop every 60 seconds
  const progress = ((secondsElapsed % 60) / 60) * 100;
  const circumference = 2 * Math.PI * 90;

  // Analytics
  const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const todaySessions = pastSessions.filter(s => s.date.includes(todayStr));
  const todaySeconds = todaySessions.reduce((sum, s) => sum + s.duration, 0);
  const todayHours = (todaySeconds / 3600).toFixed(1);
  const todaySessionsCount = todaySessions.length;

  if (isFullscreen) {
    return (
      <div className="focus-fullscreen">
        <div className="fs-ambient">
          <div className="fs-orb"></div>
          <div className="fs-orb fs-orb-2"></div>
        </div>
        {/* Floating Background Particles */}
        <div className="area-particles">
          <div className="particle p-1"></div>
          <div className="particle p-2"></div>
          <div className="particle p-3"></div>
          <div className="particle p-4"></div>
          <div className="particle p-5"></div>
          <div className="particle p-6"></div>
          <div className="particle p-7"></div>
          <div className="particle p-8"></div>
          <div className="particle p-9"></div>
          <div className="particle p-10"></div>
          <div className="particle p-11"></div>
          <div className="particle p-12"></div>
          <div className="particle p-13"></div>
          <div className="particle p-14"></div>
          <div className="particle p-15"></div>
          <div className="particle p-16"></div>
        </div>
        <div className="fs-content">
          <p className="fs-mode-label">⏱️ Active Session</p>
          <div className="fs-timer">
            <svg viewBox="0 0 200 200" className="fs-ring">
              <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="4" />
              <circle cx="100" cy="100" r="90" fill="none" stroke="url(#focusGrad)" strokeWidth="4"
                strokeLinecap="round" strokeDasharray={circumference}
                strokeDashoffset={circumference - (progress / 100) * circumference}
                style={{ transform: 'rotate(-90deg)', transformOrigin: '100px 100px', transition: 'stroke-dashoffset 1s linear' }} />
              <defs>
                <linearGradient id="focusGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--accent-cyan)" />
                  <stop offset="100%" stopColor="var(--accent-purple)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="fs-time">
              <span className="fs-digits">{formatTimeDigits(secondsElapsed)}</span>
              <span className="fs-status">{isRunning ? 'FOCUSING' : secondsElapsed === 0 ? 'READY' : 'PAUSED'}</span>
            </div>
          </div>
          <div className="fs-controls">
            {secondsElapsed === 0 && !isRunning && (
              <button className="fs-btn start" onClick={startTimer} title="Start Session">▶️</button>
            )}
            {isRunning && (
              <>
                <button className="fs-btn pause" onClick={pauseTimer} title="Pause Session">⏸</button>
                <button className="fs-btn finish" onClick={() => { setIsFullscreen(false); finishSession(); }} title="Finish Session">⏹</button>
              </>
            )}
            {secondsElapsed > 0 && !isRunning && (
              <>
                <button className="fs-btn resume" onClick={resumeTimer} title="Resume Session">▶️</button>
                <button className="fs-btn reset" onClick={resetTimer} title="Reset Session">⟲</button>
                <button className="fs-btn finish" onClick={() => { setIsFullscreen(false); finishSession(); }} title="Finish Session">⏹</button>
              </>
            )}
            <button className="fs-btn close" onClick={() => setIsFullscreen(false)} title="Exit Fullscreen">✕</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="focus-page">
      <div className="page-header">
        <div>
          <h2>🎧 <span className="gradient-text">Focus</span></h2>
          <p>Deep work center — Track your focus sessions, take notes, and build productivity habits.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-primary btn-sm" onClick={() => setIsFullscreen(true)}>🖥️ Fullscreen Mode</button>
        </div>
      </div>

      <div className="focus-layout">
        {/* Timer Section */}
        <div className="focus-timer-section widget">
          {/* Floating Background Particles */}
          <div className="area-particles">
            <div className="particle p-1"></div>
            <div className="particle p-2"></div>
            <div className="particle p-3"></div>
            <div className="particle p-4"></div>
            <div className="particle p-5"></div>
            <div className="particle p-6"></div>
            <div className="particle p-7"></div>
            <div className="particle p-8"></div>
            <div className="particle p-9"></div>
            <div className="particle p-10"></div>
            <div className="particle p-11"></div>
            <div className="particle p-12"></div>
            <div className="particle p-13"></div>
            <div className="particle p-14"></div>
            <div className="particle p-15"></div>
            <div className="particle p-16"></div>
          </div>
          <div className="timer-display">
            <svg viewBox="0 0 200 200" className={`timer-ring ${isRunning ? 'active' : ''}`}>
              <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="5" />
              <circle cx="100" cy="100" r="90" fill="none" stroke="url(#timerGrad)" strokeWidth="5"
                strokeLinecap="round" strokeDasharray={circumference}
                strokeDashoffset={circumference - (progress / 100) * circumference}
                style={{ transform: 'rotate(-90deg)', transformOrigin: '100px 100px', transition: 'stroke-dashoffset 1s linear' }} />
              <defs>
                <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--accent-blue)" />
                  <stop offset="50%" stopColor="var(--accent-purple)" />
                  <stop offset="100%" stopColor="var(--accent-cyan)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="timer-center">
              <span className="timer-digits">{formatTimeDigits(secondsElapsed)}</span>
              <span className="timer-label">{isRunning ? 'FOCUSING' : secondsElapsed === 0 ? 'READY' : 'PAUSED'}</span>
            </div>
          </div>

          <div className="timer-actions-row">
            {secondsElapsed === 0 && !isRunning && (
              <button className="btn-primary timer-action-btn start" onClick={startTimer}>
                ▶️ Start Focus Session
              </button>
            )}

            {isRunning && (
              <div className="timer-controls-group">
                <button className="btn-secondary timer-action-btn pause" onClick={pauseTimer}>
                  ⏸ Pause
                </button>
                <button className="btn-primary timer-action-btn finish" onClick={finishSession}>
                  ⏹ Finish Session
                </button>
              </div>
            )}

            {secondsElapsed > 0 && !isRunning && (
              <div className="timer-controls-group">
                <button className="btn-primary timer-action-btn resume" onClick={resumeTimer}>
                  ▶️ Resume
                </button>
                <button className="btn-secondary timer-action-btn reset" onClick={resetTimer}>
                  ⟲ Reset
                </button>
                <button className="btn-success timer-action-btn finish" onClick={finishSession}>
                  ⏹ Finish Session
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="focus-right">
          {/* Ambient Sounds */}
          <div className="widget focus-sounds">
            <div className="widget-header"><h4>🎶 Ambient Sounds</h4></div>
            <div className="sound-grid">
              {sounds.map(s => (
                <button key={s.name}
                  className={`sound-btn ${activeSounds.includes(s.name) ? 'active' : ''}`}
                  onClick={() => toggleSound(s.name)}>
                  <span className="sound-icon">{s.icon}</span>
                  <span className="sound-name">{s.name}</span>
                  {activeSounds.includes(s.name) && <div className="sound-wave">
                    <span></span><span></span><span></span>
                  </div>}
                </button>
              ))}
            </div>
          </div>

          {/* Website Blocker */}
          <div className="widget focus-blocker">
            <div className="widget-header"><h4>🚫 Website Blocker</h4></div>
            <div className="blocked-list">
              {defaultBlockedSites.map(site => (
                <div key={site.name} className="blocked-item" onClick={() => toggleBlockedSite(site.name)}>
                  <span>{site.icon} {site.name}</span>
                  <div className={`block-toggle ${blockedSites[site.name] ? 'on' : ''}`}>
                    <div className="toggle-thumb"></div>
                  </div>
                </div>
              ))}
            </div>
            <p className="blocker-note">Visual only — blocks are simulated</p>
          </div>
        </div>
      </div>

      {/* Focus Analytics */}
      <div className="focus-analytics widget">
        <div className="widget-header"><h4>📊 Focus Analytics</h4></div>
        <div className="focus-stats-grid">
          <div className="focus-stat-card">
            <span className="focus-stat-icon">⏱️</span>
            <span className="focus-stat-val">{todayHours}h</span>
            <span className="focus-stat-lbl">Today's Focus</span>
          </div>
          <div className="focus-stat-card">
            <span className="focus-stat-icon">📈</span>
            <span className="focus-stat-val">{todaySessionsCount}</span>
            <span className="focus-stat-lbl">Sessions Done</span>
          </div>
          <div className="focus-stat-card">
            <span className="focus-stat-icon">🕐</span>
            <span className="focus-stat-val">Active Tracker</span>
            <span className="focus-stat-lbl">Peak Hours</span>
          </div>
          <div className="focus-stat-card">
            <span className="focus-stat-icon">🚫</span>
            <span className="focus-stat-val">{Object.values(blockedSites).filter(Boolean).length}</span>
            <span className="focus-stat-lbl">Sites Blocked</span>
          </div>
        </div>
      </div>

      {/* Past Focus Sessions */}
      <div className="focus-past-sessions widget">
        <div className="widget-header">
          <h4>📋 Past Focus Sessions</h4>
        </div>
        
        {pastSessions.length === 0 ? (
          <div className="no-sessions">
            <span className="no-sessions-icon">⏱️</span>
            <p>No focus sessions recorded yet. Start focusing to log your first session!</p>
          </div>
        ) : (
          <div className="past-sessions-list">
            {pastSessions.map(session => (
              <div key={session.id} className="past-session-card" onClick={() => setSelectedSession(session)}>
                <div className="past-session-info">
                  <span className="past-session-name">{session.name}</span>
                  <span className="past-session-date">{session.date}</span>
                </div>
                <div className="past-session-meta">
                  <span className="past-session-duration">⏱️ {formatDuration(session.duration)}</span>
                  <button 
                    className="delete-session-btn" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      deleteSession(session.id); 
                    }}
                    title="Delete Session"
                  >
                    🗑️
                  </button>
                  <span className="past-session-arrow">→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Session Modal */}
      {showFinishModal && (
        <div className="focus-modal-overlay">
          <div className="focus-modal-content">
            <div className="modal-header">
              <h3>🎉 Finish Focus Session</h3>
            </div>
            <div className="modal-body">
              <div className="duration-preview">
                <span className="preview-label">Time Focused</span>
                <span className="preview-time">{formatDuration(secondsElapsed)}</span>
              </div>
              <div className="form-group">
                <label htmlFor="session-name">Session Name <span className="required">*</span></label>
                <input
                  id="session-name"
                  type="text"
                  placeholder="e.g., Math Study, Coding UI, Reading"
                  value={sessionName}
                  onChange={e => setSessionName(e.target.value)}
                  className="modal-input"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="session-notes">What did you accomplish? (Notes)</label>
                <textarea
                  id="session-notes"
                  placeholder="Write a brief summary of what you did during this focus session..."
                  value={sessionNotes}
                  onChange={e => setSessionNotes(e.target.value)}
                  className="modal-textarea"
                  rows={4}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary modal-btn" onClick={cancelSaveSession}>Cancel</button>
              <button className="btn-primary modal-btn" onClick={saveSession} disabled={!sessionName.trim()}>Save Session</button>
            </div>
          </div>
        </div>
      )}

      {/* Past Session Detail Modal */}
      {selectedSession && (
        <div className="focus-modal-overlay" onClick={() => setSelectedSession(null)}>
          <div className="focus-modal-content detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📄 Session Details</h3>
              <button className="modal-close-btn" onClick={() => setSelectedSession(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-field">
                <label>Session Name</label>
                <div className="detail-value name">{selectedSession.name}</div>
              </div>
              <div className="detail-row">
                <div className="detail-field">
                  <label>Duration</label>
                  <div className="detail-value duration">⏱️ {formatDuration(selectedSession.duration)}</div>
                </div>
                <div className="detail-field">
                  <label>Date & Time</label>
                  <div className="detail-value date">📅 {selectedSession.date}</div>
                </div>
              </div>
              <div className="detail-field">
                <label>Notes & Accomplishments</label>
                <div className="detail-value notes-box">
                  {selectedSession.notes ? selectedSession.notes : <i className="no-notes-placeholder">No notes recorded for this session.</i>}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary modal-btn" onClick={() => setSelectedSession(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
