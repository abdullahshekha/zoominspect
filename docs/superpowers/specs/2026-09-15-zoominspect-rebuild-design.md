# Zoominspect Website Rebuild — Design Spec

Date: 2026-09-15

## Background

zoominspect.com (a WordPress site built on the Flatsome theme, with
Elementor and Forminator plugins) was compromised. The compromise took
the form of a classic **SEO spam injection**: hidden `<div>` blocks
(`overflow:hidden` combined with absolute positioning far off-screen)
containing gambling/casino spam content and links, written in
Ukrainian, Russian, and Swedish, injected directly into page markup
across the site. Example, found in the saved homepage HTML at
`Old Hacked Website/Zoominspect – an inspection company for your
quality control.html` (lines ~2602–2621): dozens of hidden `<a>` tags
linking to casino/betting domains (`spinrisecasinoapp.com`,
`sgcasinocz.com`, `burankasino.sk`, etc.) plus multi-paragraph spam
articles about crypto casinos, injected as sibling content inside
`<main>`.

The user provided a full crawl of the hacked site as browser-saved
"complete webpage" dumps (HTML + `_files/` asset folders) in
`Old Hacked Website/`. This covers:

- Home (`Zoominspect – an inspection company for your quality
  control.html`)
- 7 service pages: Pre-shipment inspections, During manufacture
  inspection, Supplier Audit, Samples Inspection, Product Sourcing,
  Freight Forwarding, Patent/Trademark in China
- Inspection Standards (ANSI/ASQC sampling tables) resource page
- Contact us
- Blogs index + 38 individual blog post pages (`Blogs/*.html`)

Two service pages referenced in the site nav/homepage service grid
have **no standalone HTML file** in the upload: **Product
Consolidation** and **Product Photography**. These will be written
from the short homepage blurbs plus general industry-standard content
for these services, and flagged to the user for review since they
aren't sourced from an original full page.

## Goal

Rebuild zoominspect.com as a clean, modern, static Next.js site with
zero attack surface for this class of hack, preserving the same
informational content (refreshed visual design), deployed to Vercel
from `github.com/abdullahshekha/zoominspect`.

## Non-goals

- No WordPress, no PHP, no database, no admin login surface.
- No headless CMS (MDX-in-repo is sufficient per user decision).
- No redesign of information architecture beyond minor cleanup (e.g.
  folding "About Us" into the homepage as today, unless later
  requested).
- No automated tooling to keep syncing from the old site — this is a
  one-time clean rebuild.

## Content sanitization process (critical — this is the malware removal step)

For every old HTML file used as a content source:

1. **Never copy raw HTML or `<script>` content.** Only ever copy
   human-readable text (headings, paragraphs, list items) and genuine
   image assets that are clearly part of the page's real content
   (hero banners, icons, blog cover images, the logo).
2. Identify and discard content that is clearly injected spam:
   - Any block styled with `overflow:hidden`, `height:1px`,
     `position:absolute` combined with large/negative offsets, or
     similar off-screen/invisible techniques.
   - Any non-English content unrelated to inspection/QC/sourcing
     topics (the injected spam is in Russian/Ukrainian/Swedish; the
     legitimate site content is entirely in English).
   - Any links to gambling/casino/betting domains, or unfamiliar
     third-party domains not related to Zoominspect's business.
   - Any `<script>` tags, inline event handlers, or obfuscated code
     from the old dumps — none of it is reused; Next.js/React handles
     all behavior fresh.
3. Extract text content per page into a plain-text/Markdown working
   note (throwaway, not committed) before writing the final
   `.tsx`/`.mdx`, so each page can be diffed by eye against the
   rendered old page for completeness — but the injected spam blocks
   are excluded from that extraction from the start.
4. As a final check before considering the rebuild complete: grep the
   entire new repo (`content/`, `app/`, `public/`) for signs of
   leftover foreign-language spam or suspicious external domains, and
   confirm zero matches. Report this check's result to the user
   explicitly.
5. Images copied from `_files/` folders are treated as opaque binary
   assets (photos/logos/icons) — these are not executable and are not
   a vector for the markup-injection hack, so they can be reused
   directly, re-optimized as needed.

## Architecture

- **Framework:** Next.js 14+ (App Router), TypeScript.
- **Styling:** Tailwind CSS.
- **Hosting/deploy:** Vercel, connected to
  `https://github.com/abdullahshekha/zoominspect.git` (already added
  as `origin`). Push to a feature branch initially; user merges to
  main / connects Vercel project.
- **Content model:**
  - Static marketing pages (home, about section, 9 service pages,
    inspection standards, contact) as route files under `app/`, with
    content hardcoded into React components (no CMS needed — content
    changes infrequently).
  - Blog posts as MDX files in `content/blog/<slug>.mdx` with
    frontmatter:
    ```
    ---
    title: string
    slug: string
    date: YYYY-MM-DD
    excerpt: string
    coverImage: /images/blog/<file>
    ---
    ```
    Rendered via `app/blogs/[slug]/page.tsx`, listed via
    `app/blogs/page.tsx`. Original publish dates aren't reliably
    present in the saved dumps; where not found, use a reasonable
    placeholder order (oldest-to-newest by best guess) and flag to
    user as approximate.
  - Images: copied into `public/images/{site,blog}/...`, renamed to
    readable kebab-case slugs.
- **Layout:** Shared `app/layout.tsx` with header (logo, nav with
  "Our Solutions" dropdown of 9 services, "Your Industry", "Resources"
  dropdown with Blogs + Inspection Standards, Contact Us) and footer,
  matching the old IA.

## Design refresh

- Keep brand identity: navy blue + gold/orange magnifying-glass logo
  (extracted from
  `Logo-and-Theme-01-1024x485.png`).
- Palette (refined from the logo, exact values to be finalized during
  implementation):
  - Primary navy: ~`#0B4F71`
  - Accent gold: ~`#F5A623`
  - Accent orange: ~`#F2871F`
  - Neutrals: white/off-white backgrounds, slate greys for body text.
- Typography: a modern sans (e.g. Inter or Poppins via
  `next/font/google`) replacing the old page-builder default fonts.
- Layout: clean card grids for the 9 services and 6 industries
  sections, generous whitespace, no leftover Elementor/Flatsome visual
  clutter. Mobile-first responsive.

## Pages/routes

| Route | Source |
|---|---|
| `/` | Home |
| `/pre-shipment-inspection` | Pre-shipment inspections HTML |
| `/during-production-inspection` | During manufacture inspection HTML |
| `/factory-supplier-audit` | Supplier Audit HTML |
| `/samples-inspection` | Samples Inspection HTML |
| `/product-sourcing` | Product Sourcing HTML |
| `/freight-forwarding` | Freight Forwarding HTML |
| `/patent-trademark-china` | Patent/Trademark HTML |
| `/product-consolidation` | Written from homepage blurb (flagged) |
| `/product-photography` | Written from homepage blurb (flagged) |
| `/inspection-standards` | Inspection Standards HTML |
| `/contact` | Contact us HTML (content) + working form |
| `/blogs` | Blog index |
| `/blogs/[slug]` | 38 individual posts |

Exact URL slugs may differ slightly from the old site's; a redirect
map is out of scope unless the user asks for one to preserve old SEO
links (worth flagging).

## Contact form

- `app/contact/page.tsx` — client form (name, email, phone, message /
  service interest).
- `app/api/contact/route.ts` — Next.js Route Handler, server-side,
  using **Nodemailer** over SMTP to send to the user's cPanel mailbox.
- SMTP credentials (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
  `SMTP_PASS`, destination address) supplied by the user as Vercel
  environment variables — never committed to git. A `.env.example`
  documents the required variable names without values.
- Basic server-side validation + honeypot field to deter spam
  submissions (given the site's history with spam, this matters).

## Security hardening

- Security headers set in `next.config.js` (`Content-Security-Policy`,
  `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`, `Permissions-Policy`).
- No server-rendered user-generated content, no database, no admin
  panel — removes the main classes of vulnerability that lead to this
  kind of injection hack.
- Dependencies kept minimal (Next.js, React, Tailwind, Nodemailer) to
  minimize supply-chain surface.

## Testing / verification

- `npm run build` must succeed with no errors before considering the
  rebuild done.
- Manual visual pass of every route against the corresponding old page
  (for content completeness, not pixel-fidelity, since design is
  refreshed).
- The malware-check grep described above, run and its clean result
  reported to the user.
- Contact form tested end-to-end once the user supplies real SMTP
  credentials (can't be verified before that).

## Open items for user follow-up (not blocking)

- Confirm final copy for Product Consolidation and Product
  Photography pages (currently reconstructed, not sourced from a full
  original page).
- Decide whether old blog post URLs need 301 redirects preserved for
  SEO once DNS is repointed.
- Supply real cPanel SMTP credentials when ready to wire the live
  contact form.
