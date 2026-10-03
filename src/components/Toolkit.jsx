import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { m as motion, AnimatePresence } from 'motion/react'
import { EASE_OUT } from '../motion'
import { MaskTitle } from './HowILead'

/*
  Toolkit — a clickable skill map.
  Tools sit in five columns, in the order data actually moves:
  ingest → transform → warehouse → govern → visualise.
  Click a tool and the map draws links to every tool it has been used with,
  and the panel shows where it was used, with the line from the CV that
  proves it. All of it is computed from profile.json, so a new CV redraws
  the map by itself. Tools the CV lists but never ties to a role are marked
  "skills list" rather than given an invented history.
*/

// How each tool may be written in the CV's role text
const ALIAS = {
  'GTM server-side': ['GTM', 'Google Tag Manager', 'server-side tracking'],
  'REST APIs': ['API'],
  'Pub/Sub': ['Pub/Sub', 'PubSub'],
  'Azure Synapse': ['Synapse'],
  'Looker Studio': ['Looker'],
  MDM: ['MDM', 'master data'],
  RBAC: ['RBAC', 'role-based access'],
}
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function buildMap(profile) {
  const sources = [
    ...profile.experience.map((e, i) => ({
      id: `r${i}`,
      kind: 'role',
      company: e.company,
      label: e.company,
      sub: e.role.split(/\s+[–-]\s+/)[0],
      period: e.period.replace('—', '–'),
      bullets: e.bullets || [],
      text: [...(e.bullets || []), ...(e.stack || [])].join(' \n '),
    })),
    ...(profile.projects || []).map((p, i) => ({
      id: `p${i}`,
      kind: 'project',
      company: 'Side projects',
      label: 'Side project',
      sub: p.name,
      period: p.platform || '',
      bullets: [p.description],
      text: [p.description, ...(p.stack || [])].join(' \n '),
    })),
  ]

  const tools = []
  profile.stack.forEach((g, gi) =>
    g.items.forEach((name) => {
      const keys = (ALIAS[name] || [name]).map((k) => new RegExp(`(^|[^A-Za-z])${esc(k)}`, 'i'))
      const hits = sources.filter((s) => keys.some((k) => k.test(s.text)))
      const proof = hits
        .map((s) => ({ s, line: s.bullets.find((b) => keys.some((k) => k.test(b))) }))
        .filter((x) => x.line)
      const level = hits.some((h) => h.kind === 'role') ? 'role' : hits.length ? 'project' : 'listed'
      tools.push({ key: name, name, group: gi, groupName: g.group, hits, proof, level })
    })
  )

  // two tools are linked when the same role or project used both
  const pairs = {}
  tools.forEach((a) => {
    pairs[a.key] = tools.filter((b) => b.key !== a.key && b.hits.some((h) => a.hits.includes(h))).map((b) => b.key)
  })

  const companies = []
  sources.forEach((s) => {
    if (!companies.includes(s.company) && tools.some((t) => t.hits.includes(s))) companies.push(s.company)
  })
  return { groups: profile.stack.map((g) => g.group), tools, pairs, companies }
}

function useWide() {
  const [w, setW] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const f = () => setW(mq.matches)
    f()
    mq.addEventListener('change', f)
    return () => mq.removeEventListener('change', f)
  }, [])
  return w
}

const DOT = {
  role: { background: '#39FF88', boxShadow: '0 0 8px rgba(57,255,136,0.8)' },
  project: { background: '#2F8BFF', boxShadow: '0 0 8px rgba(47,139,255,0.8)' },
  listed: { background: 'transparent', boxShadow: 'inset 0 0 0 1.5px rgba(138,148,166,0.9)' },
}

function Pill({ t, state, onPick, refFn }) {
  // state: 'selected' | 'paired' | 'dim' | 'idle'
  const sel = state === 'selected'
  return (
    <motion.button
      ref={refFn}
      type="button"
      onClick={() => onPick(t.key)}
      aria-pressed={sel}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      animate={{ opacity: state === 'dim' ? 0.28 : 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`relative z-10 flex w-full min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-[13px] font-semibold leading-tight transition-colors ${
        sel
          ? 'border-green bg-green text-black shadow-[0_0_28px_rgba(57,255,136,0.45)]'
          : state === 'paired'
            ? 'border-blue/70 bg-[#0D1A33] text-mist shadow-[0_0_18px_rgba(47,139,255,0.25)]'
            : 'border-white/10 bg-[#0B1122] text-mist/85 hover:border-green/50 hover:text-mist'
      }`}
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={sel ? { background: '#05060A' } : DOT[t.level]} />
      <span className="min-w-0 break-words">{t.name}</span>
    </motion.button>
  )
}

/* What the panel says about the picked tool */
function ToolPanel({ t, map, onPick }) {
  if (!t) return null
  const paired = map.pairs[t.key].map((k) => map.tools.find((x) => x.key === k))
  return (
    <motion.div
      key={t.key}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: EASE_OUT }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate">{t.groupName}</p>
      <h3 className="mt-2 font-display text-[2rem] font-extrabold leading-none tracking-[-0.03em] text-mist">{t.name}</h3>
      <p className="mt-3 flex items-center gap-2 text-[13px] text-mist/75">
        <span className="h-2 w-2 rounded-full" style={DOT[t.level]} />
        {t.level === 'role' ? 'Used in production roles' : t.level === 'project' ? 'Used in side projects' : 'On my skills list'}
      </p>

      {t.hits.length > 0 ? (
        <div className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate">Where I used it</p>
          <ul className="mt-3 grid gap-2">
            {t.hits.map((h) => (
              <li key={h.id} className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5">
                <p className="text-[13.5px] font-semibold text-mist">{h.label}</p>
                <p className="text-[12.5px] text-slate">{[h.sub, h.period].filter(Boolean).join(' · ')}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-6 text-[14px] leading-relaxed text-mist/70">
          Listed in my skills; the CV doesn&rsquo;t tie it to one role, so there&rsquo;s no project to point to here yet.
        </p>
      )}

      {t.proof[0] && (
        <blockquote className="mt-5 border-l-2 border-green/60 pl-4 text-[13.5px] italic leading-relaxed text-mist/75">
          &ldquo;{t.proof[0].line}&rdquo;
        </blockquote>
      )}

      {paired.length > 0 && (
        <div className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate">Paired with</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {paired.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => onPick(p.key)}
                className="rounded-full border border-blue/40 px-3 py-1 text-[12px] font-medium text-mist/85 transition-colors hover:border-green hover:text-green"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

/* Desktop: the five columns with links drawn between tools */
function MapGrid({ map, picked, setPicked, filter }) {
  const box = useRef(null)
  const pills = useRef({})
  const [edges, setEdges] = useState([])

  const measure = useCallback(() => {
    const root = box.current
    if (!root) return
    const R = root.getBoundingClientRect()
    const rect = (el) => {
      const r = el.getBoundingClientRect()
      return { l: r.left - R.left, r: r.right - R.left, cy: r.top - R.top + r.height / 2, cx: r.left - R.left + r.width / 2, b: r.bottom - R.top }
    }
    if (!picked || !pills.current[picked]) return setEdges([])
    const a = rect(pills.current[picked])
    const ga = map.tools.find((t) => t.key === picked).group
    setEdges(
      map.pairs[picked].map((k) => {
        const el = pills.current[k]
        if (!el) return null
        const b = rect(el)
        const gb = map.tools.find((t) => t.key === k).group
        let d
        if (ga === gb) {
          d = `M ${a.r} ${a.cy} C ${a.r + 46} ${a.cy}, ${b.r + 46} ${b.cy}, ${b.r} ${b.cy}`
        } else {
          const [p, q] = gb > ga ? [a.r, b.l] : [a.l, b.r]
          const mid = (p + q) / 2
          d = `M ${p} ${a.cy} C ${mid} ${a.cy}, ${mid} ${b.cy}, ${q} ${b.cy}`
        }
        return { k, d }
      }).filter(Boolean)
    )
  }, [picked, map])

  useLayoutEffect(() => {
    measure()
    const ro = new ResizeObserver(measure)
    if (box.current) ro.observe(box.current)
    return () => ro.disconnect()
  }, [measure])

  const pairedSet = new Set(picked ? map.pairs[picked] : [])
  const inFilter = (t) => filter === 'All' || t.hits.some((h) => h.company === filter)
  const stateOf = (t) => {
    if (picked) return t.key === picked ? 'selected' : pairedSet.has(t.key) ? 'paired' : 'dim'
    return inFilter(t) ? 'idle' : 'dim'
  }

  return (
    <div ref={box} className="relative">
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id="tk-edge" x1="0" x2="1">
            <stop offset="0" stopColor="#39FF88" />
            <stop offset="1" stopColor="#2F8BFF" />
          </linearGradient>
        </defs>
        <AnimatePresence>
          {edges.map((e, i) => (
            <motion.path
              key={`${picked}-${e.k}`}
              d={e.d}
              fill="none"
              stroke="url(#tk-edge)"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.9 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              transition={{ duration: 0.6, ease: EASE_OUT, delay: i * 0.04 }}
              style={{ filter: 'drop-shadow(0 0 6px rgba(57,255,136,0.5))' }}
            />
          ))}
        </AnimatePresence>
      </svg>

      {/* stage headers on one glowing track: data moves left to right */}
      <div className="relative mb-5 grid grid-cols-5 gap-3">
        <div aria-hidden="true" className="absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-blue/40 via-mist/15 to-green/40" />
        <div aria-hidden="true" className="tk-packet absolute top-1/2 h-[3px] w-24 -translate-y-1/2 rounded-full" />
        {map.groups.map((g, gi) => (
          <div key={g} className="relative min-w-0 rounded-xl border border-white/[0.08] bg-[#0B1122] px-2.5 py-2.5">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-green">Stage {gi + 1}</p>
            <p className="mt-0.5 text-[13.5px] font-bold leading-tight text-mist">{g}</p>
          </div>
        ))}
      </div>
      <div className="relative grid grid-cols-5 gap-3">
        {map.groups.map((g, gi) => (
          <div key={g} className="grid min-w-0 content-start gap-2">
            {map.tools.filter((t) => t.group === gi).map((t) => (
              <Pill key={t.key} t={t} state={stateOf(t)} onPick={setPicked} refFn={(el) => (pills.current[t.key] = el)} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Toolkit({ profile }) {
  const map = useMemo(() => buildMap(profile), [profile])
  const wide = useWide()
  const first = map.tools.find((t) => t.key === 'BigQuery') || map.tools.find((t) => t.level === 'role')
  const [picked, setPickedRaw] = useState(first?.key || null)
  const [filter, setFilter] = useState('All')
  const [sheet, setSheet] = useState(false)
  const setPicked = (k) => {
    setPickedRaw((cur) => (cur === k && wide ? null : k))
    setFilter('All')
    if (!wide) setSheet(true)
  }
  const pickedTool = map.tools.find((t) => t.key === picked)
  const counts = {
    all: map.tools.length,
    role: map.tools.filter((t) => t.level === 'role').length,
  }

  const chips = (
    <div className="flex flex-wrap gap-2">
      {['All', ...map.companies].map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => { setFilter(c); setPickedRaw(null) }}
          aria-pressed={filter === c && !picked}
          className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
            filter === c && !picked ? 'border-green bg-green/10 text-green' : 'border-white/12 text-slate hover:text-mist'
          }`}
        >
          {c === 'All' ? 'All tools' : c}
        </button>
      ))}
    </div>
  )

  const legend = (
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-slate">
      <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={DOT.role} />Production roles</span>
      <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={DOT.project} />Side projects</span>
      <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={DOT.listed} />Skills list</span>
    </div>
  )

  return (
    <section id="toolkit" className="relative py-24 md:py-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/4 h-3/4" style={{ background: 'radial-gradient(40% 45% at 35% 55%, rgba(57,255,136,0.06), transparent), radial-gradient(35% 40% at 80% 40%, rgba(47,139,255,0.08), transparent)' }} />
      <div className="relative mx-auto max-w-6xl px-5 md:px-10">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          className="mb-4 flex items-center gap-3 text-[13px] font-medium uppercase tracking-[0.28em] text-green"
        >
          <span className="h-px w-8 bg-green/60" />
          Toolkit
        </motion.p>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <MaskTitle
            text="The tools, in the order the data moves."
            className="max-w-3xl font-display text-[clamp(2.1rem,5vw,3.6rem)] font-bold leading-[1.05] tracking-[-0.03em] text-mist"
          />
          <p className="max-w-xs text-[15px] leading-relaxed text-slate">
            {counts.all} tools, {counts.role} of them used in production roles. Pick one to see where, and what it ran alongside.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.8, ease: EASE_OUT }}
          className="mt-12"
        >
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {chips}
            {legend}
          </div>

          {wide ? (
            <div className="grid grid-cols-[minmax(0,1fr)_300px] items-start gap-6">
              <div className="rounded-[28px] border border-white/[0.08] bg-[#080C18]/80 p-5">
                <MapGrid map={map} picked={picked} setPicked={setPicked} filter={filter} />
              </div>
              <aside className="rounded-[28px] border border-white/[0.08] bg-[#0B1122] p-6" aria-live="polite">
                <AnimatePresence mode="wait">
                  {pickedTool ? (
                    <ToolPanel key={pickedTool.key} t={pickedTool} map={map} onPick={setPicked} />
                  ) : (
                    <motion.div key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate">{filter === 'All' ? 'All tools' : filter}</p>
                      <p className="mt-3 font-display text-[1.6rem] font-bold leading-tight tracking-[-0.02em] text-mist">
                        {filter === 'All'
                          ? 'Pick any tool on the map.'
                          : `${map.tools.filter((t) => t.hits.some((h) => h.company === filter)).length} tools used at ${filter}.`}
                      </p>
                      <p className="mt-3 text-[14px] leading-relaxed text-slate">You&rsquo;ll see where I used it, the line from my CV that proves it, and the tools it ran alongside.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </aside>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {map.groups.map((g, gi) => (
                  <div key={g} className="rounded-2xl border border-white/[0.08] bg-[#0B1122] p-4">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-green">Stage {gi + 1}</p>
                    <p className="mb-3 text-[15px] font-bold text-mist">{g}</p>
                    <div className="flex flex-wrap gap-2">
                      {map.tools.filter((t) => t.group === gi).map((t) => {
                        const dim = filter !== 'All' && !t.hits.some((h) => h.company === filter)
                        return (
                          <button
                            key={t.key}
                            type="button"
                            onClick={() => setPicked(t.key)}
                            className={`flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[13px] font-semibold text-mist/90 transition-opacity ${dim ? 'opacity-30' : ''}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full" style={DOT[t.level]} />
                            {t.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {/* bottom sheet for the picked tool */}
              <AnimatePresence>
                {sheet && pickedTool && (
                  <>
                    <motion.div key="scrim" className="fixed inset-0 z-[60] bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheet(false)} />
                    <motion.div
                      key="sheet"
                      role="dialog"
                      aria-label={`${pickedTool.name} details`}
                      className="fixed inset-x-0 bottom-0 z-[70] max-h-[78svh] overflow-y-auto rounded-t-[28px] border-t border-white/10 bg-[#0B1122] px-6 pb-[calc(28px+env(safe-area-inset-bottom,0px))] pt-4"
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '100%' }}
                      transition={{ type: 'spring', stiffness: 300, damping: 32 }}
                    >
                      <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-mist/25" />
                      <button type="button" onClick={() => setSheet(false)} className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full border border-mist/20 text-mist" aria-label="Close">✕</button>
                      <AnimatePresence mode="wait">
                        <ToolPanel key={pickedTool.key} t={pickedTool} map={map} onPick={setPicked} />
                      </AnimatePresence>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </>
          )}
        </motion.div>
      </div>
    </section>
  )
}
