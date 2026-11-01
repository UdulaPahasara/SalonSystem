import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { rs } from "../../utils/format";
import "../../styles/Dashboard.css";

export const rsWhole = (n) => rs(Math.round(n));
export const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
export const sumOf = (rows, f) => rows.reduce((s, r) => s + Number(f(r) || 0), 0);
export const LOW_STOCK_LIMIT = 5;

export function useLoad(loader, deps) {
  const [state, setState] = useState({ loading: true, data: null });
  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    loader()
      .then((data) => !cancelled && setState({ loading: false, data }))
      .catch(() => !cancelled && setState({ loading: false, data: null, error: true }));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

// settled(...) results -> plain values with a fallback, so one failed request never blanks the dashboard
export const valueOf = (result, fallback) => (result.status === "fulfilled" ? result.value : fallback);

export function lastSevenDays(transactions) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push({ date: d, total: sumOf(transactions.filter((t) => sameDay(t.dateTime, d)), (t) => t.totalAmount) });
  }
  return days;
}

export function trendText(today, yesterday) {
  if (yesterday <= 0) return "No sales yesterday";
  const pct = Math.round(((today - yesterday) / yesterday) * 100);
  return `${pct >= 0 ? "+" : ""}${pct}% vs yesterday`;
}

export function DashboardHead({ name, subtitle }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return (
    <header className="dash-head">
      <p className="dash-eyebrow">
        {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      </p>
      <h1>{greeting}{name ? `, ${name.split(" ")[0]}` : ""}</h1>
      <p className="dash-sub">{subtitle}</p>
    </header>
  );
}

export function Kpis({ items, label = "Key figures" }) {
  return (
    <section className="dash-kpis" aria-label={label} style={{ gridTemplateColumns: `repeat(${items?.length || 4}, minmax(0, 1fr))` }}>
      {(items || Array.from({ length: 4 })).map((k, i) => (
        <article key={k?.label || i} className="dash-kpi">
          <p className="dash-kpi-label">{k ? k.label : " "}</p>
          <p className="dash-kpi-value">{k ? k.value : "…"}</p>
          <p className="dash-kpi-hint">{k ? k.hint : " "}</p>
        </article>
      ))}
    </section>
  );
}

export function Card({ title, to, linkText, children }) {
  return (
    <section className="dash-card">
      <div className="dash-card-head">
        <h2>{title}</h2>
        {to && <Link to={to}>{linkText || "View all →"}</Link>}
      </div>
      {children}
    </section>
  );
}

export const Empty = ({ children }) => <p className="dash-empty">{children}</p>;

export function AttentionList({ items, loading }) {
  if (loading) return <Empty>Loading…</Empty>;
  const shown = items.filter((a) => a.n > 0);
  if (shown.length === 0) return <Empty>All clear. Nothing needs attention.</Empty>;
  return (
    <ul className="dash-list">
      {shown.map((a) => (
        <li key={a.text}>
          <Link to={a.to}>
            <b>{a.n}</b>
            <span>{a.text}</span>
            <i aria-hidden="true">→</i>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function ActionList({ items }) {
  return (
    <ul className="dash-list dash-actions">
      {items.map((a) => (
        <li key={a.label}>
          <Link to={a.to}>
            <span><strong>{a.label}</strong><small>{a.hint}</small></span>
            <i aria-hidden="true">→</i>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function RecentSales({ rows, loading, showBranch }) {
  if (loading) return <Empty>Loading…</Empty>;
  if (rows.length === 0) return <Empty>No sales yet. They appear here after a checkout.</Empty>;
  return (
    <table className="dash-table">
      <thead>
        <tr><th>When</th>{showBranch && <th>Branch</th>}<th>Payment</th><th className="num">Amount</th></tr>
      </thead>
      <tbody>
        {rows.map((t) => (
          <tr key={t.transactionId}>
            <td>{new Date(t.dateTime).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
            {showBranch && <td>{t.branch ? t.branch.branchName : "—"}</td>}
            <td>{t.paymentMethod === "CARD" ? "Card" : "Cash"}</td>
            <td className="num">{rsWhole(t.totalAmount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Today's appointments in time order. action(a) can return a node shown at the end of each row.
export function Schedule({ rows, loading, action, empty = "No appointments today." }) {
  if (loading) return <Empty>Loading…</Empty>;
  if (rows.length === 0) return <Empty>{empty}</Empty>;
  return (
    <ul className="schedule">
      {rows.map((a) => {
        const st = (a.status || "BOOKED").toUpperCase();
        return (
          <li key={a.appointmentId} className="schedule-row">
            <span className="schedule-time">{new Date(a.appointmentTime).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
            <span className="schedule-main">
              <strong>{a.customer ? a.customer.fullName : "Walk-in"}</strong>
              <small>{a.serviceType}{a.assignedStaff ? ` · ${a.assignedStaff.fullName}` : " · no stylist yet"}</small>
            </span>
            <span className={`status-badge ${st.toLowerCase()}`}>{st.charAt(0) + st.slice(1).toLowerCase()}</span>
            {action && <span className="schedule-action">{action(a)}</span>}
          </li>
        );
      })}
    </ul>
  );
}

export const DashGrid = ({ left, right }) => (
  <div className="dash-grid">
    <div className="dash-col">{left}</div>
    <div className="dash-col">{right}</div>
  </div>
);
