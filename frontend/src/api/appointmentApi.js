import axios from "axios";

const API_URL = "http://localhost:8081/salon-app/api/appointments";

export const getAllAppointments = async (branchId) => {
    const params = branchId ? { branchId } : {};
    const response = await axios.get(API_URL, { params });
    return response.data;
};

export const createAppointment = async (payload) => {
    const response = await axios.post(API_URL, payload);
    return response.data;
};

export const updateAppointment = async (id, payload) => {
    const response = await axios.put(`${API_URL}/${id}`, payload);
    return response.data;
};

export const deleteAppointment = async (id) => {
    await axios.delete(`${API_URL}/${id}`);
};
