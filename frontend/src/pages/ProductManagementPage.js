import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getProducts, createProduct, updateProduct, deleteProduct, getInventoryByBranch } from "../api/productApi";
import { getBranches } from "../api/branchApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ConfirmContext";
import PageHeader from "../components/staff/PageHeader";
import Pagination, { usePagination } from "../components/staff/Pagination";
import { getStaffHomePath } from "../utils/staffNav";
import { rs } from "../utils/format";
import "../components/DashboardLayout.css";
import "../styles/Dashboard.css";
import "../styles/StaffPages.css";

const EMPTY = { productName: "", brand: "", unitPrice: "", lowStockLimit: "5" };
const errorText = (err, fallback) => (typeof err.response?.data === "string" && err.response.data ? err.response.data : fallback);

export default function ProductManagementPage() {
  const { userRole } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [stock, setStock] = useState({}); // productId -> { total, lowBranches }
  const [loading, setLoading] = useState(true);
  const [brand, setBrand] = useState("All");
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [list, branches] = await Promise.all([getProducts(), getBranches().catch(() => [])]);
      setProducts(list);
      const lines = (await Promise.all(branches.map((b) => getInventoryByBranch(b.id).catch(() => [])))).flat();
      const map = {};
      lines.forEach((l) => {
        const cur = map[l.productId] || { total: 0, low: 0 };
        cur.total += Number(l.quantity || 0);
        if (l.quantity < 5) cur.low += 1;
        map[l.productId] = cur;
      });
      setStock(map);
    } catch (err) {
      toast.error("Couldn't load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDialog = (p = null) => {
    setEditing(p);
    setForm(p ? { productName: p.productName, brand: p.brand || "", unitPrice: String(p.unitPrice), lowStockLimit: String(p.lowStockLimit ?? 5) } : EMPTY);
    setDialog(true);
  };

  // Dashboard "Add a product" opens the dialog straight away (?new=1)
  useEffect(() => {
    if (searchParams.get("new")) {
      openDialog();
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const brands = useMemo(() => ["All", ...new Set(products.map((p) => p.brand).filter(Boolean))], [products]);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => (brand === "All" || p.brand === brand) && (!q || [p.productName, p.brand].some((v) => (v || "").toLowerCase().includes(q))))
      .sort((a, b) => a.productName.localeCompare(b.productName));
  }, [products, brand, query]);
  const { page, setPage, pageItems, total } = usePagination(rows, `${brand}|${query}`);

  const save = async (e) => {
    e.preventDefault();
    const payload = { productName: form.productName.trim(), brand: form.brand.trim(), unitPrice: parseFloat(form.unitPrice), lowStockLimit: parseInt(form.lowStockLimit, 10) };
    setSaving(true);
    try {
      if (editing) await updateProduct(editing.productId, payload);
      else await createProduct(payload);
      toast.success(editing ? "Product updated." : "Product added.");
      setDialog(false);
      load();
    } catch (err) {
      toast.error(errorText(err, "Couldn't save the product."));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p) => {
    const ok = await confirm(`Delete ${p.productName}? Its stock records at every branch will be removed too.`, { title: "Delete product", danger: true, confirmLabel: "Delete" });
    if (!ok) return;
    try {
      await deleteProduct(p.productId);
      toast.success("Product deleted.");
      load();
    } catch (err) {
      toast.error(errorText(err, "Couldn't delete the product."));
    }
  };

  const value = products.reduce((s, p) => s + Number(p.unitPrice || 0) * (stock[p.productId]?.total || 0), 0);
  const kpis = [
    { label: "Products", value: products.length, hint: "In the catalogue" },
    { label: "Brands", value: new Set(products.map((p) => p.brand).filter(Boolean)).size, hint: "Suppliers and labels" },
    { label: "Units in stock", value: Object.values(stock).reduce((s, x) => s + x.total, 0).toLocaleString(), hint: "Across all branches" },
    { label: "Stock value", value: rs(Math.round(value)), hint: "At unit price" },
  ];

  return (
    <div className="staff-page">
      <PageHeader
        title="Products"
        subtitle="The catalogue sold and used across all branches."
        backTo={getStaffHomePath(userRole)}
        actions={<button className="staff-btn staff-btn-primary" onClick={() => openDialog()}>+ Add Product</button>}
      />

      <section className="dash-kpis staff-kpis" aria-label="Catalogue summary">
        {kpis.map((k) => (
          <article key={k.label} className="dash-kpi">
            <p className="dash-kpi-label">{k.label}</p>
            <p className="dash-kpi-value">{loading ? "…" : k.value}</p>
            <p className="dash-kpi-hint">{k.hint}</p>
          </article>
        ))}
      </section>

      <div className="staff-filter-bar">
        <div className="staff-chips" role="group" aria-label="Filter by brand">
          {brands.map((b) => (
            <button key={b} type="button" className={`staff-chip${brand === b ? " active" : ""}`} aria-pressed={brand === b} onClick={() => setBrand(b)}>{b}</button>
          ))}
        </div>
        <input className="staff-input staff-search" type="search" placeholder="Search products" aria-label="Search products" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {loading ? (
        <p>Loading products...</p>
      ) : products.length === 0 ? (
        <div className="staff-empty-state">
          <h3>No products yet</h3>
          <p>Add your first product, then request stock for the branches that sell it.</p>
          <button className="staff-btn staff-btn-primary" onClick={() => openDialog()}>+ Add Product</button>
        </div>
      ) : (
        <>
          <div className="table-scroll">
            <table className="staff-table nowrap-table">
              <thead>
                <tr><th>Product</th><th className="num">Unit price</th><th className="num">Total in stock</th><th>Stock level</th><th className="staff-th-right">Actions</th></tr>
              </thead>
              <tbody>
                {pageItems.map((p) => {
                  const s = stock[p.productId] || { total: 0, low: 0 };
                  const state = s.total === 0 ? "out" : s.low > 0 ? "low" : "ok";
                  return (
                    <tr key={p.productId}>
                      <td><span className="staff-cell-strong">{p.productName}</span>{p.brand && <span className="cell-sub">{p.brand}</span>}</td>
                      <td className="num">{rs(p.unitPrice)}</td>
                      <td className="num">{s.total}</td>
                      <td><span className={`status-badge ${state}`}>{state === "ok" ? "Healthy" : state === "low" ? `${s.low} branch${s.low === 1 ? "" : "es"} low` : "Not stocked"}</span></td>
                      <td className="staff-row-actions">
                        <Link className="dashboard-btn-primary" style={{ textDecoration: "none" }} to={`/pm/inventory?product=${p.productId}`}>Request stock</Link>
                        <button className="dashboard-btn-edit" onClick={() => openDialog(p)}>Edit</button>
                        <button className="dashboard-btn-delete" onClick={() => remove(p)}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && <tr className="empty-row"><td colSpan="5">No products match your filters.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={total} onPage={setPage} />
        </>
      )}

      {dialog && (
        <div className="modal-overlay" onClick={() => setDialog(false)}>
          <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="prod-title" onClick={(e) => e.stopPropagation()}>
            <h3 id="prod-title">{editing ? "Edit product" : "Add product"}</h3>
            <form onSubmit={save}>
              <div className="form-group">
                <label htmlFor="prod-name">Product name</label>
                <input id="prod-name" className="staff-input" value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} autoFocus required />
              </div>
              <div className="form-group">
                <label htmlFor="prod-brand">Brand</label>
                <input id="prod-brand" className="staff-input" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} required />
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="prod-price">Unit price (Rs.)</label>
                  <input id="prod-price" type="number" min="1" step="0.01" className="staff-input" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label htmlFor="prod-low">Low-stock limit</label>
                  <input id="prod-low" type="number" min="0" className="staff-input" value={form.lowStockLimit} onChange={(e) => setForm({ ...form, lowStockLimit: e.target.value })} required />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="staff-btn staff-btn-secondary" onClick={() => setDialog(false)}>Cancel</button>
                <button type="submit" className="staff-btn staff-btn-primary" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Add product"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
