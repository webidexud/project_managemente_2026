import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Power, Building2, Search, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { entityTypesService } from '../../services/catalogs'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'

export default function EntityTypesPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ type_name: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await entityTypesService.list()
      setData(res.data)
    } catch {
      toast.error('Error cargando tipos de entidad')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = data.filter((r) => {
    const matchSearch = r.type_name.toLowerCase().includes(search.toLowerCase())
    const matchActive = showInactive ? true : r.is_active
    return matchSearch && matchActive
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ type_name: '' })
    setModalOpen(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({ type_name: row.type_name })
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.type_name.trim()) return
    setSaving(true)
    try {
      if (editing) {
        await entityTypesService.update(editing.entity_type_id, form)
        toast.success('Tipo de entidad actualizado')
      } else {
        await entityTypesService.create(form)
        toast.success('Tipo de entidad creado')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (row) => {
    try {
      await entityTypesService.toggle(row.entity_type_id)
      toast.success(row.is_active ? 'Deshabilitado' : 'Habilitado')
      load()
    } catch {
      toast.error('Error al cambiar estado')
    }
  }

  const columns = [
    {
      key: 'entity_type_id',
      label: '#',
      width: '60px',
      render: (r) => <span className="font-mono text-gray-500 text-xs">{r.entity_type_id}</span>,
    },
    {
      key: 'type_name',
      label: 'Nombre',
      render: (r) => <span className="font-medium text-gray-200">{r.type_name}</span>,
    },
    {
      key: 'is_active',
      label: 'Estado',
      width: '120px',
      render: (r) =>
        r.is_active ? (
          <span className="badge-active"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Activo</span>
        ) : (
          <span className="badge-inactive"><span className="w-1.5 h-1.5 rounded-full bg-gray-500" />Inactivo</span>
        ),
    },
    {
      key: 'created_at',
      label: 'Creado',
      width: '140px',
      render: (r) => (
        <span className="text-gray-500 text-xs">
          {new Date(r.created_at).toLocaleDateString('es-CO')}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '100px',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openEdit(r)}
            className="btn-ghost text-blue-400 hover:text-blue-300"
            title="Editar"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => handleToggle(r)}
            className={`btn-ghost ${r.is_active ? 'text-red-400 hover:text-red-300' : 'text-emerald-400 hover:text-emerald-300'}`}
            title={r.is_active ? 'Deshabilitar' : 'Habilitar'}
          >
            <Power size={15} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Building2 size={20} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Tipos de Entidad</h1>
            <p className="text-gray-500 text-sm">{filtered.length} registros</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary">
            <RefreshCw size={15} />
            Actualizar
          </button>
          <button onClick={openCreate} className="btn-primary">
            <Plus size={15} />
            Nuevo
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-4 flex items-center gap-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar tipo de entidad..."
            className="input-field pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="accent-ud-red"
          />
          Mostrar inactivos
        </label>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No hay tipos de entidad" />
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Tipo de Entidad' : 'Nuevo Tipo de Entidad'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Nombre del tipo *</label>
            <input
              type="text"
              className="input-field"
              placeholder="Ej: Entidad Pública Nacional"
              value={form.type_name}
              onChange={(e) => setForm({ ...form, type_name: e.target.value.toUpperCase() })}
              required
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
