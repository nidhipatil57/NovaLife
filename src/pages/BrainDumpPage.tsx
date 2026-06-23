import { useState } from 'react';
import './BrainDumpPage.css';

type ParsedItem = { text: string; type: 'task' | 'goal' | 'event' | 'habit'; priority: string; icon: string };

export default function BrainDumpPage() {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ParsedItem[] | null>(null);
  const [saved, setSaved] = useState(false);

  const processDump = () => {
    if (!input.trim()) return;
    setIsProcessing(true);
    setSaved(false);

    setTimeout(() => {
      const items = input.split(/[,.\n]+/).map(s => s.trim()).filter(Boolean);
      const parsed: ParsedItem[] = items.map(item => {
        const lower = item.toLowerCase();
        if (lower.includes('exam') || lower.includes('test') || lower.includes('assignment') || lower.includes('deadline'))
          return { text: item, type: 'task', priority: 'high', icon: '📝' };
        if (lower.includes('gym') || lower.includes('exercise') || lower.includes('run') || lower.includes('meditat'))
          return { text: item, type: 'habit', priority: 'medium', icon: '🔄' };
        if (lower.includes('meeting') || lower.includes('interview') || lower.includes('appointment') || lower.includes('call'))
          return { text: item, type: 'event', priority: 'high', icon: '📅' };
        if (lower.includes('learn') || lower.includes('become') || lower.includes('improve') || lower.includes('goal'))
          return { text: item, type: 'goal', priority: 'medium', icon: '🎯' };
        if (lower.includes('buy') || lower.includes('groceries') || lower.includes('shop') || lower.includes('pay'))
          return { text: item, type: 'task', priority: 'low', icon: '📝' };
        return { text: item, type: 'task', priority: 'medium', icon: '📝' };
      });
      setResults(parsed);
      setIsProcessing(false);
    }, 2000);
  };

  const saveAll = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="braindump-page">
      <div className="page-header">
        <div>
          <h2>🧠 <span className="gradient-text">Brain Dump</span></h2>
          <p>Dump everything from your mind. AI instantly organizes it into tasks, goals, events, and habits.</p>
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
            placeholder="Exam next week, buy groceries, gym tomorrow, project deadline friday, learn python, meeting with professor, pay electricity bill, meditate daily, interview prep..."
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
            <div className="process-arrow">→</div>
            <div className="process-node ai-node">
              <span className="ai-avatar-inner" style={{ width: 32, height: 32 }}></span>
              <p>AI Processing</p>
            </div>
            <div className="process-arrow">→</div>
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
            <button className={`btn-primary btn-sm ${saved ? 'saved' : ''}`} onClick={saveAll}>
              {saved ? '✓ Saved!' : '💾 Save All'}
            </button>
          </div>

          <div className="results-grid">
            {['task', 'event', 'goal', 'habit'].map(type => {
              const items = results.filter(r => r.type === type);
              if (items.length === 0) return null;
              return (
                <div key={type} className={`result-group widget result-${type}`}>
                  <h4 className="result-group-title">
                    {type === 'task' ? '📝 Tasks' : type === 'event' ? '📅 Calendar Events' : type === 'goal' ? '🎯 Goals' : '🔄 Habits'}
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
          <h4>💡 Example</h4>
          <div className="example-flow">
            <div className="example-input">
              <p className="example-label">You type:</p>
              <p className="example-text">"Exam, groceries, project, interview, gym"</p>
            </div>
            <div className="example-arrow">✨ AI Magic ✨</div>
            <div className="example-output">
              <p className="example-label">AI creates:</p>
              <div className="example-items">
                <span className="example-tag tag-task">📝 Exam Prep — Task</span>
                <span className="example-tag tag-task">📝 Buy Groceries — Task</span>
                <span className="example-tag tag-task">📝 Project Work — Task</span>
                <span className="example-tag tag-event">📅 Interview — Event</span>
                <span className="example-tag tag-habit">🔄 Gym — Habit</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
