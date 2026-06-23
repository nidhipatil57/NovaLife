import { useState } from 'react';
import { Link } from 'react-router-dom';
import './DashboardHome.css';

export default function DashboardHome() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="dash-home">
      {/* AI Daily Briefing */}
      <div className="briefing-card widget">
        <div className="briefing-left">
          <h2 className="dash-greeting">{greeting}, <span className="gradient-text">Nidhi</span> 👋</h2>
          <p className="briefing-summary">
            You have <strong style={{ color: 'var(--accent-red-light)' }}>2 high-priority tasks</strong> and{' '}
            <strong style={{ color: 'var(--accent-orange-light)' }}>1 deadline at risk</strong> today.
          </p>
          <div className="briefing-stats">
            <div className="brief-stat">
              <span className="brief-stat-value">6.5h</span>
              <span className="brief-stat-label">Est. Productive Hours</span>
            </div>
            <div className="brief-stat">
              <span className="brief-stat-value">5</span>
              <span className="brief-stat-label">Tasks Today</span>
            </div>
            <div className="brief-stat">
              <span className="brief-stat-value">85</span>
              <span className="brief-stat-label">Productivity Score</span>
            </div>
          </div>
          <p className="briefing-quote">"The secret of getting ahead is getting started." — Mark Twain</p>
        </div>
        <div className="briefing-right">
          <div className="briefing-orb">
            <div className="briefing-orb-inner"></div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <Link to="/tasks" className="quick-action-btn">
          <span className="qa-icon">✏️</span>
          <span>Add Task</span>
        </Link>
        <Link to="/brain-dump" className="quick-action-btn">
          <span className="qa-icon">🧠</span>
          <span>Brain Dump</span>
        </Link>
        <Link to="/focus" className="quick-action-btn">
          <span className="qa-icon">🎧</span>
          <span>Focus Session</span>
        </Link>
        <Link to="/ai-assistant" className="quick-action-btn">
          <span className="qa-icon">🤖</span>
          <span>Ask AI</span>
        </Link>
        <Link to="/rescue" className="quick-action-btn qa-rescue">
          <span className="qa-icon">🚨</span>
          <span>Rescue Mode</span>
        </Link>
      </div>

      {/* Widget Grid */}
      <div className="dash-grid">
        <TaskWidgetCompact />
        <ScoreWidget />
        <DeadlineWidgetCompact />
        <GoalWidgetCompact />
        <HabitWidgetCompact />
        <AISuggestionsWidget />
      </div>
    </div>
  );
}

function TaskWidgetCompact() {
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Complete Physics Assignment', done: false, priority: 'high', due: '2:00 PM' },
    { id: 2, text: 'Team Meeting Prep', done: false, priority: 'medium', due: '4:00 PM' },
    { id: 3, text: 'Study for Math Test', done: false, priority: 'high', due: 'Tomorrow' },
    { id: 4, text: 'Reply to Prof. Email', done: true, priority: 'low', due: 'Done' },
    { id: 5, text: 'Gym Session', done: false, priority: 'medium', due: '7:00 PM' },
  ]);
  const toggleTask = (id: number) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));

  return (
    <div className="widget">
      <div className="widget-header">
        <h4>📋 Today's Tasks</h4>
        <Link to="/tasks" className="widget-link">View All →</Link>
      </div>
      <div className="task-list-compact">
        {tasks.map(task => (
          <div key={task.id} className={`task-row ${task.done ? 'done' : ''}`} onClick={() => toggleTask(task.id)}>
            <div className={`task-check-sm ${task.done ? 'checked' : ''}`}>{task.done && '✓'}</div>
            <span className="task-text-sm">{task.text}</span>
            <span className="task-due-sm">{task.due}</span>
            <span className="task-dot" style={{
              background: task.priority === 'high' ? 'var(--accent-red)' :
                task.priority === 'medium' ? 'var(--accent-orange)' : 'var(--accent-green)'
            }}></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreWidget() {
  const score = 85;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="widget widget-score-home">
      <div className="widget-header">
        <h4>📈 Productivity Score</h4>
        <Link to="/analytics" className="widget-link">Details →</Link>
      </div>
      <div className="score-chart-home">
        <svg viewBox="0 0 120 120" className="score-svg-home">
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
          <circle cx="60" cy="60" r="54" fill="none" stroke="url(#scoreGradHome)" strokeWidth="8"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="score-progress-anim" />
          <defs>
            <linearGradient id="scoreGradHome" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--accent-blue)" />
              <stop offset="50%" stopColor="var(--accent-purple)" />
              <stop offset="100%" stopColor="var(--accent-cyan)" />
            </linearGradient>
          </defs>
          <text x="60" y="55" textAnchor="middle" className="score-num-text">{score}</text>
          <text x="60" y="72" textAnchor="middle" className="score-label-text">SCORE</text>
        </svg>
      </div>
      <div className="score-mini-stats">
        <div><strong>12</strong><span>Tasks</span></div>
        <div><strong>4.5h</strong><span>Focus</span></div>
        <div><strong>8</strong><span>Streak</span></div>
      </div>
    </div>
  );
}

function DeadlineWidgetCompact() {
  const deadlines = [
    { task: 'Physics Assignment', due: 'Today, 11:59 PM', urgency: 'critical' },
    { task: 'Math Test', due: 'Tomorrow, 9:00 AM', urgency: 'high' },
    { task: 'Project Presentation', due: 'Wed, 2:00 PM', urgency: 'medium' },
  ];

  return (
    <div className="widget">
      <div className="widget-header">
        <h4>⏰ Deadlines</h4>
        <Link to="/tasks" className="widget-link">View All →</Link>
      </div>
      <div className="deadline-list-compact">
        {deadlines.map((d, i) => (
          <div key={i} className={`deadline-row urgency-${d.urgency}`}>
            <div className="dl-indicator"></div>
            <div className="dl-info">
              <span className="dl-task">{d.task}</span>
              <span className="dl-due">{d.due}</span>
            </div>
            {d.urgency === 'critical' && <span className="dl-badge">🚨</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function GoalWidgetCompact() {
  const goals = [
    { name: 'Learn React', progress: 75, color: 'var(--accent-blue)' },
    { name: 'Fitness Goal', progress: 60, color: 'var(--accent-green)' },
    { name: 'Read 12 Books', progress: 42, color: 'var(--accent-purple)' },
  ];

  return (
    <div className="widget">
      <div className="widget-header">
        <h4>🎯 Goals</h4>
        <Link to="/goals" className="widget-link">View All →</Link>
      </div>
      <div className="goal-list-compact">
        {goals.map((g, i) => (
          <div key={i} className="goal-row">
            <div className="goal-row-top">
              <span>{g.name}</span>
              <span style={{ color: g.color, fontWeight: 700 }}>{g.progress}%</span>
            </div>
            <div className="goal-bar-sm">
              <div className="goal-fill-sm" style={{ width: `${g.progress}%`, background: g.color }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HabitWidgetCompact() {
  const habits = [
    { name: '💧 Water', streak: 5, done: true },
    { name: '📚 Read', streak: 3, done: true },
    { name: '🏃 Exercise', streak: 8, done: false },
    { name: '🧘 Meditate', streak: 2, done: true },
  ];

  return (
    <div className="widget">
      <div className="widget-header">
        <h4>🔄 Habits</h4>
        <Link to="/habits" className="widget-link">View All →</Link>
      </div>
      <div className="habit-compact-list">
        {habits.map((h, i) => (
          <div key={i} className="habit-compact-row">
            <span className="habit-compact-name">{h.name}</span>
            <span className="habit-compact-streak">🔥 {h.streak}</span>
            <div className={`habit-compact-check ${h.done ? 'done' : ''}`}>{h.done ? '✓' : ''}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AISuggestionsWidget() {
  return (
    <div className="widget">
      <div className="widget-header">
        <h4>🤖 AI Recommendations</h4>
      </div>
      <div className="ai-recs">
        <div className="ai-rec">
          <span className="ai-rec-icon">💡</span>
          <p>Complete Physics Assignment now — your focus levels are highest between 2-4 PM.</p>
        </div>
        <div className="ai-rec">
          <span className="ai-rec-icon">⚡</span>
          <p>You're on an 8-day productivity streak! Keep it up to unlock "Consistency Master" 🏆</p>
        </div>
        <div className="ai-rec">
          <span className="ai-rec-icon">🧠</span>
          <p>Consider a 25-min focus sprint on Math Test prep before your meeting at 4 PM.</p>
        </div>
      </div>
    </div>
  );
}
