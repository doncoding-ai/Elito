import { useRef, useEffect } from 'react'
import { m as motion, useMotionValue, useSpring } from 'motion/react'
import { SPRING } from '../motion'

/* Magnet — React Bits pattern: the element leans toward a nearby cursor */
export default function Magnet({ children, strength = 0.35, radius = 120, className = '' }) {
  const ref = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, SPRING)
  const sy = useSpring(y, SPRING)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const inRange = Math.abs(dx) < r.width / 2 + radius && Math.abs(dy) < r.height / 2 + radius
      x.set(inRange ? dx * strength : 0)
      y.set(inRange ? dy * strength : 0)
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [strength, radius, x, y])

  return (
    <motion.div ref={ref} style={{ x: sx, y: sy }} className={`inline-block ${className}`}>
      {children}
    </motion.div>
  )
}
