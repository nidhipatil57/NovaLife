import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { type Task } from '../hooks/useTasks';
import { type Habit } from '../hooks/useHabits';
import { type Goal } from '../hooks/useGoals';

interface DataContextType {
  tasks: Task[];
  loadingTasks: boolean;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => Promise<Task | undefined>;
  toggleTask: (id: string, done: boolean) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  habits: Habit[];
  loadingHabits: boolean;
  addHabit: (habit: Omit<Habit, 'id'>) => Promise<void>;
  toggleHabitDay: (id: string, dayIndex: number) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<boolean>;

  goals: Goal[];
  loadingGoals: boolean;
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>;
  toggleMilestone: (goalId: string, milestoneIndex: number) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<boolean>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  // Habits state
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loadingHabits, setLoadingHabits] = useState(true);

  // Goals state
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(true);

  // 1. Fetch Tasks
  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoadingTasks(false);
      return;
    }

    const fetchTasks = async () => {
      setLoadingTasks(true);
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
        }
      } catch (err) {
        console.error('Error fetching tasks:', err);
      } finally {
        setLoadingTasks(false);
      }
    };

    fetchTasks();
  }, [user]);

  // 2. Fetch Habits
  useEffect(() => {
    if (!user) {
      setHabits([]);
      setLoadingHabits(false);
      return;
    }

    const fetchHabits = async () => {
      setLoadingHabits(true);
      try {
        const token = localStorage.getItem('novalife_token');
        const response = await fetch('/api/habits', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const mappedHabits: Habit[] = data.map((h: any) => ({
            id: String(h.id),
            name: h.name || '',
            target: h.target || '',
            streak: Number(h.streak) || 0,
            best: Number(h.best) || 0,
            rate: Number(h.rate) || 0,
            week: Array.isArray(h.week) ? h.week : JSON.parse(h.week || '[false,false,false,false,false,false,false]'),
            color: h.color || 'var(--accent-blue)',
            notes: h.notes || '',
          }));
          setHabits(mappedHabits);
        }
      } catch (err) {
        console.error('Error fetching habits:', err);
      } finally {
        setLoadingHabits(false);
      }
    };

    fetchHabits();
  }, [user]);

  // 3. Fetch Goals
  useEffect(() => {
    if (!user) {
      setGoals([]);
      setLoadingGoals(false);
      return;
    }

    const fetchGoals = async () => {
      setLoadingGoals(true);
      try {
        const token = localStorage.getItem('novalife_token');
        const response = await fetch('/api/goals', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const mappedGoals: Goal[] = data.map((g: any) => ({
            id: String(g.id),
            name: g.name || '',
            category: g.category || 'General',
            progress: Number(g.progress) || 0,
            color: g.color || 'var(--accent-blue)',
            milestones: Array.isArray(g.milestones) ? g.milestones : JSON.parse(g.milestones || '[]'),
            completed_by: g.completed_by || '',
            completed_dates: Array.isArray(g.completed_dates) ? g.completed_dates : JSON.parse(g.completed_dates || '[]'),
            streak: Number(g.streak) || 0,
            notes: g.notes || '',
            ai_generated: !!g.ai_generated,
            created_at: g.created_at || '',
          }));
          setGoals(mappedGoals);
        }
      } catch (err) {
        console.error('Error fetching goals:', err);
      } finally {
        setLoadingGoals(false);
      }
    };

    fetchGoals();
  }, [user]);

  // Task Actions
  const addTask = async (task: Omit<Task, 'id' | 'createdAt'>) => {
    if (!user) return;
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
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      throw err;
    }
  };

  // Habit Actions
  const addHabit = async (habit: Omit<Habit, 'id'>) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('novalife_token');
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(habit),
      });

      if (response.ok) {
        const h = await response.json();
        const newHabit: Habit = {
          id: String(h.id),
          name: h.name || '',
          target: h.target || '',
          streak: Number(h.streak) || 0,
          best: Number(h.best) || 0,
          rate: Number(h.rate) || 0,
          week: Array.isArray(h.week) ? h.week : JSON.parse(h.week || '[false,false,false,false,false,false,false]'),
          color: h.color || 'var(--accent-blue)',
          notes: h.notes || '',
        };
        setHabits((prev) => [...prev, newHabit]);
      }
    } catch (err) {
      console.error('Error adding habit:', err);
    }
  };

  const toggleHabitDay = async (id: string, dayIndex: number) => {
    if (!user) return;
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;

    const newWeek = [...habit.week];
    newWeek[dayIndex] = !newWeek[dayIndex];

    const completedDays = newWeek.filter(Boolean).length;
    const rate = Math.round((completedDays / 7) * 100);

    let streak = habit.streak;
    const isCompletedToday = newWeek[dayIndex];
    if (isCompletedToday) {
      streak += 1;
    } else if (streak > 0) {
      streak = Math.max(0, streak - 1);
    }
    const best = Math.max(habit.best, streak);

    try {
      const token = localStorage.getItem('novalife_token');
      const response = await fetch(`/api/habits/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          week: newWeek,
          rate,
          streak,
          best,
        }),
      });

      if (response.ok) {
        setHabits((prev) =>
          prev.map((h) =>
            h.id === id
              ? { ...h, week: newWeek, rate, streak, best }
              : h
          )
        );
      }
    } catch (err) {
      console.error('Error toggling habit day:', err);
    }
  };

  const deleteHabit = async (id: string) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('novalife_token');
      const response = await fetch(`/api/habits/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setHabits((prev) => prev.filter((h) => h.id !== id));
      }
    } catch (err) {
      console.error('Error deleting habit:', err);
    }
  };

  const updateHabit = async (id: string, updates: Partial<Habit>) => {
    if (!user) return false;
    try {
      const token = localStorage.getItem('novalife_token');
      const response = await fetch(`/api/habits/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const h = await response.json();
        setHabits((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  ...updates,
                  week: Array.isArray(h.week) ? h.week : JSON.parse(h.week || '[false,false,false,false,false,false,false]'),
                }
              : item
          )
        );
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating habit:', err);
      return false;
    }
  };

  // Goal Actions
  const addGoal = async (goal: Omit<Goal, 'id'>) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('novalife_token');
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(goal),
      });

      if (response.ok) {
        const g = await response.json();
        const newGoal: Goal = {
          id: String(g.id),
          name: g.name || '',
          category: g.category || 'General',
          progress: Number(g.progress) || 0,
          color: g.color || 'var(--accent-blue)',
          milestones: Array.isArray(g.milestones) ? g.milestones : JSON.parse(g.milestones || '[]'),
          completed_by: g.completed_by || '',
          completed_dates: Array.isArray(g.completed_dates) ? g.completed_dates : JSON.parse(g.completed_dates || '[]'),
          streak: Number(g.streak) || 0,
          notes: g.notes || '',
          ai_generated: !!g.ai_generated,
          created_at: g.created_at || '',
        };
        setGoals((prev) => [...prev, newGoal]);
      }
    } catch (err) {
      console.error('Error adding goal:', err);
    }
  };

  const toggleMilestone = async (goalId: string, milestoneIndex: number) => {
    if (!user) return;
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    const newMilestones = [...goal.milestones];
    newMilestones[milestoneIndex].done = !newMilestones[milestoneIndex].done;

    try {
      const token = localStorage.getItem('novalife_token');
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          milestones: newMilestones,
        }),
      });

      if (response.ok) {
        setGoals((prev) =>
          prev.map((g) =>
            g.id === goalId
              ? { ...g, milestones: newMilestones }
              : g
          )
        );
      }
    } catch (err) {
      console.error('Error toggling milestone:', err);
    }
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('novalife_token');
      const response = await fetch(`/api/goals/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setGoals((prev) => prev.filter((g) => g.id !== id));
      }
    } catch (err) {
      console.error('Error deleting goal:', err);
    }
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    if (!user) return false;
    try {
      const token = localStorage.getItem('novalife_token');
      const response = await fetch(`/api/goals/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const g = await response.json();
        setGoals((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  ...updates,
                  milestones: Array.isArray(g.milestones) ? g.milestones : JSON.parse(g.milestones || '[]'),
                  completed_dates: Array.isArray(g.completed_dates) ? g.completed_dates : JSON.parse(g.completed_dates || '[]'),
                }
              : item
          )
        );
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating goal:', err);
      return false;
    }
  };

  return (
    <DataContext.Provider value={{
      tasks,
      loadingTasks,
      addTask,
      updateTask,
      toggleTask,
      deleteTask,
      habits,
      loadingHabits,
      addHabit,
      toggleHabitDay,
      deleteHabit,
      updateHabit,
      goals,
      loadingGoals,
      addGoal,
      toggleMilestone,
      deleteGoal,
      updateGoal
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useDataContext() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
}
