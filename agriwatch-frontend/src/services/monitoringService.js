import api from "./api";

export const getMonitoringRecords = async () => {
  const response = await api.get("/monitoring/");
  return response.data;
};

export const getCropMonitoring = async (cropId) => {
  const response = await api.get(`/monitoring/crop/${cropId}`);
  return response.data;
};

export const getMonitoringRecord = async (monitoringId) => {
  const response = await api.get(`/monitoring/${monitoringId}`);
  return response.data;
};

export const createMonitoringRecord = async (data) => {
  const response = await api.post("/monitoring/", data);
  return response.data;
};

export const deleteMonitoringRecord = async (monitoringId) => {
  const response = await api.delete(`/monitoring/${monitoringId}`);
  return response.data;
};