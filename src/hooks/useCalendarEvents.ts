import { useDataContext } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export type CalendarEvent = {
  id: string;
  title: string;
  start: number; // Start hour (e.g. 9 for 9:00 AM)
  duration: number; // Duration in hours (e.g. 1.5)
  day: number; // 0 (Sun) to 6 (Sat)
  color: string;
  type: 'study' | 'meeting' | 'health' | 'focus' | 'work' | 'break' | 'personal';
  prepChecklist?: { text: string; done: boolean }[];
  weekOffset?: number;
};

export function useCalendarEvents() {
  const { events, loadingEvents, addEvent, deleteEvent, updateEvent } = useDataContext();
  const { user } = useAuth();

  return {
    events,
    loading: loadingEvents,
    addEvent,
    deleteEvent,
    updateEvent,
    user
  };
}

