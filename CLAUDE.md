# Conlang - Claude Code Context

## Quick Start

```bash
npm install
npm run dev
```

Development server runs at **http://localhost:3001**

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Neon Postgres + Drizzle ORM (`@neondatabase/serverless`, `drizzle-orm`)
- Better Auth (magic-link via Resend)
- OpenAI (optional, for AI glyph generation)
- Sentry (error tracking, tunnelled at `/monitoring`)

## Key Files

- `src/app/page.tsx` - Main editor page
- `src/app/actions.ts` - Server actions for database operations (auth/ownership enforced here)
- `src/app/l/[slug]/page.tsx` - Public language share page
- `src/app/api/glyph/route.ts` - AI glyph generation endpoint
- `src/app/api/cron/keep-alive/route.ts` - Neon keep-alive cron
- `src/components/LanguageEditor.tsx` - Main editor component
- `src/lib/auth.ts` - Better Auth server config
- `src/lib/db/schema.ts` - Drizzle schema
- `src/lib/generator.ts` - Seeded word generation logic
- `src/lib/sanitize-svg.ts` - SVG sanitizer (call this anywhere user SVG meets `dangerouslySetInnerHTML`)

## Environment Variables

Required in `.env.local`:

```env
DATABASE_URL=postgres://...neon.tech/...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3001
RESEND_API_KEY=re_...
SUPPORT_EMAIL=...          # inbox for the support form
CRON_SECRET=...            # for /api/cron/keep-alive
NEXT_PUBLIC_SENTRY_DSN=... # optional, enables client error reporting
OPENAI_API_KEY=sk-...      # optional, enables AI glyph generation
AI_GATEWAY_API_KEY=...     # e2e agent steps (Vercel AI Gateway)
```

## Testing

```bash
npm run test        # Run tests in watch mode
npm run test:run    # Run tests once
npm run test:coverage  # Run with coverage
npm run test:e2e    # Browser tests in tests/*.e2e.ts (starts the dev server if needed)
```

E2E tests use [e2e](https://e2e.tester.army/docs) (`e2e.config.ts`). Agent steps call Vercel AI Gateway; `npx e2e guide` prints the skill.

## Database

Uses Neon Postgres with Drizzle ORM. Schema is in `src/lib/db/schema.ts`. Drizzle config in `drizzle.config.ts`.

## Auth

Magic-link authentication via Better Auth. The handler is mounted at `/api/auth/[...all]` and emails are sent through Resend from `noreply@mail.conlang.app`.

## Security

See `SECURITY_AUDIT.md` for the most recent audit. Key rules:

- Always sanitize user-supplied SVG with `sanitizeGlyphSvg` from `src/lib/sanitize-svg.ts` before rendering or persisting.
- Server actions enforce ownership — preserve the `requireUser()` + ownership check pattern when adding new actions.
- The CSP and security headers are set in `next.config.ts`; if you add a new third-party origin, update the policy.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
