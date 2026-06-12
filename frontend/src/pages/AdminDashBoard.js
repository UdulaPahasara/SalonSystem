import React from "react";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useNavigate } from "react-router-dom";
import "./adminDashBoard.css";

export default function AdminDashBoard() {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Users Management",
      desc: "Create, edit, delete system users & assign roles.",
      onClick: () => navigate("/admin/users"),
    },
    {
      title: "Branch Management",
      desc: "Manage branch.",
      onClick: () => navigate("/branches"),
    },

    {
      title: "Salary Management",
      desc: "Employees, salaries, shifts, performance.",
      onClick: () => navigate("/staff"),
    },
    {
      title: "Branch Inventory",
      desc: "View inventory levels by branch.",
      onClick: () => navigate("/admin/branch-inventory"),
    },
    {
      title: "Billing & Payments",
      desc: "Daily income, bill history, refunds.",
      onClick: () => navigate("/billing"),
    },
    {
      title: "Reports & Analytics",
      desc: "Customer trends, income reports, top services.",
      onClick: () => navigate("/reports"),
    },
    {
      title: "View Events",
      desc: "View events",
      onClick: () => navigate("/events"),
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
  ];

  return (
    <div className="admin-dashboard-container">
      <h1 className="admin-dashboard-title">Admin Dashboard</h1>

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
