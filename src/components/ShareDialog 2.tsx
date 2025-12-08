'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface ShareDialogProps {
  languageSlug: string | null
  languageName: string
  isPublic: boolean
  onTogglePublic: () => void
}

export function ShareDialog({ 
  languageSlug, 
  languageName,
  isPublic,
  onTogglePublic
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false)
  
  const shareUrl = languageSlug 
    ? (typeof window !== 'undefined' ? `${window.location.origin}/l/${languageSlug}` : `/l/${languageSlug}`)
    : null

  const handleCopy = async () => {
    if (!shareUrl) return
    
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Share
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share &quot;{languageName}&quot;</DialogTitle>
          <DialogDescription>
            {isPublic 
              ? 'Your language is public and can be viewed by anyone with the link.'
              : 'Make your language public to share it with others.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Public Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-md bg-secondary/30">
            <div>
              <div className="font-medium">Public visibility</div>
              <div className="text-sm text-muted-foreground">
                {isPublic 
                  ? 'Anyone can view this language' 
                  : 'Only you can see this language'}
              </div>
            </div>
            <Button
              variant={isPublic ? 'default' : 'outline'}
              onClick={onTogglePublic}
            >
              {isPublic ? 'Public' : 'Private'}
            </Button>
          </div>

          {/* Share URL */}
          {isPublic && shareUrl ? (
            <div className="space-y-2">
              <Label>Share Link</Label>
              <div className="flex gap-2">
                <Input 
                  value={shareUrl} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button onClick={handleCopy}>
                  {copied ? '✓ Copied!' : 'Copy'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Anyone with this link can view your language and copy it to their account.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-secondary/30 rounded-md text-center">
              <p className="text-muted-foreground">
                Make your language public to get a shareable link.
              </p>
            </div>
          )}

          {/* Social Sharing (when public) */}
          {isPublic && shareUrl && (
            <div className="space-y-2">
              <Label>Share on</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(
                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out my constructed language "${languageName}" on conlang.app!`)}&url=${encodeURIComponent(shareUrl)}`,
                    '_blank'
                  )}
                >
                  Twitter/X
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(
                    `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(`My constructed language: ${languageName}`)}`,
                    '_blank'
                  )}
                >
                  Reddit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const text = `Check out my constructed language "${languageName}": ${shareUrl}`
                    if (navigator.share) {
                      navigator.share({ title: languageName, text, url: shareUrl })
                    } else {
                      navigator.clipboard.writeText(text)
                    }
                  }}
                >
                  More...
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

