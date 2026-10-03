import { useEffect, useRef } from 'react'

/*
  Sparks — gold and orange embers drifting up off the city lights.
  Click anywhere in the hero and they burst from the cursor.
  One canvas, delta-time physics, sleeps when off-screen.
*/

const COLORS = ['245,184,61', '255,138,61', '255,214,140']

function makeSprite(rgb) {
  const s = document.createElement('canvas')
  s.width = s.height = 32
  const g = s.getContext('2d')
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16)
  grad.addColorStop(0, `rgba(${rgb},1)`)
  grad.addColorStop(0.25, `rgba(${rgb},0.55)`)
  grad.addColorStop(1, `rgba(${rgb},0)`)
  g.fillStyle = grad
  g.fillRect(0, 0, 32, 32)
  return s
}

export default function Sparks({ className = '', burstTarget }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = canvas.getContext('2d')
    const sprites = COLORS.map(makeSprite)
    let W = 0, H = 0, dpr = 1
    const mobile = window.innerWidth < 768
    const AMBIENT = reduce ? 0 : mobile ? 22 : 55
    const parts = []

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = canvas.offsetWidth
      H = canvas.offsetHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const ambient = (fresh) => ({
      x: Math.random() * W,
      y: fresh ? H * (0.55 + Math.random() * 0.45) : H * (0.7 + Math.random() * 0.3),
      vx: (Math.random() - 0.5) * 0.15,
      vy: -(0.15 + Math.random() * 0.45),
      life: 1,
      decay: 0.0012 + Math.random() * 0.0025,
      size: 3 + Math.random() * 6,
      sway: Math.random() * Math.PI * 2,
      sprite: sprites[(Math.random() * sprites.length) | 0],
      gravity: 0,
    })
    for (let i = 0; i < AMBIENT; i++) parts.push(ambient(true))

    const burst = (x, y) => {
      if (reduce) return
      for (let i = 0; i < 28; i++) {
        const a = Math.random() * Math.PI * 2
        const sp = 1.2 + Math.random() * 3.2
        parts.push({
          x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.2,
          life: 1, decay: 0.014 + Math.random() * 0.012,
          size: 4 + Math.random() * 7, sway: 0,
          sprite: sprites[(Math.random() * sprites.length) | 0],
          gravity: 0.045, burst: true,
        })
      }
    }
    const host = burstTarget?.current || canvas.parentElement
    const onClick = (e) => {
      if (e.target.closest('a,button')) return
      const r = canvas.getBoundingClientRect()
      burst(e.clientX - r.left, e.clientY - r.top)
    }
    host?.addEventListener('click', onClick)

    let raf, last = performance.now(), visible = true
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting })
    io.observe(canvas)

    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min((now - last) / 16.67, 2.5)
      last = now
      if (!visible || document.hidden) return
      ctx.clearRect(0, 0, W, H)
      ctx.globalCompositeOperation = 'lighter'
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]
        p.sway += 0.02 * dt
        p.vy += p.gravity * dt
        p.x += (p.vx + Math.sin(p.sway) * (p.burst ? 0 : 0.2)) * dt
        p.y += p.vy * dt
        p.life -= p.decay * dt
        if (p.life <= 0 || p.y < -20) {
          if (p.burst) parts.splice(i, 1)
          else parts[i] = ambient(false)
          continue
        }
        const flicker = p.burst ? 1 : 0.75 + Math.sin(now * 0.004 + p.sway * 3) * 0.25
        ctx.globalAlpha = Math.max(0, p.life) * flicker
        const s = p.size
        ctx.drawImage(p.sprite, p.x - s / 2, p.y - s / 2, s, s)
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('resize', resize)
      host?.removeEventListener('click', onClick)
    }
  }, [burstTarget])

  return <canvas ref={ref} className={className} aria-hidden="true" />
}
