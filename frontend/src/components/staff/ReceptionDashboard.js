import React, { useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { getAllAppointments } from "../../api/appointmentApi";
import { getAllCustomers } from "../../api/customerApi";
import { getContactMessages } from "../../api/contactApi";
import { DashboardHead, Kpis, Card, AttentionList, ActionList, Schedule, DashGrid, Empty, useLoad, valueOf, sameDay } from "./DashboardParts";

const statusOf = (a) => (a.status || "BOOKED").toUpperCase();

export default function ReceptionDashboard() {
  const { fullName, branchId } = useAuth();

  const { loading, data } = useLoad(async () => {
    const [appts, customers, messages] = await Promise.allSettled([getAllAppointments(branchId), getAllCustomers(branchId), getContactMessages()]);
    return { appts: valueOf(appts, []), customers: valueOf(customers, []), messages: valueOf(messages, []) };
  }, [branchId]);

  const view = useMemo(() => {
    if (!data) return null;
    const now = new Date();
    const weekAhead = new Date(); weekAhead.setDate(now.getDate() + 7);
    const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7);
    const byTime = (a, b) => new Date(a.appointmentTime) - new Date(b.appointmentTime);
    const today = data.appts.filter((a) => sameDay(a.appointmentTime, now) && statusOf(a) !== "CANCELLED").sort(byTime);
    const upcoming = data.appts.filter((a) => statusOf(a) === "BOOKED" && new Date(a.appointmentTime) > now && !sameDay(a.appointmentTime, now)).sort(byTime);
    return {
      today, upcoming,
      booked: data.appts.filter((a) => statusOf(a) === "BOOKED" && new Date(a.appointmentTime) >= now).length,
      newMessages: data.messages.filter((m) => new Date(m.createdAt) >= weekAgo).length,
      unassigned: data.appts.filter((a) => statusOf(a) === "BOOKED" && new Date(a.appointmentTime) >= now && new Date(a.appointmentTime) <= weekAhead && !a.assignedStaff).length,
    };
  }, [data]);

  const kpis = view && [
    { label: "Appointments today", value: view.today.length, hint: `${view.today.filter((a) => statusOf(a) === "COMPLETED").length} completed` },
    { label: "Upcoming bookings", value: view.booked, hint: "Booked, still to come" },
    { label: "Customers", value: data.customers.length, hint: "Registered at your branch" },
    { label: "New messages", value: view.newMessages, hint: "Website enquiries, last 7 days" },
  ];

  return (
    <div className="dash">
      <DashboardHead name={fullName} subtitle="Today's front desk at a glance." />
      <Kpis items={kpis} />
      <DashGrid
        left={
          <>
            <Card title="Today's schedule" to="/reception/appointments" linkText="All appointments →">
              <Schedule rows={view?.today || []} loading={loading} empty="No appointments today. Book one from Quick actions." />
            </Card>
            <Card title="Coming up" to="/reception/appointments" linkText="Manage →">
              {!view ? <Empty>Loading…</Empty> : view.upcoming.length === 0 ? <Empty>No upcoming bookings.</Empty> : (
                <ul className="schedule">
                  {view.upcoming.slice(0, 5).map((a) => (
                    <li key={a.appointmentId} className="schedule-row schedule-row-3">
                      <span className="schedule-time schedule-date">
                        {new Date(a.appointmentTime).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                        <small>{new Date(a.appointmentTime).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</small>
                      </span>
                      <span className="schedule-main">
                        <strong>{a.customer ? a.customer.fullName : "Walk-in"}</strong>
                        <small>{a.serviceType}{a.assignedStaff ? ` · ${a.assignedStaff.fullName}` : " · no stylist yet"}</small>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        }
        right={
          <>
            <Card title="Needs attention">
              <AttentionList loading={loading} items={[
                { n: view?.unassigned, text: "bookings this week without a stylist", to: "/reception/appointments" },
                { n: view?.newMessages, text: "new website messages (last 7 days)", to: "/reception/contact-messages" },
              ]} />
            </Card>
            <Card title="Quick actions">
              <ActionList items={[
                { label: "Book appointment", hint: "Schedule a client", to: "/reception/appointments?new=1" },
                { label: "Register customer", hint: "Add a new client record", to: "/reception/customers?new=1" },
                { label: "Website messages", hint: "Reply to enquiries", to: "/reception/contact-messages" },
              ]} />
            </Card>
          </>
        }
      />
    </div>
  );
}
