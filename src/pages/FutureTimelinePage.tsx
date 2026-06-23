import './FutureTimelinePage.css';

const timeline = [
  { period: 'This Week', prediction: '73%', label: 'tasks will be completed', status: 'good', details: 'Strong start. Maintain focus on physics and math prep.', icon: '📅' },
  { period: 'Next Week', prediction: '68%', label: 'goals on track', status: 'warning', details: 'Exam week — need 20% more study time than planned.', icon: '📊' },
  { period: '1 Month', prediction: '65%', label: 'monthly goals achieved', status: 'warning', details: 'Career & fitness goals need more attention.', icon: '🎯' },
  { period: '3 Months', prediction: '78%', label: 'quarterly milestones hit', status: 'good', details: 'On track for React mastery & fitness improvements.', icon: '🚀' },
  { period: '6 Months', prediction: '82%', label: 'long-term goals achieved', status: 'great', details: 'Strong trajectory — habit consistency improving.', icon: '⭐' },
  { period: '1 Year', prediction: '88%', label: 'life goals fulfilled', status: 'great', details: 'At current pace: Web Dev career, fit lifestyle, well-read.', icon: '🏆' },
];

const paths = [
  { name: 'Current Path', score: 65, description: 'Maintaining current pace without changes', color: 'var(--accent-orange)' },
  { name: 'Optimized Path', score: 88, description: "Following AI recommendations consistently", color: 'var(--accent-green)' },
  { name: 'Best Case', score: 95, description: 'Maximum effort + consistency + AI optimization', color: 'var(--accent-cyan)' },
];

export default function FutureTimelinePage() {
  return (
    <div className="future-page">
      <div className="page-header">
        <div>
          <h2>🔮 <span className="gradient-text">Future Timeline</span></h2>
          <p>AI-powered life prediction — see your trajectory and optimize your path.</p>
        </div>
      </div>

      {/* Current Prediction Banner */}
      <div className="future-banner widget">
        <div className="future-orb">
          <div className="crystal-ball">
            <div className="crystal-inner">🔮</div>
            <div className="crystal-glow"></div>
          </div>
        </div>
        <div className="future-prediction">
          <h3>At your current pace...</h3>
          <p className="prediction-main">
            You'll complete <span className="gradient-text" style={{ fontSize: 'var(--text-3xl)', fontWeight: 800 }}>65%</span> of your goals this month.
          </p>
          <p className="prediction-sub">
            Follow my optimized plan to increase this to <strong style={{ color: 'var(--accent-green)' }}>88%</strong>
          </p>
        </div>
      </div>

      {/* Path Comparison */}
      <div className="path-comparison">
        {paths.map((path, i) => (
          <div key={i} className="path-card widget" style={{ '--path-color': path.color } as React.CSSProperties}>
            <h4 className="path-name" style={{ color: path.color }}>{path.name}</h4>
            <div className="path-score">
              <svg viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="5" />
                <circle cx="40" cy="40" r="34" fill="none" stroke={path.color} strokeWidth="5"
                  strokeLinecap="round" strokeDasharray="213.6"
                  strokeDashoffset={213.6 - (path.score / 100) * 213.6}
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '40px 40px', transition: 'stroke-dashoffset 1.5s ease-out' }} />
                <text x="40" y="44" textAnchor="middle" fill="var(--text-primary)" fontSize="18" fontWeight="800" fontFamily="var(--font-display)">{path.score}%</text>
              </svg>
            </div>
            <p className="path-desc">{path.description}</p>
          </div>
        ))}
      </div>

      {/* Visual Timeline */}
      <div className="future-timeline-visual widget">
        <h4>📈 Goal Achievement Forecast</h4>
        <div className="visual-timeline">
          {timeline.map((point, i) => (
            <div key={i} className={`timeline-point status-${point.status}`}>
              <div className="tp-connector">{i > 0 && <div className="tp-line"></div>}</div>
              <div className="tp-node">
                <span className="tp-icon">{point.icon}</span>
              </div>
              <div className="tp-content">
                <span className="tp-period">{point.period}</span>
                <div className="tp-prediction">
                  <span className="tp-value">{point.prediction}</span>
                  <span className="tp-label">{point.label}</span>
                </div>
                <p className="tp-details">{point.details}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Optimization Tips */}
      <div className="future-tips widget">
        <h4>💡 How to improve your trajectory</h4>
        <div className="tips-grid">
          <div className="tip-item">
            <span>🎯</span>
            <div>
              <strong>Increase study consistency</strong>
              <p>Study at least 2 hours daily instead of cramming before exams. Impact: +12%</p>
            </div>
          </div>
          <div className="tip-item">
            <span>🏃</span>
            <div>
              <strong>Don't skip gym days</strong>
              <p>Your fitness goal drops 20% for every skipped session. Impact: +8%</p>
            </div>
          </div>
          <div className="tip-item">
            <span>📱</span>
            <div>
              <strong>Reduce screen time after 8 PM</strong>
              <p>Your productivity drops 40% after excessive evening screen time. Impact: +15%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
