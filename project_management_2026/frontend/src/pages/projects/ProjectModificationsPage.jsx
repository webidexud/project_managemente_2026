// frontend/src/pages/projects/ProjectModificationsPage.jsx — v4.1
// + Detalle expandible por modificación (todos los campos)
// + Botón editar → abre ModificationFormModal en modo edición
// + Prórroga acumulativa: el modal recibe project.end_date (ya actualizado en BD)
import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Plus, GitBranch, PowerOff, Power, Pencil, ChevronDown, ChevronUp,
  DollarSign, Clock, FileText, Users, Shield
} from 'lucide-react'
import toast from 'react-hot-toast'
import { projectsService, modificationsService } from '../../services/projects'
import ModificationFormModal from './modifications/ModificationFormModal'

/* ── Meta por tipo ───────────────────────────────────────────────── */
const TYPE_META = {
  ADDITION:          { label: 'Adición',                 color: '#10B981' },
  EXTENSION:         { label: 'Prórroga',                color: '#0EA5E9' },
  BOTH:              { label: 'Adición + Prórroga',      color: '#8B5CF6' },
  CONTRACTUAL:       { label: 'Modif. Contractual',      color: '#F59E0B' },
  SUSPENSION:        { label: 'Suspensión',              color: '#EF4444' },
  RESTART:           { label: 'Reinicio',                color: '#06B6D4' },
  CESION_CESIONARIA: { label: 'Cesión (Cesionaria)',     color: '#8B5CF6' },
  CESION_CEDENTE:    { label: 'Cesión (Cedente)',        color: '#8B5CF6' },
  LIQUIDATION:       { label: 'Liquidación',             color: '#64748B' },
}

function fmtPesos(v) {
  const n = parseFloat(v)
  if (!v || isNaN(n)) return '—'
  return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })
}
function fmtDate(d) { return d ? String(d).split('T')[0] : '—' }

/* ── Badge de tipo ─────────────────────────────────────────────── */
function TypeBadge({ type }) {
  const m = TYPE_META[type] || { label: type, color: '#94A3B8' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      background: `${m.color}18`, color: m.color, fontSize: 11, fontWeight: 700,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
      {m.label}
    </span>
  )
}

/* ── Campo de detalle ──────────────────────────────────────────── */
function DField({ label, value, mono, color }) {
  if (!value && value !== 0 && value !== false) return null
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
  const valid = Array.isArray(children) ? children.filter(Boolean) : (children ? [children] : [])
  if (valid.length === 0) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '10px 20px', marginBottom: 14 }}>
      {children}
    </div>
  )
}

function DSection({ title, color, icon: Icon, children }) {
  const valid = Array.isArray(children) ? children.filter(Boolean) : (children ? [children] : [])
  if (valid.length === 0) return null
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        {Icon && <Icon size={12} color={color} />}
        <span style={{ fontSize: 10, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '.07em' }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: `${color}30`, marginLeft: 4 }} />
      </div>
      {children}
    </div>
  )
}

/* ── Panel de detalle expandido ────────────────────────────────── */
function ModDetail({ m }) {
  return (
    <div style={{
      marginTop: 12, padding: '14px 16px', borderRadius: 10,
      background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
    }}>
      {/* Datos generales */}
      <DSection title="Datos Generales" color="#F59E0B" icon={FileText}>
        <DGrid cols={3}>
          <DField label="Acto administrativo" value={m.administrative_act} />
          <DField label="Fecha de aprobación" value={fmtDate(m.approval_date)} />
          <DField label="Estado" value={m.is_active ? 'Activa' : 'Inactiva'} />
        </DGrid>
        {m.justification && <DField label="Justificación" value={m.justification} />}
      </DSection>

      {/* Adición */}
      {(m.addition_value || m.new_total_value) && (
        <DSection title="Adición Presupuestal" color="#10B981" icon={DollarSign}>
          <DGrid cols={2}>
            <DField label="Valor de la adición" value={fmtPesos(m.addition_value)} color="#10B981" mono />
            <DField label="Nuevo valor total" value={fmtPesos(m.new_total_value)} color="#10B981" mono />
          </DGrid>
          {m.payment_method_modification && <DField label="Modificación forma de pago" value={m.payment_method_modification} />}
          {m.requires_policy_update && <DField label="Actualización de póliza" value={m.policy_update_description || 'Sí'} />}
        </DSection>
      )}

      {/* Prórroga */}
      {m.new_end_date && (
        <DSection title="Prórroga de Plazo" color="#0EA5E9" icon={Clock}>
          <DGrid cols={3}>
            <DField label="Nueva fecha de fin" value={fmtDate(m.new_end_date)} color="#0EA5E9" />
            <DField label="Días prorrogados" value={m.extension_days ? `${m.extension_days} días` : null} />
            <DField label="Período en letras" value={m.extension_period_text} />
          </DGrid>
        </DSection>
      )}

      {/* Suspensión */}
      {m.suspension && (
        <DSection title="Suspensión del Contrato" color="#EF4444" icon={Clock}>
          <DGrid cols={3}>
            <DField label="Fecha inicio" value={fmtDate(m.suspension.suspension_start_date)} />
            <DField label="Fecha fin" value={fmtDate(m.suspension.suspension_end_date)} />
            <DField label="Reinicio programado" value={fmtDate(m.suspension.planned_restart_date)} />
          </DGrid>
          {m.suspension.actual_restart_date && <DField label="Fecha real de reinicio" value={fmtDate(m.suspension.actual_restart_date)} />}
          <DGrid cols={2}>
            <DField label="Justificación contratista" value={m.suspension.contractor_justification} />
            <DField label="Justificación supervisor" value={m.suspension.supervisor_justification} />
          </DGrid>
          <DField label="Estado suspensión" value={m.suspension.suspension_status} />
        </DSection>
      )}

      {/* Reinicio */}
      {m.restart && (
        <DSection title="Reinicio de Contrato" color="#06B6D4" icon={Clock}>
          <DGrid cols={2}>
            <DField label="Suspensión vinculada #" value={`Suspensión ID ${m.restart.suspension_id}`} />
            <DField label="Fecha real de reinicio" value={fmtDate(m.restart.actual_restart_date)} color="#06B6D4" />
          </DGrid>
          <DField label="Período suspendido" value={`${fmtDate(m.restart.suspension_start_date)} → ${fmtDate(m.restart.suspension_end_date)}`} />
        </DSection>
      )}

      {/* Modificación Contractual */}
      {m.clause && (
        <DSection title="Modificación Contractual" color="#F59E0B" icon={FileText}>
          <DField label="Descripción de la modificación" value={m.clause.modification_description} />
          {m.clause.requires_resource_liberation && (
            <DGrid cols={3}>
              <DField label="CDP a liberar" value={m.clause.cdp_to_release} mono />
              <DField label="RP a liberar" value={m.clause.rp_to_release} mono />
              <DField label="Valor a liberar" value={fmtPesos(m.clause.liberation_amount)} color="#EF4444" mono />
            </DGrid>
          )}
        </DSection>
      )}

      {/* Cesión */}
      {m.assignment && (
        <DSection title="Cesión del Contrato" color="#8B5CF6" icon={Users}>
          <DGrid cols={3}>
            <DField label="Cedente" value={m.assignment.assignor_name} />
            <DField label="ID Cedente" value={`${m.assignment.assignor_id_type} ${m.assignment.assignor_id}`} mono />
            <DField label="Cesionario" value={m.assignment.assignee_name} />
            <DField label="ID Cesionario" value={`${m.assignment.assignee_id_type} ${m.assignment.assignee_id}`} mono />
            <DField label="Fecha cesión" value={fmtDate(m.assignment.assignment_date)} />
            <DField label="Fecha firma" value={fmtDate(m.assignment.assignment_signature_date)} />
          </DGrid>
          <DGrid cols={3}>
            <DField label="Valor a ceder" value={fmtPesos(m.assignment.value_to_assign)} color="#8B5CF6" mono />
            <DField label="Valor pagado al cedente" value={fmtPesos(m.assignment.value_paid_to_assignor)} mono />
            <DField label="Valor pendiente cedente" value={fmtPesos(m.assignment.value_pending_to_assignor)} mono />
          </DGrid>
          {(m.assignment.cdp || m.assignment.rp) && (
            <DGrid cols={2}>
              <DField label="CDP" value={m.assignment.cdp} mono />
              <DField label="RP" value={m.assignment.rp} mono />
            </DGrid>
          )}
          {m.assignment.guarantee_modification_request && <DField label="Solicitud modificación garantías" value={m.assignment.guarantee_modification_request} />}
        </DSection>
      )}

      {/* Liquidación */}
      {m.liquidation && (
        <DSection title="Liquidación del Contrato" color="#64748B" icon={Shield}>
          <DGrid cols={3}>
            <DField label="Tipo liquidación" value={m.liquidation.liquidation_type === 'BILATERAL' ? 'Bilateral' : 'Unilateral'} />
            <DField label="% de ejecución" value={`${m.liquidation.execution_percentage}%`} />
            <DField label="Fecha de liquidación" value={fmtDate(m.liquidation.liquidation_date)} />
          </DGrid>
          <DGrid cols={2}>
            <DField label="Valor inicial contrato" value={fmtPesos(m.liquidation.initial_contract_value)} mono />
            <DField label="Valor final con adiciones" value={fmtPesos(m.liquidation.final_value_with_additions)} mono />
            <DField label="Valor ejecutado" value={fmtPesos(m.liquidation.executed_value)} color="#10B981" mono />
            <DField label="Valor pendiente de pago" value={fmtPesos(m.liquidation.pending_payment_value)} mono />
            <DField label="Valor a liberar" value={fmtPesos(m.liquidation.value_to_release)} color="#EF4444" mono />
          </DGrid>
          {(m.liquidation.cdp || m.liquidation.rp) && (
            <DGrid cols={4}>
              <DField label="CDP" value={m.liquidation.cdp} mono />
              <DField label="Valor CDP" value={fmtPesos(m.liquidation.cdp_value)} mono />
              <DField label="RP" value={m.liquidation.rp} mono />
              <DField label="Valor RP" value={fmtPesos(m.liquidation.rp_value)} mono />
            </DGrid>
          )}
          {m.liquidation.liquidation_type === 'UNILATERAL' && (
            <>
              <DGrid cols={2}>
                <DField label="N° resolución" value={m.liquidation.resolution_number} mono />
                <DField label="Fecha resolución" value={fmtDate(m.liquidation.resolution_date)} />
              </DGrid>
              <DField label="Causa unilateral" value={m.liquidation.unilateral_cause} />
              <DField label="Análisis de causa" value={m.liquidation.cause_analysis} />
            </>
          )}
          <DField label="Solicitud liquidación (supervisor)" value={m.liquidation.supervisor_liquidation_request} />
          <DField label="Fecha firma liquidación" value={fmtDate(m.liquidation.liquidation_signature_date)} />
        </DSection>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
═══════════════════════════════════════════════════════════════════ */
export default function ProjectModificationsPage() {
  const navigate = useNavigate()
  const { id }   = useParams()

  const [project,     setProject]     = useState(null)
  const [mods,        setMods]        = useState([])
  const [suspensions, setSuspensions] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [modalOpen,   setModalOpen]   = useState(false)
  const [editMod,     setEditMod]     = useState(null)   // modificación a editar
  const [expanded,    setExpanded]    = useState({})     // { modId: bool }

  const loadProject = useCallback(async () => {
    try { const r = await projectsService.get(id); setProject(r.data) }
    catch { toast.error('Error cargando proyecto') }
  }, [id])

  const loadMods = useCallback(async () => {
    setLoading(true)
    try {
      const r = await modificationsService.list(id)
      setMods(Array.isArray(r.data) ? r.data : [])
    } catch {
      toast.error('Error al cargar modificaciones')
      setMods([])
    } finally { setLoading(false) }
  }, [id])

  const loadSuspensions = useCallback(async () => {
    try {
      const r = await modificationsService.listSuspensions(id)
      setSuspensions(Array.isArray(r.data) ? r.data : [])
    } catch { setSuspensions([]) }
  }, [id])

  useEffect(() => {
    loadProject()
    loadMods()
    loadSuspensions()
  }, [loadProject, loadMods, loadSuspensions])

  const handleToggle = async (m) => {
    try {
      await modificationsService.toggle(m.modification_id)
      toast.success(m.is_active ? 'Modificación deshabilitada' : 'Modificación habilitada')
      loadMods(); loadSuspensions()
    } catch { toast.error('Error al cambiar estado') }
  }

  const handleEdit = (m) => { setEditMod(m); setModalOpen(true) }
  const handleNew  = () => { setEditMod(null); setModalOpen(true) }

  const afterSave = () => {
    setModalOpen(false); setEditMod(null)
    loadProject()   // recarga end_date actualizada para próxima prórroga
    loadMods(); loadSuspensions()
  }

  const toggleExpand = (modId) =>
    setExpanded(prev => ({ ...prev, [modId]: !prev[modId] }))

  const prevMods = mods.filter(m => m.is_active)

  // Calcular totales para la cabecera
  const totalAdiciones = prevMods
    .filter(m => ['ADDITION','BOTH'].includes(m.modification_type))
    .reduce((s, m) => s + (parseFloat(m.addition_value) || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* ── Topbar ── */}
      <div style={{
        background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)',
        padding: '10px 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(`/projects/${id}/view`)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid var(--border-color)', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, fontFamily: 'inherit', padding: '7px 12px', borderRadius: 8 }}>
            <ArrowLeft size={15} /> Volver
          </button>
          <div style={{ width: 1, height: 24, background: 'var(--border-color)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(245,158,11,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GitBranch size={18} color="#F59E0B" />
            </div>
            <div>
              <h1 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Modificaciones · {project ? `${project.project_year} #${project.internal_project_number}` : '…'}
              </h1>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                {project?.project_name?.substring(0, 70)}
                {!loading && mods.length > 0 && (
                  <span style={{ marginLeft: 8, fontWeight: 700, color: '#F59E0B' }}>
                    · {mods.length} modificación{mods.length !== 1 ? 'es' : ''}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
        <button onClick={handleNew} className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13 }}>
          <Plus size={15} /> Nueva Modificación
        </button>
      </div>

      {/* ── Resumen si hay mods ── */}
      {!loading && mods.length > 0 && project && (
        <div style={{
          background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)',
          padding: '10px 24px', display: 'flex', gap: 24,
        }}>
          {totalAdiciones > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarSign size={14} color="#10B981" />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Total adiciones: <strong style={{ color: '#10B981', fontFamily: 'monospace' }}>{fmtPesos(totalAdiciones)}</strong>
              </span>
            </div>
          )}
          {project.end_date && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={14} color="#0EA5E9" />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Fecha fin actual: <strong style={{ color: '#0EA5E9' }}>{fmtDate(project.end_date)}</strong>
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Lista ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: 'var(--bg-primary)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontSize: 14 }}>
            Cargando modificaciones…
          </div>
        ) : mods.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: 'var(--bg-card)', borderRadius: 16, border: '1px dashed var(--border-color)' }}>
            <GitBranch size={40} color="var(--text-muted)" style={{ marginBottom: 14, opacity: .4 }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-muted)' }}>Sin modificaciones registradas</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>Haz clic en "Nueva Modificación" para comenzar</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 900, margin: '0 auto' }}>
            {mods.map(m => {
              const meta    = TYPE_META[m.modification_type] || { label: m.modification_type, color: '#94A3B8' }
              const isOpen  = !!expanded[m.modification_id]

              return (
                <div key={m.modification_id} style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderLeft: `4px solid ${m.is_active ? meta.color : '#94A3B8'}`,
                  borderRadius: 12,
                  opacity: m.is_active ? 1 : 0.6,
                }}>
                  {/* Cabecera de la card */}
                  <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                          Modificación #{m.modification_number}
                        </span>
                        <TypeBadge type={m.modification_type} />
                        {!m.is_active && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', background: '#94A3B818', padding: '2px 8px', borderRadius: 20 }}>
                            INACTIVA
                          </span>
                        )}
                      </div>

                      {/* Resumen inline */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 20px', fontSize: 12 }}>
                        {m.approval_date && (
                          <span style={{ color: 'var(--text-muted)' }}>
                            📅 <strong>Aprobación:</strong> {fmtDate(m.approval_date)}
                          </span>
                        )}
                        {m.administrative_act && (
                          <span style={{ color: 'var(--text-muted)' }}>
                            📄 {m.administrative_act}
                          </span>
                        )}
                        {m.addition_value && (
                          <span style={{ color: '#10B981', fontWeight: 700, fontFamily: 'monospace' }}>
                            + {fmtPesos(m.addition_value)}
                          </span>
                        )}
                        {m.new_end_date && (
                          <span style={{ color: '#0EA5E9', fontWeight: 600 }}>
                            🕐 {fmtDate(m.new_end_date)}
                            {m.extension_period_text && <span style={{ fontWeight: 400 }}> ({m.extension_period_text})</span>}
                          </span>
                        )}
                        {m.suspension && (
                          <span style={{ color: '#EF4444' }}>
                            ⏸ {fmtDate(m.suspension.suspension_start_date)} → {fmtDate(m.suspension.suspension_end_date)}
                          </span>
                        )}
                      </div>

                      {m.justification && !isOpen && (
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5, fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {m.justification}
                        </p>
                      )}
                    </div>

                    {/* Acciones */}
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                      {/* Expandir/colapsar */}
                      <button onClick={() => toggleExpand(m.modification_id)}
                        title={isOpen ? 'Colapsar' : 'Ver detalle'}
                        style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid var(--border-color)', background: isOpen ? 'var(--bg-hover)' : 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontFamily: 'inherit' }}>
                        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      {/* Editar */}
                      <button onClick={() => handleEdit(m)}
                        title="Editar modificación"
                        style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid #0EA5E933', background: '#0EA5E911', color: '#0EA5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontFamily: 'inherit' }}>
                        <Pencil size={13} />
                      </button>

                      {/* Toggle */}
                      <button onClick={() => handleToggle(m)}
                        title={m.is_active ? 'Deshabilitar' : 'Habilitar'}
                        style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${m.is_active ? '#EF444433' : '#10B98133'}`, background: m.is_active ? '#EF444411' : '#10B98111', color: m.is_active ? '#EF4444' : '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontFamily: 'inherit' }}>
                        {m.is_active ? <PowerOff size={13} /> : <Power size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* Detalle expandido */}
                  {isOpen && (
                    <div style={{ borderTop: '1px solid var(--border-color)', padding: '0 16px 14px' }}>
                      <ModDetail m={m} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Modal nueva / editar modificación ── */}
      {modalOpen && project && (
        <ModificationFormModal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setEditMod(null) }}
          project={project}
          prevMods={prevMods}
          suspensions={suspensions}
          editData={editMod}
          onSaved={afterSave}
        />
      )}
    </div>
  )
}
