import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function AppLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg-primary)' }}>
        <div style={{ padding: '32px', maxWidth: 1280, margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
