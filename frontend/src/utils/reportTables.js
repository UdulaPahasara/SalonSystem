import { rs } from "./format";

/** The report's sections, in order. The page tabs, the download dialog and both exports all use this list. */
export const REPORT_SECTIONS = [
  { id: "overview", label: "Overview", intro: "The headline numbers and what they mean for the business." },
  { id: "sales", label: "Sales", intro: "Where the money comes from: over time, by category, by payment type and by branch." },
  { id: "services", label: "Services & products", intro: "What customers buy, and which items are growing or falling compared with the previous period." },
  { id: "staff", label: "Staff", intro: "Workload and results per stylist and per cashier." },
  { id: "customers", label: "Customers", intro: "Who is spending, who keeps coming back and who has gone quiet." },
  { id: "appointments", label: "Appointments", intro: "How bookings turn out, and the busy and quiet times for rostering." },
  { id: "inventory", label: "Stock", intro: "What is running out, what is not selling and what is waiting for approval. Stock levels are as of now." },
  { id: "costs", label: "Salaries & profit", intro: "What was paid in salaries and what is left from sales. Only the Owner sees this.", ownerOnly: true },
];

const STATUS = { OUT: "Out of stock", LOW: "Running low", OK: "OK" };

/** How each column type is shown as text (page and PDF). Excel uses the raw numbers. */
export const formatCell = (type, v) => {
  switch (type) {
    case "int": return Number(v || 0).toLocaleString();
    case "money": return rs(Math.round(Number(v || 0)));
    case "pct": return `${Number(v || 0).toFixed(1)}%`;
    case "change": return v == null ? "-" : `${v >= 0 ? "+" : ""}${Number(v).toFixed(1)}%`;
    case "status": return STATUS[v] || v;
    case "dec": return Number(v || 0).toFixed(1);
    case "days": return v == null ? "No sales yet" : v > 365 ? "Over a year" : `${Math.max(1, Math.round(v))} days`;
    case "yesno": return v ? "Yes" : "No";
    case "branch": return String(v ?? "").replace(/^Malroo Salon\s*[—-]\s*/, "");
    default: return v == null ? "" : String(v);
  }
};

export const isNumeric = (type) => ["int", "money", "pct", "change", "dec", "days"].includes(type);

const col = (key, label, type = "text", wrap = false) => ({ key, label, type, wrap });
const kv = (rows) => rows.map(([name, value]) => ({ name, value }));

/**
 * Turns the report view into sections of tables:
 * { id, label, intro, tables: [{ id, title, note, columns:[{key,label,type}], rows, totals?, chart? }] }
 * Tables with no rows are kept (the page shows an "empty" line) so a manager can tell "none" from "missing".
 */
export function buildSections(view, { isOwner, periodLabel }) {
  const s = view.summary;
  const c = view.customers;
  const a = view.appointments;
  const trendTitle = view.monthly ? "Revenue by month" : "Revenue by day";

  const branchTable = view.branches.length > 1 && {
    id: "branches",
    title: "Branch comparison",
    note: "Compare branches on sales, bill size, cancellations and (for the Owner) whether sales cover that branch's salaries. A branch with falling sales, high cancellations or a negative balance needs a closer look.",
    columns: [col("name", "Branch", "branch"), col("revenue", "Revenue", "money"), col("share", "Share of sales", "pct"), col("change", "vs previous", "change"),
      col("transactions", "Transactions", "int"), col("avgBill", "Average bill", "money"), col("appointments", "Appointments", "int"), col("cancelRate", "Cancelled", "pct"),
      ...(view.salary ? [col("salaries", "Salaries paid", "money"), col("afterSalaries", "Left after salaries", "money")] : [])],
    rows: view.branches,
  };

  const keyFigures = {
    id: "key-figures",
    title: "Key figures",
    columns: [col("name", "Measure"), col("value", "Value")],
    rows: kv([
      ["Period", periodLabel],
      ["Total revenue", rs(s.revenue)],
      ["Previous period revenue", rs(s.prevRevenue)],
      ["Change", view.delta],
      ["Transactions", s.transactions.toLocaleString()],
      ["Average bill", rs(Math.round(s.avgBill))],
      ["Revenue from services", rs(s.serviceRevenue)],
      ["Revenue from products", rs(s.productRevenue)],
      ["Appointments (completed / cancelled / still booked)", `${s.appointments} (${s.completed} / ${s.cancelled} / ${s.booked})`],
      ...(view.salary ? [["Salaries paid", rs(view.salary.total)], ["Left after salaries", rs(view.salary.net)]] : []),
    ]),
  };

  const findings = {
    id: "findings",
    title: "What this report tells you",
    columns: [col("area", "Area"), col("kind", "Type"), col("text", "Finding")],
    rows: view.insights.map((i) => ({ area: i.area, kind: { warn: "Needs attention", good: "Good news", info: "Note" }[i.level], text: i.text })),
  };

  const sections = [
    { id: "overview", tables: [keyFigures, findings, branchTable].filter(Boolean) },
    {
      id: "sales",
      tables: [
        {
          id: "trend", title: trendTitle, totals: true,
          columns: [col("text", view.monthly ? "Month" : "Date"), col("count", "Transactions", "int"), col("revenue", "Revenue", "money")],
          rows: view.monthly ? view.rows.slice(Math.max(0, view.rows.findIndex((r) => r.count > 0))) : view.rows,
          chartRows: view.rows,
          chart: { labelKey: "label", valueKey: "revenue", tipKey: "tip", caption: trendTitle },
        },
        {
          id: "categories", title: "Revenue by category", note: "Shows which parts of the business earn the most. Retail products are shown as their own category.",
          columns: [col("name", "Category"), col("qty", "Units", "int"), col("revenue", "Revenue", "money"), col("share", "Share of sales", "pct")],
          rows: view.categories,
        },
        {
          id: "payments", title: "Payment methods",
          columns: [col("name", "Method"), col("count", "Transactions", "int"), col("revenue", "Revenue", "money"), col("share", "Share", "pct")],
          rows: view.payments,
        },
        branchTable,
      ].filter(Boolean),
    },
    {
      id: "services",
      tables: [
        {
          id: "menu", title: "Service menu analysis",
          note: "Each service is compared with the average service on your menu: Star = sells often and earns well; Busy, low earning = popular but small income; High earner = earns well but few buyers; Weak = neither. \"Earns per hour\" is price divided by how long the service takes.",
          columns: [col("name", "Service", "text", true), col("perHour", "Earns per hour", "money"),
            col("qty", "Times sold", "int"), col("revenue", "Revenue", "money"), col("kind", "Verdict", "text", true), col("action", "What to do", "text", true)],
          rows: view.menu,
        },
        {
          id: "retail", title: "Selling products with services", note: "Visits where the customer also bought a product are the easiest extra income: the customer is already at the till.",
          columns: [col("name", "Measure"), col("value", "Value")],
          rows: kv([
            ["Visits that included a service", view.retail.serviceVisits],
            ["Of those, also bought a product", `${view.retail.withProduct} (${view.retail.attachRate.toFixed(1)}%)`],
            ["Average product spend when one is bought", rs(Math.round(view.retail.avgProductSpend))],
            ["Average items per bill", view.retail.avgItems.toFixed(1)],
            ["Extra sales if 10% more visits also bought a product", rs(Math.round(view.retail.tenPointGain))],
          ]),
        },
        {
          id: "services", title: "Services sold", note: "Compared with the previous period of the same length. A big fall may mean a pricing, staffing or promotion problem; a big rise means demand to plan for.",
          columns: [col("name", "Service"), col("qty", "Times sold", "int"), col("revenue", "Revenue", "money"), col("share", "Share of sales", "pct"),
            col("prevRevenue", "Previous period", "money"), col("change", "Change", "change")],
          rows: view.services,
        },
        {
          id: "products", title: "Products sold", note: "\"In stock now\" shows whether the best sellers can keep selling.",
          columns: [col("name", "Product"), col("brand", "Brand"), col("qty", "Units sold", "int"), col("revenue", "Revenue", "money"), col("share", "Share of sales", "pct"), col("inStock", "In stock now", "int")],
          rows: view.products,
        },
      ],
    },
    {
      id: "staff",
      tables: [
        {
          id: "stylists", title: "Stylists and therapists", note: "Based on appointments only (walk-in sales are not linked to a stylist). Value is the menu price of completed appointments and hours are the booked service time. Someone with few hours may be under-used; many cancellations may point to a scheduling problem.",
          columns: [col("name", "Name"), col("role", "Role"), col("branch", "Branch", "branch"), col("appointments", "Appointments", "int"), col("completed", "Completed", "int"),
            col("cancelled", "Cancelled", "int"), col("completionRate", "Completion rate", "pct"), col("bookedHours", "Hours booked", "dec"), col("revenue", "Value completed", "money")],
          rows: view.staff,
        },
        {
          id: "cashiers", title: "Cashiers", note: "Sales taken at the till. A much lower average bill may mean missed chances to offer products.",
          columns: [col("name", "Cashier"), col("branch", "Branch", "branch"), col("transactions", "Transactions", "int"), col("revenue", "Revenue", "money"), col("avgBill", "Average bill", "money")],
          rows: view.cashiers,
        },
      ],
    },
    {
      id: "customers",
      tables: [
        {
          id: "customer-summary", title: "Customer summary",
          columns: [col("name", "Measure"), col("value", "Value")],
          rows: kv([
            ["Registered customers", c.registered],
            ["Loyalty members", c.members],
            ["Loyalty points held by customers", c.pointsOutstanding.toLocaleString()],
            ["Customers who paid in this period", c.served],
            ["First-ever visit in this period (new)", c.newCustomers],
            ["Came before this period (returning)", c.returning],
            ["Have visited more than once (repeat)", c.repeatCustomers],
            ["Walk-in sales without a customer record", c.walkInVisits],
            ["Typical days between visits (repeat customers)", c.avgGapDays > 0 ? c.avgGapDays.toFixed(0) : "-"],
            ["Share of sales from the top 10 customers", `${c.topShare.toFixed(1)}%`],
          ]),
        },
        {
          id: "customer-revenue", title: "Revenue by customer type", note: "If walk-ins are most of your sales, ask them to register so you can invite them back.",
          columns: [col("name", "Customer type"), col("revenue", "Revenue", "money"), col("share", "Share of sales", "pct")],
          rows: [["Loyalty members", c.memberRevenue], ["Registered, not in loyalty", c.otherCustomerRevenue], ["Walk-in (no record)", c.walkInRevenue]]
            .map(([name, revenue]) => ({ name, revenue, share: s.revenue > 0 ? (revenue / s.revenue) * 100 : 0 })),
        },
        {
          id: "segments", title: "Loyalty members compared with other customers", note: "Shows whether the loyalty programme is worth it: do members visit more often and spend more?",
          columns: [col("name", "Group"), col("customers", "Customers", "int"), col("visits", "Visits", "int"), col("revenue", "Revenue", "money"),
            col("perCustomer", "Spend per customer", "money"), col("visitsPerCustomer", "Visits per customer", "dec"), col("avgBill", "Average bill", "money")],
          rows: c.segments,
        },
        {
          id: "top-customers", title: "Top customers", note: "Your most valuable customers in this period. Keep them happy.",
          columns: [col("name", "Customer"), col("visits", "Visits", "int"), col("spent", "Spent", "money"), col("lastVisit", "Last visit"), col("member", "Loyalty member", "yesno")],
          rows: c.top,
        },
        {
          id: "lapsed", title: `Customers to win back (no visit in ${c.lapsedDays}+ days)`, note: c.lapsedCount === 0 ? "Everyone who has paid before has visited recently." : `${c.lapsedCount} customer${c.lapsedCount === 1 ? "" : "s"} in total; the ${Math.min(c.lapsedCount, 15)} longest away are listed. Call or message them with an offer.`,
          columns: [col("name", "Customer"), col("phone", "Phone"), col("lastVisit", "Last visit"), col("member", "Loyalty member", "yesno")],
          rows: c.lapsed,
        },
      ],
    },
    {
      id: "appointments",
      tables: [
        {
          id: "appt-status", title: "Appointment outcomes", note: `${a.cancelRate.toFixed(1)}% of appointments were cancelled. ${a.loyaltyBookings} booking${a.loyaltyBookings === 1 ? "" : "s"} used loyalty.`,
          columns: [col("name", "Outcome"), col("count", "Appointments", "int"), col("share", "Share", "pct")],
          rows: [["Completed", a.completed], ["Cancelled", a.cancelled], ["Still booked", a.booked]].map(([name, count]) => ({ name, count, share: a.total > 0 ? (count / a.total) * 100 : 0 })),
        },
        {
          id: "weekdays", title: "Busiest days of the week", note: "Roster more staff on the busiest days and run offers on the quietest.",
          columns: [col("name", "Day"), col("appointments", "Appointments", "int"), col("cancelled", "Cancelled", "int"), col("transactions", "Sales", "int"), col("revenue", "Revenue", "money")],
          rows: a.weekdays,
          chart: { labelKey: "name", valueKey: "revenue", tipKey: "name", caption: "Revenue by day of the week", short: true },
        },
        {
          id: "heatmap", title: "When are we busiest? (sales by day and hour)", heat: true,
          note: `Darker means more sales. ${view.heatmap.peakCount > 0 ? `The busiest slot is ${view.heatmap.peakDay} around ${view.heatmap.peakHour} (${view.heatmap.peakCount} sales). ` : ""}Put more staff on dark slots and run offers on pale ones.`,
          columns: [col("name", "Day"), ...view.heatmap.hours.map((h) => col(h, h, "int"))],
          rows: view.heatmap.rows,
        },
        {
          id: "hours", title: "Busiest hours of the day",
          columns: [col("name", "Hour"), col("appointments", "Appointments", "int"), col("transactions", "Sales", "int")],
          rows: a.hours,
        },
        {
          id: "booked-services", title: "Most booked services",
          columns: [col("name", "Service"), col("booked", "Booked", "int"), col("completed", "Completed", "int"), col("cancelled", "Cancelled", "int")],
          rows: a.services,
        },
      ],
    },
    {
      id: "inventory",
      tables: [
        {
          id: "stock", title: "Stock levels", note: "Out-of-stock and low items come first. \"Stock lasts\" is how long the stock would last at the sales pace of this period, and \"Reorder\" is how many units would give about 30 days of sales. Stock that has not sold at all is not moving.",
          columns: [col("branch", "Branch", "branch"), col("product", "Product"), col("brand", "Brand"), col("qty", "In stock", "int"), col("limit", "Low-stock level", "int"),
            col("status", "Status", "status"), col("sold", "Sold in period", "int"), col("daysLeft", "Stock lasts", "days"), col("reorder", "Reorder for 30 days", "int"), col("value", "Stock value", "money")],
          rows: view.inventory.items,
        },
        {
          id: "stock-requests", title: "Stock requests",
          columns: [col("name", "Measure"), col("value", "Value")],
          rows: kv([
            ["Waiting for approval now", view.inventory.requests.pendingNow],
            ["Requested in this period", view.inventory.requests.requested],
            ["Approved", view.inventory.requests.approved],
            ["Rejected", view.inventory.requests.rejected],
          ]),
        },
      ],
    },
  ];

  if (isOwner && view.salary) {
    const sal = view.salary;
    sections.push({
      id: "costs",
      tables: [
        {
          id: "profit", title: "Sales against salaries", note: "Salaries are the only cost recorded in the system, so \"left after salaries\" is before rent, stock purchases and other expenses. Salaries are counted for every month the period touches.",
          columns: [col("name", "Measure"), col("value", "Value")],
          rows: kv([["Revenue", rs(s.revenue)], ["Salaries paid", rs(sal.total)], ["Left after salaries", rs(sal.net)], ["Salaries as share of revenue", `${sal.ratio.toFixed(1)}%`]]),
        },
        { id: "salary-month", title: "Salaries by month", totals: true, columns: [col("name", "Month"), col("payments", "Payments", "int"), col("amount", "Amount", "money")], rows: sal.byMonth },
        { id: "salary-branch", title: "Salaries by branch", totals: true, columns: [col("name", "Branch", "branch"), col("payments", "Payments", "int"), col("amount", "Amount", "money")], rows: sal.byBranch },
        { id: "salary-role", title: "Salaries by role", totals: true, columns: [col("name", "Role"), col("payments", "Payments", "int"), col("amount", "Amount", "money")], rows: sal.byRole },
        { id: "salary-list", title: "Salary payments", columns: [col("month", "Month"), col("name", "Name"), col("role", "Role"), col("branch", "Branch", "branch"), col("amount", "Amount", "money")], rows: sal.list },
      ],
    });
  }

  return sections.map((sec) => ({ ...REPORT_SECTIONS.find((r) => r.id === sec.id), ...sec }));
}

/** A sum row for tables marked `totals`. */
export function totalsRow(table) {
  const row = {};
  table.columns.forEach((c, i) => {
    row[c.key] = i === 0 ? "Total" : c.type === "int" || c.type === "money" ? table.rows.reduce((t, r) => t + Number(r[c.key] || 0), 0) : "";
  });
  return row;
}

/**
 * Opens a PDF of the report in a new browser tab so it can be read before downloading.
 * The tab is opened straight away (inside the click) so pop-up blockers allow it; if it is blocked the PDF downloads instead.
 */
export async function previewReportPdf(getReport) {
  const win = window.open("", "_blank");
  if (win) win.document.write("<p style=\"font-family:sans-serif;padding:2rem;color:#53112f\">Preparing the report…</p>");
  try {
    const [report, { exportReportPdf }] = await Promise.all([getReport(), import("./reportExport")]);
    if (!win) return exportReportPdf(report);
    win.location.href = await exportReportPdf(report, { preview: true });
  } catch (err) {
    if (win) win.close();
    throw err;
  }
}
