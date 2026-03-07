/**
 * Class Service
 * Handles all class-related API calls
 */
import api from './api';

export const classService = {
  /**
   * Get all classes with optional filters
   * @param {Object} params - Query parameters (page, limit, search, grade)
   * @returns {Promise} Classes list with pagination
   */
  getAll: async (params = {}) => {
    const response = await api.get('/classes', { params });
    return response.data;
  },

  /**
   * Get class by ID
   * @param {string} id - Class ID
   * @returns {Promise} Class details with relations
   */
  getById: async (id) => {
    const response = await api.get(`/classes/${id}`);
    return response.data;
  },

  /**
   * Create new class
   * @param {Object} classData - Class data
   * @returns {Promise} Created class
   */
  create: async (classData) => {
    const response = await api.post('/classes', classData);
    return response.data;
  },

  /**
   * Update class
   * @param {string} id - Class ID
   * @param {Object} classData - Updated data
   * @returns {Promise} Updated class
   */
  update: async (id, classData) => {
    const response = await api.put(`/classes/${id}`, classData);
    return response.data;
  },

  /**
   * Delete class
   * @param {string} id - Class ID
   * @returns {Promise} Deletion result
   */
  delete: async (id) => {
    const response = await api.delete(`/classes/${id}`);
    return response.data;
  },

  /**
   * Get all students in a class
   * @param {string} id - Class ID
   * @returns {Promise} List of students
   */
  getStudents: async (id) => {
    const response = await api.get(`/classes/${id}/students`);
    return response.data;
  },

  /**
   * Get timetable for a class
   * @param {string} id - Class ID
   * @returns {Promise} Class timetable
   */
  getTimetable: async (id) => {
    const response = await api.get(`/classes/${id}/timetable`);
    return response.data;
  },

  /**
   * Enroll a student in a class
   * @param {string} classId - Class ID
   * @param {string} studentId - Student ID
   * @returns {Promise} Enrollment result
   */
  enrollStudent: async (classId, studentId) => {
    const response = await api.post(`/classes/${classId}/students`, { studentId });
    return response.data;
  },

  /**
   * Remove a student from a class
   * @param {string} classId - Class ID
   * @param {string} studentId - Student ID
   * @returns {Promise} Removal result
   */
  removeStudent: async (classId, studentId) => {
    const response = await api.delete(`/classes/${classId}/students/${studentId}`);
    return response.data;
  }
};

export default classService;
