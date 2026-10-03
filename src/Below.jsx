import { useEffect } from 'react'
import story from '../data/story.json'
import Impact from './components/Impact'
import HowILead from './components/HowILead'
import CaseStudies from './components/CaseStudies'
import Journey from './components/Journey'
import Toolkit from './components/Toolkit'
import Contact from './components/Contact'

/* Everything under the hero. Shipped as its own bundle so the first screen
   doesn't wait for it; see App.jsx for when it loads. */
export default function Below({ profile }) {
  // A link straight to a section (…/#contact) can only land once this part exists.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (id) document.getElementById(id)?.scrollIntoView()
  }, [])
  return (
    <>
      <Impact profile={profile} />
      <HowILead story={story} />
      <CaseStudies story={story} />
      <Journey profile={profile} />
      <Toolkit profile={profile} />
      <Contact profile={profile} story={story} />
    </>
  )
}
