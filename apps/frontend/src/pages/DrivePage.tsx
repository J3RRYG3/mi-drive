import { useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react'
import {
  Cloud,
  Upload,
  LogOut,
  File,
  ImageIcon,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  HardDrive,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { uploadFileToGcs } from '../lib/api'

interface UploadItem {
  id: string
  name: string
  size: number
  status: 'uploading' | 'done' | 'error'
  progress: number
  error?: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-emerald-400" />
  if (mimeType.startsWith('text/')) return <FileText className="w-4 h-4 text-blue-400" />
  return <File className="w-4 h-4 text-slate-400" />
}

export default function DrivePage() {
  const { userEmail, logout } = useAuth()
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function updateItem(id: string, patch: Partial<UploadItem>) {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))
  }

  async function handleFiles(files: FileList) {
    const newItems: UploadItem[] = Array.from(files).map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: f.size,
      status: 'uploading',
      progress: 0,
    }))

    setUploads((prev) => [...newItems, ...prev])

    await Promise.all(
      Array.from(files).map(async (file, i) => {
        const item = newItems[i]
        try {
          await uploadFileToGcs(file, (pct) => updateItem(item.id, { progress: pct }))
          updateItem(item.id, { status: 'done', progress: 100 })
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Error al subir'
          updateItem(item.id, { status: 'error', error: msg })
        }
      }),
    )
  }

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setDragging(false)
      if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
    },
    [],
  )

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) handleFiles(e.target.files)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-surface-border bg-surface-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary-600 p-2 rounded-xl">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white leading-none">miDrive</h1>
              <p className="text-slate-500 text-xs mt-0.5">Multicloud Storage</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-200">{userEmail}</p>
              <p className="text-xs text-slate-500">Cuenta activa</p>
            </div>
            <button onClick={logout} className="btn-ghost flex items-center gap-2 text-sm">
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Archivos subidos', value: uploads.filter((u) => u.status === 'done').length, color: 'text-emerald-400' },
            { label: 'En progreso', value: uploads.filter((u) => u.status === 'uploading').length, color: 'text-primary-400' },
            { label: 'Con errores', value: uploads.filter((u) => u.status === 'error').length, color: 'text-red-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="glass-card p-5">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-slate-400 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`glass-card p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-200
            ${dragging
              ? 'border-primary-500 bg-primary-900/20 scale-[1.01] shadow-lg shadow-primary-900/30'
              : 'hover:border-slate-500 hover:bg-surface-card/70'
            }`}
        >
          <div className={`p-5 rounded-full transition-colors duration-200 ${dragging ? 'bg-primary-600' : 'bg-surface'}`}>
            <Upload className={`w-8 h-8 transition-colors ${dragging ? 'text-white' : 'text-slate-400'}`} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-200">
              {dragging ? 'Suelta los archivos aquí' : 'Arrastra archivos o haz clic para seleccionar'}
            </p>
            <p className="text-slate-500 text-sm mt-1">
              Se subirán directamente a Google Cloud Storage
            </p>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            <span className="tag bg-surface text-slate-400 border border-surface-border">Imágenes</span>
            <span className="tag bg-surface text-slate-400 border border-surface-border">Documentos</span>
            <span className="tag bg-surface text-slate-400 border border-surface-border">Vídeos</span>
            <span className="tag bg-surface text-slate-400 border border-surface-border">Cualquier formato</span>
          </div>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={onInputChange} />
        </div>

        {/* Lista de uploads */}
        {uploads.length > 0 && (
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-border flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-slate-400" />
              <h2 className="font-semibold text-slate-200">Actividad de subida</h2>
              <span className="ml-auto text-xs text-slate-500">{uploads.length} archivos</span>
            </div>
            <div className="divide-y divide-surface-border">
              {uploads.map((item) => (
                <div key={item.id} className="px-6 py-4 flex items-center gap-4">
                  <FileIcon mimeType="" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{item.name}</p>
                    <p className="text-xs text-slate-500">{formatBytes(item.size)}</p>
                    {item.status === 'uploading' && (
                      <div className="mt-1.5 h-1 bg-surface rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 transition-all duration-300 rounded-full"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                    {item.status === 'error' && (
                      <p className="text-xs text-red-400 mt-1">{item.error}</p>
                    )}
                  </div>
                  <div className="shrink-0">
                    {item.status === 'uploading' && (
                      <div className="flex items-center gap-1.5 text-primary-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-xs">{item.progress}%</span>
                      </div>
                    )}
                    {item.status === 'done' && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    )}
                    {item.status === 'error' && (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
