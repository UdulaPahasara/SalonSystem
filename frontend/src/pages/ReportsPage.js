import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getBranches } from "../api/branchApi";
import PageHeader from "../components/staff/PageHeader";
import BarChart from "../components/staff/BarChart";
import { getStaffHomePath } from "../utils/staffNav";
import { rs } from "../utils/format";
import { PRESETS, rangeFor, addDays, dateKey, fmtDate, loadReport, buildReportView } from "../utils/reportData";
import { buildSections, formatCell, isNumeric, totalsRow, previewReportPdf } from "../utils/reportTables";
import ExportReportDialog from "../components/staff/ExportReportDialog";
import "../components/DashboardLayout.css";
import "../styles/Dashboard.css";
import "../styles/StaffPages.css";

const LEVEL = { warn: "Needs attention", good: "Good news", info: "Note" };

function ReportTable({ table, chartOnly }) {
  const rows = table.totals && table.rows.length ? [...table.rows, totalsRow(table)] : table.rows;
  const peak = table.heat ? Math.max(0, ...table.rows.flatMap((r) => table.columns.slice(1).map((c) => Number(r[c.key] || 0)))) : 0;
  const heat = table.heat && peak > 0 ? (v) => { const x = Number(v || 0) / peak; return x > 0 ? { background: `rgba(169, 26, 88, ${(0.1 + 0.75 * x).toFixed(2)})`, color: x > 0.55 ? "#fff" : undefined } : undefined; } : null;
  const chartData = table.chartRows || table.rows;
  const chart = table.chart && chartData.length > 0 && (
    <BarChart
      caption={table.chart.caption}
      format={rs}
      emptyText="No sales in this period."
      data={chartData.map((r) => ({ key: r.key || r[table.chart.labelKey], label: table.chart.short ? String(r[table.chart.labelKey]).slice(0, 3) : r[table.chart.labelKey], value: Number(r[table.chart.valueKey] || 0), tip: r[table.chart.tipKey] }))}
    />
  );
  return (
    <section className="dash-card report-table-card">
      <div className="dash-card-head"><h2>{table.title}</h2></div>
      {table.note && <p className="report-table-note">{table.note}</p>}
      {chart}
      {chartOnly ? null : table.rows.length === 0 ? (
        <p className="dash-empty">Nothing to show for this period.</p>
      ) : (
        <div className="table-scroll">
          <table className="staff-table report-table">
            <thead>
              <tr>{table.columns.map((c) => <th key={c.key} className={isNumeric(c.type) ? "num" : undefined}>{c.label}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className={table.totals && i === rows.length - 1 ? "report-total-row" : undefined}>
                  {table.columns.map((c) => (
                    <td key={c.key} className={[isNumeric(c.type) ? "num" : "", c.wrap ? "wrap" : ""].join(" ").trim() || undefined} style={heat && isNumeric(c.type) ? heat(r[c.key]) : undefined}>
                      {c.type === "status" ? <span className={`status-badge ${String(r[c.key]).toLowerCase()}`}>{formatCell("status", r[c.key])}</span> : formatCell(c.type, r[c.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
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
  const [tab, setTab] = useState("overview");
  const [saving, setSaving] = useState("");
  const toast = useToast();

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
  const ready = !!view && !state.loading;
  const sections = useMemo(() => (view ? buildSections(view, { isOwner, periodLabel }) : []), [view, isOwner, periodLabel]);
  const section = sections.find((x) => x.id === tab) || sections[0];

  // Downloads just the tab on screen, using the numbers already loaded (same period and branch).
  const downloadTab = async (format) => {
    if (!section) return;
    setSaving(format);
    try {
      if (format === "preview") {
        await previewReportPdf(async () => ({ periodLabel, branchName, generatedAt: new Date().toLocaleString(), sections: [section] }));
        return;
      }
      const { exportReportExcel, exportReportPdf } = await import("../utils/reportExport");
      const report = { periodLabel, branchName, generatedAt: new Date().toLocaleString(), sections: [section] };
      await (format === "excel" ? exportReportExcel(report) : exportReportPdf(report));
      toast.success(`${section.label} ${format === "excel" ? "Excel" : "PDF"} downloaded.`);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't create the download. Please try again.");
    } finally {
      setSaving("");
    }
  };

  const kpis = view && [
    { label: "Total revenue", value: rs(view.total), hint: view.delta },
    { label: "Average bill", value: rs(Math.round(view.avg)), hint: `${view.count.toLocaleString()} transactions` },
    { label: "Appointments completed", value: `${view.summary.completed} of ${view.summary.appointments}`, hint: `${view.appointments.cancelRate.toFixed(0)}% cancelled` },
    view.salary
      ? { label: "Left after salaries", value: rs(view.salary.net), hint: `Salaries paid ${rs(view.salary.total)}` }
      : { label: "Stock alerts", value: String(view.inventory.items.filter((i) => i.status !== "OK").length), hint: "Products low or out of stock" },
  ];

  return (
    <div className="staff-page">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Sales, staff, customers, appointments and stock for the period you choose."
        backTo={getStaffHomePath(userRole)}
        actions={
          <button className="staff-btn staff-btn-primary" onClick={() => setExportOpen(true)}>
            All reports & downloads
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
                <p className="dash-kpi-label">{k ? k.label : " "}</p>
                <p className="dash-kpi-value">{k && !state.loading ? k.value : "…"}</p>
                <p className="dash-kpi-hint">{k && !state.loading ? k.hint : " "}</p>
              </article>
            ))}
          </section>

          {ready && (
            <div className="staff-chips report-tabs" role="group" aria-label="Report sections">
              {sections.map((x) => (
                <button key={x.id} type="button" className={`staff-chip${section?.id === x.id ? " active" : ""}`} aria-pressed={section?.id === x.id} onClick={() => setTab(x.id)}>
                  {x.label}
                </button>
              ))}
            </div>
          )}

          {!ready && <p className="dash-empty">Loading…</p>}
          {ready && section && (
            <>
              <div className="report-tab-head">
                <p className="report-intro">{section.intro}</p>
                <div className="report-tab-actions" role="group" aria-label={`Download ${section.label}`}>
                  {[["preview", "Preview"], ["excel", "Excel"], ["pdf", "PDF"]].map(([f, text]) => (
                    <button key={f} type="button" className="staff-btn staff-btn-secondary" disabled={!!saving} aria-label={`${text} ${section.label} report`} onClick={() => downloadTab(f)}>
                      {saving === f ? "Preparing…" : text}
                    </button>
                  ))}
                </div>
              </div>
              {section.id === "overview" && (
                <>
                  <section className="dash-card report-insights">
                    <div className="dash-card-head"><h2>What this report tells you</h2></div>
                    {view.insights.length === 0 ? (
                      <p className="dash-empty">Not enough activity in this period to draw conclusions.</p>
                    ) : (
                      <ul className="insight-list">
                        {view.insights.map((i, n) => (
                          <li key={n} className={`insight insight-${i.level}`}>
                            <span className="insight-tag">{LEVEL[i.level]} · {i.area}</span>
                            <span>{i.text}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                  {sections.find((x) => x.id === "sales").tables.filter((t) => t.id === "trend" || t.id === "categories").map((t) => <ReportTable key={t.id} table={t} chartOnly={t.id === "trend"} />)}
                </>
              )}
              {section.tables.filter((t) => section.id !== "overview" || t.id === "branches").map((t) => <ReportTable key={t.id} table={t} />)}
            </>
          )}
          <p className="report-note">Figures come from completed checkouts and recorded appointments. Services and products use the price charged at the time of sale. Growth is compared with the previous period of the same length.</p>
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
