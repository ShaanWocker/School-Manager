import api from './api';

export const registrationService = {
  // Create a full learner registration
  register: async (registrationData) => {
    const response = await api.post('/registrations', registrationData);
    return response.data;
  },

  // Get full registration dossier for a student
  getDossier: async (studentId) => {
    const response = await api.get(`/registrations/${studentId}`);
    return response.data;
  },

  // Update registration details
  update: async (studentId, data) => {
    const response = await api.put(`/registrations/${studentId}`, data);
    return response.data;
  },

  // Add guardian
  addGuardian: async (studentId, guardianData) => {
    const response = await api.post(`/registrations/${studentId}/guardians`, guardianData);
    return response.data;
  },

  // Remove guardian
  removeGuardian: async (studentId, guardianId) => {
    const response = await api.delete(`/registrations/${studentId}/guardians/${guardianId}`);
    return response.data;
  },

  // Add emergency contact
  addEmergencyContact: async (studentId, contactData) => {
    const response = await api.post(`/registrations/${studentId}/emergency-contacts`, contactData);
    return response.data;
  },

  // Upload document
  uploadDocument: async (studentId, file, documentType, notes = '') => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);
    if (notes) formData.append('notes', notes);

    const response = await api.post(`/registrations/${studentId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // List documents
  getDocuments: async (studentId) => {
    const response = await api.get(`/registrations/${studentId}/documents`);
    return response.data;
  },

  // Verify document
  verifyDocument: async (studentId, docId, verificationStatus, notes = '') => {
    const response = await api.patch(`/registrations/${studentId}/documents/${docId}/verify`, {
      verificationStatus,
      notes,
    });
    return response.data;
  },

  // Update consents
  updateConsents: async (studentId, consents) => {
    const response = await api.put(`/registrations/${studentId}/consents`, consents);
    return response.data;
  },

  // Get audit log
  getAuditLog: async (studentId) => {
    const response = await api.get(`/registrations/${studentId}/audit`);
    return response.data;
  },
};

export default registrationService;
