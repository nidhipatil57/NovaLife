import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './HeroSection.css';

export default function HeroSection({ onWatchDemoClick }: { onWatchDemoClick?: () => void }) {
  const orbRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="hero" id="hero">
      {/* Aurora Background */}
      <div className="hero-aurora">
        <div className="aurora-blob aurora-1"></div>
        <div className="aurora-blob aurora-2"></div>
        <div className="aurora-blob aurora-3"></div>
      </div>

      {/* Star Field */}
      <div className="hero-stars">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${6 + Math.random() * 6}s`,
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
            }}
          />
        ))}
      </div>

      <div className="hero-content container">
        {/* Left Side */}
        <div className="hero-left animate-fade-up">


          <h1 className="hero-title">
            Meet <span className="gradient-text-aurora">NovaLife</span>
          </h1>

          <p className="hero-subtitle">
            An AI productivity companion that doesn't just remind — it actively plans, prioritizes, and helps users execute before deadlines are missed. A personal intelligence platform designed for students, professionals, and entrepreneurs.
          </p>

          <div className="hero-cta">
            <Link to="/signup" className="btn-primary hero-btn-primary">
              <span>Start Free</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
            <button onClick={onWatchDemoClick} className="btn-secondary hero-btn-secondary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <span>Watch Demo</span>
            </button>
          </div>

          <div className="hero-badges">
            <div className="badge-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              AI Powered
            </div>
            <div className="badge-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Calendar Sync
            </div>
            <div className="badge-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Smart Planning
            </div>
            <div className="badge-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Goal Tracking
            </div>
          </div>
        </div>

        {/* Right Side — 3D AI Orb */}
        <div className="hero-right">
          <div
            className="orb-container"
            ref={orbRef}
            style={{
              transform: `translate(${mousePos.x * 4}px, ${mousePos.y * 4}px)`,
            }}
          >
            <div className="orb">
              <div className="orb-inner"></div>
              <div className="orb-ring orb-ring-1"></div>
              <div className="orb-ring orb-ring-2"></div>
              <div className="orb-ring orb-ring-3"></div>
              <div className="orb-glow"></div>
            </div>

            {/* Floating particles around orb */}
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="orb-particle"
                style={{
                  '--angle': `${(i * 30)}deg`,
                  '--delay': `${i * 0.3}s`,
                  '--distance': `${120 + Math.random() * 60}px`,
                  '--size': `${3 + Math.random() * 4}px`,
                } as React.CSSProperties}
              />
            ))}
          </div>

          {/* Floating info cards around the orb */}
          <div className="hero-float-card float-card-1 glass-card-static">
            <div className="float-card-icon" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>🧠</div>
            <div>
              <div className="float-card-label">AI Analysis</div>
              <div className="float-card-value gradient-text">Active</div>
            </div>
          </div>
          <div className="hero-float-card float-card-2 glass-card-static">
            <div className="float-card-icon" style={{ background: 'rgba(16, 185, 129, 0.2)' }}>📊</div>
            <div>
              <div className="float-card-label">Productivity</div>
              <div className="float-card-value" style={{ color: 'var(--accent-green)' }}>94%</div>
            </div>
          </div>
          <div className="hero-float-card float-card-3 glass-card-static">
            <div className="float-card-icon" style={{ background: 'rgba(139, 92, 246, 0.2)' }}>🎯</div>
            <div>
              <div className="float-card-label">Goals Met</div>
              <div className="float-card-value" style={{ color: 'var(--accent-purple-light)' }}>12/14</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="hero-scroll">
        <div className="scroll-line"></div>
        <span>Scroll to explore</span>
      </div>
    </section>
  );
}
