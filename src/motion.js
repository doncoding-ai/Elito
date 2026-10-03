// The whole site speaks with two curves — see the spec's Motion system.
export const EASE_OUT = [0.22, 1, 0.36, 1]
export const SPRING = { type: 'spring', stiffness: 300, damping: 30 }

// Standard "arrive on scroll" preset: rise 24px, fade in, 0.7s.
export const enter = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.7, ease: EASE_OUT },
}
