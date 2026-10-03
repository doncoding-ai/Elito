import { useEffect, useRef } from 'react'
import { m as motion } from 'motion/react'

/*
  NeonName — the name in bold white, with a neon light (green core, electric
  blue falloff) that rides across the letters wherever the cursor is.
  Letters rise in one by one on load.
*/
const NAME_SIZE = 'text-[clamp(3.6rem,11.5vw,10.5rem)]'

// trigger: 'mount' plays on page load (hero); 'view' plays when scrolled into view
export default function NeonName({ lines, delay = 0.25, sizeClass = NAME_SIZE, trigger = 'mount', as: Tag = 'h1' }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - r.left}px`)
      el.style.setProperty('--my', `${e.clientY - r.top}px`)
      el.style.setProperty('--glow', '1')
    }
    const onLeave = () => el.style.setProperty('--glow', '0')
    window.addEventListener('pointermove', onMove)
    document.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  let i = 0
  const letters = (text, lineIdx) =>
    text.split('').map((ch) => {
      const d = delay + i++ * 0.035 + lineIdx * 0.08
      return (
        <span key={`${lineIdx}-${i}`} className="inline-block overflow-hidden pb-[0.08em] align-top">
          <motion.span
            className="inline-block"
            variants={{ hidden: { y: '110%', rotate: 6 }, show: { y: '0%', rotate: 0 } }}
            transition={{ type: 'spring', stiffness: 260, damping: 24, delay: d }}
          >
            {ch === ' ' ? ' ' : ch}
          </motion.span>
        </span>
      )
    })

  const text = (
    <>
      {lines.map((l, idx) => (
        <span key={l} className="block whitespace-nowrap">{letters(l, idx)}</span>
      ))}
    </>
  )

  // The heading itself decides when to play (a clipped letter never counts as "in view")
  const M = Tag === 'h2' ? motion.h2 : motion.h1
  return (
    <M
      ref={ref}
      initial="hidden"
      {...(trigger === 'view' ? { whileInView: 'show', viewport: { once: true, amount: 0.3 } } : { animate: 'show' })}
      className={`relative font-display ${sizeClass} font-extrabold uppercase leading-[0.88] tracking-[-0.045em] text-mist`}
      style={{ '--mx': '60%', '--my': '40%', '--glow': '0' }}
    >
      <span className="sr-only">{lines.join(' ')}</span>
      <span aria-hidden="true">{text}</span>
      {/* Neon pass: same letters, lit only near the cursor */}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
        transition={{ delay: delay + 1.1, duration: 0.6 }}
      >
      <span
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(260px circle at var(--mx) var(--my), #39FF88 0%, #2F8BFF 38%, rgba(47,139,255,0) 70%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          opacity: 'var(--glow)',
          transition: 'opacity .4s ease',
          filter: 'drop-shadow(0 0 22px rgba(47,139,255,0.55)) drop-shadow(0 0 6px rgba(57,255,136,0.5))',
        }}
      >
        {lines.map((l) => (
          <span key={l} className="block whitespace-nowrap">
            {l.split('').map((ch, k) => (
              <span key={k} className="inline-block pb-[0.08em] align-top">{ch === ' ' ? ' ' : ch}</span>
            ))}
          </span>
        ))}
      </span>
      </motion.span>
    </M>
  )
}
