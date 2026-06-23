import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export type Habit = {
  id: string;
  name: string;
  target: string;
  streak: number;
  best: number;
  rate: number;
  week: boolean[]; // 7 elements representing Mon-Sun
  color: string;
};

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setHabits([]);
      setLoading(false);
      return;
    }

    const fetchHabits = async () => {
      setLoading(true);
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
          }));
          setHabits(mappedHabits);
        } else {
          console.error('Failed to fetch habits.');
        }
      } catch (err) {
        console.error('Error fetching habits from server:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHabits();
  }, [user]);

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
        };
        setHabits((prev) => [...prev, newHabit]);
      } else {
        console.error('Failed to create habit on backend.');
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
      } else {
        console.error('Failed to update habit streak on backend.');
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
      } else {
        console.error('Failed to delete habit from backend.');
      }
    } catch (err) {
      console.error('Error deleting habit:', err);
    }
  };

  return { habits, loading, addHabit, toggleHabitDay, deleteHabit, user };
}
