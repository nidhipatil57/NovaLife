import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useDataContext, type FocusSession } from '../context/DataContext';
import './FocusPage.css';

interface RoomDef {
  id: string;
  name: string;
  icon: string;
  theme: 'forest' | 'cafe' | 'library' | 'space';
  soundUrl: string;
  soundName: string;
  description: string;
  recommendedWork: string;
  effectiveness: string;
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
    recommendedWork: 'Deep coding, creative writing',
    effectiveness: '95% Efficiency',
    defaultCount: 14
  },
  cafe: {
    id: 'cafe',
    name: 'Lofi Study Cafe',
    icon: '☕',
    theme: 'cafe',
    soundUrl: 'https://cdn.jsdelivr.net/gh/karthiknvd/noctune@master/sounds/cafe.mp3',
    soundName: 'Calm Lofi Cafe Ambience',
    description: 'Charming coffee shop background noise blended with simulated keyboard clicks.',
    recommendedWork: 'Reviewing code, planning tasks',
    effectiveness: '88% Efficiency',
    defaultCount: 8
  },
  library: {
    id: 'library',
    name: 'Rainy Library',
    icon: '🌧️',
    theme: 'library',
    soundUrl: 'https://cdn.jsdelivr.net/gh/karthiknvd/noctune@master/sounds/rain.mp3',
    soundName: 'Calm library rain',
    description: 'A quiet archive room with heavy rain tapping against tall windows.',
    recommendedWork: 'Reading, heavy research, study',
    effectiveness: '92% Efficiency',
    defaultCount: 19
  },
  space: {
    id: 'space',
    name: 'Cosmic Observatory',
    icon: '🌌',
    theme: 'space',
    soundUrl: 'https://cdn.jsdelivr.net/gh/karthiknvd/noctune@master/sounds/wind.mp3',
    soundName: 'Soothing Deep Space Drone',
    description: 'Float in a silent orbit, enveloped by a calming stellar hum.',
    recommendedWork: 'Abstract math, UI design, brainstorming',
    effectiveness: '94% Efficiency',
    defaultCount: 6
  }
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

const COACH_MESSAGES = [
  { time: 0, text: "Welcome to your focus session. Take a deep breath and settle in." },
  { time: 10, text: "Great start! You're settling into your cognitive rhythm." },
  { time: 60, text: "Focus room initialized. Let's make this session count!" },
  { time: 300, text: "5 minutes in. Distractions are falling away. Stay centered." },
  { time: 900, text: "15 minutes completed! You are entering a state of flow." },
  { time: 1500, text: "25 minutes! You are in peak productivity. Keep going." },
  { time: 2400, text: "40 minutes without interruption. Phenomenal work!" },
  { time: 3000, text: "50 minutes. Your deep concentration is yielding great results." }
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

export default function FocusPage() {
  const { 
    focusSessions, 
    addFocusSession, 
    deleteFocusSession, 
    updateFocusSession,
    tasks,
    goals
  } = useDataContext();
  const location = useLocation();

  // Navigation & Screen selection state
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<'setup' | 'active' | 'complete'>('setup');
  const [isImmersive, setIsImmersive] = useState<boolean>(false);

  // Room parameters state
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [initialSeconds, setInitialSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Setup form states
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [sessionName, setSessionName] = useState<string>('');
  const [sessionGoal, setSessionGoal] = useState<string>('');
  const [customMinutes, setCustomMinutes] = useState<string>('25');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [timerType, setTimerType] = useState<'pomo' | 'deep' | 'break' | 'custom'>('pomo');

  // Ambient Audio
  const [ambientVolume, setAmbientVolume] = useState<number>(0.35);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isAudioLoaded, setIsAudioLoaded] = useState<boolean>(false);

  // Guided breathing state
  const [isBreathingMode, setIsBreathingMode] = useState<boolean>(false);
  const [breathText, setBreathText] = useState<string>('Breathe In');
  const [breathStage, setBreathStage] = useState<'in' | 'hold' | 'out'>('in');

  const [participantsCount, setParticipantsCount] = useState<number>(10);

  // Live Activity ticker
  const [tickerActivity, setTickerActivity] = useState<string>('Alex joined the quiet space.');

  // Toggles for focus features
  const isAICoachEnabled = true;
  const isWebBlockingEnabled = false;
  const isNotificationsEnabled = true;

  // Active Session states
  const [distractionsCount, setDistractionsCount] = useState<number>(0);
  const [focusScore, setFocusScore] = useState<number>(100);
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [notesDrawerOpen, setNotesDrawerOpen] = useState<boolean>(false);
  const [aiCoachMessage, setAICoachMessage] = useState<string>("Take a deep breath and settle in.");
  const [quoteIdx, setQuoteIdx] = useState<number>(0);

  useEffect(() => {
    setQuoteIdx(Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length));
  }, []);

  // Completion states
  const [completionSession, setCompletionSession] = useState<Partial<FocusSession> | null>(null);

  // History states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedHistorySession, setSelectedHistorySession] = useState<FocusSession | null>(null);
  const [isEditingHistory, setIsEditingHistory] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  // Audio setup refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const coachIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const breathIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Get active room object
  const activeRoom = useMemo(() => {
    return selectedRoomId ? ROOM_DEFS[selectedRoomId] : null;
  }, [selectedRoomId]);

  // Clean up audio helper
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  // Sync website blocking through hosts file API helper
  const syncWebsiteBlocker = async (block: boolean) => {
    if (!isWebBlockingEnabled) return;
    try {
      const token = localStorage.getItem('novalife_token');
      if (!token) return;

      const sitesToBlock = ['Instagram', 'YouTube', 'Twitter', 'Reddit'];
      for (const site of sitesToBlock) {
        await fetch('/api/blocker', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name: site, blocked: block })
        });
      }
    } catch (e) {
      console.error('Failed to update website blocking rules:', e);
    }
  };

  // Handlers declared up front to avoid hoisting issues
  const handleSessionCompleted = async () => {
    setIsTimerRunning(false);
    stopAudio();
    setIsImmersive(false);

    // Release hosts blocking
    await syncWebsiteBlocker(false);

    // Generate AI Reflection message
    const taskObj = tasks.find(t => String(t.id) === selectedTaskId);
    const goalObj = goals.find(g => String(g.id) === selectedGoalId);
    
    const percentage = Math.round((secondsElapsed / initialSeconds) * 100);
    const textReflect = `You completed ${percentage}% of your intended focus session in the ${activeRoom?.name || 'Observatory'}. Your focus remained strong with a final Focus Score of ${focusScore}%. ${
      distractionsCount > 0 
        ? `You noted ${distractionsCount} distraction moments. Minimizing these will boost retention.` 
        : "No distractions were recorded—exceptional concentration!"
    } ${taskObj ? `This directly advanced your task "${taskObj.text}".` : ''} ${
      goalObj ? `This also contributed to your goal "${goalObj.name}".` : ''
    } Keep this flow going!`;

    // Calculate achievements
    const achievements = [];
    if (focusScore >= 95) achievements.push("Laser Focus");
    if (secondsElapsed >= 50 * 60) achievements.push("Deep Diver");
    if (distractionsCount === 0) achievements.push("Distraction-Free");

    setCompletionSession({
      name: sessionName.trim() || `Focus Session - ${activeRoom?.name}`,
      notes: sessionNotes,
      duration: secondsElapsed,
      room: selectedRoomId || 'forest',
      task_id: selectedTaskId ? Number(selectedTaskId) : null,
      goal_id: selectedGoalId ? Number(selectedGoalId) : null,
      focus_score: focusScore,
      completion_status: secondsLeft <= 2 ? 'completed' : 'interrupted',
      ai_reflection: textReflect,
      distractions_count: distractionsCount,
      achievements: achievements,
      session_goal: sessionGoal,
      completed_subtasks: []
    });

    setSessionState('complete');
  };

  const handleStartSession = async () => {
    // Determine duration
    let durationSec = 25 * 60;
    if (timerType === 'custom') {
      const customMins = parseInt(customMinutes);
      if (!isNaN(customMins) && customMins > 0) {
        durationSec = customMins * 60;
      }
    } else if (timerType === 'pomo') {
      durationSec = 25 * 60;
    } else if (timerType === 'deep') {
      durationSec = 50 * 60;
    } else if (timerType === 'break') {
      durationSec = 15 * 60;
    }

    setSecondsLeft(durationSec);
    setInitialSeconds(durationSec);
    setSecondsElapsed(0);
    setDistractionsCount(0);
    setFocusScore(100);
    setSessionNotes('');
    setSessionState('active');
    setIsTimerRunning(true);
    setAICoachMessage("Your focus session has begun. Eliminate distractions.");

    // Sync hosts blocking
    await syncWebsiteBlocker(true);
  };

  const handleJoinRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    setSessionState('setup');
    const room = ROOM_DEFS[roomId];
    setSessionName(`Focusing in ${room.name}`);
    setSecondsLeft(25 * 60);
    setInitialSeconds(25 * 60);
    setCustomMinutes('25');
    setTimerType('pomo');
    setShowCustomInput(false);
    setIsTimerRunning(false);
    setParticipantsCount(room.defaultCount);
    setSessionGoal('');
    setIsBreathingMode(false);
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
        session_goal: completionSession.session_goal,
        completed_subtasks: []
      });

      // Clear state and exit back to lobby
      setCompletionSession(null);
      setSelectedRoomId(null);
      setSessionState('setup');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDuplicateSession = (s: FocusSession) => {
    setSelectedRoomId(s.room || 'forest');
    setSessionState('setup');
    setSessionName(s.name);
    setSessionGoal(s.session_goal || '');
    setCustomMinutes(String(Math.round(s.duration / 60) || 25));
    setSelectedTaskId(s.task_id ? String(s.task_id) : '');
    setSelectedGoalId(s.goal_id ? String(s.goal_id) : '');
    setSelectedHistorySession(null);
  };

  const handleSaveChangesHistory = async () => {
    if (!selectedHistorySession) return;
    try {
      const ok = await updateFocusSession(selectedHistorySession.id, {
        name: editName.trim() || selectedHistorySession.name,
        notes: editNotes.trim()
      });
      if (ok) {
        setSelectedHistorySession(prev => prev ? { ...prev, name: editName, notes: editNotes } : null);
        setIsEditingHistory(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportHistory = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(focusSessions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `novalife_focus_history_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };



  const setTimerPreset = (type: 'pomo' | 'deep' | 'break' | 'custom', seconds: number) => {
    setIsTimerRunning(false);
    setTimerType(type);
    setSecondsLeft(seconds);
    setInitialSeconds(seconds);
    setShowCustomInput(type === 'custom');
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(customMinutes);
    if (!isNaN(mins) && mins > 0 && mins <= 180) {
      setTimerPreset('custom', mins * 60);
    }
  };

  // Load state from routing navigation (such as starting a task focus)
  useEffect(() => {
    if (location.state?.taskName && location.state?.taskId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedTaskId(String(location.state.taskId));
      setSessionName(`Focusing on: ${location.state.taskName}`);
      setSelectedRoomId('forest');
      setSessionState('setup');
    }
  }, [location.state]);

  // Sound setup when room or volume changes
  useEffect(() => {
    if (selectedRoomId && activeRoom) {
      stopAudio();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAudioLoaded(false);
      const audio = new Audio(activeRoom.soundUrl);
      audio.loop = true;
      audio.volume = isMuted ? 0 : ambientVolume;
      audioRef.current = audio;

      // Automatically play
      audio.play().then(() => {
        setIsAudioLoaded(true);
      }).catch(err => {
        console.log('Autoplay sound blocked:', err);
      });
    } else {
      stopAudio();
    }
    return () => stopAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoomId]);

  // Sync volume slider and mute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : ambientVolume;
    }
  }, [ambientVolume, isMuted]);

  // Timer Tick implementation
  useEffect(() => {
    if (isTimerRunning && sessionState === 'active') {
      timerIntervalRef.current = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
        setSecondsLeft(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            // Play gentle ring alert
            try {
              const alertAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav');
              alertAudio.volume = 0.3;
              alertAudio.play();
            } catch (e) {
              console.error(e);
            }
            handleSessionCompleted();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimerRunning, sessionState]);

  // Focus Score & AI Coach ticker
  useEffect(() => {
    if (isTimerRunning && sessionState === 'active') {
      coachIntervalRef.current = setInterval(() => {
        // AI Coach message matching elapsed seconds
        const match = COACH_MESSAGES.find(m => Math.abs(m.time - secondsElapsed) < 10);
        if (match && isAICoachEnabled) {
          setAICoachMessage(match.text);
          if (isNotificationsEnabled && Notification.permission === 'granted') {
            new Notification('AI Focus Coach', { body: match.text, icon: '/favicon.svg' });
          }
        }

        // Calculate focus score dynamically based on distractions
        setFocusScore(() => {
          const score = 100 - distractionsCount * 12 - Math.floor(secondsElapsed / 400);
          return score < 20 ? 20 : score;
        });
      }, 5000);
    } else {
      if (coachIntervalRef.current) clearInterval(coachIntervalRef.current);
    }
    return () => {
      if (coachIntervalRef.current) clearInterval(coachIntervalRef.current);
    };
  }, [isTimerRunning, sessionState, secondsElapsed, distractionsCount, isAICoachEnabled, isNotificationsEnabled]);

  // Simulated live activity feed & participant count changes
  useEffect(() => {
    if (selectedRoomId) {
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
      }, 15000);
    }

    return () => {
      if (tickerIntervalRef.current) clearInterval(tickerIntervalRef.current);
    };
  }, [selectedRoomId]);

  // Guided breathing loop
  useEffect(() => {
    if (isBreathingMode && selectedRoomId) {
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
  }, [isBreathingMode, selectedRoomId]);

  // Request notifications permission on setup
  useEffect(() => {
    if (isNotificationsEnabled && 'Notification' in window) {
      Notification.requestPermission();
    }
  }, [isNotificationsEnabled]);

  // Helper formats
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getRoomIcon = (roomId: string) => {
    return ROOM_DEFS[roomId]?.icon || '⏱️';
  };

  const getRoomName = (roomId: string) => {
    return ROOM_DEFS[roomId]?.name || 'Unknown Room';
  };

  // Today's sessions calculations
  const todaySessions = useMemo(() => {
    const today = new Date();
    return focusSessions.filter(s => {
      const sessDate = new Date(s.created_at);
      return (
        sessDate.getDate() === today.getDate() &&
        sessDate.getMonth() === today.getMonth() &&
        sessDate.getFullYear() === today.getFullYear()
      );
    });
  }, [focusSessions]);

  const totalFocusSessionsToday = todaySessions.length;
  const totalFocusHoursToday = useMemo(() => {
    const totalSecs = todaySessions.reduce((sum, s) => sum + s.duration, 0);
    return (totalSecs / 3600).toFixed(1);
  }, [todaySessions]);

  // Filtered History
  const filteredHistory = useMemo(() => {
    return focusSessions.filter(s => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) || 
        s.notes.toLowerCase().includes(q) ||
        getRoomName(s.room || '').toLowerCase().includes(q)
      );
    });
  }, [focusSessions, searchQuery]);



  // Calculate timer progress percentage for SVG ring
  const timerProgress = initialSeconds > 0 ? (secondsLeft / initialSeconds) * 100 : 0;
  const strokeDashoffset = 502 - (502 * timerProgress) / 100;



  return (
    <div className={`focus-page ${selectedRoomId ? `in-room theme-${selectedRoomId}` : ''} ${isImmersive ? 'immersive-active' : ''}`}>
      
      {/* Immersive Room Layout */}
      {selectedRoomId && activeRoom ? (
        <div className="immersive-workspace-container">
          
          {/* Room Animated Effects Canvas/Backdrops */}
          <div className="room-animations">
            <div className="calm-particles">
              {[...Array(12)].map((_, i) => (
                <div key={i} className={`room-particle p-${i + 1}`} />
              ))}
            </div>
            {selectedRoomId === 'forest' && (
              <div className="forest-visuals">
                <div className="swaying-trees"></div>
                <div className={`rain-overlay ${isTimerRunning ? 'active-run' : ''}`}></div>
                <div className="sun-flares"></div>
              </div>
            )}
            {selectedRoomId === 'cafe' && (
              <div className="cafe-visuals">
                <div className="window-rain"></div>
                <div className="coffee-steam"></div>
                <div className="cafe-glow"></div>
              </div>
            )}
            {selectedRoomId === 'library' && (
              <div className="library-visuals">
                <div className="bookshelves-backdrop"></div>
                <div className="lamp-glow"></div>
                <div className="dust-motes"></div>
              </div>
            )}
            {selectedRoomId === 'space' && (
              <div className="space-visuals">
                <div className="galaxy-nebula"></div>
                <div className="twinkling-stars"></div>
                <div className="orbiting-planets"></div>
              </div>
            )}
          </div>

          {/* Exit Immersive Button floating */}
          {isImmersive && (
            <button className="exit-immersive-btn" onClick={() => setIsImmersive(false)}>
              ✕ Exit Full Screen
            </button>
          )}

          {/* Room Header bar */}
          <header className="room-header">
            <button className="back-btn" onClick={() => { setSelectedRoomId(null); setSessionState('setup'); setIsImmersive(false); stopAudio(); syncWebsiteBlocker(false); }}>
              ✕ Exit Room
            </button>
            <div className="room-title-section">
              <span className="room-icon-badge">{activeRoom.icon}</span>
              <div>
                <h2>{activeRoom.name}</h2>
                <p className="room-desc-subtitle">{activeRoom.description}</p>
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

          {/* Core Room Workspace panels */}
          <div className="room-workspace-body">
            
            {sessionState !== 'complete' ? (
              // 3-Column              // 2-Column Swapped Layout (Timer Left, Cards Right)
              <main className="room-grid">
                
                {/* Center Column: Timer & Controls (NOW ON LEFT) */}
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

                    {/* Integrated Session Setup Parameters in Room Workspace */}
                    <div className="room-session-setup-form">
                      <div className="form-group-row">
                        <div className="form-group">
                          <label>Work Task</label>
                          <select value={selectedTaskId} onChange={(e) => {
                            setSelectedTaskId(e.target.value);
                            const task = tasks.find(t => String(t.id) === e.target.value);
                            if (task) setSessionName(`Focusing on: ${task.text}`);
                          }} className="setup-select">
                            <option value="">-- No linked task --</option>
                            {tasks.filter(t => !t.done).map(t => (
                              <option key={t.id} value={t.id}>🎯 {t.text}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Linked Goal</label>
                          <select value={selectedGoalId} onChange={(e) => setSelectedGoalId(e.target.value)} className="setup-select">
                            <option value="">-- No linked goal --</option>
                            {goals.map(g => (
                              <option key={g.id} value={g.id}>🏆 {g.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Timer Visualizer */}
                    <div className="timer-visual-container">
                      <svg className="timer-svg" viewBox="0 0 200 200" width="200" height="200">
                        <g transform="rotate(-90 100 100)">
                          <circle className="timer-circle-bg" cx="100" cy="100" r="80" strokeWidth="6" />
                          <circle 
                            className="timer-circle-progress" 
                            cx="100" 
                            cy="100" 
                            r="80" 
                            strokeWidth="6"
                            style={{ strokeDashoffset }}
                          />
                        </g>
                      </svg>
                      <div className="timer-digits-overlay">
                        <span className="timer-countdown">{formatTime(secondsLeft)}</span>
                        <span className="timer-label">{timerType === 'pomo' ? 'Pomodoro' : timerType === 'deep' ? 'Deep Focus' : timerType === 'break' ? 'Short Break' : 'Focus Session'}</span>
                      </div>
                    </div>

                    {/* Controls Actions Row */}
                    <div className="timer-actions-row">
                      <button 
                        className={`timer-control-btn btn-main-action ${isTimerRunning ? 'btn-pause' : 'btn-start'}`}
                        onClick={async () => {
                          if (!isTimerRunning && sessionState === 'setup') {
                            await handleStartSession();
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

                  {/* AI Coach Assistant Bubble */}
                  {isAICoachEnabled && sessionState === 'active' && (
                    <div className="ai-coach-bubble-card">
                      <div className="coach-avatar">🤖</div>
                      <div className="coach-bubble-text">
                        <span className="coach-header-label">AI Focus Coach</span>
                        <p>"{aiCoachMessage}"</p>
                      </div>
                    </div>
                  )}

                  {/* Live Activity Ticker */}
                  <div className="room-card ticker-card">
                    <h3>⚡ Live Activity Feed</h3>
                    <div className="ticker-content">
                      <span className="ticker-icon">⚡</span>
                      <span className="ticker-text">{tickerActivity}</span>
                    </div>
                  </div>

                </section>

                {/* Left Column: Audio controls, Breathing, focusing list (NOW ON RIGHT) */}
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
                          value={ambientVolume}
                          onChange={(e) => {
                            setAmbientVolume(parseFloat(e.target.value));
                            setIsMuted(false);
                          }}
                          className="volume-slider"
                        />
                        <span className="volume-icon">🔊</span>
                      </div>
                    </div>
                    <p className="audio-status-name">Track: <em>{activeRoom.soundName}</em> {isAudioLoaded ? '(Loaded)' : '(Loading...)'}</p>
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
              <div className="workspace-card completion-summary-card">
                <div className="completion-confetti">🎉</div>
                <h2>Session Complete!</h2>
                <p className="summary-intro">Excellent job. Review your session reflections below before logging it in history.</p>

                <div className="completion-summary-grid">
                  <div className="form-group span-2">
                    <label>Verify / Rename Focus Session Name</label>
                    <input 
                      type="text" 
                      value={completionSession?.name || ''} 
                      onChange={(e) => setCompletionSession(prev => prev ? { ...prev, name: e.target.value } : null)}
                      className="completion-rename-input"
                    />
                  </div>

                  <div className="summary-field">
                    <span>Room Utilized</span>
                    <strong>{getRoomName(completionSession?.room || '')}</strong>
                  </div>

                  <div className="summary-field">
                    <span>Duration Completed</span>
                    <strong>{formatTime(completionSession?.duration || 0)}</strong>
                  </div>

                  <div className="summary-field">
                    <span>Focus Score Earned</span>
                    <strong className="score-green">{completionSession?.focus_score}%</strong>
                  </div>

                  <div className="summary-field">
                    <span>Distractions Counted</span>
                    <strong>{completionSession?.distractions_count || 0}</strong>
                  </div>

                  {completionSession?.achievements && (completionSession.achievements as string[]).length > 0 && (
                    <div className="summary-field span-2">
                      <span>Achievements Earned</span>
                      <div className="achievements-pills-row">
                        {(completionSession.achievements as string[]).map(a => (
                          <span key={a} className="achievement-pill-badge">🏆 {a}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {completionSession?.ai_reflection && (
                    <div className="summary-field span-2 ai-reflection-summary-box">
                      <span>🤖 AI Reflection Insight</span>
                      <p>{completionSession.ai_reflection}</p>
                    </div>
                  )}

                  <div className="form-group span-2">
                    <label>Autosaved Focus Notes</label>
                    <textarea 
                      value={sessionNotes} 
                      onChange={(e) => {
                        setSessionNotes(e.target.value);
                        setCompletionSession(prev => prev ? { ...prev, notes: e.target.value } : null);
                      }}
                      className="completion-notes-textarea"
                      placeholder="Add any extra thoughts..."
                    />
                  </div>
                </div>

                <div className="completion-action-buttons">
                  <button className="btn-save-summary" onClick={handleSaveCompletedSession}>
                    💾 Save Session to History
                  </button>
                  <button className="btn-discard-summary" onClick={() => { setCompletionSession(null); setSelectedRoomId(null); setSessionState('setup'); }}>
                    🗑️ Discard Session
                  </button>
                </div>
              </div>
            )}

            {/* Notes Slide-out Panel Drawer */}
            <div className={`notes-drawer-sidebar ${notesDrawerOpen ? 'open' : ''}`}>
              <div className="drawer-header">
                <h3>📝 Focus Notes</h3>
                <button className="btn-drawer-close" onClick={() => setNotesDrawerOpen(false)}>✕</button>
              </div>
              <p className="drawer-desc font-xs">Notes are autosaved and automatically linked to this active session details.</p>
              <textarea 
                value={sessionNotes}
                onChange={(e) => {
                  setSessionNotes(e.target.value);
                  if (sessionState === 'complete' && completionSession) {
                    setCompletionSession(prev => prev ? { ...prev, notes: e.target.value } : null);
                  }
                }}
                placeholder="Write your research notes, paste code snippets, or draft tasks here..."
                className="drawer-textarea"
              />
            </div>

          </div>

        </div>
      ) : (
        // Focus Lobby / Room Selection View (dashboard lobby)
        <div className="focus-lobby-container">
          
          <div className="lobby-header-section">
            <h2>🎧 Immersive <span className="gradient-text">Focus Studio</span></h2>
          </div>

          <div className="lobby-rooms-full-width">
            <div className="rooms-section-header">
              <h3>👥 Choose an Environment</h3>
              <p className="rooms-section-desc">Select a room below to launch your dedicated distraction-free workspace. Each environment features tailored lighting, animated aesthetics, and ambient loops.</p>
            </div>
            
            <div className="rooms-preview-grid full-width">
              {Object.values(ROOM_DEFS).map(room => (
                <div key={room.id} className={`room-preview-card room-theme-${room.id}`} onClick={() => handleJoinRoom(room.id)}>
                  <div className="room-card-preview-backdrop"></div>
                  <div className="room-card-header">
                    <span className="room-icon-display">{room.icon}</span>
                    <div>
                      <h4>{room.name}</h4>
                      <span className="room-badge-stat">{room.effectiveness}</span>
                    </div>
                  </div>
                  <p className="room-card-description">{room.description}</p>
                  <div className="room-card-footer">
                    <span className="room-footer-tag">💡 {room.recommendedWork}</span>
                    <button className="btn-join-room-lobby" onClick={(e) => { e.stopPropagation(); handleJoinRoom(room.id); }}>Join</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Focus Overview Statistics Card */}
          <div className="lobby-card today-stats-card animate-slide-up">
            <h3>📊 Today's Focus Overview</h3>
            <div className="today-stats-grid">
              <div className="today-stat-item">
                <span className="stat-label">⏱️ Total Focus Hours Today</span>
                <strong className="stat-value">{totalFocusHoursToday} hrs</strong>
              </div>
              <div className="today-stat-item">
                <span className="stat-label">🎯 Total Focus Sessions Today</span>
                <strong className="stat-value">{totalFocusSessionsToday} sessions</strong>
              </div>
            </div>
          </div>

          {/* Past Sessions History Section */}
          <div className="lobby-card history-card-section">
            <div className="history-header-row">
              <h3>📋 Focus History</h3>
              <div className="history-actions-row">
                <input 
                  type="text" 
                  placeholder="Search previous sessions..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="history-search-input"
                />
                <button className="btn-export-history" onClick={handleExportHistory}>
                  📥 Export JSON
                </button>
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="no-sessions-lobby">
                <p>No focus sessions match your search query. Select a room and start focusing to log sessions!</p>
              </div>
            ) : (
              <div className="lobby-history-list">
                {filteredHistory.map(session => (
                  <div key={session.id} className="history-row-item" onClick={() => {
                    setSelectedHistorySession(session);
                    setEditName(session.name);
                    setEditNotes(session.notes || '');
                    setIsEditingHistory(false);
                  }}>
                    <div className="history-info-col">
                      <span className="history-icon">{getRoomIcon(session.room || '')}</span>
                      <div>
                        <span className="history-title-lbl">{session.name}</span>
                        <span className="history-date-sub">{getRoomName(session.room || '')} • {new Date(session.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <div className="history-meta-col">
                      <span className="history-stat-badge">⏱️ {Math.round(session.duration / 60)}m</span>
                      <span className="history-stat-badge score-badge">Score: {session.focus_score}%</span>
                      <span className="history-arrow">→</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* History Details Modal Popup */}
      {selectedHistorySession && (
        <div className="focus-modal-overlay" onClick={() => setSelectedHistorySession(null)}>
          <div className="focus-modal-content detail-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedHistorySession(null)}>✕</button>
            
            <div className="modal-header-row">
              <span className="modal-header-icon">{getRoomIcon(selectedHistorySession.room || '')}</span>
              <div>
                {isEditingHistory ? (
                  <input 
                    type="text" 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)} 
                    className="modal-title-edit-input"
                  />
                ) : (
                  <h3>{selectedHistorySession.name}</h3>
                )}
                <span className="modal-date-sub">{new Date(selectedHistorySession.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>

            <div className="modal-details-grid">
              <div className="detail-item">
                <span>Room utilized</span>
                <strong>{getRoomName(selectedHistorySession.room || '')}</strong>
              </div>
              <div className="detail-item">
                <span>Total Duration</span>
                <strong>{Math.round(selectedHistorySession.duration / 60)} minutes</strong>
              </div>
              <div className="detail-item">
                <span>Focus Score</span>
                <strong>{selectedHistorySession.focus_score}%</strong>
              </div>
              <div className="detail-item">
                <span>Status</span>
                <strong className={selectedHistorySession.completion_status === 'completed' ? 'completion-green' : 'completion-red'}>
                  {selectedHistorySession.completion_status || 'completed'}
                </strong>
              </div>
              {selectedHistorySession.session_goal && (
                <div className="detail-item span-2">
                  <span>Intended Focus Target Goal</span>
                  <p>"{selectedHistorySession.session_goal}"</p>
                </div>
              )}
              {selectedHistorySession.ai_reflection && (
                <div className="detail-item span-2 ai-reflection-detail-box">
                  <span>🤖 AI Reflection Insight</span>
                  <p>{selectedHistorySession.ai_reflection}</p>
                </div>
              )}

              <div className="detail-item span-2">
                <span>Focus Session Notes</span>
                {isEditingHistory ? (
                  <textarea 
                    value={editNotes} 
                    onChange={(e) => setEditNotes(e.target.value)} 
                    className="modal-notes-edit-input"
                  />
                ) : (
                  <p className="modal-notes-display-p">{selectedHistorySession.notes || 'No notes saved for this session.'}</p>
                )}
              </div>
            </div>

            <div className="modal-actions-buttons-row">
              {isEditingHistory ? (
                <>
                  <button className="btn-modal-action btn-save" onClick={handleSaveChangesHistory}>
                    Save Changes
                  </button>
                  <button className="btn-modal-action btn-cancel" onClick={() => setIsEditingHistory(false)}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-modal-action btn-edit" onClick={() => setIsEditingHistory(true)}>
                    ✍️ Edit Session Details
                  </button>
                  <button className="btn-modal-action btn-duplicate" onClick={() => handleDuplicateSession(selectedHistorySession)}>
                    ⟲ Duplicate Session
                  </button>
                  <button className="btn-modal-action btn-delete" onClick={async () => {
                    await deleteFocusSession(selectedHistorySession.id);
                    setSelectedHistorySession(null);
                  }}>
                    🗑️ Delete Session
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
