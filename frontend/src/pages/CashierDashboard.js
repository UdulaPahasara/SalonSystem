import React from "react";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useNavigate } from "react-router-dom";
import "./adminDashBoard.css";

export default function CashierDashboard() {
  const navigate = useNavigate();

  const cards = [
    { title: "Point of Sale", desc: "Process customer payments.", onClick: () => navigate("/cashier/pos") },
    { title: "Appointments", desc: "View today's appointments.", onClick: () => navigate("/cashier/appointments") },
    { title: "Transaction History", desc: "View past transactions.", onClick: () => navigate("/cashier/history") },
  ];

  return (
    <div className="admin-dashboard-container">
      <h1 className="admin-dashboard-title">Cashier Dashboard</h1>
      <div className="dashboard-card-grid">
        {cards.map((card, i) => (
          <Card key={i} className="dashboard-card" onClick={card.onClick}>
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
