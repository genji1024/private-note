import type {
  CalendarEvent,
  CalendarEventException,
  CalendarEventInstance,
  RecurrenceRule,
} from "@/lib/types";

export function parseRecurrenceRule(
  rule: string | null
): RecurrenceRule | null {
  if (!rule) return null;
  try {
    const parsed = JSON.parse(rule);
    if (
      parsed &&
      typeof parsed.frequency === "string" &&
      typeof parsed.interval === "number"
    ) {
      return {
        frequency: parsed.frequency,
        interval: parsed.interval,
        until: parsed.until ?? null,
      };
    }
  } catch {}
  return null;
}

function advanceOccurrence(date: Date, rule: RecurrenceRule): Date {
  const next = new Date(date);
  if (rule.frequency === "daily") next.setDate(next.getDate() + rule.interval);
  else if (rule.frequency === "weekly")
    next.setDate(next.getDate() + rule.interval * 7);
  else if (rule.frequency === "monthly")
    next.setMonth(next.getMonth() + rule.interval);
  return next;
}

function findFirstOccurrenceOnOrAfter(
  startDate: Date,
  rule: RecurrenceRule,
  target: Date
): Date {
  if (startDate.getTime() >= target.getTime()) return new Date(startDate);
  const dayMs = 86400000;
  if (rule.frequency === "daily") {
    const daysDiff = Math.floor(
      (target.getTime() - startDate.getTime()) / dayMs
    );
    const skip = Math.floor(daysDiff / rule.interval);
    let r = new Date(startDate.getTime() + skip * rule.interval * dayMs);
    while (r.getTime() < target.getTime())
      r = new Date(r.getTime() + rule.interval * dayMs);
    return r;
  }
  if (rule.frequency === "weekly") {
    const weekMs = 7 * dayMs;
    const weeksDiff = Math.floor(
      (target.getTime() - startDate.getTime()) / weekMs
    );
    const skip = Math.floor(weeksDiff / rule.interval);
    let r = new Date(startDate.getTime() + skip * rule.interval * weekMs);
    while (r.getTime() < target.getTime())
      r = new Date(r.getTime() + rule.interval * weekMs);
    return r;
  }
  // monthly
  const monthsDiff =
    (target.getFullYear() - startDate.getFullYear()) * 12 +
    (target.getMonth() - startDate.getMonth());
  const skip = Math.floor(monthsDiff / rule.interval);
  const r = new Date(startDate);
  r.setMonth(r.getMonth() + skip * rule.interval);
  while (r.getTime() < target.getTime())
    r.setMonth(r.getMonth() + rule.interval);
  return r;
}

export function expandEventsForMonth(
  events: CalendarEvent[],
  exceptions: CalendarEventException[],
  year: number,
  month: number
): CalendarEventInstance[] {
  const instances: CalendarEventInstance[] = [];
  const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
  for (const event of events) {
    const rule = parseRecurrenceRule(event.recurrence_rule);
    if (!rule) {
      const d = new Date(event.start_at);
      if (d.getFullYear() === year && d.getMonth() === month)
        instances.push({ ...event, parent_id: event.id, is_recurring: false });
      continue;
    }
    const startDate = new Date(event.start_at);
    const endDate = event.end_at ? new Date(event.end_at) : null;
    const duration = endDate ? endDate.getTime() - startDate.getTime() : 0;
    const untilDate = rule.until ? new Date(rule.until) : null;
    let current = findFirstOccurrenceOnOrAfter(startDate, rule, monthStart);
    while (current.getTime() <= monthEnd.getTime()) {
      if (untilDate && current.getTime() >= untilDate.getTime()) break;
      if (current.getFullYear() === year && current.getMonth() === month) {
        const isExcepted = exceptions.some(
          (e) => new Date(e.exception_date).getTime() === current.getTime()
        );
        if (!isExcepted) {
          instances.push({
            ...event,
            id: `${event.id}_${current.getTime()}`,
            parent_id: event.id,
            start_at: current.toISOString(),
            end_at: endDate
              ? new Date(current.getTime() + duration).toISOString()
              : null,
            recurrence_rule: event.recurrence_rule,
            is_recurring: true,
          });
        }
      }
      current = advanceOccurrence(current, rule);
    }
  }
  instances.sort(
    (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
  );
  return instances;
}

export function findNextOccurrence(
  event: CalendarEvent,
  exceptions: CalendarEventException[],
  after: Date
): CalendarEventInstance | null {
  const rule = parseRecurrenceRule(event.recurrence_rule);
  if (!rule) {
    const d = new Date(event.start_at);
    if (d.getTime() > after.getTime())
      return { ...event, parent_id: event.id, is_recurring: false };
    return null;
  }
  const startDate = new Date(event.start_at);
  const endDate = event.end_at ? new Date(event.end_at) : null;
  const duration = endDate ? endDate.getTime() - startDate.getTime() : 0;
  const untilDate = rule.until ? new Date(rule.until) : null;
  let current =
    startDate.getTime() > after.getTime()
      ? new Date(startDate)
      : findFirstOccurrenceOnOrAfter(startDate, rule, after);
  for (let i = 0; i < 365; i++) {
    if (untilDate && current.getTime() >= untilDate.getTime()) break;
    const isExcepted = exceptions.some(
      (e) => new Date(e.exception_date).getTime() === current.getTime()
    );
    if (!isExcepted && current.getTime() > after.getTime()) {
      return {
        ...event,
        id: `${event.id}_${current.getTime()}`,
        parent_id: event.id,
        start_at: current.toISOString(),
        end_at: endDate
          ? new Date(current.getTime() + duration).toISOString()
          : null,
        recurrence_rule: event.recurrence_rule,
        is_recurring: true,
      };
    }
    current = advanceOccurrence(current, rule);
  }
  return null;
}

export function getMaxDisplayMonth(
  events: CalendarEvent[],
  now: Date
): { year: number; month: number } {
  let nmYear = now.getFullYear();
  let nmMonth = now.getMonth() + 1;
  if (nmMonth > 11) {
    nmMonth = 0;
    nmYear++;
  }
  let lastY = 0,
    lastM = -1;
  for (const event of events) {
    const d = new Date(event.start_at);
    if (
      d.getFullYear() > lastY ||
      (d.getFullYear() === lastY && d.getMonth() > lastM)
    ) {
      lastY = d.getFullYear();
      lastM = d.getMonth();
    }
  }
  if (lastM < 0) return { year: nmYear, month: nmMonth };
  let aY = lastY,
    aM = lastM + 1;
  if (aM > 11) {
    aM = 0;
    aY++;
  }
  if (aY > nmYear || (aY === nmYear && aM > nmMonth))
    return { year: aY, month: aM };
  return { year: nmYear, month: nmMonth };
}
