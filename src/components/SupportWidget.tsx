'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CheckCircle2, HelpCircle, Paperclip, X } from 'lucide-react'
import { submitSupportRequest } from '@/app/support-actions'

type RequestType = 'question' | 'bug' | 'feature'

const TYPE_LABELS: Record<RequestType, string> = {
  question: 'Question',
  bug: 'Bug Report',
  feature: 'Feature Request',
}

interface SupportWidgetProps {
  isLoggedIn?: boolean
}

export function SupportWidget({ isLoggedIn = false }: SupportWidgetProps) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<RequestType>('question')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [email, setEmail] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setImage(file)
  }

  const clearImage = () => {
    setImage(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const resetForm = () => {
    setSubject('')
    setBody('')
    setEmail('')
    setType('question')
    setError(null)
    clearImage()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !body.trim()) return
    if (!isLoggedIn && !email.trim()) return

    setSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('type', type)
      formData.append('subject', subject.trim())
      formData.append('body', body.trim())
      if (!isLoggedIn && email.trim()) formData.append('guestEmail', email.trim())
      if (image) formData.append('image', image)

      const result = await submitSupportRequest(formData)
      if (result.success) {
        resetForm()
        setSubmitted(true)
      } else {
        setError(result.error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Failed to send message. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setTimeout(() => {
      setSubmitted(false)
      setError(null)
    }, 300)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
      >
        <HelpCircle className="h-4 w-4" />
        Help
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Get Help</DialogTitle>
          </DialogHeader>

          {submitted ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <div>
                <p className="font-medium">Message sent!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  We&apos;ll get back to you soon.
                </p>
              </div>
              <Button onClick={handleClose} className="mt-2">
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="support-type">Type</Label>
                <select
                  id="support-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as RequestType)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {(Object.keys(TYPE_LABELS) as RequestType[]).map((key) => (
                    <option key={key} value={key}>
                      {TYPE_LABELS[key]}
                    </option>
                  ))}
                </select>
              </div>

              {!isLoggedIn && (
                <div className="space-y-1.5">
                  <Label htmlFor="support-email">Your email</Label>
                  <Input
                    id="support-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    So we can reply to you.
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="support-subject">Subject</Label>
                <Input
                  id="support-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary..."
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="support-body">Message</Label>
                <Textarea
                  id="support-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Describe your question, bug, or idea in detail..."
                  rows={5}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Attachment (optional)</Label>
                {image ? (
                  <div className="flex items-center gap-2 p-2 border rounded-md">
                    <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate flex-1">{image.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={clearImage}
                      aria-label="Remove attachment"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4 mr-2" />
                    Attach image
                  </Button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !subject.trim() || !body.trim() || (!isLoggedIn && !email.trim())}
                >
                  {submitting ? 'Sending…' : 'Send message'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
