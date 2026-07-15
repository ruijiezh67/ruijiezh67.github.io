# Ruijie Zheng — Personal Website

Source for my academic homepage, hosted with GitHub Pages at
**<https://ruijiezh67.github.io/>**.

A minimalist single-column academic page: LaTeX (Computer Modern) and EB Garamond
typography, a soft macaron / graph-paper background, blue social icons, school-logo
chips, scroll-reveal animations, and a confetti burst when you click the portrait.

## Structure

- `index.html` — page content and structured metadata (JSON-LD)
- `styles.css` — responsive design, fonts, background pattern, animations
- `script.js` — scroll progress bar, scroll-reveal, nav scroll-spy, footer year, avatar confetti
- `assets/avatar.jpg` — profile photo
- `assets/Ruijie_Zheng_CV.pdf` — downloadable CV
- `assets/GAM_UIST2026_demo.pdf` / `.mp4` — UIST 2026 demo paper and video
- `assets/logos/` — institution logos (Michigan, Northwestern, SJTU)
- `.nojekyll` — serve files as-is, skipping Jekyll processing

## Sections

Profile, About, **Publications** (album-style hero card with paper/video links),
**Selected Work** (horizontally-scrolling album-cover shelf), News, Research &
Projects, Education, Skills, Service, Contact. A color-shifting progress bar tracks
scroll position.

## Fonts

Loaded from CDNs, so an internet connection is needed for the intended look:

- **Computer Modern (CMU Serif)** — name, section and entry titles (self-declared
  `@font-face` in `styles.css` pointing at the `computer-modern` package on jsDelivr)
- **EB Garamond** — body text (Google Fonts)
- **Bungee** / **Permanent Marker** — the research-interest display line (Google Fonts)

## Editing

Everything is plain HTML/CSS/JS — edit the files directly, no build step. Open
`index.html` in a browser to preview locally.

## GitHub Pages

This is a user site (the repository is named `ruijiezh67.github.io`), so it publishes
from the `main` branch, root directory, to the root domain:

`https://ruijiezh67.github.io/`

After pushing, the live site updates within a minute or two; hard-refresh
(`Ctrl`+`F5`) if the browser serves a cached version.
