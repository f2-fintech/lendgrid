"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useResetPassword } from "@/hooks/use-users";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { ThemeLogo } from "@/components/theme-logo";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password Must Be 8 Characters Long")
      .regex(/[A-Z]/, "Must contain at least 1 uppercase letter")
      .regex(/[a-z]/, "Must contain at least 1 lowercase letter")
      .regex(/[0-9]/, "Must contain at least 1 number")
      .regex(/[^\w]/, "Must contain at least 1 special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const resetMutation = useResetPassword();

  const [isVerifying, setIsVerifying] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isEmployeePending, setIsEmployeePending] = useState(false);

  const token = searchParams.get("token");
  const isEmployee = searchParams.get("role") === "employee";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!token) {
        toast({
          title: "Invalid Access",
          description: "Missing reset token. Please check your email link.",
          variant: "destructive",
        });
        router.push("/login");
      } else {
        setIsVerifying(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [token, router, toast]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;
    try {
      if (isEmployee) {
        setIsEmployeePending(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_URL}/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, newPassword: data.password }),
        });
        const result = await response.json();

        if (response.ok && result.statusCode === 200) {
          toast({
            title: "Password Updated",
            description: result.message || "Your OMS password has been reset successfully.",
          });
          router.push("/login?role=employee");
        } else {
          toast({
            title: "Error",
            description: result.message || "Invalid or expired token.",
            variant: "destructive",
          });
        }
      } else {
        const response: any = await resetMutation.mutateAsync({
          token,
          newPassword: data.password,
        });
        if (response?.resetPassword?.success) {
          toast({
            title: "Password Updated",
            description:
              response.resetPassword.message ||
              "Your password has been reset successfully.",
          });
          router.push("/login");
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not reset password.",
        variant: "destructive",
      });
    } finally {
      if (isEmployee) setIsEmployeePending(false);
    }
  };

  const loading = resetMutation.isPending || isEmployeePending;

  return (
    <div className="w-full max-w-[480px]">
      <AnimatePresence mode="wait">
        {isVerifying ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-64 space-y-4"
          >
            <Loader2
              className="w-8 h-8 animate-spin"
              style={{ color: "#3b82f6" }}
            />
            <p className="text-sm" style={{ color: "#64748b" }}>
              Verifying reset link...
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Brand Header — pixel-matched to login page */}
            <div className="flex flex-col items-center mb-10">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: "#131e30", border: "1px solid #1e2d45" }}
                >
                  <ThemeLogo
                    alt="LendGrid"
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <span
                  className="text-3xl font-bold"
                  style={{ color: "#5b9cf6" }}
                >
                  LendGrid
                </span>
              </div>
              <p className="text-sm" style={{ color: "#64748b" }}>
                {isEmployee ? "OMS Staff Password Reset" : "Secure access to your dashboard"}
              </p>
            </div>

            {/* Fields float directly on the dark page — no card wrapper */}
            <div className="w-full space-y-5">
              {/* New Password */}
              <div className="space-y-2">
                <Label
                  className="text-sm font-semibold"
                  style={{ color: "#cbd5e1" }}
                >
                  New Password
                </Label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: "#4b607a" }}
                  />
                  <Input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    placeholder="••••••••"
                    className="h-12 w-full rounded-lg text-sm pl-10 pr-10"
                    style={{
                      background: "#0d1625",
                      border: "1px solid #1e2d45",
                      color: "#e2e8f0",
                      caretColor: "#e2e8f0",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-80"
                    style={{ color: "#4b607a" }}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs mt-1" style={{ color: "#f87171" }}>
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label
                  className="text-sm font-semibold"
                  style={{ color: "#cbd5e1" }}
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <ShieldCheck
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: "#4b607a" }}
                  />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    {...register("confirmPassword")}
                    placeholder="••••••••"
                    className="h-12 w-full rounded-lg text-sm pl-10 pr-10"
                    style={{
                      background: "#0d1625",
                      border: "1px solid #1e2d45",
                      color: "#e2e8f0",
                      caretColor: "#e2e8f0",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-80"
                    style={{ color: "#4b607a" }}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs mt-1" style={{ color: "#f87171" }}>
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={loading}
                className="w-full h-12 font-semibold rounded-xl text-white text-sm"
                style={{
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                  border: "none",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
