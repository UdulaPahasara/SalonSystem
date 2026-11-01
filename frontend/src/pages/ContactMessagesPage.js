import React, { useEffect, useMemo, useState } from "react";
import { deleteContactMessage, getContactMessages } from "../api/contactApi";
import { useAuth } from "../context/AuthContext";
import { useConfirm } from "../context/ConfirmContext";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/staff/PageHeader";
import Pagination, { usePagination } from "../components/staff/Pagination";
import { getStaffHomePath } from "../utils/staffNav";
import { DEFAULT_PERIOD, inPeriod, periodKey } from "../utils/period";
import PeriodFilter from "../components/staff/PeriodFilter";
import "../components/DashboardLayout.css";
import "../styles/StaffPages.css";

export default function ContactMessagesPage() {
  const { userRole } = useAuth();
  const confirm = useConfirm();
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [period, setPeriod] = useState(DEFAULT_PERIOD);
  const [query, setQuery] = useState("");

  const load = () =>
    getContactMessages()
      .then((data) => setMessages([...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))))
      .catch(() => setError(true))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return messages.filter(
      (m) => inPeriod(m.createdAt, period) && (!q || [m.fullName, m.email, m.phone, m.message].some((v) => (v || "").toLowerCase().includes(q)))
    );
  }, [messages, period, query]);

  const { page, setPage, pageItems, total } = usePagination(rows, [periodKey(period), query].join("|"));

  const handleDelete = async (m) => {
    const ok = await confirm(`Delete the message from ${m.fullName}?`, { title: "Delete message", danger: true, confirmLabel: "Delete" });
    if (!ok) return;
    try {
      await deleteContactMessage(m.id);
      toast.success("Message deleted.");
      load();
    } catch (err) {
      toast.error("Couldn't delete the message.");
    }
  };

  return (
    <div className="staff-page">
      <PageHeader
        title="Website Messages"
        subtitle="Enquiries sent through the contact form on the public website."
        backTo={getStaffHomePath(userRole)}
      />

      <div className="staff-filter-bar">
        <input className="staff-input staff-search" type="search" placeholder="Search name, email or message" aria-label="Search messages" value={query} onChange={(e) => setQuery(e.target.value)} />
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {loading ? (
        <p>Loading messages...</p>
      ) : error ? (
        <div className="staff-empty-state">
          <h3>Couldn't load messages</h3>
          <p>Check that the server is running and try again.</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="staff-empty-state">
          <h3>No messages yet</h3>
          <p>Enquiries from the website contact form appear here.</p>
        </div>
      ) : (
        <>
          <div className="table-scroll">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>Received</th>
                  <th>From</th>
                  <th>Message</th>
                  <th className="staff-th-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((m) => (
                  <tr key={m.id}>
                    <td className="nowrap">
                      {new Date(m.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                      <span className="cell-sub">{new Date(m.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
                    </td>
                    <td>
                      <span className="staff-cell-strong">{m.fullName}</span>
                      <span className="cell-sub"><a href={`mailto:${m.email}`}>{m.email}</a></span>
                      {m.phone && <span className="cell-sub">{m.phone}</span>}
                    </td>
                    <td className="msg-cell">{m.message}</td>
                    <td className="staff-row-actions">
                      <button className="dashboard-btn-delete" onClick={() => handleDelete(m)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && <tr className="empty-row"><td colSpan="4">No messages match your filters.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={total} onPage={setPage} />
        </>
      )}
    </div>
  );
}
