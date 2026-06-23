import { useTasks } from '../hooks/useTasks';
import './RescueModePage.css';

export default function RescueModePage() {
  const { tasks, loading, user } = useTasks();

  // Filter tasks that are active (not done) and have a risk level defined
  const atRiskTasks = tasks
    .filter(t => !t.done && t.risk && t.risk > 0)
    .sort((a, b) => (b.risk || 0) - (a.risk || 0));

  const overallRisk = atRiskTasks.length > 0
    ? Math.round(atRiskTasks.reduce((acc, t) => acc + (t.risk || 0), 0) / atRiskTasks.length)
    : 0;

  const successProbability = 100 - overallRisk;

  const getDynamicReason = (priority: string, due: string) => {
    if (priority === 'critical') {
      return `Critical deadline approaching (${due}) with high incompletion risk.`;
    }
    if (priority === 'high') {
      return `High priority task due (${due}) with limited focus window left.`;
    }
    return `Approaching deadline (${due}) needs structured planning to avoid backlog.`;
  };

  const getDynamicAction = (priority: string) => {
    if (priority === 'critical') {
      return 'Initiate immediate Focus Session. Turn off all notifications and complete core tasks.';
    }
    if (priority === 'high') {
      return 'Prepare outline, split into 25-minute Pomodoro sprints, and execute.';
    }
    return 'Schedule a deep focus time slot in your calendar to clear this task early.';
  };

  if (!user) {
    return (
      <div className="rescue-page" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex', minHeight: '60vh' }}>
        <div className="widget glass-card-static" style={{ padding: '40px', textAlign: 'center', maxWidth: '480px' }}>
          <h3>🔒 Authentication Required</h3>
          <p style={{ marginTop: '12px', marginBottom: '24px' }}>Please log in using Google or email on the login page to access Rescue Mode.</p>
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
            {loading ? 'Analyzing deadlines...' : `AI Emergency Intervention — ${atRiskTasks.length} deadline${atRiskTasks.length !== 1 ? 's' : ''} at risk`}
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

      {loading ? (
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
          {/* AI Emergency Plan */}
          <div className="rescue-ai-plan widget">
            <div className="ai-avatar-inner" style={{ width: 28, height: 28, flexShrink: 0 }}></div>
            <div className="rescue-ai-msg">
              <strong>🚨 Emergency AI Analysis:</strong>
              <p>You have {atRiskTasks.length} deadlines at risk. I've created an emergency rescue plan. Follow this exact sequence to maximize your success probability from {successProbability}% to 90%.</p>
            </div>
          </div>

          {/* At-Risk Tasks */}
          <div className="rescue-tasks">
            {atRiskTasks.map((task, i) => (
              <div key={task.id} className={`rescue-card widget rescue-risk-${task.risk && task.risk > 70 ? 'critical' : task.risk && task.risk > 40 ? 'high' : 'medium'}`}>
                <div className="rescue-card-header">
                  <div className="rescue-step">
                    <span className="step-num">Step {i + 1}</span>
                    <h3>{task.text}</h3>
                    <span className="rescue-due">{task.due}</span>
                  </div>
                  <div className="rescue-risk-circle">
                    <svg viewBox="0 0 60 60">
                      <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="4" />
                      <circle cx="30" cy="30" r="24" fill="none"
                        stroke={task.risk && task.risk > 70 ? 'var(--accent-red)' : task.risk && task.risk > 40 ? 'var(--accent-orange)' : 'var(--accent-green)'}
                        strokeWidth="4" strokeLinecap="round" strokeDasharray="150.8"
                        strokeDashoffset={150.8 - ((task.risk || 0) / 100) * 150.8}
                        style={{ transform: 'rotate(-90deg)', transformOrigin: '30px 30px', transition: 'stroke-dashoffset 0.8s ease-out' }} />
                      <text x="30" y="34" textAnchor="middle" fill="var(--text-primary)" fontSize="14" fontWeight="800">{task.risk}%</text>
                    </svg>
                  </div>
                </div>

                <div className="rescue-details">
                  <div className="rescue-detail">
                    <span className="rescue-label">⚠️ Why at risk:</span>
                    <span>{getDynamicReason(task.priority, task.due)}</span>
                  </div>
                  <div className="rescue-detail">
                    <span className="rescue-label">⏱️ Priority:</span>
                    <span style={{ textTransform: 'capitalize' }}>{task.priority}</span>
                  </div>
                  <div className="rescue-detail ai-action">
                    <span className="rescue-label">🤖 AI Action Plan:</span>
                    <span>{getDynamicAction(task.priority)}</span>
                  </div>
                </div>

                <div className="rescue-actions">
                  <button className="btn-primary btn-sm">🚀 Start Focus Sprint</button>
                </div>
              </div>
            ))}
          </div>

          {/* Emergency Schedule */}
          <div className="emergency-schedule widget">
            <h4>⚡ Emergency Schedule — Focus Order</h4>
            <div className="emergency-timeline">
              {atRiskTasks.map((t, idx) => (
                <div key={t.id} className={`etl-item ${idx === 0 ? 'active' : ''}`}>
                  <div className="etl-time">{idx === 0 ? 'NOW' : `+${idx * 2}h`}</div>
                  <div className="etl-bar" style={{ background: t.priority === 'critical' ? 'var(--accent-red)' : 'var(--accent-orange)' }}></div>
                  <div className="etl-content">
                    <span className="etl-task">{t.text}</span>
                    <span className="etl-duration">{t.due} • {t.priority} priority</span>
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
