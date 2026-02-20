import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderOpen, Plus, RefreshCw, Search, Pencil, PowerOff, Power, ExternalLink,
         ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { projectsService } from '../services/projects'
import StatusBadge from '../components/ui/StatusBadge'

const PAGE_OPTS = [5, 10, 20, 'Todos']

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
  const rows    = showAll ? filtered : filtered.slice((cur-1)*pageSize, cur*pageSize)
  const goTo    = p => setPage(Math.max(1, Math.min(p, total)))

  const handleToggle = async p => {
    try {
      await projectsService.toggle(p.project_id)
      toast.success(p.is_active ? 'Proyecto deshabilitado' : 'Proyecto habilitado')
      load()
    } catch { toast.error('Error al cambiar estado') }
  }

  return (
    <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'rgba(15,41,82,.08)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <FolderOpen size={22} color="#0F2952"/>
          </div>
          <div>
            <h1 style={{ fontSize:20, fontWeight:800, color:'var(--text-primary)' }}>Proyectos</h1>
            <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
              {loading ? 'Cargando...' : `${filtered.length} de ${projects.length} proyectos`}
            </p>
          </div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={load} className="btn-secondary"><RefreshCw size={14}/>Actualizar</button>
          <button onClick={() => navigate('/projects/new')} className="btn-primary"><Plus size={14}/>Nuevo proyecto</button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ padding:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <div style={{ position:'relative', flex:1, minWidth:220 }}>
            <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
            <input className="input-field" style={{ paddingLeft:36 }}
              placeholder="Buscar por nombre, entidad, número..."
              value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--text-secondary)', cursor:'pointer', whiteSpace:'nowrap' }}>
            <input type="checkbox" checked={showInactive} onChange={e=>setShowInactive(e.target.checked)} style={{ accentColor:'#0EA5E9' }}/>
            Mostrar inactivos
          </label>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:12, color:'var(--text-muted)' }}>Mostrar</span>
            {PAGE_OPTS.map(o=>(
              <button key={o} onClick={()=>setPageSize(o)} style={{
                padding:'4px 9px', borderRadius:6, fontSize:12, fontWeight:600,
                border:'1px solid', fontFamily:'inherit', cursor:'pointer', transition:'all .15s',
                borderColor: pageSize===o?'#0EA5E9':'var(--border-color)',
                background:  pageSize===o?'rgba(14,165,233,.12)':'var(--bg-secondary)',
                color:       pageSize===o?'#0EA5E9':'var(--text-muted)',
              }}>{o}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card" style={{ overflow:'hidden' }}>
        {loading
          ? <div style={{ display:'flex', justifyContent:'center', padding:'60px 0', color:'var(--text-muted)', fontSize:13 }}>Cargando proyectos...</div>
          : rows.length === 0
            ? <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text-muted)', fontSize:13 }}>
                {search ? 'Sin resultados para la búsqueda' : 'No hay proyectos registrados — '}
                {!search && <button onClick={()=>navigate('/projects/new')} style={{ background:'none', border:'none', color:'#0EA5E9', cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>Crear el primero</button>}
              </div>
            : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr>
                      {['Año / #','Proyecto','Entidad','Dependencia','Valor','Fechas','Estado',''].map(h=>(
                        <th key={h} className="table-header">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((p, i) => (
                      <tr key={p.project_id} className="table-row" style={{ animationDelay:`${Math.min(i*20,200)}ms` }}>
                        <td className="table-cell" style={{ whiteSpace:'nowrap' }}>
                          <div style={{ fontFamily:'monospace', fontSize:11, color:'var(--text-muted)' }}>{p.project_year}</div>
                          <div style={{ fontFamily:'monospace', fontSize:14, fontWeight:800, color:'var(--text-primary)' }}>#{p.internal_project_number}</div>
                        </td>
                        <td className="table-cell" style={{ maxWidth:260 }}>
                          <p style={{ fontWeight:600, color:'var(--text-primary)', fontSize:13, lineHeight:1.35 }}>{p.project_name}</p>
                          {p.external_project_number && <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>Ext: {p.external_project_number}</p>}
                        </td>
                        <td className="table-cell">
                          <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{p.entity_name||'—'}</span>
                        </td>
                        <td className="table-cell">
                          <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{p.department_name||'—'}</span>
                        </td>
                        <td className="table-cell" style={{ whiteSpace:'nowrap' }}>
                          <span style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', fontFamily:'monospace' }}>
                            ${Number(p.project_value).toLocaleString('es-CO')}
                          </span>
                        </td>
                        <td className="table-cell" style={{ fontSize:11, color:'var(--text-muted)', whiteSpace:'nowrap' }}>
                          <div>Inicio: {p.start_date}</div>
                          <div>Fin: {p.end_date}</div>
                        </td>
                        <td className="table-cell">
                          {p.status_name
                            ? <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:20, background:`${p.status_color||'#94A3B8'}15`, color:p.status_color||'#94A3B8', border:`1px solid ${p.status_color||'#94A3B8'}33` }}>
                                <span style={{ width:6, height:6, borderRadius:'50%', background:p.status_color||'#94A3B8', flexShrink:0 }}/>
                                {p.status_name}
                              </span>
                            : <StatusBadge active={p.is_active}/>
                          }
                        </td>
                        <td className="table-cell">
                          <div style={{ display:'flex', gap:4, justifyContent:'flex-end' }}>
                            <TblBtn title="Editar" color="#0EA5E9" onClick={()=>navigate(`/projects/${p.project_id}/edit`)}>
                              <Pencil size={13}/>
                            </TblBtn>
                            {p.secop_link && (
                              <TblBtn title="Ver SECOP" color="#8B5CF6" onClick={()=>window.open(p.secop_link,'_blank')}>
                                <ExternalLink size={13}/>
                              </TblBtn>
                            )}
                            <TblBtn title={p.is_active?'Deshabilitar':'Habilitar'}
                              color={p.is_active?'#B91C3C':'#10B981'} onClick={()=>handleToggle(p)}>
                              {p.is_active?<PowerOff size={13}/>:<Power size={13}/>}
                            </TblBtn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        }

        {/* Paginación */}
        {!loading && filtered.length > 0 && (
          <div style={{ padding:'10px 16px', borderTop:'1px solid var(--border-color)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--bg-hover)' }}>
            <span style={{ fontSize:12, color:'var(--text-muted)' }}>
              {showAll
                ? <>Total: <strong style={{ color:'var(--text-secondary)' }}>{filtered.length}</strong></>
                : <>Mostrando <strong style={{ color:'var(--text-secondary)' }}>{(cur-1)*pageSize+1}</strong>–<strong style={{ color:'var(--text-secondary)' }}>{Math.min(cur*pageSize,filtered.length)}</strong> de <strong style={{ color:'var(--text-secondary)' }}>{filtered.length}</strong></>
              }
            </span>
            {!showAll && total > 1 && (
              <div style={{ display:'flex', gap:3 }}>
                <PgBtn onClick={()=>goTo(1)} disabled={cur===1}><ChevronsLeft size={13}/></PgBtn>
                <PgBtn onClick={()=>goTo(cur-1)} disabled={cur===1}><ChevronLeft size={13}/></PgBtn>
                {Array.from({length:Math.min(total,5)},(_,i)=>Math.max(1,cur-2)+i).filter(p=>p<=total).map(p=>(
                  <button key={p} onClick={()=>goTo(p)} style={{ width:30, height:30, borderRadius:6, fontSize:12, fontWeight:600, border:'1px solid', fontFamily:'inherit', cursor:'pointer',
                    borderColor:cur===p?'#0EA5E9':'var(--border-color)', background:cur===p?'#0EA5E9':'var(--bg-secondary)', color:cur===p?'white':'var(--text-secondary)' }}>{p}</button>
                ))}
                <PgBtn onClick={()=>goTo(cur+1)} disabled={cur===total}><ChevronRight size={13}/></PgBtn>
                <PgBtn onClick={()=>goTo(total)} disabled={cur===total}><ChevronsRight size={13}/></PgBtn>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TblBtn({ title, onClick, color, children }) {
  return (
    <button title={title} onClick={onClick} style={{ width:28, height:28, borderRadius:6, border:'1px solid', borderColor:`${color}33`, background:`${color}11`, color, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all .15s', fontFamily:'inherit' }}>
      {children}
    </button>
  )
}

function PgBtn({ onClick, disabled, children }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width:30, height:30, borderRadius:6, border:'1px solid var(--border-color)', background:'var(--bg-secondary)', color:disabled?'var(--text-muted)':'var(--text-secondary)', cursor:disabled?'not-allowed':'pointer', opacity:disabled?0.4:1, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'inherit' }}>
      {children}
    </button>
  )
}
