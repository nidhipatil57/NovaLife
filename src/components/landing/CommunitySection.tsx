import { useScrollAnimation, useCountUp } from '../../hooks/useAnimations';
import './CommunitySection.css';

const stats = [
  { value: 50000, label: 'Active Users', suffix: '+' },
  { value: 2, label: 'Tasks Completed', suffix: 'M+' },
  { value: 98, label: 'Satisfaction Rate', suffix: '%' },
  { value: 150, label: 'Countries', suffix: '+' },
];

export default function CommunitySection() {
  const { ref, isVisible } = useScrollAnimation(0.2);

  return (
    <section className="section community-section" id="community" ref={ref}>
      <div className="container">
        <div className={`scroll-animate ${isVisible ? 'visible' : ''}`}>
          <div className="section-badge">🌍 Community</div>
          <h2 className="section-title">
            Join The <span className="gradient-text">Movement</span>
          </h2>
          <p className="section-subtitle">
            Thousands of ambitious individuals using NovaLife to crush their goals together.
          </p>
        </div>

        <div className="community-stats">
          {stats.map((stat, i) => (
            <StatCounter key={i} stat={stat} isVisible={isVisible} index={i} />
          ))}
        </div>

        <div className={`community-features scroll-animate stagger-3 ${isVisible ? 'visible' : ''}`}>
          <div className="community-card glass-card">
            <span className="community-icon">🏆</span>
            <h4>Global Leaderboard</h4>
            <p>Compete with users worldwide on productivity streaks and goal completion.</p>
          </div>
          <div className="community-card glass-card">
            <span className="community-icon">📚</span>
            <h4>Study Groups</h4>
            <p>Join or create study groups with shared timers, goals, and accountability.</p>
          </div>
          <div className="community-card glass-card">
            <span className="community-icon">🔥</span>
            <h4>Weekly Challenges</h4>
            <p>Participate in community challenges to build better habits and win rewards.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCounter({ stat, isVisible, index }: { stat: { value: number; label: string; suffix: string }; isVisible: boolean; index: number }) {
  const { count, ref } = useCountUp(stat.value, 2000, true);

  return (
    <div
      ref={ref}
      className={`stat-item scroll-animate stagger-${index + 1} ${isVisible ? 'visible' : ''}`}
    >
      <div className="stat-value gradient-text">{count.toLocaleString()}{stat.suffix}</div>
      <div className="stat-label">{stat.label}</div>
    </div>
  );
}
