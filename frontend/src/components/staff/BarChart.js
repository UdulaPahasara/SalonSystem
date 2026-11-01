import React, { useState } from "react";
import "../../styles/Dashboard.css";

// Round the axis maximum up to 1, 2, 5 x 10^n so tick labels read cleanly (e.g. 100k, 50k, 0).
function niceTop(max) {
  if (max <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(max));
  const n = max / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}
const compact = (n) => (n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${+(n / 1e3).toFixed(1)}k` : String(n));

/**
 * Single-series bar chart. data: [{ key, label, value, tip }]
 * label sits under the bar (thinned out when there are many bars); tip is the hover/focus text.
 */
export default function BarChart({ data, format = (v) => String(v), caption = "Chart data", emptyText = "Nothing to show for this period." }) {
  const [active, setActive] = useState(null);
  const max = Math.max(...data.map((d) => d.value), 0);

  if (data.length === 0 || max === 0) return <p className="dash-empty">{emptyText}</p>;

  const top = niceTop(max);
  const ticks = [top, top / 2, 0];
  const step = Math.ceil(data.length / 12); // show at most ~12 x-axis labels

  return (
    <div className="dash-chart">
      <div className="dash-chart-axis" aria-hidden="true">
        {ticks.map((t) => (
          <span key={t}>{compact(t)}</span>
        ))}
      </div>
      <div className="dash-chart-plot" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))`, gap: data.length > 20 ? "0.2rem" : "0.5rem" }}>
        <div className="dash-chart-lines" aria-hidden="true">
          {ticks.map((t) => (
            <i key={t} style={{ bottom: `${(t / top) * 100}%` }} />
          ))}
        </div>
        {data.map((d, i) => (
          <div
            key={d.key}
            className="dash-chart-col"
            tabIndex={0}
            aria-label={`${d.tip}: ${format(d.value)}`}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
          >
            {active === i && (
              <span className="dash-chart-tip" role="status" style={{ bottom: `calc(${Math.min((d.value / top) * 100, 78)}% + 6px)` }}>
                <b>{format(d.value)}</b>
                {d.tip}
              </span>
            )}
            <span className="dash-chart-bar" style={{ height: `${(d.value / top) * 100}%` }} />
            {i % step === 0 && <span className="dash-chart-day">{d.label}</span>}
          </div>
        ))}
      </div>
      <table className="sr-only">
        <caption>{caption}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.key}>
              <th>{d.tip}</th>
              <td>{format(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
