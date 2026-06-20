import "./App.css";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ConfirmProvider } from "./context/ConfirmContext";
import PublicLayout from "./components/public/PublicLayout";
import StaffLayout from "./components/staff/StaffLayout";
import AdminBranchInventory from "./pages/AdminBranchInventory";
import AdminBillingHistory from "./pages/AdminBillingHistory";

import Home from "./pages/Home";
import Login from "./pages/Login";
import ServicesPage from "./pages/public/ServicesPage";
import AboutPage from "./pages/public/AboutPage";
import ContactPage from "./pages/public/ContactPage";
import PrivacyPolicyPage from "./pages/public/PrivacyPolicyPage";
import TermsPage from "./pages/public/TermsPage";
import RefundPolicyPage from "./pages/public/RefundPolicyPage";
import CancellationPolicyPage from "./pages/public/CancellationPolicyPage";
import StaffDashboardPage from "./pages/StaffDashboardPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import BranchManagerStockApproval from "./pages/BranchManagerStockApproval";
import BranchPage from "./pages/BranchPage";
import ProductManagementPage from "./pages/ProductManagementPage";
import ProductManagerInventoryPage from "./pages/ProductManagerInventoryPage";
import POSPage from "./pages/POSPage";
import CashierAppointments from "./pages/CashierAppointments";
import CustomerManagement from "./pages/CustomerManagement";
import TransactionHistory from "./pages/TransactionHistory";
import AppointmentManagement from "./pages/AppointmentManagement";
import BranchStaffManagement from "./pages/BranchStaffManagement";
import BranchAppointmentManagement from "./pages/BranchAppointmentManagement";
import SalaryManagement from "./pages/SalaryManagement";
import BranchProductInventory from "./pages/BranchProductInventory";
import BranchServiceManagement from "./pages/BranchServiceManagement";
import BranchBillingHistory from "./pages/BranchBillingHistory";
import ReportsPage from "./pages/ReportsPage";
import AppointmentHistory from "./pages/AppointmentHistory";
import ServiceHistory from "./pages/ServiceHistory";
import StockRequestHistory from "./pages/StockRequestHistory";
import ContactMessagesPage from "./pages/ContactMessagesPage";

// Keep public pages separate from staff-only routes so the salon frontend stays
// easy to navigate while role-specific dashboards remain protected behind the layout.
const publicRoutes = [
  { path: "/", element: <Home /> },
  { path: "/services", element: <ServicesPage /> },
  { path: "/about", element: <AboutPage /> },
  { path: "/contact", element: <ContactPage /> },
  { path: "/privacy-policy", element: <PrivacyPolicyPage /> },
  { path: "/terms-of-service", element: <TermsPage /> },
  { path: "/refund-policy", element: <RefundPolicyPage /> },
  { path: "/cancellation-policy", element: <CancellationPolicyPage /> },
];

const staffRoutes = [
  { path: "/admin-dashboard", element: <StaffDashboardPage /> },
  { path: "/branch-dashboard", element: <StaffDashboardPage /> },
  { path: "/reception-dashboard", element: <StaffDashboardPage /> },
  { path: "/pm-dashboard", element: <StaffDashboardPage /> },
  { path: "/cashier", element: <StaffDashboardPage /> },
  { path: "/admin/users", element: <AdminUsersPage /> },
  { path: "/admin/branch-inventory", element: <AdminBranchInventory /> },
  { path: "/billing", element: <AdminBillingHistory /> },
  { path: "/branches", element: <BranchPage /> },
  { path: "/staff", element: <SalaryManagement /> },
  { path: "/branch/services", element: <BranchServiceManagement /> },
  { path: "/branch/products", element: <BranchProductInventory /> },
  { path: "/branch/billing", element: <BranchBillingHistory /> },
  { path: "/branch/stock-requests", element: <BranchManagerStockApproval /> },
  { path: "/branch/staff", element: <BranchStaffManagement /> },
  { path: "/branch/appointments", element: <BranchAppointmentManagement /> },
  { path: "/pm/products", element: <ProductManagementPage /> },
  { path: "/pm/inventory", element: <ProductManagerInventoryPage /> },
  { path: "/cashier/pos", element: <POSPage /> },
  { path: "/cashier/appointments", element: <CashierAppointments /> },
  { path: "/cashier/history", element: <TransactionHistory /> },
  { path: "/reception/customers", element: <CustomerManagement /> },
  { path: "/reception/contact-messages", element: <ContactMessagesPage /> },
  { path: "/reception/appointments", element: <AppointmentManagement /> },
  { path: "/reports", element: <ReportsPage /> },
  { path: "/appointment-history", element: <AppointmentHistory /> },
  { path: "/service-history", element: <ServiceHistory /> },
  { path: "/stock-request-history", element: <StockRequestHistory /> },
];

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <div className="App">
            <Routes>
              <Route element={<PublicLayout />}>
                {publicRoutes.map(({ path, element }) => (
                  <Route key={path} path={path} element={element} />
                ))}
              </Route>

              <Route path="/login" element={<Login />} />

              <Route element={<StaffLayout />}>
                {staffRoutes.map(({ path, element }) => (
                  <Route key={path} path={path} element={element} />
                ))}
              </Route>
            </Routes>
          </div>
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
