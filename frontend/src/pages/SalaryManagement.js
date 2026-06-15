import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStaffSalaryStatus, paySalary, updateBaseSalary } from "../api/usersApi";
import "../components/DashboardLayout.css";

export default function SalaryManagement() {
  const navigate = useNavigate();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);

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
      alert("Salary marked as paid.");
      loadStaff();
    } catch (err) {
      alert("Failed to record payment.");
    }
  };

  const handleSalaryUpdate = async (member) => {
    const newSalary = window.prompt("Enter new base salary:", member.baseSalary || 0);
    if (newSalary === null) return;
    try {
      await updateBaseSalary({
        type: member.type,
        id: member.id,
        baseSalary: parseFloat(newSalary),
      });
      loadStaff();
    } catch (err) {
      alert("Failed to update salary.");
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

        <div className="dashboard-form" style={{ maxWidth: "300px", marginBottom: "20px" }}>
          <label>Payment Month</label>
          <input
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
                  <td>Rs. {member.baseSalary || 0}</td>
                  <td>{member.isPaid ? "Yes" : "No"}</td>
                  <td>
                    {!member.isPaid && (
                      <button className="dashboard-btn-primary" onClick={() => handlePay(member)}>
                        Pay
                      </button>
                    )}
                    <button
                      className="dashboard-btn-edit"
                      style={{ marginLeft: 8 }}
                      onClick={() => handleSalaryUpdate(member)}
                    >
                      Edit Salary
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
