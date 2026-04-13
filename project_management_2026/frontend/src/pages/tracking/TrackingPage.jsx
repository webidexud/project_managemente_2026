// frontend/src/pages/tracking/TrackingPage.jsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Plus, RefreshCw, Search, Eye, Pencil, Trash2,
         ChevronLeft, ChevronRight, X, Calendar, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { trackingService } from '../../services/tracking'

const YEARS = Array.from({ length: 10 }, (_, i) => 2026 - i)

function ProgressBar({ value, color }) {
  const pct = Math.min(100, Math.max(0, value || 0))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 99, background: 'var(--border-color)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width .3s' }}/>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 36 }}>{pct.toFixed(0)}%</span>
    </div>
  )
}

export default function TrackingPage() {
  const navigate = useNavigate()
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [year,    setYear]    = useState('')
  const [page,    setPage]    = useState(1)
  const PER_PAGE = 10

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (year) params.year = year
      const r = await trackingService.list(params)
      setItems(r.data)
    } catch { toast.error('Error al cargar seguimientos') }
    finally { setLoading(false) }
  }, [year])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [search, year])

  const filtered = items.filter(t => {
    if (!search) return true
    const q = search.toLowerCase()
    return [t.project_name, t.entity_name, t.external_number,
            t.current_status, String(t.project_year)].some(v => v?.toLowerCase().includes(q))
  })

  const total = Math.ceil(filtered.length / PER_PAGE)
  const rows  = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE)

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este seguimiento?')) return
    try {
      await trackingService.remove(id)
      toast.success('Seguimiento eliminado')
      load()
    } catch { toast.error('Error al eliminar') }
  }

  const fmtMoney = v => v ? `$${parseFloat(v).toLocaleString('es-CO')}` : '—'
  const fmtDate  = d => d ? new Date(d+'T00:00:00').toLocaleDateString('es-CO') : '—'

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', gap:16 }}>

      {/* Cabecera */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Activity size={22} color="#0EA5E9"/>
            <h1 style={{ fontSize:20, fontWeight:800, color:'var(--text-primary)', margin:0 }}>Seguimiento y Control</h1>
          </div>
          <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:3 }}>
            Gestión de informes de ejecución física y financiera de proyectos
          </p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={load} title="Recargar"
            style={{ width:36, height:36, borderRadius:8, border:'1px solid var(--border-color)', background:'var(--bg-secondary)', color:'var(--text-muted)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <RefreshCw size={15}/>
          </button>
          <button onClick={() => navigate('/tracking/new')} className="btn-primary">
            <Plus size={15}/> Nuevo Seguimiento
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
        <div style={{ position:'relative', flex:1 }}>
          <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Buscar por proyecto, entidad, número externo..."
            style={{ width:'100%', paddingLeft:32, paddingRight:search?32:12, padding:'8px 12px 8px 32px', border:'1px solid var(--border-color)', borderRadius:8, background:'var(--bg-input)', color:'var(--text-primary)', fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}/>
          {search && (
            <button onClick={()=>setSearch('')} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', padding:2 }}>
              <X size={13}/>
            </button>
          )}
        </div>
        <select value={year} onChange={e=>setYear(e.target.value)}
          style={{ padding:'8px 10px', borderRadius:8, border:'1px solid var(--border-color)', background:'var(--bg-input)', color:'var(--text-primary)', fontSize:12, fontFamily:'inherit', cursor:'pointer' }}>
          <option value="">Todos los años</option>
          {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="card" style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', padding:0 }}>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'60px 0', color:'var(--text-muted)', fontSize:13 }}>Cargando seguimientos...</div>
        ) : rows.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text-muted)', fontSize:13 }}>
            {search || year
              ? <>Sin resultados · <button onClick={()=>{setSearch('');setYear('')}} style={{ background:'none', border:'none', color:'#0EA5E9', cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>Limpiar</button></>
              : <>No hay seguimientos registrados · <button onClick={()=>navigate('/tracking/new')} style={{ background:'none', border:'none', color:'#0EA5E9', cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>Crear el primero</button></>
            }
          </div>
        ) : (
          <>
            <div style={{ overflowX:'auto', flex:1 }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    {['#','Proyecto','Entidad','Corte','Estado','Físico','Financiero','Valor Total',''].map(h=>(
                      <th key={h} className="table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t, i) => (
                    <tr key={t.tracking_id} className="table-row" style={{ animationDelay:`${Math.min(i*20,200)}ms` }}>
                      <td className="table-cell" style={{ whiteSpace:'nowrap' }}>
                        <div style={{ fontFamily:'monospace', fontSize:11, color:'var(--text-muted)' }}>{t.project_year}</div>
                        <div style={{ fontFamily:'monospace', fontSize:13, fontWeight:800, color:'var(--text-primary)' }}>#{t.tracking_number}</div>
                        {t.external_number && <div style={{ fontSize:10, color:'var(--text-muted)' }}>{t.external_number}</div>}
                      </td>
                      <td className="table-cell" style={{ maxWidth:220 }}>
                        <p style={{ fontWeight:600, color:'var(--text-primary)', fontSize:12, lineHeight:1.3, margin:0 }}>{t.project_name}</p>
                      </td>
                      <td className="table-cell">
                        <span style={{ fontSize:11, color:'var(--text-secondary)' }}>{t.entity_name}</span>
                      </td>
                      <td className="table-cell" style={{ whiteSpace:'nowrap' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--text-muted)' }}>
                          <Calendar size={11}/> {fmtDate(t.cut_date)}
                        </div>
                      </td>
                      <td className="table-cell">
                        {t.current_status
                          ? <span style={{ padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:700, background:'rgba(14,165,233,0.1)', color:'#0EA5E9', border:'1px solid rgba(14,165,233,0.2)', whiteSpace:'nowrap' }}>{t.current_status}</span>
                          : <span style={{ color:'var(--text-muted)', fontSize:11 }}>—</span>
                        }
                      </td>
                      <td className="table-cell" style={{ minWidth:120 }}>
                        <ProgressBar value={t.physical_progress_pct} color="#10B981"/>
                      </td>
                      <td className="table-cell" style={{ minWidth:120 }}>
                        <ProgressBar value={t.financial_progress_pct} color="#0EA5E9"/>
                      </td>
                      <td className="table-cell" style={{ whiteSpace:'nowrap', fontFamily:'monospace', fontSize:12, fontWeight:700, color:'var(--text-primary)' }}>
                        {fmtMoney(t.total_value)}
                      </td>
                      <td className="table-cell">
                        <div style={{ display:'flex', gap:4 }}>
                          <button title="Ver detalle" onClick={()=>navigate(`/tracking/${t.tracking_id}/view`)}
                            style={{ width:28, height:28, borderRadius:6, border:'1px solid rgba(14,165,233,0.3)', background:'rgba(14,165,233,0.1)', color:'#0EA5E9', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                            <Eye size={13}/>
                          </button>
                          <button title="Editar" onClick={()=>navigate(`/tracking/${t.tracking_id}/edit`)}
                            style={{ width:28, height:28, borderRadius:6, border:'1px solid rgba(139,92,246,0.3)', background:'rgba(139,92,246,0.1)', color:'#8B5CF6', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                            <Pencil size={13}/>
                          </button>
                          <button title="Eliminar" onClick={()=>handleDelete(t.tracking_id)}
                            style={{ width:28, height:28, borderRadius:6, border:'1px solid rgba(185,28,60,0.3)', background:'rgba(185,28,60,0.1)', color:'#B91C3C', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {total > 1 && (
              <div style={{ padding:'10px 16px', borderTop:'1px solid var(--border-color)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--bg-hover)', flexShrink:0 }}>
                <span style={{ fontSize:12, color:'var(--text-muted)' }}>
                  Mostrando <strong>{(page-1)*PER_PAGE+1}</strong>–<strong>{Math.min(page*PER_PAGE,filtered.length)}</strong> de <strong>{filtered.length}</strong>
                </span>
                <div style={{ display:'flex', gap:4 }}>
                  <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                    style={{ width:30, height:30, borderRadius:6, border:'1px solid var(--border-color)', background:'var(--bg-secondary)', color:page===1?'var(--text-muted)':'var(--text-secondary)', cursor:page===1?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', opacity:page===1?0.4:1 }}>
                    <ChevronLeft size={13}/>
                  </button>
                  {Array.from({length:total},(_,i)=>i+1).map(n=>(
                    <button key={n} onClick={()=>setPage(n)}
                      style={{ width:30, height:30, borderRadius:6, fontSize:12, fontWeight:600, border:'1px solid', fontFamily:'inherit', cursor:'pointer', borderColor:page===n?'#0EA5E9':'var(--border-color)', background:page===n?'#0EA5E9':'var(--bg-secondary)', color:page===n?'white':'var(--text-secondary)' }}>
                      {n}
                    </button>
                  ))}
                  <button onClick={()=>setPage(p=>Math.min(total,p+1))} disabled={page===total}
                    style={{ width:30, height:30, borderRadius:6, border:'1px solid var(--border-color)', background:'var(--bg-secondary)', color:page===total?'var(--text-muted)':'var(--text-secondary)', cursor:page===total?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', opacity:page===total?0.4:1 }}>
                    <ChevronRight size={13}/>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
