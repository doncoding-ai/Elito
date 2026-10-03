import { useEffect, useRef, useState } from 'react'
import { m as motion, useScroll, useTransform, useMotionValue, useSpring, useMotionTemplate } from 'motion/react'
import { EASE_OUT } from '../motion'
import LeadVisual from './LeadVisuals'

/*
  How I lead — four principles as a stack of 3D cards.
  Scroll: each card pins, and the next one slides up over it; the cards
  underneath shrink back and dim, so the stack builds as you read.
  Cursor: the card under the pointer tilts toward it with a light glare.
*/

const HEX = { blue: '#2F8BFF', green: '#39FF88' }

/* Scroll progress through an element, measured in pixels (the same fix as
   the hero: Motion's target-based scroll maths drifts around sticky layouts). */
export function usePixelProgress(ref, topOffset = 0) {
  const { scrollY } = useScroll()
  const [range, setRange] = useState([0, 1])
  useEffect(() => {
    const measure = () => {
      const el = ref.current
      if (!el) return
      const top = el.getBoundingClientRect().top + window.scrollY - topOffset
      const end = top + el.offsetHeight - window.innerHeight
      setRange([top, Math.max(top + 1, end)])
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(document.body)
    window.addEventListener('resize', measure)
    return () => { ro.disconnect(); window.removeEventListener('resize', measure) }
  }, [ref, topOffset])
  return useTransform(scrollY, (v) => Math.min(1, Math.max(0, (v - range[0]) / (range[1] - range[0]))))
}

/* A title whose words rise out of a mask as it enters */
export function MaskTitle({ text, className }) {
  const words = text.split(' ')
  return (
    <motion.h2
      initial="off"
      whileInView="on"
      viewport={{ once: true, amount: 0.6 }}
      transition={{ staggerChildren: 0.06 }}
      className={className}
    >
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.1em] align-top">
          <motion.span
            className="inline-block"
            variants={{ off: { y: '105%' }, on: { y: '0%' } }}
            transition={{ duration: 0.8, ease: EASE_OUT }}
          >
            {w}&nbsp;
          </motion.span>
        </span>
      ))}
    </motion.h2>
  )
}

function TiltCard({ children, accent }) {
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 180, damping: 20 })
  const sry = useSpring(ry, { stiffness: 180, damping: 20 })
  const gx = useMotionValue(50)
  const gy = useMotionValue(30)
  const glare = useMotionTemplate`radial-gradient(520px circle at ${gx}% ${gy}%, ${HEX[accent]}26, transparent 55%)`
  const [fine, setFine] = useState(false)
  useEffect(() => setFine(window.matchMedia('(pointer: fine)').matches), [])

  const onMove = (e) => {
    if (!fine) return
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    ry.set((px - 0.5) * 9)
    rx.set(-(py - 0.5) * 7)
    gx.set(px * 100)
    gy.set(py * 100)
  }
  const onLeave = () => { rx.set(0); ry.set(0) }

  return (
    <div style={{ perspective: 1400 }}>
      <motion.article
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={{ rotateX: srx, rotateY: sry, transformStyle: 'preserve-3d' }}
        className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0B1122] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
      >
        {/* cursor glare */}
        <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: glare }} />
        {/* accent edge along the top */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${HEX[accent]}, transparent)` }}
        />
        {children}
      </motion.article>
    </div>
  )
}

function Card({ p, i, n, progress, stack }) {
  // Cards underneath shrink and dim as later ones stack on top.
  const start = i / n
  const target = 1 - (n - 1 - i) * 0.045
  const scale = useTransform(progress, [start, 1], [1, target])
  const dim = useTransform(progress, [start, Math.min(1, start + 1 / n)], [0, i === n - 1 ? 0 : 0.45])
  const c = HEX[p.accent]

  return (
    <div
      className={stack ? `sticky ${i === n - 1 ? '' : 'mb-[28svh]'}` : 'relative mb-6'}
      style={stack ? { top: `calc(max(84px, 11svh) + ${i * 18}px)` } : undefined}
    >
      <motion.div style={stack ? { scale, transformOrigin: 'top center' } : undefined}>
        <TiltCard accent={p.accent}>
          <div className="relative grid gap-8 p-6 sm:p-9 md:grid-cols-[1.1fr_1fr] md:gap-12 md:p-12">
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-semibold uppercase tracking-[0.24em]" style={{ color: c }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: c, boxShadow: `0 0 10px ${c}` }} />
                {p.label}
                <span className="w-full font-medium normal-case tracking-normal text-slate sm:ml-auto sm:w-auto">{p.where}</span>
              </div>
              <h3 className="mt-5 font-display text-[clamp(1.6rem,3.2vw,2.6rem)] font-bold leading-[1.08] tracking-[-0.025em] text-mist [text-wrap:balance]">
                {p.title}
              </h3>
              <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-mist/75 md:text-[16px]">{p.proof}</p>
              <div className="mt-auto flex items-baseline gap-3 pt-7">
                <span className="font-display text-[clamp(2.4rem,4.4vw,3.4rem)] font-extrabold leading-none tracking-tight text-gold [text-shadow:0_0_24px_rgba(245,184,61,0.35)]">
                  {p.stat.value}
                </span>
                <span className="text-sm font-medium text-slate">{p.stat.label}</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-black/30 p-5 sm:p-6 md:self-center">
              <LeadVisual kind={p.visual} accent={p.accent} data={p} />
            </div>
          </div>
        </TiltCard>
      </motion.div>
      {stack && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[28px] bg-black"
          style={{ opacity: dim, scale, transformOrigin: 'top center' }}
        />
      )}
    </div>
  )
}

export default function HowILead({ story }) {
  const { eyebrow, title, intro, principles } = story.lead
  const track = useRef(null)
  const progress = usePixelProgress(track, 84)
  // Stack the cards only on screens tall and wide enough to show a whole card.
  const [stack, setStack] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px) and (min-height: 640px)')
    const on = () => setStack(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  return (
    <section id="lead" className="relative pb-16 pt-24 md:pt-32">
      {/* a faint blue-green haze behind the stack */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-40 h-[70%] opacity-60"
        style={{ background: 'radial-gradient(50% 40% at 30% 30%, rgba(47,139,255,0.12), transparent), radial-gradient(40% 35% at 75% 65%, rgba(57,255,136,0.08), transparent)' }}
      />
      <div className="relative mx-auto max-w-6xl px-5 md:px-10">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          className="mb-4 flex items-center gap-3 text-[13px] font-medium uppercase tracking-[0.28em] text-green"
        >
          <span className="h-px w-8 bg-green/60" />
          {eyebrow}
        </motion.p>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <MaskTitle
            text={title}
            className="max-w-3xl font-display text-[clamp(2.1rem,5vw,3.6rem)] font-bold leading-[1.05] tracking-[-0.03em] text-mist"
          />
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="max-w-xs text-[15px] leading-relaxed text-slate"
          >
            {intro}
          </motion.p>
        </div>

        <div ref={track} className="relative mt-14 md:mt-20">
          {principles.map((p, i) => (
            <Card key={p.key} p={p} i={i} n={principles.length} progress={progress} stack={stack} />
          ))}
          {/* room for the last card to pin before the stack scrolls away
              (a spacer, not padding: sticky stops at the content edge) */}
          {stack && <div aria-hidden="true" className="h-[32svh]" />}
        </div>
      </div>
    </section>
  )
}
