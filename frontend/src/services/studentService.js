import api from './api';

export const studentService = {
  // Get all students with pagination, search, filter
  getAll: async (params = {}) => {
    const response = await api.get('/students', { params });
    return response.data;
  },

  // Get student by ID
  getById: async (id) => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },

  // Create new student
  create: async (studentData) => {
    const response = await api.post('/students', studentData);
    return response.data;
  },

  // Update student
  update: async (id, studentData) => {
    const response = await api.put(`/students/${id}`, studentData);
    return response.data;
  },

  // Delete student
  delete: async (id) => {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  },

  // Export students to CSV
  exportCSV: async () => {
    const response = await api.get('/students/export/csv', {
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `students_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return response.data;
  },

  // Get student performance
  getPerformance: async (id, params = {}) => {
    const response = await api.get(`/students/${id}/performance`, { params });
    return response.data;
  }
};

export default studentService;
