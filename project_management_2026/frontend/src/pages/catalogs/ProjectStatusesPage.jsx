import { useState } from 'react'
import { Activity } from 'lucide-react'
import toast from 'react-hot-toast'
import CatalogPage from '../../components/ui/CatalogPage'
import StatusBadge from '../../components/ui/StatusBadge'
import CrudModal, { FormGrid, Field, FormActions } from '../../components/ui/CrudModal'
import { RowActions } from '../../components/ui/RowActions'
import { projectStatusesService as svc } from '../../services/catalogs'

const PRESET_COLORS = ['#0EA5E9','#10B981','#F59E0B','#EF4444','#8B5CF6','#B91C3C','#0F2952','#64748B','#06B6D4','#F97316']

function Modal({ modal, closeModal, afterSave }) {
  const isEdit = modal.mode === 'edit'
  const rec    = modal.record || {}
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    status_code:        rec.status_code        || '',
    status_name:        rec.status_name        || '',
    status_color:       rec.status_color       || '#0EA5E9',
    status_order:       rec.status_order       ?? '',
    status_description: rec.status_description || '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async e => {
    e.preventDefault()
    if (!form.status_code.trim()) return toast.error('El código es obligatorio')
    if (!form.status_name.trim()) return toast.error('El nombre es obligatorio')
    setSaving(true)
    try {
      const payload = { ...form, status_order: form.status_order !== '' ? Number(form.status_order) : null }
      isEdit ? await svc.update(rec.status_id, payload) : await svc.create(payload)
      toast.success(isEdit ? 'Estado actualizado ✓' : 'Estado creado ✓')
      afterSave()
    } catch (err) { toast.error(err.response?.data?.detail || 'Error al guardar') }
    finally { setSaving(false) }
  }

  return (
    <CrudModal isOpen title={isEdit ? 'Editar estado' : 'Nuevo estado de proyecto'} onClose={closeModal} size="md">
      <form onSubmit={submit}>
        <FormGrid cols={2}>
          <Field label="Código" required>
            <input className="input-field" value={form.status_code} onChange={e => set('status_code', e.target.value.toUpperCase())}
              placeholder="Ej: EN_EJECUCION" autoFocus/>
          </Field>
          <Field label="Orden de visualización">
            <input className="input-field" type="number" min={1} value={form.status_order} onChange={e => set('status_order', e.target.value)} placeholder="1, 2, 3..."/>
          </Field>
          <Field label="Nombre del estado" required span={2}>
            <input className="input-field" value={form.status_name} onChange={e => set('status_name', e.target.value)} placeholder="Ej: En ejecución"/>
          </Field>
          <Field label="Descripción" span={2}>
            <textarea className="input-field" rows={2} value={form.status_description}
              onChange={e => set('status_description', e.target.value)} placeholder="Descripción opcional" style={{ resize:'vertical' }}/>
          </Field>
          <Field label="Color del estado" span={2}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <input type="color" value={form.status_color} onChange={e => set('status_color', e.target.value)}
                style={{ width:40, height:36, border:'1px solid var(--border-color)', borderRadius:6, cursor:'pointer', background:'none', padding:2 }}/>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap', flex:1 }}>
                {PRESET_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => set('status_color', c)}
                    style={{ width:24, height:24, borderRadius:6, background:c, border: form.status_color===c ? '3px solid var(--text-primary)' : '2px solid transparent', cursor:'pointer' }}/>
                ))}
              </div>
              {/* Preview */}
              <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:20, border:'1px solid', borderColor:`${form.status_color}44`, background:`${form.status_color}15` }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:form.status_color }}/>
                <span style={{ fontSize:12, color:form.status_color, fontWeight:600 }}>{form.status_name || 'Preview'}</span>
              </div>
            </div>
          </Field>
        </FormGrid>
        <FormActions onCancel={closeModal} saving={saving} isEdit={isEdit}/>
      </form>
    </CrudModal>
  )
}

const mkCols = ({ openEdit, reload }) => [
  { key:'status_order', label:'#', width:'60px', sortKey:'status_order',
    render: r => <span style={{ fontFamily:'monospace', color:'var(--text-muted)', fontSize:12, textAlign:'center', display:'block' }}>{r.status_order ?? '—'}</span> },
  { key:'status_name', label:'Estado', sortKey:'status_name',
    render: r => (
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:10, height:10, borderRadius:'50%', background:r.status_color||'#94A3B8', flexShrink:0, boxShadow:`0 0 0 3px ${(r.status_color||'#94A3B8')}22` }}/>
        <div>
          <p style={{ fontWeight:600, color:'var(--text-primary)', fontSize:13 }}>{r.status_name}</p>
          {r.status_description && <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>{r.status_description}</p>}
        </div>
      </div>
    )},
  { key:'status_code', label:'Código', width:'140px', sortKey:'status_code',
    render: r => <span style={{ fontFamily:'monospace', fontSize:12, background:'var(--bg-hover)', padding:'3px 8px', borderRadius:5, color:'var(--text-secondary)' }}>{r.status_code}</span> },
  { key:'is_active', label:'Estado', width:'100px', sortKey:'is_active',
    render: r => <StatusBadge active={r.is_active}/> },
  { key:'_a', label:'', width:'90px', sortable:false,
    render: r => <RowActions r={r} idField="status_id" onEdit={() => openEdit(r)} service={svc} reload={reload}/> },
]

export default function ProjectStatusesPage() {
  return <CatalogPage title="Estados de Proyecto" icon={Activity} iconBg="rgba(239,68,68,.08)" iconColor="#EF4444"
    service={svc} columns={mkCols} searchKeys={['status_name','status_code']} emptyMessage="No hay estados"
    renderModal={p => <Modal {...p}/>}/>
}
