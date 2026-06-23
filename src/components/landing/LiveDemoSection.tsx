import { useState, useEffect, useRef } from 'react';
import { useScrollAnimation } from '../../hooks/useAnimations';
import './LiveDemoSection.css';

export default function LiveDemoSection({ forceVisible = false }: { forceVisible?: boolean }) {
  const { ref, isVisible: scrollVisible } = useScrollAnimation(0.3);
  const isVisible = forceVisible || scrollVisible;

  // Active Tab: assistant, command, goals, rescue
  const [activeTab, setActiveTab] = useState<'assistant' | 'command' | 'goals' | 'rescue'>('assistant');

  // ─── AI Assistant Tab State ───
  const [stage, setStage] = useState(0);
  const [aiText, setAiText] = useState('');
  const hasAnimated = useRef(false);
  const aiResponse = "Based on urgency analysis, Assignment 2 is most critical (due tomorrow). I've reorganized your schedule and blocked 3 focused study sessions. Your meeting is protected.";

  useEffect(() => {
    if (!isVisible || hasAnimated.current || activeTab !== 'assistant') return;
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
  }, [isVisible, activeTab]);

  // ─── AI Command Center Tab State ───
  const [commandInput, setCommandInput] = useState('Study Physics, clean my room, prepare for interview');
  const [generatedSubtasks, setGeneratedSubtasks] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateSubtasks = () => {
    setIsGenerating(true);
    setGeneratedSubtasks([]);
    setTimeout(() => {
      setGeneratedSubtasks([
        { text: 'Physics Chapter 5: Reading & Notes', time: '45m', priority: 'High', done: false },
        { text: 'Solve practice homework problems', time: '30m', priority: 'High', done: false },
        { text: 'Review interview questions', time: '30m', priority: 'Medium', done: false },
        { text: 'Tidy room & study desk', time: '15m', priority: 'Routine', done: false },
      ]);
      setIsGenerating(false);
    }, 1000);
  };

  const toggleSubtask = (idx: number) => {
    setGeneratedSubtasks(prev =>
      prev.map((t, i) => (i === idx ? { ...t, done: !t.done } : t))
    );
  };

  // ─── Goal Tracking Tab State ───
  const [gymProgress, setGymProgress] = useState(60);
  const [gymStreak, setGymStreak] = useState(4);
  const [calcProgress, setCalcProgress] = useState(85);
  const [calcStreak, setCalcStreak] = useState(12);
  const [loggedToday, setLoggedToday] = useState(false);

  const handleLogProgress = () => {
    if (loggedToday) return;
    setGymProgress(prev => Math.min(prev + 10, 100));
    setGymStreak(prev => prev + 1);
    setCalcProgress(prev => Math.min(prev + 5, 100));
    setCalcStreak(prev => prev + 1);
    setLoggedToday(true);
  };

  // ─── Deadline Rescue Tab State ───
  const [rescueActive, setRescueActive] = useState(false);
  const [rescueStage, setRescueStage] = useState(0);

  const handleActivateRescue = () => {
    setRescueActive(true);
    setRescueStage(1);
    setTimeout(() => setRescueStage(2), 1000);
    setTimeout(() => setRescueStage(3), 2000);
    setTimeout(() => setRescueStage(4), 3000);
  };

  const handleResetRescue = () => {
    setRescueActive(false);
    setRescueStage(0);
  };

  return (
    <div className="live-demo" id="demo" ref={ref}>
      <div className={`demo-modal-header-text ${isVisible ? 'visible' : ''}`}>
        <div className="demo-modal-badge">✨ Interactive Demo</div>
        <h3 className="demo-modal-title">
          Watch NovaLife <span className="gradient-text">Think</span>
        </h3>
        <p className="demo-modal-subtitle">
          Select a feature below to test how NovaLife simplifies your daily workflow.
        </p>
      </div>

      {/* Tab Buttons */}
      <div className="demo-tabs">
        <button
          className={`demo-tab-btn ${activeTab === 'assistant' ? 'active' : ''}`}
          onClick={() => setActiveTab('assistant')}
        >
          🧠 AI Assistant
        </button>
        <button
          className={`demo-tab-btn ${activeTab === 'command' ? 'active' : ''}`}
          onClick={() => setActiveTab('command')}
        >
          ⚡ AI Task Command Centre
        </button>
        <button
          className={`demo-tab-btn ${activeTab === 'goals' ? 'active' : ''}`}
          onClick={() => setActiveTab('goals')}
        >
          🎯 Goal Tracking System
        </button>
        <button
          className={`demo-tab-btn ${activeTab === 'rescue' ? 'active' : ''}`}
          onClick={() => setActiveTab('rescue')}
        >
          🚨 Deadline Rescue Mode
        </button>
      </div>

      <div className="demo-container glass-card-static">
          {/* Demo Header */}
          <div className="demo-header">
            <div className="demo-dots">
              <span style={{ background: '#EF4444' }}></span>
              <span style={{ background: '#F59E0B' }}></span>
              <span style={{ background: '#10B981' }}></span>
            </div>
            <span className="demo-title">
              {activeTab === 'assistant' && 'NovaLife AI Assistant'}
              {activeTab === 'command' && 'AI Task Command Centre'}
              {activeTab === 'goals' && 'Goal Tracking System'}
              {activeTab === 'rescue' && 'Deadline Rescue Mode'}
            </span>
            <div className="demo-status">
              <span className="demo-status-dot"></span>
              Demo Mode
            </div>
          </div>

          {/* Tab Contents */}
          <div className="demo-body">
            {/* 1. AI Assistant Tab */}
            {activeTab === 'assistant' && (
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

                {/* Schedule cards */}
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
            )}

            {/* 2. AI Command Center Tab */}
            {activeTab === 'command' && (
              <div className="demo-command-center">
                <p className="demo-instruction-text">
                  Write down a list of messy tasks, thoughts, or reminders. The AI will break them into actionable subtasks.
                </p>
                <div className="command-input-row">
                  <input
                    type="text"
                    className="demo-text-input"
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    placeholder="Enter messy tasks..."
                  />
                  <button
                    className="btn-primary demo-action-btn"
                    onClick={handleGenerateSubtasks}
                    disabled={isGenerating}
                  >
                    {isGenerating ? 'Analyzing...' : 'Generate Subtasks'}
                  </button>
                </div>

                {isGenerating && (
                  <div className="demo-loader">
                    <div className="thinking-dots">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                )}

                {generatedSubtasks.length > 0 && (
                  <div className="subtask-list animate-fade-up">
                    <div className="subtask-list-title">📋 Generated Subtask Breakdown:</div>
                    {generatedSubtasks.map((task, idx) => (
                      <div
                        key={idx}
                        className={`subtask-item ${task.done ? 'done' : ''}`}
                        onClick={() => toggleSubtask(idx)}
                      >
                        <div className="subtask-checkbox">
                          {task.done ? '✓' : ''}
                        </div>
                        <div className="subtask-text-wrap">
                          <span className="subtask-title-text">{task.text}</span>
                          <span className="subtask-duration">⏱️ {task.time}</span>
                        </div>
                        <span className={`subtask-priority-badge ${task.priority.toLowerCase()}`}>
                          {task.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. Goal Tracking Tab */}
            {activeTab === 'goals' && (
              <div className="demo-goals-section">
                <p className="demo-instruction-text">
                  Track progress, milestones, and streaks for your long-term goals. Click Log Progress to simulate daily completion.
                </p>

                <div className="goals-demo-cards">
                  <div className="goal-demo-card">
                    <div className="goal-card-header">
                      <span className="goal-demo-icon">🏋️</span>
                      <span className="goal-demo-title">Fitness — 3x Workout/Week</span>
                      <span className="goal-demo-streak">🔥 {gymStreak} Day Streak</span>
                    </div>
                    <div className="goal-progress-bar-wrapper">
                      <div className="goal-progress-bar" style={{ width: `${gymProgress}%` }}></div>
                    </div>
                    <div className="goal-progress-meta">
                      <span>Progress: {gymProgress}%</span>
                      <span>Next milestone: 5 day streak</span>
                    </div>
                  </div>

                  <div className="goal-demo-card">
                    <div className="goal-card-header">
                      <span className="goal-demo-icon">📚</span>
                      <span className="goal-demo-title">Study — Master Calculus</span>
                      <span className="goal-demo-streak">🔥 {calcStreak} Day Streak</span>
                    </div>
                    <div className="goal-progress-bar-wrapper">
                      <div className="goal-progress-bar" style={{ width: `${calcProgress}%`, background: 'var(--accent-purple)' }}></div>
                    </div>
                    <div className="goal-progress-meta">
                      <span>Progress: {calcProgress}%</span>
                      <span>Next milestone: Exam prep complete</span>
                    </div>
                  </div>
                </div>

                <div className="goal-actions-row">
                  <button
                    className="btn-primary demo-action-btn"
                    onClick={handleLogProgress}
                    disabled={loggedToday}
                  >
                    {loggedToday ? '✓ Progress Logged Today' : 'Log Today\'s Progress'}
                  </button>
                  {loggedToday && (
                    <p className="goal-success-message animate-fade-up">
                      🎯 Milestones updated! Streaks advanced. Great work!
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 4. Deadline Rescue Tab */}
            {activeTab === 'rescue' && (
              <div className="demo-rescue-section">
                {!rescueActive ? (
                  <div className="rescue-inactive-state animate-fade-up">
                    <div className="rescue-risk-alert">
                      <span className="rescue-risk-alert-icon">⚠️</span>
                      <div>
                        <div className="rescue-risk-title">Deadline Risk Detected</div>
                        <div className="rescue-risk-subtitle">2 Calculus assignments due tomorrow. Current stress: 92%.</div>
                      </div>
                    </div>
                    <button className="btn-primary btn-lg rescue-activate-btn" onClick={handleActivateRescue}>
                      Activate Deadline Rescue Mode 🚨
                    </button>
                  </div>
                ) : (
                  <div className="rescue-active-state animate-fade-up">
                    <div className="rescue-steps-list">
                      <div className={`rescue-step-item ${rescueStage >= 1 ? 'active' : ''}`}>
                        <span className="rescue-step-icon">{rescueStage >= 1 ? '✓' : '🔄'}</span>
                        <span>Analyzing urgency and building custom action sprint...</span>
                      </div>
                      <div className={`rescue-step-item ${rescueStage >= 2 ? 'active' : ''}`}>
                        <span className="rescue-step-icon">{rescueStage >= 2 ? '✓' : '⏳'}</span>
                        <span>Blocking distracting social media notifications...</span>
                      </div>
                      <div className={`rescue-step-item ${rescueStage >= 3 ? 'active' : ''}`}>
                        <span className="rescue-step-icon">{rescueStage >= 3 ? '✓' : '⏳'}</span>
                        <span>Postponing non-critical tasks and meetings...</span>
                      </div>
                      <div className={`rescue-step-item ${rescueStage >= 4 ? 'active' : ''}`}>
                        <span className="rescue-step-icon">{rescueStage >= 4 ? '🎉' : '⏳'}</span>
                        <span>2-Hour Calculus Focus Sprint blocked! Stress reduced to 42%.</span>
                      </div>
                    </div>

                    {rescueStage >= 4 && (
                      <div className="rescue-completion-card animate-fade-up">
                        <div className="rescue-completion-header">
                          🛡️ Focus Mode Shield Active
                        </div>
                        <p>Calculus study session starts in 5 minutes. Distractions disabled.</p>
                        <button className="btn-secondary demo-action-btn" onClick={handleResetRescue}>
                          Reset Demo
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
  );
}
