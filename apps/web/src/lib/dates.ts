import { JAMAICA_TZ } from '@lynkkii/types';

const ymd = new Intl.DateTimeFormat('en-CA', {
  timeZone: JAMAICA_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Today's date in Jamaica time, as YYYY-MM-DD. */
export function jamaicaToday(now = new Date()): string {
  return ymd.format(now);
}

/** The coming (or current) Saturday–Sunday in Jamaica time. */
export function jamaicaWeekend(now = new Date()): { start_date: string; end_date: string } {
  const today = jamaicaToday(now);
  const dow = new Date(`${today}T12:00:00Z`).getUTCDay();
  if (dow === 0) return { start_date: today, end_date: today };
  const saturday = addDays(today, (6 - dow + 7) % 7);
  return { start_date: saturday, end_date: addDays(saturday, 1) };
}
