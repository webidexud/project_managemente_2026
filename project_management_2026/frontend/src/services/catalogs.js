import api from './api'

// ── Entity Types ──────────────────────────────────────────────────────────────
export const entityTypesService = {
  list: (activeOnly = false) =>
    api.get('/entity-types/', { params: { active_only: activeOnly } }),
  get: (id) => api.get(`/entity-types/${id}`),
  create: (data) => api.post('/entity-types/', data),
  update: (id, data) => api.put(`/entity-types/${id}`, data),
  toggle: (id) => api.patch(`/entity-types/${id}/toggle`),
}

// ── Financing Types ───────────────────────────────────────────────────────────
export const financingTypesService = {
  list: (activeOnly = false) =>
    api.get('/financing-types/', { params: { active_only: activeOnly } }),
  get: (id) => api.get(`/financing-types/${id}`),
  create: (data) => api.post('/financing-types/', data),
  update: (id, data) => api.put(`/financing-types/${id}`, data),
  toggle: (id) => api.patch(`/financing-types/${id}/toggle`),
}

// ── Ordering Officials ────────────────────────────────────────────────────────
export const orderingOfficialsService = {
  list: (activeOnly = false) =>
    api.get('/ordering-officials/', { params: { active_only: activeOnly } }),
  get: (id) => api.get(`/ordering-officials/${id}`),
  create: (data) => api.post('/ordering-officials/', data),
  update: (id, data) => api.put(`/ordering-officials/${id}`, data),
  toggle: (id) => api.patch(`/ordering-officials/${id}/toggle`),
}

// ── Project Statuses ──────────────────────────────────────────────────────────
export const projectStatusesService = {
  list: (activeOnly = false) =>
    api.get('/project-statuses/', { params: { active_only: activeOnly } }),
  get: (id) => api.get(`/project-statuses/${id}`),
  create: (data) => api.post('/project-statuses/', data),
  update: (id, data) => api.put(`/project-statuses/${id}`, data),
  toggle: (id) => api.patch(`/project-statuses/${id}/toggle`),
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authService = {
  login: (username, password) => {
    const form = new FormData()
    form.append('username', username)
    form.append('password', password)
    return api.post('/auth/login', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  register: (data) => api.post('/auth/register', data),
}
