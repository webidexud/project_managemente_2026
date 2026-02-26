import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './context/ThemeContext'
import AppLayout from './components/layout/AppLayout'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectFormPage from './pages/projects/ProjectFormPage'
import ProjectViewPage from './pages/projects/ProjectViewPage'
import ProjectModificationsPage from './pages/projects/ProjectModificationsPage'
import EntitiesPage from './pages/catalogs/EntitiesPage'
import EntityTypesPage from './pages/catalogs/EntityTypesPage'
import ExecutingDepartmentsPage from './pages/catalogs/ExecutingDepartmentsPage'
import ExecutionModalitiesPage from './pages/catalogs/ExecutionModalitiesPage'
import FinancingTypesPage from './pages/catalogs/FinancingTypesPage'
import OrderingOfficialsPage from './pages/catalogs/OrderingOfficialsPage'
import ProjectStatusesPage from './pages/catalogs/ProjectStatusesPage'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        {/* z-index 999999 — siempre por encima de modales (9999) */}
        <Toaster
          position="top-right"
          containerStyle={{ zIndex: 999999 }}
          toastOptions={{
            duration: 3500,
            style: {
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 10,
              boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
            },
            success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#B91C3C', secondary: '#fff' } },
          }}
        />
        <Routes>
          {/* Rutas de proyecto fuera del layout (pantalla completa) */}
          <Route path="/projects/new"                    element={<ProjectFormPage />} />
          <Route path="/projects/:id/edit"               element={<ProjectFormPage />} />
          <Route path="/projects/:id/view"               element={<ProjectViewPage />} />
          <Route path="/projects/:id/modifications"      element={<ProjectModificationsPage />} />

          <Route element={<AppLayout />}>
            <Route path="/"                                       element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"                              element={<DashboardPage />} />
            <Route path="/projects"                               element={<ProjectsPage />} />
            <Route path="/catalogs/entities"                      element={<EntitiesPage />} />
            <Route path="/catalogs/entity-types"                  element={<EntityTypesPage />} />
            <Route path="/catalogs/executing-departments"         element={<ExecutingDepartmentsPage />} />
            <Route path="/catalogs/execution-modalities"          element={<ExecutionModalitiesPage />} />
            <Route path="/catalogs/financing-types"               element={<FinancingTypesPage />} />
            <Route path="/catalogs/ordering-officials"            element={<OrderingOfficialsPage />} />
            <Route path="/catalogs/project-statuses"              element={<ProjectStatusesPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
