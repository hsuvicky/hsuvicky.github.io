# Vicky Hsu — Portfolio

A recruiter-facing personal portfolio for Vicky Hsu, a Senior Director and AI Product
Manager who builds and commercializes 0-to-1 enterprise AI products.

The site uses semantic HTML, modern CSS, and a small amount of vanilla JavaScript. It has
no build step, package manager, framework, or third-party dependency.

## Structure

```text
.
├── index.html          # One-page portfolio and all verified content
├── styles.css          # Light/dark themes, responsive layouts, and print styles
├── script.js           # Theme persistence, mobile navigation, and active section state
├── assets/
│   └── favicon.svg     # Original VH site mark
├── hobbies/
│   └── index.html      # Preserves the old URL and redirects to /#hobbies
├── .nojekyll           # Publishes the static files without Jekyll processing
└── README.md
```

## Run locally

From the repository root:

```bash
python3 -m http.server 8000
```

Open <http://localhost:8000>. Direct section URLs such as
<http://localhost:8000/#projects> work as they do on GitHub Pages.

## GitHub Pages deployment

This is a GitHub user site. GitHub Pages publishes the static files from the configured
source on the default branch at <https://hsuvicky.github.io/>. No compilation step is
required. The `.nojekyll` file prevents Jekyll processing.

Changes should be proposed on a branch and reviewed in a pull request before merging into
`main`. Merging an approved change to the configured Pages source triggers the standard
GitHub Pages build and deployment.

## Update content

- Edit copy and section structure in `index.html`.
- Keep the four permanent destinations: `#about`, `#achievements`, `#projects`, and
  `#hobbies`.
- Keep professional claims specific and verifiable. Do not add confidential client details.
- Update colors, spacing, or layouts through the custom properties and responsive rules in
  `styles.css`.
- Keep JavaScript optional: the content and anchor navigation must remain usable without it.

## Add Vicky's portrait

The hero includes a finished abstract portrait treatment so the layout works without a
temporary or fabricated photo. To replace it with Vicky's selected portrait:

1. Export an optimized WebP or JPEG at roughly 1200 × 1500 pixels.
2. Add it to `assets/` with a descriptive filename such as `vicky-hsu-portrait.webp`.
3. Inside `.portrait-art` in `index.html`, add an `<img>` before the decorative SVG.
4. Use concise, descriptive alt text and remove `role="img"` and `aria-label` from the
   `.portrait-art` wrapper.
5. Keep the image under roughly 300 KB and verify the crop at desktop and mobile widths.

## Add verified links later

The hero action group in `index.html` is the place to add a verified LinkedIn profile,
résumé file, email/contact destination, or public product link. Before adding one:

1. Confirm the exact URL or address with Vicky.
2. Add only a real, public destination—no placeholder buttons.
3. For résumé files, place the current document in `assets/` and use a descriptive filename.
4. For project links, add the link inside the relevant case study and state only publicly
   supportable product details.
