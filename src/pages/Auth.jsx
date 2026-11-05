import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react'
import Brand from '../components/Brand'
import Toast from '../components/Toast'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'

export default function Auth({ mode = 'login' }) {
  const isSignup = mode === 'signup'
  const navigate = useNavigate()
  const { token, login } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null)

  if (token) return <Navigate to="/chat" replace />

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })

  const submit = async (event) => {
    event.preventDefault()
    setToast(null)
    if (!form.email.toLowerCase().trim().endsWith('@nitjsr.ac.in')) {
      setToast({ type: 'error', message: 'Please use your @nitjsr.ac.in college email.' })
      return
    }
    if (isSignup && form.password.length < 6) {
      setToast({ type: 'error', message: 'Password must contain at least 6 characters.' })
      return
    }

    setBusy(true)
    try {
      if (isSignup) {
        await api.post('/api/v1/auth/signup', {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password
        })
        setToast({ type: 'success', message: 'Account created! Please log in with your credentials.' })
        setTimeout(() => navigate('/login', { replace: true }), 900)
      } else {
        const response = await api.post('/api/v1/auth/signin', {
          email: form.email.trim().toLowerCase(),
          password: form.password
        })
        const data = response.data.data
        login(data.token, { name: data.name, email: data.email })
        navigate('/chat', { replace: true })
      }
    } catch (error) {
      setToast({
        type: 'error',
        message: error.response?.data?.message || 'Something went wrong. Please try again.'
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-glow auth-glow-one" /><div className="auth-glow auth-glow-two" />
      <nav className="auth-nav shell"><Brand /><Link to="/" className="back-link"><ArrowLeft size={16} /> Back home</Link></nav>
      <section className="auth-layout">
        <div className="auth-aside">
          <div className="eyebrow"><span className="live-dot" /> YOUR CAMPUS, YOUR COMMUNITY</div>
          <h1>{isSignup ? <>Your next<br /><span className="gradient-text">conversation</span><br />starts here.</> : <>Good to have<br /><span className="gradient-text">you back.</span></>}</h1>
          <p>{isSignup ? 'One college email. A whole campus of people you have not met yet.' : 'Pick up where you left off. There is always someone new to meet.'}</p>
          <div className="aside-points"><span><LockKeyhole size={16} /> College-only access</span><span><Mail size={16} /> @nitjsr.ac.in accounts</span></div>
        </div>

        <div className="auth-card">
          <div className="auth-card-heading"><span className="form-kicker">{isSignup ? 'CREATE YOUR ACCOUNT' : 'WELCOME BACK'}</span><h2>{isSignup ? 'Join the conversation' : 'Log in to CampusConnect'}</h2><p>{isSignup ? 'Use your institute email to get started.' : 'Enter your details to continue.'}</p></div>
          <form onSubmit={submit} className="auth-form">
            {isSignup && <label className="field"><span>Full name</span><div className="input-wrap"><UserRound size={18} /><input name="name" value={form.name} onChange={update} placeholder="Your name" autoComplete="name" required maxLength={60} /></div></label>}
            <label className="field"><span>College email</span><div className="input-wrap"><Mail size={18} /><input name="email" type="email" value={form.email} onChange={update} placeholder="you@nitjsr.ac.in" autoComplete="email" required /></div></label>
            <label className="field"><span>Password</span><div className="input-wrap"><LockKeyhole size={18} /><input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={update} placeholder="At least 6 characters" autoComplete={isSignup ? 'new-password' : 'current-password'} required minLength={6} /><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
            <button className="button button-primary auth-submit" disabled={busy}>{busy ? <span className="button-loader" /> : <>{isSignup ? 'Create account' : 'Log in'} <ArrowRight size={17} /></>}</button>
          </form>
          <div className="auth-switch">{isSignup ? 'Already have an account?' : "Don't have an account?"} <Link to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Log in' : 'Create one'}</Link></div>
          <div className="college-note"><LockKeyhole size={14} /> Currently limited to @nitjsr.ac.in email addresses.</div>
        </div>
      </section>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </main>
  )
}
