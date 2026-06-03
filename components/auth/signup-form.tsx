"use client";

import Link from 'next/link';
import Script from "next/script";
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { ThemeLogo } from '@/components/theme-logo';
import { useToast } from '@/hooks/use-toast';
import { useRegister, useLogin } from '@/hooks/use-users';
import { navigationPaths } from '@/lib/navigation';
import { decodeJwt, setCookie } from "@/lib/utils";
import { buildHeaders } from "@/lib/http-client";

// --- ROLE MAPPING UTILITY ---
const mapLoginRoleToSignupType = (loginRole: string | null): 'aggregator' | 'lender' | undefined => {
  if (loginRole === 'aggregator_admin') return 'aggregator';
  if (loginRole === 'lender_admin') return 'lender';
  return undefined;
};

// Validation Schema
const signupSchema = z.object({
  fullName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(30, 'Name is too long')
    .trim()
    .toLowerCase()
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),

  contact: z.string()
    .min(9, 'Contact must be at least 9 characters')
    .max(20, 'Contact is too long')
    .regex(/^[0-9]+$/, 'Contact can only contain numbers'),

  email: z.string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),

  companyName: z.string().optional(),

  password: z.string()
    .min(8, "Password Must Be 8 Characters Long")
    .regex(/[A-Z]/, "Password Must Contain At Least 1 Uppercase Letter")
    .regex(/[a-z]/, "Password Must Contain At Least 1 Lowercase Letter")
    .regex(/[0-9]/, "Password Must Contain At Least 1 Number")
    .regex(/[^\w]/, "Password Must Contain At Least 1 Special Character")
    .max(20, "Password cannot be more than 20 characters")
    .trim(),

  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type SignupFormData = z.infer<typeof signupSchema>;

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

export function SignupForm() {
  const searchParams = useSearchParams();
  const referralCode = searchParams.get('ref') || '';
  const parentCompanyName = searchParams.get('c_name') || '';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [turnstileLoaded, setTurnstileLoaded] = useState(false);
  const turnstileWidgetId = useRef<string | null>(null);

  const router = useRouter();
  const registerMutation = useRegister();
  const loginMutation = useLogin();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onBlur',
    defaultValues: {}
  });

  useEffect(() => {
    const roleParam = searchParams.get('role');
    const userType = mapLoginRoleToSignupType(roleParam);
    if (userType) {
      console.log(userType, 'condition')
    }
  }, [searchParams, setValue]);

  // Initialize Turnstile widget
  useEffect(() => {
    if (!turnstileLoaded || !window.turnstile || turnstileWidgetId.current) {
      return;
    }

    const container = document.getElementById('turnstile-container');
    if (!container) {
      return;
    }

    try {
      turnstileWidgetId.current = window.turnstile.render(container, {
        sitekey: process.env.NEXT_PUBLIC_CLOUDFLARE_SITE_KEY,
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

  const onSubmit = async (data: SignupFormData) => {
    if (!captchaToken) {
      toast({
        title: "Verification required",
        description: "Please verify that you are not a bot.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    const DEFAULT_BASE_URL_REST =
      process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3010/api/v1";

    try {
      const roleMap: Record<string, "AGGREGATOR_ADMIN" | "LENDER_ADMIN"> = {
        aggregator: "AGGREGATOR_ADMIN",
        lender: "LENDER_ADMIN",
      };

      const payload = {
        username: data.fullName,
        contact: data.contact,
        email: data.email,
        password: data.password,
        role: referralCode ? 'AGGREGATOR_MEMBER' : 'AGGREGATOR_ADMIN',
        aggregatorType: 'CHANNEL_PARTNER',  // to allow backend to auto-create profile of aggregator
        companyName: parentCompanyName || data.companyName,        // to allow backend to auto-create profile of aggregator
        isOmsEnabled: true,
        fixedCommissionPercent: 0.75,
        referralCode: referralCode ? referralCode : undefined,
        captchaToken
      };

      const registerUserResponse = await registerMutation.mutateAsync(payload);
      const result = (registerUserResponse as any)?.createUser;

      if (!result?.success) {
        toast({
          title: "Signup failed",
          description: result?.message || "Unable to create account.",
          variant: "destructive",
        });

        // Reset captcha on error
        if (turnstileWidgetId.current && window.turnstile) {
          window.turnstile.reset(turnstileWidgetId.current);
        }
        setCaptchaToken(null);
        setIsLoading(false);
        return;
      }

      const { companyId } = result;
      if (!companyId) {
        throw new Error("Aggregator profile not created");
      }

      // Create Company (REST Api) - Non-blocking (Skip if registering as member)
      if (!referralCode) {
        try {
          const companyRes = await fetch(`${DEFAULT_BASE_URL_REST}/companies`, {
            method: "POST",
            headers: buildHeaders(),
            body: JSON.stringify({
              name: data.companyName || `${data.fullName}'s Agency`,
              email: data.email,
              contactNumber: data.contact,
              companyId,
            }),
          });

          if (!companyRes.ok) {
            console.warn("Company creation failed:", await companyRes.text());
            toast({
              title: "Company Sync Warning",
              description: "Account created but company profile sync failed. Please contact support.",
              variant: "destructive",
            });
          }
        } catch (companyError) {
          console.error("Company creation error:", companyError);
          toast({
            title: "Company Sync Skipped",
            description: "Secondary server unavailable. Account created locally.",
            variant: "destructive", // Using destructive to catch attention
          });
        }
      }

      // Auto-login without captcha (already verified during signup)
      const loginResponse = await loginMutation.mutateAsync({
        email: data.email,
        password: data.password,
        captchaToken: '' // Empty token signals auto-login
      });

      const loginResult = (loginResponse as any)?.login;

      // Check if login was successful
      if (!loginResult?.success) {
        toast({
          title: "Login failed after registration",
          description: loginResult?.message || "Unable to login. Please try logging in manually.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const token = loginResult?.access_token;
      if (token) {
        setCookie("lendgrid_cookie", token, 1);
        const decoded = decodeJwt(token);
        const role = decoded?.role;

        toast({
          title: "Account created successfully!",
          description: "Welcome to LendGrid",
        });

        if (role === "aggregator_admin" || role === "AGGREGATOR_ADMIN") {
          router.push(navigationPaths.aggregator.dashboard);
        } else if (role === "aggregator_member" || role === "AGGREGATOR_MEMBER") {
          router.push(navigationPaths.aggregatorMember.applications);
        } else if (role === "super_admin" || role === "SUPER_ADMIN") {
          router.push(navigationPaths.superAdmin.dashboard);
        } else {
          router.push("/");
        }
      } else {
        throw new Error("No token returned from login");
      }
    } catch (error: any) {
      console.error("Signup error:", error);

      const errorMessage =
        error?.message ||
        error?.response?.data?.message ||
        "Unable to create account. Please try again.";

      toast({
        title: "Signup failed",
        description: errorMessage,
        variant: "destructive",
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
      className="w-full max-w-3xl"
    >
      <Card className="professional-card">
        <CardHeader className="text-center pt-2 pb-2">
          <motion.div
            className="flex items-center justify-center"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center shadow-lg">
              <ThemeLogo
                alt="F2Fintech Logo"
                className="w-12 h-12 rounded-xl object-contain"
              />
            </div>
            <span
              className="text-2xl font-bold text-primary cursor-pointer ml-3"
              onClick={() => router.push('/')}
            >
              LendGrid
            </span>
          </motion.div>
          <CardDescription className="text-muted-foreground text-base">
            Create your account to get started
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* TWO-COLUMN GRID LAYOUT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Referred By - Full Width - Only show if referralCode exists */}
              {referralCode && (
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-foreground font-medium">Referred By</Label>
                  <Input
                    className="h-11 rounded-xl bg-muted border border-border text-primary font-bold placeholder:text-muted-foreground focus-visible:ring-0 opacity-100"
                    value={`${referralCode}${parentCompanyName ? ` (${parentCompanyName})` : ''}`}
                    disabled={true}
                  />
                </div>
              )}

              {/* Company Name - Full Width (Hide if member) */}
              {!referralCode && (
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="companyName" className="text-foreground font-medium">
                    Company Name
                  </Label>
                  <Input
                    id="companyName"
                    {...register('companyName', { required: !referralCode ? 'Company name is required' : false })}
                    className="h-11 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
                    placeholder="Your Company Ltd."
                    disabled={isLoading}
                  />
                  {errors.companyName && (
                    <p className="text-destructive text-sm mt-1">{errors.companyName.message}</p>
                  )}
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1">
                <Label htmlFor="fullName" className="text-foreground font-medium">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  {...register('fullName')}
                  className="h-11 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
                  placeholder="ABC"
                  disabled={isLoading}
                />
                {errors.fullName && (
                  <p className="text-destructive text-sm mt-1">{errors.fullName.message}</p>
                )}
              </div>

              {/* Contact */}
              <div className="space-y-1">
                <Label htmlFor="contact" className="text-foreground font-medium">
                  Phone Number
                </Label>
                <Input
                  id="contact"
                  {...register('contact')}
                  className="h-11 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
                  placeholder="9876543210"
                  disabled={isLoading}
                />
                {errors.contact && (
                  <p className="text-destructive text-sm mt-1">{errors.contact.message}</p>
                )}
              </div>

              {/* Email - Full Width */}
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="email" className="text-foreground font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  className="h-11 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
                  placeholder="abc@company.com"
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-destructive text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <Label htmlFor="password" className="text-foreground font-medium">
                  Set Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className="h-11 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 pr-11"
                    placeholder="Create a strong password"
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
                {errors.password && (
                  <p className="text-destructive text-sm mt-1">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <Label htmlFor="confirmPassword" className="text-foreground font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    className="h-11 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 pr-11"
                    placeholder="Re-enter your password"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-destructive text-sm mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Turnstile Container */}
            <div className="flex justify-center">
              <div id="turnstile-container"></div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !captchaToken}
              className="w-full h-12 mt-2 rounded-xl bg-primary text-primary-foreground text-md hover:bg-primary/90 font-semibold transition-all duration-200 shadow-lg shadow-primary/30 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin text-accent" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>

            {/* Sign In Link */}
            <div className="text-center pt-2 border-t border-border">
              <p className="text-muted-foreground text-sm">
                Already have an account?{' '}
                <Link
                  href={navigationPaths.login}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="lazyOnload"
        onReady={() => {
          setTurnstileLoaded(true);
        }}
      />
    </motion.div>
  );
}
