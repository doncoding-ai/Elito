import { useEffect, useRef } from 'react'
import { Renderer, Program, Mesh, Triangle, Color } from 'ogl'

/*
  Aurora — WebGL light ribbons (React Bits' Aurora approach, rebuilt for this
  site). Electric blue → neon green → deep blue across the sky. The ribbon
  swells and brightens toward the cursor (uMouse), so the sky reacts to you.
*/

const VERT = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`

const FRAG = `#version 300 es
precision highp float;
uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;
uniform vec2 uMouse;
uniform float uMouseStrength;
out vec4 fragColor;

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

vec3 ramp(float t) {
  if (t < 0.5) return mix(uColorStops[0], uColorStops[1], t / 0.5);
  return mix(uColorStops[1], uColorStops[2], (t - 0.5) / 0.5);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec3 rampColor = ramp(uv.x);

  // cursor influence: a swell in the ribbon under the cursor
  float near = exp(-pow((uv.x - uMouse.x) * 3.2, 2.0));
  float lift = near * uMouseStrength;

  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * (uAmplitude + lift * 0.9);
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height * (1.0 + lift * 0.8);

  float midPoint = 0.20;
  float alpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);
  vec3 color = intensity * rampColor * 1.45;
  fragColor = vec4(color * alpha, alpha);
}
`

const DEFAULT_STOPS = ['#2F8BFF', '#39FF88', '#1B3BFF']

export default function Aurora({
  colorStops = DEFAULT_STOPS,
  amplitude = 1.25,
  blend = 0.38,
  speed = 0.6,
  className = '',
}) {
  const wrap = useRef(null)

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let renderer
    try {
      renderer = new Renderer({ alpha: true, premultipliedAlpha: true, antialias: true, dpr: Math.min(window.devicePixelRatio || 1, 1.5), webgl: 2 })
    } catch {
      return // no WebGL: the photo carries the hero on its own
    }
    const gl = renderer.gl
    gl.clearColor(0, 0, 0, 0)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.canvas.style.width = '100%'
    gl.canvas.style.height = '100%'
    gl.canvas.style.display = 'block'

    const geometry = new Triangle(gl)
    if (geometry.attributes.uv) delete geometry.attributes.uv

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: amplitude },
        uColorStops: { value: colorStops.map((c) => { const k = new Color(c); return [k.r, k.g, k.b] }) },
        uResolution: { value: [el.offsetWidth, el.offsetHeight] },
        uBlend: { value: blend },
        uMouse: { value: [0.7, 0.5] },
        uMouseStrength: { value: 0 },
      },
    })
    const mesh = new Mesh(gl, { geometry, program })
    el.appendChild(gl.canvas)

    const resize = () => {
      renderer.setSize(el.offsetWidth, el.offsetHeight)
      program.uniforms.uResolution.value = [el.offsetWidth * renderer.dpr, el.offsetHeight * renderer.dpr]
    }
    resize()
    window.addEventListener('resize', resize)

    // cursor → smoothed uniforms
    const target = { x: 0.7, s: 0 }
    const cur = { x: 0.7, s: 0 }
    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      target.x = (e.clientX - r.left) / r.width
      const inside = e.clientY >= r.top && e.clientY <= r.bottom
      target.s = inside ? 1 : 0
    }
    const onLeave = () => { target.s = 0 }
    window.addEventListener('pointermove', onMove)
    document.addEventListener('pointerleave', onLeave)

    let raf, visible = true
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting })
    io.observe(el)

    const start = performance.now()
    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      if (!visible || document.hidden) return
      cur.x += (target.x - cur.x) * 0.06
      cur.s += (target.s - cur.s) * 0.05
      program.uniforms.uTime.value = reduce ? 4 : ((now - start) / 1000) * speed
      program.uniforms.uMouse.value = [cur.x, 0.5]
      program.uniforms.uMouseStrength.value = cur.s
      renderer.render({ scene: mesh })
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      if (gl.canvas.parentNode === el) el.removeChild(gl.canvas)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [amplitude, blend, speed, colorStops.join()])

  return <div ref={wrap} className={className} aria-hidden="true" />
}
