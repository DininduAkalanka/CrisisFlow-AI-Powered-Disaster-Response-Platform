import axios from 'axios';

const API_BASE_URL = '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Incidents API
export const incidentAPI = {
  // Create new incident with image
  create: async (data, image = null) => {
    const formData = new FormData();
    formData.append('latitude', data.latitude);
    formData.append('longitude', data.longitude);
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('incident_type', data.incident_type);
    
    if (data.reporter_name) {
      formData.append('reporter_name', data.reporter_name);
    }
    if (data.reporter_contact) {
      formData.append('reporter_contact', data.reporter_contact);
    }
    if (image) {
      formData.append('image', image);
    }
    
    const response = await axios.post(`${API_BASE_URL}/incidents/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // List incidents with filters
  list: async (params = {}) => {
    const response = await api.get('/incidents/', { params });
    return response.data;
  },

  // Get single incident
  get: async (id) => {
    const response = await api.get(`/incidents/${id}`);
    return response.data;
  },

  // Update incident
  update: async (id, data) => {
    const response = await api.patch(`/incidents/${id}`, data);
    return response.data;
  },

  // Verify incident
  verify: async (id, verified, notes = null) => {
    const response = await api.post(`/incidents/${id}/verify`, null, {
      params: { verified, notes },
    });
    return response.data;
  },

  // Delete incident
  delete: async (id) => {
    const response = await api.delete(`/incidents/${id}`);
    return response.data;
  },
};

// Dashboard API
export const dashboardAPI = {
  // Get statistics
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  // Get clusters
  getClusters: async () => {
    const response = await api.get('/dashboard/clusters');
    return response.data;
  },

  // Get heatmap data
  getHeatmap: async (hours = 24) => {
    const response = await api.get('/dashboard/heatmap', { params: { hours } });
    return response.data;
  },

  // Get timeline
  getTimeline: async (days = 7) => {
    const response = await api.get('/dashboard/timeline', { params: { days } });
    return response.data;
  },

  // Get top areas
  getTopAreas: async (limit = 10, hours = 24) => {
    const response = await api.get('/dashboard/top-areas', { params: { limit, hours } });
    return response.data;
  },
};

// AI API
export const aiAPI = {
  // Analyze image
  analyzeImage: async (image) => {
    const formData = new FormData();
    formData.append('image', image);
    
    const response = await axios.post(`${API_BASE_URL}/ai/analyze-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Analyze text
  analyzeText: async (text) => {
    const response = await api.post('/ai/analyze-text', null, {
      params: { text },
    });
    return response.data;
  },

  // Get models status
  getModelsStatus: async () => {
    const response = await api.get('/ai/models/status');
    return response.data;
  },

  // Load models
  loadModels: async () => {
    const response = await api.post('/ai/models/load');
    return response.data;
  },
};

export default api;
