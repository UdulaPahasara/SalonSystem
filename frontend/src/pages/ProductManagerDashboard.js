import React from "react";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useNavigate } from "react-router-dom";
import "./adminDashBoard.css"; // reuse same styles

export default function ProductManagerDashboard() {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Product Management",
      desc: "Create, update, and manage salon products.",
      onClick: () => navigate("/pm/products"),
    },

    {
      title: "Request History",
      desc: "Track approved & rejected stock requests.",
      onClick: () => navigate("/stock-request-history"),
    },
  ];

  return (
    <div className="admin-dashboard-container">
      <h1 className="admin-dashboard-title">Product Manager Dashboard</h1>

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
