import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { type Task } from '../hooks/useTasks';
import { type Habit } from '../hooks/useHabits';
import { type Goal } from '../hooks/useGoals';
import { type CalendarEvent } from '../hooks/useCalendarEvents';
import { calculateProductivityScore } from '../utils/productivityEngine';

export interface FocusSession {
  id: string;
  name: string;
  notes: string;
  duration: number; // in seconds
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  pinned: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'model';
  text: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: number;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  time: string;
  merchant: string;
  payment_method: string;
  notes: string;
  recurring: boolean;
  recurring_frequency: string;
  tags: string[];
  receipt_url: string;
  created_at?: string;
}

export interface Budget {
  id: string;
  user_id: number;
  category: string;
  amount: number;
  month_year: string;
  created_at?: string;
}

export interface SavingsGoal {
  id: string;
  user_id: number;
  name: string;
  target_amount: number;
  saved_amount: number;
  target_date: string;
  color: string;
  notes: string;
  created_at?: string;
}

export interface Bill {
  id: string;
  user_id: number;
  title: string;
  amount: number;
  due_date: string;
  category: string;
  paid: boolean;
  recurring: boolean;
  created_at?: string;
}

interface DataContextType {
  tasks: Task[];
  loadingTasks: boolean;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<Task | undefined>;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => Promise<Task | undefined>;
  toggleTask: (id: string, done: boolean, skipSync?: boolean) => Promise<void>;
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
  toggleMilestone: (goalId: string, milestoneIndex: number, skipSync?: boolean) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<boolean>;

  // Events
  events: CalendarEvent[];
  loadingEvents: boolean;
  addEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  updateEvent: (id: string, updates: Partial<Omit<CalendarEvent, 'id'>>) => Promise<CalendarEvent | undefined>;

  // Focus Sessions
  focusSessions: FocusSession[];
  loadingFocusSessions: boolean;
  addFocusSession: (session: Omit<FocusSession, 'id' | 'created_at'>) => Promise<void>;
  deleteFocusSession: (id: string) => Promise<void>;

  // Conversations
  conversations: Conversation[];
  loadingConversations: boolean;
  addConversation: (title?: string) => Promise<Conversation | undefined>;
  updateConversation: (id: string, updates: { title?: string; pinned?: boolean }) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;

  // Messages
  getMessages: (conversationId: string) => Promise<Message[]>;
  addMessage: (conversationId: string, role: 'user' | 'model', text: string) => Promise<Message | undefined>;

  // Central Productivity Score
  productivityScore: number;
  rescueActivations: number;
  triggerRescueActivation: () => void;

  // AI Assistant Preserved State
  aiActiveConvId: string | null;
  setAiActiveConvId: (id: string | null) => void;
  aiMessages: Message[];
  setAiMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  aiInput: string;
  setAiInput: (val: string) => void;
  aiSearchQuery: string;
  setAiSearchQuery: (val: string) => void;
  aiScrollTop: number;
  setAiScrollTop: (val: number) => void;

  // Finance
  transactions: Transaction[];
  loadingTransactions: boolean;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'user_id'>) => Promise<Transaction | undefined>;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id' | 'user_id'>>) => Promise<Transaction | undefined>;
  deleteTransaction: (id: string) => Promise<void>;

  budgets: Budget[];
  loadingBudgets: boolean;
  addBudget: (budget: Omit<Budget, 'id' | 'user_id'>) => Promise<Budget | undefined>;
  deleteBudget: (id: string) => Promise<void>;

  savingsGoals: SavingsGoal[];
  loadingSavingsGoals: boolean;
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'user_id'>) => Promise<SavingsGoal | undefined>;
  updateSavingsGoal: (id: string, updates: Partial<Omit<SavingsGoal, 'id' | 'user_id'>>) => Promise<SavingsGoal | undefined>;
  deleteSavingsGoal: (id: string) => Promise<void>;

  bills: Bill[];
  loadingBills: boolean;
  addBill: (bill: Omit<Bill, 'id' | 'user_id'>) => Promise<Bill | undefined>;
  updateBill: (id: string, updates: Partial<Omit<Bill, 'id' | 'user_id'>>) => Promise<Bill | undefined>;
  deleteBill: (id: string) => Promise<void>;

  financialHealthScore: number;
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

  // Events state
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Focus Sessions state
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [loadingFocusSessions, setLoadingFocusSessions] = useState(true);

  // Conversations state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);

  // AI Assistant Preserved State
  const [aiActiveConvId, setAiActiveConvId] = useState<string | null>(null);
  const [aiMessages, setAiMessages] = useState<Message[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [aiScrollTop, setAiScrollTop] = useState(0);

  // Finance states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loadingBudgets, setLoadingBudgets] = useState(true);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [loadingSavingsGoals, setLoadingSavingsGoals] = useState(true);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loadingBills, setLoadingBills] = useState(true);

  // Rescue Mode Activations state
  const [rescueActivations, setRescueActivations] = useState(() => {
    return Number(localStorage.getItem('novalife_rescue_mode_activations') || 0);
  });

  const triggerRescueActivation = () => {
    setRescueActivations((prev) => {
      const next = prev + 1;
      localStorage.setItem('novalife_rescue_mode_activations', String(next));
      return next;
    });
  };

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

  // 4. Fetch Events
  useEffect(() => {
    if (!user) {
      setEvents([]);
      setLoadingEvents(false);
      return;
    }

    const fetchEvents = async () => {
      setLoadingEvents(true);
      try {
        const token = localStorage.getItem('novalife_token');
        const response = await fetch('/api/events', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setEvents(data);
        }
      } catch (err) {
        console.error('Error fetching events:', err);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, [user]);

  // 5. Fetch Focus Sessions
  useEffect(() => {
    if (!user) {
      setFocusSessions([]);
      setLoadingFocusSessions(false);
      return;
    }

    const fetchFocusSessions = async () => {
      setLoadingFocusSessions(true);
      try {
        const token = localStorage.getItem('novalife_token');
        const response = await fetch('/api/focus-sessions', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setFocusSessions(data);
        }
      } catch (err) {
        console.error('Error fetching focus sessions:', err);
      } finally {
        setLoadingFocusSessions(false);
      }
    };

    fetchFocusSessions();
  }, [user]);

  // 6. Fetch Conversations
  useEffect(() => {
    if (!user) {
      setConversations([]);
      setLoadingConversations(false);
      return;
    }

    const fetchConversations = async () => {
      setLoadingConversations(true);
      try {
        const token = localStorage.getItem('novalife_token');
        const response = await fetch('/api/conversations', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setConversations(data);
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
      } finally {
        setLoadingConversations(false);
      }
    };

    fetchConversations();
  }, [user]);

  // 7. Fetch Transactions
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setLoadingTransactions(false);
      return;
    }
    const fetchTransactions = async () => {
      setLoadingTransactions(true);
      try {
        const token = localStorage.getItem('novalife_token');
        const res = await fetch('/api/finance/transactions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTransactions(data.map((t: any) => ({
            ...t,
            id: String(t.id),
            amount: Number(t.amount),
            tags: Array.isArray(t.tags) ? t.tags : JSON.parse(t.tags || '[]')
          })));
        }
      } catch (e) {
        console.error('Error fetching transactions:', e);
      } finally {
        setLoadingTransactions(false);
      }
    };
    fetchTransactions();
  }, [user]);

  // 8. Fetch Budgets
  useEffect(() => {
    if (!user) {
      setBudgets([]);
      setLoadingBudgets(false);
      return;
    }
    const fetchBudgets = async () => {
      setLoadingBudgets(true);
      try {
        const token = localStorage.getItem('novalife_token');
        const res = await fetch('/api/finance/budgets', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setBudgets(data.map((b: any) => ({
            ...b,
            id: String(b.id),
            amount: Number(b.amount)
          })));
        }
      } catch (e) {
        console.error('Error fetching budgets:', e);
      } finally {
        setLoadingBudgets(false);
      }
    };
    fetchBudgets();
  }, [user]);

  // 9. Fetch Savings Goals
  useEffect(() => {
    if (!user) {
      setSavingsGoals([]);
      setLoadingSavingsGoals(false);
      return;
    }
    const fetchSavingsGoals = async () => {
      setLoadingSavingsGoals(true);
      try {
        const token = localStorage.getItem('novalife_token');
        const res = await fetch('/api/finance/savings-goals', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSavingsGoals(data.map((g: any) => ({
            ...g,
            id: String(g.id),
            target_amount: Number(g.target_amount),
            saved_amount: Number(g.saved_amount)
          })));
        }
      } catch (e) {
        console.error('Error fetching savings goals:', e);
      } finally {
        setLoadingSavingsGoals(false);
      }
    };
    fetchSavingsGoals();
  }, [user]);

  // 10. Fetch Bills
  useEffect(() => {
    if (!user) {
      setBills([]);
      setLoadingBills(false);
      return;
    }
    const fetchBills = async () => {
      setLoadingBills(true);
      try {
        const token = localStorage.getItem('novalife_token');
        const res = await fetch('/api/finance/bills', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setBills(data.map((b: any) => ({
            ...b,
            id: String(b.id),
            amount: Number(b.amount)
          })));
        }
      } catch (e) {
        console.error('Error fetching bills:', e);
      } finally {
        setLoadingBills(false);
      }
    };
    fetchBills();
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
        return newTask;
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

  const toggleTask = async (id: string, done: boolean, skipSync = false) => {
    if (!user) return;
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const newActivity = [
      ...(task.activityLog || []),
      { action: `Task marked as ${done ? 'completed' : 'incomplete'}`, timestamp: new Date().toISOString() }
    ];

    try {
      await updateTask(id, { done, activityLog: newActivity });

      if (!skipSync) {
        // Sync to goal milestones if any milestone matches task text
        const matchingGoal = goals.find(g => 
          g.milestones?.some(m => m.text.toLowerCase().trim() === task.text.toLowerCase().trim())
        );
        if (matchingGoal) {
          const milestoneIndex = matchingGoal.milestones.findIndex(m => 
            m.text.toLowerCase().trim() === task.text.toLowerCase().trim()
          );
          if (milestoneIndex !== -1 && matchingGoal.milestones[milestoneIndex].done !== done) {
            await toggleMilestone(matchingGoal.id, milestoneIndex, true);
          }
        }
      }
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

  const calculateGoalProgress = (goal: {
    created_at?: string;
    completed_by?: string;
    completed_dates?: string[];
    milestones?: { text: string; done: boolean }[];
  }) => {
    let milestoneProgress = 100;
    const hasMilestones = !!(goal.milestones && goal.milestones.length > 0);
    if (hasMilestones && goal.milestones) {
      const completedCount = goal.milestones.filter(m => m.done).length;
      milestoneProgress = Math.round((completedCount / goal.milestones.length) * 100);
    }

    let calendarProgress = 100;
    const hasTargetDate = !!goal.completed_by;
    if (hasTargetDate && goal.completed_by) {
      const start = goal.created_at ? new Date(goal.created_at) : new Date();
      const end = new Date(goal.completed_by);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

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
        const completedDaysCount = goal.completed_dates?.length || 0;
        const timeDiff = end.getTime() - start.getTime();
        let totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
        if (totalDays <= 0) totalDays = 1;
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

      const completedDaysCount = goal.completed_dates?.length || 0;
      calendarProgress = Math.min(100, Math.round((completedDaysCount / totalDays) * 100));
    }

    if (hasMilestones && hasTargetDate) {
      return Math.min(milestoneProgress, calendarProgress);
    } else if (hasMilestones) {
      return milestoneProgress;
    } else {
      return calendarProgress;
    }
  };

  const toggleMilestone = async (goalId: string, milestoneIndex: number, skipSync = false) => {
    if (!user) return;
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    const newMilestones = [...goal.milestones];
    const isDone = !newMilestones[milestoneIndex].done;
    newMilestones[milestoneIndex].done = isDone;

    // Recalculate progress based on newMilestones status and calendar completion
    const progress = calculateGoalProgress({
      ...goal,
      milestones: newMilestones
    });

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
          progress: progress
        }),
      });

      if (response.ok) {
        setGoals((prev) =>
          prev.map((g) =>
            g.id === goalId
              ? { ...g, milestones: newMilestones, progress: progress }
              : g
          )
        );

        if (!skipSync) {
          // Update matching task if one exists
          const milestoneText = newMilestones[milestoneIndex].text;
          const matchingTask = tasks.find(t => 
            t.text.toLowerCase().trim() === milestoneText.toLowerCase().trim()
          );
          if (matchingTask && matchingTask.done !== isDone) {
            await toggleTask(matchingTask.id, isDone, true);
          }
        }
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

  // Event Actions
  const addEvent = async (event: Omit<CalendarEvent, 'id'>) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('novalife_token');
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(event),
      });

      if (response.ok) {
        const newEvent = await response.json();
        setEvents((prev) => [...prev, newEvent]);
      }
    } catch (err) {
      console.error('Error adding event:', err);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('novalife_token');
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
      }
    } catch (err) {
      console.error('Error deleting event:', err);
    }
  };

  const updateEvent = async (id: string, updates: Partial<Omit<CalendarEvent, 'id'>>) => {
    if (!user) return undefined;
    try {
      const token = localStorage.getItem('novalife_token');
      const response = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updated = await response.json();
        setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
        return updated;
      }
    } catch (err) {
      console.error('Error updating event:', err);
    }
    return undefined;
  };

  // Focus Session Actions
  const addFocusSession = async (session: Omit<FocusSession, 'id' | 'created_at'>) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('novalife_token');
      const response = await fetch('/api/focus-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(session),
      });

      if (response.ok) {
        const s = await response.json();
        setFocusSessions((prev) => [s, ...prev]);
      }
    } catch (err) {
      console.error('Error adding focus session:', err);
    }
  };

  const deleteFocusSession = async (id: string) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('novalife_token');
      const response = await fetch(`/api/focus-sessions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setFocusSessions((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error('Error deleting focus session:', err);
    }
  };

  // Conversation Actions
  const addConversation = async (title?: string) => {
    if (!user) return undefined;
    try {
      const token = localStorage.getItem('novalife_token');
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title }),
      });

      if (response.ok) {
        const c = await response.json();
        setConversations((prev) => [c, ...prev]);
        return c;
      }
    } catch (err) {
      console.error('Error adding conversation:', err);
    }
    return undefined;
  };

  const updateConversation = async (id: string, updates: { title?: string; pinned?: boolean }) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('novalife_token');
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        await response.json();
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
              .sort((a, b) => {
                const aPinned = a.id === id ? (updates.pinned !== undefined ? updates.pinned : a.pinned) : a.pinned;
                const bPinned = b.id === id ? (updates.pinned !== undefined ? updates.pinned : b.pinned) : b.pinned;
                if (aPinned && !bPinned) return -1;
                if (!aPinned && bPinned) return 1;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
              })
        );
      }
    } catch (err) {
      console.error('Error updating conversation:', err);
    }
  };

  const deleteConversation = async (id: string) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('novalife_token');
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  const getMessages = async (conversationId: string) => {
    if (!user) return [];
    try {
      const token = localStorage.getItem('novalife_token');
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
    return [];
  };

  const addMessage = async (conversationId: string, role: 'user' | 'model', text: string) => {
    if (!user) return undefined;
    try {
      const token = localStorage.getItem('novalife_token');
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role, text }),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.error('Error adding message:', err);
    }
    return undefined;
  };

  // Finance CRUD Actions
  const addTransaction = async (tData: Omit<Transaction, 'id' | 'user_id'>) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('novalife_token');
      const res = await fetch('/api/finance/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(tData)
      });
      if (res.ok) {
        const added = await res.json();
        const mapped = {
          ...added,
          id: String(added.id),
          amount: Number(added.amount),
          tags: Array.isArray(added.tags) ? added.tags : JSON.parse(added.tags || '[]')
        };
        setTransactions(prev => [mapped, ...prev]);
        return mapped;
      }
    } catch (e) {
      console.error('Error adding transaction:', e);
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Omit<Transaction, 'id' | 'user_id'>>) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('novalife_token');
      const res = await fetch(`/api/finance/transactions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updated = await res.json();
        const mapped = {
          ...updated,
          id: String(updated.id),
          amount: Number(updated.amount),
          tags: Array.isArray(updated.tags) ? updated.tags : JSON.parse(updated.tags || '[]')
        };
        setTransactions(prev => prev.map(t => t.id === id ? mapped : t));
        return mapped;
      }
    } catch (e) {
      console.error('Error updating transaction:', e);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('novalife_token');
      const res = await fetch(`/api/finance/transactions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setTransactions(prev => prev.filter(t => t.id !== id));
      }
    } catch (e) {
      console.error('Error deleting transaction:', e);
    }
  };

  const addBudget = async (bData: Omit<Budget, 'id' | 'user_id'>) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('novalife_token');
      const res = await fetch('/api/finance/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bData)
      });
      if (res.ok) {
        const added = await res.json();
        const mapped = {
          ...added,
          id: String(added.id),
          amount: Number(added.amount)
        };
        setBudgets(prev => {
          const filtered = prev.filter(b => !(b.category === mapped.category && b.month_year === mapped.month_year));
          return [...filtered, mapped];
        });
        return mapped;
      }
    } catch (e) {
      console.error('Error adding budget:', e);
    }
  };

  const deleteBudget = async (id: string) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('novalife_token');
      const res = await fetch(`/api/finance/budgets/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setBudgets(prev => prev.filter(b => b.id !== id));
      }
    } catch (e) {
      console.error('Error deleting budget:', e);
    }
  };

  const addSavingsGoal = async (gData: Omit<SavingsGoal, 'id' | 'user_id'>) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('novalife_token');
      const res = await fetch('/api/finance/savings-goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(gData)
      });
      if (res.ok) {
        const added = await res.json();
        const mapped = {
          ...added,
          id: String(added.id),
          target_amount: Number(added.target_amount),
          saved_amount: Number(added.saved_amount)
        };
        setSavingsGoals(prev => [mapped, ...prev]);
        return mapped;
      }
    } catch (e) {
      console.error('Error adding savings goal:', e);
    }
  };

  const updateSavingsGoal = async (id: string, updates: Partial<Omit<SavingsGoal, 'id' | 'user_id'>>) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('novalife_token');
      const res = await fetch(`/api/finance/savings-goals/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updated = await res.json();
        const mapped = {
          ...updated,
          id: String(updated.id),
          target_amount: Number(updated.target_amount),
          saved_amount: Number(updated.saved_amount)
        };
        setSavingsGoals(prev => prev.map(g => g.id === id ? mapped : g));
        return mapped;
      }
    } catch (e) {
      console.error('Error updating savings goal:', e);
    }
  };

  const deleteSavingsGoal = async (id: string) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('novalife_token');
      const res = await fetch(`/api/finance/savings-goals/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSavingsGoals(prev => prev.filter(g => g.id !== id));
      }
    } catch (e) {
      console.error('Error deleting savings goal:', e);
    }
  };

  const addBill = async (bData: Omit<Bill, 'id' | 'user_id'>) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('novalife_token');
      const res = await fetch('/api/finance/bills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bData)
      });
      if (res.ok) {
        const added = await res.json();
        const mapped = {
          ...added,
          id: String(added.id),
          amount: Number(added.amount)
        };
        setBills(prev => [mapped, ...prev]);
        return mapped;
      }
    } catch (e) {
      console.error('Error adding bill:', e);
    }
  };

  const updateBill = async (id: string, updates: Partial<Omit<Bill, 'id' | 'user_id'>>) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('novalife_token');
      const res = await fetch(`/api/finance/bills/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updated = await res.json();
        const mapped = {
          ...updated,
          id: String(updated.id),
          amount: Number(updated.amount)
        };
        setBills(prev => prev.map(b => b.id === id ? mapped : b));
        return mapped;
      }
    } catch (e) {
      console.error('Error updating bill:', e);
    }
  };

  const deleteBill = async (id: string) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('novalife_token');
      const res = await fetch(`/api/finance/bills/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setBills(prev => prev.filter(b => b.id !== id));
      }
    } catch (e) {
      console.error('Error deleting bill:', e);
    }
  };

  // Financial Health Score Calculation Engine
  const financialHealthScore = useMemo(() => {
    if (!user || transactions.length === 0) return 75; // Neutral-high base

    let score = 70; // Base score

    // 1. Savings Rate (Weight: 30 points)
    const monthlyIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const monthlyExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    if (monthlyIncome > 0) {
      const savingsRate = (monthlyIncome - monthlyExpenses) / monthlyIncome;
      if (savingsRate >= 0.3) score += 30; // Excellent savings rate (30%+)
      else if (savingsRate >= 0.1) score += 20; // Good savings rate (10%-30%)
      else if (savingsRate >= 0) score += 10; // Positive savings rate
      else score -= 15; // Overspending income
    } else if (monthlyExpenses > 0) {
      score -= 15; // Expenses with no income
    } else {
      score += 15;
    }

    // 2. Budget Discipline (Weight: 30 points)
    const currentMonthStr = new Date().toISOString().substring(0, 7); // 'YYYY-MM'
    const currentMonthBudgets = budgets.filter(b => b.month_year === currentMonthStr);

    let budgetsOverspentCount = 0;
    currentMonthBudgets.forEach(b => {
      const spent = transactions
        .filter(t => t.type === 'expense' && t.category === b.category && t.date.startsWith(currentMonthStr))
        .reduce((sum, t) => sum + Number(t.amount), 0);
      if (spent > Number(b.amount)) {
        budgetsOverspentCount++;
      }
    });

    if (currentMonthBudgets.length > 0) {
      if (budgetsOverspentCount === 0) {
        score += 30;
      } else {
        score += Math.max(0, 30 - (budgetsOverspentCount * 10)); // Deduct 10 points per overspent budget
      }
    } else {
      score += 15; // Neutral point if no budgets defined
    }

    // 3. Bill Payment Consistency (Weight: 40 points)
    const unpaidBills = bills.filter(b => !b.paid);
    const missedBillsCount = unpaidBills.filter(b => {
      const due = new Date(b.due_date);
      return due.getTime() < Date.now();
    }).length;

    if (missedBillsCount > 0) {
      score -= (missedBillsCount * 15); // Deduct 15 points per overdue unpaid bill
    } else {
      score += 40; // No overdue unpaid bills
    }

    return Math.max(0, Math.min(100, score));
  }, [transactions, budgets, bills, user]);

  // Central Productivity Scoring Engine (recalculates automatically on any activity update, blended with Financial Health)
  const productivityScore = useMemo(() => {
    const pScore = calculateProductivityScore(tasks, habits, goals, focusSessions, events, rescueActivations);
    if (!user) return pScore;
    // Blend 85% Productivity + 15% Financial Health
    return Math.max(0, Math.min(100, Math.round(pScore * 0.85 + financialHealthScore * 0.15)));
  }, [tasks, habits, goals, focusSessions, events, rescueActivations, financialHealthScore, user]);

  return (
    <DataContext.Provider
      value={{
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
        updateGoal,
        events,
        loadingEvents,
        addEvent,
        deleteEvent,
        updateEvent,
        focusSessions,
        loadingFocusSessions,
        addFocusSession,
        deleteFocusSession,
        conversations,
        loadingConversations,
        addConversation,
        updateConversation,
        deleteConversation,
        getMessages,
        addMessage,
        productivityScore,
        rescueActivations,
        triggerRescueActivation,
        aiActiveConvId,
        setAiActiveConvId,
        aiMessages,
        setAiMessages,
        aiInput,
        setAiInput,
        aiSearchQuery,
        setAiSearchQuery,
        aiScrollTop,
        setAiScrollTop,
        transactions,
        loadingTransactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        budgets,
        loadingBudgets,
        addBudget,
        deleteBudget,
        savingsGoals,
        loadingSavingsGoals,
        addSavingsGoal,
        updateSavingsGoal,
        deleteSavingsGoal,
        bills,
        loadingBills,
        addBill,
        updateBill,
        deleteBill,
        financialHealthScore,
      }}
    >
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
