import api from "./client";

export const getProducts = () =>
  api.get("/products").then((res) => res.data);

export const getProductsByManager = (userId) =>
  api.get(`/products/by-manager/${userId}`).then((res) => res.data);

export const createProduct = (data) => api.post("/products", data);

export const updateProduct = (id, data) => api.put(`/products/${id}`, data);

export const deleteProduct = (id) => api.delete(`/products/${id}`);

export const getInventoryByProduct = (productId) =>
  api.get(`/inventory/product/${productId}`).then((res) => res.data);

export const getInventoryByProductAndManager = (productId, userId) =>
  api
    .get(`/inventory/product/${productId}/manager/${userId}`)
    .then((res) => res.data);

export const getInventoryByBranch = (branchId) =>
  api.get(`/inventory/branch/${branchId}`).then((res) => res.data);
