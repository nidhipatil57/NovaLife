import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useHabits } from '../hooks/useHabits';
import { useGoals } from '../hooks/useGoals';
import { useDataContext } from '../context/DataContext';
import { parseTaskDueDate } from '../utils/dateParser';
import './DashboardHome.css';

const isOverdue = (task: any) => {
  if (task.done) return false;
  const dueDate = parseTaskDueDate(task.due);
  return dueDate !== null && dueDate.getTime() < Date.now();
};

export default function DashboardHome() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const { tasks, loading: tasksLoading, toggleTask, user } = useTasks();
  const { habits, loading: habitsLoading, toggleHabitDay } = useHabits();
  const { goals, loading: goalsLoading } = useGoals();
  const { productivityScore, focusSessions } = useDataContext();

  const todayIndex = (new Date().getDay() + 6) % 7; // Monday = 0, Sunday = 6

  const todayFocusHours = useMemo(() => {
    const todayStr = new Date().toDateString();
    const todaySessions = focusSessions.filter(s => {
      const d = new Date(s.created_at || s.created_at || new Date());
      return d.toDateString() === todayStr;
    });
    const totalSeconds = todaySessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    return Math.round((totalSeconds / 3600) * 10) / 10;
  }, [focusSessions]);

  // Calculations for daily briefing
  const activeTasks = tasks.filter(t => !t.done);
  const highPriorityCount = activeTasks.filter(t => t.priority === 'critical' || t.priority === 'high').length;
  
  const overdueCount = activeTasks.filter(t => isOverdue(t)).length;
  const approachingCount = activeTasks.filter(t => t.due && t.due.toLowerCase().trim() !== 'no due date' && !isOverdue(t)).length;

  const totalTasksCount = tasks.length;
  const maxStreak = useMemo(() => {
    return habits.length > 0 ? Math.max(...habits.map(h => h.streak || 0), 0) : 0;
  }, [habits]);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';

  if (!user) {
    return (
      <div className="dash-home" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex', minHeight: '60vh' }}>
        <div className="widget glass-card-static" style={{ padding: '40px', textAlign: 'center', maxWidth: '480px' }}>
          <h3>🔒 Authentication Required</h3>
          <p style={{ marginTop: '12px', marginBottom: '24px' }}>Please log in using Google or email on the login page to access your personal dashboard.</p>
        </div>
      </div>
    );
  }

  const isLoading = tasksLoading || habitsLoading || goalsLoading;

  return (
    <div className="dash-home">
      {/* AI Daily Briefing */}
      <div className="briefing-card widget">
        <div className="briefing-left">
          <h2 className="dash-greeting">{greeting}, <span className="gradient-text">{displayName}</span> 👋</h2>
          {isLoading ? (
            <p className="briefing-summary">Synchronizing data with Cloud Firestore...</p>
          ) : tasks.length === 0 && habits.length === 0 && goals.length === 0 ? (
            <p className="briefing-summary">
              Welcome to NovaLife! Your workspace is fresh and clean. Start by adding a task or tracking a habit.
            </p>
          ) : (
            <p className="briefing-summary">
              You have <strong style={{ color: 'var(--accent-red-light)' }}>{highPriorityCount} active high-priority task{highPriorityCount !== 1 ? 's' : ''}</strong>,{' '}
              <strong style={{ color: 'var(--accent-red)' }}>{overdueCount} task{overdueCount !== 1 ? 's' : ''} overdue</strong>, and{' '}
              <strong style={{ color: 'var(--accent-orange-light)' }}>{approachingCount} deadline{approachingCount !== 1 ? 's' : ''} approaching</strong>.
            </p>
          )}
          <div className="briefing-stats">
            <div className="brief-stat">
              <span className="brief-stat-value">{isLoading ? '--' : activeTasks.length}</span>
              <span className="brief-stat-label">Tasks Active</span>
            </div>
            <div className="brief-stat">
              <span className="brief-stat-value">
                {isLoading ? '--' : habits.filter(h => h.week[todayIndex]).length}
              </span>
              <span className="brief-stat-label">Habits Checked Today</span>
            </div>
            <div className="brief-stat">
              <span className="brief-stat-value">{isLoading ? '--' : productivityScore}</span>
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

      {/* Widget Grid */}
      <div className="dash-grid">
        <TaskWidgetCompact isLoading={tasksLoading} tasks={tasks} toggleTask={toggleTask} />
        <ScoreWidget score={productivityScore} totalTasks={totalTasksCount} focusHours={todayFocusHours} streak={maxStreak} />
        <DeadlineWidgetCompact tasks={tasks} />
        <GoalWidgetCompact isLoading={goalsLoading} goals={goals} />
        <HabitWidgetCompact isLoading={habitsLoading} habits={habits} toggleHabitDay={toggleHabitDay} todayIndex={todayIndex} />
        <AISuggestionsWidget activeTasks={activeTasks} />
      </div>

      <AchievementsCelebrationWidget 
        tasks={tasks} 
        goals={goals} 
        habits={habits} 
        focusSessions={focusSessions} 
      />
    </div>
  );
}

interface TaskWidgetProps {
  isLoading: boolean;
  tasks: any[];
  toggleTask: (id: string, done: boolean) => void;
}

function TaskWidgetCompact({ isLoading, tasks, toggleTask }: TaskWidgetProps) {
  const activeTasks = tasks.filter(t => !t.done).slice(0, 5);

  return (
    <div className="widget widget-tasks">
      <div className="widget-header">
        <h4>📋 Active Tasks</h4>
        <Link to="/tasks" className="widget-link">View All →</Link>
      </div>
      <div className="task-list-compact">
        {isLoading ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', padding: '10px 0' }}>Syncing...</p>
        ) : activeTasks.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', padding: '20px 0', textAlign: 'center' }}>No active tasks! 🎉</p>
        ) : (
          activeTasks.map(task => (
            <div key={task.id} className={`task-row ${task.done ? 'done' : ''}`} onClick={() => toggleTask(task.id, !task.done)}>
              <div className={`task-check-sm ${task.done ? 'checked' : ''}`}>{task.done && '✓'}</div>
              <span className="task-text-sm">{task.text}</span>
              <span className="task-due-sm">{task.due}</span>
              <span className="task-dot" style={{
                background: task.priority === 'critical' || task.priority === 'high' ? 'var(--accent-red)' :
                  task.priority === 'medium' ? 'var(--accent-orange)' : 'var(--accent-green)'
              }}></span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface ScoreWidgetProps {
  score: number;
  totalTasks: number;
  focusHours: number;
  streak: number;
}

function ScoreWidget({ score, totalTasks, focusHours, streak }: ScoreWidgetProps) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="widget widget-score-home">
      <div className="widget-header">
        <h4>📈 Productivity Score</h4>
        <Link to="/analytics" className="widget-link">Details →</Link>
      </div>
      <div className="score-chart-home" style={{ position: 'relative', width: '130px', height: '130px', margin: '0 auto var(--space-4) auto' }}>
        <svg viewBox="0 0 120 120" className="score-svg-home" style={{ width: '100%', height: '100%' }}>
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
        </svg>
        <div className="score-center-text" style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <span style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-primary)', lineHeight: '1' }}>{score}</span>
          <span style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-tertiary)', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '2px' }}>SCORE</span>
        </div>
      </div>
      <div className="score-mini-stats">
        <div><strong>{totalTasks}</strong><span>Tasks</span></div>
        <div><strong>{focusHours}h</strong><span>Focus</span></div>
        <div><strong>{streak}</strong><span>Streak</span></div>
      </div>
    </div>
  );
}

function DeadlineWidgetCompact({ tasks }: { tasks: any[] }) {
  const overdueTasks = tasks
    .filter(t => !t.done && isOverdue(t))
    .sort((a, b) => {
      const aDate = parseTaskDueDate(a.due);
      const bDate = parseTaskDueDate(b.due);
      if (aDate && bDate) return aDate.getTime() - bDate.getTime();
      return 0;
    });

  const upcomingUrgent = tasks
    .filter(t => !t.done && !isOverdue(t) && (t.priority === 'critical' || t.priority === 'high'))
    .sort((a, b) => {
      const aDate = parseTaskDueDate(a.due);
      const bDate = parseTaskDueDate(b.due);
      if (aDate && bDate) return aDate.getTime() - bDate.getTime();
      return 0;
    })
    .slice(0, 3);

  const deadlines = [...overdueTasks, ...upcomingUrgent];

  return (
    <div className="widget widget-deadlines">
      <div className="widget-header">
        <h4>⏰ Critical Deadlines</h4>
        <Link to="/tasks" className="widget-link">View All →</Link>
      </div>
      <div className="deadline-list-compact">
        {deadlines.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', padding: '20px 0', textAlign: 'center' }}>No urgent deadlines! 😎</p>
        ) : (
          deadlines.map((d, i) => (
            <div key={i} className={`deadline-row urgency-${isOverdue(d) || d.priority === 'critical' ? 'critical' : 'high'}`}>
              <div className="dl-indicator"></div>
              <div className="dl-info">
                <span className="dl-task">{d.text}</span>
                <span className="dl-due" style={isOverdue(d) ? { color: 'var(--accent-red)', fontWeight: 'bold' } : {}}>
                  {isOverdue(d) ? '⚠️ Overdue! ' : ''}{d.due}
                </span>
              </div>
              {(d.priority === 'critical' || isOverdue(d)) && <span className="dl-badge">🚨</span>}
            </div>
          ))
        )}

      </div>
    </div>
  );
}

interface GoalWidgetProps {
  isLoading: boolean;
  goals: any[];
}

function GoalWidgetCompact({ isLoading, goals }: GoalWidgetProps) {
  const compactGoals = goals.filter(g => g.progress < 100).slice(0, 3);

  return (
    <div className="widget widget-goals">
      <div className="widget-header">
        <h4>🎯 Goals Roadmap</h4>
        <Link to="/goals" className="widget-link">View All →</Link>
      </div>
      <div className="goal-list-compact">
        {isLoading ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', padding: '10px 0' }}>Syncing...</p>
        ) : compactGoals.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', padding: '20px 0', textAlign: 'center' }}>No goals set yet.</p>
        ) : (
          compactGoals.map((g, i) => (
            <div key={i} className="goal-row">
              <div className="goal-row-top">
                <span>{g.name}</span>
                <span style={{ color: g.color, fontWeight: 700 }}>{g.progress}%</span>
              </div>
              <div className="goal-bar-sm">
                <div className="goal-fill-sm" style={{ width: `${g.progress}%`, background: g.color, boxShadow: `0 0 8px ${g.color}` }}></div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface HabitWidgetProps {
  isLoading: boolean;
  habits: any[];
  toggleHabitDay: (id: string, index: number) => void;
  todayIndex: number;
}

function HabitWidgetCompact({ isLoading, habits, toggleHabitDay, todayIndex }: HabitWidgetProps) {
  const compactHabits = habits.slice(0, 4);
  const daysShort = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="widget widget-habits" style={{ minWidth: '320px' }}>
      <div className="widget-header">
        <h4>🔄 Habit Tracker</h4>
        <Link to="/habits" className="widget-link">View All →</Link>
      </div>
      <div className="habit-mini-grid">
        {isLoading ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', padding: '10px 0' }}>Syncing...</p>
        ) : compactHabits.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', padding: '20px 0', textAlign: 'center' }}>No habits tracked.</p>
        ) : (
          <>
            <div className="mini-grid-header" style={{ display: 'grid', gridTemplateColumns: '1.2fr repeat(7, 1fr)', gap: '4px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px', marginBottom: '8px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', textAlign: 'center' }}>
              <span style={{ textAlign: 'left', fontWeight: 'bold' }}>Habit</span>
              {daysShort.map((day, idx) => (
                <span key={idx} className={`mini-grid-day-lbl ${idx === todayIndex ? 'today' : ''}`} style={idx === todayIndex ? { color: 'var(--accent-blue-light)', fontWeight: 'bold' } : undefined}>{day}</span>
              ))}
            </div>
            <div className="mini-grid-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {compactHabits.map((h) => (
                <div key={h.id} className="mini-grid-row" style={{ display: 'grid', gridTemplateColumns: '1.2fr repeat(7, 1fr)', gap: '4px', alignItems: 'center' }}>
                  <span className="mini-habit-title" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left' }} title={h.name}>{h.name}</span>
                  {h.week.map((done: boolean, idx: number) => (
                    <div 
                      key={idx}
                      className={`mini-grid-cell ${done ? 'completed' : ''} ${idx === todayIndex ? 'today' : ''}`}
                      onClick={() => toggleHabitDay(h.id, idx)}
                      style={{ 
                        height: '24px', 
                        borderRadius: 'var(--radius-sm)', 
                        border: '1px solid rgba(255,255,255,0.06)', 
                        background: done ? (h.color || 'var(--accent-cyan)') : 'rgba(0,0,0,0.15)',
                        boxShadow: done ? `0 0 8px ${h.color || 'var(--accent-cyan)'}` : 'none',
                        color: 'white',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      title={`Toggle ${h.name} for ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}`}
                    >
                      {done ? '✓' : ''}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AISuggestionsWidget({ activeTasks }: { activeTasks: any[] }) {
  const urgentTask = activeTasks.find(t => t.priority === 'critical') || activeTasks[0];

  return (
    <div className="widget widget-ai-suggestions">
      <div className="widget-header">
        <h4>🤖 AI Suggestions</h4>
      </div>
      <div className="ai-suggestions-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
        <div className="ai-suggestion-card" style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)' }}>
          <div className="ai-suggestion-header" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            <span className="ai-suggestion-icon">⚡</span>
            <span>Peak Energy Window</span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>Your highest energy levels occur between <strong>2 PM - 4 PM</strong>. Schedule critical assignments during this window.</p>
        </div>

        <div className="ai-suggestion-card" style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)' }}>
          <div className="ai-suggestion-header" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            <span className="ai-suggestion-icon">🎯</span>
            <span>Next Priority Sprint</span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 6px 0', lineHeight: '1.4' }}>
            {urgentTask 
              ? `Your highest priority task is "${urgentTask.text}". Take action now to reduce backlog risk.`
              : "You're all caught up on tasks! Set a new goal or start a wellness habit."
            }
          </p>
          <Link to="/focus" className="ai-start-now-btn" style={{ fontSize: '11px', color: 'var(--accent-blue-light)', fontWeight: 'bold', textDecoration: 'none', display: 'inline-block' }}>Start Now →</Link>
        </div>

        <div className="ai-suggestion-card" style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)' }}>
          <div className="ai-suggestion-card" style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)' }}>
            <span className="ai-suggestion-icon">🧘</span>
            <span>Habit Stacking Tip</span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>Complete a quick 5-min stretch right after a Pomodoro break to build physical resilience.</p>
        </div>
      </div>
    </div>
  );
}

interface AchievementsCelebrationWidgetProps {
  tasks: any[];
  goals: any[];
  habits: any[];
  focusSessions: any[];
}

function AchievementsCelebrationWidget({ tasks, goals, habits, focusSessions }: AchievementsCelebrationWidgetProps) {
  const isWithinLastDays = (dateStr: string | Date | undefined, days: number) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const diffMs = Date.now() - d.getTime();
    return diffMs >= 0 && diffMs <= days * 24 * 60 * 60 * 1000;
  };

  const completedTasksThisWeek = tasks.filter(t => {
    if (!t.done) return false;
    const completedLog = t.activityLog?.find((log: any) => log.action.toLowerCase().includes('completed'));
    const completedDate = completedLog ? completedLog.timestamp : t.createdAt;
    return isWithinLastDays(completedDate, 7);
  });

  const completedGoalsThisWeek = goals.filter(g => {
    if (g.progress < 100) return false;
    const completedTime = g.completed_by ? new Date(g.completed_by).getTime() : NaN;
    if (!isNaN(completedTime)) {
      return isWithinLastDays(g.completed_by, 7);
    }
    return isWithinLastDays(g.created_at, 7);
  });

  const weeklyFocusSessions = focusSessions.filter(s => 
    isWithinLastDays(s.created_at || s.created_at, 7)
  );

  const totalWeeklyFocusMinutes = Math.round(
    weeklyFocusSessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60
  );

  const longestFocusSession = weeklyFocusSessions.length > 0
    ? Math.max(...weeklyFocusSessions.map(s => Math.round((s.duration || 0) / 60)))
    : 0;

  const topHabits = habits
    .filter(h => h.streak > 0)
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 3);

  const totalAchievements = completedTasksThisWeek.length + completedGoalsThisWeek.length + topHabits.length + (totalWeeklyFocusMinutes > 0 ? 1 : 0);

  if (totalAchievements === 0) {
    return (
      <div className="achievements-celebration widget glass-card-static empty-achievements">
        <div className="celebration-header">
          <h3>✨ What you achieved this week? ✨</h3>
          <p className="subtitle">Your weekly wins are waiting to happen!</p>
        </div>
        <div className="celebration-body-empty">
          <span className="celebration-icon-empty">🌱</span>
          <p>Every small step counts towards your larger goals. Complete tasks, log focus sessions, and maintain your habits to light up this space with celebration! 🚀</p>
        </div>
      </div>
    );
  }

  return (
    <div className="achievements-celebration widget glass-card-static">
      <div className="celebration-header">
        <h3>✨ What you achieved this week? ✨</h3>
        <p className="subtitle">Outstanding momentum! Be proud of your progress and hard work.</p>
      </div>

      <div className="achievements-grid">
        {/* Tasks Completed Card */}
        {completedTasksThisWeek.length > 0 && (
          <div className="achievement-card tasks-card">
            <div className="ach-icon">🏆</div>
            <div className="ach-info">
              <span className="ach-value">{completedTasksThisWeek.length} Task{completedTasksThisWeek.length > 1 ? 's' : ''} Completed</span>
              <span className="ach-label">Great execution this week</span>
              <div className="ach-list">
                {completedTasksThisWeek.slice(0, 3).map((t, idx) => (
                  <div key={idx} className="ach-list-item">✓ {t.text}</div>
                ))}
                {completedTasksThisWeek.length > 3 && <div className="ach-more">And {completedTasksThisWeek.length - 3} more...</div>}
              </div>
            </div>
          </div>
        )}

        {/* Goals Completed Card */}
        {completedGoalsThisWeek.length > 0 && (
          <div className="achievement-card goals-card">
            <div className="ach-icon">🎯</div>
            <div className="ach-info">
              <span className="ach-value">{completedGoalsThisWeek.length} Goal{completedGoalsThisWeek.length > 1 ? 's' : ''} Reached!</span>
              <span className="ach-label">Big milestones unlocked 🌟</span>
              <div className="ach-list">
                {completedGoalsThisWeek.map((g, idx) => (
                  <div key={idx} className="ach-list-item" style={{ color: g.color }}>🌟 {g.name}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Focus Sprint Card */}
        {totalWeeklyFocusMinutes > 0 && (
          <div className="achievement-card focus-card">
            <div className="ach-icon">⏱️</div>
            <div className="ach-info">
              <span className="ach-value">
                {totalWeeklyFocusMinutes >= 60 
                  ? `${Math.round(totalWeeklyFocusMinutes / 60 * 10) / 10}h Focus Time` 
                  : `${totalWeeklyFocusMinutes}m Focus Time`
                }
              </span>
              <span className="ach-label">Deep work sprints completed</span>
              {longestFocusSession > 0 && (
                <div className="ach-detail" style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  🚀 Longest session: <strong>{longestFocusSession} mins</strong> of uninterrupted concentration.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Habits Consistency Card */}
        {topHabits.length > 0 && (
          <div className="achievement-card habits-card">
            <div className="ach-icon">🔥</div>
            <div className="ach-info">
              <span className="ach-value">Habit Streaks On Fire</span>
              <span className="ach-label">Consistency is your superpower</span>
              <div className="ach-list">
                {topHabits.map((h, idx) => (
                  <div key={idx} className="ach-list-item" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span>🔄 {h.name}</span>
                    <strong style={{ color: h.color }}>{h.streak} day streak</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="celebration-footer">
        <p className="celebration-encouragement">
          {totalAchievements >= 4 
            ? "🔥 Absolutely incredible! You're operating at a legendary level. Celebrate your wins and rest well!" 
            : "✨ Brilliant work! Each achievement is a building block for your future. Keep moving forward!"
          }
        </p>
      </div>
    </div>
  );
}
