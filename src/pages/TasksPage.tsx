import { useState, useEffect, useRef } from 'react';
import { useTasks, type Task } from '../hooks/useTasks';
import './TasksPage.css';

const priorityConfig = {
  critical: { label: '🔥 Critical', color: 'var(--accent-red)', bg: 'rgba(239,68,68,0.1)' },
  high: { label: '⚡ High', color: 'var(--accent-orange)', bg: 'rgba(245,158,11,0.1)' },
  medium: { label: '📌 Medium', color: 'var(--accent-blue)', bg: 'rgba(59,130,246,0.1)' },
  low: { label: '💤 Low', color: 'var(--accent-green)', bg: 'rgba(16,185,129,0.1)' },
};

const categories = ['Academic', 'Work', 'Health', 'Personal', 'Career', 'Finance', 'General'];

const categoryColors: Record<string, string> = {
  Academic: 'var(--accent-purple)',
  Work: 'var(--accent-blue)',
  Health: 'var(--accent-green)',
  Personal: 'var(--accent-orange)',
  Career: 'var(--accent-cyan-light)',
  Finance: 'var(--accent-orange)',
  General: 'var(--text-secondary)',
};

const formatTimeAgo = (isoString: string) => {
  if (!isoString) return 'some time ago';
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return 'yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

interface Option {
  value: string;
  label: string;
}

function CustomSelect({ 
  value, 
  onChange, 
  options 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  options: Option[]; 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className="custom-dropdown-container" ref={containerRef}>
      <div className="custom-dropdown-trigger" onClick={() => setIsOpen(!isOpen)}>
        <span>{selectedOption.label}</span>
        <span className="dropdown-arrow" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
      </div>
      {isOpen && (
        <div className="custom-dropdown-menu">
          {options.map(opt => (
            <div 
              key={opt.value} 
              className={`custom-dropdown-item ${opt.value === value ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TasksPage() {
  const { tasks, loading, user, addTask, toggleTask, deleteTask, updateTask } = useTasks();
  
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [filter, setFilter] = useState<'all' | 'active' | 'ai-generated' | 'completed'>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Multi-Select Task States
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const handleCardClick = (task: Task) => {
    if (isSelectionMode) {
      if (selectedTaskIds.includes(task.id)) {
        setSelectedTaskIds(prev => prev.filter(id => id !== task.id));
      } else {
        setSelectedTaskIds(prev => [...prev, task.id]);
      }
    } else {
      setSelectedTask(task);
    }
  };
  
  // Add Task Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newText, setNewText] = useState('');
  const [newPriority, setNewPriority] = useState<Task['priority']>('medium');
  const [newCategory, setNewCategory] = useState('General');
  const [newDue, setNewDue] = useState('');
  const [newSubtaskInput, setNewSubtaskInput] = useState('');

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info' | 'warning'>('success');
  const showToast = (msg: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 4000);
  };

  // Delete Confirmation Modal State
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  // Active sync selected task
  const activeTask = selectedTask ? (tasks.find(t => t.id === selectedTask.id) || selectedTask) : null;

  // Detail Panel Tabs
  const [activeTab, setActiveTab] = useState<'subtasks' | 'timer' | 'notes' | 'activity'>('subtasks');

  // Detail Panel Snooze Dropdown
  const [showSnoozeDropdown, setShowSnoozeDropdown] = useState(false);
  const [customSnoozeDate, setCustomSnoozeDate] = useState('');

  // Detail Panel Inline Editor
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDue, setEditDue] = useState('');
  const [editPriority, setEditPriority] = useState<Task['priority']>('medium');

  // Subtasks Sub-State
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Timer Sub-State
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerIsRunning, setTimerIsRunning] = useState(false);
  const [timerIntervalId, setTimerIntervalId] = useState<number | null>(null);
  const [studySessionName, setStudySessionName] = useState('');
  const [showSaveSessionBox, setShowSaveSessionBox] = useState(false);

  // Notes Sub-State
  const [notesText, setNotesText] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [lastSavedNotes, setLastSavedNotes] = useState('');
  const [notesList, setNotesList] = useState<{ id: string; name: string; content: string; updatedAt: string }[]>([]);
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const [showSaveNoteBox, setShowSaveNoteBox] = useState(false);
  const [newNoteName, setNewNoteName] = useState('');
  const [notesViewMode, setNotesViewMode] = useState<'editor' | 'list'>('editor');
  const editorRef = useRef<HTMLDivElement>(null);

  // Rename Note Modal States
  const [showRenameNoteModal, setShowRenameNoteModal] = useState(false);
  const [renameNoteId, setRenameNoteId] = useState<string | null>(null);
  const [renameNoteName, setRenameNoteName] = useState('');

  // Delete Note Modal States
  const [showDeleteNoteModal, setShowDeleteNoteModal] = useState(false);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [deleteNoteName, setDeleteNoteName] = useState('');

  // Audio chirp synthesized locally
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      gain1.gain.setValueAtTime(0.1, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.2);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.15);
      gain2.gain.setValueAtTime(0.1, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();
      osc2.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn('AudioContext failed:', e);
    }
  };

  // Timer Cleanups
  useEffect(() => {
    return () => {
      if (timerIntervalId) clearInterval(timerIntervalId);
    };
  }, [timerIntervalId]);

  useEffect(() => {
    // Reset timer, tab and snooze dropdown when details panel closes or changes task
    setActiveTab('subtasks');
    setShowSnoozeDropdown(false);
    setTimerMinutes(0);
    setTimerSeconds(0);
    setTimerIsRunning(false);
    setShowSaveSessionBox(false);
    setStudySessionName('');
    if (timerIntervalId) {
      clearInterval(timerIntervalId);
      setTimerIntervalId(null);
    }
  }, [activeTask?.id]);

  // Notes Initializer & Debounce
  useEffect(() => {
    if (activeTask) {
      let parsed: { id: string; name: string; content: string; updatedAt: string }[] = [];
      try {
        if (activeTask.notes) {
          const json = JSON.parse(activeTask.notes);
          if (Array.isArray(json)) {
            parsed = json;
          } else {
            parsed = [{ id: 'default', name: 'Default Note', content: activeTask.notes, updatedAt: new Date().toISOString() }];
          }
        }
      } catch (e) {
        parsed = [{ id: 'default', name: 'Default Note', content: activeTask.notes || '', updatedAt: new Date().toISOString() }];
      }
      setNotesList(parsed);
      setShowSaveNoteBox(false);
      setNotesViewMode('editor');

      if (parsed.length > 0) {
        const defaultNote = parsed[0];
        setCurrentNoteId(defaultNote.id);
        setNotesText(defaultNote.content);
        setLastSavedNotes(defaultNote.content);
        if (editorRef.current) {
          editorRef.current.innerHTML = defaultNote.content;
        }
      } else {
        setCurrentNoteId(null);
        setNotesText('');
        setLastSavedNotes('');
        if (editorRef.current) {
          editorRef.current.innerHTML = '';
        }
      }
    }
  }, [activeTask?.id]);

  useEffect(() => {
    if (!activeTask || !currentNoteId || currentNoteId === 'new') return;
    if (notesText === lastSavedNotes) return;

    const delayDebounceId = setTimeout(async () => {
      await saveNotes(notesText);
    }, 1500);

    return () => clearTimeout(delayDebounceId);
  }, [notesText, currentNoteId]);

  useEffect(() => {
    if (notesViewMode === 'editor' && editorRef.current) {
      if (editorRef.current.innerHTML !== notesText) {
        editorRef.current.innerHTML = notesText;
      }
    }
  }, [notesViewMode, currentNoteId, activeTab, notesText]);

  const saveNotes = async (text: string, manual: boolean = false) => {
    if (!activeTask || !currentNoteId || currentNoteId === 'new') return;

    const currentNoteIndex = notesList.findIndex(n => n.id === currentNoteId);
    if (currentNoteIndex === -1) return;
    if (notesList[currentNoteIndex].content === text && !manual) return;

    setSavingNotes(true);
    try {
      const updatedList = [...notesList];
      updatedList[currentNoteIndex] = {
        ...updatedList[currentNoteIndex],
        content: text,
        updatedAt: new Date().toISOString()
      };

      const recentLogs = activeTask.activityLog || [];
      let newActivity = [...recentLogs];
      
      const now = new Date();
      let shouldLog = true;
      const lastNoteLog = recentLogs.slice().reverse().find(l => l.action.includes('updated'));
      if (lastNoteLog) {
        const diff = now.getTime() - new Date(lastNoteLog.timestamp).getTime();
        if (diff < 10000) {
          shouldLog = false;
        }
      }

      if (shouldLog) {
        newActivity.push({ 
          action: `Note "${updatedList[currentNoteIndex].name}" updated`, 
          timestamp: now.toISOString() 
        });
      }

      await updateTask(activeTask.id, {
        notes: JSON.stringify(updatedList),
        activityLog: newActivity
      });
      setNotesList(updatedList);
      setLastSavedNotes(text);
      if (manual) {
        showToast('Notes saved successfully', 'success');
      }
    } catch (err) {
      console.error('Failed to save notes:', err);
      showToast('Failed to save notes', 'warning');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleSaveNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask || !newNoteName.trim()) return;

    const editorContent = editorRef.current ? editorRef.current.innerHTML : notesText;
    const now = new Date().toISOString();

    let updatedList = [...notesList];

    if (currentNoteId && currentNoteId !== 'new') {
      // update existing name/content
      updatedList = updatedList.map(n => 
        n.id === currentNoteId ? { ...n, name: newNoteName.trim(), content: editorContent, updatedAt: now } : n
      );
    } else {
      // create new note
      const newId = 'note_' + Date.now();
      updatedList.push({
        id: newId,
        name: newNoteName.trim(),
        content: editorContent,
        updatedAt: now
      });
    }

    try {
      setSavingNotes(true);
      await updateTask(activeTask.id, {
        notes: JSON.stringify(updatedList),
        activityLog: [
          ...(activeTask.activityLog || []),
          { action: `Note "${newNoteName.trim()}" saved`, timestamp: now }
        ]
      });
      setNotesList(updatedList);
      
      // Reset editor to new note
      setCurrentNoteId('new');
      setNotesText('');
      setLastSavedNotes('');
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }

      setNotesViewMode('list');
      setShowSaveNoteBox(false);
      showToast(`Saved Note: "${newNoteName.trim()}"`, 'success');
    } catch (err) {
      showToast('Failed to save note', 'warning');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDirectSave = async (editorContent: string) => {
    if (!activeTask || !currentNoteId || currentNoteId === 'new') return;
    
    const currentNoteIndex = notesList.findIndex(n => n.id === currentNoteId);
    if (currentNoteIndex === -1) return;

    setSavingNotes(true);
    try {
      const updatedList = [...notesList];
      const noteName = updatedList[currentNoteIndex].name;
      updatedList[currentNoteIndex] = {
        ...updatedList[currentNoteIndex],
        content: editorContent,
        updatedAt: new Date().toISOString()
      };

      await updateTask(activeTask.id, {
        notes: JSON.stringify(updatedList),
        activityLog: [
          ...(activeTask.activityLog || []),
          { action: `Note "${noteName}" changes saved`, timestamp: new Date().toISOString() }
        ]
      });
      setNotesList(updatedList);
      
      // Reset editor to new note
      setCurrentNoteId('new');
      setNotesText('');
      setLastSavedNotes('');
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }

      setNotesViewMode('list');
      showToast(`Saved Note: "${noteName}"`, 'success');
    } catch (err) {
      showToast('Failed to save note changes', 'warning');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleRenameNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask || !renameNoteId || !renameNoteName.trim()) return;

    const updatedList = notesList.map(n => 
      n.id === renameNoteId ? { ...n, name: renameNoteName.trim(), updatedAt: new Date().toISOString() } : n
    );
    try {
      setSavingNotes(true);
      await updateTask(activeTask.id, {
        notes: JSON.stringify(updatedList)
      });
      setNotesList(updatedList);
      setShowRenameNoteModal(false);
      showToast(`Renamed note to "${renameNoteName.trim()}"`, 'success');
    } catch (err) {
      showToast('Failed to rename note', 'warning');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDeleteNoteConfirm = async () => {
    if (!activeTask || !deleteNoteId) return;

    const updatedList = notesList.filter(n => n.id !== deleteNoteId);
    try {
      setSavingNotes(true);
      await updateTask(activeTask.id, {
        notes: JSON.stringify(updatedList)
      });
      setNotesList(updatedList);
      if (currentNoteId === deleteNoteId) {
        setCurrentNoteId('new');
        setNotesText('');
        setLastSavedNotes('');
        if (editorRef.current) {
          editorRef.current.innerHTML = '';
        }
      }
      setShowDeleteNoteModal(false);
      showToast('Note deleted successfully', 'success');
    } catch (err) {
      showToast('Failed to delete note', 'warning');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      setNotesText(editorRef.current.innerHTML);
    }
  };


  // Normalizing Subtasks
  const subtasksList = activeTask?.subtasks || [];
  const normalizedSubtasks: { text: string; done: boolean }[] = subtasksList.map(st => 
    typeof st === 'string' ? { text: st, done: false } : st
  );

  const totalSubtasks = normalizedSubtasks.length;
  const completedSubtasks = normalizedSubtasks.filter(st => st.done).length;
  const percentComplete = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const [completingTaskIds, setCompletingTaskIds] = useState<string[]>([]);

  const handleToggleTask = async (id: string, currentDone: boolean) => {
    if (!currentDone) {
      // Marking complete: trigger animation
      setCompletingTaskIds(prev => [...prev, id]);
      showToast('Task completed successfully', 'success');

      setTimeout(async () => {
        try {
          await toggleTask(id, true);
        } catch (err) {
          showToast('Failed to update task.', 'warning');
        } finally {
          setCompletingTaskIds(prev => prev.filter(taskId => taskId !== id));
        }
      }, 550); // Match animation duration
    } else {
      // Marking incomplete
      try {
        await toggleTask(id, false);
        showToast('Task marked active', 'success');
      } catch (err) {
        showToast('Failed to update task.', 'warning');
      }
    }
  };

  const formatDueForSave = (dateTimeStr: string) => {
    if (!dateTimeStr) return 'Today';
    try {
      const d = new Date(dateTimeStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateTimeStr;
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    try {
      const subtasks = newSubtaskInput
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .map(s => ({ text: s, done: false }));

      const risk = newPriority === 'critical' ? 85 : newPriority === 'high' ? 60 : 20;

      await addTask({
        text: newText,
        done: false,
        priority: newPriority,
        category: newCategory,
        due: formatDueForSave(newDue),
        subtasks: subtasks.length > 0 ? (subtasks as any) : undefined,
        risk,
        aiGenerated: false,
        notes: '',
        sessionsCount: 0,
        activityLog: [{ action: 'Task created', timestamp: new Date().toISOString() }]
      });

      setNewText('');
      setNewPriority('medium');
      setNewCategory('General');
      setNewDue('');
      setNewSubtaskInput('');
      setShowAddModal(false);
      showToast('Task created successfully', 'success');
    } catch (err) {
      showToast('Failed to create task.', 'warning');
    }
  };

  // Subtasks Editing
  const handleToggleSubtask = async (index: number) => {
    if (!activeTask) return;
    const newSubtasks = [...normalizedSubtasks];
    newSubtasks[index].done = !newSubtasks[index].done;

    const newActivity = [
      ...(activeTask.activityLog || []),
      { 
        action: `Subtask '${newSubtasks[index].text}' marked as ${newSubtasks[index].done ? 'completed' : 'incomplete'}`, 
        timestamp: new Date().toISOString() 
      }
    ];

    await updateTask(activeTask.id, {
      subtasks: newSubtasks as any,
      activityLog: newActivity
    });
  };

  const handleAddSubtaskInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask || !newSubtaskText.trim()) return;

    const newSubtasks = [...normalizedSubtasks, { text: newSubtaskText.trim(), done: false }];
    const newActivity = [
      ...(activeTask.activityLog || []),
      { action: `Subtask '${newSubtaskText.trim()}' added`, timestamp: new Date().toISOString() }
    ];

    await updateTask(activeTask.id, {
      subtasks: newSubtasks as any,
      activityLog: newActivity
    });

    setNewSubtaskText('');
  };

  const handleDeleteSubtask = async (index: number) => {
    if (!activeTask) return;
    const subtaskToDelete = normalizedSubtasks[index];
    const newSubtasks = normalizedSubtasks.filter((_, i) => i !== index);

    const newActivity = [
      ...(activeTask.activityLog || []),
      { action: `Subtask '${subtaskToDelete.text}' deleted`, timestamp: new Date().toISOString() }
    ];

    await updateTask(activeTask.id, {
      subtasks: newSubtasks as any,
      activityLog: newActivity
    });
  };

  const handleReorderArrows = async (index: number, direction: 'up' | 'down') => {
    if (!activeTask) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= normalizedSubtasks.length) return;

    const newSubtasks = [...normalizedSubtasks];
    const [moved] = newSubtasks.splice(index, 1);
    newSubtasks.splice(targetIndex, 0, moved);

    await updateTask(activeTask.id, {
      subtasks: newSubtasks as any
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (_e: React.DragEvent, targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex || !activeTask) return;
    
    const newSubtasks = [...normalizedSubtasks];
    const [draggedItem] = newSubtasks.splice(draggedIndex, 1);
    newSubtasks.splice(targetIndex, 0, draggedItem);
    
    setDraggedIndex(null);

    await updateTask(activeTask.id, {
      subtasks: newSubtasks as any
    });
  };

  // Timer Countdown Handlers (Stopwatch / Count up style)
  const startTimerInterval = () => {
    setTimerIsRunning(true);
    const interval = window.setInterval(() => {
      setTimerSeconds(prevSec => {
        if (prevSec === 59) {
          setTimerMinutes(prevMin => prevMin + 1);
          return 0;
        }
        return prevSec + 1;
      });
    }, 1000);
    setTimerIntervalId(interval);
  };

  const handleStartTimer = () => {
    if (timerIsRunning) {
      setTimerIsRunning(false);
      if (timerIntervalId) {
        clearInterval(timerIntervalId);
        setTimerIntervalId(null);
      }
    } else {
      startTimerInterval();
    }
  };

  const handleResetTimer = () => {
    setTimerIsRunning(false);
    if (timerIntervalId) {
      clearInterval(timerIntervalId);
      setTimerIntervalId(null);
    }
    setTimerMinutes(0);
    setTimerSeconds(0);
    setShowSaveSessionBox(false);
    setStudySessionName('');
  };

  const handleFinishSessionClick = () => {
    // Pause the timer first
    setTimerIsRunning(false);
    if (timerIntervalId) {
      clearInterval(timerIntervalId);
      setTimerIntervalId(null);
    }
    setShowSaveSessionBox(true);
  };

  const formatTimeStudied = (mins: number, secs: number) => {
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hrs > 0) {
      return `${hrs}h ${remainingMins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const handleSaveStudySession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask || !studySessionName.trim()) return;

    playBeep();
    const durationText = formatTimeStudied(timerMinutes, timerSeconds);
    const newSessionsCount = (activeTask.sessionsCount || 0) + 1;
    const newActivity = [
      ...(activeTask.activityLog || []),
      { 
        action: `Study Session completed: "${studySessionName.trim()}" (Duration: ${durationText})`, 
        timestamp: new Date().toISOString() 
      }
    ];

    try {
      await updateTask(activeTask.id, {
        sessionsCount: newSessionsCount,
        activityLog: newActivity
      });
      showToast(`Saved Study Session: "${studySessionName.trim()}"`, 'success');
      
      // Reset timer state after successful save
      setTimerMinutes(0);
      setTimerSeconds(0);
      setStudySessionName('');
      setShowSaveSessionBox(false);
    } catch (err) {
      showToast('Failed to save study session', 'warning');
    }
  };

  // Snooze handlers
  const handleSnooze = async (newDueDate: string) => {
    if (!activeTask) return;
    const newActivity = [
      ...(activeTask.activityLog || []),
      { action: `Deadline rescheduled to: ${newDueDate}`, timestamp: new Date().toISOString() }
    ];
    try {
      await updateTask(activeTask.id, {
        due: newDueDate,
        activityLog: newActivity
      });
      setShowSnoozeDropdown(false);
      showToast(`Task rescheduled to ${newDueDate}`, 'success');
    } catch (err) {
      showToast('Failed to reschedule task', 'warning');
    }
  };

  const handleCustomSnoozeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSnoozeDate) return;
    const d = new Date(customSnoozeDate);
    const formatted = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    handleSnooze(formatted);
    setCustomSnoozeDate('');
  };

  // Header Inline Editor
  const startEditingHeader = () => {
    if (!activeTask) return;
    setEditTitle(activeTask.text);
    setEditCategory(activeTask.category);
    setEditDue(activeTask.due);
    setEditPriority(activeTask.priority);
    setIsEditingHeader(true);
  };

  const saveHeaderEdits = async () => {
    if (!activeTask || !editTitle.trim()) return;

    const changes: string[] = [];
    if (editTitle !== activeTask.text) changes.push('title updated');
    if (editCategory !== activeTask.category) changes.push(`category set to ${editCategory}`);
    if (editPriority !== activeTask.priority) changes.push(`priority set to ${editPriority}`);
    if (editDue !== activeTask.due) changes.push(`deadline updated to ${editDue}`);

    let newActivity = [...(activeTask.activityLog || [])];
    if (changes.length > 0) {
      newActivity.push({
        action: `Task updated: ${changes.join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }

    await updateTask(activeTask.id, {
      text: editTitle,
      category: editCategory,
      priority: editPriority,
      due: editDue,
      activityLog: newActivity
    });

    setIsEditingHeader(false);
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'active') {
      return !t.done || completingTaskIds.includes(t.id);
    }
    if (filter === 'ai-generated') {
      return (!t.done || completingTaskIds.includes(t.id)) && !!t.aiGenerated;
    }
    if (filter === 'completed') {
      return t.done;
    }
    if (filter === 'all') {
      return !t.done || completingTaskIds.includes(t.id);
    }
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
          <p>Task management — organized, prioritized, and always on track.</p>
        </div>
        <div className="page-header-actions">
          <div className="view-toggle">
            <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>🎴 Cards</button>
            <button className={view === 'kanban' ? 'active' : ''} onClick={() => setView('kanban')}>▦ Board</button>
          </div>
          <button className="btn-primary btn-sm" onClick={() => setShowAddModal(true)}>+ New Task</button>
        </div>
      </div>

      {/* Filters & Actions Row */}
      <div className="task-filters" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '16px', flexWrap: 'wrap' }}>
        <div className="filter-buttons-left" style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          {(['all', 'active', 'ai-generated', 'completed'] as const).map(f => (
            <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? '📋 All' : f === 'active' ? '⚡ Active' : f === 'ai-generated' ? '🤖 AI Generated' : '✅ Completed'}
              <span className="filter-count">
                {f === 'all' ? tasks.filter(t => !t.done).length :
                 f === 'active' ? tasks.filter(t => !t.done).length :
                 f === 'ai-generated' ? tasks.filter(t => !t.done && t.aiGenerated).length :
                 tasks.filter(t => t.done).length}
              </span>
            </button>
          ))}
        </div>

        <div className="filter-actions-right" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isSelectionMode ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn-secondary btn-sm" 
                style={{ borderColor: 'var(--accent-red)', color: 'var(--accent-red)', background: 'rgba(239,68,68,0.05)', fontWeight: 'bold' }}
                onClick={() => {
                  if (selectedTaskIds.length > 0) {
                    setShowBulkDeleteConfirm(true);
                  } else {
                    showToast('No tasks selected', 'warning');
                  }
                }}
              >
                🗑️ Delete Selected ({selectedTaskIds.length})
              </button>
              <button 
                className="btn-secondary btn-sm"
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedTaskIds([]);
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button 
              className="btn-secondary btn-sm" 
              onClick={() => {
                setIsSelectionMode(true);
                setSelectedTaskIds([]);
              }}
            >
              ☑️ Select
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-state" style={{ textAlign: 'center', padding: '60px' }}>
          <div className="ai-onboard-avatar" style={{ margin: '0 auto 20px auto', width: '40px', height: '40px' }}></div>
          <p>Synchronizing with Cloud Database...</p>
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
                {kanbanGroups[priority].map(task => {
                  return (
                    <div 
                      key={task.id} 
                      className={`kanban-card widget ${isSelectionMode ? 'selection-mode' : ''} ${selectedTaskIds.includes(task.id) ? 'selected-card' : ''} ${completingTaskIds.includes(task.id) ? 'card-completing' : ''}`} 
                      onClick={() => handleCardClick(task)}
                      style={{ position: 'relative' }}
                    >
                      {isSelectionMode && (
                        <div className="card-select-checkbox-overlay" style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}>
                          <div className={`subtask-check ${selectedTaskIds.includes(task.id) ? 'checked' : ''}`} style={{ width: '18px', height: '18px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: selectedTaskIds.includes(task.id) ? 'var(--accent-blue)' : 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'white' }}>
                            {selectedTaskIds.includes(task.id) && '✓'}
                          </div>
                        </div>
                      )}
                      <div className="kanban-card-top" style={{ paddingRight: isSelectionMode ? '24px' : '0' }}>
                        <span className="kanban-category" style={{ color: categoryColors[task.category] || 'var(--text-secondary)' }}>{task.category}</span>
                        {task.risk && task.risk > 70 && <span className="kanban-risk">🚨 {task.risk}%</span>}
                      </div>
                      <p className="kanban-task-text">{task.text}</p>
                      <span className="kanban-due">{task.due}</span>
                      {task.aiGenerated && <span className="ai-badge-sm">🤖 AI</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Grid Layout View */
        <div className="task-grid-container">
          {filteredTasks.map(task => {
            return (
              <div 
                key={task.id} 
                className={`task-card-item widget ${isSelectionMode ? 'selection-mode' : ''} ${selectedTaskIds.includes(task.id) ? 'selected-card' : ''} ${task.done ? 'task-done' : ''} ${completingTaskIds.includes(task.id) ? 'card-completing' : ''}`} 
                onClick={() => handleCardClick(task)}
                style={{ position: 'relative' }}
              >
                {isSelectionMode && (
                  <div className="card-select-checkbox-overlay" style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
                    <div className={`subtask-check ${selectedTaskIds.includes(task.id) ? 'checked' : ''}`} style={{ width: '18px', height: '18px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: selectedTaskIds.includes(task.id) ? 'var(--accent-blue)' : 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'white' }}>
                      {selectedTaskIds.includes(task.id) && '✓'}
                    </div>
                  </div>
                )}
                <div className="card-top-row" style={{ paddingRight: isSelectionMode ? '24px' : '0' }}>
                  <span className="card-category-badge" style={{ borderColor: categoryColors[task.category] || 'var(--text-secondary)', color: categoryColors[task.category] || 'var(--text-secondary)' }}>
                    {task.category}
                  </span>
                  <span className="priority-badge" style={{ color: priorityConfig[task.priority].color, background: priorityConfig[task.priority].bg }}>
                    {priorityConfig[task.priority].label}
                  </span>
                </div>
                
                <h4 className="card-task-title">{task.text}</h4>

                <div className="card-meta-metrics">
                  <div className="meta-metric due-date-metric">
                    📅 {task.due}
                  </div>
                </div>

                <div className="card-footer-row">
                  <div className="task-check-circle-wrapper" onClick={(e) => { e.stopPropagation(); handleToggleTask(task.id, task.done); }}>
                    <div className={`check-circle ${task.done || completingTaskIds.includes(task.id) ? 'checked' : ''}`}>
                      {(task.done || completingTaskIds.includes(task.id)) && '✓'}
                    </div>
                    <span className="toggle-label-text">
                      {task.done || completingTaskIds.includes(task.id) ? 'Completed' : 'Mark Done'}
                    </span>
                  </div>

                  {task.risk !== undefined && task.risk !== null && (
                    <div className="card-risk-level" title={`Completion risk: ${task.risk}%`}>
                      <span className="risk-dot" style={{ background: task.risk > 70 ? 'var(--accent-red)' : task.risk > 40 ? 'var(--accent-orange)' : 'var(--accent-green)' }}></span>
                      <span className="risk-text-sm">Risk {task.risk}%</span>
                    </div>
                  )}
                </div>

                {task.aiGenerated && <div className="card-ai-badge">🤖 AI</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* Task Detail Panel Overlay */}
      {activeTask && (
        <div className="task-detail-overlay" onClick={() => setSelectedTask(null)}>
          <div className="task-detail-panel widget" onClick={e => e.stopPropagation()}>
            <button className="detail-close" onClick={() => setSelectedTask(null)}>✕</button>
            
            {/* Title / Inline Editor at the Top */}
            <div className="detail-header-wrapper">
              <div className="detail-header-left">
                {isEditingHeader ? (
                  <div className="inline-editor-form">
                    <div className="form-group">
                      <label>Task Title</label>
                      <input 
                        type="text" 
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        className="inline-title-input"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="title-and-status">
                    <div className="task-check-circle-wrapper header-check" onClick={(e) => { e.stopPropagation(); handleToggleTask(activeTask.id, activeTask.done); }}>
                      <div className={`check-circle ${activeTask.done ? 'checked' : ''}`}>{activeTask.done && '✓'}</div>
                    </div>
                    <h3>{activeTask.text}</h3>
                  </div>
                )}
              </div>
              <div className="detail-header-right">
                <button className="btn-secondary btn-sm edit-header-btn" onClick={isEditingHeader ? saveHeaderEdits : startEditingHeader}>
                  {isEditingHeader ? '💾 Save Title' : '✏️ Edit Title'}
                </button>
                {isEditingHeader && (
                  <button className="btn-secondary btn-sm cancel-header-btn" onClick={() => setIsEditingHeader(false)}>
                    Cancel
                  </button>
                )}
              </div>
            </div>

            <div className="detail-panel-body-grid">
              {/* Left Column: Navigation Tabs & Tab Content */}
              <div className="detail-body-left-column">
                <div className="detail-tabs-nav">
                  <button className={activeTab === 'subtasks' ? 'active' : ''} onClick={() => setActiveTab('subtasks')}>
                    📋 Subtasks
                  </button>
                  <button className={activeTab === 'timer' ? 'active' : ''} onClick={() => setActiveTab('timer')}>
                    ⏱️ Focus Timer
                  </button>
                  <button className={activeTab === 'notes' ? 'active' : ''} onClick={() => setActiveTab('notes')}>
                    📝 Notes
                  </button>
                  <button className={activeTab === 'activity' ? 'active' : ''} onClick={() => setActiveTab('activity')}>
                    🕒 Activity Log
                  </button>
                </div>

                {/* Tab content areas */}
                {activeTab === 'subtasks' && (
                  <div className="tab-content-container">
                    <div className="subtask-live-progress">
                      <div className="progress-labels">
                        <span>Progress</span>
                        <span>{percentComplete}% ({completedSubtasks}/{totalSubtasks})</span>
                      </div>
                      <div className="progress-bar-track-detail">
                        <div className="progress-bar-fill-detail" style={{ width: `${percentComplete}%` }}></div>
                      </div>
                    </div>

                    <div className="subtasks-section-header">
                      <h5>Subtasks Checklist</h5>
                    </div>

                    <div className="subtask-list">
                      {normalizedSubtasks.length === 0 ? (
                        <p className="no-subtasks-text">No subtasks added yet. Type a subtask below to add one.</p>
                      ) : (
                        normalizedSubtasks.map((st, i) => (
                          <div 
                            key={i} 
                            className={`subtask-item ${st.done ? 'done' : ''}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, i)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, i)}
                          >
                            <div className="drag-handle-dots" title="Drag to reorder">⋮⋮</div>
                            <div className="subtask-check" onClick={() => handleToggleSubtask(i)}>
                              {st.done && '✓'}
                            </div>
                            <span className="subtask-text-span">{st.text}</span>
                            <div className="subtask-actions">
                              <button className="arrow-btn" disabled={i === 0} onClick={() => handleReorderArrows(i, 'up')} title="Move Up">▲</button>
                              <button className="arrow-btn" disabled={i === normalizedSubtasks.length - 1} onClick={() => handleReorderArrows(i, 'down')} title="Move Down">▼</button>
                              <button className="subtask-del-btn" onClick={() => handleDeleteSubtask(i)} title="Delete Subtask">🗑️</button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <form onSubmit={handleAddSubtaskInline} className="inline-add-subtask-form">
                      <input 
                        type="text" 
                        placeholder="Add new subtask inline..."
                        value={newSubtaskText}
                        onChange={e => setNewSubtaskText(e.target.value)}
                      />
                      <button type="submit" className="btn-primary btn-xs">+ Add</button>
                    </form>
                  </div>
                )}

                {activeTab === 'timer' && (
                  <div className="tab-content-container timer-tab-view" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="timer-headline" style={{ marginBottom: '16px', textAlign: 'center' }}>
                      <h5>Focus Session Timer</h5>
                      <p className="timer-task-label">Active: <strong>{activeTask.text}</strong></p>
                    </div>

                    <div className="pomodoro-timer-circle" style={{ marginBottom: '20px' }}>
                      <div className="circular-time-display">
                        {String(timerMinutes).padStart(2, '0')}:{String(timerSeconds).padStart(2, '0')}
                      </div>
                      <span className="timer-state-label">
                        {timerIsRunning ? '⚡ Focus Active' : '⏸️ Paused'}
                      </span>
                    </div>

                    {!showSaveSessionBox ? (
                      <div className="timer-control-buttons" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {/* If timer hasn't started */}
                        {timerMinutes === 0 && timerSeconds === 0 && !timerIsRunning ? (
                          <>
                            <button 
                              className="btn-primary btn-sm"
                              onClick={handleStartTimer}
                            >
                              ▶️ Start Focus Session
                            </button>
                            <button className="btn-secondary btn-sm" onClick={handleResetTimer}>
                              🔄 Reset Timer
                            </button>
                          </>
                        ) : (
                          <>
                            {/* If timer has started (running or paused) */}
                            <button 
                              className={`btn-primary btn-sm ${timerIsRunning ? 'pause-style' : ''}`}
                              onClick={handleStartTimer}
                            >
                              {timerIsRunning ? '⏸️ Stop Timer' : '▶️ Resume Timer'}
                            </button>
                            <button 
                              className="btn-secondary btn-sm"
                              style={{ borderColor: 'var(--accent-green)', color: 'var(--accent-green-light)', background: 'rgba(16,185,129,0.05)' }}
                              onClick={handleFinishSessionClick}
                            >
                              ⏹️ Finish Study Session
                            </button>
                            <button className="btn-secondary btn-sm" onClick={handleResetTimer}>
                              🔄 Reset Timer
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <form onSubmit={handleSaveStudySession} className="save-study-session-box widget" style={{ width: '100%', maxWidth: '300px', padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 'var(--radius-xl)' }}>
                        <h6 style={{ margin: '0 0 10px 0', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' }}>Save Study Session</h6>
                        <p style={{ margin: '0 0 12px 0', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                          Session duration: <strong>{formatTimeStudied(timerMinutes, timerSeconds)}</strong>
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <input 
                            type="text" 
                            placeholder="e.g. Implement login logic..." 
                            value={studySessionName}
                            onChange={e => setStudySessionName(e.target.value)}
                            required
                            style={{ 
                              padding: '8px 12px', 
                              background: 'rgba(0,0,0,0.3)', 
                              border: '1px solid var(--glass-border)', 
                              borderRadius: 'var(--radius-md)', 
                              color: 'white', 
                              fontSize: '12px', 
                              outline: 'none',
                              width: '100%'
                            }}
                          />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="submit" className="btn-primary btn-xs" style={{ flex: 1, height: '28px', fontSize: '11px' }}>Save Session</button>
                            <button type="button" className="btn-secondary btn-xs" style={{ flex: 1, height: '28px', fontSize: '11px' }} onClick={() => setShowSaveSessionBox(false)}>Cancel</button>
                          </div>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div className="tab-content-container notes-tab-view">
                    {notesViewMode === 'editor' ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <h5>{currentNoteId && currentNoteId !== 'new' ? `Editing: ${notesList.find(n => n.id === currentNoteId)?.name || 'Note'}` : 'New Note'}</h5>
                        </div>

                        <div className="notes-toolbar">
                          <button 
                            type="button" 
                            className="toolbar-btn"
                            title="Bold (Ctrl+B)" 
                            onClick={() => {
                              document.execCommand('bold', false);
                              handleEditorInput();
                            }}
                          >
                            <strong>B</strong>
                          </button>
                          <button 
                            type="button" 
                            className="toolbar-btn"
                            title="Underline (Ctrl+U)" 
                            onClick={() => {
                              document.execCommand('underline', false);
                              handleEditorInput();
                            }}
                          >
                            <u>U</u>
                          </button>
                          <button 
                            type="button" 
                            className="toolbar-btn"
                            title="Highlight" 
                            onClick={() => {
                              document.execCommand('backColor', false, 'rgba(255, 235, 59, 0.4)');
                              handleEditorInput();
                            }}
                          >
                            <span className="highlight-tag">Highlight</span>
                          </button>
                        </div>

                        <div
                          ref={editorRef}
                          className="notes-editor"
                          contentEditable
                          onInput={handleEditorInput}
                          onBlur={() => {
                            if (editorRef.current) {
                              saveNotes(editorRef.current.innerHTML);
                            }
                          }}
                          {...({ placeholder: "Type notes here..." } as any)}
                        />

                        <div className="notes-save-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <button 
                            className="btn-primary notes-save-btn" 
                            onClick={() => {
                              if (currentNoteId && currentNoteId !== 'new') {
                                const content = editorRef.current ? editorRef.current.innerHTML : notesText;
                                handleDirectSave(content);
                              } else {
                                const curr = notesList.find(n => n.id === currentNoteId);
                                setNewNoteName(curr ? curr.name : 'Untitled Note');
                                setShowSaveNoteBox(true);
                              }
                            }} 
                            disabled={savingNotes}
                          >
                            💾 Save Note
                          </button>
                          <button 
                            className="reschedule-main-btn"
                            onClick={() => setNotesViewMode('list')}
                            style={{ height: '28px', padding: '6px 14px', fontSize: '11px' }}
                          >
                            👁️ View My Notes
                          </button>
                          <button 
                            className="reschedule-main-btn"
                            onClick={() => {
                              setCurrentNoteId('new');
                              setNotesText('');
                              setLastSavedNotes('');
                              if (editorRef.current) {
                                editorRef.current.innerHTML = '';
                              }
                              showToast('Started new note', 'success');
                            }}
                            style={{ height: '28px', padding: '6px 14px', fontSize: '11px', borderColor: 'var(--accent-purple-light)', color: 'var(--accent-purple-light)' }}
                          >
                            ➕ New Note
                          </button>
                        </div>

                        {showSaveNoteBox && (
                          <form 
                            onSubmit={handleSaveNoteSubmit} 
                            className="save-study-session-box widget" 
                            style={{ 
                              marginTop: '16px', 
                              width: '100%', 
                              maxWidth: '320px', 
                              padding: '16px', 
                              background: 'rgba(255,255,255,0.01)', 
                              border: '1px solid rgba(255,255,255,0.04)', 
                              borderRadius: 'var(--radius-xl)' 
                            }}
                          >
                            <h6 style={{ margin: '0 0 10px 0', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' }}>
                              {currentNoteId && currentNoteId !== 'new' ? 'Rename & Save Note' : 'Save New Note'}
                            </h6>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <input 
                                type="text" 
                                placeholder="e.g. Project Notes, Chapter 1..." 
                                value={newNoteName}
                                onChange={e => setNewNoteName(e.target.value)}
                                required
                                style={{ 
                                  padding: '8px 12px', 
                                  background: 'rgba(0,0,0,0.3)', 
                                  border: '1px solid var(--glass-border)', 
                                  borderRadius: 'var(--radius-md)', 
                                  color: 'white', 
                                  fontSize: '12px', 
                                  outline: 'none',
                                  width: '100%'
                                }}
                              />
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button type="submit" className="btn-primary btn-xs" style={{ flex: 1, height: '28px', fontSize: '11px' }}>Save Note</button>
                                <button type="button" className="btn-secondary btn-xs" style={{ flex: 1, height: '28px', fontSize: '11px' }} onClick={() => setShowSaveNoteBox(false)}>Cancel</button>
                              </div>
                            </div>
                          </form>
                        )}
                      </>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <h5>My Notes ({notesList.length})</h5>
                          <button 
                            className="btn-primary btn-xs"
                            onClick={() => {
                              setCurrentNoteId('new');
                              setNotesText('');
                              setNotesViewMode('editor');
                              setTimeout(() => {
                                if (editorRef.current) editorRef.current.innerHTML = '';
                              }, 50);
                            }}
                            style={{ height: '26px', padding: '0 10px', fontSize: '10.5px' }}
                          >
                            ➕ New Note
                          </button>
                        </div>

                        <div className="saved-notes-list">
                          {notesList.length === 0 ? (
                            <p className="no-subtasks-text">No notes saved yet. Click "New Note" to create one.</p>
                          ) : (
                            notesList.map((note) => (
                              <div key={note.id} className="saved-note-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 'var(--radius-xl)', marginBottom: '8px' }}>
                                <div className="note-item-info" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <h6 style={{ margin: '0', fontSize: '13px', fontWeight: 'bold', color: 'white' }}>{note.name}</h6>
                                  <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Last updated: {formatTimeAgo(note.updatedAt)}</span>
                                </div>
                                <div className="note-item-actions" style={{ display: 'flex', gap: '6px' }}>
                                  <button 
                                    className="btn-primary btn-xs"
                                    onClick={() => {
                                      setCurrentNoteId(note.id);
                                      setNotesText(note.content);
                                      setNotesViewMode('editor');
                                      setTimeout(() => {
                                        if (editorRef.current) editorRef.current.innerHTML = note.content;
                                      }, 50);
                                    }}
                                    style={{ height: '26px', padding: '0 10px', fontSize: '10.5px' }}
                                  >
                                    ✏️ Edit
                                  </button>
                                  <button 
                                    className="btn-secondary btn-xs"
                                    onClick={() => {
                                      setRenameNoteId(note.id);
                                      setRenameNoteName(note.name);
                                      setShowRenameNoteModal(true);
                                    }}
                                    style={{ height: '26px', padding: '0 10px', fontSize: '10.5px' }}
                                  >
                                    📋 Rename
                                  </button>
                                  <button 
                                    className="btn-secondary btn-xs delete-note-btn"
                                    style={{ borderColor: 'var(--accent-red)', color: 'var(--accent-red)', height: '26px', padding: '0 10px', fontSize: '10.5px' }}
                                    onClick={() => {
                                      setDeleteNoteId(note.id);
                                      setDeleteNoteName(note.name);
                                      setShowDeleteNoteModal(true);
                                    }}
                                  >
                                    🗑️ Delete
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        <div style={{ marginTop: '16px', display: 'block', clear: 'both', width: '100%' }}>
                          <button 
                            className="btn-secondary btn-sm"
                            onClick={() => setNotesViewMode('editor')}
                            style={{ height: '28px', padding: '6px 14px', fontSize: '11px', display: 'block' }}
                          >
                            ⬅️ Back to Editor
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeTab === 'activity' && (
                  <div className="tab-content-container activity-log-view">
                    <h5>Task Activity Log</h5>
                    <div className="activity-timeline-container">
                      {(!activeTask.activityLog || activeTask.activityLog.length === 0) ? (
                        <p className="no-activity-text">No activity logged for this task yet.</p>
                      ) : (
                        activeTask.activityLog.slice().reverse().map((log, idx) => (
                          <div key={idx} className="timeline-item">
                            <div className="timeline-node"></div>
                            <div className="timeline-content">
                              <span className="timeline-text">{log.action}</span>
                              <span className="timeline-time">{formatTimeAgo(log.timestamp)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Metadata Panel & Snooze & Delete */}
              <div className="detail-body-right-column">
                <div className="metadata-card widget">
                  <h5>Task Metadata</h5>
                  
                  <div className="metadata-field-row">
                    <span className="field-label">Category</span>
                    {isEditingHeader ? (
                      <div style={{ width: '120px' }}>
                        <CustomSelect 
                          value={editCategory} 
                          onChange={setEditCategory} 
                          options={categories.map(c => ({ value: c, label: c }))} 
                        />
                      </div>
                    ) : (
                      <span className="field-value category-val" style={{ color: categoryColors[activeTask.category] || 'var(--text-secondary)' }}>
                        📁 {activeTask.category}
                      </span>
                    )}
                  </div>

                  <div className="metadata-field-row">
                    <span className="field-label">Priority</span>
                    {isEditingHeader ? (
                      <div style={{ width: '120px' }}>
                        <CustomSelect 
                          value={editPriority} 
                          onChange={val => setEditPriority(val as Task['priority'])} 
                          options={[
                            { value: 'low', label: 'Low' },
                            { value: 'medium', label: 'Medium' },
                            { value: 'high', label: 'High' },
                            { value: 'critical', label: 'Critical' }
                          ]} 
                        />
                      </div>
                    ) : (
                      <span className="field-value priority-val" style={{ color: priorityConfig[activeTask.priority].color }}>
                        {priorityConfig[activeTask.priority].label}
                      </span>
                    )}
                  </div>

                  <div className="metadata-field-row">
                    <span className="field-label">Due Date</span>
                    {isEditingHeader ? (
                      <input 
                        type="text" 
                        value={editDue} 
                        onChange={e => setEditDue(e.target.value)}
                        className="inline-editor-text-input"
                      />
                    ) : (
                      <span className="field-value due-val">
                        📅 {activeTask.due}
                      </span>
                    )}
                  </div>

                  <div className="metadata-field-row">
                    <span className="field-label">Focus Stats</span>
                    <span className="field-value sessions-val">
                      🍅 {activeTask.sessionsCount || 0} session(s) completed
                    </span>
                  </div>

                  {/* Actions: Reschedule & Delete */}
                  <div className="metadata-snooze-action-block">
                    {!showSnoozeDropdown ? (
                      <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                        <button 
                          className="btn-secondary btn-xs reschedule-main-btn" 
                          style={{ flex: 1, justifyContent: 'center' }}
                          onClick={() => setShowSnoozeDropdown(true)}
                        >
                          Reschedule Task
                        </button>
                        
                        <div style={{ flex: 1 }}>
                          <button 
                            className="btn-secondary btn-xs delete-task-btn" 
                            style={{ width: '100%', borderColor: 'var(--accent-red)', color: 'var(--accent-red)', background: 'rgba(239,68,68,0.05)', justifyContent: 'center' }}
                            onClick={() => setShowDeleteConfirmModal(true)}
                          >
                            🗑️ Delete Task
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <form onSubmit={handleCustomSnoozeSubmit} className="side-custom-snooze-form">
                          <input 
                            type="datetime-local" 
                            value={customSnoozeDate}
                            onChange={e => setCustomSnoozeDate(e.target.value)}
                            required
                            style={{ width: '100%' }}
                          />
                          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                            <button type="submit" className="btn-primary btn-xs" style={{ flex: 1 }}>Save Date</button>
                            <button type="button" className="btn-secondary btn-xs" onClick={() => setShowSnoozeDropdown(false)}>Cancel</button>
                          </div>
                        </form>

                        <div style={{ marginTop: '12px' }}>
                          <button 
                            className="btn-secondary btn-xs delete-task-btn" 
                            style={{ width: '100%', borderColor: 'var(--accent-red)', color: 'var(--accent-red)', background: 'rgba(239,68,68,0.05)', justifyContent: 'center' }}
                            onClick={() => setShowDeleteConfirmModal(true)}
                          >
                            🗑️ Delete Task
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="detail-modal-footer">
              <button 
                className="btn-primary done-proceed-btn" 
                onClick={async () => {
                  if (isEditingHeader) {
                    await saveHeaderEdits();
                  }
                  await saveNotes(notesText);
                  setSelectedTask(null);
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal Overlay */}
      {showAddModal && (
        <div className="modal-overlay-centered" onClick={() => setShowAddModal(false)}>
          <div className="task-create-modal widget" onClick={e => e.stopPropagation()}>
            <button className="detail-close" onClick={() => setShowAddModal(false)}>✕</button>
            <div className="modal-header">
              <h3>Create New Task</h3>
              <p>Add a task to your Cloud database</p>
            </div>
            
            <form onSubmit={handleCreateTask} className="task-create-form">
              <div className="form-group">
                <label>Task Name</label>
                <input 
                  type="text" 
                  value={newText} 
                  onChange={e => setNewText(e.target.value)}
                  placeholder="e.g. Draft Quarterly Business Review Presentation" 
                  required
                />
              </div>

              <div className="form-row-grid" style={{ zIndex: 10 }}>
                <div className="form-group">
                  <label>Priority</label>
                  <CustomSelect 
                    value={newPriority} 
                    onChange={val => setNewPriority(val as Task['priority'])}
                    options={[
                      { value: 'low', label: 'Low' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'high', label: 'High' },
                      { value: 'critical', label: 'Critical' }
                    ]}
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <CustomSelect 
                    value={newCategory} 
                    onChange={setNewCategory}
                    options={categories.map(c => ({ value: c, label: c }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Due Date & Time</label>
                <input 
                  type="datetime-local" 
                  value={newDue} 
                  onChange={e => setNewDue(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Subtasks (comma-separated)</label>
                <input 
                  type="text" 
                  value={newSubtaskInput} 
                  onChange={e => setNewSubtaskInput(e.target.value)}
                  placeholder="e.g. Gather slides material, Write executive summary"
                />
              </div>

              <button type="submit" className="btn-primary form-submit-btn">
                Create Task
              </button>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirmModal && (
        <div className="modal-overlay-centered" onClick={() => setShowDeleteConfirmModal(false)}>
          <div className="task-delete-confirm-modal widget" onClick={e => e.stopPropagation()}>
            <button className="detail-close" onClick={() => setShowDeleteConfirmModal(false)}>✕</button>
            <div className="modal-header">
              <h3>🗑️ Delete Task</h3>
              <p>Are you sure you want to delete the task?</p>
            </div>
            <div className="modal-confirm-actions" style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'center' }}>
              <button 
                className="btn-primary" 
                style={{ background: 'var(--accent-red)', border: '1px solid rgba(239, 68, 68, 0.4)', color: 'white', padding: '8px 24px', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: 'bold' }}
                onClick={() => {
                  if (activeTask) {
                    deleteTask(activeTask.id);
                    showToast('Task deleted successfully', 'success');
                    setSelectedTask(null);
                  }
                  setShowDeleteConfirmModal(false);
                }}
              >
                Yes, Delete
              </button>
              <button 
                className="btn-secondary" 
                style={{ padding: '8px 24px', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: 'bold' }}
                onClick={() => setShowDeleteConfirmModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showRenameNoteModal && (
        <div className="modal-overlay-centered" onClick={() => setShowRenameNoteModal(false)}>
          <div className="task-delete-confirm-modal widget" onClick={e => e.stopPropagation()} style={{ maxWidth: '360px' }}>
            <button className="detail-close" onClick={() => setShowRenameNoteModal(false)}>✕</button>
            <div className="modal-header">
              <h3>📋 Rename Note</h3>
            </div>
            <form onSubmit={handleRenameNoteSubmit} style={{ marginTop: '16px' }}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <input 
                  type="text" 
                  value={renameNoteName} 
                  onChange={e => setRenameNoteName(e.target.value)}
                  required
                  style={{ 
                    padding: '8px 12px', 
                    background: 'rgba(0,0,0,0.3)', 
                    border: '1px solid var(--glass-border)', 
                    borderRadius: 'var(--radius-md)', 
                    color: 'white', 
                    fontSize: '12px', 
                    outline: 'none',
                    width: '100%'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button type="submit" className="btn-primary" style={{ padding: '8px 24px', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: 'bold' }}>
                  Rename
                </button>
                <button type="button" className="btn-secondary" style={{ padding: '8px 24px', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: 'bold' }} onClick={() => setShowRenameNoteModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteNoteModal && (
        <div className="modal-overlay-centered" onClick={() => setShowDeleteNoteModal(false)}>
          <div className="task-delete-confirm-modal widget" onClick={e => e.stopPropagation()} style={{ maxWidth: '360px' }}>
            <button className="detail-close" onClick={() => setShowDeleteNoteModal(false)}>✕</button>
            <div className="modal-header">
              <h3>🗑️ Delete Note</h3>
              <p>Are you sure you want to delete note "{deleteNoteName}"?</p>
            </div>
            <div className="modal-confirm-actions" style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'center' }}>
              <button 
                className="btn-primary" 
                style={{ background: 'var(--accent-red)', border: '1px solid rgba(239, 68, 68, 0.4)', color: 'white', padding: '8px 24px', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: 'bold' }}
                onClick={handleDeleteNoteConfirm}
              >
                Yes, Delete
              </button>
              <button 
                className="btn-secondary" 
                style={{ padding: '8px 24px', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: 'bold' }}
                onClick={() => setShowDeleteNoteModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkDeleteConfirm && (
        <div className="modal-overlay-centered" onClick={() => setShowBulkDeleteConfirm(false)}>
          <div className="task-delete-confirm-modal widget" onClick={e => e.stopPropagation()} style={{ maxWidth: '380px' }}>
            <button className="detail-close" onClick={() => setShowBulkDeleteConfirm(false)}>✕</button>
            <div className="modal-header" style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>🗑️ Delete Tasks</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Are you sure you want to delete {selectedTaskIds.length} selected task(s)? This action cannot be undone.
              </p>
            </div>
            <div className="modal-confirm-actions" style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'center' }}>
              <button 
                className="btn-primary" 
                style={{ background: 'var(--accent-red)', border: '1px solid rgba(239, 68, 68, 0.4)', color: 'white', padding: '8px 24px', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: 'bold' }}
                onClick={async () => {
                  try {
                    for (const id of selectedTaskIds) {
                      await deleteTask(id);
                    }
                    showToast(`Successfully deleted ${selectedTaskIds.length} tasks`, 'success');
                    setSelectedTaskIds([]);
                    setIsSelectionMode(false);
                  } catch (err) {
                    showToast('Failed to delete some tasks', 'warning');
                  }
                  setShowBulkDeleteConfirm(false);
                }}
              >
                Yes, Delete
              </button>
              <button 
                className="btn-secondary" 
                style={{ padding: '8px 24px', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: 'bold' }}
                onClick={() => setShowBulkDeleteConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className={`website-toast toast-${toastType}`}>
          <div className="toast-content">
            <span className="toast-icon">
              {toastType === 'success' ? '✅' : toastType === 'warning' ? '⚠️' : 'ℹ️'}
            </span>
            <span className="toast-text">{toastMessage}</span>
          </div>
          <button className="toast-close" onClick={() => setToastMessage(null)}>✕</button>
        </div>
      )}
    </div>
  );
}
