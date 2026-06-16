import "./App.css";
import { Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { isPublicPath } from "./utils/publicPaths";
import PublicLayout from "./components/public/PublicLayout";
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
import AdminDashBoard from "./pages/AdminDashBoard";
import AdminUsersPage from "./pages/AdminUsersPage";
import BranchManagerDashboard from "./pages/BranchManagerDashboard";
import BranchManagerStockApproval from "./pages/BranchManagerStockApproval";
import BranchPage from "./pages/BranchPage";
import ProductManagerDashboard from "./pages/ProductManagerDashboard";
import ProductManagementPage from "./pages/ProductManagementPage";
import ProductManagerInventoryPage from "./pages/ProductManagerInventoryPage";
import CashierDashboard from "./pages/CashierDashboard";
import POSPage from "./pages/POSPage";
import CashierAppointments from "./pages/CashierAppointments";
import CustomerManagement from "./pages/CustomerManagement";
import TransactionHistory from "./pages/TransactionHistory";
import ReceptionDashboard from "./pages/ReceptionDashboard";
import AppointmentManagement from "./pages/AppointmentManagement";
import BranchStaffManagement from "./pages/BranchStaffManagement";
import BranchAppointmentManagement from './pages/BranchAppointmentManagement';
import SalaryManagement from './pages/SalaryManagement';
import LogoutButton from './components/LogoutButton';
import BranchProductInventory from "./pages/BranchProductInventory";
import BranchServiceManagement from "./pages/BranchServiceManagement";
import BranchBillingHistory from "./pages/BranchBillingHistory";
import ReportsPage from "./pages/ReportsPage";
import AppointmentHistory from "./pages/AppointmentHistory";
import ServiceHistory from "./pages/ServiceHistory";
import StockRequestHistory from "./pages/StockRequestHistory";
import ContactMessagesPage from "./pages/ContactMessagesPage";

function AppContent() {
  const location = useLocation();
  const isPublicPage = isPublicPath(location.pathname);

  return (
    <div className="App">
      <LogoutButton />
      {!isPublicPage && <h1 className="app-page-title">Salon Management System</h1>}

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

          {/* Admin Routes */}
          <Route path="/admin-dashboard" element={<AdminDashBoard />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/branch-inventory" element={<AdminBranchInventory />} />
          <Route path="/billing" element={<AdminBillingHistory />} />
          <Route path="/branches" element={<BranchPage />} />
          <Route path="/staff" element={<SalaryManagement />} />

          {/* Branch Manager Routes */}
          <Route path="/branch-dashboard" element={<BranchManagerDashboard />} />
          <Route path="/branch/services" element={<BranchServiceManagement />} />
          <Route path="/branch/products" element={<BranchProductInventory />} />
          <Route path="/branch/billing" element={<BranchBillingHistory />} />
          <Route path="/branch/stock-requests" element={<BranchManagerStockApproval />} />
          <Route path="/branch/staff" element={<BranchStaffManagement />} />
          <Route path="/branch/appointments" element={<BranchAppointmentManagement />} />

          {/* Product Manager Routes */}
          <Route path="/pm-dashboard" element={<ProductManagerDashboard />} />
          <Route path="/pm/products" element={<ProductManagementPage />} />
          <Route path="/pm/inventory" element={<ProductManagerInventoryPage />} />

          {/* Cashier Routes */}
          <Route path="/cashier" element={<CashierDashboard />} />
          <Route path="/cashier/pos" element={<POSPage />} />
          <Route path="/cashier/appointments" element={<CashierAppointments />} />
          <Route path="/cashier/history" element={<TransactionHistory />} />

          {/* Reception Routes */}
          <Route path="/reception-dashboard" element={<ReceptionDashboard />} />
          <Route path="/reception/customers" element={<CustomerManagement />} />
          <Route path="/reception/contact-messages" element={<ContactMessagesPage />} />
          <Route path="/reception/appointments" element={<AppointmentManagement />} />

          {/* Reporting & History Views */}
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/appointment-history" element={<AppointmentHistory />} />
          <Route path="/service-history" element={<ServiceHistory />} />
          <Route path="/stock-request-history" element={<StockRequestHistory />} />

        </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
