import React, { useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { getTransactionsByBranch } from "../../api/usersApi";
import { getAllAppointments } from "../../api/appointmentApi";
import { getStockRequestsByBranch } from "../../api/stockRequestApi";
import { getInventoryByBranch } from "../../api/productApi";
import BarChart from "./BarChart";
import { recentRange } from "../../utils/period";
import { DashboardHead, Kpis, Card, AttentionList, ActionList, RecentSales, Schedule, DashGrid, Empty, useLoad, valueOf, lastSevenDays, trendText, sameDay, sumOf, rsWhole, LOW_STOCK_LIMIT } from "./DashboardParts";

export default function ManagerDashboard() {
  const { fullName, branchId } = useAuth();

  const { loading, data } = useLoad(async () => {
    const [tx, appts, stock, inv] = await Promise.allSettled([
      getTransactionsByBranch(branchId, recentRange()),
      getAllAppointments(branchId),
      getStockRequestsByBranch(branchId),
      getInventoryByBranch(branchId),
    ]);
    return {
      tx: valueOf(tx, []),
      appts: valueOf(appts, []),
      stock: stock.status === "fulfilled" ? stock.value.data : [],
      inv: valueOf(inv, []),
    };
  }, [branchId]);

  const view = useMemo(() => {
    if (!data) return null;
    const now = new Date();
    const yesterday = new Date(); yesterday.setDate(now.getDate() - 1);
    const todayTx = data.tx.filter((t) => sameDay(t.dateTime, now));
    const todaySales = sumOf(todayTx, (t) => t.totalAmount);
    const monthTx = data.tx.filter((t) => { const d = new Date(t.dateTime); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
    const today = data.appts.filter((a) => sameDay(a.appointmentTime, now) && (a.status || "BOOKED") !== "CANCELLED").sort((a, b) => new Date(a.appointmentTime) - new Date(b.appointmentTime));
    const pending = data.stock.filter((r) => r.status === "PENDING").length;
    return {
      todaySales, trend: trendText(todaySales, sumOf(data.tx.filter((t) => sameDay(t.dateTime, yesterday)), (t) => t.totalAmount)),
      monthSales: sumOf(monthTx, (t) => t.totalAmount), monthCount: monthTx.length,
      today, pending,
      low: data.inv.filter((i) => i.quantity < LOW_STOCK_LIMIT).length,
      unassigned: today.filter((a) => !a.assignedStaff && (a.status || "BOOKED") === "BOOKED").length,
      days: lastSevenDays(data.tx),
      recent: [...data.tx].sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime)).slice(0, 5),
    };
  }, [data]);

  const kpis = view && [
    { label: "Sales today", value: rsWhole(view.todaySales), hint: view.trend },
    { label: "Sales this month", value: rsWhole(view.monthSales), hint: `${view.monthCount} transaction${view.monthCount === 1 ? "" : "s"}` },
    { label: "Appointments today", value: view.today.length, hint: `${view.today.filter((a) => (a.status || "BOOKED") === "COMPLETED").length} completed` },
    { label: "Stock to review", value: view.pending, hint: view.pending ? "Requests waiting for you" : "Nothing pending" },
  ];

  return (
    <div className="dash">
      <DashboardHead name={fullName} subtitle="Here's how your branch is doing today." />
      <Kpis items={kpis} />
      <DashGrid
        left={
          <>
            <Card title="Today's schedule" to="/branch/appointments" linkText="All appointments →">
              <Schedule rows={view?.today || []} loading={loading} empty="No appointments today." />
            </Card>
            <Card title="Sales — last 7 days" to="/reports" linkText="Reports →">
              {view ? (
                <BarChart
                  caption="Branch sales per day, last 7 days"
                  format={rsWhole}
                  emptyText="No sales recorded in the last 7 days."
                  data={view.days.map((d) => ({ key: d.date.toISOString(), label: d.date.toLocaleDateString(undefined, { weekday: "short" }), value: d.total, tip: d.date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" }) }))}
                />
              ) : <Empty>Loading…</Empty>}
            </Card>
            <Card title="Recent transactions" to="/branch/billing" linkText="View all →">
              <RecentSales rows={view?.recent || []} loading={loading} />
            </Card>
          </>
        }
        right={
          <>
            <Card title="Needs attention">
              <AttentionList loading={loading} items={[
                { n: view?.pending, text: "stock requests waiting for approval", to: "/branch/stock-requests" },
                { n: view?.low, text: `items low on stock (under ${LOW_STOCK_LIMIT})`, to: "/branch/products" },
                { n: view?.unassigned, text: "appointments today without a stylist", to: "/branch/appointments" },
              ]} />
            </Card>
            <Card title="Quick actions">
              <ActionList items={[
                { label: "Book appointment", hint: "Schedule a client", to: "/branch/appointments?new=1" },
                { label: "Add a service", hint: "Update your menu and prices", to: "/branch/services?new=1" },
                { label: "Review stock requests", hint: "Approve or reject", to: "/branch/stock-requests" },
                { label: "View reports", hint: "Income and popular services", to: "/reports" },
              ]} />
            </Card>
          </>
        }
      />
    </div>
  );
}
