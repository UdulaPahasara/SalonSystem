import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getRevenueReport, getTopProducts, getTopServices, getAllTransactions, getTransactionsByBranch } from "../api/usersApi";
import { getBranches } from "../api/branchApi";
import PageHeader from "../components/staff/PageHeader";
import BarChart from "../components/staff/BarChart";
import { getStaffHomePath } from "../utils/staffNav";
import { rs } from "../utils/format";
import "../components/DashboardLayout.css";
import "../styles/Dashboard.css";
import "../styles/StaffPages.css";

const PRESETS = [
  { id: "today", label: "Today" },
  { id: "7", label: "Last 7 days" },
  { id: "30", label: "Last 30 days" },
  { id: "month", label: "This month" },
  { id: "lastmonth", label: "Last month" },
  { id: "year", label: "This year" },
  { id: "custom", label: "Custom" },
];

const pad = (n) => String(n).padStart(2, "0");
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 0); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const isoLocal = (d) => `${dateKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
const fmtDate = (d) => d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

function rangeFor(preset, from, to) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (preset) {
    case "today": return [startOfDay(now), endOfDay(now)];
    case "7": return [startOfDay(addDays(now, -6)), endOfDay(now)];
    case "30": return [startOfDay(addDays(now, -29)), endOfDay(now)];
    case "month": return [new Date(y, m, 1), endOfDay(now)];
    case "lastmonth": return [new Date(y, m - 1, 1), endOfDay(new Date(y, m, 0))];
    case "year": return [new Date(y, 0, 1), endOfDay(now)];
    default: return [startOfDay(new Date(`${from}T00:00:00`)), endOfDay(new Date(`${to}T00:00:00`))];
  }
}

const sumBy = (rows, f) => rows.reduce((s, r) => s + Number(f(r) || 0), 0);

function RankList({ rows, unit, empty }) {
  if (rows.length === 0) return <p className="dash-empty">{empty}</p>;
  return (
    <ol className="rank-list">
      {rows.map((r, i) => (
        <li key={r.name} className="rank-row">
          <span className="rank-n">{i + 1}</span>
          <span className="rank-name">{r.name}</span>
          <span className="rank-val">{rs(r.revenue)}</span>
          <span className="rank-meta">
            <span className="rank-bar" aria-hidden="true"><i style={{ width: `${Math.min(100, r.share)}%` }} /></span>
            <span>{r.qty} {unit === "units" && r.qty === 1 ? "unit" : unit} · {r.share.toFixed(1)}% of sales</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export default function ReportsPage() {
  const { branchId: ownBranchId, userRole } = useAuth();
  const toast = useToast();
  const isOwner = userRole === "Owner";
  const today = dateKey(new Date());
  const [preset, setPreset] = useState("30");
  const [from, setFrom] = useState(dateKey(addDays(new Date(), -29)));
  const [to, setTo] = useState(today);
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [state, setState] = useState({ loading: true, error: false, data: null });
  const [exporting, setExporting] = useState("");

  const target = isOwner ? branchId : String(ownBranchId || "");
  const validCustom = preset !== "custom" || (from && to && from <= to);
  const [start, end] = useMemo(() => (validCustom ? rangeFor(preset, from, to) : [null, null]), [preset, from, to, validCustom]);

  useEffect(() => {
    if (isOwner) getBranches().then(setBranches).catch(() => {});
  }, [isOwner]);

  useEffect(() => {
    if (!start) return undefined;
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: false }));
    const days = Math.round((end - start) / 864e5) + 1;
    const monthly = days > 92;
    const prevEnd = endOfDay(addDays(start, -1));
    const prevStart = startOfDay(addDays(prevEnd, -(days - 1)));
    const base = target ? { branchId: target } : {};
    const range = { ...base, startDate: isoLocal(start), endDate: isoLocal(end) };

    Promise.all([
      getRevenueReport({ ...range, period: monthly ? "monthly" : "daily" }),
      getRevenueReport({ ...base, startDate: isoLocal(prevStart), endDate: isoLocal(prevEnd), period: "monthly" }),
      getTopServices(range),
      getTopProducts(range),
      target ? getTransactionsByBranch(target) : getAllTransactions(),
    ])
      .then(([revenue, prev, services, products, transactions]) => {
        if (cancelled) return;
        setState({ loading: false, error: false, data: { revenue, prev, services, products, monthly, days, transactions: transactions.filter((t) => { const d = new Date(t.dateTime); return d >= start && d <= end; }) } });
      })
      .catch(() => !cancelled && setState({ loading: false, error: true, data: null }));
    return () => { cancelled = true; };
  }, [start, end, target]);

  const view = useMemo(() => {
    const d = state.data;
    if (!d) return null;
    const byLabel = new Map(d.revenue.map((r) => [r.label, r]));
    const rows = [];
    if (d.monthly) {
      for (let c = new Date(start.getFullYear(), start.getMonth(), 1); c <= end; c = new Date(c.getFullYear(), c.getMonth() + 1, 1)) {
        const key = `${c.getFullYear()}-${pad(c.getMonth() + 1)}`;
        rows.push({ key, label: c.toLocaleDateString(undefined, { month: "short" }), tip: c.toLocaleDateString(undefined, { month: "long", year: "numeric" }), text: key, revenue: Number(byLabel.get(key)?.totalRevenue || 0), count: Number(byLabel.get(key)?.transactionCount || 0) });
      }
    } else {
      for (let c = startOfDay(start); c <= end; c = addDays(c, 1)) {
        const key = dateKey(c);
        rows.push({ key, label: d.days <= 7 ? c.toLocaleDateString(undefined, { weekday: "short" }) : String(c.getDate()), tip: c.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short", year: "numeric" }), text: key, revenue: Number(byLabel.get(key)?.totalRevenue || 0), count: Number(byLabel.get(key)?.transactionCount || 0) });
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
    const payments = group((t) => (t.paymentMethod || "").toUpperCase(), (t) => ((t.paymentMethod || "").toUpperCase() === "CARD" ? "Card" : "Cash")).map((p) => ({ ...p, method: p.name }));

    let delta = "No sales in the previous period";
    if (prevTotal > 0) {
      const pct = ((total - prevTotal) / prevTotal) * 100;
      delta = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% vs previous period`;
    }
    return {
      rows, total, count, avg: count ? total / count : 0, best, delta,
      services: mapItems(d.services, "usageCount"),
      products: mapItems(d.products, "quantitySold"),
      payments,
      branchRows: group((t) => t.branch?.id, (t) => t.branch?.branchName || "Unknown"),
    };
  }, [state.data, start, end]);

  const branchName = isOwner ? (branchId ? branches.find((b) => String(b.id) === String(branchId))?.branchName || "Branch" : "All branches") : "Your branch";
  const periodLabel = start ? `${fmtDate(start)} - ${fmtDate(end)}` : "—";
  const kpis = view && [
    { label: "Total revenue", value: rs(view.total), hint: view.delta },
    { label: "Transactions", value: view.count.toLocaleString(), hint: "Completed checkouts" },
    { label: "Average sale", value: rs(Math.round(view.avg)), hint: "Per transaction" },
    { label: state.data.monthly ? "Best month" : "Best day", value: view.best && view.best.revenue > 0 ? rs(view.best.revenue) : "—", hint: view.best && view.best.revenue > 0 ? view.best.tip : "No sales in this period" },
  ];

  const download = async (kind) => {
    if (!view) return;
    setExporting(kind);
    try {
      const { exportReportExcel, exportReportPdf } = await import("../utils/reportExport");
      const report = {
        periodLabel, branchName, generatedAt: new Date().toLocaleString(),
        kpis: kpis.map((k) => ({ label: k.label, value: k.value })),
        revenueTitle: state.data.monthly ? "Month" : "Date",
        revenueRows: view.rows.map((r) => ({ label: r.text, count: r.count, revenue: r.revenue })),
        services: view.services, products: view.products, payments: view.payments,
        branches: view.branchRows.map((b) => ({ name: b.name, count: b.count, revenue: b.revenue, share: b.share })),
      };
      await (kind === "excel" ? exportReportExcel(report) : exportReportPdf(report));
      toast.success(kind === "excel" ? "Excel report downloaded." : "PDF report downloaded.");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't create the report file. Please try again.");
    } finally {
      setExporting("");
    }
  };

  const ready = !!view && !state.loading;

  return (
    <div className="staff-page">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Sales performance for the period you choose."
        backTo={getStaffHomePath(userRole)}
        actions={
          <>
            <button className="staff-btn staff-btn-secondary" onClick={() => download("excel")} disabled={!ready || !!exporting}>
              {exporting === "excel" ? "Preparing…" : "Download Excel"}
            </button>
            <button className="staff-btn staff-btn-primary" onClick={() => download("pdf")} disabled={!ready || !!exporting}>
              {exporting === "pdf" ? "Preparing…" : "Download PDF"}
            </button>
          </>
        }
      />

      <div className="staff-filter-bar">
        <div className="staff-chips" role="group" aria-label="Report period">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" className={`staff-chip${preset === p.id ? " active" : ""}`} aria-pressed={preset === p.id} onClick={() => setPreset(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
        {isOwner && (
          <select className="staff-input" aria-label="Branch" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            <option value="">All branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.branchName}</option>
            ))}
          </select>
        )}
      </div>

      {preset === "custom" && (
        <div className="report-custom">
          <label className="staff-field-inline" htmlFor="rep-from">From
            <input id="rep-from" type="date" className="staff-input" value={from} max={to || today} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="staff-field-inline" htmlFor="rep-to">To
            <input id="rep-to" type="date" className="staff-input" value={to} min={from} max={today} onChange={(e) => setTo(e.target.value)} />
          </label>
          {!validCustom && <span className="pos-error">Choose a start date that is on or before the end date.</span>}
        </div>
      )}

      <p className="report-period">{periodLabel} · {branchName}</p>

      {state.error ? (
        <div className="staff-empty-state">
          <h3>Couldn't load the report</h3>
          <p>Check that the server is running, then pick the period again.</p>
        </div>
      ) : (
        <>
          <section className="dash-kpis staff-kpis" aria-label="Report summary">
            {(kpis || Array.from({ length: 4 })).map((k, i) => (
              <article key={k?.label || i} className="dash-kpi">
                <p className="dash-kpi-label">{k ? k.label : " "}</p>
                <p className="dash-kpi-value">{k && !state.loading ? k.value : "…"}</p>
                <p className="dash-kpi-hint">{k && !state.loading ? k.hint : " "}</p>
              </article>
            ))}
          </section>

          <section className="dash-card">
            <div className="dash-card-head"><h2>{state.data?.monthly ? "Revenue by month" : "Revenue by day"}</h2></div>
            {ready ? (
              <BarChart
                caption={state.data.monthly ? "Revenue per month" : "Revenue per day"}
                format={rs}
                emptyText="No sales in this period."
                data={view.rows.map((r) => ({ key: r.key, label: r.label, value: r.revenue, tip: r.tip }))}
              />
            ) : (
              <p className="dash-empty">Loading…</p>
            )}
          </section>

          <div className="report-grid">
            <section className="dash-card">
              <div className="dash-card-head"><h2>Top services</h2></div>
              {ready ? <RankList rows={view.services} unit="sold" empty="No services sold in this period." /> : <p className="dash-empty">Loading…</p>}
            </section>
            <section className="dash-card">
              <div className="dash-card-head"><h2>Top products</h2></div>
              {ready ? <RankList rows={view.products} unit="units" empty="No products sold in this period." /> : <p className="dash-empty">Loading…</p>}
            </section>
            <section className="dash-card">
              <div className="dash-card-head"><h2>Payment methods</h2></div>
              {ready ? (
                view.payments.length === 0 ? (
                  <p className="dash-empty">No payments in this period.</p>
                ) : (
                  <ol className="rank-list">
                    {view.payments.map((p) => (
                      <li key={p.method} className="rank-row rank-row-flat">
                        <span className="rank-name">{p.method}</span>
                        <span className="rank-val">{rs(p.revenue)}</span>
                        <span className="rank-meta">
                          <span className="rank-bar" aria-hidden="true"><i style={{ width: `${p.share}%` }} /></span>
                          <span>{p.count} transactions · {p.share.toFixed(1)}%</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                )
              ) : <p className="dash-empty">Loading…</p>}
            </section>
            {isOwner && !branchId && (
              <section className="dash-card">
                <div className="dash-card-head"><h2>Branch comparison</h2></div>
                {ready ? (
                  view.branchRows.length === 0 ? (
                    <p className="dash-empty">No sales in this period.</p>
                  ) : (
                    <ol className="rank-list">
                      {view.branchRows.map((b) => (
                        <li key={b.name} className="rank-row rank-row-flat">
                          <span className="rank-name">{b.name}</span>
                          <span className="rank-val">{rs(b.revenue)}</span>
                          <span className="rank-meta">
                            <span className="rank-bar" aria-hidden="true"><i style={{ width: `${b.share}%` }} /></span>
                            <span>{b.count} transactions · {b.share.toFixed(1)}%</span>
                          </span>
                        </li>
                      ))}
                    </ol>
                  )
                ) : <p className="dash-empty">Loading…</p>}
              </section>
            )}
          </div>
          <p className="report-note">Figures are based on completed checkouts. Services and products show the price charged at the time of sale.</p>
        </>
      )}
    </div>
  );
}
