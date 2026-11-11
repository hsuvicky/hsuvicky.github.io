# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: hiring managers and recruiters evaluating Vicky Hsu for AI product leadership roles. They arrive with limited time, need a credible senior profile, and should leave able to place her (role, seniority, domain) and decide whether to reach out.

## Product Purpose

This is Vicky Hsu’s public personal site: a GitHub Pages portfolio at https://hsuvicky.github.io/. It introduces her as a Senior Director and AI Product Manager who builds and commercializes 0-to-1 enterprise AI products, and it is the place to scan career history, personality, and contact paths (LinkedIn, GitHub).

Success: the site feels personable rather than generic, while still showcasing the interactive components already on the pages. The current look is judged as not good enough; a visual rethink is allowed.

## Positioning

A named personal site for a specific AI product leader, not a template “AI founder” landing page. Proof is Vicky’s own verified career, hobbies, and public work — not invented case-study theater.

## Operating Context

- Live site: GitHub Pages from this repo (user site for `hsuvicky.github.io`).
- Local: static file server from the repo root (`python3 -m http.server 8000`).
- Surfaces today: `/` career timeline (home), `/about/` interests and projects, `/hobbies/` redirect to About, `/resume.html` resume preview.
- Interactive pieces to keep in play as design material: career/hobbies year browser, Wenchang Dijun nav, blob colony, theme toggle, about gallery, refinements overlay.

## Capabilities and Constraints

- Implemented as plain HTML, CSS, and vanilla JavaScript with no build step, package manager, or framework. GitHub Pages publishes the files as-is (`.nojekyll`).
- Visual identity may be replaced. The user authorized a full rethink; nothing in the current look is required to survive.
- Professional claims must stay specific and verifiable. Do not add confidential client details, invented testimonials, fake metrics, or placeholder destinations.
- Content and anchor navigation should remain usable if JavaScript is off (existing site rule; not reconfirmed as a hard lock on a redesign).
- Permanent destinations to keep: homepage `#achievements`; About `#about` and `#projects`.
- Undecided: whether a redesign stays on the current static stack or introduces a build tool.

## Brand Commitments

- Name and wordmark: Vicky Hsu / VH.
- Voice: personable, first-person, specific. Keep that register even if the visual system changes.
- Binding request from the owner: keep the site personable and show off existing components rather than flattening them into a static brochure.

## Evidence on Hand

- Home career timeline with verified roles (EY and later employers as encoded in `index.html`), plus personal/hobby beats (League of Legends, Twitch, etc.).
- About page: interests, project cards (including MonkEV App Store link and Beli profile), LinkedIn `https://www.linkedin.com/in/hsuvicky/`.
- Assets in `assets/` (portrait treatment, logos, favicons, Wenchang image).
- Resume preview at `resume.html`.
- Do not fabricate employers, titles, dates, follower counts, product claims, or quotes that are not already on the site or supplied by Vicky.

## Product Principles

- Hiring-scan first: seniority, domain, and proof should be obvious without hunting.
- Personable, not corporate-template: personality is part of the product.
- Show the craft that already exists: interactive components are exhibits, not leftovers to hide.
- Only real proof: no invented social proof or unverifiable claims.
- Visual system can change; Vicky’s facts cannot.
