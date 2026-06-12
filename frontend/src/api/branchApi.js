import axios from 'axios';

const API_URL = "http://localhost:8081/salon-app/api/branches";

const getAuthHeader = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    return user && user.token ? { Authorization: `Bearer ${user.token}` } : {};
};

export const getBranches = async () => {
    const response = await axios.get(API_URL, {
        headers: getAuthHeader()
    });
    return response.data;
};
