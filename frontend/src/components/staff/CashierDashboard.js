import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getTransactionsByBranch } from "../../api/usersApi";
import { getAllAppointments } from "../../api/appointmentApi";
import { getInventoryByBranch } from "../../api/productApi";
import { recentRange } from "../../utils/period";
import { DashboardHead, Kpis, Card, AttentionList, ActionList, RecentSales, Schedule, DashGrid, useLoad, valueOf, sameDay, sumOf, rsWhole, LOW_STOCK_LIMIT } from "./DashboardParts";

export default function CashierDashboard() {
  const { fullName, branchId, userId } = useAuth();

  const { loading, data } = useLoad(async () => {
    const [tx, appts, inv] = await Promise.allSettled([getTransactionsByBranch(branchId, recentRange()), getAllAppointments(branchId), getInventoryByBranch(branchId)]);
    return { tx: valueOf(tx, []), appts: valueOf(appts, []), inv: valueOf(inv, []) };
  }, [branchId]);

  const view = useMemo(() => {
    if (!data) return null;
    const now = new Date();
    const todayTx = data.tx.filter((t) => sameDay(t.dateTime, now));
    const mine = todayTx.filter((t) => t.cashier && t.cashier.id === userId);
    const waiting = data.appts
      .filter((a) => (a.status || "BOOKED").toUpperCase() === "BOOKED" && sameDay(a.appointmentTime, now))
      .sort((a, b) => new Date(a.appointmentTime) - new Date(b.appointmentTime));
    return {
      mySales: sumOf(mine, (t) => t.totalAmount), myCount: mine.length,
      branchSales: sumOf(todayTx, (t) => t.totalAmount),
      waiting,
      low: data.inv.filter((i) => i.quantity < LOW_STOCK_LIMIT).length,
      recent: [...data.tx].sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime)).slice(0, 6),
    };
  }, [data, userId]);

  const kpis = view && [
    { label: "My sales today", value: rsWhole(view.mySales), hint: `${view.myCount} checkout${view.myCount === 1 ? "" : "s"}` },
    { label: "Average sale", value: rsWhole(view.myCount ? view.mySales / view.myCount : 0), hint: "My checkouts today" },
    { label: "Branch sales today", value: rsWhole(view.branchSales), hint: "All cashiers" },
    { label: "Awaiting checkout", value: view.waiting.length, hint: "Booked visits today" },
  ];

  return (
    <div className="dash">
      <DashboardHead name={fullName} subtitle="Ready to take payments." />
      <Kpis items={kpis} />
      <DashGrid
        left={
          <>
            <Card title="Ready for checkout" to="/cashier/appointments" linkText="All appointments →">
              <Schedule
                rows={view?.waiting || []}
                loading={loading}
                empty="No booked visits waiting today. Use New sale for walk-ins."
                action={(a) => <Link className="staff-btn staff-btn-primary staff-btn-sm" to={`/cashier/pos?appointment=${a.appointmentId}`}>Check out</Link>}
              />
            </Card>
            <Card title="Recent transactions" to="/cashier/history" linkText="View all →">
              <RecentSales rows={view?.recent || []} loading={loading} />
            </Card>
          </>
        }
        right={
          <>
            <Card title="Needs attention">
              <AttentionList loading={loading} items={[
                { n: view?.waiting.length, text: "booked visits waiting to be paid today", to: "/cashier/appointments" },
                { n: view?.low, text: `products low on stock (under ${LOW_STOCK_LIMIT})`, to: "/cashier/pos" },
              ]} />
            </Card>
            <Card title="Quick actions">
              <ActionList items={[
                { label: "New sale", hint: "Walk-in services and products", to: "/cashier/pos" },
                { label: "Transactions", hint: "Review completed sales", to: "/cashier/history" },
                { label: "Appointments", hint: "See today's bookings", to: "/cashier/appointments" },
              ]} />
            </Card>
          </>
        }
      />
    </div>
  );
}
