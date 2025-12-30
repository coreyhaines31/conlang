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
- Supabase (PostgreSQL + Auth)
- OpenAI (optional, for AI glyph generation)

## Key Files

- `src/app/page.tsx` - Main editor page
- `src/app/actions.ts` - Server actions for database operations
- `src/components/LanguageEditor.tsx` - Main editor component
- `src/lib/generator.ts` - Seeded word generation logic

## Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3001
OPENAI_API_KEY=sk-your-key  # Optional
```

## Testing

```bash
npm run test        # Run tests in watch mode
npm run test:run    # Run tests once
npm run test:coverage  # Run with coverage
```

## Database

Uses Supabase. Migrations are in `supabase/migrations/`. See `scripts/setup-database.md` for setup instructions.

## Auth

Magic link authentication via Supabase. Callback handler at `/auth/callback`.

For local development, add `http://localhost:3001/auth/callback` to Supabase redirect URLs.
