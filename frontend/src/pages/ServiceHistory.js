import React, { useEffect, useState } from "react";
import { getAllAppointments } from "../api/appointmentApi";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/staff/PageHeader";
import { getStaffHomePath } from "../utils/staffNav";
import "../components/DashboardLayout.css";

export default function ServiceHistory() {
  const { userRole, branchId } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const targetBranchId = userRole === "Owner" ? null : branchId;
    getAllAppointments(targetBranchId)
      .then((data) =>
        setServices(
          data
            .filter((a) => ["COMPLETED", "PAID"].includes((a.status || "").toUpperCase()))
            .sort((a, b) => new Date(b.appointmentTime) - new Date(a.appointmentTime))
        )
      )
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [userRole, branchId]);

  return (
    <div className="staff-page">
      <PageHeader
        title="Service History"
        subtitle="Services that have been completed, newest first."
        backTo={getStaffHomePath(userRole)}
      />

      {loading ? (
        <p>Loading services...</p>
      ) : error ? (
        <div className="staff-empty-state">
          <h3>Couldn't load service history</h3>
          <p>Check that the server is running and try again.</p>
        </div>
      ) : (
        <table className="staff-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Service</th>
              <th>Customer</th>
              <th>Staff</th>
              <th>Branch</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.appointmentId}>
                <td>{new Date(s.appointmentTime).toLocaleString()}</td>
                <td>{s.serviceType}</td>
                <td>{s.customer ? s.customer.fullName : "Walk-in"}</td>
                <td>{s.assignedStaff ? s.assignedStaff.fullName : "—"}</td>
                <td>{s.branch ? s.branch.branchName : "—"}</td>
              </tr>
            ))}
            {services.length === 0 && (
              <tr className="empty-row"><td colSpan="5">No completed services yet.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
