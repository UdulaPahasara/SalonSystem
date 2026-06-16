import React, { useEffect, useState } from "react";
import { deleteContactMessage, getContactMessages } from "../api/contactApi";
import { useConfirm } from "../context/ConfirmContext";
import PageHeader from "../components/staff/PageHeader";
import "../components/DashboardLayout.css";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default function ContactMessagesPage() {
  const confirm = useConfirm();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const data = await getContactMessages();
      setMessages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleDelete = async (id) => {
    const ok = await confirm("Delete this message?", { title: "Delete message", danger: true, confirmLabel: "Delete" });
    if (!ok) return;
    await deleteContactMessage(id);
    loadMessages();
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <PageHeader title="Website Contact Messages" backTo="/reception-dashboard" />

        {loading ? (
          <p>Loading messages...</p>
        ) : messages.length === 0 ? (
          <p>No contact messages yet.</p>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Message</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((msg) => (
                <tr key={msg.id}>
                  <td>{formatDate(msg.createdAt)}</td>
                  <td>{msg.fullName}</td>
                  <td>{msg.email}</td>
                  <td>{msg.phone || "—"}</td>
                  <td style={{ maxWidth: "320px", whiteSpace: "pre-wrap" }}>{msg.message}</td>
                  <td>
                    <button className="dashboard-btn-delete" onClick={() => handleDelete(msg.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
