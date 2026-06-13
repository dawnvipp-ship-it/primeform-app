// ---------- Progress logs (weight / body fat / waist over time) ----------

export async function listProgressLogs(db, clientId) {
  const { data, error } = await db
    .from('progress_logs').select('*').eq('client_id', clientId)
    .order('log_date', { ascending: true })
  if (error) throw error
  return data
}

export async function addProgressLog(db, clientId, fields) {
  const { data, error } = await db
    .from('progress_logs').insert({ client_id: clientId, ...fields }).select('*').single()
  if (error) throw error
  return data
}

export async function deleteProgressLog(db, id) {
  const { error } = await db.from('progress_logs').delete().eq('id', id)
  if (error) throw error
}

// ---------- Progress photos (private bucket, namespaced by client_id) ----------

const BUCKET = 'progress-photos'

export async function listPhotos(db, clientId) {
  const { data, error } = await db
    .from('progress_photos').select('*').eq('client_id', clientId)
    .order('week', { ascending: true })
  if (error) throw error
  return data
}

// Returns a temporary viewable URL for a private object.
export async function signedPhotoUrl(db, path, expiresIn = 3600) {
  const { data, error } = await db.storage.from(BUCKET).createSignedUrl(path, expiresIn)
  if (error) throw error
  return data.signedUrl
}

// Coach-only: upload a file and record the row.
export async function uploadPhoto(db, clientId, file, { week, angle }) {
  const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase()
  const path = `${clientId}/week-${week}-${angle || 'front'}-${Date.now()}.${ext}`
  const up = await db.storage.from(BUCKET).upload(path, file, { upsert: false })
  if (up.error) throw up.error
  const { data, error } = await db
    .from('progress_photos')
    .insert({ client_id: clientId, week, angle, photo_path: path })
    .select('*').single()
  if (error) throw error
  return data
}

export async function deletePhoto(db, photo) {
  await db.storage.from(BUCKET).remove([photo.photo_path])
  const { error } = await db.from('progress_photos').delete().eq('id', photo.id)
  if (error) throw error
}
