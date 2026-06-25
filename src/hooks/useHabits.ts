import { useAuth } from '../context/AuthContext';
import { useDataContext } from '../context/DataContext';

export type Habit = {
  id: string;
  name: string;
  target: string;
  streak: number;
  best: number;
  rate: number;
  week: boolean[]; // 7 elements representing Mon-Sun
  color: string;
  notes?: string;
};

export function useHabits() {
  const { user } = useAuth();
  const { habits, loadingHabits, addHabit, toggleHabitDay, deleteHabit, updateHabit } = useDataContext();

  return {
    habits,
    loading: loadingHabits,
    addHabit,
    toggleHabitDay,
    deleteHabit,
    updateHabit,
    user
  };
}
