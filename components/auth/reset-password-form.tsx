"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useResetPassword } from "@/hooks/use-users";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

  // States
  const [isVerifying, setIsVerifying] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const token = searchParams.get("token");

  // Hooks must be top-level
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
  });

  useEffect(() => {
    // Small timeout ensures Next.js searchParams are fully mounted
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not reset password.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full max-w-md">
      <AnimatePresence mode="wait">
        {isVerifying ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-64 space-y-4"
          >
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm text-gray-400">Verifying reset link...</p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="enhanced-card">
              <CardHeader className="text-center">
                <div className="flex flex-col items-center gap-2 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center">
                    <ThemeLogo
                      alt="LendGrid"
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                  <CardTitle className="text-2xl font-bold text-white">
                    Reset Password
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Enter your new secure password below
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label className="text-gray-300">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        {...register("password")}
                        className="glass-input pl-10 pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <Label className="text-gray-300">Confirm Password</Label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        {...register("confirmPassword")}
                        className="glass-input pl-10 pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={resetMutation.isPending}
                    className="w-full btn-primary h-11 mt-4 font-semibold"
                  >
                    {resetMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
