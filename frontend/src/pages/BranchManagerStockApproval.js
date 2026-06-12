import React, { useEffect, useState } from "react";
import {
  getStockRequestsByBranch,
  approveStockRequest,
  rejectStockRequest
} from "../api/stockRequestApi";
import { useAuth } from "../context/AuthContext";  // Import AuthContext

export default function BranchManagerStockApproval() {
  
  /* -------------------- AUTH CONTEXT -------------------- */
  const { user, branchId, userRole } = useAuth();

  /* -------------------- STATE -------------------- */
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* -------------------- LOAD STOCK REQUESTS -------------------- */

  useEffect(() => {
    if (branchId) {
      loadRequests();
    } else if (!loading) {
      setError("No branch assigned to your account");
    }
  }, [branchId]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Loading stock requests for branchId:", branchId);
      const res = await getStockRequestsByBranch(branchId);
      setRequests(res.data);
      console.log("Loaded stock requests:", res.data.length);
    } catch (error) {
      console.error("Error loading stock requests:", error);
      setError("Failed to load stock requests");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- APPROVE/REJECT -------------------- */

  const approve = async (id) => {
    if (window.confirm("Approve this stock request?")) {
      try {
        await approveStockRequest(id);
        alert("Stock request approved!");
        loadRequests();
      } catch (error) {
        console.error("Error approving request:", error);
        alert("Failed to approve stock request");
      }
    }
  };

  const reject = async (id) => {
    if (window.confirm("Reject this stock request?")) {
      try {
        await rejectStockRequest(id);
        alert("Stock request rejected!");
        loadRequests();
      } catch (error) {
        console.error("Error rejecting request:", error);
        alert("Failed to reject stock request");
      }
    }
  };

  /* -------------------- STATUS BADGE -------------------- */

  const getStatusBadge = (status) => {
    const colors = {
      PENDING: '#FFA500',
      APPROVED: '#28A745',
      REJECTED: '#DC3545'
    };

    return (
      <span style={{
        backgroundColor: colors[status] || '#6C757D',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        {status}
      </span>
    );
  };

  /* -------------------- UI -------------------- */

  if (loading) {
    return <div className="admin-dashboard-container" style={{ padding: 20 }}>Loading stock requests...</div>;
  }

  if (error || !branchId) {
    return (
      <div className="admin-dashboard-container" style={{ padding: 20 }}>
        <h1 className="admin-dashboard-title">Stock Requests Approval</h1>
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: 15, 
          borderRadius: 5,
          marginTop: 20
        }}>
          <strong>Error:</strong> {error || "No branch assigned to your account. Please contact administrator."}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container" style={{ padding: 20 }}>
      <h1 className="admin-dashboard-title">Stock Requests Approval</h1>
      
      {/* User info banner */}
      <div style={{ 
        backgroundColor: '#f0f0f0', 
        padding: '10px', 
        marginBottom: '20px',
        borderRadius: '5px'
      }}>
        <p style={{ margin: 0 }}>
          <strong>Logged in as:</strong> {user?.fullName || user?.username} 
          <span style={{ marginLeft: '10px', color: '#666' }}>({userRole})</span>
        </p>
        <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
          📋 Managing stock requests for your branch only
        </p>
      </div>

      {requests.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: 40, 
          backgroundColor: '#f8f9fa',
          borderRadius: 5,
          color: '#666'
        }}>
          <p style={{ fontSize: 18 }}>No stock requests found for your branch</p>
        </div>
      ) : (
        <table className="adminusers-table" border="1" width="100%" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ padding: 10 }}>ID</th>
              <th style={{ padding: 10 }}>Product</th>
              <th style={{ padding: 10 }}>Brand</th>
              <th style={{ padding: 10 }}>Requested Qty</th>
              <th style={{ padding: 10 }}>Requested By</th>
              <th style={{ padding: 10 }}>Status</th>
              <th style={{ padding: 10 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.requestId}>
                <td style={{ padding: 10 }}>{r.requestId}</td>
                <td style={{ padding: 10 }}>{r.product?.productName || 'N/A'}</td>
                <td style={{ padding: 10 }}>{r.product?.brand || 'N/A'}</td>
                <td style={{ padding: 10 }}>{r.requestedQuantity}</td>
                <td style={{ padding: 10 }}>{r.requestedBy?.fullName || r.requestedBy?.username || 'N/A'}</td>
                <td style={{ padding: 10, textAlign: 'center' }}>{getStatusBadge(r.status)}</td>
                <td style={{ padding: 10 }}>
                  {r.status === 'PENDING' ? (
                    <>
                      <button 
                        onClick={() => approve(r.requestId)}
                        style={{
                          backgroundColor: '#28A745',
                          color: 'white',
                          padding: '5px 15px',
                          border: 'none',
                          borderRadius: 3,
                          cursor: 'pointer',
                          marginRight: 5
                        }}
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => reject(r.requestId)}
                        style={{
                          backgroundColor: '#DC3545',
                          color: 'white',
                          padding: '5px 15px',
                          border: 'none',
                          borderRadius: 3,
                          cursor: 'pointer'
                        }}
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <span style={{ color: '#666' }}>No action needed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}