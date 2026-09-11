import api from "./api";

export const getAlerts = async () => {
  const response = await api.get("/alerts");
  return response.data;
};

export const getCropAlerts = async (cropId) => {
  const response = await api.get(`/alerts/crop/${cropId}`);
  return response.data;
};

export const getAlert = async (alertId) => {
  const response = await api.get(`/alerts/${alertId}`);
  return response.data;
};

export const markAlertAsRead = async (alertId) => {
  const response = await api.patch(`/alerts/${alertId}/read`);
  return response.data;
};

export const resolveAlert = async (alertId) => {
  const response = await api.patch(`/alerts/${alertId}/resolve`);
  return response.data;
};