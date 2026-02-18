import { FolderOpen } from 'lucide-react'

export default function ProjectsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-ud-red/10 flex items-center justify-center">
          <FolderOpen size={20} className="text-ud-red" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Proyectos</h1>
          <p className="text-gray-500 text-sm">Gestión de proyectos de extensión</p>
        </div>
      </div>

      <div className="card p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-ud-red/10 flex items-center justify-center mb-4">
          <FolderOpen size={32} className="text-ud-red/60" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Módulo de Proyectos</h2>
        <p className="text-gray-500 text-sm max-w-sm">
          Este módulo está en desarrollo. Aquí podrás crear, ver, modificar y deshabilitar proyectos de extensión universitaria.
        </p>
        <div className="mt-6 px-4 py-2 rounded-lg bg-ud-red/10 border border-ud-red/20 text-ud-red text-xs font-medium">
          Próximamente disponible
        </div>
      </div>
    </div>
  )
}
