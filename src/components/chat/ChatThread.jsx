import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { listMessages, sendMessage, subscribeMessages } from '../../data/messages'
import { InlineLoader, Empty, showToast } from '../ui/primitives'
import { IconSend } from '../ui/Icons'

function formatTime(iso) {
  const d = new Date(iso)
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

// Shared by both the client and coach views - `sender` is whichever side is
// currently looking at the thread, so "mine" bubbles align the same way
// (right, gold) regardless of which app renders it.
export default function ChatThread({ clientId, sender }) {
  const { db } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    let on = true
    setLoading(true)
    listMessages(db, clientId).then((rows) => {
      if (!on) return
      setMessages(rows)
      setLoading(false)
    }).catch((e) => { if (on) { showToast(e.message || 'Không tải được tin nhắn.'); setLoading(false) } })

    const unsubscribe = subscribeMessages(db, clientId, (msg) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
    })
    return () => { on = false; unsubscribe() }
  }, [db, clientId])

  async function submit(e) {
    e.preventDefault()
    const text = body.trim()
    if (!text || sending) return
    setBody('')
    setSending(true)
    try {
      const msg = await sendMessage(db, clientId, sender, text)
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
    } catch (e2) {
      showToast(e2.message || 'Không gửi được, thử lại.')
      setBody(text)
    } finally {
      setSending(false)
    }
  }

  if (loading) return <InlineLoader />

  return (
    <div className="stack" style={{ gap: 16 }}>
      {messages.length === 0 ? (
        <Empty title="Chưa có tin nhắn" hint="Gửi tin nhắn đầu tiên bên dưới." />
      ) : (
        <div className="stack" style={{ gap: 8 }}>
          {messages.map((m) => {
            const mine = m.sender === sender
            return (
              <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '78%' }}>
                  <div style={{
                    padding: '10px 14px', borderRadius: 16,
                    borderBottomRightRadius: mine ? 4 : 16,
                    borderBottomLeftRadius: mine ? 16 : 4,
                    background: mine ? 'var(--pf-gold)' : 'var(--pf-surface-2)',
                    color: mine ? 'var(--pf-obsidian)' : 'var(--pf-text)',
                    fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}>
                    {m.body}
                  </div>
                  <div style={{
                    fontSize: 11, color: 'var(--pf-faint)', marginTop: 3,
                    textAlign: mine ? 'right' : 'left', padding: '0 4px',
                  }}>
                    {formatTime(m.created_at)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <form onSubmit={submit} className="row" style={{ gap: 8 }}>
        <input
          className="input"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Nhắn tin..."
          style={{ flex: 1 }}
        />
        <button className="btn btn-primary" type="submit" disabled={sending || !body.trim()} style={{ padding: '12px 16px' }}>
          <IconSend width={16} height={16} />
        </button>
      </form>
    </div>
  )
}
