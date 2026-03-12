// frontend/src/pages/projects/ProjectViewPage.jsx — v4.2
// + Trazabilidad completa de plazos con línea de tiempo de prórrogas
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
function diffDays(a, b) {
  if (!a || !b) return null
  const diff = Math.round((new Date(b) - new Date(a)) / 86400000)
  return diff > 0 ? diff : null
}

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

/* ─── Trazabilidad de plazos ─────────────────────────────────────── */
function PlazosTrazabilidad({ p, mods }) {
  const COLOR_ORIG  = '#F59E0B'
  const COLOR_PROX  = '#0EA5E9'
  const COLOR_FINAL = '#10B981'

  // Prórrogas activas ordenadas
  const prorrogas = (mods || [])
    .filter(m => ['EXTENSION', 'BOTH'].includes(m.modification_type) && m.is_active && m.new_end_date)
    .sort((a, b) => a.modification_number - b.modification_number)

  const hasProrrogas = prorrogas.length > 0
  const fechaFinVigente = hasProrrogas ? prorrogas[prorrogas.length - 1].new_end_date : p.end_date
  const diasOriginales  = diffDays(p.start_date, p.end_date)
  const diasVigentes    = diffDays(p.start_date, fechaFinVigente)
  const diasProrrogados = prorrogas.reduce((acc, m) => acc + (m.extension_days || 0), 0)

  return (
    <Section icon={Calendar} color={COLOR_ORIG} title="Plazos del Contrato">

      {/* Fechas base */}
      <Grid cols={3}>
        <Field label="Fecha de suscripción"  value={fmtDate(p.subscription_date)} />
        <Field label="Fecha de inicio"       value={fmtDate(p.start_date)} />
        <Field label="Fecha de fin original" value={fmtDate(p.end_date)} />
      </Grid>

      {/* Duración original */}
      {diasOriginales && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[
            [`${diasOriginales} días`,                     'Duración original',  COLOR_ORIG],
            [`≈ ${Math.round(diasOriginales / 30)} meses`, 'Aproximados',        '#8B5CF6'],
            [`${(diasOriginales / 365).toFixed(1)} años`,  'En años',            '#64748B'],
          ].map(([val, lbl, color]) => (
            <div key={lbl} style={{ flex: 1, textAlign: 'center', padding: '12px 8px', borderRadius: 10, background: `${color}08`, border: `1px solid ${color}22` }}>
              <p style={{ fontSize: 18, fontWeight: 800, color, fontFamily: 'monospace', margin: 0 }}>{val}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{lbl}</p>
            </div>
          ))}
        </div>
      )}

      {/* Línea de tiempo de prórrogas */}
      {hasProrrogas && (
        <>
          <div style={{ height: 1, background: 'var(--border-color)', margin: '0 0 18px' }} />
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 16 }}>
            Trazabilidad de prórrogas
          </p>

          <div style={{ position: 'relative', paddingLeft: 30 }}>

            {/* Nodo inicial: contrato original */}
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16, position: 'relative' }}>
              <div style={{ position: 'absolute', left: -30, top: 5, width: 14, height: 14, borderRadius: '50%', background: COLOR_ORIG, border: '2px solid var(--bg-primary)', boxShadow: `0 0 0 3px ${COLOR_ORIG}33`, zIndex: 1 }} />
              <div style={{ position: 'absolute', left: -24, top: 19, width: 2, height: 'calc(100% + 4px)', background: `linear-gradient(${COLOR_ORIG}80, ${COLOR_PROX}80)` }} />
              <div style={{ background: `${COLOR_ORIG}10`, border: `1px solid ${COLOR_ORIG}30`, borderRadius: 8, padding: '10px 14px', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: COLOR_ORIG }}>📋 Contrato original</span>
                  <span style={{ fontSize: 12, fontFamily: 'monospace', color: COLOR_ORIG, fontWeight: 700 }}>
                    Fin: {fmtDate(p.end_date)}
                  </span>
                </div>
                {diasOriginales && (
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                    {diasOriginales} días · {Math.round(diasOriginales / 30)} meses aprox.
                  </p>
                )}
              </div>
            </div>

            {/* Nodos de prórrogas */}
            {prorrogas.map((m, idx) => {
              const isLast  = idx === prorrogas.length - 1
              const prevFin = idx === 0 ? p.end_date : prorrogas[idx - 1].new_end_date
              const color   = isLast ? COLOR_FINAL : COLOR_PROX

              return (
                <div key={m.modification_id} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: isLast ? 0 : 16, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: -30, top: 5, width: 14, height: 14, borderRadius: '50%', background: color, border: '2px solid var(--bg-primary)', boxShadow: `0 0 0 3px ${color}33`, zIndex: 1 }} />
                  {!isLast && (
                    <div style={{ position: 'absolute', left: -24, top: 19, width: 2, height: 'calc(100% + 4px)', background: `${COLOR_PROX}80` }} />
                  )}
                  <div style={{ background: `${color}10`, border: `1px solid ${color}30`, borderRadius: 8, padding: '10px 14px', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 700, color }}>
                          {isLast ? '✅' : '🔄'} Prórroga #{m.modification_number}
                          {m.modification_type === 'BOTH' && (
                            <span style={{ marginLeft: 6, fontSize: 10, background: '#F59E0B22', color: '#F59E0B', padding: '1px 6px', borderRadius: 10, fontWeight: 600 }}>+ Adición</span>
                          )}
                        </span>
                        {m.administrative_act && (
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                            Acto: <span style={{ fontFamily: 'monospace' }}>{m.administrative_act}</span>
                            {m.approval_date && ` · ${fmtDate(m.approval_date)}`}
                          </p>
                        )}
                        {m.extension_period_text && (
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0', fontStyle: 'italic' }}>
                            "{m.extension_period_text}"
                          </p>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                          Anterior: <span style={{ fontFamily: 'monospace' }}>{fmtDate(prevFin)}</span>
                        </p>
                        <p style={{ fontSize: 13, fontWeight: 800, color, fontFamily: 'monospace', margin: '2px 0 0' }}>
                          → {fmtDate(m.new_end_date)}
                        </p>
                        {m.extension_days && (
                          <p style={{ fontSize: 11, color, margin: '2px 0 0', fontWeight: 600 }}>+{m.extension_days} días</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Resumen final */}
          <div style={{ height: 1, background: 'var(--border-color)', margin: '20px 0 16px' }} />
          <div style={{ background: `${COLOR_FINAL}08`, border: `2px solid ${COLOR_FINAL}33`, borderRadius: 12, padding: '16px 20px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: COLOR_FINAL, textTransform: 'uppercase', letterSpacing: '.06em', margin: '0 0 12px' }}>
              Fecha de finalización vigente
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ fontSize: 24, fontWeight: 900, color: COLOR_FINAL, fontFamily: 'monospace', margin: 0 }}>
                  {fmtDate(fechaFinVigente)}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Incluye {prorrogas.length} prórroga{prorrogas.length !== 1 ? 's' : ''} ·{' '}
                  <strong style={{ color: COLOR_PROX }}>+{diasProrrogados} días adicionales</strong>
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ textAlign: 'center', padding: '10px 16px', borderRadius: 8, background: `${COLOR_FINAL}12`, border: `1px solid ${COLOR_FINAL}25` }}>
                  <p style={{ fontSize: 18, fontWeight: 800, color: COLOR_FINAL, fontFamily: 'monospace', margin: 0 }}>{diasVigentes} días</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '3px 0 0' }}>Duración total vigente</p>
                </div>
                <div style={{ textAlign: 'center', padding: '10px 16px', borderRadius: 8, background: `${COLOR_PROX}12`, border: `1px solid ${COLOR_PROX}25` }}>
                  <p style={{ fontSize: 18, fontWeight: 800, color: COLOR_PROX, fontFamily: 'monospace', margin: 0 }}>+{diasProrrogados} días</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '3px 0 0' }}>Total prorrogado</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Sin prórrogas */}
      {!hasProrrogas && (
        <div style={{ marginTop: 4, padding: '10px 14px', borderRadius: 8, background: 'rgba(100,116,139,0.06)', border: '1px solid rgba(100,116,139,0.15)', fontSize: 12, color: 'var(--text-muted)' }}>
          ℹ️ Este contrato no tiene prórrogas registradas. La fecha de fin original es la vigente.
        </div>
      )}

      {/* Tipo de supervisor */}
      {p.supervisor_type && (
        <>
          <div style={{ height: 1, background: 'var(--border-color)', margin: '18px 0 14px' }} />
          <Grid cols={2}>
            <Field label="Tipo de supervisor" value={p.supervisor_type === 'JEFE_EXTENSION' ? 'Jefe de Extensión' : 'Rector'} />
          </Grid>
        </>
      )}
    </Section>
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
      .catch(() => { toast.error('Error cargando el proyecto'); navigate('/projects') })
      .finally(() => setLoading(false))
  }, [id, navigate])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Cargando proyecto…</p>
    </div>
  )

  if (!project) return null
  const p = project

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-primary)' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 28px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => navigate('/projects')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', padding: '7px 0' }}>
            <ArrowLeft size={16} /> Proyectos
          </button>
          <span style={{ color: 'var(--border-color)' }}>·</span>
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {p.project_name}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
              {p.project_year} · #{p.internal_project_number}
              {p.status_name && (
                <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 10, background: `${p.status_color || '#94A3B8'}18`, color: p.status_color || '#94A3B8', fontWeight: 600, fontSize: 11 }}>
                  {p.status_name}
                </span>
              )}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate(`/projects/${id}/modifications`)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid var(--border-color)', color: '#F59E0B', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', padding: '7px 14px', borderRadius: 8, fontWeight: 600 }}>
            <GitBranch size={14} /> Modificaciones
          </button>
          <button onClick={() => navigate(`/projects/${id}/documents`)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid var(--border-color)', color: '#10B981', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', padding: '7px 14px', borderRadius: 8, fontWeight: 600 }}>
            <FolderOpen size={14} /> Documentos
          </button>
          <button onClick={() => navigate(`/projects/${id}/edit`)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid var(--border-color)', color: '#0EA5E9', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', padding: '7px 14px', borderRadius: 8, fontWeight: 600 }}>
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
              <Field label="ID del proyecto" value={`#${p.project_id}`} mono />
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

          {/* ── Plazos con trazabilidad completa ── */}
          <PlazosTrazabilidad p={p} mods={mods} />

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

          {/* ── MODIFICACIONES ── */}
          {mods.length > 0 && (
            <Section icon={GitBranch} color="#F59E0B" title={`Modificaciones (${mods.length})`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {mods.map(m => {
                  const meta = TYPE_META[m.modification_type] || { label: m.modification_type, color: '#94A3B8' }
                  const isOpen = !!expanded[m.modification_id]
                  return (
                    <div key={m.modification_id} style={{ border: '1px solid var(--border-color)', borderRadius: 10, overflow: 'hidden' }}>
                      <button
                        onClick={() => setExpanded(prev => ({ ...prev, [m.modification_id]: !isOpen }))}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-hover)', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                      >
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', fontFamily: 'monospace', minWidth: 28 }}>#{m.modification_number}</span>
                        <TypeBadge type={m.modification_type} />
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>
                          {m.administrative_act && <span style={{ fontFamily: 'monospace', marginRight: 8 }}>{m.administrative_act}</span>}
                          {m.approval_date && fmtDate(m.approval_date)}
                        </span>
                        {!m.is_active && (
                          <span style={{ fontSize: 10, color: '#94A3B8', background: '#94A3B820', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>INACTIVA</span>
                        )}
                        {isOpen ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
                      </button>
                      {isOpen && <ModDetail m={m} />}
                    </div>
                  )
                })}
              </div>
            </Section>
          )}

        </div>
      </div>
    </div>
  )
}