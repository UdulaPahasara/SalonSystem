import React, { useEffect, useRef, useState } from "react";
import { useToast } from "../../context/ToastContext";
import { PRESETS, rangeFor, fmtDate, dateKey, loadReport, buildReportView } from "../../utils/reportData";
import { REPORT_SECTIONS, buildSections, previewReportPdf } from "../../utils/reportTables";

/** Every report in one list: preview it, or download it as Excel or PDF, for the timeframe and branch chosen here. */
export default function ExportReportDialog({ onClose, isOwner, branches, ownBranchId, initial }) {
  const toast = useToast();
  const [preset, setPreset] = useState(initial.preset);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [granularity, setGranularity] = useState("auto");
  const [branchId, setBranchId] = useState(initial.branchId || "");
  const [busy, setBusy] = useState(""); // "<report id>:<action>" while one is being made
  const cache = useRef({ key: "", view: null });
  const today = dateKey(new Date());
  const reports = REPORT_SECTIONS.filter((s) => isOwner || !s.ownerOnly);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const valid = preset !== "custom" || (from && to && from <= to);
  const [start, end] = valid ? rangeFor(preset, from, to) : [null, null];
  const days = start ? Math.round((end - start) / 864e5) + 1 : 0;
  const monthly = granularity === "monthly" || (granularity === "auto" && days > 92) || days > 366;
  const target = isOwner ? branchId : String(ownBranchId || "");
  const branchName = isOwner ? (branchId ? branches.find((b) => String(b.id) === String(branchId))?.branchName || "Branch" : "All branches") : "Your branch";
  const periodLabel = start ? `${fmtDate(start)} - ${fmtDate(end)}` : "";

  // Loads the data once per timeframe/branch, then builds the chosen report (or all of them).
  const makeReport = async (id) => {
    const key = `${start?.getTime()}|${end?.getTime()}|${target}|${granularity}`;
    if (cache.current.key !== key) {
      const raw = await loadReport({ start, end, branchId: target, granularity });
      cache.current = { key, view: buildReportView(raw, start, end) };
    }
    const sections = buildSections(cache.current.view, { isOwner, periodLabel });
    return { periodLabel, branchName, generatedAt: new Date().toLocaleString(), sections: id === "all" ? sections : sections.filter((x) => x.id === id) };
  };

  const run = async (id, action, label) => {
    if (!valid || busy) return;
    setBusy(`${id}:${action}`);
    try {
      if (action === "preview") {
        await previewReportPdf(() => makeReport(id));
      } else {
        const report = await makeReport(id);
        const { exportReportExcel, exportReportPdf } = await import("../../utils/reportExport");
        await (action === "excel" ? exportReportExcel(report) : exportReportPdf(report));
        toast.success(`${label} ${action === "excel" ? "Excel" : "PDF"} downloaded.`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Couldn't create the report. Please try again.");
    } finally {
      setBusy("");
    }
  };

  const rows = [...reports.map((r) => ({ id: r.id, label: r.label, intro: r.intro })), { id: "all", label: "All reports", intro: "Every report above in one file (a sheet per report in Excel)." }];

  return (
    <div className="modal-overlay" onClick={() => !busy && onClose()}>
      <div className="modal-content export-dialog" role="dialog" aria-modal="true" aria-labelledby="export-title" onClick={(e) => e.stopPropagation()}>
        <h3 id="export-title">Download reports</h3>

        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="exp-period">Timeframe</label>
            <select id="exp-period" className="staff-input" value={preset} onChange={(e) => setPreset(e.target.value)}>
              {PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
          {isOwner ? (
            <div className="form-group">
              <label htmlFor="exp-branch">Branch</label>
              <select id="exp-branch" className="staff-input" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                <option value="">All branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.branchName}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="exp-group">Group revenue by</label>
              <select id="exp-group" className="staff-input" value={granularity} onChange={(e) => setGranularity(e.target.value)}>
                <option value="auto">Automatic</option>
                <option value="daily">Day</option>
                <option value="monthly">Month</option>
              </select>
            </div>
          )}
        </div>
        {preset === "custom" && (
          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="exp-from">From</label>
              <input id="exp-from" type="date" className="staff-input" value={from} max={to || today} onChange={(e) => setFrom(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="exp-to">To</label>
              <input id="exp-to" type="date" className="staff-input" value={to} min={from} max={today} onChange={(e) => setTo(e.target.value)} required />
            </div>
          </div>
        )}
        {isOwner && (
          <div className="form-group">
            <label htmlFor="exp-group">Group revenue by</label>
            <select id="exp-group" className="staff-input" value={granularity} onChange={(e) => setGranularity(e.target.value)}>
              <option value="auto">Automatic</option>
              <option value="daily">Day</option>
              <option value="monthly">Month</option>
            </select>
          </div>
        )}
        {valid ? (
          <p className="export-summary">{periodLabel} · {branchName} · {days} day{days === 1 ? "" : "s"} · revenue by {monthly ? "month" : "day"}</p>
        ) : (
          <p className="pos-error">Choose a start date on or before the end date.</p>
        )}

        <ul className="export-list" aria-label="Reports">
          {rows.map((r) => (
            <li key={r.id} className={`export-item${r.id === "all" ? " export-item-all" : ""}`}>
              <div className="export-item-text">
                <strong>{r.label}</strong>
                <small>{r.intro}</small>
              </div>
              <div className="export-item-actions">
                {[["preview", "Preview"], ["excel", "Excel"], ["pdf", "PDF"]].map(([action, text]) => (
                  <button
                    key={action}
                    type="button"
                    className="staff-btn staff-btn-secondary export-btn"
                    disabled={!valid || !!busy}
                    aria-label={`${text} ${r.label}`}
                    onClick={() => run(r.id, action, r.label)}
                  >
                    {busy === `${r.id}:${action}` ? "…" : text}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>

        <div className="modal-actions">
          <button type="button" className="staff-btn staff-btn-primary" onClick={onClose} disabled={!!busy}>Done</button>
        </div>
      </div>
    </div>
  );
}
