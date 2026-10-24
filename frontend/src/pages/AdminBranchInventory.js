import React, { useEffect, useMemo, useState } from "react";
import { getBranches } from "../api/branchApi";
import { getInventoryByBranch } from "../api/productApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/staff/PageHeader";
import { getStaffHomePath } from "../utils/staffNav";
import { rs } from "../utils/format";
import "../components/DashboardLayout.css";
import "../styles/Dashboard.css";
import "../styles/StaffPages.css";

const LOW_STOCK_LIMIT = 5;
const FILTERS = ["All", "Low stock", "Out of stock"];

const stockState = (qty) => (qty <= 0 ? "out" : qty < LOW_STOCK_LIMIT ? "low" : "ok");
const STATE_LABEL = { ok: "In stock", low: "Low stock", out: "Out of stock" };

export default function AdminBranchInventory() {
  const { userRole } = useAuth();
  const toast = useToast();
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    getBranches()
      .then((list) => {
        setBranches(list);
        if (list.length) setBranchId(String(list[0].id));
        else setLoading(false);
      })
      .catch(() => {
        toast.error("Couldn't load branches.");
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!branchId) return;
    setLoading(true);
    getInventoryByBranch(branchId)
      .then(setInventory)
      .catch(() => toast.error("Error loading inventory for this branch."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const summary = useMemo(() => ({
    products: inventory.length,
    units: inventory.reduce((s, i) => s + Number(i.quantity || 0), 0),
    low: inventory.filter((i) => stockState(i.quantity) !== "ok").length,
    value: inventory.reduce((s, i) => s + Number(i.quantity || 0) * Number(i.unitPrice || 0), 0),
  }), [inventory]);

  const rows = inventory
    .filter((i) => {
      const state = stockState(i.quantity);
      if (filter === "Low stock" && state !== "low") return false;
      if (filter === "Out of stock" && state !== "out") return false;
      const q = query.trim().toLowerCase();
      return !q || (i.productName || "").toLowerCase().includes(q);
    })
    .sort((a, b) => (a.productName || "").localeCompare(b.productName || ""));

  const kpis = [
    { label: "Products", value: summary.products, hint: "Stocked at this branch" },
    { label: "Units in stock", value: summary.units.toLocaleString(), hint: "Across all products" },
    { label: "Needs restocking", value: summary.low, hint: `Under ${LOW_STOCK_LIMIT} units or out` },
    { label: "Stock value", value: rs(summary.value), hint: "At unit price" },
  ];

  return (
    <div className="staff-page">
      <PageHeader title="Branch Inventory" subtitle="Stock levels for each branch." backTo={getStaffHomePath(userRole)} />

      <section className="dash-kpis staff-kpis" aria-label="Inventory summary">
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
              <button key={f} type="button" className={`staff-chip${filter === f ? " active" : ""}`} aria-pressed={filter === f} onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
          </div>
          <input className="staff-input staff-search" type="search" placeholder="Search products" aria-label="Search products" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <label className="staff-field-inline" htmlFor="inv-branch">
          Branch
          <select id="inv-branch" className="staff-input" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.branchName}</option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p>Loading inventory...</p>
      ) : !branchId ? (
        <div className="staff-empty-state">
          <h3>No branches yet</h3>
          <p>Add a branch first, then its stock will appear here.</p>
        </div>
      ) : inventory.length === 0 ? (
        <div className="staff-empty-state">
          <h3>No stock at this branch</h3>
          <p>Stock appears after a stock request is approved.</p>
        </div>
      ) : (
        <table className="staff-table">
          <thead>
            <tr>
              <th>Product</th>
              <th className="num">Unit price</th>
              <th className="num">Quantity</th>
              <th className="num">Stock value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => {
              const state = stockState(i.quantity);
              return (
                <tr key={i.inventoryId}>
                  <td className="staff-cell-strong">{i.productName}</td>
                  <td className="num">{rs(i.unitPrice)}</td>
                  <td className="num">{i.quantity}</td>
                  <td className="num">{rs(Number(i.quantity) * Number(i.unitPrice))}</td>
                  <td><span className={`status-badge ${state}`}>{STATE_LABEL[state]}</span></td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr className="empty-row"><td colSpan="5">No products match your filters.</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}
