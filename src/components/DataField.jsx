import { useEffect, useRef } from 'react'

/*
  DataField — a night sky of data points in three depths.
  As the Journey slides sideways, near points move fast and far points move
  slow (parallax), so the scroll feels like travel. Points close to each
  other link into faint constellations; near the cursor they brighten and
  reach for it. One canvas, sleeps when off-screen.
*/

const BLUE = '47,139,255'
const GREEN = '57,255,136'
const LAYERS = [
  { depth: 0.18, count: 46, r: 1.0, alpha: 0.55, link: 90 },
  { depth: 0.38, count: 32, r: 1.5, alpha: 0.72, link: 120 },
  { depth: 0.62, count: 18, r: 2.2, alpha: 0.92, link: 150 },
]

export default function DataField({ progress, travel = 0, className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    let W = 0, H = 0, pts = []
    const mouse = { x: -9999, y: -9999 }

    const seed = () => {
      pts = []
      LAYERS.forEach((L, li) => {
        const span = W + travel * L.depth + 80 // enough points for the whole trip
        const n = Math.round(L.count * (span / Math.max(W, 1)))
        for (let i = 0; i < n; i++) {
          pts.push({
            li,
            x: Math.random() * span - 40,
            y: Math.random() * H * 0.92,
            ph: Math.random() * Math.PI * 2,
            c: Math.random() < 0.55 ? BLUE : GREEN,
          })
        }
      })
    }
    const size = () => {
      const r = canvas.getBoundingClientRect()
      W = r.width; H = r.height
      canvas.width = W * dpr; canvas.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      seed()
    }
    size()
    const ro = new ResizeObserver(size)
    ro.observe(canvas)

    const onMove = (e) => {
      const r = canvas.getBoundingClientRect()
      mouse.x = e.clientX - r.left
      mouse.y = e.clientY - r.top
    }
    const onLeave = () => { mouse.x = mouse.y = -9999 }
    window.addEventListener('pointermove', onMove)
    document.addEventListener('pointerleave', onLeave)

    let raf, visible = true, t = 0
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
    io.observe(canvas)

    const screen = []
    const frame = () => {
      raf = requestAnimationFrame(frame)
      if (!visible || document.hidden) return
      t += reduce ? 0 : 0.006
      const p = progress ? progress.get() : 0
      ctx.clearRect(0, 0, W, H)

      // positions on screen this frame
      screen.length = 0
      for (const q of pts) {
        const L = LAYERS[q.li]
        const x = q.x - p * travel * L.depth + Math.sin(t + q.ph) * 6 * L.depth
        const y = q.y + Math.cos(t * 0.8 + q.ph) * 4 * L.depth
        if (x < -30 || x > W + 30) continue
        screen.push({ x, y, q, L })
      }

      // constellations within each depth
      ctx.lineWidth = 1
      for (let i = 0; i < screen.length; i++) {
        const a = screen[i]
        for (let j = i + 1; j < screen.length; j++) {
          const b = screen[j]
          if (a.q.li !== b.q.li) continue
          const dx = a.x - b.x, dy = a.y - b.y
          const d = Math.hypot(dx, dy)
          if (d > a.L.link) continue
          ctx.strokeStyle = `rgba(${a.q.c},${(1 - d / a.L.link) * 0.22 * a.L.alpha})`
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
        }
      }

      // points, and reach toward the cursor
      for (const s of screen) {
        const dm = Math.hypot(s.x - mouse.x, s.y - mouse.y)
        const near = dm < 170 ? 1 - dm / 170 : 0
        if (near > 0) {
          ctx.strokeStyle = `rgba(${s.q.c},${near * 0.45 * s.L.alpha})`
          ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke()
        }
        const r = s.L.r * (1 + near * 1.2)
        ctx.fillStyle = `rgba(${s.q.c},${Math.min(1, s.L.alpha * (0.55 + near))})`
        ctx.shadowColor = `rgba(${s.q.c},0.9)`
        ctx.shadowBlur = 6 + near * 10
        ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.fill()
      }
      ctx.shadowBlur = 0
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [progress, travel])

  return <canvas ref={ref} className={className} aria-hidden="true" />
}
