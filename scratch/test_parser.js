import { parseTaskDueDate } from '../src/utils/dateParser.js';

const testDates = [
  "25 Jun, 06:00 pm",
  "Jun 25, 10:00 PM",
  "Jun 25, 08:00 PM",
  "Jun 25, 12:58 PM"
];

console.log("Current date time:", new Date().toString());

testDates.forEach(d => {
  const parsed = parseTaskDueDate(d);
  console.log(`Input: "${d}" -> Parsed: ${parsed ? parsed.toString() : 'null'}`);
  if (parsed) {
    const today = new Date();
    const isToday = parsed.getDate() === today.getDate() &&
                    parsed.getMonth() === today.getMonth() &&
                    parsed.getFullYear() === today.getFullYear();
    console.log(`  Is Today: ${isToday}`);
  }
});
