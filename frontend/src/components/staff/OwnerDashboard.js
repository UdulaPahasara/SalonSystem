import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getBranches } from "../../api/branchApi";
import { getUsers, getAllTransactions, getStaffSalaryStatus } from "../../api/usersApi";
import { getAllAppointments } from "../../api/appointmentApi";
import { getAllStockRequests } from "../../api/stockRequestApi";
import { getInventoryByBranch } from "../../api/productApi";
import BarChart from "./BarChart";
import { recentRange } from "../../utils/period";
import "../../styles/Dashboard.css";

const LOW_STOCK_LIMIT = 5; // matches the red highlight in Branch Inventory
const rs = (n) => `Rs. ${Math.round(n).toLocaleString()}`;
const dayKey = (d) => new Date(d).toDateString();
const sum = (txs) => txs.reduce((s, t) => s + Number(t.totalAmount || 0), 0);

const QUICK_ACTIONS = [
  { label: "Add staff user", hint: "Create a login and assign a role", to: "/admin/users?new=1" },
  { label: "Add branch", hint: "Open a new salon location", to: "/branches" },
  { label: "Pay salaries", hint: "Record this month's payments", to: "/staff" },
  { label: "View reports", hint: "Top services and products", to: "/reports" },
];

function lastSevenDays(transactions) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const total = sum(transactions.filter((t) => dayKey(t.dateTime) === d.toDateString()));
    days.push({ date: d, total });
  }
  return days;
}

export default function OwnerDashboard({ userName }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const month = new Date().toISOString().slice(0, 7);
    (async () => {
      const [tx, appts, users, branches, stock, salary] = await Promise.allSettled([
        getAllTransactions(recentRange()),
        getAllAppointments(null),
        getUsers(),
        getBranches(),
        getAllStockRequests(),
        getStaffSalaryStatus(month),
      ]);
      const ok = (r, fallback) => (r.status === "fulfilled" ? r.value : fallback);
      const branchList = ok(branches, []);
      const inventories = await Promise.allSettled(branchList.map((b) => getInventoryByBranch(b.id)));
      const lowStock = inventories
        .filter((r) => r.status === "fulfilled")
        .flatMap((r) => r.value)
        .filter((i) => i.quantity < LOW_STOCK_LIMIT).length;
      if (cancelled) return;
      setData({
        failed: [tx, appts, users, branches].every((r) => r.status === "rejected"),
        transactions: ok(tx, []),
        appointments: ok(appts, []),
        users: ok(users, []),
        branches: branchList,
        pendingStock: stock.status === "fulfilled" ? stock.value.data.filter((r) => r.status === "PENDING").length : 0,
        salary: ok(salary, []),
        lowStock,
        month,
      });
    })();
    return () => { cancelled = true; };
  }, []);

  const view = useMemo(() => {
    if (!data) return null;
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const today = data.transactions.filter((t) => dayKey(t.dateTime) === now.toDateString());
    const prev = data.transactions.filter((t) => dayKey(t.dateTime) === yesterday.toDateString());
    const monthTx = data.transactions.filter((t) => {
      const d = new Date(t.dateTime);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const todaySales = sum(today);
    const prevSales = sum(prev);
    let trend = "No sales yesterday";
    if (prevSales > 0) {
      const pct = Math.round(((todaySales - prevSales) / prevSales) * 100);
      trend = `${pct >= 0 ? "+" : ""}${pct}% vs yesterday`;
    }
    const apptsToday = data.appointments.filter(
      (a) => dayKey(a.appointmentTime) === now.toDateString() && a.status !== "CANCELLED"
    ).length;
    const noSalary = data.salary.filter((s) => !s.baseSalary).length;
    const unpaid = data.salary.filter((s) => s.baseSalary && !s.isPaid).length;
    const attention = [
      { n: data.pendingStock, text: "stock requests waiting for approval", to: "/stock-request-history" },
      { n: data.lowStock, text: `items low on stock (under ${LOW_STOCK_LIMIT})`, to: "/admin/branch-inventory" },
      { n: unpaid, text: "salaries unpaid this month", to: "/staff" },
      { n: noSalary, text: "staff have no base salary set", to: "/staff" },
    ].filter((a) => a.n > 0);
    const recent = [...data.transactions]
      .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))
      .slice(0, 5);
    return {
      todaySales, trend, monthSales: sum(monthTx), monthCount: monthTx.length,
      apptsToday, attention, recent, days: lastSevenDays(data.transactions),
    };
  }, [data]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const kpis = view && [
    { label: "Sales today", value: rs(view.todaySales), hint: view.trend },
    { label: "Sales this month", value: rs(view.monthSales), hint: `${view.monthCount} transaction${view.monthCount === 1 ? "" : "s"}` },
    { label: "Appointments today", value: view.apptsToday, hint: "Across all branches" },
    { label: "Team", value: data.users.length, hint: `${data.branches.length} branch${data.branches.length === 1 ? "" : "es"}` },
  ];

  return (
    <div className="dash">
      <header className="dash-head">
        <div>
          <p className="dash-eyebrow">
            {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <h1>{greeting}{userName ? `, ${userName.split(" ")[0]}` : ""}</h1>
          <p className="dash-sub">Here's how the salon is doing today.</p>
        </div>
      </header>

      {data?.failed && (
        <div className="dash-alert" role="alert">
          Couldn't load dashboard data. Check that the server is running, then refresh.
        </div>
      )}

      <section className="dash-kpis" aria-label="Key figures">
        {(kpis || Array.from({ length: 4 })).map((k, i) => (
          <article key={k?.label || i} className="dash-kpi">
            <p className="dash-kpi-label">{k ? k.label : " "}</p>
            <p className="dash-kpi-value">{k ? k.value : "…"}</p>
            <p className="dash-kpi-hint">{k ? k.hint : " "}</p>
          </article>
        ))}
      </section>

      <div className="dash-grid">
        <div className="dash-col">
          <section className="dash-card">
            <div className="dash-card-head">
              <h2>Sales — last 7 days</h2>
              <Link to="/reports">Reports →</Link>
            </div>
            {view ? (
              <BarChart
                caption="Sales per day, last 7 days"
                format={rs}
                emptyText="No sales recorded in the last 7 days."
                data={view.days.map((d) => ({
                  key: d.date.toISOString(),
                  label: d.date.toLocaleDateString(undefined, { weekday: "short" }),
                  value: d.total,
                  tip: d.date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" }),
                }))}
              />
            ) : (
              <p className="dash-empty">Loading…</p>
            )}
          </section>

          <section className="dash-card">
            <div className="dash-card-head">
              <h2>Recent transactions</h2>
              <Link to="/billing">View all →</Link>
            </div>
            {!view ? (
              <p className="dash-empty">Loading…</p>
            ) : view.recent.length === 0 ? (
              <p className="dash-empty">No sales yet. They appear here after a cashier completes a checkout.</p>
            ) : (
              <table className="dash-table">
                <thead>
                  <tr><th>When</th><th>Branch</th><th>Payment</th><th className="num">Amount</th></tr>
                </thead>
                <tbody>
                  {view.recent.map((t) => (
                    <tr key={t.transactionId}>
                      <td>{new Date(t.dateTime).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                      <td>{t.branch ? t.branch.branchName : "—"}</td>
                      <td>{t.paymentMethod === "CARD" ? "Card" : "Cash"}</td>
                      <td className="num">{rs(t.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>

        <div className="dash-col">
          <section className="dash-card">
            <div className="dash-card-head"><h2>Needs attention</h2></div>
            {!view ? (
              <p className="dash-empty">Loading…</p>
            ) : view.attention.length === 0 ? (
              <p className="dash-empty">All clear. Nothing needs your attention.</p>
            ) : (
              <ul className="dash-list">
                {view.attention.map((a) => (
                  <li key={a.text}>
                    <Link to={a.to}>
                      <b>{a.n}</b>
                      <span>{a.text}</span>
                      <i aria-hidden="true">→</i>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="dash-card">
            <div className="dash-card-head"><h2>Quick actions</h2></div>
            <ul className="dash-list dash-actions">
              {QUICK_ACTIONS.map((a) => (
                <li key={a.label}>
                  <Link to={a.to}>
                    <span><strong>{a.label}</strong><small>{a.hint}</small></span>
                    <i aria-hidden="true">→</i>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
