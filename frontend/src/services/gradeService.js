/**
 * Grade Service
 * Handles all grade-related API calls
 */
import api from './api';

export const gradeService = {
  /**
   * Get all grades with optional filters
   * @param {Object} params - Query parameters (page, limit, search, student, subject)
   * @returns {Promise} Grades list with pagination
   */
  getAll: async (params = {}) => {
    const response = await api.get('/grades', { params });
    return response.data;
  },

  /**
   * Get grade by ID
   * @param {string} id - Grade ID
   * @returns {Promise} Grade details
   */
  getById: async (id) => {
    const response = await api.get(`/grades/${id}`);
    return response.data;
  },

  /**
   * Create new grade
   * @param {Object} gradeData - Grade data
   * @returns {Promise} Created grade
   */
  create: async (gradeData) => {
    const response = await api.post('/grades', gradeData);
    return response.data;
  },

  /**
   * Update grade
   * @param {string} id - Grade ID
   * @param {Object} gradeData - Updated data
   * @returns {Promise} Updated grade
   */
  update: async (id, gradeData) => {
    const response = await api.put(`/grades/${id}`, gradeData);
    return response.data;
  },

  /**
   * Delete grade
   * @param {string} id - Grade ID
   * @returns {Promise} Deletion result
   */
  delete: async (id) => {
    const response = await api.delete(`/grades/${id}`);
    return response.data;
  },

  /**
   * Get grades for a specific student
   * @param {string} studentId - Student ID
   * @param {Object} params - Query parameters (page, limit, subject, term)
   * @returns {Promise} Student grades
   */
  getByStudent: async (studentId, params = {}) => {
    const response = await api.get(`/grades/student/${studentId}`, { params });
    return response.data;
  },

  /**
   * Get grades for a specific student in a specific subject
   * @param {string} studentId - Student ID
   * @param {string} subjectId - Subject ID
   * @param {Object} params - Query parameters (page, limit, term)
   * @returns {Promise} Student subject grades
   */
  getBySubject: async (studentId, subjectId, params = {}) => {
    const response = await api.get(`/grades/student/${studentId}/subject/${subjectId}`, { params });
    return response.data;
  },

  /**
   * Get performance data for a class in a subject
   * @param {string} classId - Class ID
   * @param {string} subjectId - Subject ID
   * @returns {Promise} Class performance data
   */
  getClassPerformance: async (classId, subjectId) => {
    const response = await api.get(`/grades/class/${classId}/subject/${subjectId}/performance`);
    return response.data;
  },

  /**
   * Calculate grade averages for a student
   * @param {string} studentId - Student ID
   * @returns {Promise} Calculated averages
   */
  calculateAverages: async (studentId) => {
    const response = await api.get(`/grades/student/${studentId}/averages`);
    return response.data;
  }
};

export default gradeService;
