import { getDashboardPathForRole, getRoleDisplayName } from "./authRoutes";

export function getStaffNavItems(roleName) {
  const role = getRoleDisplayName(roleName);

  const nav = {
    Owner: [
      { label: "Dashboard", path: "/admin-dashboard" },
      { label: "Users", path: "/admin/users" },
      { label: "Branches", path: "/branches" },
      { label: "Salary", path: "/staff" },
      { label: "Branch Inventory", path: "/admin/branch-inventory" },
      { label: "Billing", path: "/billing" },
      { label: "Reports", path: "/reports" },
      { label: "Appointment History", path: "/appointment-history" },
      { label: "Service History", path: "/service-history" },
    ],
    "Branch Manager": [
      { label: "Dashboard", path: "/branch-dashboard" },
      { label: "Branch Staff", path: "/branch/staff" },
      { label: "Services", path: "/branch/services" },
      { label: "Appointments", path: "/branch/appointments" },
      { label: "Stock Requests", path: "/branch/stock-requests" },
      { label: "Products", path: "/branch/products" },
      { label: "Billing", path: "/branch/billing" },
      { label: "Reports", path: "/reports" },
      { label: "Appointment History", path: "/appointment-history" },
      { label: "Service History", path: "/service-history" },
      { label: "Stock History", path: "/stock-request-history" },
    ],
    Reception: [
      { label: "Dashboard", path: "/reception-dashboard" },
      { label: "Appointments", path: "/reception/appointments" },
      { label: "Customers", path: "/reception/customers" },
      { label: "Website Messages", path: "/reception/contact-messages" },
    ],
    "Product Manager": [
      { label: "Dashboard", path: "/pm-dashboard" },
      { label: "Products", path: "/pm/products" },
      { label: "Inventory", path: "/pm/inventory" },
      { label: "Stock History", path: "/stock-request-history" },
    ],
    Cashier: [
      { label: "Dashboard", path: "/cashier" },
      { label: "Point of Sale", path: "/cashier/pos" },
      { label: "Appointments", path: "/cashier/appointments" },
      { label: "Transactions", path: "/cashier/history" },
    ],
  };

  return nav[role] || [];
}

export function getStaffHomePath(roleName) {
  return getDashboardPathForRole(roleName) || "/login";
}
