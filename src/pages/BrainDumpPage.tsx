import { useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useGoals } from '../hooks/useGoals';
import { useHabits } from '../hooks/useHabits';
import { callGeminiWithRetry } from '../utils/aiClient';
import './BrainDumpPage.css';

type ParsedItem = { text: string; type: 'task' | 'goal' | 'habit'; priority: string; icon: string };

export default function BrainDumpPage() {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ParsedItem[] | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const { addTask, user } = useTasks();
  const { addGoal } = useGoals();
  const { addHabit } = useHabits();

  const processDump = async () => {
    if (!input.trim()) return;
    setIsProcessing(true);
    setSaved(false);

    const runFallback = () => {
      const items = input.split(/[,.;\n]+/).map(s => s.trim()).filter(Boolean);
      const parsed: ParsedItem[] = items.map(item => {
        const lower = item.toLowerCase();
        if (lower.includes('exam') || lower.includes('test') || lower.includes('assignment') || lower.includes('deadline') || lower.includes('submit') || lower.includes('homework'))
          return { text: item, type: 'task', priority: 'high', icon: '📝' };
        if (lower.includes('gym') || lower.includes('exercise') || lower.includes('run') || lower.includes('meditat') || lower.includes('yoga') || lower.includes('stretch') || lower.includes('water'))
          return { text: item, type: 'habit', priority: 'medium', icon: '🔄' };
        if (lower.includes('meeting') || lower.includes('interview') || lower.includes('appointment') || lower.includes('call') || lower.includes('class') || lower.includes('lecture'))
          return { text: item, type: 'task', priority: 'medium', icon: '📝' };
        if (lower.includes('learn') || lower.includes('become') || lower.includes('improve') || lower.includes('goal') || lower.includes('master') || lower.includes('achieve'))
          return { text: item, type: 'goal', priority: 'medium', icon: '🎯' };
        if (lower.includes('buy') || lower.includes('groceries') || lower.includes('shop') || lower.includes('pay') || lower.includes('bill') || lower.includes('rent'))
          return { text: item, type: 'task', priority: 'low', icon: '📝' };
        return { text: item, type: 'task', priority: 'medium', icon: '📝' };
      });
      setResults(parsed);
    };

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        console.warn('VITE_GEMINI_API_KEY is not defined. Using local fallback.');
        runFallback();
        return;
      }

      const prompt = `You are "Nova", an elite productivity coach and organization assistant.
The user has input a raw "brain dump" containing random thoughts, tasks, habits, and goals they want to organize:
"${input}"

Please organize this brain dump into a JSON array of individual actionable items.
Rules:
1. Categorize each item as either a 'task' (a one-off action), 'goal' (a longer term aspiration or milestone), or 'habit' (a recurring routine or practice).
2. Assign a priority of 'high', 'medium', or 'low'.
3. Select a single appropriate emoji icon for the item.
4. Clean up, correct, and nicely capitalize the text (e.g. change "math exam preparation" to "Prepare for Math Exam").
5. Only output a valid JSON array, containing objects with these exact fields:
   - "text": string (cleaned text)
   - "type": "task" | "goal" | "habit"
   - "priority": "high" | "medium" | "low"
   - "icon": string (single emoji)

Example output format:
[
  {"text": "Submit physics assignment", "type": "task", "priority": "high", "icon": "📝"},
  {"text": "Go to the gym", "type": "habit", "priority": "medium", "icon": "🔄"},
  {"text": "Master React and TypeScript", "type": "goal", "priority": "medium", "icon": "🎯"}
]`;

      const requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
        }
      };

      const data = await callGeminiWithRetry(apiKey, requestBody);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.substring(7);
      }
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.substring(3);
      }
      if (cleanText.endsWith('```')) {
        cleanText = cleanText.substring(0, cleanText.length - 3);
      }
      cleanText = cleanText.trim();
      
      const parsed: ParsedItem[] = JSON.parse(cleanText);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setResults(parsed);
      } else {
        throw new Error('Invalid JSON format or empty array received');
      }
    } catch (err) {
      console.error('AI Brain Dump processing error, using local fallback:', err);
      runFallback();
    } finally {
      setIsProcessing(false);
    }
  };

  const saveAll = async () => {
    if (!results || !user) return;
    setSaving(true);

    try {
      for (const item of results) {
        switch (item.type) {
          case 'task':
            await addTask({
              text: item.text,
              done: false,
              priority: item.priority === 'high' ? 'high' : item.priority === 'low' ? 'low' : 'medium',
              category: 'General',
              due: 'This week',
              subtasks: undefined,
              risk: item.priority === 'high' ? 60 : undefined,
              aiGenerated: true,
            });
            break;
          case 'goal':
            await addGoal({
              name: item.text,
              category: 'Personal',
              progress: 0,
              color: 'var(--accent-purple)',
              milestones: [{ text: 'Get started', done: false }],
            });
            break;
          case 'habit':
            await addHabit({
              name: item.text,
              target: 'Daily',
              streak: 0,
              best: 0,
              rate: 0,
              week: [false, false, false, false, false, false, false],
              color: 'var(--accent-cyan)',
            });
            break;
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      console.error('Error saving brain dump items:', err);
      alert('Some items failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="braindump-page">
      <div className="page-header">
        <div>
          <h2>🧠 <span className="gradient-text">Brain Dump</span></h2>
          <p>Dump everything from your mind. AI instantly organizes it into tasks, goals, and habits.</p>
        </div>
      </div>

      {/* Magic Zone */}
      <div className="braindump-zone widget">
        <div className="braindump-glow"></div>
        <div className="braindump-content">
          <div className="braindump-header">
            <div className="brain-orb">
              <div className="brain-orb-inner">🧠</div>
              <div className="brain-pulse"></div>
            </div>
            <div>
              <h3>What's on your mind?</h3>
              <p>Type everything — tasks, deadlines, goals, random thoughts. AI will sort it all.</p>
            </div>
          </div>

          <textarea
            className="braindump-textarea"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Exam next week, buy groceries, gym tomorrow, project deadline friday, learn python, pay electricity bill, meditate daily..."
            rows={6}
          />

          <div className="braindump-actions">
            <button className="btn-primary" onClick={processDump} disabled={isProcessing || !input.trim()}>
              {isProcessing ? (
                <span className="processing-text">
                  <span className="processing-spinner"></span> AI Processing...
                </span>
              ) : '✨ Process with AI'}
            </button>
            <button className="btn-secondary" onClick={() => { setInput(''); setResults(null); }}>Clear</button>
          </div>
        </div>
      </div>

      {/* Processing Animation */}
      {isProcessing && (
        <div className="processing-visual">
          <div className="process-flow">
            <div className="process-node input-node">
              <span>🧠</span>
              <p>Raw Thoughts</p>
            </div>
            <div className="process-arrow">
              <div className="arrow-line"></div>
              <div className="arrow-pulse"></div>
            </div>
            <div className="process-node ai-node">
              <div className="process-ai-orb"></div>
              <p>AI Processing</p>
            </div>
            <div className="process-arrow">
              <div className="arrow-line"></div>
              <div className="arrow-pulse"></div>
            </div>
            <div className="process-node output-node">
              <span>✨</span>
              <p>Organized</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="braindump-results">
          <div className="results-header">
            <h3>✨ AI organized your brain dump into {results.length} items</h3>
            <button
              className={`btn-primary btn-sm ${saved ? 'saved' : ''}`}
              onClick={saveAll}
              disabled={saving || saved || !user}
            >
              {saving ? '⏳ Saving...' : saved ? '✅ Saved to Database!' : '💾 Save All to Database'}
            </button>
          </div>

          {!user && (
            <div className="save-warning">
              ⚠️ Log in to save items to your database
            </div>
          )}

          <div className="results-grid">
            {['task', 'goal', 'habit'].map(type => {
              const items = results.filter(r => r.type === type);
              if (items.length === 0) return null;
              return (
                <div key={type} className={`result-group widget result-${type}`}>
                  <h4 className="result-group-title">
                    {type === 'task' ? '📝 Tasks' : type === 'goal' ? '🎯 Goals' : '🔄 Habits'}
                    <span className="result-count">{items.length}</span>
                  </h4>
                  <div className="result-items">
                    {items.map((item, i) => (
                      <div key={i} className="result-item">
                        <span className="result-icon">{item.icon}</span>
                        <span className="result-text">{item.text}</span>
                        <span className={`result-priority priority-${item.priority}`}>
                          {item.priority === 'high' ? '🔴' : item.priority === 'medium' ? '🟡' : '🟢'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Example */}
      {!results && !isProcessing && (
        <div className="braindump-example widget">
          <h4>💡 How it works</h4>
          <div className="example-flow">
            <div className="example-input">
              <p className="example-label">You type:</p>
              <p className="example-text">"Exam next week, buy groceries, gym, learn python"</p>
            </div>
            <div className="example-arrow">✨ AI Magic ✨</div>
            <div className="example-output">
              <p className="example-label">AI creates:</p>
              <div className="example-items">
                <span className="example-tag tag-task">📝 Exam Prep — Task (High)</span>
                <span className="example-tag tag-task">📝 Buy Groceries — Task (Low)</span>
                <span className="example-tag tag-habit">🔄 Gym — Habit</span>
                <span className="example-tag tag-goal">🎯 Learn Python — Goal</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
