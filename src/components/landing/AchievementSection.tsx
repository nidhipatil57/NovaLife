import { useScrollAnimation } from '../../hooks/useAnimations';
import './AchievementSection.css';

const achievements = [
  { icon: '🏆', title: 'Consistency Master', desc: '30-day streak', color: 'var(--accent-orange)' },
  { icon: '🎯', title: 'Focus Hero', desc: '100+ focus hours', color: 'var(--accent-blue)' },
  { icon: '💎', title: 'Goal Crusher', desc: '50 goals completed', color: 'var(--accent-purple)' },
  { icon: '⚡', title: 'Productivity Legend', desc: 'Score 95+ for a week', color: 'var(--accent-cyan)' },
];

export default function AchievementSection() {
  const { ref, isVisible } = useScrollAnimation(0.2);

  return (
    <section className="section achievement-section" ref={ref}>
      <div className="container">
        <div className={`scroll-animate ${isVisible ? 'visible' : ''}`}>
          <div className="section-badge">🏅 Gamification</div>
          <h2 className="section-title">
            Unlock <span className="gradient-text">Achievements</span>
          </h2>
          <p className="section-subtitle">
            Turn productivity into a game. Earn rewards, build streaks, and level up your life.
          </p>
        </div>

        <div className="achievement-grid">
          {achievements.map((a, i) => (
            <div
              key={i}
              className={`achievement-card glass-card scroll-animate stagger-${i + 1} ${isVisible ? 'visible' : ''}`}
              style={{ '--ach-color': a.color } as React.CSSProperties}
            >
              <div className="ach-icon-wrapper">
                <span className="ach-icon">{a.icon}</span>
                <div className="ach-ring"></div>
              </div>
              <h4 className="ach-title">{a.title}</h4>
              <p className="ach-desc">{a.desc}</p>
              <div className="ach-sparkle">✦</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
