export const DASHBOARD_CONFIGS = {
  Owner: {
    title: "Owner Dashboard",
    subtitle: "Manage branches, staff, billing, and salon-wide performance.",
    stats: [
      { label: "System Access", value: "Full", hint: "All branches & settings" },
      { label: "Modules", value: "9", hint: "Management tools" },
      { label: "Reports", value: "Live", hint: "Revenue & services" },
    ],
    modules: [
      { title: "Users Management", desc: "Create staff accounts and assign roles.", path: "/admin/users", icon: "users" },
      { title: "Branch Management", desc: "Add and edit salon branches.", path: "/branches", icon: "branch" },
      { title: "Salary Management", desc: "Payroll, salaries, and staff payments.", path: "/staff", icon: "salary" },
      { title: "Branch Inventory", desc: "Stock levels across all branches.", path: "/admin/branch-inventory", icon: "inventory" },
      { title: "Billing & Payments", desc: "Income, bills, and payment history.", path: "/billing", icon: "billing" },
      { title: "Reports & Analytics", desc: "Top services, products, and trends.", path: "/reports", icon: "reports" },
      { title: "Appointment History", desc: "Past bookings across the salon.", path: "/appointment-history", icon: "calendar" },
      { title: "Service History", desc: "Completed services and records.", path: "/service-history", icon: "service" },
    ],
  },
  "Branch Manager": {
    title: "Branch Manager Dashboard",
    subtitle: "Run daily operations for your branch — staff, services, and stock.",
    stats: [
      { label: "Branch Tools", value: "10", hint: "Operations modules" },
      { label: "Services", value: "Menu", hint: "Public price list" },
      { label: "Stock", value: "Requests", hint: "Approve inventory" },
    ],
    modules: [
      { title: "Branch Staff", desc: "Manage stylists and therapists.", path: "/branch/staff", icon: "users" },
      { title: "Branch Services", desc: "Update services, prices, and categories.", path: "/branch/services", icon: "service" },
      { title: "Appointments", desc: "View and manage branch bookings.", path: "/branch/appointments", icon: "calendar" },
      { title: "Stock Requests", desc: "Approve or reject product requests.", path: "/branch/stock-requests", icon: "inventory" },
      { title: "Branch Products", desc: "Product stock for this branch.", path: "/branch/products", icon: "product" },
      { title: "Branch Billing", desc: "Daily bills and payments.", path: "/branch/billing", icon: "billing" },
      { title: "Reports", desc: "Branch income and popular services.", path: "/reports", icon: "reports" },
      { title: "Appointment History", desc: "Past appointments for this branch.", path: "/appointment-history", icon: "calendar" },
      { title: "Service History", desc: "Service records and history.", path: "/service-history", icon: "service" },
      { title: "Stock Request History", desc: "Track inventory request status.", path: "/stock-request-history", icon: "inventory" },
    ],
  },
  Reception: {
    title: "Reception Dashboard",
    subtitle: "Book appointments, manage customers, and respond to enquiries.",
    stats: [
      { label: "Bookings", value: "Today", hint: "Appointment management" },
      { label: "Customers", value: "CRM", hint: "Client records" },
      { label: "Messages", value: "Inbox", hint: "Website contact form" },
    ],
    modules: [
      { title: "Manage Appointments", desc: "Book, reschedule, or cancel visits.", path: "/reception/appointments", icon: "calendar", highlight: true },
      { title: "Manage Customers", desc: "Add and update customer profiles.", path: "/reception/customers", icon: "users" },
      { title: "Website Messages", desc: "Messages from the public contact page.", path: "/reception/contact-messages", icon: "message" },
    ],
  },
  "Product Manager": {
    title: "Product Manager Dashboard",
    subtitle: "Maintain product catalog and inventory across the salon.",
    stats: [
      { label: "Catalog", value: "Products", hint: "Create & edit items" },
      { label: "Inventory", value: "Stock", hint: "Levels & requests" },
      { label: "History", value: "Requests", hint: "Approval tracking" },
    ],
    modules: [
      { title: "Product Management", desc: "Create and update salon products.", path: "/pm/products", icon: "product", highlight: true },
      { title: "Inventory", desc: "View stock and send replenishment requests.", path: "/pm/inventory", icon: "inventory" },
      { title: "Request History", desc: "Approved and rejected stock requests.", path: "/stock-request-history", icon: "reports" },
    ],
  },
  Cashier: {
    title: "Cashier Dashboard",
    subtitle: "Process payments and support front-desk operations.",
    stats: [
      { label: "POS", value: "Checkout", hint: "Customer payments" },
      { label: "Schedule", value: "Today", hint: "Appointments" },
      { label: "History", value: "Sales", hint: "Past transactions" },
    ],
    modules: [
      { title: "Point of Sale", desc: "Process customer payments at the desk.", path: "/cashier/pos", icon: "billing", highlight: true },
      { title: "Appointments", desc: "View today's appointment schedule.", path: "/cashier/appointments", icon: "calendar" },
      { title: "Transaction History", desc: "Review completed sales.", path: "/cashier/history", icon: "reports" },
    ],
  },
};

export function getDashboardConfig(roleName) {
  if (roleName === "Chashire") return DASHBOARD_CONFIGS.Cashier;
  return DASHBOARD_CONFIGS[roleName] || null;
}
