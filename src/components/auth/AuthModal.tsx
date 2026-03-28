'use client'

import { useState } from 'react'
import { authClient } from '@/lib/auth-client'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await authClient.signIn.magicLink({
      email,
      callbackURL: '/',
    })

    if (error) {
      setMessage({ type: 'error', text: error.message ?? 'Something went wrong.' })
    } else {
      setMessage({ type: 'success', text: 'Check your email for the login link!' })
      onSuccess()
    }
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-background border rounded-lg p-6 max-w-md w-full shadow-lg">
        <h2 id="auth-modal-title" className="text-2xl font-bold mb-4">Sign in to save your language</h2>
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label htmlFor="auth-email" className="block text-sm font-medium text-foreground mb-1">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              spellCheck={false}
              className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="you@example.com"
            />
          </div>

          {message && (
            <div
              className={`p-3 rounded-md ${message.type === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-700 dark:text-green-400'}`}
              role={message.type === 'error' ? 'alert' : 'status'}
              aria-live="polite"
            >
              {message.text}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sending…' : 'Send Magic Link'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-input bg-background text-foreground rounded-md hover:bg-accent transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
