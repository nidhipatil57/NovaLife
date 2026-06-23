import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export type Milestone = {
  text: string;
  done: boolean;
};

export type Goal = {
  id: string;
  name: string;
  category: string;
  progress: number;
  color: string;
  milestones: Milestone[];
};

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setGoals([]);
      setLoading(false);
      return;
    }

    const fetchGoals = async () => {
      setLoading(true);
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
          }));
          setGoals(mappedGoals);
        } else {
          console.error('Failed to fetch goals.');
        }
      } catch (err) {
        console.error('Error fetching goals from server:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, [user]);

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
        };
        setGoals((prev) => [...prev, newGoal]);
      } else {
        console.error('Failed to create goal on backend.');
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

    const completedCount = newMilestones.filter((m) => m.done).length;
    const progress = newMilestones.length > 0 ? Math.round((completedCount / newMilestones.length) * 100) : 0;

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
          progress,
        }),
      });

      if (response.ok) {
        setGoals((prev) =>
          prev.map((g) =>
            g.id === goalId
              ? { ...g, milestones: newMilestones, progress }
              : g
          )
        );
      } else {
        console.error('Failed to update goal milestones on backend.');
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
      } else {
        console.error('Failed to delete goal from backend.');
      }
    } catch (err) {
      console.error('Error deleting goal:', err);
    }
  };

  return { goals, loading, addGoal, toggleMilestone, deleteGoal, user };
}
