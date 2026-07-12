import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { pushSupported, isStandalone, getNotificationPermissionState, enablePush } from '../../data/push'
import { Card, Eyebrow, showToast } from '../ui/primitives'

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream
}

// Prompts to turn on push (new messages, booking updates). Silently hides
// itself once the visitor has answered (granted or denied) - no nagging.
export default function NotificationPrompt({ ownerType, clientId, coachId }) {
  const { db } = useAuth()
  const [state, setState] = useState(null) // 'ask' | 'ios-add-to-home' | 'enabling' | null (hidden)

  useEffect(() => {
    let on = true
    ;(async () => {
      if (!pushSupported()) { if (on) setState(null); return }
      const permission = await getNotificationPermissionState()
      if (permission !== 'default') { if (on) setState(null); return }
      if (isIOS() && !isStandalone()) { if (on) setState('ios-add-to-home'); return }
      if (on) setState('ask')
    })()
    return () => { on = false }
  }, [])

  async function enable() {
    setState('enabling')
    try {
      await enablePush(db, { ownerType, clientId, coachId })
      setState(null)
    } catch (e) {
      showToast(e.message || 'Không bật được thông báo.')
      setState(null)
    }
  }

  if (!state) return null

  if (state === 'ios-add-to-home') {
    return (
      <Card style={{ borderLeft: '2px solid var(--pf-accent)' }}>
        <Eyebrow muted>Bật thông báo</Eyebrow>
        <p style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6 }}>
          Để nhận thông báo tin nhắn/lịch tập trên iPhone: bấm nút <strong>Chia sẻ</strong> ở Safari (biểu tượng ô vuông có mũi tên) →
          chọn <strong>"Thêm vào MH chính"</strong> → mở app từ icon vừa thêm.
        </p>
      </Card>
    )
  }

  return (
    <Card className="row-between">
      <div>
        <Eyebrow muted>Bật thông báo</Eyebrow>
        <div style={{ marginTop: 6, fontSize: 13, color: 'var(--pf-muted)' }}>Nhận thông báo khi có tin nhắn hoặc cập nhật lịch tập.</div>
      </div>
      <button className="btn btn-primary btn-sm" onClick={enable} disabled={state === 'enabling'}>
        {state === 'enabling' ? 'Đang bật…' : 'Bật'}
      </button>
    </Card>
  )
}
