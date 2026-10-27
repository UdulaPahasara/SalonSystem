export const rs = (n) =>
  `Rs. ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export const PERIODS = [
  { id: "all", label: "All time" },
  { id: "today", label: "Today" },
  { id: "7", label: "Last 7 days" },
  { id: "30", label: "Last 30 days" },
  { id: "month", label: "This month" },
];

export function inPeriod(dateTime, period) {
  if (period === "all") return true;
  const d = new Date(dateTime);
  const now = new Date();
  if (period === "today") return d.toDateString() === now.toDateString();
  if (period === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (Number(period) - 1));
  return d >= start;
}

export function downloadCsv(filename, header, rows) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const text = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
