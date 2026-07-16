import { getTransactionsByBranch } from "../api/usersApi";
import { getAllAppointments } from "../api/appointmentApi";
import { getAllCustomers } from "../api/customerApi";
import { getContactMessages } from "../api/contactApi";
import { getServicesByBranch } from "../api/serviceApi";
import { getProducts, getInventoryByBranch } from "../api/productApi";
import { getStockRequestsByBranch, getAllStockRequests } from "../api/stockRequestApi";

const isToday = (value) => !!value && new Date(value).toDateString() === new Date().toDateString();
const rs = (n) => `Rs. ${Math.round(n).toLocaleString()}`;
const salesToday = (txs) => txs.filter((t) => isToday(t.dateTime)).reduce((sum, t) => sum + Number(t.totalAmount || 0), 0);
const countToday = (txs) => txs.filter((t) => isToday(t.dateTime)).length;
const pending = (res) => res.data.filter((r) => r.status === "PENDING").length;

// Each role maps to a list of live figures; a failed lookup shows "—" instead of breaking the page.
const STATS = {
  "Branch Manager": ({ branchId }) => [
    { label: "Services offered", hint: "On the public menu", load: () => getServicesByBranch(branchId).then((d) => d.length) },
    { label: "Stock requests pending", hint: "Waiting for approval", load: () => getStockRequestsByBranch(branchId).then(pending) },
    { label: "Sales today", hint: "This branch", load: () => getTransactionsByBranch(branchId).then((d) => rs(salesToday(d))) },
  ],
  Reception: ({ branchId }) => [
    { label: "Appointments today", hint: "This branch", load: () => getAllAppointments(branchId).then((d) => d.filter((a) => isToday(a.appointmentTime) && a.status !== "CANCELLED").length) },
    { label: "Customers", hint: "Registered clients", load: () => getAllCustomers(branchId).then((d) => d.length) },
    { label: "Website messages", hint: "Contact form enquiries", load: () => getContactMessages().then((d) => d.length) },
  ],
  "Product Manager": ({ branchId }) => [
    { label: "Products", hint: "In the catalogue", load: () => getProducts().then((d) => d.length) },
    { label: "Low stock items", hint: "At or below the limit", load: () => getInventoryByBranch(branchId).then((d) => d.filter((i) => i.quantity < 5).length) },
    { label: "Requests pending", hint: "Awaiting approval", load: () => getAllStockRequests().then(pending) },
  ],
  Cashier: ({ branchId }) => [
    { label: "Sales today", hint: "This branch", load: () => getTransactionsByBranch(branchId).then((d) => rs(salesToday(d))) },
    { label: "Transactions today", hint: "Completed checkouts", load: () => getTransactionsByBranch(branchId).then((d) => countToday(d)) },
    { label: "Appointments today", hint: "This branch", load: () => getAllAppointments(branchId).then((d) => d.filter((a) => isToday(a.appointmentTime) && a.status !== "CANCELLED").length) },
  ],
};

export function getStatDefinitions(roleName, ctx) {
  const key = roleName === "Chashire" ? "Cashier" : roleName;
  return STATS[key] ? STATS[key](ctx) : [];
}
