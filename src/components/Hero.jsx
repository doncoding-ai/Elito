import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { m as motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring, animate, useReducedMotion } from 'motion/react'
import Sparks from './Sparks'
import NeonName from './NeonName'
import Magnet from './Magnet'
import { EASE_OUT } from '../motion'
import city from '../assets/nairobi-night.webp'
import citySm from '../assets/nairobi-night-sm.webp'
import portrait from '../assets/elijah.webp'
import portraitSm from '../assets/elijah-sm.webp'

// The WebGL aurora (and its library) loads after the first paint, so the photo, name and buttons show first
const Aurora = lazy(() => import('./Aurora'))

const BASE = import.meta.env.BASE_URL

/* Rotating line under the name — factual, from the CV */
function RoleRotator({ roles }) {
  const [i, setI] = useState(0)
  const reduce = useReducedMotion()
  useEffect(() => {
    if (reduce || roles.length < 2) return
    const t = setInterval(() => setI((v) => (v + 1) % roles.length), 2800)
    return () => clearInterval(t)
  }, [roles.length, reduce])
  return (
    <span className="relative inline-flex h-[1.4em] overflow-hidden align-bottom">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={roles[i]}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 26 }}
          className="whitespace-nowrap bg-gradient-to-r from-green to-blue bg-clip-text text-transparent"
        >
          {roles[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

/* Count-up for the hero stats */
function Stat({ value, suffix, label, delay }) {
  const [n, setN] = useState(0)
  const reduce = useReducedMotion()
  useEffect(() => {
    if (reduce) { setN(value); return }
    const c = animate(0, value, { duration: 1.6, delay, ease: EASE_OUT, onUpdate: (v) => setN(Math.round(v)) })
    return () => c.stop()
  }, [value, delay, reduce])
  return (
    <div>
      <div className="font-display text-3xl font-extrabold tabular-nums tracking-tight text-mist md:text-4xl">
        {n}<span className="text-gold">{suffix}</span>
      </div>
      <div className="mt-1 max-w-[11rem] text-[13px] leading-snug text-slate">{label}</div>
    </div>
  )
}

export default function Hero({ profile }) {
  const section = useRef(null)
  const stage = useRef(null)
  const { identity, telemetry } = profile
  const roles = identity.roles?.length ? identity.roles : [identity.headline]

  /* ---- scroll: fly into the city ----
     Progress is computed from window scroll in pixels (not a target-based
     scroll timeline, which mis-maps inside a sticky section). */
  const { scrollY } = useScroll()
  const [travel, setTravel] = useState(1)
  useEffect(() => {
    const measure = () => {
      const s = section.current
      if (s) setTravel(Math.max(1, s.offsetHeight - window.innerHeight))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
  const p = useTransform(scrollY, (v) => Math.min(1, Math.max(0, v / travel)))
  const cityScale = useTransform(p, [0, 1], [1, 1.55])
  const cityY = useTransform(p, [0, 1], ['0%', '6%'])
  const auroraOpacity = useTransform(p, [0, 0.55], [1, 0.15])
  const textOpacity = useTransform(p, [0, 0.3], [1, 0])
  const textY = useTransform(p, [0, 0.3], [0, -90])
  const portraitX = useTransform(p, [0, 0.4], [0, 160])
  const portraitOpacity = useTransform(p, [0, 0.35], [1, 0])
  const darken = useTransform(p, [0.55, 1], [0, 0.85])
  const cue = useTransform(p, [0, 0.08], [1, 0])
  const line1 = useTransform(p, [0.38, 0.5, 0.62, 0.7], [0, 1, 1, 0])
  const line1Y = useTransform(p, [0.38, 0.7], [40, -40])
  const line2 = useTransform(p, [0.66, 0.78, 0.92, 1], [0, 1, 1, 0.9])
  const line2Y = useTransform(p, [0.66, 1], [40, -20])

  /* ---- cursor: depth parallax + glow ---- */
  const mx = useMotionValue(0)   // -1..1
  const my = useMotionValue(0)
  const gx = useMotionValue(-999)
  const gy = useMotionValue(-999)
  const smx = useSpring(mx, { stiffness: 60, damping: 20 })
  const smy = useSpring(my, { stiffness: 60, damping: 20 })
  const sgx = useSpring(gx, { stiffness: 120, damping: 24 })
  const sgy = useSpring(gy, { stiffness: 120, damping: 24 })
  const cityX = useTransform(smx, (v) => v * -16)
  const cityYc = useTransform(smy, (v) => v * -10)
  const portraitRY = useTransform(smx, (v) => v * 7)
  const portraitRX = useTransform(smy, (v) => v * -3)
  const portraitShift = useTransform(smx, (v) => v * 10)

  useEffect(() => {
    const el = stage.current
    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      mx.set(((e.clientX - r.left) / r.width) * 2 - 1)
      my.set(((e.clientY - r.top) / r.height) * 2 - 1)
      gx.set(e.clientX - r.left)
      gy.set(e.clientY - r.top)
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [mx, my, gx, gy])

  return (
    <section ref={section} id="top" className="relative h-[240vh]">
      <div ref={stage} className="sticky top-0 h-[100svh] cursor-crosshair overflow-hidden bg-black">
        {/* City — scroll zooms in, cursor shifts depth */}
        <motion.div className="absolute inset-0" style={{ scale: cityScale, y: cityY, transformOrigin: '50% 72%' }}>
          <motion.div className="absolute -inset-6" style={{ x: cityX, y: cityYc }}>
            <motion.img
              src={city}
              srcSet={`${citySm} 1100w, ${city} 1920w`}
              sizes="100vw"
              fetchPriority="high"
              decoding="async"
              alt="Nairobi at night"
              className="h-full w-full object-cover object-[50%_60%]"
              initial={{ scale: 1.14, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 2.4, ease: EASE_OUT }}
              draggable="false"
            />
          </motion.div>
        </motion.div>

        {/* Aurora in the sky — reacts to the cursor */}
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-0 h-[72%] mix-blend-screen [mask-image:linear-gradient(to_bottom,#000_45%,transparent_100%)]"
          style={{ opacity: auroraOpacity }}
        >
          <motion.div
            className="h-full w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 2 }}
          >
            <Suspense fallback={null}>
              <Aurora className="h-full w-full" />
            </Suspense>
          </motion.div>
        </motion.div>

        {/* Legibility: sky to black at the top, text side darker, fade to black below */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,6,10,0.55)_0%,rgba(5,6,10,0)_38%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,10,0.92)_0%,rgba(5,6,10,0.7)_32%,rgba(5,6,10,0.15)_58%,rgba(5,6,10,0)_75%)] max-md:bg-[linear-gradient(180deg,rgba(5,6,10,0.2)_0%,rgba(5,6,10,0.75)_45%,rgba(5,6,10,0.92)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-black" />

        {/* Cursor glow */}
        <motion.div
          className="pointer-events-none absolute left-0 top-0 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen max-md:hidden"
          style={{
            x: sgx, y: sgy,
            background: 'radial-gradient(circle, rgba(47,139,255,0.22) 0%, rgba(57,255,136,0.08) 35%, rgba(0,0,0,0) 68%)',
          }}
        />

        {/* Sparks off the city lights — click to burst */}
        <Sparks className="pointer-events-none absolute inset-0 h-full w-full" burstTarget={stage} />

        {/* Portrait — pure black and white, turns toward the cursor */}
        <motion.div
          className="pointer-events-none absolute bottom-0 right-[-8%] h-[46svh] md:right-[4vw] md:h-[90svh]"
          style={{ x: portraitX, opacity: portraitOpacity, perspective: 1200 }}
        >
          <motion.div
            className="h-full"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.3, ease: EASE_OUT, delay: 0.7 }}
          >
            <motion.img
              src={portrait}
              srcSet={`${portraitSm} 415w, ${portrait} 759w`}
              sizes="(max-width: 767px) 210px, 410px"
              alt={`Portrait of ${identity.name}`}
              className="h-full w-auto select-none [mask-image:linear-gradient(to_bottom,#000_82%,transparent_100%)]"
              style={{ rotateY: portraitRY, rotateX: portraitRX, x: portraitShift, transformOrigin: '50% 100%' }}
              draggable="false"
            />
          </motion.div>
        </motion.div>

        {/* Words */}
        <motion.div
          className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-start px-6 pt-28 md:justify-center md:px-10 md:pt-0"
          style={{ opacity: textOpacity, y: textY }}
        >
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.15 }}
            className="mb-6 flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.3em] text-mist/80 md:text-[13px]"
          >
            <span className="h-2 w-2 rounded-full bg-green shadow-[0_0_12px_#39FF88]" />
            {identity.headline} · {identity.location.split(',')[0]}
          </motion.div>

          <NeonName lines={identity.name.split(' ')} delay={0.3} />

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT, delay: 1.0 }}
            className="mt-6 font-display text-xl font-bold tracking-tight md:text-3xl"
          >
            <RoleRotator roles={roles} />
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT, delay: 1.15 }}
            className="mt-4 max-w-md text-[15px] leading-relaxed text-mist/75 md:max-w-lg md:text-lg"
          >
            {identity.tagline}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT, delay: 1.3 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Magnet>
              <a href="#impact" className="group relative block rounded-full p-[1.5px]">
                <span className="beam absolute inset-0 rounded-full" />
                <span className="relative block rounded-full bg-black px-7 py-3.5 text-[15px] font-semibold text-mist transition-colors group-hover:bg-night">
                  See my impact <span className="ml-1 inline-block transition-transform group-hover:translate-x-1">→</span>
                </span>
              </a>
            </Magnet>
            <Magnet strength={0.25}>
              <a
                href={`${BASE}${profile.cv_download}`}
                download
                className="block rounded-full border border-gold/50 px-7 py-3.5 text-[15px] font-semibold text-gold transition-colors hover:bg-gold hover:text-black"
              >
                Download CV
              </a>
            </Magnet>
          </motion.div>
        </motion.div>

        {/* Stats along the bottom */}
        <motion.div
          className="absolute inset-x-0 bottom-10 z-10 hidden md:block"
          style={{ opacity: textOpacity }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE_OUT, delay: 1.5 }}
            className="mx-auto flex max-w-7xl gap-10 px-10"
          >
            {telemetry.slice(1, 4).map((t, k) => (
              <Stat key={t.label} value={t.value} suffix={t.suffix} label={t.label} delay={1.6 + k * 0.15} />
            ))}
            {/* Scroll cue: sits in the stats row so it never lands on the portrait or a label */}
            <motion.div
              className="hidden items-center gap-3 self-center border-l border-mist/15 pl-8 text-[11px] font-semibold uppercase tracking-[0.3em] text-mist/60 xl:flex"
              style={{ opacity: cue }}
            >
              <span className="relative block h-8 w-5 rounded-full border border-mist/40">
                <motion.span
                  className="absolute left-1/2 top-1.5 h-1.5 w-1 -translate-x-1/2 rounded-full bg-green"
                  animate={{ y: [0, 10, 0], opacity: [1, 0.2, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                />
              </span>
              Scroll
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Mid-flight lines */}
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-start px-6 pt-[26vh] text-center">
          <motion.p
            style={{ opacity: line1, y: line1Y }}
            className="absolute font-display text-[clamp(2.2rem,6vw,5.5rem)] font-extrabold uppercase leading-none tracking-[-0.03em] text-mist [text-shadow:0_0_40px_rgba(5,6,10,0.9),0_2px_12px_rgba(5,6,10,0.8)]"
          >
            Built in <span className="bg-gradient-to-r from-gold to-orange bg-clip-text text-transparent [filter:drop-shadow(0_0_18px_rgba(255,138,61,0.55))] [text-shadow:none]">Nairobi.</span>
          </motion.p>
          <motion.p
            style={{ opacity: line2, y: line2Y }}
            className="absolute font-display text-[clamp(2.2rem,6vw,5.5rem)] font-extrabold uppercase leading-none tracking-[-0.03em] text-mist [text-shadow:0_0_40px_rgba(5,6,10,0.9),0_2px_12px_rgba(5,6,10,0.8)]"
          >
            Running in <span className="bg-gradient-to-r from-green to-blue bg-clip-text text-transparent [filter:drop-shadow(0_0_18px_rgba(57,255,136,0.5))] [text-shadow:none]">production.</span>
          </motion.p>
        </div>

        {/* Fade to black as you arrive */}
        <motion.div className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: darken }} />
      </div>
    </section>
  )
}
