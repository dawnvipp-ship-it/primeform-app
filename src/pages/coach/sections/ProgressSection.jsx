import { useState, useRef } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useAsync } from '../../../hooks/useAsync'
import {
  listProgressLogs, addProgressLog, deleteProgressLog,
  listPhotos, uploadPhoto, signedPhotoUrl, deletePhoto,
} from '../../../data/progress'
import { Card, Eyebrow, Field, Input, Textarea, InlineLoader, Empty } from '../../../components/ui/primitives'
import { IconTrash } from '../../../components/ui/Icons'

const today = () => new Date().toISOString().slice(0, 10)
const LOG_EMPTY = () => ({ log_date: today(), weight: '', body_fat: '', waist: '', notes: '' })

export default function ProgressSection({ clientId }) {
  const { db } = useAuth()
  const fileRef = useRef()
  const { data, loading, reload } = useAsync(async () => {
    const [logs, photos] = await Promise.all([listProgressLogs(db, clientId), listPhotos(db, clientId)])
    const withUrls = await Promise.all(photos.map(async (p) => ({ ...p, url: await signedPhotoUrl(db, p.photo_path).catch(() => null) })))
    return { logs: logs.slice().reverse(), photos: withUrls }
  }, [db, clientId])

  const [log, setLog] = useState(LOG_EMPTY())
  const [busy, setBusy] = useState(false)
  const [photoMeta, setPhotoMeta] = useState({ week: 1, angle: 'front' })
  const set = (k) => (e) => setLog({ ...log, [k]: e.target.value })

  async function saveLog() {
    setBusy(true)
    const num = (v) => (v === '' ? null : Number(v))
    try {
      await addProgressLog(db, clientId, {
        log_date: log.log_date, weight: num(log.weight), body_fat: num(log.body_fat),
        waist: num(log.waist), notes: log.notes || null,
      })
      setLog(LOG_EMPTY()); reload()
    } finally { setBusy(false) }
  }

  async function onUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      await uploadPhoto(db, clientId, file, { week: Number(photoMeta.week), angle: photoMeta.angle })
      reload()
    } catch (err) { alert(err.message || 'Lỗi tải ảnh') }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = '' }
  }

  async function removePhoto(p) {
    if (!confirm('Xoá ảnh này?')) return
    await deletePhoto(db, p); reload()
  }

  if (loading) return <InlineLoader />
  const { logs, photos } = data

  return (
    <div className="stack">
      <Card className="stack">
        <Eyebrow muted>Ghi số đo</Eyebrow>
        <div className="field-grid">
          <Field label="Ngày"><Input type="date" value={log.log_date} onChange={set('log_date')} /></Field>
          <Field label="Cân nặng (kg)"><Input type="number" value={log.weight} onChange={set('weight')} /></Field>
          <Field label="Body fat (%)"><Input type="number" value={log.body_fat} onChange={set('body_fat')} /></Field>
          <Field label="Vòng eo (cm)"><Input type="number" value={log.waist} onChange={set('waist')} /></Field>
        </div>
        <Field label="Ghi chú"><Textarea value={log.notes} onChange={set('notes')} /></Field>
        <button className="btn btn-primary btn-block" onClick={saveLog} disabled={busy}>{busy ? 'Đang lưu…' : 'Thêm số đo'}</button>
      </Card>

      {logs.length > 0 && (
        <Card className="card-flush">
          {logs.map((l) => (
            <div key={l.id} className="row-between" style={{ padding: '12px 16px', borderBottom: '1px solid var(--pf-line-soft)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{l.log_date}</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {[l.weight && `${l.weight}kg`, l.body_fat && `${l.body_fat}%`, l.waist && `eo ${l.waist}cm`].filter(Boolean).join(' · ')}
                </div>
              </div>
              <button className="btn-quiet" onClick={async () => { await deleteProgressLog(db, l.id); reload() }}><IconTrash width={15} height={15} /></button>
            </div>
          ))}
        </Card>
      )}

      <Card className="stack">
        <Eyebrow muted>Hình ảnh tiến độ</Eyebrow>
        <div className="field-grid">
          <Field label="Tuần">
            <select className="select" value={photoMeta.week} onChange={(e) => setPhotoMeta({ ...photoMeta, week: e.target.value })}>
              {[1, 4, 8, 12].map((w) => <option key={w} value={w}>Tuần {w}</option>)}
            </select>
          </Field>
          <Field label="Góc">
            <select className="select" value={photoMeta.angle} onChange={(e) => setPhotoMeta({ ...photoMeta, angle: e.target.value })}>
              <option value="front">Trước</option><option value="side">Nghiêng</option><option value="back">Sau</option>
            </select>
          </Field>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} disabled={busy}
          style={{ fontSize: 13, color: 'var(--pf-muted)' }} />

        {photos.length === 0 ? <Empty title="Chưa có ảnh" /> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 4 }}>
            {photos.map((p) => (
              <div key={p.id} style={{ position: 'relative' }}>
                <div style={{ aspectRatio: '3/4', borderRadius: 8, overflow: 'hidden', background: 'var(--pf-surface-2)', border: '1px solid var(--pf-line)' }}>
                  {p.url && <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div className="eyebrow eyebrow-muted" style={{ marginTop: 4 }}>T{p.week} · {p.angle}</div>
                <button onClick={() => removePhoto(p)} style={{
                  position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,.6)', border: 'none',
                  borderRadius: 6, color: '#fff', width: 26, height: 26, display: 'grid', placeItems: 'center',
                }}><IconTrash width={14} height={14} /></button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
