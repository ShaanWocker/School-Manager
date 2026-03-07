/**
 * Payment Service
 * Handles all payment-related API calls
 */
import api from './api';

export const paymentService = {
  /**
   * Get all payments with optional filters
   * @param {Object} params - Query parameters (page, limit, search, status)
   * @returns {Promise} Payments list with pagination
   */
  getAll: async (params = {}) => {
    const response = await api.get('/payments', { params });
    return response.data;
  },

  /**
   * Get payment by ID
   * @param {string} id - Payment ID
   * @returns {Promise} Payment details
   */
  getById: async (id) => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  /**
   * Create new payment
   * @param {Object} paymentData - Payment data
   * @returns {Promise} Created payment
   */
  create: async (paymentData) => {
    const response = await api.post('/payments', paymentData);
    return response.data;
  },

  /**
   * Update payment
   * @param {string} id - Payment ID
   * @param {Object} paymentData - Updated data
   * @returns {Promise} Updated payment
   */
  update: async (id, paymentData) => {
    const response = await api.put(`/payments/${id}`, paymentData);
    return response.data;
  },

  /**
   * Delete payment
   * @param {string} id - Payment ID
   * @returns {Promise} Deletion result
   */
  delete: async (id) => {
    const response = await api.delete(`/payments/${id}`);
    return response.data;
  },

  /**
   * Get all payments for a specific student
   * @param {string} studentId - Student ID
   * @returns {Promise} Student payments
   */
  getStudentPayments: async (studentId) => {
    const response = await api.get(`/payments/student/${studentId}`);
    return response.data;
  },

  /**
   * Get outstanding balance for a student
   * @param {string} studentId - Student ID
   * @returns {Promise} Student balance details
   */
  getStudentBalance: async (studentId) => {
    const response = await api.get(`/payments/student/${studentId}/balance`);
    return response.data;
  },

  /**
   * Process a refund for a payment
   * @param {string} id - Payment ID
   * @returns {Promise} Refund result
   */
  processRefund: async (id) => {
    const response = await api.post(`/payments/${id}/refund`);
    return response.data;
  }
};

export default paymentService;
