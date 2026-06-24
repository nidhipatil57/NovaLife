import { useState } from 'react';
import { useCalendarEvents, type CalendarEvent } from '../hooks/useCalendarEvents';
import { useTasks } from '../hooks/useTasks';
import './CalendarPage.css';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const timeSlots = Array.from({ length: 14 }, (_, i) => `${i + 7}:00`);

const colorsConfig = [
  { name: 'Red', value: 'var(--accent-red)' },
  { name: 'Blue', value: 'var(--accent-blue)' },
  { name: 'Purple', value: 'var(--accent-purple)' },
  { name: 'Green', value: 'var(--accent-green)' },
  { name: 'Cyan', value: 'var(--accent-cyan)' },
  { name: 'Orange', value: 'var(--accent-orange)' },
];

export default function CalendarPage() {
  const { events, loading: eventsLoading, addEvent, deleteEvent, user } = useCalendarEvents();
  const { tasks, loading: tasksLoading } = useTasks();
  
  const [view, setView] = useState<'week' | 'month'>('week');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStart, setNewStart] = useState(9);
  const [newDuration, setNewDuration] = useState(1);
  const [newDay, setNewDay] = useState(1); // Monday
  const [newColor, setNewColor] = useState('var(--accent-blue)');
  const [newType, setNewType] = useState<CalendarEvent['type']>('focus');

  // Dynamic Deadline Heatmap based on active critical/high tasks
  // Let's assume due descriptions like "Today", "Tomorrow", "Monday", "Tuesday", etc.
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

  const deadlineHeatmap = [
    { day: 'Mon', risk: getDayRisk('Mon') },
    { day: 'Tue', risk: getDayRisk('Tue') },
    { day: 'Wed', risk: getDayRisk('Wed') },
    { day: 'Thu', risk: getDayRisk('Thu') },
    { day: 'Fri', risk: getDayRisk('Fri') },
    { day: 'Sat', risk: getDayRisk('Sat') },
    { day: 'Sun', risk: getDayRisk('Sun') },
  ];

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

  const handleEventClick = async (event: CalendarEvent) => {
    if (confirm(`Do you want to delete the blocked event "${event.title}"?`)) {
      try {
        await deleteEvent(event.id);
      } catch (err) {
        alert('Failed to delete event.');
      }
    }
  };

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
      <div className="page-header">
        <div>
          <h2>📅 <span className="gradient-text">Calendar</span></h2>
          <p>AI-powered scheduling — auto time-blocking, conflict detection, and smart planning.</p>
        </div>
        <div className="page-header-actions">
          <div className="view-toggle">
            <button className={view === 'week' ? 'active' : ''} onClick={() => setView('week')}>Week</button>
            <button className={view === 'month' ? 'active' : ''} onClick={() => setView('month')}>Month</button>
          </div>
          <button className="btn-primary btn-sm" onClick={() => setShowAddModal(true)}>+ Block Time</button>
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
              <strong>AI Autopilot Syncing</strong> — {events.length} events active in your database. 
              Click on an event block anytime to delete it.
            </span>
          )}
        </div>
      </div>

      {/* Deadline Heatmap */}
      <div className="heatmap-row">
        <span className="heatmap-label">Deadline Risk:</span>
        {deadlineHeatmap.map((d, i) => (
          <div key={i} className={`heatmap-cell risk-${d.risk}`}>
            <span>{d.day}</span>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="loading-state" style={{ textAlign: 'center', padding: '60px' }}>
          <div className="ai-onboard-avatar" style={{ margin: '0 auto 20px auto', width: '40px', height: '40px' }}></div>
          <p>Loading your calendar...</p>
        </div>
      ) : view === 'week' ? (
        /* Weekly Timeline */
        <div className="week-view widget" style={{ overflowX: 'auto' }}>
          <div className="week-grid" style={{ minWidth: '800px' }}>
            <div className="time-column">
              {timeSlots.map((t, i) => <div key={i} className="time-slot">{t}</div>)}
            </div>
            {[0, 1, 2, 3, 4, 5, 6].map(dayIdx => (
              <div key={dayIdx} className="day-column">
                <div className="day-header">{days[dayIdx]}</div>
                <div className="day-slots">
                  {timeSlots.map((_, i) => <div key={i} className="slot-cell"></div>)}
                  {events.filter(e => e.day === dayIdx).map(event => (
                    <div
                      key={event.id}
                      className="calendar-event"
                      onClick={() => handleEventClick(event)}
                      style={{
                        top: `${(event.start - 7) * 48}px`,
                        height: `${event.duration * 48 - 4}px`,
                        background: `${event.color}15`,
                        borderLeft: `3px solid ${event.color}`,
                        cursor: 'pointer',
                        zIndex: 2
                      }}
                      title="Click to delete block"
                    >
                      <span className="event-title">{event.title}</span>
                      <span className="event-time">{event.start}:00 - {event.start + event.duration}:00</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Monthly view — simplified grid */
        <div className="month-view widget">
          <div className="month-header-row">
            {days.map(d => <div key={d} className="month-day-name">{d}</div>)}
          </div>
          <div className="month-grid">
            {Array.from({ length: 35 }, (_, i) => {
              const dayNum = i - 2; // offset for month start
              const hasEvent = events.some(e => e.day === (i % 7));
              const isToday = dayNum === new Date().getDate();
              return (
                <div key={i} className={`month-cell ${dayNum < 1 || dayNum > 30 ? 'empty' : ''} ${isToday ? 'today' : ''}`}>
                  {dayNum >= 1 && dayNum <= 30 && (
                    <>
                      <span className="month-date">{dayNum}</span>
                      {hasEvent && <div className="month-event-dot"></div>}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Task Overlay Strip — incomplete tasks reminder */}
      {tasks.filter(t => !t.done).length > 0 && (
        <div className="task-overlay-strip widget">
          <div className="overlay-header">
            <h4>📌 Incomplete Tasks</h4>
            <span className="overlay-count">{tasks.filter(t => !t.done).length} remaining</span>
          </div>
          <div className="overlay-tasks">
            {tasks.filter(t => !t.done).slice(0, 5).map(t => (
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
          <div className="task-detail-panel widget" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <button className="detail-close" onClick={() => setShowAddModal(false)}>✕</button>
            <div className="detail-header" style={{ marginBottom: '24px' }}>
              <h3>Block Time Slot</h3>
              <p>Add a new event block in Firestore</p>
            </div>

            <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Event Name</label>
                <input 
                  type="text" 
                  value={newTitle} 
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Physics Lab Session" 
                  required
                  style={{
                    padding: '12px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'white',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Day of Week</label>
                  <select 
                    value={newDay} 
                    onChange={e => setNewDay(Number(e.target.value))}
                    style={{
                      padding: '12px',
                      background: '#0E1628',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-md)',
                      color: 'white',
                      outline: 'none'
                    }}
                  >
                    {days.map((d, i) => (
                      <option key={d} value={i}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Event Type</label>
                  <select 
                    value={newType} 
                    onChange={e => setNewType(e.target.value as CalendarEvent['type'])}
                    style={{
                      padding: '12px',
                      background: '#0E1628',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-md)',
                      color: 'white',
                      outline: 'none'
                    }}
                  >
                    <option value="focus">🎧 Focus Sprint</option>
                    <option value="study">📚 Study session</option>
                    <option value="meeting">💼 Meeting</option>
                    <option value="health">🏋️ Health/Gym</option>
                    <option value="work">💻 Work Block</option>
                    <option value="break">☕ Break</option>
                    <option value="personal">👤 Personal</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Start Time (Hour)</label>
                  <select 
                    value={newStart} 
                    onChange={e => setNewStart(Number(e.target.value))}
                    style={{
                      padding: '12px',
                      background: '#0E1628',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-md)',
                      color: 'white',
                      outline: 'none'
                    }}
                  >
                    {Array.from({ length: 14 }, (_, i) => i + 7).map(hour => (
                      <option key={hour} value={hour}>{hour}:00</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Duration (Hours)</label>
                  <select 
                    value={newDuration} 
                    onChange={e => setNewDuration(Number(e.target.value))}
                    style={{
                      padding: '12px',
                      background: '#0E1628',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-md)',
                      color: 'white',
                      outline: 'none'
                    }}
                  >
                    <option value="0.5">30 mins</option>
                    <option value="1">1 hour</option>
                    <option value="1.5">1.5 hours</option>
                    <option value="2">2 hours</option>
                    <option value="3">3 hours</option>
                    <option value="4">4 hours</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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

              <button type="submit" className="btn-primary" style={{ marginTop: '12px', padding: '14px' }}>
                Block Time
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
