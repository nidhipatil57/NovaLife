import { useScrollAnimation } from '../../hooks/useAnimations';
import './RevolutionarySection.css';

const features = [
  {
    icon: '🧬',
    title: 'Life Digital Twin',
    desc: 'NovaLife learns your behavior and creates an AI model of you. It predicts missed deadlines, burnout risk, and productivity dips before they happen.',
    visual: 'twin',
    gradient: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
  },
  {
    icon: '🔮',
    title: 'Future Timeline',
    desc: 'See your potential outcomes. A visual timeline showing today, tomorrow, next week, and beyond with predicted results based on your current trajectory.',
    visual: 'timeline',
    gradient: 'linear-gradient(135deg, var(--accent-purple), var(--accent-pink))',
  },
  {
    icon: '🧠',
    title: 'Procrastination Detector',
    desc: 'Detects repeated postponement and inactivity. AI intervenes: "You\'re delaying this task. Let\'s do 15 minutes right now."',
    visual: 'procrastination',
    gradient: 'linear-gradient(135deg, var(--accent-orange), var(--accent-red))',
  },
  {
    icon: '💡',
    title: 'Brain Dump → Plan',
    desc: 'Write messy thoughts like "exam, laundry, project, interview." AI transforms chaos into organized tasks, priorities, and a complete schedule.',
    visual: 'braindump',
    gradient: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-green))',
  },
  {
    icon: '⚡',
    title: 'Smart Energy Tracking',
    desc: 'Log your mood, sleep, and energy levels. AI schedules difficult tasks when your energy is highest for peak performance.',
    visual: 'energy',
    gradient: 'linear-gradient(135deg, var(--accent-green), var(--accent-blue))',
  },
];

function RevVisual({ type }: { type: string }) {
  if (type === 'twin') {
    return (
      <div className="rev-visual rev-twin">
        <div className="twin-prediction">
          <div className="twin-avatar">🧑</div>
          <div className="twin-arrow">→</div>
          <div className="twin-ai-avatar">🤖</div>
        </div>
        <div className="twin-alert">⚠️ "Future You is likely to miss this assignment."</div>
      </div>
    );
  }
  if (type === 'timeline') {
    return (
      <div className="rev-visual rev-timeline">
        {['Today', 'Tomorrow', 'Next Week'].map((label, i) => (
          <div key={i} className="timeline-node" style={{ '--idx': i } as React.CSSProperties}>
            <div className="timeline-dot"></div>
            <span>{label}</span>
          </div>
        ))}
        <div className="timeline-line"></div>
      </div>
    );
  }
  if (type === 'braindump') {
    return (
      <div className="rev-visual rev-braindump">
        <div className="braindump-input">"exam, laundry, project..."</div>
        <div className="braindump-arrow">✨ →</div>
        <div className="braindump-output">
          <span>📚 Exam Prep</span>
          <span>👔 Interview</span>
          <span>🧺 Laundry</span>
        </div>
      </div>
    );
  }
  if (type === 'energy') {
    return (
      <div className="rev-visual rev-energy">
        {[40, 65, 90, 75, 55, 85, 70].map((val, i) => (
          <div key={i} className="energy-bar" style={{ height: `${val}%`, animationDelay: `${i * 0.1}s` }}>
            <div className="energy-fill"></div>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function RevolutionarySection() {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <section className="section rev-section" id="revolutionary" ref={ref}>
      <div className="container">
        <div className={`scroll-animate ${isVisible ? 'visible' : ''}`}>
          <div className="section-badge">🌟 Revolutionary</div>
          <h2 className="section-title">
            Features That Make Judges Say <span className="gradient-text-aurora">"Wow"</span>
          </h2>
          <p className="section-subtitle">
            These aren't just features — they're breakthroughs in personal productivity AI.
          </p>
        </div>

        <div className="rev-grid">
          {features.map((f, i) => (
            <div
              key={i}
              className={`rev-card glass-card scroll-animate stagger-${i + 1} ${isVisible ? 'visible' : ''}`}
            >
              <div className="rev-gradient-bar" style={{ background: f.gradient }}></div>
              <div className="rev-content">
                <span className="rev-icon">{f.icon}</span>
                <h3 className="rev-title">{f.title}</h3>
                <p className="rev-desc">{f.desc}</p>
                <RevVisual type={f.visual} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
