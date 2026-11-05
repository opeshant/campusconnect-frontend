import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { ArrowDown, ArrowLeft, ArrowRight, Check, CircleHelp, LogOut, MessageCircle, MoreHorizontal, Paperclip, Send, ShieldCheck, SkipForward, Smile, Sparkles, Square, UserRound, Wifi, WifiOff, X } from 'lucide-react'
import Brand from '../components/Brand'
import Toast from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import api, { API_URL } from '../lib/api'

const formatTime = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function Chat() {
  const { user, token, logout, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const socketRef = useRef(null)
  const bottomRef = useRef(null)
  const typingTimer = useRef(null)
  const [socketStatus, setSocketStatus] = useState('connecting')
  const [matchStatus, setMatchStatus] = useState('idle')
  const [partner, setPartner] = useState(null)
  const [chatId, setChatId] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [partnerTyping, setPartnerTyping] = useState(false)
  const [toast, setToast] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [busyAction, setBusyAction] = useState(false)
  const [profileName, setProfileName] = useState(user?.name || '')
  const [interests, setInterests] = useState((user?.interests || []).join(', '))

  const addToast = useCallback((message, type = 'error') => setToast({ message, type }), [])

  const findPartner = useCallback(() => {
    const socket = socketRef.current
    if (!socket?.connected) {
      addToast('Connecting to chat server. Please wait.')
      return
    }
    setMessages([])
    setPartner(null)
    setChatId(null)
    setPartnerTyping(false)
    setMatchStatus('searching')
    socket.emit('find_partner')
  }, [addToast])

  useEffect(() => {
    const socket = io(API_URL, {
      autoConnect: false,
      auth: { token }
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setSocketStatus('connected')
      // Connect to the chat server, but do not start matchmaking automatically.
      // The user starts matchmaking by clicking the Find a partner button.
      setMatchStatus('idle')
    })
    socket.on('connect_error', (error) => {
      setSocketStatus('disconnected')
      addToast(error.message || 'Could not connect to chat server.')
    })
    socket.on('disconnect', () => {
      setSocketStatus('disconnected')
      setPartnerTyping(false)
    })
    socket.on('waiting_for_partner', (data) => {
      setMatchStatus('waiting')
      if (data?.message) addToast(data.message, 'info')
    })
    socket.on('match_found', async (data) => {
      setPartner(data.partner || { name: 'Campus member' })
      setChatId(data.chatId)
      setMessages([])
      setPartnerTyping(false)
      setMatchStatus('matched')
      try {
        const response = await api.get(`/api/v1/chats/${data.chatId}/messages`)
        setMessages(Array.isArray(response.data.data) ? response.data.data : [])
      } catch (error) {
        addToast(error.response?.data?.message || 'Matched! Could not load earlier messages.')
      }
    })
    socket.on('receive_message', (data) => {
      setMessages((current) => [...current, { ...data, mine: false }])
      setPartnerTyping(false)
    })
    socket.on('message_sent', (data) => {
      setMessages((current) => {
        if (current.some((item) => item._id && item._id === data._id)) return current
        return [...current, { ...data, mine: true }]
      })
    })
    socket.on('message_error', (data) => addToast(data.message || 'Message could not be sent.'))
    socket.on('partner_typing', () => setPartnerTyping(true))
    socket.on('partner_stop_typing', () => setPartnerTyping(false))
    socket.on('partner_disconnected', (data) => {
      setMatchStatus('ended')
      setPartnerTyping(false)
      addToast(data.message || 'Your partner disconnected.', 'info')
    })
    socket.on('partner_skipped', (data) => {
      setMatchStatus('ended')
      setPartnerTyping(false)
      addToast(data.message || 'Your partner skipped the chat.', 'info')
    })
    socket.on('chat_ended', (data) => {
      setMatchStatus('ended')
      setPartnerTyping(false)
      addToast(data.message || 'Chat ended.', 'info')
    })
    socket.on('chat_end_error', (data) => addToast(data.message || 'Could not end chat.'))
    socket.on('skip_error', (data) => addToast(data.message || 'Could not skip partner.'))
    socket.on('match_error', (data) => {
      setMatchStatus('ended')
      addToast(data.message || 'Could not find a partner.')
    })
    socket.on('rate_limit_error', (data) => addToast(data.message || 'Please slow down.'))

    socket.connect()
    return () => {
      clearTimeout(typingTimer.current)
      socket.removeAllListeners()
      socket.disconnect()
      socketRef.current = null
    }
  }, [token, addToast])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, partnerTyping])

  const sendMessage = (event) => {
    event?.preventDefault()
    const message = draft.trim()
    if (!message || !socketRef.current || matchStatus !== 'matched') return
    if (message.length > 1000) {
      addToast('Messages can be up to 1000 characters.')
      return
    }
    socketRef.current.emit('send_message', { message })
    setDraft('')
    socketRef.current.emit('stop_typing')
  }

  const handleTyping = (value) => {
    setDraft(value)
    const socket = socketRef.current
    if (matchStatus !== 'matched' || !socket) return
    socket.emit('typing')
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => socket.emit('stop_typing'), 1100)
  }

  const endChat = () => {
    if (!socketRef.current || matchStatus !== 'matched') return
    setBusyAction(true)
    socketRef.current.emit('end_chat')
    setTimeout(() => setBusyAction(false), 600)
  }

  const skipPartner = () => {
    if (!socketRef.current || matchStatus !== 'matched') return
    setBusyAction(true)
    setMessages([])
    setPartner(null)
    setChatId(null)
    setPartnerTyping(false)
    setMatchStatus('searching')
    socketRef.current.emit('skip_partner')
    setTimeout(() => setBusyAction(false), 600)
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    const payload = {
      name: profileName.trim(),
      interests: interests.split(',').map((item) => item.trim()).filter(Boolean)
    }
    try {
      await api.patch('/api/v1/users/me', payload)
      await refreshProfile()
      setProfileOpen(false)
      addToast('Profile updated successfully.', 'success')
    } catch (error) {
      addToast(error.response?.data?.message || 'Could not update profile.')
    }
  }

  const signOut = () => {
    socketRef.current?.disconnect()
    logout()
    navigate('/login', { replace: true })
  }

  const isMatched = matchStatus === 'matched'

  return (
    <main className="app-shell">
      <header className="app-header">
        <Brand />
        <div className="header-right">
          <span className={`connection-pill ${socketStatus}`}><i />{socketStatus === 'connected' ? 'Connected' : 'Reconnecting'}</span>
          <button className="profile-trigger" onClick={() => setProfileOpen(true)}><span className="mini-avatar">{(user?.name || 'U').slice(0, 1).toUpperCase()}</span><span>{user?.name || 'My profile'}</span><MoreHorizontal size={17} /></button>
          <button className="icon-button logout-button" onClick={signOut} title="Log out"><LogOut size={18} /></button>
        </div>
      </header>

      <div className="chat-layout">
        <aside className="chat-sidebar">
          <div className="sidebar-intro"><span className="eyebrow">THE CAMPUS LOUNGE</span><h2>Meet someone<br /><span className="gradient-text">new today.</span></h2><p>No profiles to swipe. No awkward intros. Just a fresh conversation.</p></div>
          <div className="match-card">
            <div className="match-card-art"><div className="match-orb orb-a" /><div className="match-orb orb-b" /><div className="match-icon"><Sparkles size={27} /></div></div>
            <div className="match-card-body">
              <span className="match-label">{isMatched ? 'YOU ARE CONNECTED' : matchStatus === 'waiting' || matchStatus === 'searching' ? 'FINDING YOUR PERSON' : 'READY WHEN YOU ARE'}</span>
              <h3>{isMatched ? partner?.name || 'Campus member' : matchStatus === 'waiting' || matchStatus === 'searching' ? 'Your next hello is close.' : 'A new conversation awaits.'}</h3>
              <p>{isMatched ? 'Say hello and see where the conversation goes.' : matchStatus === 'waiting' || matchStatus === 'searching' ? 'Hang tight. We are looking for another student.' : 'Tap below and we will find another student for you.'}</p>
              {isMatched ? <div className="matched-status"><i /> Matched with a campus member</div> : <button className="button button-primary find-button" onClick={findPartner} disabled={matchStatus === 'searching' || matchStatus === 'waiting' || socketStatus !== 'connected'}>{matchStatus === 'searching' || matchStatus === 'waiting' ? <><span className="button-loader" /> Finding someone…</> : <>Find a partner <ArrowRight size={17} /></>}</button>}
            </div>
          </div>
          <div className="sidebar-tip"><div className="tip-icon"><ShieldCheck size={18} /></div><div><strong>A little kindness goes a long way</strong><span>Keep it friendly. Respect the person on the other side.</span></div></div>
          <div className="sidebar-bottom"><span><Wifi size={14} /> Live campus chat</span><span>Built for NIT Jamshedpur</span></div>
        </aside>

        <section className="conversation-panel">
          <div className="conversation-header">
            <div className="conversation-person">
              <div className={`conversation-avatar ${isMatched ? 'avatar-active' : ''}`}>{isMatched ? (partner?.name || '?').slice(0, 1).toUpperCase() : <CircleHelp size={22} />}</div>
              <div><strong>{isMatched ? partner?.name || 'Campus member' : 'Your conversation'}</strong><span>{isMatched ? <><i className="online-dot" /> Connected with a random student</> : 'A new chat will appear here'}</span></div>
            </div>
            {isMatched && <div className="chat-actions"><button className="button button-outline button-small" onClick={skipPartner} disabled={busyAction}><SkipForward size={15} /> Skip</button><button className="icon-button end-button" onClick={endChat} disabled={busyAction} title="End chat"><X size={18} /></button></div>}
          </div>

          <div className="messages-area">
            {!isMatched && (
              <div className="empty-chat">
                <div className="empty-illustration"><div className="empty-ring ring-one" /><div className="empty-ring ring-two" /><div className="empty-chat-icon"><MessageCircle size={31} /></div><span className="empty-star star-one">✦</span><span className="empty-star star-two">✳</span></div>
                <h3>{matchStatus === 'waiting' || matchStatus === 'searching' ? 'The next hello is loading…' : matchStatus === 'ended' ? 'That was a conversation.' : 'It starts with hello.'}</h3>
                <p>{matchStatus === 'waiting' || matchStatus === 'searching' ? 'We are finding another student. This usually takes a moment.' : 'When you find a partner, your messages will show up right here.'}</p>
                {(matchStatus === 'waiting' || matchStatus === 'searching') && <div className="searching-dots"><i /><i /><i /></div>}
                {matchStatus === 'ended' && <button className="button button-primary retry-button" onClick={findPartner}>Find another partner <ArrowRight size={16} /></button>}
              </div>
            )}
            {isMatched && messages.length === 0 && <div className="chat-start-note"><Sparkles size={15} /> You matched! Break the ice with a friendly hello.</div>}
            {messages.map((message, index) => {
              const mine = message.mine ?? (message.senderId?._id || message.senderId)?.toString() === (user?._id || user?.id)?.toString()
              return <div key={message._id || `${message.sentAt}-${index}`} className={`message-row ${mine ? 'mine' : 'theirs'}`}><div className="message-content"><div className="message-bubble">{message.message}</div><span className="message-time">{formatTime(message.sentAt)} {mine && <Check size={12} />}</span></div></div>
            })}
            {partnerTyping && <div className="typing-row"><span>{partner?.name || 'Partner'} is typing</span><div className="typing-dots"><i /><i /><i /></div></div>}
            <div ref={bottomRef} />
          </div>

          <form className={`composer ${!isMatched ? 'composer-disabled' : ''}`} onSubmit={sendMessage}>
            <div className="composer-inner"><input value={draft} onChange={(event) => handleTyping(event.target.value)} placeholder={isMatched ? 'Write a message…' : 'Find a partner to start chatting'} disabled={!isMatched} maxLength={1000} /><span className="character-count">{draft.length > 0 ? `${draft.length}/1000` : <Smile size={17} />}</span><button type="submit" className="send-button" disabled={!isMatched || !draft.trim()} aria-label="Send message"><Send size={18} /></button></div>
            <div className="composer-foot"><span><ShieldCheck size={13} /> Be respectful. Keep personal information private.</span><span>Enter to send</span></div>
          </form>
        </section>
      </div>

      {profileOpen && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setProfileOpen(false)}><section className="profile-modal"><div className="modal-heading"><div><span className="form-kicker">YOUR ACCOUNT</span><h2>Profile settings</h2></div><button className="icon-button" onClick={() => setProfileOpen(false)}><X size={19} /></button></div><form onSubmit={saveProfile} className="auth-form"><label className="field"><span>Display name</span><input className="plain-input" value={profileName} onChange={(event) => setProfileName(event.target.value)} required /></label><label className="field"><span>College email</span><input className="plain-input input-readonly" value={user?.email || ''} readOnly /></label><label className="field"><span>Interests <small>(comma separated)</small></span><textarea className="plain-input interests-input" value={interests} onChange={(event) => setInterests(event.target.value)} placeholder="Music, coding, movies…" /></label><button className="button button-primary auth-submit">Save changes <ArrowRight size={16} /></button></form></section></div>}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </main>
  )
}
