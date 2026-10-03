import { m as motion, useReducedMotion } from 'motion/react'
import { EASE_OUT } from '../motion'

/*
  Live architecture sketches for the case studies. Each draws itself when its
  case opens, then data "packets" keep moving along the real path the system
  takes. Node names come straight from the CV.
*/

const HEX = { blue: '#2F8BFF', green: '#39FF88', gold: '#F5B83D' }
const INK = 'rgba(238,242,247,0.9)'
const LINE = 'rgba(238,242,247,0.16)'

function Node({ x, y, w = 84, h = 44, label, sub, color, strong }) {
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: EASE_OUT, delay: 0.15 }}
      style={{ transformOrigin: `${x}px ${y}px`, transformBox: 'view-box' }}
    >
      <rect
        x={x - w / 2}
        y={y - h / 2}
        width={w}
        height={h}
        rx="11"
        fill="#0A0F1F"
        stroke={color}
        strokeOpacity={strong ? 0.95 : 0.5}
        strokeWidth={strong ? 1.6 : 1.2}
        style={strong ? { filter: `drop-shadow(0 0 8px ${color}88)` } : undefined}
      />
      <text x={x} y={sub ? y - 3 : y + 5} textAnchor="middle" fill={INK} fontSize="13" fontWeight="600" fontFamily="Inter, sans-serif">
        {label}
      </text>
      {sub && (
        <text x={x} y={y + 13} textAnchor="middle" fill="rgba(138,148,166,1)" fontSize="10.5" fontFamily="Inter, sans-serif">
          {sub}
        </text>
      )}
    </motion.g>
  )
}

function Wire({ d, delay = 0 }) {
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={LINE}
      strokeWidth="1.5"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.9, ease: EASE_OUT, delay }}
    />
  )
}

/* A glowing dot that travels a path forever (SVG animateMotion) */
function Packet({ d, color, dur = 2.4, begin = 0, r = 3.2 }) {
  return (
    <circle r={r} fill={color} style={{ filter: `drop-shadow(0 0 5px ${color})` }} opacity="0">
      <animateMotion dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" path={d} keyPoints="0;1" keyTimes="0;1" calcMode="linear" />
      <animate attributeName="opacity" dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" values="0;1;1;0" keyTimes="0;0.08;0.9;1" />
    </circle>
  )
}

function Deposits({ accent }) {
  const c = HEX[accent]
  const g = HEX.green
  const toGA4 = 'M100 130 L265 130 C300 130 300 70 330 70'
  const toBQ = 'M100 130 L265 130 C300 130 300 190 330 190'
  const reduce = useReducedMotion()
  return (
    <svg viewBox="0 0 440 260" className="block h-auto w-full" role="img" aria-label="Deposit events flow from the payments pipeline through server-side GTM to GA4, with every event logged to BigQuery">
      <Wire d="M100 130 L165 130" />
      <Wire d="M265 130 C300 130 300 70 330 70" delay={0.4} />
      <Wire d="M265 130 C300 130 300 190 330 190" delay={0.5} />
      {!reduce && (
        <>
          {[0, 0.8, 1.6].map((b) => <Packet key={`a${b}`} d={toGA4} color={g} begin={1 + b} />)}
          {[0.4, 1.2, 2].map((b) => <Packet key={`b${b}`} d={toBQ} color={c} begin={1 + b} />)}
        </>
      )}
      <Node x={55} y={130} w={90} label="Payments" sub="pipeline" color={c} />
      <Node x={215} y={130} w={100} h={52} label="Server-side" sub="GTM · Cloud Run" color={c} strong />
      <Node x={375} y={70} w={100} label="GA4" sub="player · currency" color={g} strong />
      <Node x={375} y={190} w={90} label="BigQuery" sub="success + failure" color={c} />
    </svg>
  )
}

function Lakehouse({ accent }) {
  const c = HEX[accent]
  const reduce = useReducedMotion()
  const medal = [
    { x: 128, label: 'Bronze', color: '#C98B5A' },
    { x: 206, label: 'Silver', color: '#C9D1DC' },
    { x: 284, label: 'Gold', color: HEX.gold },
  ]
  const models = [
    { y: 60, label: 'XGBoost' },
    { y: 130, label: 'Random Forest' },
    { y: 200, label: 'TFT' },
  ]
  const spine = 'M72 130 L316 130'
  return (
    <svg viewBox="0 0 440 260" className="block h-auto w-full" role="img" aria-label="On-premise data moves through Bronze, Silver and Gold layers under Unity Catalog, feeding XGBoost, Random Forest and TFT models">
      <Wire d={spine} />
      {models.map((m, i) => <Wire key={m.label} d={`M316 130 C330 130 330 ${m.y} 342 ${m.y}`} delay={0.5 + i * 0.1} />)}
      {/* Unity Catalog rail under the three layers */}
      <motion.rect
        x="96" y="176" width="220" height="30" rx="9"
        fill={`${c}14`} stroke={c} strokeOpacity="0.45"
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.5, ease: EASE_OUT }}
      />
      <motion.text x="206" y="195.5" textAnchor="middle" fill={c} fontSize="11.5" fontWeight="600" fontFamily="Inter, sans-serif" letterSpacing="1.5"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
        UNITY CATALOG
      </motion.text>
      {medal.map((m) => (
        <line key={m.label} x1={m.x} y1="152" x2={m.x} y2="176" stroke={c} strokeOpacity="0.35" strokeDasharray="2 3" />
      ))}
      {!reduce &&
        models.map((m, i) => (
          <Packet key={m.label} d={`M72 130 L316 130 C330 130 330 ${m.y} 342 ${m.y}`} color={c} dur={2.8} begin={1 + i * 0.9} />
        ))}
      <Node x={40} y={130} w={64} label="On-prem" color="rgba(238,242,247,0.6)" />
      {medal.map((m, i) => <Node key={m.label} x={m.x} y={130} w={64} label={m.label} color={m.color} strong={i === 2} />)}
      {models.map((m) => <Node key={m.label} x={390} y={m.y} w={96} h={40} label={m.label} color={c} />)}
    </svg>
  )
}

function Warehouse({ accent }) {
  const c = HEX[accent]
  const reduce = useReducedMotion()
  const ys = Array.from({ length: 20 }, (_, i) => 22 + i * 11.4)
  const route = (y) => `M30 ${y} C115 ${y} 115 130 170 130 L335 130`
  return (
    <svg viewBox="0 0 440 260" className="block h-auto w-full" role="img" aria-label="More than twenty source systems converge into one Snowflake enterprise warehouse and a common information model that feeds reporting">
      {ys.map((y, i) => (
        <g key={y}>
          <Wire d={`M30 ${y} C115 ${y} 115 130 170 130`} delay={i * 0.03} />
          <motion.circle
            cx="26" cy={y} r="3.4" fill="#0A0F1F" stroke={c} strokeWidth="1.3"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
          />
        </g>
      ))}
      <Wire d="M299 130 L340 130" delay={0.8} />
      {!reduce &&
        [1, 4, 7, 10, 13, 16, 19].map((k, i) => (
          <Packet key={k} d={route(ys[k])} color={i % 2 ? HEX.green : c} dur={2.6} begin={1 + i * 0.45} r={2.8} />
        ))}
      <Node x={235} y={130} w={128} h={56} label="Snowflake EDW" sub="common info model" color={c} strong />
      <Node x={385} y={130} w={90} label="Reporting" sub="trusted" color={HEX.green} />
    </svg>
  )
}

export default function CaseFlow({ kind, accent }) {
  const V = { deposits: Deposits, lakehouse: Lakehouse, warehouse: Warehouse }[kind]
  return V ? <V accent={accent} /> : null
}
