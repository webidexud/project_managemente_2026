import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  DollarSign,
  UserCheck,
  Activity,
  FolderOpen,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

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
      { to: '/catalogs/entity-types', icon: Building2, label: 'Tipos de Entidad' },
      { to: '/catalogs/financing-types', icon: DollarSign, label: 'Tipos de Financiación' },
      { to: '/catalogs/ordering-officials', icon: UserCheck, label: 'Funcionarios Ordenadores' },
      { to: '/catalogs/project-statuses', icon: Activity, label: 'Estados de Proyecto' },
    ],
  },
]

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col bg-ud-navy border-r border-white/5 h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-ud-red flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-xs">UD</span>
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">SIEXUD</p>
            <p className="text-gray-500 text-[10px] leading-tight">Sistema de Extensión</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navItems.map((section) => (
          <div key={section.section}>
            <p className="px-3 mb-2 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
              {section.section}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group ${
                        isActive
                          ? 'bg-ud-red/15 text-ud-red font-semibold'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon size={16} className="flex-shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {isActive && <ChevronRight size={14} className="opacity-60" />}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-ud-red/20 flex items-center justify-center flex-shrink-0">
            <span className="text-ud-red text-xs font-bold">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">{user?.full_name || user?.username}</p>
            <p className="text-xs text-gray-500 truncate">{user?.is_admin ? 'Administrador' : 'Usuario'}</p>
          </div>
          <button onClick={logout} className="btn-ghost text-gray-500 hover:text-ud-red" title="Cerrar sesión">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
