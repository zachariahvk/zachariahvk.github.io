# Portfolio — Zachariah V. Kurien

Content marketing portfolio. Static site, no build step, no dependencies to install.

**Live:** https://zachariahvk.github.io

## Files

| File | Purpose |
|---|---|
| `index.html` | Markup only — all copy lives here |
| `style.css` | Design system and layout, in 13 commented sections |
| `main.js` | Motion layer (smooth scroll, reveals, pointer effects) |
| `img/` | Video thumbnails, WebP with JPEG fallback |
| `preview.png` | 1200×630 card shown when the link is shared |
| `favicon.svg` | Browser tab icon |
| `.nojekyll` | Tells GitHub Pages to serve the files as-is |

## Editing

Edit, commit, push. GitHub Pages redeploys in about a minute.

**To add a piece of work:** copy an existing `.card` block inside the relevant
`.group` and change the title, description and link. Keep the `reveal reveal-up`
classes — that is what makes it animate in on scroll.

**To switch on the CV button:** upload the CV to Google Drive or Dropbox, set
sharing to "anyone with the link can view", then in `index.html` find
`class="btn magnetic cv-link"`, replace `href="#"` with the share link and
delete the word `hidden`. It stays invisible until you do.

**To update the proof strip:** the four figures under the hero are copied
from the marketing CV. If the CV changes, change them too — search for
`class="proof"`.

**To change the colours:** every colour is a variable at the top of `style.css`
under `:root`. Change it once there and it updates everywhere. Dark is the
default; the `[data-theme="light"]` block below it holds the light palette.

**To turn the motion down:** delete a `.reveal` class to stop that element
animating, or remove the three CDN `<script>` tags in `index.html` to strip the
motion layer entirely. The site is built so it stays fully readable either way.

## How the motion layer fails

`main.js` only hides content once it has confirmed GSAP actually loaded. If the
CDN is blocked, the script errors, or the visitor has "reduce motion" turned on,
every reveal class is stripped and the page renders as plain static HTML with all
copy visible. This is tested — point the script tags at a dead host and the page
still reads correctly.

## Local preview

```
python -m http.server 8099
```

Then open http://localhost:8099. Opening `index.html` directly also works.
