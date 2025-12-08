'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { Language } from '@/lib/supabase/types'
import { AuthModal } from './auth/AuthModal'
import { createClient } from '@/lib/supabase/client'
import { saveLanguage, updateLanguage, createSlug } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface LanguageEditorProps {
  initialLanguages: Language[]
  user: User | null
}

const EMPTY_LANGUAGE = {
  name: '',
  definition: {},
}

export function LanguageEditor({ initialLanguages, user }: LanguageEditorProps) {
  const [languages, setLanguages] = useState(initialLanguages)
  const [currentLanguage, setCurrentLanguage] = useState<Partial<Language> | null>(null)
  const [localDraft, setLocalDraft] = useState(EMPTY_LANGUAGE)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  // Load draft from localStorage on mount
  useEffect(() => {
    const draft = localStorage.getItem('languageDraft')
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        setLocalDraft(parsed)
        if (!user && !currentLanguage) {
          setCurrentLanguage(parsed)
        }
      } catch (e) {
        console.error('Failed to parse draft', e)
      }
    }
  }, [])

  // Save to localStorage when draft changes
  useEffect(() => {
    if (!user && currentLanguage && !currentLanguage.id) {
      localStorage.setItem('languageDraft', JSON.stringify(currentLanguage))
    }
  }, [currentLanguage, user])

  const handleNewLanguage = () => {
    setCurrentLanguage(EMPTY_LANGUAGE)
  }

  const handleSelectLanguage = (lang: Language) => {
    setCurrentLanguage(lang)
  }

  const handleSave = async () => {
    if (!currentLanguage?.name) return

    // If not logged in, show auth modal
    if (!user) {
      setShowAuthModal(true)
      return
    }

    setSaving(true)
    try {
      if (currentLanguage.id) {
        // Update existing
        const updated = await updateLanguage(
          currentLanguage.id,
          currentLanguage.name,
          currentLanguage.definition || {},
          currentLanguage.is_public || false
        )
        if (updated) {
          setLanguages(prev => prev.map(l => l.id === updated.id ? updated : l))
          setCurrentLanguage(updated)
        }
      } else {
        // Create new
        const slug = await createSlug(currentLanguage.name)
        const created = await saveLanguage(
          currentLanguage.name,
          slug,
          currentLanguage.definition || {},
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
    }
    setSaving(false)
  }

  const handleAuthSuccess = async () => {
    // After auth, save the draft
    setShowAuthModal(false)
    window.location.reload() // Reload to get user session
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  const handleTogglePublic = async () => {
    if (!currentLanguage?.id || !user) return

    const updated = await updateLanguage(
      currentLanguage.id,
      currentLanguage.name,
      currentLanguage.definition || {},
      !currentLanguage.is_public
    )
    if (updated) {
      setLanguages(prev => prev.map(l => l.id === updated.id ? updated : l))
      setCurrentLanguage(updated)
    }
  }

  const generateWords = () => {
    // Placeholder word generation
    const syllables = ['ka', 'la', 'mi', 'no', 'pe', 'ri', 'su', 'ta', 'vo', 'ze']
    const words = []
    for (let i = 0; i < 10; i++) {
      const syllableCount = Math.floor(Math.random() * 3) + 1
      let word = ''
      for (let j = 0; j < syllableCount; j++) {
        word += syllables[Math.floor(Math.random() * syllables.length)]
      }
      words.push(word)
    }

    setCurrentLanguage(prev => ({
      ...prev,
      definition: {
        ...prev?.definition,
        sampleWords: words
      }
    }))
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card p-4 flex flex-col">
        <div className="mb-4">
          <Button
            onClick={handleNewLanguage}
            className="w-full"
          >
            New Language
          </Button>
        </div>

        {user && (
          <div className="flex-1 overflow-y-auto">
            <h3 className="font-semibold mb-2 text-sm">My Languages</h3>
            <div className="space-y-1">
              {languages.map(lang => (
                <Button
                  key={lang.id}
                  onClick={() => handleSelectLanguage(lang)}
                  variant={currentLanguage?.id === lang.id ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start h-auto py-2",
                    currentLanguage?.id === lang.id && "bg-secondary"
                  )}
                >
                  <div className="flex flex-col items-start w-full">
                    <div className="font-medium">{lang.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {lang.is_public ? 'Public' : 'Private'}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={saving || !currentLanguage?.name}
            className="w-full"
            variant="default"
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>

          {user && currentLanguage?.id && (
            <Button
              onClick={handleTogglePublic}
              className="w-full"
              variant="outline"
            >
              {currentLanguage.is_public ? 'Make Private' : 'Make Public'}
            </Button>
          )}

          {user ? (
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full text-sm"
            >
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
      <div className="flex-1 overflow-y-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Language Editor</h1>

        {currentLanguage ? (
          <Card>
            <CardHeader>
              <CardTitle>Language Details</CardTitle>
              <CardDescription>Edit your constructed language</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Language Name</label>
                <Input
                  type="text"
                  value={currentLanguage.name || ''}
                  onChange={(e) => setCurrentLanguage(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter language name"
                />
              </div>

              {currentLanguage.slug && (
                <div className="text-sm text-muted-foreground">
                  {currentLanguage.is_public && typeof window !== 'undefined' && (
                    <span>Public URL: {window.location.origin}/l/{currentLanguage.slug}</span>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Definition (JSON)</label>
                <Textarea
                  value={JSON.stringify(currentLanguage.definition || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value)
                      setCurrentLanguage(prev => ({ ...prev, definition: parsed }))
                    } catch {
                      // Invalid JSON, just update the text
                    }
                  }}
                  className="h-96 font-mono text-sm"
                  placeholder="{}"
                />
              </div>

              <Button
                onClick={generateWords}
                variant="outline"
              >
                Generate Words
              </Button>
            </CardContent>
          </Card>
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