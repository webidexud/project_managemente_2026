import { useEffect, useState } from 'react'
import { Building2, DollarSign, UserCheck, Activity, TrendingUp } from 'lucide-react'
import {
  entityTypesService,
  financingTypesService,
  orderingOfficialsService,
  projectStatusesService,
} from '../services/catalogs'
import { useAuth } from '../context/AuthContext'

const statCards = [
  {
    label: 'Tipos de Entidad',
    icon: Building2,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    key: 'entityTypes',
  },
  {
    label: 'Tipos de Financiación',
    icon: DollarSign,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    key: 'financingTypes',
  },
  {
    label: 'Funcionarios Ordenadores',
    icon: UserCheck,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    key: 'officials',
  },
  {
    label: 'Estados de Proyecto',
    icon: Activity,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    key: 'statuses',
  },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [et, ft, oo, ps] = await Promise.all([
          entityTypesService.list(),
          financingTypesService.list(),
          orderingOfficialsService.list(),
          projectStatusesService.list(),
        ])
        setCounts({
          entityTypes: et.data.length,
          financingTypes: ft.data.length,
          officials: oo.data.length,
          statuses: ps.data.length,
        })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-gray-400 text-sm">{greeting},</p>
        <h1 className="text-2xl font-bold text-white mt-0.5">
          {user?.full_name || user?.username}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Panel de administración del sistema SIEXUD
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div
            key={card.key}
            className="card p-5 animate-fade-in"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
              <card.icon size={20} className={card.color} />
            </div>
            <p className="text-2xl font-bold text-white">
              {loading ? '—' : counts[card.key] ?? 0}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-ud-red/15 flex items-center justify-center">
            <TrendingUp size={16} className="text-ud-red" />
          </div>
          <h2 className="font-semibold text-white">Accesos rápidos</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Gestionar Tipos de Entidad', path: '/catalogs/entity-types' },
            { label: 'Gestionar Financiaciones', path: '/catalogs/financing-types' },
            { label: 'Gestionar Funcionarios', path: '/catalogs/ordering-officials' },
            { label: 'Gestionar Estados', path: '/catalogs/project-statuses' },
          ].map((item) => (
            <a
              key={item.path}
              href={item.path}
              className="flex items-center gap-2 px-4 py-3 rounded-lg bg-white/3 
                hover:bg-white/7 border border-white/5 hover:border-white/10
                text-sm text-gray-300 hover:text-white transition-all duration-150"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-ud-red flex-shrink-0" />
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
