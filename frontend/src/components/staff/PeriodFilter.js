import React from "react";
import { PERIOD_OPTIONS, dateKey } from "../../utils/period";

// Timeframe picker: presets plus a custom From/To range (either side may be left empty).
export default function PeriodFilter({ value, onChange, options = PERIOD_OPTIONS }) {
  const today = dateKey(new Date());
  const invalid = value.period === "custom" && value.from && value.to && value.from > value.to;
  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <div className="period-filter">
      <select className="staff-input" aria-label="Period" value={value.period} onChange={(e) => set({ period: e.target.value })}>
        {options.map((p) => (
          <option key={p.id} value={p.id}>{p.label}</option>
        ))}
      </select>
      {value.period === "custom" && (
        <>
          <label className="staff-field-inline">
            From
            <input type="date" className="staff-input" aria-label="From date" value={value.from} max={value.to || undefined} onChange={(e) => set({ from: e.target.value })} />
          </label>
          <label className="staff-field-inline">
            To
            <input type="date" className="staff-input" aria-label="To date" value={value.to} min={value.from || undefined} max={today} onChange={(e) => set({ to: e.target.value })} />
          </label>
          {invalid && <span className="pos-error">Start date must be before the end date.</span>}
        </>
      )}
    </div>
  );
}
