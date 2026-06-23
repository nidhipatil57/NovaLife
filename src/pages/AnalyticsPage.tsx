import './AnalyticsPage.css';

const weeklyData = [
  { day: 'Mon', focus: 4.5, tasks: 8, score: 82 },
  { day: 'Tue', focus: 5.2, tasks: 12, score: 91 },
  { day: 'Wed', focus: 3.8, tasks: 6, score: 74 },
  { day: 'Thu', focus: 6.1, tasks: 15, score: 95 },
  { day: 'Fri', focus: 4.0, tasks: 9, score: 80 },
  { day: 'Sat', focus: 2.5, tasks: 4, score: 65 },
  { day: 'Sun', focus: 3.0, tasks: 5, score: 70 },
];

export default function AnalyticsPage() {
  const maxFocus = Math.max(...weeklyData.map(d => d.focus));
  const maxTasks = Math.max(...weeklyData.map(d => d.tasks));
  const avgScore = Math.round(weeklyData.reduce((a, b) => a + b.score, 0) / weeklyData.length);

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div>
          <h2>📊 <span className="gradient-text">Analytics</span></h2>
          <p>Deep productivity analysis with AI-powered insights.</p>
        </div>
        <div className="page-header-actions">
          <div className="view-toggle">
            <button className="active">Week</button>
            <button>Month</button>
            <button>Year</button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="analytics-summary">
        <div className="summary-card widget">
          <div className="summary-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>⏱️</div>
          <div className="summary-value">29.1h</div>
          <div className="summary-label">Total Focus Time</div>
          <div className="summary-change positive">+12% from last week</div>
        </div>
        <div className="summary-card widget">
          <div className="summary-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>✅</div>
          <div className="summary-value">59</div>
          <div className="summary-label">Tasks Completed</div>
          <div className="summary-change positive">+8% from last week</div>
        </div>
        <div className="summary-card widget">
          <div className="summary-icon" style={{ background: 'rgba(139,92,246,0.15)' }}>📈</div>
          <div className="summary-value">{avgScore}</div>
          <div className="summary-label">Avg Productivity Score</div>
          <div className="summary-change positive">+5 points</div>
        </div>
        <div className="summary-card widget">
          <div className="summary-icon" style={{ background: 'rgba(236,72,153,0.15)' }}>🎯</div>
          <div className="summary-value">87%</div>
          <div className="summary-label">Goal Completion Rate</div>
          <div className="summary-change positive">+3% from last week</div>
        </div>
      </div>

      {/* Charts */}
      <div className="analytics-charts">
        <div className="chart-card widget">
          <h4 className="chart-title">Focus Hours</h4>
          <div className="bar-chart">
            {weeklyData.map((d, i) => (
              <div key={i} className="bar-col">
                <div className="bar-wrapper">
                  <div className="bar" style={{ height: `${(d.focus / maxFocus) * 100}%`, background: 'linear-gradient(to top, var(--accent-blue), var(--accent-cyan))' }}>
                    <span className="bar-value">{d.focus}h</span>
                  </div>
                </div>
                <span className="bar-label">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card widget">
          <h4 className="chart-title">Tasks Completed</h4>
          <div className="bar-chart">
            {weeklyData.map((d, i) => (
              <div key={i} className="bar-col">
                <div className="bar-wrapper">
                  <div className="bar" style={{ height: `${(d.tasks / maxTasks) * 100}%`, background: 'linear-gradient(to top, var(--accent-green), var(--accent-cyan))' }}>
                    <span className="bar-value">{d.tasks}</span>
                  </div>
                </div>
                <span className="bar-label">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card widget chart-wide">
          <h4 className="chart-title">Weekly Productivity Score</h4>
          <div className="score-trend">
            {weeklyData.map((d, i) => (
              <div key={i} className="trend-col">
                <div className="trend-dot-wrapper" style={{ bottom: `${(d.score / 100) * 80}%` }}>
                  <div className="trend-dot" style={{ background: d.score >= 90 ? 'var(--accent-green)' : d.score >= 75 ? 'var(--accent-blue)' : 'var(--accent-orange)', boxShadow: `0 0 10px ${d.score >= 90 ? 'var(--accent-green)' : d.score >= 75 ? 'var(--accent-blue)' : 'var(--accent-orange)'}` }}>
                    <span className="trend-value">{d.score}</span>
                  </div>
                </div>
                <span className="bar-label">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights Panel */}
        <div className="chart-card widget">
          <h4 className="chart-title">🧠 AI Insights</h4>
          <div className="ai-insights-list">
            <div className="ai-insight-item">
              <span className="ai-insight-icon">📅</span>
              <p><strong>Tuesdays & Thursdays</strong> are your most productive days (avg score 93).</p>
            </div>
            <div className="ai-insight-item">
              <span className="ai-insight-icon">🌙</span>
              <p>You <strong>procrastinate more after 6 PM</strong>. Consider finishing key tasks earlier.</p>
            </div>
            <div className="ai-insight-item">
              <span className="ai-insight-icon">🧘</span>
              <p><strong>Meditation increases focus</strong> by 15%. You meditated on 4/7 days this week.</p>
            </div>
            <div className="ai-insight-item">
              <span className="ai-insight-icon">🎯</span>
              <p>Your <strong>goal completion rate improved 3%</strong>. Reading habit needs more consistency.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
