import api from "./client";

export const getAllAppointments = async (branchId) => {
  const params = branchId ? { branchId } : {};
  const response = await api.get("/appointments", { params });
  return response.data;
};

export const createAppointment = async (payload) => {
  const response = await api.post("/appointments", payload);
  return response.data;
};

export const updateAppointment = async (id, payload) => {
  const response = await api.put(`/appointments/${id}`, payload);
  return response.data;
};

export const deleteAppointment = async (id) => {
  await api.delete(`/appointments/${id}`);
};
