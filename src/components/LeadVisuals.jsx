import { m as motion } from 'motion/react'
import { EASE_OUT } from '../motion'

/*
  One small, live diagram per leadership principle. Each draws itself the
  first time it's seen, then keeps a slow pulse so the card feels switched on.
  Every label here is taken from the CV; none of these show invented numbers.
*/

const HEX = { blue: '#2F8BFF', green: '#39FF88' }
const inView = { initial: 'off', whileInView: 'on', viewport: { once: true, amount: 0.5 } }

function Caption({ children }) {
  return <p className="mt-4 text-[12px] font-medium uppercase tracking-[0.22em] text-slate">{children}</p>
}

/* Ownership: a grid of records where the gaps get filled by the backfill */
const COLS = 12, ROWS = 6
const MISSING = new Set([3, 4, 5, 16, 17, 28, 29, 30, 31, 43, 44, 57, 58, 59, 66, 67])
function Recovery({ accent, markets = [] }) {
  const c = HEX[accent]
  const cells = Array.from({ length: COLS * ROWS }, (_, i) => i)
  let k = 0
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-[12px] font-semibold text-mist/80">
        <span>Firestore</span>
        <span className="flex flex-1 items-center gap-2 px-3">
          <span className="h-px flex-1 bg-gradient-to-r from-mist/10 to-mist/40" />
          <span style={{ color: c }}>backfill</span>
          <span className="h-px flex-1 bg-gradient-to-r from-mist/40 to-mist/10" />
        </span>
        <span>BigQuery</span>
      </div>
      <motion.div {...inView} className="relative grid gap-[5px]" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
        {cells.map((i) => {
          const miss = MISSING.has(i)
          const order = miss ? k++ : 0
          return (
            <motion.span
              key={i}
              className="aspect-square rounded-[4px]"
              variants={
                miss
                  ? {
                      off: { backgroundColor: 'rgba(255,255,255,0)', boxShadow: 'inset 0 0 0 1px rgba(255,138,61,0.55)' },
                      on: { backgroundColor: c, boxShadow: `0 0 12px ${c}99, inset 0 0 0 1px ${c}` },
                    }
                  : { off: { backgroundColor: 'rgba(238,242,247,0.14)' }, on: { backgroundColor: 'rgba(238,242,247,0.14)' } }
              }
              transition={{ delay: 0.5 + order * 0.09, duration: 0.35, ease: EASE_OUT }}
            />
          )
        })}
        {/* the scan that "writes" the missing rows back */}
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-[-6px] w-10 rounded-full"
          style={{ background: `linear-gradient(90deg, transparent, ${c}55, transparent)` }}
          variants={{ off: { left: '-10%', opacity: 0 }, on: { left: ['-10%', '100%'], opacity: [0, 1, 0] } }}
          transition={{ duration: 2, ease: 'easeInOut', delay: 0.4 }}
        />
      </motion.div>
      <div className="mt-4 flex flex-wrap gap-2">
        {markets.map((m) => (
          <span key={m} className="rounded-full border border-mist/15 px-3 py-1 text-[12px] font-medium text-mist/80">{m}</span>
        ))}
      </div>
      <Caption>Missing records, recovered</Caption>
    </div>
  )
}

/* Delivery: investigation → production in ~5 weeks, then handover */
const STAGES = ['Investigate', 'Build', 'Production', 'Handover']
function Timeline({ accent }) {
  const c = HEX[accent]
  return (
    <motion.div {...inView}>
      <div className="relative pt-10">
        {/* the ~5 weeks bracket over the first three stages */}
        <motion.div
          className="absolute left-0 top-0 flex w-[calc(66.666%+12px)] items-center gap-2"
          variants={{ off: { opacity: 0, y: 6 }, on: { opacity: 1, y: 0 } }}
          transition={{ delay: 1.5, duration: 0.5, ease: EASE_OUT }}
        >
          <span className="h-3 w-px bg-gold/70" />
          <span className="h-px flex-1 bg-gold/50" />
          <span className="whitespace-nowrap font-display text-[13px] font-bold text-gold">about 5 weeks</span>
          <span className="h-px flex-1 bg-gold/50" />
          <span className="h-3 w-px bg-gold/70" />
        </motion.div>
        <div className="relative h-[3px] rounded-full bg-mist/10">
          <motion.div
            className="absolute inset-y-0 left-0 origin-left rounded-full"
            style={{ background: `linear-gradient(90deg, ${c}, #2F8BFF)`, boxShadow: `0 0 14px ${c}` }}
            variants={{ off: { width: '0%' }, on: { width: '100%' } }}
            transition={{ duration: 2.2, ease: EASE_OUT, delay: 0.3 }}
          />
        </div>
        <div className="relative -mt-[9px] grid grid-cols-4">
          {STAGES.map((s, i) => (
            <div key={s} className={i === 3 ? 'justify-self-end text-right' : i === 0 ? '' : 'justify-self-center text-center'}>
              <motion.span
                className="mx-auto block h-[15px] w-[15px] rounded-full border-2"
                style={{ marginLeft: i === 0 ? 0 : i === 3 ? 'auto' : undefined, marginRight: i === 3 ? 0 : undefined }}
                variants={{
                  off: { borderColor: 'rgba(238,242,247,0.25)', backgroundColor: '#0A0F1F', boxShadow: '0 0 0 rgba(0,0,0,0)' },
                  on: { borderColor: c, backgroundColor: i === 2 ? c : '#0A0F1F', boxShadow: `0 0 14px ${c}` },
                }}
                transition={{ delay: 0.3 + i * 0.62, duration: 0.3 }}
              />
              <motion.p
                className="mt-3 text-[13px] font-semibold"
                variants={{ off: { opacity: 0.35 }, on: { opacity: 1 } }}
                transition={{ delay: 0.3 + i * 0.62 }}
              >
                {s}
              </motion.p>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-2 text-[12px] text-mist/80">
        <span className="rounded-xl border border-mist/10 bg-white/[0.03] px-3 py-2">Server-side GTM</span>
        <span className="rounded-xl border border-mist/10 bg-white/[0.03] px-3 py-2">GA4 campaign data</span>
        <span className="rounded-xl border border-mist/10 bg-white/[0.03] px-3 py-2">Documented</span>
        <span className="rounded-xl border border-mist/10 bg-white/[0.03] px-3 py-2">Team trained</span>
      </div>
      <Caption>Shipped, then handed over</Caption>
    </motion.div>
  )
}

/* Partnership: business on one side, engineering on the other, three answers in between */
const ANSWERS = ['Affiliate statistics', 'Bank-transaction matching', 'Provider reconciliation']
function Bridge({ accent }) {
  const c = HEX[accent]
  const ys = [40, 110, 180]
  return (
    <motion.div {...inView}>
      <div className="relative">
        <svg viewBox="0 0 400 220" className="block h-auto w-full" aria-hidden="true">
          {ys.map((y, i) => (
            <g key={y}>
              {[`M 58 110 C 120 110, 110 ${y}, 150 ${y}`, `M 250 ${y} C 290 ${y}, 280 110, 342 110`].map((d, j) => (
                <g key={j}>
                  <motion.path
                    d={d}
                    fill="none"
                    stroke="rgba(238,242,247,0.18)"
                    strokeWidth="1.5"
                    variants={{ off: { pathLength: 0 }, on: { pathLength: 1 } }}
                    transition={{ duration: 0.9, delay: 0.2 + i * 0.15 + j * 0.5, ease: EASE_OUT }}
                  />
                  <path d={d} fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" className="lead-flow" style={{ animationDelay: `${i * 0.5 + j * 0.9}s` }} />
                </g>
              ))}
            </g>
          ))}
          {[58, 342].map((x) => (
            <circle key={x} cx={x} cy="110" r="7" fill="#0A0F1F" stroke={c} strokeWidth="2" />
          ))}
        </svg>
        {/* labels as HTML so they stay crisp and readable */}
        <span className="absolute left-[14.5%] top-[42%] -translate-x-1/2 -translate-y-full text-center text-[12px] font-semibold leading-tight text-mist/90">Business<br />analysts</span>
        <span className="absolute left-[85.5%] top-[42%] -translate-x-1/2 -translate-y-full text-center text-[12px] font-semibold leading-tight text-mist/90">Data<br />engineering</span>
        {ANSWERS.map((a, i) => (
          <motion.span
            key={a}
            className="absolute left-1/2 w-[27%] -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-night/90 px-2 py-1.5 text-center text-[11px] font-semibold leading-tight text-mist"
            style={{ top: `${(ys[i] / 220) * 100}%`, borderColor: `${c}66` }}
            variants={{ off: { opacity: 0, scale: 0.9 }, on: { opacity: 1, scale: 1 } }}
            transition={{ delay: 0.6 + i * 0.2, duration: 0.4, ease: EASE_OUT }}
          >
            {a}
          </motion.span>
        ))}
      </div>
      <Caption>BigQuery tables and monitoring views</Caption>
    </motion.div>
  )
}

/* Governance: the layered architecture, with controls running through every layer */
const LAYERS = ['Reporting', 'Dimensional', 'Data Vault', 'Integration', 'Raw ingestion']
const CONTROLS = ['Quality checks', 'MDM', 'PII/PHI masking', 'Role-based access']
function Layers({ accent }) {
  const c = HEX[accent]
  return (
    <motion.div {...inView}>
     <div className="flex gap-4">
      <div className="flex flex-1 flex-col gap-2">
        {LAYERS.map((l, i) => {
          const fromBottom = LAYERS.length - 1 - i
          return (
            <motion.div
              key={l}
              className="rounded-xl border px-4 py-2.5 text-[13px] font-semibold"
              style={{
                borderColor: `${c}${fromBottom === 0 ? 'aa' : '40'}`,
                background: `linear-gradient(90deg, ${c}${(0x10 + fromBottom * 6).toString(16)}, transparent)`,
              }}
              variants={{ off: { opacity: 0, y: 18 }, on: { opacity: 1, y: 0 } }}
              transition={{ delay: 0.25 + fromBottom * 0.16, duration: 0.5, ease: EASE_OUT }}
            >
              {l}
            </motion.div>
          )
        })}
      </div>
      {/* the guard rail: controls that apply to every layer */}
      <div className="relative flex w-[40%] flex-col justify-between py-1 pl-4">
        <motion.span
          className="absolute bottom-0 left-0 top-0 w-[2px] origin-bottom rounded-full"
          style={{ background: `linear-gradient(to top, ${c}, #2F8BFF)`, boxShadow: `0 0 12px ${c}` }}
          variants={{ off: { scaleY: 0 }, on: { scaleY: 1 } }}
          transition={{ delay: 0.3, duration: 1.2, ease: EASE_OUT }}
        />
        {CONTROLS.map((t, i) => (
          <motion.span
            key={t}
            className="flex items-center gap-2 text-[12px] font-semibold leading-tight text-mist/90"
            variants={{ off: { opacity: 0, x: -8 }, on: { opacity: 1, x: 0 } }}
            transition={{ delay: 1 + i * 0.15, duration: 0.4, ease: EASE_OUT }}
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: c, boxShadow: `0 0 8px ${c}` }} />
            {t}
          </motion.span>
        ))}
      </div>
     </div>
      <Caption>Controls built into every layer</Caption>
    </motion.div>
  )
}

export default function LeadVisual({ kind, accent, data = {} }) {
  const V = { recovery: Recovery, timeline: Timeline, bridge: Bridge, layers: Layers }[kind]
  return V ? <V accent={accent} markets={data.markets} /> : null
}
