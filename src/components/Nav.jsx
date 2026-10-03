import { useState } from 'react'
import { m as motion, useScroll, useMotionValueEvent } from 'motion/react'
import { EASE_OUT } from '../motion'

export default function Nav({ profile }) {
  const { scrollY } = useScroll()
  const [solid, setSolid] = useState(false)
  useMotionValueEvent(scrollY, 'change', (v) => setSolid(v > 60))
  const { identity } = profile

  return (
    <motion.nav
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.1 }}
      className="fixed inset-x-0 top-0 z-50"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div
        className={`mx-auto mt-3 flex max-w-7xl items-center justify-between rounded-full px-5 py-3 transition-all duration-300 md:mt-4 md:px-6 ${
          solid ? 'glass bg-black/60' : 'border border-transparent'
        }`}
        style={{ width: 'calc(100% - 24px)' }}
      >
        <a href="#top" className="flex items-center gap-2 font-display text-[15px] font-bold tracking-tight text-mist">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-green to-blue text-[11px] font-extrabold text-black">
            EN
          </span>
          <span className="hidden sm:inline">{identity.name}</span>
        </a>
        <div className="flex items-center gap-1 text-sm md:gap-2">
          <a href="#impact" className="hidden rounded-full px-3 py-2 text-slate transition-colors hover:text-mist md:block">Impact</a>
          <a href="#lead" className="hidden rounded-full px-3 py-2 text-slate transition-colors hover:text-mist lg:block">How I lead</a>
          <a href="#cases" className="hidden rounded-full px-3 py-2 text-slate transition-colors hover:text-mist lg:block">Case studies</a>
          <a href="#journey" className="hidden rounded-full px-3 py-2 text-slate transition-colors hover:text-mist xl:block">Journey</a>
          <a href="#toolkit" className="hidden rounded-full px-3 py-2 text-slate transition-colors hover:text-mist xl:block">Toolkit</a>
          <a href={identity.linkedin} target="_blank" rel="noopener" className="rounded-full px-3 py-2 text-slate transition-colors hover:text-mist">LinkedIn</a>
          <a href={identity.github} target="_blank" rel="noopener" className="hidden rounded-full px-3 py-2 text-slate transition-colors hover:text-mist sm:block">GitHub</a>
          <a
            href="#contact"
            className="ml-1 rounded-full bg-mist px-4 py-2 font-semibold text-black transition-colors hover:bg-green"
          >
            Let’s talk
          </a>
        </div>
      </div>
    </motion.nav>
  )
}
