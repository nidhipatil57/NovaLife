import { useState } from 'react';
import './HabitsPage.css';

const habitsData = [
  { id: 1, name: '💧 Water Intake', target: '8 glasses', streak: 12, best: 21, rate: 85, week: [true,true,true,false,true,true,false], color: 'var(--accent-cyan)' },
  { id: 2, name: '📚 Reading', target: '30 min', streak: 5, best: 14, rate: 70, week: [true,false,true,true,true,false,false], color: 'var(--accent-purple)' },
  { id: 3, name: '🏃 Exercise', target: '45 min', streak: 8, best: 30, rate: 78, week: [true,true,false,true,true,true,false], color: 'var(--accent-green)' },
  { id: 4, name: '🧘 Meditation', target: '15 min', streak: 3, best: 10, rate: 55, week: [false,true,true,true,false,true,false], color: 'var(--accent-pink)' },
  { id: 5, name: '😴 Sleep 8h', target: '8 hours', streak: 4, best: 12, rate: 62, week: [true,true,false,true,true,false,false], color: 'var(--accent-blue)' },
  { id: 6, name: '📝 Journaling', target: '10 min', streak: 2, best: 7, rate: 45, week: [false,false,true,true,false,false,false], color: 'var(--accent-orange)' },
];

const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

export default function HabitsPage() {
  const [habits] = useState(habitsData);

  return (
    <div className="habits-page">
      <div className="page-header">
        <div>
          <h2>🔄 <span className="gradient-text">Habits</span></h2>
          <p>Build consistency with AI-powered habit tracking and insights.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-primary btn-sm">+ New Habit</button>
        </div>
      </div>

      {/* Daily Score */}
      <div className="habit-score-bar widget">
        <div className="habit-score-info">
          <h4>Today's Score</h4>
          <p className="habit-score-sub">4 of 6 habits completed</p>
        </div>
        <div className="habit-score-ring">
          <svg viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="5" />
            <circle cx="30" cy="30" r="24" fill="none" stroke="var(--accent-green)" strokeWidth="5"
              strokeLinecap="round" strokeDasharray="150.8" strokeDashoffset={150.8 - (4/6) * 150.8}
              style={{ transform: 'rotate(-90deg)', transformOrigin: '30px 30px' }} />
            <text x="30" y="34" textAnchor="middle" fill="var(--text-primary)" fontSize="14" fontWeight="800" fontFamily="var(--font-display)">67%</text>
          </svg>
        </div>
      </div>

      {/* Habit Tracker Grid */}
      <div className="habit-tracker-full widget">
        <div className="habit-grid-header">
          <span className="habit-col-name">Habit</span>
          {days.map(d => <span key={d} className="habit-col-day">{d}</span>)}
          <span className="habit-col-streak">Streak</span>
          <span className="habit-col-rate">Rate</span>
        </div>
        {habits.map(h => (
          <div key={h.id} className="habit-grid-row">
            <div className="habit-name-cell">
              <span>{h.name}</span>
              <span className="habit-target">{h.target}</span>
            </div>
            {h.week.map((done, i) => (
              <div key={i} className={`habit-day-cell ${done ? 'completed' : ''}`} style={{ '--hcolor': h.color } as React.CSSProperties}>
                {done ? '✓' : ''}
              </div>
            ))}
            <div className="habit-streak-cell">
              <span className="streak-fire">🔥</span>
              <span>{h.streak}</span>
            </div>
            <div className="habit-rate-cell">
              <div className="rate-bar-bg">
                <div className="rate-bar-fill" style={{ width: `${h.rate}%`, background: h.color }}></div>
              </div>
              <span style={{ color: h.color }}>{h.rate}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* AI Insights */}
      <div className="habit-insights widget">
        <div className="widget-header"><h4>🧠 AI Habit Insights</h4></div>
        <div className="insight-cards">
          <div className="insight-card">
            <span className="insight-icon">📊</span>
            <p>You're most consistent with <strong>exercise</strong> — 78% success rate. Keep it up!</p>
          </div>
          <div className="insight-card">
            <span className="insight-icon">🕐</span>
            <p>You tend to <strong>read more after dinner</strong> (7-9 PM). Consider scheduling reading then.</p>
          </div>
          <div className="insight-card">
            <span className="insight-icon">⚠️</span>
            <p><strong>Journaling</strong> needs attention — only 45% rate. Try pairing it with morning coffee.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
