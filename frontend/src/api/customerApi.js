import api from "./client";

export const getAllCustomers = async (branchId) => {
  const params = branchId ? { branchId } : {};
  const response = await api.get("/customers", { params });
  return response.data;
};

export const createCustomer = async (customer) => {
  const response = await api.post("/customers", customer);
  return response.data;
};

export const getCustomerByPhone = async (phone) => {
  const response = await api.get("/customers/search", { params: { phone } });
  return response.data;
};

export const updateCustomer = async (id, customer) => {
  const response = await api.put(`/customers/${id}`, customer);
  return response.data;
};

export const deleteCustomer = async (id) => {
  await api.delete(`/customers/${id}`);
};
