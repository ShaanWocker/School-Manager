/**
 * Exam Service
 * Handles all exam-related API calls
 */
import api from './api';

export const examService = {
  /**
   * Get all exams with optional filters
   * @param {Object} params - Query parameters (page, limit, search, class, subject)
   * @returns {Promise} Exams list with pagination
   */
  getAll: async (params = {}) => {
    const response = await api.get('/exams', { params });
    return response.data;
  },

  /**
   * Get exam by ID
   * @param {string} id - Exam ID
   * @returns {Promise} Exam details with questions
   */
  getById: async (id) => {
    const response = await api.get(`/exams/${id}`);
    return response.data;
  },

  /**
   * Create new exam
   * @param {Object} examData - Exam data
   * @returns {Promise} Created exam
   */
  create: async (examData) => {
    const response = await api.post('/exams', examData);
    return response.data;
  },

  /**
   * Update exam
   * @param {string} id - Exam ID
   * @param {Object} examData - Updated data
   * @returns {Promise} Updated exam
   */
  update: async (id, examData) => {
    const response = await api.put(`/exams/${id}`, examData);
    return response.data;
  },

  /**
   * Delete exam
   * @param {string} id - Exam ID
   * @returns {Promise} Deletion result
   */
  delete: async (id) => {
    const response = await api.delete(`/exams/${id}`);
    return response.data;
  },

  /**
   * Add a question to an exam
   * @param {string} examId - Exam ID
   * @param {Object} questionData - Question data
   * @returns {Promise} Created question
   */
  addQuestion: async (examId, questionData) => {
    const response = await api.post(`/exams/${examId}/questions`, questionData);
    return response.data;
  },

  /**
   * Update a question
   * @param {string} questionId - Question ID
   * @param {Object} questionData - Updated question data
   * @returns {Promise} Updated question
   */
  updateQuestion: async (questionId, questionData) => {
    const response = await api.put(`/exams/questions/${questionId}`, questionData);
    return response.data;
  },

  /**
   * Delete a question
   * @param {string} questionId - Question ID
   * @returns {Promise} Deletion result
   */
  deleteQuestion: async (questionId) => {
    const response = await api.delete(`/exams/questions/${questionId}`);
    return response.data;
  },

  /**
   * Start an exam attempt
   * @param {string} id - Exam ID
   * @returns {Promise} Exam attempt details
   */
  startExam: async (id) => {
    const response = await api.post(`/exams/${id}/start`);
    return response.data;
  },

  /**
   * Submit exam answers
   * @param {string} id - Exam ID
   * @param {Array} answers - Array of answers
   * @returns {Promise} Submission result
   */
  submitExam: async (id, answers) => {
    const response = await api.post(`/exams/${id}/submit`, { answers });
    return response.data;
  },

  /**
   * Grade an exam attempt
   * @param {string} examId - Exam ID
   * @param {string} attemptId - Attempt ID
   * @param {Object} gradeData - Grade data
   * @returns {Promise} Graded attempt
   */
  gradeAttempt: async (examId, attemptId, gradeData) => {
    const response = await api.post(`/exams/${examId}/grade/${attemptId}`, gradeData);
    return response.data;
  }
};

export default examService;
