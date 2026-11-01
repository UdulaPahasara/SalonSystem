import api from "./client";

// Stylists, barbers and therapists (people who perform services, not login accounts).
export const getServiceStaff = (branchId) =>
  api.get("/staff", { params: branchId ? { branchId } : {} }).then((r) => r.data);
export const createServiceStaff = (payload) => api.post("/staff", payload).then((r) => r.data);
export const updateServiceStaff = (id, payload) => api.put(`/staff/${id}`, payload).then((r) => r.data);
export const deleteServiceStaff = (id) => api.delete(`/staff/${id}`);
