// frontend/src/pages/projects/ProjectDocumentsPage.jsx — v1.0
// Drag & drop de PDFs, auto-categorización por nomenclatura, gestión completa
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, FileText, Upload, X, Download, Trash2,
  CheckCircle2, AlertCircle, Loader, FolderOpen, Eye
} from 'lucide-react'
import toast from 'react-hot-toast'
import { projectsService, documentsService } from '../../services/projects'

/* ── Nomenclatura (misma lógica que el backend) ──────────────────── */
const NOMENCLATURE = [
  { code: 'AI',     name: 'Acta de Inicio',         color: '#10B981' },
  { code: 'AF',     name: 'Acta Final',              color: '#64748B' },
  { code: 'AS',     name: 'Acta de Suspensión',      color: '#EF4444' },
  { code: 'AR',     name: 'Acta de Reinicio',        color: '#06B6D4' },
  { code: 'AL',     name: 'Acta de Liquidación',     color: '#8B5CF6' },
  { code: 'PROP',   name: 'Propuesta Técnica',       color: '#F59E0B' },
  { code: 'CONT',   name: 'Contrato',                color: '#0F2952' },
  { code: 'OT',     name: 'Otro Sí',                 color: '#0EA5E9' },
  { code: 'CDP',    name: 'CDP',                     color: '#10B981' },
  { code: 'RP',     name: 'RP',                      color: '#10B981' },
  { code: 'INF',    name: 'Informe',                 color: '#8B5CF6' },
  { code: 'POL',    name: 'Póliza',                  color: '#F59E0B' },
  { code: 'CERT',   name: 'Certificado',             color: '#0EA5E9' },
  { code: 'RES',    name: 'Resolución',              color: '#EF4444' },
  { code: 'MEMO',   name: 'Memorando',               color: '#64748B' },
  { code: 'OFIC',   name: 'Oficio',                  color: '#64748B' },
  { code: 'PLAN',   name: 'Plan de Trabajo',         color: '#F59E0B' },
  { code: 'PRESUP', name: 'Presupuesto',             color: '#10B981' },
  { code: 'OTRO',   name: 'Otro',                    color: '#94A3B8' },
]

const ORDERED_CHECKS = [
  'PRESUP','PROP','CONT','MEMO','OFIC','PLAN','CERT','POL',
  'CDP','INF','RES','OT','RP','AL','AR','AS','AF','AI'
]

function detectType(filename) {
  const base = filename.toUpperCase().replace(/\.PDF$/i, '')
    .replace(/[-\s.]/g, '_')
  const parts = base.split('_').filter(Boolean)

  for (const code of ORDERED_CHECKS) {
    if (parts.includes(code) || base.startsWith(code + '_') || base === code) {
      return NOMENCLATURE.find(n => n.code === code) || NOMENCLATURE[NOMENCLATURE.length - 1]
    }
  }
  return NOMENCLATURE[NOMENCLATURE.length - 1] // OTRO
}

function fmtSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes/1024).toFixed(1)} KB`
  return `${(bytes/1048576).toFixed(2)} MB`
}

function TypeBadge({ code, name, color }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 9px', borderRadius: 20,
      background: `${color}18`, color, fontSize: 11, fontWeight: 700,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
      {code}
    </span>
  )
}

/* ── Fila de archivo en cola de subida ────────────────────────────── */
function QueueItem({ item, onRemove, onChangeType, docTypes }) {
  const meta = NOMENCLATURE.find(n => n.code === item.detectedType?.code) || NOMENCLATURE[NOMENCLATURE.length-1]
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', borderRadius: 10,
      border: `1px solid ${item.status === 'error' ? '#EF444440' : item.status === 'done' ? '#10B98140' : 'var(--border-color)'}`,
      background: item.status === 'error' ? '#EF444408' : item.status === 'done' ? '#10B98108' : 'var(--bg-hover)',
    }}>
      {/* Icono estado */}
      <div style={{ flexShrink: 0 }}>
        {item.status === 'pending'  && <FileText size={18} color="var(--text-muted)" />}
        {item.status === 'uploading'&& <Loader size={18} color="#0EA5E9" style={{ animation: 'spin 1s linear infinite' }} />}
        {item.status === 'done'     && <CheckCircle2 size={18} color="#10B981" />}
        {item.status === 'error'    && <AlertCircle size={18} color="#EF4444" />}
      </div>

      {/* Nombre */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.file.name}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
          {fmtSize(item.file.size)}
          {item.status === 'error' && <span style={{ color: '#EF4444', marginLeft: 8 }}>{item.error}</span>}
        </p>
      </div>

      {/* Tipo detectado / selector */}
      {item.status === 'pending' && (
        <select
          value={item.detectedType?.code || 'OTRO'}
          onChange={e => {
            const found = NOMENCLATURE.find(n => n.code === e.target.value)
            onChangeType(item.id, found)
          }}
          style={{
            padding: '5px 8px', borderRadius: 7, border: '1px solid var(--border-color)',
            background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 11,
            fontFamily: 'inherit', cursor: 'pointer', flexShrink: 0,
          }}
        >
          {NOMENCLATURE.map(n => (
            <option key={n.code} value={n.code}>{n.code} — {n.name}</option>
          ))}
        </select>
      )}

      {item.status === 'done' && (
        <TypeBadge code={meta.code} name={meta.name} color={meta.color} />
      )}

      {/* Quitar */}
      {item.status !== 'uploading' && item.status !== 'done' && (
        <button onClick={() => onRemove(item.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, flexShrink: 0 }}>
          <X size={15} />
        </button>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
═══════════════════════════════════════════════════════════════════ */
export default function ProjectDocumentsPage() {
  const navigate   = useNavigate()
  const { id }     = useParams()
  const dropRef    = useRef(null)
  const fileRef    = useRef(null)

  const [project,   setProject]   = useState(null)
  const [documents, setDocuments] = useState([])
  const [queue,     setQueue]     = useState([])    // archivos pendientes de subir
  const [dragging,  setDragging]  = useState(false)
  const [loading,   setLoading]   = useState(true)
  const [uploading, setUploading] = useState(false)
  const [filter,    setFilter]    = useState('')    // filtro por tipo

  const loadProject = useCallback(async () => {
    try { const r = await projectsService.get(id); setProject(r.data) }
    catch { toast.error('Error cargando proyecto'); navigate('/projects') }
  }, [id])

  const loadDocuments = useCallback(async () => {
    try {
      const r = await documentsService.list(id)
      setDocuments(Array.isArray(r.data) ? r.data : [])
    } catch { toast.error('Error cargando documentos') }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { loadProject(); loadDocuments() }, [loadProject, loadDocuments])

  /* ── Drag & Drop ───────────────────────────────────────────────── */
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    addFilesToQueue(files)
  }, [])

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const handleDragLeave = (e) => { if (!dropRef.current?.contains(e.relatedTarget)) setDragging(false) }

  const addFilesToQueue = (files) => {
    const pdfs = files.filter(f => f.name.toLowerCase().endsWith('.pdf'))
    const nonPdfs = files.filter(f => !f.name.toLowerCase().endsWith('.pdf'))
    if (nonPdfs.length) toast.error(`${nonPdfs.length} archivo(s) ignorado(s): solo se aceptan PDF`)

    const newItems = pdfs.map(f => ({
      id: `${Date.now()}_${Math.random()}`,
      file: f,
      detectedType: detectType(f.name),
      status: 'pending',
      error: null,
    }))
    setQueue(prev => [...prev, ...newItems])
  }

  /* ── Cambiar tipo de un archivo en cola ────────────────────────── */
  const changeType = (itemId, newType) => {
    setQueue(prev => prev.map(i => i.id === itemId ? { ...i, detectedType: newType } : i))
  }

  /* ── Remover de cola ───────────────────────────────────────────── */
  const removeFromQueue = (itemId) => {
    setQueue(prev => prev.filter(i => i.id !== itemId))
  }

  /* ── Subir todos los pendientes ────────────────────────────────── */
  const uploadAll = async () => {
    const pending = queue.filter(i => i.status === 'pending')
    if (!pending.length) return
    setUploading(true)

    for (const item of pending) {
      setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'uploading' } : i))
      try {
        const fd = new FormData()
        fd.append('file', item.file)
        fd.append('override_type', item.detectedType?.code || 'OTRO')
        await documentsService.upload(id, fd)
        setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'done' } : i))
      } catch (err) {
        const msg = err.response?.data?.detail || 'Error al subir'
        setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', error: msg } : i))
        toast.error(`Error: ${item.file.name}`)
      }
    }

    setUploading(false)
    await loadDocuments()
    toast.success('Carga completada')
    // Limpiar los exitosos después de 2s
    setTimeout(() => setQueue(prev => prev.filter(i => i.status !== 'done')), 2000)
  }

  /* ── Descargar ─────────────────────────────────────────────────── */
  const handleDownload = async (doc) => {
    try {
      const url = `/api/documents/${doc.document_id}/download`
      const a = document.createElement('a')
      a.href = url
      a.download = doc.original_filename || `documento_${doc.document_id}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch { toast.error('Error al descargar') }
  }

  /* ── Eliminar ──────────────────────────────────────────────────── */
  const handleDelete = async (doc) => {
    if (!window.confirm(`¿Eliminar "${doc.document_name}"?`)) return
    try {
      await documentsService.delete(doc.document_id)
      toast.success('Documento eliminado')
      setDocuments(prev => prev.filter(d => d.document_id !== doc.document_id))
    } catch { toast.error('Error al eliminar') }
  }

  /* ── Agrupar documentos por tipo ───────────────────────────────── */
  const filteredDocs = filter
    ? documents.filter(d => d.type_code === filter)
    : documents

  const grouped = filteredDocs.reduce((acc, d) => {
    const key = d.type_code || 'OTRO'
    if (!acc[key]) acc[key] = []
    acc[key].push(d)
    return acc
  }, {})

  const pendingCount = queue.filter(i => i.status === 'pending').length
  const typesPresent = [...new Set(documents.map(d => d.type_code))].sort()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* ── Topbar ── */}
      <div style={{
        background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)',
        padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(`/projects/${id}/view`)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid var(--border-color)', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, fontFamily: 'inherit', padding: '7px 12px', borderRadius: 8 }}>
            <ArrowLeft size={15} /> Volver
          </button>
          <div style={{ width: 1, height: 24, background: 'var(--border-color)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(99,102,241,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FolderOpen size={18} color="#6366F1" />
            </div>
            <div>
              <h1 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Documentos · {project ? `${project.project_year} #${project.internal_project_number}` : '…'}
              </h1>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                {project?.project_name?.substring(0, 70)}
                {documents.length > 0 && (
                  <span style={{ marginLeft: 8, fontWeight: 700, color: '#6366F1' }}>
                    · {documents.length} documento{documents.length !== 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Botón cargar */}
        <button onClick={() => fileRef.current?.click()}
          style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#6366F1', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', padding: '8px 16px', borderRadius: 9, fontWeight: 700 }}>
          <Upload size={15} /> Seleccionar PDFs
        </button>
        <input ref={fileRef} type="file" accept=".pdf" multiple style={{ display: 'none' }}
          onChange={e => { addFilesToQueue(Array.from(e.target.files)); e.target.value = '' }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Zona Drag & Drop ── */}
        <div
          ref={dropRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? '#6366F1' : 'var(--border-color)'}`,
            borderRadius: 14,
            background: dragging ? 'rgba(99,102,241,.06)' : 'var(--bg-card)',
            padding: '28px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all .2s',
          }}
        >
          <div style={{ width: 52, height: 52, borderRadius: 14, background: dragging ? 'rgba(99,102,241,.15)' : 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Upload size={24} color={dragging ? '#6366F1' : 'var(--text-muted)'} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 700, color: dragging ? '#6366F1' : 'var(--text-secondary)', margin: 0 }}>
            {dragging ? 'Suelta los archivos aquí' : 'Arrastra PDFs aquí o haz clic para seleccionar'}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
            Solo archivos PDF · Se detecta el tipo automáticamente según el nombre
          </p>
          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}>
            {['AI → Acta de Inicio', 'PROP → Propuesta', 'CONT → Contrato', 'OT → Otro Sí', 'INF → Informe', 'POL → Póliza'].map(ex => (
              <span key={ex} style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '2px 7px', borderRadius: 4, border: '1px solid var(--border-color)' }}>{ex}</span>
            ))}
          </div>
        </div>

        {/* ── Cola de carga ── */}
        {queue.length > 0 && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                  Cola de carga ({queue.length})
                </span>
                {pendingCount > 0 && (
                  <span style={{ fontSize: 11, background: '#6366F120', color: '#6366F1', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
                    {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {pendingCount > 0 && (
                  <button onClick={uploadAll} disabled={uploading}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#6366F1', border: 'none', color: '#fff', cursor: uploading ? 'wait' : 'pointer', fontSize: 12, fontFamily: 'inherit', padding: '7px 14px', borderRadius: 8, fontWeight: 700, opacity: uploading ? 0.7 : 1 }}>
                    <Upload size={13} />
                    {uploading ? 'Subiendo…' : `Subir ${pendingCount} archivo${pendingCount !== 1 ? 's' : ''}`}
                  </button>
                )}
                <button onClick={() => setQueue([])} disabled={uploading}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: '1px solid var(--border-color)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', padding: '7px 12px', borderRadius: 8 }}>
                  <X size={13} /> Limpiar
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {queue.map(item => (
                <QueueItem key={item.id} item={item} onRemove={removeFromQueue} onChangeType={changeType} />
              ))}
            </div>
          </div>
        )}

        {/* ── Lista de documentos guardados ── */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
              Documentos del proyecto
              {documents.length > 0 && <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>({documents.length} total)</span>}
            </span>
            {/* Filtro por tipo */}
            {typesPresent.length > 1 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button onClick={() => setFilter('')}
                  style={{ padding: '3px 10px', borderRadius: 20, border: '1px solid var(--border-color)', background: filter===''?'#6366F1':'none', color: filter===''?'#fff':'var(--text-muted)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Todos
                </button>
                {typesPresent.map(code => {
                  const meta = NOMENCLATURE.find(n => n.code === code) || NOMENCLATURE[NOMENCLATURE.length-1]
                  return (
                    <button key={code} onClick={() => setFilter(code)}
                      style={{ padding: '3px 10px', borderRadius: 20, border: `1px solid ${meta.color}40`, background: filter===code?`${meta.color}20`:'none', color: filter===code?meta.color:'var(--text-muted)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {code}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>Cargando documentos…</div>
          ) : documents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <FolderOpen size={40} color="var(--text-muted)" style={{ opacity: .3, marginBottom: 12 }} />
              <p style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>Sin documentos cargados</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Arrastra PDFs o usa el botón "Seleccionar PDFs"</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>
              Sin documentos del tipo seleccionado
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {Object.entries(grouped).map(([typeCode, docs]) => {
                const meta = NOMENCLATURE.find(n => n.code === typeCode) || NOMENCLATURE[NOMENCLATURE.length-1]
                return (
                  <div key={typeCode}>
                    {/* Cabecera de grupo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: meta.color, textTransform: 'uppercase', letterSpacing: '.07em' }}>
                        {meta.name}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 20, padding: '1px 7px' }}>{docs.length}</span>
                      <div style={{ flex: 1, height: 1, background: `${meta.color}25` }} />
                    </div>
                    {/* Documentos del grupo */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {docs.map(doc => (
                        <div key={doc.document_id} style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 14px', borderRadius: 10,
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-hover)',
                        }}>
                          <FileText size={16} color={meta.color} style={{ flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                              {doc.document_name}
                            </p>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                              {doc.original_filename} · {fmtSize(doc.file_size)}
                              {doc.created_at && <span style={{ marginLeft: 8 }}>· {doc.created_at.split('T')[0]}</span>}
                            </p>
                          </div>
                          <TypeBadge code={meta.code} name={meta.name} color={meta.color} />
                          {/* Acciones */}
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                            <button onClick={() => handleDownload(doc)}
                              title="Descargar PDF"
                              style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid #6366F133', background: '#6366F111', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontFamily: 'inherit' }}>
                              <Download size={13} />
                            </button>
                            <button onClick={() => handleDelete(doc)}
                              title="Eliminar documento"
                              style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid #EF444433', background: '#EF444411', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontFamily: 'inherit' }}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Leyenda de nomenclatura ── */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '14px 20px' }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>
            Nomenclatura de documentos
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '6px 12px' }}>
            {NOMENCLATURE.map(n => (
              <div key={n.code} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: n.color, minWidth: 52 }}>{n.code}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{n.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
