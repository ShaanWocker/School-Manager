/**
 * Timetable Service
 * Handles all timetable-related API calls
 */
import api from './api';

export const timetableService = {
  /**
   * Get all timetables with optional filters
   * @param {Object} params - Query parameters (academicYear, term, isActive)
   * @returns {Promise} Timetables list
   */
  getAll: async (params = {}) => {
    const response = await api.get('/timetables', { params });
    return response.data;
  },

  /**
   * Get timetable by ID (includes slots with subject, class, teacher)
   * @param {string} id - Timetable ID
   * @returns {Promise} Timetable details with slots
   */
  getById: async (id) => {
    const response = await api.get(`/timetables/${id}`);
    return response.data;
  },

  /**
   * Create a new timetable
   * @param {Object} timetableData - { name, academicYear, term, effectiveFrom, effectiveTo }
   * @returns {Promise} Created timetable
   */
  create: async (timetableData) => {
    const response = await api.post('/timetables', timetableData);
    return response.data;
  },

  /**
   * Delete a timetable
   * @param {string} id - Timetable ID
   * @returns {Promise} Deletion result
   */
  delete: async (id) => {
    const response = await api.delete(`/timetables/${id}`);
    return response.data;
  },

  /**
   * Add a slot to a timetable
   * @param {string} timetableId - Timetable ID
   * @param {Object} slotData - { dayOfWeek, periodNumber, startTime, endTime, subjectId, classId, teacherId, room }
   * @returns {Promise} Created slot
   */
  addSlot: async (timetableId, slotData) => {
    const response = await api.post(`/timetables/${timetableId}/slots`, slotData);
    return response.data;
  },

  /**
   * Update a timetable slot
   * @param {string} timetableId - Timetable ID
   * @param {string} slotId - Slot ID
   * @param {Object} slotData - Updated slot data
   * @returns {Promise} Updated slot
   */
  updateSlot: async (timetableId, slotId, slotData) => {
    const response = await api.put(`/timetables/${timetableId}/slots/${slotId}`, slotData);
    return response.data;
  },

  /**
   * Delete a timetable slot
   * @param {string} timetableId - Timetable ID
   * @param {string} slotId - Slot ID
   * @returns {Promise} Deletion result
   */
  deleteSlot: async (timetableId, slotId) => {
    const response = await api.delete(`/timetables/${timetableId}/slots/${slotId}`);
    return response.data;
  },

  /**
   * Get slots for a specific class
   * @param {string} timetableId - Timetable ID
   * @param {string} classId - Class ID
   * @returns {Promise} Filtered slots for the class
   */
  getSlotsByClass: async (timetableId, classId) => {
    const response = await api.get(`/timetables/${timetableId}`, {
      params: { classId }
    });
    const data = response.data?.data || response.data;
    const slots = data?.slots || [];
    return slots.filter(s => s.classId === classId);
  },

  /**
   * Get slots for a specific teacher
   * @param {string} timetableId - Timetable ID
   * @param {string} teacherId - Teacher ID
   * @returns {Promise} Filtered slots for the teacher
   */
  getSlotsByTeacher: async (timetableId, teacherId) => {
    const response = await api.get(`/timetables/${timetableId}`, {
      params: { teacherId }
    });
    const data = response.data?.data || response.data;
    const slots = data?.slots || [];
    return slots.filter(s => s.teacherId === teacherId);
  },

  /**
   * Check for scheduling conflicts before saving a slot (real-time validation)
   * @param {string} timetableId - Timetable ID
   * @param {Object} params - { teacherId, classId, dayOfWeek, periodNumber, room?, excludeSlotId? }
   * @returns {Promise<{conflicts: Array, hasConflicts: boolean}>}
   */
  checkConflicts: async (timetableId, params) => {
    const response = await api.post(`/timetables/${timetableId}/check-conflicts`, params);
    return response.data;
  },

  /**
   * Update a timetable (name, academic year, term, etc.)
   * @param {string} id - Timetable ID
   * @param {Object} data - Fields to update
   * @returns {Promise} Updated timetable
   */
  update: async (id, data) => {
    const response = await api.put(`/timetables/${id}`, data);
    return response.data;
  }
};

export default timetableService;
