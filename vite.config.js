import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// base './' keeps every asset path relative, so the same build works on
// GitHub Pages (doncoding-ai.github.io/Elito/) and in any preview host.
//
// `vite build --mode preview-page` packs the whole site (code, fonts,
// portrait) into one self-contained HTML file for sharing a preview link.

/*
  The hero is drawn by React, so the browser only discovers the skyline photo
  and the name's font after the JavaScript has run. These hints in <head> let
  it fetch them alongside the code instead.
*/
function preloadHero() {
  const pick = (bundle, re) => Object.keys(bundle).find((f) => re.test(f))
  return {
    name: 'preload-hero',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const b = ctx.bundle
        if (!b) return html
        const city = pick(b, /assets\/nairobi-night-[\w-]+\.webp$/)
        const citySm = pick(b, /assets\/nairobi-night-sm-[\w-]+\.webp$/)
        const fonts = [/sora-latin-800-normal-[\w-]+\.woff2$/, /inter-latin-400-normal-[\w-]+\.woff2$/]
          .map((re) => pick(b, re))
          .filter(Boolean)
        const tags = []
        if (city && citySm) {
          tags.push(
            `<link rel="preload" as="image" href="./${city}" imagesrcset="./${citySm} 1100w, ./${city} 1920w" imagesizes="100vw" fetchpriority="high">`
          )
        }
        fonts.forEach((f) => tags.push(`<link rel="preload" as="font" type="font/woff2" href="./${f}" crossorigin>`))
        return html.replace('</head>', `    ${tags.join('\n    ')}\n  </head>`)
      },
    },
  }
}

export default defineConfig(({ mode }) => {
  const single = mode === 'preview-page'
  return {
    base: './',
    plugins: [react(), tailwindcss(), ...(single ? [viteSingleFile()] : [preloadHero()])],
    build: single
      ? { outDir: 'dist-preview', assetsInlineLimit: 100_000_000, copyPublicDir: false }
      : {},
  }
})
