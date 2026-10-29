'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader } from 'lucide-react'

export function MobileRedirect() {
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref')
  const type = searchParams.get('type') || ''
  const cName = searchParams.get('c_name') || searchParams.get('company_name') || ''
  const [isRedirecting, setIsRedirecting] = useState(false)

  const queryParams = `ref=${encodeURIComponent(ref || '')}${type ? `&type=${encodeURIComponent(type)}` : ''}${cName ? `&c_name=${encodeURIComponent(cName)}` : ''}`
  const deepLinkUrl = `lendgridmobile://signup?${queryParams}`
  const referrer = `utm_source=website&ref=${encodeURIComponent(ref || '')}${type ? `&type=${encodeURIComponent(type)}` : ''}${cName ? `&c_name=${encodeURIComponent(cName)}` : ''}`
  const playStoreUrl = `https://play.google.com/store/apps/details?id=com.lendgrid.mobile&referrer=${encodeURIComponent(referrer)}`
  const intentUrl = `intent://signup?${queryParams}#Intent;scheme=lendgridmobile;package=com.lendgrid.mobile;S.browser_fallback_url=${encodeURIComponent(playStoreUrl)};end;`

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAndroid = /Android/i.test(navigator.userAgent)
      
      if (isAndroid && ref) {
        setIsRedirecting(true)
        // Try opening the installed app directly via intent scheme; if not installed, Android opens Play Store
        window.location.href = intentUrl
      }
    }
  }, [ref, intentUrl])

  if (!isRedirecting) return null

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-4 text-center">
      <Loader className="animate-spin text-primary w-12 h-12 mb-4" />
      <h2 className="text-2xl font-bold mb-2">Opening LendGrid App...</h2>
      <p className="text-muted-foreground mb-4 max-w-sm">
        Opening registration with your referral code. If the app does not open automatically, tap below:
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href={deepLinkUrl}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold shadow-md hover:bg-primary/90"
        >
          Open App
        </a>
        <button
          type="button"
          onClick={() => setIsRedirecting(false)}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted/50"
        >
          Continue on Web
        </button>
      </div>
    </div>
  )
}
