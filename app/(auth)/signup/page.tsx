import { SignupForm } from '@/components/auth/signup-form'
import { Suspense } from 'react'

import { Loader } from 'lucide-react'

export default function SignupPage() {
  return (
    <Suspense fallback={<Loader className="animate-spin" />}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <SignupForm />
        </div>
      </div>
    </Suspense>
  )
}
