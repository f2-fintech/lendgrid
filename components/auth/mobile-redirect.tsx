'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export function MobileRedirect() {
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAndroid = /Android/i.test(navigator.userAgent)
      
      if (isAndroid && ref) {
        const referrer = `utm_source=website&ref=${ref}`
        const intentUrl = `intent://details?id=com.lendgrid.mobile&referrer=${encodeURIComponent(referrer)}#Intent;scheme=market;package=com.android.vending;end`
        
        // Attempt to redirect to the Play Store
        window.location.href = intentUrl
      }
    }
  }, [ref])

  return null
}
