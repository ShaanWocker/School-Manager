import api from './api';

const dashboardService = {
  // Get dashboard summary statistics (admin/super-admin)
  getSummary: async () => {
    const response = await api.get('/dashboard/summary');
    return response.data;
  },
};

export default dashboardService;
