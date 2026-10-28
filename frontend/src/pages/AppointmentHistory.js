import React, { useEffect, useMemo, useState } from "react";
import { getAllAppointments } from "../api/appointmentApi";
import { getBranches } from "../api/branchApi";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/staff/PageHeader";
import { getStaffHomePath } from "../utils/staffNav";
import { PERIODS, inPeriod, downloadCsv } from "../utils/format";
import "../components/DashboardLayout.css";
import "../styles/Dashboard.css";
import "../styles/StaffPages.css";

const STATUSES = ["All", "Booked", "Completed", "Cancelled"];
const PAGE = 25;

export default function AppointmentHistory() {
  const { userRole, branchId: ownBranchId } = useAuth();
  const isOwner = userRole === "Owner";
  const [appointments, setAppointments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [status, setStatus] = useState("All");
  const [period, setPeriod] = useState("all");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOwner) getBranches().then(setBranches).catch(() => {});
  }, [isOwner]);

  useEffect(() => {
    setLoading(true);
    setError(false);
    // Owner can pick a branch; Branch Manager is limited to their own.
    const target = isOwner ? branchId || null : ownBranchId;
    getAllAppointments(target)
      .then((data) => setAppointments([...data].sort((a, b) => new Date(b.appointmentTime) - new Date(a.appointmentTime))))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [isOwner, branchId, ownBranchId]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return appointments.filter((a) => {
      if (!inPeriod(a.appointmentTime, period)) return false;
      if (status !== "All" && (a.status || "BOOKED").toUpperCase() !== status.toUpperCase()) return false;
      return (
        !q ||
        [a.customer?.fullName, a.serviceType, a.assignedStaff?.fullName].some((v) => (v || "").toLowerCase().includes(q))
      );
    });
  }, [appointments, period, status, query]);

  useEffect(() => setShown(PAGE), [period, status, query, branchId]);

  const count = (s) => appointments.filter((a) => (a.status || "BOOKED").toUpperCase() === s).length;
  const kpis = [
    { label: "Total bookings", value: appointments.length, hint: "All time" },
    { label: "Booked", value: count("BOOKED"), hint: "Scheduled appointments" },
    { label: "Completed", value: count("COMPLETED"), hint: "Finished visits" },
    { label: "Cancelled", value: count("CANCELLED"), hint: "Cancelled bookings" },
  ];

  const exportCsv = () =>
    downloadCsv(
      `appointments-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Date & time", "Customer", "Service", "Staff", "Branch", "Status"],
      rows.map((a) => [new Date(a.appointmentTime).toLocaleString(), a.customer?.fullName || "Walk-in", a.serviceType, a.assignedStaff?.fullName || "Unassigned", a.branch?.branchName, a.status || "BOOKED"])
    );

  return (
    <div className="staff-page">
      <PageHeader
        title="Appointment History"
        subtitle={isOwner ? "Bookings across all branches." : "Bookings at your branch."}
        backTo={getStaffHomePath(userRole)}
        actions={
          <button className="staff-btn staff-btn-secondary" onClick={exportCsv} disabled={rows.length === 0}>
            Export CSV
          </button>
        }
      />

      <section className="dash-kpis staff-kpis" aria-label="Appointment summary">
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
          <div className="staff-chips" role="group" aria-label="Filter by status">
            {STATUSES.map((s) => (
              <button key={s} type="button" className={`staff-chip${status === s ? " active" : ""}`} aria-pressed={status === s} onClick={() => setStatus(s)}>
                {s}
              </button>
            ))}
          </div>
          <input className="staff-input staff-search" type="search" placeholder="Search customer, service or staff" aria-label="Search appointments" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="staff-filter-group">
          <select className="staff-input" aria-label="Period" value={period} onChange={(e) => setPeriod(e.target.value)}>
            {PERIODS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          {isOwner && (
            <select className="staff-input" aria-label="Branch" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.branchName}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {loading ? (
        <p>Loading appointments...</p>
      ) : error ? (
        <div className="staff-empty-state">
          <h3>Couldn't load appointments</h3>
          <p>Check that the server is running and try again.</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="staff-empty-state">
          <h3>No appointments yet</h3>
          <p>Bookings made by reception appear here.</p>
        </div>
      ) : (
        <>
          <div className="table-scroll">
            <table className="staff-table nowrap-table">
              <thead>
                <tr>
                  <th>Date &amp; time</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Staff</th>
                  {isOwner && <th>Branch</th>}
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, shown).map((a) => {
                  const st = (a.status || "BOOKED").toUpperCase();
                  return (
                    <tr key={a.appointmentId}>
                      <td>
                        {new Date(a.appointmentTime).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                        <span className="cell-sub">{new Date(a.appointmentTime).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
                      </td>
                      <td className="staff-cell-strong">{a.customer ? a.customer.fullName : <span className="staff-cell-muted">Walk-in</span>}</td>
                      <td>{a.serviceType}</td>
                      <td>{a.assignedStaff ? a.assignedStaff.fullName : <span className="staff-cell-muted">Unassigned</span>}</td>
                      {isOwner && <td>{a.branch ? a.branch.branchName : "—"}</td>}
                      <td><span className={`status-badge ${st.toLowerCase()}`}>{st.charAt(0) + st.slice(1).toLowerCase()}</span></td>
                    </tr>
                  );
                })}
                {rows.length === 0 && <tr className="empty-row"><td colSpan={isOwner ? 6 : 5}>No appointments match your filters.</td></tr>}
              </tbody>
            </table>
          </div>
          {rows.length > shown && (
            <p className="table-more">
              Showing {shown} of {rows.length}.{" "}
              <button className="link-btn" onClick={() => setShown(shown + PAGE)}>Show more</button>
            </p>
          )}
        </>
      )}
    </div>
  );
}
