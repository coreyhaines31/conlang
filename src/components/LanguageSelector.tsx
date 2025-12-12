'use client'

import { Language } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Plus, Globe, Lock, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

const MAX_LANGUAGES = 10

interface LanguageSelectorProps {
  currentLanguage: Partial<Language> | null
  savedLanguages: Language[]
  localDrafts: Partial<Language>[]
  onSelectLanguage: (lang: Partial<Language>) => void
  onNewLanguage: () => void
  onMobileClose?: () => void
}

export function LanguageSelector({
  currentLanguage,
  savedLanguages,
  localDrafts,
  onSelectLanguage,
  onNewLanguage,
  onMobileClose,
}: LanguageSelectorProps) {
  const totalLanguages = savedLanguages.length + localDrafts.length
  const canCreateNew = totalLanguages < MAX_LANGUAGES
  
  // Check if current language has a name (is "real")
  const hasCurrentLanguage = currentLanguage?.name && currentLanguage.name.trim() !== ''
  
  // All available languages (saved + local drafts with names)
  const allLanguages = [
    ...savedLanguages,
    ...localDrafts.filter(d => d.name && d.name.trim() !== '' && !savedLanguages.some(s => s.id === d.id))
  ]

  // If no languages exist at all, show simple New Language button
  if (allLanguages.length === 0 && !hasCurrentLanguage) {
    return (
      <Button 
        onClick={() => { onNewLanguage(); onMobileClose?.(); }} 
        className="w-full" 
        size="sm"
      >
        <Plus className="h-4 w-4 mr-2" />
        New Language
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between" size="sm">
          <span className="flex items-center gap-2 truncate">
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {hasCurrentLanguage ? currentLanguage.name : 'Select Language'}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        {/* Saved Languages */}
        {savedLanguages.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Saved Languages
            </div>
            {savedLanguages.map(lang => (
              <DropdownMenuItem
                key={lang.id}
                onClick={() => { onSelectLanguage(lang); onMobileClose?.(); }}
                className={cn(
                  'cursor-pointer',
                  currentLanguage?.id === lang.id && 'bg-accent'
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="truncate">{lang.name}</span>
                  {lang.is_public ? (
                    <Globe className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}

        {/* Local Drafts */}
        {localDrafts.filter(d => d.name && d.name.trim() !== '').length > 0 && (
          <>
            {savedLanguages.length > 0 && <DropdownMenuSeparator />}
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Local Drafts
            </div>
            {localDrafts
              .filter(d => d.name && d.name.trim() !== '')
              .map((draft, index) => (
                <DropdownMenuItem
                  key={`draft-${index}`}
                  onClick={() => { onSelectLanguage(draft); onMobileClose?.(); }}
                  className={cn(
                    'cursor-pointer',
                    !currentLanguage?.id && currentLanguage?.name === draft.name && 'bg-accent'
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="truncate">{draft.name}</span>
                    <span className="text-xs text-muted-foreground">Draft</span>
                  </div>
                </DropdownMenuItem>
              ))}
          </>
        )}

        {/* New Language Option */}
        {(savedLanguages.length > 0 || localDrafts.some(d => d.name)) && <DropdownMenuSeparator />}
        <DropdownMenuItem
          onClick={() => { onNewLanguage(); onMobileClose?.(); }}
          disabled={!canCreateNew}
          className="cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Language
          {!canCreateNew && (
            <span className="ml-auto text-xs text-muted-foreground">Max {MAX_LANGUAGES}</span>
          )}
        </DropdownMenuItem>
        
        {/* Language count */}
        <div className="px-2 py-1.5 text-xs text-muted-foreground text-center border-t mt-1">
          {totalLanguages} / {MAX_LANGUAGES} languages
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

