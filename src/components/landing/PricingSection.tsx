import { useScrollAnimation } from '../../hooks/useAnimations';
import { Link } from 'react-router-dom';
import './PricingSection.css';

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'forever',
    desc: 'Perfect for getting started with AI productivity.',
    features: ['5 AI tasks/day', 'Basic priority scoring', 'Habit tracking', '1 calendar sync', 'Community access'],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$12',
    period: '/month',
    desc: 'Unlock the full power of your AI life manager.',
    features: ['Unlimited AI tasks', 'Deadline Rescue Mode', 'Smart Priority Engine', 'All calendar syncs', 'Focus Mode + Pomodoro', 'Voice Assistant', 'Advanced analytics', 'Goal tracking'],
    cta: 'Start Pro Trial',
    highlighted: true,
  },
  {
    name: 'Ultimate AI',
    price: '$29',
    period: '/month',
    desc: 'For power users who want the bleeding edge.',
    features: ['Everything in Pro', 'Life Digital Twin', 'Future Timeline', 'Procrastination Detector', 'Brain Dump → Plan', 'Energy Tracking', 'Priority support', 'API access', 'Team features'],
    cta: 'Go Ultimate',
    highlighted: false,
  },
];

export default function PricingSection() {
  const { ref, isVisible } = useScrollAnimation(0.15);

  return (
    <section className="section pricing-section" id="pricing" ref={ref}>
      <div className="container">
        <div className={`scroll-animate ${isVisible ? 'visible' : ''}`}>
          <div className="section-badge">💎 Pricing</div>
          <h2 className="section-title">
            Choose Your <span className="gradient-text">Plan</span>
          </h2>
          <p className="section-subtitle">
            Start free. Upgrade when you're ready to unlock your full potential.
          </p>
        </div>

        <div className="pricing-grid">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`pricing-card glass-card scroll-animate stagger-${i + 1} ${plan.highlighted ? 'pricing-highlighted' : ''} ${isVisible ? 'visible' : ''}`}
            >
              {plan.highlighted && <div className="pricing-popular">Most Popular</div>}
              <div className="pricing-header">
                <h3 className="pricing-name">{plan.name}</h3>
                <div className="pricing-price">
                  <span className="price-amount">{plan.price}</span>
                  <span className="price-period">{plan.period}</span>
                </div>
                <p className="pricing-desc">{plan.desc}</p>
              </div>
              <ul className="pricing-features">
                {plan.features.map((f, j) => (
                  <li key={j}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                className={plan.highlighted ? 'btn-primary pricing-cta' : 'btn-secondary pricing-cta'}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
