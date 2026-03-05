// frontend/src/pages/projects/ProjectViewPage.jsx — v4.1
// + Sección de modificaciones al final con detalle expandible
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Pencil, GitBranch, FolderOpen,
  FileText, Settings, DollarSign, Calendar, Users, Tag,
  ChevronDown, ChevronUp, Lock, Clock, Shield,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { projectsService, modificationsService, rupService, emailsService } from '../../services/projects'

/* ─── Helpers ────────────────────────────────────────────────────── */
function fmtDate(d) { return d ? String(d).split('T')[0] : '—' }
function fmtMoney(v) {
  const n = parseFloat(v)
  if (!v || isNaN(n)) return '—'
  return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })
}
function fmtPct(v) { return v != null ? `${parseFloat(v).toFixed(2)}%` : '—' }

/* ─── Meta por tipo modificación ─────────────────────────────────── */
const TYPE_META = {
  ADDITION:          { label: 'Adición',               color: '#10B981' },
  EXTENSION:         { label: 'Prórroga',              color: '#0EA5E9' },
  BOTH:              { label: 'Adición + Prórroga',    color: '#8B5CF6' },
  CONTRACTUAL:       { label: 'Modif. Contractual',    color: '#F59E0B' },
  SUSPENSION:        { label: 'Suspensión',            color: '#EF4444' },
  RESTART:           { label: 'Reinicio',              color: '#06B6D4' },
  CESION_CESIONARIA: { label: 'Cesión (Cesionaria)',   color: '#8B5CF6' },
  CESION_CEDENTE:    { label: 'Cesión (Cedente)',      color: '#8B5CF6' },
  LIQUIDATION:       { label: 'Liquidación',           color: '#64748B' },
}

/* ─── UI primitivos ──────────────────────────────────────────────── */
function Field({ label, value, mono, span }) {
  return (
    <div style={span ? { gridColumn: `span ${span}` } : {}}>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 13, color: value ? 'var(--text-primary)' : 'var(--text-muted)', fontFamily: mono ? 'monospace' : 'inherit', fontWeight: value ? 500 : 400, wordBreak: 'break-word' }}>
        {value || '—'}
      </p>
    </div>
  )
}
function Grid({ cols = 2, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '14px 28px', marginBottom: 20 }}>
      {children}
    </div>
  )
}
function Section({ icon: Icon, color, title, children }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 16 }}>
      <SectionTitle icon={Icon} color={color} title={title} />
      {children}
    </div>
  )
}
function SectionTitle({ icon: Icon, color, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border-color)' }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={16} color={color} />
      </div>
      <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '.06em' }}>{title}</h3>
    </div>
  )
}

/* ─── Detalle de una modificación ────────────────────────────────── */
function DField({ label, value, mono, color }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 12, color: color || 'var(--text-primary)', fontFamily: mono ? 'monospace' : 'inherit', fontWeight: 500, wordBreak: 'break-word' }}>
        {String(value)}
      </p>
    </div>
  )
}
function DGrid({ cols = 2, children }) {
  const valid = (Array.isArray(children) ? children : [children]).filter(Boolean)
  if (!valid.length) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '8px 18px', marginBottom: 12 }}>
      {children}
    </div>
  )
}
function DSub({ title, color, children }) {
  const valid = (Array.isArray(children) ? children : [children]).filter(Boolean)
  if (!valid.length) return null
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '.07em' }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: `${color}30` }} />
      </div>
      {children}
    </div>
  )
}

function ModDetail({ m }) {
  return (
    <div style={{ padding: '12px 14px', background: 'var(--bg-primary)', borderRadius: 10, border: '1px solid var(--border-color)', marginTop: 10 }}>
      <DSub title="Datos Generales" color="#F59E0B">
        <DGrid cols={3}>
          <DField label="Acto administrativo" value={m.administrative_act} />
          <DField label="Fecha de aprobación" value={fmtDate(m.approval_date)} />
          <DField label="Estado" value={m.is_active ? 'Activa' : 'Inactiva'} color={m.is_active ? '#10B981' : '#94A3B8'} />
        </DGrid>
        {m.justification && <DField label="Justificación" value={m.justification} />}
      </DSub>

      {(m.addition_value || m.new_total_value) && (
        <DSub title="Adición Presupuestal" color="#10B981">
          <DGrid cols={2}>
            <DField label="Valor de la adición" value={fmtMoney(m.addition_value)} color="#10B981" mono />
            <DField label="Nuevo valor total" value={fmtMoney(m.new_total_value)} mono />
          </DGrid>
          {m.payment_method_modification && <DField label="Modificación forma de pago" value={m.payment_method_modification} />}
        </DSub>
      )}

      {m.new_end_date && (
        <DSub title="Prórroga de Plazo" color="#0EA5E9">
          <DGrid cols={3}>
            <DField label="Nueva fecha de fin" value={fmtDate(m.new_end_date)} color="#0EA5E9" />
            <DField label="Días" value={m.extension_days ? `${m.extension_days} días` : null} />
            <DField label="En letras" value={m.extension_period_text} />
          </DGrid>
        </DSub>
      )}

      {m.suspension && (
        <DSub title="Suspensión" color="#EF4444">
          <DGrid cols={3}>
            <DField label="Inicio" value={fmtDate(m.suspension.suspension_start_date)} />
            <DField label="Fin" value={fmtDate(m.suspension.suspension_end_date)} />
            <DField label="Reinicio programado" value={fmtDate(m.suspension.planned_restart_date)} />
          </DGrid>
          <DGrid cols={2}>
            <DField label="Justif. contratista" value={m.suspension.contractor_justification} />
            <DField label="Justif. supervisor" value={m.suspension.supervisor_justification} />
          </DGrid>
          <DField label="Estado suspensión" value={m.suspension.suspension_status} />
        </DSub>
      )}

      {m.restart && (
        <DSub title="Reinicio" color="#06B6D4">
          <DGrid cols={2}>
            <DField label="Fecha real de reinicio" value={fmtDate(m.restart.actual_restart_date)} color="#06B6D4" />
            <DField label="Período suspendido" value={`${fmtDate(m.restart.suspension_start_date)} → ${fmtDate(m.restart.suspension_end_date)}`} />
          </DGrid>
        </DSub>
      )}

      {m.clause && (
        <DSub title="Modificación Contractual" color="#F59E0B">
          <DField label="Descripción" value={m.clause.modification_description} />
          {m.clause.requires_resource_liberation && (
            <DGrid cols={3}>
              <DField label="CDP a liberar" value={m.clause.cdp_to_release} mono />
              <DField label="RP a liberar" value={m.clause.rp_to_release} mono />
              <DField label="Valor a liberar" value={fmtMoney(m.clause.liberation_amount)} color="#EF4444" mono />
            </DGrid>
          )}
        </DSub>
      )}

      {m.assignment && (
        <DSub title="Cesión" color="#8B5CF6">
          <DGrid cols={2}>
            <DField label="Cedente" value={`${m.assignment.assignor_name} · ${m.assignment.assignor_id_type} ${m.assignment.assignor_id}`} />
            <DField label="Cesionario" value={`${m.assignment.assignee_name} · ${m.assignment.assignee_id_type} ${m.assignment.assignee_id}`} />
          </DGrid>
          <DGrid cols={3}>
            <DField label="Fecha cesión" value={fmtDate(m.assignment.assignment_date)} />
            <DField label="Valor a ceder" value={fmtMoney(m.assignment.value_to_assign)} mono />
            <DField label="Valor pendiente cedente" value={fmtMoney(m.assignment.value_pending_to_assignor)} mono />
          </DGrid>
        </DSub>
      )}

      {m.liquidation && (
        <DSub title="Liquidación" color="#64748B">
          <DGrid cols={3}>
            <DField label="Tipo" value={m.liquidation.liquidation_type === 'BILATERAL' ? 'Bilateral' : 'Unilateral'} />
            <DField label="% Ejecución" value={`${m.liquidation.execution_percentage}%`} />
            <DField label="Fecha" value={fmtDate(m.liquidation.liquidation_date)} />
          </DGrid>
          <DGrid cols={3}>
            <DField label="Valor inicial" value={fmtMoney(m.liquidation.initial_contract_value)} mono />
            <DField label="Valor final + adiciones" value={fmtMoney(m.liquidation.final_value_with_additions)} mono />
            <DField label="Valor ejecutado" value={fmtMoney(m.liquidation.executed_value)} color="#10B981" mono />
          </DGrid>
          <DGrid cols={2}>
            <DField label="Valor pendiente de pago" value={fmtMoney(m.liquidation.pending_payment_value)} mono />
            <DField label="Valor a liberar" value={fmtMoney(m.liquidation.value_to_release)} color="#EF4444" mono />
          </DGrid>
        </DSub>
      )}
    </div>
  )
}

/* ─── Badge tipo modificación ────────────────────────────────────── */
function TypeBadge({ type }) {
  const m = TYPE_META[type] || { label: type, color: '#94A3B8' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 9px', borderRadius: 20, background: `${m.color}18`, color: m.color, fontSize: 11, fontWeight: 700 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: m.color }} />
      {m.label}
    </span>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   PÁGINA
═══════════════════════════════════════════════════════════════════ */
export default function ProjectViewPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [project,  setProject]  = useState(null)
  const [rupCodes, setRupCodes] = useState([])
  const [emails,   setEmails]   = useState([])
  const [mods,     setMods]     = useState([])
  const [expanded, setExpanded] = useState({})
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([
      projectsService.get(id),
      rupService.getProjectRup(id),
      emailsService.list(id),
      modificationsService.list(id),
    ])
      .then(([pr, rr, em, mo]) => {
        setProject(pr.data)
        setRupCodes(rr.data)
        setEmails(em.data)
        setMods(Array.isArray(mo.data) ? mo.data : [])
      })
      .catch(() => { toast.error('Error cargando proyecto'); navigate('/projects') })
      .finally(() => setLoading(false))
  }, [id, navigate])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Cargando proyecto…</p>
    </div>
  )

  const p = project
  const toggleExpand = (modId) => setExpanded(prev => ({ ...prev, [modId]: !prev[modId] }))

  // Totales de modificaciones activas
  const activeMods = mods.filter(m => m.is_active)
  const totalAdiciones = activeMods
    .filter(m => ['ADDITION', 'BOTH'].includes(m.modification_type))
    .reduce((s, m) => s + (parseFloat(m.addition_value) || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* ── Topbar ── */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/projects')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid var(--border-color)', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, fontFamily: 'inherit', padding: '7px 12px', borderRadius: 8 }}>
            <ArrowLeft size={15} /> Volver
          </button>
          <div style={{ width: 1, height: 24, background: 'var(--border-color)' }} />
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Vista del proyecto · {p.project_year} #{p.internal_project_number}
            </h1>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{p.project_name}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate(`/projects/${id}/documents`)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.3)', color: '#6366F1', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', padding: '7px 14px', borderRadius: 8, fontWeight: 600 }}>
            <FolderOpen size={14} /> Documentos
          </button>
          <button onClick={() => navigate(`/projects/${id}/modifications`)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.3)', color: '#D97706', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', padding: '7px 14px', borderRadius: 8, fontWeight: 600 }}>
            <GitBranch size={14} /> Modificaciones {mods.length > 0 && <span style={{ background: '#F59E0B', color: '#fff', borderRadius: 20, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>{mods.length}</span>}
          </button>
          <button onClick={() => navigate(`/projects/${id}/edit`)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(14,165,233,.1)', border: '1px solid rgba(14,165,233,.3)', color: '#0EA5E9', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', padding: '7px 14px', borderRadius: 8, fontWeight: 600 }}>
            <Pencil size={14} /> Editar
          </button>
        </div>
      </div>

      {/* ── Contenido ── */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-primary)', padding: '28px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>

          {/* Identificación */}
          <Section icon={FileText} color="#0F2952" title="Identificación">
            <Grid cols={3}>
              <Field label="Año" value={p.project_year} mono />
              <Field label="N° interno" value={`#${p.internal_project_number}`} mono />
              <Field label="N° externo" value={p.external_project_number} mono />
            </Grid>
            <Grid cols={1}>
              <Field label="Nombre del proyecto" value={p.project_name} span={1} />
            </Grid>
            <Grid cols={1}>
              <Field label="Objeto del proyecto" value={p.project_purpose} span={1} />
            </Grid>
            <Grid cols={3}>
              <Field label="Tipo de sesión" value={p.session_type} />
              <Field label="Fecha del acta" value={fmtDate(p.minutes_date)} />
              <Field label="N° del acta" value={p.minutes_number} />
            </Grid>
          </Section>

          {/* Clasificación */}
          <Section icon={Settings} color="#8B5CF6" title="Clasificación">
            <Grid cols={2}>
              <Field label="Estado" value={p.status_name} />
              <Field label="Tipo de proyecto" value={p.type_name} />
              <Field label="Tipo de financiación" value={p.financing_name} />
              <Field label="Modalidad de ejecución" value={p.modality_name} />
            </Grid>
          </Section>

          {/* Financiero */}
          <Section icon={DollarSign} color="#10B981" title="Información Financiera">
            <Grid cols={2}>
              <Field label="Valor total del proyecto" value={fmtMoney(p.project_value)} mono />
              <Field label="Código contable" value={p.accounting_code} mono />
              <Field label="Aporte Universidad" value={fmtMoney(p.university_contribution)} mono />
              <Field label="Aporte Entidad" value={fmtMoney(p.entity_contribution)} mono />
              <Field label="% Beneficio institucional" value={fmtPct(p.institutional_benefit_percentage)} />
              <Field label="Valor beneficio institucional" value={fmtMoney(p.institutional_benefit_value)} mono />
            </Grid>
            {p.beneficiaries_count && <Grid cols={2}><Field label="Número de beneficiarios" value={p.beneficiaries_count} /></Grid>}
          </Section>

          {/* Plazos */}
          <Section icon={Calendar} color="#F59E0B" title="Plazos del Contrato">
            <Grid cols={3}>
              <Field label="Fecha suscripción" value={fmtDate(p.subscription_date)} />
              <Field label="Fecha inicio" value={fmtDate(p.start_date)} />
              <Field label="Fecha fin" value={fmtDate(p.end_date)} />
            </Grid>
            {p.supervisor_type && (
              <Grid cols={2}>
                <Field label="Tipo de supervisor" value={p.supervisor_type === 'JEFE_EXTENSION' ? 'Jefe de Extensión' : 'Rector'} />
              </Grid>
            )}
          </Section>

          {/* Actores */}
          <Section icon={Users} color="#0EA5E9" title="Actores del Contrato">
            <Grid cols={2}>
              <Field label="Entidad contratante" value={p.entity_name} />
              <Field label="Dependencia ejecutora" value={p.department_name} />
              <Field label="Funcionario ordenador del gasto" value={p.official_name} />
              <Field label="Correo principal" value={p.main_email} mono />
            </Grid>
            {emails.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Correos de contacto ({emails.length})</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {emails.map(em => (
                    <div key={em.secondary_email_id} style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontFamily: 'monospace', color: '#0EA5E9', fontWeight: 600 }}>{em.email}</span>
                      {em.contact_type && <span style={{ fontSize: 11, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 4, padding: '2px 8px', color: 'var(--text-secondary)' }}>{em.contact_type}</span>}
                      {em.contact_name && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{em.contact_name}</span>}
                      {em.contact_position && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{em.contact_position}</span>}
                      {em.contact_phone && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>📞 {em.contact_phone}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* Documentación */}
          {(p.administrative_act || p.secop_link || p.observations) && (
            <Section icon={FileText} color="#64748B" title="Documentación">
              <Grid cols={2}>
                <Field label="Acto administrativo" value={p.administrative_act} mono />
                <Field label="Enlace SECOP" value={p.secop_link} mono />
              </Grid>
              {p.observations && <Field label="Observaciones" value={p.observations} span={1} />}
            </Section>
          )}

          {/* Códigos RUP */}
          {rupCodes.length > 0 && (
            <Section icon={Tag} color="#0EA5E9" title={`Códigos RUP / UNSPSC (${rupCodes.length})`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {rupCodes.map(r => (
                  <div key={r.rup_code_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 8 }}>
                    {r.is_main_code && <span style={{ fontSize: 10, fontWeight: 700, background: '#F59E0B20', color: '#D97706', border: '1px solid #F59E0B40', borderRadius: 4, padding: '2px 6px' }}>PRINCIPAL</span>}
                    <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#0EA5E9' }}>{r.rup_code}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.product_name || r.class_name}</span>
                    {r.segment_name && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{r.segment_name}</span>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ── MODIFICACIONES ────────────────────────────────────────── */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245,158,11,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GitBranch size={16} color="#F59E0B" />
                </div>
                <div>
                  <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    Modificaciones {mods.length > 0 && <span style={{ fontSize: 11, background: '#F59E0B20', color: '#D97706', borderRadius: 20, padding: '1px 8px', marginLeft: 6 }}>{mods.length}</span>}
                  </h3>
                  {totalAdiciones > 0 && (
                    <p style={{ fontSize: 11, color: '#10B981', margin: '2px 0 0', fontWeight: 600 }}>
                      + {fmtMoney(totalAdiciones)} en adiciones · Valor final: {fmtMoney((parseFloat(p.project_value) || 0) + totalAdiciones)}
                    </p>
                  )}
                </div>
              </div>
              <button onClick={() => navigate(`/projects/${id}/modifications`)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.3)', color: '#D97706', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', padding: '6px 12px', borderRadius: 8, fontWeight: 600 }}>
                <GitBranch size={13} /> Gestionar
              </button>
            </div>

            {mods.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                Sin modificaciones registradas
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {mods.map(m => {
                  const meta   = TYPE_META[m.modification_type] || { label: m.modification_type, color: '#94A3B8' }
                  const isOpen = !!expanded[m.modification_id]
                  return (
                    <div key={m.modification_id} style={{
                      border: '1px solid var(--border-color)',
                      borderLeft: `4px solid ${m.is_active ? meta.color : '#94A3B8'}`,
                      borderRadius: 10,
                      background: 'var(--bg-hover)',
                      opacity: m.is_active ? 1 : 0.6,
                    }}>
                      {/* Cabecera */}
                      <button
                        onClick={() => toggleExpand(m.modification_id)}
                        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '12px 14px', textAlign: 'left', fontFamily: 'inherit', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                              Modificación #{m.modification_number}
                            </span>
                            <TypeBadge type={m.modification_type} />
                            {!m.is_active && <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700 }}>INACTIVA</span>}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 16px', fontSize: 12 }}>
                            {m.approval_date && <span style={{ color: 'var(--text-muted)' }}>📅 {fmtDate(m.approval_date)}</span>}
                            {m.administrative_act && <span style={{ color: 'var(--text-muted)' }}>📄 {m.administrative_act}</span>}
                            {m.addition_value && <span style={{ color: '#10B981', fontWeight: 700, fontFamily: 'monospace' }}>+ {fmtMoney(m.addition_value)}</span>}
                            {m.new_end_date && <span style={{ color: '#0EA5E9', fontWeight: 600 }}>🕐 {fmtDate(m.new_end_date)}{m.extension_period_text ? ` (${m.extension_period_text})` : ''}</span>}
                            {m.suspension && <span style={{ color: '#EF4444' }}>⏸ {fmtDate(m.suspension.suspension_start_date)} → {fmtDate(m.suspension.suspension_end_date)}</span>}
                          </div>
                          {m.justification && !isOpen && (
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 500 }}>
                              {m.justification}
                            </p>
                          )}
                        </div>
                        <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </span>
                      </button>

                      {/* Detalle expandido */}
                      {isOpen && (
                        <div style={{ padding: '0 14px 12px', borderTop: '1px solid var(--border-color)' }}>
                          <ModDetail m={m} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          {/* ── FIN MODIFICACIONES ─── */}

        </div>
      </div>
    </div>
  )
}
