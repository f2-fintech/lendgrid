"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
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
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
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
  const { toast } = useToast();

  // Use the mutation hook instead of manual fetch
  const { mutateAsync, isPending } = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
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
    } catch (error: any) {
      console.error("Forgot password error:", error);
      toast({
        title: "Connection Error",
        description: error.message || "Could not reach the server.",
        variant: "destructive",
      });
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="enhanced-card">
          <CardHeader className="text-center pb-6">
            <motion.div
              className="flex items-center justify-center mb-6"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-2xl">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
            </motion.div>
            <CardTitle className="text-3xl font-bold text-white">
              Check Your Email
            </CardTitle>
            <CardDescription className="text-gray-400 text-lg">
              We've sent a password reset link to your email address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-gray-300 leading-relaxed">
                If you don't see the email in your inbox, please check your spam
                folder.
              </p>
              <Button
                asChild
                className="w-full btn-primary h-12 text-lg font-semibold rounded-xl"
              >
                <Link href={navigationPaths.login}>
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Login
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <Card className="enhanced-card">
        <CardHeader className="text-center pb-6">
          <motion.div
            className="flex items-center justify-center mb-6"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center shadow-2xl">
              <ThemeLogo alt="LendGrid" className="w-10 h-10" />
            </div>
            <span className="text-2xl font-bold ml-2 text-white">LendGrid</span>
          </motion.div>
          <CardTitle className="text-3xl font-bold text-white">
            Forgot Password?
          </CardTitle>
          <CardDescription className="text-gray-400 text-lg">
            Enter your email address and we'll send you a link to reset your
            password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">
                Email Address
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="name@example.com"
                  className="glass-input pl-4"
                  disabled={isPending}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full btn-primary h-12 text-lg font-semibold rounded-xl"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sending Link...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>

            <div className="text-center">
              <Link
                href={navigationPaths.login}
                className="text-sm text-gray-400 hover:text-white transition-colors inline-flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
