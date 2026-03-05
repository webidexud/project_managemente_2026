// frontend/src/pages/ProjectsPage.jsx — v4.2
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderOpen, Plus, RefreshCw, Search, Pencil, PowerOff, Power,
         Eye, GitBranch,
         ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { projectsService } from '../services/projects'
import StatusBadge from '../components/ui/StatusBadge'

const PAGE_OPTS = [5, 10, 20, 'Todos']

function TblBtn({ title, color, onClick, children }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 28, height: 28, borderRadius: 6, border: '1px solid',
        borderColor: `${color}33`, background: `${color}11`, color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background  = `${color}22`
        e.currentTarget.style.borderColor = `${color}66`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background  = `${color}11`
        e.currentTarget.style.borderColor = `${color}33`
      }}
    >
      {children}
    </button>
  )
}

export default function ProjectsPage() {
  const navigate = useNavigate()
  const [projects,     setProjects]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [pageSize,     setPageSize]     = useState(10)
  const [page,         setPage]         = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try { const r = await projectsService.list(); setProjects(r.data) }
    catch { toast.error('Error al cargar proyectos') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [search, showInactive, pageSize])

  const filtered = projects.filter(p => {
    const q = search.toLowerCase()
    const match = !q
      || p.project_name?.toLowerCase().includes(q)
      || p.entity_name?.toLowerCase().includes(q)
      || String(p.internal_project_number).includes(q)
      || String(p.project_year).includes(q)
    return match && (showInactive || p.is_active)
  })

  const showAll = pageSize === 'Todos'
  const total   = Math.max(1, showAll ? 1 : Math.ceil(filtered.length / pageSize))
  const cur     = Math.min(page, total)
  const rows    = showAll ? filtered : filtered.slice((cur - 1) * pageSize, cur * pageSize)
  const goTo    = p => setPage(Math.max(1, Math.min(p, total)))

  const handleToggle = async p => {
    try {
      await projectsService.toggle(p.project_id)
      toast.success(p.is_active ? 'Proyecto deshabilitado' : 'Proyecto habilitado')
      load()
    } catch { toast.error('Error al cambiar estado') }
  }

  const pages = () => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    if (cur <= 4)   return [1,2,3,4,5,'...',total]
    if (cur >= total - 3) return [1,'...',total-4,total-3,total-2,total-1,total]
    return [1,'...',cur-1,cur,cur+1,'...',total]
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>

      {/* ── Cabecera ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Proyectos</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
            Gestión de proyectos de extensión universitaria
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} title="Recargar"
            style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontFamily: 'inherit' }}>
            <RefreshCw size={15} />
          </button>
          <button onClick={() => navigate('/projects/new')} className="btn-primary">
            <Plus size={15} /> Nuevo Proyecto
          </button>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
        {/* Búsqueda */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, entidad, número..."
            style={{ width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
        </div>

        {/* Toggle inactivos */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} style={{ accentColor: '#B91C3C' }} />
          Mostrar inactivos
        </label>

        {/* Tamaño de página */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Por página:</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {PAGE_OPTS.map(o => (
              <button key={o} onClick={() => setPageSize(o)}
                style={{
                  padding: '5px 10px', borderRadius: 6, border: '1px solid',
                  borderColor: pageSize === o ? '#0EA5E9' : 'var(--border-color)',
                  background: pageSize === o ? 'rgba(14,165,233,.1)' : 'var(--bg-secondary)',
                  color: pageSize === o ? '#0EA5E9' : 'var(--text-muted)',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}>{o}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className="card" style={{ overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: 13 }}>
            Cargando proyectos...
          </div>
        ) : rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: 13 }}>
            {search ? 'Sin resultados para la búsqueda' : 'No hay proyectos registrados — '}
            {!search && (
              <button onClick={() => navigate('/projects/new')}
                style={{ background: 'none', border: 'none', color: '#0EA5E9', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                Crear el primero
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Año / #', 'Proyecto', 'Entidad', 'Dependencia', 'Valor', 'Fechas', 'Estado', ''].map(h => (
                      <th key={h} className="table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p, i) => (
                    <tr key={p.project_id} className="table-row" style={{ animationDelay: `${Math.min(i * 20, 200)}ms` }}>

                      {/* Año / # */}
                      <td className="table-cell" style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{p.project_year}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>#{p.internal_project_number}</div>
                      </td>

                      {/* Proyecto */}
                      <td className="table-cell" style={{ maxWidth: 260 }}>
                        <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.35, margin: 0 }}>
                          {p.project_name}
                        </p>
                        {p.external_project_number && (
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Ext: {p.external_project_number}</p>
                        )}
                      </td>

                      {/* Entidad */}
                      <td className="table-cell">
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.entity_name || '—'}</span>
                      </td>

                      {/* Dependencia */}
                      <td className="table-cell">
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.department_name || '—'}</span>
                      </td>

                      {/* Valor */}
                      <td className="table-cell" style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                          ${Number(p.project_value).toLocaleString('es-CO')}
                        </span>
                      </td>

                      {/* Fechas */}
                      <td className="table-cell" style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        <div>Inicio: {p.start_date}</div>
                        <div>Fin: <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{p.end_date}</span></div>
                      </td>

                      {/* Estado */}
                      <td className="table-cell">
                        {p.status_name
                          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: `${p.status_color || '#94A3B8'}15`, color: p.status_color || '#94A3B8', border: `1px solid ${p.status_color || '#94A3B8'}33` }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.status_color || '#94A3B8', flexShrink: 0 }} />
                              {p.status_name}
                            </span>
                          : <StatusBadge active={p.is_active} />
                        }
                      </td>

                      {/* ── 5 botones de acción ── */}
                      <td className="table-cell">
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>

                          {/* 1. Ver proyecto */}
                          <TblBtn title="Ver proyecto" color="#8B5CF6"
                            onClick={() => navigate(`/projects/${p.project_id}/view`)}>
                            <Eye size={13} />
                          </TblBtn>

                          {/* 2. Editar proyecto */}
                          <TblBtn title="Editar proyecto" color="#0EA5E9"
                            onClick={() => navigate(`/projects/${p.project_id}/edit`)}>
                            <Pencil size={13} />
                          </TblBtn>

                          {/* 3. Modificaciones */}
                          <TblBtn title="Modificaciones del proyecto" color="#F59E0B"
                            onClick={() => navigate(`/projects/${p.project_id}/modifications`)}>
                            <GitBranch size={13} />
                          </TblBtn>

                          {/* 4. Documentos */}
                          <TblBtn title="Documentos del proyecto" color="#6366F1"
                            onClick={() => navigate(`/projects/${p.project_id}/documents`)}>
                            <FolderOpen size={13} />
                          </TblBtn>

                          {/* 5. Deshabilitar / Habilitar */}
                          <TblBtn
                            title={p.is_active ? 'Deshabilitar proyecto' : 'Habilitar proyecto'}
                            color={p.is_active ? '#B91C3C' : '#10B981'}
                            onClick={() => handleToggle(p)}>
                            {p.is_active ? <PowerOff size={13} /> : <Power size={13} />}
                          </TblBtn>

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {!loading && filtered.length > 0 && (
              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-hover)', flexShrink: 0 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {showAll
                    ? <>Total: <strong style={{ color: 'var(--text-secondary)' }}>{filtered.length}</strong> proyectos</>
                    : <>Mostrando <strong style={{ color: 'var(--text-secondary)' }}>{(cur-1)*pageSize+1}</strong>–<strong style={{ color: 'var(--text-secondary)' }}>{Math.min(cur*pageSize, filtered.length)}</strong> de <strong style={{ color: 'var(--text-secondary)' }}>{filtered.length}</strong></>
                  }
                </span>
                {!showAll && total > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    {[
                      [<ChevronsLeft size={13}/>, () => goTo(1),     cur === 1],
                      [<ChevronLeft  size={13}/>, () => goTo(cur-1), cur === 1],
                    ].map(([icon, fn, dis], i) => (
                      <button key={i} onClick={fn} disabled={dis}
                        style={{ width:30, height:30, borderRadius:6, border:'1px solid var(--border-color)', background:'var(--bg-secondary)', color: dis?'var(--text-muted)':'var(--text-secondary)', cursor: dis?'not-allowed':'pointer', opacity: dis?0.4:1, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'inherit' }}>
                        {icon}
                      </button>
                    ))}
                    {pages().map((pg, i) =>
                      pg === '...'
                        ? <span key={`e${i}`} style={{ padding:'0 4px', color:'var(--text-muted)', fontSize:13 }}>…</span>
                        : <button key={pg} onClick={() => goTo(pg)}
                            style={{ width:30, height:30, borderRadius:6, fontSize:12, fontWeight:600, border:'1px solid', fontFamily:'inherit', cursor:'pointer', transition:'all .15s', borderColor: cur===pg?'#0EA5E9':'var(--border-color)', background: cur===pg?'#0EA5E9':'var(--bg-secondary)', color: cur===pg?'white':'var(--text-secondary)' }}>
                            {pg}
                          </button>
                    )}
                    {[
                      [<ChevronRight  size={13}/>, () => goTo(cur+1), cur === total],
                      [<ChevronsRight size={13}/>, () => goTo(total),  cur === total],
                    ].map(([icon, fn, dis], i) => (
                      <button key={i+10} onClick={fn} disabled={dis}
                        style={{ width:30, height:30, borderRadius:6, border:'1px solid var(--border-color)', background:'var(--bg-secondary)', color: dis?'var(--text-muted)':'var(--text-secondary)', cursor: dis?'not-allowed':'pointer', opacity: dis?0.4:1, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'inherit' }}>
                        {icon}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}