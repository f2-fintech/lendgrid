import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'
import { Loader2 } from 'lucide-react'
import { Suspense } from 'react'

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Suspense fallback={<Loader2 className="animate-spin text-white" />}>
          <ForgotPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
