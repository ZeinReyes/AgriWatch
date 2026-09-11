import api from "./api";

export const getCrops = async () => {
  const response = await api.get("/crops");
  return response.data;
};

export const getCrop = async (cropId) => {
  const response = await api.get(`/crops/${cropId}`);
  return response.data;
};

export const createCrop = async (cropData) => {
  const response = await api.post("/crops", cropData);
  return response.data;
};

export const updateCrop = async (cropId, cropData) => {
  const response = await api.put(
    `/crops/${cropId}`,
    cropData
  );

  return response.data;
};

export const deleteCrop = async (cropId) => {
  const response = await api.delete(`/crops/${cropId}`);
  return response.data;
};