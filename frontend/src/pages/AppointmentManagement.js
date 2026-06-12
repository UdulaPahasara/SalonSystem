import React, { useState, useEffect } from "react";
import { getAllAppointments, createAppointment, updateAppointment, deleteAppointment } from "../api/appointmentApi";
import { getAllCustomers } from "../api/customerApi";
import { getServicesByBranch } from "../api/serviceApi";
import { useAuth } from "../context/AuthContext";
import "./AppointmentManagement.css";

function AppointmentManagement() {
    const { branchId } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [services, setServices] = useState([]);
    const [newAppt, setNewAppt] = useState({
        customerId: "",
        serviceType: "",
        date: "",
        time: ""
    });
    const [loading, setLoading] = useState(false);

    // Edit Mode State
    const [editingAppt, setEditingAppt] = useState(null);

    useEffect(() => {
        if (branchId) {
            loadData();
        }
    }, [branchId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [apptData, custData, serviceData] = await Promise.all([
                getAllAppointments(),
                getAllCustomers(branchId),
                getServicesByBranch(branchId) // Fetch services dynamicallly
            ]);
            setAppointments(apptData);
            setCustomers(custData);
            setServices(serviceData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Combine date and time
            const appointmentTime = `${newAppt.date}T${newAppt.time}`;

            if (editingAppt) {
                await updateAppointment(editingAppt.appointmentId, {
                    ...newAppt,
                    appointmentTime // Send combined ISO string
                });
                alert("Appointment updated!");
                setEditingAppt(null);
            } else {
                await createAppointment({
                    customerId: parseInt(newAppt.customerId),
                    serviceType: newAppt.serviceType,
                    appointmentTime, // Send combined ISO string
                    branchId, // Pass the branchId
                    applyLoyalty: newAppt.applyLoyalty
                });
                alert("Appointment booked!");
            }
            setNewAppt({ customerId: "", serviceType: "", date: "", time: "", applyLoyalty: false });
            loadData();
        } catch (error) {
            alert("Operation failed: " + (error.response?.data || error.message));
        }
    };

    const handleEdit = (appt) => {
        setEditingAppt(appt);
        // Split ISO string back to date and time
        const dt = new Date(appt.appointmentTime);
        // Format to YYYY-MM-DD
        const dateStr = dt.toISOString().split('T')[0];
        // Format to HH:mm
        // Note: toTimeString depends on local time zone, ensure consistency or use split/UTC if prefer
        // Since we stored it as ISO (UTC usually) but display in local, let's keep it simple:
        const timeStr = dt.toTimeString().slice(0, 5); // HH:mm:ss -> HH:mm

        setNewAppt({
            customerId: appt.customer.customerId,
            serviceType: appt.serviceType,
            date: dateStr,
            time: timeStr,
            applyLoyalty: appt.applyLoyalty || false
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Cancel this appointment?")) return;
        try {
            await deleteAppointment(id);
            alert("Appointment cancelled.");
            loadData();
        } catch (error) {
            alert("Failed to cancel: " + (error.response?.data || error.message));
        }
    };

    return (
        <div className="appt-container">
            <h2>Appointment Management</h2>

            <div className="appt-content">
                <div className="appt-form-card">
                    <h3>{editingAppt ? "Reschedule Appointment" : "Book New Appointment"}</h3>
                    <form onSubmit={handleSubmit}>
                        <label>Customer</label>
                        <select
                            value={newAppt.customerId}
                            onChange={e => setNewAppt({ ...newAppt, customerId: e.target.value })}
                            required
                            disabled={!!editingAppt} // Disable customer change on edit for simplicity
                        >
                            <option value="">Select Customer</option>
                            {customers.map(c => (
                                <option key={c.customerId} value={c.customerId}>
                                    {c.fullName} ({c.phone}) - Loyalty: {c.loyaltyPoints} pts
                                </option>
                            ))}
                        </select>

                        <label>Service Type</label>
                        <select
                            value={newAppt.serviceType}
                            onChange={e => setNewAppt({ ...newAppt, serviceType: e.target.value })}
                            required
                        >
                            <option value="">Select Service</option>
                            {services.length > 0 ? (
                                services.map(s => (
                                    <option key={s.serviceId} value={s.name}>
                                        {s.name} (Rs. {s.price} - {s.durationMins}m)
                                    </option>
                                ))
                            ) : (
                                <option disabled>No services available for this branch</option>
                            )}
                        </select>

                        <label>Date</label>
                        <input
                            type="date"
                            value={newAppt.date}
                            onChange={e => setNewAppt({ ...newAppt, date: e.target.value })}
                            required
                        />

                        <label>Time</label>
                        <input
                            type="time"
                            value={newAppt.time}
                            onChange={e => setNewAppt({ ...newAppt, time: e.target.value })}
                            required
                        />

                        <div className="form-group-checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={newAppt.applyLoyalty || false}
                                    onChange={e => setNewAppt({ ...newAppt, applyLoyalty: e.target.checked })}
                                />
                                Apply Loyalty / Add Points?
                            </label>
                        </div>

                        <button type="submit" className="book-btn">
                            {editingAppt ? "Update Appointment" : "Book Appointment"}
                        </button>
                        {editingAppt && (
                            <button type="button" onClick={() => { setEditingAppt(null); setNewAppt({ customerId: "", serviceType: "", date: "", time: "", applyLoyalty: false }); }} style={{ marginLeft: '10px' }}>
                                Cancel
                            </button>
                        )}
                    </form>
                </div>

                <div className="appt-list-card">
                    <h3>Scheduled Appointments</h3>
                    {loading ? <p>Loading...</p> : (
                        <table className="appt-table">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Customer</th>
                                    <th>Service</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.map(a => (
                                    <tr key={a.appointmentId}>
                                        <td>{new Date(a.appointmentTime).toLocaleString()}</td>
                                        <td>{a.customer.fullName}</td>
                                        <td>{a.serviceType}</td>
                                        <td>
                                            <span className={`status-badge ${a.status.toLowerCase()}`}>{a.status}</span>
                                        </td>
                                        <td>
                                            <button onClick={() => handleEdit(a)} className="action-btn edit">Edit</button>
                                            <button onClick={() => handleDelete(a.appointmentId)} className="action-btn delete">Cancel</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AppointmentManagement;
