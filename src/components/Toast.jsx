import { useEffect } from 'react'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(onClose, 4200)
    return () => clearTimeout(timer)
  }, [toast, onClose])

  if (!toast) return null
  const success = toast.type === 'success'
  const Icon = success ? CheckCircle2 : AlertCircle
  return (
    <div className={`toast ${success ? 'toast-success' : 'toast-error'}`}>
      <Icon size={18} />
      <span>{toast.message}</span>
      <button className="icon-button toast-close" onClick={onClose} aria-label="Dismiss"><X size={16} /></button>
    </div>
  )
}
