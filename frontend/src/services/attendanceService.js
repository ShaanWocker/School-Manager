/**
 * Attendance Service
 * Handles all attendance-related API calls
 */
import api from './api';

export const attendanceService = {
  /**
   * Get all attendance records with optional filters
   * @param {Object} params - Query parameters (page, limit, search, class, date)
   * @returns {Promise} Attendance records list with pagination
   */
  getAll: async (params = {}) => {
    const response = await api.get('/attendance', { params });
    return response.data;
  },

  /**
   * Get attendance record by ID
   * @param {string} id - Attendance ID
   * @returns {Promise} Attendance record details
   */
  getById: async (id) => {
    const response = await api.get(`/attendance/${id}`);
    return response.data;
  },

  /**
   * Create new attendance record
   * @param {Object} attendanceData - Attendance data
   * @returns {Promise} Created attendance record
   */
  create: async (attendanceData) => {
    const response = await api.post('/attendance', attendanceData);
    return response.data;
  },

  /**
   * Update attendance record
   * @param {string} id - Attendance ID
   * @param {Object} attendanceData - Updated data
   * @returns {Promise} Updated attendance record
   */
  update: async (id, attendanceData) => {
    const response = await api.put(`/attendance/${id}`, attendanceData);
    return response.data;
  },

  /**
   * Delete attendance record
   * @param {string} id - Attendance ID
   * @returns {Promise} Deletion result
   */
  delete: async (id) => {
    const response = await api.delete(`/attendance/${id}`);
    return response.data;
  },

  /**
   * Mark attendance in bulk for a class on a given date
   * @param {string} classId - Class ID
   * @param {string} date - Date (ISO format)
   * @param {Array} attendanceList - Array of attendance records per student
   * @returns {Promise} Bulk attendance result
   */
  markBulkAttendance: async (classId, date, attendanceList) => {
    const response = await api.post('/attendance/bulk', { classId, date, attendanceList });
    return response.data;
  },

  /**
   * Get attendance summary for a specific student
   * @param {string} studentId - Student ID
   * @returns {Promise} Student attendance summary
   */
  getStudentSummary: async (studentId) => {
    const response = await api.get(`/attendance/student/${studentId}/summary`);
    return response.data;
  },

  /**
   * Get attendance records for a class on a specific date
   * @param {string} classId - Class ID
   * @param {string} date - Date (ISO format)
   * @returns {Promise} Class attendance for the date
   */
  getClassAttendance: async (classId, date) => {
    const response = await api.get(`/attendance/class/${classId}`, { params: { date } });
    return response.data;
  },

  /**
   * Generate an attendance report
   * @param {Object} params - Report parameters (classId, startDate, endDate, format)
   * @returns {Promise} Generated report
   */
  generateReport: async (params = {}) => {
    const response = await api.get('/attendance/report', { params });
    return response.data;
  }
};

export default attendanceService;
