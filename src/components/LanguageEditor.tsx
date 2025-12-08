'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { Language, LexiconEntry } from '@/lib/supabase/types'
import { AuthModal } from './auth/AuthModal'
import { createClient } from '@/lib/supabase/client'
import {
  saveLanguage,
  updateLanguage,
  deleteLanguage,
  duplicateLanguage,
  createSlug,
  getLexiconEntries,
} from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EditorNavigation } from './EditorNavigation'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Globe, Lock, Copy, Trash2 } from 'lucide-react'
import { generateWords, LanguageDefinition } from '@/lib/generator'
import { OverviewTab } from './tabs/OverviewTab'
import { PhonologyTab } from './tabs/PhonologyTab'
import { PhonotacticsTab } from './tabs/PhonotacticsTab'
import { OrthographyTab } from './tabs/OrthographyTab'
import { LexiconTab } from './tabs/LexiconTab'
import { SamplePhrasesTab } from './tabs/SamplePhrasesTab'
import { StyleTab } from './tabs/StyleTab'
import { NamesTab } from './tabs/NamesTab'
import { ScriptTab } from './tabs/ScriptTab'
import { MorphologyTab } from './tabs/MorphologyTab'
import { VersionHistoryTab } from './tabs/VersionHistoryTab'
import { PresetBrowser } from './PresetBrowser'
import { ShareDialog } from './ShareDialog'
import { CommunityPhrasesTab } from './tabs/CommunityPhrasesTab'
import { TextGeneratorTab } from './tabs/TextGeneratorTab'
import { Preset } from '@/lib/supabase/types'

interface LanguageEditorProps {
  initialLanguages: Language[]
  user: User | null
}

const EMPTY_LANGUAGE: Partial<Language> = {
  name: '',
  seed: Math.floor(Math.random() * 2147483647),
  generator_version: '1.0.0',
  definition: {
    phonology: {
      consonants: ['p', 't', 'k', 'b', 'd', 'g', 'm', 'n', 's', 'l', 'r'],
      vowels: ['a', 'e', 'i', 'o', 'u'],
    },
    phonotactics: {
      syllableTemplates: ['CV', 'CVC'],
      forbiddenSequences: [],
    },
    orthography: {
      mappings: {},
    },
  },
}

export function LanguageEditor({ initialLanguages, user }: LanguageEditorProps) {
  const [languages, setLanguages] = useState(initialLanguages)
  const [currentLanguage, setCurrentLanguage] = useState<Partial<Language> | null>(null)
  const [lexiconEntries, setLexiconEntries] = useState<LexiconEntry[]>([])
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const supabase = createClient()

  // Load draft from localStorage on mount, or create new language
  useEffect(() => {
    const draft = localStorage.getItem('languageDraft')
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        setCurrentLanguage(parsed)
        return
      } catch (e) {
        console.error('Failed to parse draft', e)
      }
    }
    
    // If user has saved languages, select the first one
    if (initialLanguages.length > 0) {
      setCurrentLanguage(initialLanguages[0])
      return
    }
    
    // Otherwise, start with a fresh new language (no empty state)
    setCurrentLanguage({ ...EMPTY_LANGUAGE, seed: Math.floor(Math.random() * 2147483647) })
  }, [])

  // Save to localStorage when draft changes (logged out only)
  useEffect(() => {
    if (!user && currentLanguage && !currentLanguage.id) {
      localStorage.setItem('languageDraft', JSON.stringify(currentLanguage))
    }
  }, [currentLanguage, user])

  // Load lexicon entries when language changes
  useEffect(() => {
    if (currentLanguage?.id && user) {
      getLexiconEntries(currentLanguage.id).then(setLexiconEntries).catch(console.error)
    } else {
      setLexiconEntries([])
    }
  }, [currentLanguage?.id, user])

  const handleNewLanguage = () => {
    setCurrentLanguage({ ...EMPTY_LANGUAGE, seed: Math.floor(Math.random() * 2147483647) })
    setActiveTab('overview')
  }

  const handleSelectLanguage = async (lang: Language) => {
    setCurrentLanguage(lang)
    setActiveTab('overview')
    if (user) {
      const entries = await getLexiconEntries(lang.id)
      setLexiconEntries(entries)
    }
  }

  const handleSaveToLocal = () => {
    if (!currentLanguage?.name) return
    localStorage.setItem('languageDraft', JSON.stringify(currentLanguage))
    alert('Saved to local storage!')
  }

  const handleSaveToAccount = async () => {
    if (!currentLanguage?.name) return

    // If not logged in, show auth modal
    if (!user) {
      setShowAuthModal(true)
      return
    }

    setSaving(true)
    try {
      const definition = currentLanguage.definition as LanguageDefinition
      const seed = currentLanguage.seed || Math.floor(Math.random() * 2147483647)
      const generatorVersion = currentLanguage.generator_version || '1.0.0'

      if (currentLanguage.id) {
        // Update existing
        const updated = await updateLanguage(
          currentLanguage.id,
          currentLanguage.name,
          definition,
          seed,
          generatorVersion,
          currentLanguage.is_public || false
        )
        if (updated) {
          setLanguages(prev => prev.map(l => (l.id === updated.id ? updated : l)))
          setCurrentLanguage(updated)
        }
      } else {
        // Create new
        const slug = await createSlug(currentLanguage.name)
        const created = await saveLanguage(
          currentLanguage.name,
          slug,
          definition,
          seed,
          generatorVersion,
          false
        )
        if (created) {
          setLanguages(prev => [created, ...prev])
          setCurrentLanguage(created)
          localStorage.removeItem('languageDraft')
        }
      }
    } catch (error) {
      console.error('Save failed:', error)
      alert('Failed to save: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
    setSaving(false)
  }

  const handleAuthSuccess = async () => {
    setShowAuthModal(false)
    // After auth, try to save again
    await handleSaveToAccount()
    window.location.reload() // Reload to get user session
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  const handleTogglePublic = async () => {
    if (!currentLanguage?.id || !user) return

    const definition = currentLanguage.definition as LanguageDefinition
    const seed = currentLanguage.seed || Math.floor(Math.random() * 2147483647)
    const generatorVersion = currentLanguage.generator_version || '1.0.0'

    const updated = await updateLanguage(
      currentLanguage.id!,
      currentLanguage.name || '',
      definition,
      seed,
      generatorVersion,
      !currentLanguage.is_public
    )
    if (updated) {
      setLanguages(prev => prev.map(l => (l.id === updated.id ? updated : l)))
      setCurrentLanguage(updated)
    }
  }

  const handleDelete = async () => {
    if (!currentLanguage?.id || !user) return
    if (!confirm('Are you sure you want to delete this language?')) return

    try {
      await deleteLanguage(currentLanguage.id)
      setLanguages(prev => prev.filter(l => l.id !== currentLanguage.id))
      setCurrentLanguage(null)
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Failed to delete language')
    }
  }

  const handleDuplicate = async () => {
    if (!currentLanguage?.id || !user) return

    setSaving(true)
    try {
      const duplicated = await duplicateLanguage(currentLanguage.id)
      if (duplicated) {
        setLanguages(prev => [duplicated, ...prev])
        setCurrentLanguage(duplicated)
      }
    } catch (error) {
      console.error('Duplicate failed:', error)
      alert('Failed to duplicate language')
    }
    setSaving(false)
  }

  const handleExport = () => {
    if (!currentLanguage) return

    const exportData = {
      name: currentLanguage.name,
      seed: currentLanguage.seed,
      generator_version: currentLanguage.generator_version,
      definition: currentLanguage.definition,
      lexicon: lexiconEntries,
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentLanguage.name || 'language'}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const data = JSON.parse(text)

        if (user) {
          // Import as new language
          const imported: Partial<Language> = {
            name: `${data.name} (Imported)`,
            seed: data.seed || Math.floor(Math.random() * 2147483647),
            generator_version: data.generator_version || '1.0.0',
            definition: data.definition,
          }
          setCurrentLanguage(imported)
          setActiveTab('overview')
        } else {
          // Import as local draft
          const imported: Partial<Language> = {
            name: data.name,
            seed: data.seed || Math.floor(Math.random() * 2147483647),
            generator_version: data.generator_version || '1.0.0',
            definition: data.definition,
          }
          setCurrentLanguage(imported)
          setActiveTab('overview')
        }
      } catch (error) {
        console.error('Import failed:', error)
        alert('Failed to import: Invalid JSON file')
      }
    }
    input.click()
  }

  const updateDefinition = (updates: Partial<LanguageDefinition>) => {
    setCurrentLanguage(prev => ({
      ...prev,
      definition: {
        ...(prev?.definition as LanguageDefinition),
        ...updates,
      } as any,
    }))
  }

  const handleAddToLexicon = async (entries: Array<{ gloss: string; phonemic: string; orthographic: string }>) => {
    if (!currentLanguage?.id || !user) {
      // For local draft, just show an alert
      alert('Save your language first to add entries to the lexicon.')
      return
    }

    try {
      const { createLexiconEntry } = await import('@/app/actions')
      const newEntries: LexiconEntry[] = []
      
      for (const entry of entries) {
        const created = await createLexiconEntry(
          currentLanguage.id,
          entry.gloss,
          undefined, // part of speech
          entry.phonemic,
          entry.orthographic
        )
        if (created) {
          newEntries.push(created)
        }
      }
      
      setLexiconEntries(prev => [...prev, ...newEntries])
    } catch (error) {
      console.error('Failed to add entries to lexicon:', error)
      alert('Failed to add some entries to the lexicon.')
    }
  }

  const handleApplyPreset = (preset: Preset) => {
    if (!currentLanguage) return

    const content = preset.content as any
    
    switch (preset.type) {
      case 'phonology':
        updateDefinition({ phonology: content })
        break
      case 'phonotactics':
        updateDefinition({ phonotactics: content })
        break
      case 'morphology':
        updateDefinition({ morphology: content })
        break
      case 'full':
        // Apply all parts of the preset
        setCurrentLanguage(prev => ({
          ...prev,
          definition: {
            ...(prev?.definition as LanguageDefinition),
            ...content,
          },
        }))
        break
    }
    
    setActiveTab('overview')
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Single Left Sidebar */}
      <div className="w-64 border-r bg-card flex flex-col">
        {/* Header */}
        <div className="p-3 border-b space-y-2">
          <Button onClick={handleNewLanguage} className="w-full" size="sm">
            + New Language
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-3">
          <EditorNavigation activeTab={activeTab} onTabChange={setActiveTab} />

          {/* My Languages */}
          {user && languages.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="font-semibold mb-2 text-xs text-muted-foreground uppercase tracking-wide px-2">
                My Languages
              </h3>
              <div className="space-y-1">
                {languages.map(lang => (
                  <Button
                    key={lang.id}
                    onClick={() => handleSelectLanguage(lang)}
                    variant={currentLanguage?.id === lang.id ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn(
                      'w-full justify-start h-auto py-1.5 px-2',
                      currentLanguage?.id === lang.id && 'bg-secondary'
                    )}
                  >
                    <div className="flex flex-col items-start w-full">
                      <div className="font-medium text-sm truncate w-full">{lang.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      {lang.is_public ? <><Globe className="h-3 w-3" /> Public</> : <><Lock className="h-3 w-3" /> Private</>}
                    </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t space-y-2 bg-muted/30">
          <div className="flex gap-1">
            <Button onClick={handleImport} variant="outline" className="flex-1 text-xs" size="sm">
              Import
            </Button>
            <Button
              onClick={handleExport}
              variant="outline"
              className="flex-1 text-xs"
              size="sm"
              disabled={!currentLanguage}
            >
              Export
            </Button>
          </div>

          <div className="flex gap-1">
            <Button
              onClick={handleSaveToLocal}
              disabled={!currentLanguage?.name}
              className="flex-1"
              variant="outline"
              size="sm"
            >
              Local
            </Button>
            <Button
              onClick={handleSaveToAccount}
              disabled={saving || !currentLanguage?.name}
              className="flex-1"
              variant="default"
              size="sm"
            >
              {saving ? '...' : 'Save'}
            </Button>
          </div>

          {user && currentLanguage?.id && (
            <div className="flex gap-1">
              <Button onClick={handleTogglePublic} className="flex-1" variant="outline" size="sm" title={currentLanguage.is_public ? 'Make Private' : 'Make Public'}>
                {currentLanguage.is_public ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
              </Button>
              <ShareDialog
                languageSlug={currentLanguage.slug || null}
                languageName={currentLanguage.name || 'My Language'}
                isPublic={currentLanguage.is_public || false}
                onTogglePublic={handleTogglePublic}
              />
              <Button onClick={handleDuplicate} disabled={saving} variant="outline" size="sm" title="Duplicate">
                <Copy className="h-4 w-4" />
              </Button>
              <Button onClick={handleDelete} variant="outline" size="sm" className="text-destructive" title="Delete">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}

          {user ? (
            <Button onClick={handleLogout} variant="ghost" className="w-full text-xs" size="sm">
              Logout
            </Button>
          ) : (
            <div className="text-xs text-muted-foreground text-center">
              Save to create account
            </div>
          )}
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 overflow-y-auto p-6">
        {currentLanguage ? (
          <div className="space-y-4 max-w-5xl">
            <div>
              <Input
                type="text"
                value={currentLanguage.name || ''}
                onChange={(e) =>
                  setCurrentLanguage(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder="Language Name"
                className="text-2xl font-bold border-none shadow-none px-0 h-auto"
              />
              {currentLanguage.slug && currentLanguage.is_public && typeof window !== 'undefined' && (
                <div className="text-sm text-muted-foreground mt-1">
                  <a
                    href={`/l/${currentLanguage.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {window.location.origin}/l/{currentLanguage.slug}
                  </a>
                </div>
              )}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <OverviewTab
                language={currentLanguage}
                onUpdate={setCurrentLanguage}
                onAddToLexicon={
                  user && currentLanguage.id
                    ? async (words) => {
                        const newEntries = words.map((w, i) => ({
                          id: `temp-${Date.now()}-${i}`,
                          language_id: currentLanguage.id!,
                          gloss: '',
                          part_of_speech: null,
                          phonemic_form: w.phonemic,
                          orthographic_form: w.orthographic,
                          tags: [],
                          notes: null,
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                        }))
                        setLexiconEntries(prev => [...prev, ...newEntries])
                        setActiveTab('lexicon')
                      }
                    : undefined
                }
              />
            )}

            {activeTab === 'phonology' && (
              <PhonologyTab
                definition={(currentLanguage.definition || {}) as LanguageDefinition}
                onUpdate={updateDefinition}
              />
            )}

            {activeTab === 'phonotactics' && (
              <PhonotacticsTab
                definition={(currentLanguage.definition || {}) as LanguageDefinition}
                onUpdate={updateDefinition}
              />
            )}

            {activeTab === 'orthography' && (
              <OrthographyTab
                definition={(currentLanguage.definition || {}) as LanguageDefinition}
                onUpdate={updateDefinition}
              />
            )}

            {activeTab === 'lexicon' && (
              <LexiconTab
                languageId={currentLanguage.id}
                entries={lexiconEntries}
                onEntriesChange={setLexiconEntries}
                user={user}
              />
            )}

            {activeTab === 'phrases' && (
              <SamplePhrasesTab
                definition={(currentLanguage.definition || {}) as LanguageDefinition}
                lexiconEntries={lexiconEntries}
                seed={currentLanguage.seed || 0}
                onAddToLexicon={(entries) => {
                  const newEntries = entries.map((e, i) => ({
                    id: `temp-phrase-${Date.now()}-${i}`,
                    language_id: currentLanguage.id || '',
                    gloss: e.gloss,
                    part_of_speech: null,
                    phonemic_form: e.phonemic,
                    orthographic_form: e.orthographic,
                    tags: [],
                    notes: 'Added from Sample Phrases',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  }))
                  setLexiconEntries(prev => [...prev, ...newEntries])
                  setActiveTab('lexicon')
                }}
              />
            )}

            {activeTab === 'style' && (
              <StyleTab
                definition={(currentLanguage.definition || {}) as LanguageDefinition}
                onUpdate={updateDefinition}
                seed={currentLanguage.seed || 0}
              />
            )}

            {activeTab === 'names' && (
              <NamesTab
                definition={(currentLanguage.definition || {}) as LanguageDefinition}
                onUpdate={updateDefinition}
                seed={currentLanguage.seed || 0}
                onAddToLexicon={(entries) => {
                  const newEntries = entries.map((e, i) => ({
                    id: `temp-name-${Date.now()}-${i}`,
                    language_id: currentLanguage.id || '',
                    gloss: e.gloss,
                    part_of_speech: 'proper noun',
                    phonemic_form: e.phonemic,
                    orthographic_form: e.orthographic,
                    tags: ['name'],
                    notes: 'Generated name',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  }))
                  setLexiconEntries(prev => [...prev, ...newEntries])
                  setActiveTab('lexicon')
                }}
              />
            )}

            {activeTab === 'script' && (
              <ScriptTab
                definition={(currentLanguage.definition || {}) as LanguageDefinition}
                onUpdate={updateDefinition}
              />
            )}

            {activeTab === 'grammar' && (
              <MorphologyTab
                definition={(currentLanguage.definition || {}) as LanguageDefinition}
                onUpdate={updateDefinition}
              />
            )}

            {activeTab === 'history' && (
              <VersionHistoryTab
                languageId={currentLanguage.id || null}
                isAuthenticated={!!user}
                onRestore={() => window.location.reload()}
              />
            )}

            {activeTab === 'presets' && (
              <PresetBrowser
                definition={(currentLanguage.definition || {}) as LanguageDefinition}
                isAuthenticated={!!user}
                onApplyPreset={handleApplyPreset}
              />
            )}

            {activeTab === 'community' && (
              <CommunityPhrasesTab
                isAuthenticated={!!user}
              />
            )}

            {activeTab === 'generator' && (
              <TextGeneratorTab
                definition={(currentLanguage.definition || {}) as LanguageDefinition}
                lexiconEntries={lexiconEntries}
                seed={currentLanguage.seed || 12345}
                onAddToLexicon={handleAddToLexicon}
              />
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                Select a language or create a new one to start editing
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  )
}
