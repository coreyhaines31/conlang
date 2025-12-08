# Conlang App

A single-page application for creating and sharing constructed languages, built with Next.js 15, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Anonymous Usage**: Start building languages immediately without signing up
- **Local Draft Persistence**: Saves work locally in browser storage
- **Auth on Demand**: Only requires login when saving to the cloud
- **Multiple Languages**: Logged-in users can create and manage multiple languages
- **Public Sharing**: Share languages publicly via unique URLs
- **Magic Link Auth**: Simple email-based authentication

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

#### Using Supabase CLI (Recommended)

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

#### Using Supabase Dashboard

1. Go to your project's SQL Editor
2. Copy the contents of `supabase/migrations/001_languages_table.sql`
3. Run the SQL in the editor

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
| definition | JSONB | Language configuration and lexicon |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### RLS Policies

- **Authenticated users**: Can CRUD only their own languages
- **Anyone**: Can read public languages

## Project Structure

```
conlang/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Main editor page
│   │   ├── actions.ts        # Server actions
│   │   ├── l/[slug]/         # Public language routes
│   │   └── auth/callback/    # Auth callback handler
│   ├── components/
│   │   ├── LanguageEditor.tsx
│   │   └── auth/
│   │       └── AuthModal.tsx
│   └── lib/
│       └── supabase/
│           ├── client.ts     # Browser client
│           ├── server.ts     # Server client
│           └── types.ts      # TypeScript types
├── supabase/
│   └── migrations/           # Database migrations
└── middleware.ts             # Auth session refresh
```

## Development Notes

- The app uses Next.js App Router with Server Components
- Server Actions handle database writes
- Middleware refreshes auth sessions
- Local storage persists anonymous drafts
- Magic link authentication (no passwords)

## Deployment

1. Deploy to Vercel/Netlify/your platform
2. Add environment variables to your deployment
3. Update Supabase auth redirect URLs
4. Run migrations on production database

## License

MIT