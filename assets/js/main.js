/* ============================================================
   ELIJAH NDETO — v4.0 "EXECUTIVE AURORA"
   One aurora light-field (a WebGL fragment shader) whose colours
   travel with you. Frosted glass skill orbs. Luminous rain in the
   hero. Silk motion (GSAP + SplitText), Lenis smooth scroll.
   Soft musical pad.
   Data-driven from data/profile.json.
   ============================================================ */

const $ = (s) => document.querySelector(s);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGsap = typeof gsap !== 'undefined';
const hasST = hasGsap && typeof ScrollTrigger !== 'undefined';
const hasSplit = hasGsap && typeof SplitText !== 'undefined';
if (hasST) gsap.registerPlugin(ScrollTrigger);
if (hasSplit) gsap.registerPlugin(SplitText);
if (!hasGsap || reduceMotion) document.documentElement.classList.remove('js-motion');

/* Lenis smooth scroll, driven by GSAP's ticker so ScrollTrigger stays in lockstep */
const lenis = (() => {
  if (reduceMotion || typeof Lenis === 'undefined') return null;
  const l = new Lenis({ lerp: 0.09, anchors: true, autoRaf: !hasGsap });
  if (hasGsap) {
    gsap.ticker.add((time) => l.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  if (hasST) l.on('scroll', ScrollTrigger.update);
  return l;
})();

/* ============================================================
   1. DATA LOAD + RENDER
   ============================================================ */
fetch('data/profile.json')
  .then((r) => r.json())
  .then(render)
  .catch((e) => {
    console.error('profile.json failed to load:', e);
    document.documentElement.classList.remove('js-motion');
  });

function render(p) {
  $('#heroTag').textContent = p.identity.tagline;
  $('#cvDownload').href = p.cv_download || 'cv/latest.pdf';
  $('#buildStamp').textContent = 'Updated ' + (p.generated_at || '');
  $('#year').textContent = new Date().getFullYear();
  cycleRoles(p.identity.roles);

  // impact cards
  const tg = $('#telemetryGrid');
  p.telemetry.forEach((t) => {
    const el = document.createElement('div');
    el.className = 'telemetry-card reveal';
    el.innerHTML = `
      <div class="telemetry-value" data-target="${t.value}" data-suffix="${t.suffix || ''}">0</div>
      <div class="telemetry-label">${t.label}</div>
      <div class="telemetry-detail">${t.detail || ''}</div>`;
    tg.appendChild(el);
  });

  // dashboard stickers — leadership voice
  const stickers = [
    ['99.9% uptime', 'up'],
    ['Near real-time', ''],
    ['5 roles · 3 companies', 'gold'],
    ['GCP · Snowflake · Databricks', ''],
  ];
  const ds = $('#dashStickers');
  stickers.forEach(([txt, cls]) => {
    const s = document.createElement('span');
    s.className = 'sticker ' + cls;
    s.textContent = txt;
    ds.appendChild(s);
  });

  // journey
  const pl = $('#pipelineList');
  p.experience.forEach((x) => {
    const el = document.createElement('article');
    el.className = 'stage';
    el.innerHTML = `
      <div class="stage-head">
        <span class="stage-role">${x.role}</span>
        <span class="stage-tag">${(x.tag || '').toLowerCase()}</span>
      </div>
      <div class="stage-meta"><b>${x.company}</b> · ${x.period}</div>
      <ul>${x.bullets.map((b) => `<li>${b}</li>`).join('')}</ul>
      <div class="stage-stack">${(x.stack || []).map((s) => `<span class="chip">${s}</span>`).join('')}</div>`;
    pl.appendChild(el);
  });

  // craft
  const sg = $('#stackGroups');
  p.stack.forEach((g) => {
    const el = document.createElement('div');
    el.className = 'stack-group reveal';
    el.innerHTML = `
      <h3>${g.group}</h3>
      <div class="stack-items">${g.items.map((i) => `<span class="stack-item">${i}</span>`).join('')}</div>`;
    sg.appendChild(el);
  });

  const beams = $('#beams');
  p.proficiency.forEach((b) => {
    const row = document.createElement('div');
    row.className = 'beam-row';
    row.innerHTML = `
      <div class="beam-head"><span>${b.skill}</span><span class="lv">${b.level}%</span></div>
      <div class="beam-track"><div class="beam-fill" data-level="${b.level}"></div></div>`;
    beams.appendChild(row);
  });

  // work
  const pg = $('#projectsGrid');
  p.projects.forEach((pr, i) => {
    const el = document.createElement('div');
    el.className = 'project-card reveal';
    el.innerHTML = `
      <div class="project-idx">${String(i + 1).padStart(2, '0')}</div>
      <div class="project-platform">${pr.platform}</div>
      <div class="project-name">${pr.name}</div>
      <div class="project-desc">${pr.description}</div>
      <div class="stage-stack">${(pr.stack || []).map((s) => `<span class="chip">${s}</span>`).join('')}</div>`;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    });
    pg.appendChild(el);
  });

  // contact
  const sl = $('#signalLinks');
  const id = p.identity;
  [['Email me', 'mailto:' + id.email],
   ['LinkedIn', id.linkedin],
   ['GitHub', id.github]].forEach(([label, href]) => {
    const a = document.createElement('a');
    a.textContent = label;
    a.href = href;
    a.setAttribute('data-magnetic', '');
    if (href.startsWith('http')) { a.target = '_blank'; a.rel = 'noopener'; }
    sl.appendChild(a);
  });
  $('#eduLine').textContent = p.education.degree + ' — ' + p.education.school + ', ' + p.education.period;

  observeReveals();
  buildDashboard(p);
  spawnOrbs(p);
  magneticButtons();
  // letters are measured when split, so wait for the real fonts
  document.fonts.ready.then(() => {
    heroEntrance();
    sectionMotion();
    if (hasST) ScrollTrigger.refresh();
    if (lenis) lenis.resize();
  });
}

/* ============================================================
   2. ROLE CYCLER — gentle fade, no typing
   ============================================================ */
function cycleRoles(roles) {
  const el = $('#roleCycle');
  if (reduceMotion || roles.length < 2) { el.textContent = roles[0]; return; }
  let i = 0;
  setInterval(() => {
    el.style.opacity = 0;
    setTimeout(() => {
      i = (i + 1) % roles.length;
      el.textContent = roles[i];
      el.style.opacity = 1;
    }, 420);
  }, 3800);
}

/* ============================================================
   3. REVEALS + COUNTERS + BEAMS
   ============================================================ */
function observeReveals() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      if (e.target.matches('.telemetry-card')) countUp(e.target.querySelector('.telemetry-value'));
      io.unobserve(e.target);
    });
  }, { threshold: 0.2 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  const beamsIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.querySelectorAll('.beam-fill').forEach((f) => { f.style.width = f.dataset.level + '%'; });
      beamsIO.unobserve(e.target);
    });
  }, { threshold: 0.3 });
  beamsIO.observe($('#beams'));
}

function countUp(el) {
  if (!el || el.dataset.done) return;
  el.dataset.done = '1';
  const target = +el.dataset.target;
  const suffix = el.dataset.suffix || '';
  if (reduceMotion) { el.textContent = target + suffix; return; }
  const dur = 1300, start = performance.now();
  (function tick(now) {
    const t = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(target * eased) + (t === 1 ? suffix : '');
    if (t < 1) requestAnimationFrame(tick);
  })(start);
}

/* ============================================================
   4. NAV
   ============================================================ */
window.addEventListener('scroll', () => {
  $('#nav').classList.toggle('scrolled', window.scrollY > 40);
});
$('#navBurger').addEventListener('click', () => {
  document.querySelector('.nav-links').classList.toggle('open');
});
document.querySelectorAll('.nav-links a').forEach((a) =>
  a.addEventListener('click', () => document.querySelector('.nav-links').classList.remove('open'))
);

/* ============================================================
   5. AURORA — one fragment shader on the GPU. Three curtains of
   light, drifting rays and faint stars; colours travel with the
   chapters, the cursor bends the light, scrolling stirs it.
   ============================================================ */
const AURORA_FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uScroll;
uniform float uVel;
uniform vec3 uC0;
uniform vec3 uC1;
uniform vec3 uC2;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

// one curtain: a wandering band with a crisp lower hem, a long soft
// glow above it, and vertical rays shimmering through
vec3 curtain(vec2 p, float t, float base, float seed, vec3 col) {
  float wander = fbm(vec2(p.x * 0.55 + seed, t * 0.06 + seed * 1.3)) - 0.5;
  float d = p.y - (base + wander * 0.6);
  float band = d > 0.0 ? exp(-d * d / 0.07) : exp(-d * d / 0.004);
  float rays = fbm(vec2(p.x * 6.0 + seed * 4.0 + wander * 3.0, t * 0.22));
  rays = smoothstep(0.3, 0.8, rays);
  return col * band * (0.3 + 1.1 * rays);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2((uv.x - 0.5) * aspect, uv.y);

  // cursor: curtains lean toward the pointer and glow a little around it
  vec2 m = vec2(uMouse.x * 0.5 * aspect, 0.5 - uMouse.y * 0.5);
  vec2 dm = p - m;
  float near = exp(-dot(dm, dm) * 5.0);
  p -= dm * near * 0.12;

  // scroll: the sky slides sideways and the curtains sink as you read
  float t = uTime;
  p.x += uScroll * 1.4;
  float sink = uScroll * 0.25;

  vec3 col = vec3(0.0);
  col += curtain(p, t, 0.78 - sink, 0.0, uC0);
  col += curtain(p, t * 1.15, 0.55 - sink, 3.7, uC1) * 0.85;
  col += curtain(p, t * 0.9, 0.32 - sink, 7.9, uC2) * 0.7;
  // calmer once you're reading; a little brighter while the page moves
  col *= (0.3 + uVel * 0.12) * (1.0 - 0.3 * smoothstep(0.03, 0.2, uScroll));
  col += mix(uC0, uC1, 0.5) * near * 0.05;

  // stars, with a touch of scroll parallax
  vec2 sp = (p + vec2(0.0, uScroll * 0.35)) * 210.0;
  float h = hash(floor(sp));
  float star = step(0.997, h) * (0.55 + 0.45 * sin(t * 1.6 + h * 80.0));
  star *= smoothstep(0.32, 0.0, length(fract(sp) - 0.5));
  col += vec3(0.62, 0.77, 1.0) * star * 0.5;

  vec3 ink = vec3(0.024, 0.043, 0.078);
  vec3 c = ink + col;
  c *= 1.0 - 0.35 * length(uv - 0.5);
  c += (hash(gl_FragCoord.xy + fract(t)) - 0.5) / 255.0;
  gl_FragColor = vec4(c, 1.0);
}`;

const Aurora = (() => {
  const canvas = document.getElementById('aurora');
  const gl = canvas && canvas.getContext('webgl', {
    alpha: false, antialias: false, depth: false, powerPreference: 'low-power',
  });
  if (!gl) return { set() {} };

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  const prog = gl.createProgram();
  try {
    gl.attachShader(prog, compile(gl.VERTEX_SHADER,
      'attribute vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }'));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, AURORA_FRAG));
    gl.linkProgram(prog);
  } catch (e) {
    console.error('aurora shader failed:', e);
    return { set() {} };
  }
  gl.useProgram(prog);

  // one oversized triangle covers the screen
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aLoc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(aLoc);
  gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);

  const U = {};
  ['uRes', 'uTime', 'uMouse', 'uScroll', 'uVel', 'uC0', 'uC1', 'uC2']
    .forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });

  /* scene palettes — the aurora re-colours per chapter */
  const SCENES = {
    hero:    ['#5EEAD4', '#60A5FA', '#A78BFA'],
    impact:  ['#60A5FA', '#5EEAD4', '#7DD3FC'],
    journey: ['#5EEAD4', '#86EFAC', '#60A5FA'],
    craft:   ['#F0ABFC', '#A78BFA', '#60A5FA'],
    work:    ['#A78BFA', '#60A5FA', '#5EEAD4'],
    contact: ['#E8C77B', '#FDE68A', '#F0ABFC'],
  };
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const colors = SCENES.hero.map(rgb);
  let targets = colors.map((c) => c.slice());

  // the aurora is soft, so render it below screen resolution and let CSS upscale
  const scale = window.innerWidth < 700 ? 0.5 : 0.65;
  function size() {
    canvas.width = Math.max(1, Math.round(window.innerWidth * scale));
    canvas.height = Math.max(1, Math.round(window.innerHeight * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  size();

  let mx = 0, my = 0, smx = 0, smy = 0, vel = 0, lastY = window.scrollY, time = 8;
  window.addEventListener('pointermove', (e) => {
    mx = (e.clientX / window.innerWidth - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function progress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? window.scrollY / max : 0;
  }

  function draw() {
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform1f(U.uTime, time);
    gl.uniform2f(U.uMouse, smx, smy);
    gl.uniform1f(U.uScroll, progress());
    gl.uniform1f(U.uVel, vel);
    gl.uniform3fv(U.uC0, colors[0]);
    gl.uniform3fv(U.uC1, colors[1]);
    gl.uniform3fv(U.uC2, colors[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  if (reduceMotion) {
    const still = () => { size(); draw(); };
    window.addEventListener('resize', still);
    window.addEventListener('scroll', () => requestAnimationFrame(draw), { passive: true });
    draw();
    return {
      set(name) {
        (SCENES[name] || SCENES.hero).forEach((h, i) => { colors[i] = rgb(h); });
        draw();
      },
    };
  }

  window.addEventListener('resize', size);
  let last = performance.now();
  (function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) { last = now; return; }
    const dt = Math.min(Math.max(now - last, 0) / 16.67, 2.5);
    last = now;

    const y = window.scrollY;
    const v = Math.min(Math.abs(y - lastY) / 40, 1);
    lastY = y;
    vel += (v - vel) * 0.06 * dt;
    time += (dt / 60) * (1 + vel * 3);

    smx += (mx - smx) * 0.04 * dt;
    smy += (my - smy) * 0.04 * dt;
    colors.forEach((c, i) => {
      for (let k = 0; k < 3; k++) c[k] += (targets[i][k] - c[k]) * 0.025 * dt;
    });
    draw();
  })(last);

  return {
    set(name) { targets = (SCENES[name] || SCENES.hero).map(rgb); },
  };
})();

/* scene watcher — centerline detection, works at any section height */
(function watchScenes() {
  const sections = [...document.querySelectorAll('[data-scene]')];
  let current = null, ticking = false;
  function detect() {
    ticking = false;
    const mid = window.innerHeight * 0.5;
    for (const s of sections) {
      const r = s.getBoundingClientRect();
      if (r.top <= mid && r.bottom >= mid) {
        const sc = s.dataset.scene;
        if (sc !== current) {
          current = sc;
          Aurora.set(sc);
          Pad.set(sc);
        }
        return;
      }
    }
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(detect); }
  }, { passive: true });
  window.addEventListener('resize', detect);
  requestAnimationFrame(detect);
})();

/* ============================================================
   6. LUMINOUS RAIN — hero only, three depth layers, soft
   ============================================================ */
(function rain() {
  const canvas = document.getElementById('rain');
  const hero = document.querySelector('.hero');
  if (!canvas || !hero || reduceMotion) return;
  const ctx = canvas.getContext('2d');
  let W, H, dpr;

  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = hero.clientWidth; H = hero.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  window.addEventListener('resize', size);

  /* three depth layers: far (slow, thin, dim) → near (fast, long, bright) */
  const LAYERS = [
    { n: 26, v: 2.2, len: 10, w: 0.8, a: 0.10 },
    { n: 18, v: 3.6, len: 16, w: 1.1, a: 0.16 },
    { n: 10, v: 5.4, len: 26, w: 1.5, a: 0.24 },
  ];
  const drops = [];
  LAYERS.forEach((L, li) => {
    for (let i = 0; i < L.n; i++) {
      drops.push({
        li, x: Math.random() * 1.2 - 0.1, y: Math.random(),
        v: L.v * (0.85 + Math.random() * 0.3),
      });
    }
  });
  const splashes = [];

  let last = performance.now();
  (function frame(now) {
    requestAnimationFrame(frame);
    const r = hero.getBoundingClientRect();
    if (r.bottom < 0) return; // hero off screen — sleep
    const dt = Math.min(Math.max(now - last, 0) / 16.67, 2.5);
    last = now;
    ctx.clearRect(0, 0, W, H);

    drops.forEach((d) => {
      const L = LAYERS[d.li];
      d.y += (d.v / H) * dt * 2.2;
      d.x += 0.00018 * dt; // faint diagonal wind
      if (d.y > 0.94 - Math.random() * 0.06) {
        if (d.li === 2 && Math.random() < 0.5) {
          splashes.push({ x: d.x * W, y: d.y * H, r: 1, life: 1 });
        }
        d.y = -0.05; d.x = Math.random() * 1.2 - 0.1;
      }
      const x = d.x * W, y = d.y * H;
      const g = ctx.createLinearGradient(x, y - L.len, x, y);
      g.addColorStop(0, 'rgba(140,190,255,0)');
      g.addColorStop(1, `rgba(160,215,255,${L.a})`);
      ctx.strokeStyle = g;
      ctx.lineWidth = L.w;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y - L.len);
      ctx.lineTo(x, y);
      ctx.stroke();
    });

    for (let i = splashes.length - 1; i >= 0; i--) {
      const s = splashes[i];
      s.r += 0.9 * dt; s.life -= 0.03 * dt;
      if (s.life <= 0) { splashes.splice(i, 1); continue; }
      ctx.strokeStyle = `rgba(160,215,255,${s.life * 0.22})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, s.r, s.r * 0.32, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  })(last);
})();

/* ============================================================
   7. GLASS SKILL ORBS — frosted, floating at the edges,
   never near the name. Real backdrop blur (DOM, not canvas).
   ============================================================ */
function spawnOrbs(p) {
  const field = $('#orbField');
  if (!field) return;
  const skills = [];
  (p.stack || []).forEach((g) => skills.push(...g.items));
  const pick = ['BigQuery', 'Snowflake', 'Databricks', 'Cloud Run', 'Pub/Sub',
                'dbt', 'Kafka', 'Python', 'SQL', 'Airflow']
    .filter((s) => skills.includes(s));
  const list = pick.length >= 6 ? pick : skills.slice(0, 10);

  const mobile = window.innerWidth < 700;
  const count = mobile ? 4 : 9;

  /* edge bands: left 0–16vw and right 84–100vw — the center stays clear */
  for (let i = 0; i < count; i++) {
    const orb = document.createElement('div');
    orb.className = 'orb';
    orb.innerHTML = `<small>${list[i % list.length]}</small>`;
    const size = mobile ? 62 + Math.random() * 20 : 76 + Math.random() * 40;
    orb.style.width = orb.style.height = size + 'px';
    orb.style.fontSize = (size * 0.16) + 'px';
    const left = i % 2 === 0;
    orb.style.left = left
      ? (1 + Math.random() * 11) + 'vw'
      : (84 + Math.random() * 10) + 'vw';
    orb.style.top = (8 + Math.random() * 78) + 'vh';
    field.appendChild(orb);

    if (reduceMotion) { orb.style.opacity = 0.6; continue; }
    if (typeof gsap !== 'undefined') {
      gsap.to(orb, { opacity: 0.75, duration: 1.6, delay: 0.8 + i * 0.18, ease: 'power2.out' });
      gsap.to(orb, {
        y: (Math.random() < 0.5 ? -1 : 1) * (18 + Math.random() * 26),
        x: (Math.random() < 0.5 ? -1 : 1) * (8 + Math.random() * 14),
        duration: 5 + Math.random() * 4,
        yoyo: true, repeat: -1, ease: 'sine.inOut',
      });
      gsap.to(orb, {
        rotation: (Math.random() - 0.5) * 10,
        duration: 7 + Math.random() * 5,
        yoyo: true, repeat: -1, ease: 'sine.inOut',
      });
    } else {
      orb.style.opacity = 0.7;
    }
  }

  /* soft cursor parallax on the whole field */
  if (!reduceMotion && typeof gsap !== 'undefined') {
    window.addEventListener('pointermove', (e) => {
      const dx = (e.clientX / window.innerWidth - 0.5);
      const dy = (e.clientY / window.innerHeight - 0.5);
      gsap.to(field, { x: dx * 18, y: dy * 12, duration: 1.2, ease: 'power2.out' });
    });
  }
}

/* ============================================================
   8. HERO ENTRANCE + SECTION MOTION — the choreography
   ============================================================ */
/* SplitText breaks a gradient-clipped headline into pieces; give each piece
   its own slice of the parent's gradient so the colour stays continuous */
function splitWithGradient(el, vars) {
  const split = SplitText.create(el, vars);
  if (getComputedStyle(el).getPropertyValue('--grad').trim()) {
    const box = el.getBoundingClientRect();
    split.chars.forEach((c) => {
      const b = c.getBoundingClientRect();
      c.classList.add('grad-piece');
      c.style.backgroundSize = `${box.width}px ${box.height}px`;
      c.style.backgroundPosition = `${box.left - b.left}px ${box.top - b.top}px`;
    });
    el.classList.add('grad-split');
  }
  return split;
}

function unsplit(el, split) {
  split.revert();
  el.classList.remove('grad-split');
}

function heroEntrance() {
  if (reduceMotion || !hasGsap) return;
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from('#heroHello', { y: 18, opacity: 0, duration: 0.7 }, 0.2);

  // the name arrives letter by letter, each line rising out of its mask
  const names = gsap.utils.toArray('.name-line > span');
  if (hasSplit) {
    names.forEach((el, i) => {
      const split = splitWithGradient(el, { type: 'chars' });
      tl.from(split.chars, {
        yPercent: 118, rotate: 7, opacity: 0, duration: 1.1, ease: 'power4.out', stagger: 0.045,
        onComplete: () => unsplit(el, split),
      }, 0.35 + i * 0.18);
    });
  } else {
    tl.from(names, { yPercent: 110, duration: 1.05, stagger: 0.12, ease: 'power4.out' }, 0.35);
  }

  tl.from('.hero-role', { y: 16, opacity: 0, duration: 0.7 }, 1.05)
    .from('.hero-tag', { y: 16, opacity: 0, duration: 0.7 }, 1.2)
    .from('.hero-actions .btn', { y: 18, opacity: 0, duration: 0.6, stagger: 0.1 }, 1.35)
    .from('.scroll-cue', { opacity: 0, duration: 0.8 }, 1.7);
  // every piece now holds its start state, so the hero can be shown
  document.documentElement.classList.remove('js-motion');
}

function sectionMotion() {
  if (reduceMotion || !hasST) {
    document.querySelector('.pipeline')?.style.setProperty('--line-grow', 1);
    return;
  }

  // eyebrow and sub rise in, one voice everywhere
  gsap.utils.toArray('.st-reveal:not(.section-title)').forEach((el) => {
    gsap.from(el, {
      y: 36, opacity: 0, duration: 0.85, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 86%', once: true },
    });
  });

  // headlines type themselves in, letter by letter, line by line
  gsap.utils.toArray('.section-title').forEach((el) => {
    const trigger = { trigger: el, start: 'top 86%', once: true };
    if (!hasSplit) {
      gsap.from(el, { y: 36, opacity: 0, duration: 0.85, ease: 'power3.out', scrollTrigger: trigger });
      return;
    }
    const split = splitWithGradient(el, { type: 'lines,chars', mask: 'lines' });
    gsap.from(split.chars, {
      yPercent: 110, duration: 0.9, ease: 'power4.out', stagger: 0.016,
      scrollTrigger: trigger,
      onComplete: () => unsplit(el, split),
    });
  });

  // journey spine grows with scroll
  gsap.fromTo('.pipeline', { '--line-grow': 0 }, {
    '--line-grow': 1, ease: 'none',
    scrollTrigger: {
      trigger: '.pipeline', start: 'top 72%', end: 'bottom 60%', scrub: 0.6,
    },
  });

  // journey cards settle in
  gsap.utils.toArray('#journey .stage').forEach((card) => {
    gsap.from(card, {
      y: 40, opacity: 0, duration: 0.85, ease: 'power3.out',
      scrollTrigger: { trigger: card, start: 'top 86%', once: true },
    });
  });

  // dashboard lifts in as one piece
  gsap.from('.dashboard', {
    y: 46, opacity: 0, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: '.dashboard', start: 'top 82%', once: true },
  });

  // gentle parallax: hero content drifts up slower than the scroll
  gsap.to('.hero-inner', {
    y: -70, opacity: 0.25, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
}

/* magnetic buttons — they lean toward the cursor */
function magneticButtons() {
  if (reduceMotion || typeof gsap === 'undefined') return;
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      gsap.to(el, { x: dx * 0.18, y: dy * 0.22, duration: 0.4, ease: 'power2.out' });
    });
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    });
  });
}

/* ============================================================
   9. DASHBOARD — bar / donut / area in aurora colours
   ============================================================ */
function buildDashboard(p) {
  const dpr = window.devicePixelRatio || 1;
  const font = (px) => `${px * dpr}px "Inter", sans-serif`;

  function prep(canvas) {
    const w = canvas.clientWidth, h = +canvas.getAttribute('height');
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.height = h + 'px';
    return [canvas.getContext('2d'), w * dpr, h * dpr];
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      drawBar(); drawDonut(); drawArea();
    });
  }, { threshold: 0.25 });
  io.observe($('#barChart'));

  const C = { mint: '#5EEAD4', azure: '#60A5FA', violet: '#A78BFA', gold: '#E8C77B', sky: '#7DD3FC' };

  function drawBar() {
    const [ctx, W, H] = prep($('#barChart'));
    const rows = [
      ['Audit', 8, C.sky],
      ['Modeling', 40, C.azure],
      ['Architecture', 20, C.mint],
      ['Lakehouse', 15, C.gold],
      ['Streaming', 12, C.violet],
    ];
    const max = 45, bw = W / rows.length * 0.5, gap = W / rows.length;
    let t0 = null;
    (function anim(ts) {
      if (!t0) t0 = ts;
      const k = Math.min((ts - t0) / 950, 1);
      const ease = 1 - Math.pow(1 - k, 3);
      ctx.clearRect(0, 0, W, H);
      rows.forEach(([label, val, color], i) => {
        const h = (val / max) * (H - 48 * dpr) * ease;
        const x = i * gap + (gap - bw) / 2;
        const y = H - 26 * dpr - h;
        const g = ctx.createLinearGradient(0, y, 0, y + h);
        g.addColorStop(0, color); g.addColorStop(1, color + '22');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.roundRect(x, y, bw, h, 6 * dpr);
        ctx.fill();
        ctx.fillStyle = '#93A5BC';
        ctx.font = font(9);
        ctx.textAlign = 'center';
        ctx.fillText(label, x + bw / 2, H - 10 * dpr);
        ctx.fillStyle = color;
        ctx.font = `600 ${11 * dpr}px "Inter", sans-serif`;
        ctx.fillText(Math.round(val * ease), x + bw / 2, y - 7 * dpr);
      });
      if (k < 1 && !reduceMotion) requestAnimationFrame(anim);
    })(performance.now());
  }

  function drawDonut() {
    const [ctx, W, H] = prep($('#donutChart'));
    const slices = (p.stack || []).map((g, i) => ({
      label: g.group.split(' ')[0],
      val: g.items.length,
      color: [C.mint, C.azure, C.sky, C.gold, C.violet][i % 5],
    }));
    const total = slices.reduce((s, x) => s + x.val, 0);
    const cx = W * 0.32, cy = H / 2, R = Math.min(W, H) * 0.32;
    let t0 = null;
    (function anim(ts) {
      if (!t0) t0 = ts;
      const k = Math.min((ts - t0) / 1050, 1);
      const ease = 1 - Math.pow(1 - k, 3);
      ctx.clearRect(0, 0, W, H);
      let a = -Math.PI / 2;
      slices.forEach((s) => {
        const span = (s.val / total) * Math.PI * 2 * ease;
        ctx.beginPath();
        ctx.strokeStyle = s.color;
        ctx.lineCap = 'round';
        ctx.lineWidth = R * 0.36;
        ctx.arc(cx, cy, R, a, a + span - 0.05);
        ctx.stroke();
        a += span;
      });
      ctx.fillStyle = '#E9EFF7';
      ctx.font = `700 ${16 * dpr}px "Sora", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(Math.round(total * ease), cx, cy - 2);
      ctx.fillStyle = '#93A5BC';
      ctx.font = font(8);
      ctx.fillText('tools', cx, cy + 14 * dpr);
      slices.forEach((s, i) => {
        const y = H * 0.2 + i * 16 * dpr;
        ctx.beginPath();
        ctx.fillStyle = s.color;
        ctx.arc(W * 0.6 + 4 * dpr, y - 1 * dpr, 4 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#93A5BC';
        ctx.font = font(9);
        ctx.textAlign = 'left';
        ctx.fillText(`${s.label} — ${s.val}`, W * 0.6 + 14 * dpr, y + 2 * dpr);
      });
      if (k < 1 && !reduceMotion) requestAnimationFrame(anim);
    })(performance.now());
  }

  function drawArea() {
    const [ctx, W, H] = prep($('#areaChart'));
    const pts = [12, 28, 46, 62, 80, 96];
    const labels = ['2021', '2022', '2023', '2024', '2025', '2026'];
    let t0 = null;
    (function anim(ts) {
      if (!t0) t0 = ts;
      const k = Math.min((ts - t0) / 1150, 1);
      const ease = 1 - Math.pow(1 - k, 3);
      ctx.clearRect(0, 0, W, H);
      const step = W / (pts.length - 1);
      const yOf = (v) => H - 22 * dpr - (v / 100) * (H - 40 * dpr) * ease;
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, C.azure); grad.addColorStop(.5, C.mint); grad.addColorStop(1, C.gold);
      ctx.beginPath();
      ctx.moveTo(0, H - 22 * dpr);
      pts.forEach((v, i) => ctx.lineTo(i * step, yOf(v)));
      ctx.lineTo(W, H - 22 * dpr);
      ctx.closePath();
      const fg = ctx.createLinearGradient(0, 0, 0, H);
      fg.addColorStop(0, 'rgba(94,234,212,.16)'); fg.addColorStop(1, 'rgba(94,234,212,0)');
      ctx.fillStyle = fg; ctx.fill();
      ctx.beginPath();
      pts.forEach((v, i) => i ? ctx.lineTo(i * step, yOf(v)) : ctx.moveTo(0, yOf(v)));
      ctx.strokeStyle = grad; ctx.lineWidth = 2.4 * dpr; ctx.lineCap = 'round'; ctx.stroke();
      pts.forEach((v, i) => {
        ctx.fillStyle = '#E9EFF7';
        ctx.beginPath(); ctx.arc(i * step, yOf(v), 3.2 * dpr, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#93A5BC'; ctx.font = font(9); ctx.textAlign = 'center';
        ctx.fillText(labels[i], Math.min(Math.max(i * step, 16 * dpr), W - 18 * dpr), H - 6 * dpr);
      });
      if (k < 1 && !reduceMotion) requestAnimationFrame(anim);
    })(performance.now());
  }
}

/* ============================================================
   10. THE PAD — soft chord ambience (unchanged voicing engine)
   ============================================================ */
const Pad = (() => {
  let ac = null, master = null, filter = null, voices = [], enabled = false, mode = 'hero';

  const CHORDS = {
    hero:    { notes: [220.0, 329.6, 440.0], cutoff: 900,  type: 'sine' },
    impact:  { notes: [196.0, 293.7, 392.0], cutoff: 750,  type: 'sine' },
    journey: { notes: [174.6, 261.6, 349.2], cutoff: 650,  type: 'triangle' },
    craft:   { notes: [164.8, 246.9, 329.6], cutoff: 700,  type: 'sine' },
    work:    { notes: [146.8, 220.0, 293.7], cutoff: 600,  type: 'triangle' },
    contact: { notes: [261.6, 392.0, 493.9], cutoff: 1100, type: 'sine' },
  };

  function ensure() {
    if (ac) return;
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain();
    master.gain.value = 0;
    filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.4;

    const lfo = ac.createOscillator();
    const lfoGain = ac.createGain();
    lfo.frequency.value = 0.08;
    lfoGain.gain.value = 0.008;
    lfo.connect(lfoGain);
    lfoGain.connect(master.gain);
    lfo.start();

    master.connect(filter);
    filter.connect(ac.destination);

    for (let v = 0; v < 3; v++) {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      g.gain.value = 0.011;
      osc.detune.value = (v - 1) * 5;
      osc.connect(g);
      g.connect(master);
      osc.start();
      voices.push(osc);
    }
  }

  function voice(el) {
    if (!ac) return;
    const c = CHORDS[el] || CHORDS.hero;
    const t = ac.currentTime;
    voices.forEach((osc, i) => {
      osc.type = c.type;
      osc.frequency.cancelScheduledValues(t);
      osc.frequency.setTargetAtTime(c.notes[i], t, 1.8);
    });
    filter.frequency.cancelScheduledValues(t);
    filter.frequency.setTargetAtTime(c.cutoff, t, 1.5);
  }

  const btn = $('#soundToggle');
  btn.addEventListener('click', () => {
    ensure();
    if (ac.state === 'suspended') ac.resume();
    enabled = !enabled;
    btn.setAttribute('aria-pressed', String(enabled));
    btn.querySelector('.st-icon').textContent = enabled ? '◆' : '◇';
    const t = ac.currentTime;
    master.gain.cancelScheduledValues(t);
    if (enabled) {
      voice(mode);
      master.gain.setTargetAtTime(0.045, t, 1.2);
    } else {
      master.gain.setTargetAtTime(0, t, 0.6);
    }
  });

  return {
    set(el) {
      mode = el;
      if (enabled && ac) voice(el);
    },
  };
})();
