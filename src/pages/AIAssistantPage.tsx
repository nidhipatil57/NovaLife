import { useState, useRef, useEffect } from 'react';
import './AIAssistantPage.css';

const suggestions = ['Plan my week', 'Schedule my exams', 'Analyze my productivity', 'Help me study for physics', 'What should I do next?', 'Create a workout plan'];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([
    { role: 'ai', text: "Hi Nidhi! 👋 I'm your AI Life Assistant. I can help you plan, schedule, analyze productivity, and more. What would you like to do today?" },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const aiResponses: Record<string, string> = {
    'plan my week': "📅 Here's your optimized week plan:\n\n**Monday**\n• 9-11 AM: Physics Assignment (critical)\n• 2-4 PM: Deep Work Block\n• 7 PM: Gym\n\n**Tuesday**\n• 10-12 PM: Math Test Prep\n• 3-4 PM: Team Meeting\n• 5-6 PM: Reading\n\n**Wednesday**\n• 9-12 PM: Project Presentation Prep\n• 2 PM: Presentation\n• 4-6 PM: Chapter Revision\n\n**Thursday-Friday**\n• Exam prep intensive\n• Mock tests\n\n✅ I've prioritized based on deadlines and your energy patterns. Want me to sync this to your calendar?",
    'schedule my exams': "🎓 Exam Schedule Optimizer:\n\nI've analyzed your syllabus and created an optimal study plan:\n\n📚 **Physics** (Priority: Critical)\n• 3 days intensive revision\n• Focus on Chapters 5, 8, 12\n• Schedule: Mon/Wed/Fri 9-12 AM\n\n📐 **Math** (Priority: High)\n• 2 days problem practice\n• Focus on Integration & Matrices\n• Schedule: Tue/Thu 10-1 PM\n\n🧪 **Chemistry** (Priority: Medium)\n• 2 days lab + theory\n• Focus on Organic reactions\n• Schedule: Sat/Sun mornings\n\n⏰ Total Study Hours: 42h over 2 weeks\n🎯 Predicted Score: 85-92%\n\nWant me to create a detailed daily schedule?",
    'analyze my productivity': "📊 **Productivity Analysis — Last 7 Days**\n\n✅ Tasks Completed: 59 (↑12%)\n⏱️ Focus Time: 29.1h (↑8%)\n📈 Avg Score: 82/100\n🔥 Streak: 8 days\n\n**Insights:**\n\n1️⃣ **Peak Performance**: Tuesdays & Thursdays (score 91-95)\n2️⃣ **Focus Window**: 2-4 PM is your golden hour\n3️⃣ **Weakness**: After 6 PM, productivity drops 40%\n4️⃣ **Improvement**: Meditation habit increased focus by 15%\n\n**Recommendations:**\n• Schedule hardest tasks between 2-4 PM\n• Take a power nap at 3:30 PM on low-energy days\n• Consider blocking social media after 8 PM\n\nWant a detailed breakdown?",
    'help me study': "📚 **Study Sprint Activated!**\n\nI'll create an optimal study session for you:\n\n🎯 **Technique: Active Recall + Spaced Repetition**\n\n**Session Plan:**\n1. 📖 25 min — Read Chapter 5 (Active Notes)\n2. ☕ 5 min — Break\n3. 📝 25 min — Practice Problems\n4. ☕ 5 min — Break\n5. 🧠 25 min — Self-Quiz & Review\n6. 🎉 15 min — Reward Break\n\n**Tips:**\n• Close all distractions (I've activated your website blocker)\n• Use the Feynman Technique: Explain concepts out loud\n• Highlight key formulas for quick review\n\nReady to start? I'll launch a Focus Session for you! 🚀",
    'what should i do next': "Based on your schedule and priorities:\n\n🔴 **#1 Priority: Physics Assignment**\n• Due: Today 11:59 PM\n• Risk Level: 90%\n• Time needed: ~2 hours\n• Best slot: RIGHT NOW (2-4 PM is your peak)\n\nI recommend starting immediately. Here's why:\n• Your focus levels are highest right now\n• The assignment covers Chapter 5 — your strongest topic\n• Completing it removes your biggest stressor\n\n💡 **Pro tip**: Break it into 3 sprints:\n1. Problems 1-5 (25 min)\n2. Problems 6-10 (25 min)\n3. Lab Report (30 min)\n\nWant me to start a Focus Session?",
    'create a workout plan': "🏋️ **Personalized Workout Plan**\n\nBased on your goal (Lose 10kg) and schedule:\n\n**Monday — Upper Body**\n• Push-ups: 3×15\n• Dumbbell Press: 3×12\n• Plank: 3×45s\n\n**Wednesday — Lower Body**\n• Squats: 4×15\n• Lunges: 3×12\n• Calf Raises: 3×20\n\n**Friday — Cardio + Core**\n• Running: 30 min\n• Mountain Climbers: 3×20\n• Bicycle Crunches: 3×20\n\n**Nutrition Tips:**\n• Protein within 30 min post-workout\n• Stay hydrated (8 glasses/day)\n• Sleep 7-8 hours for recovery\n\n📊 At this pace: -10kg in ~3 months\n\nAdded to your habit tracker! 🎯",
  };

  const sendMessage = (text?: string) => {
    const msg = text || input;
    if (!msg.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const key = Object.keys(aiResponses).find(k => msg.toLowerCase().includes(k));
      setMessages(prev => [...prev, {
        role: 'ai',
        text: key ? aiResponses[key] : "I'd be happy to help with that! I can:\n\n• 📅 Plan your schedule\n• 📊 Analyze productivity\n• 📚 Create study plans\n• 🏋️ Design workout routines\n• 🎯 Set and track goals\n• 🧠 Process brain dumps\n\nTry asking me something specific!"
      }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="ai-assistant-page">
      <div className="ai-chat-container">
        {/* Chat Messages */}
        <div className="ai-messages-area">
          {messages.map((msg, i) => (
            <div key={i} className={`ai-msg ${msg.role}`}>
              {msg.role === 'ai' && (
                <div className="ai-msg-avatar">
                  <div className="ai-avatar-inner" style={{ width: 28, height: 28 }}></div>
                </div>
              )}
              <div className="ai-msg-content">
                <div className="ai-msg-bubble">
                  <p>{msg.text}</p>
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="ai-msg ai">
              <div className="ai-msg-avatar">
                <div className="ai-avatar-inner" style={{ width: 28, height: 28 }}></div>
              </div>
              <div className="ai-msg-content">
                <div className="ai-msg-bubble typing">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        <div className="ai-suggestions-bar">
          {suggestions.map((s, i) => (
            <button key={i} className="ai-suggestion-chip" onClick={() => sendMessage(s)}>
              {s}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="ai-input-bar">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Ask your AI Life Assistant anything..."
          />
          <button className="ai-send-btn" onClick={() => sendMessage()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
