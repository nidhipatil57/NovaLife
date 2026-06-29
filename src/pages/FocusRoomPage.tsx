import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    soundUrl: 'https://cdn.jsdelivr.net/gh/stu442/pomodoro-web@master/public/sounds/coffeeshop.mp3',
    soundName: 'Warm Cafe & Keyboard Murmur',
    description: 'Charming coffee shop background noise blended with simulated keyboard clicks.',
    defaultCount: 8,
  },
  library: {
    id: 'library',
    name: 'Rainy Library',
    icon: '🌧️',
    theme: 'library',
    soundUrl: 'https://cdn.jsdelivr.net/gh/YoyoZhang24/RelaX50@master/audios/rain.mp3',
    soundName: 'Steady Rain against Glass',
    description: 'A quiet archive room with heavy rain tapping against tall windows.',
    defaultCount: 19,
  },
  space: {
    id: 'space',
    name: 'Cosmic Observatory',
    icon: '🌌',
    theme: 'space',
    soundUrl: 'https://cdn.jsdelivr.net/gh/karthiknvd/noctune@master/sounds/wind.mp3',
    soundName: 'Cosmic Wind & Space Synth',
    description: 'Float in a silent orbit, enveloped by a calming stellar hum.',
    defaultCount: 6,
  },
};

interface MessageItem {
  id: string;
  author: string;
  text: string;
  time: string;
  avatarColor: string;
}

const INITIAL_MOTIVATIONS: Record<string, MessageItem[]> = {
  forest: [
    { id: '1', author: 'ZenCoder', text: 'Taking it one step at a time. The trees aren\'t rushing, neither should you.', time: 'Just now', avatarColor: 'linear-gradient(135deg, #10b981, #059669)' },
    { id: '2', author: 'Clara_P', text: 'Starting a 50m session on my report. Let\'s do this!', time: '2m ago', avatarColor: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
    { id: '3', author: 'NatureLover', text: 'The atmosphere in this forest room is so grounding.', time: '5m ago', avatarColor: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  ],
  cafe: [
    { id: '1', author: 'CaffeineRush', text: 'Coffee is hot, keyboard is ready. Time to study.', time: 'Just now', avatarColor: 'linear-gradient(135deg, #844d36, #472615)' },
    { id: '2', author: 'VibeCheck', text: 'This ambient chatter makes me feel like I\'m not alone. Super helpful!', time: '1m ago', avatarColor: 'linear-gradient(135deg, #ec4899, #db2777)' },
    { id: '3', author: 'Dev_Sarah', text: 'Debugging React hooks. Wish me luck!', time: '6m ago', avatarColor: 'linear-gradient(135deg, #10b981, #059669)' },
  ],
  library: [
    { id: '1', author: 'Bookworm', text: 'Deep studying history tonight. Silent study partners are the best!', time: 'Just now', avatarColor: 'linear-gradient(135deg, #6366f1, #4f46e5)' },
    { id: '2', author: 'QuietGuy', text: 'Shh... only coding. 🤐 Let\'s focus!', time: '4m ago', avatarColor: 'linear-gradient(135deg, #6b7280, #4b5563)' },
    { id: '3', author: 'PhD_Hopeful', text: 'Writing Chapter 3. Almost there.', time: '10m ago', avatarColor: 'linear-gradient(135deg, #f43f5e, #e11d48)' },
  ],
  space: [
    { id: '1', author: 'Nebula', text: 'We are all tiny, but our goals are infinite. Keep pushing!', time: 'Just now', avatarColor: 'linear-gradient(135deg, #a855f7, #7c3aed)' },
    { id: '2', author: 'Stargazer', text: 'No distractions out here. Just absolute focus.', time: '3m ago', avatarColor: 'linear-gradient(135deg, #06b6d4, #0891b2)' },
    { id: '3', author: 'Apollo11', text: 'T-minus 10 minutes to finish this essay.', time: '8m ago', avatarColor: 'linear-gradient(135deg, #ef4444, #dc2626)' },
  ],
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

export default function FocusRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const room = ROOM_DEFS[roomId || 'forest'] || ROOM_DEFS.forest;

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

  // Motivation Wall state
  const [messages, setMessages] = useState<MessageItem[]>(INITIAL_MOTIVATIONS[room.id] || []);
  const [inputText, setInputText] = useState('');

  // Live Activity Ticker state
  const [tickerActivity, setTickerActivity] = useState<string>('Alex joined the quiet space.');

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const breathIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
            // Play a gentle alert sound
            try {
              const alertAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav');
              alertAudio.volume = 0.3;
              alertAudio.play();
            } catch (e) {
              console.error(e);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
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

  // Handle post message
  const handlePostMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage: MessageItem = {
      id: Date.now().toString(),
      author: 'You',
      text: inputText.trim(),
      time: 'Just now',
      avatarColor: 'linear-gradient(135deg, var(--accent-blue, #3b82f6), #1d4ed8)',
    };

    setMessages(prev => [newMessage, ...prev]);
    setInputText('');
  };

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
  const strokeDashoffset = 502 - (502 * timerProgress) / 100;

  // Render static mock avatars for pulsing active users
  const mockAvatars = [
    { initials: 'AH', color: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
    { initials: 'TL', color: 'linear-gradient(135deg, #10b981, #059669)' },
    { initials: 'MX', color: 'linear-gradient(135deg, #f59e0b, #d97706)' },
    { initials: 'KP', color: 'linear-gradient(135deg, #a855f7, #7c3aed)' },
    { initials: 'YJ', color: 'linear-gradient(135deg, #ec4899, #db2777)' },
  ];

  return (
    <div className={`focus-room-container theme-${room.theme}`}>
      {/* Background Calm Particles */}
      <div className="calm-particles">
        {[...Array(12)].map((_, i) => (
          <div key={i} className={`room-particle p-${i + 1}`} />
        ))}
      </div>

      {/* Header bar */}
      <header className="room-header">
        <button className="back-btn" onClick={() => navigate('/focus')}>
          ✕ Exit Room
        </button>
        <div className="room-title-section">
          <span className="room-icon-badge">{room.icon}</span>
          <div>
            <h2>{room.name}</h2>
            <p className="room-desc-subtitle">{room.description}</p>
          </div>
        </div>
        <div className="room-status-badge">
          <span className="pulse-indicator"></span>
          <span className="participants-count">{participantsCount} Active Focusers</span>
        </div>
      </header>

      {/* Main Grid */}
      <main className="room-grid">
        {/* Left Side: Breathing & Sound Controls & Info */}
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

          {/* Active Avatars */}
          <div className="room-card active-avatars-card">
            <h3>👥 Focusing Silently</h3>
            <div className="avatars-list">
              {mockAvatars.slice(0, Math.min(participantsCount - 1, mockAvatars.length)).map((av, idx) => (
                <div key={idx} className="avatar-circle-glowing" style={{ background: av.color }}>
                  {av.initials}
                </div>
              ))}
              {participantsCount > mockAvatars.length + 1 && (
                <div className="avatar-circle-glowing count-extra">
                  +{participantsCount - mockAvatars.length - 1}
                </div>
              )}
            </div>
            <p className="avatars-desc">Silent presence creates shared accountability while maintaining absolute privacy.</p>
          </div>
        </section>

        {/* Center Panel: Beautiful Focus Timer */}
        <section className="room-panel room-center-panel">
          <div className="room-card timer-main-card">
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
              <svg className="timer-svg" width="200" height="200">
                <circle className="timer-circle-bg" cx="100" cy="100" r="80" />
                <circle 
                  className="timer-circle-progress" 
                  cx="100" 
                  cy="100" 
                  r="80" 
                  style={{ strokeDashoffset }}
                />
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
                onClick={() => setIsTimerRunning(!isTimerRunning)}
              >
                {isTimerRunning ? '⏸ Pause Focus' : '▶ Start Focus'}
              </button>
              <button 
                className="timer-control-btn btn-reset-action"
                onClick={() => setTimerPreset(timerType, initialSeconds)}
              >
                ⟲ Reset
              </button>
            </div>
            
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

        {/* Right Panel: Shared Motivation Wall */}
        <section className="room-panel room-right-panel">
          <div className="room-card motivation-card">
            <h3>💬 Shared Motivation Wall</h3>
            <p className="card-desc">Write a brief goal, positive note, or victory to encourage your silent peers.</p>

            <form onSubmit={handlePostMessage} className="post-motivation-form">
              <input 
                type="text" 
                maxLength={80}
                placeholder="Share a positive note or goal (e.g. 'Crushing Calculus next!')"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="motivation-input"
              />
              <button type="submit" className="motivation-submit-btn">Post</button>
            </form>

            <div className="motivation-messages-container">
              {messages.map(msg => (
                <div key={msg.id} className="motivation-msg-item">
                  <div className="msg-avatar-col">
                    <div 
                      className="msg-avatar" 
                      style={{ background: msg.avatarColor }}
                    >
                      {msg.author.slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <div className="msg-content-col">
                    <div className="msg-header">
                      <span className="msg-author">{msg.author}</span>
                      <span className="msg-time">{msg.time}</span>
                    </div>
                    <p className="msg-text">"{msg.text}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
