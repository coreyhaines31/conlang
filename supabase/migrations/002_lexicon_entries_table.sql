-- Create lexicon_entries table
CREATE TABLE IF NOT EXISTS lexicon_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    gloss TEXT NOT NULL,
    part_of_speech TEXT,
    phonemic_form TEXT,
    orthographic_form TEXT,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_lexicon_entries_language_id ON lexicon_entries(language_id);
CREATE INDEX idx_lexicon_entries_gloss ON lexicon_entries(gloss);
CREATE INDEX idx_lexicon_entries_tags ON lexicon_entries USING GIN(tags);

-- Create updated_at trigger
CREATE TRIGGER update_lexicon_entries_updated_at BEFORE UPDATE ON lexicon_entries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE lexicon_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can CRUD entries for their own languages
CREATE POLICY "Users can CRUD entries for their own languages"
ON lexicon_entries
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM languages
        WHERE languages.id = lexicon_entries.language_id
        AND languages.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM languages
        WHERE languages.id = lexicon_entries.language_id
        AND languages.user_id = auth.uid()
    )
);

-- Policy: Anyone can read entries for public languages
CREATE POLICY "Anyone can read entries for public languages"
ON lexicon_entries
FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM languages
        WHERE languages.id = lexicon_entries.language_id
        AND languages.is_public = true
    )
);

