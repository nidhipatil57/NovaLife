import { useState } from 'react';
import { useHabits } from '../hooks/useHabits';
import './HabitsPage.css';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const colorsConfig = [
  { name: 'Cyan', value: 'var(--accent-cyan)' },
  { name: 'Purple', value: 'var(--accent-purple)' },
  { name: 'Green', value: 'var(--accent-green)' },
  { name: 'Pink', value: 'var(--accent-pink)' },
  { name: 'Blue', value: 'var(--accent-blue)' },
  { name: 'Orange', value: 'var(--accent-orange)' },
];

export default function HabitsPage() {
  const { habits, loading, addHabit, toggleHabitDay, deleteHabit, user } = useHabits();
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newColor, setNewColor] = useState('var(--accent-blue)');

  const todayIndex = (new Date().getDay() + 6) % 7; // Monday = 0, Sunday = 6

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newTarget.trim()) return;

    try {
      await addHabit({
        name: newName,
        target: newTarget,
        streak: 0,
        best: 0,
        rate: 0,
        week: [false, false, false, false, false, false, false],
        color: newColor,
      });

      // Reset
      setNewName('');
      setNewTarget('');
      setNewColor('var(--accent-blue)');
      setShowAddModal(false);
    } catch (err) {
      alert('Failed to add habit.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the habit "${name}"?`)) {
      try {
        await deleteHabit(id);
      } catch (err) {
        alert('Failed to delete habit.');
      }
    }
  };

  // Calculations for daily score
  const totalHabits = habits.length;
  const completedToday = habits.filter(h => h.week[todayIndex]).length;
  const scorePercent = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
  const ringOffset = 150.8 - (scorePercent / 100) * 150.8;

  if (!user) {
    return (
      <div className="habits-page" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex', minHeight: '60vh' }}>
        <div className="widget glass-card-static" style={{ padding: '40px', textAlign: 'center', maxWidth: '480px' }}>
          <h3>🔒 Authentication Required</h3>
          <p style={{ marginTop: '12px', marginBottom: '24px' }}>Please log in using Google or email on the login page to track your habits.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="habits-page">
      <div className="page-header">
        <div>
          <h2>🔄 <span className="gradient-text">Habits</span></h2>
          <p>Build consistency with AI-powered habit tracking and insights.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-primary btn-sm" onClick={() => setShowAddModal(true)}>+ New Habit</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state" style={{ textAlign: 'center', padding: '60px' }}>
          <div className="ai-onboard-avatar" style={{ margin: '0 auto 20px auto', width: '40px', height: '40px' }}></div>
          <p>Synchronizing habits with Firestore Database...</p>
        </div>
      ) : habits.length === 0 ? (
        <div className="empty-state widget glass-card-static" style={{ textAlign: 'center', padding: '50px 30px', margin: '20px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
          <h4>No Habits Tracked</h4>
          <p style={{ maxWidth: '400px', margin: '10px auto 24px auto', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Your habit tracker is empty. Click "+ New Habit" to create a new routine and build daily consistency!
          </p>
          <button className="btn-primary btn-sm" onClick={() => setShowAddModal(true)}>+ Add New Habit</button>
        </div>
      ) : (
        <>
          {/* Daily Score */}
          <div className="habit-score-bar widget">
            <div className="habit-score-info">
              <h4>Today's Score</h4>
              <p className="habit-score-sub">{completedToday} of {totalHabits} habits completed today ({days[todayIndex]})</p>
            </div>
            <div className="habit-score-ring">
              <svg viewBox="0 0 60 60">
                <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="5" />
                <circle cx="30" cy="30" r="24" fill="none" stroke="var(--accent-green)" strokeWidth="5"
                  strokeLinecap="round" strokeDasharray="150.8" strokeDashoffset={ringOffset}
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '30px 30px', transition: 'stroke-dashoffset 0.8s ease-out' }} />
                <text x="30" y="34" textAnchor="middle" fill="var(--text-primary)" fontSize="14" fontWeight="800" fontFamily="var(--font-display)">{scorePercent}%</text>
              </svg>
            </div>
          </div>

          {/* Habit Tracker Grid */}
          <div className="habit-tracker-full widget" style={{ overflowX: 'auto' }}>
            <div className="habit-grid-header">
              <span className="habit-col-name">Habit</span>
              {days.map((d, i) => (
                <span key={d} className={`habit-col-day ${i === todayIndex ? 'today' : ''}`} style={i === todayIndex ? { color: 'var(--accent-blue-light)', fontWeight: 'bold' } : undefined}>
                  {d}
                </span>
              ))}
              <span className="habit-col-streak">Streak</span>
              <span className="habit-col-rate">Rate</span>
              <span className="habit-col-delete"></span>
            </div>
            {habits.map(h => (
              <div key={h.id} className="habit-grid-row">
                <div className="habit-name-cell">
                  <span>{h.name}</span>
                  <span className="habit-target">{h.target}</span>
                </div>
                {h.week.map((done, i) => (
                  <div 
                    key={i} 
                    className={`habit-day-cell ${done ? 'completed' : ''} ${i === todayIndex ? 'today-cell' : ''}`} 
                    style={{ '--hcolor': h.color, cursor: 'pointer' } as React.CSSProperties}
                    onClick={() => toggleHabitDay(h.id, i)}
                    title={`Click to toggle ${days[i]} completion`}
                  >
                    {done ? '✓' : ''}
                  </div>
                ))}
                <div className="habit-streak-cell">
                  <div className="streak-item" title="Current Streak">
                    <span className="streak-fire">🔥</span>
                    <span>{h.streak}d</span>
                  </div>
                  <div className="streak-best" title="Best Streak">
                    <span className="streak-trophy">🏆</span>
                    <span>{h.best}d</span>
                  </div>
                </div>
                <div className="habit-rate-cell">
                  <div className="rate-bar-bg">
                    <div className="rate-bar-fill" style={{ width: `${h.rate}%`, background: h.color }}></div>
                  </div>
                  <span style={{ color: h.color }}>{h.rate}%</span>
                </div>
                <div className="habit-delete-cell">
                  <button 
                    onClick={() => handleDelete(h.id, h.name)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-tertiary)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: '4px'
                    }}
                    title="Delete Habit"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* AI Insights */}
      {habits.length > 0 && (
        <div className="habit-insights widget">
          <div className="widget-header"><h4>🧠 AI Habit Insights</h4></div>
          <div className="insight-cards">
            <div className="insight-card">
              <span className="insight-icon">📊</span>
              <p>Your habit metrics are synced in real time to Cloud Firestore to protect your consistency streak.</p>
            </div>
            <div className="insight-card">
              <span className="insight-icon">🧠</span>
              <p>Habits completed today contribute directly to your dynamic daily productivity score.</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Habit Modal Overlay */}
      {showAddModal && (
        <div className="task-detail-overlay" onClick={() => setShowAddModal(false)}>
          <div className="task-detail-panel widget" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <button className="detail-close" onClick={() => setShowAddModal(false)}>✕</button>
            <div className="detail-header" style={{ marginBottom: '24px' }}>
              <h3>Create New Habit</h3>
              <p>Track a new daily routine in Firestore</p>
            </div>

            <form onSubmit={handleCreateHabit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Habit Name (with Emoji)</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. 🧘 Daily Meditation" 
                  required
                  style={{
                    padding: '12px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'white',
                    outline: 'none'
                  }}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Target Goal</label>
                <input 
                  type="text" 
                  value={newTarget} 
                  onChange={e => setNewTarget(e.target.value)}
                  placeholder="e.g. 15 minutes or 8 glasses" 
                  required
                  style={{
                    padding: '12px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'white',
                    outline: 'none'
                  }}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Theme Color</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {colorsConfig.map(color => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setNewColor(color.value)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: color.value,
                        border: newColor === color.value ? '2px solid white' : 'none',
                        cursor: 'pointer',
                        transform: newColor === color.value ? 'scale(1.15)' : 'scale(1)',
                        transition: 'transform 0.15s ease'
                      }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '12px', padding: '14px' }}>
                Create Habit
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
