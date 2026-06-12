import React, { useState, useEffect } from 'react';
import { getStockRequestsByBranch, getAllStockRequests } from '../api/stockRequestApi';
import { useAuth } from '../context/AuthContext';
import './TransactionHistory.css'; // Reusing similar table styles

const StockRequestHistory = () => {
    const { userRole, branchId } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            let res;
            if (userRole === 'Product Manager' || userRole === 'Owner') {
                res = await getAllStockRequests();
            } else {
                res = await getStockRequestsByBranch(branchId);
            }
            setRequests(res.data.reverse()); // Newest first
        } catch (error) {
            console.error("Error fetching stock requests:", error);
        } finally {
            setLoading(false);
        }
    };

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

    return (
        <div className="history-container">
            <h2>Stock Request History</h2>
            {loading ? <p>Loading...</p> : (
                <table className="history-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Product</th>
                            <th>Brand</th>
                            <th>Qty</th>
                            <th>Requested By</th>
                            <th>Branch</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.length > 0 ? (
                            requests.map((r) => (
                                <tr key={r.requestId}>
                                    <td>{r.requestId}</td>
                                    <td>{r.product?.productName || 'N/A'}</td>
                                    <td>{r.product?.brand || 'N/A'}</td>
                                    <td>{r.requestedQuantity}</td>
                                    <td>{r.requestedBy?.fullName || r.requestedBy?.username || 'N/A'}</td>
                                    <td>{r.branch?.branchName || 'N/A'}</td>
                                    <td>{getStatusBadge(r.status)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7">No stock requests found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default StockRequestHistory;
