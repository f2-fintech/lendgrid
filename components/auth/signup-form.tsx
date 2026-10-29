"use client";

import Link from 'next/link';
import Script from "next/script";
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Smartphone, Users, Building, Tag } from 'lucide-react';

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
  referralCode: z.string().optional(),

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
  const inviteType = searchParams.get('type') || '';
  const parentCompanyName = searchParams.get('c_name') || '';

  // Differentiate between 3 flows:
  // 1. OMS staff referral (OMS- prefix) -> Independent Channel Partner (AGGREGATOR_ADMIN)
  // 2. Team member invite (type=member or c_name present without partner type) -> AGGREGATOR_MEMBER
  // 3. Partner referral (AG- code and type!=member) -> Independent Channel Partner (AGGREGATOR_ADMIN)
  const isOmsReferral = referralCode.toUpperCase().startsWith('OMS-');
  const isMemberInvite = !isOmsReferral && (inviteType === 'member' || (Boolean(parentCompanyName) && inviteType !== 'partner'));
  const isPartnerReferral = Boolean(referralCode) && !isMemberInvite;

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasCompany, setHasCompany] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [turnstileLoaded, setTurnstileLoaded] = useState(false);
  const turnstileWidgetId = useRef<string | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [showAppPrompt, setShowAppPrompt] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent || window.navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|iphone|ipad|ipod/i.test(userAgent);
      if (isMobileDevice) {
        setIsMobile(true);
        setShowAppPrompt(true);
        
        // Attempt automatic deep link redirect
        const deepLinkUrl = `lendgridmobile://signup?ref=${encodeURIComponent(referralCode)}&type=${encodeURIComponent(inviteType || (isMemberInvite ? 'member' : 'partner'))}&c_name=${encodeURIComponent(parentCompanyName)}`;
        const timer = setTimeout(() => {
          window.location.href = deepLinkUrl;
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [referralCode, inviteType, isMemberInvite, parentCompanyName]);

  const handleOpenApp = () => {
    const deepLinkUrl = `lendgridmobile://signup?ref=${encodeURIComponent(referralCode)}&type=${encodeURIComponent(inviteType || (isMemberInvite ? 'member' : 'partner'))}&c_name=${encodeURIComponent(parentCompanyName)}`;
    window.location.href = deepLinkUrl;
  };
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
    defaultValues: {
      referralCode: referralCode || '',
    }
  });

  useEffect(() => {
    if (referralCode) {
      setValue('referralCode', referralCode);
    }
  }, [referralCode, setValue]);

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
    const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    if (!captchaToken && !isLocal) {
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

      // Ensure company name is provided for independent channel partners who have a company
      if (!isMemberInvite && hasCompany && (!data.companyName || !data.companyName.trim())) {
        toast({
          title: "Company name required",
          description: "Please enter your registered firm or agency name.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const resolvedCompanyName = isMemberInvite
        ? (parentCompanyName || `${data.fullName}'s Agency`)
        : hasCompany
          ? data.companyName
          : data.fullName;

      const enteredReferralCode = (data.referralCode || referralCode || '').trim().toUpperCase();

      const payload = {
        username: data.fullName,
        contact: data.contact,
        email: data.email,
        password: data.password,
        role: isMemberInvite ? 'AGGREGATOR_MEMBER' : 'AGGREGATOR_ADMIN',
        aggregatorType: 'CHANNEL_PARTNER',  // to allow backend to auto-create profile of aggregator
        companyName: resolvedCompanyName,
        hasRegisteredBusiness: isMemberInvite ? undefined : hasCompany,
        isOmsEnabled: true,
        fixedCommissionPercent: 0.75,
        referralCode: enteredReferralCode ? enteredReferralCode : undefined,
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
      if (!isMemberInvite && !companyId) {
        throw new Error("Aggregator profile not created");
      }

      // Create Company (REST Api) - Non-blocking (Skip if registering as member)
      if (!isMemberInvite) {
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
            variant: "destructive",
          });
        }
      }

      if (isMemberInvite) {
        toast({
          title: "Team Account Created!",
          description: "You have joined the team. Redirecting to login...",
        });
        router.push(navigationPaths.login);
        return;
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
          {isMobile && showAppPrompt && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Register in LendGrid App</h4>
                  <p className="text-xs text-muted-foreground">Open this link in our mobile app to automatically auto-fill your referral details.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAppPrompt(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Stay on Web
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleOpenApp}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-4 py-2 rounded-lg shadow-sm"
                >
                  Open App
                </Button>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* TWO-COLUMN GRID LAYOUT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Context Banners based on Flow */}
              {isMemberInvite && (
                <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3 md:col-span-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">Team Member Invitation</p>
                    <p className="text-sm font-medium text-foreground">
                      You are joining <span className="font-bold text-primary">{parentCompanyName || 'Aggregator Agency'}</span> as an internal team member.
                    </p>
                  </div>
                </div>
              )}

              {isOmsReferral && (
                <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-3 md:col-span-2">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-purple-400">OMS Staff Referral ({referralCode})</p>
                    <p className="text-sm text-foreground">
                      Enter your firm name below to register as an independent Channel Partner.
                    </p>
                  </div>
                </div>
              )}

              {isPartnerReferral && (
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-3 md:col-span-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">Partner Referral ({referralCode})</p>
                    <p className="text-sm text-foreground">
                      Referred by partner code <span className="font-bold font-mono text-primary">{referralCode}</span>. Enter your company name to establish your agency portal.
                    </p>
                  </div>
                </div>
              )}

              {/* Registered Company vs Freelancer Selector */}
              {!isMemberInvite && (
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-foreground font-medium">
                    Do you have a registered company?
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setHasCompany(true)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                        hasCompany
                          ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary'
                          : 'border-border bg-background/50 text-muted-foreground hover:border-border/80'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${hasCompany ? 'border-primary' : 'border-muted-foreground'}`}>
                        {hasCompany && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Yes, Registered Company</p>
                        <p className="text-xs text-muted-foreground">Firm, Pvt Ltd, LLP, etc.</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setHasCompany(false)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                        !hasCompany
                          ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary'
                          : 'border-border bg-background/50 text-muted-foreground hover:border-border/80'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${!hasCompany ? 'border-primary' : 'border-muted-foreground'}`}>
                        {!hasCompany && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">No, I am a Freelancer</p>
                        <p className="text-xs text-muted-foreground">Individual Channel Partner</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Company Name - Full Width (Visible & required if hasCompany, hidden for freelancer or member) */}
              {!isMemberInvite && hasCompany && (
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="companyName" className="text-foreground font-medium">
                    Company / Firm Name <span className="text-primary">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    {...register('companyName')}
                    className="h-11 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
                    placeholder="e.g. Acme Financial Services"
                    disabled={isLoading}
                  />
                  {errors.companyName && (
                    <p className="text-destructive text-sm mt-1">{errors.companyName.message}</p>
                  )}
                </div>
              )}

              {!isMemberInvite && !hasCompany && (
                <div className="p-3 rounded-xl bg-muted/40 border border-border/60 md:col-span-2 text-xs text-muted-foreground flex items-center gap-2">
                  <span className="text-primary font-bold text-sm">ℹ️</span>
                  <span>Your account will be onboarded under your full name. Business verification documents (like GST & Incorporation certificate) will not be required.</span>
                </div>
              )}

              {/* Referral Code - Visible for independent channel partners */}
              {!isMemberInvite && (
                <div className="space-y-1 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="referralCode" className="text-foreground font-medium flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-primary" />
                      Referral Code <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
                    </Label>
                    {referralCode && (
                      <span className="text-[11px] text-primary font-medium bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                        Applied from link
                      </span>
                    )}
                  </div>
                  <Input
                    id="referralCode"
                    {...register('referralCode')}
                    className="h-11 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground font-mono focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 uppercase"
                    placeholder="e.g. AG-XXXXXX or OMS-XXXXXX"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    If you have a referral code from a Channel Partner or OMS Staff, enter it here.
                  </p>
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
