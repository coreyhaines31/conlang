# Conlang

**Build constructed languages with instant feedback.**

A modern web app for creating, testing, and sharing conlangs (constructed languages). Define sounds, build vocabulary, generate words deterministically, and see your language come to life.

**[Live Demo →](https://conlang.app)**

---

## Why Conlang?

Creating a constructed language is complex. You need to define phonology, build vocabulary, ensure consistency, and test how it sounds. Conlang makes this process **interactive and immediate**:

- **Start instantly** — No signup required. Your work saves locally.
- **Generate words** — Seeded randomization means reproducible results.
- **Test phrases** — See how your language handles real sentences.
- **Share publicly** — Get a unique URL to share your creation.

---

## Features

### Sound System
- **Phonology** — Define consonants and vowels with presets (Elvish, Harsh, Japanese-like, etc.)
- **Phonotactics** — Weighted syllable templates (CV, CVC, CVCC) and forbidden sequences
- **Orthography** — Map phonemes to written forms with digraph support
- **Phonological Rules** — Context-sensitive sound changes

### Vocabulary
- **Word Generator** — Generate words matching your sound rules
- **Lexicon** — Full vocabulary management with search, tags, and notes
- **Name Generator** — Create person names, place names, and faction names
- **Sample Phrases** — Test with phrase packs (Everyday, Fantasy, Sci-Fi)

### Writing & Style
- **Custom Scripts** — Draw glyphs or use AI to clean up sketches
- **Style Controls** — Preferred/avoided sounds, common endings
- **Script Preview** — See text rendered in your custom writing system

### Grammar
- **Morphology** — Prefixes, suffixes, infixes, and circumfixes
- **Syntax** — Word order (SVO/SOV/etc.), adjective position, adpositions
- **Text Generator** — Transform structured glosses into conlang sentences

### Collaboration
- **Public Sharing** — Share languages via unique URLs
- **Version History** — Snapshot and restore previous versions
- **Preset Marketplace** — Share and download community presets
- **Community Phrases** — User-contributed phrase packs

---

## Quick Start

### Try it Online

Visit **[conlang.app](https://conlang.app)** — no installation needed.

### Run Locally

```bash
# Clone the repo
git clone https://github.com/coreyhaines31/conlang.git
cd conlang

# Install dependencies
npm install

# Set up environment (see Configuration below)
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3001](http://localhost:3001)

---

## Configuration

### Environment Variables

Copy `.env.example` to `.env.local` and fill it in:

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Postgres connection string ([Neon](https://neon.tech) works well) |
| `BETTER_AUTH_SECRET` | Yes | Session signing secret (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Yes | App URL, `http://localhost:3001` locally |
| `RESEND_API_KEY` | Yes | Sends magic-link sign-in emails via [Resend](https://resend.com) |
| `SUPPORT_EMAIL` | Yes | Inbox for the in-app support form |
| `CRON_SECRET` | No | Protects `/api/cron/keep-alive` |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Client error reporting |
| `OPENAI_API_KEY` | No | AI glyph generation |
| `AI_GATEWAY_API_KEY` | No | AI steps in the e2e tests |

Signed-out visitors keep languages as local drafts in the browser, so you can explore most of the editor before setting up email.

### Database Setup

The schema lives in `src/lib/db/schema.ts` (Drizzle). Push it to an empty database:

```bash
export DATABASE_URL=postgres://...
npx drizzle-kit push
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui + Lucide Icons |
| Database | Neon Postgres + Drizzle ORM |
| Auth | Better Auth (magic links via Resend) |
| AI | OpenAI (optional, glyph generation) |
| Testing | Vitest, [e2e](https://tester.army/e2e) |
| Hosting | Vercel |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Main editor
│   ├── actions.ts               # Server actions (DB operations)
│   ├── api/auth/[...all]/       # Better Auth handler
│   ├── api/glyph/route.ts       # AI glyph generation
│   └── l/[slug]/page.tsx        # Public language view
├── components/
│   ├── LanguageEditor.tsx       # Main editor shell
│   ├── EditorNavigation.tsx     # Sidebar navigation
│   ├── GlyphCanvas.tsx          # Drawing canvas for glyphs
│   ├── tabs/                    # Feature tabs
│   │   ├── OverviewTab.tsx      # Word generation
│   │   ├── PhonologyTab.tsx     # Consonants/vowels
│   │   ├── PhonotacticsTab.tsx  # Syllable structure
│   │   ├── OrthographyTab.tsx   # Spelling rules
│   │   ├── LexiconTab.tsx       # Vocabulary
│   │   ├── ScriptTab.tsx        # Custom writing system
│   │   ├── MorphologyTab.tsx    # Grammar
│   │   └── ...
│   └── ui/                      # shadcn/ui components
└── lib/
    ├── generator.ts             # Seeded word generation
    ├── morphology.ts            # Affix system
    ├── script.ts                # Writing system utilities
    ├── textGenerator.ts         # Gloss → conlang
    ├── auth.ts                  # Better Auth config
    └── db/                      # Drizzle client & schema
tests/                           # e2e browser tests
```

---

## Database Schema

### languages
Core language definitions with JSON configuration.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Owner |
| name | TEXT | Language name |
| slug | TEXT | URL-safe identifier |
| is_public | BOOLEAN | Visibility |
| seed | BIGINT | RNG seed for determinism |
| definition | JSONB | Full configuration |

### lexicon_entries
Vocabulary items linked to languages.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| language_id | UUID | Parent language |
| gloss | TEXT | English meaning |
| phonemic_form | TEXT | /phonemic/ |
| orthographic_form | TEXT | Written form |
| part_of_speech | TEXT | Noun, verb, etc. |
| tags | TEXT[] | Categories |

### snapshots
Version history for languages.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| language_id | UUID | Parent language |
| name | TEXT | Version name |
| definition | JSONB | Frozen state |

---

## Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/coreyhaines31/conlang)

1. Import repo to Vercel
2. Add environment variables
3. Deploy

### Custom Domain

Add DNS records:
```
A     @    76.76.21.21
CNAME www  cname.vercel-dns.com
```

Set `BETTER_AUTH_URL` to your domain.

---

## Development

### Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run test     # Run tests
npm run lint     # Lint code
```

### Testing

```bash
npm run test           # Unit tests (Vitest)
npm run test:coverage  # With coverage report
npm run test:e2e       # Browser tests in tests/*.e2e.ts
```

The e2e tests start the dev server if it isn't running. Their AI steps need `AI_GATEWAY_API_KEY`; they also run in CI on every pull request.

---

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## License

[FSL-1.1-MIT](LICENSE) © 2026 Corey Haines

You can use, modify, and self-host Conlang for anything except offering a competing hosted product. Each release becomes MIT two years after it's published. See [fsl.software](https://fsl.software) for details.

---

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Lucide](https://lucide.dev/) for icons
- [Neon](https://neon.tech/) and [Better Auth](https://www.better-auth.com/) for the backend
- The conlang community for inspiration
