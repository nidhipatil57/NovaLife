import { useState, useMemo } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useHabits } from '../hooks/useHabits';
import { useGoals } from '../hooks/useGoals';
import { useDataContext } from '../context/DataContext';
import { calculateProductivityScore } from '../utils/productivityEngine';
import './AnalyticsPage.css';

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AnalyticsPage() {
  const { tasks, loading: tasksLoading, user } = useTasks();
  const { habits, loading: habitsLoading } = useHabits();
  const { goals, loading: goalsLoading } = useGoals();
  const { focusSessions, events, rescueActivations, productivityScore } = useDataContext();

  const isLoading = tasksLoading || habitsLoading || goalsLoading;

  // Share states
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Get date for each weekday of the current week (Monday-first)
  const weekDates = useMemo(() => {
    const today = new Date();
    let currentDay = today.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    if (currentDay === 0) currentDay = 7; // Map Sun to 7 so Mon is 1
    
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDay + 1);
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toDateString();
    });
  }, []);

  // 1. Calculate dynamic weeklyData using actual focus sessions
  const weeklyData = useMemo(() => {
    return daysOfWeek.map((day, index) => {
      const targetDateStr = weekDates[index];
      const daySessions = focusSessions.filter(s => {
        const d = new Date(s.created_at || s.created_at || new Date());
        return d.toDateString() === targetDateStr;
      });
      const totalSeconds = daySessions.reduce((acc, s) => acc + (s.duration || 0), 0);
      const focusHours = Math.round((totalSeconds / 3600) * 10) / 10; // in hours

      const tasksCompletedOnDay = tasks.filter(t => {
        if (!t.done) return false;
        
        const completionLogs = t.activityLog
          ? t.activityLog.filter(log => log.action.toLowerCase().includes('completed'))
          : [];
        
        if (completionLogs.length > 0) {
          const lastLog = completionLogs[completionLogs.length - 1];
          const logDate = new Date(lastLog.timestamp);
          return logDate.toDateString() === targetDateStr;
        }
        
        if (t.createdAt) {
          const createdDate = new Date(t.createdAt);
          return createdDate.toDateString() === targetDateStr;
        }
        
        return false;
      }).length;

      const targetDate = new Date(targetDateStr);
      const dailyScore = calculateProductivityScore(
        tasks,
        habits,
        goals,
        focusSessions,
        events,
        rescueActivations,
        targetDate
      );

      return { day, focus: focusHours, tasks: tasksCompletedOnDay, score: dailyScore };
    });
  }, [focusSessions, tasks, habits, goals, events, rescueActivations, weekDates]);

  // Calculate today's actual focus hours (instead of weekly estimate) for the summary card
  const todayFocusHours = useMemo(() => {
    const todayStr = new Date().toDateString();
    const todaySessions = focusSessions.filter(s => {
      const d = new Date(s.created_at || s.created_at || new Date());
      return d.toDateString() === todayStr;
    });
    const totalSeconds = todaySessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    return Math.round((totalSeconds / 3600) * 10) / 10;
  }, [focusSessions]);

  // 2. Summary stats
  const totalFocusHours = Math.round(weeklyData.reduce((acc, d) => acc + d.focus, 0) * 10) / 10;
  const completedTasksCount = tasks.filter(t => t.done).length;
  const avgProductivityScore = weeklyData.length > 0
    ? Math.round(weeklyData.reduce((acc, d) => acc + d.score, 0) / weeklyData.length) : 0;
  const avgGoalProgress = goals.length > 0
    ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / goals.length) : 0;

  const maxFocus = Math.max(...weeklyData.map(d => d.focus)) || 1;
  const maxTasks = Math.max(...weeklyData.map(d => d.tasks)) || 1;

  // 3. Goal categories
  const goalCategories = goals.reduce<Record<string, number>>((acc, g) => {
    acc[g.category] = (acc[g.category] || 0) + 1;
    return acc;
  }, {});

  // Helper to draw rounded rectangles on Canvas
  const drawRoundedRect = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  };

  // Generate achievements card PNG using Canvas
  const generatePNGCard = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, 800, 500);
    grad.addColorStop(0, '#0f0c1b');
    grad.addColorStop(1, '#05020a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 500);

    // Glowing radial overlays
    const glowTL = ctx.createRadialGradient(0, 0, 50, 0, 0, 400);
    glowTL.addColorStop(0, 'rgba(139, 92, 246, 0.18)'); // Violet
    glowTL.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowTL;
    ctx.fillRect(0, 0, 800, 500);

    const glowBR = ctx.createRadialGradient(800, 500, 50, 800, 500, 400);
    glowBR.addColorStop(0, 'rgba(6, 182, 212, 0.15)'); // Cyan
    glowBR.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowBR;
    ctx.fillRect(0, 0, 800, 500);

    // Rounded border outer container
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, 15, 15, 770, 470, 16);
    ctx.stroke();

    // ─── HEADER ───
    // Draw Logo Diamond
    const logoGrad = ctx.createLinearGradient(40, 40, 70, 70);
    logoGrad.addColorStop(0, '#8b5cf6');
    logoGrad.addColorStop(1, '#06b6d4');
    ctx.fillStyle = logoGrad;
    ctx.beginPath();
    ctx.moveTo(55, 35);
    ctx.lineTo(70, 50);
    ctx.lineTo(55, 65);
    ctx.lineTo(40, 50);
    ctx.closePath();
    ctx.fill();

    // Brand label
    ctx.fillStyle = '#a78bfa';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('WEEKLY PERFORMANCE REPORT', 80, 42);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('NovaLife Metrics', 80, 62);

    // User Subtitle
    ctx.fillStyle = '#9ca3af';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Weekly accomplishments and progress for ${user?.displayName || 'User'}`, 40, 105);

    // Separator line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 120);
    ctx.lineTo(760, 120);
    ctx.stroke();

    // ─── LEFT COLUMN: STATS CARDS ───
    const cardX = 40;
    const cardW = 320;
    const cardH = 75;

    // Card 1: Focus Time
    const y1 = 140;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    drawRoundedRect(ctx, cardX, y1, cardW, cardH, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.stroke();

    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px sans-serif';
    ctx.fillText('TOTAL FOCUS TIME', cardX + 50, y1 + 25);
    ctx.font = '22px sans-serif';
    ctx.fillText('⏱️', cardX + 15, y1 + 45);
    ctx.fillStyle = '#38bdf8'; // light blue
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`${totalFocusHours} Hours`, cardX + 50, y1 + 52);

    // Card 2: Tasks Completed
    const y2 = 225;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    drawRoundedRect(ctx, cardX, y2, cardW, cardH, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.stroke();

    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px sans-serif';
    ctx.fillText('TASKS COMPLETED', cardX + 50, y2 + 25);
    ctx.font = '22px sans-serif';
    ctx.fillText('✅', cardX + 15, y2 + 45);
    ctx.fillStyle = '#34d399'; // green
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`${completedTasksCount} / ${tasks.length} Completed`, cardX + 50, y2 + 52);

    // Draw little task completion progress bar inside Card 2
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    drawRoundedRect(ctx, cardX + 50, y2 + 58, 250, 5, 2.5);
    ctx.fill();
    const taskPct = tasks.length > 0 ? (completedTasksCount / tasks.length) : 0;
    if (taskPct > 0) {
      ctx.fillStyle = '#34d399';
      drawRoundedRect(ctx, cardX + 50, y2 + 58, 250 * taskPct, 5, 2.5);
      ctx.fill();
    }

    // Card 3: Productivity Score
    const y3 = 310;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    drawRoundedRect(ctx, cardX, y3, cardW, cardH, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.stroke();

    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px sans-serif';
    ctx.fillText('PRODUCTIVITY SCORE', cardX + 50, y3 + 25);
    ctx.font = '22px sans-serif';
    ctx.fillText('📈', cardX + 15, y3 + 45);
    ctx.fillStyle = '#a78bfa'; // purple
    ctx.font = 'bold 20px sans-serif';
    
    let ratingStr = 'Growing';
    if (productivityScore >= 80) ratingStr = 'Legendary';
    else if (productivityScore >= 65) ratingStr = 'Optimal';
    else if (productivityScore >= 45) ratingStr = 'Good';

    ctx.fillText(`${productivityScore} / 100 (${ratingStr})`, cardX + 50, y3 + 52);

    // Card 4: Goal Progress
    const y4 = 395;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    drawRoundedRect(ctx, cardX, y4, cardW, cardH, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.stroke();

    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px sans-serif';
    ctx.fillText('GOAL PROGRESS', cardX + 50, y4 + 25);
    ctx.font = '22px sans-serif';
    ctx.fillText('🎯', cardX + 15, y4 + 45);
    ctx.fillStyle = '#fb7185'; // rose
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`${avgGoalProgress}% Complete`, cardX + 50, y4 + 52);

    // Goal progress meter
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    drawRoundedRect(ctx, cardX + 50, y4 + 58, 250, 5, 2.5);
    ctx.fill();
    if (avgGoalProgress > 0) {
      ctx.fillStyle = '#fb7185';
      drawRoundedRect(ctx, cardX + 50, y4 + 58, 250 * (avgGoalProgress / 100), 5, 2.5);
      ctx.fill();
    }

    // ─── RIGHT COLUMN: DAILY ACTIVITY TREND CHART ───
    const chartX = 390;
    const chartY = 140;
    const chartW = 370;
    const chartH = 330;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    drawRoundedRect(ctx, chartX, chartY, chartW, chartH, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.stroke();

    // Chart title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('Daily Activity Trend', chartX + 24, chartY + 32);

    // Gridlines (max score is 100)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const chartBaseY = chartY + 240; // Y base line for chart at value 0
    const chartMaxHeight = 140;      // Height representing score = 100
    [0, 50, 100].forEach(scoreVal => {
      const yLine = chartBaseY - (scoreVal / 100) * chartMaxHeight;
      ctx.beginPath();
      ctx.moveTo(chartX + 24, yLine);
      ctx.lineTo(chartX + chartW - 24, yLine);
      ctx.stroke();

      // Value label on gridline
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.font = '9px sans-serif';
      ctx.fillText(`${scoreVal}`, chartX + chartW - 20, yLine + 3);
    });

    // Draw bars for 7 days
    weeklyData.forEach((d, i) => {
      const x = chartX + 32 + i * 44;
      const valHeight = Math.max(4, (d.score / 100) * chartMaxHeight);
      const y = chartBaseY - valHeight;

      // Draw bar gradient
      const barGrad = ctx.createLinearGradient(x, y, x, chartBaseY);
      barGrad.addColorStop(0, '#8b5cf6'); // Violet
      barGrad.addColorStop(1, '#3b82f6'); // Blue
      ctx.fillStyle = barGrad;

      drawRoundedRect(ctx, x, y, 22, valHeight, 4);
      ctx.fill();

      // Draw daily score text above the bar
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${d.score}`, x + 11, y - 6);

      // Draw day letter
      ctx.fillStyle = '#9ca3af';
      ctx.font = '11px sans-serif';
      ctx.fillText(d.day, x + 11, chartBaseY + 20);
    });
    ctx.textAlign = 'left'; // reset text alignment

    // Small explanation under the chart
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px sans-serif';
    ctx.fillText('Consistency includes completed habits & task progression', chartX + 24, chartBaseY + 54);

    // ─── FOOTER BRANDING ───
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px sans-serif';
    ctx.fillText('Empowering mindfulness & routine consistency', 40, 480);

    const nowStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    ctx.textAlign = 'right';
    ctx.fillText(`Date: ${nowStr} • Powered by NovaLife`, 760, 480);
    ctx.textAlign = 'left';

    return canvas.toDataURL('image/png');
  };

  const handleDownload = () => {
    const dataUrl = generatePNGCard();
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `novalife-weekly-achievements.png`;
      link.href = dataUrl;
      link.click();
      setToastMessage('Achievements dashboard downloaded as PNG!');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleShare = async (channel: 'whatsapp' | 'email') => {
    setShowShareDropdown(false);
    const dataUrl = generatePNGCard();
    if (!dataUrl) return;

    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'novalife-weekly-achievements.png', { type: 'image/png' });

      // Try native Web Share API to attach the file directly without copying/pasting
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'NovaLife Weekly Achievements'
        });
        setToastMessage('Opening system share sheet...');
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        // Fallback: Copy PNG to clipboard and open app
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ]);
        const targetLabel = channel === 'whatsapp' ? 'WhatsApp' : 'Email';
        setToastMessage(`Dashboard copied! Press Ctrl+V (Paste) in ${targetLabel} to share.`);
        setTimeout(() => setToastMessage(null), 6000);

        if (channel === 'whatsapp') {
          window.open(`whatsapp://send`, '_self');
        } else {
          window.open(`mailto:`, '_blank');
        }
      }
    } catch (err) {
      console.error('Sharing failed:', err);
      // Final Fallback: Download
      const link = document.createElement('a');
      link.download = `novalife-weekly-achievements.png`;
      link.href = dataUrl;
      link.click();
      setToastMessage('Dashboard downloaded as PNG!');
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

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
        <div className="page-header-actions share-actions-group">
          {/* Share Dropdown Wrapper */}
          <div className="share-dropdown-wrapper">
            <button 
              className="icon-btn" 
              onClick={() => setShowShareDropdown(!showShareDropdown)} 
              title="Share Weekly Achievements"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
            </button>
            {showShareDropdown && (
              <div className="share-dropdown-menu">
                <button className="dropdown-item" onClick={() => handleShare('whatsapp')}>
                  💬 WhatsApp
                </button>
                <button className="dropdown-item" onClick={() => handleShare('email')}>
                  ✉️ Email
                </button>
              </div>
            )}
          </div>
          {/* Direct Download Button */}
          <button 
            className="icon-btn btn-primary" 
            onClick={handleDownload} 
            title="Download Dashboard (PNG)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
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
            <div className="summary-card widget card-focus">
              <div className="summary-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>⏱️</div>
              <div className="summary-value">{todayFocusHours}h</div>
              <div className="summary-label">Today's Focus Time</div>
              <div className="summary-change positive">From active focus sessions</div>
            </div>
            <div className="summary-card widget card-tasks">
              <div className="summary-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>✅</div>
              <div className="summary-value">{completedTasksCount}</div>
              <div className="summary-label">Tasks Completed</div>
              <div className="summary-change positive">Out of {tasks.length} total</div>
            </div>
            <div className="summary-card widget card-score">
              <div className="summary-icon" style={{ background: 'rgba(139,92,246,0.15)' }}>📈</div>
              <div className="summary-value">{productivityScore}</div>
              <div className="summary-label">Productivity Score</div>
              <div className="summary-change positive">Central scoring engine</div>
            </div>
            <div className="summary-card widget card-goals">
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

      {/* Copy notification toast */}
      {toastMessage && (
        <div className="session-toast" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>
          <span>📋</span>
          <p>{toastMessage}</p>
        </div>
      )}
    </div>
  );
}
