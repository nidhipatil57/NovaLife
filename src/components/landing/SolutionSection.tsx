import { useScrollAnimation } from '../../hooks/useAnimations';
import './SolutionSection.css';

const steps = [
  { icon: '📥', title: 'Task Added', desc: 'Add tasks via text, voice, or brain dump', color: 'var(--accent-blue)' },
  { icon: '🧠', title: 'AI Analysis', desc: 'NovaLife understands context and urgency', color: 'var(--accent-purple)' },
  { icon: '📊', title: 'Priority Score', desc: 'Smart ranking based on 6+ factors', color: 'var(--accent-cyan)' },
  { icon: '📅', title: 'Schedule Creation', desc: 'Auto-generated optimized schedule', color: 'var(--accent-pink)' },
  { icon: '🎯', title: 'Execution Guidance', desc: 'Step-by-step help to get things done', color: 'var(--accent-orange)' },
  { icon: '✅', title: 'Success', desc: 'Goals achieved, deadlines met', color: 'var(--accent-green)' },
];

export default function SolutionSection() {
  const { ref, isVisible } = useScrollAnimation(0.15);

  return (
    <section className="section solution-section" id="solution" ref={ref}>
      <div className="container">
        <div className={`scroll-animate ${isVisible ? 'visible' : ''}`}>
          <div className="section-badge">✨ The Solution</div>
          <h2 className="section-title">
            Meet Your AI <span className="gradient-text">Life Manager</span>
          </h2>
          <p className="section-subtitle">
            From chaos to clarity in 6 intelligent steps. NovaLife doesn't just organize — it executes.
          </p>
        </div>

        <div className="solution-flow">
          {steps.map((step, i) => (
            <div key={i} className={`solution-step scroll-animate stagger-${i + 1} ${isVisible ? 'visible' : ''}`}>
              <div className="step-node" style={{ '--step-color': step.color } as React.CSSProperties}>
                <div className="step-icon-wrapper">
                  <span className="step-icon">{step.icon}</span>
                  <span className="step-number">{i + 1}</span>
                </div>
                {i < steps.length - 1 && <div className="step-connector"></div>}
              </div>
              <div className="step-content">
                <h4 className="step-title">{step.title}</h4>
                <p className="step-desc">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
