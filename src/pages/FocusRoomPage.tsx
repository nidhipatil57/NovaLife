import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDataContext, type FocusSession } from '../context/DataContext';
import './FocusRoomPage.css';

interface RoomDef {
  id: string;
  name: string;
  icon: string;
  theme: 'forest' | 'cafe' | 'library' | 'space';
  soundUrl: string;
  soundName: string;
  description: string;
  defaultCount: number;
}

const ROOM_DEFS: Record<string, RoomDef> = {
  forest: {
    id: 'forest',
    name: 'Deep Work Forest',
    icon: '🌲',
    theme: 'forest',
    soundUrl: 'https://cdn.jsdelivr.net/gh/karthiknvd/noctune@master/sounds/forest.mp3',
    soundName: 'Forest Rain & Wind',
    description: 'A serene green canopy with the soothing rustle of trees and soft rain.',
    defaultCount: 14,
  },
  cafe: {
    id: 'cafe',
    name: 'Lofi Study Cafe',
    icon: '☕',
    theme: 'cafe',
    soundUrl: 'https://cdn.jsdelivr.net/gh/karthiknvd/noctune@master/sounds/cafe.mp3',
    soundName: 'Calm Lofi Cafe Ambience',
    description: 'Charming coffee shop background noise blended with simulated keyboard clicks.',
    defaultCount: 8,
  },
  library: {
    id: 'library',
    name: 'Rainy Library',
    icon: '🌧️',
    theme: 'library',
    soundUrl: 'https://cdn.jsdelivr.net/gh/karthiknvd/noctune@master/sounds/rain.mp3',
    soundName: 'Calm library rain',
    description: 'A quiet archive room with heavy rain tapping against tall windows.',
    defaultCount: 19,
  },
  space: {
    id: 'space',
    name: 'Cosmic Observatory',
    icon: '🌌',
    theme: 'space',
    soundUrl: 'https://cdn.jsdelivr.net/gh/karthiknvd/noctune@master/sounds/wind.mp3',
    soundName: 'Soothing Deep Space Drone',
    description: 'Float in a silent orbit, enveloped by a calming stellar hum.',
    defaultCount: 6,
  },
};

const RANDOM_TICKER_PHRASES = [
  "is focusing deeply",
  "joined the quiet space",
  "started a Pomodoro",
  "completed a focus session 🎉",
  "is sketching concepts",
  "took a deep breath",
  "wrote a line of code",
];

const RANDOM_NAMES = [
  "Rian", "Leo", "Emma", "Sofia", "Marcus", "Siddharth", "Amina", "Chloe", "Arjun", "Yuki", "Lukas", "Elena"
];

const MOTIVATIONAL_QUOTES = [
  { text: "Your focus determines your reality.", author: "Qui-Gon Jinn" },
  { text: "Starve your distractions, feed your focus.", author: "Unknown" },
  { text: "Focus is a muscle, and you are building it right now.", author: "NovaLife" },
  { text: "Deep work is not about working more, it is about working deeply.", author: "Cal Newport" },
  { text: "Only those who risk going too far can possibly find out how far one can go.", author: "T.S. Eliot" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "One step at a time. One breath at a time. One session at a time.", author: "NovaLife" }
];

export default function FocusRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const room = ROOM_DEFS[roomId || 'forest'] || ROOM_DEFS.forest;
  const { addFocusSession } = useDataContext();

  // State
  const [participantsCount, setParticipantsCount] = useState(room.defaultCount);
  const [timerType, setTimerType] = useState<'pomo' | 'deep' | 'break' | 'custom'>('pomo');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [initialSeconds, setInitialSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('45');
  const [showCustomInput, setShowCustomInput] = useState(false);
  
  // Audio state
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  
  // Guided breathing state
  const [isBreathingMode, setIsBreathingMode] = useState(false);
  const [breathText, setBreathText] = useState('Breathe In');
  const [breathStage, setBreathStage] = useState<'in' | 'hold' | 'out'>('in');

  // Immersive Fullscreen and Completion state
  const [isImmersive, setIsImmersive] = useState<boolean>(false);
  const [sessionState, setSessionState] = useState<'setup' | 'active' | 'complete'>('setup');
  const [distractionsCount, setDistractionsCount] = useState<number>(0);
  const [focusScore, setFocusScore] = useState<number>(100);
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [sessionName, setSessionName] = useState<string>('');
  const [completionSession, setCompletionSession] = useState<Partial<FocusSession> | null>(null);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [quoteIdx, setQuoteIdx] = useState<number>(0);

  useEffect(() => {
    setQuoteIdx(Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length));
  }, []);



  // Live Activity Ticker state
  const [tickerActivity, setTickerActivity] = useState<string>('Alex joined the quiet space.');

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const breathIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Handlers declared early to avoid hoisting issues
  const handleSessionCompleted = () => {
    setIsTimerRunning(false);
    setIsImmersive(false);
    
    // Play alert sound
    try {
      const alertAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav');
      alertAudio.volume = 0.3;
      alertAudio.play();
    } catch (e) {
      console.error(e);
    }

    const percentage = Math.round((secondsElapsed / initialSeconds) * 100);
    const textReflect = `You completed ${percentage}% of your intended focus session in the ${room.name}. Your focus remained strong with a final Focus Score of ${focusScore}%. ${
      distractionsCount > 0 
        ? `You noted ${distractionsCount} distraction moments. Minimizing these will boost retention.` 
        : "No distractions were recorded—exceptional concentration!"
    } Keep this flow going!`;

    const achievements = [];
    if (focusScore >= 95) achievements.push("Laser Focus");
    if (secondsElapsed >= 50 * 60) achievements.push("Deep Diver");
    if (distractionsCount === 0) achievements.push("Distraction-Free");

    setCompletionSession({
      name: sessionName.trim() || `Focus Session - ${room.name}`,
      notes: sessionNotes,
      duration: secondsElapsed,
      room: room.id,
      task_id: null,
      goal_id: null,
      focus_score: focusScore,
      completion_status: secondsLeft <= 2 ? 'completed' : 'interrupted',
      ai_reflection: textReflect,
      distractions_count: distractionsCount,
      achievements: achievements,
      session_goal: '',
      completed_subtasks: []
    });

    setSessionState('complete');
  };

  const handleSaveCompletedSession = async () => {
    if (!completionSession) return;
    try {
      await addFocusSession({
        name: completionSession.name || 'Focus Session',
        notes: completionSession.notes || '',
        duration: completionSession.duration || 0,
        room: completionSession.room,
        task_id: completionSession.task_id,
        goal_id: completionSession.goal_id,
        focus_score: completionSession.focus_score,
        completion_status: completionSession.completion_status,
        ai_reflection: completionSession.ai_reflection,
        distractions_count: completionSession.distractions_count,
        achievements: completionSession.achievements,
        session_goal: '',
        completed_subtasks: []
      });
      navigate('/focus');
    } catch (e) {
      console.error(e);
    }
  };

  // Set initial timer values
  const setTimerPreset = (type: 'pomo' | 'deep' | 'break' | 'custom', seconds: number) => {
    setIsTimerRunning(false);
    setTimerType(type);
    setSecondsLeft(seconds);
    setInitialSeconds(seconds);
    setShowCustomInput(type === 'custom');
  };

  // Handle timer tick
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            handleSessionCompleted();
            return 0;
          }
          return prev - 1;
        });
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimerRunning]);

  // Audio setup
  useEffect(() => {
    const audio = new Audio(room.soundUrl);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    // Automatically try to play (muted first to satisfy browser autoplay restrictions if needed)
    audio.play().then(() => {
      setIsAudioLoaded(true);
    }).catch(err => {
      console.log("Autoplay blocked. User interaction required to play audio:", err);
      // Try unmuted immediately on user interaction
    });

    return () => {
      audio.pause();
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.soundUrl]);

  // Audio volume / mute sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Simulated live activity & participant count changes
  useEffect(() => {
    tickerIntervalRef.current = setInterval(() => {
      // Occasional participant count change (+1 or -1)
      const change = Math.random() > 0.6 ? (Math.random() > 0.5 ? 1 : -1) : 0;
      setParticipantsCount(prev => {
        const next = prev + change;
        return next < 2 ? 2 : next;
      });

      // Ticker phrase
      const randomName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
      const randomPhrase = RANDOM_TICKER_PHRASES[Math.floor(Math.random() * RANDOM_TICKER_PHRASES.length)];
      setTickerActivity(`${randomName} ${randomPhrase}.`);
    }, 15000); // every 15s

    return () => {
      if (tickerIntervalRef.current) clearInterval(tickerIntervalRef.current);
    };
  }, []);

  // Guided breathing loop
  useEffect(() => {
    if (isBreathingMode) {
      let stage: 'in' | 'hold' | 'out' = 'in';
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBreathText('Breathe In...');
      setBreathStage('in');

      breathIntervalRef.current = setInterval(() => {
        if (stage === 'in') {
          stage = 'hold';
          setBreathText('Hold...');
          setBreathStage('hold');
        } else if (stage === 'hold') {
          stage = 'out';
          setBreathText('Breathe Out...');
          setBreathStage('out');
        } else {
          stage = 'in';
          setBreathText('Breathe In...');
          setBreathStage('in');
        }
      }, 4000); // 4 seconds per phase
    } else {
      if (breathIntervalRef.current) {
        clearInterval(breathIntervalRef.current);
      }
    }

    return () => {
      if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);
    };
  }, [isBreathingMode]);





  // Helper formatting
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(customMinutes);
    if (!isNaN(mins) && mins > 0 && mins <= 180) {
      setTimerPreset('custom', mins * 60);
    }
  };

  // Calculate timer progress percentage for SVG ring
  const timerProgress = initialSeconds > 0 ? (secondsLeft / initialSeconds) * 100 : 0;
  const strokeDashoffset = 628 - (628 * timerProgress) / 100;



  return (
    <div className={`focus-room-container theme-${room.theme} ${isImmersive ? 'immersive-active' : ''}`}>
      {/* Background Calm Particles */}
      <div className="calm-particles">
        {[...Array(12)].map((_, i) => (
          <div key={i} className={`room-particle p-${i + 1}`} />
        ))}
      </div>

      {/* Exit Immersive Button floating */}
      {isImmersive && (
        <button className="exit-immersive-btn" onClick={() => setIsImmersive(false)}>
          ✕ Exit Full Screen
        </button>
      )}

      {/* Header bar */}
      <header className="room-header">
        <button className="back-btn" onClick={() => { setIsImmersive(false); navigate('/focus'); }}>
          ✕ Exit Room
        </button>
        <div className="room-title-section">
          <span className="room-icon-badge">{room.icon}</span>
          <div>
            <h2>{room.name}</h2>
            <p className="room-desc-subtitle">{room.description}</p>
          </div>
        </div>
        <div className="header-actions-group" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="immersive-toggle-btn" onClick={() => setIsImmersive(true)}>
            🖥️ Full Screen Focus
          </button>
          <div className="room-status-badge">
            <span className="pulse-indicator"></span>
            <span className="participants-count">{participantsCount} Active Focusers</span>
          </div>
        </div>
      </header>

      {sessionState !== 'complete' ? (
        // Swapped Grid Columns: Timer Left, 3 Boxes Right
        <main className="room-grid">
          
          {/* Center Panel: Beautiful Focus Timer (NOW ON LEFT) */}
          <section className="room-panel room-center-panel">
            <div className="room-card timer-main-card">
              
              {/* Session Setup Inputs inside Room workspace */}
              <div className="room-session-setup-form" style={{ marginTop: 0, marginBottom: '20px' }}>
                <div className="form-group">
                  <label>Focus Session Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter what you are focusing on..." 
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    className="setup-select"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 12px', borderRadius: '8px' }}
                  />
                </div>
              </div>

              {/* Presets */}
              <div className="timer-presets">
                <button 
                  className={`preset-btn ${timerType === 'pomo' ? 'active' : ''}`}
                  onClick={() => setTimerPreset('pomo', 25 * 60)}
                >
                  🍅 Pomodoro (25m)
                </button>
                <button 
                  className={`preset-btn ${timerType === 'deep' ? 'active' : ''}`}
                  onClick={() => setTimerPreset('deep', 50 * 60)}
                >
                  🌲 Deep Focus (50m)
                </button>
                <button 
                  className={`preset-btn ${timerType === 'break' ? 'active' : ''}`}
                  onClick={() => setTimerPreset('break', 15 * 60)}
                >
                  ☕ Break (15m)
                </button>
                <button 
                  className={`preset-btn ${timerType === 'custom' ? 'active' : ''}`}
                  onClick={() => setTimerPreset('custom', 45 * 60)}
                >
                  ⚙️ Custom
                </button>
              </div>

              {/* Custom Input */}
              {showCustomInput && (
                <form onSubmit={handleCustomSubmit} className="custom-timer-form">
                  <label>Minutes (1-180): </label>
                  <input 
                    type="number" 
                    min="1" 
                    max="180" 
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    className="custom-timer-input"
                  />
                  <button type="submit" className="custom-timer-submit">Set</button>
                </form>
              )}

              {/* Timer Visualizer */}
              <div className="timer-visual-container">
                <svg className="timer-svg" viewBox="0 0 250 250" width="250" height="250">
                  <g transform="rotate(-90 125 125)">
                    <circle className="timer-circle-bg" cx="125" cy="125" r="100" />
                    <circle 
                      className="timer-circle-progress" 
                      cx="125" 
                      cy="125" 
                      r="100" 
                      style={{ strokeDashoffset }}
                    />
                  </g>
                </svg>
                <div className="timer-digits-overlay">
                  <span className="timer-countdown">{formatTime(secondsLeft)}</span>
                  <span className="timer-label">{timerType === 'pomo' ? 'Pomodoro' : timerType === 'deep' ? 'Deep Focus' : timerType === 'break' ? 'Short Break' : 'Focus Session'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="timer-actions-row">
                <button 
                  className={`timer-control-btn btn-main-action ${isTimerRunning ? 'btn-pause' : 'btn-start'}`}
                  onClick={async () => {
                    if (!isTimerRunning && sessionState === 'setup') {
                      setSessionState('active');
                      setSecondsElapsed(0);
                      setIsTimerRunning(true);
                    } else {
                      setIsTimerRunning(!isTimerRunning);
                    }
                  }}
                >
                  {isTimerRunning ? '⏸ Pause Focus' : '▶ Start Focus'}
                </button>
                <button 
                  className="timer-control-btn btn-reset-action"
                  onClick={() => setTimerPreset(timerType, initialSeconds)}
                >
                  ⟲ Reset
                </button>

                {sessionState === 'active' && (
                  <button 
                    className="timer-control-btn btn-finish-action"
                    onClick={handleSessionCompleted}
                  >
                    ⏹ Finish & Reflect
                  </button>
                )}
              </div>

              {/* Active task/goal feedback label */}
              {sessionState === 'active' && (
                <div className="active-feedback-status">
                  <span>🎯 Running Session: <strong>{sessionName || 'Focus block'}</strong></span>
                  <span className="active-meta-score">Focus Score: {focusScore}% • <span className="log-distract-link" onClick={() => { setDistractionsCount(prev => prev + 1); setFocusScore(p => Math.max(20, p - 8)); }}>Log Distraction ({distractionsCount})</span></span>
                </div>
              )}
              
              {/* Privacy Assurance */}
              <div className="privacy-assurance">
                <span>🔒 <strong>Privacy Protected</strong>: Your camera, microphone, and screen are completely private. Only your focused presence is shared.</span>
              </div>
            </div>

            {/* Live Activity Ticker */}
            <div className="room-card ticker-card">
              <h3>⚡ Live Activity Feed</h3>
              <div className="ticker-content">
                <span className="ticker-icon">⚡</span>
                <span className="ticker-text">{tickerActivity}</span>
              </div>
            </div>
          </section>

          {/* Left Panel: Audio, Breathing, Avatars (NOW ON RIGHT) */}
          <section className="room-panel room-left-panel">
            
            {/* Silent Workspace Audio */}
            <div className="room-card ambient-card">
              <h3>🎧 Silent Workspace Audio</h3>
              <p className="card-desc">Play calming loops to mask environmental noise and maintain absolute focus.</p>
              
              <div className="audio-controls-row">
                <button 
                  className={`audio-toggle-btn ${isMuted ? 'muted' : 'playing'}`}
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? '🔇 Muted' : '🔊 Playing Ambient'}
                </button>
                <div className="volume-slider-group">
                  <span className="volume-icon">🔈</span>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05" 
                    value={volume}
                    onChange={(e) => {
                      setVolume(parseFloat(e.target.value));
                      setIsMuted(false);
                    }}
                    className="volume-slider"
                  />
                  <span className="volume-icon">🔊</span>
                </div>
              </div>
              <p className="audio-status-name">Track: <em>{room.soundName}</em> {isAudioLoaded ? '(Loaded)' : '(Loading...)'}</p>
            </div>

            {/* Guided Breathing */}
            <div className="room-card breathing-card">
              <div className="card-header-toggle">
                <h3>🧘 Guided Breathing Guide</h3>
                <div className="toggle-switch-wrapper" onClick={() => setIsBreathingMode(!isBreathingMode)}>
                  <div className={`toggle-switch-track ${isBreathingMode ? 'active' : ''}`}>
                    <div className="toggle-switch-thumb"></div>
                  </div>
                </div>
              </div>
              <p className="card-desc">Synchronize your breathing to relax your nervous system and expand cognitive endurance.</p>

              {isBreathingMode ? (
                <div className="breathing-session">
                  <div className={`breathing-circle-outer stage-${breathStage}`}>
                    <div className="breathing-circle-inner">
                      <span className="breathing-text">{breathText}</span>
                    </div>
                  </div>
                  <div className="breathing-tip">Follow the expanding and contracting circle.</div>
                </div>
              ) : (
                <div className="breathing-placeholder">
                  <p>Toggle the breathing switch to display the pacing ring.</p>
                </div>
              )}
            </div>

            {/* Motivational Quote Box */}
            <div className="room-card motivation-quote-card">
              <h3>✨ Focus Inspiration</h3>
              <div className="quote-content">
                <p className="quote-text">"{MOTIVATIONAL_QUOTES[quoteIdx]?.text}"</p>
                <span className="quote-author">— {MOTIVATIONAL_QUOTES[quoteIdx]?.author}</span>
              </div>
              <button 
                className="quote-refresh-btn" 
                onClick={() => setQuoteIdx((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length)}
              >
                🔄 Next Quote
              </button>
            </div>
          </section>

        </main>
      ) : (
        // Completion Screen (Visual layout for saving the session after timer finishes)
        <div className="room-grid" style={{ gridTemplateColumns: '1fr', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)' }}>
          <div className="workspace-card completion-summary-card" style={{ maxWidth: '600px', margin: 'auto', background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '30px' }}>
            <div className="completion-confetti" style={{ fontSize: '40px', textAlign: 'center', marginBottom: '10px' }}>🎉</div>
            <h2 style={{ textAlign: 'center', color: 'white', marginBottom: '6px' }}>Session Complete!</h2>
            <p className="summary-intro" style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', marginBottom: '24px' }}>Excellent job. Review your session reflections below before logging it in history.</p>

            <div className="completion-summary-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div className="form-group" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Verify / Rename Focus Session Name</label>
                <input 
                  type="text" 
                  value={completionSession?.name || ''} 
                  onChange={(e) => setCompletionSession(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="completion-rename-input"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px 12px', borderRadius: '8px', fontSize: '13px' }}
                />
              </div>

              <div className="summary-field" style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: '#94a3b8', fontSize: '10px' }}>Room Utilized</span>
                <strong style={{ color: 'white', fontSize: '13px' }}>{room.name}</strong>
              </div>

              <div className="summary-field" style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: '#94a3b8', fontSize: '10px' }}>Duration Completed</span>
                <strong style={{ color: 'white', fontSize: '13px' }}>{formatTime(completionSession?.duration || 0)}</strong>
              </div>

              <div className="summary-field" style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: '#94a3b8', fontSize: '10px' }}>Focus Score Earned</span>
                <strong className="score-green" style={{ color: '#10b981', fontSize: '13px' }}>{completionSession?.focus_score}%</strong>
              </div>

              <div className="summary-field" style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: '#94a3b8', fontSize: '10px' }}>Distractions Counted</span>
                <strong style={{ color: 'white', fontSize: '13px' }}>{completionSession?.distractions_count || 0}</strong>
              </div>

              {completionSession?.ai_reflection && (
                <div className="summary-field" style={{ gridColumn: 'span 2', background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '10px' }}>🤖 AI Reflection Insight</span>
                  <p style={{ color: '#e2e8f0', fontSize: '12px', margin: 0, lineHeight: 1.4 }}>{completionSession.ai_reflection}</p>
                </div>
              )}

              <div className="form-group" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 700 }}>Autosaved Focus Notes</label>
                <textarea 
                  value={sessionNotes} 
                  onChange={(e) => {
                    setSessionNotes(e.target.value);
                    setCompletionSession(prev => prev ? { ...prev, notes: e.target.value } : null);
                  }}
                  className="completion-notes-textarea"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', height: '80px', resize: 'none' }}
                  placeholder="Add any extra thoughts..."
                />
              </div>
            </div>

            <div className="completion-action-buttons" style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button className="btn-save-summary" onClick={handleSaveCompletedSession} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--theme-accent, #10b981)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                💾 Save Session to History
              </button>
              <button className="btn-discard-summary" onClick={() => { setCompletionSession(null); setSessionState('setup'); }} style={{ padding: '12px 18px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', fontWeight: 700, cursor: 'pointer' }}>
                🗑️ Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
