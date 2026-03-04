import { useState, useEffect, useCallback } from 'react'
import { X, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { modificationsService } from '../../../services/projects'

/* ═══════════════════════════════════════════════════════════════════
   HELPERS — números en español
═══════════════════════════════════════════════════════════════════ */
const UNIDADES = ['','UNO','DOS','TRES','CUATRO','CINCO','SEIS','SIETE','OCHO','NUEVE',
  'DIEZ','ONCE','DOCE','TRECE','CATORCE','QUINCE','DIECISÉIS','DIECISIETE','DIECIOCHO','DIECINUEVE']
const DECENAS  = ['','','VEINTE','TREINTA','CUARENTA','CINCUENTA','SESENTA','SETENTA','OCHENTA','NOVENTA']

function numToWords(n) {
  n = parseInt(n)
  if (!n || n <= 0) return 'CERO'
  if (n < 20)  return UNIDADES[n]
  if (n < 100) {
    const d = Math.floor(n/10), u = n%10
    return u === 0 ? DECENAS[d] : (d === 2 ? `VEINTI${UNIDADES[u]}` : `${DECENAS[d]} Y ${UNIDADES[u]}`)
  }
  if (n < 1000) {
    const c = Math.floor(n/100), r = n%100
    const cWord = c===1?'CIEN':c===5?'QUINIENTOS':c===7?'SETECIENTOS':c===9?'NOVECIENTOS':`${UNIDADES[c]}CIENTOS`
    return r === 0 ? cWord : `${cWord} ${numToWords(r)}`
  }
  return String(n)
}

function daysToText(days) {
  if (!days || days <= 0) return ''
  const months = Math.floor(days / 30)
  const rem    = days % 30
  const parts  = []
  if (months > 0) parts.push(`${numToWords(months)} (${months}) ${months === 1 ? 'MES' : 'MESES'}`)
  if (rem > 0)    parts.push(`${numToWords(rem)} (${rem}) DÍAS`)
  return parts.join(' Y ')
}

function calcDays(from, to) {
  if (!from || !to) return 0
  const d = Math.round((new Date(to) - new Date(from)) / 86400000)
  return d > 0 ? d : 0
}

function addOneDay(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0,10)
}

function fmtPesos(v) {
  if (!v && v !== 0) return ''
  return new Intl.NumberFormat('es-CO', { style:'currency', currency:'COP', minimumFractionDigits:0 }).format(v)
}

function parseNum(v) {
  if (!v && v !== 0) return 0
  return parseFloat(String(v).replace(/[^0-9.]/g,'')) || 0
}

/* ═══════════════════════════════════════════════════════════════════
   UI HELPERS
═══════════════════════════════════════════════════════════════════ */
const F = ({ label, required, children, hint, span }) => (
  <div style={span ? { gridColumn:`span ${span}` } : {}}>
    <label style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)',
      textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:5 }}>
      {label}{required && <span style={{ color:'#B91C3C', marginLeft:3 }}>*</span>}
    </label>
    {children}
    {hint && <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:3 }}>{hint}</p>}
  </div>
)

const G = ({ cols=2, children }) => (
  <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols},1fr)`, gap:14, marginBottom:16 }}>
    {children}
  </div>
)

const SectionTitle = ({ text, color='#0EA5E9' }) => (
  <div style={{ display:'flex', alignItems:'center', gap:8, margin:'20px 0 12px',
    paddingBottom:8, borderBottom:'1px solid var(--border-color)' }}>
    <div style={{ width:3, height:16, borderRadius:2, background:color }}/>
    <span style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)',
      textTransform:'uppercase', letterSpacing:'.07em' }}>{text}</span>
  </div>
)

const Inp = ({ value, onChange, type='text', placeholder='', disabled=false, min, required }) => (
  <input className="input-field" type={type} value={value||''} placeholder={placeholder}
    disabled={disabled} min={min} required={required}
    onChange={e => onChange(e.target.value)}
    style={{ background: disabled ? 'var(--bg-hover)' : undefined }}/>
)

const Sel = ({ value, onChange, children, disabled }) => (
  <select className="input-field" value={value||''} disabled={disabled} onChange={e => onChange(e.target.value)}>
    {children}
  </select>
)

const Txt = ({ value, onChange, rows=3, placeholder='', disabled=false }) => (
  <textarea className="input-field" rows={rows} value={value||''} placeholder={placeholder}
    disabled={disabled} onChange={e => onChange(e.target.value)}
    style={{ resize:'vertical', background: disabled ? 'var(--bg-hover)' : undefined }}/>
)

const PesosInput = ({ value, onChange, placeholder='$ 0', disabled=false }) => {
  const [display, setDisplay] = useState('')
  useEffect(() => {
    if (value) setDisplay(fmtPesos(value))
  }, [])
  return (
    <input className="input-field" type="text" value={display} disabled={disabled}
      placeholder={placeholder}
      onChange={e => {
        const raw = e.target.value.replace(/[^0-9]/g,'')
        setDisplay(raw ? fmtPesos(raw) : '')
        onChange(raw ? parseInt(raw) : '')
      }}
      onFocus={e => { if (value) setDisplay(String(parseNum(value))) }}
      onBlur={e  => { if (value) setDisplay(fmtPesos(value)) }}
    />
  )
}

const Checkbox = ({ checked, onChange, label }) => (
  <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer',
    padding:'10px 12px', borderRadius:8, background:'var(--bg-hover)',
    border:`1px solid ${checked ? '#0EA5E9' : 'var(--border-color)'}` }}>
    <input type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)}
      style={{ width:15, height:15, accentColor:'#0EA5E9' }}/>
    <span style={{ fontSize:13, color:'var(--text-primary)', userSelect:'none' }}>{label}</span>
  </label>
)

const InfoBox = ({ text, color='#0EA5E9' }) => (
  <div style={{ padding:'10px 14px', borderRadius:8, background:`${color}10`,
    border:`1px solid ${color}30`, fontSize:12, color:'var(--text-secondary)', marginBottom:16 }}>
    {text}
  </div>
)

/* ═══════════════════════════════════════════════════════════════════
   SECCIÓN DATOS GENERALES (común a todos)
═══════════════════════════════════════════════════════════════════ */
function SecDatosGenerales({ form, set, project, modType }) {
  return <>
    <SectionTitle text="Datos Generales de la Modificación"/>
    <G cols={3}>
      <F label="Acto administrativo" required={!['SUSPENSION','RESTART'].includes(modType)}>
        <Inp value={form.administrative_act} onChange={v=>set('administrative_act',v)} placeholder="Ej: OTRO-SI No. 1"/>
      </F>
      <F label="Fecha de aprobación" required>
        <Inp type="date" value={form.approval_date} onChange={v=>set('approval_date',v)}/>
      </F>
      <F label="No. de modificación" hint="Calculado automáticamente">
        <Inp value="Automático" disabled/>
      </F>
    </G>
    {!['SUSPENSION','RESTART','LIQUIDATION'].includes(modType) && (
      <F label="Justificación" span={2}>
        <Txt value={form.justification} onChange={v=>set('justification',v)} rows={3}
          placeholder="Justificación de la modificación..."/>
      </F>
    )}
  </>
}

/* ═══════════════════════════════════════════════════════════════════
   SECCIÓN ADICIÓN
═══════════════════════════════════════════════════════════════════ */
function SecAdicion({ form, set }) {
  return <>
    <SectionTitle text="Adición Presupuestal" color="#10B981"/>
    <G cols={2}>
      <F label="Valor de la adición" required>
        <PesosInput value={form.addition_value} onChange={v=>set('addition_value',v)}/>
      </F>
      <F label="Nuevo valor total del contrato" hint="Se calcula automáticamente">
        <Inp value={form.new_total_value ? fmtPesos(form.new_total_value) : ''} disabled placeholder="Calculado"/>
      </F>
    </G>
    <G cols={1}>
      <Checkbox checked={form.payment_method_modification}
        onChange={v => set('payment_method_modification', v ? '' : null)}
        label="¿Requiere modificación de la forma de pago?"/>
    </G>
    {form.payment_method_modification !== null && form.payment_method_modification !== undefined && form.payment_method_modification !== false && (
      <F label="Descripción de la modificación de pago" required>
        <Txt value={form.payment_method_modification} onChange={v=>set('payment_method_modification',v)}
          placeholder="Describa cómo cambia la forma de pago..."/>
      </F>
    )}
    <G cols={1} style={{ marginTop:8 }}>
      <Checkbox checked={form.requires_policy_update}
        onChange={v => set('requires_policy_update', v)}
        label="¿Requiere actualización de póliza?"/>
    </G>
    {form.requires_policy_update && (
      <F label="Descripción actualización de póliza" required>
        <Txt value={form.policy_update_description} onChange={v=>set('policy_update_description',v)}
          placeholder="Describa los cambios en la póliza..."/>
      </F>
    )}
  </>
}

/* ═══════════════════════════════════════════════════════════════════
   SECCIÓN PRÓRROGA
═══════════════════════════════════════════════════════════════════ */
function SecProrrhoga({ form, set, project }) {
  const days = calcDays(project?.end_date, form.new_end_date)
  const text = daysToText(days)

  useEffect(() => {
    if (days > 0) {
      set('extension_days', days)
      set('extension_period_text', text)
    }
  }, [form.new_end_date])

  return <>
    <SectionTitle text="Prórroga de Plazo" color="#8B5CF6"/>
    <G cols={3}>
      <F label="Fecha fin actual" hint="Del proyecto">
        <Inp value={project?.end_date||''} disabled/>
      </F>
      <F label="Nueva fecha de fin" required>
        <Inp type="date" value={form.new_end_date} onChange={v=>set('new_end_date',v)}
          min={project?.end_date}/>
      </F>
      <F label="Días de prórroga" hint="Calculado automáticamente">
        <Inp value={days > 0 ? `${days} días` : ''} disabled/>
      </F>
    </G>
    {text && (
      <InfoBox text={`Período en letras: ${text}`} color="#8B5CF6"/>
    )}
    <G cols={1}>
      <Checkbox checked={form.payment_method_modification}
        onChange={v => set('payment_method_modification', v ? '' : null)}
        label="¿Requiere modificación de la forma de pago?"/>
    </G>
    {form.payment_method_modification !== null && form.payment_method_modification !== undefined && form.payment_method_modification !== false && (
      <F label="Descripción modificación de pago" required>
        <Txt value={form.payment_method_modification} onChange={v=>set('payment_method_modification',v)}
          placeholder="Describa cómo cambia la forma de pago..."/>
      </F>
    )}
    <G cols={1} style={{ marginTop:8 }}>
      <Checkbox checked={form.requires_policy_update}
        onChange={v => set('requires_policy_update', v)}
        label="¿Requiere actualización de póliza?"/>
    </G>
    {form.requires_policy_update && (
      <F label="Descripción actualización de póliza" required>
        <Txt value={form.policy_update_description} onChange={v=>set('policy_update_description',v)}
          placeholder="Describa los cambios en la póliza..."/>
      </F>
    )}
  </>
}

/* ═══════════════════════════════════════════════════════════════════
   SECCIÓN MODIFICACIÓN CONTRACTUAL
═══════════════════════════════════════════════════════════════════ */
function SecContractual({ form, set }) {
  return <>
    <SectionTitle text="Modificación Contractual" color="#F59E0B"/>
    <F label="Descripción de la modificación" required span={2}>
      <Txt value={form.modification_description} onChange={v=>set('modification_description',v)}
        rows={5} placeholder="Describa detalladamente la modificación contractual..."/>
    </F>
    <G cols={1} style={{ marginTop:8 }}>
      <Checkbox checked={form.requires_resource_liberation}
        onChange={v => set('requires_resource_liberation', v)}
        label="¿Requiere liberación de recursos? (el valor del contrato disminuirá)"/>
    </G>
    {form.requires_resource_liberation && <>
      <SectionTitle text="Datos de Liberación de Recursos" color="#EF4444"/>
      <G cols={3}>
        <F label="CDP a liberar">
          <Inp value={form.cdp_to_release} onChange={v=>set('cdp_to_release',v)} placeholder="No. CDP"/>
        </F>
        <F label="RP a liberar">
          <Inp value={form.rp_to_release} onChange={v=>set('rp_to_release',v)} placeholder="No. RP"/>
        </F>
        <F label="Valor a liberar" required>
          <PesosInput value={form.liberation_amount} onChange={v=>set('liberation_amount',v)}/>
        </F>
      </G>
    </>}
  </>
}

/* ═══════════════════════════════════════════════════════════════════
   SECCIÓN SUSPENSIÓN
═══════════════════════════════════════════════════════════════════ */
function SecSuspension({ form, set }) {
  const restartDate = addOneDay(form.suspension_end_date)

  useEffect(() => {
    if (restartDate) set('planned_restart_date', restartDate)
  }, [form.suspension_end_date])

  return <>
    <SectionTitle text="Suspensión del Contrato" color="#EF4444"/>
    <G cols={3}>
      <F label="Fecha inicio suspensión" required>
        <Inp type="date" value={form.suspension_start_date} onChange={v=>set('suspension_start_date',v)}/>
      </F>
      <F label="Fecha fin suspensión" required>
        <Inp type="date" value={form.suspension_end_date} onChange={v=>set('suspension_end_date',v)}
          min={form.suspension_start_date}/>
      </F>
      <F label="Fecha reinicio programada" hint="Calculada automáticamente (día siguiente)">
        <Inp value={restartDate} disabled/>
      </F>
    </G>
    <G cols={2}>
      <F label="Justificación del contratista" required>
        <Txt value={form.contractor_justification} onChange={v=>set('contractor_justification',v)}
          rows={4} placeholder="Razones del contratista para la suspensión..."/>
      </F>
      <F label="Justificación del supervisor" required>
        <Txt value={form.supervisor_justification} onChange={v=>set('supervisor_justification',v)}
          rows={4} placeholder="Concepto del supervisor sobre la suspensión..."/>
      </F>
    </G>
  </>
}

/* ═══════════════════════════════════════════════════════════════════
   SECCIÓN REINICIO
═══════════════════════════════════════════════════════════════════ */
function SecReinicio({ form, set, suspensions }) {
  return <>
    <SectionTitle text="Reinicio del Contrato" color="#06B6D4"/>
    {suspensions.length === 0 ? (
      <InfoBox text="⚠️ No hay suspensiones previas para este proyecto." color="#F59E0B"/>
    ) : (
      <G cols={2}>
        <F label="Suspensión a reiniciar" required>
          <Sel value={form.linked_suspension_id} onChange={v=>set('linked_suspension_id',v)}>
            <option value="">— Seleccionar suspensión —</option>
            {suspensions.map(s => (
              <option key={s.suspension_id} value={s.suspension_id}>
                Suspensión #{s.suspension_id} — desde {s.suspension_start_date} hasta {s.suspension_end_date}
              </option>
            ))}
          </Sel>
        </F>
        <F label="Fecha real de reinicio" required>
          <Inp type="date" value={form.actual_restart_date} onChange={v=>set('actual_restart_date',v)}/>
        </F>
      </G>
    )}
  </>
}

/* ═══════════════════════════════════════════════════════════════════
   SECCIÓN CESIÓN
═══════════════════════════════════════════════════════════════════ */
function SecCesion({ form, set, modType }) {
  const isCesionaria = modType === 'CESION_CESIONARIA'
  const label = isCesionaria
    ? 'La Universidad recibe la cesión (es cesionaria)'
    : 'La Universidad entrega la cesión (es cedente)'

  return <>
    <SectionTitle text={`Cesión de Contrato — ${isCesionaria ? 'Universidad como Cesionaria' : 'Universidad como Cedente'}`} color="#8B5CF6"/>
    <InfoBox text={label} color="#8B5CF6"/>
    <G cols={3}>
      <F label="Nombre del cedente" required>
        <Inp value={form.assignor_name} onChange={v=>set('assignor_name',v)} placeholder="Nombre completo"/>
      </F>
      <F label="Identificación cedente" required>
        <Inp value={form.assignor_id} onChange={v=>set('assignor_id',v)} placeholder="No. documento"/>
      </F>
      <F label="Tipo ID cedente">
        <Sel value={form.assignor_id_type||'CC'} onChange={v=>set('assignor_id_type',v)}>
          {['CC','CE','NIT','PP','TI'].map(t=><option key={t}>{t}</option>)}
        </Sel>
      </F>
      <F label="Nombre del cesionario" required>
        <Inp value={form.assignee_name} onChange={v=>set('assignee_name',v)} placeholder="Nombre completo"/>
      </F>
      <F label="Identificación cesionario" required>
        <Inp value={form.assignee_id} onChange={v=>set('assignee_id',v)} placeholder="No. documento"/>
      </F>
      <F label="Tipo ID cesionario">
        <Sel value={form.assignee_id_type||'CC'} onChange={v=>set('assignee_id_type',v)}>
          {['CC','CE','NIT','PP','TI'].map(t=><option key={t}>{t}</option>)}
        </Sel>
      </F>
    </G>
    <SectionTitle text="Valores Financieros" color="#10B981"/>
    <G cols={3}>
      <F label="Valor cedido" required>
        <PesosInput value={form.value_to_assign} onChange={v=>set('value_to_assign',v)}/>
      </F>
      <F label="Valor pagado al cedente">
        <PesosInput value={form.value_paid_to_assignor} onChange={v=>set('value_paid_to_assignor',v)}/>
      </F>
      <F label="Valor pendiente de pago">
        <PesosInput value={form.value_pending_to_assignor} onChange={v=>set('value_pending_to_assignor',v)}/>
      </F>
      <F label="Fecha de la cesión" required>
        <Inp type="date" value={form.assignment_date} onChange={v=>set('assignment_date',v)}/>
      </F>
      <F label="Fecha firma de la cesión">
        <Inp type="date" value={form.assignment_signature_date} onChange={v=>set('assignment_signature_date',v)}/>
      </F>
    </G>
    <G cols={2}>
      <F label="CDP">
        <Inp value={form.cdp} onChange={v=>set('cdp',v)} placeholder="No. CDP"/>
      </F>
      <F label="RP">
        <Inp value={form.rp} onChange={v=>set('rp',v)} placeholder="No. RP"/>
      </F>
    </G>
    <F label="Solicitud modificación garantías">
      <Txt value={form.guarantee_modification_request} onChange={v=>set('guarantee_modification_request',v)}
        placeholder="Descripción de la solicitud de modificación de garantías..."/>
    </F>
  </>
}

/* ═══════════════════════════════════════════════════════════════════
   SECCIÓN LIQUIDACIÓN
═══════════════════════════════════════════════════════════════════ */
function SecLiquidacion({ form, set, project, prevMods }) {
  const initVal  = parseNum(project?.project_value)
  const totalAdd = prevMods.filter(m => ['ADDITION','BOTH'].includes(m.modification_type) && m.is_active)
                          .reduce((s,m) => s + parseNum(m.addition_value), 0)
  const finalVal = initVal + totalAdd

  useEffect(() => {
    set('initial_contract_value', initVal)
    set('final_value_with_additions', finalVal)
  }, [])

  useEffect(() => {
    const pct = parseNum(form.execution_percentage)
    if (pct > 0 && finalVal > 0) {
      const exec = Math.round(finalVal * pct / 100)
      set('executed_value', exec)
      set('value_to_release', finalVal - exec)
    }
  }, [form.execution_percentage])

  const isUnilateral = form.liquidation_type === 'UNILATERAL'

  return <>
    <SectionTitle text="Datos del Contrato" color="#10B981"/>
    <G cols={3}>
      <F label="Valor inicial del contrato">
        <Inp value={fmtPesos(initVal)} disabled/>
      </F>
      <F label="Total adiciones">
        <Inp value={fmtPesos(totalAdd)} disabled/>
      </F>
      <F label="Valor final con adiciones">
        <Inp value={fmtPesos(finalVal)} disabled/>
      </F>
    </G>

    <SectionTitle text="Tipo y Ejecución" color="#F59E0B"/>
    <G cols={2}>
      <F label="Tipo de liquidación" required>
        <Sel value={form.liquidation_type||'BILATERAL'} onChange={v=>set('liquidation_type',v)}>
          <option value="BILATERAL">Bilateral (de mutuo acuerdo)</option>
          <option value="UNILATERAL">Unilateral (por acto administrativo)</option>
        </Sel>
      </F>
      <F label="Porcentaje de ejecución (%)" required>
        <Inp type="number" value={form.execution_percentage} onChange={v=>set('execution_percentage',v)}
          min="0" placeholder="Ej: 85"/>
      </F>
      <F label="Valor ejecutado" hint="Calculado automáticamente">
        <Inp value={form.executed_value ? fmtPesos(form.executed_value) : ''} disabled/>
      </F>
      <F label="Valor a liberar" hint="Final - Ejecutado">
        <Inp value={form.value_to_release ? fmtPesos(form.value_to_release) : ''} disabled/>
      </F>
    </G>

    {isUnilateral && <>
      <SectionTitle text="Datos Acto Administrativo Unilateral" color="#EF4444"/>
      <G cols={3}>
        <F label="No. resolución" required>
          <Inp value={form.resolution_number} onChange={v=>set('resolution_number',v)} placeholder="Ej: 001-2026"/>
        </F>
        <F label="Fecha resolución" required>
          <Inp type="date" value={form.resolution_date} onChange={v=>set('resolution_date',v)}/>
        </F>
      </G>
      <G cols={2}>
        <F label="Causa de la liquidación unilateral" required>
          <Txt value={form.unilateral_cause} onChange={v=>set('unilateral_cause',v)} rows={3}
            placeholder="Causa que motivó la liquidación unilateral..."/>
        </F>
        <F label="Análisis de la causa" required>
          <Txt value={form.cause_analysis} onChange={v=>set('cause_analysis',v)} rows={3}
            placeholder="Análisis detallado de la causa..."/>
        </F>
      </G>
    </>}

    <SectionTitle text="CDP / RP y Fechas" color="#0EA5E9"/>
    <G cols={2}>
      <F label="CDP">
        <Inp value={form.cdp} onChange={v=>set('cdp',v)} placeholder="No. CDP"/>
      </F>
      <F label="RP">
        <Inp value={form.rp} onChange={v=>set('rp',v)} placeholder="No. RP"/>
      </F>
      <F label="Fecha de liquidación" required>
        <Inp type="date" value={form.liquidation_date} onChange={v=>set('liquidation_date',v)}/>
      </F>
      <F label="Fecha firma liquidación">
        <Inp type="date" value={form.liquidation_signature_date} onChange={v=>set('liquidation_signature_date',v)}/>
      </F>
    </G>
    <F label="Solicitud liquidación del supervisor" required>
      <Txt value={form.supervisor_liquidation_request} onChange={v=>set('supervisor_liquidation_request',v)}
        rows={4} placeholder="Texto de la solicitud del supervisor para proceder con la liquidación..."/>
    </F>
  </>
}

/* ═══════════════════════════════════════════════════════════════════
   MODAL PRINCIPAL
═══════════════════════════════════════════════════════════════════ */
const MOD_TYPES = [
  { value:'ADDITION',         label:'Adición',                    color:'#10B981' },
  { value:'EXTENSION',        label:'Prórroga',                   color:'#8B5CF6' },
  { value:'BOTH',             label:'Adición + Prórroga',         color:'#F59E0B' },
  { value:'CONTRACTUAL',      label:'Modificación Contractual',   color:'#F59E0B' },
  { value:'SUSPENSION',       label:'Suspensión',                 color:'#EF4444' },
  { value:'RESTART',          label:'Reinicio',                   color:'#06B6D4' },
  { value:'CESION_CESIONARIA',label:'Cesión (U.D. es Cesionaria)',color:'#8B5CF6' },
  { value:'CESION_CEDENTE',   label:'Cesión (U.D. es Cedente)',   color:'#8B5CF6' },
  { value:'LIQUIDATION',      label:'Liquidación',                color:'#64748B' },
]

const INITIAL_FORM = {
  // comunes
  modification_type: '',
  administrative_act: '',
  approval_date: '',
  justification: '',
  // adicion
  addition_value: '',
  new_total_value: '',
  payment_method_modification: null,
  requires_policy_update: false,
  policy_update_description: '',
  // prorroga
  new_end_date: '',
  extension_days: 0,
  extension_period_text: '',
  // contractual
  modification_description: '',
  requires_resource_liberation: false,
  cdp_to_release: '',
  rp_to_release: '',
  liberation_amount: '',
  // suspension
  suspension_start_date: '',
  suspension_end_date: '',
  planned_restart_date: '',
  contractor_justification: '',
  supervisor_justification: '',
  // reinicio
  linked_suspension_id: '',
  actual_restart_date: '',
  // cesion
  assignor_name:'', assignor_id:'', assignor_id_type:'CC',
  assignee_name:'', assignee_id:'', assignee_id_type:'CC',
  assignment_date:'', assignment_signature_date:'',
  value_to_assign:'', value_paid_to_assignor:'', value_pending_to_assignor:'',
  cdp:'', rp:'', guarantee_modification_request:'',
  // liquidacion
  liquidation_type: 'BILATERAL',
  execution_percentage: '',
  executed_value: '',
  value_to_release: '',
  initial_contract_value: '',
  final_value_with_additions: '',
  resolution_number: '', resolution_date: '',
  unilateral_cause: '', cause_analysis: '',
  liquidation_date: '', liquidation_signature_date: '',
  supervisor_liquidation_request: '',
}

export default function ModificationFormModal({ isOpen, onClose, project, prevMods=[], suspensions=[], onSaved }) {
  const [form, setForm]     = useState({ ...INITIAL_FORM })
  const [saving, setSaving] = useState(false)

  const set = useCallback((k, v) => {
    setForm(f => {
      const next = { ...f, [k]: v }
      // auto-calcular nuevo total en adición
      if ((k === 'addition_value' || !k) && next.modification_type !== 'EXTENSION') {
        const base = parseNum(project?.project_value) +
          (prevMods.filter(m=>['ADDITION','BOTH'].includes(m.modification_type)&&m.is_active)
                   .reduce((s,m)=>s+parseNum(m.addition_value),0))
        const add  = parseNum(next.addition_value)
        if (add > 0) next.new_total_value = base + add
      }
      return next
    })
  }, [project, prevMods])

  if (!isOpen) return null

  const modType    = form.modification_type
  const typeConfig = MOD_TYPES.find(t => t.value === modType)

  async function handleSubmit() {
    if (!modType) { toast.error('Selecciona el tipo de modificación'); return }
    if (!form.approval_date) { toast.error('La fecha de aprobación es obligatoria'); return }

    setSaving(true)
    try {
      // 1. Crear registro principal
      const payload = {
        modification_type: modType,
        approval_date: form.approval_date,
        administrative_act: form.administrative_act || null,
        justification: form.justification || null,
        addition_value: ['ADDITION','BOTH'].includes(modType) ? parseNum(form.addition_value)||null : null,
        new_end_date: ['EXTENSION','BOTH'].includes(modType) ? form.new_end_date||null : null,
        extension_days: ['EXTENSION','BOTH'].includes(modType) ? form.extension_days||null : null,
        extension_period_text: ['EXTENSION','BOTH'].includes(modType) ? form.extension_period_text||null : null,
        new_total_value: ['ADDITION','BOTH'].includes(modType) ? parseNum(form.new_total_value)||null : null,
        requires_policy_update: form.requires_policy_update || false,
        policy_update_description: form.requires_policy_update ? form.policy_update_description||null : null,
        payment_method_modification: (form.payment_method_modification && form.payment_method_modification !== false)
          ? form.payment_method_modification : null,
      }

      const res = await modificationsService.create(project.project_id, payload)
      const modId = res.data.modification_id

      // 2. Sub-registros según tipo
      if (modType === 'SUSPENSION') {
        await modificationsService.addSuspension(modId, {
          suspension_start_date: form.suspension_start_date,
          suspension_end_date: form.suspension_end_date,
          planned_restart_date: form.planned_restart_date,
          contractor_justification: form.contractor_justification,
          supervisor_justification: form.supervisor_justification,
        })
      }

      if (modType === 'RESTART' && form.linked_suspension_id) {
        await modificationsService.restartSuspension(form.linked_suspension_id, {
          actual_restart_date: form.actual_restart_date,
          restart_modification_id: modId,
        })
      }

      if (modType === 'CONTRACTUAL') {
        await modificationsService.addClause(modId, {
          modification_description: form.modification_description,
          requires_resource_liberation: form.requires_resource_liberation,
          cdp_to_release: form.cdp_to_release || null,
          rp_to_release: form.rp_to_release || null,
          liberation_amount: parseNum(form.liberation_amount) || null,
        })
      }

      if (['CESION_CESIONARIA','CESION_CEDENTE'].includes(modType)) {
        await modificationsService.addAssignment(modId, {
          assignment_type: modType,
          assignor_name: form.assignor_name,
          assignor_id: form.assignor_id,
          assignor_id_type: form.assignor_id_type,
          assignee_name: form.assignee_name,
          assignee_id: form.assignee_id,
          assignee_id_type: form.assignee_id_type,
          assignment_date: form.assignment_date,
          assignment_signature_date: form.assignment_signature_date || null,
          value_to_assign: parseNum(form.value_to_assign),
          value_paid_to_assignor: parseNum(form.value_paid_to_assignor) || null,
          value_pending_to_assignor: parseNum(form.value_pending_to_assignor) || null,
          cdp: form.cdp || null,
          rp: form.rp || null,
          guarantee_modification_request: form.guarantee_modification_request || null,
        })
      }

      if (modType === 'LIQUIDATION') {
        await modificationsService.addLiquidation(modId, {
          liquidation_type: form.liquidation_type,
          execution_percentage: parseNum(form.execution_percentage),
          executed_value: parseNum(form.executed_value),
          pending_payment_value: parseNum(form.pending_payment_value) || null,
          value_to_release: parseNum(form.value_to_release) || null,
          cdp: form.cdp || null,
          rp: form.rp || null,
          initial_contract_value: parseNum(form.initial_contract_value),
          final_value_with_additions: parseNum(form.final_value_with_additions),
          resolution_number: form.resolution_number || null,
          resolution_date: form.resolution_date || null,
          unilateral_cause: form.unilateral_cause || null,
          cause_analysis: form.cause_analysis || null,
          liquidation_date: form.liquidation_date,
          liquidation_signature_date: form.liquidation_signature_date || null,
          supervisor_liquidation_request: form.supervisor_liquidation_request,
          additions_summary: prevMods.filter(m=>['ADDITION','BOTH'].includes(m.modification_type)),
          extensions_summary: prevMods.filter(m=>['EXTENSION','BOTH'].includes(m.modification_type)),
          suspensions_summary: prevMods.filter(m=>m.modification_type==='SUSPENSION'),
        })
      }

      toast.success(`Modificación ${MOD_TYPES.find(t=>t.value===modType)?.label || ''} creada`)
      setForm({ ...INITIAL_FORM })
      onSaved?.()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al guardar la modificación')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:9999,
      display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'20px', overflowY:'auto' }}>
      <div style={{ background:'var(--bg-card)', borderRadius:16, width:'100%', maxWidth:860,
        border:'1px solid var(--border-color)', boxShadow:'0 20px 60px rgba(0,0,0,0.4)', marginBottom:20 }}>

        {/* Header */}
        <div style={{ padding:'18px 24px', borderBottom:'1px solid var(--border-color)',
          display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h2 style={{ fontSize:16, fontWeight:800, color:'var(--text-primary)', margin:0 }}>
              Nueva Modificación
            </h2>
            <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:3 }}>
              {project?.project_name ? `${project.project_name.slice(0,60)}...` : 'Proyecto'}
            </p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer',
            color:'var(--text-muted)', padding:4 }}>
            <X size={20}/>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding:'20px 24px' }}>

          {/* Selector tipo */}
          <F label="Tipo de Modificación" required>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:8 }}>
              {MOD_TYPES.map(t => (
                <button key={t.value} onClick={() => set('modification_type', t.value)}
                  style={{ padding:'10px 8px', borderRadius:8, border:`2px solid ${modType===t.value ? t.color : 'var(--border-color)'}`,
                    background: modType===t.value ? `${t.color}15` : 'var(--bg-hover)',
                    color: modType===t.value ? t.color : 'var(--text-secondary)',
                    fontSize:12, fontWeight:600, cursor:'pointer', textAlign:'center',
                    transition:'all .15s' }}>
                  {t.label}
                </button>
              ))}
            </div>
          </F>

          {/* Secciones según tipo */}
          {modType && <>
            <SecDatosGenerales form={form} set={set} project={project} modType={modType}/>

            {modType === 'ADDITION' && <SecAdicion form={form} set={set}/>}
            {modType === 'EXTENSION' && <SecProrrhoga form={form} set={set} project={project}/>}
            {modType === 'BOTH' && <>
              <SecAdicion form={form} set={set}/>
              <SecProrrhoga form={form} set={set} project={project}/>
            </>}
            {modType === 'CONTRACTUAL' && <SecContractual form={form} set={set}/>}
            {modType === 'SUSPENSION' && <SecSuspension form={form} set={set}/>}
            {modType === 'RESTART' && <SecReinicio form={form} set={set} suspensions={suspensions}/>}
            {['CESION_CESIONARIA','CESION_CEDENTE'].includes(modType) && <SecCesion form={form} set={set} modType={modType}/>}
            {modType === 'LIQUIDATION' && <SecLiquidacion form={form} set={set} project={project} prevMods={prevMods}/>}
          </>}
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 24px', borderTop:'1px solid var(--border-color)',
          display:'flex', justifyContent:'flex-end', gap:10 }}>
          <button onClick={onClose} className="btn-secondary" disabled={saving}>Cancelar</button>
          <button onClick={handleSubmit} className="btn-primary" disabled={saving || !modType}>
            {saving ? 'Guardando...' : 'Guardar Modificación'}
          </button>
        </div>
      </div>
    </div>
  )
}
