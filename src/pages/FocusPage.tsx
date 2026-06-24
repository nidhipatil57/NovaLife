import { useState, useEffect, useRef, useCallback } from 'react';
import './FocusPage.css';

const presets = [
  { label: '🎯 Focus', mins: 25, color: 'var(--accent-blue)' },
  { label: '☕ Short Break', mins: 5, color: 'var(--accent-green)' },
  { label: '🌿 Long Break', mins: 15, color: 'var(--accent-purple)' },
];

const sounds = [
  { name: 'Rain', icon: '🌧️' },
  { name: 'Cafe', icon: '☕' },
  { name: 'Forest', icon: '🌲' },
  { name: 'Lo-fi', icon: '🎵' },
  { name: 'White Noise', icon: '📻' },
  { name: 'Ocean', icon: '🌊' },
];

const defaultBlockedSites = [
  { name: 'Instagram', icon: '📸' },
  { name: 'YouTube', icon: '▶️' },
  { name: 'Twitter', icon: '🐦' },
  { name: 'Reddit', icon: '🔴' },
  { name: 'TikTok', icon: '🎵' },
];

export default function FocusPage() {
  const [mode, setMode] = useState(25);
  const [activePreset, setActivePreset] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSounds, setActiveSounds] = useState<string[]>([]);
  const [blockedSites, setBlockedSites] = useState<Record<string, boolean>>({
    Instagram: true, YouTube: true, Twitter: true, Reddit: false, TikTok: true,
  });
  const [sessions, setSessions] = useState(0);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer countdown
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    }
    if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setSessions(s => s + 1);
      setSessionCompleted(true);
      setTimeout(() => setSessionCompleted(false), 3000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, timeLeft]);

  const startPreset = useCallback((index: number) => {
    const preset = presets[index];
    setActivePreset(index);
    setMode(preset.mins);
    setTimeLeft(preset.mins * 60);
    setIsRunning(true);
    setSessionCompleted(false);
  }, []);

  const toggleTimer = () => {
    if (timeLeft === 0) {
      setTimeLeft(mode * 60);
    }
    setIsRunning(!isRunning);
    setSessionCompleted(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode * 60);
    setSessionCompleted(false);
  };

  const toggleSound = (name: string) => {
    setActiveSounds(prev => prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]);
  };

  const toggleBlockedSite = (name: string) => {
    setBlockedSites(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const totalSeconds = mode * 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0;
  const circumference = 2 * Math.PI * 90;

  if (isFullscreen) {
    return (
      <div className="focus-fullscreen">
        <div className="fs-ambient">
          <div className="fs-orb"></div>
          <div className="fs-orb fs-orb-2"></div>
        </div>
        <div className="fs-content">
          <p className="fs-mode-label">{presets[activePreset].label}</p>
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
              <span className="fs-digits">{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</span>
              <span className="fs-status">{isRunning ? 'FOCUSING' : timeLeft === 0 ? 'COMPLETE' : 'PAUSED'}</span>
            </div>
          </div>
          <div className="fs-controls">
            <button className="fs-btn" onClick={toggleTimer}>{isRunning ? '⏸' : '▶️'}</button>
            <button className="fs-btn" onClick={resetTimer}>⟲</button>
            <button className="fs-btn" onClick={() => setIsFullscreen(false)}>✕</button>
          </div>
          <div className="fs-sessions">
            {Array.from({ length: sessions }).map((_, i) => <span key={i} className="fs-session-dot">●</span>)}
            {sessions > 0 && <span className="fs-session-count">{sessions} session{sessions !== 1 ? 's' : ''}</span>}
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
          <p>Deep work center — AI-powered focus sessions for maximum productivity.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-primary btn-sm" onClick={() => setIsFullscreen(true)}>🖥️ Fullscreen Mode</button>
        </div>
      </div>

      {/* Session Complete Toast */}
      {sessionCompleted && (
        <div className="session-toast">
          <span>🎉</span>
          <p>Focus session complete! Great work. Take a break.</p>
        </div>
      )}

      <div className="focus-layout">
        {/* Timer Section */}
        <div className="focus-timer-section widget">
          <div className="timer-presets">
            {presets.map((p, i) => (
              <button key={i} className={`timer-preset-btn ${activePreset === i ? 'active' : ''}`}
                onClick={() => startPreset(i)}
                style={{ '--preset-color': p.color } as React.CSSProperties}>
                <span className="preset-label">{p.label}</span>
                <span className="preset-time">{p.mins} min</span>
              </button>
            ))}
          </div>

          <div className="timer-display">
            <svg viewBox="0 0 200 200" className="timer-ring">
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
              <span className="timer-digits">{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</span>
              <span className="timer-label">{isRunning ? 'FOCUSING' : timeLeft === 0 ? '✅ COMPLETE' : 'READY'}</span>
            </div>
          </div>

          <div className="timer-controls">
            <button className="timer-ctrl-btn" onClick={resetTimer} title="Reset">⟲</button>
            <button className={`timer-play-btn ${isRunning ? 'playing' : ''}`} onClick={toggleTimer}>
              {isRunning ? '⏸' : '▶️'}
            </button>
            <button className="timer-ctrl-btn" onClick={() => { setSessions(s => s + 1); }} title="Add Session">+1</button>
          </div>

          <div className="session-counter">
            <span className="session-label">Sessions Today:</span>
            <span className="session-dots">
              {Array.from({ length: Math.min(sessions, 12) }).map((_, i) => (
                <span key={i} className="session-dot-filled">●</span>
              ))}
            </span>
            <span className="session-num">{sessions}</span>
          </div>
        </div>

        {/* Right Panel */}
        <div className="focus-right">
          {/* AI Session Suggestions */}
          <div className="widget focus-ai-session">
            <div className="widget-header"><h4>🤖 AI Focus Sessions</h4></div>
            <div className="ai-session-list">
              <div className="ai-session-item" onClick={() => startPreset(0)}>
                <span className="session-emoji">📚</span>
                <div>
                  <span className="session-name">Study Sprint</span>
                  <span className="session-desc">25 min focused study</span>
                </div>
                <span className="session-arrow">→</span>
              </div>
              <div className="ai-session-item" onClick={() => { setMode(50); setTimeLeft(50 * 60); setIsRunning(true); }}>
                <span className="session-emoji">📝</span>
                <div>
                  <span className="session-name">Assignment Sprint</span>
                  <span className="session-desc">50 min deep work</span>
                </div>
                <span className="session-arrow">→</span>
              </div>
              <div className="ai-session-item" onClick={() => { setMode(90); setTimeLeft(90 * 60); setIsRunning(true); }}>
                <span className="session-emoji">🎯</span>
                <div>
                  <span className="session-name">Exam Mode</span>
                  <span className="session-desc">90 min intensive</span>
                </div>
                <span className="session-arrow">→</span>
              </div>
            </div>
          </div>

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
            <span className="focus-stat-val">{(sessions * (mode / 60)).toFixed(1)}h</span>
            <span className="focus-stat-lbl">Today's Focus</span>
          </div>
          <div className="focus-stat-card">
            <span className="focus-stat-icon">📈</span>
            <span className="focus-stat-val">{sessions}</span>
            <span className="focus-stat-lbl">Sessions Done</span>
          </div>
          <div className="focus-stat-card">
            <span className="focus-stat-icon">🕐</span>
            <span className="focus-stat-val">2-4 PM</span>
            <span className="focus-stat-lbl">Peak Hours</span>
          </div>
          <div className="focus-stat-card">
            <span className="focus-stat-icon">🚫</span>
            <span className="focus-stat-val">{Object.values(blockedSites).filter(Boolean).length}</span>
            <span className="focus-stat-lbl">Sites Blocked</span>
          </div>
        </div>
      </div>
    </div>
  );
}
