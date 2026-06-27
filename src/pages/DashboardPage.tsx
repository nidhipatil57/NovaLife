import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './DashboardPage.css';

// Sidebar Component
function Sidebar() {
  const location = useLocation();
  const navItems = [
    { icon: '🏠', label: 'Dashboard', path: '/dashboard' },
    { icon: '✅', label: 'Tasks', path: '/dashboard' },
    { icon: '📅', label: 'Calendar', path: '/dashboard' },
    { icon: '🎯', label: 'Goals', path: '/dashboard' },
    { icon: '🔄', label: 'Habits', path: '/dashboard' },
    { icon: '📊', label: 'Analytics', path: '/analytics' },
    { icon: '🎧', label: 'Focus', path: '/focus' },
    { icon: '⚙️', label: 'Settings', path: '/dashboard' },
  ];

  return (
    <aside className="dash-sidebar glass-card-static">
      <div className="sidebar-logo">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <div className="logo-orb" style={{ width: 24, height: 24 }}></div>
          <span className="logo-text" style={{ fontSize: '1rem' }}>Nova<span className="gradient-text">Life</span></span>
        </Link>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item, i) => (
          <Link
            key={i}
            to={item.path}
            className={`sidebar-link ${location.pathname === item.path && item.label === 'Dashboard' ? 'active' : ''}`}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar-small">N</div>
          <div>
            <div className="user-name">Nidhi</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// Task Widget
function TaskWidget() {
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Complete Physics Assignment', done: false, priority: 'high', due: '2:00 PM' },
    { id: 2, text: 'Team Meeting Prep', done: false, priority: 'medium', due: '4:00 PM' },
    { id: 3, text: 'Study for Math Test', done: false, priority: 'high', due: 'Tomorrow' },
    { id: 4, text: 'Reply to Prof. Email', done: true, priority: 'low', due: 'Done' },
    { id: 5, text: 'Gym Session', done: false, priority: 'medium', due: '7:00 PM' },
  ]);

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  return (
    <div className="dash-widget glass-card-static widget-tasks">
      <div className="widget-header">
        <h4>📋 Today's Tasks</h4>
        <span className="widget-count">{tasks.filter(t => !t.done).length} remaining</span>
      </div>
      <div className="task-list">
        {tasks.map(task => (
          <div key={task.id} className={`task-item ${task.done ? 'done' : ''}`} onClick={() => toggleTask(task.id)}>
            <div className={`task-check ${task.done ? 'checked' : ''}`}>
              {task.done && '✓'}
            </div>
            <div className="task-info">
              <span className="task-text">{task.text}</span>
              <span className="task-due">{task.due}</span>
            </div>
            <span className={`task-priority priority-${task.priority}`}>
              {task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Productivity Score Widget
function ScoreWidget() {
  const score = 85;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="dash-widget glass-card-static widget-score">
      <div className="widget-header">
        <h4>📈 Productivity Score</h4>
      </div>
      <div className="score-chart">
        <svg viewBox="0 0 120 120" className="score-svg">
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="score-progress"
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--accent-blue)" />
              <stop offset="50%" stopColor="var(--accent-purple)" />
              <stop offset="100%" stopColor="var(--accent-cyan)" />
            </linearGradient>
          </defs>
          <text x="60" y="55" textAnchor="middle" className="score-number">{score}</text>
          <text x="60" y="72" textAnchor="middle" className="score-label">SCORE</text>
        </svg>
      </div>
      <div className="score-stats">
        <div className="score-stat">
          <span className="stat-val">12</span>
          <span className="stat-lbl">Tasks Done</span>
        </div>
        <div className="score-stat">
          <span className="stat-val">4.5h</span>
          <span className="stat-lbl">Focus Time</span>
        </div>
        <div className="score-stat">
          <span className="stat-val">8</span>
          <span className="stat-lbl">Streak</span>
        </div>
      </div>
    </div>
  );
}

// Deadline Widget
function DeadlineWidget() {
  const deadlines = [
    { task: 'Physics Assignment', due: 'Today, 11:59 PM', urgency: 'critical' },
    { task: 'Math Test', due: 'Tomorrow, 9:00 AM', urgency: 'high' },
    { task: 'Project Presentation', due: 'Wed, 2:00 PM', urgency: 'medium' },
    { task: 'Essay Draft', due: 'Friday', urgency: 'low' },
  ];

  return (
    <div className="dash-widget glass-card-static widget-deadlines">
      <div className="widget-header">
        <h4>⏰ Upcoming Deadlines</h4>
      </div>
      <div className="deadline-list">
        {deadlines.map((d, i) => (
          <div key={i} className={`deadline-item urgency-${d.urgency}`}>
            <div className="deadline-indicator"></div>
            <div className="deadline-info">
              <span className="deadline-task">{d.task}</span>
              <span className="deadline-due">{d.due}</span>
            </div>
            {d.urgency === 'critical' && <span className="deadline-badge">🚨</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// Goal Progress Widget
function GoalWidget() {
  const goals = [
    { name: 'Learn React', progress: 75, color: 'var(--accent-blue)' },
    { name: 'Fitness Goal', progress: 60, color: 'var(--accent-green)' },
    { name: 'Read 12 Books', progress: 42, color: 'var(--accent-purple)' },
    { name: 'Career Growth', progress: 88, color: 'var(--accent-cyan)' },
  ];

  return (
    <div className="dash-widget glass-card-static widget-goals">
      <div className="widget-header">
        <h4>🎯 Goal Progress</h4>
      </div>
      <div className="goal-list">
        {goals.map((g, i) => (
          <div key={i} className="goal-item">
            <div className="goal-top">
              <span className="goal-name">{g.name}</span>
              <span className="goal-pct" style={{ color: g.color }}>{g.progress}%</span>
            </div>
            <div className="goal-bar">
              <div className="goal-fill" style={{ width: `${g.progress}%`, background: g.color }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Habit Tracker Widget
function HabitWidget() {
  const habits = [
    { name: '💧 Water', done: [true, true, true, false, true, true, false] },
    { name: '📚 Reading', done: [true, false, true, true, true, false, false] },
    { name: '🏃 Exercise', done: [true, true, false, true, true, true, false] },
    { name: '🧘 Meditation', done: [false, true, true, true, false, true, false] },
  ];
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="dash-widget glass-card-static widget-habits">
      <div className="widget-header">
        <h4>🔄 Habit Tracker</h4>
      </div>
      <div className="habit-table">
        <div className="habit-days-header">
          <span className="habit-name-header"></span>
          {days.map((d, i) => <span key={i} className="habit-day-label">{d}</span>)}
        </div>
        {habits.map((h, i) => (
          <div key={i} className="habit-row">
            <span className="habit-name">{h.name}</span>
            {h.done.map((done, j) => (
              <span key={j} className={`habit-cell ${done ? 'habit-done' : ''}`}>
                {done ? '✓' : ''}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// AI Suggestions Widget
function AISuggestionsWidget() {
  return (
    <div className="dash-widget glass-card-static widget-ai">
      <div className="widget-header">
        <h4>🤖 AI Suggestions</h4>
      </div>
      <div className="ai-suggestions">
        <div className="ai-suggestion">
          <div className="suggestion-icon">💡</div>
          <div>
            <p className="suggestion-text">Your Physics Assignment is due tonight. Start with Chapter 5 problems — they carry the most weight.</p>
            <button className="btn-sm btn-primary suggestion-btn">Start Now</button>
          </div>
        </div>
        <div className="ai-suggestion">
          <div className="suggestion-icon">⚡</div>
          <div>
            <p className="suggestion-text">Your energy peaks between 2-4 PM. I've scheduled your hardest task during this window.</p>
          </div>
        </div>
        <div className="ai-suggestion">
          <div className="suggestion-icon">🎯</div>
          <div>
            <p className="suggestion-text">You're on an 8-day productivity streak! Keep it up to unlock "Consistency Master" 🏆</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// AI Chatbot (floating)
function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi Nidhi! 👋 How can I help you today?' },
  ]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      const responses: Record<string, string> = {
        'plan my day': "I've analyzed your schedule. Here's your optimized plan:\n\n🔴 2:00 PM — Physics Assignment (2h)\n🔵 4:00 PM — Team Meeting (1h)\n🟡 5:30 PM — Math Test Prep (1.5h)\n🟢 7:00 PM — Gym (1h)\n\nYou have 85% chance of completing everything!",
        'what should i do next': "Based on urgency and your current energy level, I recommend starting with the Physics Assignment. It's due tonight and carries the highest priority score (98/100).",
      };
      const key = Object.keys(responses).find(k => userMsg.toLowerCase().includes(k));
      setMessages(prev => [...prev, {
        role: 'ai',
        text: key ? responses[key] : "I'd be happy to help! Try asking me to 'plan my day' or 'what should I do next'."
      }]);
    }, 1500);
  };

  return (
    <>
      <button className="chatbot-fab" onClick={() => setOpen(!open)}>
        {open ? '✕' : '💬'}
      </button>
      {open && (
        <div className="chatbot-window glass-card-static">
          <div className="chatbot-header">
            <div className="chatbot-avatar">
              <div className="ai-avatar-inner" style={{ width: 24, height: 24 }}></div>
            </div>
            <div>
              <div className="chatbot-name">NovaLife AI</div>
              <div className="chatbot-status">● Online</div>
            </div>
          </div>
          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role}`}>
                <p>{msg.text}</p>
              </div>
            ))}
          </div>
          <div className="chatbot-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask NovaLife anything..."
            />
            <button onClick={sendMessage}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Main Dashboard
export default function DashboardPage() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dash-main">
        {/* Header */}
        <header className="dash-header">
          <div>
            <h2 className="dash-greeting">{greeting}, <span className="gradient-text">Nidhi</span> 👋</h2>
            <p className="dash-motto">"Small daily improvements lead to staggering long-term results." — Robin Sharma</p>
          </div>
          <div className="dash-header-actions">
            <button className="btn-primary btn-sm">
              + New Task
            </button>
          </div>
        </header>

        {/* Widget Grid */}
        <div className="dash-grid">
          <TaskWidget />
          <ScoreWidget />
          <DeadlineWidget />
          <GoalWidget />
          <HabitWidget />
          <AISuggestionsWidget />
        </div>
      </main>

      <AIChatbot />
    </div>
  );
}
