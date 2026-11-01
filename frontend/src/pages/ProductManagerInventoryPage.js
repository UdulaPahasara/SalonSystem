import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getProducts, getInventoryByBranch } from "../api/productApi";
import { getBranches } from "../api/branchApi";
import { createStockRequest, getAllStockRequests } from "../api/stockRequestApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/staff/PageHeader";
import Pagination, { usePagination } from "../components/staff/Pagination";
import { getStaffHomePath } from "../utils/staffNav";
import { rs } from "../utils/format";
import "../components/DashboardLayout.css";
import "../styles/Dashboard.css";
import "../styles/StaffPages.css";

const LIMIT = 5;
const FILTERS = ["All", "Low stock", "Out of stock"];
const state = (q) => (q <= 0 ? "out" : q < LIMIT ? "low" : "ok");
const LABEL = { ok: "In stock", low: "Low stock", out: "Out of stock" };
const errorText = (err, fallback) => (typeof err.response?.data === "string" && err.response.data ? err.response.data : fallback);

export default function ProductManagerInventoryPage() {
  const { userId, userRole } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [lines, setLines] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [branchFilter, setBranchFilter] = useState("");
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState(null); // { productId, branchId }
  const [qty, setQty] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [prods, brs, reqs] = await Promise.all([getProducts(), getBranches(), getAllStockRequests().then((r) => r.data).catch(() => [])]);
      setProducts(prods);
      setBranches(brs);
      setRequests(reqs);
      const stock = await Promise.all(brs.map((b) => getInventoryByBranch(b.id).then((l) => l.map((x) => ({ ...x, branchId: b.id, branchName: b.branchName }))).catch(() => [])));
      setLines(stock.flat());
    } catch (err) {
      toast.error("Couldn't load stock.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "Request stock" on the Products page opens this page with ?product=ID
  useEffect(() => {
    const id = searchParams.get("product");
    if (id && products.length) {
      setDialog({ productId: id, branchId: "" });
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  const pending = useMemo(() => new Set(requests.filter((r) => r.status === "PENDING").map((r) => `${r.product?.productId}-${r.branch?.id}`)), [requests]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lines
      .filter((l) => (!branchFilter || String(l.branchId) === branchFilter) && (filter === "All" || (filter === "Low stock" ? state(l.quantity) === "low" : state(l.quantity) === "out")) && (!q || (l.productName || "").toLowerCase().includes(q)))
      .sort((a, b) => a.quantity - b.quantity || a.productName.localeCompare(b.productName));
  }, [lines, filter, branchFilter, query]);
  const { page, setPage, pageItems, total } = usePagination(rows, `${filter}|${branchFilter}|${query}`);

  const openDialog = (l) => { setQty(""); setDialog({ productId: String(l.productId), branchId: String(l.branchId) }); };

  const send = async (e) => {
    e.preventDefault();
    const q = parseInt(qty, 10);
    if (!dialog.branchId) { toast.error("Choose a branch."); return; }
    if (!(q >= 1)) { toast.error("Enter a quantity of at least 1."); return; }
    setSaving(true);
    try {
      await createStockRequest({ productId: Number(dialog.productId), branchId: Number(dialog.branchId), requestedQuantity: q, requestedBy: userId });
      toast.success("Stock request sent to the branch manager.");
      setDialog(null);
      load();
    } catch (err) {
      toast.error(errorText(err, "Couldn't send the request."));
    } finally {
      setSaving(false);
    }
  };

  const low = lines.filter((l) => state(l.quantity) === "low").length;
  const out = lines.filter((l) => state(l.quantity) === "out").length;
  const kpis = [
    { label: "Stock lines", value: lines.length, hint: "Product × branch" },
    { label: "Low stock", value: low, hint: `Under ${LIMIT} units` },
    { label: "Out of stock", value: out, hint: "Nothing left" },
    { label: "Requests pending", value: requests.filter((r) => r.status === "PENDING").length, hint: "Awaiting branch approval" },
  ];
  const chosen = dialog && products.find((p) => String(p.productId) === dialog.productId);

  return (
    <div className="staff-page">
      <PageHeader
        title="Branch Stock"
        subtitle="See stock at every branch and request more where it's running low."
        backTo={getStaffHomePath(userRole)}
        actions={<button className="staff-btn staff-btn-primary" onClick={() => { setQty(""); setDialog({ productId: "", branchId: "" }); }}>+ New Request</button>}
      />

      <section className="dash-kpis staff-kpis" aria-label="Stock summary">
        {kpis.map((k) => (
          <article key={k.label} className="dash-kpi">
            <p className="dash-kpi-label">{k.label}</p>
            <p className="dash-kpi-value">{loading ? "…" : k.value}</p>
            <p className="dash-kpi-hint">{k.hint}</p>
          </article>
        ))}
      </section>

      <div className="staff-filter-bar">
        <div className="staff-filter-group">
          <div className="staff-chips" role="group" aria-label="Filter by stock level">
            {FILTERS.map((f) => (
              <button key={f} type="button" className={`staff-chip${filter === f ? " active" : ""}`} aria-pressed={filter === f} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
          <input className="staff-input staff-search" type="search" placeholder="Search products" aria-label="Search products" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className="staff-input" aria-label="Branch" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
          <option value="">All branches</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.branchName}</option>)}
        </select>
      </div>

      {loading ? (
        <p>Loading stock...</p>
      ) : lines.length === 0 ? (
        <div className="staff-empty-state">
          <h3>No stock recorded yet</h3>
          <p>Send a stock request for a product and branch. Once the branch manager approves it, it appears here.</p>
        </div>
      ) : (
        <>
          <div className="table-scroll">
            <table className="staff-table nowrap-table">
              <thead>
                <tr><th>Product</th><th>Branch</th><th className="num">Unit price</th><th className="num">In stock</th><th>Status</th><th className="staff-th-right">Actions</th></tr>
              </thead>
              <tbody>
                {pageItems.map((l) => {
                  const st = state(l.quantity);
                  const waiting = pending.has(`${l.productId}-${l.branchId}`);
                  return (
                    <tr key={`${l.branchId}-${l.productId}`}>
                      <td className="staff-cell-strong">{l.productName}</td>
                      <td>{l.branchName}</td>
                      <td className="num">{rs(l.unitPrice)}</td>
                      <td className="num">{l.quantity}</td>
                      <td>
                        <span className={`status-badge ${st}`}>{LABEL[st]}</span>
                        {waiting && <span className="status-badge pending" style={{ marginLeft: "0.4rem" }}>Request pending</span>}
                      </td>
                      <td className="staff-row-actions">
                        <button className="dashboard-btn-primary" onClick={() => openDialog(l)}>Request stock</button>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && <tr className="empty-row"><td colSpan="6">No stock lines match your filters.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={total} onPage={setPage} />
        </>
      )}

      {dialog && (
        <div className="modal-overlay" onClick={() => setDialog(null)}>
          <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="req-title" onClick={(e) => e.stopPropagation()}>
            <h3 id="req-title">Request stock</h3>
            <form onSubmit={send}>
              <div className="form-group">
                <label htmlFor="req-product">Product</label>
                <select id="req-product" className="staff-input" value={dialog.productId} onChange={(e) => setDialog({ ...dialog, productId: e.target.value })} required>
                  <option value="">Select product</option>
                  {products.map((p) => <option key={p.productId} value={p.productId}>{p.productName}{p.brand ? ` — ${p.brand}` : ""}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="req-branch">Branch</label>
                <select id="req-branch" className="staff-input" value={dialog.branchId} onChange={(e) => setDialog({ ...dialog, branchId: e.target.value })} required>
                  <option value="">Select branch</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.branchName}</option>)}
                </select>
              </div>
              {chosen && dialog.branchId && (
                <p className="export-summary">
                  Currently {lines.find((l) => String(l.productId) === dialog.productId && String(l.branchId) === dialog.branchId)?.quantity ?? 0} in stock at this branch.
                </p>
              )}
              <div className="form-group">
                <label htmlFor="req-qty">Quantity</label>
                <input id="req-qty" type="number" min="1" step="1" className="staff-input" value={qty} onChange={(e) => setQty(e.target.value)} autoFocus required />
              </div>
              <div className="modal-actions">
                <button type="button" className="staff-btn staff-btn-secondary" onClick={() => setDialog(null)}>Cancel</button>
                <button type="submit" className="staff-btn staff-btn-primary" disabled={saving}>{saving ? "Sending…" : "Send request"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
