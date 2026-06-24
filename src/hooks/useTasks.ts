import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export type ActivityItem = {
  action: string;
  timestamp: string;
};

export type Task = {
  id: string;
  text: string;
  done: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
  due: string;
  category: string;
  subtasks?: string[];
  risk?: number;
  aiGenerated?: boolean;
  notes?: string;
  sessionsCount?: number;
  activityLog?: ActivityItem[];
  createdAt?: string;
};

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const fetchTasks = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('novalife_token');
        const response = await fetch('/api/tasks', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const mappedTasks: Task[] = data.map((t: any) => ({
            id: String(t.id),
            text: t.text || '',
            done: t.done || false,
            priority: t.priority || 'medium',
            due: t.due || 'No due date',
            category: t.category || 'General',
            subtasks: Array.isArray(t.subtasks) ? t.subtasks : JSON.parse(t.subtasks || '[]'),
            risk: Number(t.risk) || 0,
            aiGenerated: t.ai_generated || false,
            notes: t.notes || '',
            sessionsCount: Number(t.sessions_count) || 0,
            activityLog: Array.isArray(t.activity_log) ? t.activity_log : JSON.parse(t.activity_log || '[]'),
            createdAt: t.created_at,
          }));
          setTasks(mappedTasks);
        } else {
          console.error('Failed to fetch tasks.');
        }
      } catch (err) {
        console.error('Error fetching tasks from server:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user]);

  const addTask = async (task: Omit<Task, 'id' | 'createdAt'>) => {
    if (!user) {
      console.warn('Cannot add task: No user logged in.');
      return;
    }
    const defaultActivity = [{ action: 'Task created', timestamp: new Date().toISOString() }];
    try {
      const token = localStorage.getItem('novalife_token');
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: task.text,
          done: task.done,
          priority: task.priority,
          due: task.due,
          category: task.category,
          subtasks: task.subtasks,
          risk: task.risk,
          ai_generated: task.aiGenerated,
          notes: task.notes || '',
          sessions_count: task.sessionsCount || 0,
          activity_log: task.activityLog || defaultActivity,
        }),
      });

      if (response.ok) {
        const t = await response.json();
        const newTask: Task = {
          id: String(t.id),
          text: t.text || '',
          done: t.done || false,
          priority: t.priority || 'medium',
          due: t.due || 'No due date',
          category: t.category || 'General',
          subtasks: Array.isArray(t.subtasks) ? t.subtasks : JSON.parse(t.subtasks || '[]'),
          risk: Number(t.risk) || 0,
          aiGenerated: t.ai_generated || false,
          notes: t.notes || '',
          sessionsCount: Number(t.sessions_count) || 0,
          activityLog: Array.isArray(t.activity_log) ? t.activity_log : JSON.parse(t.activity_log || '[]'),
          createdAt: t.created_at,
        };
        setTasks((prev) => [newTask, ...prev]);
      } else {
        console.error('Failed to create task on backend.');
      }
    } catch (err) {
      console.error('Error adding task:', err);
      throw err;
    }
  };

  const updateTask = async (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('novalife_token');
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const t = await response.json();
        const mapped: Task = {
          id: String(t.id),
          text: t.text || '',
          done: t.done || false,
          priority: t.priority || 'medium',
          due: t.due || 'No due date',
          category: t.category || 'General',
          subtasks: Array.isArray(t.subtasks) ? t.subtasks : JSON.parse(t.subtasks || '[]'),
          risk: Number(t.risk) || 0,
          aiGenerated: t.ai_generated || false,
          notes: t.notes || '',
          sessionsCount: Number(t.sessions_count) || 0,
          activityLog: Array.isArray(t.activity_log) ? t.activity_log : JSON.parse(t.activity_log || '[]'),
          createdAt: t.created_at,
        };
        setTasks((prev) =>
          prev.map((item) => (item.id === id ? mapped : item))
        );
        return mapped;
      } else {
        console.error('Failed to update task on backend.');
      }
    } catch (err) {
      console.error('Error updating task:', err);
      throw err;
    }
  };

  const toggleTask = async (id: string, done: boolean) => {
    if (!user) return;
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const newActivity = [
      ...(task.activityLog || []),
      { action: `Task marked as ${done ? 'completed' : 'incomplete'}`, timestamp: new Date().toISOString() }
    ];

    try {
      await updateTask(id, { done, activityLog: newActivity });
    } catch (err) {
      console.error('Error toggling task:', err);
      throw err;
    }
  };

  const deleteTask = async (id: string) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('novalife_token');
      const deleteRes = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (deleteRes.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
      } else {
        console.error('Failed to delete task from backend.');
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      throw err;
    }
  };

  return { 
    tasks, 
    loading, 
    user, 
    addTask, 
    updateTask,
    toggleTask, 
    deleteTask
  };
}
