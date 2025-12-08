# Roadmap for conlang.app

## Guiding Principles

- **Instant gratification first**: User sees believable output in minutes.
- **Progressive depth**: Advanced rules appear only when needed.
- **Offline-first**: Drafts always work without an account.
- **Deterministic**: "Generate" never feels random-chaotic once a user likes a vibe.

---

## Phase 0 — Foundation (Week 1) ✅

### User Stories
- [x] As a user, I can open conlang.app and immediately start building a language.
- [x] As a user, my progress is saved automatically even if I refresh.
- [x] As a user, I can export what I've made so I don't feel trapped.

### Features
- [x] SPA home (`/`) with a Local Draft
- [x] Autosave to local storage + "Reset draft"
- [x] Simple language editor shell with tabs (even if some are placeholders)
- [x] Import/export JSON (draft-level)
- [x] Basic "Generate 20 words" preview (even if simplistic at first)

---

## Phase 1 — MVP Language Builder (Weeks 2–4) 🚧

### User Stories
- [x] As a user, I can define the sounds of my language (consonants/vowels).
- [x] As a user, I can control what "words" look like (syllable shapes, constraints).
- [x] As a user, I can define how it's written (romanization mapping).
- [ ] As a user, I can generate a starter lexicon and keep/edit the words I like.

### Features

#### Phonology
- [x] Consonant list + vowel list editors
- [ ] Presets (airy/harsh/alien/etc.) that populate inventories

#### Phonotactics
- [x] Syllable template editor
- [ ] Weighted syllable templates
- [x] Forbidden sequences
- [ ] "Test generate" preview panel (improved)

#### Orthography
- [x] Phoneme → grapheme map (supports digraphs)
- [ ] Preview line that shows phonemic + orthographic side-by-side

#### Word + Lexicon
- [x] Deterministic word generation (seeded)
- [x] Lexicon table (CRUD, search, tags, POS)
- [ ] "Generate X words" with customizable count
- [ ] "Add selected to lexicon" flow

---

## Phase 2 — Accounts only for saving (Weeks 4–6) ✅

### User Stories
- [x] As a user, I don't need an account to play.
- [x] As a user, when I'm ready, I can save my draft to a free account.
- [x] As a user, I can create multiple languages and switch between them.
- [x] As a user, I can share a public view link of a language.

### Features
- [x] Auth modal triggered only by "Save to account"
- [x] "My Languages" list (logged-in)
- [x] Save, delete language
- [x] Duplicate language
- [x] Public/private toggle
- [x] Public read-only page: `/l/[slug]`
- [x] "Copy this language to my account" from public page

---

## Phase 3 — Sample Phrases (the "writer hook") (Weeks 6–8) ✅

### User Stories
- [x] As a writer, I can see what my language looks like in real sentences fast.
- [x] As a user, I can render sample phrases even if my lexicon is incomplete.
- [x] As a user, I can fill missing words automatically and choose what to keep.

### Features
- [x] Sample Phrases tab with phrase packs:
  - Everyday (20 phrases)
  - Fantasy dialogue (20 phrases)
  - Sci-fi ops (20 phrases)
- [x] Renderer (not called translation):
  - Substitutes from lexicon
  - Generates placeholders for missing words (highlighted in amber)
- [x] "Add missing words to lexicon" with selection UI
- [x] Output toggles: orthographic / phonemic / both

---

## Phase 4 — Make it feel real (Weeks 8–10)

### User Stories
- [ ] As a user, I can shape the "sound" beyond basic randomness.
- [ ] As a user, my language has consistent flavor (patterns, harmony, constraints).
- [ ] As a user, I can generate proper names/place names with a style.

### Features
- [ ] Phonological rules (simple find/replace with context)
- [ ] Style controls for generation:
  - Preferred phonemes
  - Avoid phonemes
  - Common endings/beginnings
  - Syllable length distribution
- [ ] Generators: people names, place names, faction names
- [ ] "Favorites" and "lock word" behavior in previews

---

## Phase 5 — Writing system v1 (Weeks 10–12)

### User Stories
- [ ] As a user, I can create a custom script and assign it to my sounds.
- [ ] As a writer, I can generate text that looks like signage/manuscripts.

### Features
- [ ] Custom script mode:
  - Upload SVG glyphs
  - Assign glyphs to phonemes or graphemes
  - Inline rendering preview
- [ ] Script export pack (zip or JSON bundle)
- [ ] Public page shows script samples

> Note: AI glyph generation can be a separate add-on later — don't block core script support on AI.

---

## Phase 6 — Morphology + grammar "light" (Weeks 12–16)

### User Stories
- [ ] As a user, I can define basic word-building rules (plural, tense, possession).
- [ ] As a writer, phrase output starts looking grammatical, not just swapped words.

### Features
- [ ] Morphology basics:
  - Prefixes/suffixes with meaning
  - Compounding rules
- [ ] Syntax toggles that affect phrase rendering:
  - Word order (SVO/SOV/etc.)
  - Adjective position
  - Adpositions (pre/post)
- [ ] Phrase templates that support roles (S/V/O) and simple transformations

---

## Phase 7 — Collaboration + ecosystem (Weeks 16–20)

### User Stories
- [ ] As a user, I can share languages with friends and iterate.
- [ ] As a user, I can remix someone's public language into my own.
- [ ] As a user, I can publish language "kits" (packs/presets).

### Features
- [ ] Share link with "Duplicate" flow
- [ ] Version history (lightweight: snapshots)
- [ ] Preset marketplace (curated or community)
- [ ] Community phrase packs

---

## Phase 8 — "Translation" (Later)

### User Stories
- [ ] As a writer, I can type intent and get conlang text that follows my rules.

### Feature Direction (choose one)
- **Safe path**: "Text generator" where user provides structured gloss and constraints
- **Hard path**: Real translation (requires deep grammar + lexicon coverage + parsing)

---

## Current Status

**Phase 0**: ✅ Complete  
**Phase 1**: ✅ Complete  
**Phase 2**: ✅ Complete  
**Phase 3**: ✅ Complete  
**Phase 4-8**: ⏳ Not started

