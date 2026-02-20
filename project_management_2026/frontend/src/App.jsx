import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './context/ThemeContext'
import AppLayout from './components/layout/AppLayout'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'
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
        <Toaster position="top-right" toastOptions={{
          style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontSize: '13px', fontFamily: '"Plus Jakarta Sans", sans-serif', boxShadow: 'var(--shadow-lg)' },
          success: { iconTheme: { primary: '#10B981', secondary: 'white' } },
          error: { iconTheme: { primary: '#B91C3C', secondary: 'white' } },
        }} />
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="catalogs/entities" element={<EntitiesPage />} />
            <Route path="catalogs/entity-types" element={<EntityTypesPage />} />
            <Route path="catalogs/executing-departments" element={<ExecutingDepartmentsPage />} />
            <Route path="catalogs/execution-modalities" element={<ExecutionModalitiesPage />} />
            <Route path="catalogs/financing-types" element={<FinancingTypesPage />} />
            <Route path="catalogs/ordering-officials" element={<OrderingOfficialsPage />} />
            <Route path="catalogs/project-statuses" element={<ProjectStatusesPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
