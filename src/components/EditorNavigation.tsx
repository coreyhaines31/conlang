'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  ChevronDown,
  ChevronRight,
  Home,
  Volume2,
  BookOpen,
  PenTool,
  GitBranch,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

interface NavItem {
  id: string
  label: string
}

interface NavCategory {
  id: string
  label: string
  icon: LucideIcon
  items: NavItem[]
  defaultOpen?: boolean
}

const NAV_CATEGORIES: NavCategory[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: Home,
    items: [{ id: 'overview', label: 'Overview' }],
    defaultOpen: true,
  },
  {
    id: 'sounds',
    label: 'Sound System',
    icon: Volume2,
    items: [
      { id: 'phonology', label: 'Phonology' },
      { id: 'phonotactics', label: 'Phonotactics' },
      { id: 'orthography', label: 'Orthography' },
    ],
  },
  {
    id: 'vocabulary',
    label: 'Vocabulary',
    icon: BookOpen,
    items: [
      { id: 'lexicon', label: 'Lexicon' },
      { id: 'names', label: 'Names' },
      { id: 'phrases', label: 'Phrases' },
    ],
  },
  {
    id: 'writing',
    label: 'Writing & Style',
    icon: PenTool,
    items: [
      { id: 'script', label: 'Script' },
      { id: 'style', label: 'Style' },
    ],
  },
  {
    id: 'grammar',
    label: 'Grammar',
    icon: GitBranch,
    items: [{ id: 'grammar', label: 'Morphology & Syntax' }],
  },
  {
    id: 'tools',
    label: 'Tools',
    icon: Wrench,
    items: [
      { id: 'generator', label: 'Text Generator' },
      { id: 'history', label: 'Version History' },
      { id: 'presets', label: 'Presets' },
      { id: 'community', label: 'Community' },
    ],
  },
]

interface EditorNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function EditorNavigation({ activeTab, onTabChange }: EditorNavigationProps) {
  const [openCategories, setOpenCategories] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    for (const cat of NAV_CATEGORIES) {
      if (cat.defaultOpen || cat.items.some(item => item.id === activeTab)) {
        initial.add(cat.id)
      }
    }
    return initial
  })

  const toggleCategory = (categoryId: string) => {
    setOpenCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  const handleItemClick = (itemId: string, categoryId: string) => {
    onTabChange(itemId)
    setOpenCategories(prev => new Set([...prev, categoryId]))
  }

  return (
    <nav className="space-y-1">
      {NAV_CATEGORIES.map(category => {
        const isOpen = openCategories.has(category.id)
        const hasActiveItem = category.items.some(item => item.id === activeTab)
        const isSingleItem = category.items.length === 1
        const Icon = category.icon

        if (isSingleItem) {
          const item = category.items[0]
          return (
            <Button
              key={category.id}
              variant={activeTab === item.id ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start gap-2 h-9',
                activeTab === item.id && 'bg-secondary font-medium'
              )}
              onClick={() => onTabChange(item.id)}
            >
              <Icon className="h-4 w-4" />
              <span>{category.label}</span>
            </Button>
          )
        }

        return (
          <div key={category.id} className="space-y-0.5">
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-between h-9 px-2',
                hasActiveItem && 'text-foreground font-medium'
              )}
              onClick={() => toggleCategory(category.id)}
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>{category.label}</span>
              </span>
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>

            {isOpen && (
              <div className="ml-6 space-y-0.5">
                {category.items.map(item => (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start h-8 text-sm',
                      activeTab === item.id && 'bg-secondary font-medium'
                    )}
                    onClick={() => handleItemClick(item.id, category.id)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}
