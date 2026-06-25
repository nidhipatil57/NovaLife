import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDataContext } from '../context/DataContext';
import { parseTaskDueDate } from '../utils/dateParser';
import { callGeminiWithRetry } from '../utils/aiClient';
import './RescueModePage.css';

export default function RescueModePage() {
  const { user } = useAuth();
  const { tasks, loadingTasks, events, focusSessions } = useDataContext();
  const navigate = useNavigate();

  const [countdowns, setCountdowns] = useState<Record<string, string>>({});
  const [aiPlan, setAiPlan] = useState<string | null>(null);
  const [loadingAiPlan, setLoadingAiPlan] = useState(false);

  // 1. Dynamic Risk Scoring Engine
  const calculateDynamicRisk = (task: any) => {
    const dueDate = parseTaskDueDate(task.due);
    if (!dueDate) return 0;

    const diffMs = dueDate.getTime() - Date.now();
    const diffHours = diffMs / (1000 * 60 * 60);

    // Factors: Urgency (70%) + Incompleteness (30%)
    let urgency = 0;
    if (diffHours <= 0) {
      urgency = 100; // Overdue
    } else if (diffHours <= 2) {
      urgency = 98;  // Highly urgent (due within 2 hours)
    } else if (diffHours <= 24) {
      // Linear scaling from 95 (at 2h) down to 50 (at 24h)
      urgency = 95 - ((diffHours - 2) / 22) * 45;
    } else if (diffHours <= 72) {
      // Linear scaling from 50 (at 24h) down to 20 (at 72h)
      urgency = 50 - ((diffHours - 24) / 48) * 30;
    } else {
      // Beyond 3 days, low urgency base
      urgency = Math.max(5, 20 - ((diffHours - 72) / 168) * 15);
    }

    const subtasks = task.subtasks || [];
    let incompleteness = 50; // Default when no subtasks exist
    if (subtasks.length > 0) {
      const completedCount = subtasks.filter((s: any) => s.done).length;
      incompleteness = ((subtasks.length - completedCount) / subtasks.length) * 100;
    }

    const risk = Math.round(urgency * 0.7 + incompleteness * 0.3);
    return Math.min(99, Math.max(1, risk));
  };

  // Filter tasks that are active and calculate dynamic risk
  const activeTasksWithRisk = tasks
    .filter(t => !t.done)
    .filter(t => {
      const dueDate = parseTaskDueDate(t.due);
      if (!dueDate) return false;
      const today = new Date();
      return dueDate.getDate() === today.getDate() &&
             dueDate.getMonth() === today.getMonth() &&
             dueDate.getFullYear() === today.getFullYear();
    })
    .map(t => ({
      ...t,
      risk: calculateDynamicRisk(t)
    }))
    .filter(t => t.risk > 0)
    .sort((a, b) => b.risk - a.risk);

  const atRiskTasks = activeTasksWithRisk;

  const overallRisk = atRiskTasks.length > 0
    ? Math.round(atRiskTasks.reduce((acc, t) => acc + t.risk, 0) / atRiskTasks.length)
    : 0;

  // 2. Live Countdown Timers Hook (Ticking every second)
  useEffect(() => {
    const updateAllCountdowns = () => {
      const updated: Record<string, string> = {};
      atRiskTasks.forEach(task => {
        const dueDate = parseTaskDueDate(task.due);
        if (!dueDate) {
          updated[task.id] = 'No deadline';
          return;
        }

        const diffMs = dueDate.getTime() - Date.now();
        if (diffMs <= 0) {
          updated[task.id] = '⚠️ Overdue!';
          return;
        }

        const diffSecs = Math.floor(diffMs / 1000);
        const secs = diffSecs % 60;
        const diffMins = Math.floor(diffSecs / 60);
        const mins = diffMins % 60;
        const diffHours = Math.floor(diffMins / 60);
        const hours = diffHours % 24;
        const days = Math.floor(diffHours / 24);

        if (days > 0) {
          updated[task.id] = `${days}d ${hours}h`;
        } else if (hours > 0) {
          updated[task.id] = `${hours}h ${mins}m`;
        } else if (mins > 0) {
          updated[task.id] = `${mins}m ${secs}s`;
        } else {
          updated[task.id] = `${secs}s`;
        }
      });
      setCountdowns(updated);
    };

    updateAllCountdowns();
    const interval = setInterval(updateAllCountdowns, 1000);
    return () => clearInterval(interval);
  }, [tasks]);

  // 3. Daily Rescue Summary Calculations
  const getDailyRescueSummaryText = () => {
    const today = new Date();
    const tasksDueToday = atRiskTasks.filter(t => {
      const dueDate = parseTaskDueDate(t.due);
      if (!dueDate) return false;
      return dueDate.getDate() === today.getDate() &&
             dueDate.getMonth() === today.getMonth() &&
             dueDate.getFullYear() === today.getFullYear();
    });

    if (tasksDueToday.length === 0) {
      return {
        text: '🎉 No critical tasks are due today. All systems clear and running on schedule!',
        count: 0
      };
    }

    // Calculate hours remaining in the day until 11:59:59 PM
    const midnight = new Date();
    midnight.setHours(23, 59, 59, 999);
    const hoursLeftToday = Math.max(0, (midnight.getTime() - Date.now()) / (1000 * 60 * 60));

    // Calculate realistic completion
    let cumulativeHoursNeeded = 0;
    let realisticallyFinishCount = 0;

    // Order by risk first (already sorted)
    tasksDueToday.forEach(task => {
      const subtasks = task.subtasks || [];
      const incompleteCount = subtasks.filter((s: any) => !s.done).length;
      let estMins = 30; // Min 30 mins
      if (subtasks.length > 0) {
        estMins = Math.max(30, incompleteCount * 25); // 25 mins per subtask
      }
      
      const estHours = estMins / 60;
      if (cumulativeHoursNeeded + estHours <= hoursLeftToday * 0.85) { // Allocate max 85% of free time
        cumulativeHoursNeeded += estHours;
        realisticallyFinishCount++;
      }
    });

    return {
      text: `⚠️ You have ${tasksDueToday.length} critical task${tasksDueToday.length !== 1 ? 's' : ''} due today. If you start now, you can realistically finish ${realisticallyFinishCount} of them.`,
      count: tasksDueToday.length
    };
  };

  const dailySummary = getDailyRescueSummaryText();

  // 4. Generate AI Rescue Plan via Gemini API
  const handleGenerateAiRescuePlan = async () => {
    if (atRiskTasks.length === 0) return;
    setLoadingAiPlan(true);
    setAiPlan(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key is not configured in .env file.');
      }

      const tasksText = atRiskTasks
        .map((t, idx) => `Task ${idx + 1}: ${t.text} (Risk: ${t.risk}%, Due: ${t.due}, Priority: ${t.priority}, Subtasks: ${t.subtasks?.map((s: any) => s.text + (s.done ? ' [done]' : '')).join(', ') || 'none'})`)
        .join('\n');

      const eventsText = events
        .map(e => `- ${e.title} (Type: ${e.type}, Start Hour: ${e.start}, Duration: ${e.duration}h, Day of Week: ${e.day})`)
        .join('\n');

      const focusText = `Logged Focus Sessions: ${focusSessions.length}. Total Focus Minutes: ${Math.round(focusSessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60)}.`;

      const prompt = `You are "Nova", an elite productivity coach and AI life assistant.
We have an EMERGENCY: the user is falling behind on their deadlines and is at risk of missing them. 
Here are the at-risk tasks due today or very soon:
${tasksText}

Here is their calendar schedule for the week:
${eventsText || "No calendar events scheduled."}

Here is their focus session history:
${focusText}

Here is their current time: ${new Date().toLocaleTimeString()} on ${new Date().toDateString()}.

Create an emergency hourly rescue intervention plan for them.
Specifically:
1. Suggest what calendar events they should defer, delegate, or skip to free up focus hours.
2. Outline a concrete, hour-by-hour tactical timeline for today/tomorrow on how they should address the at-risk tasks.
3. Suggest a 25-minute Pomodoro focus order with specific, actionable first steps for each task.

Be direct, highly motivational, and tactical. Keep formatting in clean Markdown with bolding on key steps.`;

      const requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      };

      const data = await callGeminiWithRetry(apiKey, requestBody);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "I was unable to formulate a rescue plan.";
      setAiPlan(text);
    } catch (err: any) {
      console.error('AI Rescue Plan Error:', err);
      setAiPlan(`⚠️ **Failed to generate AI plan:** ${err.message || 'Please check your internet connection or Gemini API key.'}`);
    } finally {
      setLoadingAiPlan(false);
    }
  };

  const getDynamicReason = (priority: string, due: string, risk: number) => {
    if (risk > 80) {
      return `Extremely high risk. Deadline (${due}) is imminent and tasks are incomplete.`;
    }
    if (priority === 'critical' || priority === 'high') {
      return `Critical deadline approaching (${due}) with significant work remaining.`;
    }
    return `Approaching deadline (${due}) needs structured focus block to prevent backlog.`;
  };

  const getDynamicAction = (priority: string) => {
    if (priority === 'critical') {
      return 'Initiate immediate Focus Session. Silence all notifications, block distracting sites, and execute.';
    }
    if (priority === 'high') {
      return 'Outline milestones, divide into 25-minute Pomodoro sprints, and start working immediately.';
    }
    return 'Schedule a deep focus time slot in your calendar to complete this task early.';
  };

  const renderMarkdownText = (text: string) => {
    return text.split('\n').map((line, i) => {
      const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*');
      let lineContent = line;
      if (isBullet) {
        lineContent = line.replace(/^[•\-*]\s*/, '');
      }

      const renderedContent: React.ReactNode[] = [];
      const boldRegex = /\*\*(.*?)\*\*/g;
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(lineContent)) !== null) {
        if (match.index > lastIndex) {
          renderedContent.push(lineContent.substring(lastIndex, match.index));
        }
        renderedContent.push(<strong key={match.index}>{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < lineContent.length) {
        renderedContent.push(lineContent.substring(lastIndex));
      }

      const finalContent = renderedContent.length > 0 ? renderedContent : lineContent;

      if (isBullet) {
        return (
          <li key={i} style={{ marginLeft: '16px', listStyleType: 'disc', marginBottom: '6px', fontSize: 'var(--text-sm)' }}>
            {finalContent}
          </li>
        );
      }

      return (
        <div key={i} style={{ minHeight: '18px', marginBottom: line.trim() === '' ? '12px' : '4px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          {finalContent}
        </div>
      );
    });
  };

  if (!user) {
    return (
      <div className="rescue-page" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex', minHeight: '60vh' }}>
        <div className="widget glass-card-static" style={{ padding: '40px', textAlign: 'center', maxWidth: '480px' }}>
          <h3>🔒 Authentication Required</h3>
          <p style={{ marginTop: '12px', marginBottom: '24px' }}>Please log in to access Rescue Mode.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rescue-page">
      {/* Emergency Header */}
      <div className="rescue-header">
        <div className="rescue-siren">
          <span className="siren-icon">🚨</span>
          <div className="siren-pulse"></div>
        </div>
        <div>
          <h2 className="rescue-title">RESCUE MODE</h2>
          <p className="rescue-subtitle">
            {loadingTasks ? 'Analyzing deadlines...' : `AI Emergency Intervention — ${atRiskTasks.length} deadline${atRiskTasks.length !== 1 ? 's' : ''} at risk`}
          </p>
        </div>
        <div className="rescue-risk-gauge">
          <svg viewBox="0 0 100 60" className="risk-gauge-svg">
            <path d="M10 55 A 40 40 0 0 1 90 55" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" strokeLinecap="round" />
            <path d="M10 55 A 40 40 0 0 1 90 55" fill="none"
              stroke={overallRisk > 70 ? 'var(--accent-red)' : overallRisk > 40 ? 'var(--accent-orange)' : 'var(--accent-green)'}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray="126" strokeDashoffset={126 - (overallRisk / 100) * 126}
              style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
            <text x="50" y="50" textAnchor="middle" fill="var(--text-primary)" fontSize="20" fontWeight="800" fontFamily="var(--font-display)">{overallRisk}%</text>
            <text x="50" y="38" textAnchor="middle" fill="var(--text-tertiary)" fontSize="7" letterSpacing="1">RISK</text>
          </svg>
        </div>
      </div>

      {/* Daily Rescue Summary */}
      {!loadingTasks && (
        <div className="rescue-summary-card widget" style={{
          background: dailySummary.count > 0 ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(0,0,0,0.2))' : 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(0,0,0,0.2))',
          border: dailySummary.count > 0 ? '1px solid rgba(239, 68, 68, 0.15)' : '1px solid rgba(16, 185, 129, 0.15)',
          padding: '16px 24px',
          borderRadius: 'var(--radius-xl)',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '24px' }}>{dailySummary.count > 0 ? '⏱️' : '🛡️'}</span>
          <span style={{ fontSize: '14px', fontWeight: '600', color: dailySummary.count > 0 ? 'var(--accent-red-light)' : 'var(--accent-green-light)' }}>
            {dailySummary.text}
          </span>
        </div>
      )}

      {loadingTasks ? (
        <div className="loading-state" style={{ textAlign: 'center', padding: '60px' }}>
          <div className="ai-onboard-avatar" style={{ margin: '0 auto 20px auto', width: '40px', height: '40px' }}></div>
          <p>Analyzing database for high-risk deadlines...</p>
        </div>
      ) : atRiskTasks.length === 0 ? (
        <div className="empty-state widget glass-card-static" style={{ textAlign: 'center', padding: '50px 30px', margin: '20px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛡️</div>
          <h4>All Systems Clear</h4>
          <p style={{ maxWidth: '400px', margin: '10px auto 24px auto', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            You have no active tasks flagged with high risk scores. Everything is on schedule and running smoothly. Keep it up!
          </p>
        </div>
      ) : (
        <>
          {/* AI Emergency Plan Actions Button & Result */}
          <div className="rescue-ai-plan-section widget" style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="ai-avatar-inner" style={{ width: 28, height: 28, flexShrink: 0 }}></div>
                <h4 style={{ margin: 0, fontWeight: '700' }}>AI Rescue Intervention</h4>
              </div>
              <button
                className="btn-primary"
                onClick={handleGenerateAiRescuePlan}
                disabled={loadingAiPlan}
                style={{
                  background: 'var(--gradient-blue-purple)',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.2)',
                  fontSize: '13px',
                  fontWeight: '600',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-lg)'
                }}
              >
                {loadingAiPlan ? '⚡ Formulating Plan...' : '🧠 Generate AI Rescue Plan'}
              </button>
            </div>

            {aiPlan ? (
              <div className="ai-plan-result-box" style={{
                background: 'rgba(255, 255, 255, 0.01)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 20px',
                marginTop: '16px',
                lineHeight: '1.6'
              }}>
                {renderMarkdownText(aiPlan)}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>
                You have {atRiskTasks.length} deadlines at risk. Click the button to have Nova analyze your calendars, focus history, and tasks to build a customized hour-by-hour emergency recovery schedule.
              </p>
            )}
          </div>

          {/* At-Risk Tasks */}
          <div className="rescue-tasks">
            {atRiskTasks.map((task, i) => {
              const countdown = countdowns[task.id] || 'Calculating...';
              const isUrgent = countdown.includes('s') || countdown.includes('m') || countdown === '⚠️ Overdue!';
              
              // Compute subtask completion percentage
              const subtasks = task.subtasks || [];
              const completedSubtasks = subtasks.filter((s: any) => s.done).length;
              const subtaskPercent = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

              return (
                <div key={task.id} className={`rescue-card widget rescue-risk-${task.risk > 70 ? 'critical' : task.risk > 40 ? 'high' : 'medium'}`}>
                  <div className="rescue-card-header">
                    <div className="rescue-step">
                      <span className="step-num">Task {i + 1}</span>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {task.text}
                        {task.priority === 'critical' && <span style={{ fontSize: '12px', padding: '2px 8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-sm)' }}>Critical</span>}
                      </h3>
                      {/* Live countdown timer */}
                      <span className="rescue-due" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: '700',
                        fontFamily: 'monospace',
                        color: isUrgent ? 'var(--accent-red)' : 'var(--text-secondary)',
                        animation: isUrgent && countdown !== '⚠️ Overdue!' ? 'pulseRed 1s infinite alternate' : 'none'
                      }}>
                        ⏱️ Deadline countdown: {countdown}
                      </span>
                    </div>

                    <div className="rescue-risk-circle">
                      <svg viewBox="0 0 60 60">
                        <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="4" />
                        <circle cx="30" cy="30" r="24" fill="none"
                          stroke={task.risk > 70 ? 'var(--accent-red)' : task.risk > 40 ? 'var(--accent-orange)' : 'var(--accent-green)'}
                          strokeWidth="4" strokeLinecap="round" strokeDasharray="150.8"
                          strokeDashoffset={150.8 - (task.risk / 100) * 150.8}
                          style={{ transform: 'rotate(-90deg)', transformOrigin: '30px 30px', transition: 'stroke-dashoffset 0.8s ease-out' }} />
                        <text x="30" y="34" textAnchor="middle" fill="var(--text-primary)" fontSize="13" fontWeight="800">{task.risk}%</text>
                      </svg>
                    </div>
                  </div>

                  {/* Subtask Progress Bar */}
                  {subtasks.length > 0 && (
                    <div className="rescue-subtask-progress" style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        <span>Subtask Completion: {completedSubtasks}/{subtasks.length}</span>
                        <span>{subtaskPercent}%</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                        <div style={{
                          width: `${subtaskPercent}%`,
                          height: '100%',
                          background: 'var(--gradient-blue-purple)',
                          borderRadius: 'var(--radius-full)',
                          transition: 'width 0.4s ease'
                        }}></div>
                      </div>
                    </div>
                  )}

                  <div className="rescue-details">
                    <div className="rescue-detail">
                      <span className="rescue-label">⚠️ Why at risk:</span>
                      <span>{getDynamicReason(task.priority, task.due, task.risk)}</span>
                    </div>
                    <div className="rescue-detail ai-action">
                      <span className="rescue-label">🤖 Action Steps:</span>
                      <span>{getDynamicAction(task.priority)}</span>
                    </div>
                  </div>

                  <div className="rescue-actions">
                    <button
                      className="btn-primary btn-sm"
                      onClick={() => navigate('/focus', { state: { taskName: task.text } })}
                      style={{
                        background: 'var(--gradient-blue-purple)',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
                        fontWeight: '600'
                      }}
                    >
                      🚀 Start Focus Sprint
                    </button>
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => navigate('/tasks')}
                    >
                      ✏️ Edit Subtasks
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Emergency Timeline Schedule */}
          <div className="emergency-schedule widget">
            <h4>⚡ Emergency Focus Order Timeline</h4>
            <div className="emergency-timeline">
              {atRiskTasks.map((t, idx) => (
                <div key={t.id} className={`etl-item ${idx === 0 ? 'active' : ''}`}>
                  <div className="etl-time">{idx === 0 ? 'NOW' : `+${idx * 1.5}h`}</div>
                  <div className="etl-bar" style={{ background: t.risk > 70 ? 'var(--accent-red)' : 'var(--accent-orange)' }}></div>
                  <div className="etl-content">
                    <span className="etl-task">{t.text}</span>
                    <span className="etl-duration">{t.due} • Risk: {t.risk}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
