/**
 * Fee Service
 * Handles all fee-related API calls
 */
import api from './api';

export const feeService = {
  /**
   * Get all fees with optional filters
   * @param {Object} params - Query parameters (page, limit, search, status)
   * @returns {Promise} Fees list with pagination
   */
  getAll: async (params = {}) => {
    const response = await api.get('/fees', { params });
    return response.data;
  },

  /**
   * Get fee by ID
   * @param {string} id - Fee ID
   * @returns {Promise} Fee details
   */
  getById: async (id) => {
    const response = await api.get(`/fees/${id}`);
    return response.data;
  },

  /**
   * Create new fee
   * @param {Object} feeData - Fee data
   * @returns {Promise} Created fee
   */
  create: async (feeData) => {
    const response = await api.post('/fees', feeData);
    return response.data;
  },

  /**
   * Update fee
   * @param {string} id - Fee ID
   * @param {Object} feeData - Updated data
   * @returns {Promise} Updated fee
   */
  update: async (id, feeData) => {
    const response = await api.put(`/fees/${id}`, feeData);
    return response.data;
  },

  /**
   * Delete fee
   * @param {string} id - Fee ID
   * @returns {Promise} Deletion result
   */
  delete: async (id) => {
    const response = await api.delete(`/fees/${id}`);
    return response.data;
  },

  /**
   * Get all fees for a specific student
   * @param {string} studentId - Student ID
   * @returns {Promise} Student fees
   */
  getStudentFees: async (studentId) => {
    const response = await api.get(`/fees/student/${studentId}`);
    return response.data;
  },

  /**
   * Get all outstanding (unpaid) fees
   * @returns {Promise} Outstanding fees list
   */
  getOutstandingFees: async () => {
    const response = await api.get('/fees/outstanding');
    return response.data;
  }
};

export default feeService;
