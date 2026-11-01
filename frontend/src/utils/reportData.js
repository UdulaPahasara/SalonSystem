import { getBusinessReport } from "../api/usersApi";

const pad = (n) => String(n).padStart(2, "0");
export const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
export const endOfDay = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 0); return x; };
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const isoLocal = (d) => `${dateKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
export const fmtDate = (d) => d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

export const PRESETS = [
  { id: "today", label: "Today" },
  { id: "7", label: "Last 7 days" },
  { id: "30", label: "Last 30 days" },
  { id: "month", label: "This month" },
  { id: "lastmonth", label: "Last month" },
  { id: "90", label: "Last 90 days" },
  { id: "12m", label: "Last 12 months" },
  { id: "year", label: "This year" },
  { id: "lastyear", label: "Last year" },
  { id: "custom", label: "Custom" },
];

export function rangeFor(preset, from, to) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (preset) {
    case "today": return [startOfDay(now), endOfDay(now)];
    case "7": return [startOfDay(addDays(now, -6)), endOfDay(now)];
    case "30": return [startOfDay(addDays(now, -29)), endOfDay(now)];
    case "90": return [startOfDay(addDays(now, -89)), endOfDay(now)];
    case "month": return [new Date(y, m, 1), endOfDay(now)];
    case "lastmonth": return [new Date(y, m - 1, 1), endOfDay(new Date(y, m, 0))];
    case "12m": return [new Date(y, m - 11, 1), endOfDay(now)];
    case "year": return [new Date(y, 0, 1), endOfDay(now)];
    case "lastyear": return [new Date(y - 1, 0, 1), endOfDay(new Date(y - 1, 11, 31))];
    default: return [startOfDay(new Date(`${from}T00:00:00`)), endOfDay(new Date(`${to}T00:00:00`))];
  }
}

/** Fetches the whole grouped report for [start, end]. granularity: "auto" | "daily" | "monthly". */
export async function loadReport({ start, end, branchId, granularity = "auto" }) {
  const days = Math.round((end - start) / 864e5) + 1;
  const monthly = granularity === "monthly" || (granularity === "auto" && days > 92) || days > 366;
  const data = await getBusinessReport({
    ...(branchId ? { branchId } : {}),
    startDate: isoLocal(start),
    endDate: isoLocal(end),
    period: monthly ? "monthly" : "daily",
  });
  return { monthly, days, data };
}

/** Adds the zero-sales days or months to the trend and the headline numbers; everything else comes straight from the server. */
export function buildReportView(d, start, end) {
  const b = d.data;
  const byKey = new Map(b.trend.map((r) => [r.key, r]));
  const rows = [];
  const make = (key, label, tip) => ({ key, label, tip, text: key, revenue: Number(byKey.get(key)?.revenue || 0), count: Number(byKey.get(key)?.count || 0) });
  if (d.monthly) {
    for (let c = new Date(start.getFullYear(), start.getMonth(), 1); c <= end; c = new Date(c.getFullYear(), c.getMonth() + 1, 1)) {
      rows.push(make(`${c.getFullYear()}-${pad(c.getMonth() + 1)}`, c.toLocaleDateString(undefined, { month: "short" }), c.toLocaleDateString(undefined, { month: "long", year: "numeric" })));
    }
  } else {
    for (let c = startOfDay(start); c <= end; c = addDays(c, 1)) {
      rows.push(make(dateKey(c), d.days <= 7 ? c.toLocaleDateString(undefined, { weekday: "short" }) : String(c.getDate()), c.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short", year: "numeric" })));
    }
  }
  const s = b.summary;
  const best = rows.reduce((x, r) => (r.revenue > (x?.revenue || 0) ? r : x), null);
  const growth = s.prevRevenue > 0 ? ((s.revenue - s.prevRevenue) / s.prevRevenue) * 100 : null;
  const delta = growth == null ? "No sales in the previous period" : `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}% vs previous period`;
  return { ...b, rows, best, growth, delta, monthly: d.monthly, total: s.revenue, count: s.transactions, avg: s.avgBill };
}
