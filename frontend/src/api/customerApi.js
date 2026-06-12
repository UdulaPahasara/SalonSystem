import axios from "axios";

const API_URL = "http://localhost:8081/salon-app/api/customers";

export const getAllCustomers = async (branchId) => {
    const params = branchId ? { branchId } : {};
    const response = await axios.get(API_URL, { params });
    return response.data;
};

export const createCustomer = async (customer) => {
    // customer object should now include branchId if needed
    const response = await axios.post(API_URL, customer);
    return response.data;
};

export const getCustomerByPhone = async (phone) => {
    const response = await axios.get(`${API_URL}/search`, { params: { phone } });
    return response.data;
};

export const updateCustomer = async (id, customer) => {
    const response = await axios.put(`${API_URL}/${id}`, customer);
    return response.data;
};

export const deleteCustomer = async (id) => {
    await axios.delete(`${API_URL}/${id}`);
};
