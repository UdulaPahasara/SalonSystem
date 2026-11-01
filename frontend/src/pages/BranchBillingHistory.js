import React from "react";
import AdminBillingHistory from "./AdminBillingHistory";
import { useAuth } from "../context/AuthContext";

export default function BranchBillingHistory() {
  const { branchId } = useAuth();
  return <AdminBillingHistory fixedBranchId={branchId} title="Branch Billing" subtitle="Sales and payments at your branch." />;
}
