# AGENTS.md

## Cursor Cloud specific instructions

This repository is a static personal portfolio site (GitHub user site for
`hsuvicky.github.io`). It is plain HTML, CSS, and vanilla JavaScript with **no
build step, package manager, framework, or third-party dependency**.

### Services

There is a single "service": a static file server. Serve the repository root and
open the site in a browser:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Section URLs such as
<http://localhost:8000/#projects> and preserved paths like `/about/` and
`/hobbies/` resolve as they do on GitHub Pages.

### Lint / test / build

- There is no build step. GitHub Pages publishes the static files directly; the
  `.nojekyll` file disables Jekyll processing.
- There is no automated test suite or linter configured in the repo. Validate
  changes by loading the affected pages in a browser and exercising the
  interactive behavior (theme toggle, mobile nav, active section highlighting)
  defined in `script.js`.

### Non-obvious notes

- `index.html` references `styles.css` and `script.js` with cache-busting query
  strings (e.g. `styles.css?v=20260730-50`). When editing those files, the
  version query string does not need to change for local dev, but a hard refresh
  may be required to bypass browser caching.
- Interactive behavior (theme persistence via `localStorage`, mobile navigation,
  active-section state) lives in `script.js`; the site must remain usable with
  JavaScript disabled, so content and anchor navigation should not depend on it.
