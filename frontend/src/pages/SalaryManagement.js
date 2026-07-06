import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStaffSalaryStatus, paySalary, updateBaseSalary } from "../api/usersApi";
import { useToast } from "../context/ToastContext";
import "../components/DashboardLayout.css";

export default function SalaryManagement() {
  const navigate = useNavigate();
  const toast = useToast();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [newSalary, setNewSalary] = useState("");

  useEffect(() => {
    loadStaff();
  }, [month]);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const data = await getStaffSalaryStatus(month);
      setStaff(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (member) => {
    const amount = member.baseSalary || 0;
    try {
      await paySalary({
        type: member.type,
        id: member.id,
        amount,
        month,
      });
      toast.success("Salary marked as paid.");
      loadStaff();
    } catch (err) {
      toast.error("Failed to record payment.");
    }
  };

  const openSalaryEditor = (member) => {
    setEditing(member);
    setNewSalary(member.baseSalary || "");
  };

  const handleSalaryUpdate = async (e) => {
    e.preventDefault();
    const value = parseFloat(newSalary);
    if (Number.isNaN(value) || value < 0) {
      toast.error("Enter a valid salary amount (0 or more).");
      return;
    }
    try {
      await updateBaseSalary({ type: editing.type, id: editing.id, baseSalary: value });
      toast.success("Base salary updated.");
      setEditing(null);
      loadStaff();
    } catch (err) {
      toast.error("Failed to update salary.");
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="dashboard-content-header">
          <h2>Salary Management</h2>
          <button className="dashboard-btn-secondary" onClick={() => navigate("/admin-dashboard")}>
            ← Back to Dashboard
          </button>
        </div>

        <div className="dashboard-form staff-form-narrow">
          <label htmlFor="salary-month">Payment month</label>
          <input
            id="salary-month"
            type="month"
            className="dashboard-input"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Branch</th>
                <th>Base Salary</th>
                <th>Paid</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr key={`${member.type}-${member.id}`}>
                  <td>{member.name}</td>
                  <td>{member.role}</td>
                  <td>{member.branch}</td>
                  <td>{member.baseSalary ? `Rs. ${Number(member.baseSalary).toLocaleString()}` : "Not set"}</td>
                  <td>
                    <span className={`status-badge ${member.isPaid ? "paid" : "pending"}`}>
                      {member.isPaid ? "Paid" : "Unpaid"}
                    </span>
                  </td>
                  <td className="staff-row-actions">
                    {!member.isPaid && (
                      <button
                        className="dashboard-btn-primary"
                        disabled={!member.baseSalary}
                        title={member.baseSalary ? undefined : "Set a base salary first"}
                        onClick={() => handlePay(member)}
                      >
                        Pay
                      </button>
                    )}
                    <button className="dashboard-btn-edit" onClick={() => openSalaryEditor(member)}>
                      Edit Salary
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal-content" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3>Edit base salary</h3>
            <form onSubmit={handleSalaryUpdate}>
              <div className="form-group">
                <label htmlFor="base-salary">{editing.name} — monthly base salary (Rs.)</label>
                <input
                  id="base-salary"
                  type="number"
                  min="0"
                  step="0.01"
                  className="staff-input"
                  value={newSalary}
                  onChange={(e) => setNewSalary(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="staff-btn staff-btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
                <button type="submit" className="staff-btn staff-btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
