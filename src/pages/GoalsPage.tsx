import { useState, useEffect, useRef } from 'react';
import { useGoals } from '../hooks/useGoals';
import type { Goal } from '../hooks/useGoals';
import { CustomSelect } from '../components/ui/CustomSelect';
import { useDataContext } from '../context/DataContext';
import { streamGeminiContent } from '../utils/aiClient';
import './GoalsPage.css';

const categories = ['All', 'Academic', 'Career', 'Health', 'Finance', 'Personal'];

const colorsConfig = [
  { name: 'Blue', value: 'var(--accent-blue)' },
  { name: 'Green', value: 'var(--accent-green)' },
  { name: 'Purple', value: 'var(--accent-purple)' },
  { name: 'Cyan', value: 'var(--accent-cyan)' },
  { name: 'Orange', value: 'var(--accent-orange)' },
  { name: 'Pink', value: 'var(--accent-pink)' },
];

const categoryEmojis: { [key: string]: string } = {
  Academic: '🎓',
  Career: '💼',
  Health: '🏋️',
  Finance: '💰',
  Personal: '👤',
};

const CelebrationOverlay = ({ goal, onClose }: { goal: Goal, onClose: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      radius: number;
      alpha: number;
      decay: number;

      constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 4;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.color = color;
        this.radius = Math.random() * 3 + 2;
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.01;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.12; // gravity
        this.alpha -= this.decay;
      }

      draw(c: CanvasRenderingContext2D) {
        c.save();
        c.globalAlpha = this.alpha;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = this.color;
        c.fill();
        c.restore();
      }
    }

    const particles: Particle[] = [];
    const colors = ['#FFD700', '#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#33FFF3'];

    const spawnExplosion = (x: number, y: number) => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < 60; i++) {
        particles.push(new Particle(x, y, color));
      }
    };

    spawnExplosion(width * 0.25, height * 0.4);
    spawnExplosion(width * 0.75, height * 0.4);
    spawnExplosion(width * 0.5, height * 0.25);

    const interval = setInterval(() => {
      spawnExplosion(Math.random() * width, Math.random() * (height * 0.6));
    }, 450);

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        if (p.alpha <= 0) {
          particles.splice(i, 1);
        } else {
          p.draw(ctx);
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="celebration-overlay" style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(3, 7, 18, 0.85)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(10px)',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
      <div className="celebration-content" style={{
        textAlign: 'center',
        zIndex: 10,
        animation: 'celebratePop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        color: 'white',
        maxWidth: '480px',
        padding: '30px'
      }}>
        <div style={{ fontSize: '80px', marginBottom: '20px', animation: 'bounce 1s infinite' }}>🎉🏆✨</div>
        <h2 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 16px 0', background: 'linear-gradient(45deg, #FFD700, #FFA500, #FFD700)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Congratulations!
        </h2>
        <p style={{ fontSize: '18px', lineHeight: '1.6', color: 'var(--text-secondary)', margin: '0 0 24px 0' }}>
          You have successfully completed your goal:
          <br />
          <strong style={{ color: 'white', fontSize: '20px' }}>"{goal.name}"</strong>
        </p>
        <button 
          className="btn-primary" 
          onClick={onClose}
          style={{ padding: '12px 30px', background: 'linear-gradient(45deg, #FFD700, #FFA500)', border: 'none', color: '#070a12', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 0 20px rgba(255,215,0,0.4)' }}
        >
          Awesome!
        </button>
      </div>
    </div>
  );
};

const getGoalStats = (goal: Goal) => {
  let milestoneProgress = 100;
  const hasMilestones = goal.milestones && goal.milestones.length > 0;
  if (hasMilestones) {
    const completedCount = goal.milestones.filter(m => m.done).length;
    milestoneProgress = Math.round((completedCount / goal.milestones.length) * 100);
  }

  let calendarProgress = 100;
  const hasTargetDate = !!goal.completed_by;
  let totalDays = 0;
  let completedDaysCount = goal.completed_dates?.length || 0;

  if (hasTargetDate && goal.completed_by) {
    const start = goal.created_at ? new Date(goal.created_at) : new Date();
    const end = new Date(goal.completed_by);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const timeDiff = end.getTime() - start.getTime();
    totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    if (totalDays <= 0) totalDays = 1;

    // Get expected dates range
    const requiredDates = [];
    const curr = new Date(start);
    const target = new Date(end);
    if (!isNaN(curr.getTime()) && !isNaN(target.getTime()) && curr <= target) {
      let count = 0;
      while (curr <= target && count < 2000) {
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, '0');
        const d = String(curr.getDate()).padStart(2, '0');
        requiredDates.push(`${y}-${m}-${d}`);
        curr.setDate(curr.getDate() + 1);
        count++;
      }
    }

    if (requiredDates.length > 0) {
      const completedSet = new Set(goal.completed_dates || []);
      const completedRequiredCount = requiredDates.filter(dateStr => completedSet.has(dateStr)).length;
      calendarProgress = Math.round((completedRequiredCount / requiredDates.length) * 100);
    } else {
      calendarProgress = Math.min(100, Math.round((completedDaysCount / totalDays) * 100));
    }
  } else if (!hasMilestones) {
    const start = goal.created_at ? new Date(goal.created_at) : new Date();
    start.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const timeDiff = today.getTime() - start.getTime();
    let totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    if (totalDays <= 0) totalDays = 30;

    calendarProgress = Math.min(100, Math.round((completedDaysCount / totalDays) * 100));
  }

  let progress = 0;
  if (hasMilestones && hasTargetDate) {
    progress = Math.min(milestoneProgress, calendarProgress);
  } else if (hasMilestones) {
    progress = milestoneProgress;
  } else {
    progress = calendarProgress;
  }

  return {
    totalDays: hasTargetDate ? totalDays : 0,
    completedDaysCount: hasTargetDate ? completedDaysCount : 0,
    progress,
    avgProgress: progress
  };
};

const formatCompletedBy = (dateStr?: string) => {
  if (!dateStr) return 'No target date';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const [year, month, day] = parts;
  const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
  const monthName = dateObj.toLocaleString('default', { month: 'long' });
  
  return (
    <span className="completed-by-display" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <span>{monthName} {year}</span>
      <span style={{ color: 'var(--text-secondary)', marginLeft: '4px' }}>
        (
        <span style={{ textDecoration: 'underline', textDecorationThickness: '2px', marginRight: '4px' }}>{day}</span>
        <span style={{ textDecoration: 'underline', textDecorationThickness: '2px', marginRight: '4px' }}>{month}</span>
        <span style={{ textDecoration: 'underline', textDecorationThickness: '2px' }}>{year}</span>
        )
      </span>
    </span>
  );
};

const calculateStreak = (completedDates: string[]): number => {
  if (!completedDates || completedDates.length === 0) return 0;
  
  const datesSet = new Set(completedDates);
  let streak = 0;
  let checkDate = new Date(); // Start with today in local time
  
  const formatDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  let todayStr = formatDateStr(checkDate);
  
  if (datesSet.has(todayStr)) {
    while (datesSet.has(todayStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
      todayStr = formatDateStr(checkDate);
    }
  } else {
    checkDate.setDate(checkDate.getDate() - 1);
    let yesterdayStr = formatDateStr(checkDate);
    if (datesSet.has(yesterdayStr)) {
      while (datesSet.has(yesterdayStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
        yesterdayStr = formatDateStr(checkDate);
      }
    }
  }
  
  return streak;
};

const renderMarkdown = (text: string) => {
  return text.split('\n').map((line, i) => {
    const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*');
    let lineContent = line;
    if (isBullet) {
      lineContent = line.replace(/^[•\-*]\s*/, '');
    }

    const renderedContent: React.ReactNode[] = [];
    const boldRegex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(lineContent)) !== null) {
      if (match.index > lastIndex) {
        renderedContent.push(lineContent.substring(lastIndex, match.index));
      }
      renderedContent.push(<strong key={match.index}>{match[1]}</strong>);
      lastIndex = boldRegex.lastIndex;
    }
    if (lastIndex < lineContent.length) {
      renderedContent.push(lineContent.substring(lastIndex));
    }

    return (
      <div key={i} style={{ 
        marginBottom: isBullet ? '4px' : '8px', 
        paddingLeft: isBullet ? '16px' : '0',
        position: 'relative'
      }}>
        {isBullet && <span style={{ position: 'absolute', left: '4px', color: 'var(--accent-blue-light)' }}>•</span>}
        {renderedContent}
      </div>
    );
  });
};

export default function GoalsPage() {
  const { goals, loading, addGoal, toggleMilestone, deleteGoal, updateGoal, user } = useGoals();
  const { focusSessions, tasks, habits } = useDataContext();

  // AI Tab States
  const [detailTab, setDetailTab] = useState<'calendar' | 'ai'>('calendar');
  const [goalAnalyses, setGoalAnalyses] = useState<{[key: string]: any}>({});
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [goalQuestions, setGoalQuestions] = useState<{[key: string]: Array<{q: string, a: string, loading?: boolean}>}>({});
  const [customQuestionInput, setCustomQuestionInput] = useState('');

  // AI Goal Coach States
  const [overallGoalAnalysis, setOverallGoalAnalysis] = useState<any>(null);
  const [loadingOverallAnalysis, setLoadingOverallAnalysis] = useState(false);

  useEffect(() => {
    if (goals.length > 0 && !overallGoalAnalysis && !loadingOverallAnalysis && !loading) {
      runOverallGoalAnalysis();
    }
  }, [goals.length, loading]);

  const runOverallGoalAnalysis = async () => {
    setLoadingOverallAnalysis(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error('API Key is not configured');

      const systemPrompt = `You are "Nova", an elite productivity and goals achievement coach. Analyze the user's goals:
${JSON.stringify(goals.map(g => ({ name: g.name, category: g.category, progress: g.progress, streak: g.streak || 0, milestoneCount: g.milestones?.length || 0, completedMilestonesCount: g.milestones?.filter(m => m.done).length || 0, completedBy: g.completed_by })))}

Provide an intelligent, tactical goals performance analysis.
You MUST respond with a JSON object matching this exact schema. Do not write any explanations outside the JSON object. Do not wrap the JSON in markdown code blocks.

{
  "focusArea": "Identify the primary category or goal needing immediate focus based on progress or deadlines",
  "milestoneVelocity": "Analyze the rate/status of milestone completion and how to speed it up",
  "timelineRisk": "Identify risk of missing deadlines (target dates) and suggest adjustments",
  "actionableTip": "Provide 1-2 custom steps to unblock progress on the lowest progress goal"
}
`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (!response.ok) throw new Error('Failed to get goal analysis');
      const data = await response.json();
      const parsed = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text.trim() || '{}');
      setOverallGoalAnalysis(parsed);
    } catch (err) {
      console.error('Goal analysis failed:', err);
      setOverallGoalAnalysis({
        error: true,
        focusArea: 'Prioritize goals with pending milestones.',
        milestoneVelocity: 'Break larger milestones down into bite-sized daily tasks.',
        timelineRisk: 'Set specific target dates to increase completion likelihood.',
        actionableTip: 'Review your lowest-progress goal and complete its first sub-milestone today.'
      });
    } finally {
      setLoadingOverallAnalysis(false);
    }
  };

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filter, setFilter] = useState<'all' | 'active' | 'ai-generated' | 'completed'>('all');

  const categoryOptions = categories
    .filter(c => c !== 'All')
    .map(c => ({
      label: c,
      value: c,
      icon: categoryEmojis[c] || '🎯'
    }));

  const colorOptions = colorsConfig.map(color => ({
    label: color.name,
    value: color.value,
    colorCircle: color.value
  }));
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Personal');
  const [newColor, setNewColor] = useState('var(--accent-blue)');
  const [newMilestonesInput, setNewMilestonesInput] = useState('');
  const [newCompletedBy, setNewCompletedBy] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [autoGenerateMilestones, setAutoGenerateMilestones] = useState(true);
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);

  // Calendar Detail Modal
  const [selectedGoalForDetail, setSelectedGoalForDetail] = useState<Goal | null>(null);
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [isEditingDetail, setIsEditingDetail] = useState(false);

  // Edit state variables used for inline editing inside details modal
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('Personal');
  const [editColor, setEditColor] = useState('var(--accent-blue)');
  const [editNotes, setEditNotes] = useState('');
  const [editCompletedBy, setEditCompletedBy] = useState('');
  const [editMilestonesInput, setEditMilestonesInput] = useState('');

  // Delete Modal
  const [goalToDelete, setGoalToDelete] = useState<{ id: string; name: string } | null>(null);

  // Multi-Select Goal States
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Celebration & Fade Away animations
  const [celebratingGoal, setCelebratingGoal] = useState<Goal | null>(null);
  const [fadeAwayGoalId, setFadeAwayGoalId] = useState<string | null>(null);
  // AI Goal Assistant useEffect and functions
  useEffect(() => {
    if (detailTab === 'ai' && selectedGoalForDetail && !goalAnalyses[selectedGoalForDetail.id] && !loadingAnalysis) {
      runGoalAnalysis(selectedGoalForDetail);
    }
  }, [detailTab, selectedGoalForDetail]);

  const runGoalAnalysis = async (goal: Goal) => {
    setLoadingAnalysis(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error('API key is not configured');

      const systemPrompt = `You are "Nova", an elite productivity coach. Analyze the following goal:
- Goal: "${goal.name}"
- Category: "${goal.category}"
- Completed By Date: "${goal.completed_by || 'Not specified'}"
- Current Progress: ${goal.progress}%
- Milestones: ${JSON.stringify(goal.milestones || [])}
- Notes: "${goal.notes || ''}"
- Current Streak: ${goal.streak || 0} days

Context of other goals: ${JSON.stringify(goals.filter(g => g.id !== goal.id).map(g => ({ name: g.name, category: g.category, progress: g.progress })))}
Context of tasks: ${JSON.stringify(tasks.slice(0, 10).map(t => ({ text: t.text, due: t.due, done: t.done })))}
Context of focus sessions: ${JSON.stringify(focusSessions.slice(0, 10).map(s => ({ name: s.name, duration: s.duration })))}

Provide an intelligent, structured evaluation of this goal.
You MUST respond with a JSON object exactly matching this schema. Do not write any explanations outside the JSON object. Do not wrap the JSON in markdown formatting.

{
  "completionProbability": "Percentage probability of completing before target date, e.g. 85%",
  "expectedCompletionDate": "Predicted realistic date, e.g. July 20, 2026",
  "remainingEffort": "Estimated hours of focused work remaining, e.g. 30 hours",
  "milestoneAnalysis": [
    {
      "milestone": "Name of existing milestone",
      "status": "On Track" | "At Risk" | "Not Started",
      "suggestions": ["suggested subtask 1", "suggested subtask 2"]
    }
  ],
  "recoveryRecommendations": "Specific, action-oriented coaching tips if progress is lagging or streak is broken",
  "relationships": "How completing this goal links/adds value to other active goals or career progression"
}
`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const parsed = JSON.parse(text.trim());
      
      setGoalAnalyses(prev => ({
        ...prev,
        [goal.id]: parsed
      }));
    } catch (err) {
      console.error('Goal analysis failed:', err);
      // Fallback object
      setGoalAnalyses(prev => ({
        ...prev,
        [goal.id]: {
          error: true,
          completionProbability: '70%',
          expectedCompletionDate: goal.completed_by || 'Soon',
          remainingEffort: '25 hours',
          milestoneAnalysis: (goal.milestones || []).map(m => ({
            milestone: m.text,
            status: m.done ? 'On Track' : 'Not Started',
            suggestions: ['Focus on consistent daily effort', 'Review progress weekly']
          })),
          recoveryRecommendations: 'Nova recommends dedicating at least 20 minutes a day to maintain your streak.',
          relationships: 'Completing this goal reinforces your overall productivity habit stack.'
        }
      }));
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleAskGoalQuestion = async (questionText: string) => {
    if (!selectedGoalForDetail || !questionText.trim()) return;

    const questionTextTrimmed = questionText.trim();
    const newEntry = { q: questionTextTrimmed, a: '', loading: true };
    
    setGoalQuestions(prev => {
      const existing = prev[selectedGoalForDetail.id] || [];
      return {
        ...prev,
        [selectedGoalForDetail.id]: [...existing, newEntry]
      };
    });
    setCustomQuestionInput('');

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error('API key is not configured');

      const systemPrompt = `You are "Nova", an elite productivity coach. Help the user with a question about their goal: "${selectedGoalForDetail.name}" (Category: ${selectedGoalForDetail.category}, Progress: ${selectedGoalForDetail.progress}%).
Here is their other context:
- Goals: ${JSON.stringify(goals.map(g => ({ name: g.name, progress: g.progress })))}
- Tasks: ${JSON.stringify(tasks.slice(0, 10).map(t => ({ text: t.text, done: t.done })))}
- Habits: ${JSON.stringify(habits.slice(0, 10).map(h => h.name))}

Answer the question in a friendly, conversational, yet highly tactical way. Frame priorities/complexities as full sentences (never say '[MEDIUM]'). Do not use markdown headers (#, ##). Write 1-2 concise, premium paragraphs. Use lists only for distinct recommendations.

Question: "${questionTextTrimmed}"`;

      const requestBody = {
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        }
      };

      let accumulatedText = '';
      const onChunk = (chunk: string) => {
        accumulatedText += chunk;
        setGoalQuestions(prev => {
          const list = prev[selectedGoalForDetail.id] || [];
          return {
            ...prev,
            [selectedGoalForDetail.id]: list.map(item => 
              item.q === questionTextTrimmed ? { ...item, a: accumulatedText, loading: false } : item
            )
          };
        });
      };

      await streamGeminiContent(apiKey, requestBody, onChunk);

    } catch (err: any) {
      console.error('Goal Q&A failed:', err);
      setGoalQuestions(prev => {
        const list = prev[selectedGoalForDetail.id] || [];
        return {
          ...prev,
          [selectedGoalForDetail.id]: list.map(item => 
            item.q === questionTextTrimmed ? { ...item, a: `⚠️ Failed to get answer: ${err.message || 'Connection error'}`, loading: false } : item
          )
        };
      });
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsCreatingGoal(true);
    try {
      let milestones = newMilestonesInput
        .split(',')
        .map((m) => m.trim())
        .filter((m) => m.length > 0)
        .map((m) => ({ text: m, done: false }));

      if (milestones.length === 0 && autoGenerateMilestones) {
        try {
          const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
          if (apiKey) {
            const prompt = `You are "Nova", an elite productivity and goal achievement coach. The user is creating a new goal:
Goal Name: "${newName}"
Category: "${newCategory}"
Notes: "${newNotes || ''}"

Based on this, generate a complete, logical action plan of 5 to 7 chronological roadmap milestones.
Example: For "Crack Placement Interview", generate: "Learn DSA", "Practice Aptitude", "Build Resume", "Improve LinkedIn", "Complete Mock Interviews", "Apply to Companies", "Track Applications".

You must respond with a JSON array of strings only. Do not write any explanations, markdown block formatting, or preambles. Output EXACTLY a JSON array, e.g. ["Milestone 1", "Milestone 2", "Milestone 3"]`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
              })
            });

            if (response.ok) {
              const data = await response.json();
              const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
              const parsed = JSON.parse(text.trim());
              if (Array.isArray(parsed) && parsed.length > 0) {
                milestones = parsed.map(m => ({ text: String(m), done: false }));
              }
            }
          }
        } catch (err) {
          console.error('Failed to auto-generate milestones:', err);
        }
      }

      await addGoal({
        name: newName,
        category: newCategory,
        progress: 0,
        color: newColor,
        milestones: milestones,
        completed_by: newCompletedBy,
        notes: newNotes,
        completed_dates: [],
        streak: 0,
      });

      // Reset
      setNewName('');
      setNewCategory('Personal');
      setNewColor('var(--accent-blue)');
      setNewMilestonesInput('');
      setNewCompletedBy('');
      setNewNotes('');
      setAutoGenerateMilestones(true);
      setShowAddModal(false);
    } catch (err) {
      alert('Failed to add goal.');
    } finally {
      setIsCreatingGoal(false);
    }
  };



  const handleInlineUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalForDetail || !editName.trim()) return;

    try {
      const existingMilestones = selectedGoalForDetail.milestones || [];
      const newMilestones = editMilestonesInput
        .split(',')
        .map((m) => m.trim())
        .filter((m) => m.length > 0)
        .map((m) => {
          const match = existingMilestones.find((em) => em.text.toLowerCase() === m.toLowerCase());
          return { text: m, done: match ? match.done : false };
        });

      const success = await updateGoal(selectedGoalForDetail.id, {
        name: editName,
        category: editCategory,
        color: editColor,
        notes: editNotes,
        completed_by: editCompletedBy,
        milestones: newMilestones,
      });

      if (success) {
        setSelectedGoalForDetail(prev => prev ? {
          ...prev,
          name: editName,
          category: editCategory,
          color: editColor,
          notes: editNotes,
          completed_by: editCompletedBy,
          milestones: newMilestones,
        } : null);
        setIsEditingDetail(false);
      } else {
        alert('Failed to update goal.');
      }
    } catch (err) {
      alert('Failed to update goal.');
    }
  };

  const handleCardClick = (goal: Goal) => {
    if (isSelectionMode) {
      if (selectedGoalIds.includes(goal.id)) {
        setSelectedGoalIds(prev => prev.filter(id => id !== goal.id));
      } else {
        setSelectedGoalIds(prev => [...prev, goal.id]);
      }
    } else {
      setSelectedGoalForDetail(goal);
      setCalendarDate(new Date());
      setIsEditingDetail(false);
    }
  };

  const executeDelete = async () => {
    if (!goalToDelete) return;
    try {
      await deleteGoal(goalToDelete.id);
      if (selectedGoalForDetail && selectedGoalForDetail.id === goalToDelete.id) {
        setSelectedGoalForDetail(null);
      }
      setGoalToDelete(null);
    } catch (err) {
      alert('Failed to delete goal.');
    }
  };

  const handleToggleDate = async (goal: Goal, dateStr: string) => {
    const currentCompleted = goal.completed_dates || [];
    let newCompleted: string[];
    
    if (currentCompleted.includes(dateStr)) {
      newCompleted = currentCompleted.filter(d => d !== dateStr);
    } else {
      newCompleted = [...currentCompleted, dateStr];
    }
    
    const newStreak = calculateStreak(newCompleted);
    
    const stats = getGoalStats({
      ...goal,
      completed_dates: newCompleted,
      streak: newStreak
    });
    
    try {
      await updateGoal(goal.id, {
        completed_dates: newCompleted,
        streak: newStreak,
        progress: stats.progress
      });
      
      setSelectedGoalForDetail(prev => prev && prev.id === goal.id ? {
        ...prev,
        completed_dates: newCompleted,
        streak: newStreak,
        progress: stats.progress
      } : prev);

      if (stats.progress === 100 && (goal.progress || 0) < 100) {
        setCelebratingGoal({
          ...goal,
          completed_dates: newCompleted,
          streak: newStreak,
          progress: stats.progress
        });
      }
    } catch (err) {
      console.error('Failed to toggle completion date:', err);
    }
  };

  const renderCalendar = (goal: Goal) => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const firstDayOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const days = [];
    for (let i = 0; i < firstDayOffset; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    const formatDateStr = (d: number) => {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      return `${year}-${mStr}-${dStr}`;
    };

    const isDateCompleted = (d: number) => {
      const dateStr = formatDateStr(d);
      return (goal.completed_dates || []).includes(dateStr);
    };

    const isToday = (d: number) => {
      const today = new Date();
      return today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
    };

    return (
      <div className="goal-calendar-container">
        <div className="calendar-month-nav">
          <button 
            type="button"
            className="calendar-nav-btn"
            onClick={() => setCalendarDate(new Date(year, month - 1, 1))}
          >
            ◀
          </button>
          <span className="calendar-month-title">{monthNames[month]} {year}</span>
          <button 
            type="button"
            className="calendar-nav-btn"
            onClick={() => setCalendarDate(new Date(year, month + 1, 1))}
          >
            ▶
          </button>
        </div>

        <div className="calendar-weekdays">
          <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
        </div>

        <div className="calendar-grid">
          {days.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="calendar-day empty"></div>;
            }
            
            const dateStr = formatDateStr(day);
            const completed = isDateCompleted(day);
            const active = isToday(day);

            return (
              <button
                key={`day-${day}`}
                type="button"
                className={`calendar-day-btn ${completed ? 'completed' : ''} ${active ? 'today' : ''}`}
                onClick={() => handleToggleDate(goal, dateStr)}
                style={{
                  borderColor: completed ? goal.color : undefined,
                  boxShadow: completed ? `0 0 8px ${goal.color}44` : undefined,
                }}
              >
                <span className="day-number">{day}</span>
                <span 
                  className={`day-checkbox ${completed ? 'checked' : ''}`}
                  style={{
                    borderColor: goal.color,
                    backgroundColor: completed ? goal.color : 'transparent'
                  }}
                >
                  {completed && '✓'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const filteredGoals = goals.filter(g => {
    // 1. Status Filter
    if (filter === 'completed') {
      if (g.progress < 100) return false;
    } else {
      // Exclude completed goals from All, Active, and AI Generated views
      if (g.progress === 100) return false;
      if (filter === 'ai-generated' && !g.ai_generated) return false;
    }
    
    // 2. Category Filter
    if (selectedCategory === 'All') return true;
    return g.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  if (!user) {
    return (
      <div className="goals-page" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex', minHeight: '60vh' }}>
        <div className="widget glass-card-static" style={{ padding: '40px', textAlign: 'center', maxWidth: '480px' }}>
          <h3>🔒 Authentication Required</h3>
          <p style={{ marginTop: '12px', marginBottom: '24px' }}>Please log in using Google or email on the login page to manage your goals.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="goals-page">
      <div className="page-header">
        <div>
          <h2>🎯 <span className="gradient-text">Goals</span></h2>
          <p>Long-term achievements with AI-powered roadmaps and milestone tracking.</p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isSelectionMode ? (
            <>
              <button 
                className="btn-secondary btn-sm" 
                style={{ borderColor: 'var(--accent-red)', color: 'var(--accent-red)', background: 'rgba(239,68,68,0.05)', fontWeight: 'bold' }}
                onClick={() => {
                  if (selectedGoalIds.length > 0) {
                    setShowBulkDeleteConfirm(true);
                  }
                }}
                disabled={selectedGoalIds.length === 0}
              >
                Delete Selected ({selectedGoalIds.length})
              </button>
              <button 
                className="btn-secondary btn-sm"
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedGoalIds([]);
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button 
                className="btn-secondary btn-sm" 
                onClick={() => {
                  setIsSelectionMode(true);
                  setSelectedGoalIds([]);
                }}
              >
                ☑️ Select
              </button>
              <button className="btn-primary btn-sm" onClick={() => setShowAddModal(true)}>+ New Goal</button>
            </>
          )}
        </div>
      </div>

      <div className="status-filters" style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {(['all', 'active', 'ai-generated', 'completed'] as const).map(f => (
          <button 
            key={f} 
            className={`filter-btn ${filter === f ? 'active' : ''}`} 
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? '🎯 All' : f === 'active' ? '⚡ Active' : f === 'ai-generated' ? '🤖 AI Generated' : '✅ Completed'}
            <span className="filter-count" style={{ marginLeft: '6px', fontSize: '11px', opacity: 0.6 }}>
              {f === 'all' ? goals.filter(g => g.progress < 100).length :
               f === 'active' ? goals.filter(g => g.progress < 100).length :
               f === 'ai-generated' ? goals.filter(g => g.ai_generated && g.progress < 100).length :
               goals.filter(g => g.progress === 100).length}
            </span>
          </button>
        ))}
      </div>

      <div className="goal-categories">
        {categories.map(c => (
          <button 
            key={c} 
            className={`filter-btn ${c === selectedCategory ? 'active' : ''}`}
            onClick={() => setSelectedCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state" style={{ textAlign: 'center', padding: '60px' }}>
          <div className="ai-onboard-avatar" style={{ margin: '0 auto 20px auto', width: '40px', height: '40px' }}></div>
          <p>Synchronizing goals with Firestore Database...</p>
        </div>
      ) : filteredGoals.length === 0 ? (
        <div className="empty-state widget glass-card-static" style={{ textAlign: 'center', padding: '50px 30px', margin: '20px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
          <h4>No Goals Found</h4>
          <p style={{ maxWidth: '400px', margin: '10px auto 24px auto', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Your goals roadmap is empty. Click "+ New Goal" to set a milestone and outline your future!
          </p>
          <button className="btn-primary btn-sm" onClick={() => setShowAddModal(true)}>+ Add New Goal</button>
        </div>
      ) : (
        /* Goal Roadmap Cards */
        <div className="goals-grid">
          {filteredGoals.map(goal => {
            const stats = getGoalStats(goal);
            const isFadingAway = goal.id === fadeAwayGoalId;

            return (
              <div 
                key={goal.id} 
                className={`goal-card widget ${isSelectionMode ? 'selection-mode' : ''} ${selectedGoalIds.includes(goal.id) ? 'selected-card' : ''} ${isFadingAway ? 'fade-out-fly' : ''}`}
                onClick={() => handleCardClick(goal)}
                style={{ position: 'relative', cursor: 'pointer' }}
              >
                
                <div className="goal-card-header">
                  <span className="goal-category-badge" style={{ color: goal.color, borderColor: goal.color }}>{goal.category}</span>
                  {isSelectionMode && (
                    <div className="card-select-checkbox-overlay" style={{ zIndex: 10 }}>
                      <div className={`goal-check ${selectedGoalIds.includes(goal.id) ? 'checked' : ''}`} style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        border: '1.5px solid rgba(255,255,255,0.3)',
                        background: selectedGoalIds.includes(goal.id) ? goal.color : 'rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        color: 'white',
                        transition: 'all 0.2s ease'
                      }}>
                        {selectedGoalIds.includes(goal.id) && '✓'}
                      </div>
                    </div>
                  )}
                </div>
                <h3 className="goal-card-title">{goal.name}</h3>
                
                {/* Progress Ring with Centered Percentage */}
                <div className="goal-ring-wrapper" style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <svg viewBox="0 0 80 80" className="goal-ring-svg">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="5" />
                    <circle cx="40" cy="40" r="34" fill="none" stroke={goal.color} strokeWidth="5"
                      strokeLinecap="round" strokeDasharray="213.6"
                      strokeDashoffset={213.6 - (stats.progress / 100) * 213.6}
                      style={{ transform: 'rotate(-90deg)', transformOrigin: '40px 40px', transition: 'stroke-dashoffset 0.8s ease-out' }} />
                  </svg>
                  <span className="goal-pct-inner" style={{ position: 'absolute', color: goal.color, fontSize: '15px', fontWeight: 'var(--font-extrabold)' }}>
                    {stats.progress}%
                  </span>
                </div>

                {/* Consistency Streak and Average Progress */}
                <div className="goal-consistency-row" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)' }}>
                    <span>🔥</span>
                    <span style={{ color: 'var(--text-secondary)' }}>Streak: <strong style={{ color: 'white' }}>{goal.streak || 0} days</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)' }}>
                    <span>📈</span>
                    <span style={{ color: 'var(--text-secondary)' }}>Avg: <strong style={{ color: 'white' }}>{stats.avgProgress}%</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dynamic AI Goal Coach Insights */}
      {goals.length > 0 && (
        <div className="goal-insights widget" style={{ marginTop: '24px' }}>
          <div className="widget-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px', marginBottom: '16px' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <span>🧠</span> AI Goal Coach & Insights
            </h4>
          </div>

          {loadingOverallAnalysis && !overallGoalAnalysis ? (
            <div className="ai-loading" style={{ padding: '24px', textAlign: 'center' }}>
              <div className="ai-onboard-avatar" style={{ margin: '0 auto 12px auto', width: '32px', height: '32px' }}></div>
              <p style={{ fontSize: 'var(--text-sm)' }}>Nova is scanning your goals progress and timeline targets...</p>
            </div>
          ) : (
            <>
              {overallGoalAnalysis && (
                <div className="goal-analysis-grid">
                  <div className="analysis-card widget glass-card-static" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}>🎯 Recommended Focus Area</div>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0, lineHeight: '1.4' }}>
                      {overallGoalAnalysis.focusArea}
                    </p>
                  </div>

                  <div className="analysis-card widget glass-card-static" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}>📈 Milestone Velocity</div>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0, lineHeight: '1.4' }}>
                      {overallGoalAnalysis.milestoneVelocity}
                    </p>
                  </div>

                  <div className="analysis-card widget glass-card-static" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}>⚠️ Timeline & Schedule Risk</div>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0, lineHeight: '1.4' }}>
                      {overallGoalAnalysis.timelineRisk}
                    </p>
                  </div>

                  <div className="analysis-card widget glass-card-static" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}>💡 Actionable Coaching Advice</div>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0, lineHeight: '1.4' }}>
                      {overallGoalAnalysis.actionableTip}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Add Goal Modal Overlay */}
      {showAddModal && (
        <div className="task-detail-overlay" onClick={() => setShowAddModal(false)}>
          <div className="task-detail-panel widget" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <button className="detail-close" onClick={() => setShowAddModal(false)}>✕</button>
            <div className="detail-header" style={{ marginBottom: '24px' }}>
              <h3>Create New Goal Roadmap</h3>
              <p>Map out a long-term goal in Firestore</p>
            </div>

            <form onSubmit={handleCreateGoal} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Goal Title</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Ace Final Exams or Read 12 Books" 
                  required
                  style={{
                    padding: '12px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'white',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Category</label>
                  <CustomSelect
                    value={newCategory}
                    onChange={setNewCategory}
                    options={categoryOptions}
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Theme Color</label>
                  <CustomSelect
                    value={newColor}
                    onChange={setNewColor}
                    options={colorOptions}
                  />
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Goal should be completed by</label>
                <input 
                  type="date"
                  value={newCompletedBy}
                  onChange={e => setNewCompletedBy(e.target.value)}
                  style={{
                    padding: '12px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'white',
                    outline: 'none'
                  }}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Roadmap Milestones (comma-separated, optional)</label>
                <textarea 
                  value={newMilestonesInput} 
                  onChange={e => setNewMilestonesInput(e.target.value)}
                  placeholder="e.g. Buy textbook, Revise Chapter 1, Revise Chapter 2, Take Mock Exam" 
                  rows={2}
                  style={{
                    padding: '12px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'white',
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Goal Notes (optional)</label>
                <textarea 
                  value={newNotes} 
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Describe your goal, motivations, or strategy..." 
                  rows={2}
                  style={{
                    padding: '12px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'white',
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0 12px 0' }}>
                <input 
                  type="checkbox" 
                  id="autoGenerateMilestones"
                  checked={autoGenerateMilestones}
                  onChange={e => setAutoGenerateMilestones(e.target.checked)}
                  style={{ width: 'auto', cursor: 'pointer' }}
                />
                <label htmlFor="autoGenerateMilestones" style={{ fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
                  ✨ Auto-generate full roadmap milestones with Nova AI (if left empty)
                </label>
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                disabled={isCreatingGoal}
                style={{ 
                  marginTop: '12px', 
                  padding: '14px', 
                  opacity: isCreatingGoal ? 0.7 : 1, 
                  cursor: isCreatingGoal ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isCreatingGoal ? (
                  <>
                    <div className="typing" style={{ display: 'inline-flex', gap: '3px', margin: 0, padding: 0 }}>
                      <span className="typing-dot" style={{ width: '4px', height: '4px', background: 'white' }}></span>
                      <span className="typing-dot" style={{ width: '4px', height: '4px', background: 'white' }}></span>
                      <span className="typing-dot" style={{ width: '4px', height: '4px', background: 'white' }}></span>
                    </div>
                    <span>Generating Roadmap...</span>
                  </>
                ) : (
                  'Create Goal'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {goalToDelete && (
        <div className="task-detail-overlay" onClick={() => setGoalToDelete(null)}>
          <div className="task-detail-panel widget" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
            <button className="detail-close" onClick={() => setGoalToDelete(null)}>✕</button>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
            <h3>Delete Goal Roadmap</h3>
            <p style={{ marginTop: '12px', marginBottom: '24px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Are you sure you want to delete the goal roadmap <strong>"{goalToDelete.name}"</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button type="button" className="btn-secondary btn-sm" onClick={() => setGoalToDelete(null)}>Cancel</button>
              <button 
                type="button"
                className="btn-primary btn-sm" 
                onClick={executeDelete}
                style={{ backgroundColor: 'var(--accent-red)', borderColor: 'var(--accent-red)' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="task-detail-overlay" onClick={() => setShowBulkDeleteConfirm(false)}>
          <div className="task-detail-panel widget" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
            <button className="detail-close" onClick={() => setShowBulkDeleteConfirm(false)}>✕</button>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
            <h3>Delete Selected Goals</h3>
            <p style={{ marginTop: '12px', marginBottom: '24px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Are you sure you want to delete the <strong>{selectedGoalIds.length}</strong> selected goal roadmaps? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button type="button" className="btn-secondary btn-sm" onClick={() => setShowBulkDeleteConfirm(false)}>Cancel</button>
              <button 
                type="button" 
                className="btn-primary btn-sm" 
                onClick={async () => {
                  try {
                    for (const id of selectedGoalIds) {
                      await deleteGoal(id);
                    }
                    setSelectedGoalIds([]);
                    setIsSelectionMode(false);
                  } catch (err) {
                    console.error('Failed to delete goals:', err);
                  }
                  setShowBulkDeleteConfirm(false);
                }}
                style={{ backgroundColor: 'var(--accent-red)', borderColor: 'var(--accent-red)' }}
              >
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}



       {/* Goal Detail & Calendar Tracker Modal */}
      {selectedGoalForDetail && (
        <div className="task-detail-overlay" onClick={() => { setSelectedGoalForDetail(null); setDetailTab('calendar'); }}>
          <div className="task-detail-panel widget goal-detail-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '820px', width: '95vw', position: 'relative' }}>
            <button 
              type="button"
              className="btn-secondary btn-sm" 
              onClick={() => {
                setEditName(selectedGoalForDetail.name);
                setEditCategory(selectedGoalForDetail.category);
                setEditColor(selectedGoalForDetail.color);
                setEditNotes(selectedGoalForDetail.notes || '');
                setEditCompletedBy(selectedGoalForDetail.completed_by || '');
                const milestoneString = (selectedGoalForDetail.milestones || [])
                  .map(m => m.text)
                  .join(', ');
                setEditMilestonesInput(milestoneString);
                setIsEditingDetail(!isEditingDetail);
              }}
              style={{
                position: 'absolute',
                top: '24px',
                right: '62px',
                padding: '6px 12px',
                fontSize: 'var(--text-xs)',
                zIndex: 10,
                borderRadius: 'var(--radius-md)'
              }}
            >
              ✏️ {isEditingDetail ? 'Close Edit' : 'Edit'}
            </button>
            <button className="detail-close" onClick={() => { setSelectedGoalForDetail(null); setDetailTab('calendar'); }}>✕</button>
            
            <div className="goal-detail-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="goal-category-badge" style={{ color: selectedGoalForDetail.color, borderColor: selectedGoalForDetail.color }}>
                    {selectedGoalForDetail.category}
                  </span>
                  <h2 style={{ marginTop: '10px', fontSize: '24px', fontWeight: 'bold' }}>{selectedGoalForDetail.name}</h2>
                </div>
              </div>
              
              {selectedGoalForDetail.completed_by && (
                <p style={{ marginTop: '8px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  📅 Target Completion Date: <strong>{formatCompletedBy(selectedGoalForDetail.completed_by)}</strong>
                </p>
              )}
              {selectedGoalForDetail.notes && !isEditingDetail && (
                <div className="goal-detail-notes" style={{ marginTop: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-md)', borderLeft: `3px solid ${selectedGoalForDetail.color}` }}>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>
                    {selectedGoalForDetail.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Tab Navigation */}
            <div className="detail-tabs-nav" style={{ marginBottom: '20px' }}>
              <button 
                className={detailTab === 'calendar' ? 'active' : ''} 
                onClick={() => setDetailTab('calendar')}
              >
                📅 Calendar & Milestones
              </button>
              <button 
                className={detailTab === 'ai' ? 'active' : ''} 
                onClick={() => setDetailTab('ai')}
              >
                🤖 AI Action Roadmap & Analytics
              </button>
            </div>

            {/* Inline Editing panel - opens inside modal above other details */}
            {isEditingDetail && (
              <div className="inline-edit-box" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '16px', fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>✏️ Edit Goal Details</h4>
                <form onSubmit={handleInlineUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Goal Title</label>
                    <input 
                      type="text" 
                      value={editName} 
                      onChange={e => setEditName(e.target.value)}
                      required
                      style={{
                        padding: '10px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-md)',
                        color: 'white',
                        outline: 'none'
                      }}
                    />
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Category</label>
                      <CustomSelect
                        value={editCategory}
                        onChange={setEditCategory}
                        options={categoryOptions}
                      />
                    </div>

                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Theme Color</label>
                      <CustomSelect
                        value={editColor}
                        onChange={setEditColor}
                        options={colorOptions}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Goal should be completed by</label>
                    <input 
                      type="date"
                      value={editCompletedBy}
                      onChange={e => setEditCompletedBy(e.target.value)}
                      style={{
                        padding: '10px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-md)',
                        color: 'white',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Goal Notes</label>
                    <textarea 
                      value={editNotes} 
                      onChange={e => setEditNotes(e.target.value)}
                      rows={2}
                      style={{
                        padding: '10px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-md)',
                        color: 'white',
                        outline: 'none',
                        resize: 'none',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>

                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Roadmap Milestones (comma-separated)</label>
                    <textarea 
                      value={editMilestonesInput} 
                      onChange={e => setEditMilestonesInput(e.target.value)}
                      placeholder="e.g. Milestone 1, Milestone 2..."
                      rows={2}
                      style={{
                        padding: '10px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-md)',
                        color: 'white',
                        outline: 'none',
                        resize: 'none',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                    <button type="submit" className="btn-primary btn-sm" style={{ flex: 1, padding: '10px' }}>Save Changes</button>
                    <button type="button" className="btn-secondary btn-sm" onClick={() => setIsEditingDetail(false)} style={{ flex: 1, padding: '10px' }}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {/* Streak & Calendar Section Layout (Two Column Grid) */}
            {detailTab === 'calendar' && (
              <div className="goal-detail-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
                
                {/* Left Column: Streak and Milestones */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="goal-streak-banner" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)', padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <span style={{ fontSize: '32px' }}>🔥</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#F59E0B' }}>
                        {selectedGoalForDetail.streak || 0} Day Streak
                      </h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        Check off your goal daily!
                      </p>
                    </div>
                  </div>

                  {/* Milestones checklist inside details modal (no progress recorded) */}
                  <div className="milestones-detail-section" style={{ background: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <h4 style={{ marginBottom: '12px', fontWeight: 'bold', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🎯</span> Roadmap Milestones
                    </h4>
                    {selectedGoalForDetail.milestones && selectedGoalForDetail.milestones.length > 0 ? (
                      <div className="detail-milestones-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedGoalForDetail.milestones.map((m, i) => (
                          <div 
                            key={i} 
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                            onClick={async () => {
                              await toggleMilestone(selectedGoalForDetail.id, i);
                              // Update local modal state
                              setSelectedGoalForDetail(prev => {
                                if (!prev) return null;
                                const newMilestones = [...prev.milestones];
                                newMilestones[i].done = !newMilestones[i].done;
                                return { ...prev, milestones: newMilestones };
                              });
                            }}
                          >
                            <div className="milestone-checkbox" style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '4px',
                              border: `1.5px solid ${m.done ? selectedGoalForDetail.color : 'rgba(255,255,255,0.3)'}`,
                              backgroundColor: m.done ? selectedGoalForDetail.color : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '9px',
                              color: 'white',
                              transition: 'all 0.2s ease'
                            }}>
                              {m.done && '✓'}
                            </div>
                            <span style={{ 
                              fontSize: '13px', 
                              color: m.done ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                              textDecoration: m.done ? 'line-through' : 'none',
                              transition: 'all 0.2s ease'
                            }}>
                              {m.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>No milestones set.</p>
                    )}
                  </div>
                </div>

                {/* Right Column: Calendar Tracker */}
                <div>
                  <h4 style={{ marginBottom: '12px', fontWeight: 'bold', fontSize: 'var(--text-base)', textAlign: 'center' }}>Did you work towards completing your goal today?🎯</h4>
                  {renderCalendar(selectedGoalForDetail)}
                </div>

              </div>
            )}

            {detailTab === 'ai' && (
              <div className="tab-content-container ai-goal-coach-view" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {loadingAnalysis && !goalAnalyses[selectedGoalForDetail.id] ? (
                  <div className="ai-loading-panel" style={{ textAlign: 'center', padding: '30px' }}>
                    <div className="ai-onboard-avatar" style={{ margin: '0 auto 16px auto', width: '36px', height: '36px' }}></div>
                    <p style={{ fontSize: 'var(--text-sm)' }}>Nova is analyzing your milestones, streak consistency, and predicting completion dates...</p>
                  </div>
                ) : (
                  <>
                    {/* Dynamic Analysis Cards */}
                    {goalAnalyses[selectedGoalForDetail.id] && (
                      <div className="ai-analysis-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="analysis-card widget glass-card-static" style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)' }}>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '4px' }}>📈 Estimated Probability</div>
                          <div style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--accent-green)' }}>
                            {goalAnalyses[selectedGoalForDetail.id].completionProbability}
                          </div>
                        </div>
                        
                        <div className="analysis-card widget glass-card-static" style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)' }}>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '4px' }}>📅 Expected Completion Date</div>
                          <div style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--accent-blue-light)' }}>
                            {goalAnalyses[selectedGoalForDetail.id].expectedCompletionDate}
                          </div>
                        </div>

                        <div className="analysis-card widget glass-card-static" style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)', gridColumn: 'span 2' }}>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '4px' }}>⏱️ Remaining Effort Required</div>
                          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                            {goalAnalyses[selectedGoalForDetail.id].remainingEffort}
                          </div>
                        </div>

                        <div className="analysis-card widget glass-card-static" style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)', gridColumn: 'span 2' }}>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '4px' }}>🔗 Relationships with Other Goals</div>
                          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                            {goalAnalyses[selectedGoalForDetail.id].relationships}
                          </div>
                        </div>

                        <div className="analysis-card widget glass-card-static" style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)', gridColumn: 'span 2' }}>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '4px' }}>🛡️ Recovery Recommendations</div>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                            {goalAnalyses[selectedGoalForDetail.id].recoveryRecommendations}
                          </p>
                        </div>

                        {goalAnalyses[selectedGoalForDetail.id].milestoneAnalysis && goalAnalyses[selectedGoalForDetail.id].milestoneAnalysis.length > 0 && (
                          <div className="analysis-card widget glass-card-static" style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)', gridColumn: 'span 2' }}>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '8px' }}>🎯 Milestone Analysis & Suggested Subtasks</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {goalAnalyses[selectedGoalForDetail.id].milestoneAnalysis.map((ma: any, idx: number) => (
                                <div key={idx} style={{ borderBottom: idx < goalAnalyses[selectedGoalForDetail.id].milestoneAnalysis.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none', paddingBottom: '8px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{ma.milestone}</span>
                                    <span style={{ 
                                      fontSize: '10px', 
                                      padding: '2px 6px', 
                                      borderRadius: '4px',
                                      fontWeight: 'bold',
                                      background: ma.status === 'On Track' ? 'rgba(16,185,129,0.1)' : ma.status === 'At Risk' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
                                      color: ma.status === 'On Track' ? 'var(--accent-green)' : ma.status === 'At Risk' ? 'var(--accent-red)' : 'var(--text-secondary)'
                                    }}>{ma.status}</span>
                                  </div>
                                  {ma.suggestions && ma.suggestions.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '8px', marginTop: '6px' }}>
                                      {ma.suggestions.map((sug: string, sIdx: number) => (
                                        <div key={sIdx} style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <span>• {sug}</span>
                                          <button 
                                            className="btn-secondary btn-xs"
                                            onClick={async () => {
                                              try {
                                                const existingMilestones = selectedGoalForDetail.milestones || [];
                                                const updatedMilestones = [...existingMilestones, { text: sug, done: false }];
                                                await updateGoal(selectedGoalForDetail.id, { milestones: updatedMilestones });
                                                setSelectedGoalForDetail(prev => prev ? { ...prev, milestones: updatedMilestones } : null);
                                                alert(`Added "${sug}" as milestone!`);
                                              } catch (e) {
                                                alert('Failed to add milestone.');
                                              }
                                            }}
                                            style={{ padding: '2px 6px', fontSize: '9px', opacity: 0.7 }}
                                          >
                                            + Add Milestone
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Q&A Section */}
                    <div className="ai-qa-section" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', marginTop: '8px' }}>
                      <h5 style={{ marginBottom: '12px', fontWeight: 'bold' }}>Ask Nova Goal Strategist</h5>
                      
                      <div className="quick-questions" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                        {[
                          "Which goal is closest to completion?",
                          "What is slowing my progress?",
                          "Can I achieve all my goals this month?",
                          "Give me a daily strategy for this goal",
                          "What milestones should I add next?"
                        ].map((q, idx) => (
                          <button 
                            key={idx} 
                            className="ai-suggestion-chip" 
                            onClick={() => handleAskGoalQuestion(q)}
                            style={{ fontSize: '11px', padding: '4px 10px', cursor: 'pointer' }}
                          >
                            {q}
                          </button>
                        ))}
                      </div>

                      {/* Q&A History bubbles */}
                      {goalQuestions[selectedGoalForDetail.id] && goalQuestions[selectedGoalForDetail.id].length > 0 && (
                        <div className="qa-history-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                          {goalQuestions[selectedGoalForDetail.id].map((item, idx) => (
                            <div key={idx} className="qa-item" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div className="qa-question" style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '12px', alignSelf: 'flex-end', fontSize: '12px', maxWidth: '85%' }}>
                                {item.q}
                              </div>
                              <div className="qa-answer" style={{ display: 'flex', gap: '8px', alignSelf: 'flex-start', maxWidth: '90%' }}>
                                <div className="ai-avatar-inner" style={{ width: '20px', height: '20px', flexShrink: 0, marginTop: '2px' }}></div>
                                <div className="qa-answer-bubble" style={{ background: 'rgba(59,130,246,0.03)', border: '1px solid rgba(59,130,246,0.08)', padding: '10px 12px', borderRadius: '12px', fontSize: '12px', lineHeight: '1.5', color: 'var(--text-primary)' }}>
                                  {item.loading ? (
                                    <div className="typing" style={{ display: 'flex', gap: '4px', padding: '4px 0' }}>
                                      <span className="typing-dot" style={{ width: '5px', height: '5px' }}></span>
                                      <span className="typing-dot" style={{ width: '5px', height: '5px' }}></span>
                                      <span className="typing-dot" style={{ width: '5px', height: '5px' }}></span>
                                    </div>
                                  ) : (
                                    renderMarkdown(item.a)
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Input field */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          type="text"
                          value={customQuestionInput}
                          onChange={e => setCustomQuestionInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAskGoalQuestion(customQuestionInput)}
                          placeholder="Ask custom question about this goal..."
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            background: 'rgba(0,0,0,0.2)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: 'var(--radius-md)',
                            color: 'white',
                            fontSize: '12px',
                            outline: 'none'
                          }}
                        />
                        <button 
                          className="btn-primary btn-sm"
                          onClick={() => handleAskGoalQuestion(customQuestionInput)}
                          style={{ padding: '8px 16px', fontSize: '12px' }}
                        >
                          Ask
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Footer with Done Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
              <button 
                type="button" 
                className="btn-secondary btn-sm"
                onClick={() => {
                  setGoalToDelete({ id: selectedGoalForDetail.id, name: selectedGoalForDetail.name });
                }}
                style={{
                  padding: '8px 24px',
                  fontSize: 'var(--text-sm)',
                  borderColor: 'var(--accent-red)',
                  color: 'var(--accent-red)',
                  background: 'rgba(239, 68, 68, 0.05)',
                  fontWeight: 'bold'
                }}
              >
                Delete Goal
              </button>
              <button 
                type="button" 
                className="btn-primary btn-sm"
                onClick={() => setSelectedGoalForDetail(null)}
                style={{ padding: '8px 24px', fontSize: 'var(--text-sm)', minWidth: '100px' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confetti Celebration Overlay */}
      {celebratingGoal && (
        <CelebrationOverlay 
          goal={celebratingGoal} 
          onClose={() => {
            setFadeAwayGoalId(celebratingGoal.id);
            setCelebratingGoal(null);
            setTimeout(() => {
              setFadeAwayGoalId(null);
            }, 800);
          }}
        />
      )}
    </div>
  );
}
