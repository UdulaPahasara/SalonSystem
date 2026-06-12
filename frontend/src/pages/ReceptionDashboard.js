import React from "react";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useNavigate } from "react-router-dom";
import "./adminDashBoard.css"; // Reuse Admin dashboard styles

export default function ReceptionDashboard() {
    const navigate = useNavigate();

    const cards = [
        {
            title: "Manage Appointments",
            desc: "Book, View, and Cancel Appointments.",
            onClick: () => navigate("/reception/appointments"),
        },
        {
            title: "Manage Customers",
            desc: "Add, Edit, and Delete Customers.",
            onClick: () => navigate("/reception/customers"),
        },
    ];

    return (
        <div className="admin-dashboard-container">
            <h1 className="admin-dashboard-title">Reception Dashboard</h1>

            <div className="dashboard-card-grid">
                {cards.map((card, i) => (
                    <Card
                        key={i}
                        className="dashboard-card"
                        onClick={card.onClick}
                    >
                        <CardContent>
                            <h2 className="dashboard-card-title">{card.title}</h2>
                            <p className="dashboard-card-desc">{card.desc}</p>
                            <Button className="dashboard-open-btn">Open</Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
