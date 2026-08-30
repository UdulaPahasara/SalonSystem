import React, { useState, useEffect } from "react";
import { getStockRequestsByBranch, getAllStockRequests } from "../api/stockRequestApi";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/staff/PageHeader";
import { getStaffHomePath } from "../utils/staffNav";
import "../components/DashboardLayout.css";

export default function StockRequestHistory() {
  const { userRole, branchId } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = userRole === "Product Manager" || userRole === "Owner"
      ? getAllStockRequests()
      : getStockRequestsByBranch(branchId);
    load
      .then((res) => setRequests([...res.data].reverse())) // newest first
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [userRole, branchId]);

  return (
    <div className="staff-page">
      <PageHeader
        title="Stock Request History"
        subtitle="Every stock request and whether it was approved."
        backTo={getStaffHomePath(userRole)}
      />

      {loading ? (
        <p>Loading stock requests...</p>
      ) : error ? (
        <div className="staff-empty-state">
          <h3>Couldn't load stock requests</h3>
          <p>Check that the server is running and try again.</p>
        </div>
      ) : (
        <table className="staff-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Brand</th>
              <th>Qty</th>
              <th>Requested by</th>
              <th>Branch</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.requestId}>
                <td>{r.product?.productName || "—"}</td>
                <td>{r.product?.brand || "—"}</td>
                <td>{r.requestedQuantity}</td>
                <td>{r.requestedBy?.fullName || r.requestedBy?.username || "—"}</td>
                <td>{r.branch?.branchName || "—"}</td>
                <td>
                  <span className={`status-badge ${(r.status || "").toLowerCase()}`}>{r.status}</span>
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr className="empty-row"><td colSpan="6">No stock requests found.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
