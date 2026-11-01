import React from "react";
import AdminBillingHistory from "./AdminBillingHistory";
import { useAuth } from "../context/AuthContext";

export default function TransactionHistory() {
  const { branchId } = useAuth();
  return <AdminBillingHistory fixedBranchId={branchId} title="Transaction History" subtitle="Completed checkouts at your branch." />;
}
