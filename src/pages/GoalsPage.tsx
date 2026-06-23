import './GoalsPage.css';

const goals = [
  { id: 1, name: 'Become Web Developer', category: 'Career', progress: 62, color: 'var(--accent-blue)',
    milestones: [
      { text: 'Complete HTML/CSS Course', done: true },
      { text: 'Learn JavaScript', done: true },
      { text: 'Build 3 Projects', done: false },
      { text: 'Learn React', done: false },
      { text: 'Get Internship', done: false },
    ]},
  { id: 2, name: 'Get Fit — Lose 10kg', category: 'Health', progress: 45, color: 'var(--accent-green)',
    milestones: [
      { text: 'Join Gym', done: true },
      { text: 'Consistent 3x/week', done: true },
      { text: 'Reach -5kg', done: false },
      { text: 'Reach -10kg', done: false },
    ]},
  { id: 3, name: 'Read 12 Books This Year', category: 'Personal', progress: 42, color: 'var(--accent-purple)',
    milestones: [
      { text: 'Atomic Habits ✓', done: true },
      { text: 'Deep Work ✓', done: true },
      { text: 'Sapiens ✓', done: true },
      { text: 'Thinking, Fast and Slow ✓', done: true },
      { text: 'The Lean Startup ✓', done: true },
      { text: 'Book #6-12', done: false },
    ]},
  { id: 4, name: 'Ace Final Exams', category: 'Academic', progress: 30, color: 'var(--accent-cyan)',
    milestones: [
      { text: 'Physics Revision', done: true },
      { text: 'Math Mock Tests', done: false },
      { text: 'Chemistry Labs', done: false },
      { text: 'Final Review', done: false },
    ]},
  { id: 5, name: 'Save ₹50,000', category: 'Finance', progress: 68, color: 'var(--accent-orange)',
    milestones: [
      { text: 'Open Savings Account', done: true },
      { text: 'Reach ₹15,000', done: true },
      { text: 'Reach ₹30,000', done: true },
      { text: 'Reach ₹50,000', done: false },
    ]},
];

const categories = ['All', 'Academic', 'Career', 'Health', 'Finance', 'Personal'];

export default function GoalsPage() {
  return (
    <div className="goals-page">
      <div className="page-header">
        <div>
          <h2>🎯 <span className="gradient-text">Goals</span></h2>
          <p>Long-term achievements with AI-powered roadmaps and milestone tracking.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-primary btn-sm">+ New Goal</button>
        </div>
      </div>

      <div className="goal-categories">
        {categories.map(c => (
          <button key={c} className={`filter-btn ${c === 'All' ? 'active' : ''}`}>{c}</button>
        ))}
      </div>

      {/* Goal Roadmap Cards */}
      <div className="goals-grid">
        {goals.map(goal => (
          <div key={goal.id} className="goal-card widget">
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
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '40px 40px', transition: 'stroke-dashoffset 1.5s ease-out' }} />
              </svg>
            </div>

            {/* Milestones Roadmap */}
            <div className="milestone-roadmap">
              {goal.milestones.map((m, i) => (
                <div key={i} className={`milestone ${m.done ? 'done' : ''}`}>
                  <div className="milestone-dot">{m.done ? '✓' : (i + 1)}</div>
                  {i < goal.milestones.length - 1 && <div className="milestone-line"></div>}
                  <span className="milestone-text">{m.text}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* AI Goal Planner */}
      <div className="ai-planner widget">
        <div className="widget-header">
          <h4>🤖 AI Goal Planner</h4>
        </div>
        <div className="planner-content">
          <div className="planner-ai-msg">
            <div className="ai-avatar-inner" style={{ width: 24, height: 24, flexShrink: 0 }}></div>
            <p>Based on your progress, here's your optimized plan for this month:</p>
          </div>
          <div className="planner-grid">
            <div className="planner-item">
              <span className="planner-period">This Week</span>
              <span className="planner-action">Complete React tutorial + 2 gym sessions</span>
            </div>
            <div className="planner-item">
              <span className="planner-period">Next Week</span>
              <span className="planner-action">Build portfolio project + Math mock test</span>
            </div>
            <div className="planner-item">
              <span className="planner-period">Week 3</span>
              <span className="planner-action">Apply for internships + Read 2 books</span>
            </div>
            <div className="planner-item">
              <span className="planner-period">Month End</span>
              <span className="planner-action">Final exam revision + Goal review</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
