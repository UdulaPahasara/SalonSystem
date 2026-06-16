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

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <div className="App">
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/terms-of-service" element={<TermsPage />} />
                <Route path="/refund-policy" element={<RefundPolicyPage />} />
                <Route path="/cancellation-policy" element={<CancellationPolicyPage />} />
              </Route>

              <Route path="/login" element={<Login />} />

              <Route element={<StaffLayout />}>
                <Route path="/admin-dashboard" element={<StaffDashboardPage />} />
                <Route path="/branch-dashboard" element={<StaffDashboardPage />} />
                <Route path="/reception-dashboard" element={<StaffDashboardPage />} />
                <Route path="/pm-dashboard" element={<StaffDashboardPage />} />
                <Route path="/cashier" element={<StaffDashboardPage />} />

                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/branch-inventory" element={<AdminBranchInventory />} />
                <Route path="/billing" element={<AdminBillingHistory />} />
                <Route path="/branches" element={<BranchPage />} />
                <Route path="/staff" element={<SalaryManagement />} />

                <Route path="/branch/services" element={<BranchServiceManagement />} />
                <Route path="/branch/products" element={<BranchProductInventory />} />
                <Route path="/branch/billing" element={<BranchBillingHistory />} />
                <Route path="/branch/stock-requests" element={<BranchManagerStockApproval />} />
                <Route path="/branch/staff" element={<BranchStaffManagement />} />
                <Route path="/branch/appointments" element={<BranchAppointmentManagement />} />

                <Route path="/pm/products" element={<ProductManagementPage />} />
                <Route path="/pm/inventory" element={<ProductManagerInventoryPage />} />

                <Route path="/cashier/pos" element={<POSPage />} />
                <Route path="/cashier/appointments" element={<CashierAppointments />} />
                <Route path="/cashier/history" element={<TransactionHistory />} />

                <Route path="/reception/customers" element={<CustomerManagement />} />
                <Route path="/reception/contact-messages" element={<ContactMessagesPage />} />
                <Route path="/reception/appointments" element={<AppointmentManagement />} />

                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/appointment-history" element={<AppointmentHistory />} />
                <Route path="/service-history" element={<ServiceHistory />} />
                <Route path="/stock-request-history" element={<StockRequestHistory />} />
              </Route>
            </Routes>
          </div>
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
