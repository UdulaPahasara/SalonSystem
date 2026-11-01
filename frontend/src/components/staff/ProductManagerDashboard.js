import React, { useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { getBranches } from "../../api/branchApi";
import { getProducts, getInventoryByBranch } from "../../api/productApi";
import { getAllStockRequests } from "../../api/stockRequestApi";
import { DashboardHead, Kpis, Card, AttentionList, ActionList, DashGrid, Empty, useLoad, valueOf, LOW_STOCK_LIMIT } from "./DashboardParts";

export default function ProductManagerDashboard() {
  const { fullName } = useAuth();

  const { loading, data } = useLoad(async () => {
    const [products, requests, branches] = await Promise.allSettled([getProducts(), getAllStockRequests(), getBranches()]);
    const branchList = valueOf(branches, []);
    const stock = await Promise.allSettled(branchList.map((b) => getInventoryByBranch(b.id)));
    const lines = stock.flatMap((r, i) => (r.status === "fulfilled" ? r.value.map((l) => ({ ...l, branchName: branchList[i].branchName })) : []));
    return { products: valueOf(products, []), requests: requests.status === "fulfilled" ? requests.value.data : [], lines };
  }, []);

  const view = useMemo(() => {
    if (!data) return null;
    const low = data.lines.filter((l) => l.quantity < LOW_STOCK_LIMIT).sort((a, b) => a.quantity - b.quantity);
    return {
      low,
      out: data.lines.filter((l) => l.quantity <= 0).length,
      pending: data.requests.filter((r) => r.status === "PENDING").length,
      recent: [...data.requests].sort((a, b) => (b.requestId || 0) - (a.requestId || 0)).slice(0, 6),
    };
  }, [data]);

  const kpis = view && [
    { label: "Products", value: data.products.length, hint: "In the catalogue" },
    { label: "Low stock lines", value: view.low.length, hint: `Under ${LOW_STOCK_LIMIT} units, any branch` },
    { label: "Out of stock", value: view.out, hint: "Branch lines at zero" },
    { label: "Requests pending", value: view.pending, hint: "Awaiting branch approval" },
  ];

  return (
    <div className="dash">
      <DashboardHead name={fullName} subtitle="Catalogue and stock across every branch." />
      <Kpis items={kpis} />
      <DashGrid
        left={
          <>
            <Card title="Low stock across branches" to="/pm/inventory" linkText="Request stock →">
              {loading ? <Empty>Loading…</Empty> : view.low.length === 0 ? <Empty>Every product is stocked above the limit.</Empty> : (
                <table className="dash-table">
                  <thead><tr><th>Product</th><th>Branch</th><th className="num">Left</th></tr></thead>
                  <tbody>
                    {view.low.slice(0, 8).map((l) => (
                      <tr key={`${l.branchId}-${l.productId}`}>
                        <td>{l.productName}</td>
                        <td>{l.branchName}</td>
                        <td className="num"><span className={`status-badge ${l.quantity <= 0 ? "out" : "low"}`}>{l.quantity <= 0 ? "Out" : l.quantity}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
            <Card title="Recent stock requests" to="/stock-request-history" linkText="View history →">
              {loading ? <Empty>Loading…</Empty> : view.recent.length === 0 ? <Empty>No requests yet.</Empty> : (
                <table className="dash-table">
                  <thead><tr><th>Product</th><th>Branch</th><th className="num">Qty</th><th>Status</th></tr></thead>
                  <tbody>
                    {view.recent.map((r) => (
                      <tr key={r.requestId}>
                        <td>{r.product?.productName || "—"}</td>
                        <td>{r.branch?.branchName || "—"}</td>
                        <td className="num">{r.requestedQuantity}</td>
                        <td><span className={`status-badge ${(r.status || "").toLowerCase()}`}>{(r.status || "").charAt(0) + (r.status || "").slice(1).toLowerCase()}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </>
        }
        right={
          <>
            <Card title="Needs attention">
              <AttentionList loading={loading} items={[
                { n: view?.out, text: "branch lines out of stock", to: "/pm/inventory" },
                { n: view?.low.length, text: `branch lines low on stock (under ${LOW_STOCK_LIMIT})`, to: "/pm/inventory" },
                { n: view?.pending, text: "requests waiting for branch approval", to: "/stock-request-history" },
              ]} />
            </Card>
            <Card title="Quick actions">
              <ActionList items={[
                { label: "Add a product", hint: "Grow the catalogue", to: "/pm/products?new=1" },
                { label: "Request stock", hint: "Top up a branch", to: "/pm/inventory" },
                { label: "Stock request history", hint: "Track approvals", to: "/stock-request-history" },
              ]} />
            </Card>
          </>
        }
      />
    </div>
  );
}
