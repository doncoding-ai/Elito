# Elijah Ndeto — portfolio

Live: https://doncoding-ai.github.io/Elito/

React + Vite + Tailwind CSS + Motion (`motion/react`), built and published to GitHub Pages by a GitHub Action on every push to `main`.

## Run it locally

```bash
npm install
npm run dev        # http://localhost:5173
```

## Update the site from a new CV

1. Drop the new CV into `cv/`. Add a PDF as well and it also becomes the **Download CV** file.
2. Push to `main`.
3. The Action reads the CV, refreshes `data/profile.json`, rebuilds and republishes. Impact numbers, Journey and Toolkit update on their own.

## Where things live

| Path | What it is |
| --- | --- |
| `cv/` | Your CVs. The newest one is read on every push that changes this folder. |
| `data/profile.json` | Generated from the CV: name, roles, numbers, experience, toolkit. |
| `data/story.json` | Written by hand: How I lead, Case studies, Contact wording. Edit freely. |
| `public/cv/latest.pdf` | The file behind the Download CV buttons. |
| `public/og.jpg` | The picture shown when the link is shared (LinkedIn, WhatsApp, X). |
| `src/assets/` | Hero portrait, contact portrait, Nairobi skyline. |
| `src/components/` | One file per section: Hero, Impact, HowILead, CaseStudies, Journey, Toolkit, Contact. |
| `src/motion.js` | The two motion curves the whole site uses. |

## Sections

Hero · Impact · How I lead · Case studies · Journey · Toolkit · Contact

## One-time GitHub setting

Settings → Pages → Build and deployment → Source: **GitHub Actions**.

The 2022 site is kept on the `legacy-2022` branch.
