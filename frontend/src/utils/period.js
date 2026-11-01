const pad = (n) => String(n).padStart(2, "0");
export const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

export const PERIOD_OPTIONS = [
  { id: "all", label: "All time" },
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "7", label: "Last 7 days" },
  { id: "30", label: "Last 30 days" },
  { id: "90", label: "Last 90 days" },
  { id: "month", label: "This month" },
  { id: "lastmonth", label: "Last month" },
  { id: "year", label: "This year" },
  { id: "custom", label: "Custom range…" },
];

export const DEFAULT_PERIOD = { period: "all", from: "", to: "" };
export const periodKey = (sel) => `${sel.period}:${sel.from}:${sel.to}`;

/** Returns [start, end]; either side can be null (open-ended). */
export function periodRange(sel, now = new Date()) {
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (sel.period) {
    case "today": return [startOfDay(now), endOfDay(now)];
    case "yesterday": return [startOfDay(addDays(now, -1)), endOfDay(addDays(now, -1))];
    case "7": return [startOfDay(addDays(now, -6)), endOfDay(now)];
    case "30": return [startOfDay(addDays(now, -29)), endOfDay(now)];
    case "90": return [startOfDay(addDays(now, -89)), endOfDay(now)];
    case "month": return [new Date(y, m, 1), endOfDay(now)];
    case "lastmonth": return [new Date(y, m - 1, 1), endOfDay(new Date(y, m, 0))];
    case "year": return [new Date(y, 0, 1), endOfDay(now)];
    case "upcoming": return [now, null];
    case "custom":
      return [sel.from ? startOfDay(new Date(`${sel.from}T00:00:00`)) : null, sel.to ? endOfDay(new Date(`${sel.to}T00:00:00`)) : null];
    default: return [null, null];
  }
}

export function inPeriod(dateTime, sel) {
  const s = typeof sel === "string" ? { period: sel, from: "", to: "" } : sel;
  if (s.period === "all") return true;
  if (!dateTime) return false;
  const d = new Date(dateTime);
  const [start, end] = periodRange(s);
  return (!start || d >= start) && (!end || d <= end);
}
