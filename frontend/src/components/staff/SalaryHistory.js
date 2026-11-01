import React, { useEffect, useMemo, useState } from "react";
import { getSalaryPayments, getStaffSalaryStatus } from "../../api/usersApi";
import { getBranches } from "../../api/branchApi";
import { useToast } from "../../context/ToastContext";
import BarChart from "./BarChart";
import Pagination, { usePagination } from "./Pagination";
import { rs } from "../../utils/format";
import "../../styles/Dashboard.css";
import "../../styles/StaffPages.css";

const pad = (n) => String(n).padStart(2, "0");
const ym = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const monthLabel = (m, long) => new Date(`${m}-01T00:00:00`).toLocaleDateString(undefined, long ? { month: "long", year: "numeric" } : { month: "short", year: "2-digit" });

export function monthsBetween(from, to) {
  const out = [];
  let [y, m] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  while ((y < ty || (y === ty && m <= tm)) && out.length < 36) {
    out.push(`${y}-${pad(m)}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out;
}

const PRESETS = [
  { id: "3", label: "Last 3 months", range: () => [ym(addMonths(new Date(), -2)), ym(new Date())] },
  { id: "6", label: "Last 6 months", range: () => [ym(addMonths(new Date(), -5)), ym(new Date())] },
  { id: "12", label: "Last 12 months", range: () => [ym(addMonths(new Date(), -11)), ym(new Date())] },
  { id: "year", label: "This year", range: () => [`${new Date().getFullYear()}-01`, ym(new Date())] },
];

export default function SalaryHistory({ onOpenMonth }) {
  const toast = useToast();
  const [preset, setPreset] = useState("6");
  const [[from, to], setRange] = useState(PRESETS[1].range());
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [query, setQuery] = useState("");
  const [state, setState] = useState({ loading: true, error: false, payments: [], staff: [] });
  const [exporting, setExporting] = useState("");

  const current = ym(new Date());
  const valid = from && to && from <= to && monthsBetween(from, to).length <= 36;

  useEffect(() => {
    getBranches().then(setBranches).catch(() => {});
  }, []);

  useEffect(() => {
    if (!valid) return undefined;
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: false }));
    const base = branchId ? { branchId } : {};
    Promise.all([getSalaryPayments({ fromMonth: from, toMonth: to, ...base }), getStaffSalaryStatus(current, branchId || undefined)])
      .then(([payments, staff]) => !cancelled && setState({ loading: false, error: false, payments, staff }))
      .catch(() => !cancelled && setState({ loading: false, error: true, payments: [], staff: [] }));
    return () => { cancelled = true; };
  }, [from, to, branchId, valid, current]);

  const months = useMemo(() => (valid ? monthsBetween(from, to) : []), [from, to, valid]);

  const model = useMemo(() => {
    const people = new Map();
    const keyOf = (type, id) => `${type}-${id}`;
    state.staff.forEach((s) => people.set(keyOf(s.type, s.id), { key: keyOf(s.type, s.id), name: s.name, role: s.role, branch: s.branch, baseSalary: s.baseSalary, paid: {}, total: 0 }));
    state.payments.forEach((p) => {
      const k = keyOf(p.type, p.staffId);
      if (!people.has(k)) people.set(k, { key: k, name: p.name, role: p.role, branch: p.branch, baseSalary: null, paid: {}, total: 0 });
      const row = people.get(k);
      row.paid[p.month] = (row.paid[p.month] || 0) + Number(p.amount || 0);
      row.total += Number(p.amount || 0);
    });
    const byMonth = Object.fromEntries(months.map((m) => [m, 0]));
    state.payments.forEach((p) => { if (p.month in byMonth) byMonth[p.month] += Number(p.amount || 0); });
    const total = state.payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    return {
      rows: [...people.values()].sort((a, b) => a.name.localeCompare(b.name)),
      byMonth,
      total,
      count: state.payments.length,
      paidPeople: new Set(state.payments.map((p) => `${p.type}-${p.staffId}`)).size,
    };
  }, [state, months]);

  // "Not paid" only makes sense once someone is on payroll: after their first recorded payment,
  // or (if never paid in this range) for the last two months.
  const prevMonth = ym(addMonths(new Date(), -1));
  const isMissed = (r, m) => {
    if (!r.baseSalary) return false;
    const firstPaid = Object.keys(r.paid).sort()[0];
    return firstPaid ? m > firstPaid : m >= prevMonth;
  };

  const rows = model.rows.filter((r) => {
    const q = query.trim().toLowerCase();
    return !q || [r.name, r.role, r.branch].some((v) => (v || "").toLowerCase().includes(q));
  });
  const { page, setPage, pageItems, total: rowCount } = usePagination(rows, `${query}|${from}|${to}|${branchId}`);

  const choosePreset = (p) => {
    setPreset(p.id);
    setRange(p.range());
  };

  const branchName = branchId ? branches.find((b) => String(b.id) === String(branchId))?.branchName || "Branch" : "All branches";
  const rangeLabel = valid ? `${monthLabel(from, true)} - ${monthLabel(to, true)}` : "—";

  const download = async (kind) => {
    setExporting(kind);
    try {
      const { exportSalaryExcel, exportSalaryPdf } = await import("../../utils/salaryExport");
      const report = {
        rangeLabel, branchName, generatedAt: new Date().toLocaleString(),
        months: months.map((m) => ({ key: m, label: monthLabel(m) })),
        kpis: [
          { label: "Total paid", value: rs(model.total) },
          { label: "Payments", value: String(model.count) },
          { label: "Average per month", value: rs(months.length ? Math.round(model.total / months.length) : 0) },
          { label: "Staff paid", value: String(model.paidPeople) },
        ],
        register: rows.map((r) => ({ name: r.name, role: r.role || "", branch: r.branch || "", paid: r.paid, total: r.total })),
        monthTotals: months.map((m) => ({ key: m, total: model.byMonth[m] })),
        ledger: state.payments.map((p) => ({ month: p.month, date: p.paymentDate, name: p.name, role: p.role || "", branch: p.branch || "", amount: Number(p.amount || 0) })),
      };
      await (kind === "excel" ? exportSalaryExcel(report) : exportSalaryPdf(report));
      toast.success(kind === "excel" ? "Excel file downloaded." : "PDF downloaded.");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't create the file. Please try again.");
    } finally {
      setExporting("");
    }
  };

  const kpis = [
    { label: "Total paid", value: rs(model.total), hint: rangeLabel },
    { label: "Payments", value: model.count, hint: `Across ${months.length} month${months.length === 1 ? "" : "s"}` },
    { label: "Average per month", value: rs(months.length ? Math.round(model.total / months.length) : 0), hint: "Payroll paid out" },
    { label: "Staff paid", value: model.paidPeople, hint: "At least one payment" },
  ];

  return (
    <>
      <div className="staff-filter-bar">
        <div className="staff-chips" role="group" aria-label="History range">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" className={`staff-chip${preset === p.id ? " active" : ""}`} aria-pressed={preset === p.id} onClick={() => choosePreset(p)}>
              {p.label}
            </button>
          ))}
          <button type="button" className={`staff-chip${preset === "custom" ? " active" : ""}`} aria-pressed={preset === "custom"} onClick={() => setPreset("custom")}>
            Custom
          </button>
        </div>
        <div className="staff-filter-group">
          <select className="staff-input" aria-label="Branch" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            <option value="">All branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.branchName}</option>
            ))}
          </select>
          <button className="staff-btn staff-btn-secondary" onClick={() => download("excel")} disabled={state.loading || !valid || !!exporting}>
            {exporting === "excel" ? "Preparing…" : "Excel"}
          </button>
          <button className="staff-btn staff-btn-secondary" onClick={() => download("pdf")} disabled={state.loading || !valid || !!exporting}>
            {exporting === "pdf" ? "Preparing…" : "PDF"}
          </button>
        </div>
      </div>

      <div className="report-custom">
        <label className="staff-field-inline" htmlFor="sal-from">From
          <input id="sal-from" type="month" className="staff-input" value={from} max={to || current} onChange={(e) => { setPreset("custom"); setRange([e.target.value, to]); }} />
        </label>
        <label className="staff-field-inline" htmlFor="sal-to">To
          <input id="sal-to" type="month" className="staff-input" value={to} min={from} max={current} onChange={(e) => { setPreset("custom"); setRange([from, e.target.value]); }} />
        </label>
        {!valid && <span className="pos-error">Choose a start month on or before the end month (up to 36 months).</span>}
      </div>

      {state.error ? (
        <div className="staff-empty-state">
          <h3>Couldn't load payment history</h3>
          <p>Check that the server is running and try again.</p>
        </div>
      ) : (
        <>
          <section className="dash-kpis staff-kpis" aria-label="Payment history summary">
            {kpis.map((k) => (
              <article key={k.label} className="dash-kpi">
                <p className="dash-kpi-label">{k.label}</p>
                <p className="dash-kpi-value">{state.loading ? "…" : k.value}</p>
                <p className="dash-kpi-hint">{k.hint}</p>
              </article>
            ))}
          </section>

          <section className="dash-card">
            <div className="dash-card-head"><h2>Payroll paid per month</h2></div>
            {state.loading ? (
              <p className="dash-empty">Loading…</p>
            ) : (
              <BarChart
                caption="Payroll paid per month"
                format={rs}
                emptyText="No salary payments in this period."
                data={months.map((m) => ({ key: m, label: monthLabel(m), value: model.byMonth[m] || 0, tip: monthLabel(m, true) }))}
              />
            )}
          </section>

          <div className="register-head">
            <h2 className="staff-section-title">Payroll register</h2>
            <input className="staff-input staff-search" type="search" placeholder="Search name, role or branch" aria-label="Search staff" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>

          {state.loading ? (
            <p>Loading payment history...</p>
          ) : (
            <>
              <div className="table-scroll">
                <table className="staff-table nowrap-table register-table">
                  <thead>
                    <tr>
                      <th className="sticky-col">Staff</th>
                      {months.map((m) => (
                        <th key={m} className="num">{monthLabel(m)}</th>
                      ))}
                      <th className="num">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((r) => (
                      <tr key={r.key}>
                        <td className="sticky-col">
                          <span className="staff-cell-strong">{r.name}</span>
                          <span className="cell-sub">{r.role}{r.branch ? ` · ${r.branch}` : ""}</span>
                        </td>
                        {months.map((m) => (
                          <td key={m} className="num">
                            {r.paid[m] ? (
                              <span className="reg-paid">{rs(r.paid[m])}</span>
                            ) : isMissed(r, m) ? (
                              <button className="reg-unpaid" onClick={() => onOpenMonth(m)} title={`Open ${monthLabel(m, true)} payroll`}>Not paid</button>
                            ) : (
                              <span className="staff-cell-muted">—</span>
                            )}
                          </td>
                        ))}
                        <td className="num staff-cell-strong">{rs(r.total)}</td>
                      </tr>
                    ))}
                    {rows.length === 0 && <tr className="empty-row"><td colSpan={months.length + 2}>No staff match your search.</td></tr>}
                  </tbody>
                  {rows.length > 0 && (
                    <tfoot>
                      <tr>
                        <td className="sticky-col staff-cell-strong">Total paid</td>
                        {months.map((m) => (
                          <td key={m} className="num staff-cell-strong">{model.byMonth[m] ? rs(model.byMonth[m]) : "—"}</td>
                        ))}
                        <td className="num staff-cell-strong">{rs(model.total)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
              <Pagination page={page} total={rowCount} onPage={setPage} />
              <p className="report-note">"Not paid" marks a month with no recorded payment after the person's first payment. Select it to open that month's payroll and pay.</p>
            </>
          )}
        </>
      )}
    </>
  );
}
