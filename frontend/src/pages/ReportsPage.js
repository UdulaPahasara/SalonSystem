import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getBranches } from "../api/branchApi";
import PageHeader from "../components/staff/PageHeader";
import BarChart from "../components/staff/BarChart";
import { getStaffHomePath } from "../utils/staffNav";
import { rs } from "../utils/format";
import { PRESETS, rangeFor, addDays, dateKey, fmtDate, loadReport, buildReportView } from "../utils/reportData";
import ExportReportDialog from "../components/staff/ExportReportDialog";
import "../components/DashboardLayout.css";
import "../styles/Dashboard.css";
import "../styles/StaffPages.css";

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
  const isOwner = userRole === "Owner";
  const today = dateKey(new Date());
  const [preset, setPreset] = useState("30");
  const [from, setFrom] = useState(dateKey(addDays(new Date(), -29)));
  const [to, setTo] = useState(today);
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [state, setState] = useState({ loading: true, error: false, data: null });
  const [exportOpen, setExportOpen] = useState(false);

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
    loadReport({ start, end, branchId: target })
      .then((data) => !cancelled && setState({ loading: false, error: false, data }))
      .catch(() => !cancelled && setState({ loading: false, error: true, data: null }));
    return () => { cancelled = true; };
  }, [start, end, target]);

  const view = useMemo(() => (state.data ? buildReportView(state.data, start, end) : null), [state.data, start, end]);

  const branchName = isOwner ? (branchId ? branches.find((b) => String(b.id) === String(branchId))?.branchName || "Branch" : "All branches") : "Your branch";
  const periodLabel = start ? `${fmtDate(start)} - ${fmtDate(end)}` : "—";
  const kpis = view && [
    { label: "Total revenue", value: rs(view.total), hint: view.delta },
    { label: "Transactions", value: view.count.toLocaleString(), hint: "Completed checkouts" },
    { label: "Average sale", value: rs(Math.round(view.avg)), hint: "Per transaction" },
    { label: state.data.monthly ? "Best month" : "Best day", value: view.best && view.best.revenue > 0 ? rs(view.best.revenue) : "—", hint: view.best && view.best.revenue > 0 ? view.best.tip : "No sales in this period" },
  ];

  const ready = !!view && !state.loading;

  return (
    <div className="staff-page">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Sales performance for the period you choose."
        backTo={getStaffHomePath(userRole)}
        actions={
          <button className="staff-btn staff-btn-primary" onClick={() => setExportOpen(true)}>
            Download report…
          </button>
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
      {exportOpen && (
        <ExportReportDialog
          onClose={() => setExportOpen(false)}
          isOwner={isOwner}
          branches={branches}
          ownBranchId={ownBranchId}
          initial={{ preset, from, to, branchId }}
        />
      )}
    </div>
  );
}
