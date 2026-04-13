// frontend/src/services/tracking.js
import api from './api'

export const trackingService = {
  // Seguimientos
  list:       (params = {})      => api.get('/tracking/', { params }),
  get:        (id)               => api.get(`/tracking/${id}`),
  create:     (data)             => api.post('/tracking/', data),
  update:     (id, data)         => api.put(`/tracking/${id}`, data),
  remove:     (id)               => api.delete(`/tracking/${id}`),
  snapshot:   (projectId)        => api.get(`/tracking/project/${projectId}/snapshot`),

  // Personal
  listPersonnel:   (projectId)        => api.get(`/tracking/project/${projectId}/personnel`),
  createPersonnel: (projectId, data)  => api.post(`/tracking/project/${projectId}/personnel`, data),
  updatePersonnel: (id, data)         => api.put(`/tracking/personnel/${id}`, data),
  deletePersonnel: (id)               => api.delete(`/tracking/personnel/${id}`),

  // Facturas
  listInvoices:   (projectId)        => api.get(`/tracking/project/${projectId}/invoices`),
  createInvoice:  (projectId, data)  => api.post(`/tracking/project/${projectId}/invoices`, data),
  updateInvoice:  (id, data)         => api.put(`/tracking/invoices/${id}`, data),
  deleteInvoice:  (id)               => api.delete(`/tracking/invoices/${id}`),

  // Informes
  listReports:   (projectId)        => api.get(`/tracking/project/${projectId}/reports`),
  createReport:  (projectId, data)  => api.post(`/tracking/project/${projectId}/reports`, data),
  updateReport:  (id, data)         => api.put(`/tracking/reports/${id}`, data),
  deleteReport:  (id)               => api.delete(`/tracking/reports/${id}`),
}
