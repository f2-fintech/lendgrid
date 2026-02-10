"use client";

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Script from "next/script";
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

import { useLogin } from '@/hooks/use-users';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { navigationPaths } from '@/lib/navigation';
import { decodeJwt, setCookie } from "@/lib/utils";

// Validation Schema
const loginSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),

  password: z.string()
    .min(8, "Password Must Be 8 Characters Long")
    .regex(/[A-Z]/, "Password Must Contain At Least 1 Uppercase Letter")
    .regex(/[a-z]/, "Password Must Contain At Least 1 Lowercase Letter")
    .regex(/[0-9]/, "Password Must Contain At Least 1 Number")
    .regex(/[^\w]/, "Password Must Contain At Least 1 Special Character")
    .max(30, "Password cannot be more than 30 characters"),

  role: z.enum(['super_admin', 'aggregator_admin', 'aggregator_member', 'lender_admin'])
    .optional()
});

type LoginFormData = z.infer<typeof loginSchema>;
type RoleType = LoginFormData['role'];

// Declare global Turnstile type
declare global {
  interface Window {
    turnstile?: {
      render: (element: string | HTMLElement, options: any) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [turnstileLoaded, setTurnstileLoaded] = useState(false);
  const turnstileWidgetId = useRef<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const loginMutation = useLogin();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const selectedRole = watch('role');

  useEffect(() => {
    const roleParam = searchParams.get('role');
    const validRoles: RoleType[] = ['super_admin', 'aggregator_admin', 'aggregator_member', 'lender_admin'];

    if (roleParam && validRoles.includes(roleParam as RoleType)) {
      setValue('role', roleParam as RoleType, { shouldValidate: true });
    }
  }, [searchParams, setValue]);

  // Initialize Turnstile widget
  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_SITE_KEY;

    if (!turnstileLoaded || !window.turnstile || turnstileWidgetId.current) {
      return;
    }

    const container = document.getElementById('turnstile-container');
    if (!container || !siteKey) {
      return;
    }

    try {
      turnstileWidgetId.current = window.turnstile.render(container, {
        sitekey: siteKey,
        callback: (token: string) => {
          setCaptchaToken(token);
        },
        'expired-callback': () => {
          setCaptchaToken(null);
        },
        'error-callback': () => {
          setCaptchaToken(null);
        },
        theme: 'dark',
      });
    } catch (error) {
      console.error('Error rendering Turnstile:', error);
    }

    return () => {
      if (turnstileWidgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(turnstileWidgetId.current);
          turnstileWidgetId.current = null;
        } catch (error) {
          console.error('Error removing Turnstile widget:', error);
        }
      }
    };
  }, [turnstileLoaded]);

  const onSubmit = async (data: LoginFormData) => {
    if (!captchaToken) {
      toast({
        title: "Verification required",
        description: "Please verify that you are not a bot.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await loginMutation.mutateAsync({
        email: data.email,
        password: data.password,
        captchaToken
      });

      const result = response?.login;

      if (!result?.success || !result?.access_token) {
        toast({
          title: 'Login failed',
          description: result?.message || 'Invalid email or password. Please try again.',
          variant: 'destructive'
        });

        // Reset captcha on error
        if (turnstileWidgetId.current && window.turnstile) {
          window.turnstile.reset(turnstileWidgetId.current);
        }
        setCaptchaToken(null);
        setIsLoading(false);
        return;
      }

      setCookie("token", result.access_token, 1);
      const decoded = decodeJwt(result.access_token);
      const role = decoded?.role;

      toast({
        title: 'Login successful!',
        description: result.message || 'Welcome back to LendGrid'
      });

      if (role === "aggregator_admin" || role === "AGGREGATOR_ADMIN") {
        router.push(navigationPaths.aggregator.dashboard);
      } else if (role === "aggregator_member" || role === "AGGREGATOR_MEMBER") {
        router.push(navigationPaths.aggregatorMember.dashboard);
      } else if (role === "super_admin" || role === "SUPER_ADMIN") {
        router.push(navigationPaths.superAdmin.dashboard);
      } else {
        router.push("/");
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error?.response?.data?.message || 'Unable to login. Please try again.';
      toast({
        title: 'Login failed',
        description: errorMessage,
        variant: 'destructive'
      });

      // Reset captcha on error
      if (turnstileWidgetId.current && window.turnstile) {
        window.turnstile.reset(turnstileWidgetId.current);
      }
      setCaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  };

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
            className="flex flex-col items-center gap-3"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center shadow-lg">
                <img
                  src="/f2Fintechlogo.png"
                  alt="LendGrid"
                  className="w-12 h-12 object-contain"
                />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-primary cursor-pointer"
                onClick={() => router.push('/')}
              >
                LendGrid
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Secure access to your dashboard
            </p>
          </motion.div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                className="h-11 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
                placeholder="Enter your email"
                disabled={isLoading}
              />
              {errors.email && (<p className="text-destructive text-sm mt-1 font-medium">{errors.email.message}</p>)}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className="h-11 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </Button>
              </div>
              {errors.password && (<p className="text-destructive text-sm mt-1 font-medium">{errors.password.message}</p>)}
            </div>

            {/* Turnstile Container */}
            <div className="flex justify-center">
              <div id="turnstile-container"></div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !captchaToken}
              className="w-full h-12 mt-2 rounded-xl bg-primary text-primary-foreground text-md font-semibold hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/30 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin text-accent" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5 ml-2 text-accent" />
                </>
              )}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="text-center pt-6 mt-6 border-t border-border">
            <p className="text-muted-foreground text-sm">
              Don't have an account?{' '}
              <Link
                href={`${navigationPaths.signup}?role=${selectedRole || ''}`}
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onReady={() => setTurnstileLoaded(true)}
      />
    </motion.div>
  );
}
