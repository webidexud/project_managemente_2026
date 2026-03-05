/**
 * ModificationFormModal.jsx — v4.1
 * + Modo edición: acepta prop `editData` con la modificación a editar
 * + Prórroga acumulativa: usa project.end_date (ya actualizado en BD tras prórrogas anteriores)
 * + Al editar, pre-carga todos los campos incluyendo sub-registros
 */
import { useState, useEffect, useCallback } from 'react'
import { X, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { modificationsService } from '../../../services/projects'

/* ─── Tipos ──────────────────────────────────────────────────────── */
const MOD_TYPES = [
  { value: 'ADDITION',          label: 'Adición',                   color: '#10B981' },
  { value: 'EXTENSION',         label: 'Prórroga',                  color: '#0EA5E9' },
  { value: 'BOTH',              label: 'Adición + Prórroga',        color: '#8B5CF6' },
  { value: 'CONTRACTUAL',       label: 'Modificación Contractual',  color: '#F59E0B' },
  { value: 'SUSPENSION',        label: 'Suspensión',                color: '#EF4444' },
  { value: 'RESTART',           label: 'Reinicio',                  color: '#06B6D4' },
  { value: 'CESION_CESIONARIA', label: 'Cesión (UD Cesionaria)',    color: '#8B5CF6' },
  { value: 'CESION_CEDENTE',    label: 'Cesión (UD Cedente)',       color: '#8B5CF6' },
  { value: 'LIQUIDATION',       label: 'Liquidación',               color: '#64748B' },
]

/* ─── Estado inicial vacío ───────────────────────────────────────── */
const EMPTY = {
  modification_type: '',
  administrative_act: '', approval_date: '', justification: '',
  addition_value: '', new_total_value: '',
  requires_payment_modification: false, payment_method_modification: '',
  requires_policy_update: false, policy_update_description: '',
  new_end_date: '', extension_days: 0, extension_period_text: '',
  modification_description: '',
  requires_resource_liberation: false, cdp_to_release: '', rp_to_release: '', liberation_amount: '',
  suspension_start_date: '', suspension_end_date: '', planned_restart_date: '',
  contractor_justification: '', supervisor_justification: '',
  linked_suspension_id: '', actual_restart_date: '',
  assignor_name: '', assignor_id: '', assignor_id_type: 'CC',
  assignee_name: '', assignee_id: '', assignee_id_type: 'CC',
  assignment_date: '', assignment_signature_date: '',
  value_to_assign: '', value_paid_to_assignor: '', value_pending_to_assignor: '',
  cdp: '', rp: '', guarantee_modification_request: '',
  liquidation_type: 'BILATERAL', execution_percentage: '',
  executed_value: '', pending_payment_value: '', value_to_release: '',
  initial_contract_value: '', final_value_with_additions: '',
  cdp_value: '', rp_value: '',
  resolution_number: '', resolution_date: '',
  unilateral_cause: '', cause_analysis: '',
  liquidation_date: '', liquidation_signature_date: '',
  supervisor_liquidation_request: '',
}

/* ─── Cargar editData en el form ─────────────────────────────────── */
function editDataToForm(m) {
  if (!m) return { ...EMPTY }
  const f = {
    ...EMPTY,
    modification_type:      m.modification_type || '',
    administrative_act:     m.administrative_act || '',
    approval_date:          m.approval_date || '',
    justification:          m.justification || '',
    addition_value:         m.addition_value || '',
    new_total_value:        m.new_total_value || '',
    requires_payment_modification: !!m.payment_method_modification,
    payment_method_modification:   m.payment_method_modification || '',
    requires_policy_update: m.requires_policy_update || false,
    policy_update_description: m.policy_update_description || '',
    new_end_date:           m.new_end_date || '',
    extension_days:         m.extension_days || 0,
    extension_period_text:  m.extension_period_text || '',
  }
  // Sub-registro: suspensión
  if (m.suspension) {
    f.suspension_start_date    = m.suspension.suspension_start_date || ''
    f.suspension_end_date      = m.suspension.suspension_end_date || ''
    f.planned_restart_date     = m.suspension.planned_restart_date || ''
    f.contractor_justification = m.suspension.contractor_justification || ''
    f.supervisor_justification = m.suspension.supervisor_justification || ''
  }
  // Sub-registro: reinicio
  if (m.restart) {
    f.actual_restart_date  = m.restart.actual_restart_date || ''
    f.linked_suspension_id = m.restart.suspension_id || ''
  }
  // Sub-registro: cláusula/contractual
  if (m.clause) {
    f.modification_description     = m.clause.modification_description || ''
    f.requires_resource_liberation = m.clause.requires_resource_liberation || false
    f.cdp_to_release               = m.clause.cdp_to_release || ''
    f.rp_to_release                = m.clause.rp_to_release || ''
    f.liberation_amount            = m.clause.liberation_amount || ''
  }
  // Sub-registro: cesión
  if (m.assignment) {
    f.assignor_name             = m.assignment.assignor_name || ''
    f.assignor_id               = m.assignment.assignor_id || ''
    f.assignor_id_type          = m.assignment.assignor_id_type || 'CC'
    f.assignee_name             = m.assignment.assignee_name || ''
    f.assignee_id               = m.assignment.assignee_id || ''
    f.assignee_id_type          = m.assignment.assignee_id_type || 'CC'
    f.assignment_date           = m.assignment.assignment_date || ''
    f.assignment_signature_date = m.assignment.assignment_signature_date || ''
    f.value_to_assign           = m.assignment.value_to_assign || ''
    f.value_paid_to_assignor    = m.assignment.value_paid_to_assignor || ''
    f.value_pending_to_assignor = m.assignment.value_pending_to_assignor || ''
    f.cdp                       = m.assignment.cdp || ''
    f.rp                        = m.assignment.rp || ''
    f.guarantee_modification_request = m.assignment.guarantee_modification_request || ''
  }
  // Sub-registro: liquidación
  if (m.liquidation) {
    f.liquidation_type               = m.liquidation.liquidation_type || 'BILATERAL'
    f.execution_percentage           = m.liquidation.execution_percentage || ''
    f.executed_value                 = m.liquidation.executed_value || ''
    f.pending_payment_value          = m.liquidation.pending_payment_value || ''
    f.value_to_release               = m.liquidation.value_to_release || ''
    f.initial_contract_value         = m.liquidation.initial_contract_value || ''
    f.final_value_with_additions     = m.liquidation.final_value_with_additions || ''
    f.cdp                            = m.liquidation.cdp || ''
    f.cdp_value                      = m.liquidation.cdp_value || ''
    f.rp                             = m.liquidation.rp || ''
    f.rp_value                       = m.liquidation.rp_value || ''
    f.resolution_number              = m.liquidation.resolution_number || ''
    f.resolution_date                = m.liquidation.resolution_date || ''
    f.unilateral_cause               = m.liquidation.unilateral_cause || ''
    f.cause_analysis                 = m.liquidation.cause_analysis || ''
    f.liquidation_date               = m.liquidation.liquidation_date || ''
    f.liquidation_signature_date     = m.liquidation.liquidation_signature_date || ''
    f.supervisor_liquidation_request = m.liquidation.supervisor_liquidation_request || ''
  }
  return f
}

/* ─── Utilidades ─────────────────────────────────────────────────── */
function parseNum(v) {
  if (v === null || v === undefined || v === '') return 0
  const n = parseFloat(String(v).replace(/[^0-9.]/g, ''))
  return isNaN(n) ? 0 : n
}
function fmtPesos(v) {
  const n = parseNum(v)
  if (n === 0) return ''
  return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })
}
function addOneDay(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}
function calcDays(from, to) {
  if (!from || !to) return 0
  const diff = Math.round((new Date(to + 'T00:00:00') - new Date(from + 'T00:00:00')) / 86400000)
  return diff > 0 ? diff : 0
}
const NUM_ES = ['','UN','DOS','TRES','CUATRO','CINCO','SEIS','SIETE','OCHO','NUEVE',
  'DIEZ','ONCE','DOCE','TRECE','CATORCE','QUINCE','DIECISÉIS','DIECISIETE','DIECIOCHO',
  'DIECINUEVE','VEINTE','VEINTIÚN','VEINTIDÓS','VEINTITRÉS','VEINTICUATRO','VEINTICINCO',
  'VEINTISÉIS','VEINTISIETE','VEINTIOCHO','VEINTINUEVE','TREINTA','TREINTA Y UN']
const DEC_ES = ['','','VEINTE','TREINTA','CUARENTA','CINCUENTA','SESENTA','SETENTA','OCHENTA','NOVENTA']
function numToText(n) {
  if (n <= 31) return NUM_ES[n] || String(n)
  const dec = Math.floor(n / 10), uni = n % 10
  return uni === 0 ? DEC_ES[dec] : `${DEC_ES[dec]} Y ${NUM_ES[uni]}`
}
function daysToText(days) {
  if (!days || days <= 0) return ''
  const months = Math.floor(days / 30), rem = days % 30
  const parts = []
  if (months > 0) parts.push(`${numToText(months)} (${months}) ${months === 1 ? 'MES' : 'MESES'}`)
  if (rem > 0)    parts.push(`${numToText(rem)} (${rem}) ${rem === 1 ? 'DÍA' : 'DÍAS'}`)
  return parts.join(' Y ')
}

/* ─── Componentes UI ─────────────────────────────────────────────── */
const IS = { width:'100%', padding:'8px 12px', borderRadius:8, border:'1px solid var(--border-color)', background:'var(--bg-input)', color:'var(--text-primary)', fontSize:13, boxSizing:'border-box', fontFamily:'inherit' }
const ID = { ...IS, opacity:0.6, cursor:'not-allowed', background:'var(--bg-hover)' }

function Inp({ value, onChange, type='text', disabled, placeholder, min, max }) {
  return <input style={disabled?ID:IS} type={type} value={value??''} placeholder={placeholder} min={min} max={max} disabled={disabled} onChange={disabled?undefined:e=>onChange(e.target.value)}/>
}
function Txt({ value, onChange, rows=3, placeholder, disabled }) {
  return <textarea style={{...IS,resize:'vertical',minHeight:rows*24}} value={value??''} placeholder={placeholder} disabled={disabled} onChange={disabled?undefined:e=>onChange(e.target.value)}/>
}
function Sel({ value, onChange, children, disabled }) {
  return <select style={disabled?ID:IS} value={value??''} disabled={disabled} onChange={disabled?undefined:e=>onChange(e.target.value)}>{children}</select>
}
function PesosInput({ value, onChange, disabled, placeholder }) {
  const [raw, setRaw] = useState('')
  useEffect(()=>{ setRaw(value ? String(parseNum(value)) : '') }, [value])
  const handleChange = e => { const d=e.target.value.replace(/\D/g,''); setRaw(d); onChange(d?parseInt(d,10):'') }
  const display = raw ? parseInt(raw,10).toLocaleString('es-CO') : ''
  return <input style={disabled?ID:{...IS,fontFamily:'monospace'}} value={display} onChange={handleChange} onBlur={()=>{ const n=parseInt(raw,10); if(!isNaN(n)) onChange(n) }} placeholder={placeholder||'0'} inputMode="numeric" disabled={disabled}/>
}
function MoneyRO({ label, value }) {
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:4}}><Lock size={10} color="var(--text-muted)"/><span style={{fontSize:11,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'.06em'}}>{label}</span></div>
      <div style={{...ID,fontFamily:'monospace',color:'#10B981',fontWeight:700}}>{value?fmtPesos(value):'—'}</div>
    </div>
  )
}
function F({ label, required, hint, children, span }) {
  return (
    <div style={span?{gridColumn:`span ${span}`}:{}}>
      <label style={{display:'flex',alignItems:'baseline',gap:4,fontSize:11,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6}}>
        {label}{required&&<span style={{color:'#B91C3C'}}>*</span>}
        {hint&&<span style={{fontWeight:400,textTransform:'none',marginLeft:4,fontSize:10}}>— {hint}</span>}
      </label>
      {children}
    </div>
  )
}
function G({ cols=2, children, style }) {
  return <div style={{display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gap:'14px 16px',marginBottom:16,...style}}>{children}</div>
}
function ST({ text, color }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:8,margin:'20px 0 14px'}}>
      <div style={{width:4,height:20,borderRadius:2,background:color}}/>
      <span style={{fontSize:11,fontWeight:800,color,textTransform:'uppercase',letterSpacing:'.07em'}}>{text}</span>
      <div style={{flex:1,height:1,background:'var(--border-color)',marginLeft:4}}/>
    </div>
  )
}
function InfoBox({ text, color='#0EA5E9' }) {
  return <div style={{padding:'10px 14px',borderRadius:8,background:`${color}10`,border:`1px solid ${color}30`,fontSize:12,color,marginBottom:12}}>ℹ️ {text}</div>
}
function Checkbox({ checked, onChange, label }) {
  return (
    <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',fontSize:13,color:'var(--text-primary)'}}>
      <input type="checkbox" checked={!!checked} onChange={e=>onChange(e.target.checked)} style={{width:16,height:16,cursor:'pointer',accentColor:'#B91C3C'}}/>
      {label}
    </label>
  )
}

/* ─── Secciones ──────────────────────────────────────────────────── */
function SecGenerales({ form, set, modType }) {
  const noAct = ['SUSPENSION','RESTART'].includes(modType)
  return <>
    <ST text="Datos Generales" color="#F59E0B"/>
    <G cols={3}>
      <F label="Acto Administrativo" hint="Máx. 50 car.">
        <Inp value={form.administrative_act} onChange={v=>set('administrative_act',v)} placeholder="Ej: OTRO-SÍ No. 1" disabled={noAct}/>
      </F>
      <F label="Fecha de Aprobación" required>
        <Inp type="date" value={form.approval_date} onChange={v=>set('approval_date',v)}/>
      </F>
      <F label="N° de Modificación" hint="Automático"><Inp value="Automático" disabled/></F>
    </G>
    {!['SUSPENSION','RESTART','LIQUIDATION'].includes(modType) && (
      <G cols={1}><F label="Justificación" hint="Máx. 2000 car.">
        <Txt value={form.justification} onChange={v=>set('justification',v)} rows={3} placeholder="Justificación de la modificación..."/>
      </F></G>
    )}
  </>
}

function SecAdicion({ form, set }) {
  return <>
    <ST text="Adición Presupuestal" color="#10B981"/>
    <G cols={2}>
      <F label="Valor de la Adición" required><PesosInput value={form.addition_value} onChange={v=>set('addition_value',v)}/></F>
      <MoneyRO label="Nuevo valor total" value={form.new_total_value}/>
    </G>
    <G cols={1} style={{marginTop:8}}>
      <Checkbox checked={form.requires_payment_modification} onChange={v=>set('requires_payment_modification',v)} label="¿Requiere modificación de la forma de pago?"/>
    </G>
    {form.requires_payment_modification && <F label="Descripción modificación de pago" required hint="Máx. 2000 car."><Txt value={form.payment_method_modification} onChange={v=>set('payment_method_modification',v)} placeholder="Describa cómo cambia la forma de pago..."/></F>}
    <G cols={1} style={{marginTop:8}}>
      <Checkbox checked={form.requires_policy_update} onChange={v=>set('requires_policy_update',v)} label="¿Requiere actualización de póliza?"/>
    </G>
    {form.requires_policy_update && <F label="Descripción actualización de póliza" required hint="Máx. 2000 car."><Txt value={form.policy_update_description} onChange={v=>set('policy_update_description',v)} placeholder="Describa los cambios en la póliza..."/></F>}
  </>
}

function SecProrrhoga({ form, set, project }) {
  // Usa project.end_date (el que devuelve el servidor — ya acumulado)
  const currentEnd = project?.end_date || ''
  const days = calcDays(currentEnd, form.new_end_date)
  const text = daysToText(days)

  useEffect(() => {
    if (days > 0) { set('extension_days', days); set('extension_period_text', text) }
  }, [form.new_end_date])

  return <>
    <ST text="Prórroga de Plazo" color="#0EA5E9"/>
    <G cols={3}>
      <F label="Fecha fin actual" hint="Del proyecto (acumulada)"><Inp value={currentEnd} disabled/></F>
      <F label="Nueva fecha de fin" required>
        <Inp type="date" value={form.new_end_date} onChange={v=>set('new_end_date',v)} min={currentEnd}/>
      </F>
      <F label="Días de prórroga" hint="Calculado automáticamente"><Inp value={days>0?`${days} días`:''} disabled/></F>
    </G>
    {text && <InfoBox text={`Período en letras: ${text}`} color="#0EA5E9"/>}
    <G cols={1} style={{marginTop:8}}>
      <Checkbox checked={form.requires_payment_modification} onChange={v=>set('requires_payment_modification',v)} label="¿Requiere modificación de la forma de pago?"/>
    </G>
    {form.requires_payment_modification && <F label="Descripción modificación de pago" required><Txt value={form.payment_method_modification} onChange={v=>set('payment_method_modification',v)} placeholder="Describa cómo cambia la forma de pago..."/></F>}
    <G cols={1} style={{marginTop:8}}>
      <Checkbox checked={form.requires_policy_update} onChange={v=>set('requires_policy_update',v)} label="¿Requiere actualización de póliza?"/>
    </G>
    {form.requires_policy_update && <F label="Descripción actualización de póliza" required><Txt value={form.policy_update_description} onChange={v=>set('policy_update_description',v)} placeholder="Describa los cambios en la póliza..."/></F>}
  </>
}

function SecContractual({ form, set }) {
  return <>
    <ST text="Modificación Contractual" color="#F59E0B"/>
    <G cols={1}><F label="Descripción de la modificación" required hint="Máx. 2000 car.">
      <Txt value={form.modification_description} onChange={v=>set('modification_description',v)} rows={5} placeholder="Describa detalladamente la modificación contractual..."/>
    </F></G>
    <G cols={1} style={{marginTop:8}}>
      <Checkbox checked={form.requires_resource_liberation} onChange={v=>set('requires_resource_liberation',v)} label="¿Requiere liberación de recursos? (el valor del contrato disminuirá)"/>
    </G>
    {form.requires_resource_liberation && <>
      <ST text="Datos de Liberación de Recursos" color="#EF4444"/>
      <G cols={3}>
        <F label="CDP a liberar" required><Inp value={form.cdp_to_release} onChange={v=>set('cdp_to_release',v)} placeholder="No. CDP"/></F>
        <F label="RP a liberar" required><Inp value={form.rp_to_release} onChange={v=>set('rp_to_release',v)} placeholder="No. RP"/></F>
        <F label="Valor a liberar" required><PesosInput value={form.liberation_amount} onChange={v=>set('liberation_amount',v)}/></F>
      </G>
    </>}
  </>
}

function SecSuspension({ form, set }) {
  const restartDate = addOneDay(form.suspension_end_date)
  useEffect(()=>{ if(restartDate) set('planned_restart_date',restartDate) }, [form.suspension_end_date])
  return <>
    <ST text="Período de Suspensión" color="#EF4444"/>
    <G cols={3}>
      <F label="Fecha inicio suspensión" required><Inp type="date" value={form.suspension_start_date} onChange={v=>set('suspension_start_date',v)}/></F>
      <F label="Fecha fin suspensión" required><Inp type="date" value={form.suspension_end_date} onChange={v=>set('suspension_end_date',v)} min={form.suspension_start_date}/></F>
      <F label="Fecha reinicio programada" hint="Día siguiente al fin"><Inp value={restartDate} disabled/></F>
    </G>
    {form.suspension_start_date&&form.suspension_end_date&&<InfoBox text={`Período: ${form.suspension_start_date} → ${form.suspension_end_date} | Reinicio: ${restartDate}`} color="#EF4444"/>}
    <G cols={2}>
      <F label="Justificación del contratista" required><Txt value={form.contractor_justification} onChange={v=>set('contractor_justification',v)} rows={4} placeholder="Razones del contratista..."/></F>
      <F label="Justificación del supervisor" required><Txt value={form.supervisor_justification} onChange={v=>set('supervisor_justification',v)} rows={4} placeholder="Concepto del supervisor..."/></F>
    </G>
  </>
}

function SecReinicio({ form, set, suspensions }) {
  const sel = suspensions.find(s=>String(s.suspension_id)===String(form.linked_suspension_id))
  const minR = sel ? addOneDay(sel.suspension_end_date) : ''
  return <>
    <ST text="Reinicio del Contrato" color="#06B6D4"/>
    {suspensions.length===0 ? <InfoBox text="⚠️ No hay suspensiones activas para este proyecto." color="#F59E0B"/> : <>
      <G cols={2}>
        <F label="Suspensión a reiniciar" required>
          <Sel value={form.linked_suspension_id} onChange={v=>set('linked_suspension_id',v)}>
            <option value="">— Seleccionar suspensión —</option>
            {suspensions.map(s=><option key={s.suspension_id} value={s.suspension_id}>
              Suspensión #{s.modification_number||s.suspension_id} — {s.suspension_start_date} → {s.suspension_end_date}
            </option>)}
          </Sel>
        </F>
        <F label="Fecha real de reinicio" required hint={minR?`Mín: ${minR}`:''}>
          <Inp type="date" value={form.actual_restart_date} onChange={v=>set('actual_restart_date',v)} min={minR}/>
        </F>
      </G>
      {sel&&<InfoBox text={`Suspensión: del ${sel.suspension_start_date} al ${sel.suspension_end_date}`} color="#06B6D4"/>}
    </>}
  </>
}

function SecCesion({ form, set, modType }) {
  const isC = modType==='CESION_CESIONARIA'
  return <>
    <ST text={isC?'Cesión — UD como Cesionaria':'Cesión — UD como Cedente'} color="#8B5CF6"/>
    <InfoBox text={isC?'La Universidad Distrital RECIBE la cesión':'La Universidad Distrital ENTREGA la cesión'} color="#8B5CF6"/>
    <G cols={3}>
      <F label="Nombre cedente" required><Inp value={form.assignor_name} onChange={v=>set('assignor_name',v)} placeholder="Nombre completo"/></F>
      <F label="ID cedente" required><Inp value={form.assignor_id} onChange={v=>set('assignor_id',v)} placeholder="No. documento"/></F>
      <F label="Tipo ID cedente"><Sel value={form.assignor_id_type||'CC'} onChange={v=>set('assignor_id_type',v)}>{['CC','CE','NIT','PP','TI'].map(t=><option key={t}>{t}</option>)}</Sel></F>
      <F label="Nombre cesionario" required><Inp value={form.assignee_name} onChange={v=>set('assignee_name',v)} placeholder="Nombre completo"/></F>
      <F label="ID cesionario" required><Inp value={form.assignee_id} onChange={v=>set('assignee_id',v)} placeholder="No. documento"/></F>
      <F label="Tipo ID cesionario"><Sel value={form.assignee_id_type||'CC'} onChange={v=>set('assignee_id_type',v)}>{['CC','CE','NIT','PP','TI'].map(t=><option key={t}>{t}</option>)}</Sel></F>
    </G>
    <G cols={3}>
      <F label="Fecha de cesión" required><Inp type="date" value={form.assignment_date} onChange={v=>set('assignment_date',v)}/></F>
      <F label="Fecha firma cesión"><Inp type="date" value={form.assignment_signature_date} onChange={v=>set('assignment_signature_date',v)}/></F>
      <F label="Valor a ceder" required><PesosInput value={form.value_to_assign} onChange={v=>set('value_to_assign',v)}/></F>
      <F label="Valor pagado al cedente"><PesosInput value={form.value_paid_to_assignor} onChange={v=>set('value_paid_to_assignor',v)}/></F>
      <F label="Valor pendiente al cedente"><PesosInput value={form.value_pending_to_assignor} onChange={v=>set('value_pending_to_assignor',v)}/></F>
    </G>
    <G cols={2}>
      <F label="CDP"><Inp value={form.cdp} onChange={v=>set('cdp',v)} placeholder="No. CDP"/></F>
      <F label="RP"><Inp value={form.rp} onChange={v=>set('rp',v)} placeholder="No. RP"/></F>
    </G>
    <F label="Solicitud modificación de garantías"><Txt value={form.guarantee_modification_request} onChange={v=>set('guarantee_modification_request',v)} placeholder="Descripción..."/></F>
  </>
}

function SecLiquidacion({ form, set, project, prevMods, suspensions }) {
  const initVal  = parseNum(project?.project_value)
  const totalAdd = prevMods.filter(m=>['ADDITION','BOTH'].includes(m.modification_type)&&m.is_active).reduce((s,m)=>s+parseNum(m.addition_value),0)
  const finalVal = initVal + totalAdd

  useEffect(()=>{
    set('initial_contract_value', initVal)
    set('final_value_with_additions', finalVal)
  }, [])

  useEffect(()=>{
    const pct = parseNum(form.execution_percentage)
    if(pct>0&&finalVal>0){ set('executed_value',Math.round(finalVal*pct/100)); set('value_to_release',Math.round(finalVal*(100-pct)/100)) }
  }, [form.execution_percentage])

  const isUni = form.liquidation_type==='UNILATERAL'
  const exts  = prevMods.filter(m=>['EXTENSION','BOTH'].includes(m.modification_type)&&m.is_active)
  const adds  = prevMods.filter(m=>['ADDITION','BOTH'].includes(m.modification_type)&&m.is_active)

  return <>
    <ST text="Datos del Contrato" color="#10B981"/>
    <G cols={2}>
      <F label="N° externo contrato"><Inp value={project?.external_project_number||'—'} disabled/></F>
      <F label="Entidad contratante"><Inp value={project?.entity_name||'—'} disabled/></F>
      <F label="Objeto del contrato" span={2}><Txt value={project?.project_purpose||'—'} disabled rows={2}/></F>
    </G>
    <G cols={3}>
      <F label="Fecha suscripción"><Inp value={project?.subscription_date||'—'} disabled/></F>
      <F label="Fecha inicio"><Inp value={project?.start_date||'—'} disabled/></F>
      <F label="Fecha fin original"><Inp value={project?.end_date||'—'} disabled/></F>
    </G>
    {suspensions.length>0&&<>{<ST text="Suspensiones" color="#EF4444"/>}{suspensions.map((s,i)=><InfoBox key={i} color="#EF4444" text={`Suspensión ${i+1}: del ${s.suspension_start_date} al ${s.suspension_end_date}`}/>)}</>}
    {exts.length>0&&<>{<ST text="Prórrogas" color="#0EA5E9"/>}{exts.map((e,i)=><InfoBox key={i} color="#0EA5E9" text={`Prórroga ${i+1}: nueva fecha fin ${e.new_end_date}${e.extension_period_text?' — '+e.extension_period_text:''}`}/>)}</>}
    {adds.length>0&&<>{<ST text="Adiciones" color="#10B981"/>}{adds.map((a,i)=><InfoBox key={i} color="#10B981" text={`Adición ${i+1}: ${fmtPesos(a.addition_value)}`}/>)}</>}
    <ST text="Valores del Contrato" color="#8B5CF6"/>
    <G cols={3}><MoneyRO label="Valor inicial" value={initVal}/><MoneyRO label="Total adiciones" value={totalAdd}/><MoneyRO label="Valor final con adiciones" value={finalVal}/></G>
    <ST text="Tipo de Liquidación y Ejecución" color="#F59E0B"/>
    <G cols={2}>
      <F label="Tipo de liquidación" required>
        <Sel value={form.liquidation_type||'BILATERAL'} onChange={v=>set('liquidation_type',v)}>
          <option value="BILATERAL">Bilateral (de mutuo acuerdo)</option>
          <option value="UNILATERAL">Unilateral (por acto administrativo)</option>
        </Sel>
      </F>
      <F label="Porcentaje de ejecución (%)" required>
        <Inp type="number" value={form.execution_percentage} onChange={v=>set('execution_percentage',v)} min="0" max="100" placeholder="Ej: 85"/>
      </F>
    </G>
    <G cols={3}><MoneyRO label="Valor ejecutado" value={form.executed_value}/><F label="Valor pendiente de pago"><PesosInput value={form.pending_payment_value} onChange={v=>set('pending_payment_value',v)}/></F><MoneyRO label="Valor a liberar" value={form.value_to_release}/></G>
    <G cols={2}><F label="CDP"><Inp value={form.cdp} onChange={v=>set('cdp',v)} placeholder="No. CDP"/></F><F label="Valor CDP"><PesosInput value={form.cdp_value} onChange={v=>set('cdp_value',v)}/></F><F label="RP"><Inp value={form.rp} onChange={v=>set('rp',v)} placeholder="No. RP"/></F><F label="Valor RP"><PesosInput value={form.rp_value} onChange={v=>set('rp_value',v)}/></F></G>
    {isUni&&<><ST text="Acto Administrativo Unilateral" color="#EF4444"/><G cols={2}><F label="N° resolución" required><Inp value={form.resolution_number} onChange={v=>set('resolution_number',v)} placeholder="Resolución 001 de 2025"/></F><F label="Fecha resolución" required><Inp type="date" value={form.resolution_date} onChange={v=>set('resolution_date',v)}/></F></G><F label="Causa unilateral" required><Txt value={form.unilateral_cause} onChange={v=>set('unilateral_cause',v)} rows={3} placeholder="Causa que motiva la liquidación unilateral..."/></F><F label="Análisis de causa"><Txt value={form.cause_analysis} onChange={v=>set('cause_analysis',v)} rows={3} placeholder="Análisis detallado..."/></F></>}
    <ST text="Datos de Firma y Solicitud" color="#64748B"/>
    <G cols={2}><F label="Fecha de liquidación" required><Inp type="date" value={form.liquidation_date} onChange={v=>set('liquidation_date',v)}/></F><F label="Fecha firma liquidación"><Inp type="date" value={form.liquidation_signature_date} onChange={v=>set('liquidation_signature_date',v)}/></F></G>
    <F label="Solicitud de liquidación (supervisor)" required><Txt value={form.supervisor_liquidation_request} onChange={v=>set('supervisor_liquidation_request',v)} rows={4} placeholder="Solicitud formal del supervisor..."/></F>
  </>
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
═══════════════════════════════════════════════════════════════════ */
export default function ModificationFormModal({ isOpen, onClose, project, prevMods=[], suspensions=[], editData=null, onSaved }) {
  const isEdit = !!editData
  const [form, setForm] = useState(() => editData ? editDataToForm(editData) : { ...EMPTY })
  const [saving, setSaving] = useState(false)

  // Si cambia editData (abre otra mod), reiniciar form
  useEffect(() => {
    setForm(editData ? editDataToForm(editData) : { ...EMPTY })
  }, [editData])

  const set = useCallback((k, v) => {
    setForm(f => {
      const next = { ...f, [k]: v }
      // Recalcular nuevo total en adición
      if (k === 'addition_value') {
        const base = parseNum(project?.project_value) +
          prevMods.filter(m=>['ADDITION','BOTH'].includes(m.modification_type)&&m.is_active).reduce((s,m)=>s+parseNum(m.addition_value),0)
        const add = parseNum(v)
        next.new_total_value = add > 0 ? base + add : ''
      }
      return next
    })
  }, [project, prevMods])

  if (!isOpen) return null

  const modType   = form.modification_type
  const typeMeta  = MOD_TYPES.find(t => t.value === modType)

  // ── Validación ───────────────────────────────────────────────────
  function validate() {
    if (!modType) { toast.error('Selecciona el tipo de modificación'); return false }
    if (!form.approval_date) { toast.error('La fecha de aprobación es obligatoria'); return false }
    if (['ADDITION','BOTH'].includes(modType) && !parseNum(form.addition_value)) { toast.error('El valor de la adición es obligatorio'); return false }
    if (['EXTENSION','BOTH'].includes(modType) && !form.new_end_date) { toast.error('La nueva fecha de fin es obligatoria'); return false }
    if (modType==='CONTRACTUAL' && !form.modification_description?.trim()) { toast.error('La descripción es obligatoria'); return false }
    if (modType==='SUSPENSION') {
      if (!form.suspension_start_date) { toast.error('Fecha inicio suspensión obligatoria'); return false }
      if (!form.suspension_end_date) { toast.error('Fecha fin suspensión obligatoria'); return false }
      if (!form.contractor_justification?.trim()) { toast.error('Justificación del contratista obligatoria'); return false }
      if (!form.supervisor_justification?.trim()) { toast.error('Justificación del supervisor obligatoria'); return false }
    }
    if (modType==='RESTART' && !form.linked_suspension_id) { toast.error('Selecciona la suspensión a reiniciar'); return false }
    if (modType==='RESTART' && !form.actual_restart_date) { toast.error('La fecha de reinicio es obligatoria'); return false }
    if (['CESION_CESIONARIA','CESION_CEDENTE'].includes(modType)) {
      if (!form.assignor_name?.trim()) { toast.error('Nombre del cedente obligatorio'); return false }
      if (!form.assignee_name?.trim()) { toast.error('Nombre del cesionario obligatorio'); return false }
      if (!form.assignment_date) { toast.error('Fecha de cesión obligatoria'); return false }
      if (!parseNum(form.value_to_assign)) { toast.error('Valor a ceder obligatorio'); return false }
    }
    if (modType==='LIQUIDATION') {
      if (!form.liquidation_date) { toast.error('Fecha de liquidación obligatoria'); return false }
      if (!form.execution_percentage) { toast.error('Porcentaje de ejecución obligatorio'); return false }
      if (!form.supervisor_liquidation_request?.trim()) { toast.error('Solicitud de liquidación obligatoria'); return false }
    }
    return true
  }

  // ── Submit ───────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!validate()) return
    setSaving(true)
    try {
      if (isEdit) {
        // Modo edición: PUT con todos los campos
        const payload = {
          administrative_act: form.administrative_act || null,
          approval_date: form.approval_date,
          justification: form.justification || null,
          addition_value: ['ADDITION','BOTH'].includes(modType) ? parseNum(form.addition_value)||null : null,
          new_end_date: ['EXTENSION','BOTH'].includes(modType) ? form.new_end_date||null : null,
          extension_days: ['EXTENSION','BOTH'].includes(modType) ? form.extension_days||null : null,
          extension_period_text: ['EXTENSION','BOTH'].includes(modType) ? form.extension_period_text||null : null,
          new_total_value: ['ADDITION','BOTH'].includes(modType) ? parseNum(form.new_total_value)||null : null,
          requires_policy_update: form.requires_policy_update||false,
          policy_update_description: form.requires_policy_update ? form.policy_update_description||null : null,
          payment_method_modification: form.requires_payment_modification ? form.payment_method_modification||null : null,
        }
        // Sub-registros según tipo
        if (modType==='SUSPENSION') payload.suspension = {
          suspension_start_date: form.suspension_start_date,
          suspension_end_date: form.suspension_end_date,
          planned_restart_date: form.planned_restart_date,
          contractor_justification: form.contractor_justification,
          supervisor_justification: form.supervisor_justification,
        }
        if (modType==='CONTRACTUAL') payload.clause = {
          modification_description: form.modification_description,
          requires_resource_liberation: form.requires_resource_liberation,
          cdp_to_release: form.cdp_to_release||null,
          rp_to_release: form.rp_to_release||null,
          liberation_amount: parseNum(form.liberation_amount)||null,
        }
        if (['CESION_CESIONARIA','CESION_CEDENTE'].includes(modType)) payload.assignment = {
          assignor_name: form.assignor_name, assignor_id: form.assignor_id, assignor_id_type: form.assignor_id_type,
          assignee_name: form.assignee_name, assignee_id: form.assignee_id, assignee_id_type: form.assignee_id_type,
          assignment_date: form.assignment_date, assignment_signature_date: form.assignment_signature_date||null,
          value_to_assign: parseNum(form.value_to_assign),
          value_paid_to_assignor: parseNum(form.value_paid_to_assignor)||null,
          value_pending_to_assignor: parseNum(form.value_pending_to_assignor)||null,
          cdp: form.cdp||null, rp: form.rp||null, guarantee_modification_request: form.guarantee_modification_request||null,
        }
        if (modType==='LIQUIDATION') payload.liquidation = {
          liquidation_type: form.liquidation_type,
          execution_percentage: parseNum(form.execution_percentage),
          executed_value: parseNum(form.executed_value),
          pending_payment_value: parseNum(form.pending_payment_value)||null,
          value_to_release: parseNum(form.value_to_release)||null,
          cdp: form.cdp||null, cdp_value: parseNum(form.cdp_value)||null,
          rp: form.rp||null, rp_value: parseNum(form.rp_value)||null,
          resolution_number: form.resolution_number||null, resolution_date: form.resolution_date||null,
          unilateral_cause: form.unilateral_cause||null, cause_analysis: form.cause_analysis||null,
          liquidation_date: form.liquidation_date, liquidation_signature_date: form.liquidation_signature_date||null,
          supervisor_liquidation_request: form.supervisor_liquidation_request,
        }
        await modificationsService.update(editData.modification_id, payload)
        toast.success('Modificación actualizada ✓')

      } else {
        // Modo creación: secuencia POST
        const payload = {
          modification_type: modType,
          approval_date: form.approval_date,
          administrative_act: form.administrative_act||null,
          justification: form.justification||null,
          addition_value: ['ADDITION','BOTH'].includes(modType) ? parseNum(form.addition_value)||null : null,
          new_end_date: ['EXTENSION','BOTH'].includes(modType) ? form.new_end_date||null : null,
          extension_days: ['EXTENSION','BOTH'].includes(modType) ? form.extension_days||null : null,
          extension_period_text: ['EXTENSION','BOTH'].includes(modType) ? form.extension_period_text||null : null,
          new_total_value: ['ADDITION','BOTH'].includes(modType) ? parseNum(form.new_total_value)||null : null,
          requires_policy_update: form.requires_policy_update||false,
          policy_update_description: form.requires_policy_update ? form.policy_update_description||null : null,
          payment_method_modification: form.requires_payment_modification ? form.payment_method_modification||null : null,
        }
        const res = await modificationsService.create(project.project_id, payload)
        const modId = res.data.modification_id

        if (modType==='SUSPENSION')
          await modificationsService.addSuspension(modId, { suspension_start_date: form.suspension_start_date, suspension_end_date: form.suspension_end_date, planned_restart_date: form.planned_restart_date, contractor_justification: form.contractor_justification, supervisor_justification: form.supervisor_justification })
        if (modType==='RESTART' && form.linked_suspension_id)
          await modificationsService.restartSuspension(form.linked_suspension_id, { actual_restart_date: form.actual_restart_date, restart_modification_id: modId })
        if (modType==='CONTRACTUAL')
          await modificationsService.addClause(modId, { modification_description: form.modification_description, requires_resource_liberation: form.requires_resource_liberation, cdp_to_release: form.cdp_to_release||null, rp_to_release: form.rp_to_release||null, liberation_amount: parseNum(form.liberation_amount)||null, clause_number: '1', clause_name: 'Modificación Contractual', new_clause_text: form.modification_description })
        if (['CESION_CESIONARIA','CESION_CEDENTE'].includes(modType))
          await modificationsService.addAssignment(modId, { assignment_type: modType, assignor_name: form.assignor_name, assignor_id: form.assignor_id, assignor_id_type: form.assignor_id_type, assignee_name: form.assignee_name, assignee_id: form.assignee_id, assignee_id_type: form.assignee_id_type, assignment_date: form.assignment_date, assignment_signature_date: form.assignment_signature_date||null, value_to_assign: parseNum(form.value_to_assign), value_paid_to_assignor: parseNum(form.value_paid_to_assignor)||null, value_pending_to_assignor: parseNum(form.value_pending_to_assignor)||null, cdp: form.cdp||null, rp: form.rp||null, guarantee_modification_request: form.guarantee_modification_request||null })
        if (modType==='LIQUIDATION')
          await modificationsService.addLiquidation(modId, { liquidation_type: form.liquidation_type, execution_percentage: parseNum(form.execution_percentage), executed_value: parseNum(form.executed_value), pending_payment_value: parseNum(form.pending_payment_value)||null, value_to_release: parseNum(form.value_to_release)||null, cdp: form.cdp||null, cdp_value: parseNum(form.cdp_value)||null, rp: form.rp||null, rp_value: parseNum(form.rp_value)||null, initial_contract_value: parseNum(form.initial_contract_value), final_value_with_additions: parseNum(form.final_value_with_additions), resolution_number: form.resolution_number||null, resolution_date: form.resolution_date||null, unilateral_cause: form.unilateral_cause||null, cause_analysis: form.cause_analysis||null, liquidation_date: form.liquidation_date, liquidation_signature_date: form.liquidation_signature_date||null, supervisor_liquidation_request: form.supervisor_liquidation_request, additions_summary: prevMods.filter(m=>['ADDITION','BOTH'].includes(m.modification_type)), extensions_summary: prevMods.filter(m=>['EXTENSION','BOTH'].includes(m.modification_type)), suspensions_summary: suspensions })

        toast.success(`${typeMeta?.label||'Modificación'} creada ✓`)
      }

      setForm({ ...EMPTY })
      onSaved?.()
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.detail || 'Error al guardar')
    } finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:20, overflowY:'auto' }}>
      <div style={{ background:'var(--bg-card)', borderRadius:16, width:'100%', maxWidth:780, border:'1px solid var(--border-color)', boxShadow:'0 25px 60px rgba(0,0,0,0.35)', margin:'auto' }}>

        {/* Header */}
        <div style={{ padding:'18px 24px', borderBottom:'1px solid var(--border-color)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h2 style={{ fontSize:16, fontWeight:800, color:'var(--text-primary)', margin:0 }}>
              {isEdit ? `Editar Modificación #${editData.modification_number}` : 'Nueva Modificación'}
            </h2>
            <p style={{ fontSize:12, color:'var(--text-muted)', margin:'2px 0 0' }}>
              {project?.project_name?.substring(0,60)}{project?.project_name?.length>60?'…':''}
            </p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', padding:6, borderRadius:8, color:'var(--text-muted)' }}><X size={20}/></button>
        </div>

        {/* Body */}
        <div style={{ padding:'20px 24px', maxHeight:'calc(90vh - 140px)', overflowY:'auto' }}>

          {/* Selector de tipo (deshabilitado en edición) */}
          <F label="Tipo de Modificación" required>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:4 }}>
              {MOD_TYPES.map(t => (
                <button key={t.value}
                  onClick={() => !isEdit && set('modification_type', t.value)}
                  disabled={isEdit && t.value !== modType}
                  style={{
                    padding:'10px 8px', borderRadius:8, border:'2px solid',
                    borderColor: modType===t.value ? t.color : 'var(--border-color)',
                    background: modType===t.value ? `${t.color}15` : 'var(--bg-hover)',
                    color: modType===t.value ? t.color : 'var(--text-secondary)',
                    fontSize:12, fontWeight:600,
                    cursor: isEdit ? 'default' : 'pointer',
                    textAlign:'center', transition:'all .15s',
                    opacity: isEdit && t.value!==modType ? 0.3 : 1,
                  }}>
                  {t.label}
                </button>
              ))}
            </div>
            {isEdit && <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:6 }}>⚠️ El tipo de modificación no se puede cambiar al editar.</p>}
          </F>

          {/* Secciones */}
          {modType && <>
            <SecGenerales form={form} set={set} modType={modType}/>
            {modType==='ADDITION'  && <SecAdicion form={form} set={set}/>}
            {modType==='EXTENSION' && <SecProrrhoga form={form} set={set} project={project}/>}
            {modType==='BOTH'      && <><SecAdicion form={form} set={set}/><SecProrrhoga form={form} set={set} project={project}/></>}
            {modType==='CONTRACTUAL' && <SecContractual form={form} set={set}/>}
            {modType==='SUSPENSION' && <SecSuspension form={form} set={set}/>}
            {modType==='RESTART' && <SecReinicio form={form} set={set} suspensions={suspensions}/>}
            {['CESION_CESIONARIA','CESION_CEDENTE'].includes(modType) && <SecCesion form={form} set={set} modType={modType}/>}
            {modType==='LIQUIDATION' && <SecLiquidacion form={form} set={set} project={project} prevMods={prevMods} suspensions={suspensions}/>}
          </>}
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 24px', borderTop:'1px solid var(--border-color)', display:'flex', justifyContent:'flex-end', gap:10 }}>
          <button onClick={onClose} className="btn-secondary" disabled={saving}>Cancelar</button>
          <button onClick={handleSubmit} className="btn-primary" disabled={saving||!modType}
            style={{ background:typeMeta?.color, borderColor:typeMeta?.color }}>
            {saving ? 'Guardando…' : isEdit ? 'Guardar Cambios' : `Crear ${typeMeta?.label||'Modificación'}`}
          </button>
        </div>
      </div>
    </div>
  )
}
