import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDataContext } from '../context/DataContext';
import { parseTaskDueDate } from '../utils/dateParser';
import { callGeminiWithRetry } from '../utils/aiClient';
import './RescueModePage.css';

export default function RescueModePage() {
  const { user } = useAuth();
  const { 
    tasks, 
    loadingTasks, 
    triggerRescueActivation,
    updateTask,
    addEvent
  } = useDataContext();
  const navigate = useNavigate();

  const [countdowns, setCountdowns] = useState<Record<string, string>>({});
  const [taskRoadmaps, setTaskRoadmaps] = useState<Record<string, string>>({});
  const [loadingTaskRoadmaps, setLoadingTaskRoadmaps] = useState<Record<string, boolean>>({});

  // New states for task scheduling and overdue modal
  const [scheduledTimes, setScheduledTimes] = useState<Record<string, string>>({});
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const [overdueAiPlan, setOverdueAiPlan] = useState<string | null>(null);
  const [loadingOverdueAiPlan, setLoadingOverdueAiPlan] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Filter tasks that are active and calculate dynamic risk (due today)
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

  // Filter overdue tasks (incomplete and past their deadline)
  const overdueTasks = tasks
    .filter(t => !t.done)
    .filter(t => {
      const dueDate = parseTaskDueDate(t.due);
      if (!dueDate) return false;
      return dueDate.getTime() < Date.now();
    })
    .map(t => ({
      ...t,
      risk: calculateDynamicRisk(t)
    }))
    .sort((a, b) => b.risk - a.risk);

  // 2. Live Countdown Timers Hook (Ticking every second)
  useEffect(() => {
    const updateAllCountdowns = () => {
      const updated: Record<string, string> = {};
      const allScheduled = [...atRiskTasks, ...overdueTasks];
      allScheduled.forEach(task => {
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
  }, [tasks, atRiskTasks.length, overdueTasks.length]);

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

  // 4. Generate AI Rescue Plan for individual tasks
  const handleGenerateTaskRoadmap = async (taskId: string, taskText: string, taskPriority: string, subtasksList: any[]) => {
    setLoadingTaskRoadmaps(prev => ({ ...prev, [taskId]: true }));
    setTaskRoadmaps(prev => ({ ...prev, [taskId]: '' }));

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key is not configured.');
      }

      const prompt = `You are "Nova", a fast, highly tactical AI coach.
Generate a fast, short, and helpful emergency rescue plan to complete this task: "${taskText}".
Priority: ${taskPriority}.
Subtasks: ${subtasksList.map(s => s.text + (s.done ? ' (done)' : '')).join(', ') || 'None'}.

Instructions:
1. Provide a short, actionable recovery plan.
2. Outline exactly 3-4 ultra-short actionable micro-steps.
3. Be fast, direct, and helpful. Keep it under 80 words total.`;

      const requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 256,
        }
      };

      const data = await callGeminiWithRetry(apiKey, requestBody);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No rescue plan could be formulated.";
      setTaskRoadmaps(prev => ({ ...prev, [taskId]: text }));
      triggerRescueActivation();
    } catch (err: any) {
      console.error('Roadmap error:', err);
      setTaskRoadmaps(prev => ({ ...prev, [taskId]: `⚠️ Failed: ${err.message || 'Error occurred.'}` }));
    } finally {
      setLoadingTaskRoadmaps(prev => ({ ...prev, [taskId]: false }));
    }
  };

  // Generate AI Rescue Plan for Overdue Tasks
  const handleGenerateOverdueAiRescuePlan = async () => {
    if (overdueTasks.length === 0) return;
    setLoadingOverdueAiPlan(true);
    setOverdueAiPlan(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key is not configured in .env file.');
      }

      const tasksText = overdueTasks
        .map((t, idx) => `Task ${idx + 1}: ${t.text} (Risk: ${t.risk}%, Due: ${t.due}, Priority: ${t.priority}, Subtasks: ${t.subtasks?.map((s: any) => s.text + (s.done ? ' [done]' : '')).join(', ') || 'none'})`)
        .join('\n');

      const prompt = `You are "Nova", an elite productivity coach and AI life assistant.
We have an URGENT emergency: the user has several OVERDUE tasks that have missed their deadlines!
Here are the overdue tasks:
${tasksText}

Create a specific AI Overdue Rescue Plan.
Specifically:
1. Outline a realistic, intensive timeline on how to clear these overdue items quickly.
2. Provide a 25-minute Pomodoro focus order, starting with the highest risk/impact items.
3. Suggest clear action steps to help them bypass procrastination and rebuild momentum.

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
      setOverdueAiPlan(text);
      triggerRescueActivation(); // Increment activations
    } catch (err: any) {
      console.error('AI Overdue Rescue Plan Error:', err);
      setOverdueAiPlan(`⚠️ **Failed to generate AI plan:** ${err.message || 'Please check your internet connection or Gemini API key.'}`);
    } finally {
      setLoadingOverdueAiPlan(false);
    }
  };

  // Schedule task in local + Google Calendar
  const handleScheduleTask = async (taskId: string, taskText: string) => {
    const timeVal = scheduledTimes[taskId];
    if (!timeVal) {
      alert('Please select a date and time to schedule.');
      return;
    }

    try {
      const selectedDate = new Date(timeVal);
      if (isNaN(selectedDate.getTime())) {
        alert('Invalid date-time selected.');
        return;
      }

      // Calculate day and weekOffset relative to current week
      const today = new Date();
      
      // Monday of current week
      let currentDay = today.getDay();
      const diffToMonday = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
      const mondayOfCurrentWeek = new Date(today);
      mondayOfCurrentWeek.setDate(diffToMonday);
      mondayOfCurrentWeek.setHours(0, 0, 0, 0);

      // Monday of selected week
      let selectedDay = selectedDate.getDay();
      const diffToSelectedMonday = selectedDate.getDate() - selectedDay + (selectedDay === 0 ? -6 : 1);
      const mondayOfSelectedWeek = new Date(selectedDate);
      mondayOfSelectedWeek.setDate(diffToSelectedMonday);
      mondayOfSelectedWeek.setHours(0, 0, 0, 0);

      const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
      const diffMs = mondayOfSelectedWeek.getTime() - mondayOfCurrentWeek.getTime();
      const weekOffset = Math.round(diffMs / oneWeekMs);

      const startHour = selectedDate.getHours() + selectedDate.getMinutes() / 60;

      // 1. Add Event (triggers Google Calendar sync in backend)
      await addEvent({
        title: `[Rescue] ${taskText}`,
        start: startHour,
        duration: 1.0,
        day: selectedDate.getDay(),
        color: 'var(--accent-red)',
        type: 'focus',
        weekOffset: weekOffset
      });

      // 2. Update task due date
      const formattedDue = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')} ${String(selectedDate.getHours()).padStart(2, '0')}:${String(selectedDate.getMinutes()).padStart(2, '0')}`;
      await updateTask(taskId, { due: formattedDue });

      setToastMessage('Task scheduled & synced to Google Calendar!');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to schedule task:', err);
      alert('Failed to schedule task: ' + (err.message || err));
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
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification" style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'var(--gradient-blue-purple)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000,
          fontWeight: '600',
          animation: 'slideIn 0.3s ease'
        }}>
          {toastMessage}
        </div>
      )}

      {/* Emergency Header */}
      <div className="rescue-header">
        <div className="rescue-siren">
          <span className="siren-icon">🚨</span>
          <div className="siren-pulse"></div>
        </div>
        <div>
          <h2 className="rescue-title">RESCUE MODE</h2>
          <p className="rescue-subtitle" style={{ margin: '4px 0 12px 0' }}>
            {loadingTasks ? 'Analyzing deadlines...' : `AI Emergency Intervention — ${atRiskTasks.length} deadline${atRiskTasks.length !== 1 ? 's' : ''} at risk`}
          </p>
          {overdueTasks.length > 0 && (
            <button
              onClick={() => setShowOverdueModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--accent-red)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontSize: '13px',
                fontWeight: '700',
                padding: '8px 20px',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <span style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                backgroundColor: 'var(--accent-red)',
                borderRadius: '50%',
                boxShadow: '0 0 8px var(--accent-red)',
                animation: 'pulseRedDot 1.2s infinite'
              }}></span>
              View Overdue Tasks ({overdueTasks.length})
            </button>
          )}
        </div>
        <div className="rescue-risk-gauge">
          <svg viewBox="0 0 100 60" className="risk-gauge-svg">
            <path d="M10 55 A 40 40 0 0 1 90 55" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" strokeLinecap="round" />
            <path d="M10 55 A 40 40 0 0 1 90 55" fill="none"
              stroke={overallRisk > 70 ? 'var(--accent-red)' : overallRisk > 40 ? 'var(--accent-orange)' : 'var(--accent-green)'}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray="126" strokeDashoffset={126 - (overallRisk / 100) * 126}
              style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
            <text x="50" y="50" textAnchor="middle" fill="var(--text-primary)" fontSize="18" fontWeight="800" fontFamily="var(--font-display)">{overallRisk}%</text>
            <text x="50" y="32" textAnchor="middle" fill="var(--text-tertiary)" fontSize="7" letterSpacing="1">RISK</text>
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
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        <span style={{ fontSize: 'var(--text-md)', fontWeight: '700' }}>{task.text}</span>
                        <span style={{
                          fontSize: '10px',
                          padding: '2px 8px',
                          background: task.risk > 70 ? 'rgba(239, 68, 68, 0.1)' : task.risk > 40 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                          color: task.risk > 70 ? 'var(--accent-red)' : task.risk > 40 ? 'var(--accent-orange)' : 'var(--accent-blue)',
                          border: `1px solid ${task.risk > 70 ? 'rgba(239, 68, 68, 0.2)' : task.risk > 40 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`,
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: '700'
                        }}>
                          {task.risk > 70 ? '⚠️ Critical Risk' : task.risk > 40 ? '⚡ High Risk' : '🛡️ Medium Risk'}
                        </span>
                        {task.priority === 'critical' && <span style={{ fontSize: '10px', padding: '2px 8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-sm)', fontWeight: '700' }}>Critical Priority</span>}
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: 'var(--text-tertiary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Risk Factor
                      </span>
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

                  {/* Scheduling Panel inside Task Card */}
                  <div className="rescue-schedule-panel" style={{
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '600', letterSpacing: '0.05em' }}>📅 SCHEDULE FOCUS BLOCK IN CALENDAR</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="datetime-local"
                        value={scheduledTimes[task.id] || ''}
                        onChange={(e) => setScheduledTimes(prev => ({ ...prev, [task.id]: e.target.value }))}
                        style={{
                          background: 'rgba(0, 0, 0, 0.2)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--text-primary)',
                          padding: '6px 10px',
                          fontSize: '12px',
                          outline: 'none',
                          flex: 1,
                          minWidth: '180px'
                        }}
                      />
                      <button
                        className="btn-secondary btn-sm"
                        onClick={() => handleScheduleTask(task.id, task.text)}
                        style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          padding: '6px 12px',
                          height: '32px'
                        }}
                      >
                        Schedule & Sync
                      </button>
                    </div>
                  </div>

                  <div className="rescue-actions" style={{ marginTop: '20px' }}>
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
                      onClick={() => handleGenerateTaskRoadmap(task.id, task.text, task.priority, subtasks)}
                      disabled={loadingTaskRoadmaps[task.id]}
                      style={{
                        background: 'rgba(139, 92, 246, 0.1)',
                        color: 'var(--accent-purple-light)',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        fontWeight: '600'
                      }}
                    >
                      {loadingTaskRoadmaps[task.id] ? '⚡ Formulating Rescue Plan...' : '🧠 Generate AI Rescue Plan'}
                    </button>
                  </div>

                  {taskRoadmaps[task.id] && (
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.01)',
                      border: '1px solid rgba(255, 255, 255, 0.03)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 14px',
                      marginTop: '16px',
                      fontSize: '12px',
                      lineHeight: '1.5',
                      color: 'var(--text-secondary)'
                    }}>
                      {renderMarkdownText(taskRoadmaps[task.id])}
                    </div>
                  )}
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

      {/* Overdue Modal Overlay */}
      {showOverdueModal && (
        <div className="task-detail-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="widget glass-card-static" style={{
            width: '90%',
            maxWidth: '750px',
            maxHeight: '85vh',
            overflowY: 'auto',
            position: 'relative',
            padding: '28px',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            background: 'var(--bg-elevated)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Close Button */}
            <button
              onClick={() => { setShowOverdueModal(false); setOverdueAiPlan(null); }}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '20px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>

            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-red)', marginBottom: '8px' }}>
              🚨 Overdue Tasks Rescue Desk
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
              These tasks missed their deadlines. Reschedule them to sync with Google Calendar or have Nova generate an emergency recovery plan.
            </p>

            <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
              {/* Overdue Tasks List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {overdueTasks.length === 0 ? (
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
                    No overdue tasks! Keep up the good work.
                  </p>
                ) : (
                  overdueTasks.map((t) => (
                    <div key={t.id} style={{
                      padding: '16px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                      borderRadius: 'var(--radius-lg)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{t.text}</h4>
                          <span style={{ fontSize: '11px', color: 'var(--accent-red-light)', fontWeight: '600' }}>
                            ⚠️ Overdue: {t.due}
                          </span>
                        </div>
                        <span style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: 'var(--accent-red)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: '700'
                        }}>
                          {t.risk}% Risk
                        </span>
                      </div>

                      {/* Scheduler inside Modal */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                          type="datetime-local"
                          value={scheduledTimes[t.id] || ''}
                          onChange={(e) => setScheduledTimes(prev => ({ ...prev, [t.id]: e.target.value }))}
                          style={{
                            background: 'rgba(0, 0, 0, 0.2)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--text-primary)',
                            padding: '6px 10px',
                            fontSize: '12px',
                            outline: 'none',
                            flex: 1,
                            minWidth: '180px'
                          }}
                        />
                        <button
                          className="btn-secondary btn-sm"
                          onClick={() => handleScheduleTask(t.id, t.text)}
                          style={{ fontSize: '11px', fontWeight: '600', padding: '6px 12px' }}
                        >
                          Schedule & Sync
                        </button>
                      </div>

                      {/* AI Rescue Plan inside Modal Task Item */}
                      <div style={{
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.03)'
                      }}>
                        <button
                          className="btn-secondary btn-sm"
                          onClick={() => handleGenerateTaskRoadmap(t.id, t.text, t.priority, t.subtasks || [])}
                          disabled={loadingTaskRoadmaps[t.id]}
                          style={{
                            background: 'rgba(139, 92, 246, 0.1)',
                            color: 'var(--accent-purple-light)',
                            border: '1px solid rgba(139, 92, 246, 0.2)',
                            fontWeight: '600',
                            fontSize: '11px',
                            padding: '4px 10px'
                          }}
                        >
                          {loadingTaskRoadmaps[t.id] ? '⚡ Formulating Rescue Plan...' : '🧠 Generate AI Rescue Plan'}
                        </button>

                        {taskRoadmaps[t.id] && (
                          <div style={{
                            background: 'rgba(255, 255, 255, 0.01)',
                            border: '1px solid rgba(255, 255, 255, 0.03)',
                            borderRadius: 'var(--radius-md)',
                            padding: '10px 12px',
                            marginTop: '8px',
                            fontSize: '11px',
                            lineHeight: '1.5',
                            color: 'var(--text-secondary)'
                          }}>
                            {renderMarkdownText(taskRoadmaps[t.id])}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* AI Rescue Plan Button */}
              {overdueTasks.length > 0 && (
                <div style={{
                  marginTop: '12px',
                  paddingTop: '20px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>AI Overdue Recovery Plan</h4>
                    <button
                      className="btn-primary btn-sm"
                      onClick={handleGenerateOverdueAiRescuePlan}
                      disabled={loadingOverdueAiPlan}
                      style={{
                        background: 'var(--gradient-blue-purple)',
                        fontSize: '12px',
                        fontWeight: '600',
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-md)'
                      }}
                    >
                      {loadingOverdueAiPlan ? '⚡ Formulating Plan...' : '🧠 Generate AI Rescue Plan'}
                    </button>
                  </div>

                  {overdueAiPlan && (
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.01)',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '16px',
                      maxHeight: '280px',
                      overflowY: 'auto',
                      lineHeight: '1.6'
                    }}>
                      {renderMarkdownText(overdueAiPlan)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
