import { getRevenueReport, getTopProducts, getTopServices, getAllTransactions, getTransactionsByBranch } from "../api/usersApi";

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

const sumBy = (rows, f) => rows.reduce((s, r) => s + Number(f(r) || 0), 0);

/** Fetches everything a report needs for [start, end]. granularity: "auto" | "daily" | "monthly". */
export async function loadReport({ start, end, branchId, granularity = "auto" }) {
  const days = Math.round((end - start) / 864e5) + 1;
  const monthly = granularity === "monthly" || (granularity === "auto" && days > 92) || days > 366;
  const prevEnd = endOfDay(addDays(start, -1));
  const prevStart = startOfDay(addDays(prevEnd, -(days - 1)));
  const base = branchId ? { branchId } : {};
  const range = { ...base, startDate: isoLocal(start), endDate: isoLocal(end) };
  const [revenue, prev, services, products, transactions] = await Promise.all([
    getRevenueReport({ ...range, period: monthly ? "monthly" : "daily" }),
    getRevenueReport({ ...base, startDate: isoLocal(prevStart), endDate: isoLocal(prevEnd), period: "monthly" }),
    getTopServices(range),
    getTopProducts(range),
    branchId
      ? getTransactionsByBranch(branchId, { startDate: range.startDate, endDate: range.endDate })
      : getAllTransactions({ startDate: range.startDate, endDate: range.endDate }),
  ]);
  return {
    monthly, days, revenue, prev, services, products,
    transactions: transactions.filter((t) => { const d = new Date(t.dateTime); return d >= start && d <= end; }),
  };
}

/** Turns the raw API data into the numbers and rows the page and the exports show. */
export function buildReportView(d, start, end) {
  const byLabel = new Map(d.revenue.map((r) => [r.label, r]));
  const rows = [];
  const make = (key, label, tip) => ({ key, label, tip, text: key, revenue: Number(byLabel.get(key)?.totalRevenue || 0), count: Number(byLabel.get(key)?.transactionCount || 0) });
  if (d.monthly) {
    for (let c = new Date(start.getFullYear(), start.getMonth(), 1); c <= end; c = new Date(c.getFullYear(), c.getMonth() + 1, 1)) {
      rows.push(make(`${c.getFullYear()}-${pad(c.getMonth() + 1)}`, c.toLocaleDateString(undefined, { month: "short" }), c.toLocaleDateString(undefined, { month: "long", year: "numeric" })));
    }
  } else {
    for (let c = startOfDay(start); c <= end; c = addDays(c, 1)) {
      rows.push(make(dateKey(c), d.days <= 7 ? c.toLocaleDateString(undefined, { weekday: "short" }) : String(c.getDate()), c.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short", year: "numeric" })));
    }
  }
  const total = sumBy(rows, (r) => r.revenue);
  const count = sumBy(rows, (r) => r.count);
  const prevTotal = sumBy(d.prev, (r) => r.totalRevenue);
  const best = rows.reduce((b, r) => (r.revenue > (b?.revenue || 0) ? r : b), null);
  const share = (v) => (total > 0 ? (Number(v) / total) * 100 : 0);
  const mapItems = (list, qtyKey) => list.map((i) => ({ name: i.name, qty: Number(i[qtyKey] || 0), revenue: Number(i.totalRevenue || 0), share: share(i.totalRevenue) }));

  const txTotal = sumBy(d.transactions, (t) => t.totalAmount);
  const group = (keyOf, nameOf) => {
    const map = new Map();
    d.transactions.forEach((t) => {
      const k = keyOf(t);
      const cur = map.get(k) || { name: nameOf(t), count: 0, revenue: 0 };
      cur.count += 1;
      cur.revenue += Number(t.totalAmount || 0);
      map.set(k, cur);
    });
    return [...map.values()].map((g) => ({ ...g, share: txTotal > 0 ? (g.revenue / txTotal) * 100 : 0 })).sort((a, b) => b.revenue - a.revenue);
  };
  let delta = "No sales in the previous period";
  if (prevTotal > 0) {
    const pct = ((total - prevTotal) / prevTotal) * 100;
    delta = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% vs previous period`;
  }
  return {
    rows, total, count, avg: count ? total / count : 0, best, delta,
    services: mapItems(d.services, "usageCount"),
    products: mapItems(d.products, "quantitySold"),
    payments: group((t) => (t.paymentMethod || "").toUpperCase(), (t) => ((t.paymentMethod || "").toUpperCase() === "CARD" ? "Card" : "Cash")).map((p) => ({ ...p, method: p.name })),
    branchRows: group((t) => t.branch?.id, (t) => t.branch?.branchName || "Unknown"),
  };
}
