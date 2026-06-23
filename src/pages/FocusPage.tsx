import { useState, useEffect, useRef } from 'react';
import './FocusPage.css';

const sounds = [
  { name: 'Rain', icon: '🌧️', active: false },
  { name: 'Cafe', icon: '☕', active: false },
  { name: 'Forest', icon: '🌲', active: false },
  { name: 'Lo-fi', icon: '🎵', active: false },
  { name: 'White Noise', icon: '📻', active: false },
  { name: 'Ocean', icon: '🌊', active: false },
];

const blockedSites = [
  { name: 'Instagram', icon: '📸', blocked: true },
  { name: 'YouTube', icon: '▶️', blocked: true },
  { name: 'Twitter', icon: '🐦', blocked: true },
  { name: 'Reddit', icon: '🔴', blocked: false },
  { name: 'TikTok', icon: '🎵', blocked: true },
];

export default function FocusPage() {
  const [mode, setMode] = useState(25);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSounds, setActiveSounds] = useState<string[]>([]);
  const [sessions, setSessions] = useState(3);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, timeLeft]);

  const startTimer = (mins: number) => {
    setMode(mins);
    setTimeLeft(mins * 60);
    setIsRunning(true);
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => { setIsRunning(false); setTimeLeft(mode * 60); };

  const toggleSound = (name: string) => {
    setActiveSounds(prev => prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]);
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const progress = ((mode * 60 - timeLeft) / (mode * 60)) * 100;

  if (isFullscreen) {
    return (
      <div className="focus-fullscreen">
        <div className="fs-ambient">
          <div className="fs-orb"></div>
        </div>
        <div className="fs-content">
          <p className="fs-task">📝 Physics Assignment</p>
          <div className="fs-timer">
            <svg viewBox="0 0 200 200" className="fs-ring">
              <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="4" />
              <circle cx="100" cy="100" r="90" fill="none" stroke="url(#focusGrad)" strokeWidth="4"
                strokeLinecap="round" strokeDasharray="565.5"
                strokeDashoffset={565.5 - (progress / 100) * 565.5}
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
              <span className="fs-mode">{mode} min session</span>
            </div>
          </div>
          <div className="fs-controls">
            <button className="fs-btn" onClick={toggleTimer}>{isRunning ? '⏸' : '▶️'}</button>
            <button className="fs-btn" onClick={resetTimer}>⟲</button>
            <button className="fs-btn" onClick={() => setIsFullscreen(false)}>✕</button>
          </div>
          <div className="fs-progress-text">{Math.round(progress)}% complete</div>
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

      <div className="focus-layout">
        {/* Timer Section */}
        <div className="focus-timer-section widget">
          <div className="timer-modes">
            {[25, 50, 90].map(m => (
              <button key={m} className={`timer-mode-btn ${mode === m && !isRunning ? 'active' : ''}`} onClick={() => startTimer(m)}>
                {m} min
              </button>
            ))}
          </div>

          <div className="timer-display">
            <svg viewBox="0 0 200 200" className="timer-ring">
              <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="5" />
              <circle cx="100" cy="100" r="90" fill="none" stroke="url(#timerGrad)" strokeWidth="5"
                strokeLinecap="round" strokeDasharray="565.5"
                strokeDashoffset={565.5 - (progress / 100) * 565.5}
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
              <span className="timer-label">{isRunning ? 'FOCUSING' : 'READY'}</span>
            </div>
          </div>

          <div className="timer-controls">
            <button className="timer-ctrl-btn" onClick={resetTimer}>⟲</button>
            <button className={`timer-play-btn ${isRunning ? 'playing' : ''}`} onClick={toggleTimer}>
              {isRunning ? '⏸' : '▶️'}
            </button>
            <button className="timer-ctrl-btn" onClick={() => setSessions(s => s + 1)}>+1</button>
          </div>

          <div className="session-counter">
            <span>Sessions Today: {sessions}</span>
            <span className="session-dots">
              {Array.from({ length: sessions }).map((_, i) => <span key={i} className="session-dot-filled">●</span>)}
            </span>
          </div>
        </div>

        {/* Right Panel */}
        <div className="focus-right">
          {/* AI Session */}
          <div className="widget focus-ai-session">
            <div className="widget-header"><h4>🤖 AI Focus Sessions</h4></div>
            <div className="ai-session-list">
              <div className="ai-session-item" onClick={() => startTimer(25)}>
                <span className="session-emoji">📚</span>
                <div>
                  <span className="session-name">Study Sprint</span>
                  <span className="session-desc">25 min focused study</span>
                </div>
              </div>
              <div className="ai-session-item" onClick={() => startTimer(50)}>
                <span className="session-emoji">📝</span>
                <div>
                  <span className="session-name">Assignment Sprint</span>
                  <span className="session-desc">50 min deep work</span>
                </div>
              </div>
              <div className="ai-session-item" onClick={() => startTimer(90)}>
                <span className="session-emoji">🎯</span>
                <div>
                  <span className="session-name">Exam Mode</span>
                  <span className="session-desc">90 min intensive</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ambient Sounds */}
          <div className="widget focus-sounds">
            <div className="widget-header"><h4>🎶 Ambient Sounds</h4></div>
            <div className="sound-grid">
              {sounds.map(s => (
                <button key={s.name} className={`sound-btn ${activeSounds.includes(s.name) ? 'active' : ''}`} onClick={() => toggleSound(s.name)}>
                  <span className="sound-icon">{s.icon}</span>
                  <span className="sound-name">{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Website Blocker */}
          <div className="widget focus-blocker">
            <div className="widget-header"><h4>🚫 Website Blocker</h4></div>
            <div className="blocked-list">
              {blockedSites.map(site => (
                <div key={site.name} className="blocked-item">
                  <span>{site.icon} {site.name}</span>
                  <div className={`block-toggle ${site.blocked ? 'on' : ''}`}>
                    <div className="toggle-thumb"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Focus Analytics */}
      <div className="focus-analytics widget">
        <div className="widget-header"><h4>📊 Focus Analytics</h4></div>
        <div className="focus-stats-grid">
          <div className="focus-stat-card">
            <span className="focus-stat-val">4.5h</span>
            <span className="focus-stat-lbl">Today's Focus</span>
          </div>
          <div className="focus-stat-card">
            <span className="focus-stat-val">29.1h</span>
            <span className="focus-stat-lbl">This Week</span>
          </div>
          <div className="focus-stat-card">
            <span className="focus-stat-val">2-4 PM</span>
            <span className="focus-stat-lbl">Peak Hours</span>
          </div>
          <div className="focus-stat-card">
            <span className="focus-stat-val">12</span>
            <span className="focus-stat-lbl">Distractions Blocked</span>
          </div>
        </div>
      </div>
    </div>
  );
}
