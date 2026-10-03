import { useEffect, useRef, useState } from 'react'
import { m as motion, animate, useInView, useReducedMotion } from 'motion/react'
import { EASE_OUT, SPRING, enter } from '../motion'

/* A number that counts up the first time it's seen */
function CountUp({ value, suffix }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(reduce ? value : 0)

  useEffect(() => {
    if (!inView || reduce) return
    const controls = animate(0, value, {
      duration: 1.3,
      ease: EASE_OUT,
      onUpdate: (v) => setShown(Math.round(v)),
    })
    return () => controls.stop()
  }, [inView, value, reduce])

  return (
    <span ref={ref} className="tabular-nums">
      {shown}
      <span className="text-gold">{suffix}</span>
    </span>
  )
}

/* Glass tile: lifts on hover, with a soft light that follows the cursor */
function Tile({ className = '', children }) {
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
  }
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.7, ease: EASE_OUT }}
      whileHover={{ y: -4, transition: SPRING }}
      onPointerMove={onMove}
      className={`glass group relative overflow-hidden rounded-3xl p-6 transition-colors duration-300 hover:border-white/20 md:p-7 ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: 'radial-gradient(380px circle at var(--mx) var(--my), rgba(57,255,136,0.08), transparent 45%)' }}
      />
      <div className="relative">{children}</div>
    </motion.div>
  )
}

const ARC = ['Quality auditor', 'Data modeler', 'Data architect', 'Data engineer', 'Senior data engineer']

export default function Impact({ profile }) {
  const { telemetry, currently } = profile

  return (
    <section id="impact" className="relative mx-auto max-w-6xl px-6 pb-28 pt-10 md:px-10">
      <motion.p {...enter} className="mb-4 text-[13px] font-medium uppercase tracking-[0.28em] text-green">
        Impact
      </motion.p>
      <motion.h2
        {...enter}
        className="max-w-2xl font-display text-[clamp(2rem,4.4vw,3rem)] font-bold leading-[1.1] tracking-[-0.02em]"
      >
        Five years of platforms, measured in production.
      </motion.h2>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        transition={{ staggerChildren: 0.08 }}
        className="mt-12 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4"
      >
        {telemetry.map((t) => (
          <Tile key={t.label}>
            <div className="font-display text-[clamp(2.4rem,5vw,3.5rem)] font-extrabold leading-none tracking-tight">
              <CountUp value={t.value} suffix={t.suffix} />
            </div>
            <p className="mt-4 text-[15px] font-semibold text-mist">{t.label}</p>
            <p className="mt-1 text-sm leading-snug text-slate">{t.detail}</p>
          </Tile>
        ))}

        {/* Currently */}
        <Tile className="col-span-2">
          <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.22em] text-green">
            <span className="h-1.5 w-1.5 rounded-full bg-green" />
            Currently · since {currently.since}
          </div>
          <p className="mt-4 font-display text-2xl font-bold tracking-tight">{currently.company}</p>
          <p className="text-sm text-slate">{currently.role}</p>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-mist/85">{currently.line}</p>
        </Tile>

        {/* Career arc */}
        <Tile className="col-span-2">
          <p className="text-[12px] font-medium uppercase tracking-[0.22em] text-gold">The arc</p>
          <ol className="relative mt-5 space-y-3 pl-6">
            <motion.span
              className="absolute left-[5px] top-2 bottom-2 w-px origin-top bg-gradient-to-b from-slate/40 to-gold"
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 1.2, ease: EASE_OUT, delay: 0.2 }}
            />
            {ARC.map((step, i) => {
              const last = i === ARC.length - 1
              return (
                <li key={step} className="relative flex items-center gap-3 text-[15px]">
                  <span
                    className={`absolute -left-6 h-[11px] w-[11px] rounded-full border-2 ${
                      last ? 'border-gold bg-gold' : 'border-slate/60 bg-night'
                    }`}
                  />
                  <span className={last ? 'font-semibold text-mist' : 'text-slate'}>{step}</span>
                </li>
              )
            })}
          </ol>
        </Tile>
      </motion.div>
    </section>
  )
}
