import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCalendarEvents, type CalendarEvent } from '../hooks/useCalendarEvents';
import { useTasks } from '../hooks/useTasks';
import { useDataContext } from '../context/DataContext';
import { CustomSelect } from '../components/ui/CustomSelect';
import './CalendarPage.css';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const timeSlots = Array.from({ length: 14 }, (_, i) => `${i + 7}:00`);

const dayOptions = days.map((d, i) => ({
  label: d,
  value: String(i),
  icon: '📅'
}));

const typeOptions = [
  { label: 'Focus Sprint', value: 'focus', icon: '🎧' },
  { label: 'Study session', value: 'study', icon: '📚' },
  { label: 'Meeting', value: 'meeting', icon: '💼' },
  { label: 'Health/Gym', value: 'health', icon: '🏋️' },
  { label: 'Work Block', value: 'work', icon: '💻' },
  { label: 'Break', value: 'break', icon: '☕' },
  { label: 'Personal', value: 'personal', icon: '👤' },
];

const startOptions = Array.from({ length: 14 }, (_, i) => i + 7).map(hour => ({
  label: `${hour}:00`,
  value: String(hour),
  icon: '⏰'
}));

const durationOptions = [
  { label: '30 mins', value: '0.5', icon: '⏳' },
  { label: '1 hour', value: '1', icon: '⏳' },
  { label: '1.5 hours', value: '1.5', icon: '⏳' },
  { label: '2 hours', value: '2', icon: '⏳' },
  { label: '3 hours', value: '3', icon: '⏳' },
  { label: '4 hours', value: '4', icon: '⏳' },
];

const colorsConfig = [
  { name: 'Red', value: 'var(--accent-red)' },
  { name: 'Blue', value: 'var(--accent-blue)' },
  { name: 'Purple', value: 'var(--accent-purple)' },
  { name: 'Green', value: 'var(--accent-green)' },
  { name: 'Cyan', value: 'var(--accent-cyan)' },
  { name: 'Orange', value: 'var(--accent-orange)' },
];

const getEmojiForType = (type: string) => {
  switch (type) {
    case 'focus': return '🎧';
    case 'study': return '📚';
    case 'meeting': return '💼';
    case 'health': return '🏋️';
    case 'work': return '💻';
    case 'break': return '☕';
    case 'personal': return '👤';
    default: return '📅';
  }
};

export default function CalendarPage() {
  const { events, loading: eventsLoading, addEvent, deleteEvent, updateEvent, user } = useCalendarEvents();
  const { tasks, loading: tasksLoading } = useTasks();
  const { goals } = useDataContext();
  const navigate = useNavigate();

  const isGoalTickedTimeline = (() => {
    const goalsWithDeadlines = goals.filter(g => g.completed_by);
    if (goalsWithDeadlines.length === 0) return false;
    
    for (const goal of goalsWithDeadlines) {
      if (!goal.completed_by) continue;
      const start = goal.created_at ? new Date(goal.created_at) : new Date();
      const end = new Date(goal.completed_by);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      
      const requiredDates: string[] = [];
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
        const allTicked = requiredDates.every(dateStr => completedSet.has(dateStr));
        if (!allTicked) return false;
      } else {
        return false;
      }
    }
    return true;
  })();
  
  const [view, setView] = useState<'week' | 'month' | 'day'>('week');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState(new Date().getDay());
  const [currentMonthOffset, setCurrentMonthOffset] = useState(0);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStart, setNewStart] = useState(9);
  const [newDuration, setNewDuration] = useState(1);
  const [newDay, setNewDay] = useState(1); // Monday
  const [newColor, setNewColor] = useState('var(--accent-blue)');
  const [newType, setNewType] = useState<CalendarEvent['type']>('focus');
  const [isModalSourceCell, setIsModalSourceCell] = useState(false);

  // Detail Modal / Edit states
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [detailTab, setDetailTab] = useState<'edit' | 'prep' | 'conflicts'>('edit');
  const [newPrepItemText, setNewPrepItemText] = useState('');
  const [clickedTasksDue, setClickedTasksDue] = useState<{ dateLabel: string; tasks: any[] } | null>(null);

  const getTaskDueDate = (dueStr: string): Date | null => {
    if (!dueStr || dueStr.includes('No due date')) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const normalized = dueStr.toLowerCase().trim();
    if (normalized === 'today') {
      return today;
    }
    if (normalized === 'tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return tomorrow;
    }
    if (normalized === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      return yesterday;
    }
    
    const weekdayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const shortWeekdayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    
    for (let i = 0; i < 7; i++) {
      if (normalized === weekdayNames[i] || normalized === shortWeekdayNames[i]) {
        const currentDayIdx = today.getDay();
        const diff = i - currentDayIdx;
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + diff);
        return targetDate;
      }
    }
    
    // 1. Try parsing full string
    try {
      const parsed = new Date(dueStr);
      if (!isNaN(parsed.getTime())) {
        parsed.setHours(0, 0, 0, 0);
        return parsed;
      }
    } catch (e) {}

    // 2. Try splitting by comma to strip time (e.g. "Jun 24, 07:04 PM" -> "Jun 24")
    if (dueStr.includes(',')) {
      try {
        const parts = dueStr.split(',');
        const parsed = new Date(parts[0].trim());
        if (!isNaN(parsed.getTime())) {
          parsed.setHours(0, 0, 0, 0);
          return parsed;
        }
      } catch (e) {}
    }

    // 3. Try splitting by space and take first 2 parts (e.g. "Jun 24 07:04 PM" -> "Jun 24")
    const words = dueStr.trim().split(/\s+/);
    if (words.length >= 2) {
      try {
        const firstTwo = words[0] + ' ' + words[1];
        const parsed = new Date(firstTwo);
        if (!isNaN(parsed.getTime())) {
          parsed.setHours(0, 0, 0, 0);
          return parsed;
        }
      } catch (e) {}
    }
    
    return null;
  };

  const getTasksDueOnDay = (dayIdx: number, weekOffset: number) => {
    const eventDate = getEventDate(dayIdx, weekOffset);
    return tasks.filter(t => {
      if (t.done) return false;
      const taskDue = getTaskDueDate(t.due);
      if (!taskDue) return false;
      return taskDue.getDate() === eventDate.getDate() &&
             taskDue.getMonth() === eventDate.getMonth() &&
             taskDue.getFullYear() === eventDate.getFullYear();
    });
  };

  // Date Calculation Helpers
  const getEventDate = (day: number, weekOffset: number) => {
    const today = new Date();
    let currentDay = today.getDay();
    if (currentDay === 0) currentDay = 7;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay + 1 + (weekOffset * 7));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const offsetFromMonday = day === 0 ? 6 : day - 1;
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + offsetFromMonday);
    return date;
  };

  const getWeekOffsetForDate = (date: Date) => {
    const today = new Date();
    let currentDay = today.getDay();
    if (currentDay === 0) currentDay = 7;
    const todayMonday = new Date(today);
    todayMonday.setDate(today.getDate() - currentDay + 1);
    todayMonday.setHours(0, 0, 0, 0);
    
    let dateDay = date.getDay();
    if (dateDay === 0) dateDay = 7;
    const dateMonday = new Date(date);
    dateMonday.setDate(date.getDate() - dateDay + 1);
    dateMonday.setHours(0, 0, 0, 0);
    
    const diffTime = dateMonday.getTime() - todayMonday.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return Math.round(diffDays / 7);
  };

  const getDayViewDate = () => {
    const today = new Date();
    let currentDay = today.getDay();
    if (currentDay === 0) currentDay = 7;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay + 1 + (currentWeekOffset * 7));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const offsetFromMonday = selectedDayIndex === 0 ? 6 : selectedDayIndex - 1;
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + offsetFromMonday);
    return date;
  };

  const getOrdinalSuffix = (dayNum: number) => {
    if (dayNum > 3 && dayNum < 21) return 'th';
    switch (dayNum % 10) {
      case 1:  return "st";
      case 2:  return "nd";
      case 3:  return "rd";
      default: return "th";
    }
  };

  const formatDayDate = (date: Date) => {
    const dayNum = date.getDate();
    const monthName = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return `${dayNum}${getOrdinalSuffix(dayNum)} ${monthName}, ${year}`;
  };

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getMonthNameAndYear = (monthOffset: number) => {
    const today = new Date();
    const targetDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const monthName = targetDate.toLocaleDateString('en-US', { month: 'long' });
    const year = targetDate.getFullYear();
    return `${monthName}, ${year}`;
  };

  const getWeekDateRange = (offset: number) => {
    const today = new Date();
    let currentDay = today.getDay();
    if (currentDay === 0) currentDay = 7;
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay + 1 + (offset * 7));
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const formatYear = (d: Date) => d.getFullYear();
    
    return `${formatDate(startOfWeek)} – ${formatDate(endOfWeek)}, ${formatYear(endOfWeek)}`;
  };

  const getDayDate = (dayIdx: number, offset: number) => {
    const today = new Date();
    let currentDay = today.getDay();
    if (currentDay === 0) currentDay = 7;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay + 1 + (offset * 7));
    
    const offsetFromMonday = dayIdx === 0 ? 6 : dayIdx - 1;
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + offsetFromMonday);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getMonthGridDays = (monthOffset: number) => {
    const today = new Date();
    const targetDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 6 = Sat
    const trailingDaysCount = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const totalDays = new Date(year, month + 1, 0).getDate(); // days in target month
    
    const gridCells = [];
    
    // Previous month's trailing days
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = trailingDaysCount - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      gridCells.push({
        date: d,
        isCurrentMonth: false,
        dayNum: prevMonthDays - i
      });
    }
    
    // Current month's days
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      gridCells.push({
        date: d,
        isCurrentMonth: true,
        dayNum: i
      });
    }
    
    // Next month's leading days to pad to 42 cells
    const remaining = 42 - gridCells.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      gridCells.push({
        date: d,
        isCurrentMonth: false,
        dayNum: i
      });
    }
    
    return gridCells;
  };

  const getEventPositionStyles = (dayEvents: CalendarEvent[]) => {
    const sorted = [...dayEvents].sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return b.duration - a.duration;
    });

    const columns: CalendarEvent[][] = [];
    const eventColumnMap = new Map<string, number>();

    for (const e of sorted) {
      let placed = false;
      for (let colIdx = 0; colIdx < columns.length; colIdx++) {
        const hasOverlap = columns[colIdx].some(other => {
          return Math.max(e.start, other.start) < Math.min(e.start + e.duration, other.start + other.duration);
        });
        if (!hasOverlap) {
          columns[colIdx].push(e);
          eventColumnMap.set(e.id, colIdx);
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([e]);
        eventColumnMap.set(e.id, columns.length - 1);
      }
    }

    const eventStyles = new Map<string, { left: string; width: string }>();

    for (const e of sorted) {
      const colIdx = eventColumnMap.get(e.id) || 0;
      const overlappingEvents = sorted.filter(other => {
        return Math.max(e.start, other.start) < Math.min(e.start + e.duration, other.start + other.duration);
      });

      const overlappingCols = new Set(overlappingEvents.map(other => eventColumnMap.get(other.id) || 0));
      const colsCount = Math.max(overlappingCols.size, 1);

      const widthPercent = 100 / colsCount;
      const activeColsSorted = Array.from(overlappingCols).sort((a, b) => a - b);
      const positionInActive = activeColsSorted.indexOf(colIdx);
      
      const left = positionInActive * widthPercent;
      const padding = 2; // px padding
      
      eventStyles.set(e.id, {
        left: `calc(${left}% + ${padding}px)`,
        width: `calc(${widthPercent}% - ${padding * 2}px)`
      });
    }

    return eventStyles;
  };

  /*
  // Dynamic Deadline Heatmap based on active critical/high tasks
  const getDayRisk = (dayName: string) => {
    const activeUrgentTasks = tasks.filter(
      (t) =>
        !t.done &&
        (t.priority === 'critical' || t.priority === 'high') &&
        t.due.toLowerCase().includes(dayName.toLowerCase())
    );

    if (activeUrgentTasks.length >= 2) return 'high';
    if (activeUrgentTasks.length === 1) return 'medium';
    return 'low';
  };
  */


  // Auto Default Colors for Add Block Modal
  const handleTypeChange = (type: CalendarEvent['type']) => {
    setNewType(type);
    switch (type) {
      case 'focus': setNewColor('var(--accent-purple)'); break;
      case 'meeting': setNewColor('var(--accent-blue)'); break;
      case 'break': setNewColor('var(--accent-green)'); break;
      case 'personal': setNewColor('var(--accent-orange)'); break;
      case 'study': setNewColor('var(--accent-cyan)'); break;
      case 'health': setNewColor('var(--accent-red)'); break;
      case 'work': setNewColor('var(--accent-blue)'); break;
    }
  };


  // Create event from standard modal
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await addEvent({
        title: newTitle,
        start: Number(newStart),
        duration: Number(newDuration),
        day: Number(newDay),
        color: newColor,
        type: newType,
        prepChecklist: [],
        weekOffset: currentWeekOffset,
      });

      // Reset
      setNewTitle('');
      setNewStart(9);
      setNewDuration(1);
      setNewDay(1);
      setNewColor('var(--accent-blue)');
      setNewType('focus');
      setShowAddModal(false);
    } catch (err) {
      alert('Failed to add event.');
    }
  };

  // Click on empty cell to create a block
  const handleCellClick = (dayIdx: number, startHour: number) => {
    setNewDay(dayIdx);
    setNewStart(startHour);
    setNewDuration(1);
    
    // Pick auto-color for type focus
    setNewType('focus');
    setNewColor('var(--accent-purple)');
    
    setNewTitle('');
    setIsModalSourceCell(true);
    setShowAddModal(true);
  };

  // Event Clicked: open detail modal/panel
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setDetailTab('edit');
  };

  // Delete event in edit panel
  const handleEventDelete = async () => {
    if (!selectedEvent) return;
    if (confirm(`Do you want to delete the blocked event "${selectedEvent.title}"?`)) {
      try {
        await deleteEvent(selectedEvent.id);
        setSelectedEvent(null);
      } catch (err) {
        alert('Failed to delete event.');
      }
    }
  };

  // Save edits on Done click
  const handleDoneClick = async () => {
    if (!selectedEvent) return;
    try {
      const result = await updateEvent(selectedEvent.id, {
        title: selectedEvent.title,
        start: Number(selectedEvent.start),
        duration: Number(selectedEvent.duration),
        day: Number(selectedEvent.day),
        color: selectedEvent.color,
        type: selectedEvent.type,
        prepChecklist: selectedEvent.prepChecklist || [],
        weekOffset: Number(selectedEvent.weekOffset || 0)
      });
      if (result) {
        setSelectedEvent(null);
      } else {
        alert('Failed to save changes. Please try again.');
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save changes.');
    }
  };

  // Inline Edits Change Handler
  const handleEditField = (field: keyof Omit<CalendarEvent, 'id'>, value: any) => {
    if (!selectedEvent) return;
    const updated = { ...selectedEvent, [field]: value };
    setSelectedEvent(updated);
  };


  // Prep Checklist Handlers
  const handleAddPrepItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !newPrepItemText.trim()) return;

    const checklist = selectedEvent.prepChecklist || [];
    const updatedChecklist = [...checklist, { text: newPrepItemText.trim(), done: false }];
    
    handleEditField('prepChecklist', updatedChecklist);
    setNewPrepItemText('');
  };

  const handleTogglePrepItem = (index: number) => {
    if (!selectedEvent) return;
    const checklist = selectedEvent.prepChecklist || [];
    const updatedChecklist = checklist.map((item, idx) => 
      idx === index ? { ...item, done: !item.done } : item
    );
    handleEditField('prepChecklist', updatedChecklist);
  };

  const handleDeletePrepItem = (index: number) => {
    if (!selectedEvent) return;
    const checklist = selectedEvent.prepChecklist || [];
    const updatedChecklist = checklist.filter((_, idx) => idx !== index);
    handleEditField('prepChecklist', updatedChecklist);
  };

  // Navigation handlers
  const handleWeekChange = (direction: number) => {
    setCurrentWeekOffset(prev => prev + direction);
  };

  const handleDayChange = (direction: number) => {
    const currentDate = getDayViewDate();
    currentDate.setDate(currentDate.getDate() + direction);
    
    const newWeekOffset = getWeekOffsetForDate(currentDate);
    const newDayIndex = currentDate.getDay();
    
    setCurrentWeekOffset(newWeekOffset);
    setSelectedDayIndex(newDayIndex);
  };

  const handleMonthChange = (direction: number) => {
    setCurrentMonthOffset(prev => prev + direction);
  };

  const handlePrev = () => {
    if (view === 'day') {
      handleDayChange(-1);
    } else if (view === 'week') {
      handleWeekChange(-1);
    } else {
      handleMonthChange(-1);
    }
  };

  const handleNext = () => {
    if (view === 'day') {
      handleDayChange(1);
    } else if (view === 'week') {
      handleWeekChange(1);
    } else {
      handleMonthChange(1);
    }
  };

  const handleJumpToToday = () => {
    setCurrentWeekOffset(0);
    setSelectedDayIndex(new Date().getDay());
    setCurrentMonthOffset(0);
  };

  const handleMonthCellClick = (cellDate: Date) => {
    const newWeekOffset = getWeekOffsetForDate(cellDate);
    const newDayIndex = cellDate.getDay();
    setCurrentWeekOffset(newWeekOffset);
    setSelectedDayIndex(newDayIndex);
    setView('day');
  };

  const handleAddBlockClick = () => {
    setNewDay(1); // default Mon
    setNewStart(9); // default 9:00 AM
    setNewDuration(1);
    setNewTitle('');
    setNewColor('var(--accent-blue)');
    setNewType('focus');
    setIsModalSourceCell(false);
    setShowAddModal(true);
  };

  // Filtering events for current view
  const currentWeekEvents = events.filter(e => (e.weekOffset || 0) === currentWeekOffset);


  // Calculate Conflicts for selected event
  const isOverlapConflict = (e1: CalendarEvent) => {
    return events.some(e2 => {
      if (e1.id === e2.id || e1.day !== e2.day || (e1.weekOffset || 0) !== (e2.weekOffset || 0)) return false;
      return Math.max(e1.start, e2.start) < Math.min(e1.start + e1.duration, e2.start + e2.duration);
    });
  };

  /*
  const getOverlappingEvent = (e1: CalendarEvent) => {
    return events.find(e2 => {
      if (e1.id === e2.id || e1.day !== e2.day || (e1.weekOffset || 0) !== (e2.weekOffset || 0)) return false;
      return Math.max(e1.start, e2.start) < Math.min(e1.start + e1.duration, e2.start + e2.duration);
    });
  };
  */

  // Calculate Health Check stats for active week
  const totalBlockedHours = currentWeekEvents.reduce((sum, e) => sum + e.duration, 0);

  const activeWeekDays = [0, 1, 2, 3, 4, 5, 6].map(idx => days[idx].toLowerCase());
  const weeklyDeadlinesCount = tasks.filter(t => {
    if (t.done || (t.priority !== 'critical' && t.priority !== 'high')) return false;
    return activeWeekDays.some(dayName => t.due.toLowerCase().includes(dayName));
  }).length;

  let conflictsCount = 0;
  const checkedPairs = new Set<string>();
  currentWeekEvents.forEach(e1 => {
    currentWeekEvents.forEach(e2 => {
      if (e1.id !== e2.id && e1.day === e2.day) {
        const pairId = [e1.id, e2.id].sort().join('-');
        if (!checkedPairs.has(pairId)) {
          checkedPairs.add(pairId);
          const overlap = Math.max(e1.start, e2.start) < Math.min(e1.start + e1.duration, e2.start + e2.duration);
          if (overlap) {
            conflictsCount++;
          }
        }
      }
    });
  });

  if (!user) {
    return (
      <div className="calendar-page" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex', minHeight: '60vh' }}>
        <div className="widget glass-card-static" style={{ padding: '40px', textAlign: 'center', maxWidth: '480px' }}>
          <h3>🔒 Authentication Required</h3>
          <p style={{ marginTop: '12px', marginBottom: '24px' }}>Please log in using Google or email on the login page to access your calendar.</p>
        </div>
      </div>
    );
  }

  const isLoading = eventsLoading || tasksLoading;

  return (
    <div className="calendar-page">
      <div className="page-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0 }}>📅 <span className="gradient-text">Calendar</span></h2>
              {user?.hasGoogleCalendar && isGoalTickedTimeline && (
                <div className="gcal-status-badge" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  color: '#10b981',
                  fontWeight: '600',
                  boxShadow: '0 2px 10px rgba(16, 185, 129, 0.1)',
                  position: 'relative'
                }}>
                  <span className="green-lighting-dot" />
                  Google Calendar is connected. All data and events are synced
                </div>
              )}
            </div>
            <p style={{ marginTop: '4px' }}>AI-powered scheduling — auto time-blocking, conflict detection, and smart planning.</p>
          </div>
          <button className="btn-primary btn-sm" onClick={handleAddBlockClick}>+ Block Time</button>
        </div>

        <div className="calendar-controls-row" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          background: 'rgba(255, 255, 255, 0.01)', 
          padding: '12px 20px', 
          borderRadius: 'var(--radius-xl)', 
          border: '1px solid rgba(255, 255, 255, 0.04)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          gap: '16px'
        }}>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
            <div className="view-toggle">
              <button className={view === 'day' ? 'active' : ''} onClick={() => setView('day')}>Day</button>
              <button className={view === 'week' ? 'active' : ''} onClick={() => setView('week')}>Week</button>
              <button className={view === 'month' ? 'active' : ''} onClick={() => setView('month')}>Month</button>
            </div>
          </div>

          <div style={{ flex: 1.5, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
            <button className="nav-btn today-btn" onClick={handleJumpToToday}>Today</button>
            <div className="nav-navigation-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button className="nav-btn" onClick={handlePrev} title="Previous">◀</button>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '180px', textAlign: 'center' }}>
                {view === 'day' ? (
                  <>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      {formatDayDate(getDayViewDate())}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 'normal' }}>
                      {getDayName(getDayViewDate())}
                    </span>
                  </>
                ) : view === 'week' ? (
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {getWeekDateRange(currentWeekOffset)}
                  </span>
                ) : (
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {getMonthNameAndYear(currentMonthOffset)}
                  </span>
                )}
              </div>

              <button className="nav-btn" onClick={handleNext} title="Next">▶</button>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <div className="controls-mode-indicator" style={{ 
              fontSize: '11px', 
              color: 'var(--text-tertiary)', 
              fontWeight: 'bold', 
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              background: 'rgba(255,255,255,0.03)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255,255,255,0.02)'
            }}>
              {view} View
            </div>
          </div>
        </div>
      </div>

      {/* AI Scheduling Banner */}
      <div className="ai-schedule-banner widget">
        <div className="ai-avatar-inner" style={{ width: 28, height: 28, flexShrink: 0 }}></div>
        <div className="ai-schedule-text">
          {events.length === 0 ? (
            <span><strong>Your Calendar is empty</strong>. Click "+ Block Time" to schedule events or study sprints in Cloud Firestore!</span>
          ) : (
            <span>
              <strong>AI Autopilot Syncing</strong> — {currentWeekEvents.length} events active for the selected week. 
              Click on any event block to open details, check prep lists, or resolve conflicts inline.
            </span>
          )}
        </div>
      </div>


      {isLoading ? (
        <div className="loading-state" style={{ textAlign: 'center', padding: '60px' }}>
          <div className="ai-onboard-avatar" style={{ margin: '0 auto 20px auto', width: '40px', height: '40px' }}></div>
          <p>Loading your calendar...</p>
        </div>
      ) : view === 'week' ? (
        /* Weekly Timeline */
        <div className="week-view widget" style={{ overflowX: 'auto' }}>
          <div className="week-grid" style={{ minWidth: '850px' }}>
            <div className="time-column">
              <div className="day-header" style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderRight: 'none' }}>
                <span style={{ visibility: 'hidden' }}>Time</span>
                <span style={{ fontSize: '9px', visibility: 'hidden' }}>Date</span>
              </div>
              {timeSlots.map((t, i) => <div key={i} className="time-slot">{t}</div>)}
            </div>
            {[1, 2, 3, 4, 5, 6, 0].map(dayIdx => {
              const dayEvents = currentWeekEvents.filter(e => e.day === dayIdx);
              const positions = getEventPositionStyles(dayEvents);
              const dayTasksDue = getTasksDueOnDay(dayIdx, currentWeekOffset);
              
              return (
                <div key={dayIdx} className="day-column">
                  <div className="day-header" style={{ display: 'flex', flexDirection: 'column', gap: '2px', position: 'relative' }}>
                    <span>{days[dayIdx]}</span>
                    <span style={{ fontSize: '9px', opacity: 0.6 }}>{getDayDate(dayIdx, currentWeekOffset)}</span>
                    {dayTasksDue.length > 0 && (
                      <div 
                        className="event-task-bubble"
                        onClick={(e) => {
                          e.stopPropagation();
                          setClickedTasksDue({
                            dateLabel: `${days[dayIdx]}, ${getDayDate(dayIdx, currentWeekOffset)}`,
                            tasks: dayTasksDue
                          });
                        }}
                        style={{ position: 'absolute', top: '4px', right: '4px' }}
                        title={`${dayTasksDue.length} task(s) due today. Click to view.`}
                      >
                        <div className="chat-bubble-icon">
                          !
                          <span className="red-lighting-dot" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="day-slots" style={{ height: `${timeSlots.length * 72}px` }}>
                    {timeSlots.map((_, i) => (
                      <div 
                        key={i} 
                        className="slot-cell"
                        onClick={() => handleCellClick(dayIdx, i + 7)}
                        title="Click to block this time slot"
                      >
                        <span className="slot-plus-icon">+</span>
                      </div>
                    ))}
                    {dayEvents.map(event => {
                      const pos = positions.get(event.id) || { left: '6px', width: 'calc(100% - 12px)' };
                      const hasConflict = isOverlapConflict(event);
                      const checklist = event.prepChecklist || [];
                      const totalItems = checklist.length;
                      const completedItems = checklist.filter(item => item.done).length;
                      const percent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
                      
                      return (
                        <div
                          key={event.id}
                          className={`calendar-event event-${event.type} ${hasConflict ? 'has-conflict-card' : ''}`}
                          onClick={() => handleEventClick(event)}
                          style={{
                            top: `${(event.start - 7) * 72}px`,
                            height: `${event.duration * 72 - 4}px`,
                            background: `${event.color}15`,
                            borderLeft: hasConflict ? `3px dashed var(--accent-orange)` : `3px solid ${event.color}`,
                            cursor: 'pointer',
                            zIndex: 2,
                            left: pos.left,
                            width: pos.width
                          }}
                          title="Click to edit block details"
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%' }}>
                            <span className="event-title" style={{ display: 'block' }}>{event.title}</span>
                            <span className="event-time" style={{ display: 'block' }}>{event.start}:00 - {event.start + event.duration}:00</span>
                          </div>

                          {totalItems > 0 && (
                            <div className="event-card-checklist-summary" style={{ width: '100%' }}>
                              <div className="event-mini-progress">
                                <div className="event-mini-progress-fill" style={{ width: `${percent}%`, backgroundColor: event.color }}></div>
                              </div>
                              <span style={{ fontSize: '8px', color: 'var(--text-tertiary)', marginTop: '2px', display: 'block' }}>
                                📋 {completedItems}/{totalItems} ({percent}%)
                              </span>
                            </div>
                          )}
                          <span className="event-type-badge" style={{ backgroundColor: `${event.color}25`, color: event.color }}>
                            {getEmojiForType(event.type)} {event.type}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : view === 'day' ? (
        /* Day View — Single column breakdown */
        <div className="day-view widget">
          <div className="day-grid">
            <div className="time-column">
              <div className="day-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap', borderRight: 'none' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', visibility: 'hidden' }}>📅 Spacer</span>
                <div style={{ display: 'flex', gap: '6px', visibility: 'hidden' }}>
                  <button className="day-nav-header-btn" style={{ padding: '4px 10px' }}>Spacer</button>
                </div>
              </div>
              {timeSlots.map((t, i) => <div key={i} className="time-slot">{t}</div>)}
            </div>
            <div className="day-column">
              <div className="day-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                {(() => {
                  const dayTasksDue = getTasksDueOnDay(selectedDayIndex, currentWeekOffset);
                  const dateLabel = `${getDayName(getDayViewDate())}, ${formatDayDate(getDayViewDate())}`;
                  return (
                    <span style={{ fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      📅 {dateLabel}
                      {dayTasksDue.length > 0 && (
                        <div 
                          className="event-task-bubble"
                          onClick={(e) => {
                            e.stopPropagation();
                            setClickedTasksDue({
                              dateLabel,
                              tasks: dayTasksDue
                            });
                          }}
                          style={{ position: 'relative', top: 'auto', right: 'auto', display: 'inline-flex', cursor: 'pointer' }}
                          title={`${dayTasksDue.length} task(s) due today. Click to view.`}
                        >
                          <div className="chat-bubble-icon">
                            !
                            <span className="red-lighting-dot" />
                          </div>
                        </div>
                      )}
                    </span>
                  );
                })()}
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[1, 2, 3, 4, 5, 6, 0].map(dayIdx => {
                    const d = days[dayIdx];
                    return (
                      <button 
                        key={d} 
                        className={`day-nav-header-btn`}
                        style={{
                          background: selectedDayIndex === dayIdx ? 'var(--accent-blue)' : 'rgba(255,255,255,0.03)',
                          border: selectedDayIndex === dayIdx ? '1px solid var(--accent-blue-light)' : '1px solid rgba(255,255,255,0.05)',
                          fontWeight: selectedDayIndex === dayIdx ? 'bold' : 'normal',
                          padding: '4px 10px',
                          cursor: 'pointer'
                        }}
                        onClick={() => setSelectedDayIndex(dayIdx)}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="day-slots" style={{ height: `${timeSlots.length * 72}px`, position: 'relative' }}>
                {timeSlots.map((_, i) => (
                  <div 
                    key={i} 
                    className="slot-cell"
                    onClick={() => handleCellClick(selectedDayIndex, i + 7)}
                    title="Click to block this time slot"
                  >
                    <span className="slot-plus-icon">+</span>
                  </div>
                ))}
                {(() => {
                  const dayEvents = currentWeekEvents.filter(e => e.day === selectedDayIndex);
                  const positions = getEventPositionStyles(dayEvents);
                  
                  return dayEvents.map(event => {
                    const pos = positions.get(event.id) || { left: '12px', width: 'calc(100% - 24px)' };
                    const hasConflict = isOverlapConflict(event);
                    const checklist = event.prepChecklist || [];
                    const totalItems = checklist.length;
                    const completedItems = checklist.filter(item => item.done).length;
                    const percent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
                    
                    return (
                      <div
                        key={event.id}
                        className={`calendar-event event-${event.type} ${hasConflict ? 'has-conflict-card' : ''}`}
                        onClick={() => handleEventClick(event)}
                        style={{
                          top: `${(event.start - 7) * 72}px`,
                          height: `${event.duration * 72 - 4}px`,
                          background: `${event.color}15`,
                          borderLeft: hasConflict ? `3px dashed var(--accent-orange)` : `3px solid ${event.color}`,
                          cursor: 'pointer',
                          zIndex: 2,
                          left: pos.left,
                          width: pos.width
                        }}
                        title="Click to edit block details"
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%' }}>
                          <span className="event-title" style={{ fontSize: '13px', display: 'block' }}>{event.title}</span>
                          <span className="event-time" style={{ fontSize: '11px', display: 'block' }}>{event.start}:00 - {event.start + event.duration}:00</span>
                        </div>

                        {totalItems > 0 && (
                          <div className="event-card-checklist-summary" style={{ width: '100%', maxWidth: '280px', margin: '4px 0' }}>
                            <div className="event-mini-progress" style={{ height: '4px' }}>
                              <div className="event-mini-progress-fill" style={{ width: `${percent}%`, backgroundColor: event.color }}></div>
                            </div>
                            <span style={{ fontSize: '9px', color: 'var(--text-secondary)', marginTop: '3px', display: 'block' }}>
                              📋 Prep Checklist: {completedItems}/{totalItems} items ({percent}%)
                            </span>
                          </div>
                        )}
                        <span className="event-type-badge" style={{ backgroundColor: `${event.color}25`, color: event.color, padding: '2px 8px', fontSize: '10px' }}>
                          {getEmojiForType(event.type)} {event.type}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Monthly view — simplified grid */
        <div className="month-view widget">
          <div className="month-header-row">
            {[1, 2, 3, 4, 5, 6, 0].map(dayIdx => <div key={days[dayIdx]} className="month-day-name">{days[dayIdx]}</div>)}
          </div>
          <div className="month-grid">
            {getMonthGridDays(currentMonthOffset).map((cell, i) => {
              const cellEvents = events.filter(e => {
                const eventDate = getEventDate(e.day, e.weekOffset || 0);
                return eventDate.toDateString() === cell.date.toDateString();
              });
              const hasEvent = cellEvents.length > 0;
              const isToday = cell.date.toDateString() === new Date().toDateString();
              const cellDayIdx = cell.date.getDay();
              const cellWeekOffset = getWeekOffsetForDate(cell.date);
              const cellTasksDue = getTasksDueOnDay(cellDayIdx, cellWeekOffset);
              const dateLabel = cell.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
              
              return (
                <div 
                  key={i} 
                  className={`month-cell ${!cell.isCurrentMonth ? 'empty' : ''} ${isToday ? 'today' : ''}`} 
                  onClick={() => handleMonthCellClick(cell.date)}
                  style={{ minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'stretch', position: 'relative' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '4px 8px 0 8px' }}>
                    <span className="month-date">{cell.dayNum}</span>
                    {cellTasksDue.length > 0 && (
                      <div 
                        className="event-task-bubble"
                        onClick={(e) => {
                          e.stopPropagation();
                          setClickedTasksDue({
                            dateLabel,
                            tasks: cellTasksDue
                          });
                        }}
                        style={{ position: 'relative', top: 'auto', right: 'auto', display: 'inline-flex' }}
                        title={`${cellTasksDue.length} task(s) due today. Click to view.`}
                      >
                        <div className="chat-bubble-icon" style={{ transform: 'scale(0.85)' }}>
                          !
                          <span className="red-lighting-dot" style={{ top: '-4px', right: '-4px' }} />
                        </div>
                      </div>
                    )}
                  </div>
                  {hasEvent && (
                    <div style={{ display: 'flex', gap: '3px', justifyContent: 'center', flexWrap: 'wrap', width: '100%', padding: '2px', marginBottom: '4px' }}>
                      {cellEvents.slice(0, 3).map((e, idx) => (
                        <div 
                          key={idx} 
                          className="month-event-dot" 
                          style={{ backgroundColor: e.color || 'var(--accent-blue-light)' }}
                          title={e.title}
                        />
                      ))}
                      {cellEvents.length > 3 && (
                        <span style={{ fontSize: '8px', color: 'var(--text-tertiary)' }}>+{cellEvents.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Stats Health Check Bar */}
      <div className="calendar-stats-bar widget">
        <div className="stat-item">
          <div className="stat-icon">🕒</div>
          <div className="stat-details">
            <span className="stat-value">{totalBlockedHours} hrs</span>
            <span className="stat-label">Blocked This Week</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">🚨</div>
          <div className="stat-details">
            <span className="stat-value">{weeklyDeadlinesCount} tasks</span>
            <span className="stat-label">Urgent Deadlines</span>
          </div>
        </div>
        <div className={`stat-item ${conflictsCount > 0 ? 'has-conflict' : 'no-conflict'}`}>
          <div className="stat-icon">{conflictsCount > 0 ? '⚠️' : '✅'}</div>
          <div className="stat-details">
            <span className="stat-value">{conflictsCount} {conflictsCount === 1 ? 'conflict' : 'conflicts'}</span>
            <span className="stat-label">Time Overlaps</span>
          </div>
        </div>
      </div>

      {/* Task Overlay Strip — incomplete tasks reminder */}
      {tasks.filter(t => !t.done).length > 0 && (
        <div className="task-overlay-strip widget">
          <div className="overlay-header">
            <h4>📌 Incomplete Tasks Reminder</h4>
            <span className="overlay-count">{tasks.filter(t => !t.done).length} remaining</span>
          </div>
          <div className="overlay-tasks">
            {tasks.filter(t => !t.done).slice(0, 4).map(t => (
              <div key={t.id} className={`overlay-task-item priority-${t.priority}`}>
                <span className="overlay-dot"></span>
                <span className="overlay-task-text">{t.text}</span>
                <span className="overlay-task-due">{t.due}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Time Block Modal */}
      {showAddModal && (
        <div className="task-detail-overlay" onClick={() => setShowAddModal(false)}>
          <div className="task-detail-panel widget calendar-detail-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <button className="detail-close" onClick={() => setShowAddModal(false)}>✕</button>
            <div className="detail-header" style={{ marginBottom: '14px' }}>
              <h3>Block Time Slot</h3>
              <p>Add a new event block in Firestore</p>
            </div>

            <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Event Name</label>
                <input 
                  type="text" 
                  value={newTitle} 
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Physics Lab Session" 
                  required
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'white',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Day of Week</label>
                  <CustomSelect
                    value={String(newDay)}
                    onChange={val => setNewDay(Number(val))}
                    options={dayOptions}
                    disabled={isModalSourceCell}
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Event Type</label>
                  <CustomSelect
                    value={newType}
                    onChange={val => handleTypeChange(val as CalendarEvent['type'])}
                    options={typeOptions}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Start Time (Hour)</label>
                  <CustomSelect
                    value={String(newStart)}
                    onChange={val => setNewStart(Number(val))}
                    options={startOptions}
                    disabled={isModalSourceCell}
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Duration (Hours)</label>
                  <CustomSelect
                    value={String(newDuration)}
                    onChange={val => setNewDuration(Number(val))}
                    options={durationOptions}
                  />
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Theme Color</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {colorsConfig.map(color => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setNewColor(color.value)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: color.value,
                        border: newColor === color.value ? '2px solid white' : 'none',
                        cursor: 'pointer',
                        transform: newColor === color.value ? 'scale(1.15)' : 'scale(1)',
                        transition: 'transform 0.15s ease'
                      }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '10px', padding: '6px 12px', fontSize: '12px' }}>
                Block Time
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit & Detail Modal (Interactive Tabs) */}
      {selectedEvent && (
        <div className="task-detail-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="task-detail-panel widget calendar-detail-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <button className="detail-close" onClick={() => setSelectedEvent(null)}>✕</button>
            
            {/* Modal Header */}
            <div className="detail-header" style={{ marginBottom: '14px' }}>
              <span className="event-type-badge" style={{ backgroundColor: `${selectedEvent.color}20`, color: selectedEvent.color, padding: '2px 8px', marginBottom: '8px', display: 'inline-block' }}>
                {getEmojiForType(selectedEvent.type)} {selectedEvent.type.toUpperCase()}
              </span>
              <input 
                type="text" 
                value={selectedEvent.title} 
                onChange={e => handleEditField('title', e.target.value)}
                style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: 'white',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px dashed rgba(255,255,255,0.1)',
                  padding: '4px 0',
                  outline: 'none',
                  width: '100%',
                  marginBottom: '6px'
                }}
                placeholder="Event Title"
              />
              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                Scheduled for {days[selectedEvent.day]} {selectedEvent.start}:00 - {selectedEvent.start + selectedEvent.duration}:00 (Week offset: {selectedEvent.weekOffset || 0})
              </p>
            </div>

            {/* Tab Links */}
            <div className="detail-tabs">
              <button 
                className={`tab-btn ${detailTab === 'edit' ? 'active' : ''}`}
                onClick={() => setDetailTab('edit')}
              >
                ✏️ Edit Block
              </button>
              <button 
                className={`tab-btn ${detailTab === 'prep' ? 'active' : ''}`}
                onClick={() => setDetailTab('prep')}
              >
                📋 Prep Checklist
              </button>
            </div>

            {/* Tab Contents */}
            <div className="tab-content">
              {detailTab === 'edit' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Day of Week</label>
                      <CustomSelect
                        value={String(selectedEvent.day)}
                        onChange={val => handleEditField('day', Number(val))}
                        options={dayOptions}
                      />
                    </div>

                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Start Time (Hour)</label>
                      <CustomSelect
                        value={String(selectedEvent.start)}
                        onChange={val => handleEditField('start', Number(val))}
                        options={startOptions}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Week Offset</label>
                    <input 
                      type="number" 
                      value={selectedEvent.weekOffset || 0} 
                      onChange={e => handleEditField('weekOffset', Number(e.target.value))}
                      style={{
                        padding: '8px 10px',
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-md)',
                        color: 'white',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              )}

              {detailTab === 'prep' && (
                <div className="checklist-container">
                  {/* Progress bar */}
                  {(() => {
                    const checklist = selectedEvent.prepChecklist || [];
                    const total = checklist.length;
                    const completed = checklist.filter(i => i.done).length;
                    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                    return (
                      <div className="checklist-progress-container">
                        <div className="checklist-progress-header">
                          <span>Preparation Progress</span>
                          <span>{percent}% ({completed}/{total})</span>
                        </div>
                        <div className="progress-bar-bg">
                          <div className="progress-bar-fill" style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Checklist Items */}
                  <div className="checklist-items-list">
                    {(selectedEvent.prepChecklist || []).length === 0 ? (
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textAlign: 'center', padding: '24px 0' }}>
                        No preparation items added yet. Add checklist steps below!
                      </p>
                    ) : (
                      (selectedEvent.prepChecklist || []).map((item, idx) => (
                        <div key={idx} className={`checklist-item ${item.done ? 'done' : ''}`}>
                          <div className="checklist-checkbox-wrapper" onClick={() => handleTogglePrepItem(idx)}>
                            <div className="checklist-checkbox">
                              {item.done && <span className="checklist-checkmark">✓</span>}
                            </div>
                          </div>
                          <span className="checklist-text">{item.text}</span>
                          <button className="checklist-delete" onClick={() => handleDeletePrepItem(idx)} title="Delete Prep Step">✕</button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Row */}
                  <form onSubmit={handleAddPrepItem} className="add-checklist-row">
                    <input
                      type="text"
                      className="add-checklist-input"
                      placeholder="e.g. Read Physics Chapter 4..."
                      value={newPrepItemText}
                      onChange={e => setNewPrepItemText(e.target.value)}
                      required
                    />
                    <button type="submit" className="add-checklist-btn">Add</button>
                  </form>
                </div>
              )}


            </div>

            {/* Modal Footer (Delete & Done Buttons, visible for all tabs) */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', marginTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
              <button type="button" className="btn-danger" onClick={handleEventDelete} style={{ padding: '6px 12px', fontSize: '12px', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                Delete Block
              </button>
              <button type="button" className="btn-primary" onClick={handleDoneClick} style={{ padding: '6px 20px', minWidth: '80px', fontSize: '12px', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Due Details Popover */}
      {clickedTasksDue && (
        <div className="task-due-overlay" onClick={() => setClickedTasksDue(null)}>
          <div className="task-due-popover widget glass-card-static" onClick={e => e.stopPropagation()}>
            <button className="popover-close" onClick={() => setClickedTasksDue(null)}>✕</button>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-red)', margin: '0 0 12px 0', fontSize: '15px' }}>
              <span className="lightning-icon">⚡</span> Tasks Due: {clickedTasksDue.dateLabel}
            </h4>
            <div className="popover-tasks-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px', maxHeight: '300px', overflowY: 'auto' }}>
              {clickedTasksDue.tasks.map(t => (
                <div key={t.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '650', color: 'white' }}>{t.text}</span>
                    <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px', backgroundColor: t.priority === 'critical' ? 'rgba(239, 68, 68, 0.15)' : t.priority === 'high' ? 'rgba(249, 115, 22, 0.15)' : 'rgba(255,255,255,0.05)', color: t.priority === 'critical' ? 'var(--accent-red)' : t.priority === 'high' ? 'var(--accent-orange)' : 'var(--text-secondary)', fontWeight: 'bold' }}>
                      {t.priority}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>⏰ Due: {t.due}</span>
                </div>
              ))}
            </div>
            <button 
              className="btn-primary" 
              style={{ 
                width: '100%', 
                padding: '10px', 
                fontSize: '12px', 
                fontWeight: 'bold',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '6px',
                background: 'linear-gradient(135deg, var(--accent-red) 0%, #b91c1c 100%)', 
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer'
              }}
              onClick={() => {
                setClickedTasksDue(null);
                navigate('/tasks');
              }}
            >
              Go to Tasks ➔
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
