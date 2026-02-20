import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Globe, Building2, University, Layers, DollarSign, UserCheck, Activity, FolderOpen, ChevronRight, Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

const navItems = [
  {
    section: 'Principal',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/projects', icon: FolderOpen, label: 'Proyectos' },
    ],
  },
  {
    section: 'Catálogos',
    items: [
      { to: '/catalogs/entities', icon: Globe, label: 'Entidades' },
      { to: '/catalogs/entity-types', icon: Building2, label: 'Tipos de Entidad' },
      { to: '/catalogs/executing-departments', icon: University, label: 'Dependencias' },
      { to: '/catalogs/execution-modalities', icon: Layers, label: 'Modalidades' },
      { to: '/catalogs/financing-types', icon: DollarSign, label: 'Financiaciones' },
      { to: '/catalogs/ordering-officials', icon: UserCheck, label: 'Funcionarios' },
      { to: '/catalogs/project-statuses', icon: Activity, label: 'Estados' },
    ],
  },
]

export default function Sidebar() {
  const { toggle, isDark } = useTheme()

  return (
    <aside className="sidebar">
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #B91C3C, #E11D48)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(185,28,60,0.4)', flexShrink: 0 }}>
            <span style={{ color: 'white', fontWeight: 800, fontSize: 13, letterSpacing: '-0.5px' }}>UD</span>
          </div>
          <div>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>SIEXUD</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, lineHeight: 1.3, fontWeight: 500 }}>Sistema de Extensión</p>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
        {navItems.map((section) => (
          <div key={section.section} style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 10px', marginBottom: 4 }}>
              {section.section}
            </p>
            <ul style={{ listStyle: 'none' }}>
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.to === '/'}
                    style={({ isActive }) => ({
                      display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 7,
                      fontSize: 12.5, fontWeight: isActive ? 600 : 500,
                      color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
                      background: isActive ? 'rgba(14,165,233,0.2)' : 'transparent',
                      borderLeft: isActive ? '3px solid #0EA5E9' : '3px solid transparent',
                      textDecoration: 'none', transition: 'all 0.15s ease', marginBottom: 1,
                    })}>
                    {({ isActive }) => (
                      <>
                        <item.icon size={14} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.6 }} />
                        <span style={{ flex: 1 }}>{item.label}</span>
                        {isActive && <ChevronRight size={12} style={{ opacity: 0.6 }} />}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isDark ? <Moon size={14} style={{ color: '#38BDF8' }} /> : <Sun size={14} style={{ color: '#FCD34D' }} />}
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{isDark ? 'Oscuro' : 'Claro'}</span>
        </div>
        <button onClick={toggle} className={`theme-toggle ${isDark ? 'active' : ''}`} title="Cambiar tema" />
      </div>
    </aside>
  )
}
