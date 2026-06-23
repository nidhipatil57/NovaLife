import './RescueModePage.css';

const atRiskTasks = [
  { id: 1, task: 'Physics Assignment', due: 'Today, 11:59 PM', risk: 92, reason: 'Only 2 hours left, 60% incomplete', aiAction: 'Start immediately — focus on high-weight problems first', timeNeeded: '2h' },
  { id: 2, task: 'Math Test Prep', due: 'Tomorrow, 9:00 AM', risk: 78, reason: 'Limited prep time, 3 chapters unreviewed', aiAction: 'Priority review: Integration & Matrices only', timeNeeded: '3h' },
  { id: 3, task: 'Project Presentation', due: 'Wed, 2:00 PM', risk: 45, reason: 'Slides incomplete, need to practice delivery', aiAction: 'Complete slides tonight, practice tomorrow AM', timeNeeded: '1.5h' },
];

export default function RescueModePage() {
  const overallRisk = Math.round(atRiskTasks.reduce((a, b) => a + b.risk, 0) / atRiskTasks.length);

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
          <p className="rescue-subtitle">AI Emergency Intervention — {atRiskTasks.length} deadlines at risk</p>
        </div>
        <div className="rescue-risk-gauge">
          <svg viewBox="0 0 100 60" className="risk-gauge-svg">
            <path d="M10 55 A 40 40 0 0 1 90 55" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" strokeLinecap="round" />
            <path d="M10 55 A 40 40 0 0 1 90 55" fill="none"
              stroke={overallRisk > 70 ? 'var(--accent-red)' : overallRisk > 40 ? 'var(--accent-orange)' : 'var(--accent-green)'}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray="126" strokeDashoffset={126 - (overallRisk / 100) * 126}
              style={{ transition: 'stroke-dashoffset 1.5s ease-out' }} />
            <text x="50" y="50" textAnchor="middle" fill="var(--text-primary)" fontSize="20" fontWeight="800" fontFamily="var(--font-display)">{overallRisk}%</text>
            <text x="50" y="38" textAnchor="middle" fill="var(--text-tertiary)" fontSize="7" letterSpacing="1">RISK</text>
          </svg>
        </div>
      </div>

      {/* AI Emergency Plan */}
      <div className="rescue-ai-plan widget">
        <div className="ai-avatar-inner" style={{ width: 28, height: 28, flexShrink: 0 }}></div>
        <div className="rescue-ai-msg">
          <strong>🚨 Emergency AI Analysis:</strong>
          <p>You have {atRiskTasks.length} deadlines at risk. I've created an emergency rescue plan. Follow this exact sequence to maximize your success probability from {100 - overallRisk}% to 85%.</p>
        </div>
      </div>

      {/* At-Risk Tasks */}
      <div className="rescue-tasks">
        {atRiskTasks.map((task, i) => (
          <div key={task.id} className={`rescue-card widget rescue-risk-${task.risk > 70 ? 'critical' : task.risk > 40 ? 'high' : 'medium'}`}>
            <div className="rescue-card-header">
              <div className="rescue-step">
                <span className="step-num">Step {i + 1}</span>
                <h3>{task.task}</h3>
                <span className="rescue-due">{task.due}</span>
              </div>
              <div className="rescue-risk-circle">
                <svg viewBox="0 0 60 60">
                  <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="4" />
                  <circle cx="30" cy="30" r="24" fill="none"
                    stroke={task.risk > 70 ? 'var(--accent-red)' : task.risk > 40 ? 'var(--accent-orange)' : 'var(--accent-green)'}
                    strokeWidth="4" strokeLinecap="round" strokeDasharray="150.8"
                    strokeDashoffset={150.8 - (task.risk / 100) * 150.8}
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '30px 30px' }} />
                  <text x="30" y="34" textAnchor="middle" fill="var(--text-primary)" fontSize="14" fontWeight="800">{task.risk}%</text>
                </svg>
              </div>
            </div>

            <div className="rescue-details">
              <div className="rescue-detail">
                <span className="rescue-label">⚠️ Why at risk:</span>
                <span>{task.reason}</span>
              </div>
              <div className="rescue-detail">
                <span className="rescue-label">⏱️ Time needed:</span>
                <span>{task.timeNeeded}</span>
              </div>
              <div className="rescue-detail ai-action">
                <span className="rescue-label">🤖 AI Action Plan:</span>
                <span>{task.aiAction}</span>
              </div>
            </div>

            <div className="rescue-actions">
              <button className="btn-primary btn-sm">🚀 Start Now</button>
              <button className="btn-secondary btn-sm">📅 Reschedule</button>
              <button className="btn-secondary btn-sm">🔕 Snooze</button>
            </div>
          </div>
        ))}
      </div>

      {/* Emergency Schedule */}
      <div className="emergency-schedule widget">
        <h4>⚡ Emergency Schedule — Next 6 Hours</h4>
        <div className="emergency-timeline">
          <div className="etl-item active">
            <div className="etl-time">NOW</div>
            <div className="etl-bar" style={{ background: 'var(--accent-red)' }}></div>
            <div className="etl-content">
              <span className="etl-task">Physics Assignment</span>
              <span className="etl-duration">2 hours • Deep Focus</span>
            </div>
          </div>
          <div className="etl-item">
            <div className="etl-time">+2h</div>
            <div className="etl-bar" style={{ background: 'var(--accent-green)' }}></div>
            <div className="etl-content">
              <span className="etl-task">Break + Hydrate</span>
              <span className="etl-duration">15 min • Recovery</span>
            </div>
          </div>
          <div className="etl-item">
            <div className="etl-time">+2.5h</div>
            <div className="etl-bar" style={{ background: 'var(--accent-purple)' }}></div>
            <div className="etl-content">
              <span className="etl-task">Math Review — Integration</span>
              <span className="etl-duration">1.5 hours • Study Sprint</span>
            </div>
          </div>
          <div className="etl-item">
            <div className="etl-time">+4h</div>
            <div className="etl-bar" style={{ background: 'var(--accent-green)' }}></div>
            <div className="etl-content">
              <span className="etl-task">Break + Quick Walk</span>
              <span className="etl-duration">15 min • Recovery</span>
            </div>
          </div>
          <div className="etl-item">
            <div className="etl-time">+4.5h</div>
            <div className="etl-bar" style={{ background: 'var(--accent-orange)' }}></div>
            <div className="etl-content">
              <span className="etl-task">Project Slides Completion</span>
              <span className="etl-duration">1.5 hours • Focus Mode</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
