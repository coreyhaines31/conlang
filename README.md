# Conlang App

A single-page application for creating and sharing constructed languages, built with Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui, and Supabase.

**Live at: [conlang.app](https://conlang.app)**

## Features

### Core Features
- **Anonymous Usage**: Start building languages immediately without signing up
- **Local Draft Persistence**: Saves work locally in browser storage
- **Auth on Demand**: Only requires login when saving to the cloud
- **Multiple Languages**: Logged-in users can create and manage multiple languages
- **Public Sharing**: Share languages publicly via unique URLs (`/l/[slug]`)
- **Deterministic Generation**: Seeded RNG ensures reproducible word generation

### Language Building
- **Phonology**: Define consonants and vowels with presets (airy, harsh, alien, etc.)
- **Phonotactics**: Weighted syllable templates and forbidden sequences
- **Orthography**: Phoneme-to-grapheme mapping with digraph support
- **Phonological Rules**: Find/replace rules with context
- **Morphology**: Affixes, syntax configuration (SVO/SOV/etc.)
- **Writing System**: Custom scripts with SVG glyph support

### Tools
- **Word Generator**: Generate words with style controls
- **Name Generator**: People, places, and faction names
- **Sample Phrases**: Phrase packs for testing (Everyday, Fantasy, Sci-Fi)
- **Text Generator**: Structured gloss-to-conlang translation
- **Lexicon**: Full CRUD vocabulary management

### Collaboration
- **Version History**: Snapshots for reverting changes
- **Preset Marketplace**: Share phonology, morphology, and full language presets
- **Community Phrase Packs**: User-contributed phrase collections

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Magic Links)
- **Deployment**: Vercel

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key from the API settings

### 3. Configure Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Set up Database

Run the migrations in your Supabase SQL Editor:

1. `supabase/migrations/001_languages_table.sql`
2. `supabase/migrations/002_lexicon_entries_table.sql`
3. `supabase/migrations/003_snapshots_table.sql`

### 5. Configure Auth

In Supabase Dashboard → Authentication → URL Configuration:

1. Add `http://localhost:3000/auth/callback` to Redirect URLs
2. Enable Email provider (for Magic Links)

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment to Vercel

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/coreyhaines31/conlang)

### Manual Deployment

#### 1. Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Vercel auto-detects Next.js

#### 2. Configure Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key` | All |
| `NEXT_PUBLIC_SITE_URL` | `https://conlang.app` | Production |
| `NEXT_PUBLIC_SITE_URL` | `https://your-preview.vercel.app` | Preview |

#### 3. Configure Custom Domain

1. Go to Project Settings → Domains
2. Add `conlang.app`
3. Configure DNS at your registrar:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

#### 4. Update Supabase Auth URLs

In Supabase Dashboard → Authentication → URL Configuration:

Add these to Redirect URLs:
```
https://conlang.app/auth/callback
https://www.conlang.app/auth/callback
https://*.vercel.app/auth/callback  (for previews)
```

#### 5. Run Production Migrations

Run these in your Supabase SQL Editor:
1. `001_languages_table.sql`
2. `002_lexicon_entries_table.sql`
3. `003_snapshots_table.sql`

### Build Commands

Vercel uses these automatically:
- **Build**: `npm run build`
- **Output**: `.next`
- **Install**: `npm install`

---

## Database Schema

### Languages Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References auth.users |
| name | TEXT | Language name |
| slug | TEXT | Unique URL slug |
| is_public | BOOLEAN | Public visibility |
| seed | BIGINT | Random seed for deterministic generation |
| generator_version | TEXT | Version of generator algorithm |
| definition | JSONB | Full language configuration |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### Lexicon Entries Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| language_id | UUID | References languages.id |
| gloss | TEXT | English meaning |
| part_of_speech | TEXT | Part of speech |
| phonemic_form | TEXT | Phonemic representation |
| orthographic_form | TEXT | Written form |
| tags | TEXT[] | Array of tags |
| notes | TEXT | Additional notes |

### Snapshots Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| language_id | UUID | References languages.id |
| name | TEXT | Snapshot name |
| description | TEXT | What changed |
| definition | JSONB | Snapshot of definition |
| lexicon_count | INTEGER | Word count at snapshot |

### Presets Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Creator |
| type | TEXT | phonology/phonotactics/morphology/full |
| name | TEXT | Preset name |
| content | JSONB | Preset content |
| downloads | INTEGER | Download count |

---

## Project Structure

```
conlang/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main editor
│   │   ├── actions.ts            # Server actions
│   │   ├── l/[slug]/page.tsx     # Public language view
│   │   └── auth/callback/        # Auth handler
│   ├── components/
│   │   ├── LanguageEditor.tsx    # Main editor
│   │   ├── tabs/                 # All tab components
│   │   │   ├── OverviewTab.tsx
│   │   │   ├── PhonologyTab.tsx
│   │   │   ├── PhonotacticsTab.tsx
│   │   │   ├── OrthographyTab.tsx
│   │   │   ├── LexiconTab.tsx
│   │   │   ├── SamplePhrasesTab.tsx
│   │   │   ├── StyleTab.tsx
│   │   │   ├── NamesTab.tsx
│   │   │   ├── ScriptTab.tsx
│   │   │   ├── MorphologyTab.tsx
│   │   │   ├── VersionHistoryTab.tsx
│   │   │   ├── CommunityPhrasesTab.tsx
│   │   │   └── TextGeneratorTab.tsx
│   │   ├── PresetBrowser.tsx
│   │   ├── ShareDialog.tsx
│   │   └── ui/                   # shadcn/ui
│   └── lib/
│       ├── generator.ts          # Word generation (seeded RNG)
│       ├── morphology.ts         # Affix/syntax system
│       ├── textGenerator.ts      # Gloss-to-conlang
│       ├── phrases.ts            # Phrase packs
│       ├── presets.ts            # Phonology presets
│       ├── script.ts             # Writing system
│       └── supabase/
├── supabase/migrations/          # SQL migrations
├── vercel.json                   # Vercel config
└── next.config.ts                # Next.js config
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `NEXT_PUBLIC_SITE_URL` | No | Site URL for OAuth redirects |

---

## Troubleshooting

### Build Fails
- Ensure all environment variables are set in Vercel
- Check that Supabase URL doesn't have trailing slash

### Auth Not Working
- Verify redirect URLs in Supabase match your domain
- Check browser console for CORS errors
- Ensure `NEXT_PUBLIC_SITE_URL` matches your domain

### Database Errors
- Run all migrations in order
- Check RLS policies are enabled
- Verify anon key has correct permissions

---

## License

MIT
