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

  const { tasks, loading: tasksLoading, user } = useTasks();
  const { habits, loading: habitsLoading } = useHabits();
  const { goals, loading: goalsLoading } = useGoals();
  const { productivityScore, focusSessions, transactions, savingsGoals, financialHealthScore, bills } = useDataContext();

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
  const highPriorityCount = activeTasks.filter(t => (t.priority === 'critical' || t.priority === 'high') && !isOverdue(t)).length;
  
  const overdueCount = activeTasks.filter(t => isOverdue(t)).length;
  const approachingCount = activeTasks.filter(t => t.due && t.due.toLowerCase().trim() !== 'no due date' && !isOverdue(t)).length;

  const totalTasksCount = tasks.length;

  const unpaidBillsCount = useMemo(() => {
    return (bills || []).filter((b: any) => !b.paid).length;
  }, [bills]);

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
              <strong style={{ color: 'var(--accent-red)' }}>{overdueCount} task{overdueCount !== 1 ? 's' : ''} overdue</strong>,{' '}
              <strong style={{ color: 'var(--accent-orange-light)' }}>{approachingCount} deadline{approachingCount !== 1 ? 's' : ''} approaching</strong>, and{' '}
              <strong style={{ color: 'var(--accent-orange)' }}>{unpaidBillsCount} bill{unpaidBillsCount !== 1 ? 's' : ''} due</strong>.
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
        <TaskWidgetCompact isLoading={tasksLoading} tasks={tasks} />
        <ScoreWidget score={productivityScore} totalTasks={totalTasksCount} focusHours={todayFocusHours} streak={maxStreak} />
        <DeadlineWidgetCompact tasks={tasks} />
        <FinanceWidgetCompact transactions={transactions} savingsGoals={savingsGoals} healthScore={financialHealthScore} bills={bills} />
        <GoalWidgetCompact isLoading={goalsLoading} goals={goals} />
        <HabitWidgetCompact isLoading={habitsLoading} habits={habits} todayIndex={todayIndex} />
      </div>

      <AchievementsCelebrationWidget 
        tasks={tasks} 
        goals={goals} 
        habits={habits} 
        focusSessions={focusSessions} 
      />

      <AISuggestionsWidget 
        activeTasks={activeTasks}
        overdueTasksCount={overdueCount}
        maxStreak={maxStreak}
        goals={goals}
        todayFocusHours={todayFocusHours}
      />
    </div>
  );
}

interface TaskWidgetProps {
  isLoading: boolean;
  tasks: any[];
}

function TaskWidgetCompact({ isLoading, tasks }: TaskWidgetProps) {
  const activeTasks = tasks
    .filter(t => !t.done)
    .sort((a, b) => {
      const aDate = parseTaskDueDate(a.due);
      const bDate = parseTaskDueDate(b.due);
      if (aDate && bDate) return bDate.getTime() - aDate.getTime();
      if (aDate) return -1;
      if (bDate) return 1;
      return 0;
    });

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
            <div key={task.id} className={`task-row ${task.done ? 'done' : ''}`} style={{ cursor: 'default' }}>
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
  const deadlines = useMemo(() => {
    return tasks
      .filter(t => !t.done && (isOverdue(t) || t.priority === 'critical' || t.priority === 'high'))
      .sort((a, b) => {
        const aDate = parseTaskDueDate(a.due);
        const bDate = parseTaskDueDate(b.due);
        if (aDate && bDate) return bDate.getTime() - aDate.getTime();
        if (aDate) return -1;
        if (bDate) return 1;
        return 0;
      });
  }, [tasks]);

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
              <div className="dl-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1, gap: '2px', minWidth: 0 }}>
                <div className="dl-task">{d.text}</div>
                <div className="dl-due" style={isOverdue(d) ? { color: 'var(--accent-red)', fontWeight: 'bold' } : {}}>
                  {isOverdue(d) ? '⚠️ Overdue! ' : ''}{d.due}
                </div>
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
  const compactGoals = goals.filter(g => g.progress < 100);

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
  todayIndex: number;
}

function HabitWidgetCompact({ isLoading, habits, todayIndex }: HabitWidgetProps) {
  const compactHabits = habits; // Fit cleanly in fixed widget heights with scrolling

  return (
    <div className="widget widget-habits">
      <div className="widget-header">
        <h4>🔄 Habit Tracker</h4>
        <Link to="/habits" className="widget-link">View All →</Link>
      </div>
      <div className="habit-compact-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
        {isLoading ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', padding: '10px 0' }}>Syncing...</p>
        ) : compactHabits.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', padding: '20px 0', textAlign: 'center' }}>No habits tracked.</p>
        ) : (
          compactHabits.map((h) => {
            const isDoneToday = h.week && h.week[todayIndex];
            return (
              <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden', marginRight: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={h.name}>
                    {h.name}
                  </span>
                  <span style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>
                    🔥 {h.streak || 0} day streak
                  </span>
                </div>
                <div style={{
                  padding: '3px 8px',
                  borderRadius: '20px',
                  fontSize: '9.5px',
                  fontWeight: 'bold',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: isDoneToday ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${isDoneToday ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)'}`,
                  color: isDoneToday ? 'var(--accent-green-light)' : 'var(--text-tertiary)',
                  boxShadow: isDoneToday ? '0 0 8px rgba(16, 185, 129, 0.05)' : 'none',
                  cursor: 'default'
                }}>
                  {isDoneToday ? '✓ Done' : '⏳ Pending'}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function AISuggestionsWidget({ 
  activeTasks, 
  overdueTasksCount, 
  maxStreak, 
  goals,
  todayFocusHours
}: { 
  activeTasks: any[], 
  overdueTasksCount: number, 
  maxStreak: number, 
  goals: any[],
  todayFocusHours: number
}) {
  const urgentTask = activeTasks[0];

  const taskInsight = useMemo(() => {
    if (overdueTasksCount > 0) {
      return {
        title: "Backlog Priority",
        icon: "⚠️",
        text: `You have ${overdueTasksCount} overdue task${overdueTasksCount !== 1 ? 's' : ''}. We recommend focusing on "${urgentTask?.text || 'your next task'}" to clear your queue.`
      };
    } else if (activeTasks.length > 0) {
      return {
        title: "Sprint Focus",
        icon: "🎯",
        text: `You have ${activeTasks.length} active task${activeTasks.length !== 1 ? 's' : ''}. Your top priority is "${urgentTask?.text}". Try a deep focus sprint to finish it.`
      };
    } else {
      return {
        title: "Clear Horizon",
        icon: "✨",
        text: "You are all caught up on tasks! Consider adding a new task or planning a future savings goal."
      };
    }
  }, [overdueTasksCount, activeTasks.length, urgentTask]);

  const habitInsight = useMemo(() => {
    if (maxStreak > 0) {
      return {
        title: "Habit Streak",
        icon: "🔥",
        text: `Outstanding! Your longest habit streak is at ${maxStreak} day${maxStreak !== 1 ? 's' : ''}. Keep the consistency going to build lasting routines.`
      };
    } else {
      return {
        title: "Routine Builder",
        icon: "🔄",
        text: "Start a simple daily habit like 'Drink Water' or 'Focus Sprint' to establish your baseline routine."
      };
    }
  }, [maxStreak]);

  const activeGoal = goals.find(g => g.progress < 100);
  const goalInsight = useMemo(() => {
    if (activeGoal) {
      return {
        title: "Goals Roadmap",
        icon: "🏆",
        text: `Your goal "${activeGoal.name}" is at ${activeGoal.progress}% progress. Break it down into subtasks to make it achievable.`
      };
    } else {
      return {
        title: "Vision Board",
        icon: "🌟",
        text: "No active goals in progress. Define a savings or study goal to give your sessions clear direction."
      };
    }
  }, [activeGoal]);

  const focusInsight = useMemo(() => {
    if (todayFocusHours > 0) {
      return {
        title: "Deep Focus",
        icon: "⏱️",
        text: `You completed ${todayFocusHours}h of deep focus today! Your brain is in a high-retention state.`
      };
    } else {
      return {
        title: "Focus Block",
        icon: "🌲",
        text: "No focus sessions logged today. Try entering a Deep Work Forest room to isolate from distractions."
      };
    }
  }, [todayFocusHours]);

  return (
    <div className="widget widget-ai-suggestions horizontal-briefing">
      <div className="widget-header">
        <h4>🤖 AI Daily Insights</h4>
        <span className="insights-badge">Live Analytics</span>
      </div>
      <div className="ai-suggestions-horizontal-grid">
        <div className="ai-suggestion-card-h">
          <div className="ai-suggestion-h-header">
            <span className="ai-icon-circle">{taskInsight.icon}</span>
            <h5>{taskInsight.title}</h5>
          </div>
          <p>{taskInsight.text}</p>
        </div>

        <div className="ai-suggestion-card-h">
          <div className="ai-suggestion-h-header">
            <span className="ai-icon-circle">{habitInsight.icon}</span>
            <h5>{habitInsight.title}</h5>
          </div>
          <p>{habitInsight.text}</p>
        </div>

        <div className="ai-suggestion-card-h">
          <div className="ai-suggestion-h-header">
            <span className="ai-icon-circle">{goalInsight.icon}</span>
            <h5>{goalInsight.title}</h5>
          </div>
          <p>{goalInsight.text}</p>
        </div>

        <div className="ai-suggestion-card-h">
          <div className="ai-suggestion-h-header">
            <span className="ai-icon-circle">{focusInsight.icon}</span>
            <h5>{focusInsight.title}</h5>
          </div>
          <p>{focusInsight.text}</p>
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

function FinanceWidgetCompact({ transactions, savingsGoals, healthScore, bills = [] }: { transactions: any[], savingsGoals: any[], healthScore: number, bills?: any[] }) {
  const balance = useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach(t => {
      const amt = Number(t.amount);
      if (t.type === 'income') income += amt;
      else expense += amt;
    });
    return income - expense;
  }, [transactions]);

  const activeGoal = savingsGoals[0];

  const unpaidBills = useMemo(() => {
    return bills.filter(b => !b.paid);
  }, [bills]);

  return (
    <div className="widget widget-goals">
      <div className="widget-header">
        <h4 className="widget-title">💰 Finance & Savings</h4>
        <Link to="/finance" className="widget-link">Manage →</Link>
      </div>
      <div className="widget-content" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>AVAILABLE BALANCE</span>
            <div style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
              ₹{balance.toLocaleString()}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>HEALTH INDEX</span>
            <div style={{ fontSize: '18px', fontWeight: '800', color: healthScore >= 80 ? 'var(--accent-green)' : 'var(--accent-orange)', marginTop: '2px' }}>
              {healthScore}/100
            </div>
          </div>
        </div>

        {activeGoal ? (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
              <span style={{ fontWeight: 'semibold' }}>🎯 Goal: {activeGoal.name}</span>
              <span>{Math.round((Number(activeGoal.saved_amount) / Number(activeGoal.target_amount)) * 100)}%</span>
            </div>
            <div className="progress-bar-glow" style={{ height: '6px' }}>
              <div className="progress-fill-glow" style={{ 
                width: `${Math.min(100, Math.round((Number(activeGoal.saved_amount) / Number(activeGoal.target_amount)) * 100))}%`, 
                background: activeGoal.color || 'var(--accent-blue)',
                boxShadow: `0 0 8px ${activeGoal.color || 'var(--accent-blue)'}` 
              }} />
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px' }}>
            No savings goals active. Set one in the Finance page to start tracking!
          </div>
        )}

        {/* Bills Reminder */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px' }}>{unpaidBills.length > 0 ? '📅' : '✅'}</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: unpaidBills.length > 0 ? 'var(--accent-orange-light)' : 'var(--accent-green-light)', letterSpacing: '0.5px' }}>BILLS REMINDER</span>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {unpaidBills.length > 0 
                ? `You have ${unpaidBills.length} unpaid bill${unpaidBills.length > 1 ? 's' : ''} outstanding.` 
                : 'All monthly bills paid! 🎉'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
