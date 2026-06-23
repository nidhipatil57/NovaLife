import { useScrollAnimation } from '../../hooks/useAnimations';
import './FeaturesSection.css';

const features = [
  {
    icon: '🧠',
    title: 'AI Task Command Center',
    desc: 'Tell NovaLife what to do in plain English. It breaks tasks into subtasks, estimates time, creates schedules, and adds reminders automatically.',
    tag: 'CORE',
    color: 'var(--accent-blue)',
    demo: 'task-command',
    gradient: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
  },
  {
    icon: '📊',
    title: 'Smart Priority Engine',
    desc: 'AI calculates priority scores based on urgency, difficulty, your patterns, and available time. Every task gets a score from 0–100.',
    tag: 'AI',
    color: 'var(--accent-purple)',
    demo: 'priority',
    gradient: 'linear-gradient(135deg, var(--accent-purple), var(--accent-pink))',
  },
  {
    icon: '🎯',
    title: 'Goal Tracking System',
    desc: 'Track fitness, learning, career, exams, and personal goals with progress bars, milestones, streaks, and achievements.',
    tag: 'GOALS',
    color: 'var(--accent-green)',
    demo: 'goals',
    gradient: 'linear-gradient(135deg, var(--accent-green), var(--accent-cyan))',
  },
  {
    icon: '🎙️',
    title: 'Voice Assistant',
    desc: '"Schedule my assignment." NovaLife creates tasks from voice commands with beautiful waveform animations.',
    tag: 'VOICE',
    color: 'var(--accent-purple)',
    demo: 'voice',
    gradient: 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))',
  },
  {
    icon: '📅',
    title: 'AI Calendar Autopilot',
    desc: 'Connects to Google Calendar, Outlook & Apple Calendar. Auto time-blocking, meeting protection, deep work sessions.',
    tag: 'SYNC',
    color: 'var(--accent-cyan)',
    demo: 'calendar',
    gradient: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
  },
  {
    icon: '📈',
    title: 'AI Productivity Score',
    desc: 'Daily score out of 100 based on tasks completed, goals achieved, focus time, and consistency. Beautiful radial chart.',
    tag: 'SCORE',
    color: 'var(--accent-cyan)',
    demo: 'score',
    gradient: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-green))',
  },
  {
    icon: '💬',
    title: 'AI Life Chatbot',
    desc: '"Plan my day." "Help me study." "What should I do next?" Your personal AI assistant, always ready.',
    tag: 'CHAT',
    color: 'var(--accent-pink)',
    demo: 'chatbot',
    gradient: 'linear-gradient(135deg, var(--accent-pink), var(--accent-purple))',
  },
  {
    icon: '🚨',
    title: 'Deadline Rescue Mode',
    desc: 'When a deadline is at risk, NovaLife enters emergency mode — rebuilds your schedule, removes distractions, and creates an action sprint.',
    tag: 'UNIQUE',
    color: 'var(--accent-red)',
    demo: 'rescue',
    gradient: 'linear-gradient(135deg, var(--accent-red), var(--accent-orange))',
  },
  {
    icon: '🎧',
    title: 'Focus Mode',
    desc: 'Distraction-free environment with Pomodoro timer, ambient soundscapes, productivity insights, and fullscreen focus.',
    tag: 'FOCUS',
    color: 'var(--accent-blue)',
    demo: 'focus',
    gradient: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
  },
  {
    icon: '🔄',
    title: 'Habit Engine',
    desc: 'Track water, reading, exercise, sleep, and meditation. Build streaks, get daily scores, and AI recommendations.',
    tag: 'HABITS',
    color: 'var(--accent-orange)',
    demo: 'habits',
    gradient: 'linear-gradient(135deg, var(--accent-orange), var(--accent-red))',
  },
];

function FeatureMiniDemo({ demo, color }: { demo: string; color: string }) {
  if (demo === 'priority') {
    return (
      <div className="mini-demo mini-demo-priority">
        <div className="priority-bar">
          <span>Assignment A</span>
          <div className="priority-fill" style={{ width: '98%', background: 'var(--accent-red)' }}>
            <span>98</span>
          </div>
        </div>
        <div className="priority-bar">
          <span>Assignment B</span>
          <div className="priority-fill" style={{ width: '73%', background: 'var(--accent-orange)' }}>
            <span>73</span>
          </div>
        </div>
        <div className="priority-bar">
          <span>Assignment C</span>
          <div className="priority-fill" style={{ width: '54%', background: 'var(--accent-blue)' }}>
            <span>54</span>
          </div>
        </div>
      </div>
    );
  }

  if (demo === 'rescue') {
    return (
      <div className="mini-demo mini-demo-rescue">
        <div className="rescue-alert">
          <span className="rescue-icon">🚨</span>
          <span>DEADLINE AT RISK</span>
        </div>
        <div className="rescue-status">
          <div className="rescue-pulse"></div>
          Rebuilding schedule...
        </div>
      </div>
    );
  }

  if (demo === 'score') {
    return (
      <div className="mini-demo mini-demo-score">
        <svg viewBox="0 0 100 100" className="score-ring">
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          <circle
            cx="50" cy="50" r="42"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="264"
            strokeDashoffset="40"
            style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
          />
          <text x="50" y="46" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" fontFamily="var(--font-display)">85</text>
          <text x="50" y="60" textAnchor="middle" fill="var(--text-tertiary)" fontSize="7">SCORE</text>
        </svg>
      </div>
    );
  }

  if (demo === 'habits') {
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const active = [true, true, true, false, true, true, false];
    return (
      <div className="mini-demo mini-demo-habits">
        <div className="habit-streak">
          {days.map((d, i) => (
            <div key={i} className={`habit-day ${active[i] ? 'active' : ''}`}>
              <span>{d}</span>
            </div>
          ))}
        </div>
        <div className="habit-label">🔥 5 day streak</div>
      </div>
    );
  }

  if (demo === 'voice') {
    return (
      <div className="mini-demo mini-demo-voice">
        <div className="voice-waveform">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="wave-bar" style={{ animationDelay: `${i * 0.1}s` }}></span>
          ))}
        </div>
        <span className="voice-label">Listening...</span>
      </div>
    );
  }

  return null;
}

export default function FeaturesSection() {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <section className="section features-section" id="features" ref={ref}>
      <div className="container">
        <div className={`scroll-animate ${isVisible ? 'visible' : ''}`}>
          <div className="section-badge">🚀 Core Features</div>
          <h2 className="section-title">
            Everything You Need to <span className="gradient-text">Dominate Life</span>
          </h2>
          <p className="section-subtitle">
            10 powerful AI-driven features that turn NovaLife into your personal life operating system.
          </p>
        </div>

        <div className="features-grid">
          {features.map((f, i) => (
            <div
              key={i}
              className={`feature-card glass-card scroll-animate stagger-${(i % 5) + 1} ${isVisible ? 'visible' : ''}`}
              style={{ '--feature-color': f.color } as React.CSSProperties}
            >
              <div className="feature-gradient-bar" style={{ background: f.gradient }}></div>
              <div className="feature-content">
                <div className="feature-header">
                  <span className="feature-icon">{f.icon}</span>
                  <span className="feature-tag" style={{ color: f.color, borderColor: f.color }}>{f.tag}</span>
                </div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
                <FeatureMiniDemo demo={f.demo} color={f.color} />
              </div>
              <div className="feature-glow" style={{ background: f.color }}></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
