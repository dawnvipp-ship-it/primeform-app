// Renders a branded, shareable progress card as a PNG blob - Instagram/Zalo
// story ratio so it drops straight into a story without cropping. Built with
// the Canvas API directly (no image-export dependency) since this is one
// fixed layout, not a general-purpose renderer.

const WIDTH = 1080
const HEIGHT = 1920
const PAD = 64

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// Cover-fit an image into a rounded-rect clip region.
function drawCoverImage(ctx, img, x, y, w, h, radius) {
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
  ctx.clip()
  const scale = Math.max(w / img.width, h / img.height)
  const dw = img.width * scale
  const dh = img.height * scale
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
  ctx.restore()
}

/**
 * @param {object} opts
 * @param {string} opts.clientName
 * @param {string} opts.logoSrc
 * @param {{url:string, week:number}|null} [opts.before]
 * @param {{url:string, week:number}|null} [opts.after]
 * @param {string[]} opts.deltaLines - e.g. ["-3.2 KG", "-2.1% BODY FAT"]
 * @param {string} [opts.periodLabel] - e.g. "Trong 8 tuần"
 * @returns {Promise<Blob>}
 */
export async function buildProgressShareCard({ clientName, logoSrc, before, after, deltaLines, periodLabel }) {
  // Avoid a fallback system-font flash in the exported image on a cold page load.
  if (document.fonts?.ready) await document.fonts.ready

  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#0A0A0A'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
  const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT * 0.4)
  grad.addColorStop(0, 'rgba(201,169,97,0.10)')
  grad.addColorStop(1, 'rgba(201,169,97,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, WIDTH, HEIGHT * 0.4)

  try {
    const logo = await loadImage(logoSrc)
    const logoH = 64
    ctx.drawImage(logo, PAD, 80, logoH * (logo.width / logo.height), logoH)
  } catch { /* logo is decorative - skip if it fails to load */ }

  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#F5F1EA'
  ctx.font = '600 46px "Inter Tight", sans-serif'
  ctx.fillText('PRIME FORM', PAD, 200)
  ctx.fillStyle = '#C9A961'
  ctx.font = '600 24px "Inter", sans-serif'
  ctx.letterSpacing = '3px'
  ctx.fillText('PRIVATE TRAINING', PAD, 236)
  ctx.letterSpacing = '0px'

  let cursorY = 300

  if (before?.url && after?.url) {
    const photoH = 880
    const gap = 16
    const photoW = (WIDTH - PAD * 2 - gap) / 2
    try {
      const [beforeImg, afterImg] = await Promise.all([loadImage(before.url), loadImage(after.url)])
      drawCoverImage(ctx, beforeImg, PAD, cursorY, photoW, photoH, 28)
      drawCoverImage(ctx, afterImg, PAD + photoW + gap, cursorY, photoW, photoH, 28)

      ;[PAD, PAD + photoW + gap].forEach((x) => {
        const labelGrad = ctx.createLinearGradient(0, cursorY + photoH - 100, 0, cursorY + photoH)
        labelGrad.addColorStop(0, 'rgba(10,10,10,0)')
        labelGrad.addColorStop(1, 'rgba(10,10,10,0.75)')
        ctx.fillStyle = labelGrad
        ctx.fillRect(x, cursorY + photoH - 100, photoW, 100)
      })
      ctx.fillStyle = '#F5F1EA'
      ctx.font = '600 26px "Inter Tight", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('TRƯỚC', PAD + photoW / 2, cursorY + photoH - 32)
      ctx.fillText('SAU', PAD + photoW + gap + photoW / 2, cursorY + photoH - 32)
      ctx.textAlign = 'left'

      cursorY += photoH + 64
    } catch {
      // Tainted canvas or a failed fetch - fall through to the stat-only layout.
    }
  }

  ctx.font = '700 82px "Inter Tight", sans-serif'
  ctx.fillStyle = '#C9A961'
  deltaLines.forEach((line, i) => ctx.fillText(line, PAD, cursorY + i * 94))
  cursorY += deltaLines.length * 94 + 20

  if (periodLabel) {
    ctx.font = '500 30px "Inter", sans-serif'
    ctx.fillStyle = '#8C877E'
    ctx.fillText(periodLabel, PAD, cursorY)
  }

  ctx.font = '600 34px "Inter Tight", sans-serif'
  ctx.fillStyle = '#F5F1EA'
  ctx.fillText(clientName, PAD, HEIGHT - 116)

  ctx.font = '500 24px "Inter", sans-serif'
  ctx.fillStyle = '#7A756C'
  ctx.fillText('primeformvn.com', PAD, HEIGHT - 68)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Không tạo được ảnh'))), 'image/png', 0.95)
  })
}

// Share via the OS share sheet when available (mobile), else fall back to
// a plain download - desktop Safari/Chrome don't support sharing files yet.
export async function shareOrDownload(blob, filename) {
  const file = new File([blob], filename, { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Prime Form' })
    return
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
