/**
 * Parses various task due date string formats into standard JavaScript Date objects.
 * Supports:
 * - "Today", "Tomorrow", "Yesterday"
 * - Weekdays (e.g. "Monday", "Tue", "Friday")
 * - Formatted date/times (e.g. "Jun 28, 02:30 PM", "Jun 28 02:30 PM")
 * - ISO date-time strings (e.g. "2026-06-25T16:52:41")
 */
export function parseTaskDueDate(dueStr: string | undefined | null): Date | null {
  if (!dueStr) return null;
  
  const normalized = dueStr.toLowerCase().trim().replace(/[📅]/g, '').trim();
  if (normalized === 'no due date' || normalized === '') return null;
  
  const today = new Date();
  const currentYear = today.getFullYear();
  
  if (normalized === 'today') {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  }
  if (normalized === 'tomorrow') {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(23, 59, 59, 999);
    return d;
  }
  if (normalized === 'yesterday') {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(23, 59, 59, 999);
    return d;
  }
  
  // Day of week check
  const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const shortWeekdays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  
  for (let i = 0; i < 7; i++) {
    if (normalized === weekdays[i] || normalized === shortWeekdays[i]) {
      const currentDayIdx = today.getDay();
      let diff = i - currentDayIdx;
      if (diff < 0) diff += 7; // Treat as next occurrence of this weekday
      
      const targetDate = new Date();
      targetDate.setDate(today.getDate() + diff);
      targetDate.setHours(23, 59, 59, 999);
      return targetDate;
    }
  }
  
  // Helper to fix year if standard parsing returns year 2001 or has no year
  const postProcessYear = (parsedDate: Date): Date => {
    const hasExplicitYear = /\b(19|20)\d{2}\b/.test(dueStr);
    if (!hasExplicitYear && parsedDate.getFullYear() < 2020) {
      parsedDate.setFullYear(currentYear);
    }
    return parsedDate;
  };

  // Try parsing full ISO or standard Date format
  try {
    const parsed = new Date(dueStr);
    if (!isNaN(parsed.getTime())) {
      return postProcessYear(parsed);
    }
  } catch (e) {}

  // Parse comma format: "Jun 28, 02:30 PM" or "Jun 28, 2026, 02:30 PM"
  try {
    const cleaned = dueStr.replace(/,/g, ''); // "Jun 28 02:30 PM"
    const parsed = new Date(cleaned);
    if (!isNaN(parsed.getTime())) {
      return postProcessYear(parsed);
    }
  } catch (e) {}

  // Manual parse of words like "Jun 28 02:30 PM" or "28 Jun 02:30 PM"
  const words = normalized.split(/\s+/);
  const months: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    january: 0, february: 1, march: 2, april: 3, june: 5, july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
  };

  if (words.length >= 2) {
    let m = months[words[0]];
    let d = parseInt(words[1]);
    
    // Support day-first format (e.g. "25 Jun")
    if (m === undefined && months[words[1]] !== undefined) {
      m = months[words[1]];
      d = parseInt(words[0]);
    }

    if (m !== undefined && !isNaN(d)) {
      const parsed = new Date();
      parsed.setMonth(m);
      parsed.setDate(d);
      parsed.setFullYear(currentYear);
      
      // Look for a time part like "02:30" and "pm" or "am"
      let hours = 23;
      let minutes = 59;
      
      const timePart = words.find(w => w.includes(':'));
      if (timePart) {
        const timeParts = timePart.split(':');
        let h = parseInt(timeParts[0]);
        const mins = parseInt(timeParts[1]);
        if (!isNaN(h) && !isNaN(mins)) {
          const isPm = normalized.includes('pm');
          const isAm = normalized.includes('am');
          if (isPm && h < 12) h += 12;
          if (isAm && h === 12) h = 0;
          hours = h;
          minutes = mins;
        }
      }
      parsed.setHours(hours, minutes, 0, 0);
      return parsed;
    }
  }

  return null;
}
