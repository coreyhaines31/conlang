# Conlang App

A single-page application for creating and sharing constructed languages, built with Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui, and Supabase.

## Features

- **Anonymous Usage**: Start building languages immediately without signing up
- **Local Draft Persistence**: Saves work locally in browser storage
- **Auth on Demand**: Only requires login when saving to the cloud
- **Multiple Languages**: Logged-in users can create and manage multiple languages
- **Public Sharing**: Share languages publicly via unique URLs (`/l/[slug]`)
- **Magic Link Auth**: Simple email-based authentication
- **Deterministic Generation**: Seeded RNG ensures reproducible word generation
- **Comprehensive Editor**: Tabs for Overview, Phonology, Phonotactics, Orthography, and Lexicon
- **Import/Export**: JSON import/export for backup and sharing
- **Lexicon Management**: Full CRUD for vocabulary entries

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Magic Links)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key from the API settings

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local` and add your Supabase credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set up Database

#### Using Supabase Dashboard (Recommended)

1. Go to your project's SQL Editor in the Supabase dashboard
2. Run the migrations in order:
   - Copy and run `supabase/migrations/001_languages_table.sql`
   - Copy and run `supabase/migrations/002_lexicon_entries_table.sql`

#### Using Supabase CLI (Alternative)

1. Install the Supabase CLI:
```bash
npm install -g supabase
```

2. Link to your project:
```bash
supabase link --project-ref your-project-ref
```

3. Run migrations:
```bash
supabase db push
```

### 5. Configure Auth

In your Supabase dashboard:

1. Go to Authentication > URL Configuration
2. Add `http://localhost:3000/auth/callback` to the Redirect URLs
3. For production, add your domain's callback URL

## Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

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
| definition | JSONB | Language configuration (phonology, phonotactics, orthography) |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### Lexicon Entries Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| language_id | UUID | References languages.id |
| gloss | TEXT | English meaning/gloss |
| part_of_speech | TEXT | Part of speech (optional) |
| phonemic_form | TEXT | Phonemic representation (optional) |
| orthographic_form | TEXT | Written form (optional) |
| tags | TEXT[] | Array of tags |
| notes | TEXT | Additional notes (optional) |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### RLS Policies

**Languages:**
- Authenticated users can CRUD only their own languages
- Anyone can read public languages (`is_public = true`)

**Lexicon Entries:**
- Authenticated users can CRUD entries for their own languages
- Anyone can read entries for public languages

## Project Structure

```
conlang/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Main editor page
│   │   ├── actions.ts        # Server actions (CRUD operations)
│   │   ├── l/[slug]/         # Public language routes
│   │   └── auth/callback/    # Auth callback handler
│   ├── components/
│   │   ├── LanguageEditor.tsx  # Main editor component
│   │   ├── tabs/
│   │   │   ├── OverviewTab.tsx
│   │   │   ├── PhonologyTab.tsx
│   │   │   ├── PhonotacticsTab.tsx
│   │   │   ├── OrthographyTab.tsx
│   │   │   └── LexiconTab.tsx
│   │   ├── auth/
│   │   │   └── AuthModal.tsx
│   │   └── ui/               # shadcn/ui components
│   └── lib/
│       ├── generator.ts      # Word generation logic (seeded RNG)
│       └── supabase/
│           ├── client.ts     # Browser client
│           ├── server.ts     # Server client
│           └── types.ts       # TypeScript types
├── supabase/
│   └── migrations/
│       ├── 001_languages_table.sql
│       └── 002_lexicon_entries_table.sql
└── middleware.ts             # Auth session refresh
```

## Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

These can be found in your Supabase project settings under API.

## Deterministic Word Generation

The app uses a **seeded Linear Congruential Generator (LCG)** for deterministic word generation. This ensures that:

- **Same seed + same definition = same generated words**
- Generation is reproducible across sessions
- Useful for testing, sharing, and version control

### How It Works

1. Each language has a `seed` (bigint) and `generator_version` (text)
2. The generator uses phonology (consonants/vowels), phonotactics (syllable templates, forbidden sequences), and orthography mappings
3. Words are generated syllable by syllable using the templates
4. Forbidden sequences are checked and regenerated if found
5. Orthography mappings convert phonemic forms to written forms

### Example

```typescript
// Same seed + same definition always produces the same words
generateWords(12345, 20, definition) // Always: ["kata", "pito", "muna", ...]
generateWords(12345, 20, definition) // Same result
generateWords(67890, 20, definition) // Different words (different seed)
```

## Development Notes

- The app uses Next.js App Router with Server Components
- Server Actions handle database writes
- Middleware refreshes auth sessions
- Local storage persists anonymous drafts
- Magic link authentication (no passwords)
- Word generation is deterministic using seeded RNG
- Import/Export uses JSON format including definition, seed, generator_version, and lexicon

## Deployment

1. Deploy to Vercel/Netlify/your platform
2. Add environment variables to your deployment
3. Update Supabase auth redirect URLs
4. Run migrations on production database

## License

MIT