import { useState } from 'react';
import './CalendarPage.css';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const timeSlots = Array.from({ length: 14 }, (_, i) => `${i + 7}:00`);

const events = [
  { id: 1, title: 'Physics Assignment', start: 9, duration: 2, day: 1, color: 'var(--accent-red)', type: 'study' },
  { id: 2, title: 'Team Meeting', start: 16, duration: 1, day: 1, color: 'var(--accent-blue)', type: 'meeting' },
  { id: 3, title: 'Math Study Sprint', start: 10, duration: 1.5, day: 2, color: 'var(--accent-purple)', type: 'study' },
  { id: 4, title: 'Gym', start: 18, duration: 1, day: 1, color: 'var(--accent-green)', type: 'health' },
  { id: 5, title: 'Deep Work Block', start: 9, duration: 3, day: 3, color: 'var(--accent-cyan)', type: 'focus' },
  { id: 6, title: 'Project Presentation', start: 14, duration: 1, day: 3, color: 'var(--accent-orange)', type: 'work' },
  { id: 7, title: 'Exam Prep', start: 10, duration: 2, day: 4, color: 'var(--accent-purple)', type: 'study' },
  { id: 8, title: 'Lunch Break', start: 12, duration: 1, day: 1, color: 'rgba(255,255,255,0.1)', type: 'break' },
];

const deadlineHeatmap = [
  { day: 'Mon', risk: 'high' }, { day: 'Tue', risk: 'medium' }, { day: 'Wed', risk: 'high' },
  { day: 'Thu', risk: 'low' }, { day: 'Fri', risk: 'medium' }, { day: 'Sat', risk: 'low' }, { day: 'Sun', risk: 'low' },
];

export default function CalendarPage() {
  const [view, setView] = useState<'week' | 'month'>('week');

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
          <button className="btn-primary btn-sm">+ Block Time</button>
        </div>
      </div>

      {/* AI Scheduling Banner */}
      <div className="ai-schedule-banner widget">
        <div className="ai-avatar-inner" style={{ width: 28, height: 28, flexShrink: 0 }}></div>
        <div className="ai-schedule-text">
          <strong>AI Autopilot Active</strong> — I've auto-blocked 3 study sessions and protected your Team Meeting. 
          <span className="ai-conflict">⚠️ 1 conflict detected: Gym overlaps with study time. <button className="resolve-btn">Resolve</button></span>
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

      {/* Weekly Timeline */}
      {view === 'week' && (
        <div className="week-view widget">
          <div className="week-grid">
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
                      style={{
                        top: `${(event.start - 7) * 48}px`,
                        height: `${event.duration * 48 - 4}px`,
                        background: `${event.color}15`,
                        borderLeft: `3px solid ${event.color}`,
                      }}
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
      )}

      {/* Monthly view — simplified grid */}
      {view === 'month' && (
        <div className="month-view widget">
          <div className="month-header-row">
            {days.map(d => <div key={d} className="month-day-name">{d}</div>)}
          </div>
          <div className="month-grid">
            {Array.from({ length: 35 }, (_, i) => {
              const dayNum = i - 2; // offset for month start
              const hasEvent = [3, 5, 8, 12, 15, 18, 22, 25].includes(dayNum);
              const isToday = dayNum === 23;
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
    </div>
  );
}
