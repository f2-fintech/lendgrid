import { Suspense } from 'react'
import { Loader } from 'lucide-react'

import { SignupForm } from '@/components/auth/signup-form'

export default function SignupPage() {
  return (
    <Suspense fallback={<Loader className="animate-spin" />}>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <SignupForm />
      </div>
    </Suspense>
  )
}
