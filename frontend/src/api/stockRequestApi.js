import api from "./client";

export const createStockRequest = (data) => api.post("/stock-requests", data);

export const getStockRequestsByBranch = (branchId) =>
  api.get(`/stock-requests/branch/${branchId}`);

export const getAllStockRequests = () => api.get("/stock-requests");

export const approveStockRequest = (id) =>
  api.put(`/stock-requests/${id}/approve`);

export const rejectStockRequest = (id) =>
  api.put(`/stock-requests/${id}/reject`);

const stockRequestApi = {
  createStockRequest,
  getStockRequestsByBranch,
  approveStockRequest,
  rejectStockRequest,
};

export default stockRequestApi;
