import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Plus, GitBranch, Pencil, PowerOff, Power,
  RefreshCw, X, Check, DollarSign, Clock, FileText, Users, Shield, Lock
} from 'lucide-react'
import toast from 'react-hot-toast'
import { projectsService } from '../../services/projects'
import { modificationsService } from '../../services/modifications'

/* ═══════════════════════════════════════════════════════════════════
   TIPOS DE MODIFICACIÓN
═══════════════════════════════════════════════════════════════════ */
const MOD_TYPES = [
  { value: 'ADDITION',     label: 'Adición de valor',          color: '#10B981', needsAddition: true,  needsExtension: false },
  { value: 'EXTENSION',    label: 'Prórroga de tiempo',         color: '#0EA5E9', needsAddition: false, needsExtension: true  },
  { value: 'BOTH',         label: 'Adición + Prórroga',         color: '#8B5CF6', needsAddition: true,  needsExtension: true  },
  { value: 'MODIFICATION', label: 'Modificación de cláusula',   color: '#F59E0B', needsAddition: false, needsExtension: false },
  { value: 'SCOPE',        label: 'Modificación de alcance',    color: '#64748B', needsAddition: false, needsExtension: false },
  { value: 'SUSPENSION',   label: 'Suspensión',                 color: '#B91C3C', needsAddition: false, needsExtension: false },
  { value: 'RESTART',      label: 'Reinicio tras suspensión',   color: '#06B6D4', needsAddition: false, needsExtension: false },
  { value: 'ASSIGNMENT',   label: 'Cesión del contrato',        color: '#EC4899', needsAddition: false, needsExtension: false },
  { value: 'LIQUIDATION',  label: 'Liquidación',                color: '#0F2952', needsAddition: false, needsExtension: false },
]

/* Límites de caracteres según BD */
const LIM = {
  administrative_act:                   50,
  extension_period_text:               200,
  supervisor_name:                     200,
  supervisor_id:                        50,
  supervisor_entity_name:              200,
  cdp:                                 100,
  rp:                                  100,
  entity_legal_representative_name:    200,
  entity_legal_representative_id:       50,
  justification:                      2000,
  policy_update_description:          2000,
  payment_method_modification:        2000,
}

/* ═══════════════════════════════════════════════════════════════════
   FORMATO MONETARIO
═══════════════════════════════════════════════════════════════════ */
function formatCOP(n) {
  if (n === '' || n === null || n === undefined) return ''
  const num = parseInt(String(n).replace(/\D/g, ''), 10)
  if (isNaN(num)) return ''
  return num.toLocaleString('es-CO', { maximumFractionDigits: 0 })
}

function parseCOP(str) {
  const digits = String(str).replace(/\D/g, '')
  return digits === '' ? '' : parseInt(digits, 10)
}

function fmtMoney(v) {
  if (v == null || v === '') return '—'
  return '$' + Number(v).toLocaleString('es-CO', { maximumFractionDigits: 0 })
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENTES DE FORMULARIO
═══════════════════════════════════════════════════════════════════ */
const INP = {
  width: '100%', padding: '8px 12px',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-input)',
  borderRadius: 8, color: 'var(--text-primary)',
  fontSize: 13, fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box',
}

function CharCount({ value, max }) {
  const len = (value || '').length
  const pct = len / max
  const color = pct >= 1 ? '#B91C3C' : pct >= 0.85 ? '#F59E0B' : 'var(--text-muted)'
  return (
    <span style={{ fontSize: 11, color, fontVariantNumeric: 'tabular-nums', transition: 'color .2s' }}>
      {len}/{max}
    </span>
  )
}

function TxtInp({ value, onChange, max, placeholder, disabled }) {
  return (
    <div>
      <input style={INP} value={value ?? ''} maxLength={max}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder} disabled={disabled} />
      {max && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 3 }}>
          <CharCount value={value} max={max} />
        </div>
      )}
    </div>
  )
}

function TxtArea({ value, onChange, max, rows = 3, placeholder }) {
  return (
    <div>
      <textarea style={{ ...INP, resize: 'vertical', minHeight: rows * 24 }}
        rows={rows} value={value ?? ''} maxLength={max}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder} />
      {max && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 3 }}>
          <CharCount value={value} max={max} />
        </div>
      )}
    </div>
  )
}

/* MoneyInput — solo dígitos, formato al perder foco */
function MoneyInput({ value, onChange, placeholder = '0', disabled }) {
  const [display, setDisplay] = useState(() => formatCOP(value))
  const focused = useRef(false)

  useEffect(() => {
    if (!focused.current) setDisplay(formatCOP(value))
  }, [value])

  const handleFocus = () => {
    focused.current = true
    setDisplay(String(value ?? '').replace(/\D/g, ''))
  }
  const handleChange = (e) => {
    const onlyDigits = e.target.value.replace(/\D/g, '')
    setDisplay(onlyDigits)
    onChange(parseCOP(onlyDigits))
  }
  const handleBlur = () => {
    focused.current = false
    setDisplay(formatCOP(value))
  }

  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 13, pointerEvents: 'none', userSelect: 'none' }}>$</span>
      <input
        style={{ ...INP, paddingLeft: 22, fontFamily: 'monospace' }}
        value={display}
        onChange={disabled ? undefined : handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        inputMode="numeric"
      />
    </div>
  )
}

/* MoneyInput readonly — muestra valor calculado automáticamente */
function MoneyReadonly({ value, label }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 13, pointerEvents: 'none', userSelect: 'none' }}>$</span>
      <div style={{
        ...INP, paddingLeft: 22, paddingRight: 36, fontFamily: 'monospace',
        background: 'var(--bg-hover)', border: '1px solid var(--border-color)',
        color: '#10B981', fontWeight: 700, cursor: 'default',
        display: 'flex', alignItems: 'center',
      }}>
        {value !== '' && value !== null && value !== undefined
          ? formatCOP(value)
          : <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontFamily: 'inherit' }}>Calculando...</span>
        }
      </div>
      <Lock size={12} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
    </div>
  )
}

/* IntInput — solo enteros positivos */
function IntInput({ value, onChange, placeholder = '0', disabled }) {
  const handleChange = (e) => {
    const onlyDigits = e.target.value.replace(/\D/g, '')
    onChange(onlyDigits === '' ? '' : parseInt(onlyDigits, 10))
  }
  return (
    <input style={{ ...INP, fontFamily: 'monospace' }}
      value={value ?? ''}
      onChange={disabled ? undefined : handleChange}
      placeholder={placeholder}
      inputMode="numeric"
      disabled={disabled}
    />
  )
}

function F({ label, required, hint, children, span }) {
  return (
    <div style={span ? { gridColumn: `span ${span}` } : {}}>
      <label style={{
        display: 'flex', alignItems: 'baseline', gap: 4, fontSize: 11,
        fontWeight: 700, color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6,
      }}>
        {label}
        {required && <span style={{ color: '#B91C3C' }}>*</span>}
        {hint && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 4, fontSize: 10 }}>— {hint}</span>}
      </label>
      {children}
    </div>
  )
}

function G({ cols = 2, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '14px 16px', marginBottom: 16 }}>
      {children}
    </div>
  )
}

function SecLabel({ icon: Icon, color, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '20px 0 12px' }}>
      <div style={{ width: 26, height: 26, borderRadius: 6, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={13} color={color} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '.07em' }}>{title}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border-color)', marginLeft: 6 }} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   ESTADO INICIAL
═══════════════════════════════════════════════════════════════════ */
const EMPTY = {
  modification_type: 'ADDITION',
  addition_value: '', extension_days: '', new_end_date: '',
  justification: '', administrative_act: '', approval_date: '',
  extension_period_text: '',
  supervisor_name: '', supervisor_id: '', supervisor_entity_name: '',
  cdp: '', cdp_value: '', rp: '', rp_value: '',
  requires_policy_update: false, policy_update_description: '',
  payment_method_modification: '',
  entity_legal_representative_name: '', entity_legal_representative_id: '',
  entity_legal_representative_id_type: 'CC',
}

function recordToForm(r) {
  if (!r) return { ...EMPTY }
  return {
    modification_type:     r.modification_type || 'ADDITION',
    addition_value:        r.addition_value  ?? '',
    extension_days:        r.extension_days  ?? '',
    new_end_date:          r.new_end_date    || '',
    justification:         r.justification   || '',
    administrative_act:    r.administrative_act || '',
    approval_date:         r.approval_date   || '',
    extension_period_text: r.extension_period_text || '',
    supervisor_name:       r.supervisor_name || '',
    supervisor_id:         r.supervisor_id   || '',
    supervisor_entity_name:r.supervisor_entity_name || '',
    cdp:                   r.cdp    || '',
    cdp_value:             r.cdp_value ?? '',
    rp:                    r.rp     || '',
    rp_value:              r.rp_value  ?? '',
    requires_policy_update:      r.requires_policy_update      || false,
    policy_update_description:   r.policy_update_description   || '',
    payment_method_modification: r.payment_method_modification || '',
    entity_legal_representative_name:    r.entity_legal_representative_name    || '',
    entity_legal_representative_id:      r.entity_legal_representative_id      || '',
    entity_legal_representative_id_type: r.entity_legal_representative_id_type || 'CC',
  }
}

/* ═══════════════════════════════════════════════════════════════════
   MODAL
═══════════════════════════════════════════════════════════════════ */
function ModModal({ projectId, projectValue, prevAdditions, record, onClose, onSaved }) {
  const isEdit = Boolean(record)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(() => recordToForm(record))
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const meta     = MOD_TYPES.find(t => t.value === form.modification_type) || MOD_TYPES[0]
  const needsAdd = meta.needsAddition
  const needsExt = meta.needsExtension

  /* ── Calcular nuevo valor total automáticamente ──────────────────
     Si es edición, restamos la adición original de este registro
     para no contarla dos veces (ya está en prevAdditions).
     Fórmula: valor_contrato + adiciones_previas_sin_esta + adicion_actual
  ─────────────────────────────────────────────────────────────────── */
  const originalAddition = isEdit && record.addition_value ? Number(record.addition_value) : 0
  const additionsBase    = prevAdditions - originalAddition   // adiciones previas sin contar la actual
  const currentAddition  = Number(form.addition_value) || 0
  const newTotalValue    = needsAdd
    ? (Number(projectValue) || 0) + additionsBase + currentAddition
    : null

  const submit = async () => {
    if (!form.approval_date)
      return toast.error('La fecha de aprobación es obligatoria')
    if (needsAdd) {
      if (form.addition_value === '' || form.addition_value === null)
        return toast.error('El valor de adición es obligatorio para este tipo')
      if (Number(form.addition_value) <= 0)
        return toast.error('El valor de adición debe ser mayor a $0')
    }
    if (needsExt) {
      if (form.extension_days === '' || form.extension_days === null)
        return toast.error('Los días de prórroga son obligatorios para este tipo')
      if (Number(form.extension_days) <= 0)
        return toast.error('Los días de prórroga deben ser mayor a 0')
    }

    setSaving(true)
    try {
      const payload = {
        modification_type:    form.modification_type,
        approval_date:        form.approval_date,
        justification:        form.justification         || null,
        administrative_act:   form.administrative_act    || null,
        new_end_date:         form.new_end_date          || null,
        extension_period_text:form.extension_period_text || null,
        supervisor_name:      form.supervisor_name       || null,
        supervisor_id:        form.supervisor_id         || null,
        supervisor_entity_name: form.supervisor_entity_name || null,
        cdp:                  form.cdp  || null,
        rp:                   form.rp   || null,
        requires_policy_update:      form.requires_policy_update,
        policy_update_description:   form.policy_update_description   || null,
        payment_method_modification: form.payment_method_modification || null,
        entity_legal_representative_name:    form.entity_legal_representative_name    || null,
        entity_legal_representative_id:      form.entity_legal_representative_id      || null,
        entity_legal_representative_id_type: form.entity_legal_representative_id_type || null,
        addition_value:  needsAdd ? (form.addition_value  !== '' ? Number(form.addition_value)  : null) : null,
        extension_days:  needsExt ? (form.extension_days  !== '' ? Number(form.extension_days)  : null) : null,
        // nuevo_valor_total calculado automáticamente
        new_total_value: needsAdd && newTotalValue > 0 ? newTotalValue : null,
        cdp_value:       form.cdp_value !== '' ? Number(form.cdp_value) : null,
        rp_value:        form.rp_value  !== '' ? Number(form.rp_value)  : null,
      }
      isEdit
        ? await modificationsService.update(record.modification_id, payload)
        : await modificationsService.create(projectId, payload)

      toast.success(isEdit ? 'Modificación actualizada ✓' : 'Modificación creada ✓')
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al guardar')
    } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)' }} />
      <div style={{
        position: 'relative', background: 'var(--bg-card)',
        borderRadius: 14, border: '1px solid var(--border-color)',
        width: '100%', maxWidth: 720, maxHeight: '92vh',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--bg-hover)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245,158,11,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GitBranch size={16} color="#F59E0B" />
            </div>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {isEdit ? 'Editar modificación' : 'Nueva modificación'}
              </h2>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                {isEdit ? `Modificación #${record.modification_number}` : 'Complete los datos según el tipo seleccionado'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* Tipo */}
          <G cols={1}>
            <F label="Tipo de modificación" required>
              <select style={INP} value={form.modification_type}
                onChange={e => set('modification_type', e.target.value)}>
                {MOD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </F>
          </G>

          {/* Indicador */}
          <div style={{ padding: '8px 12px', borderRadius: 8, background: `${meta.color}12`, border: `1px solid ${meta.color}30`, marginBottom: 16, fontSize: 12, color: meta.color, fontWeight: 600 }}>
            {needsAdd &&  needsExt && '⚡ Requiere valor de adición (COP) + días de prórroga'}
            {needsAdd && !needsExt && '💰 Requiere valor de adición en COP'}
            {!needsAdd && needsExt && '📅 Requiere número de días de prórroga'}
            {!needsAdd && !needsExt && 'ℹ️ Solo requiere fecha de aprobación y justificación'}
          </div>

          {/* ── ADICIÓN ── */}
          {needsAdd && <>
            <SecLabel icon={DollarSign} color="#10B981" title="Adición de valor" />

            {/* Resumen del contrato actual */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px 16px', marginBottom: 14, padding: '10px 14px', background: 'var(--bg-hover)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <div>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>Valor contrato original</p>
                <p style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)' }}>{fmtMoney(projectValue)}</p>
              </div>
              <div>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>Adiciones anteriores</p>
                <p style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: additionsBase > 0 ? '#F59E0B' : 'var(--text-muted)' }}>
                  {additionsBase > 0 ? fmtMoney(additionsBase) : '$ 0'}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>Valor actual del contrato</p>
                <p style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: '#0EA5E9' }}>
                  {fmtMoney((Number(projectValue) || 0) + additionsBase)}
                </p>
              </div>
            </div>

            <G cols={2}>
              <F label="Valor de la adición (COP)" required hint="Solo números">
                <MoneyInput value={form.addition_value} onChange={v => set('addition_value', v)} />
              </F>
              <F label="Nuevo valor total del contrato" hint="Calculado automáticamente">
                <MoneyReadonly value={newTotalValue > 0 ? newTotalValue : ''} />
                {newTotalValue > 0 && (
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                    = {fmtMoney(projectValue)} + {fmtMoney(additionsBase)} + {fmtMoney(Number(form.addition_value) || 0)}
                  </p>
                )}
              </F>
              <F label="CDP" hint={`Máx. ${LIM.cdp} car.`}>
                <TxtInp value={form.cdp} onChange={v => set('cdp', v)} max={LIM.cdp} placeholder="N° Certificado Disponibilidad Presupuestal" />
              </F>
              <F label="Valor CDP (COP)" hint="Solo números">
                <MoneyInput value={form.cdp_value} onChange={v => set('cdp_value', v)} />
              </F>
              <F label="RP" hint={`Máx. ${LIM.rp} car.`}>
                <TxtInp value={form.rp} onChange={v => set('rp', v)} max={LIM.rp} placeholder="N° Registro Presupuestal" />
              </F>
              <F label="Valor RP (COP)" hint="Solo números">
                <MoneyInput value={form.rp_value} onChange={v => set('rp_value', v)} />
              </F>
            </G>
          </>}

          {/* ── PRÓRROGA ── */}
          {needsExt && <>
            <SecLabel icon={Clock} color="#0EA5E9" title="Prórroga de tiempo" />
            <G cols={3}>
              <F label="Días de prórroga" required hint="Entero positivo">
                <IntInput value={form.extension_days} onChange={v => set('extension_days', v)} placeholder="30" />
              </F>
              <F label="Nueva fecha de fin">
                <input style={INP} type="date" value={form.new_end_date}
                  onChange={e => set('new_end_date', e.target.value)} />
              </F>
              <F label="Período en texto" hint={`Máx. ${LIM.extension_period_text} car.`}>
                <TxtInp value={form.extension_period_text} onChange={v => set('extension_period_text', v)}
                  max={LIM.extension_period_text} placeholder="TREINTA (30) DÍAS" />
              </F>
            </G>
          </>}

          {/* ── DATOS GENERALES ── */}
          <SecLabel icon={FileText} color="#F59E0B" title="Datos generales" />
          <G cols={2}>
            <F label="Acto administrativo" hint={`Máx. ${LIM.administrative_act} car.`}>
              <TxtInp value={form.administrative_act} onChange={v => set('administrative_act', v)}
                max={LIM.administrative_act} placeholder="Resolución 001 de 2025" />
            </F>
            <F label="Fecha de aprobación" required>
              <input style={INP} type="date" value={form.approval_date}
                onChange={e => set('approval_date', e.target.value)} />
            </F>
          </G>
          <G cols={1}>
            <F label="Justificación" hint={`Máx. ${LIM.justification} car.`}>
              <TxtArea value={form.justification} onChange={v => set('justification', v)}
                max={LIM.justification} rows={4} placeholder="Describa el motivo de la modificación..." />
            </F>
          </G>

          {/* ── SUPERVISOR ── */}
          <SecLabel icon={Users} color="#8B5CF6" title="Supervisor del contrato" />
          <G cols={3}>
            <F label="Nombre del supervisor" hint={`Máx. ${LIM.supervisor_name} car.`}>
              <TxtInp value={form.supervisor_name} onChange={v => set('supervisor_name', v)}
                max={LIM.supervisor_name} placeholder="Nombre completo" />
            </F>
            <F label="N° identificación" hint={`Máx. ${LIM.supervisor_id} car.`}>
              <TxtInp value={form.supervisor_id} onChange={v => set('supervisor_id', v)}
                max={LIM.supervisor_id} placeholder="Número de documento" />
            </F>
            <F label="Entidad del supervisor" hint={`Máx. ${LIM.supervisor_entity_name} car.`}>
              <TxtInp value={form.supervisor_entity_name} onChange={v => set('supervisor_entity_name', v)}
                max={LIM.supervisor_entity_name} placeholder="Nombre de la entidad" />
            </F>
          </G>

          {/* ── REPRESENTANTE LEGAL ── */}
          <SecLabel icon={Users} color="#B91C3C" title="Representante legal de la entidad contratante" />
          <G cols={3}>
            <F label="Nombre completo" hint={`Máx. ${LIM.entity_legal_representative_name} car.`}>
              <TxtInp value={form.entity_legal_representative_name}
                onChange={v => set('entity_legal_representative_name', v)}
                max={LIM.entity_legal_representative_name} placeholder="Nombre completo" />
            </F>
            <F label="N° identificación" hint={`Máx. ${LIM.entity_legal_representative_id} car.`}>
              <TxtInp value={form.entity_legal_representative_id}
                onChange={v => set('entity_legal_representative_id', v)}
                max={LIM.entity_legal_representative_id} placeholder="Número de documento" />
            </F>
            <F label="Tipo documento">
              <select style={INP} value={form.entity_legal_representative_id_type}
                onChange={e => set('entity_legal_representative_id_type', e.target.value)}>
                {['CC', 'CE', 'NIT', 'PA', 'PEP'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </F>
          </G>

          {/* ── ADICIONAL ── */}
          <SecLabel icon={Shield} color="#64748B" title="Información adicional" />
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', userSelect: 'none' }}>
              <input type="checkbox" checked={form.requires_policy_update}
                onChange={e => set('requires_policy_update', e.target.checked)}
                style={{ accentColor: '#0EA5E9', width: 15, height: 15 }} />
              Requiere actualización de póliza
            </label>
            {form.requires_policy_update && (
              <div style={{ marginTop: 10 }}>
                <F label="Descripción de la actualización de póliza" hint={`Máx. ${LIM.policy_update_description} car.`}>
                  <TxtArea value={form.policy_update_description}
                    onChange={v => set('policy_update_description', v)}
                    max={LIM.policy_update_description} rows={3}
                    placeholder="Describe los cambios en la póliza..." />
                </F>
              </div>
            )}
          </div>
          <G cols={1}>
            <F label="Modificación de forma de pago" hint={`Máx. ${LIM.payment_method_modification} car.`}>
              <TxtArea value={form.payment_method_modification}
                onChange={v => set('payment_method_modification', v)}
                max={LIM.payment_method_modification} rows={3}
                placeholder="Describir si hay cambios en la forma de pago (opcional)..." />
            </F>
          </G>

        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0, background: 'var(--bg-hover)' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
            Cancelar
          </button>
          <button onClick={submit} disabled={saving} style={{ padding: '8px 22px', borderRadius: 8, border: 'none', background: '#F59E0B', color: '#000', cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1 }}>
            <Check size={14} />
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear modificación'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
═══════════════════════════════════════════════════════════════════ */
export default function ProjectModificationsPage() {
  const navigate  = useNavigate()
  const { id }    = useParams()
  const [project,      setProject]      = useState(null)
  const [mods,         setMods]         = useState([])
  const [loading,      setLoading]      = useState(true)
  const [modal,        setModal]        = useState(null)
  const [prevAdditions,setPrevAdditions] = useState(0)   // suma adiciones activas del proyecto

  const loadProject = useCallback(async () => {
    try { const r = await projectsService.get(id); setProject(r.data) }
    catch { toast.error('Error cargando proyecto') }
  }, [id])

  const loadAdditions = useCallback(async () => {
    try {
      const r = await projectsService.getAdditions(id)
      setPrevAdditions(Number(r.data.total_additions) || 0)
    } catch { /* silencioso */ }
  }, [id])

  const loadMods = useCallback(async () => {
    setLoading(true)
    try {
      const r = await modificationsService.list(id)
      setMods(Array.isArray(r.data) ? r.data : [])
    } catch (err) {
      console.error('Error modificaciones:', err)
      toast.error('Error al cargar modificaciones')
      setMods([])
    } finally { setLoading(false) }
  }, [id])

  useEffect(() => {
    loadProject()
    loadMods()
    loadAdditions()
  }, [loadProject, loadMods, loadAdditions])

  const handleToggle = async (m) => {
    try {
      await modificationsService.toggle(m.modification_id)
      toast.success(m.is_active ? 'Modificación deshabilitada' : 'Modificación habilitada')
      // Recargar todo para que las sumas queden correctas
      loadMods()
      loadAdditions()
    } catch { toast.error('Error al cambiar estado') }
  }

  const afterSave = () => {
    setModal(null)
    loadMods()
    loadAdditions()  // actualizar suma para el próximo modal
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* Topbar */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/projects')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid var(--border-color)', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, fontFamily: 'inherit', padding: '7px 12px', borderRadius: 8 }}>
            <ArrowLeft size={15} /> Volver
          </button>
          <div style={{ width: 1, height: 24, background: 'var(--border-color)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(245,158,11,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GitBranch size={18} color="#F59E0B" />
            </div>
            <div>
              <h1 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Modificaciones · {project ? `${project.project_year} #${project.internal_project_number}` : '...'}
              </h1>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                {project?.project_name}
                {!loading && mods.length > 0 && (
                  <span style={{ marginLeft: 8, fontWeight: 700, color: '#F59E0B' }}>
                    · {mods.length} modificación{mods.length !== 1 ? 'es' : ''}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { loadMods(); loadAdditions() }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
            <RefreshCw size={13} /> Actualizar
          </button>
          <button onClick={() => setModal({})} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, border: 'none', background: '#F59E0B', color: '#000', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700 }}>
            <Plus size={14} /> Nueva modificación
          </button>
        </div>
      </div>

      {/* Lista */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-primary)', padding: '28px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>

          {/* Resumen financiero si hay adiciones */}
          {!loading && project && prevAdditions > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px 16px', marginBottom: 20, padding: '14px 18px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10 }}>
              <div>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>Valor contrato original</p>
                <p style={{ fontSize: 14, fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)' }}>{fmtMoney(project.project_value)}</p>
              </div>
              <div>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>Total adiciones activas</p>
                <p style={{ fontSize: 14, fontFamily: 'monospace', fontWeight: 700, color: '#F59E0B' }}>{fmtMoney(prevAdditions)}</p>
              </div>
              <div>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>Valor actual del contrato</p>
                <p style={{ fontSize: 14, fontFamily: 'monospace', fontWeight: 700, color: '#10B981' }}>{fmtMoney((Number(project.project_value) || 0) + prevAdditions)}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              Cargando modificaciones...
            </div>
          ) : mods.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <GitBranch size={44} style={{ opacity: .15, margin: '0 auto 18px', display: 'block', color: 'var(--text-muted)' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 18 }}>
                No hay modificaciones registradas para este proyecto
              </p>
              <button onClick={() => setModal({})} style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: '#F59E0B', color: '#000', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Plus size={14} /> Crear primera modificación
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {mods.map(m => {
                const meta = MOD_TYPES.find(t => t.value === m.modification_type) || { label: m.modification_type, color: '#94A3B8' }
                return (
                  <div key={m.modification_id} style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                    borderLeft: `4px solid ${meta.color}`, borderRadius: 10,
                    padding: '16px 20px', opacity: m.is_active ? 1 : 0.55, transition: 'opacity .2s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)' }}>#{m.modification_number}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: `${meta.color}15`, color: meta.color, border: `1px solid ${meta.color}33` }}>
                            {meta.label}
                          </span>
                          {!m.is_active && (
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(185,28,60,.1)', color: '#B91C3C', border: '1px solid rgba(185,28,60,.25)' }}>
                              Inactiva
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '8px 20px' }}>
                          {m.approval_date && (
                            <div>
                              <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>Fecha aprobación</p>
                              <p style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2 }}>{m.approval_date}</p>
                            </div>
                          )}
                          {m.addition_value != null && (
                            <div>
                              <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>Valor adición</p>
                              <p style={{ fontSize: 13, color: '#10B981', fontWeight: 700, fontFamily: 'monospace', marginTop: 2 }}>{fmtMoney(m.addition_value)}</p>
                            </div>
                          )}
                          {m.extension_days != null && (
                            <div>
                              <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>Días prórroga</p>
                              <p style={{ fontSize: 13, color: '#0EA5E9', fontWeight: 700, marginTop: 2 }}>{m.extension_days} días</p>
                            </div>
                          )}
                          {m.new_end_date && (
                            <div>
                              <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>Nueva fecha fin</p>
                              <p style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2 }}>{m.new_end_date}</p>
                            </div>
                          )}
                          {m.new_total_value != null && (
                            <div>
                              <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>Nuevo valor total</p>
                              <p style={{ fontSize: 13, color: '#10B981', fontFamily: 'monospace', fontWeight: 700, marginTop: 2 }}>{fmtMoney(m.new_total_value)}</p>
                            </div>
                          )}
                          {m.administrative_act && (
                            <div>
                              <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>Acto adm.</p>
                              <p style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2 }}>{m.administrative_act}</p>
                            </div>
                          )}
                          {m.cdp && (
                            <div>
                              <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>CDP</p>
                              <p style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2 }}>{m.cdp}{m.cdp_value != null ? ` · ${fmtMoney(m.cdp_value)}` : ''}</p>
                            </div>
                          )}
                          {m.rp && (
                            <div>
                              <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>RP</p>
                              <p style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2 }}>{m.rp}{m.rp_value != null ? ` · ${fmtMoney(m.rp_value)}` : ''}</p>
                            </div>
                          )}
                          {m.supervisor_name && (
                            <div>
                              <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>Supervisor</p>
                              <p style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2 }}>{m.supervisor_name}</p>
                            </div>
                          )}
                        </div>

                        {m.justification && (
                          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 10, fontStyle: 'italic', borderLeft: `3px solid ${meta.color}44`, paddingLeft: 10 }}>
                            {m.justification}
                          </p>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button title="Editar" onClick={() => setModal({ record: m })}
                          style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(14,165,233,.3)', background: 'rgba(14,165,233,.1)', color: '#0EA5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <Pencil size={13} />
                        </button>
                        <button title={m.is_active ? 'Deshabilitar' : 'Habilitar'} onClick={() => handleToggle(m)}
                          style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${m.is_active ? 'rgba(185,28,60,.3)' : 'rgba(16,185,129,.3)'}`, background: m.is_active ? 'rgba(185,28,60,.1)' : 'rgba(16,185,129,.1)', color: m.is_active ? '#B91C3C' : '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          {m.is_active ? <PowerOff size={13} /> : <Power size={13} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal !== null && (
        <ModModal
          projectId={id}
          projectValue={project?.project_value ?? 0}
          prevAdditions={prevAdditions}
          record={modal.record || null}
          onClose={() => setModal(null)}
          onSaved={afterSave}
        />
      )}
    </div>
  )
}
