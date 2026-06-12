import React, { useState, useEffect } from "react";
import { getAllCustomers, createCustomer, updateCustomer, deleteCustomer } from "../api/customerApi";
import { useAuth } from "../context/AuthContext";
import "./CustomerManagement.css";

function CustomerManagement() {
    const { branchId } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [newCustomer, setNewCustomer] = useState({ fullName: "", phone: "", email: "" });
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingCustomer, setEditingCustomer] = useState(null); // For edit mode

    useEffect(() => {
        loadCustomers();
    }, [branchId]);

    const loadCustomers = () => {
        setLoading(true);
        getAllCustomers(branchId)
            .then(data => setCustomers(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Phone Validation
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(newCustomer.phone)) {
            alert("Please enter a valid 10-digit phone number.");
            return;
        }

        try {
            if (editingCustomer) {
                await updateCustomer(editingCustomer.customerId, newCustomer);
                alert("Customer updated successfully!");
                setEditingCustomer(null);
            } else {
                await createCustomer({ ...newCustomer, branchId });
                alert("Customer added successfully!");
            }
            setNewCustomer({ fullName: "", phone: "", email: "" });
            loadCustomers();
        } catch (error) {
            alert("Operation failed: " + (error.response?.data || error.message));
        }
    };

    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        setNewCustomer({
            fullName: customer.fullName,
            phone: customer.phone,
            email: customer.email,
            loyaltyMember: customer.loyaltyMember
        });
    };

    const handleCancelEdit = () => {
        setEditingCustomer(null);
        setNewCustomer({ fullName: "", phone: "", email: "" });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this customer?")) return;
        try {
            await deleteCustomer(id);
            alert("Customer deleted.");
            loadCustomers();
        } catch (error) {
            alert("Failed to delete: " + (error.response?.data || error.message));
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    return (
        <div className="customer-mgmt-container">
            <h2>Customer Management</h2>

            <div className="customer-forms">
                <div className="add-customer-card">
                    <h3>{editingCustomer ? "Edit Customer" : "Add New Customer"}</h3>
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={newCustomer.fullName}
                            onChange={e => setNewCustomer({ ...newCustomer, fullName: e.target.value })}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Phone Number"
                            value={newCustomer.phone}
                            onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                            required
                        />
                        <input
                            type="email"
                            placeholder="Email (Optional)"
                            value={newCustomer.email}
                            onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                        />

                        <div className="form-group-checkbox" style={{ marginBottom: '10px' }}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={newCustomer.loyaltyMember || false}
                                    onChange={e => setNewCustomer({ ...newCustomer, loyaltyMember: e.target.checked })}
                                />
                                Loyalty Member
                            </label>
                        </div>

                        <button type="submit" className={editingCustomer ? "edit-btn" : "add-btn"}>
                            {editingCustomer ? "Update Customer" : "Add Customer"}
                        </button>
                        {editingCustomer && (
                            <button type="button" onClick={handleCancelEdit} style={{ marginTop: '10px', backgroundColor: '#6c757d' }}>
                                Cancel
                            </button>
                        )}
                    </form>
                </div>

                <div className="customer-list-card">
                    <h3>Customer List</h3>
                    <input
                        type="text"
                        placeholder="Search by name or phone..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="search-bar"
                    />

                    {loading ? <p>Loading...</p> : (
                        <table className="customer-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>Loyalty Member</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.map(c => (
                                    <tr key={c.customerId}>
                                        <td>{c.fullName}</td>
                                        <td>{c.phone}</td>
                                        <td>{c.loyaltyMember ? "Yes" : "No"}</td>
                                        <td>
                                            <button onClick={() => handleEdit(c)} className="action-btn edit">Edit</button>
                                            <button onClick={() => handleDelete(c.customerId)} className="action-btn delete">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div >
        </div >
    );
}

export default CustomerManagement;
