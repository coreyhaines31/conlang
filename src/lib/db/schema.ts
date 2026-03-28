import {
  pgTable,
  text,
  boolean,
  integer,
  jsonb,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core'

// ─── Enums ───────────────────────────────────────────────────────────────────

export const presetTypeEnum = pgEnum('preset_type', [
  'phonology',
  'phonotactics',
  'morphology',
  'full',
])

// ─── Better Auth tables ───────────────────────────────────────────────────────

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
})

// ─── App tables ───────────────────────────────────────────────────────────────

export const languages = pgTable('languages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  isPublic: boolean('is_public').notNull().default(false),
  seed: integer('seed').notNull().default(0),
  generatorVersion: text('generator_version').notNull().default('1'),
  definition: jsonb('definition').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const lexiconEntries = pgTable('lexicon_entries', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  languageId: text('language_id')
    .notNull()
    .references(() => languages.id, { onDelete: 'cascade' }),
  gloss: text('gloss').notNull(),
  partOfSpeech: text('part_of_speech'),
  phonemicForm: text('phonemic_form'),
  orthographicForm: text('orthographic_form'),
  tags: text('tags').array().notNull().default([]),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const snapshots = pgTable('snapshots', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  languageId: text('language_id')
    .notNull()
    .references(() => languages.id, { onDelete: 'cascade' }),
  name: text('name'),
  description: text('description'),
  definition: jsonb('definition').notNull(),
  lexiconCount: integer('lexicon_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const presets = pgTable('presets', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  type: presetTypeEnum('type').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  content: jsonb('content').notNull(),
  tags: text('tags').array().notNull().default([]),
  downloads: integer('downloads').notNull().default(0),
  isOfficial: boolean('is_official').notNull().default(false),
  isPublic: boolean('is_public').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const communityPhrasePacks = pgTable('community_phrase_packs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  phrases: jsonb('phrases').notNull(),
  tags: text('tags').array().notNull().default([]),
  downloads: integer('downloads').notNull().default(0),
  isOfficial: boolean('is_official').notNull().default(false),
  isPublic: boolean('is_public').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Inferred types ───────────────────────────────────────────────────────────

export type Language = typeof languages.$inferSelect
export type LanguageInsert = typeof languages.$inferInsert

export type LexiconEntry = typeof lexiconEntries.$inferSelect
export type LexiconEntryInsert = typeof lexiconEntries.$inferInsert

export type Snapshot = typeof snapshots.$inferSelect
export type SnapshotInsert = typeof snapshots.$inferInsert

export type Preset = typeof presets.$inferSelect
export type PresetInsert = typeof presets.$inferInsert

export type CommunityPhrasePack = typeof communityPhrasePacks.$inferSelect
export type CommunityPhrasePackInsert = typeof communityPhrasePacks.$inferInsert
