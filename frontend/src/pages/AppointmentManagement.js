import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { getAllAppointments, createAppointment, updateAppointment, setAppointmentStatus } from "../api/appointmentApi";
import { getServiceStaff } from "../api/staffApi";
import { getAllCustomers } from "../api/customerApi";
import { getServicesByBranch } from "../api/serviceApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ConfirmContext";
import PageHeader from "../components/staff/PageHeader";
import Pagination, { usePagination } from "../components/staff/Pagination";
import { getStaffHomePath } from "../utils/staffNav";
import { DEFAULT_PERIOD, PERIOD_OPTIONS, inPeriod, periodKey } from "../utils/period";
import PeriodFilter from "../components/staff/PeriodFilter";
import "../components/DashboardLayout.css";
import "../styles/Dashboard.css";
import "../styles/StaffPages.css";

const STATUSES = ["All", "Booked", "Completed", "Cancelled"];
const APPT_PERIODS = [{ id: "upcoming", label: "Upcoming" }, ...PERIOD_OPTIONS];
const EMPTY = { customerId: "", serviceType: "", staffId: "", date: "", time: "", applyLoyalty: false };

const pad = (n) => String(n).padStart(2, "0");
const localDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const statusOf = (a) => (a.status || "BOOKED").toUpperCase();

function AppointmentManagement() {
  const { branchId, userRole } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("All");
  const [period, setPeriod] = useState({ ...DEFAULT_PERIOD, period: "upcoming" });
  const [query, setQuery] = useState("");

  const loadData = async () => {
    try {
      const [apptData, custData, serviceData, staffData] = await Promise.all([
        getAllAppointments(branchId), // only this branch's bookings
        getAllCustomers(branchId),
        getServicesByBranch(branchId),
        getServiceStaff(branchId).catch(() => []),
      ]);
      setStaff(staffData);
      setAppointments(apptData);
      setCustomers(custData);
      setServices(serviceData);
    } catch (err) {
      toast.error("Couldn't load appointments. Check that the server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (branchId) loadData();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = appointments.filter((a) => {
      if (!inPeriod(a.appointmentTime, period)) return false;
      if (status !== "All" && statusOf(a) !== status.toUpperCase()) return false;
      return !q || [a.customer?.fullName, a.serviceType, a.assignedStaff?.fullName].some((v) => (v || "").toLowerCase().includes(q));
    });
    // upcoming reads soonest-first; everything else newest-first
    return list.sort((a, b) => (period.period === "upcoming" ? 1 : -1) * (new Date(a.appointmentTime) - new Date(b.appointmentTime)));
  }, [appointments, status, period, query]);

  const { page, setPage, pageItems, total } = usePagination(rows, [status, periodKey(period), query].join("|"));

  const today = new Date().toDateString();
  const kpis = [
    { label: "Today", value: appointments.filter((a) => new Date(a.appointmentTime).toDateString() === today && statusOf(a) !== "CANCELLED").length, hint: "Appointments today" },
    { label: "Upcoming", value: appointments.filter((a) => statusOf(a) === "BOOKED" && new Date(a.appointmentTime) >= new Date()).length, hint: "Booked, still to come" },
    { label: "Completed", value: appointments.filter((a) => statusOf(a) === "COMPLETED").length, hint: "Finished visits" },
    { label: "Cancelled", value: appointments.filter((a) => statusOf(a) === "CANCELLED").length, hint: "Cancelled bookings" },
  ];

  const openDialog = (appt = null) => {
    if (appt) {
      const dt = new Date(appt.appointmentTime);
      setEditing(appt);
      setForm({
        customerId: appt.customer ? appt.customer.customerId : "",
        serviceType: appt.serviceType,
        staffId: appt.assignedStaff ? appt.assignedStaff.id : "",
        date: localDate(dt),
        time: `${pad(dt.getHours())}:${pad(dt.getMinutes())}`,
        applyLoyalty: appt.applyLoyalty || false,
      });
    } else {
      setEditing(null);
      setForm({ ...EMPTY, date: localDate(new Date()) });
    }
    setDialogOpen(true);
  };

  // Dashboard "Book appointment" opens the dialog straight away (?new=1)
  useEffect(() => {
    if (searchParams.get("new")) {
      openDialog();
      const customer = searchParams.get("customer"); // "Book" button on the Customers page
      if (customer) setForm((f) => ({ ...f, customerId: customer }));
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const appointmentTime = `${form.date}T${form.time}`;
    setSaving(true);
    try {
      if (editing) {
        await updateAppointment(editing.appointmentId, {
          serviceType: form.serviceType,
          applyLoyalty: form.applyLoyalty,
          appointmentTime,
          ...(form.staffId ? { assignedStaff: { id: parseInt(form.staffId, 10) } } : {}),
        });
        toast.success("Appointment updated.");
      } else {
        await createAppointment({
          customerId: parseInt(form.customerId, 10),
          serviceType: form.serviceType,
          appointmentTime,
          branchId,
          applyLoyalty: form.applyLoyalty,
          ...(form.staffId ? { staffId: parseInt(form.staffId, 10) } : {}),
        });
        toast.success("Appointment booked.");
      }
      closeDialog();
      loadData();
    } catch (error) {
      toast.error("Couldn't save the appointment: " + (error.response?.data || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (a) => {
    const ok = await confirm(`Cancel ${a.customer ? a.customer.fullName + "'s" : "this"} ${a.serviceType} appointment? It will stay in the history as cancelled.`, {
      title: "Cancel appointment",
      danger: true,
      confirmLabel: "Cancel appointment",
    });
    if (!ok) return;
    try {
      await setAppointmentStatus(a.appointmentId, "CANCELLED"); // the booking stays in history
      toast.success("Appointment cancelled.");
      loadData();
    } catch (error) {
      toast.error(typeof error.response?.data === "string" ? error.response.data : "Couldn't cancel the appointment.");
    }
  };

  const handleComplete = async (a) => {
    try {
      await setAppointmentStatus(a.appointmentId, "COMPLETED");
      toast.success("Marked as completed.");
      loadData();
    } catch (error) {
      toast.error(typeof error.response?.data === "string" ? error.response.data : "Couldn't update the appointment.");
    }
  };

  return (
    <div className="staff-page">
      <PageHeader
        title="Appointments"
        subtitle="Book, reschedule and cancel appointments for your branch."
        backTo={getStaffHomePath(userRole)}
        actions={
          <button className="staff-btn staff-btn-primary" onClick={() => openDialog()}>
            + Book Appointment
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
        <PeriodFilter value={period} onChange={setPeriod} options={APPT_PERIODS} />
      </div>

      {loading ? (
        <p>Loading appointments...</p>
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
                  <th>Status</th>
                  <th className="staff-th-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((a) => {
                  const st = statusOf(a);
                  return (
                    <tr key={a.appointmentId}>
                      <td>
                        {new Date(a.appointmentTime).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                        <span className="cell-sub">{new Date(a.appointmentTime).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
                      </td>
                      <td className="staff-cell-strong">{a.customer ? a.customer.fullName : <span className="staff-cell-muted">Walk-in</span>}</td>
                      <td>{a.serviceType}</td>
                      <td>{a.assignedStaff ? a.assignedStaff.fullName : <span className="staff-cell-muted">Unassigned</span>}</td>
                      <td><span className={`status-badge ${st.toLowerCase()}`}>{st.charAt(0) + st.slice(1).toLowerCase()}</span></td>
                      <td className="staff-row-actions">
                        {st === "BOOKED" && (
                          <>
                            <button className="dashboard-btn-primary" onClick={() => handleComplete(a)}>Complete</button>
                            <button className="dashboard-btn-edit" onClick={() => openDialog(a)}>Reschedule</button>
                            <button className="dashboard-btn-delete" onClick={() => handleCancel(a)}>Cancel</button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr className="empty-row">
                    <td colSpan="6">{appointments.length === 0 ? "No appointments yet. Book the first one." : "No appointments match your filters."}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={total} onPage={setPage} />
        </>
      )}

      {dialogOpen && (
        <div className="modal-overlay" onClick={closeDialog}>
          <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="appt-dialog-title" onClick={(e) => e.stopPropagation()}>
            <h3 id="appt-dialog-title">{editing ? "Reschedule appointment" : "Book appointment"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="appt-customer">Customer</label>
                <select id="appt-customer" className="staff-input" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} required disabled={!!editing}>
                  <option value="">Select customer</option>
                  {customers.map((c) => (
                    <option key={c.customerId} value={c.customerId}>{c.fullName} {c.phone ? `(${c.phone})` : ""}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="appt-service">Service</label>
                <select id="appt-service" className="staff-input" value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })} required>
                  <option value="">Select service</option>
                  {services.map((s) => (
                    <option key={s.serviceId} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="appt-staff">Stylist (optional)</label>
                <select id="appt-staff" className="staff-input" value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })}>
                  <option value="">Assign later</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>{s.fullName} · {s.role}</option>
                  ))}
                </select>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="appt-date">Date</label>
                  <input id="appt-date" type="date" className="staff-input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label htmlFor="appt-time">Time</label>
                  <input id="appt-time" type="time" className="staff-input" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
                </div>
              </div>
              <label className="form-check">
                <input type="checkbox" checked={form.applyLoyalty} onChange={(e) => setForm({ ...form, applyLoyalty: e.target.checked })} />
                Apply loyalty / add points
              </label>
              <div className="modal-actions">
                <button type="button" className="staff-btn staff-btn-secondary" onClick={closeDialog}>Close</button>
                <button type="submit" className="staff-btn staff-btn-primary" disabled={saving}>
                  {saving ? "Saving…" : editing ? "Save changes" : "Book appointment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppointmentManagement;
