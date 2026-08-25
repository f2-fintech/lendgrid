'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader } from 'lucide-react'

export function MobileRedirect() {
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref')
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAndroid = /Android/i.test(navigator.userAgent)
      
      if (isAndroid && ref) {
        setIsRedirecting(true)
        const referrer = `utm_source=website&ref=${ref}`
        const intentUrl = `intent://details?id=com.lendgrid.mobile&referrer=${encodeURIComponent(referrer)}#Intent;scheme=market;package=com.android.vending;end`
        
        // Attempt to redirect to the Play Store
        window.location.href = intentUrl
      }
    }
  }, [ref])

  if (!isRedirecting) return null

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-4 text-center">
      <Loader className="animate-spin text-primary w-12 h-12 mb-4" />
      <h2 className="text-2xl font-bold mb-2">Redirecting to Play Store...</h2>
      <p className="text-muted-foreground">
        Please install the LendGrid app to complete your registration and claim your referral code.
      </p>
    </div>
  )
}
