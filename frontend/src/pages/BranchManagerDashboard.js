import React from "react";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useNavigate } from "react-router-dom";
import "./adminDashBoard.css"; // reuse same styles

export default function BranchManagerDashboard() {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Branch Staff",
      desc: "Add and manage Stylists, Barbers, and Therapists.",
      onClick: () => navigate("/branch/staff"),
    },
    {
      title: "Branch Services",
      desc: "View and update this branch profile, opening hours, services.",
      onClick: () => navigate("/branch/services"),
    },
    {
      title: "Branch Appointments",
      desc: "View and manage all appointments for this branch.",
      onClick: () => navigate("/branch/appointments"),
    },
    {
      title: "Stock Requests",
      desc: "Approve or reject product stock requests.",
      onClick: () => navigate("/branch/stock-requests"),
    },
    {
      title: "Branch Products",
      desc: "View products available in this branch and stock levels.",
      onClick: () => navigate("/branch/products"),
    },

    {
      title: "Branch Billing",
      desc: "Check today’s bills, payments, and refunds for this branch.",
      onClick: () => navigate("/branch/billing"),
    },
    {
      title: "Branch Reports",
      desc: "Daily income, popular services, and stock reports.",
      onClick: () => navigate("/reports"),
    },
    {
      title: "Appointment History",
      desc: "View history of all appointments.",
      onClick: () => navigate("/appointment-history"),
    },
    {
      title: "Service History",
      desc: "View history of provided services.",
      onClick: () => navigate("/service-history"),
    },
    {
      title: "Stock Request History",
      desc: "View status of stock requests.",
      onClick: () => navigate("/stock-request-history"),
    },

  ];

  return (
    <div className="admin-dashboard-container">
      <h1 className="admin-dashboard-title">Branch Manager Dashboard</h1>
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
