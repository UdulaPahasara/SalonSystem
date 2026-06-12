import axios from "axios";

const BASE = "http://localhost:8081/salon-app/api";

// Named exports
export const createStockRequest = (data) => {
  return axios.post(`${BASE}/stock-requests`, data);
};

export const getStockRequestsByBranch = (branchId) => {
  return axios.get(`${BASE}/stock-requests/branch/${branchId}`);
};

export const getAllStockRequests = () => {
  return axios.get(`${BASE}/stock-requests`);
};

export const approveStockRequest = (id) => {
  return axios.put(`${BASE}/stock-requests/${id}/approve`);
};

export const rejectStockRequest = (id) => {
  return axios.put(`${BASE}/stock-requests/${id}/reject`);
};

// Default export (optional)
const stockRequestApi = {
  createStockRequest,
  getStockRequestsByBranch,
  approveStockRequest,
  rejectStockRequest
};

export default stockRequestApi;