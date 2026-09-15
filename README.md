# Zoominspect

Clean rebuild of zoominspect.com (Next.js 16 + TypeScript + Tailwind CSS),
replacing the previous WordPress site after a spam-injection compromise.
See `docs/superpowers/specs/2026-09-15-zoominspect-rebuild-design.md` for
the full design rationale.

Note: the `date` frontmatter on migrated blog posts is a sequential
placeholder assigned during migration, not the real original publish date.

## Development

```bash
npm install
npm run dev
```

## Testing

```bash
npm run test           # unit tests
npm run check:safety   # scans app/ and content/ for spam-injection patterns
npm run build           # production build (also type-checks)
npm run lint            # ESLint
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in the cPanel SMTP
credentials used by the contact form (`/api/contact`). These are never
committed — set the same variables in the Vercel project settings for
production.

## Deployment

Connected to Vercel via the `main` branch of
`github.com/abdullahshekha/zoominspect`. Push to `main` (or open a PR)
to trigger a deployment.
