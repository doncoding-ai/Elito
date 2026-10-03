import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { m as motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from 'motion/react'
import { EASE_OUT } from '../motion'
import { MaskTitle, usePixelProgress } from './HowILead'
import DataField from './DataField'

// same WebGL aurora as the hero, fetched only when the Journey is on a desktop screen
const Aurora = lazy(() => import('./Aurora'))

/*
  Journey — the career as a line that climbs.
  Desktop: the section pins and the path slides sideways as you scroll,
  drawing a glowing line up through each step; steps light up as the line
  reaches them, and a click opens the full detail. Phones: a vertical rail
  that fills as you scroll. Everything comes from profile.json, so a new CV
  updates this section on its own.
*/

const STEP = 360
const X0 = 360
const CARD_W = 290

/* profile.json → chronological steps, degree first */
function toSteps(profile) {
  const jobs = [...profile.experience].reverse().map((e) => {
    const [role, sub] = e.role.split(/\s+[–-]\s+/)
    return {
      key: `${e.company}-${e.period}`,
      period: e.period.replace('—', '–'),
      year: (e.period.match(/\d{4}/) || [''])[0],
      role,
      sub,
      company: e.company,
      tag: e.tag,
      bullets: e.bullets || [],
      stack: e.stack || [],
      now: /present/i.test(e.period),
    }
  })
  const ed = profile.education
  const first = ed
    ? [{
        key: 'education',
        period: ed.period.replace('—', '–'),
        year: (ed.period.match(/\d{4}/) || [''])[0],
        role: ed.degree,
        company: ed.school,
        tag: 'FOUNDATION',
        bullets: [],
        stack: [],
      }]
    : []
  return [...first, ...jobs]
}

function useDesktop() {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px) and (min-height: 640px)')
    const f = () => setOn(mq.matches)
    f()
    mq.addEventListener('change', f)
    return () => mq.removeEventListener('change', f)
  }, [])
  return on
}

/* Smooth path through points (Catmull-Rom → cubic Bézier) */
function smoothPath(pts) {
  if (!pts.length) return ''
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${p2[0]} ${p2[1]}`
  }
  return d
}

function Header({ compact }) {
  return (
    <div className={compact ? '' : 'max-w-xl'}>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        className="mb-4 flex items-center gap-3 text-[13px] font-medium uppercase tracking-[0.28em] text-green"
      >
        <span className="h-px w-8 bg-green/60" />
        Journey
      </motion.p>
      <MaskTitle
        text="From auditing data to running the platforms behind it."
        className="font-display text-[clamp(2rem,3.6vw,3.1rem)] font-bold leading-[1.06] tracking-[-0.03em] text-mist [text-wrap:balance]"
      />
      <p className="mt-4 text-[15px] text-slate">{compact ? 'Tap any step for the detail.' : 'Scroll to climb. Click any step for the detail.'}</p>
    </div>
  )
}

/* The detail for one step: bullets and tools */
function Detail({ s, head = true }) {
  return (
    <>
      {head && (
        <>
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-green">{s.period}</p>
          <h4 className="mt-2 font-display text-xl font-bold leading-snug tracking-[-0.02em] text-mist">{s.role}</h4>
          <p className="text-sm text-slate">{[s.sub, s.company].filter(Boolean).join(' · ')}</p>
        </>
      )}
      {!head && s.sub && <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-slate">{s.sub}</p>}
      {s.bullets.length > 0 && (
        <ul className={`${head || s.sub ? 'mt-4' : ''} grid gap-2.5`}>
          {s.bullets.map((b) => (
            <li key={b} className="flex gap-3 text-[14px] leading-relaxed text-mist/80">
              <span className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full bg-blue" />
              {b}
            </li>
          ))}
        </ul>
      )}
      {s.stack.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {s.stack.map((t) => (
            <span key={t} className="rounded-full border border-mist/15 px-3 py-1 text-[12px] font-medium text-mist/80">{t}</span>
          ))}
        </div>
      )}
    </>
  )
}

/* ---------------- Desktop: pinned, sideways climb ---------------- */
function Climb({ steps }) {
  const section = useRef(null)
  const [vw, setVw] = useState(1440)
  const [vh, setVh] = useState(900)
  useEffect(() => {
    const m = () => { setVw(window.innerWidth); setVh(window.innerHeight) }
    m()
    window.addEventListener('resize', m)
    return () => window.removeEventListener('resize', m)
  }, [])

  const n = steps.length
  const xLast = X0 + (n - 1) * STEP
  const front = 0.66 * vw
  const travel = Math.max(0, xLast - front + 40)
  const trackW = xLast + CARD_W + 120

  // node heights: the line climbs from 86% of the stage to 38%
  const pts = steps.map((_, i) => [X0 + i * STEP, vh * (0.86 - (0.48 * i) / Math.max(1, n - 1))])
  const d = useMemo(() => smoothPath(pts), [vh, n]) // eslint-disable-line react-hooks/exhaustive-deps

  const p = usePixelProgress(section, 0)
  const x = useTransform(p, (v) => -v * travel)
  const draw = useTransform(p, (v) => Math.min(1, Math.max(0.001, (front + v * travel - X0) / (xLast - X0))))
  // the glow under the line is revealed up to wherever the line has reached
  const fillW = useTransform(draw, (v) => X0 + v * (xLast - X0))
  const area = `${d} L ${xLast} ${vh} L ${X0} ${vh} Z`

  const [active, setActive] = useState(0)
  const pick = (v) => {
    const frontX = front + v * travel
    let k = 0
    pts.forEach(([px], i) => { if (px <= frontX + 1) k = i })
    setActive(k)
  }
  useMotionValueEvent(p, 'change', pick)
  useEffect(() => pick(p.get()), [vw, vh]) // eslint-disable-line react-hooks/exhaustive-deps

  const [open, setOpen] = useState(null)
  const year = steps[active]?.now ? 'Now' : steps[active]?.year

  return (
    <section id="journey" ref={section} className="relative" style={{ height: vh + travel * 1.15 }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* a live sky: the aurora across the top, fading into the dark */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[62%] opacity-60 mix-blend-screen [mask-image:linear-gradient(to_bottom,#000_30%,transparent_100%)]"
        >
          <Suspense fallback={null}>
            <Aurora className="h-full w-full" amplitude={1.05} blend={0.45} />
          </Suspense>
        </div>
        {/* data points drifting past in three depths as you scroll */}
        <DataField progress={p} travel={travel} className="pointer-events-none absolute inset-0 h-full w-full" />

        {/* the big year behind the chart */}
        <div aria-hidden="true" className="pointer-events-none absolute bottom-[6%] right-[4vw] select-none">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={year}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
              className="block font-display text-[clamp(7rem,16vw,15rem)] font-extrabold leading-none tracking-[-0.05em] text-transparent"
              style={{ WebkitTextStroke: '1.5px rgba(238,242,247,0.09)' }}
            >
              {year}
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="relative z-20 mx-auto max-w-6xl px-10 pt-[max(104px,13svh)]">
          <Header />
        </div>

        {/* the moving track: line, nodes, cards */}
        <motion.div className="absolute inset-y-0 left-0 z-10" style={{ x, width: trackW }}>
          <svg width={trackW} height={vh} className="absolute inset-0" aria-hidden="true">
            <defs>
              <linearGradient id="journey-line" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="#2F8BFF" />
                <stop offset="1" stopColor="#39FF88" />
              </linearGradient>
              <linearGradient id="journey-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#39FF88" stopOpacity="0.34" />
                <stop offset="0.5" stopColor="#2F8BFF" stopOpacity="0.12" />
                <stop offset="1" stopColor="#2F8BFF" stopOpacity="0" />
              </linearGradient>
              <clipPath id="journey-clip">
                <motion.rect x="0" y="0" height={vh} width={fillW} />
              </clipPath>
            </defs>
            {/* the area under the climb, filling in as the line draws */}
            <path d={area} fill="url(#journey-fill)" clipPath="url(#journey-clip)" />
            {/* the road ahead, faint */}
            <path d={d} fill="none" stroke="rgba(238,242,247,0.12)" strokeWidth="2" strokeDasharray="3 7" />
            {/* the road travelled */}
            <motion.path
              d={d}
              fill="none"
              stroke="url(#journey-line)"
              strokeWidth="3"
              strokeLinecap="round"
              style={{ pathLength: draw, filter: 'drop-shadow(0 0 10px rgba(57,255,136,0.55))' }}
            />
          </svg>

          {steps.map((s, i) => {
            const [px, py] = pts[i]
            const lit = i <= active
            const above = py > vh * 0.62 // low steps: card above-left; high steps: card below-right
            return (
              <div key={s.key}>
                {/* node */}
                <div className="absolute" style={{ left: px, top: py }}>
                  {s.now && lit && (
                    <span className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-green/30" />
                  )}
                  <motion.span
                    className="absolute left-1/2 top-1/2 block h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                    animate={{
                      scale: lit ? 1 : 0.75,
                      backgroundColor: lit ? '#39FF88' : '#0A0F1F',
                      borderColor: lit ? '#39FF88' : 'rgba(238,242,247,0.3)',
                      boxShadow: lit ? '0 0 18px rgba(57,255,136,0.8)' : '0 0 0 rgba(0,0,0,0)',
                    }}
                    transition={{ duration: 0.35 }}
                  />
                </div>
                {/* card */}
                <motion.button
                  type="button"
                  onClick={() => setOpen(i)}
                  disabled={!s.bullets.length}
                  aria-haspopup="dialog"
                  className="group absolute rounded-2xl border bg-[#0B1122]/90 p-5 text-left backdrop-blur-md transition-colors enabled:hover:border-green/50 disabled:cursor-default"
                  style={{
                    width: CARD_W,
                    left: above ? px - CARD_W + 24 : px - 24,
                    ...(above ? { bottom: vh - py + 26 } : { top: py + 26 }),
                  }}
                  animate={{
                    opacity: lit ? 1 : 0.28,
                    y: lit ? 0 : above ? 14 : -14,
                    borderColor: s.now && lit ? 'rgba(57,255,136,0.55)' : 'rgba(255,255,255,0.09)',
                  }}
                  transition={{ duration: 0.5, ease: EASE_OUT }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-green">{s.period}</span>
                    {s.now ? (
                      <span className="rounded-full bg-green px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">Now</span>
                    ) : (
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate">{s.tag}</span>
                    )}
                  </div>
                  <p className="mt-2 font-display text-[1.15rem] font-bold leading-snug tracking-[-0.015em] text-mist">{s.role}</p>
                  <p className="mt-0.5 text-[13.5px] text-slate">{s.company}</p>
                  {s.bullets.length > 0 && (
                    <span className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-blue transition-colors group-hover:text-green">
                      See what I did <span aria-hidden="true">→</span>
                    </span>
                  )}
                </motion.button>
              </div>
            )
          })}
        </motion.div>

        {/* detail drawer */}
        <AnimatePresence>
          {open !== null && (
            <>
              <motion.div
                key="scrim"
                className="absolute inset-0 z-30 bg-black/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(null)}
              />
              <motion.aside
                key="drawer"
                role="dialog"
                aria-label={`${steps[open].role} details`}
                className="absolute right-6 top-24 z-40 max-h-[calc(100svh-120px)] w-[min(460px,40vw)] overflow-y-auto rounded-3xl border border-white/10 bg-[#0B1122]/95 p-7 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl"
                initial={{ x: 60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 60, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(null)}
                  className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full border border-mist/20 text-mist transition-colors hover:border-green hover:text-green"
                  aria-label="Close"
                >
                  ✕
                </button>
                <Detail s={steps[open]} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

/* ---------------- Phones and tablets: vertical rail ---------------- */
function Rail({ steps }) {
  const list = useRef(null)
  // the rail fills as the list passes the middle of the screen (plain page flow, no pinning)
  const { scrollYProgress: fill } = useScroll({ target: list, offset: ['start 0.6', 'end 0.6'] })
  const [open, setOpen] = useState(null)

  return (
    <section id="journey" className="relative py-24">
      <div className="mx-auto max-w-2xl px-5">
        <Header compact />
        <div ref={list} className="relative mt-12 pl-9">
          <span className="absolute bottom-2 left-[7px] top-2 w-[2px] rounded-full bg-mist/10" />
          <motion.span
            className="absolute bottom-2 left-[7px] top-2 w-[2px] origin-top rounded-full"
            style={{ scaleY: fill, background: 'linear-gradient(#2F8BFF, #39FF88)', boxShadow: '0 0 10px rgba(57,255,136,0.6)' }}
          />
          <div className="grid gap-5">
            {steps.map((s, i) => {
              const isOpen = open === i
              return (
                <motion.div
                  key={s.key}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.5, ease: EASE_OUT }}
                  className="relative"
                >
                  <span
                    className="absolute -left-9 top-6 h-4 w-4 rounded-full border-2 border-green bg-green"
                    style={{ boxShadow: '0 0 14px rgba(57,255,136,0.7)' }}
                  />
                  <div className={`rounded-2xl border bg-[#0B1122] ${s.now ? 'border-green/50' : 'border-white/[0.09]'}`}>
                    <button
                      type="button"
                      disabled={!s.bullets.length}
                      onClick={() => setOpen(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      className="w-full p-5 text-left"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-green">{s.period}</span>
                        {s.now ? (
                          <span className="rounded-full bg-green px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">Now</span>
                        ) : (
                          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate">{s.tag}</span>
                        )}
                      </div>
                      <p className="mt-2 font-display text-[1.15rem] font-bold leading-snug text-mist">{s.role}</p>
                      <p className="text-[13.5px] text-slate">{s.company}</p>
                      {s.bullets.length > 0 && (
                        <span className="mt-2 inline-block text-[12.5px] font-semibold text-blue">{isOpen ? 'Show less' : 'See what I did'}</span>
                      )}
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.4, ease: EASE_OUT }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-white/[0.07] px-5 pb-5 pt-4">
                            <Detail s={s} head={false} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Journey({ profile }) {
  const steps = useMemo(() => toSteps(profile), [profile])
  const desktop = useDesktop()
  return desktop ? <Climb steps={steps} /> : <Rail steps={steps} />
}
