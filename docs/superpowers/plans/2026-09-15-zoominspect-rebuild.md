# Zoominspect Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild zoominspect.com as a clean Next.js/TypeScript/Tailwind static site — content-equivalent to the hacked WordPress site but with zero SEO-spam/malware carried over — ready to push to `github.com/abdullahshekha/zoominspect.git` and deploy on Vercel.

**Architecture:** Next.js 14 App Router site. Marketing pages (home, 9 services, inspection standards, contact) are hand-written React components with content extracted from the old site. Blog posts are MDX files under `content/blog/`, rendered through a shared template. A `lib/contentSafety.ts` scanner is built early and re-run after every content-adding task as an automated guard against the exact spam-injection pattern found in the old site.

**Tech Stack:** Next.js 14 (App Router) + TypeScript, Tailwind CSS, `next-mdx-remote` + `gray-matter` for MDX blog content, Nodemailer for the contact form, Vitest + React Testing Library for tests, deployed on Vercel.

**Spec:** `docs/superpowers/specs/2026-09-15-zoominspect-rebuild-design.md`

## Global Constraints

- Next.js 14+ App Router, TypeScript, Tailwind CSS. Deploy target: Vercel. Git remote: `https://github.com/abdullahshekha/zoominspect.git` (already added as `origin` in this repo).
- **No raw HTML, inline `<script>`, or JS from `Old Hacked Website/` is ever copied into the new codebase.** Only plain extracted text and genuine binary image assets are reused.
- Every task that adds page or blog content must end with `npm run build` succeeding AND `npm run check:safety` reporting zero matches, before it is considered done.
- Brand colors: primary navy `#0B4F71`, accent gold `#F5A623`, accent orange `#F2871F`. Font: Inter, loaded via `next/font/google`.
- Contact info used across the site: `info@zoominspect.com`, WhatsApp `+86 156 6700 2048`.
- SMTP credentials are never committed. `.env.example` documents variable names only.
- Commit after every task (or logical sub-step within the blog migration task).

---

## File Structure

```
zoominspect/
  next.config.js
  tailwind.config.ts
  postcss.config.js
  tsconfig.json
  vitest.config.ts
  vitest.setup.ts
  .env.example
  package.json
  app/
    layout.tsx
    globals.css
    page.tsx                          # Home
    pre-shipment-inspection/page.tsx
    during-production-inspection/page.tsx
    factory-supplier-audit/page.tsx
    samples-inspection/page.tsx
    product-sourcing/page.tsx
    freight-forwarding/page.tsx
    patent-trademark-china/page.tsx
    product-consolidation/page.tsx
    product-photography/page.tsx
    inspection-standards/page.tsx
    contact/page.tsx
    api/contact/route.ts
    blogs/page.tsx
    blogs/[slug]/page.tsx
  components/
    Header.tsx
    Footer.tsx
    ServicePageLayout.tsx
    ServiceCard.tsx
    IndustryGroup.tsx
    ContactForm.tsx
  lib/
    siteData.ts
    contentSafety.ts
    blog.ts
  content/blog/*.mdx                  # 38 posts
  public/images/site/...
  public/images/blog/...
  scripts/check-content-safety.mjs
  docs/superpowers/specs/2026-09-15-zoominspect-rebuild-design.md
  docs/superpowers/plans/2026-09-15-zoominspect-rebuild.md   (this file)
```

---

### Task 1: Project scaffold (Next.js + TypeScript + Tailwind + Vitest)

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `postcss.config.js`, `vitest.config.ts`, `vitest.setup.ts`, `.env.example`, `.gitignore` (already exists — verify it covers `node_modules/`, `.next/`, `.env*.local`)
- Create: `app/layout.tsx` (minimal placeholder), `app/page.tsx` (minimal placeholder), `app/globals.css`

**Interfaces:**
- Produces: a working `npm run dev`, `npm run build`, `npm run lint`, `npm run test` pipeline that every later task builds on.

- [ ] **Step 1: Scaffold the Next.js app**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*" --use-npm --no-turbopack
```
When prompted, accept defaults. This creates `package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `next.config.js`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`.

- [ ] **Step 2: Verify the default app builds**

Run: `npm run build`
Expected: build completes with `✓ Compiled successfully`.

- [ ] **Step 3: Add test tooling**

Run:
```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @types/node
```

Create `vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./") },
  },
});
```

Create `vitest.setup.ts`:
```typescript
import "@testing-library/jest-dom/vitest";
```

Add to `package.json` `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Write a trivial smoke test to confirm the test runner works**

Create `lib/smoke.test.ts`:
```typescript
import { describe, it, expect } from "vitest";

describe("test runner", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `npm run test`
Expected: PASS, 1 test.

- [ ] **Step 5: Delete the smoke test and create `.env.example`**

Delete `lib/smoke.test.ts`.

Create `.env.example`:
```
# SMTP credentials for the contact form (cPanel webmail account)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
CONTACT_TO_EMAIL=info@zoominspect.com
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with TypeScript, Tailwind, Vitest"
```

---

### Task 2: Content safety scanner

**Files:**
- Create: `lib/contentSafety.ts`
- Create: `lib/contentSafety.test.ts`
- Create: `scripts/check-content-safety.mjs`
- Modify: `package.json` (add `check:safety` script)

**Interfaces:**
- Produces: `scanTextForSpam(text: string): string[]` — returns matched banned patterns (empty array = clean). `scanDirectoryForSpam(dir: string, extensions: string[]): { file: string; matches: string[] }[]` — walks a directory recursively and applies `scanTextForSpam` to each matching file's contents.
- Consumes: nothing from earlier tasks.

This scanner directly encodes the signature of the hack found in the old site (Cyrillic/Ukrainian spam text, gambling/casino domains, off-screen injection markup) so every later content task can be checked against it.

- [ ] **Step 1: Write the failing test**

Create `lib/contentSafety.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { scanTextForSpam, scanDirectoryForSpam } from "./contentSafety";

describe("scanTextForSpam", () => {
  it("returns no matches for clean English business copy", () => {
    const text = "Zoominspect offers pre-shipment inspection services in China.";
    expect(scanTextForSpam(text)).toEqual([]);
  });

  it("flags Cyrillic text", () => {
    const text = "Официальный сайт Вавада предоставляет доступ";
    expect(scanTextForSpam(text).length).toBeGreaterThan(0);
  });

  it("flags known gambling/casino keywords", () => {
    expect(scanTextForSpam("check out this casino bonus").length).toBeGreaterThan(0);
    expect(scanTextForSpam("vavada регистрация").length).toBeGreaterThan(0);
  });

  it("flags off-screen injection markup patterns", () => {
    const text = '<div style="overflow:hidden;position:absolute;left:-5312px">hidden</div>';
    expect(scanTextForSpam(text).length).toBeGreaterThan(0);
  });
});

describe("scanDirectoryForSpam", () => {
  let dir: string;

  beforeAll(() => {
    dir = mkdtempSync(path.join(tmpdir(), "safety-test-"));
    writeFileSync(path.join(dir, "clean.mdx"), "# Clean post\n\nNormal content about inspections.");
    writeFileSync(path.join(dir, "dirty.mdx"), "# Post\n\nвавада казино бонус");
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("reports only the file containing spam", () => {
    const results = scanDirectoryForSpam(dir, [".mdx"]);
    expect(results).toHaveLength(1);
    expect(results[0].file).toContain("dirty.mdx");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- contentSafety`
Expected: FAIL — `lib/contentSafety.ts` does not exist yet.

- [ ] **Step 3: Implement the scanner**

Create `lib/contentSafety.ts`:
```typescript
import { readdirSync, readFileSync, statSync } from "fs";
import path from "path";

// Signature patterns of the SEO-spam injection found on the hacked
// zoominspect.com site: Cyrillic script, gambling/casino keywords in
// several languages, and the off-screen CSS injection technique used
// to hide the spam from visitors while still being crawled.
const CYRILLIC_PATTERN = /[Ѐ-ӿ]{3,}/;

const BANNED_KEYWORDS = [
  "casino",
  "vavada",
  "spinrise",
  "mostbet",
  "1xbet",
  "rabona",
  "sgcasino",
  "buran casino",
  "jackpotpiraten",
  "казино",
  "ставк",
  "букмекер",
  "spela casino",
  "bankid",
];

const INJECTION_MARKUP_PATTERN =
  /overflow\s*:\s*hidden[^>]*position\s*:\s*absolute|position\s*:\s*absolute[^>]*overflow\s*:\s*hidden/i;

export function scanTextForSpam(text: string): string[] {
  const matches: string[] = [];

  if (CYRILLIC_PATTERN.test(text)) {
    matches.push("cyrillic-script");
  }

  const lower = text.toLowerCase();
  for (const keyword of BANNED_KEYWORDS) {
    if (lower.includes(keyword)) {
      matches.push(`keyword:${keyword}`);
    }
  }

  if (INJECTION_MARKUP_PATTERN.test(text)) {
    matches.push("offscreen-injection-markup");
  }

  return matches;
}

export function scanDirectoryForSpam(
  dir: string,
  extensions: string[]
): { file: string; matches: string[] }[] {
  const results: { file: string; matches: string[] }[] = [];

  function walk(current: string) {
    for (const entry of readdirSync(current)) {
      if (entry === "node_modules" || entry === ".next" || entry === ".git") continue;
      const fullPath = path.join(current, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (extensions.some((ext) => fullPath.endsWith(ext))) {
        const text = readFileSync(fullPath, "utf-8");
        const matches = scanTextForSpam(text);
        if (matches.length > 0) {
          results.push({ file: fullPath, matches });
        }
      }
    }
  }

  walk(dir);
  return results;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- contentSafety`
Expected: PASS, all 5 tests.

- [ ] **Step 5: Create the CLI wrapper and npm script**

Create `scripts/check-content-safety.mjs`:
```javascript
import { scanDirectoryForSpam } from "../lib/contentSafety.ts";

const targets = [
  { dir: "app", extensions: [".tsx", ".ts"] },
  { dir: "content", extensions: [".mdx"] },
];

let hasMatches = false;

for (const target of targets) {
  const results = scanDirectoryForSpam(target.dir, target.extensions);
  for (const result of results) {
    hasMatches = true;
    console.error(`SPAM DETECTED in ${result.file}: ${result.matches.join(", ")}`);
  }
}

if (hasMatches) {
  console.error("\nContent safety check FAILED.");
  process.exit(1);
} else {
  console.log("Content safety check passed: no spam patterns found in app/ or content/.");
  process.exit(0);
}
```

Note: since this script imports a `.ts` file directly, run it via `tsx`. Install it:
```bash
npm install -D tsx
```

Add to `package.json` `"scripts"`:
```json
"check:safety": "tsx scripts/check-content-safety.mjs"
```

- [ ] **Step 6: Run the safety check against the current (near-empty) project**

Run: `npm run check:safety`
Expected: `Content safety check passed: no spam patterns found in app/ or content/.`

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add content safety scanner to guard against spam-injection regressions"
```

---

### Task 3: Site data module

**Files:**
- Create: `lib/siteData.ts`
- Create: `lib/siteData.test.ts`

**Interfaces:**
- Produces: `NAV_LINKS`, `SERVICES: Service[]`, `INDUSTRIES: IndustryGroup[]`, `CONTACT_INFO` — consumed by Header, Footer, Home, and service pages in later tasks.
- `Service = { slug: string; name: string; priceLabel: string; description: string }`
- `IndustryGroup = { name: string; items: string[] }`
- `CONTACT_INFO = { email: string; whatsapp: string }`

- [ ] **Step 1: Write the failing test**

Create `lib/siteData.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { SERVICES, INDUSTRIES, CONTACT_INFO, NAV_LINKS } from "./siteData";

describe("siteData", () => {
  it("has exactly the 9 services from the old site's service grid", () => {
    expect(SERVICES).toHaveLength(9);
    const slugs = SERVICES.map((s) => s.slug);
    expect(slugs).toEqual([
      "pre-shipment-inspection",
      "during-production-inspection",
      "factory-supplier-audit",
      "samples-inspection",
      "product-sourcing",
      "freight-forwarding",
      "patent-trademark-china",
      "product-consolidation",
      "product-photography",
    ]);
  });

  it("has 6 industry groups matching the old site", () => {
    expect(INDUSTRIES.map((i) => i.name)).toEqual([
      "Softlines",
      "Hardlines",
      "Transportation",
      "Industrial",
      "Healthcare",
      "Electronics",
    ]);
  });

  it("has correct contact info", () => {
    expect(CONTACT_INFO.email).toBe("info@zoominspect.com");
    expect(CONTACT_INFO.whatsapp).toBe("+86 156 6700 2048");
  });

  it("includes a Contact Us nav link", () => {
    expect(NAV_LINKS.some((l) => l.href === "/contact")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- siteData`
Expected: FAIL — `lib/siteData.ts` does not exist.

- [ ] **Step 3: Implement site data**

Create `lib/siteData.ts`:
```typescript
export type Service = {
  slug: string;
  name: string;
  priceLabel: string;
  description: string;
};

export type IndustryGroup = {
  name: string;
  items: string[];
};

export const CONTACT_INFO = {
  email: "info@zoominspect.com",
  whatsapp: "+86 156 6700 2048",
};

export const SERVICES: Service[] = [
  {
    slug: "pre-shipment-inspection",
    name: "Pre-Shipment Inspection",
    priceLabel: "Starting from $249",
    description:
      "Carried out when your supplier has completed the order. We check that the product has been manufactured according to the highest standards before it is shipped.",
  },
  {
    slug: "during-production-inspection",
    name: "During Production",
    priceLabel: "Starting from $249",
    description:
      "Perfect for making sure that your product is being manufactured according to the best possible standards and with the correct craftsmanship, material and machinery.",
  },
  {
    slug: "factory-supplier-audit",
    name: "Factory Audit",
    priceLabel: "Starting from $350",
    description:
      "The best way to vet a supplier for their competency. We check if they have the proper skill, machinery, labor material and licenses to manufacture your product.",
  },
  {
    slug: "samples-inspection",
    name: "Samples Inspection",
    priceLabel: "Starting from $195",
    description:
      "If you are planning to outsource products from China for FBA, you are surely considering samples from different suppliers. We inspect each one for you to be confident in the supplier you choose.",
  },
  {
    slug: "product-sourcing",
    name: "Product Sourcing",
    priceLabel: "Starting from $670",
    description:
      "Still choosing a reliable supplier in China with competent rates and best quality for your product? We hunt for your best match to handle your product supply according to your terms.",
  },
  {
    slug: "freight-forwarding",
    name: "Freight Forwarding",
    priceLabel: "By Sea, Air or Land",
    description:
      "Have your inventory ready in China and planning to have it shipped to your desired country? We handle freight forwarding to any country in the world by sea, land or air.",
  },
  {
    slug: "patent-trademark-china",
    name: "Patent & Trademark in China",
    priceLabel: "Cost Varies",
    description:
      "Have a unique idea you want manufactured in China but worry it could be stolen? We take care of patent and trademark registration for you.",
  },
  {
    slug: "product-consolidation",
    name: "Product Consolidation",
    priceLabel: "Starting from $50",
    description:
      "Doing market research before investing a huge chunk? We consolidate samples from a lot of suppliers into a single package and ship it right to your doorstep.",
  },
  {
    slug: "product-photography",
    name: "Product Photography",
    priceLabel: "Starting from $300",
    description:
      "Waiting for your first sample to arrive just to start your creative journey can be frustrating. Let our expert photographers in China take care of that.",
  },
];

export const INDUSTRIES: IndustryGroup[] = [
  { name: "Softlines", items: ["Textile & Garments", "Footwear", "Fashion Accessories", "Soft Toys"] },
  { name: "Hardlines", items: ["Furniture", "Electrical", "Bikes & Sporting Goods", "Hardware"] },
  { name: "Transportation", items: ["Automotive", "Motorcycle", "E-Mobility", "Parts & Components"] },
  { name: "Industrial", items: ["Machinery", "Oil & Gas", "Power Equipment", "Metals"] },
  { name: "Healthcare", items: ["Medical Devices", "Medical Equipment", "Protective Equipment", "Cosmetics"] },
  { name: "Electronics", items: ["Motors", "Circuits", "Cell Phone/Watches", "Computer Accessories"] },
];

export const NAV_LINKS = [
  { label: "About Us", href: "/#about-us" },
  {
    label: "Our Solutions",
    href: "/#our-solutions",
    dropdown: SERVICES.map((s) => ({ label: s.name, href: `/${s.slug}` })),
  },
  { label: "Your Industry", href: "/#your-industry" },
  {
    label: "Resources",
    href: "/blogs",
    dropdown: [
      { label: "Our Blogs", href: "/blogs" },
      { label: "Inspection Standards", href: "/inspection-standards" },
    ],
  },
  { label: "Contact Us", href: "/contact" },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- siteData`
Expected: PASS, all 4 tests.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add shared site data (services, industries, nav, contact info)"
```

---

### Task 4: Brand theme (Tailwind config, fonts, global styles)

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`

**Interfaces:**
- Produces: Tailwind color tokens `brand-navy`, `brand-gold`, `brand-orange` usable as `bg-brand-navy`, `text-brand-gold`, etc. in every later component/page task.

- [ ] **Step 1: Extend the Tailwind theme with brand colors**

Modify `tailwind.config.ts` — inside `theme.extend`, add:
```typescript
colors: {
  "brand-navy": "#0B4F71",
  "brand-gold": "#F5A623",
  "brand-orange": "#F2871F",
},
```

- [ ] **Step 2: Set base typography and background in globals**

Modify `app/globals.css` — after the Tailwind directives, add:
```css
body {
  @apply bg-white text-slate-700 antialiased;
}

h1, h2, h3, h4 {
  @apply text-brand-navy font-semibold;
}
```

- [ ] **Step 3: Verify the build still passes**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add brand color tokens and base typography"
```

---

### Task 5: Header component (nav + dropdown)

**Files:**
- Create: `components/Header.tsx`
- Create: `components/Header.test.tsx`

**Interfaces:**
- Consumes: `NAV_LINKS` from `lib/siteData.ts` (Task 3).
- Produces: `<Header />` — a client component, imported by `app/layout.tsx` in Task 7.

- [ ] **Step 1: Write the failing test**

Create `components/Header.test.tsx`:
```typescript
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Header from "./Header";

describe("Header", () => {
  it("renders the top-level nav links", () => {
    render(<Header />);
    expect(screen.getByRole("link", { name: "Contact Us" })).toBeInTheDocument();
    expect(screen.getByText("Our Solutions")).toBeInTheDocument();
  });

  it("shows the Our Solutions dropdown items when clicked", () => {
    render(<Header />);
    fireEvent.click(screen.getByText("Our Solutions"));
    expect(screen.getByRole("link", { name: "Pre-Shipment Inspection" })).toBeInTheDocument();
  });

  it("toggles the mobile menu open and closed", () => {
    render(<Header />);
    const toggle = screen.getByRole("button", { name: /menu/i });
    fireEvent.click(toggle);
    expect(screen.getByTestId("mobile-nav")).toHaveClass("block");
    fireEvent.click(toggle);
    expect(screen.getByTestId("mobile-nav")).toHaveClass("hidden");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- Header`
Expected: FAIL — `components/Header.tsx` does not exist.

- [ ] **Step 3: Implement the Header**

Create `components/Header.tsx`:
```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { NAV_LINKS } from "@/lib/siteData";

export default function Header() {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="border-b border-slate-100">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold text-brand-navy">
          Zoominspect
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <div
              key={link.label}
              className="relative"
              onMouseEnter={() => link.dropdown && setOpenDropdown(link.label)}
              onMouseLeave={() => link.dropdown && setOpenDropdown(null)}
            >
              {link.dropdown ? (
                <button
                  className="text-sm font-medium text-slate-700 hover:text-brand-navy"
                  onClick={() =>
                    setOpenDropdown(openDropdown === link.label ? null : link.label)
                  }
                >
                  {link.label}
                </button>
              ) : (
                <Link
                  href={link.href}
                  className="text-sm font-medium text-slate-700 hover:text-brand-navy"
                >
                  {link.label}
                </Link>
              )}

              {link.dropdown && openDropdown === link.label && (
                <div className="absolute left-0 top-full z-10 mt-2 w-64 rounded-md border border-slate-100 bg-white p-2 shadow-lg">
                  {link.dropdown.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <button
          aria-label="Toggle menu"
          className="md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
        >
          Menu
        </button>
      </div>

      <nav
        data-testid="mobile-nav"
        className={`${mobileOpen ? "block" : "hidden"} border-t border-slate-100 px-4 py-2 md:hidden`}
      >
        {NAV_LINKS.flatMap((link) =>
          link.dropdown
            ? [{ label: link.label, href: link.href }, ...link.dropdown]
            : [{ label: link.label, href: link.href }]
        ).map((item) => (
          <Link key={item.href} href={item.href} className="block py-2 text-sm text-slate-700">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- Header`
Expected: PASS, all 3 tests.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Header component with dropdown nav and mobile menu"
```

---

### Task 6: Footer component

**Files:**
- Create: `components/Footer.tsx`
- Create: `components/Footer.test.tsx`

**Interfaces:**
- Consumes: `CONTACT_INFO` from `lib/siteData.ts` (Task 3).
- Produces: `<Footer />`, imported by `app/layout.tsx` in Task 7.

- [ ] **Step 1: Write the failing test**

Create `components/Footer.test.tsx`:
```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Footer from "./Footer";

describe("Footer", () => {
  it("shows the contact email and WhatsApp number", () => {
    render(<Footer />);
    expect(screen.getByText("info@zoominspect.com")).toBeInTheDocument();
    expect(screen.getByText("+86 156 6700 2048")).toBeInTheDocument();
  });

  it("shows the current year in the copyright line", () => {
    render(<Footer />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- Footer`
Expected: FAIL — `components/Footer.tsx` does not exist.

- [ ] **Step 3: Implement the Footer**

Create `components/Footer.tsx`:
```tsx
import { CONTACT_INFO } from "@/lib/siteData";

export default function Footer() {
  return (
    <footer className="bg-brand-navy text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm">
        <p className="text-lg font-semibold">Zoominspect</p>
        <p className="mt-2 max-w-md text-white/80">
          No. 1 inspection company in China — quality control, factory audits,
          product sourcing and freight forwarding.
        </p>
        <div className="mt-6 space-y-1">
          <p>Email us: {CONTACT_INFO.email}</p>
          <p>WhatsApp us: {CONTACT_INFO.whatsapp}</p>
        </div>
        <p className="mt-8 text-white/60">
          &copy; {new Date().getFullYear()} Zoominspect. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- Footer`
Expected: PASS, both tests.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Footer component"
```

---

### Task 7: Root layout (fonts, metadata, Header/Footer wiring)

**Files:**
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `<Header />` (Task 5), `<Footer />` (Task 6).
- Produces: the shared page shell every route in later tasks renders inside.

- [ ] **Step 1: Rewrite the root layout**

Modify `app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zoominspect — No. 1 Inspection Company in China",
  description:
    "Zoominspect provides pre-shipment inspection, factory audits, product sourcing, freight forwarding and quality control services in China.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Run the content safety check**

Run: `npm run check:safety`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: wire Header/Footer into root layout, add site metadata"
```

---

### Task 8: Home page

**Files:**
- Create: `components/ServiceCard.tsx`
- Create: `components/IndustryGroup.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `SERVICES`, `INDUSTRIES` from `lib/siteData.ts`.
- Produces: `<ServiceCard service={Service} />`, `<IndustryGroup group={IndustryGroup} />` reused by service pages / could be reused later.

Content below is extracted verbatim (condensed) from the old homepage
(`Old Hacked Website/Zoominspect – an inspection company for your
quality control.html`), stopping well before the point the spam
injection begins in that file, per the spec's sanitization rules.

- [ ] **Step 1: Create the ServiceCard component**

Create `components/ServiceCard.tsx`:
```tsx
import Link from "next/link";
import { Service } from "@/lib/siteData";

export default function ServiceCard({ service }: { service: Service }) {
  return (
    <div className="rounded-lg border border-slate-100 p-6 shadow-sm transition hover:shadow-md">
      <h3 className="text-lg">{service.name}</h3>
      <p className="mt-1 text-sm font-semibold text-brand-orange">{service.priceLabel}</p>
      <p className="mt-3 text-sm text-slate-600">{service.description}</p>
      <Link
        href={`/${service.slug}`}
        className="mt-4 inline-block text-sm font-semibold text-brand-navy hover:underline"
      >
        Learn More &rarr;
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Create the IndustryGroup component**

Create `components/IndustryGroup.tsx`:
```tsx
import { IndustryGroup as IndustryGroupType } from "@/lib/siteData";

export default function IndustryGroup({ group }: { group: IndustryGroupType }) {
  return (
    <div className="rounded-lg bg-slate-50 p-6">
      <h3 className="text-base">{group.name}</h3>
      <ul className="mt-3 space-y-1 text-sm text-slate-600">
        {group.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Write the home page**

Modify `app/page.tsx`:
```tsx
import Link from "next/link";
import ServiceCard from "@/components/ServiceCard";
import IndustryGroup from "@/components/IndustryGroup";
import { SERVICES, INDUSTRIES } from "@/lib/siteData";

export default function HomePage() {
  return (
    <>
      <section className="bg-brand-navy py-20 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl font-bold text-white md:text-5xl">
            No. 1 Inspection Company In China
          </h1>
          <p className="mt-4 text-lg text-white/80">
            Zoominspect is a leading inspections company in China. We provide
            tailored product inspections, factory audits, freight forwarding
            and many other solutions with 100% client satisfaction guaranteed.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-block rounded-md bg-brand-gold px-6 py-3 font-semibold text-brand-navy"
          >
            Get a Quote
          </Link>
        </div>
      </section>

      <section id="about-us" className="mx-auto max-w-5xl px-4 py-16">
        <p className="text-center text-sm font-semibold uppercase tracking-wide text-brand-orange">
          Vision For The Future
        </p>
        <h2 className="mt-2 text-center text-3xl">Our Philosophy</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600">
          We are your one-stop Quality Partner, ready to deliver an efficient
          and ever-evolving service that encompasses every aspect of your
          supply chain. Zoominspect is a leading inspection company in China —
          we are proud to serve thousands of clients across the world through
          timely commitments and thorough inspections.
        </p>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-xl italic">Our Mission</h3>
            <p className="mt-2 text-slate-600">
              Offer Quality Assurance service to our clients — our product
              experts help you review your product at any production phase
              and provide a custom solution to any production challenge you
              might face.
            </p>
          </div>
          <div>
            <h3 className="text-xl italic">Our Vision</h3>
            <p className="mt-2 text-slate-600">
              To offer our global network of quality technical experts
              together with our digital supply chain solutions, delivering a
              transparent, real-time, total supply chain management
              experience at minimum cost.
            </p>
          </div>
        </div>
      </section>

      <section id="our-solutions" className="bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl">Select Your Required Service</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-slate-600">
            We have market-competent pricing with premium services to ensure
            you get the best value for your money.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service) => (
              <ServiceCard key={service.slug} service={service} />
            ))}
          </div>
        </div>
      </section>

      <section id="your-industry" className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-center text-sm font-semibold uppercase tracking-wide text-brand-orange">
          Industries
        </p>
        <h2 className="mt-2 text-center text-3xl">
          Quality Assurance &amp; Quality Control Services by Industry
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((group) => (
            <IndustryGroup key={group.name} group={group} />
          ))}
        </div>
      </section>

      <section className="bg-brand-navy py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-gold">
            Leading Inspection Company In China
          </p>
          <p className="mt-4 text-lg text-white/80">
            Zoom Inspect goes beyond the traditional roles of quality
            control. For nearly two decades, we have been providing
            comprehensive quality control solutions and consulting services
            tailored to our clients&apos; needs.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-block rounded-md bg-brand-gold px-6 py-3 font-semibold text-brand-navy"
          >
            Get a Quote
          </Link>
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 4: Verify the build passes**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Run the content safety check**

Run: `npm run check:safety`
Expected: passes.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: build home page with hero, philosophy, services and industries sections"
```

---

### Task 9: Service page layout + Pre-Shipment Inspection page

**Files:**
- Create: `components/ServicePageLayout.tsx`
- Create: `app/pre-shipment-inspection/page.tsx`

**Interfaces:**
- Produces: `<ServicePageLayout title={string} subtitle?={string} children={ReactNode} />` — reused by every one of Tasks 10–17.

- [ ] **Step 1: Create the shared service page layout**

Create `components/ServicePageLayout.tsx`:
```tsx
import Link from "next/link";

export default function ServicePageLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl">{title}</h1>
      <div className="prose prose-slate mt-6 max-w-none prose-h2:text-brand-navy prose-h3:text-brand-navy">
        {children}
      </div>
      <div className="mt-10">
        <Link
          href="/contact"
          className="inline-block rounded-md bg-brand-gold px-6 py-3 font-semibold text-brand-navy"
        >
          Get A Quote
        </Link>
      </div>
    </article>
  );
}
```

Note: `prose` classes require the Tailwind typography plugin. Install it:
```bash
npm install -D @tailwindcss/typography
```
Modify `tailwind.config.ts` to add `require("@tailwindcss/typography")` to the `plugins` array.

- [ ] **Step 2: Write the Pre-Shipment Inspection page**

Content extracted from `Old Hacked Website/Pre-shipment inspections -
Ensure quality ahead of shipment.html`.

Create `app/pre-shipment-inspection/page.tsx`:
```tsx
import ServicePageLayout from "@/components/ServicePageLayout";

export const metadata = { title: "Pre-Shipment Inspection (PSI) | Zoominspect" };

export default function PreShipmentInspectionPage() {
  return (
    <ServicePageLayout title="Pre-Shipment Inspection (PSI) Services">
      <p>
        A Pre-shipment Inspection (PSI), also called Final Random Inspection
        (FRI), is an effective tool to protect buyers against costly import
        risks. It is used to ensure the quality, quantity, and documentation
        match the buyer&apos;s requirements before goods are shipped.
      </p>
      <p>
        A pre-shipment inspection will determine if there are any defective
        products in a batch and ensure that the products meet the quality
        and safety requirements of the target market. It provides the
        necessary results for deciding if the lot can be accepted before
        shipping — examining products and documents and determining
        compliance with required standards avoids customs problems, reduces
        delays, and prevents defective products from reaching the customer.
      </p>
      <p>
        Pre-shipment inspections are guided by sampling. Sampling occurs when
        the material is 100% produced and 80% packaged for shipment. The
        principle of this type of inspection is to draw conclusions on the
        conformity of the batch from the results obtained on a sample rather
        than inspecting 100%. The sample size is chosen to be statistically
        representative of the total quantity, and the individual units
        inspected are randomly selected by the third-party inspector. This
        quality control is the last opportunity to take corrective action
        before shipping — defective products are sorted or reworked so only
        compliant products are shipped.
      </p>

      <h2>The Pre-Shipment Inspection Precedent</h2>
      <p>
        Pre-shipment inspections are increasingly used and required because
        of an agreement to improve international trade standards under the
        General Agreement on Tariffs and Trade, amended by the World Trade
        Organization. In international trade, third-party pre-shipment
        inspection services may be required to adhere to a letter of credit
        — protecting the monetary interests of the buyer and ensuring the
        products are as ordered before the bank releases funds to the
        selling company.
      </p>

      <h2>Pre-Shipment Inspection Services</h2>
      <p>
        Ensuring product quality is an absolute necessity, both for
        regulatory compliance and brand image. The product must be free of
        defects and match the required quality standards set by the buyer
        when it is shipped from the factory. Having an inspector on-site to
        compare the purchase order with the actual products ensures a higher
        level of assurance and control.
      </p>
      <p>
        Zoominspect provides PSI solutions in China to a wide range of
        clients in textiles, shoes, eyewear, furniture, sporting goods,
        electronics, electrical equipment, medical devices, automotive
        parts, energy equipment, machinery, metal products, and construction
        materials.
      </p>

      <h2>How It Works (The Pre-Shipment Inspection Process)</h2>
      <ol>
        <li>Fill out our booking form on our website or contact us on WhatsApp.</li>
        <li>Payment confirmation (PayPal or Payoneer).</li>
        <li>Contact your product&apos;s supplier and arrange a time-sheet.</li>
        <li>Our team of licensed inspectors visits the factory on the decided date.</li>
        <li>We submit your detailed inspection report the next day after inspection.</li>
      </ol>
    </ServicePageLayout>
  );
}
```

- [ ] **Step 3: Verify the build passes**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Run the content safety check**

Run: `npm run check:safety`
Expected: passes.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add ServicePageLayout and Pre-Shipment Inspection page"
```

---

### Task 10: During Production Inspection page

**Files:**
- Create: `app/during-production-inspection/page.tsx`

**Interfaces:**
- Consumes: `<ServicePageLayout>` (Task 9).

Content extracted from `Old Hacked Website/During manufacture
inspection - quality control all round.html`.

- [ ] **Step 1: Write the page**

Create `app/during-production-inspection/page.tsx`:
```tsx
import ServicePageLayout from "@/components/ServicePageLayout";

export const metadata = { title: "During Production Inspection (DUPRO) | Zoominspect" };

export default function DuringProductionInspectionPage() {
  return (
    <ServicePageLayout title="During Manufacturing Inspection Services (In-Process Inspection)">
      <p>
        Zoominspect offers During Manufacturing Inspection (DMI) — also
        called In-Process Inspection (IPI) or During Production Inspection
        (DUPRO) — in China. Companies need transparency and visibility into
        the manufacture of their products and reassurance that final
        product quality will meet their requirements. Conducted during
        production at the most critical steps, DMI provides essential
        information on actual manufacturing conditions and product quality.
      </p>

      <h2>What Is a During Manufacturing Inspection?</h2>
      <p>
        It is a product inspection conducted during the manufacturing
        process, carried out at different stages and predetermined times —
        usually when at least 20% of the products are completed. It
        provides monitoring and assurance that the factory is following
        established production methodology and techniques, helping identify
        defects early and eliminate them before products are finished,
        which prevents additional costs downstream.
      </p>

      <h2>Advantages of During Manufacturing Inspections</h2>
      <ul>
        <li>Provides an overview of all processes</li>
        <li>Controls production quality in real time</li>
        <li>Assures superior production quality</li>
        <li>Reduces post-production expenses</li>
      </ul>

      <h2>What We Offer</h2>
      <p>
        As a third-party quality company, Zoominspect supports customers
        across the globe with impartial During Production Inspection
        services in China. Inspectors are selected according to their
        industry experience — a textile inspector for a garment in-process
        inspection, a mechanical engineer for a motorcycle in-process
        inspection, and so on.
      </p>
      <p>
        During the service, the inspector walks through the selected
        processes and follows a comprehensive inspection checklist to
        ensure product quality matches specifications, identifying and
        correcting any anomaly quickly. Customers are immediately informed
        of any major or critical problems.
      </p>

      <h2>In-Process Inspection Reports</h2>
      <p>
        Our team develops customized inspection checklists for each
        project, typically covering:
      </p>
      <ul>
        <li>Quantity verification</li>
        <li>Visual (workmanship) evaluation</li>
        <li>Functional and measurement (special testing) evaluation</li>
        <li>Labeling verification</li>
        <li>Packaging verification</li>
        <li>Photo documentation and reporting</li>
      </ul>
      <p>
        Our inspectors identify defects and sort them into three
        categories — minor, major, and critical. Inspection results are
        FAIL, PENDING, or PASS. Clients receive our During Production
        Inspection reports, with digital pictures, within 24 hours of the
        service being completed.
      </p>
    </ServicePageLayout>
  );
}
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Run the content safety check**

Run: `npm run check:safety`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add During Production Inspection page"
```

---

### Task 11: Factory / Supplier Audit page

**Files:**
- Create: `app/factory-supplier-audit/page.tsx`

Content extracted from `Old Hacked Website/Supplier Audit – absolute
evaluation of quality compliance.html`.

- [ ] **Step 1: Write the page**

Create `app/factory-supplier-audit/page.tsx`:
```tsx
import ServicePageLayout from "@/components/ServicePageLayout";

export const metadata = { title: "Factory / Supplier Audit | Zoominspect" };

export default function FactorySupplierAuditPage() {
  return (
    <ServicePageLayout title="Factory / Supplier Audit">
      <p>
        A Factory Audit or Supplier Audit is a systematic evaluation of the
        quality system and compliance level of a supplier. The purpose of a
        quality control audit is to help our clients verify the capability
        and suitability of their suppliers. This factory assessment is
        typically carried out by an internal or external quality auditor
        and often triggers a process of continuous improvement.
      </p>

      <h2>Effectively Assess the Quality of Your Supplier</h2>
      <p>
        Inspection services are useful for assessing product quality, but
        detecting product defects is a reactive approach — detection comes
        after the product has already been made, and inspection only gives
        a snapshot of a manufacturer&apos;s quality performance. A proactive
        quality assurance approach focuses on two crucial components:
      </p>
      <ul>
        <li>Quality Management System</li>
        <li>Vendor Compliance</li>
      </ul>

      <h3>Quality Management System (QMS)</h3>
      <p>
        The quality of your product is supported by the level of
        operational excellence in your manufacturing processes, which is in
        turn supported by an effective quality management system. Each
        manufacturing industry has its own industry-specific QMS that
        factories need to comply with.
      </p>

      <h3>Vendor Compliance</h3>
      <p>
        The integrity of your suppliers is often determined by their
        compliance with all applicable laws, rules and regulations, as well
        as an internal code of conduct, policies and procedures, and other
        supply-chain compliance requirements. Many large retailers also
        have their own Supplier Code of Conduct requirements to ensure
        responsible sourcing and protect brand value.
      </p>
      <p>
        Zoominspect provides factory audits to assess the reliability of
        your potential and existing suppliers, and establishes a regular
        monitoring program to evaluate a supplier&apos;s internal
        environment, ensure they operate efficiently, deliver high-quality
        products, and support a culture of continuous improvement.
      </p>

      <h2>What We Offer</h2>
      <ul>
        <li>
          <strong>Measuring Performance</strong> — understand your current
          performance baseline and focus on the metrics you need to
          improve.
        </li>
        <li>
          <strong>Concrete Actions</strong> — determine the required actions
          based on the defined metrics from the formal audit and
          assessment.
        </li>
        <li>
          <strong>Company Alignment</strong> — ensure your supplier&apos;s
          efforts are aligned to your goals, building a win-win strategy and
          a long-term partnership.
        </li>
        <li>
          <strong>Responsible Production</strong> — elevate your brand&apos;s
          image and be a genuinely responsible part of the global supply
          chain.
        </li>
        <li>
          <strong>Sustained Performance</strong> — establish control plans
          to sustain improved performance and strive for continuous
          improvement.
        </li>
      </ul>
    </ServicePageLayout>
  );
}
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Run the content safety check**

Run: `npm run check:safety`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Factory/Supplier Audit page"
```

---

### Task 12: Samples Inspection page

**Files:**
- Create: `app/samples-inspection/page.tsx`

Content extracted from `Old Hacked Website/Samples Inspection in
China – for unerring quality assurance.html`.

- [ ] **Step 1: Write the page**

Create `app/samples-inspection/page.tsx`:
```tsx
import ServicePageLayout from "@/components/ServicePageLayout";

export const metadata = { title: "Samples Inspection | Zoominspect" };

export default function SamplesInspectionPage() {
  return (
    <ServicePageLayout title="Samples Inspection">
      <p>
        A sample checking service involves inspecting a relatively small
        number of items from a batch or lot for a range of specifications —
        appearance, workmanship, safety, functions, and more — prior to
        mass production.
      </p>
      <p>
        It is an essential step before manufacturing begins, starting with
        a physical inspection of a product sample to spot defects before
        mass production. During sample checking, the physical and
        functional characteristics of the product are verified against
        engineering drawings, a purchase order, specifications, and other
        design documents, ensuring the sample meets specified requirements
        and avoiding bulk quality problems during manufacturing.
      </p>

      <h2>Zoominspect Sample Checking Service Mainly Includes</h2>
      <ul>
        <li>
          <strong>Quantity check</strong> — check the quantity of finished
          goods to be manufactured.
        </li>
        <li>
          <strong>Workmanship check</strong> — check the degree of skill and
          the quality of materials and finished product based on a design.
        </li>
        <li>
          <strong>Style, color &amp; documentation</strong> — check whether
          the product style and color are consistent with specifications
          and other design documents.
        </li>
        <li>
          <strong>Field test &amp; measurement</strong> — test the product
          in an actual situation reflecting its intended use, and survey
          existing conditions against drawings at the field site.
        </li>
        <li>
          <strong>Shipping mark &amp; packaging</strong> — check whether the
          shipping mark and packaging comply with relevant requirements.
        </li>
      </ul>

      <h2>Advantages of Samples Inspection</h2>
      <ul>
        <li>Involves less inspection to achieve a pre-decided degree of certainty about quality.</li>
        <li>Consumes less time and is less expensive.</li>
        <li>Less fatigue and boredom for inspectors, keeping operating efficiency high.</li>
        <li>More accurate — 100% inspection introduces errors from fatigue and repetitive work.</li>
        <li>Since fewer pieces are inspected, no damage is done to the rest of the lot.</li>
        <li>Necessary where components require destructive testing or chemical analysis, where 100% inspection can never be employed.</li>
        <li>Rejection of a complete batch based on a sample pressures suppliers to improve quality.</li>
      </ul>
    </ServicePageLayout>
  );
}
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Run the content safety check**

Run: `npm run check:safety`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Samples Inspection page"
```

---

### Task 13: Product Sourcing page

**Files:**
- Create: `app/product-sourcing/page.tsx`

Content extracted from `Old Hacked Website/Product Sourcing - find
the Pre-eminent suppliers in China.html`.

- [ ] **Step 1: Write the page**

Create `app/product-sourcing/page.tsx`:
```tsx
import ServicePageLayout from "@/components/ServicePageLayout";

export const metadata = { title: "Product Sourcing from China | Zoominspect" };

export default function ProductSourcingPage() {
  return (
    <ServicePageLayout title="Product Sourcing From China">
      <p>
        Online or retail businesses outside China can benefit greatly from
        sourcing products from China. Contrary to the popular belief that
        China is home to only cheap, low-quality products, many
        manufacturing units there produce high-quality products that are
        competitive in any market. Product sourcing from China can be
        daunting, but it is also the option with the greatest potential for
        profit — and Zoominspect has the presence in China and years of
        experience needed to source your products from the best suppliers.
      </p>

      <h2>Why Source From China?</h2>
      <ul>
        <li>
          <strong>Cost</strong> — China has a huge, low-cost labor pool, and
          you can save on tooling and molds, unit costs, packaging, design
          and engineering. A little knowledge of your niche gives you
          access to high-quality products manufactured at a fraction of the
          cost.
        </li>
        <li>
          <strong>Elimination of middlemen</strong> — Chinese manufacturers
          increasingly deal directly with the businesses sourcing from them,
          cutting costs and giving you a better understanding of how the
          seller works.
        </li>
        <li>
          <strong>Chinese supplier base</strong> — one of the best supplier
          bases in the world, well connected to a robust infrastructure for
          production and transportation of goods across every industry.
        </li>
        <li>
          <strong>Reduced risk of fraud</strong> — sourcing through a
          well-managed process, dealing directly with the supplier, reduces
          the risk of fraud and keeps you aware of every step.
        </li>
        <li>
          <strong>Scaling capabilities</strong> — efficient infrastructure
          and low minimum order quantities make it possible to scale
          production quickly as your business grows.
        </li>
      </ul>

      <h2>How We Help You Source High-Quality Products From China</h2>
      <p>
        Sourcing from China is beneficial but not always easy — you need a
        robust business strategy and a partner who understands the Chinese
        economy, culture and people to avoid costly mistakes.
      </p>

      <h3>Types of Manufacturers in China We Help You Source From</h3>
      <ul>
        <li>
          <strong>Trade companies</strong> — large factories offering a huge
          range of products, with an added margin for profit; better suited
          when a low minimum order quantity isn&apos;t required.
        </li>
        <li>
          <strong>Wholesalers</strong> — deal in standardized products with
          limited customization, adding a margin on top of manufacturing
          costs; a good option for new eCommerce businesses.
        </li>
        <li>
          <strong>Manufacturers</strong> — the most cost-effective option,
          with a higher profit margin than trade companies or wholesalers,
          though effective communication and understanding their business
          culture can be challenging.
        </li>
      </ul>
      <p>
        Now that we&apos;ve distinguished between these three avenues, let&apos;s
        get in touch to discuss exactly how to prepare for product sourcing
        from China.
      </p>
    </ServicePageLayout>
  );
}
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Run the content safety check**

Run: `npm run check:safety`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Product Sourcing page"
```

---

### Task 14: Freight Forwarding page

**Files:**
- Create: `app/freight-forwarding/page.tsx`

Content extracted from `Old Hacked Website/Freight Forwarding
Services In China.html`.

- [ ] **Step 1: Write the page**

Create `app/freight-forwarding/page.tsx`:
```tsx
import ServicePageLayout from "@/components/ServicePageLayout";

export const metadata = { title: "Freight Forwarding From China | Zoominspect" };

export default function FreightForwardingPage() {
  return (
    <ServicePageLayout title="Freight Forwarding From China">
      <p>
        Zoominspect is here to revolutionize your freight forwarding
        experience by offering a seamless and efficient way to transport
        your goods to destinations around the world. As a leading freight
        forwarder specializing in shipping from China, we understand the
        unique challenges businesses face transporting goods
        internationally, and we&apos;ve built a comprehensive solution for a
        hassle-free process.
      </p>

      <h2>The Importance of Freight Forwarders in China</h2>
      <p>
        China has established itself as a major industrial hub and exporter
        of commodities, playing a crucial role in freight forwarding for
        international trade. Its large manufacturing capabilities,
        affordable pricing, and diverse choice of items create enormous
        prospects for importers — but managing the complexity of
        international shipping calls for real knowledge and logistical
        support. Zoominspect specializes in freight forwarding as well as
        quality control, helping through seamless and effective options.
      </p>
      <p>
        China&apos;s highly efficient and extensive transportation
        infrastructure — an extensive network of ports, airports and rail
        networks, coupled with advanced logistics technology — enables
        freight forwarders to handle the movement of goods smoothly and
        with precision, acting as the intermediary between businesses and
        carriers from documentation through customs clearance and final
        delivery.
      </p>
      <p>
        Access to an extensive selection of transportation choices is one
        of the main benefits of freight forwarding from China — whether you
        prefer air freight, sea freight, or rail transportation, we can
        negotiate favorable terms and reserve space even during periods of
        high shipping demand.
      </p>

      <h2>Why Choose Zoominspect as Your Freight Forwarder in China?</h2>
      <ul>
        <li>
          <strong>Freight Forwarding Expertise</strong> — years of
          experience and strong relationships with trusted carriers and
          partners for reliable, cost-effective shipping options.
        </li>
        <li>
          <strong>Streamlined Logistics</strong> — advanced technology and
          software to optimize routes, track shipments in real time, and
          provide complete visibility throughout transportation.
        </li>
        <li>
          <strong>Customized Solutions</strong> — a freight forwarding plan
          tailored to your budget and timeline, whether shipping small
          parcels or large cargo.
        </li>
        <li>
          <strong>Seamless Customs Clearance</strong> — expertise in
          international trade complexities so your shipments comply with
          requirements and clear customs smoothly.
        </li>
        <li>
          <strong>Competitive Rates</strong> — an extensive network and
          volume commitments let us negotiate competitive rates with
          carrier partners.
        </li>
        <li>
          <strong>Excellent Customer Service</strong> — a dedicated team
          available around the clock to assist with any queries or
          concerns.
        </li>
      </ul>
      <p>
        Freight forwarding from China offers businesses a wealth of
        opportunities, but it comes with its own set of challenges — whether
        you&apos;re a small business or a multinational corporation,
        partnering with a reliable freight forwarder like Zoominspect can
        help you navigate the complexities of shipping from China.
      </p>
    </ServicePageLayout>
  );
}
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Run the content safety check**

Run: `npm run check:safety`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Freight Forwarding page"
```

---

### Task 15: Patent & Trademark in China page

**Files:**
- Create: `app/patent-trademark-china/page.tsx`

Content extracted from `Old Hacked Website/Patent_Trademark In
China.html`.

- [ ] **Step 1: Write the page**

Create `app/patent-trademark-china/page.tsx`:
```tsx
import ServicePageLayout from "@/components/ServicePageLayout";

export const metadata = { title: "China Patent & Trademark | Zoominspect" };

export default function PatentTrademarkChinaPage() {
  return (
    <ServicePageLayout title="China Patent / Trademark">
      <p>
        Protecting your intellectual property rights in China is no longer
        a luxury; it&apos;s a necessity. As one of the world&apos;s leading
        innovators, China offers vast opportunities for businesses,
        entrepreneurs, and inventors to flourish — but navigating the
        intricacies of the Chinese patent and trademark system can be
        complex and challenging. That&apos;s where our trademark services
        come in.
      </p>
      <p>
        A patent grants its owner legal ownership of a development for a
        predetermined amount of time. A trademark is a term, icon,
        structure, or slogan used to identify a particular product and set
        it apart from competing goods. Zoominspect is a trusted and
        experienced partner dedicated to helping enterprises from around
        the globe safeguard their intellectual property rights in China.
      </p>

      <h2>Patent Protection</h2>
      <p>
        Our team of skilled professionals possesses deep expertise in the
        intricacies of the Chinese patent system. We guide you through the
        entire patent application process — from conducting thorough prior
        art searches and preparing high-quality applications to
        communicating with the relevant authorities on your behalf. Whether
        it&apos;s a utility patent, design patent, or plant patent, we ensure
        you have the best chance of securing exclusive rights in China.
      </p>

      <h2>Trademark Registration</h2>
      <p>
        Building and protecting your brand&apos;s identity is crucial for
        success in any market, particularly in China, where counterfeiting
        remains a significant concern. Our trademark specialists register
        and protect your trademarks, logos, and brand names, conducting
        comprehensive searches to identify potential conflicts and
        minimizing the risk of rejection or opposition.
      </p>

      <h2>Intellectual Property Enforcement</h2>
      <p>
        Online intellectual property infringement has become increasingly
        prevalent. We offer a range of enforcement services to combat
        counterfeit products, trademark infringements, and patent
        violations.
      </p>

      <h2>Why Should You Choose Zoominspect?</h2>
      <ul>
        <li>
          <strong>Expertise and Experience</strong> — years of experience in
          intellectual property law in China and an in-depth understanding
          of the patent and trademark landscape.
        </li>
        <li>
          <strong>Customized Solutions</strong> — tailored services that
          align with your specific goals, whether you&apos;re a
          multinational corporation or an individual inventor.
        </li>
        <li>
          <strong>Commitment to Excellence</strong> — meticulous attention
          to detail at every step, from client service to application
          quality.
        </li>
        <li>
          <strong>Bridge Between Cultures</strong> — a bilingual team with
          extensive international experience bridging the communication gap
          between you and Chinese authorities.
        </li>
      </ul>
    </ServicePageLayout>
  );
}
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Run the content safety check**

Run: `npm run check:safety`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Patent/Trademark in China page"
```

---

### Task 16: Product Consolidation page *(reconstructed — flag for user review)*

**Files:**
- Create: `app/product-consolidation/page.tsx`

⚠️ No standalone HTML page for this service exists in
`Old Hacked Website/` — only the short homepage blurb ("In case you
do your marketing research before investing a huge chunk, we are sure
you are considering samples from a lot of suppliers. We consolidate
your samples in a single package and ship it right to your
doorstep!"). This page's body is written from that blurb plus
standard industry description of product consolidation services, and
must be flagged to the user as not sourced from a full original page
once implementation is done.

- [ ] **Step 1: Write the page**

Create `app/product-consolidation/page.tsx`:
```tsx
import ServicePageLayout from "@/components/ServicePageLayout";

export const metadata = { title: "Product Consolidation | Zoominspect" };

export default function ProductConsolidationPage() {
  return (
    <ServicePageLayout title="Product Consolidation">
      <p>
        If you&apos;re sourcing samples from multiple suppliers across China
        before committing to a bulk order, shipping each one separately
        quickly becomes expensive and hard to track. Zoominspect&apos;s
        product consolidation service collects samples or goods from
        several suppliers into a single warehouse, then combines them into
        one package for shipment to your doorstep.
      </p>

      <h2>How It Works</h2>
      <ul>
        <li>We receive your samples or goods from multiple suppliers at our facility in China.</li>
        <li>Each shipment is checked in, logged, and inspected on arrival for damage or shortages.</li>
        <li>Items are consolidated into a single, properly packed shipment.</li>
        <li>We arrange freight forwarding for the consolidated package to your destination of choice.</li>
      </ul>

      <h2>Why Consolidate</h2>
      <ul>
        <li>Lower shipping costs compared to paying for separate international shipments per supplier.</li>
        <li>One tracking number and one delivery instead of managing several.</li>
        <li>An opportunity to inspect and compare samples side by side before deciding on a supplier.</li>
        <li>Reduced risk of items being lost or delayed in transit from multiple sources.</li>
      </ul>
      <p>
        Product consolidation pairs naturally with our sample inspection and
        freight forwarding services — talk to us about combining them into
        one streamlined process while you evaluate suppliers.
      </p>
    </ServicePageLayout>
  );
}
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Run the content safety check**

Run: `npm run check:safety`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Product Consolidation page (reconstructed from homepage blurb, flagged for review)"
```

---

### Task 17: Product Photography page *(reconstructed — flag for user review)*

**Files:**
- Create: `app/product-photography/page.tsx`

⚠️ Same caveat as Task 16: no standalone HTML page exists in
`Old Hacked Website/` for this service — only the homepage blurb
("Having your sample made in China and waiting for the first product
to arrive at your location just to get your creative journey started
can be very frustrating. Let our expert photographers in China take
care of that!"). Flag to the user for review once implementation is
done.

- [ ] **Step 1: Write the page**

Create `app/product-photography/page.tsx`:
```tsx
import ServicePageLayout from "@/components/ServicePageLayout";

export const metadata = { title: "Product Photography | Zoominspect" };

export default function ProductPhotographyPage() {
  return (
    <ServicePageLayout title="Product Photography">
      <p>
        Waiting for a sample to ship from China just to get professional
        product photos taken can add weeks to your launch timeline.
        Zoominspect&apos;s product photography service puts an experienced
        photography team on the ground in China, so your listing-ready
        images are shot right where your product is made.
      </p>

      <h2>What We Offer</h2>
      <ul>
        <li>Studio-quality product photography for eCommerce listings (Amazon, Shopify, and more).</li>
        <li>Lifestyle and in-use shots to show your product in context.</li>
        <li>Detail and close-up shots highlighting materials, finish, and craftsmanship.</li>
        <li>Fast turnaround, since photography happens at the same location as your inspection or sample review.</li>
      </ul>

      <h2>Why It Matters</h2>
      <p>
        High-quality images directly affect conversion rates on every major
        marketplace. Combining product photography with our sample
        inspection service means you get professional visuals and a
        quality check in the same visit — no need to wait for a physical
        sample to arrive at your own location before you can start
        marketing.
      </p>
    </ServicePageLayout>
  );
}
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Run the content safety check**

Run: `npm run check:safety`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Product Photography page (reconstructed from homepage blurb, flagged for review)"
```

---

### Task 18: Inspection Standards page

**Files:**
- Create: `app/inspection-standards/page.tsx`

Content extracted from `Old Hacked Website/Inspection Standards -
following supreme quality standards.html`.

- [ ] **Step 1: Write the page**

Create `app/inspection-standards/page.tsx`:
```tsx
import ServicePageLayout from "@/components/ServicePageLayout";

export const metadata = {
  title: "Inspection Standards: ANSI/ASQC Sampling Procedure and Tables | Zoominspect",
};

export default function InspectionStandardsPage() {
  return (
    <ServicePageLayout title="ANSI/ASQC Sampling Procedure and Tables">
      <h2>Introduction to ANSI/ASQC Z1.4 and AQL</h2>
      <p>
        Inspection standards are guidelines and procedures used to ensure
        that products meet certain quality criteria. Two of the most widely
        used inspection standards in the United States are ANSI/ASQC Z1.4
        and AQL.
      </p>

      <h3>What Is Meant by ANSI/ASQC Z1.4 Inspection Standards?</h3>
      <p>
        ANSI/ASQC Z1.4, also known as the Sampling Procedures and Tables for
        Inspection by Attributes, is a standard developed by the American
        National Standards Institute (ANSI) and the American Society for
        Quality Control (ASQC). It provides guidelines for sampling and
        inspecting products using attribute data (data that is either
        present or absent, such as a defect), including tables for
        determining the appropriate sample size and acceptance criteria for
        different quality levels and production processes. The ANSI Z1.4
        2008 standard is also known as ISO 2859, NF06-022, BS 6001 and DIN
        40080.
      </p>

      <h3>What Is Meant by AQL Inspection Standards?</h3>
      <p>
        AQL, or Acceptable Quality Level, is another commonly used
        inspection standard. AQL charts provide a way to determine the
        maximum number of defects that can be found in a sample of a
        product and still be considered acceptable — a useful tool for
        determining the appropriate sample size and acceptance criteria for
        a given product and production process.
      </p>

      <h3>ANSI Tables and AQL Charts Used to Determine Sample Size and Acceptance Criteria</h3>
      <ul>
        <li>Table I — Sample Size Code Letters</li>
        <li>Table II-A — Single sampling plan for normal inspections (Master Table)</li>
        <li>Table III-A — Double sampling plan for normal inspections (Master Table)</li>
      </ul>

      <h3>Uses of ANSI/ASQC Z1.4 and AQL Inspection Standards</h3>
      <p>
        Both ANSI/ASQC Z1.4 and AQL are widely used across manufacturing,
        construction, and service industries, providing a standardized way
        to ensure products meet quality criteria and to measure and compare
        the quality of different products and production processes. Each
        industry may have its own specific standards and guidelines beyond
        these two, so it&apos;s important to consult the appropriate industry
        group or organization to determine which standards are most
        appropriate for your product.
      </p>

      <h3>Conclusion</h3>
      <p>
        Inspection standards such as ANSI/ASQC Z1.4 and AQL play an
        important role in ensuring that products meet certain quality
        criteria. Familiarizing yourself with the appropriate standards for
        your industry helps ensure your products meet the necessary quality
        criteria.
      </p>
    </ServicePageLayout>
  );
}
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Run the content safety check**

Run: `npm run check:safety`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Inspection Standards page"
```

---

### Task 19: Blog data layer

**Files:**
- Create: `lib/blog.ts`
- Create: `lib/blog.test.ts`
- Create: `content/blog/` (directory, empty until Task 22)

**Interfaces:**
- Produces:
  - `type BlogPost = { slug: string; title: string; date: string; excerpt: string; coverImage: string; content: string }`
  - `getAllPosts(): BlogPost[]` — sorted by `date` descending.
  - `getPostBySlug(slug: string): BlogPost | undefined`
- Consumed by: `app/blogs/page.tsx` (Task 20) and `app/blogs/[slug]/page.tsx` (Task 21).

- [ ] **Step 1: Install MDX/frontmatter dependencies**

```bash
npm install gray-matter next-mdx-remote
```

- [ ] **Step 2: Write the failing test using a fixture directory**

Create `lib/blog.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";

// blog.ts reads from a configurable directory so it can be pointed at a
// fixture directory in tests instead of the real content/blog folder.
import { getAllPostsFrom, getPostBySlugFrom } from "./blog";

describe("blog content loading", () => {
  let dir: string;

  beforeAll(() => {
    dir = mkdtempSync(path.join(tmpdir(), "blog-test-"));
    writeFileSync(
      path.join(dir, "older-post.mdx"),
      `---
title: Older Post
date: 2024-01-01
excerpt: An older post.
coverImage: /images/blog/older.jpg
---

# Older Post

Body content here.
`
    );
    writeFileSync(
      path.join(dir, "newer-post.mdx"),
      `---
title: Newer Post
date: 2024-06-01
excerpt: A newer post.
coverImage: /images/blog/newer.jpg
---

# Newer Post

Body content here.
`
    );
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("returns all posts sorted newest first", () => {
    const posts = getAllPostsFrom(dir);
    expect(posts.map((p) => p.slug)).toEqual(["newer-post", "older-post"]);
  });

  it("parses frontmatter fields correctly", () => {
    const posts = getAllPostsFrom(dir);
    expect(posts[0].title).toBe("Newer Post");
    expect(posts[0].excerpt).toBe("A newer post.");
    expect(posts[0].coverImage).toBe("/images/blog/newer.jpg");
  });

  it("finds a single post by slug", () => {
    const post = getPostBySlugFrom(dir, "older-post");
    expect(post?.title).toBe("Older Post");
    expect(post?.content).toContain("Body content here.");
  });

  it("returns undefined for a missing slug", () => {
    expect(getPostBySlugFrom(dir, "does-not-exist")).toBeUndefined();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- blog`
Expected: FAIL — `lib/blog.ts` does not exist.

- [ ] **Step 4: Implement the blog data layer**

Create `lib/blog.ts`:
```typescript
import { readdirSync, readFileSync, existsSync } from "fs";
import path from "path";
import matter from "gray-matter";

export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  coverImage: string;
  content: string;
};

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export function getAllPostsFrom(dir: string): BlogPost[] {
  if (!existsSync(dir)) return [];

  const files = readdirSync(dir).filter((f) => f.endsWith(".mdx"));

  const posts = files.map((file) => {
    const slug = file.replace(/\.mdx$/, "");
    const raw = readFileSync(path.join(dir, file), "utf-8");
    const { data, content } = matter(raw);
    return {
      slug,
      title: data.title as string,
      date: data.date as string,
      excerpt: data.excerpt as string,
      coverImage: data.coverImage as string,
      content,
    };
  });

  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlugFrom(dir: string, slug: string): BlogPost | undefined {
  return getAllPostsFrom(dir).find((p) => p.slug === slug);
}

export function getAllPosts(): BlogPost[] {
  return getAllPostsFrom(BLOG_DIR);
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return getPostBySlugFrom(BLOG_DIR, slug);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- blog`
Expected: PASS, all 4 tests.

- [ ] **Step 6: Create the (still-empty) content directory**

```bash
mkdir -p content/blog
touch content/blog/.gitkeep
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add blog data layer (frontmatter parsing, sorting, lookup by slug)"
```

---

### Task 20: Blog index page

**Files:**
- Create: `app/blogs/page.tsx`

**Interfaces:**
- Consumes: `getAllPosts()` from `lib/blog.ts` (Task 19).

- [ ] **Step 1: Write the blog index page**

Create `app/blogs/page.tsx`:
```tsx
import Link from "next/link";
import Image from "next/image";
import { getAllPosts } from "@/lib/blog";

export const metadata = { title: "Our Blogs | Zoominspect" };

export default function BlogsPage() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl">Read Our Blogs</h1>
      <p className="mt-2 text-slate-600">
        Insights on quality control, inspections, and sourcing from China.
      </p>

      {posts.length === 0 ? (
        <p className="mt-8 text-slate-500">No posts published yet.</p>
      ) : (
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blogs/${post.slug}`}
              className="block overflow-hidden rounded-lg border border-slate-100 shadow-sm transition hover:shadow-md"
            >
              <div className="relative h-40 w-full bg-slate-100">
                <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
              </div>
              <div className="p-4">
                <h2 className="text-base">{post.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{post.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: build succeeds (blog index renders with zero posts at this point — that's expected until Task 22).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add blog index page"
```

---

### Task 21: Blog post page template

**Files:**
- Create: `app/blogs/[slug]/page.tsx`

**Interfaces:**
- Consumes: `getAllPosts()`, `getPostBySlug()` from `lib/blog.ts` (Task 19).

- [ ] **Step 1: Write the dynamic blog post page**

Create `app/blogs/[slug]/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllPosts, getPostBySlug } from "@/lib/blog";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  return { title: post ? `${post.title} | Zoominspect` : "Post Not Found | Zoominspect" };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl">{post.title}</h1>
      <p className="mt-2 text-sm text-slate-500">{post.date}</p>
      <div className="relative mt-6 h-64 w-full overflow-hidden rounded-lg bg-slate-100">
        <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
      </div>
      <div className="prose prose-slate mt-8 max-w-none">
        <MDXRemote source={post.content} />
      </div>
    </article>
  );
}
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add blog post page template using next-mdx-remote"
```

---

### Task 22: Blog content migration (all 38 posts)

**Files:**
- Create: `content/blog/<slug>.mdx` for each of the 38 posts listed below.
- Create: `public/images/blog/<slug>-cover.jpg` (or `.png`) for each post's cover image.

**Interfaces:**
- Consumes: `getAllPosts()`/`getPostBySlug()` (Task 19), blog index (Task 20), blog template (Task 21).

This is a repeatable content-migration task applied to 38 source
files. **Follow this exact procedure for every row in the table
below**, in order, committing after every 5–8 posts (not necessarily
after every single one) so progress is checkpointed without 38
separate tiny commits:

**Per-post procedure:**

1. Open the source file at `Old Hacked Website/Blogs/<source file>`.
2. Extract only the human-readable heading and paragraph/list text —
   the same way Tasks 9–18 extracted service-page copy: read the
   rendered text, ignore all `<script>`/`<style>` tags, ignore any
   block using the off-screen injection pattern (`overflow:hidden` +
   `position:absolute` with large/negative offsets), and ignore any
   non-English content or gambling/casino-related text or links,
   exactly per the spec's sanitization rules.
3. Find the post's cover/hero image referenced near the top of the
   article in its `_files/` folder (usually a `...-300x150` sized
   JPEG/PNG), copy it to `public/images/blog/<slug>-cover.<ext>`.
4. Write `content/blog/<slug>.mdx`:
   ```
   ---
   title: "<exact post title, without the trailing ' - Zoom Inspect'>"
   date: "<YYYY-MM-DD>"
   excerpt: "<one or two sentence summary written from the post's opening paragraph>"
   coverImage: "/images/blog/<slug>-cover.<ext>"
   ---

   <cleaned body content as Markdown: use `##`/`###` for the post's
   original headings, plain paragraphs, and `-`/`1.` for its lists>
   ```
   Since the old dumps have no reliable publish dates, assign `date`
   values as sequential placeholders one day apart, oldest first in
   the table order below (e.g. row 1 = `2023-01-01`, row 2 =
   `2023-01-02`, ... row 38 = `2023-02-07`) — flag to the user at the
   end of this task that these dates are approximate placeholders,
   not the real original publish dates.
5. Run `npm run check:safety` — must report no matches for the new
   file before moving to the next row.
6. Run `npm run build` after every 5–8 posts to catch MDX syntax
   errors early rather than only at the very end.

**Table of all 38 posts (source file is relative to
`Old Hacked Website/Blogs/`):**

| # | Slug | Source file |
|---|---|---|
| 1 | `4-ways-to-differentiate-a-trading-company-and-a-factory` | `4 Ways to Differentiate a Trading Company and a Factory - Zoom Inspect.html` |
| 2 | `5-things-to-know-about-pre-shipment-inspection-psi` | `5 Things to Know About Pre-Shipment Inspection (PSI) - Zoom Inspect.html` |
| 3 | `6-key-benefits-of-outsourcing-your-quality-control` | `6 Key Benefits of Outsourcing Your Quality Control - Zoom Inspect.html` |
| 4 | `a-comprehensive-guide-to-regulatory-framework-for-china-inventory-inspections` | `A Comprehensive Guide to Regulatory Framework for China Inventory Inspections - Zoom Inspect.html` |
| 5 | `a-step-by-step-guide-to-ensuring-successful-during-production-inspection` | `A Step-by-Step Guide to Ensuring Successful During Production Inspection - Zoom Inspect.html` |
| 6 | `advantages-of-pre-shipment-inspections-in-china` | `Advantages Of Pre Shipment Inspections in China - Zoom Inspect.html` |
| 7 | `capturing-excellence-top-product-photography-services-in-china` | `Capturing Excellence_ Top Product Photography Services in China for Stunning Visuals! - Zoom Inspect.html` |
| 8 | `case-studies-successful-inventory-inspections-in-china` | `Case Studies about some Successful Inventory Inspections in China - Zoom Inspect.html` |
| 9 | `cracking-the-code-insider-tips-for-patent-applications-in-china` | `Cracking The Code_ Insider Tips for Successful Patent Applications in China - Zoom Inspect.html` |
| 10 | `definition-and-meaning-of-pre-shipment-inspection` | `Definition and Meaning of Pre-Shipment Inspection - Zoom Inspect.html` |
| 11 | `how-a-pre-shipment-inspection-can-help-amazon-fba-sellers` | `How A Pre-Shipment Inspection Can Help Amazon FBA Sellers Importing From China_ - Zoom Inspect.html` |
| 12 | `how-container-loading-inspections-protect-your-business-from-liability` | `How Container Loading Inspections Can Help Protect Your Business from Liability - Zoom Inspect.html` |
| 13 | `how-quality-assurance-of-raw-materials-affects-the-fashion-industry` | `How Quality Assurance of Raw Materials Affect the Fast-Paced Fashion Industry_ - Zoom Inspect Zoom Inspect.html` |
| 14 | `how-to-choose-the-best-inventory-inspection-company-in-china` | `How to Choose the Best Inventory Inspection Company for Your Chinese Business Operations_ - Zoom Inspect.html` |
| 15 | `how-to-choose-the-right-inspection-company-in-china` | `How to choose the right inspection company in China_ - Zoom Inspect.html` |
| 16 | `how-to-conduct-a-comprehensive-inspection-for-electronic-consumer-products` | `How to Conduct a Comprehensive Inspection for Electronic Consumer Products_ - Zoom Inspect.html` |
| 17 | `how-to-conduct-an-expert-inspection-of-electronic-consumer-products` | `How to conduct an expert inspection of electronic consumer products_ - Zoom Inspect.html` |
| 18 | `how-to-streamline-your-supplier-quality-management-with-zoominspect` | `How to Streamline Your Supplier Quality Management with Zoominspect - Zoom Inspect.html` |
| 19 | `i-completely-trust-my-supplier-do-i-still-need-an-inspection` | `I Completely Trust My Supplier. Do I Still Need an Inspection_ - Zoom Inspect.html` |
| 20 | `navigate-the-chinese-market-5-proven-strategies-for-product-sourcing` | `Navigate the Chinese Market_ 5 Proven Strategies for Product Sourcing - Zoom Inspect %.html` |
| 21 | `optimizing-trademark-registration-in-china` | `Optimizing Trademark Registration in China_ A Comprehensive Guide - Zoom Inspect.html` |
| 22 | `pre-shipment-inspection-5-very-common-problems` | `Pre-Shipment Inspection _ 5 very Common Problems - Zoom Inspect.html` |
| 23 | `pre-shipment-inspection-in-7-simple-steps` | `Pre-Shipment Inspection in 7 Simple Steps - Zoom Inspect.html` |
| 24 | `quality-assurance-the-basics-of-sampling-process-and-standards` | `Quality Assurance_ The Basics of Sampling Process and Standards - Zoom Inspect.html` |
| 25 | `quality-control-made-easy-guide-to-china-factory-inspections` | `Quality Control Made Easy_ A Comprehensive Guide to China Factory Inspections - Zoom Inspect.html` |
| 26 | `quality-inspection-checklist-ensuring-quality-at-every-step` | `QUALITY INSPECTION CHECKLIST_ ENSURING QUALITY AT EVERY STEP - Zoom Inspect.html` |
| 27 | `shipping-simplified-a-guide-to-e-commerce-logistics` | `SHIPPING SIMPLIFIED_ A GUIDE TO E-COMMERCE LOGISTICS - Zoom Inspect.html` |
| 28 | `the-crucial-role-of-factory-supplier-audits-in-ethical-and-quality-standards` | `THE CRUCIAL ROLE OF FACTORY_SUPPLIER AUDITS IN ENSURING ETHICAL AND QUALITY STANDARDS_ - Zoom Inspect.html` |
| 29 | `the-impact-of-professional-product-photography-on-your-brands-success` | `THE IMPACT OF PROFESSIONAL PRODUCT PHOTOGRAPHY ON YOUR BRAND’S SUCCESS - Zoom Inspect.html` |
| 30 | `the-importance-of-inventory-inspections-for-supply-chain-management` | `The importance of inventory inspections for supply chain management in China - Zoom Inspect.html` |
| 31 | `the-importance-of-pre-shipment-inspection` | `The Importance of Pre-Shipment Inspection_ Ensuring the Quality of Your Products - Zoom Inspect.html` |
| 32 | `the-power-of-sample-inspection` | `The Power of Sample Inspection_ Enhancing Product Quality and Consumer Satisfaction - Zoom Inspect.html` |
| 33 | `the-ultimate-inventory-inspection-guide` | `The Ultimate Inventory Inspection Guide_ Unveiling China's Best Practices  - Zoom Inspect.html` |
| 34 | `the-vital-role-of-product-inspections-during-manufacture` | `The Vital Role of Product Inspections During Manufacture - Zoom Inspect.html` |
| 35 | `unveiling-container-inspection-common-defects-and-solutions` | `Unveiling Container Inspection_ Common Defects and Their Solutions - Zoom Inspect.html` |
| 36 | `unveiling-the-best-freight-forwarding-services-in-china` | `Unveiling the Best Freight Forwarding Services in China - Zoom Inspect.html` |
| 37 | `what-amazon-sellers-need-to-inspect-for` | `What Amazon-Sellers Need to Inspect For_ - Zoom Inspect.html` |
| 38 | `what-to-expect-from-solar-panel-inspections-in-quality-control` | `What to Expect From Solar Panel Inspections in Quality Control_ - Zoom Inspect.html` |

Note: rows 16 and 17 are near-duplicate topics that existed as two
separate posts on the old site — migrate both as distinct posts since
both existed live, but note the overlap to the user in case they'd
rather merge or retire one later.

- [ ] **Step 1:** Migrate posts 1–8 per the procedure above, run `npm run build && npm run check:safety`, then commit:
  ```bash
  git add -A
  git commit -m "content: migrate blog posts 1-8"
  ```

- [ ] **Step 2:** Migrate posts 9–16, run `npm run build && npm run check:safety`, then commit:
  ```bash
  git add -A
  git commit -m "content: migrate blog posts 9-16"
  ```

- [ ] **Step 3:** Migrate posts 17–24, run `npm run build && npm run check:safety`, then commit:
  ```bash
  git add -A
  git commit -m "content: migrate blog posts 17-24"
  ```

- [ ] **Step 4:** Migrate posts 25–31, run `npm run build && npm run check:safety`, then commit:
  ```bash
  git add -A
  git commit -m "content: migrate blog posts 25-31"
  ```

- [ ] **Step 5:** Migrate posts 32–38, run `npm run build && npm run check:safety`, then commit:
  ```bash
  git add -A
  git commit -m "content: migrate blog posts 32-38"
  ```

- [ ] **Step 6:** Remove the now-unneeded placeholder and verify the blog index renders all 38 posts:

```bash
rm content/blog/.gitkeep
npm run build
```
Expected: build succeeds; `app/blogs/page.tsx` lists 38 posts once rendered.

- [ ] **Step 7: Final commit for this task**

```bash
git add -A
git commit -m "content: complete blog migration (38 posts)"
```

---

### Task 23: Contact page and API route

**Files:**
- Create: `components/ContactForm.tsx`
- Create: `components/ContactForm.test.tsx`
- Create: `app/contact/page.tsx`
- Create: `app/api/contact/route.ts`
- Create: `app/api/contact/route.test.ts`
- Modify: `package.json` (add `nodemailer`)

**Interfaces:**
- Produces: `<ContactForm />`, `POST /api/contact` accepting
  `{ name: string; email: string; whatsapp: string; message: string; honeypot: string }`
  and returning `{ ok: true }` (200) or `{ ok: false, error: string }` (400/500).

- [ ] **Step 1: Install Nodemailer**

```bash
npm install nodemailer
npm install -D @types/nodemailer
```

- [ ] **Step 2: Write the failing test for the form component**

Create `components/ContactForm.test.tsx`:
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ContactForm from "./ContactForm";

describe("ContactForm", () => {
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) })
    ) as unknown as typeof fetch;
  });

  it("shows a validation error when required fields are empty", async () => {
    render(<ContactForm />);
    fireEvent.click(screen.getByRole("button", { name: /send/i }));
    expect(await screen.findByText(/full name is required/i)).toBeInTheDocument();
  });

  it("submits to /api/contact and shows a success message", async () => {
    render(<ContactForm />);
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Jane Doe" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "jane@example.com" } });
    fireEvent.change(screen.getByLabelText(/whatsapp/i), { target: { value: "+11234567890" } });
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: "I need a quote." } });

    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/contact",
        expect.objectContaining({ method: "POST" })
      );
    });
    expect(await screen.findByText(/thanks/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- ContactForm`
Expected: FAIL — `components/ContactForm.tsx` does not exist.

- [ ] **Step 4: Implement the contact form**

Create `components/ContactForm.tsx`:
```tsx
"use client";

import { useState, FormEvent } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const whatsapp = String(form.get("whatsapp") || "").trim();
    const message = String(form.get("message") || "").trim();
    const honeypot = String(form.get("company") || "");

    if (!name) {
      setError("Full name is required.");
      return;
    }
    if (!email) {
      setError("Email address is required.");
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, whatsapp, message, honeypot }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Something went wrong.");
      }
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "sent") {
    return <p className="text-brand-navy">Thanks — we&apos;ve received your message and will respond soon.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Honeypot field — hidden from real users, bots tend to fill every field */}
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" />

      <div>
        <label htmlFor="name" className="block text-sm font-medium">Full Name</label>
        <input id="name" name="name" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium">Email Address</label>
        <input id="email" name="email" type="email" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
      </div>
      <div>
        <label htmlFor="whatsapp" className="block text-sm font-medium">WhatsApp Number</label>
        <input id="whatsapp" name="whatsapp" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium">Message</label>
        <textarea id="message" name="message" rows={4} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-md bg-brand-gold px-6 py-3 font-semibold text-brand-navy disabled:opacity-50"
      >
        {status === "sending" ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- ContactForm`
Expected: PASS, both tests.

- [ ] **Step 6: Write the failing test for the API route**

Create `app/api/contact/route.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const sendMailMock = vi.fn().mockResolvedValue({ messageId: "test" });

vi.mock("nodemailer", () => ({
  default: { createTransport: () => ({ sendMail: sendMailMock }) },
}));

import { POST } from "./route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/contact", () => {
  beforeEach(() => {
    sendMailMock.mockClear();
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "user@example.com";
    process.env.SMTP_PASS = "secret";
    process.env.CONTACT_TO_EMAIL = "info@zoominspect.com";
  });

  it("rejects submissions with the honeypot filled in", async () => {
    const res = await POST(
      makeRequest({ name: "Bot", email: "bot@example.com", whatsapp: "", message: "spam", honeypot: "filled" })
    );
    expect(res.status).toBe(400);
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("rejects submissions missing required fields", async () => {
    const res = await POST(makeRequest({ name: "", email: "", whatsapp: "", message: "", honeypot: "" }));
    expect(res.status).toBe(400);
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("sends an email and returns ok for a valid submission", async () => {
    const res = await POST(
      makeRequest({
        name: "Jane Doe",
        email: "jane@example.com",
        whatsapp: "+11234567890",
        message: "I need a quote.",
        honeypot: "",
      })
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(sendMailMock).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 7: Run test to verify it fails**

Run: `npm run test -- route.test`
Expected: FAIL — `app/api/contact/route.ts` does not exist.

- [ ] **Step 8: Implement the API route**

Create `app/api/contact/route.ts`:
```typescript
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

type ContactPayload = {
  name: string;
  email: string;
  whatsapp: string;
  message: string;
  honeypot: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<ContactPayload>;
  const { name, email, whatsapp, message, honeypot } = body;

  if (honeypot) {
    return NextResponse.json({ ok: false, error: "Rejected." }, { status: 400 });
  }

  if (!name || !email) {
    return NextResponse.json(
      { ok: false, error: "Name and email are required." },
      { status: 400 }
    );
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.CONTACT_TO_EMAIL,
      replyTo: email,
      subject: `New enquiry from ${name} via zoominspect.com`,
      text: `Name: ${name}\nEmail: ${email}\nWhatsApp: ${whatsapp || "-"}\n\nMessage:\n${message || "-"}`,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to send message. Please try again later." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 9: Run test to verify it passes**

Run: `npm run test -- route.test`
Expected: PASS, all 3 tests.

- [ ] **Step 10: Write the contact page**

Create `app/contact/page.tsx`:
```tsx
import ContactForm from "@/components/ContactForm";
import { CONTACT_INFO } from "@/lib/siteData";

export const metadata = { title: "Contact Us | Zoominspect" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl">Get a Quote or Book a Service</h1>
      <p className="mt-2 text-slate-600">
        Want to know more about our solutions? Fill in the form below and
        we&apos;ll respond as soon as possible.
      </p>

      <div className="mt-8">
        <ContactForm />
      </div>

      <div className="mt-10 border-t border-slate-100 pt-6 text-sm text-slate-600">
        <p>Email us: {CONTACT_INFO.email}</p>
        <p>WhatsApp us: {CONTACT_INFO.whatsapp}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 11: Verify the full build passes**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 12: Run the content safety check**

Run: `npm run check:safety`
Expected: passes.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: add contact page with working form and SMTP-backed API route"
```

---

### Task 24: Security headers and final repo cleanup

**Files:**
- Modify: `next.config.js`
- Create: `README.md`

**Interfaces:**
- Consumes: nothing new — this is final hardening/documentation over the completed app.

- [ ] **Step 1: Add security headers**

Modify `next.config.js` to add a `headers()` function:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self' data:;",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

- [ ] **Step 2: Verify the build still passes with headers configured**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Write the README**

Create `README.md`:
```markdown
# Zoominspect

Clean rebuild of zoominspect.com (Next.js 14 + TypeScript + Tailwind CSS),
replacing the previous WordPress site after a spam-injection compromise.
See `docs/superpowers/specs/2026-09-15-zoominspect-rebuild-design.md` for
the full design rationale.

## Development

\`\`\`bash
npm install
npm run dev
\`\`\`

## Testing

\`\`\`bash
npm run test           # unit tests
npm run check:safety   # scans app/ and content/ for spam-injection patterns
npm run build           # production build (also type-checks)
\`\`\`

## Environment variables

Copy `.env.example` to `.env.local` and fill in the cPanel SMTP
credentials used by the contact form (`/api/contact`). These are never
committed — set the same variables in the Vercel project settings for
production.

## Deployment

Connected to Vercel via the `main` branch of
`github.com/abdullahshekha/zoominspect`. Push to `main` (or open a PR)
to trigger a deployment.
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add security headers and project README"
```

---

### Task 25: Final full-site verification

**Files:** none created — verification only.

- [ ] **Step 1: Full build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, all 38 blog routes plus all marketing pages listed in the route summary.

- [ ] **Step 2: Full test suite**

Run: `npm run test`
Expected: all tests pass (siteData, contentSafety, blog, Header, Footer, ContactForm, contact route).

- [ ] **Step 3: Full content safety scan**

Run: `npm run check:safety`
Expected: `Content safety check passed: no spam patterns found in app/ or content/.`
Report this exact output to the user as confirmation no malicious content was carried over from the old site.

- [ ] **Step 4: Push to GitHub**

```bash
git branch -M main
git push -u origin main
```
(If `main` already has history on the remote, coordinate with the user before force-pushing — do not force-push without asking.)

- [ ] **Step 5: Report to the user**

Summarize for the user:
- Build and test results.
- The content-safety scan result.
- The two flagged reconstructed pages (Product Consolidation, Product Photography) for their review.
- That blog post `date` values are sequential placeholders, not real original publish dates.
- Next steps: connect the GitHub repo to a Vercel project, and set the real `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `CONTACT_TO_EMAIL` environment variables in Vercel before relying on the contact form.

---

## Plan Self-Review Notes

- **Spec coverage:** Architecture (Tasks 1–8), all 9 service pages (Tasks 9–17, with two flagged reconstructions per spec), Inspection Standards (Task 18), blog MDX pipeline + all 38 posts (Tasks 19–22), contact form + SMTP (Task 23), security headers (Task 24), sanitization guard + final verification (Task 2, run throughout, verified in Task 25). All spec sections are covered.
- **Placeholder scan:** No "TBD"/"handle appropriately" steps remain; the one place content isn't pre-written verbatim (Task 22, blog migration) has a fully concrete, mechanical procedure and an exact source-file/slug table instead of vague guidance.
- **Type consistency:** `Service`, `IndustryGroup`, `BlogPost`, `CONTACT_INFO` shapes are defined once in Task 3/19 and reused with matching field names in every later task.
