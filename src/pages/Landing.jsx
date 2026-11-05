import { Link, Navigate } from 'react-router-dom'
import { ArrowUpRight, MessageCircle, ShieldCheck, Sparkles, Users, Zap } from 'lucide-react'
import Brand from '../components/Brand'
import { useAuth } from '../context/AuthContext'

export default function Landing() {
  const { token } = useAuth()
  if (token) return <Navigate to="/chat" replace />

  return (
    <main className="landing">
      <nav className="topbar shell">
        <Brand />
        <div className="nav-actions">
          <Link className="nav-link" to="/login">Log in</Link>
          <Link className="button button-small" to="/signup">Join your campus <ArrowUpRight size={15} /></Link>
        </div>
      </nav>

      <section className="hero shell">
        <div className="hero-copy">
          <div className="eyebrow"><span className="live-dot" /> MADE FOR NIT JAMSHEDPUR</div>
          <h1>Your campus.<br /><span className="gradient-text">A thousand</span><br />new conversations.</h1>
          <p className="hero-description">Meet someone new, share a thought, or just say hello. Real conversations with people from your own campus — one random match at a time.</p>
          <div className="hero-actions">
            <Link to="/signup" className="button button-primary">Start chatting <ArrowUpRight size={18} /></Link>
            <Link to="/login" className="button button-ghost">I have an account</Link>
          </div>
          <div className="hero-note"><ShieldCheck size={16} /> College email required · Your conversations are yours</div>
        </div>

        <div className="hero-art" aria-label="Chat preview">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="floating-chip chip-top"><span className="chip-dot" /> someone is online</div>
          <div className="chat-preview">
            <div className="preview-head">
              <div className="avatar avatar-purple">?</div>
              <div><strong>Someone from campus</strong><span><i className="online-dot" /> Matched just now</span></div>
              <Sparkles size={18} className="preview-sparkle" />
            </div>
            <div className="preview-messages">
              <div className="bubble bubble-theirs">Hey! Which department are you from?</div>
              <div className="bubble bubble-mine">Electrical ⚡ What about you?</div>
              <div className="bubble bubble-theirs">That's cool! I'm from CSE 👋</div>
              <div className="typing-preview"><i /><i /><i /></div>
            </div>
            <div className="preview-input"><span>Say something nice…</span><span className="send-orb"><ArrowUpRight size={16} /></span></div>
          </div>
          <div className="floating-chip chip-bottom"><Users size={15} /> new people, fresh perspectives</div>
          <div className="sparkle sparkle-a">✳</div><div className="sparkle sparkle-b">✦</div>
        </div>
      </section>

      <section className="features shell">
        <div className="section-kicker">A LITTLE LESS SCROLLING. A LITTLE MORE CONNECTING.</div>
        <div className="feature-grid">
          <article className="feature-card"><span className="feature-icon purple"><Zap size={20} /></span><h3>Random, in a good way</h3><p>Get paired with another student who is ready for a conversation.</p></article>
          <article className="feature-card"><span className="feature-icon blue"><MessageCircle size={20} /></span><h3>Actually real-time</h3><p>Instant messages and typing indicators keep the conversation flowing.</p></article>
          <article className="feature-card"><span className="feature-icon green"><ShieldCheck size={20} /></span><h3>Campus community</h3><p>Sign up with your NIT Jamshedpur email to join the community.</p></article>
        </div>
      </section>
      <footer className="footer shell"><Brand /><span>Made for campus conversations. © {new Date().getFullYear()}</span></footer>
    </main>
  )
}
