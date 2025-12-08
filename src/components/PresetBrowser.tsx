'use client'

import { useState, useEffect } from 'react'
import { Preset } from '@/lib/supabase/types'
import { getPresets, createPreset, deletePreset, getMyPresets } from '@/app/actions'
import { LanguageDefinition } from '@/lib/generator'
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

interface PresetBrowserProps {
  definition: LanguageDefinition
  onApplyPreset: (preset: Preset) => void
  isAuthenticated: boolean
}

type PresetType = 'phonology' | 'phonotactics' | 'morphology' | 'full'

export function PresetBrowser({ 
  definition, 
  onApplyPreset,
  isAuthenticated 
}: PresetBrowserProps) {
  const [presets, setPresets] = useState<Preset[]>([])
  const [myPresets, setMyPresets] = useState<Preset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'browse' | 'my-presets'>('browse')
  const [filterType, setFilterType] = useState<PresetType | 'all'>('all')
  const [showPublishDialog, setShowPublishDialog] = useState(false)
  const [publishType, setPublishType] = useState<PresetType>('full')
  const [publishName, setPublishName] = useState('')
  const [publishDescription, setPublishDescription] = useState('')
  const [publishTags, setPublishTags] = useState('')

  useEffect(() => {
    loadPresets()
    if (isAuthenticated) {
      loadMyPresets()
    }
  }, [isAuthenticated])

  const loadPresets = async () => {
    setIsLoading(true)
    try {
      const data = await getPresets()
      setPresets(data)
    } catch (error) {
      console.error('Failed to load presets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMyPresets = async () => {
    try {
      const data = await getMyPresets()
      setMyPresets(data)
    } catch (error) {
      console.error('Failed to load my presets:', error)
    }
  }

  const handlePublish = async () => {
    if (!publishName.trim()) {
      alert('Please enter a name for your preset')
      return
    }

    const content = getPresetContent(publishType)
    if (!content) {
      alert('Nothing to publish. Make sure your language has content for this preset type.')
      return
    }

    try {
      await createPreset(
        publishType,
        publishName.trim(),
        publishDescription.trim(),
        content,
        publishTags.split(',').map(t => t.trim()).filter(Boolean)
      )
      
      setShowPublishDialog(false)
      setPublishName('')
      setPublishDescription('')
      setPublishTags('')
      await loadMyPresets()
    } catch (error) {
      console.error('Failed to publish preset:', error)
      alert('Failed to publish preset. Please try again.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this preset? This cannot be undone.')) return
    
    try {
      await deletePreset(id)
      setMyPresets(prev => prev.filter(p => p.id !== id))
    } catch (error) {
      console.error('Failed to delete preset:', error)
    }
  }

  const getPresetContent = (type: PresetType): any => {
    switch (type) {
      case 'phonology':
        return definition.phonology
      case 'phonotactics':
        return definition.phonotactics
      case 'morphology':
        return definition.morphology
      case 'full':
        return {
          phonology: definition.phonology,
          phonotactics: definition.phonotactics,
          orthography: definition.orthography,
          morphology: definition.morphology,
          generationStyle: definition.generationStyle,
          phonologicalRules: definition.phonologicalRules,
        }
    }
  }

  const filteredPresets = filterType === 'all' 
    ? presets 
    : presets.filter(p => p.type === filterType)

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'phonology': return 'Phonology'
      case 'phonotactics': return 'Phonotactics'
      case 'morphology': return 'Morphology'
      case 'full': return 'Full Language'
      default: return type
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'phonology': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'phonotactics': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'morphology': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'full': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
      default: return 'bg-secondary'
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab Selection */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'browse' ? 'default' : 'outline'}
          onClick={() => setActiveTab('browse')}
        >
          Browse Presets
        </Button>
        {isAuthenticated && (
          <Button
            variant={activeTab === 'my-presets' ? 'default' : 'outline'}
            onClick={() => setActiveTab('my-presets')}
          >
            My Presets ({myPresets.length})
          </Button>
        )}
      </div>

      {activeTab === 'browse' && (
        <>
          {/* Filter */}
          <Card>
            <CardHeader>
              <CardTitle>Community Presets</CardTitle>
              <CardDescription>
                Browse and apply presets created by the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('all')}
                >
                  All
                </Button>
                <Button
                  variant={filterType === 'phonology' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('phonology')}
                >
                  Phonology
                </Button>
                <Button
                  variant={filterType === 'phonotactics' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('phonotactics')}
                >
                  Phonotactics
                </Button>
                <Button
                  variant={filterType === 'morphology' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('morphology')}
                >
                  Morphology
                </Button>
                <Button
                  variant={filterType === 'full' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('full')}
                >
                  Full Language
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preset List */}
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <p className="text-muted-foreground">Loading presets...</p>
              ) : filteredPresets.length === 0 ? (
                <p className="text-muted-foreground">
                  No presets found. Be the first to publish one!
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredPresets.map(preset => (
                    <div
                      key={preset.id}
                      className="border rounded-lg p-4 hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{preset.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded ${getTypeColor(preset.type)}`}>
                              {getTypeLabel(preset.type)}
                            </span>
                            {preset.is_official && (
                              <span className="text-xs px-2 py-0.5 rounded bg-primary text-primary-foreground">
                                Official
                              </span>
                            )}
                          </div>
                          {preset.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {preset.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">
                              {preset.downloads} downloads
                            </span>
                            {preset.tags.length > 0 && (
                              <div className="flex gap-1">
                                {preset.tags.slice(0, 3).map(tag => (
                                  <span key={tag} className="text-xs bg-secondary px-1.5 py-0.5 rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => onApplyPreset(preset)}
                        >
                          Apply
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

      {activeTab === 'my-presets' && isAuthenticated && (
        <>
          {/* Publish Button */}
          <Card>
            <CardHeader>
              <CardTitle>My Published Presets</CardTitle>
              <CardDescription>
                Share your language configurations with the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
                <DialogTrigger asChild>
                  <Button>+ Publish New Preset</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Publish a Preset</DialogTitle>
                    <DialogDescription>
                      Share part of your language configuration with the community
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Preset Type</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={publishType}
                        onChange={(e) => setPublishType(e.target.value as PresetType)}
                      >
                        <option value="phonology">Phonology (consonants/vowels)</option>
                        <option value="phonotactics">Phonotactics (syllable templates)</option>
                        <option value="morphology">Morphology (affixes/syntax)</option>
                        <option value="full">Full Language Configuration</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="presetName">Name</Label>
                      <Input
                        id="presetName"
                        placeholder="e.g., Elvish Phonology, Japanese-inspired"
                        value={publishName}
                        onChange={(e) => setPublishName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="presetDesc">Description</Label>
                      <Textarea
                        id="presetDesc"
                        placeholder="Describe what makes this preset unique..."
                        value={publishDescription}
                        onChange={(e) => setPublishDescription(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="presetTags">Tags (comma-separated)</Label>
                      <Input
                        id="presetTags"
                        placeholder="fantasy, elvish, flowing"
                        value={publishTags}
                        onChange={(e) => setPublishTags(e.target.value)}
                      />
                    </div>
                    <Button onClick={handlePublish} className="w-full">
                      Publish Preset
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* My Presets List */}
          <Card>
            <CardContent className="pt-6">
              {myPresets.length === 0 ? (
                <p className="text-muted-foreground">
                  You haven&apos;t published any presets yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {myPresets.map(preset => (
                    <div
                      key={preset.id}
                      className="flex items-center justify-between p-4 border rounded-md"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{preset.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${getTypeColor(preset.type)}`}>
                            {getTypeLabel(preset.type)}
                          </span>
                        </div>
                        {preset.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {preset.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {preset.downloads} downloads • {preset.is_public ? 'Public' : 'Private'}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(preset.id)}
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

