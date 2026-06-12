import React, { useState, useEffect } from 'react';
import { getAllAppointments } from '../api/appointmentApi';
import { useAuth } from '../context/AuthContext';
import './TransactionHistory.css'; // Reusing similar table styles

const AppointmentHistory = () => {
    const { userRole, branchId } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            // If Owner, pass null to get all. If Branch Manager, pass branchId.
            const targetBranchId = (userRole === 'Owner') ? null : branchId;
            const data = await getAllAppointments(targetBranchId);
            setAppointments(data);
        } catch (error) {
            console.error("Error fetching appointments:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="history-container">
            <h2>Appointment History</h2>
            {loading ? <p>Loading...</p> : (
                <table className="history-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Date & Time</th>
                            <th>Customer</th>
                            <th>Service</th>
                            <th>Status</th>
                            <th>Assigned Staff</th>
                            <th>Branch ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appointments.length > 0 ? (
                            appointments.map((appt) => (
                                <tr key={appt.appointmentId}>
                                    <td>{appt.appointmentId}</td>
                                    <td>{new Date(appt.appointmentTime).toLocaleString()}</td>
                                    <td>{appt.customer ? appt.customer.fullName : 'N/A'}</td>
                                    <td>{appt.serviceType}</td>
                                    <td>
                                        <span className={`status-badge ${appt.status ? appt.status.toLowerCase() : ''}`}>
                                            {appt.status || 'BOOKED'}
                                        </span>
                                    </td>
                                    <td>{appt.assignedStaff ? appt.assignedStaff.fullName : 'Unassigned'}</td>
                                    <td>{appt.branch ? appt.branch.id : 'N/A'}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7">No appointments found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default AppointmentHistory;
