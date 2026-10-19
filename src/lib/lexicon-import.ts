export type ImportedLexiconEntry = {
  gloss: string
  partOfSpeech: string | null
  phonemicForm: string | null
  orthographicForm: string | null
  tags: string[]
  notes: string | null
}

const MAX_ENTRIES = 5000

const optionalString = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value : null

// Exported files are user-editable JSON, so keep only well-formed entries.
export function parseImportedLexicon(value: unknown): ImportedLexiconEntry[] {
  if (!Array.isArray(value)) return []

  return value
    .filter(
      (entry): entry is Record<string, unknown> =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof entry.gloss === 'string' &&
        entry.gloss.trim() !== ''
    )
    .slice(0, MAX_ENTRIES)
    .map((entry) => ({
      gloss: entry.gloss as string,
      partOfSpeech: optionalString(entry.partOfSpeech),
      phonemicForm: optionalString(entry.phonemicForm),
      orthographicForm: optionalString(entry.orthographicForm),
      tags: Array.isArray(entry.tags)
        ? entry.tags.filter((tag): tag is string => typeof tag === 'string')
        : [],
      notes: optionalString(entry.notes),
    }))
}
