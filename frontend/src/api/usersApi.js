import api from "./client";

export const getUsers = () => api.get("/admin/users").then((r) => r.data);
export const getRoles = () => api.get("/admin/roles").then((r) => r.data);
export const createUser = (payload) =>
  api.post("/admin/users", payload).then((r) => r.data);
export const updateUser = (id, payload) =>
  api.put(`/admin/users/${id}`, payload).then((r) => r.data);
export const deleteUser = (id) =>
  api.delete(`/admin/users/${id}`).then((r) => r.data);
export const getUsersByBranch = (branchId) =>
  api.get(`/admin/branch/${branchId}/users`).then((r) => r.data);

export const login = (payload) =>
  api.post("/users/login", payload).then((r) => r.data);

export const getStaffSalaryStatus = (month, branchId) => {
  const params = { month };
  if (branchId) params.branchId = branchId;
  return api.get("/salary/staff-status", { params }).then((r) => r.data);
};

export const paySalary = (payload) =>
  api.post("/salary/pay", payload).then((r) => r.data);

export const updateBaseSalary = (payload) =>
  api.put("/salary/update-base", payload).then((r) => r.data);

export const getTransactionsByBranch = (branchId) =>
  api.get(`/transactions/branch/${branchId}`).then((r) => r.data);

export const getRevenueReport = (params) =>
  api.get("/reports/revenue", { params }).then((r) => r.data);

export const getTopProducts = (branchId) => {
  const params = branchId ? { branchId } : {};
  return api.get("/reports/top-products", { params }).then((r) => r.data);
};

export const getTopServices = (branchId) => {
  const params = branchId ? { branchId } : {};
  return api.get("/reports/top-services", { params }).then((r) => r.data);
};
