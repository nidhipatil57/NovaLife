import { useState } from 'react';
import { useTasks, type Task } from '../hooks/useTasks';
import './TasksPage.css';

const priorityConfig = {
  critical: { label: '🔥 Critical', color: 'var(--accent-red)', bg: 'rgba(239,68,68,0.1)' },
  high: { label: '⚡ High', color: 'var(--accent-orange)', bg: 'rgba(245,158,11,0.1)' },
  medium: { label: '📌 Medium', color: 'var(--accent-blue)', bg: 'rgba(59,130,246,0.1)' },
  low: { label: '💤 Low', color: 'var(--accent-green)', bg: 'rgba(16,185,129,0.1)' },
};

const categories = ['Academic', 'Work', 'Health', 'Personal', 'Career', 'Finance', 'General'];

export default function TasksPage() {
  const { tasks, loading, user, addTask, toggleTask, deleteTask } = useTasks();
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'ai'>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Add Task Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newText, setNewText] = useState('');
  const [newPriority, setNewPriority] = useState<Task['priority']>('medium');
  const [newCategory, setNewCategory] = useState('General');
  const [newDue, setNewDue] = useState('Today');
  const [newSubtaskInput, setNewSubtaskInput] = useState('');

  const handleToggleTask = async (id: string, currentDone: boolean) => {
    try {
      await toggleTask(id, !currentDone);
    } catch (err) {
      alert('Failed to update task.');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    try {
      const subtasks = newSubtaskInput
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      // Estimate a random risk score for demo/AI purposes if it is critical/high
      const risk = newPriority === 'critical' ? 85 : newPriority === 'high' ? 60 : undefined;

      await addTask({
        text: newText,
        done: false,
        priority: newPriority,
        category: newCategory,
        due: newDue,
        subtasks: subtasks.length > 0 ? subtasks : undefined,
        risk,
        aiGenerated: false,
      });

      // Reset Form
      setNewText('');
      setNewPriority('medium');
      setNewCategory('General');
      setNewDue('Today');
      setNewSubtaskInput('');
      setShowAddModal(false);
    } catch (err) {
      alert('Failed to create task.');
    }
  };

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

  if (!user) {
    return (
      <div className="tasks-page" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex', minHeight: '60vh' }}>
        <div className="widget glass-card-static" style={{ padding: '40px', textAlign: 'center', maxWidth: '480px' }}>
          <h3>🔒 Authentication Required</h3>
          <p style={{ marginTop: '12px', marginBottom: '24px' }}>Please log in using Google or email on the login page to manage your personal tasks.</p>
        </div>
      </div>
    );
  }

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
          <button className="btn-primary btn-sm" onClick={() => setShowAddModal(true)}>+ New Task</button>
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

      {loading ? (
        <div className="loading-state" style={{ textAlign: 'center', padding: '60px' }}>
          <div className="ai-onboard-avatar" style={{ margin: '0 auto 20px auto', width: '40px', height: '40px' }}></div>
          <p>Synchronizing with Firestore Database...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state widget glass-card-static" style={{ textAlign: 'center', padding: '50px 30px', margin: '20px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <h4>No Tasks Found</h4>
          <p style={{ maxWidth: '400px', margin: '10px auto 24px auto', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Your cloud database is empty. Click "+ Add New Task" to start organizing your life!
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button className="btn-primary btn-sm" onClick={() => setShowAddModal(true)}>+ Add New Task</button>
          </div>
        </div>
      ) : view === 'kanban' ? (
        /* Kanban Board View */
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
              <div className="task-check-lg" onClick={(e) => { e.stopPropagation(); handleToggleTask(task.id, task.done); }}>
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
                  {task.subtasks && task.subtasks.length > 0 && <span className="task-subtask-count">{task.subtasks.length} subtasks</span>}
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
            {selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
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
            
            {/* Delete button */}
            <div style={{ marginTop: '30px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                className="btn-secondary btn-sm" 
                style={{ borderColor: 'var(--accent-red)', color: 'var(--accent-red)', background: 'rgba(239,68,68,0.05)' }}
                onClick={() => {
                  deleteTask(selectedTask.id);
                  setSelectedTask(null);
                }}
              >
                🗑️ Delete Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal Overlay */}
      {showAddModal && (
        <div className="task-detail-overlay" onClick={() => setShowAddModal(false)}>
          <div className="task-detail-panel widget" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <button className="detail-close" onClick={() => setShowAddModal(false)}>✕</button>
            <div className="detail-header" style={{ marginBottom: '24px' }}>
              <h3>Create New Task</h3>
              <p>Add a task to your Cloud Firestore database</p>
            </div>
            
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Task Name</label>
                <input 
                  type="text" 
                  value={newText} 
                  onChange={e => setNewText(e.target.value)}
                  placeholder="e.g. Finish Physics Lab Report" 
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
                  <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Priority</label>
                  <select 
                    value={newPriority} 
                    onChange={e => setNewPriority(e.target.value as Task['priority'])}
                    style={{
                      padding: '12px',
                      background: '#0E1628',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-md)',
                      color: 'white',
                      outline: 'none'
                    }}
                  >
                    <option value="low">💤 Low</option>
                    <option value="medium">📌 Medium</option>
                    <option value="high">⚡ High</option>
                    <option value="critical">🔥 Critical</option>
                  </select>
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Category</label>
                  <select 
                    value={newCategory} 
                    onChange={e => setNewCategory(e.target.value)}
                    style={{
                      padding: '12px',
                      background: '#0E1628',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-md)',
                      color: 'white',
                      outline: 'none'
                    }}
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Due Date description</label>
                <input 
                  type="text" 
                  value={newDue} 
                  onChange={e => setNewDue(e.target.value)}
                  placeholder="e.g. Today, 11:59 PM or Tomorrow" 
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

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Subtasks (comma-separated)</label>
                <input 
                  type="text" 
                  value={newSubtaskInput} 
                  onChange={e => setNewSubtaskInput(e.target.value)}
                  placeholder="e.g. Chapter 3 Exercises, Chapter 4 Exercises"
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

              <button type="submit" className="btn-primary" style={{ marginTop: '12px', padding: '14px' }}>
                Create Task
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
