import { useAuth } from '../context/AuthContext';
import { useDataContext } from '../context/DataContext';

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
  completed_by?: string;
  completed_dates?: string[];
  streak?: number;
  notes?: string;
  ai_generated?: boolean;
  created_at?: string;
};

export function useGoals() {
  const { user } = useAuth();
  const { goals, loadingGoals, addGoal, toggleMilestone, deleteGoal, updateGoal } = useDataContext();

  return {
    goals,
    loading: loadingGoals,
    addGoal,
    toggleMilestone,
    deleteGoal,
    updateGoal,
    user
  };
}
