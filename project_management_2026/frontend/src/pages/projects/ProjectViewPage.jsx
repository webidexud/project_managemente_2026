import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Pencil, GitBranch,
  FileText, Settings, DollarSign, Calendar, Users, Tag, Link2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { projectsService, rupService, emailsService } from '../../services/projects'

/* ── Helpers de presentación ── */
function fmtMoney(v) {
  if (!v && v !== 0) return '—'
  return '$' + Number(v).toLocaleString('es-CO')
}
function fmtDate(d) { return d || '—' }

function SectionTitle({ icon: Icon, color = '#0EA5E9', title }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={17} color={color} />
        </div>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{title}</h2>
      </div>
      <div style={{ height: 1, background: 'var(--border-color)', marginTop: 12 }} />
    </div>
  )
}

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

function Section({ icon, color, title, children }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 16 }}>
      <SectionTitle icon={icon} color={color} title={title} />
      {children}
    </div>
  )
}

export default function ProjectViewPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [rupCodes, setRupCodes] = useState([])
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      projectsService.get(id),
      rupService.getProjectRup(id),
      emailsService.list(id),
    ])
      .then(([pr, rr, em]) => {
        setProject(pr.data)
        setRupCodes(rr.data)
        setEmails(em.data)
      })
      .catch(() => { toast.error('Error cargando proyecto'); navigate('/projects') })
      .finally(() => setLoading(false))
  }, [id, navigate])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Cargando proyecto...</p>
    </div>
  )

  const p = project

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
          <button onClick={() => navigate(`/projects/${id}/modifications`)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.3)', color: '#D97706', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', padding: '7px 14px', borderRadius: 8, fontWeight: 600 }}>
            <GitBranch size={14} /> Modificaciones
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
          <Section icon={DollarSign} color="#10B981" title="Información financiera">
            <Grid cols={2}>
              <Field label="Valor total del proyecto" value={fmtMoney(p.project_value)} mono />
              <Field label="Código contable" value={p.accounting_code} mono />
              <Field label="Aporte Universidad" value={fmtMoney(p.university_contribution)} mono />
              <Field label="Aporte Entidad" value={fmtMoney(p.entity_contribution)} mono />
              <Field label="% Beneficio institucional" value={p.institutional_benefit_percentage ? `${p.institutional_benefit_percentage}%` : null} />
              <Field label="Valor beneficio institucional" value={fmtMoney(p.institutional_benefit_value)} mono />
              <Field label="Beneficiarios" value={p.beneficiaries_count} />
            </Grid>
          </Section>

          {/* Fechas */}
          <Section icon={Calendar} color="#F59E0B" title="Fechas">
            <Grid cols={3}>
              <Field label="Fecha de suscripción" value={fmtDate(p.subscription_date)} />
              <Field label="Fecha de inicio" value={fmtDate(p.start_date)} />
              <Field label="Fecha de fin" value={fmtDate(p.end_date)} />
            </Grid>
          </Section>

          {/* Actores */}
          <Section icon={Users} color="#B91C3C" title="Actores del proyecto">
            <Grid cols={1}>
              <Field label="Entidad contratante" value={p.entity_name} />
              <Field label="Dependencia ejecutora" value={p.department_name} />
              <Field label="Funcionario ordenador del gasto" value={p.official_name} />
            </Grid>

            {/* Correo principal */}
            {p.main_email && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Correo principal</p>
                <span style={{ fontSize: 13, color: '#0EA5E9', fontFamily: 'monospace' }}>{p.main_email}</span>
              </div>
            )}

            {/* Correos secundarios */}
            {emails.length > 0 && (
              <div>
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

          {/* Códigos RUP */}
          {rupCodes.length > 0 && (
            <Section icon={Tag} color="#0EA5E9" title={`Códigos RUP / UNSPSC (${rupCodes.length})`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {rupCodes.map(r => (
                  <div key={r.rup_code_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 8 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#0EA5E9', minWidth: 80 }}>{r.rup_code}</span>
                    {r.is_main_code && <span style={{ fontSize: 10, background: 'rgba(14,165,233,.15)', color: '#0EA5E9', border: '1px solid rgba(14,165,233,.3)', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>PRINCIPAL</span>}
                    <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{r.product_name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{r.class_name} · {r.family_name}</span>
                  </div>
                ))}
              </div>
              {p.rup_codes_general_observations && (
                <div style={{ marginTop: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Observaciones RUP</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{p.rup_codes_general_observations}</p>
                </div>
              )}
            </Section>
          )}

          {/* Adicional */}
          <Section icon={Link2} color="#64748B" title="Información adicional">
            <Grid cols={2}>
              <Field label="Acto administrativo" value={p.administrative_act} />
              <Field label="Enlace SECOP" value={p.secop_link} />
            </Grid>
            {p.observations && (
              <Field label="Observaciones generales" value={p.observations} span={2} />
            )}
          </Section>

        </div>
      </div>
    </div>
  )
}
