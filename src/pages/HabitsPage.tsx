import { useState, useEffect } from 'react';
import { useHabits, type Habit } from '../hooks/useHabits';
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
  const { habits, loading, addHabit, toggleHabitDay, deleteHabit, updateHabit, user } = useHabits();
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newColor, setNewColor] = useState('var(--accent-blue)');
  const [newNotes, setNewNotes] = useState('');
  
  // Edit modal states
  const [selectedHabitForEdit, setSelectedHabitForEdit] = useState<Habit | null>(null);
  const [editName, setEditName] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editColor, setEditColor] = useState('var(--accent-blue)');

  // AI Habit Coach states
  const [habitAnalysis, setHabitAnalysis] = useState<any>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);


  // Run automatically on mount/loading finish if habits exist
  useEffect(() => {
    if (habits.length > 0 && !habitAnalysis && !loadingAnalysis && !loading) {
      runHabitAnalysis();
    }
  }, [habits.length, loading]);

  const runHabitAnalysis = async () => {
    setLoadingAnalysis(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error('API Key is not configured');

      const systemPrompt = `You are "Nova", an elite habit formation coach. Analyze the user's habits:
${JSON.stringify(habits.map(h => ({ name: h.name, target: h.target, streak: h.streak, best: h.best, rate: h.rate, week: h.week })))}

Provide an intelligent, tactical habit pattern analysis.
You MUST respond with a JSON object matching this exact schema. Do not write any explanations outside the JSON object. Do not wrap the JSON in markdown code blocks.

{
  "bestTime": "Recommended best time/schedule for completing these habits based on habits data",
  "skipDays": "Identify days of week or patterns when habits are usually skipped (Mon-Sun rate check)",
  "productivityImpact": "Highlight which habits are boosting productivity score the most",
  "consistencyStack": "Suggest habit stacking techniques or recovery suggestions (e.g. read 5 pages instead of 30 today)"
}
`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (!response.ok) throw new Error('Failed to get habit analysis');
      const data = await response.json();
      const parsed = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text.trim() || '{}');
      setHabitAnalysis(parsed);
    } catch (err) {
      console.error('Habit analysis failed:', err);
      setHabitAnalysis({
        error: true,
        bestTime: 'Evaluate completion logs to schedule routines.',
        skipDays: 'Consistency varies across different days of the week.',
        productivityImpact: 'Streaks maintain a higher productivity index.',
        consistencyStack: 'Stack habits back-to-back or reduce targets to rebuild consistency.'
      });
    } finally {
      setLoadingAnalysis(false);
    }
  };



  const [habitToDelete, setHabitToDelete] = useState<{ id: string; name: string } | null>(null);

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
        notes: newNotes,
      });

      // Reset
      setNewName('');
      setNewTarget('');
      setNewColor('var(--accent-blue)');
      setNewNotes('');
      setShowAddModal(false);
    } catch (err) {
      alert('Failed to add habit.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHabit(id);
    } catch (err) {
      alert('Failed to delete habit.');
    }
  };

  const handleEditClick = (habit: Habit) => {
    setSelectedHabitForEdit(habit);
    setEditName(habit.name);
    setEditTarget(habit.target);
    setEditNotes(habit.notes || '');
    setEditColor(habit.color || 'var(--accent-blue)');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHabitForEdit) return;
    if (!editName.trim() || !editTarget.trim()) return;

    try {
      await updateHabit(selectedHabitForEdit.id, {
        name: editName,
        target: editTarget,
        notes: editNotes,
        color: editColor,
      });
      setSelectedHabitForEdit(null);
    } catch (err) {
      alert('Failed to update habit.');
    }
  };

  const handleDeleteFromEdit = () => {
    if (!selectedHabitForEdit) return;
    setHabitToDelete({
      id: selectedHabitForEdit.id,
      name: selectedHabitForEdit.name,
    });
    setSelectedHabitForEdit(null);
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
                     onClick={() => handleEditClick(h)}
                     className="btn-secondary btn-xs"
                     style={{
                       borderColor: 'var(--accent-blue-light)',
                       color: 'var(--accent-blue-light)',
                       background: 'rgba(59, 130, 246, 0.05)',
                       padding: '4px 10px',
                       fontSize: '11px',
                       borderRadius: '4px',
                       fontWeight: 'bold',
                       cursor: 'pointer'
                     }}
                   >
                     Edit
                   </button>
                 </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Dynamic AI Habit Coach Insights */}
      {habits.length > 0 && (
        <div className="habit-insights widget" style={{ marginTop: '24px' }}>
          <div className="widget-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px', marginBottom: '16px' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <span>🧠</span> AI Habit Coach & Insights
            </h4>
          </div>

          {loadingAnalysis && !habitAnalysis ? (
            <div className="ai-loading" style={{ padding: '24px', textAlign: 'center' }}>
              <div className="ai-onboard-avatar" style={{ margin: '0 auto 12px auto', width: '32px', height: '32px' }}></div>
              <p style={{ fontSize: 'var(--text-sm)' }}>Nova is scanning your consistency streaks and habit schedules...</p>
            </div>
          ) : (
            <>
              {habitAnalysis && (
                <div className="habit-analysis-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div className="analysis-card widget glass-card-static" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}>⏰ Best Time for Completion</div>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0, lineHeight: '1.4' }}>
                      {habitAnalysis.bestTime}
                    </p>
                  </div>

                  <div className="analysis-card widget glass-card-static" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}>📅 Skip Day Warnings</div>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0, lineHeight: '1.4' }}>
                      {habitAnalysis.skipDays}
                    </p>
                  </div>

                  <div className="analysis-card widget glass-card-static" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}>⚡ Productivity Score Link</div>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0, lineHeight: '1.4' }}>
                      {habitAnalysis.productivityImpact}
                    </p>
                  </div>

                  <div className="analysis-card widget glass-card-static" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}>🔄 Habit Stacking & Consistency Recovery</div>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0, lineHeight: '1.4' }}>
                      {habitAnalysis.consistencyStack}
                    </p>
                  </div>
                </div>
              )}

            </>
          )}
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
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Notes</label>
                <textarea 
                  value={newNotes} 
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Add details, notes, or milestones here..." 
                  style={{
                    padding: '12px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'white',
                    outline: 'none',
                    resize: 'vertical',
                    minHeight: '80px',
                    fontFamily: 'inherit'
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

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ 
                  marginTop: '12px', 
                  padding: '10px 16px', 
                  fontSize: '13px', 
                  fontWeight: 'bold',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer' 
                }}
              >
                Create Habit
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Habit Modal Overlay */}
      {selectedHabitForEdit && (
        <div className="task-detail-overlay" onClick={() => setSelectedHabitForEdit(null)}>
          <div className="task-detail-panel widget" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <button className="detail-close" onClick={() => setSelectedHabitForEdit(null)}>✕</button>
            <div className="detail-header" style={{ marginBottom: '24px' }}>
              <h3>Edit Habit</h3>
              <p>Update habit details in Firestore</p>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Habit Name (with Emoji)</label>
                <input 
                  type="text" 
                  value={editName} 
                  onChange={e => setEditName(e.target.value)}
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
                  value={editTarget} 
                  onChange={e => setEditTarget(e.target.value)}
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
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Notes</label>
                <textarea 
                  value={editNotes} 
                  onChange={e => setEditNotes(e.target.value)}
                  placeholder="Add details, notes, or milestones here..." 
                  style={{
                    padding: '12px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'white',
                    outline: 'none',
                    resize: 'vertical',
                    minHeight: '80px',
                    fontFamily: 'inherit'
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
                      onClick={() => setEditColor(color.value)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: color.value,
                        border: editColor === color.value ? '2px solid white' : 'none',
                        cursor: 'pointer',
                        transform: editColor === color.value ? 'scale(1.15)' : 'scale(1)',
                        transition: 'transform 0.15s ease'
                      }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ 
                    flex: 1, 
                    padding: '10px 16px', 
                    fontSize: '13px', 
                    fontWeight: 'bold',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer'
                  }}
                >
                  Save Changes
                </button>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={handleDeleteFromEdit}
                  style={{
                    borderColor: 'var(--accent-red)',
                    color: 'var(--accent-red)',
                    background: 'rgba(239, 68, 68, 0.05)',
                    padding: '10px 16px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  Delete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {habitToDelete && (
        <div className="task-detail-overlay" onClick={() => setHabitToDelete(null)}>
          <div className="task-detail-panel widget" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
            <button className="detail-close" onClick={() => setHabitToDelete(null)}>✕</button>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
            <h3>Delete Habit</h3>
            <p style={{ marginTop: '12px', marginBottom: '24px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Are you sure you want to delete the habit <strong>"{habitToDelete.name}"</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button type="button" className="btn-secondary btn-sm" onClick={() => setHabitToDelete(null)}>Cancel</button>
              <button 
                type="button" 
                className="btn-primary btn-sm" 
                onClick={async () => {
                  if (habitToDelete) {
                    await handleDelete(habitToDelete.id);
                    setHabitToDelete(null);
                  }
                }}
                style={{ backgroundColor: 'var(--accent-red)', borderColor: 'var(--accent-red)' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
