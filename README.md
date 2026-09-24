# ELIJAH NDETO — v4.0 "EXECUTIVE AURORA"

Live: https://doncoding-ai.github.io/Elito/

A leadership portfolio. Deep navy ink, an aurora drawn by a WebGL fragment
shader whose colours travel with you through five chapters and bend toward the
cursor, frosted-glass cards and skill orbs, luminous rain in the hero, silk
motion (GSAP ScrollTrigger + SplitText letter reveals), Lenis smooth scrolling,
and a soft musical ambient pad (off by default).

Chapters: Hero → Impact → Journey → Craft → Selected Work → Let's talk.

## Updating content
Drop a new CV (PDF preferred) into `cv/` and push. The GitHub Action parses it,
rebuilds `data/profile.json`, refreshes `cv/latest.pdf`, and the site updates
itself. Hand-tuned fields (tagline, roles, tags, proficiency) survive.

Local preview:
```
python -m http.server 8000
```
