# Database Setup Instructions

Your Supabase project is configured, but the database tables need to be created.

## Quick Setup (via Supabase Dashboard)

1. **Open your Supabase SQL Editor:**
   https://supabase.com/dashboard/project/hczklwevoipzxzzspfuz/sql/new

2. **Copy the entire SQL migration below and paste it into the editor:**

```sql
-- Create languages table
CREATE TABLE IF NOT EXISTS languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    is_public BOOLEAN NOT NULL DEFAULT false,
    definition JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_languages_user_id ON languages(user_id);
CREATE INDEX idx_languages_slug ON languages(slug);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_languages_updated_at BEFORE UPDATE ON languages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can CRUD only their own languages
CREATE POLICY "Users can CRUD their own languages"
ON languages
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy: Anyone can read public languages
CREATE POLICY "Anyone can read public languages"
ON languages
FOR SELECT
TO anon, authenticated
USING (is_public = true);
```

3. **Click the "Run" button** to execute the migration.

4. You should see a success message. Your database is now ready!

## Configure Authentication

1. **Go to Authentication Settings:**
   https://supabase.com/dashboard/project/hczklwevoipzxzzspfuz/auth/url-configuration

2. **Add the following to "Redirect URLs":**
   - For local development: `http://localhost:3000/auth/callback`
   - For production (when you deploy): `https://your-domain.com/auth/callback`

## Test Your Setup

After running the migration, you can verify it worked:

1. Go to the Table Editor: https://supabase.com/dashboard/project/hczklwevoipzxzzspfuz/editor
2. You should see the `languages` table in the list
3. The app is now ready to run!

## Next Steps

Run the app locally:
```bash
npm run dev
```

Visit http://localhost:3000 and start creating languages!