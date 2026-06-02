"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { navigationPaths } from "@/lib/navigation";
import { ThemeLogo } from "@/components/theme-logo";
import { useForgotPassword } from "@/hooks/use-users";
import { useToast } from "@/hooks/use-toast";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isEmployeePending, setIsEmployeePending] = useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const isEmployee = searchParams.get("role") === "employee";

  const { mutateAsync, isPending } = useForgotPassword();
  const loading = isPending || isEmployeePending;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      if (isEmployee) {
        setIsEmployeePending(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_URL}/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email }),
        });
        const result = await response.json();

        if (response.ok && result.statusCode === 200) {
          setIsSuccess(true);
        } else {
          toast({
            title: "Error",
            description: result?.message || "User not found or could not process request.",
            variant: "destructive",
          });
        }
      } else {
        const response = await mutateAsync(data.email);
        if (response?.forgotPassword?.success) {
          setIsSuccess(true);
        } else {
          toast({
            title: "Error",
            description:
              response?.forgotPassword?.message ||
              "User not found or could not process request.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);
      toast({
        title: "Connection Error",
        description: error.message || "Could not reach the server.",
        variant: "destructive",
      });
    } finally {
      if (isEmployee) setIsEmployeePending(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[480px]"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "#131e30", border: "1px solid #1e2d45" }}
            >
              <ThemeLogo alt="LendGrid" className="w-10 h-10 object-contain" />
            </div>
            <span className="text-3xl font-bold" style={{ color: "#5b9cf6" }}>
              LendGrid
            </span>
          </div>
          <p className="text-sm" style={{ color: "#64748b" }}>
            Secure access to your dashboard
          </p>
        </div>

        {/* Success State */}
        <motion.div
          className="flex flex-col items-center text-center gap-5"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(34,197,94,0.1)",
              border: "1.5px solid rgba(34,197,94,0.25)",
            }}
          >
            <CheckCircle className="w-8 h-8" style={{ color: "#4ade80" }} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">
              Check Your Email
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>
              We've sent a password reset link to your email address.
              <br />
              If you don't see it, check your spam folder.
            </p>
          </div>
          <Button
            asChild
            className="w-full h-12 font-semibold rounded-xl text-white text-sm mt-2"
            style={{
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              border: "none",
            }}
          >
            <Link href={navigationPaths.login}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-[480px]"
    >
      {/* Brand Header — pixel-matched to login page */}
      <div className="flex flex-col items-center mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: "#131e30", border: "1px solid #1e2d45" }}
          >
            <ThemeLogo alt="LendGrid" className="w-10 h-10 object-contain" />
          </div>
          <span className="text-3xl font-bold" style={{ color: "#5b9cf6" }}>
            LendGrid
          </span>
        </div>
        <p className="text-sm" style={{ color: "#64748b" }}>
          Secure access to your dashboard
        </p>
      </div>

      {/* Fields float directly on the dark page — no card wrapper, matching login */}
      <div className="w-full space-y-5">
        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="text-sm font-semibold"
            style={{ color: "#cbd5e1" }}
          >
            {isEmployee ? "OMS Work Email" : "Email Address"}
          </Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="Enter your email"
            disabled={loading}
            className="h-12 w-full rounded-lg text-sm"
            style={{
              background: "#0d1625",
              border: "1px solid #1e2d45",
              color: "#e2e8f0",
              caretColor: "#e2e8f0",
            }}
          />
          {errors.email && (
            <p className="text-xs mt-1" style={{ color: "#f87171" }}>
              {errors.email.message}
            </p>
          )}
        </div>

        <Button
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={loading}
          className="w-full h-12 font-semibold rounded-xl text-white text-sm"
          style={{
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            border: "none",
          }}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending Link...
            </>
          ) : (
            "Send Reset Link"
          )}
        </Button>

        <div className="text-center pt-1">
          <Link
            href={navigationPaths.login}
            className="text-sm inline-flex items-center gap-1.5 transition-opacity hover:opacity-80"
            style={{ color: "#5b9cf6" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Login
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
