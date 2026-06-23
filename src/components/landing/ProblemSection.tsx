import { useScrollAnimation } from '../../hooks/useAnimations';
import './ProblemSection.css';

const problems = [
  {
    icon: '📝',
    title: 'Endless To-Do Lists',
    description: 'You keep adding tasks but never actually complete them. The list grows longer every day.',
    color: 'var(--accent-red)',
  },
  {
    icon: '🔕',
    title: 'Ignored Notifications',
    description: 'Another reminder dismissed. Notifications become noise when they don\'t help you take action.',
    color: 'var(--accent-orange)',
  },
  {
    icon: '🧭',
    title: 'No Real Guidance',
    description: 'Apps tell you WHAT to do but never HOW or WHEN. You\'re left figuring out priorities alone.',
    color: 'var(--accent-purple)',
  },
  {
    icon: '🔥',
    title: 'Deadline Panic',
    description: 'The night-before scramble. Last-minute stress because nothing warned you early enough.',
    color: 'var(--accent-pink)',
  },
];

export default function ProblemSection() {
  const { ref, isVisible } = useScrollAnimation(0.2);

  return (
    <section className="section problem-section" id="problem" ref={ref}>
      <div className="container">
        <div className={`scroll-animate ${isVisible ? 'visible' : ''}`}>
          <div className="section-badge">🚫 The Problem</div>
          <h2 className="section-title">
            Why Most Productivity Apps <span className="gradient-text">Fail</span>
          </h2>
          <p className="section-subtitle">
            Traditional tools create more work instead of reducing it. Sound familiar?
          </p>
        </div>

        <div className="problem-grid">
          {problems.map((problem, i) => (
            <div
              key={i}
              className={`problem-card glass-card scroll-animate stagger-${i + 1} ${isVisible ? 'visible' : ''}`}
              style={{ '--accent': problem.color } as React.CSSProperties}
            >
              <div className="problem-icon-wrapper">
                <span className="problem-x">✕</span>
                <span className="problem-icon">{problem.icon}</span>
              </div>
              <h3 className="problem-title">{problem.title}</h3>
              <p className="problem-desc">{problem.description}</p>
              <div className="problem-glow"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
