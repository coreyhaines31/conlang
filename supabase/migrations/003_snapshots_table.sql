-- Version history / snapshots table
-- Stores snapshots of language definitions for version control

CREATE TABLE IF NOT EXISTS snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id UUID NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
    name TEXT,                          -- Optional snapshot name (e.g., "v1.0", "Before big changes")
    description TEXT,                   -- Optional description of what changed
    definition JSONB NOT NULL,          -- Snapshot of the language definition at this point
    lexicon_count INTEGER DEFAULT 0,    -- Number of lexicon entries at snapshot time
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup by language
CREATE INDEX idx_snapshots_language_id ON snapshots(language_id);
CREATE INDEX idx_snapshots_created_at ON snapshots(created_at DESC);

-- Enable RLS
ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;

-- Policy: Owners can CRUD their snapshots
CREATE POLICY "Owners can CRUD their snapshots"
ON snapshots
FOR ALL
TO authenticated
USING (
    (SELECT user_id FROM languages WHERE id = language_id) = auth.uid()
)
WITH CHECK (
    (SELECT user_id FROM languages WHERE id = language_id) = auth.uid()
);

-- Policy: Anyone can read snapshots of public languages (for viewing history on public pages)
CREATE POLICY "Anyone can read public language snapshots"
ON snapshots
FOR SELECT
TO anon, authenticated
USING (
    (SELECT is_public FROM languages WHERE id = language_id) = true
);

-- Community presets table
-- Stores published preset packs (phonology, phonotactics, etc.)

CREATE TABLE IF NOT EXISTS presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('phonology', 'phonotactics', 'morphology', 'full')),
    name TEXT NOT NULL,
    description TEXT,
    content JSONB NOT NULL,             -- The preset content
    tags TEXT[] DEFAULT '{}'::TEXT[],   -- Tags for searching
    downloads INTEGER DEFAULT 0,        -- Download counter
    is_official BOOLEAN DEFAULT false,  -- Official/curated presets
    is_public BOOLEAN DEFAULT true,     -- Whether visible in marketplace
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for marketplace browsing
CREATE INDEX idx_presets_type ON presets(type);
CREATE INDEX idx_presets_downloads ON presets(downloads DESC);
CREATE INDEX idx_presets_created_at ON presets(created_at DESC);
CREATE INDEX idx_presets_user_id ON presets(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_presets_updated_at BEFORE UPDATE ON presets
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE presets ENABLE ROW LEVEL SECURITY;

-- Policy: Owners can manage their own presets
CREATE POLICY "Owners can CRUD their presets"
ON presets
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy: Anyone can read public presets
CREATE POLICY "Anyone can read public presets"
ON presets
FOR SELECT
TO anon, authenticated
USING (is_public = true);

-- Community phrase packs table
-- User-submitted phrase packs

CREATE TABLE IF NOT EXISTS community_phrase_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,             -- e.g., 'fantasy', 'scifi', 'everyday', 'custom'
    phrases JSONB NOT NULL,             -- Array of phrases
    tags TEXT[] DEFAULT '{}'::TEXT[],
    downloads INTEGER DEFAULT 0,
    is_official BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_community_phrase_packs_category ON community_phrase_packs(category);
CREATE INDEX idx_community_phrase_packs_downloads ON community_phrase_packs(downloads DESC);
CREATE INDEX idx_community_phrase_packs_user_id ON community_phrase_packs(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_community_phrase_packs_updated_at BEFORE UPDATE ON community_phrase_packs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE community_phrase_packs ENABLE ROW LEVEL SECURITY;

-- Policy: Owners can manage their packs
CREATE POLICY "Owners can CRUD their phrase packs"
ON community_phrase_packs
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy: Anyone can read public packs
CREATE POLICY "Anyone can read public phrase packs"
ON community_phrase_packs
FOR SELECT
TO anon, authenticated
USING (is_public = true);

