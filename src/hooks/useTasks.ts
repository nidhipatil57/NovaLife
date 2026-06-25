import { useAuth } from '../context/AuthContext';
import { useDataContext } from '../context/DataContext';

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
  const { user } = useAuth();
  const { tasks, loadingTasks, addTask, updateTask, toggleTask, deleteTask } = useDataContext();

  return {
    tasks,
    loading: loadingTasks,
    user,
    addTask,
    updateTask,
    toggleTask,
    deleteTask
  };
}
