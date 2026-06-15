import api from "./client";

export const getBranches = async () => {
  const response = await api.get("/branches");
  return response.data;
};

export const createBranch = async (branch) => {
  const response = await api.post("/branches", branch);
  return response.data;
};

export const updateBranch = async (id, branch) => {
  const response = await api.put(`/branches/${id}`, branch);
  return response.data;
};

export const deleteBranch = async (id) => {
  await api.delete(`/branches/${id}`);
};
