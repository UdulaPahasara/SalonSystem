import React, { useEffect, useState } from "react";
import { useToast } from "../../context/ToastContext";
import { PRESETS, rangeFor, fmtDate, dateKey, loadReport, buildReportView } from "../../utils/reportData";
import { REPORT_SECTIONS, buildSections } from "../../utils/reportTables";

export default function ExportReportDialog({ onClose, isOwner, branches, ownBranchId, initial }) {
  const toast = useToast();
  const [format, setFormat] = useState("excel");
  const [preset, setPreset] = useState(initial.preset);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [granularity, setGranularity] = useState("auto");
  const [branchId, setBranchId] = useState(initial.branchId || "");
  const SECTIONS = REPORT_SECTIONS.filter((s) => isOwner || !s.ownerOnly);
  const [sections, setSections] = useState(Object.fromEntries(REPORT_SECTIONS.map((s) => [s.id, true])));
  const [busy, setBusy] = useState(false);
  const today = dateKey(new Date());

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
  const anySection = SECTIONS.some((s) => sections[s.id]);

  const download = async (e) => {
    e.preventDefault();
    if (!valid || !anySection) return;
    setBusy(true);
    try {
      const raw = await loadReport({ start, end, branchId: target, granularity });
      const view = buildReportView(raw, start, end);
      const periodLabel = `${fmtDate(start)} - ${fmtDate(end)}`;
      const report = {
        periodLabel,
        branchName: isOwner ? (branchId ? branches.find((b) => String(b.id) === String(branchId))?.branchName || "Branch" : "All branches") : "Your branch",
        generatedAt: new Date().toLocaleString(),
        sections: buildSections(view, { isOwner, periodLabel }).filter((sec) => sections[sec.id]),
      };
      const { exportReportExcel, exportReportPdf } = await import("../../utils/reportExport");
      await (format === "excel" ? exportReportExcel(report) : exportReportPdf(report));
      toast.success(format === "excel" ? "Excel report downloaded." : "PDF report downloaded.");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Couldn't create the report. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => !busy && onClose()}>
      <div className="modal-content export-dialog" role="dialog" aria-modal="true" aria-labelledby="export-title" onClick={(e) => e.stopPropagation()}>
        <h3 id="export-title">Download report</h3>
        <form onSubmit={download}>
          <fieldset className="export-group">
            <legend>Format</legend>
            <div className="export-formats">
              {[["excel", "Excel (.xlsx)", "A sheet for each section"], ["pdf", "PDF", "Printable report for sharing"]].map(([id, title, sub]) => (
                <label key={id} className={`export-format${format === id ? " selected" : ""}`}>
                  <input type="radio" name="format" value={id} checked={format === id} onChange={() => setFormat(id)} />
                  <span><strong>{title}</strong><small>{sub}</small></span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="form-group">
            <label htmlFor="exp-period">Timeframe</label>
            <select id="exp-period" className="staff-input" value={preset} onChange={(e) => setPreset(e.target.value)}>
              {PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
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
          {!valid && <p className="pos-error">Choose a start date on or before the end date.</p>}

          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="exp-group">Group revenue by</label>
              <select id="exp-group" className="staff-input" value={granularity} onChange={(e) => setGranularity(e.target.value)}>
                <option value="auto">Automatic</option>
                <option value="daily">Day</option>
                <option value="monthly">Month</option>
              </select>
            </div>
            {isOwner && (
              <div className="form-group">
                <label htmlFor="exp-branch">Branch</label>
                <select id="exp-branch" className="staff-input" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                  <option value="">All branches</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.branchName}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {valid && (
            <p className="export-summary">
              {fmtDate(start)} – {fmtDate(end)} · {days} day{days === 1 ? "" : "s"} · revenue by {monthly ? "month" : "day"}
              {days > 366 && granularity === "daily" ? " (daily is limited to one year, so months are used)" : ""}
            </p>
          )}

          <fieldset className="export-group">
            <legend>Include</legend>
            <div className="export-sections">
              {SECTIONS.map((s) => (
                <label key={s.id} className="form-check">
                  <input type="checkbox" checked={sections[s.id]} onChange={(e) => setSections({ ...sections, [s.id]: e.target.checked })} />
                  {s.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="modal-actions">
            <button type="button" className="staff-btn staff-btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
            <button type="submit" className="staff-btn staff-btn-primary" disabled={busy || !valid || !anySection}>
              {busy ? "Preparing…" : `Download ${format === "excel" ? "Excel" : "PDF"}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
