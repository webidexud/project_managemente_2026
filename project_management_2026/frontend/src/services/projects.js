import api from './api'

export const projectsService = {
  list:          (params = {}) => api.get('/projects/', { params }),
  get:           (id)          => api.get(`/projects/${id}`),
  getNextNumber: (year)        => api.get(`/projects/next-number/${year}`),
  getAdditions:  (id)          => api.get(`/projects/${id}/additions`),
  create:        (data)        => api.post('/projects/', data),
  update:        (id, data)    => api.put(`/projects/${id}`, data),
  toggle:        (id)          => api.patch(`/projects/${id}/toggle`),
  listTypes:     ()            => api.get('/projects/types/all'),
}

export const modificationsService = {
  list:              (projectId)       => api.get(`/projects/${projectId}/modifications/`),
  create:            (projectId, data) => api.post(`/projects/${projectId}/modifications/`, data),
  toggle:            (modId)           => api.patch(`/modifications/${modId}/toggle`),
  addSuspension:     (modId, data)     => api.post(`/modifications/${modId}/suspension`, data),
  restartSuspension: (susId, data)     => api.patch(`/modifications/suspensions/${susId}/restart`, data),
  addClause:         (modId, data)     => api.post(`/modifications/${modId}/clause`, data),
  addAssignment:     (modId, data)     => api.post(`/modifications/${modId}/assignment`, data),
  addLiquidation:    (modId, data)     => api.post(`/modifications/${modId}/liquidation`, data),
}

export const rupService = {
  segments:      ()                  => api.get('/rup/segments'),
  families:      (segment_code)      => api.get('/rup/families', { params: { segment_code } }),
  classes:       (family_code)       => api.get('/rup/classes',  { params: { family_code  } }),
  products:      (class_code)        => api.get('/rup/products', { params: { class_code   } }),
  search:        (q)                 => api.get('/rup/search',   { params: { q            } }),
  getProjectRup: (project_id)        => api.get(`/rup/project/${project_id}`),
  assignRup:     (project_id, codes) => api.post(`/rup/project/${project_id}/assign`, { codes }),
}

export const emailsService = {
  list:   (pid)            => api.get(`/projects/${pid}/emails/`),
  create: (pid, data)      => api.post(`/projects/${pid}/emails/`, data),
  update: (pid, eid, data) => api.put(`/projects/${pid}/emails/${eid}`, data),
  delete: (pid, eid)       => api.delete(`/projects/${pid}/emails/${eid}`),
}
