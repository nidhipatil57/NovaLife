import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export type CalendarEvent = {
  id: string;
  title: string;
  start: number; // Start hour (e.g. 9 for 9:00 AM)
  duration: number; // Duration in hours (e.g. 1.5)
  day: number; // 0 (Sun) to 6 (Sat)
  color: string;
  type: 'study' | 'meeting' | 'health' | 'focus' | 'work' | 'break';
};

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }

    const fetchEvents = async () => {
      setLoading(true);
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
        } else {
          console.error('Failed to fetch events.');
        }
      } catch (err) {
        console.error('Error fetching calendar events from server:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user]);

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
      } else {
        console.error('Failed to create calendar event on backend.');
      }
    } catch (err) {
      console.error('Error adding calendar event:', err);
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
      } else {
        console.error('Failed to delete calendar event from backend.');
      }
    } catch (err) {
      console.error('Error deleting calendar event:', err);
    }
  };

  return { events, loading, addEvent, deleteEvent, user };
}
