// frontend/src/pages/tracking/TrackingFormPage.jsx — v2.0
// Wizard por pasos — mismo patrón visual que ProjectFormPage
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Activity, Save, ArrowLeft, Search, Loader, Plus, Trash2,
  Users, FileText, DollarSign, Clock, TrendingUp,
  CheckCircle2, AlertCircle, ChevronLeft, ChevronRight,
  ClipboardList,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { trackingService } from '../../services/tracking'
import { projectsService } from '../../services/projects'

const IS = { width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid var(--border-color)', background:'var(--bg-input)', color:'var(--text-primary)', fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }
const G  = ({ cols=2, children }) => <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols},1fr)`, gap:'18px 22px', marginBottom:22 }}>{children}</div>
const F  = ({ label, required, hint, children, span=1 }) => (
  <div style={{ gridColumn:`span ${span}` }}>
    <label style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:6 }}>
      {label}{required && <span style={{ color:'#B91C3C' }}> *</span>}
    </label>
    {children}
    {hint && <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>{hint}</p>}
  </div>
)
const ST = ({ icon:Icon, color, title, subtitle }) => (
  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24, paddingBottom:16, borderBottom:'1px solid var(--border-color)' }}>
    <div style={{ width:38, height:38, borderRadius:10, background:`${color}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <Icon size={19} color={color}/>
    </div>
    <div>
      <h3 style={{ fontSize:15, fontWeight:800, color:'var(--text-primary)', margin:0 }}>{title}</h3>
      {subtitle && <p style={{ fontSize:12, color:'var(--text-muted)', margin:0 }}>{subtitle}</p>}
    </div>
  </div>
)
const Num = ({ value, onChange, placeholder='' }) => (
  <input type="number" className="input-field" value={value??''} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{ fontFamily:'monospace' }}/>
)

const STEPS = [
  { id:'general',    label:'General',     icon:FileText,      required:['project_id','cut_date'] },
  { id:'personal',   label:'Personal',    icon:Users,         required:[] },
  { id:'tiempo',     label:'Tiempo',      icon:Clock,         required:[] },
  { id:'financiero', label:'Financiero',  icon:DollarSign,    required:[] },
  { id:'dialogo',    label:'Seguimiento', icon:TrendingUp,    required:[] },
  { id:'informes',   label:'Informes',    icon:ClipboardList, required:[] },
]

function ProjectSelector({ snapshot, onSelect }) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open,    setOpen]    = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])
  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const r = await projectsService.list()
        const q = query.toLowerCase()
        setResults(r.data.filter(p => p.project_name?.toLowerCase().includes(q) || String(p.project_id).includes(q) || p.external_project_number?.toLowerCase().includes(q)).slice(0,12))
      } catch {} finally { setLoading(false) }
    }, 280)
    return () => clearTimeout(t)
  }, [query])
  return (
    <div ref={ref} style={{ position:'relative' }}>
      <div style={{ position:'relative' }}>
        <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }}/>
        <input value={query} onChange={e=>{ setQuery(e.target.value); setOpen(true) }} onFocus={()=>{ if(query) setOpen(true) }}
          placeholder={snapshot ? `${snapshot.external_number||`#${snapshot.project_id}`} — ${snapshot.project_name?.substring(0,50)}` : 'Buscar proyecto por nombre o número...'}
          className="input-field" style={{ paddingLeft:32 }}/>
        {loading && <Loader size={13} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', animation:'spin 1s linear infinite', color:'var(--text-muted)' }}/>}
      </div>
      {open && results.length > 0 && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:300, background:'var(--bg-card)', border:'1px solid var(--border-color)', borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,0.15)', maxHeight:260, overflowY:'auto' }}>
          {results.map(p => (
            <div key={p.project_id} onClick={() => { onSelect(p.project_id); setQuery(''); setOpen(false); setResults([]) }}
              style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid var(--border-color)' }}
              onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'} onMouseLeave={e=>e.currentTarget.style.background=''}>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>
                {p.project_year} · <code style={{ fontSize:11, background:'var(--bg-hover)', padding:'1px 5px', borderRadius:4 }}>{p.external_project_number||`#${p.project_id}`}</code> {p.project_name?.substring(0,70)}
              </div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{p.entity_name}</div>
            </div>
          ))}
        </div>
      )}
      {snapshot && (
        <div style={{ marginTop:12, padding:'14px 16px', borderRadius:10, background:'rgba(14,165,233,0.05)', border:'1px solid rgba(14,165,233,0.2)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px 20px' }}>
            {[['Año / N° Externo',`${snapshot.project_year} · ${snapshot.external_number||`#${snapshot.project_id}`}`],['Entidad',snapshot.entity_name],['Estado actual',snapshot.current_status],['Fecha suscripción',snapshot.subscription_date?.substring(0,10)||'—'],['Fecha fin vigente',snapshot.end_date_current?.substring(0,10)||'—'],['Valor inicial',snapshot.initial_value?`$${parseFloat(snapshot.initial_value).toLocaleString('es-CO')}`:'—']].map(([k,v])=>(
              <div key={k}><p style={{ fontSize:9, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em', margin:0 }}>{k}</p><p style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)', margin:'3px 0 0' }}>{v}</p></div>
            ))}
          </div>
          <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid rgba(14,165,233,0.15)' }}>
            <p style={{ fontSize:11, color:'var(--text-muted)', margin:0 }}><strong style={{ color:'var(--text-secondary)' }}>Objeto:</strong> {snapshot.project_purpose?.substring(0,200)}{snapshot.project_purpose?.length>200?'…':''}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function InlineTable({ cols, rows, onAdd, onUpdate, onDelete, addLabel='Agregar', emptyMsg='Sin registros' }) {
  return (
    <div>
      {rows.length > 0 ? (
        <div style={{ overflowX:'auto', marginBottom:12, borderRadius:10, border:'1px solid var(--border-color)' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr style={{ background:'var(--bg-hover)' }}>
              {cols.map(c=><th key={c.key} style={{ padding:'9px 10px', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--text-muted)', textAlign:'left', borderBottom:'1px solid var(--border-color)', whiteSpace:'nowrap', width:c.width }}>{c.label}</th>)}
              <th style={{ padding:'9px 8px', width:40, borderBottom:'1px solid var(--border-color)' }}></th>
            </tr></thead>
            <tbody>
              {rows.map((row,ri) => (
                <tr key={row._key??ri} style={{ borderBottom:'1px solid var(--border-color)' }}>
                  {cols.map(c=>(
                    <td key={c.key} style={{ padding:'5px 6px', verticalAlign:'middle' }}>
                      {c.type==='select' ? <select value={row[c.key]||''} onChange={e=>onUpdate(ri,c.key,e.target.value)} style={{ ...IS, padding:'6px 8px', fontSize:12 }}>{c.options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select>
                      : c.type==='number' ? <input type="number" value={row[c.key]||''} onChange={e=>onUpdate(ri,c.key,e.target.value)} style={{ ...IS, padding:'6px 8px', fontSize:12 }}/>
                      : c.type==='date'   ? <input type="date"   value={row[c.key]||''} onChange={e=>onUpdate(ri,c.key,e.target.value)} style={{ ...IS, padding:'6px 8px', fontSize:12 }}/>
                      : c.type==='check'  ? <div style={{ display:'flex', justifyContent:'center' }}><input type="checkbox" checked={!!row[c.key]} onChange={e=>onUpdate(ri,c.key,e.target.checked)} style={{ accentColor:'#10B981', width:16, height:16, cursor:'pointer' }}/></div>
                      : <input type="text" value={row[c.key]||''} onChange={e=>onUpdate(ri,c.key,e.target.value)} placeholder={c.placeholder||''} style={{ ...IS, padding:'6px 8px', fontSize:12 }}/>}
                    </td>
                  ))}
                  <td style={{ padding:'5px 6px', textAlign:'center' }}>
                    <button onClick={()=>onDelete(ri)} style={{ width:26, height:26, borderRadius:6, border:'1px solid rgba(185,28,60,0.3)', background:'rgba(185,28,60,0.08)', color:'#B91C3C', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}><Trash2 size={12}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ padding:'16px', borderRadius:10, border:'1px dashed var(--border-color)', marginBottom:12, textAlign:'center' }}>
          <p style={{ fontSize:12, color:'var(--text-muted)', fontStyle:'italic', margin:0 }}>{emptyMsg}</p>
        </div>
      )}
      <button onClick={onAdd} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:8, border:'1px dashed rgba(14,165,233,0.4)', background:'rgba(14,165,233,0.05)', color:'#0EA5E9', cursor:'pointer', fontSize:12, fontFamily:'inherit', fontWeight:600 }}>
        <Plus size={13}/> {addLabel}
      </button>
    </div>
  )
}

function SecGeneral({ form, set, snapshot, onSelectProject }) {
  return <>
    <ST icon={FileText} color="#0EA5E9" title="Información General del Proyecto" subtitle="Selecciona el proyecto — los datos se autocompletan desde SIEXUD"/>
    <G cols={1}><F label="Proyecto" required hint="Busca por nombre, N° externo o ID interno"><ProjectSelector snapshot={snapshot} onSelect={onSelectProject}/></F></G>
    <G cols={2}>
      <F label="Fecha de Corte" required><input type="date" className="input-field" value={form.cut_date} onChange={e=>set('cut_date',e.target.value)}/></F>
      <F label="Estado actual del proyecto">
        <select className="input-field" value={form.current_status} onChange={e=>set('current_status',e.target.value)}>
          <option value="">— Seleccionar —</option>
          {['EN EJECUCIÓN','TERMINADO','SUSPENDIDO','EN LIQUIDACIÓN','CIERRE FINANCIERO','LIQUIDADO','SUSCRITO','FORMULADO'].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </F>
    </G>
    <G cols={1}>
      <F label="Riesgos / Alertas relevantes">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          {[{v:'EJECUCION_NORMAL',l:'En ejecución conforme al cronograma'},{v:'DESVIACIONES',l:'Desviaciones operativas y financieras'},{v:'SUSPENSION',l:'Suspensión o retraso'},{v:'LIQUIDACION',l:'En liquidación'}].map(o=>(
            <label key={o.v} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--text-primary)', cursor:'pointer', padding:'8px 12px', borderRadius:8, border:'1px solid var(--border-color)', background:(form.risks_alerts||'').includes(o.v)?'rgba(185,28,60,0.06)':'transparent' }}>
              <input type="checkbox" checked={(form.risks_alerts||'').includes(o.v)} onChange={e=>{ const curr=(form.risks_alerts||'').split(',').filter(Boolean); const next=e.target.checked?[...curr,o.v]:curr.filter(x=>x!==o.v); set('risks_alerts',next.join(',')) }} style={{ accentColor:'#B91C3C', width:15, height:15, cursor:'pointer' }}/>{o.l}
            </label>
          ))}
        </div>
        <textarea className="input-field" value={form.general_observations} onChange={e=>set('general_observations',e.target.value)} rows={3} placeholder="Observaciones del estado y ejecución del proyecto..." style={{ resize:'vertical' }}/>
      </F>
    </G>
  </>
}

function SecPersonal({ personnel, setPersonnel }) {
  return <>
    <ST icon={Users} color="#8B5CF6" title="Personal del Proyecto" subtitle="Histórico de supervisores, directores y coordinadores — se conserva el historial de cambios"/>
    <InlineTable
      cols={[
        { key:'role', label:'Rol', width:130, type:'select', options:[{v:'SUPERVISOR',l:'Supervisor'},{v:'DIRECTOR',l:'Director'},{v:'COORDINADOR',l:'Coordinador'},{v:'ADMINISTRATIVO',l:'Administrativo'}]},
        { key:'full_name', label:'Nombre completo', width:180, placeholder:'Nombre completo' },
        { key:'resolution_contract', label:'N° Resolución / Contrato', width:140, placeholder:'013 de 2026' },
        { key:'email', label:'Correo electrónico', width:160, placeholder:'correo@udistrital.edu.co' },
        { key:'phone', label:'Teléfono', width:110, placeholder:'3001234567' },
        { key:'is_current', label:'Vigente', width:60, type:'check' },
        { key:'start_date', label:'Desde', width:130, type:'date' },
        { key:'end_date', label:'Hasta', width:130, type:'date' },
      ]}
      rows={personnel}
      onAdd={()=>setPersonnel(r=>[...r,{_key:Date.now(),role:'SUPERVISOR',full_name:'',resolution_contract:'',email:'',phone:'',is_current:true,start_date:'',end_date:''}])}
      onUpdate={(ri,k,v)=>setPersonnel(r=>r.map((x,i)=>i===ri?{...x,[k]:v}:x))}
      onDelete={ri=>setPersonnel(r=>r.filter((_,i)=>i!==ri))}
      addLabel="Agregar persona" emptyMsg="Sin personal registrado — agrega supervisores, directores y coordinadores"/>
    <div style={{ marginTop:14, padding:'10px 14px', borderRadius:8, background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)', fontSize:12, color:'#B45309' }}>
      ℹ️ "Vigente" marca la persona actualmente activa en cada rol. Se conserva el histórico de todos los cambios.
    </div>
  </>
}

function SecTiempo({ form, set, snapshot }) {
  return <>
    <ST icon={Clock} color="#F59E0B" title="Gestión del Tiempo" subtitle="Plazos del proyecto — las fechas y modificaciones se traen automáticamente de SIEXUD"/>
    {snapshot ? (
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:22 }}>
        {[{label:'Fecha de suscripción',value:snapshot.subscription_date?.substring(0,10)||'—',color:'#0EA5E9'},{label:'Fecha de inicio',value:snapshot.start_date?.substring(0,10)||'—',color:'#10B981'},{label:'Fecha fin original',value:snapshot.end_date_original?.substring(0,10)||'—',color:'#F59E0B'},{label:'Fecha fin vigente (con prórrogas)',value:snapshot.end_date_current?.substring(0,10)||'—',color:'#B91C3C',bold:true}].map(({label,value,color,bold})=>(
          <div key={label} style={{ padding:'12px 16px', borderRadius:10, background:`${color}08`, border:`1px solid ${color}20` }}>
            <p style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em', margin:0 }}>{label}</p>
            <p style={{ fontSize:15, fontWeight:bold?800:700, color, margin:'5px 0 0' }}>{value}</p>
          </div>
        ))}
      </div>
    ) : (
      <div style={{ padding:'14px', borderRadius:10, border:'1px dashed var(--border-color)', marginBottom:22, textAlign:'center', color:'var(--text-muted)', fontSize:12 }}>Selecciona un proyecto en el paso General para ver las fechas</div>
    )}
    <G cols={1}>
      <F label="Observaciones sobre modificaciones y novedades del proyecto">
        <textarea className="input-field" value={form.modification_observations} onChange={e=>set('modification_observations',e.target.value)} rows={4} placeholder="Describe prórrogas, suspensiones, reinicios y otras modificaciones relevantes..." style={{ resize:'vertical' }}/>
      </F>
    </G>
    <div style={{ padding:'10px 14px', borderRadius:8, background:'rgba(14,165,233,0.05)', border:'1px solid rgba(14,165,233,0.2)', fontSize:12, color:'#0369A1' }}>
      📋 Las prórrogas, adiciones y suspensiones detalladas se gestionan en el módulo de <strong>Modificaciones</strong> del proyecto.
    </div>
  </>
}

function SecFinanciero({ form, set, invoices, setInvoices }) {
  return <>
    <ST icon={DollarSign} color="#10B981" title="Gestión Financiera" subtitle="Aportes, valores del proyecto y facturas radicadas ante la entidad"/>
    <p style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:12 }}>Aportes</p>
    <G cols={3}>
      <F label="Entidad — Dinero"><Num value={form.entity_cash} onChange={v=>set('entity_cash',v)} placeholder="0"/></F>
      <F label="Entidad — Especie"><Num value={form.entity_kind} onChange={v=>set('entity_kind',v)} placeholder="0"/></F>
      <F label="Entidad — N/A"><Num value={form.entity_na} onChange={v=>set('entity_na',v)} placeholder="0"/></F>
      <F label="Universidad — Dinero"><Num value={form.ud_cash} onChange={v=>set('ud_cash',v)} placeholder="0"/></F>
      <F label="Universidad — Especie"><Num value={form.ud_kind} onChange={v=>set('ud_kind',v)} placeholder="0"/></F>
      <F label="Universidad — N/A"><Num value={form.ud_na} onChange={v=>set('ud_na',v)} placeholder="0"/></F>
    </G>
    <div style={{ height:1, background:'var(--border-color)', margin:'6px 0 20px' }}/>
    <p style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:12 }}>Resumen financiero</p>
    <G cols={3}>
      <F label="Valor Inicial"><Num value={form.initial_value} onChange={v=>set('initial_value',v)}/></F>
      <F label="Adición / Reducción"><Num value={form.addition_value} onChange={v=>set('addition_value',v)}/></F>
      <F label="Valor Total"><Num value={form.total_value} onChange={v=>set('total_value',v)}/></F>
      <F label="Total Desembolsos Acumulados"><Num value={form.total_disbursements} onChange={v=>set('total_disbursements',v)}/></F>
      <F label="Saldo Actual"><Num value={form.current_balance} onChange={v=>set('current_balance',v)}/></F>
      <F label="Total por Ingresar"><Num value={form.total_pending} onChange={v=>set('total_pending',v)}/></F>
      <F label="Préstamos IDEXUD"><Num value={form.idexud_loans} onChange={v=>set('idexud_loans',v)}/></F>
      <F label="Valor Pagos Realizados"><Num value={form.payments_made} onChange={v=>set('payments_made',v)}/></F>
      <F label="Cuentas por Pagar"><Num value={form.pending_payments} onChange={v=>set('pending_payments',v)}/></F>
    </G>
    <G cols={1}>
      <F label="Observaciones financieras generales">
        <textarea className="input-field" value={form.financial_observations} onChange={e=>set('financial_observations',e.target.value)} rows={3} placeholder="Describe el estado financiero del proyecto a la fecha de corte..." style={{ resize:'vertical' }}/>
      </F>
    </G>
    <div style={{ height:1, background:'var(--border-color)', margin:'6px 0 20px' }}/>
    <p style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:12 }}>Facturas radicadas ante la entidad</p>
    <InlineTable
      cols={[
        {key:'disbursement_number',label:'N° Pago',width:80,type:'number'},
        {key:'invoice_number',label:'N° Factura',width:130,placeholder:'IDX-001'},
        {key:'invoice_date',label:'Fecha Factura',width:130,type:'date'},
        {key:'invoice_value',label:'Valor',width:140,type:'number'},
        {key:'status',label:'Estado',width:130,type:'select',options:[{v:'PENDIENTE',l:'⏳ Pendiente'},{v:'PAGADA',l:'✅ Pagada'},{v:'EN_REVISION',l:'🔄 En revisión'}]},
        {key:'payment_date',label:'Fecha Pago',width:130,type:'date'},
        {key:'observations',label:'Observaciones',width:180,placeholder:'Observación...'},
      ]}
      rows={invoices}
      onAdd={()=>setInvoices(r=>[...r,{_key:Date.now(),disbursement_number:r.length+1,invoice_number:'',invoice_date:'',invoice_value:'',status:'PENDIENTE',payment_date:'',observations:''}])}
      onUpdate={(ri,k,v)=>setInvoices(r=>r.map((x,i)=>i===ri?{...x,[k]:v}:x))}
      onDelete={ri=>setInvoices(r=>r.filter((_,i)=>i!==ri))}
      addLabel="Agregar factura / desembolso" emptyMsg="Sin facturas registradas"/>
  </>
}

function SecDialogo({ form, set }) {
  return <>
    <ST icon={TrendingUp} color="#0EA5E9" title="Diálogo de Seguimiento — Ejecución Física y Financiera" subtitle="A ser diligenciado por el Director / Coordinador del proyecto"/>
    <G cols={2}>
      <F label="% Ejecución física acumulada">
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <input type="number" min={0} max={100} className="input-field" value={form.physical_progress_pct??''} onChange={e=>set('physical_progress_pct',e.target.value)} style={{ width:90, fontFamily:'monospace' }}/>
          <div style={{ flex:1, height:8, borderRadius:99, background:'var(--bg-hover)', overflow:'hidden', border:'1px solid var(--border-color)' }}>
            <div style={{ width:`${Math.min(100,form.physical_progress_pct||0)}%`, height:'100%', background:'#10B981', borderRadius:99, transition:'width .3s' }}/>
          </div>
          <span style={{ fontSize:14, fontWeight:800, color:'#10B981', minWidth:44, textAlign:'right' }}>{form.physical_progress_pct||0}%</span>
        </div>
      </F>
      <F label="% Ejecución financiera acumulada">
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <input type="number" min={0} max={100} className="input-field" value={form.financial_progress_pct??''} onChange={e=>set('financial_progress_pct',e.target.value)} style={{ width:90, fontFamily:'monospace' }}/>
          <div style={{ flex:1, height:8, borderRadius:99, background:'var(--bg-hover)', overflow:'hidden', border:'1px solid var(--border-color)' }}>
            <div style={{ width:`${Math.min(100,form.financial_progress_pct||0)}%`, height:'100%', background:'#0EA5E9', borderRadius:99, transition:'width .3s' }}/>
          </div>
          <span style={{ fontSize:14, fontWeight:800, color:'#0EA5E9', minWidth:44, textAlign:'right' }}>{form.financial_progress_pct||0}%</span>
        </div>
      </F>
    </G>
    <G cols={1}>
      <F label="Avances del proyecto hasta la fecha de diligenciamiento" required hint="Describa los avances del proyecto hasta la fecha del formato">
        <textarea className="input-field" value={form.advances_description} onChange={e=>set('advances_description',e.target.value)} rows={5} placeholder="Describa los avances del proyecto hasta la fecha de diligenciamiento del formato..." style={{ resize:'vertical' }}/>
      </F>
      <F label="Dificultades e imprevistos presentados y su gestión" hint="Principales dificultades e imprevistos y cómo se gestionaron">
        <textarea className="input-field" value={form.difficulties_description} onChange={e=>set('difficulties_description',e.target.value)} rows={5} placeholder="Describa las principales dificultades e imprevistos presentados y su gestión..." style={{ resize:'vertical' }}/>
      </F>
      <F label="Actividades pendientes para la finalización del contrato">
        <textarea className="input-field" value={form.pending_activities} onChange={e=>set('pending_activities',e.target.value)} rows={4} placeholder="¿Qué actividades quedan pendientes para la finalización del contrato?" style={{ resize:'vertical' }}/>
      </F>
    </G>
  </>
}

function SecInformes({ reports, setReports }) {
  return <>
    <ST icon={ClipboardList} color="#166534" title="Informes Presentados / Soportes de Ejecución" subtitle="Informes técnicos, administrativos y financieros remitidos a la entidad"/>
    <InlineTable
      cols={[
        {key:'report_number',label:'N° Informe',width:90,type:'number'},
        {key:'cut_percentage',label:'Corte %',width:80,type:'number'},
        {key:'delivery_date',label:'Fecha entrega',width:130,type:'date'},
        {key:'deliverable_description',label:'Entregable relacionado',width:240,placeholder:'Cronograma, Producto 1...'},
        {key:'status',label:'Estado',width:140,type:'select',options:[{v:'APROBADO',l:'✅ Aprobado'},{v:'EN_REVISION',l:'🔄 En revisión'},{v:'DEVUELTO',l:'↩ Devuelto'}]},
        {key:'observations',label:'Observaciones',width:160,placeholder:'Observación...'},
      ]}
      rows={reports}
      onAdd={()=>setReports(r=>[...r,{_key:Date.now(),report_number:r.length+1,cut_percentage:'',delivery_date:'',deliverable_description:'',status:'EN_REVISION',observations:''}])}
      onUpdate={(ri,k,v)=>setReports(r=>r.map((x,i)=>i===ri?{...x,[k]:v}:x))}
      onDelete={ri=>setReports(r=>r.filter((_,i)=>i!==ri))}
      addLabel="Agregar informe" emptyMsg="Sin informes registrados — agrega los informes entregados a la entidad"/>
  </>
}

const EMPTY_FORM = { project_id:'', cut_date:new Date().toISOString().split('T')[0], current_status:'', risks_alerts:'', general_observations:'', physical_progress_pct:'', financial_progress_pct:'', initial_value:'', addition_value:0, total_value:'', total_disbursements:0, current_balance:'', total_pending:'', idexud_loans:0, payments_made:0, pending_payments:0, entity_cash:0, entity_kind:0, entity_na:0, ud_cash:0, ud_kind:0, ud_na:0, advances_description:'', difficulties_description:'', pending_activities:'', financial_observations:'', modification_observations:'' }

export default function TrackingFormPage() {
  const navigate = useNavigate()
  const { id }   = useParams()
  const isEdit   = !!id
  const [step,      setStep]      = useState('general')
  const [saving,    setSaving]    = useState(false)
  const [loading,   setLoading]   = useState(isEdit)
  const [snapshot,  setSnapshot]  = useState(null)
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [personnel, setPersonnel] = useState([])
  const [invoices,  setInvoices]  = useState([])
  const [reports,   setReports]   = useState([])
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const loadSnapshot = useCallback(async (pid) => {
    if (!pid) return
    try {
      const r = await trackingService.snapshot(pid)
      setSnapshot(r.data)
      setForm(f=>({ ...f, project_id:pid, current_status:r.data.current_status||f.current_status, initial_value:r.data.initial_value||f.initial_value, addition_value:r.data.total_additions||0, total_value:r.data.total_value||f.total_value }))
    } catch {}
  }, [])

  useEffect(() => {
    if (!isEdit) return
    const load = async () => {
      try {
        const r = await trackingService.get(id); const d = r.data
        setForm({ project_id:d.project_id, cut_date:d.cut_date?.substring(0,10)||'', current_status:d.current_status||'', physical_progress_pct:d.physical_progress_pct??'', financial_progress_pct:d.financial_progress_pct??'', initial_value:d.initial_value??'', addition_value:d.addition_value??0, total_value:d.total_value??'', total_disbursements:d.total_disbursements??0, current_balance:d.current_balance??'', total_pending:d.total_pending??'', idexud_loans:d.idexud_loans??0, payments_made:d.payments_made??0, pending_payments:d.pending_payments??0, entity_cash:d.entity_cash??0, entity_kind:d.entity_kind??0, entity_na:d.entity_na??0, ud_cash:d.ud_cash??0, ud_kind:d.ud_kind??0, ud_na:d.ud_na??0, advances_description:d.advances_description||'', difficulties_description:d.difficulties_description||'', pending_activities:d.pending_activities||'', financial_observations:d.financial_observations||'', modification_observations:d.modification_observations||'', general_observations:d.general_observations||'', risks_alerts:d.risks_alerts||'' })
        if (d.snapshot)  setSnapshot(d.snapshot)
        if (d.personnel) setPersonnel(d.personnel.map((p,i)=>({...p,_key:i})))
        if (d.invoices)  setInvoices(d.invoices.map((inv,i)=>({...inv,_key:i})))
        if (d.reports)   setReports(d.reports.map((rp,i)=>({...rp,_key:i})))
      } catch { toast.error('Error cargando datos') } finally { setLoading(false) }
    }; load()
  }, [id, isEdit])

  const stepStatus = STEPS.map(s => ({ ...s, complete: s.required.every(k=>!!form[k]) }))
  const completedCount = stepStatus.filter(s=>s.complete).length
  const currentIdx = STEPS.findIndex(s=>s.id===step)

  const handleSave = async () => {
    if (!form.project_id) { toast.error('Selecciona un proyecto'); setStep('general'); return }
    if (!form.cut_date)   { toast.error('La fecha de corte es obligatoria'); setStep('general'); return }
    setSaving(true)
    try {
      const payload = { ...form }
      ;['physical_progress_pct','financial_progress_pct','initial_value','addition_value','total_value','total_disbursements','current_balance','total_pending','idexud_loans','payments_made','pending_payments','entity_cash','entity_kind','entity_na','ud_cash','ud_kind','ud_na'].forEach(k=>{ payload[k]=payload[k]===''||payload[k]===null?null:parseFloat(payload[k])||0 })
      let tid
      if (isEdit) { await trackingService.update(id,payload); tid=parseInt(id); toast.success('Seguimiento actualizado ✓') }
      else { const r=await trackingService.create(payload); tid=r.data.tracking_id; toast.success('Seguimiento creado ✓') }
      const pid = form.project_id
      for (const p of personnel) { if (!p.personnel_id) await trackingService.createPersonnel(pid,{...p}); else await trackingService.updatePersonnel(p.personnel_id,p) }
      for (const inv of invoices) { const d={...inv,disbursement_number:parseInt(inv.disbursement_number)||1,invoice_value:parseFloat(inv.invoice_value)||null,invoice_date:inv.invoice_date||null,payment_date:inv.payment_date||null}; if(!inv.invoice_id) await trackingService.createInvoice(pid,d); else await trackingService.updateInvoice(inv.invoice_id,d) }
      for (const rp of reports) { const d={...rp,report_number:parseInt(rp.report_number)||1,cut_percentage:parseFloat(rp.cut_percentage)||null,delivery_date:rp.delivery_date||null}; if(!rp.report_id) await trackingService.createReport(pid,d); else await trackingService.updateReport(rp.report_id,d) }
      navigate('/tracking')
    } catch(err) { toast.error(err.response?.data?.detail||'Error al guardar') } finally { setSaving(false) }
  }

  if (loading) return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', gap:12, color:'var(--text-muted)' }}><Loader size={20} style={{ animation:'spin 1s linear infinite' }}/> Cargando...</div>

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background:'var(--bg-primary)' }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      {/* Topbar */}
      <div style={{ background:'var(--bg-card)', borderBottom:'1px solid var(--border-color)', padding:'0 24px', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={()=>navigate('/tracking')} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'1px solid var(--border-color)', cursor:'pointer', color:'var(--text-secondary)', fontSize:13, fontFamily:'inherit', padding:'7px 12px', borderRadius:8 }}><ArrowLeft size={15}/> Volver</button>
            <div style={{ width:1, height:24, background:'var(--border-color)' }}/>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:9, background:'rgba(14,165,233,.12)', display:'flex', alignItems:'center', justifyContent:'center' }}><Activity size={18} color="#0EA5E9"/></div>
              <div>
                <h1 style={{ fontSize:15, fontWeight:800, color:'var(--text-primary)', margin:0 }}>{isEdit?'Editar Seguimiento':'Nuevo Seguimiento'}</h1>
                <p style={{ fontSize:11, color:'var(--text-muted)', margin:0 }}>{completedCount} de {STEPS.length} pasos completados</p>
              </div>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ minWidth:180 }}>
            {saving?<Loader size={14} style={{ animation:'spin 1s linear infinite' }}/>:<Save size={14}/>}
            {saving?'Guardando...':isEdit?'Guardar cambios':'Crear seguimiento'}
          </button>
        </div>
        {/* Stepper horizontal */}
        <div style={{ display:'flex', alignItems:'stretch', overflowX:'auto' }}>
          {stepStatus.map((s,i) => {
            const active=step===s.id; const done=s.complete
            return (
              <div key={s.id} style={{ display:'flex', alignItems:'center', flex:i<stepStatus.length-1?'1 1 0':'none', minWidth:0 }}>
                <button onClick={()=>setStep(s.id)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'8px 10px 11px', border:'none', background:'none', cursor:'pointer', fontFamily:'inherit', flexShrink:0, position:'relative' }}>
                  <div style={{ width:30, height:30, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:11, transition:'all .2s', background:done?'#10B981':active?'#0F2952':'var(--bg-hover)', color:done?'#fff':active?'#fff':'var(--text-muted)', boxShadow:active&&!done?'0 0 0 3px rgba(14,165,233,0.2)':'none', border:active&&!done?'2px solid #0EA5E9':'2px solid transparent' }}>
                    {done?<CheckCircle2 size={14} color="#fff"/>:<span>{String(i+1).padStart(2,'0')}</span>}
                  </div>
                  <span style={{ fontSize:10, fontWeight:active?700:500, whiteSpace:'nowrap', color:done?'#10B981':active?'#0EA5E9':'var(--text-muted)' }}>{s.label}</span>
                  {active&&<div style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)', width:28, height:3, borderRadius:'3px 3px 0 0', background:'#0EA5E9' }}/>}
                </button>
                {i<stepStatus.length-1&&<div style={{ flex:1, height:2, borderRadius:2, margin:'0 2px', marginBottom:18, background:done?'#10B981':'var(--border-color)' }}/>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Layout: mini sidebar + contenido */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        <div style={{ width:178, background:'var(--bg-card)', borderRight:'1px solid var(--border-color)', padding:'12px 8px', display:'flex', flexDirection:'column', gap:2, flexShrink:0 }}>
          {stepStatus.map(s => {
            const active=step===s.id
            return (
              <button key={s.id} onClick={()=>setStep(s.id)} style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 10px', borderRadius:7, border:'none', background:active?'rgba(14,165,233,0.12)':'transparent', cursor:'pointer', fontFamily:'inherit', fontSize:12.5, fontWeight:active?700:500, color:active?'#0EA5E9':s.complete?'#10B981':'var(--text-muted)', textAlign:'left', borderLeft:active?'3px solid #0EA5E9':'3px solid transparent', transition:'all .15s' }}>
                <s.icon size={14} style={{ flexShrink:0 }}/>
                <span style={{ flex:1 }}>{s.label}</span>
                {s.complete?<CheckCircle2 size={13} color="#10B981"/>:s.required.length>0?<AlertCircle size={12} style={{ opacity:.3 }}/>:null}
              </button>
            )
          })}
          <div style={{ marginTop:'auto', padding:'16px 8px 4px' }}>
            <div style={{ height:5, background:'var(--border-color)', borderRadius:3, overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:3, background:'#10B981', transition:'width .4s', width:`${(completedCount/STEPS.length)*100}%` }}/>
            </div>
            <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:6, textAlign:'center' }}>{Math.round((completedCount/STEPS.length)*100)}% completado</p>
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto' }}>
          <div style={{ maxWidth:820, margin:'0 auto', padding:'36px 36px 60px' }}>
            {step==='general'    && <SecGeneral    form={form} set={set} snapshot={snapshot} onSelectProject={pid=>{ set('project_id',pid); loadSnapshot(pid) }}/>}
            {step==='personal'   && <SecPersonal   personnel={personnel} setPersonnel={setPersonnel}/>}
            {step==='tiempo'     && <SecTiempo     form={form} set={set} snapshot={snapshot}/>}
            {step==='financiero' && <SecFinanciero form={form} set={set} invoices={invoices} setInvoices={setInvoices}/>}
            {step==='dialogo'    && <SecDialogo    form={form} set={set}/>}
            {step==='informes'   && <SecInformes   reports={reports} setReports={setReports}/>}
            {/* Navegación inferior */}
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:32, paddingTop:20, borderTop:'1px solid var(--border-color)' }}>
              <button onClick={()=>currentIdx>0&&setStep(STEPS[currentIdx-1].id)} disabled={currentIdx===0} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:9, border:'1px solid var(--border-color)', background:'var(--bg-secondary)', color:currentIdx>0?'var(--text-secondary)':'var(--text-muted)', cursor:currentIdx>0?'pointer':'not-allowed', fontSize:13, fontFamily:'inherit', fontWeight:600, opacity:currentIdx>0?1:0.4 }}>
                <ChevronLeft size={15}/> Anterior
              </button>
              {currentIdx<STEPS.length-1 ? (
                <button onClick={()=>setStep(STEPS[currentIdx+1].id)} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 22px', borderRadius:9, border:'none', background:'#0EA5E9', color:'#fff', cursor:'pointer', fontSize:13, fontFamily:'inherit', fontWeight:700 }}>
                  Siguiente <ChevronRight size={15}/>
                </button>
              ) : (
                <button onClick={handleSave} disabled={saving} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 22px', borderRadius:9, border:'none', background:'#10B981', color:'#fff', cursor:saving?'wait':'pointer', fontSize:13, fontFamily:'inherit', fontWeight:700 }}>
                  {saving?<Loader size={14} style={{ animation:'spin 1s linear infinite' }}/>:<Save size={14}/>}
                  {saving?'Guardando...':'Guardar seguimiento'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
