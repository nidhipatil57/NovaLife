import { useTasks } from '../hooks/useTasks';
import { useHabits } from '../hooks/useHabits';
import './FutureTimelinePage.css';

export default function FutureTimelinePage() {
  const { tasks, loading: tasksLoading, user } = useTasks();
  const { habits, loading: habitsLoading } = useHabits();

  const isLoading = tasksLoading || habitsLoading;

  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter(t => t.done).length;
  const taskScore = totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 100;
  
  const habitScore = habits.length > 0 ? habits.reduce((acc, h) => acc + h.rate, 0) / habits.length : 100;

  const currentScore = habits.length === 0 && tasks.length === 0 
    ? 0 
    : Math.round((taskScore + habitScore) / 2);

  const optimizedScore = currentScore > 0 ? Math.min(95, Math.round(currentScore * 1.3)) : 70;
  const bestCaseScore = currentScore > 0 ? Math.min(100, Math.round(currentScore * 1.45)) : 90;

  const paths = [
    { name: 'Current Path', score: currentScore, description: 'Maintaining current pace without changes', color: 'var(--accent-orange)' },
    { name: 'Optimized Path', score: optimizedScore, description: "Following AI recommendations consistently", color: 'var(--accent-green)' },
    { name: 'Best Case', score: bestCaseScore, description: 'Maximum effort + consistency + AI optimization', color: 'var(--accent-cyan)' },
  ];

  // Dynamically scale timeline predictions based on currentScore
  const getTimelinePrediction = (index: number) => {
    if (currentScore === 0) {
      // Starting potential values
      const potentials = [40, 50, 60, 75, 80, 88];
      return `${potentials[index]}%`;
    }
    // Progression scaling
    const progression = Math.min(100, Math.round(currentScore * (1 + index * 0.08)));
    return `${progression}%`;
  };

  const timeline = [
    { period: 'This Week', prediction: getTimelinePrediction(0), label: 'tasks will be completed', status: currentScore > 75 ? 'good' : 'warning', details: 'Initial focus is key. Keep checking off daily habits.', icon: '📅' },
    { period: 'Next Week', prediction: getTimelinePrediction(1), label: 'goals on track', status: currentScore > 65 ? 'good' : 'warning', details: 'Check tasks list early to avoid backlogs.', icon: '📊' },
    { period: '1 Month', prediction: getTimelinePrediction(2), label: 'monthly goals achieved', status: currentScore > 60 ? 'good' : 'warning', details: 'Consistent effort pushes goal achievements forward.', icon: '🎯' },
    { period: '3 Months', prediction: getTimelinePrediction(3), label: 'quarterly milestones hit', status: 'good', details: 'Long-term habits solidify. Significant consistency boosts.', icon: '🚀' },
    { period: '6 Months', prediction: getTimelinePrediction(4), label: 'long-term goals achieved', status: 'great', details: 'Strong trajectory. Habits completed and streaks maximized.', icon: '⭐' },
    { period: '1 Year', prediction: getTimelinePrediction(5), label: 'life goals fulfilled', status: 'great', details: 'Optimized lifestyle fully active.', icon: '🏆' },
  ];

  if (!user) {
    return (
      <div className="future-page" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex', minHeight: '60vh' }}>
        <div className="widget glass-card-static" style={{ padding: '40px', textAlign: 'center', maxWidth: '480px' }}>
          <h3>🔒 Authentication Required</h3>
          <p style={{ marginTop: '12px', marginBottom: '24px' }}>Please log in using Google or email on the login page to access the Future Timeline.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="future-page">
      <div className="page-header">
        <div>
          <h2>🔮 <span className="gradient-text">Future Timeline</span></h2>
          <p>AI-powered life prediction — see your trajectory and optimize your path.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state" style={{ textAlign: 'center', padding: '60px' }}>
          <div className="ai-onboard-avatar" style={{ margin: '0 auto 20px auto', width: '40px', height: '40px' }}></div>
          <p>Calculating timeline projections...</p>
        </div>
      ) : (
        <>
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
                You'll complete <span className="gradient-text" style={{ fontSize: 'var(--text-3xl)', fontWeight: 800 }}>{currentScore}%</span> of your goals this month.
              </p>
              <p className="prediction-sub">
                Follow my optimized plan to increase this to <strong style={{ color: 'var(--accent-green)' }}>{optimizedScore}%</strong>
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
                      style={{ transform: 'rotate(-90deg)', transformOrigin: '40px 40px', transition: 'stroke-dashoffset 0.8s ease-out' }} />
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
                  <strong>Increase task consistency</strong>
                  <p>Checking off active tasks on time improves your baseline completion trajectory by +15%.</p>
                </div>
              </div>
              <div className="tip-item">
                <span>🔄</span>
                <div>
                  <strong>Maintain habit streaks</strong>
                  <p>Streaks build focus capacity, driving long-term life trajectory scores upward.</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
