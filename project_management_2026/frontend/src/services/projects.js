import api from './api'

export const projectsService = {
  list:           (params = {}) => api.get('/projects/', { params }),
  get:            (id)          => api.get(`/projects/${id}`),
  getNextNumber:  (year)        => api.get(`/projects/next-number/${year}`),
  getAdditions:   (id)          => api.get(`/projects/${id}/additions`),
  create:      (data)        => api.post('/projects/', data),
  update:      (id, data)    => api.put(`/projects/${id}`, data),
  toggle:      (id)          => api.patch(`/projects/${id}/toggle`),
  listTypes:   ()            => api.get('/projects/types/all'),
}

export const rupService = {
  segments: ()                  => api.get('/rup/segments'),
  families: (segment_code)      => api.get('/rup/families', { params: { segment_code } }),
  classes:  (family_code)       => api.get('/rup/classes',  { params: { family_code  } }),
  products: (class_code)        => api.get('/rup/products', { params: { class_code   } }),
  search:   (q)                 => api.get('/rup/search',   { params: { q            } }),
  getProjectRup: (project_id)   => api.get(`/rup/project/${project_id}`),
  assignRup: (project_id, codes)=> api.post(`/rup/project/${project_id}/assign`, { codes }),
}

// dentro de projectsService — agregar método getAdditions

// ── Correos secundarios ─────────────────────────────────────────────
export const emailsService = {
  list:   (pid)           => api.get(`/projects/${pid}/emails/`),
  create: (pid, data)     => api.post(`/projects/${pid}/emails/`, data),
  update: (pid, eid, data)=> api.put(`/projects/${pid}/emails/${eid}`, data),
  delete: (pid, eid)      => api.delete(`/projects/${pid}/emails/${eid}`),
}
