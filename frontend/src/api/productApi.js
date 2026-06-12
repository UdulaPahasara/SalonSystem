import axios from "axios";

const BASE = "http://localhost:8081/salon-app/api";

// Get all products (for Owner/Admin)
export const getProducts = () =>
  axios.get(`${BASE}/products`).then(res => res.data);

// Get products filtered by Product Manager's branches
export const getProductsByManager = (userId) =>
  axios.get(`${BASE}/products/by-manager/${userId}`).then(res => res.data);

export const createProduct = (data) =>
  axios.post(`${BASE}/products`, data);

export const updateProduct = (id, data) =>
  axios.put(`${BASE}/products/${id}`, data);

export const deleteProduct = (id) =>
  axios.delete(`${BASE}/products/${id}`);

// Get inventory for all branches (for Owner/Admin)
export const getInventoryByProduct = (productId) =>
  axios.get(`${BASE}/inventory/product/${productId}`)
       .then(res => res.data);

// Get inventory filtered by Product Manager's branches
export const getInventoryByProductAndManager = (productId, userId) =>
  axios.get(`${BASE}/inventory/product/${productId}/manager/${userId}`)
       .then(res => res.data);

       