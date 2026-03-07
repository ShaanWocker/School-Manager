/**
 * Teacher Service
 * Handles all teacher-related API calls
 */
import api from './api';

export const teacherService = {
  /**
   * Get all teachers with optional filters
   * @param {Object} params - Query parameters (page, limit, search, subject)
   * @returns {Promise} Teachers list with pagination
   */
  getAll: async (params = {}) => {
    const response = await api.get('/teachers', { params });
    return response.data;
  },

  /**
   * Get teacher by ID
   * @param {string} id - Teacher ID
   * @returns {Promise} Teacher details with relations
   */
  getById: async (id) => {
    const response = await api.get(`/teachers/${id}`);
    return response.data;
  },

  /**
   * Create new teacher
   * @param {Object} teacherData - Teacher data
   * @returns {Promise} Created teacher
   */
  create: async (teacherData) => {
    const response = await api.post('/teachers', teacherData);
    return response.data;
  },

  /**
   * Update teacher
   * @param {string} id - Teacher ID
   * @param {Object} teacherData - Updated data
   * @returns {Promise} Updated teacher
   */
  update: async (id, teacherData) => {
    const response = await api.put(`/teachers/${id}`, teacherData);
    return response.data;
  },

  /**
   * Delete teacher (soft delete)
   * @param {string} id - Teacher ID
   * @returns {Promise} Deletion result
   */
  delete: async (id) => {
    const response = await api.delete(`/teachers/${id}`);
    return response.data;
  },

  /**
   * Export teachers to CSV
   * @returns {Promise} CSV file download
   */
  exportCSV: async () => {
    const response = await api.get('/teachers/export/csv', {
      responseType: 'blob'
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `teachers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return response.data;
  },

  /**
   * Get teacher's assigned classes
   * @param {string} id - Teacher ID
   * @returns {Promise} List of classes
   */
  getClasses: async (id) => {
    const response = await api.get(`/teachers/${id}/classes`);
    return response.data;
  },

  /**
   * Get all students taught by teacher
   * @param {string} id - Teacher ID
   * @returns {Promise} List of students
   */
  getStudents: async (id) => {
    const response = await api.get(`/teachers/${id}/students`);
    return response.data;
  }
};

export default teacherService;
