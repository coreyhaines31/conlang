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

Open [http://localhost:3000](http://localhost:3000)

---

## Configuration

### Environment Variables

Create `.env.local`:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Site URL (for auth redirects)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# OpenAI (optional, for AI glyph cleanup)
OPENAI_API_KEY=sk-your-key
```

### Database Setup

1. Create a [Supabase](https://supabase.com) project
2. Run migrations in the SQL Editor:

```sql
-- Run in order:
-- 1. supabase/migrations/001_languages_table.sql
-- 2. supabase/migrations/002_lexicon_entries_table.sql
-- 3. supabase/migrations/003_snapshots_table.sql
```

3. Enable Email auth in Authentication → Providers

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui + Lucide Icons |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Magic Links) |
| AI | OpenAI GPT-4o (optional) |
| Hosting | Vercel |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Main editor
│   ├── actions.ts               # Server actions (DB operations)
│   ├── api/glyph/route.ts       # AI glyph generation
│   ├── l/[slug]/page.tsx        # Public language view
│   └── auth/callback/           # Auth handler
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
    └── supabase/                # DB client & types
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

Update Supabase redirect URLs:
```
https://yourdomain.com/auth/callback
```

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
npm run test           # Run all tests
npm run test:coverage  # With coverage report
```

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

MIT © 2024

---

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Lucide](https://lucide.dev/) for icons
- [Supabase](https://supabase.com/) for backend infrastructure
- The conlang community for inspiration
