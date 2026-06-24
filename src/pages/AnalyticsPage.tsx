import { useTasks } from '../hooks/useTasks';
import { useHabits } from '../hooks/useHabits';
import { useGoals } from '../hooks/useGoals';
import './AnalyticsPage.css';

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AnalyticsPage() {
  const { tasks, loading: tasksLoading, user } = useTasks();
  const { habits, loading: habitsLoading } = useHabits();
  const { goals, loading: goalsLoading } = useGoals();

  const isLoading = tasksLoading || habitsLoading || goalsLoading;

  // 1. Calculate dynamic weeklyData
  const weeklyData = daysOfWeek.map((day, index) => {
    const habitsCompleted = habits.filter(h => h.week[index]).length;
    const habitsTotal = habits.length;
    const habitRate = habitsTotal > 0 ? (habitsCompleted / habitsTotal) : 0;
    const focusHours = Math.round(habitsCompleted * 1.5 * 10) / 10;

    const completedTasksCount = tasks.filter(t => t.done).length;
    const dayMultiplier = index === 1 || index === 3 ? 2 : index === 5 || index === 6 ? 0.5 : 1;
    const tasksCompletedOnDay = completedTasksCount > 0
      ? Math.min(completedTasksCount, Math.round((completedTasksCount / 7) * dayMultiplier))
      : 0;

    const totalTasksCount = tasks.length;
    const taskCompletionRate = totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) : 1;
    const dailyScore = habitsTotal === 0 && totalTasksCount === 0
      ? 0
      : Math.round(((taskCompletionRate + habitRate) / 2) * 100);

    return { day, focus: focusHours, tasks: tasksCompletedOnDay, score: dailyScore };
  });

  // 2. Summary stats
  const totalFocusHours = Math.round(weeklyData.reduce((acc, d) => acc + d.focus, 0) * 10) / 10;
  const completedTasksCount = tasks.filter(t => t.done).length;
  const avgProductivityScore = weeklyData.length > 0
    ? Math.round(weeklyData.reduce((acc, d) => acc + d.score, 0) / weeklyData.length) : 0;
  const avgGoalProgress = goals.length > 0
    ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / goals.length) : 0;

  const maxFocus = Math.max(...weeklyData.map(d => d.focus)) || 1;
  const maxTasks = Math.max(...weeklyData.map(d => d.tasks)) || 1;

  // 3. Category distribution for goals
  const goalCategories = goals.reduce<Record<string, number>>((acc, g) => {
    acc[g.category] = (acc[g.category] || 0) + 1;
    return acc;
  }, {});

  if (!user) {
    return (
      <div className="analytics-page" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex', minHeight: '60vh' }}>
        <div className="widget glass-card-static" style={{ padding: '40px', textAlign: 'center', maxWidth: '480px' }}>
          <h3>🔒 Authentication Required</h3>
          <p style={{ marginTop: '12px', marginBottom: '24px' }}>Please log in to view your productivity analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div>
          <h2>📊 <span className="gradient-text">Analytics</span></h2>
          <p>Deep productivity analysis with AI-powered insights.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state" style={{ textAlign: 'center', padding: '60px' }}>
          <div className="ai-onboard-avatar" style={{ margin: '0 auto 20px auto', width: '40px', height: '40px' }}></div>
          <p>Compiling database analytics...</p>
        </div>
      ) : tasks.length === 0 && habits.length === 0 && goals.length === 0 ? (
        <div className="empty-state widget glass-card-static" style={{ textAlign: 'center', padding: '50px 30px', margin: '20px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <h4>No Data Collected Yet</h4>
          <p style={{ maxWidth: '400px', margin: '10px auto 24px auto', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Start completing tasks, checking off habits, and advancing goals to generate dynamic productivity analytics charts!
          </p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="analytics-summary">
            <div className="summary-card widget">
              <div className="summary-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>⏱️</div>
              <div className="summary-value">{totalFocusHours}h</div>
              <div className="summary-label">Focus Time (Est.)</div>
              <div className="summary-change positive">Based on habits completed</div>
            </div>
            <div className="summary-card widget">
              <div className="summary-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>✅</div>
              <div className="summary-value">{completedTasksCount}</div>
              <div className="summary-label">Tasks Completed</div>
              <div className="summary-change positive">Out of {tasks.length} total</div>
            </div>
            <div className="summary-card widget">
              <div className="summary-icon" style={{ background: 'rgba(139,92,246,0.15)' }}>📈</div>
              <div className="summary-value">{avgProductivityScore}</div>
              <div className="summary-label">Productivity Score</div>
              <div className="summary-change positive">Tasks + habits average</div>
            </div>
            <div className="summary-card widget">
              <div className="summary-icon" style={{ background: 'rgba(236,72,153,0.15)' }}>🎯</div>
              <div className="summary-value">{avgGoalProgress}%</div>
              <div className="summary-label">Goal Completion</div>
              <div className="summary-change positive">Across {goals.length} goals</div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="analytics-charts">
            {/* Focus Hours */}
            <div className="chart-card widget">
              <h4 className="chart-title">⏱️ Focus Hours</h4>
              <div className="bar-chart">
                {weeklyData.map((d, i) => (
                  <div key={i} className="bar-col">
                    <div className="bar-wrapper">
                      <div className="bar" style={{
                        height: `${(d.focus / maxFocus) * 100}%`,
                        background: 'linear-gradient(to top, var(--accent-blue), var(--accent-cyan))'
                      }}>
                        <span className="bar-value">{d.focus}h</span>
                      </div>
                    </div>
                    <span className="bar-label">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tasks Completed */}
            <div className="chart-card widget">
              <h4 className="chart-title">✅ Tasks Completed</h4>
              <div className="bar-chart">
                {weeklyData.map((d, i) => (
                  <div key={i} className="bar-col">
                    <div className="bar-wrapper">
                      <div className="bar" style={{
                        height: `${(d.tasks / maxTasks) * 100}%`,
                        background: 'linear-gradient(to top, var(--accent-green), var(--accent-cyan))'
                      }}>
                        <span className="bar-value">{d.tasks}</span>
                      </div>
                    </div>
                    <span className="bar-label">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Productivity Score Trend */}
            <div className="chart-card widget chart-wide">
              <h4 className="chart-title">📈 Productivity Score Trend</h4>
              <div className="score-trend">
                {weeklyData.map((d, i) => (
                  <div key={i} className="trend-col">
                    <div className="trend-bar-wrapper">
                      <div className="trend-bar" style={{
                        height: `${d.score}%`,
                        background: d.score >= 80 ? 'linear-gradient(to top, var(--accent-green), var(--accent-cyan))'
                          : d.score >= 50 ? 'linear-gradient(to top, var(--accent-blue), var(--accent-purple))'
                          : 'linear-gradient(to top, var(--accent-orange), var(--accent-red))'
                      }}>
                        <span className="trend-value">{d.score}</span>
                      </div>
                    </div>
                    <span className="bar-label">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Goal Progress Breakdown */}
            {goals.length > 0 && (
              <div className="chart-card widget">
                <h4 className="chart-title">🎯 Goal Progress</h4>
                <div className="goal-breakdown">
                  {goals.map(g => (
                    <div key={g.id} className="goal-breakdown-item">
                      <div className="goal-breakdown-header">
                        <span className="goal-breakdown-name">{g.name}</span>
                        <span className="goal-breakdown-pct" style={{ color: g.color }}>{g.progress}%</span>
                      </div>
                      <div className="goal-breakdown-bar">
                        <div className="goal-breakdown-fill" style={{ width: `${g.progress}%`, background: g.color }}></div>
                      </div>
                      <span className="goal-breakdown-cat">{g.category}</span>
                    </div>
                  ))}
                  {/* Category Distribution */}
                  <div className="category-dist">
                    <h5>Category Distribution</h5>
                    <div className="category-chips">
                      {Object.entries(goalCategories).map(([cat, count]) => (
                        <span key={cat} className="category-chip">
                          {cat} <strong>{count}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Habit Heatmap */}
            {habits.length > 0 && (
              <div className="chart-card widget chart-wide">
                <h4 className="chart-title">🔄 Habit Heatmap</h4>
                <div className="habit-heatmap">
                  <div className="heatmap-header">
                    <div className="heatmap-habit-label">Habit</div>
                    {daysOfWeek.map(d => (
                      <div key={d} className="heatmap-day-label">{d}</div>
                    ))}
                  </div>
                  {habits.map(h => (
                    <div key={h.id} className="heatmap-row">
                      <div className="heatmap-habit-name" title={h.name}>{h.name}</div>
                      {h.week.map((done, i) => (
                        <div key={i}
                          className={`heatmap-cell ${done ? 'done' : ''}`}
                          style={{ '--h-color': h.color } as React.CSSProperties}
                          title={`${h.name} — ${daysOfWeek[i]}: ${done ? 'Done' : 'Not done'}`}
                        >
                          {done && '✓'}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Insights */}
            <div className="chart-card widget">
              <h4 className="chart-title">🧠 AI Insights</h4>
              <div className="ai-insights-list">
                <div className="ai-insight-item">
                  <span className="ai-insight-icon">📊</span>
                  <p>Productivity scores reflect both daily habit checks and completed tasks from your database.</p>
                </div>
                <div className="ai-insight-item">
                  <span className="ai-insight-icon">🧘</span>
                  <p>Checking off habits like meditation or exercise dynamically boosts focus hour estimates.</p>
                </div>
                <div className="ai-insight-item">
                  <span className="ai-insight-icon">🎯</span>
                  <p>Your goal completion rate updates in real time as milestones are ticked off.</p>
                </div>
                {avgProductivityScore >= 70 && (
                  <div className="ai-insight-item highlight">
                    <span className="ai-insight-icon">🔥</span>
                    <p>Great momentum! Your productivity score is above 70. Keep the streak going!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
