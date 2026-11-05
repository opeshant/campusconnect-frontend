import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'

export default function Brand({ compact = false }) {
  return (
    <Link to="/" className="brand">
      <span className="brand-mark"><MessageCircle size={20} strokeWidth={2.5} /></span>
      {!compact && <span>campus<span className="brand-accent">connect</span><i>.</i></span>}
    </Link>
  )
}
