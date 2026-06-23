import { useState, useEffect, useRef } from 'react';
import { useScrollAnimation } from '../../hooks/useAnimations';
import './LiveDemoSection.css';

export default function LiveDemoSection() {
  const { ref, isVisible } = useScrollAnimation(0.3);
  const [stage, setStage] = useState(0);
  const [aiText, setAiText] = useState('');
  const hasAnimated = useRef(false);

  const aiResponse = "Based on urgency analysis, Assignment 2 is most critical (due tomorrow). I've reorganized your schedule and blocked 3 focused study sessions. Your meeting is protected.";

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return;
    hasAnimated.current = true;

    // Stage 0: Show user message typing
    setTimeout(() => setStage(1), 500);
    // Stage 1: Show user message
    setTimeout(() => setStage(2), 1500);
    // Stage 2: Show AI thinking
    setTimeout(() => setStage(3), 3000);
    // Stage 3: Type out AI response
    setTimeout(() => {
      setStage(4);
      let idx = 0;
      const interval = setInterval(() => {
        if (idx < aiResponse.length) {
          setAiText(aiResponse.slice(0, idx + 1));
          idx++;
        } else {
          clearInterval(interval);
          setTimeout(() => setStage(5), 500);
        }
      }, 20);
    }, 4000);
  }, [isVisible]);

  return (
    <section className="section live-demo" id="demo" ref={ref}>
      <div className={`container scroll-animate ${isVisible ? 'visible' : ''}`}>
        <div className="section-badge">✨ See It In Action</div>
        <h2 className="section-title">
          Watch NovaLife <span className="gradient-text">Think</span>
        </h2>
        <p className="section-subtitle">
          See how NovaLife instantly analyzes your commitments and creates an optimized plan.
        </p>

        <div className="demo-container glass-card-static">
          {/* Demo Header */}
          <div className="demo-header">
            <div className="demo-dots">
              <span style={{ background: '#EF4444' }}></span>
              <span style={{ background: '#F59E0B' }}></span>
              <span style={{ background: '#10B981' }}></span>
            </div>
            <span className="demo-title">NovaLife AI Assistant</span>
            <div className="demo-status">
              <span className="demo-status-dot"></span>
              Online
            </div>
          </div>

          {/* Chat Area */}
          <div className="demo-chat">
            {/* User Message */}
            {stage >= 1 && (
              <div className="demo-message user-message animate-fade-up">
                <div className="message-avatar user-avatar">N</div>
                <div className="message-bubble user-bubble">
                  <p>I have 3 assignments, a test tomorrow and a meeting at 4pm.</p>
                </div>
              </div>
            )}

            {/* AI Thinking */}
            {(stage === 2 || stage === 3) && (
              <div className="demo-message ai-message animate-fade-up">
                <div className="message-avatar ai-avatar">
                  <div className="ai-avatar-inner"></div>
                </div>
                <div className="message-bubble ai-bubble">
                  <div className="thinking-dots">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}

            {/* AI Response */}
            {stage >= 4 && (
              <div className="demo-message ai-message animate-fade-up">
                <div className="message-avatar ai-avatar">
                  <div className="ai-avatar-inner"></div>
                </div>
                <div className="message-bubble ai-bubble">
                  <p>{aiText}<span className={`typing-cursor ${stage === 5 ? 'hidden' : ''}`}>|</span></p>
                </div>
              </div>
            )}

            {/* Schedule cards appear after AI response */}
            {stage >= 5 && (
              <div className="demo-schedule animate-fade-up">
                <div className="schedule-card">
                  <div className="schedule-time">2:00 PM</div>
                  <div className="schedule-task">
                    <span className="schedule-priority urgent">URGENT</span>
                    Assignment 2 — Physics
                  </div>
                  <div className="schedule-bar" style={{ '--width': '98%' } as React.CSSProperties}></div>
                </div>
                <div className="schedule-card">
                  <div className="schedule-time">4:00 PM</div>
                  <div className="schedule-task">
                    <span className="schedule-priority meeting">PROTECTED</span>
                    Team Meeting
                  </div>
                  <div className="schedule-bar" style={{ '--width': '60%' } as React.CSSProperties}></div>
                </div>
                <div className="schedule-card">
                  <div className="schedule-time">5:30 PM</div>
                  <div className="schedule-task">
                    <span className="schedule-priority study">STUDY</span>
                    Test Prep — Block 1
                  </div>
                  <div className="schedule-bar" style={{ '--width': '85%' } as React.CSSProperties}></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
