import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getTopProducts, getTopServices } from "../api/usersApi";
import PageHeader from "../components/staff/PageHeader";
import { getStaffHomePath } from "../utils/staffNav";
import "../components/DashboardLayout.css";

export default function ReportsPage() {
  const { branchId, userRole } = useAuth();
  const [topProducts, setTopProducts] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [loading, setLoading] = useState(false);

  const reportBranchId = userRole === "Owner" ? null : branchId;

  useEffect(() => {
    setLoading(true);
    Promise.all([getTopProducts(reportBranchId), getTopServices(reportBranchId)])
      .then(([products, services]) => {
        setTopProducts(products);
        setTopServices(services);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [reportBranchId]);

  const backPath = getStaffHomePath(userRole);

  return (
    <div className="staff-page">
      <PageHeader title="Reports & Analytics" subtitle="Top products and services by revenue." backTo={backPath} />

        {loading ? (
          <p>Loading reports...</p>
        ) : (
          <>
            <h3>Top Products</h3>
            <table className="dashboard-table" style={{ marginBottom: "24px" }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((item) => (
                  <tr key={item.name}>
                    <td>{item.name}</td>
                    <td>{item.quantitySold}</td>
                    <td>Rs. {item.totalRevenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3>Top Services</h3>
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Usage Count</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topServices.map((item) => (
                  <tr key={item.name}>
                    <td>{item.name}</td>
                    <td>{item.usageCount}</td>
                    <td>Rs. {item.totalRevenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
    </div>
  );
}
