import React, { useEffect, useState } from "react";
import PageHeader from "../components/staff/PageHeader";
import { getStaffHomePath } from "../utils/staffNav";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getServicesByBranch } from "../api/serviceApi";
import { getInventoryByBranch } from "../api/productApi";
import { getAllCustomers } from "../api/customerApi";
import { checkout } from "../api/usersApi";
import { SALON_INFO } from "../utils/salonInfo";
import "../components/DashboardLayout.css";

const money = (n) => `Rs. ${Number(n || 0).toFixed(2)}`;

export default function POSPage() {
  const { userRole, userId, branchId } = useAuth();
  const toast = useToast();
  const [services, setServices] = useState([]);
  const [stock, setStock] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [serviceId, setServiceId] = useState("");
  const [productId, setProductId] = useState("");
  const [cart, setCart] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [cashReceived, setCashReceived] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const loadStock = () =>
    getInventoryByBranch(branchId).then(setStock).catch(() => toast.error("Failed to load products."));

  useEffect(() => {
    if (!branchId) return;
    getServicesByBranch(branchId).then(setServices).catch(() => toast.error("Failed to load services."));
    getAllCustomers(branchId).then(setCustomers).catch(() => toast.error("Failed to load customers."));
    loadStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const addLine = (line) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.key === line.key);
      if (existing) return prev.map((l) => (l.key === line.key ? { ...l, quantity: l.quantity + 1 } : l));
      return [...prev, { ...line, quantity: 1 }];
    });
  };

  const addService = () => {
    const s = services.find((x) => String(x.serviceId) === serviceId);
    if (!s) return;
    addLine({ key: `s${s.serviceId}`, serviceId: s.serviceId, name: s.name, unitPrice: s.price });
    setServiceId("");
  };

  const addProduct = () => {
    const p = stock.find((x) => String(x.productId) === productId);
    if (!p) return;
    addLine({ key: `p${p.productId}`, productId: p.productId, name: p.productName, unitPrice: p.unitPrice, max: p.quantity });
    setProductId("");
  };

  const setQty = (key, value) => {
    const qty = Math.max(1, parseInt(value, 10) || 1);
    setCart((prev) => prev.map((l) => (l.key === key ? { ...l, quantity: l.max ? Math.min(qty, l.max) : qty } : l)));
  };

  const total = cart.reduce((sum, l) => sum + Number(l.unitPrice) * l.quantity, 0);
  const change = Number(cashReceived || 0) - total;
  const cashShort = paymentMethod === "CASH" && cashReceived !== "" && change < 0;

  const handleCheckout = async () => {
    if (cart.length === 0 || cashShort) return;
    setSubmitting(true);
    try {
      const tx = await checkout({
        branchId,
        cashierId: userId,
        customerId: customerId ? Number(customerId) : null,
        paymentMethod,
        items: cart.map((l) => ({ serviceId: l.serviceId, productId: l.productId, quantity: l.quantity })),
      });
      setReceipt({ ...tx, cashReceived: paymentMethod === "CASH" && cashReceived !== "" ? Number(cashReceived) : null });
      setCart([]);
      setCustomerId("");
      setCashReceived("");
      toast.success(`Payment recorded — ${money(tx.totalAmount)}`);
      loadStock();
    } catch (err) {
      toast.error(err.response?.data || "Checkout failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="staff-page">
      <PageHeader
        title="Point of Sale"
        subtitle="Add services and products, take payment, print receipt."
        backTo={getStaffHomePath(userRole)}
      />

      <div className="pos-grid">
        <section className="staff-form-panel">
          <div className="form-group">
            <label htmlFor="pos-service">Service</label>
            <div className="pos-row">
              <select id="pos-service" className="staff-input" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                <option value="">Select a service…</option>
                {services.map((s) => (
                  <option key={s.serviceId} value={s.serviceId}>
                    {s.name} — {money(s.price)}
                  </option>
                ))}
              </select>
              <button className="staff-btn staff-btn-secondary" onClick={addService} disabled={!serviceId}>Add</button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="pos-product">Product</label>
            <div className="pos-row">
              <select id="pos-product" className="staff-input" value={productId} onChange={(e) => setProductId(e.target.value)}>
                <option value="">Select a product…</option>
                {stock.map((p) => (
                  <option key={p.productId} value={p.productId} disabled={!p.quantity}>
                    {p.productName} — {money(p.unitPrice)} ({p.quantity || 0} in stock)
                  </option>
                ))}
              </select>
              <button className="staff-btn staff-btn-secondary" onClick={addProduct} disabled={!productId}>Add</button>
            </div>
          </div>

          {cart.length === 0 ? (
            <p className="staff-page-subtitle">No items yet.</p>
          ) : (
            <table className="staff-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Total</th>
                  <th aria-label="Remove" />
                </tr>
              </thead>
              <tbody>
                {cart.map((l) => (
                  <tr key={l.key}>
                    <td>{l.name}</td>
                    <td>{money(l.unitPrice)}</td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        max={l.max}
                        className="staff-input pos-qty"
                        value={l.quantity}
                        aria-label={`Quantity of ${l.name}`}
                        onChange={(e) => setQty(l.key, e.target.value)}
                      />
                    </td>
                    <td>{money(Number(l.unitPrice) * l.quantity)}</td>
                    <td>
                      <button className="dashboard-btn-delete" onClick={() => setCart(cart.filter((x) => x.key !== l.key))}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="staff-form-panel">
          <div className="form-group">
            <label htmlFor="pos-customer">Customer</label>
            <select id="pos-customer" className="staff-input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Walk-in customer</option>
              {customers.map((c) => (
                <option key={c.customerId} value={c.customerId}>
                  {c.fullName} {c.phone ? `(${c.phone})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Payment method</label>
            <div className="pos-row">
              {["CASH", "CARD"].map((m) => (
                <label key={m} className="pos-radio">
                  <input type="radio" name="payment" value={m} checked={paymentMethod === m} onChange={() => setPaymentMethod(m)} />
                  {m === "CASH" ? "Cash" : "Card"}
                </label>
              ))}
            </div>
          </div>

          {paymentMethod === "CASH" && (
            <div className="form-group">
              <label htmlFor="pos-cash">Cash received</label>
              <input
                id="pos-cash"
                type="number"
                min="0"
                step="0.01"
                className="staff-input"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
              />
              {cashReceived !== "" && (
                <p className={cashShort ? "pos-error" : "staff-page-subtitle"}>
                  {cashShort ? `Short by ${money(-change)}` : `Change: ${money(change)}`}
                </p>
              )}
            </div>
          )}

          <p className="pos-total">Total: {money(total)}</p>
          <button
            className="staff-btn staff-btn-primary pos-checkout"
            onClick={handleCheckout}
            disabled={cart.length === 0 || cashShort || submitting}
          >
            {submitting ? "Processing…" : "Checkout"}
          </button>
        </section>
      </div>

      {receipt && (
        <section className="staff-form-panel pos-receipt">
          <h3>{SALON_INFO.name}</h3>
          <p>
            {SALON_INFO.address.line1}, {SALON_INFO.address.city}
            <br />
            {SALON_INFO.phone}
          </p>
          <p>
            Receipt #{receipt.transactionId} · {new Date(receipt.dateTime).toLocaleString()}
            <br />
            Customer: {receipt.customer ? receipt.customer.fullName : "Walk-in"} · Cashier: {receipt.cashier?.fullName}
          </p>
          <table className="staff-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map((i) => (
                <tr key={i.id}>
                  <td>{i.service ? i.service.name : i.product?.productName}</td>
                  <td>{i.quantity}</td>
                  <td>{money(i.unitPrice)}</td>
                  <td>{money(Number(i.unitPrice) * i.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="pos-total">Total: {money(receipt.totalAmount)}</p>
          <p>
            Paid by {receipt.paymentMethod === "CASH" ? "cash" : "card"}
            {receipt.cashReceived != null &&
              ` · Received ${money(receipt.cashReceived)} · Change ${money(receipt.cashReceived - receipt.totalAmount)}`}
          </p>
          <p>Thank you for visiting!</p>
          <div className="pos-row pos-no-print">
            <button className="staff-btn staff-btn-primary" onClick={() => window.print()}>Print Receipt</button>
            <button className="staff-btn staff-btn-secondary" onClick={() => setReceipt(null)}>New Sale</button>
          </div>
        </section>
      )}
    </div>
  );
}
