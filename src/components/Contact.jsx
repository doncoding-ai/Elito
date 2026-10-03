import { useEffect, useRef, useState } from 'react'
import { m as motion, AnimatePresence, useMotionValue, useSpring, useMotionTemplate, useTransform } from 'motion/react'
import { EASE_OUT } from '../motion'
import NeonName from './NeonName'
import Magnet from './Magnet'
import Sparks from './Sparks'
import city from '../assets/nairobi-night.webp'
import me from '../assets/elijah-glasses.webp'
import meSm from '../assets/elijah-glasses-sm.webp'

/*
  Contact — the closing scene. The Nairobi skyline comes back under the
  last screen, the sparks return (click to burst), and the headline lights
  up under the cursor like the name in the hero. The email is one big
  button that copies itself; links and the CV sit in cards; a live
  Nairobi clock tells visitors what time it is here.
*/

const BASE = import.meta.env.BASE_URL

function useNairobiTime() {
  const fmt = () =>
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Nairobi', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date())
  const [t, setT] = useState(fmt)
  useEffect(() => {
    const id = setInterval(() => setT(fmt()), 20_000)
    return () => clearInterval(id)
  }, [])
  return t
}

function LinkCard({ href, label, detail, download, i, external }) {
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--cx', `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty('--cy', `${e.clientY - r.top}px`)
  }
  return (
    <motion.a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener' } : {})}
      {...(download ? { download: '' } : {})}
      onPointerMove={onMove}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.1 + i * 0.08 }}
      whileHover={{ y: -4 }}
      className="group relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl border border-white/10 bg-[#0B1122]/80 px-6 py-5 backdrop-blur-md transition-colors hover:border-green/50"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: 'radial-gradient(260px circle at var(--cx) var(--cy), rgba(57,255,136,0.12), transparent 60%)' }}
      />
      <span className="relative min-w-0">
        <span className="block font-display text-[1.25rem] font-bold tracking-[-0.02em] text-mist">{label}</span>
        <span className="block truncate text-[13px] text-slate">{detail}</span>
      </span>
      <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-mist/20 text-mist transition-all duration-300 group-hover:rotate-[-45deg] group-hover:border-green group-hover:bg-green group-hover:text-black">
        {download ? '↓' : '→'}
      </span>
    </motion.a>
  )
}

/* The closing portrait: the studio shot, pure black and white as taken,
   standing over the city lights with a neon ring behind, like the ring
   light in the photo. */
function Portrait({ tilt }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 1.1, ease: EASE_OUT, delay: 0.2 }}
      className="relative mx-auto mt-14 h-[440px] w-fit lg:mx-0 lg:mt-0 lg:h-[620px]"
      style={{ perspective: 1200 }}
    >
      {/* neon ring behind the head and shoulders */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-[3%] aspect-square w-[150%] -translate-x-1/2 rounded-full"
        style={{
          WebkitMaskImage: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))',
          maskImage: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))',
        }}
      >
        <span className="beam absolute inset-[-40%] opacity-90" />
      </div>
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-[3%] aspect-square w-[150%] -translate-x-1/2 rounded-full"
        style={{ boxShadow: '0 0 60px rgba(47,139,255,0.35), inset 0 0 50px rgba(57,255,136,0.12)' }}
      />
      <motion.img
        src={me}
        srcSet={`${meSm} 324w, ${me} 594w`}
        sizes="(max-width: 1023px) 190px, 265px"
        alt="Elijah Ndeto"
        loading="lazy"
        decoding="async"
        draggable="false"
        className="relative h-full w-auto select-none [mask-image:linear-gradient(to_bottom,#000_80%,transparent_100%)]"
        style={{ rotateY: tilt, transformOrigin: '50% 100%' }}
      />
    </motion.div>
  )
}

export default function Contact({ profile, story }) {
  const { identity } = profile
  const c = story.contact
  const stage = useRef(null)
  const time = useNairobiTime()
  const [copied, setCopied] = useState(null) // 'ok' | 'fail' | null

  // cursor glow across the closing scene
  const gx = useMotionValue(-400)
  const gy = useMotionValue(-400)
  const sgx = useSpring(gx, { stiffness: 120, damping: 20 })
  const sgy = useSpring(gy, { stiffness: 120, damping: 20 })
  const glow = useMotionTemplate`radial-gradient(520px circle at ${sgx}px ${sgy}px, rgba(47,139,255,0.14), transparent 60%)`
  // the portrait turns slightly toward the cursor, like the hero
  const px = useMotionValue(0)
  const tilt = useSpring(useTransform(px, [-1, 1], [-7, 7]), { stiffness: 120, damping: 18 })
  const onMove = (e) => {
    const r = stage.current.getBoundingClientRect()
    gx.set(e.clientX - r.left)
    gy.set(e.clientY - r.top)
    px.set(((e.clientX - r.left) / r.width) * 2 - 1)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(identity.email)
      setCopied('ok')
    } catch {
      setCopied('fail')
    }
    setTimeout(() => setCopied(null), 2200)
  }

  const cv = profile.cv_download ? `${BASE}${profile.cv_download}` : null
  const year = new Date().getFullYear()

  return (
    <section id="contact" ref={stage} onPointerMove={onMove} className="relative overflow-hidden pt-28 md:pt-40">
      {/* the city returns under the last screen */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[78%]">
        <img
          src={city}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover object-[50%_70%] opacity-55"
          style={{ maskImage: 'linear-gradient(to bottom, transparent, black 45%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 45%)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      </div>
      <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden md:block" style={{ background: glow }} />
      <Sparks className="pointer-events-none absolute inset-0 h-full w-full" burstTarget={stage} />

      <div className="relative mx-auto max-w-6xl px-5 md:px-10">
       <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-10">
       <div className="min-w-0">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          className="mb-6 flex items-center gap-3 text-[13px] font-medium uppercase tracking-[0.28em] text-green"
        >
          <span className="h-px w-8 bg-green/60" />
          {c.eyebrow}
        </motion.p>

        <NeonName lines={c.lines} as="h2" trigger="view" delay={0.1} sizeClass="text-[clamp(2.6rem,7.2vw,6.8rem)]" />

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.5 }}
          className="mt-8 max-w-xl text-[17px] leading-relaxed text-mist/75"
        >
          {c.intro}
        </motion.p>

        {/* the email: one big button that copies itself */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.6 }}
          className="mt-12"
        >
          <Magnet strength={0.18} radius={80} className="max-w-full">
            <button
              type="button"
              onClick={copy}
              className="group relative flex max-w-full items-center gap-4 overflow-hidden rounded-full p-[2px]"
              aria-label={`Copy ${identity.email}`}
            >
              <span aria-hidden="true" className="beam absolute inset-[-150%] opacity-80" />
              <span className="relative flex min-w-0 items-center gap-4 rounded-full bg-black px-6 py-4 sm:px-8 sm:py-5">
                <span className="min-w-0 truncate font-display text-[clamp(1.2rem,3.4vw,2.3rem)] font-bold tracking-[-0.02em] text-mist transition-colors group-hover:text-green">
                  {identity.email}
                </span>
                <span className="shrink-0 rounded-full border border-mist/20 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.16em] text-mist/80 transition-colors group-hover:border-green group-hover:text-green">
                  Copy
                </span>
              </span>
            </button>
          </Magnet>
          <div className="mt-3 h-6 pl-2 text-[14px]">
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.p key={copied} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={copied === 'ok' ? 'text-green' : 'text-gold'}>
                  {copied === 'ok' ? 'Copied. Paste it into a new email.' : 'Couldn’t copy here. Select the address above instead.'}
                </motion.p>
              ) : (
                <motion.a key="mail" href={`mailto:${identity.email}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-slate underline-offset-4 transition-colors hover:text-mist hover:underline">
                  Or open it in your mail app →
                </motion.a>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
       </div>
        <Portrait tilt={tilt} />
       </div>

        {/* links */}
        <div className="mt-12 grid gap-3 md:grid-cols-3">
          <LinkCard i={0} href={identity.linkedin} label="LinkedIn" detail={identity.linkedin.replace(/^https?:\/\//, '')} external />
          <LinkCard i={1} href={identity.github} label="GitHub" detail={identity.github.replace(/^https?:\/\//, '')} external />
          {cv && <LinkCard i={2} href={cv} label="Download my CV" detail="PDF · updated with every new CV" download />}
        </div>

        {/* status line */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-[14px] text-mist/80"
        >
          <span className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green" />
            </span>
            {c.availability}
          </span>
          <span className="text-slate">
            Nairobi · <span className="font-semibold tabular-nums text-mist">{time}</span> EAT
          </span>
        </motion.div>

        {/* footer */}
        <footer className="mt-28 flex flex-col gap-4 border-t border-white/10 py-8 text-[13px] text-slate md:mt-40 md:flex-row md:items-center md:justify-between">
          <p>© {year} {identity.name}. Built in Nairobi with React, Tailwind and Motion.</p>
          <a href="#top" className="inline-flex items-center gap-2 text-mist/80 transition-colors hover:text-green">
            Back to the top <span aria-hidden="true">↑</span>
          </a>
        </footer>
      </div>
    </section>
  )
}
