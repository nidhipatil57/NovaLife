import { type Task } from '../hooks/useTasks';
import { type Habit } from '../hooks/useHabits';
import { type Goal } from '../hooks/useGoals';
import { type CalendarEvent } from '../hooks/useCalendarEvents';
import { type FocusSession } from '../context/DataContext';
import { parseTaskDueDate } from './dateParser';

/**
 * Centrally calculates the productivity score using 17 factors.
 * Can be computed for the current instant (default) or for any historical target date (e.g. for trend charts).
 */
export function calculateProductivityScore(
  tasks: Task[],
  habits: Habit[],
  goals: Goal[],
  focusSessions: FocusSession[],
  events: CalendarEvent[],
  rescueActivations: number,
  targetDate: Date = new Date()
): number {
  let score = 50; // Base score
  
  const targetTime = targetDate.getTime();
  const targetDateStr = targetDate.toDateString();

  // Helper: Determine if date is targetDate
  const isTargetDay = (dateStr: string | Date | undefined) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.toDateString() === targetDateStr;
  };

  // Helper: Determine if date is within last N days relative to targetDate
  const isWithinLastDays = (dateStr: string | Date | undefined, days: number) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const diffMs = targetTime - d.getTime();
    return diffMs >= 0 && diffMs <= days * 24 * 60 * 60 * 1000;
  };

  // Helper: Map calendar event weekday to date in current week
  const getEventDate = (dayOfWeek: number, weekOffset: number) => {
    const startOfWeek = new Date(targetDate);
    let currentDay = targetDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    if (currentDay === 0) currentDay = 7;
    startOfWeek.setDate(targetDate.getDate() - currentDay + 1 + (weekOffset * 7));
    
    const offset = dayOfWeek === 7 ? 6 : dayOfWeek - 1;
    const eventDate = new Date(startOfWeek);
    eventDate.setDate(startOfWeek.getDate() + offset);
    return eventDate;
  };

  // Filter tasks created specifically on targetDate
  const tasksCreatedOnDay = tasks.filter(t => isTargetDay(t.createdAt));

  // 1. Tasks Created on targetDate (Weight: 10)
  score += Math.min(10, tasksCreatedOnDay.length * 1.5);

  // 2. Tasks Completed, Priority, and AI Recommendations Followed (Weight: 35)
  tasks.forEach((t) => {
    let isCompletedOnDay = false;
    if (t.done) {
      // Find completion in activity log
      const completedLog = t.activityLog?.find(log => 
        log.action.toLowerCase().includes('completed') && 
        isTargetDay(log.timestamp)
      );
      if (completedLog) {
        isCompletedOnDay = true;
      } else {
        // Fallback: if t.createdAt matches targetDate
        if (isTargetDay(t.createdAt)) {
          isCompletedOnDay = true;
        }
      }
    }

    if (isCompletedOnDay) {
      score += 10; // Base completion reward
      
      // Priority rewards
      if (t.priority === 'critical') score += 12;
      else if (t.priority === 'high') score += 8;
      else if (t.priority === 'medium') score += 4;
      else if (t.priority === 'low') score += 2;
      
      // AI Recommendations followed
      if (t.aiGenerated) {
        score += 6;
      }
    } else {
      // 3. Overdue Tasks & Missed Deadlines on targetDate
      const dueDate = parseTaskDueDate(t.due);
      if (dueDate && dueDate.getTime() <= targetTime) {
        // Only penalize if the task was not completed on or before targetDate
        let completedBeforeOrOnTarget = false;
        if (t.done) {
          const completedLog = t.activityLog?.find(log => 
            log.action.toLowerCase().includes('completed') && 
            new Date(log.timestamp).getTime() <= targetTime
          );
          if (completedLog) {
            completedBeforeOrOnTarget = true;
          } else {
            const created = t.createdAt ? new Date(t.createdAt) : new Date();
            if (created.getTime() <= targetTime) {
              completedBeforeOrOnTarget = true;
            }
          }
        }

        if (!completedBeforeOrOnTarget) {
          score -= 12; // Penalty for past/missed deadlines
        }
      }
    }
  });

  // 4. Goal Completion & Milestones Achieved (Weight: 20)
  const yVal = targetDate.getFullYear();
  const mVal = String(targetDate.getMonth() + 1).padStart(2, '0');
  const dVal = String(targetDate.getDate()).padStart(2, '0');
  const targetYYYYMMDD = `${yVal}-${mVal}-${dVal}`;

  goals.forEach((g) => {
    const created = g.created_at ? new Date(g.created_at) : new Date();
    if (created.getTime() > targetTime) return;

    // Check if goal was worked on (checked off on goal calendar) specifically on targetDate
    const workedOnToday = g.completed_dates?.includes(targetYYYYMMDD);
    if (workedOnToday) {
      score += 10; // Reward for goal calendar progress today
    }

    if (g.milestones && g.milestones.length > 0) {
      g.milestones.forEach((milestone: any) => {
        if (milestone.done) {
          // Find if the matching task was completed on targetDate
          const matchingTask = tasks.find(t => 
            t.text.toLowerCase().trim() === milestone.text.toLowerCase().trim()
          );
          if (matchingTask) {
            const completedLog = matchingTask.activityLog?.find(log => 
              log.action.toLowerCase().includes('completed') && 
              isTargetDay(log.timestamp)
            );
            if (completedLog || (isTargetDay(matchingTask.createdAt) && matchingTask.done)) {
              score += 4; // Milestone completed today reward
            }
          }
        }
      });
    }
    
    // Check if goal reached 100% completion specifically on targetDate
    let completedToday = false;
    if (g.progress === 100) {
      if (g.completed_dates && g.completed_dates.length > 0) {
        const sortedDates = [...g.completed_dates].sort();
        if (sortedDates[sortedDates.length - 1] === targetYYYYMMDD) {
          completedToday = true;
        }
      } else if (g.completed_by) {
        const compDate = new Date(g.completed_by);
        if (compDate.toDateString() === targetDateStr) {
          completedToday = true;
        }
      } else if (isTargetDay(g.created_at)) {
        completedToday = true;
      }
    }
    if (completedToday) {
      score += 20; // Goal completed today reward
    }
  });

  // 5. Habit Completion & Streaks (Weight: 20)
  if (habits.length > 0) {
    let targetDayOfWeek = targetDate.getDay();
    if (targetDayOfWeek === 0) targetDayOfWeek = 7;
    const targetIdx = targetDayOfWeek - 1; // 0 (Mon) to 6 (Sun)

    // Direct daily completion reward
    const completedTodayCount = habits.filter(h => h.week[targetIdx]).length;
    score += Math.min(20, completedTodayCount * 8); // +8 points per habit completed today, max 20 points

    const rates = habits.map(h => {
      // Filter the week array up to the target date's weekday
      const weekUpToTarget = h.week.map((val, idx) => idx <= targetIdx ? val : false);
      const completedDays = weekUpToTarget.filter(Boolean).length;
      return Math.round((completedDays / 7) * 100);
    });

    const avgRate = rates.reduce((acc, r) => acc + r, 0) / habits.length;
    score += Math.min(15, avgRate * 0.15); // up to +15 based on completion rate

    const maxStreak = Math.max(...habits.map((h) => h.streak || 0), 0);
    score += Math.min(15, maxStreak * 1.5); // +1.5 per streak day, max 15 points

    if (maxStreak >= 30) {
      score += 25; // Legendary 30-day streak bonus
    }
  }

  // Filter focus sessions specifically on targetDate
  const focusSessionsOnDay = focusSessions.filter(s => isTargetDay(s.created_at || (s as any).createdAt));

  // 6. Focus Session Duration, consistency & deep work time (Weight: 20)
  if (focusSessionsOnDay.length > 0 || focusSessions.length > 0) {
    const totalMinutesToday = focusSessionsOnDay.reduce((acc, s) => acc + (s.duration || 0), 0) / 60;
    score += Math.min(15, totalMinutesToday * 0.25); // +1 point per 4 mins of deep work today, max 15 points

    // Focus consistency: count distinct days focused in last 7 days from targetDate
    const distinctDays = new Set(
      focusSessions
        .filter(s => isWithinLastDays(s.created_at || (s as any).createdAt, 7))
        .map(s => new Date(s.created_at || (s as any).createdAt).toDateString())
    ).size;
    
    if (distinctDays >= 3) {
      score += 10; // Consistency bonus
    }
  }

  // 7. Calendar checklist adherence & Skipped Focus Sessions (Weight: 10)
  events.forEach((e) => {
    const eventDate = getEventDate(e.day, e.weekOffset || 0);
    const isEventOnTargetDay = eventDate.toDateString() === targetDateStr;

    if (isEventOnTargetDay) {
      // Checklist items completed on this day
      if (e.prepChecklist && e.prepChecklist.length > 0) {
        e.prepChecklist.forEach((item) => {
          if (item.done) {
            score += 3; // +3 points per prep checklist item completed
          }
        });
      }

      // Skipped planned focus sessions on this day
      if (e.type === 'focus' || e.type === 'study') {
        const eventDateTime = new Date(eventDate);
        eventDateTime.setHours(Math.floor(e.start), Math.round((e.start % 1) * 60), 0, 0);
        
        if (eventDateTime.getTime() < targetTime) {
          const hasLoggedFocusOnDay = focusSessions.some((s) => {
            const sessionDate = new Date(s.created_at || (s as any).createdAt);
            return sessionDate.toDateString() === eventDate.toDateString();
          });
          
          if (!hasLoggedFocusOnDay) {
            score -= 8; // Penalty for skipping planned focus session
          }
        }
      }
    }
  });

  // 8. Rescue Mode Activations (only reward if targetDate is today)
  const isToday = targetDate.toDateString() === new Date().toDateString();
  if (isToday) {
    score += Math.min(10, rescueActivations * 4); // +4 points per activation, max 10 points
  }

  // 9. Daily Activity & Weekly Consistency
  const taskCompletedToday = tasks.some(t => {
    if (!t.done) return false;
    const completedLog = t.activityLog?.find(log => 
      log.action.toLowerCase().includes('completed')
    );
    if (completedLog) {
      return isTargetDay(completedLog.timestamp);
    }
    return isTargetDay(t.createdAt);
  });
  const focusLoggedToday = focusSessionsOnDay.length > 0;
  if (taskCompletedToday || focusLoggedToday) {
    score += 8; // Daily activity bonus
  }

  const tasksCompletedThisWeek = tasks.filter(t => {
    if (!t.done) return false;
    const completedLog = t.activityLog?.find(log => 
      log.action.toLowerCase().includes('completed')
    );
    const completedDate = completedLog ? completedLog.timestamp : t.createdAt;
    return isWithinLastDays(completedDate, 7);
  }).length;

  const habitsCompletedThisWeek = habits.filter(h => {
    let targetDayOfWeek = targetDate.getDay();
    if (targetDayOfWeek === 0) targetDayOfWeek = 7;
    const targetIdx = targetDayOfWeek - 1;
    const weekUpToTarget = h.week.map((val, idx) => idx <= targetIdx ? val : false);
    return weekUpToTarget.some((day: boolean) => day);
  }).length;

  if (tasksCompletedThisWeek >= 3 && habitsCompletedThisWeek >= 3) {
    score += 12; // Weekly consistency bonus
  }

  // Clamp score between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)));
}
