import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getServicesByBranch, createService, deleteService } from "../api/serviceApi";
import "../components/DashboardLayout.css";

export default function BranchServiceManagement() {
  const navigate = useNavigate();
  const { branchId } = useAuth();
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ name: "", price: "", durationMins: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (branchId) loadServices();
  }, [branchId]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await getServicesByBranch(branchId);
      setServices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createService({
        name: form.name,
        price: parseFloat(form.price),
        durationMins: parseInt(form.durationMins, 10),
        branch: { id: branchId },
      });
      setForm({ name: "", price: "", durationMins: "" });
      loadServices();
    } catch (err) {
      alert("Failed to create service.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this service?")) return;
    await deleteService(id);
    loadServices();
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="dashboard-content-header">
          <h2>Branch Services</h2>
          <button className="dashboard-btn-secondary" onClick={() => navigate("/branch-dashboard")}>
            ← Back to Branch Dashboard
          </button>
        </div>

        <form onSubmit={handleSubmit} className="dashboard-form" style={{ maxWidth: "400px", marginBottom: "24px" }}>
          <div className="form-group">
            <label>Service Name</label>
            <input
              className="dashboard-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Price</label>
            <input
              type="number"
              className="dashboard-input"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Duration (mins)</label>
            <input
              type="number"
              className="dashboard-input"
              value={form.durationMins}
              onChange={(e) => setForm({ ...form, durationMins: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="dashboard-btn-primary">Add Service</button>
        </form>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Duration</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.serviceId}>
                  <td>{s.name}</td>
                  <td>Rs. {s.price}</td>
                  <td>{s.durationMins} mins</td>
                  <td>
                    <button className="dashboard-btn-delete" onClick={() => handleDelete(s.serviceId)}>
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
