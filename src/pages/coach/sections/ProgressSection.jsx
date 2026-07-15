import { useState, useRef } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useAsync } from '../../../hooks/useAsync'
import {
  listProgressLogs, addProgressLog, deleteProgressLog,
  listPhotos, uploadPhoto, signedPhotoUrl, deletePhoto,
} from '../../../data/progress'
import { Card, Eyebrow, Field, Input, Textarea, InlineLoader, confirmDialog, showToast } from '../../../components/ui/primitives'
import { IconTrash } from '../../../components/ui/Icons'

const ANGLES = [
  { key: 'front', label: 'Trước' },
  { key: 'side', label: 'Nghiêng' },
  { key: 'back', label: 'Sau' },
]

// One upload slot per angle - the angle is fixed by which slot you click,
// so there's no shared dropdown left to forget to change between shots.
function AngleSlot({ label, photo, uploading, disabled, onPick, onRemove }) {
  const inputRef = useRef()
  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f) }}
        disabled={disabled}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        style={{
          width: '100%', aspectRatio: '3/4', borderRadius: 8, overflow: 'hidden', padding: 0,
          background: 'var(--pf-surface-2)', border: photo ? '1px solid var(--pf-line)' : '1px dashed var(--pf-line)',
          display: 'grid', placeItems: 'center', cursor: disabled ? 'default' : 'pointer',
        }}
      >
        {uploading ? (
          <span className="eyebrow eyebrow-muted" style={{ fontSize: 11 }}>Đang tải…</span>
        ) : photo?.url ? (
          <img src={photo.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span className="eyebrow eyebrow-muted" style={{ fontSize: 11 }}>+ {label}</span>
        )}
      </button>
      {onRemove && !uploading && (
        <button onClick={onRemove} style={{
          position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,.6)', border: 'none',
          borderRadius: 6, color: '#fff', width: 26, height: 26, display: 'grid', placeItems: 'center',
        }}><IconTrash width={14} height={14} /></button>
      )}
    </div>
  )
}
import { localISODate } from '../../../lib/date'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

// Matches the live --pf-gold/--pf-surface-2/--pf-line/--pf-text tokens -
// Recharts renders these as SVG attributes outside the CSS cascade, so the
// values have to be duplicated here rather than referenced via var().
const ACCENT = '#C9A961'
const TICK_COLOR = '#8C877E'

function Chart({ title, unit, dataKey, rows }) {
  const points = rows
    .filter((r) => r[dataKey] != null)
    .map((r) => ({ date: r.log_date?.slice(5), value: Number(r[dataKey]) }))
  if (points.length < 2) return null
  return (
    <div>
      <div className="eyebrow eyebrow-muted" style={{ marginBottom: 8 }}>{title}</div>
      <div style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fill: TICK_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: TICK_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} width={42} domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{ background: '#242424', border: '1px solid rgba(245,241,234,.10)', borderRadius: 8, color: '#F5F1EA' }}
              labelStyle={{ color: TICK_COLOR }}
              formatter={(v) => [`${v}${unit}`, '']}
            />
            <Line type="monotone" dataKey="value" stroke={ACCENT} strokeWidth={2} dot={{ r: 3, fill: ACCENT }} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const today = () => localISODate()
const LOG_EMPTY = () => ({ log_date: today(), weight: '', body_fat: '', waist: '', chest: '', hip: '', belly: '', arm: '', notes: '' })

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
  const [photoWeek, setPhotoWeek] = useState(1)
  const [uploadingAngle, setUploadingAngle] = useState(null)
  const set = (k) => (e) => setLog({ ...log, [k]: e.target.value })

  async function saveLog() {
    setBusy(true)
    const num = (v) => (v === '' ? null : Number(v))
    try {
      await addProgressLog(db, clientId, {
        log_date: log.log_date,
        weight: num(log.weight), body_fat: num(log.body_fat),
        waist: num(log.waist), chest: num(log.chest),
        hip: num(log.hip), belly: num(log.belly), arm: num(log.arm),
        notes: log.notes || null,
      })
      setLog(LOG_EMPTY()); reload()
    } finally { setBusy(false) }
  }

  // Each angle has its own hidden file input (see ANGLES below), so a photo
  // is always uploaded with the angle its slot was clicked from - no shared
  // dropdown to forget to change between shots, which used to let several
  // photos in the same sitting silently save under whatever angle was left
  // selected from the previous upload.
  async function onUpload(angle, e) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setUploadingAngle(angle)
    try {
      await uploadPhoto(db, clientId, file, { week: Number(photoWeek), angle })
      reload()
    } catch (err) { showToast(err.message || 'Lỗi tải ảnh') }
    finally { setBusy(false); setUploadingAngle(null); e.target.value = '' }
  }

  async function removePhoto(p) {
    const ok = await confirmDialog('Xoá ảnh này?', { confirmLabel: 'Xoá ảnh', danger: true })
    if (!ok) return
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
          <Field label="Ngực (cm)"><Input type="number" value={log.chest} onChange={set('chest')} /></Field>
          <Field label="Mông (cm)"><Input type="number" value={log.hip} onChange={set('hip')} /></Field>
          <Field label="Bụng (cm)"><Input type="number" value={log.belly} onChange={set('belly')} /></Field>
          <Field label="Tay (cm)"><Input type="number" value={log.arm} onChange={set('arm')} /></Field>
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
                  {[
                    l.weight && `${l.weight}kg`,
                    l.body_fat && `${l.body_fat}%`,
                    l.waist && `eo ${l.waist}cm`,
                    l.chest && `ngực ${l.chest}cm`,
                    l.hip && `mông ${l.hip}cm`,
                    l.belly && `bụng ${l.belly}cm`,
                    l.arm && `tay ${l.arm}cm`,
                  ].filter(Boolean).join(' · ')}
                </div>
              </div>
              <button className="btn-quiet" onClick={async () => { await deleteProgressLog(db, l.id); reload() }}><IconTrash width={15} height={15} /></button>
            </div>
          ))}
        </Card>
      )}

      {logs.length >= 2 && (
        <Card className="stack">
          <Eyebrow muted>Biểu đồ tiến độ</Eyebrow>
          <Chart title="Cân nặng (kg)" unit=" kg" dataKey="weight" rows={logs.slice().reverse()} />
          <Chart title="Body fat (%)" unit="%" dataKey="body_fat" rows={logs.slice().reverse()} />
          <Chart title="Vòng eo (cm)" unit=" cm" dataKey="waist" rows={logs.slice().reverse()} />
          <Chart title="Ngực (cm)" unit=" cm" dataKey="chest" rows={logs.slice().reverse()} />
          <Chart title="Mông (cm)" unit=" cm" dataKey="hip" rows={logs.slice().reverse()} />
          <Chart title="Bụng (cm)" unit=" cm" dataKey="belly" rows={logs.slice().reverse()} />
          <Chart title="Tay (cm)" unit=" cm" dataKey="arm" rows={logs.slice().reverse()} />
        </Card>
      )}

      <Card className="stack">
        <Eyebrow muted>Hình ảnh tiến độ</Eyebrow>
        <Field label="Tuần">
          <select className="select" value={photoWeek} onChange={(e) => setPhotoWeek(Number(e.target.value))}>
            {[1, 4, 8, 12].map((w) => <option key={w} value={w}>Tuần {w}</option>)}
          </select>
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 4 }}>
          {ANGLES.map(({ key, label }) => {
            const existing = photos.find((p) => p.week === photoWeek && p.angle === key)
            return (
              <div key={key}>
                <AngleSlot
                  label={label}
                  photo={existing}
                  uploading={uploadingAngle === key}
                  disabled={busy}
                  onPick={(file) => onUpload(key, { target: { files: [file], value: '' } })}
                  onRemove={existing ? () => removePhoto(existing) : null}
                />
                <div className="eyebrow eyebrow-muted" style={{ marginTop: 4, textAlign: 'center' }}>{label}</div>
              </div>
            )
          })}
        </div>

        {photos.length > 0 && (
          <>
            <Eyebrow muted style={{ marginTop: 8 }}>Toàn bộ ảnh đã tải</Eyebrow>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
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
          </>
        )}
      </Card>
    </div>
  )
}
