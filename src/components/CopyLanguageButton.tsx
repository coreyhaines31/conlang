'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type AuthUser = { id: string; email?: string | null }
import { copyPublicLanguage } from '@/app/actions'
import { AuthModal } from './auth/AuthModal'

interface CopyLanguageButtonProps {
  languageId: string
  user: AuthUser | null
}

export function CopyLanguageButton({ languageId, user }: CopyLanguageButtonProps) {
  const [copying, setCopying] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const router = useRouter()

  const handleCopy = async () => {
    if (!user) {
      setShowAuthModal(true)
      return
    }

    setCopying(true)
    try {
      const copied = await copyPublicLanguage(languageId)
      if (copied) {
        router.push('/')
      }
    } catch (error) {
      console.error('Copy failed:', error)
      alert('Failed to copy language')
    }
    setCopying(false)
  }

  return (
    <>
      <Button onClick={handleCopy} disabled={copying} size="lg">
        {copying ? 'Copying...' : 'Copy to My Account'}
      </Button>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  )
}

