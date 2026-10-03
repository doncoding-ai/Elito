import { lazy, Suspense, useEffect, useState } from 'react'
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react'
import profile from '../data/profile.json'
import Nav from './components/Nav'
import Hero from './components/Hero'

/*
  Load order, for a fast first screen:
  1. This bundle: React, Motion, the nav and the hero — enough to paint the
     name, the photo and the buttons.
  2. Right after that first paint: everything below the hero, in one bundle
     (./Below), and the aurora's WebGL code (see Hero.jsx).
*/
const loadBelow = () => import('./Below')
const Below = lazy(loadBelow)

export default function App() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    // start fetching the rest once the hero is on screen, not before
    const go = () => { loadBelow(); setReady(true) }
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 200))
    const id = idle(go, { timeout: 1200 })
    return () => (window.cancelIdleCallback || clearTimeout)(id)
  }, [])

  return (
    // reducedMotion="user": visitors who ask for less motion get fades only
    // LazyMotion + domAnimation: only the animation features this site uses
    // (animations, variants, exit, hover/tap, in-view). strict flags any stray full import.
    <LazyMotion features={domAnimation} strict>
    <MotionConfig reducedMotion="user">
      <Nav profile={profile} />
      <main>
        <Hero profile={profile} />
        {ready && (
          <Suspense fallback={<div className="min-h-[100svh]" aria-hidden="true" />}>
            <Below profile={profile} />
          </Suspense>
        )}
      </main>
    </MotionConfig>
    </LazyMotion>
  )
}
