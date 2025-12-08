'use client'

import { useState, useEffect } from 'react'
import { CommunityPhrasePack } from '@/lib/supabase/types'
import { 
  getCommunityPhrasePacks, 
  createCommunityPhrasePack, 
  deleteCommunityPhrasePack,
  getMyCommunityPhrasePacks 
} from '@/app/actions'
import { PHRASE_PACKS } from '@/lib/phrases'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface CommunityPhrasesTabProps {
  isAuthenticated: boolean
  onSelectPack?: (phrases: Array<{ id: string; english: string; gloss: string[]; category: string }>) => void
}

export function CommunityPhrasesTab({ 
  isAuthenticated,
  onSelectPack 
}: CommunityPhrasesTabProps) {
  const [communityPacks, setCommunityPacks] = useState<CommunityPhrasePack[]>([])
  const [myPacks, setMyPacks] = useState<CommunityPhrasePack[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'browse' | 'my-packs'>('browse')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  
  // Create new pack state
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newPackName, setNewPackName] = useState('')
  const [newPackDescription, setNewPackDescription] = useState('')
  const [newPackCategory, setNewPackCategory] = useState('custom')
  const [newPackPhrases, setNewPackPhrases] = useState('')
  const [newPackTags, setNewPackTags] = useState('')

  useEffect(() => {
    loadCommunityPacks()
    if (isAuthenticated) {
      loadMyPacks()
    }
  }, [isAuthenticated])

  const loadCommunityPacks = async () => {
    setIsLoading(true)
    try {
      const data = await getCommunityPhrasePacks()
      setCommunityPacks(data)
    } catch (error) {
      console.error('Failed to load community phrase packs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMyPacks = async () => {
    try {
      const data = await getMyCommunityPhrasePacks()
      setMyPacks(data)
    } catch (error) {
      console.error('Failed to load my phrase packs:', error)
    }
  }

  const handleCreate = async () => {
    if (!newPackName.trim()) {
      alert('Please enter a name for your phrase pack')
      return
    }

    // Parse phrases from text input (one phrase per line)
    // Format: "English phrase" = gloss1, gloss2, gloss3
    const lines = newPackPhrases.split('\n').filter(line => line.trim())
    const phrases = lines.map((line, i) => {
      const match = line.match(/^"([^"]+)"\s*=\s*(.+)$/)
      if (match) {
        return {
          id: `custom-${Date.now()}-${i}`,
          english: match[1],
          gloss: match[2].split(',').map(g => g.trim()),
          category: newPackCategory,
        }
      }
      // Simple format: just the phrase
      return {
        id: `custom-${Date.now()}-${i}`,
        english: line.trim(),
        gloss: line.trim().toLowerCase().split(/\s+/),
        category: newPackCategory,
      }
    })

    if (phrases.length === 0) {
      alert('Please add at least one phrase')
      return
    }

    try {
      await createCommunityPhrasePack(
        newPackName.trim(),
        newPackDescription.trim(),
        newPackCategory,
        phrases,
        newPackTags.split(',').map(t => t.trim()).filter(Boolean)
      )
      
      setShowCreateDialog(false)
      setNewPackName('')
      setNewPackDescription('')
      setNewPackCategory('custom')
      setNewPackPhrases('')
      setNewPackTags('')
      await loadMyPacks()
    } catch (error) {
      console.error('Failed to create phrase pack:', error)
      alert('Failed to create phrase pack. Please try again.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this phrase pack? This cannot be undone.')) return
    
    try {
      await deleteCommunityPhrasePack(id)
      setMyPacks(prev => prev.filter(p => p.id !== id))
    } catch (error) {
      console.error('Failed to delete phrase pack:', error)
    }
  }

  const handleSelectPack = (pack: CommunityPhrasePack) => {
    if (onSelectPack) {
      onSelectPack(pack.phrases as any[])
    }
  }

  const filteredPacks = filterCategory === 'all'
    ? communityPacks
    : communityPacks.filter(p => p.category === filterCategory)

  const categories = ['all', 'everyday', 'fantasy', 'scifi', 'custom', ...new Set(communityPacks.map(p => p.category))]
    .filter((v, i, a) => a.indexOf(v) === i)

  return (
    <div className="space-y-6">
      {/* Tab Selection */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'browse' ? 'default' : 'outline'}
          onClick={() => setActiveTab('browse')}
        >
          Browse Community Packs
        </Button>
        {isAuthenticated && (
          <Button
            variant={activeTab === 'my-packs' ? 'default' : 'outline'}
            onClick={() => setActiveTab('my-packs')}
          >
            My Phrase Packs ({myPacks.length})
          </Button>
        )}
      </div>

      {activeTab === 'browse' && (
        <>
          {/* Built-in Packs */}
          <Card>
            <CardHeader>
              <CardTitle>Built-in Phrase Packs</CardTitle>
              <CardDescription>
                Default phrase packs included with the app
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {PHRASE_PACKS.map(pack => (
                  <div
                    key={pack.id}
                    className="border rounded-lg p-4 hover:bg-secondary/30 transition-colors"
                  >
                    <h3 className="font-semibold">{pack.name}</h3>
                    <p className="text-sm text-muted-foreground">{pack.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {pack.phrases.length} phrases
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Filter */}
          <Card>
            <CardHeader>
              <CardTitle>Community Phrase Packs</CardTitle>
              <CardDescription>
                Browse phrase packs created by the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map(cat => (
                  <Button
                    key={cat}
                    variant={filterCategory === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterCategory(cat)}
                  >
                    {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Button>
                ))}
              </div>

              {isLoading ? (
                <p className="text-muted-foreground">Loading phrase packs...</p>
              ) : filteredPacks.length === 0 ? (
                <p className="text-muted-foreground">
                  No community phrase packs found. Be the first to create one!
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredPacks.map(pack => (
                    <div
                      key={pack.id}
                      className="border rounded-lg p-4 hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{pack.name}</h3>
                            <span className="text-xs px-2 py-0.5 rounded bg-secondary">
                              {pack.category}
                            </span>
                            {pack.is_official && (
                              <span className="text-xs px-2 py-0.5 rounded bg-primary text-primary-foreground">
                                Official
                              </span>
                            )}
                          </div>
                          {pack.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {pack.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">
                              {(pack.phrases as any[]).length} phrases • {pack.downloads} downloads
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleSelectPack(pack)}
                        >
                          Use
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'my-packs' && isAuthenticated && (
        <>
          {/* Create Button */}
          <Card>
            <CardHeader>
              <CardTitle>My Phrase Packs</CardTitle>
              <CardDescription>
                Create and share your own phrase packs with the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>+ Create New Phrase Pack</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create a Phrase Pack</DialogTitle>
                    <DialogDescription>
                      Share your phrase collections with the community
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    <div>
                      <Label htmlFor="packName">Name</Label>
                      <Input
                        id="packName"
                        placeholder="e.g., Medieval Greetings, Space Opera Commands"
                        value={newPackName}
                        onChange={(e) => setNewPackName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="packDesc">Description</Label>
                      <Textarea
                        id="packDesc"
                        placeholder="Describe what makes this phrase pack unique..."
                        value={newPackDescription}
                        onChange={(e) => setNewPackDescription(e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="packCategory">Category</Label>
                      <select
                        id="packCategory"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={newPackCategory}
                        onChange={(e) => setNewPackCategory(e.target.value)}
                      >
                        <option value="everyday">Everyday</option>
                        <option value="fantasy">Fantasy</option>
                        <option value="scifi">Sci-Fi</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="packPhrases">Phrases</Label>
                      <Textarea
                        id="packPhrases"
                        placeholder={`Enter one phrase per line. Format options:
"Hello there" = hello, there
"The king is wise" = the, king, be, wise

Or simple format (auto-glosses):
Hello there
The king is wise`}
                        value={newPackPhrases}
                        onChange={(e) => setNewPackPhrases(e.target.value)}
                        rows={10}
                        className="font-mono text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="packTags">Tags (comma-separated)</Label>
                      <Input
                        id="packTags"
                        placeholder="medieval, formal, greetings"
                        value={newPackTags}
                        onChange={(e) => setNewPackTags(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleCreate} className="w-full">
                      Create Phrase Pack
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* My Packs List */}
          <Card>
            <CardContent className="pt-6">
              {myPacks.length === 0 ? (
                <p className="text-muted-foreground">
                  You haven&apos;t created any phrase packs yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {myPacks.map(pack => (
                    <div
                      key={pack.id}
                      className="flex items-center justify-between p-4 border rounded-md"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{pack.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-secondary">
                            {pack.category}
                          </span>
                        </div>
                        {pack.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {pack.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {(pack.phrases as any[]).length} phrases • {pack.downloads} downloads • {pack.is_public ? 'Public' : 'Private'}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(pack.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

