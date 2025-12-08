'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { LexiconEntry } from '@/lib/supabase/types'
import {
  createLexiconEntry,
  updateLexiconEntry,
  deleteLexiconEntry,
} from '@/app/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface LexiconTabProps {
  languageId?: string
  entries: LexiconEntry[]
  onEntriesChange: (entries: LexiconEntry[]) => void
  user: User | null
}

export function LexiconTab({ languageId, entries, onEntriesChange, user }: LexiconTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [editingEntry, setEditingEntry] = useState<LexiconEntry | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const filteredEntries = entries.filter(
    entry =>
      entry.gloss.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.phonemic_form?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.orthographic_form?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSave = async (
    gloss: string,
    partOfSpeech?: string,
    phonemicForm?: string,
    orthographicForm?: string,
    tags?: string[],
    notes?: string
  ) => {
    if (!languageId || !user) return

    try {
      if (editingEntry) {
        const updated = await updateLexiconEntry(
          editingEntry.id,
          gloss,
          partOfSpeech,
          phonemicForm,
          orthographicForm,
          tags,
          notes
        )
        if (updated) {
          onEntriesChange(entries.map(e => (e.id === updated.id ? updated : e)))
        }
      } else {
        const created = await createLexiconEntry(
          languageId,
          gloss,
          partOfSpeech,
          phonemicForm,
          orthographicForm,
          tags,
          notes
        )
        if (created) {
          onEntriesChange([...entries, created])
        }
      }
      setIsDialogOpen(false)
      setEditingEntry(null)
    } catch (error) {
      console.error('Save failed:', error)
      alert('Failed to save entry')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return

    try {
      await deleteLexiconEntry(id)
      onEntriesChange(entries.filter(e => e.id !== id))
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Failed to delete entry')
    }
  }

  const handleEdit = (entry: LexiconEntry) => {
    setEditingEntry(entry)
    setIsDialogOpen(true)
  }

  const handleNew = () => {
    setEditingEntry(null)
    setIsDialogOpen(true)
  }

  if (!user || !languageId) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            Log in and save your language to manage the lexicon
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Lexicon</CardTitle>
            <CardDescription>Manage your language's vocabulary</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNew}>Add Entry</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingEntry ? 'Edit Entry' : 'New Entry'}
                </DialogTitle>
                <DialogDescription>
                  Add or edit a lexicon entry
                </DialogDescription>
              </DialogHeader>
              <EntryForm
                entry={editingEntry}
                onSave={handleSave}
                onCancel={() => {
                  setIsDialogOpen(false)
                  setEditingEntry(null)
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Search by gloss, phonemic form, or orthographic form..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {filteredEntries.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {entries.length === 0
              ? 'No entries yet. Click "Add Entry" to get started.'
              : 'No entries match your search.'}
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gloss</TableHead>
                  <TableHead>Part of Speech</TableHead>
                  <TableHead>Phonemic</TableHead>
                  <TableHead>Orthographic</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.gloss}</TableCell>
                    <TableCell>{entry.part_of_speech || '-'}</TableCell>
                    <TableCell>
                      <code className="text-sm">{entry.phonemic_form || '-'}</code>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm">{entry.orthographic_form || '-'}</code>
                    </TableCell>
                    <TableCell>
                      {entry.tags && entry.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {entry.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(entry)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(entry.id)}
                          className="text-destructive"
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function EntryForm({
  entry,
  onSave,
  onCancel,
}: {
  entry: LexiconEntry | null
  onSave: (
    gloss: string,
    partOfSpeech?: string,
    phonemicForm?: string,
    orthographicForm?: string,
    tags?: string[],
    notes?: string
  ) => void
  onCancel: () => void
}) {
  const [gloss, setGloss] = useState(entry?.gloss || '')
  const [partOfSpeech, setPartOfSpeech] = useState(entry?.part_of_speech || '')
  const [phonemicForm, setPhonemicForm] = useState(entry?.phonemic_form || '')
  const [orthographicForm, setOrthographicForm] = useState(
    entry?.orthographic_form || ''
  )
  const [tagsInput, setTagsInput] = useState(
    entry?.tags?.join(', ') || ''
  )
  const [notes, setNotes] = useState(entry?.notes || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)
    onSave(
      gloss,
      partOfSpeech || undefined,
      phonemicForm || undefined,
      orthographicForm || undefined,
      tags.length > 0 ? tags : undefined,
      notes || undefined
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Gloss *</Label>
        <Input
          value={gloss}
          onChange={(e) => setGloss(e.target.value)}
          placeholder="English meaning"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Part of Speech</Label>
          <Input
            value={partOfSpeech}
            onChange={(e) => setPartOfSpeech(e.target.value)}
            placeholder="noun, verb, etc."
          />
        </div>
        <div className="space-y-2">
          <Label>Tags (comma-separated)</Label>
          <Input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="common, formal, etc."
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Phonemic Form</Label>
          <Input
            value={phonemicForm}
            onChange={(e) => setPhonemicForm(e.target.value)}
            placeholder="/kata/"
          />
        </div>
        <div className="space-y-2">
          <Label>Orthographic Form</Label>
          <Input
            value={orthographicForm}
            onChange={(e) => setOrthographicForm(e.target.value)}
            placeholder="kata"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  )
}

