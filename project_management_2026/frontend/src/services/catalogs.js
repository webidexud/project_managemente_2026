import api from './api'

const crud = (prefix) => ({
  list:   (activeOnly = false) => api.get(`${prefix}/?active_only=${activeOnly}`),
  create: (data)               => api.post(`${prefix}/`, data),
  update: (id, data)           => api.put(`${prefix}/${id}`, data),
  toggle: (id)                 => api.patch(`${prefix}/${id}/toggle`),
})

export const entityTypesService          = crud('/entity-types')
export const entitiesService             = crud('/entities')
export const executingDepartmentsService = crud('/executing-departments')
export const executionModalitiesService  = crud('/execution-modalities')
export const financingTypesService       = crud('/financing-types')
export const orderingOfficialsService    = crud('/ordering-officials')
export const projectStatusesService      = crud('/project-statuses')
