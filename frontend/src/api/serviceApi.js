import api from "./client";

export const getServicesByBranch = async (branchId) => {
  const response = await api.get(`/services/branch/${branchId}`);
  return response.data;
};

export const getAllServices = async () => {
  const response = await api.get("/services");
  return response.data;
};

export const createService = async (service) => {
  const response = await api.post("/services", service);
  return response.data;
};

export const updateService = async (id, service) => {
  const response = await api.put(`/services/${id}`, service);
  return response.data;
};

export const deleteService = async (id) => {
  await api.delete(`/services/${id}`);
};
