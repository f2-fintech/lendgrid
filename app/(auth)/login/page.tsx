import { Suspense } from 'react'
import { Loader } from 'lucide-react'

import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <Suspense fallback={<Loader className="animate-spin" />}>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <LoginForm />
      </div>
    </Suspense>
  )
}
