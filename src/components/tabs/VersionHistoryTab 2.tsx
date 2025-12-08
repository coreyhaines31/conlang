'use client'

import { useState, useEffect } from 'react'
import { Snapshot } from '@/lib/supabase/types'
import { createSnapshot, getSnapshots, deleteSnapshot, restoreSnapshot } from '@/app/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface VersionHistoryTabProps {
  languageId: string | null
  isAuthenticated: boolean
  onRestore?: () => void
}

export function VersionHistoryTab({ 
  languageId, 
  isAuthenticated,
  onRestore 
}: VersionHistoryTabProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newSnapshotName, setNewSnapshotName] = useState('')
  const [newSnapshotDescription, setNewSnapshotDescription] = useState('')
  const [restoring, setRestoring] = useState<string | null>(null)

  useEffect(() => {
    if (languageId && isAuthenticated) {
      loadSnapshots()
    }
  }, [languageId, isAuthenticated])

  const loadSnapshots = async () => {
    if (!languageId) return
    
    setIsLoading(true)
    try {
      const data = await getSnapshots(languageId)
      setSnapshots(data)
    } catch (error) {
      console.error('Failed to load snapshots:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSnapshot = async () => {
    if (!languageId) return
    
    setIsLoading(true)
    try {
      await createSnapshot(
        languageId,
        newSnapshotName || undefined,
        newSnapshotDescription || undefined
      )
      setNewSnapshotName('')
      setNewSnapshotDescription('')
      setShowCreateForm(false)
      await loadSnapshots()
    } catch (error) {
      console.error('Failed to create snapshot:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSnapshot = async (id: string) => {
    if (!confirm('Delete this snapshot? This cannot be undone.')) return
    
    try {
      await deleteSnapshot(id)
      setSnapshots(prev => prev.filter(s => s.id !== id))
    } catch (error) {
      console.error('Failed to delete snapshot:', error)
    }
  }

  const handleRestoreSnapshot = async (id: string) => {
    if (!confirm('Restore this snapshot? Your current work will be replaced with this version.')) return
    
    setRestoring(id)
    try {
      await restoreSnapshot(id)
      onRestore?.()
    } catch (error) {
      console.error('Failed to restore snapshot:', error)
    } finally {
      setRestoring(null)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
          <CardDescription>
            Save and restore snapshots of your language
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Sign in and save your language to use version history.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!languageId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
          <CardDescription>
            Save and restore snapshots of your language
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Save your language first to create snapshots.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
          <CardDescription>
            Create snapshots to save your progress and restore previous versions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showCreateForm ? (
            <div className="border rounded-md p-4 space-y-4">
              <div>
                <Label htmlFor="snapshotName">Snapshot Name (optional)</Label>
                <Input
                  id="snapshotName"
                  placeholder="e.g., v1.0, Before big changes"
                  value={newSnapshotName}
                  onChange={(e) => setNewSnapshotName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="snapshotDesc">Description (optional)</Label>
                <Textarea
                  id="snapshotDesc"
                  placeholder="What changed in this version?"
                  value={newSnapshotDescription}
                  onChange={(e) => setNewSnapshotDescription(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateSnapshot} disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Snapshot'}
                </Button>
                <Button variant="ghost" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowCreateForm(true)}>
              + Create Snapshot
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved Snapshots ({snapshots.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && snapshots.length === 0 ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : snapshots.length === 0 ? (
            <p className="text-muted-foreground">
              No snapshots yet. Create one to save your current progress.
            </p>
          ) : (
            <div className="space-y-3">
              {snapshots.map((snapshot) => (
                <div
                  key={snapshot.id}
                  className="flex items-center justify-between p-4 border rounded-md hover:bg-secondary/30"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {snapshot.name || 'Unnamed Snapshot'}
                      </span>
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                        {snapshot.lexicon_count} words
                      </span>
                    </div>
                    {snapshot.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {snapshot.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(snapshot.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestoreSnapshot(snapshot.id)}
                      disabled={restoring === snapshot.id}
                    >
                      {restoring === snapshot.id ? 'Restoring...' : 'Restore'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSnapshot(snapshot.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

