import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      {/* Suspense is REQUIRED because ResetPasswordForm uses useSearchParams(). 
          Without this, Next.js will throw an error during the build.
      */}
      <Suspense fallback={<Loader2 className="animate-spin text-white" />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
