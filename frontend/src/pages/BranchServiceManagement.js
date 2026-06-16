import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getServicesByBranch, createService, deleteService } from "../api/serviceApi";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ConfirmContext";
import PageHeader from "../components/staff/PageHeader";
import { getStaffHomePath } from "../utils/staffNav";
import "../components/DashboardLayout.css";

export default function BranchServiceManagement() {
  const { branchId, userRole } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ name: "", category: "Hair Care", price: "", durationMins: "" });
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
        category: form.category,
        price: parseFloat(form.price),
        durationMins: parseInt(form.durationMins, 10),
        branch: { id: branchId },
      });
      setForm({ name: "", category: "Hair Care", price: "", durationMins: "" });
      loadServices();
    } catch (err) {
      toast.error("Failed to create service.");
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm("Delete this service?", { title: "Delete service", danger: true, confirmLabel: "Delete" });
    if (!ok) return;
    await deleteService(id);
    loadServices();
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <PageHeader title="Branch Services" backTo={getStaffHomePath(userRole)} />

        <form onSubmit={handleSubmit} className="dashboard-form" style={{ maxWidth: "400px", marginBottom: "24px" }}>
          <div className="form-group">
            <label>Category</label>
            <select
              className="dashboard-input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
            >
              <option>Hair Care</option>
              <option>Skin & Facials</option>
              <option>Nails</option>
              <option>Bridal & Occasions</option>
              <option>Spa & Wellness</option>
            </select>
          </div>
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
                <th>Category</th>
                <th>Name</th>
                <th>Price</th>
                <th>Duration</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.serviceId}>
                  <td>{s.category || "—"}</td>
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
