import api from "./api";


// =====================================================
// GET FARMS
// =====================================================

export const getFarms = async () => {
  const response = await api.get("/farms");

  return response.data;
};


// =====================================================
// GET SINGLE FARM
// =====================================================

export const getFarm = async (farmId) => {
  const response = await api.get(
    `/farms/${farmId}`
  );

  return response.data;
};


// =====================================================
// CREATE FARM
// =====================================================

export const createFarm = async (farmData) => {
  const response = await api.post(
    "/farms",
    farmData
  );

  return response.data;
};


// =====================================================
// UPDATE FARM
// =====================================================

export const updateFarm = async (
  farmId,
  farmData
) => {
  const response = await api.put(
    `/farms/${farmId}`,
    farmData
  );

  return response.data;
};


// =====================================================
// DELETE FARM
// =====================================================

export const deleteFarm = async (farmId) => {
  const response = await api.delete(
    `/farms/${farmId}`
  );

  return response.data;
};