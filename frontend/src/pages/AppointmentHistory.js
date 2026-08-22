import React, { useState, useEffect } from "react";
import { getAllAppointments } from "../api/appointmentApi";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/staff/PageHeader";
import { getStaffHomePath } from "../utils/staffNav";
import "../components/DashboardLayout.css";

export default function AppointmentHistory() {
  const { userRole, branchId } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Owner sees every branch; Branch Manager sees only their own.
    const targetBranchId = userRole === "Owner" ? null : branchId;
    getAllAppointments(targetBranchId)
      .then(setAppointments)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [userRole, branchId]);

  return (
    <div className="staff-page">
      <PageHeader
        title="Appointment History"
        subtitle={userRole === "Owner" ? "Bookings across all branches." : "Bookings at your branch."}
        backTo={getStaffHomePath(userRole)}
      />

      {loading ? (
        <p>Loading appointments...</p>
      ) : error ? (
        <div className="staff-empty-state">
          <h3>Couldn't load appointments</h3>
          <p>Check that the server is running and try again.</p>
        </div>
      ) : (
        <table className="staff-table">
          <thead>
            <tr>
              <th>Date &amp; time</th>
              <th>Customer</th>
              <th>Service</th>
              <th>Status</th>
              <th>Assigned staff</th>
              <th>Branch</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt) => (
              <tr key={appt.appointmentId}>
                <td>{new Date(appt.appointmentTime).toLocaleString()}</td>
                <td>{appt.customer ? appt.customer.fullName : "Walk-in"}</td>
                <td>{appt.serviceType}</td>
                <td>
                  <span className={`status-badge ${(appt.status || "BOOKED").toLowerCase()}`}>
                    {appt.status || "BOOKED"}
                  </span>
                </td>
                <td>{appt.assignedStaff ? appt.assignedStaff.fullName : "Unassigned"}</td>
                <td>{appt.branch ? appt.branch.branchName : "—"}</td>
              </tr>
            ))}
            {appointments.length === 0 && (
              <tr className="empty-row"><td colSpan="6">No appointments found.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
