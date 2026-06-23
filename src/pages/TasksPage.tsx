import { useState } from 'react';
import './TasksPage.css';

type Task = {
  id: number; text: string; done: boolean; priority: 'critical' | 'high' | 'medium' | 'low';
  due: string; category: string; subtasks?: string[]; risk?: number; aiGenerated?: boolean;
};

const initialTasks: Task[] = [
  { id: 1, text: 'Complete Physics Assignment', done: false, priority: 'critical', due: 'Today, 11:59 PM', category: 'Academic', subtasks: ['Chapter 5 Problems', 'Lab Report Section', 'Review Formulas'], risk: 90 },
  { id: 2, text: 'Team Meeting Prep', done: false, priority: 'high', due: 'Today, 4:00 PM', category: 'Work', subtasks: ['Review agenda', 'Prepare slides'] },
  { id: 3, text: 'Study for Math Test', done: false, priority: 'high', due: 'Tomorrow, 9:00 AM', category: 'Academic', subtasks: ['Chapter 3', 'Chapter 4', 'Practice problems'], risk: 65 },
  { id: 4, text: 'Reply to Prof. Email', done: true, priority: 'low', due: 'Done', category: 'Academic' },
  { id: 5, text: 'Gym Session', done: false, priority: 'medium', due: 'Today, 7:00 PM', category: 'Health' },
  { id: 6, text: 'Project Presentation', done: false, priority: 'medium', due: 'Wednesday', category: 'Work', subtasks: ['Create slides', 'Practice delivery', 'Prepare Q&A'] },
  { id: 7, text: 'Chapter 1 Revision', done: false, priority: 'high', due: 'Thursday', category: 'Academic', aiGenerated: true },
  { id: 8, text: 'Mock Test — Physics', done: false, priority: 'medium', due: 'Friday', category: 'Academic', aiGenerated: true },
  { id: 9, text: 'Buy Groceries', done: false, priority: 'low', due: 'Saturday', category: 'Personal' },
  { id: 10, text: 'Update Resume', done: true, priority: 'medium', due: 'Done', category: 'Career' },
];

const priorityConfig = {
  critical: { label: '🔥 Critical', color: 'var(--accent-red)', bg: 'rgba(239,68,68,0.1)' },
  high: { label: '⚡ High', color: 'var(--accent-orange)', bg: 'rgba(245,158,11,0.1)' },
  medium: { label: '📌 Medium', color: 'var(--accent-blue)', bg: 'rgba(59,130,246,0.1)' },
  low: { label: '💤 Low', color: 'var(--accent-green)', bg: 'rgba(16,185,129,0.1)' },
};

export default function TasksPage() {
  const [tasks, setTasks] = useState(initialTasks);
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'ai'>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const toggleTask = (id: number) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));

  const filteredTasks = tasks.filter(t => {
    if (filter === 'active') return !t.done;
    if (filter === 'completed') return t.done;
    if (filter === 'ai') return t.aiGenerated;
    return true;
  });

  const kanbanGroups = {
    critical: filteredTasks.filter(t => t.priority === 'critical' && !t.done),
    high: filteredTasks.filter(t => t.priority === 'high' && !t.done),
    medium: filteredTasks.filter(t => t.priority === 'medium' && !t.done),
    low: filteredTasks.filter(t => t.priority === 'low' && !t.done),
  };

  return (
    <div className="tasks-page">
      <div className="page-header">
        <div>
          <h2>✅ <span className="gradient-text">Tasks</span></h2>
          <p>AI-powered task management — organized, prioritized, and always on track.</p>
        </div>
        <div className="page-header-actions">
          <div className="view-toggle">
            <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>☰ List</button>
            <button className={view === 'kanban' ? 'active' : ''} onClick={() => setView('kanban')}>▦ Board</button>
          </div>
          <button className="btn-primary btn-sm">+ New Task</button>
        </div>
      </div>

      {/* Filters */}
      <div className="task-filters">
        {(['all', 'active', 'completed', 'ai'] as const).map(f => (
          <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? '📋 All' : f === 'active' ? '⚡ Active' : f === 'completed' ? '✅ Completed' : '🤖 AI Generated'}
            <span className="filter-count">
              {f === 'all' ? tasks.length : f === 'active' ? tasks.filter(t => !t.done).length :
                f === 'completed' ? tasks.filter(t => t.done).length : tasks.filter(t => t.aiGenerated).length}
            </span>
          </button>
        ))}
      </div>

      {/* Kanban View */}
      {view === 'kanban' ? (
        <div className="kanban-board">
          {(Object.keys(kanbanGroups) as Array<keyof typeof kanbanGroups>).map(priority => (
            <div key={priority} className="kanban-column">
              <div className="kanban-header" style={{ borderColor: priorityConfig[priority].color }}>
                <span>{priorityConfig[priority].label}</span>
                <span className="kanban-count">{kanbanGroups[priority].length}</span>
              </div>
              <div className="kanban-cards">
                {kanbanGroups[priority].map(task => (
                  <div key={task.id} className="kanban-card widget" onClick={() => setSelectedTask(task)}>
                    <div className="kanban-card-top">
                      <span className="kanban-category">{task.category}</span>
                      {task.risk && task.risk > 70 && <span className="kanban-risk">🚨 {task.risk}%</span>}
                    </div>
                    <p className="kanban-task-text">{task.text}</p>
                    <span className="kanban-due">{task.due}</span>
                    {task.aiGenerated && <span className="ai-badge-sm">🤖 AI</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="task-list-full">
          {filteredTasks.map(task => (
            <div key={task.id} className={`task-list-item widget ${task.done ? 'task-done' : ''}`} onClick={() => setSelectedTask(task)}>
              <div className="task-check-lg" onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}>
                <div className={`check-circle ${task.done ? 'checked' : ''}`}>{task.done && '✓'}</div>
              </div>
              <div className="task-main-info">
                <div className="task-title-row">
                  <span className="task-title">{task.text}</span>
                  {task.aiGenerated && <span className="ai-badge-sm">🤖 AI</span>}
                </div>
                <div className="task-meta">
                  <span className="task-category-tag">{task.category}</span>
                  <span className="task-due-tag">{task.due}</span>
                  {task.subtasks && <span className="task-subtask-count">{task.subtasks.length} subtasks</span>}
                </div>
              </div>
              <div className="task-right">
                <span className="priority-badge" style={{ color: priorityConfig[task.priority].color, background: priorityConfig[task.priority].bg }}>
                  {priorityConfig[task.priority].label}
                </span>
                {task.risk && task.risk > 50 && (
                  <div className="risk-indicator">
                    <div className="risk-bar" style={{ width: `${task.risk}%`, background: task.risk > 70 ? 'var(--accent-red)' : 'var(--accent-orange)' }}></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Detail Panel */}
      {selectedTask && (
        <div className="task-detail-overlay" onClick={() => setSelectedTask(null)}>
          <div className="task-detail-panel widget" onClick={e => e.stopPropagation()}>
            <button className="detail-close" onClick={() => setSelectedTask(null)}>✕</button>
            <div className="detail-header">
              <span className="priority-badge" style={{ color: priorityConfig[selectedTask.priority].color, background: priorityConfig[selectedTask.priority].bg }}>
                {priorityConfig[selectedTask.priority].label}
              </span>
              <h3>{selectedTask.text}</h3>
              <div className="detail-meta">
                <span>📁 {selectedTask.category}</span>
                <span>📅 {selectedTask.due}</span>
              </div>
            </div>
            {selectedTask.subtasks && (
              <div className="detail-section">
                <h5>Subtasks</h5>
                <div className="subtask-list">
                  {selectedTask.subtasks.map((st, i) => (
                    <div key={i} className="subtask-item">
                      <div className="subtask-check"></div>
                      <span>{st}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedTask.risk && (
              <div className="detail-section">
                <h5>Risk Assessment</h5>
                <div className="risk-meter">
                  <div className="risk-meter-fill" style={{
                    width: `${selectedTask.risk}%`,
                    background: selectedTask.risk > 70 ? 'var(--accent-red)' : selectedTask.risk > 40 ? 'var(--accent-orange)' : 'var(--accent-green)'
                  }}></div>
                </div>
                <p className="risk-text">
                  {selectedTask.risk > 70 ? '🚨 High risk — immediate action needed' :
                    selectedTask.risk > 40 ? '⚠️ Moderate risk — plan your time carefully' : '✅ On track'}
                </p>
              </div>
            )}
            <div className="detail-section">
              <h5>AI Recommendation</h5>
              <div className="detail-ai-rec">
                <div className="ai-avatar-inner" style={{ width: 24, height: 24 }}></div>
                <p>Start this task now during your peak focus window (2-4 PM). Estimated completion: 2 hours. Break into 25-min sprints with 5-min breaks.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
