import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { m as motion, AnimatePresence } from 'motion/react'
import { EASE_OUT } from '../motion'
import { MaskTitle } from './HowILead'
import CaseFlow from './CaseFlows'

/*
  Case studies — three expanding panels.
  Desktop: the open case fills the row; the other two fold into slim strips
  you click to swap. Inside, the problem / what I did / result, a live
  architecture sketch, and the numbers. Phones and tablets get an accordion.
*/

const HEX = { blue: '#2F8BFF', green: '#39FF88', gold: '#F5B83D' }
const STRIP = 104
const GAP = 12
const PANEL_SPRING = { type: 'spring', stiffness: 170, damping: 26, mass: 0.9 }

function useWide() {
  const [wide, setWide] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const on = () => setWide(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return wide
}

/* Soft light that follows the cursor inside a panel */
const spot = (e) => {
  const r = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty('--sx', `${e.clientX - r.left}px`)
  e.currentTarget.style.setProperty('--sy', `${e.clientY - r.top}px`)
}

function Label({ children, color }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.26em]" style={{ color }}>
      {children}
    </p>
  )
}

/* The body of an open case — shared by the desktop panel and the phone accordion */
function CaseBody({ c, compact }) {
  const col = HEX[c.accent]
  const rise = (i) => ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, ease: EASE_OUT, delay: 0.18 + i * 0.07 },
  })
  return (
    <div className="flex h-full flex-col">
      {!compact && (
        <>
          <motion.div {...rise(0)} className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.24em]" style={{ color: col }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: col, boxShadow: `0 0 10px ${col}` }} />
            {c.company}
            <span className="font-medium normal-case tracking-normal text-slate">{c.years}</span>
          </motion.div>
          <motion.h3 {...rise(1)} className="mt-3 max-w-[22ch] font-display text-[clamp(1.7rem,2.6vw,2.4rem)] font-bold leading-[1.08] tracking-[-0.025em] text-mist [text-wrap:balance]">
            {c.title}
          </motion.h3>
        </>
      )}
    <div className={compact ? 'grid gap-7' : 'mt-7 grid flex-1 grid-cols-[1fr_1.08fr] gap-9'}>
      <div className="flex min-w-0 flex-col">
        <motion.div {...rise(2)}>
          <Label color="#8A94A6">The problem</Label>
          <p className="mt-2 text-[15px] leading-relaxed text-mist/80">{c.problem}</p>
        </motion.div>
        <motion.div {...rise(3)} className="mt-6">
          <Label color="#8A94A6">What I did</Label>
          <ul className="mt-3 grid gap-2.5">
            {c.did.map((d) => (
              <li key={d} className="flex gap-3 text-[14.5px] leading-relaxed text-mist/80">
                <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: col }} />
                {d}
              </li>
            ))}
          </ul>
        </motion.div>
        <motion.div {...rise(6)} className={`flex flex-wrap gap-2 ${compact ? 'mt-6' : 'mt-auto pt-6'}`}>
          {c.stack.map((s) => (
            <span key={s} className="rounded-full border border-mist/15 px-3 py-1 text-[12px] font-medium text-mist/80">{s}</span>
          ))}
        </motion.div>
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.25 }}
          className="rounded-2xl border border-white/[0.07] bg-black/35 px-4 py-3 sm:px-5"
        >
          <CaseFlow kind={c.flow} accent={c.accent} />
        </motion.div>
        <motion.div {...rise(4)} className="rounded-2xl border px-4 py-3.5" style={{ borderColor: `${col}40`, background: `linear-gradient(90deg, ${col}12, transparent)` }}>
          <Label color={col}>The result</Label>
          <p className="mt-1.5 text-[15px] font-medium leading-relaxed text-mist">{c.result}</p>
        </motion.div>
        <motion.div {...rise(5)} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${c.metrics.length}, minmax(0, 1fr))` }}>
          {c.metrics.map((m) => (
            <div key={m.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
              <p className="font-display text-[1.9rem] font-extrabold leading-none tracking-tight text-gold [text-shadow:0_0_20px_rgba(245,184,61,0.3)]">{m.value}</p>
              <p className="mt-2 text-[12.5px] leading-snug text-slate">{m.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
    </div>
  )
}

/* Desktop: panels in a row */
function Panels({ items, open, setOpen }) {
  const row = useRef(null)
  const [w, setW] = useState(1100)
  useLayoutEffect(() => {
    const el = row.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.offsetWidth))
    ro.observe(el)
    setW(el.offsetWidth)
    return () => ro.disconnect()
  }, [])
  const openW = w - (items.length - 1) * (STRIP + GAP)

  return (
    <div ref={row} className="flex h-[700px]" style={{ gap: GAP }}>
      {items.map((c, i) => {
        const isOpen = i === open
        const col = HEX[c.accent]
        return (
          <motion.div
            key={c.key}
            onPointerMove={spot}
            animate={{ width: isOpen ? openW : STRIP }}
            initial={false}
            transition={PANEL_SPRING}
            className="group relative shrink-0 overflow-hidden rounded-[28px] border bg-[#0B1122]"
            style={{
              borderColor: isOpen ? `${col}55` : 'rgba(255,255,255,0.08)',
              boxShadow: isOpen ? `0 40px 100px -40px ${col}55` : 'none',
            }}
          >
            {/* cursor light + accent haze */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(600px circle at var(--sx, 70%) var(--sy, 20%), ${col}1c, transparent 50%)` }} />
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-10 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${col}, transparent)`, opacity: isOpen ? 1 : 0.35 }} />

            {/* folded strip: the whole strip is the button */}
            {!isOpen && (
              <button
                type="button"
                onClick={() => setOpen(i)}
                aria-expanded="false"
                aria-controls={`case-${c.key}`}
                className="absolute inset-0 flex flex-col items-center justify-between py-8 text-left transition-colors hover:bg-white/[0.03]"
              >
                <span className="h-2 w-2 rounded-full transition-transform group-hover:scale-150" style={{ background: col, boxShadow: `0 0 12px ${col}` }} />
                <span
                  className="font-display text-[19px] font-bold tracking-[-0.01em] text-mist/85 transition-colors group-hover:text-mist"
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                >
                  {c.short}
                </span>
                <span
                  className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate"
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                >
                  {c.company.split(' ')[0]} · {c.years.split(' ')[0]}
                </span>
              </button>
            )}

            {/* open content, laid out at the final width so text never reflows mid-animation */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  id={`case-${c.key}`}
                  key="body"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  className="absolute inset-y-0 left-0 px-10 py-9"
                  style={{ width: openW }}
                >
                  <CaseBody c={c} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}

/* Phones and tablets: an accordion */
function Accordion({ items, open, setOpen }) {
  return (
    <div className="grid gap-3">
      {items.map((c, i) => {
        const isOpen = i === open
        const col = HEX[c.accent]
        return (
          <div
            key={c.key}
            className="overflow-hidden rounded-[24px] border bg-[#0B1122]"
            style={{ borderColor: isOpen ? `${col}55` : 'rgba(255,255,255,0.08)' }}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              aria-controls={`case-m-${c.key}`}
              className="flex w-full items-start gap-4 p-5 text-left"
            >
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full" style={{ background: col, boxShadow: `0 0 12px ${col}` }} />
              <span className="flex-1">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: col }}>
                  {c.company} · {c.years}
                </span>
                <span className="mt-1.5 block font-display text-[1.3rem] font-bold leading-snug tracking-[-0.02em] text-mist">{c.title}</span>
              </span>
              <motion.span
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-mist/20 text-lg leading-none text-mist"
                aria-hidden="true"
              >
                +
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`case-m-${c.key}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.45, ease: EASE_OUT }}
                >
                  <div className="px-5 pb-6">
                    <CaseBody c={c} compact />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

export default function CaseStudies({ story }) {
  const { eyebrow, title, intro, items } = story.cases
  const [open, setOpen] = useState(0)
  const wide = useWide()

  return (
    <section id="cases" className="relative py-24 md:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/3 h-2/3"
        style={{ background: 'radial-gradient(45% 50% at 50% 50%, rgba(47,139,255,0.08), transparent)' }}
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

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: EASE_OUT }}
          className="mt-14 md:mt-16"
        >
          {wide ? <Panels items={items} open={open} setOpen={setOpen} /> : <Accordion items={items} open={open} setOpen={setOpen} />}
        </motion.div>
      </div>
    </section>
  )
}
