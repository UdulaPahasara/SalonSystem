import React from "react";
import AdminBranchInventory from "./AdminBranchInventory";
import { useAuth } from "../context/AuthContext";

export default function BranchProductInventory() {
  const { branchId } = useAuth();
  return <AdminBranchInventory fixedBranchId={branchId} title="Branch Products" subtitle="Stock levels at your branch." />;
}
