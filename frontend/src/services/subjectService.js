/**
 * Subject Service
 * Handles all subject-related API calls
 */
import api from './api';

export const subjectService = {
  /**
   * Get all subjects with optional filters
   * @param {Object} params - Query parameters (page, limit, search)
   * @returns {Promise} Subjects list with pagination
   */
  getAll: async (params = {}) => {
    const response = await api.get('/subjects', { params });
    return response.data;
  },

  /**
   * Get subject by ID
   * @param {string} id - Subject ID
   * @returns {Promise} Subject details with relations
   */
  getById: async (id) => {
    const response = await api.get(`/subjects/${id}`);
    return response.data;
  },

  /**
   * Create new subject
   * @param {Object} subjectData - Subject data
   * @returns {Promise} Created subject
   */
  create: async (subjectData) => {
    const response = await api.post('/subjects', subjectData);
    return response.data;
  },

  /**
   * Update subject
   * @param {string} id - Subject ID
   * @param {Object} subjectData - Updated data
   * @returns {Promise} Updated subject
   */
  update: async (id, subjectData) => {
    const response = await api.put(`/subjects/${id}`, subjectData);
    return response.data;
  },

  /**
   * Delete subject
   * @param {string} id - Subject ID
   * @returns {Promise} Deletion result
   */
  delete: async (id) => {
    const response = await api.delete(`/subjects/${id}`);
    return response.data;
  },

  /**
   * Assign a teacher to a subject
   * @param {string} subjectId - Subject ID
   * @param {string} teacherId - Teacher ID
   * @returns {Promise} Assignment result
   */
  assignTeacher: async (subjectId, teacherId) => {
    const response = await api.post(`/subjects/${subjectId}/teachers`, { teacherId });
    return response.data;
  },

  /**
   * Remove a teacher from a subject
   * @param {string} subjectId - Subject ID
   * @param {string} teacherId - Teacher ID
   * @returns {Promise} Removal result
   */
  removeTeacher: async (subjectId, teacherId) => {
    const response = await api.delete(`/subjects/${subjectId}/teachers/${teacherId}`);
    return response.data;
  }
};

export default subjectService;
