import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = {
  analyzePhone: (phone, deepScan = false) =>
    axios.post(`${API}/analyze`, { phone, deep_scan: deepScan }),

  towerLookup: (mcc, mnc, lac, cid) =>
    axios.post(`${API}/tower/lookup`, { mcc, mnc, lac, cid }),

  areaSearch: (lat, lon, radius, mcc, mnc) =>
    axios.post(`${API}/area/search`, { lat, lon, radius, mcc: mcc || null, mnc: mnc || null }),

  getStats: () => axios.get(`${API}/stats`),

  getRecentAnalyses: () => axios.get(`${API}/stats/recent`),

  getTowers: (limit = 100, offset = 0) =>
    axios.get(`${API}/towers`, { params: { limit, offset } }),

  getSettings: () => axios.get(`${API}/settings`),

  updateSettings: (keys) => axios.post(`${API}/settings`, { keys }),

  getCacheStats: () => axios.get(`${API}/cache`),

  clearCache: (action) => axios.post(`${API}/cache/clear`, { action }),

  exportTowers: () => axios.get(`${API}/export/towers`),

  exportAnalyses: () => axios.get(`${API}/export/analyses`),
};

export default api;
