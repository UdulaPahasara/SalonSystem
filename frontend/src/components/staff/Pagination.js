import React, { useEffect, useState } from "react";

export const PAGE_SIZE = 50;

// Slices a list into pages of 50 and resets to page 1 whenever resetKey (filters/search) changes.
export function usePagination(items, resetKey = "") {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  useEffect(() => setPage(1), [resetKey]);
  const current = Math.min(page, totalPages);
  return {
    page: current,
    setPage,
    total: items.length,
    pageItems: items.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
  };
}

function pageList(current, last) {
  const pages = new Set([1, last, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap" + p);
    out.push(p);
  });
  return out;
}

export default function Pagination({ page, total, onPage }) {
  const last = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (total <= PAGE_SIZE) return null;
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <nav className="pager" aria-label="Pagination">
      <p className="pager-info">
        Showing {from}–{to} of {total}
      </p>
      <div className="pager-controls">
        <button type="button" className="pager-btn" onClick={() => onPage(page - 1)} disabled={page === 1}>
          ← Previous
        </button>
        {pageList(page, last).map((p) =>
          typeof p === "string" ? (
            <span key={p} className="pager-gap" aria-hidden="true">…</span>
          ) : (
            <button
              key={p}
              type="button"
              className={`pager-btn${p === page ? " active" : ""}`}
              aria-current={p === page ? "page" : undefined}
              onClick={() => onPage(p)}
            >
              {p}
            </button>
          )
        )}
        <button type="button" className="pager-btn" onClick={() => onPage(page + 1)} disabled={page === last}>
          Next →
        </button>
      </div>
    </nav>
  );
}
