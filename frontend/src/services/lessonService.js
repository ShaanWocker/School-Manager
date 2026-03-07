/**
 * Lesson Service
 * Handles all lesson-related API calls
 */
import api from './api';

export const lessonService = {
  /**
   * Get all lessons with optional filters
   * @param {Object} params - Query parameters (page, limit, search, subject)
   * @returns {Promise} Lessons list with pagination
   */
  getAll: async (params = {}) => {
    const response = await api.get('/lessons', { params });
    return response.data;
  },

  /**
   * Get lesson by ID
   * @param {string} id - Lesson ID
   * @returns {Promise} Lesson details
   */
  getById: async (id) => {
    const response = await api.get(`/lessons/${id}`);
    return response.data;
  },

  /**
   * Create new lesson
   * @param {Object} lessonData - Lesson data
   * @returns {Promise} Created lesson
   */
  create: async (lessonData) => {
    const response = await api.post('/lessons', lessonData);
    return response.data;
  },

  /**
   * Update lesson
   * @param {string} id - Lesson ID
   * @param {Object} lessonData - Updated data
   * @returns {Promise} Updated lesson
   */
  update: async (id, lessonData) => {
    const response = await api.put(`/lessons/${id}`, lessonData);
    return response.data;
  },

  /**
   * Delete lesson
   * @param {string} id - Lesson ID
   * @returns {Promise} Deletion result
   */
  delete: async (id) => {
    const response = await api.delete(`/lessons/${id}`);
    return response.data;
  },

  /**
   * Publish a lesson
   * @param {string} id - Lesson ID
   * @returns {Promise} Published lesson
   */
  publish: async (id) => {
    const response = await api.put(`/lessons/${id}/publish`);
    return response.data;
  },

  /**
   * Get lesson progress for current user
   * @param {string} id - Lesson ID
   * @returns {Promise} Progress data
   */
  getProgress: async (id) => {
    const response = await api.get(`/lessons/${id}/progress`);
    return response.data;
  },

  /**
   * Increment view count for a lesson
   * @param {string} id - Lesson ID
   * @returns {Promise} Updated view count
   */
  incrementView: async (id) => {
    const response = await api.post(`/lessons/${id}/view`);
    return response.data;
  },

  /**
   * Upload a file for a lesson
   * @param {File} file - File to upload
   * @param {string} type - File type (video, document, etc.)
   * @returns {Promise} Uploaded file info
   */
  uploadFile: async (file, type) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await api.post('/lessons/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};

export default lessonService;
