import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ui/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'
import EntityTypesPage from './pages/catalogs/EntityTypesPage'
import FinancingTypesPage from './pages/catalogs/FinancingTypesPage'
import OrderingOfficialsPage from './pages/catalogs/OrderingOfficialsPage'
import ProjectStatusesPage from './pages/catalogs/ProjectStatusesPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#16213e',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: '14px',
              fontFamily: 'Sora, sans-serif',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#16213e' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#16213e' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="catalogs/entity-types" element={<EntityTypesPage />} />
            <Route path="catalogs/financing-types" element={<FinancingTypesPage />} />
            <Route path="catalogs/ordering-officials" element={<OrderingOfficialsPage />} />
            <Route path="catalogs/project-statuses" element={<ProjectStatusesPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
