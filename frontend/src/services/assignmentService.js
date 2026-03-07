/**
 * Assignment Service
 * Handles all assignment-related API calls
 */
import api from './api';

export const assignmentService = {
  /**
   * Get all assignments with optional filters
   * @param {Object} params - Query parameters (page, limit, search, class, subject)
   * @returns {Promise} Assignments list with pagination
   */
  getAll: async (params = {}) => {
    const response = await api.get('/assignments', { params });
    return response.data;
  },

  /**
   * Get assignment by ID
   * @param {string} id - Assignment ID
   * @returns {Promise} Assignment details
   */
  getById: async (id) => {
    const response = await api.get(`/assignments/${id}`);
    return response.data;
  },

  /**
   * Create new assignment
   * @param {Object} assignmentData - Assignment data
   * @returns {Promise} Created assignment
   */
  create: async (assignmentData) => {
    const response = await api.post('/assignments', assignmentData);
    return response.data;
  },

  /**
   * Update assignment
   * @param {string} id - Assignment ID
   * @param {Object} assignmentData - Updated data
   * @returns {Promise} Updated assignment
   */
  update: async (id, assignmentData) => {
    const response = await api.put(`/assignments/${id}`, assignmentData);
    return response.data;
  },

  /**
   * Delete assignment
   * @param {string} id - Assignment ID
   * @returns {Promise} Deletion result
   */
  delete: async (id) => {
    const response = await api.delete(`/assignments/${id}`);
    return response.data;
  },

  /**
   * Get all submissions for an assignment
   * @param {string} id - Assignment ID
   * @returns {Promise} List of submissions
   */
  getSubmissions: async (id) => {
    const response = await api.get(`/assignments/${id}/submissions`);
    return response.data;
  },

  /**
   * Submit an assignment
   * @param {string} id - Assignment ID
   * @param {Object} submissionData - Submission data
   * @returns {Promise} Submission result
   */
  submitAssignment: async (id, submissionData) => {
    const response = await api.post(`/assignments/${id}/submit`, submissionData);
    return response.data;
  },

  /**
   * Grade a submission
   * @param {string} submissionId - Submission ID
   * @param {Object} gradeData - Grade and feedback data
   * @returns {Promise} Graded submission
   */
  gradeSubmission: async (submissionId, gradeData) => {
    const response = await api.put(`/assignments/submissions/${submissionId}/grade`, gradeData);
    return response.data;
  },

  /**
   * Upload a file for an assignment submission
   * @param {File} file - File to upload
   * @returns {Promise} Uploaded file info
   */
  uploadSubmission: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/assignments/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};

export default assignmentService;
