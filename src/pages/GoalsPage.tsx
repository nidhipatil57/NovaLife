import { useState } from 'react';
import { useGoals } from '../hooks/useGoals';
import './GoalsPage.css';

const categories = ['All', 'Academic', 'Career', 'Health', 'Finance', 'Personal'];

const colorsConfig = [
  { name: 'Blue', value: 'var(--accent-blue)' },
  { name: 'Green', value: 'var(--accent-green)' },
  { name: 'Purple', value: 'var(--accent-purple)' },
  { name: 'Cyan', value: 'var(--accent-cyan)' },
  { name: 'Orange', value: 'var(--accent-orange)' },
  { name: 'Pink', value: 'var(--accent-pink)' },
];

export default function GoalsPage() {
  const { goals, loading, addGoal, toggleMilestone, deleteGoal, user } = useGoals();
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Personal');
  const [newColor, setNewColor] = useState('var(--accent-blue)');
  const [newMilestonesInput, setNewMilestonesInput] = useState('');

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      const milestones = newMilestonesInput
        .split(',')
        .map((m) => m.trim())
        .filter((m) => m.length > 0)
        .map((m) => ({ text: m, done: false }));

      await addGoal({
        name: newName,
        category: newCategory,
        progress: 0,
        color: newColor,
        milestones: milestones.length > 0 ? milestones : [{ text: 'Get started', done: false }],
      });

      // Reset
      setNewName('');
      setNewCategory('Personal');
      setNewColor('var(--accent-blue)');
      setNewMilestonesInput('');
      setShowAddModal(false);
    } catch (err) {
      alert('Failed to add goal.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the goal roadmap "${name}"?`)) {
      try {
        await deleteGoal(id);
      } catch (err) {
        alert('Failed to delete goal.');
      }
    }
  };

  const filteredGoals = goals.filter(g => {
    if (selectedCategory === 'All') return true;
    return g.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  if (!user) {
    return (
      <div className="goals-page" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex', minHeight: '60vh' }}>
        <div className="widget glass-card-static" style={{ padding: '40px', textAlign: 'center', maxWidth: '480px' }}>
          <h3>🔒 Authentication Required</h3>
          <p style={{ marginTop: '12px', marginBottom: '24px' }}>Please log in using Google or email on the login page to manage your goals.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="goals-page">
      <div className="page-header">
        <div>
          <h2>🎯 <span className="gradient-text">Goals</span></h2>
          <p>Long-term achievements with AI-powered roadmaps and milestone tracking.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-primary btn-sm" onClick={() => setShowAddModal(true)}>+ New Goal</button>
        </div>
      </div>

      <div className="goal-categories">
        {categories.map(c => (
          <button 
            key={c} 
            className={`filter-btn ${c === selectedCategory ? 'active' : ''}`}
            onClick={() => setSelectedCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state" style={{ textAlign: 'center', padding: '60px' }}>
          <div className="ai-onboard-avatar" style={{ margin: '0 auto 20px auto', width: '40px', height: '40px' }}></div>
          <p>Synchronizing goals with Firestore Database...</p>
        </div>
      ) : filteredGoals.length === 0 ? (
        <div className="empty-state widget glass-card-static" style={{ textAlign: 'center', padding: '50px 30px', margin: '20px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
          <h4>No Goals Found</h4>
          <p style={{ maxWidth: '400px', margin: '10px auto 24px auto', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Your goals roadmap is empty. Click "+ New Goal" to set a milestone and outline your future!
          </p>
          <button className="btn-primary btn-sm" onClick={() => setShowAddModal(true)}>+ Add New Goal</button>
        </div>
      ) : (
        /* Goal Roadmap Cards */
        <div className="goals-grid">
          {filteredGoals.map(goal => (
            <div key={goal.id} className="goal-card widget" style={{ position: 'relative' }}>
              
              {/* Delete button in corner */}
              <button
                onClick={() => handleDelete(goal.id, goal.name)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  zIndex: 3
                }}
                title="Delete Goal"
              >
                🗑️
              </button>

              <div className="goal-card-header">
                <span className="goal-category-badge" style={{ color: goal.color, borderColor: goal.color }}>{goal.category}</span>
                <span className="goal-pct-lg" style={{ color: goal.color }}>{goal.progress}%</span>
              </div>
              <h3 className="goal-card-title">{goal.name}</h3>
              
              {/* Progress Ring */}
              <div className="goal-ring-wrapper">
                <svg viewBox="0 0 80 80" className="goal-ring-svg">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="5" />
                  <circle cx="40" cy="40" r="34" fill="none" stroke={goal.color} strokeWidth="5"
                    strokeLinecap="round" strokeDasharray="213.6"
                    strokeDashoffset={213.6 - (goal.progress / 100) * 213.6}
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '40px 40px', transition: 'stroke-dashoffset 0.8s ease-out' }} />
                </svg>
              </div>

              {/* Milestones Roadmap */}
              <div className="milestone-roadmap">
                {goal.milestones.map((m, i) => (
                  <div 
                    key={i} 
                    className={`milestone ${m.done ? 'done' : ''}`}
                    onClick={() => toggleMilestone(goal.id, i)}
                    style={{ cursor: 'pointer' }}
                    title={`Click to toggle milestone: ${m.text}`}
                  >
                    <div className="milestone-dot" style={{ backgroundColor: m.done ? goal.color : undefined, borderColor: m.done ? goal.color : undefined }}>
                      {m.done ? '✓' : (i + 1)}
                    </div>
                    {i < goal.milestones.length - 1 && <div className="milestone-line"></div>}
                    <span className="milestone-text" style={{ textDecoration: m.done ? 'line-through opacity 0.5' : 'none' }}>
                      {m.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Goal Planner Info */}
      {goals.length > 0 && (
        <div className="ai-planner widget">
          <div className="widget-header">
            <h4>🤖 AI Goal Planner</h4>
          </div>
          <div className="planner-content">
            <div className="planner-ai-msg">
              <div className="ai-avatar-inner" style={{ width: 24, height: 24, flexShrink: 0 }}></div>
              <p>Your goals and milestones are stored securely in Cloud Firestore and will synchronize automatically across all devices.</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Goal Modal Overlay */}
      {showAddModal && (
        <div className="task-detail-overlay" onClick={() => setShowAddModal(false)}>
          <div className="task-detail-panel widget" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <button className="detail-close" onClick={() => setShowAddModal(false)}>✕</button>
            <div className="detail-header" style={{ marginBottom: '24px' }}>
              <h3>Create New Goal Roadmap</h3>
              <p>Map out a long-term goal in Firestore</p>
            </div>

            <form onSubmit={handleCreateGoal} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Goal Title</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Ace Final Exams or Read 12 Books" 
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Category</label>
                  <select 
                    value={newCategory} 
                    onChange={e => setNewCategory(e.target.value)}
                    style={{
                      padding: '12px',
                      background: '#0E1628',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-md)',
                      color: 'white',
                      outline: 'none'
                    }}
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Theme Color</label>
                  <select 
                    value={newColor} 
                    onChange={e => setNewColor(e.target.value)}
                    style={{
                      padding: '12px',
                      background: '#0E1628',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-md)',
                      color: 'white',
                      outline: 'none'
                    }}
                  >
                    {colorsConfig.map(color => (
                      <option key={color.value} value={color.value}>{color.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Roadmap Milestones (comma-separated)</label>
                <textarea 
                  value={newMilestonesInput} 
                  onChange={e => setNewMilestonesInput(e.target.value)}
                  placeholder="e.g. Buy textbook, Revise Chapter 1, Revise Chapter 2, Take Mock Exam" 
                  rows={3}
                  required
                  style={{
                    padding: '12px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'white',
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '12px', padding: '14px' }}>
                Create Goal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
