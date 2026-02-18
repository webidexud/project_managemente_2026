import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Power, Activity, Search, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { projectStatusesService } from '../../services/catalogs'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'

const emptyForm = {
  status_code: '',
  status_name: '',
  status_color: '#6B7280',
  status_order: '',
  status_description: '',
}

export default function ProjectStatusesPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await projectStatusesService.list()
      setData(res.data)
    } catch {
      toast.error('Error cargando estados')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = data.filter((r) => {
    const matchSearch =
      r.status_name.toLowerCase().includes(search.toLowerCase()) ||
      r.status_code.toLowerCase().includes(search.toLowerCase())
    const matchActive = showInactive ? true : r.is_active
    return matchSearch && matchActive
  })

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (row) => {
    setEditing(row)
    setForm({
      status_code: row.status_code,
      status_name: row.status_name,
      status_color: row.status_color || '#6B7280',
      status_order: row.status_order ?? '',
      status_description: row.status_description || '',
    })
    setModalOpen(true)
  }

  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      status_order: form.status_order !== '' ? Number(form.status_order) : null,
      status_description: form.status_description || null,
    }
    try {
      if (editing) {
        await projectStatusesService.update(editing.status_id, payload)
        toast.success('Estado actualizado')
      } else {
        await projectStatusesService.create(payload)
        toast.success('Estado creado')
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
      await projectStatusesService.toggle(row.status_id)
      toast.success(row.is_active ? 'Deshabilitado' : 'Habilitado')
      load()
    } catch { toast.error('Error al cambiar estado') }
  }

  const columns = [
    {
      key: 'status_order',
      label: 'Orden',
      width: '70px',
      render: (r) => <span className="font-mono text-gray-500 text-xs text-center block">{r.status_order ?? '—'}</span>,
    },
    {
      key: 'status_name',
      label: 'Estado',
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-white/10"
            style={{ backgroundColor: r.status_color || '#6B7280' }}
          />
          <div>
            <p className="font-medium text-gray-200 text-sm">{r.status_name}</p>
            {r.status_description && (
              <p className="text-xs text-gray-500">{r.status_description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'status_code',
      label: 'Código',
      width: '100px',
      render: (r) => (
        <span className="font-mono text-xs bg-white/5 px-2 py-1 rounded text-gray-300">
          {r.status_code}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Estado',
      width: '110px',
      render: (r) =>
        r.is_active ? (
          <span className="badge-active"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Activo</span>
        ) : (
          <span className="badge-inactive"><span className="w-1.5 h-1.5 rounded-full bg-gray-500" />Inactivo</span>
        ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '90px',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(r)} className="btn-ghost text-blue-400" title="Editar">
            <Pencil size={15} />
          </button>
          <button
            onClick={() => handleToggle(r)}
            className={`btn-ghost ${r.is_active ? 'text-red-400' : 'text-emerald-400'}`}
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
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Activity size={20} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Estados de Proyecto</h1>
            <p className="text-gray-500 text-sm">{filtered.length} estados</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary"><RefreshCw size={15} />Actualizar</button>
          <button onClick={openCreate} className="btn-primary"><Plus size={15} />Nuevo</button>
        </div>
      </div>

      <div className="card p-4 flex items-center gap-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="text" placeholder="Buscar estado..." className="input-field pl-9"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer select-none">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="accent-ud-red" />
          Mostrar inactivos
        </label>
      </div>

      <div className="card overflow-hidden">
        <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No hay estados" />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Estado' : 'Nuevo Estado de Proyecto'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Código *</label>
              <input type="text" className="input-field font-mono" value={form.status_code}
                onChange={setField('status_code')} required placeholder="14" />
            </div>
            <div>
              <label className="label">Orden</label>
              <input type="number" className="input-field" value={form.status_order}
                onChange={setField('status_order')} placeholder="8" min={1} />
            </div>
          </div>

          <div>
            <label className="label">Nombre del estado *</label>
            <input type="text" className="input-field" value={form.status_name}
              onChange={(e) => setForm((p) => ({ ...p, status_name: e.target.value.toUpperCase() }))}
              required placeholder="EN EJECUCIÓN" />
          </div>

          <div>
            <label className="label">Descripción</label>
            <input type="text" className="input-field" value={form.status_description}
              onChange={setField('status_description')} placeholder="Proyecto en fase de ejecución" />
          </div>

          <div>
            <label className="label">Color de identificación</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.status_color}
                onChange={setField('status_color')}
                className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
              <input type="text" className="input-field font-mono" value={form.status_color}
                onChange={setField('status_color')} placeholder="#009688" maxLength={7} />
              <div
                className="w-8 h-8 rounded-lg ring-1 ring-white/10 flex-shrink-0"
                style={{ backgroundColor: form.status_color }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
