import api from "./client";

export const submitContactMessage = async (payload) => {
  const response = await api.post("/contact-messages", payload);
  return response.data;
};

export const getContactMessages = async () => {
  const response = await api.get("/contact-messages");
  return response.data;
};

export const deleteContactMessage = async (id) => {
  await api.delete(`/contact-messages/${id}`);
};
