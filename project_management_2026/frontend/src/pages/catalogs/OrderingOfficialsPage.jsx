import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Power, UserCheck, Search, RefreshCw, Mail, Phone } from 'lucide-react'
import toast from 'react-hot-toast'
import { orderingOfficialsService } from '../../services/catalogs'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'

const ID_TYPES = ['CC', 'CE', 'TI', 'PP', 'NIT']

const emptyForm = {
  first_name: '',
  second_name: '',
  first_surname: '',
  second_surname: '',
  identification_type: 'CC',
  identification_number: '',
  appointment_resolution: '',
  resolution_date: '',
  institutional_email: '',
  phone: '',
}

export default function OrderingOfficialsPage() {
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
      const res = await orderingOfficialsService.list()
      setData(res.data)
    } catch {
      toast.error('Error cargando funcionarios')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = data.filter((r) => {
    const name = (r.full_name || '').toLowerCase()
    const id = r.identification_number.toLowerCase()
    const matchSearch = name.includes(search.toLowerCase()) || id.includes(search.toLowerCase())
    const matchActive = showInactive ? true : r.is_active
    return matchSearch && matchActive
  })

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({
      first_name: row.first_name || '',
      second_name: row.second_name || '',
      first_surname: row.first_surname || '',
      second_surname: row.second_surname || '',
      identification_type: row.identification_type || 'CC',
      identification_number: row.identification_number || '',
      appointment_resolution: row.appointment_resolution || '',
      resolution_date: row.resolution_date || '',
      institutional_email: row.institutional_email || '',
      phone: row.phone || '',
    })
    setModalOpen(true)
  }

  const setField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      second_name: form.second_name || null,
      second_surname: form.second_surname || null,
      appointment_resolution: form.appointment_resolution || null,
      resolution_date: form.resolution_date || null,
      institutional_email: form.institutional_email || null,
      phone: form.phone || null,
    }
    try {
      if (editing) {
        await orderingOfficialsService.update(editing.official_id, payload)
        toast.success('Funcionario actualizado')
      } else {
        await orderingOfficialsService.create(payload)
        toast.success('Funcionario creado')
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
      await orderingOfficialsService.toggle(row.official_id)
      toast.success(row.is_active ? 'Deshabilitado' : 'Habilitado')
      load()
    } catch {
      toast.error('Error al cambiar estado')
    }
  }

  const columns = [
    {
      key: 'official_id',
      label: '#',
      width: '60px',
      render: (r) => <span className="font-mono text-gray-500 text-xs">{r.official_id}</span>,
    },
    {
      key: 'full_name',
      label: 'Nombre completo',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-200">{r.full_name}</p>
          <p className="text-xs text-gray-500 font-mono">
            {r.identification_type} {r.identification_number}
          </p>
        </div>
      ),
    },
    {
      key: 'contact',
      label: 'Contacto',
      render: (r) => (
        <div className="space-y-0.5">
          {r.institutional_email && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Mail size={11} className="flex-shrink-0" />
              {r.institutional_email}
            </div>
          )}
          {r.phone && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Phone size={11} className="flex-shrink-0" />
              {r.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'appointment_resolution',
      label: 'Resolución',
      width: '130px',
      render: (r) => (
        <span className="text-xs text-gray-400">{r.appointment_resolution || '—'}</span>
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
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <UserCheck size={20} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Funcionarios Ordenadores</h1>
            <p className="text-gray-500 text-sm">{filtered.length} funcionarios</p>
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
          <input
            type="text"
            placeholder="Buscar por nombre o número de identificación..."
            className="input-field pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer select-none">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="accent-ud-red" />
          Mostrar inactivos
        </label>
      </div>

      <div className="card overflow-hidden">
        <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No hay funcionarios registrados" />
      </div>

      {/* Modal formulario */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Funcionario' : 'Nuevo Funcionario Ordenador'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* Nombres */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Primer nombre *</label>
              <input type="text" className="input-field" value={form.first_name}
                onChange={setField('first_name')} required placeholder="JUAN" />
            </div>
            <div>
              <label className="label">Segundo nombre</label>
              <input type="text" className="input-field" value={form.second_name}
                onChange={setField('second_name')} placeholder="CARLOS" />
            </div>
          </div>

          {/* Apellidos */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Primer apellido *</label>
              <input type="text" className="input-field" value={form.first_surname}
                onChange={setField('first_surname')} required placeholder="PÉREZ" />
            </div>
            <div>
              <label className="label">Segundo apellido</label>
              <input type="text" className="input-field" value={form.second_surname}
                onChange={setField('second_surname')} placeholder="GÓMEZ" />
            </div>
          </div>

          {/* Identificación */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Tipo ID *</label>
              <select className="input-field" value={form.identification_type}
                onChange={setField('identification_type')}>
                {ID_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Número de identificación *</label>
              <input type="text" className="input-field font-mono" value={form.identification_number}
                onChange={setField('identification_number')} required placeholder="1234567890" />
            </div>
          </div>

          {/* Resolución */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Resolución de nombramiento</label>
              <input type="text" className="input-field" value={form.appointment_resolution}
                onChange={setField('appointment_resolution')} placeholder="Res. 001-2024" />
            </div>
            <div>
              <label className="label">Fecha de resolución</label>
              <input type="date" className="input-field" value={form.resolution_date}
                onChange={setField('resolution_date')} />
            </div>
          </div>

          {/* Contacto */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Correo institucional</label>
              <input type="email" className="input-field" value={form.institutional_email}
                onChange={setField('institutional_email')} placeholder="funcionario@udistrital.edu.co" />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input type="text" className="input-field font-mono" value={form.phone}
                onChange={setField('phone')} placeholder="3001234567" />
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
