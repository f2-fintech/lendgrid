"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Link from "next/link";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Users,
  UserCheck,
} from "lucide-react";

import { useLogin } from "@/hooks/use-users";
import { omsAuthApi } from "@/lib/oms-auth-api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { navigationPaths } from "@/lib/navigation";
import { decodeJwt, setCookie } from "@/lib/utils";
import { ThemeLogo } from "@/components/theme-logo";

// Employee login has looser password validation (OMS passwords may not meet same rules)
const employeeLoginSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .toLowerCase()
    .trim(),
  password: z.string().min(1, "Password is required"),
});

// User login schema (strict)
const userLoginSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, "Password Must Be 8 Characters Long")
    .regex(/[A-Z]/, "Password Must Contain At Least 1 Uppercase Letter")
    .regex(/[a-z]/, "Password Must Contain At Least 1 Lowercase Letter")
    .regex(/[0-9]/, "Password Must Contain At Least 1 Number")
    .regex(/[^\w]/, "Password Must Contain At Least 1 Special Character")
    .max(30, "Password cannot be more than 30 characters"),
  role: z
    .enum([
      "super_admin",
      "aggregator_admin",
      "aggregator_member",
      "lender_admin",
    ])
    .optional(),
});

type UserLoginFormData = z.infer<typeof userLoginSchema>;
type EmployeeLoginFormData = z.infer<typeof employeeLoginSchema>;
type RoleType = UserLoginFormData["role"];
type LoginType = "user" | "employee";

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
  const [loginType, setLoginType] = useState<LoginType>("user");
  const turnstileWidgetId = useRef<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const loginMutation = useLogin();
  const { toast } = useToast();

  // User login form
  const userForm = useForm<UserLoginFormData>({
    resolver: zodResolver(userLoginSchema),
    mode: "onBlur",
    defaultValues: { email: "", password: "" },
  });

  // Employee login form (separate form instance)
  const employeeForm = useForm<EmployeeLoginFormData>({
    resolver: zodResolver(employeeLoginSchema),
    mode: "onBlur",
    defaultValues: { email: "", password: "" },
  });

  const {
    register: userRegister,
    handleSubmit: userHandleSubmit,
    setValue,
    watch,
    formState: { errors: userErrors },
  } = userForm;
  const {
    register: empRegister,
    handleSubmit: empHandleSubmit,
    formState: { errors: empErrors },
  } = employeeForm;

  const selectedRole = watch("role");

  useEffect(() => {
    const roleParam = searchParams.get("role");
    const validRoles: RoleType[] = [
      "super_admin",
      "aggregator_admin",
      "aggregator_member",
      "lender_admin",
    ];
    if (roleParam && validRoles.includes(roleParam as RoleType)) {
      setValue("role", roleParam as RoleType, { shouldValidate: true });
    }
  }, [searchParams, setValue]);

  // Initialize Turnstile widget (only for user login)
  useEffect(() => {
    if (loginType !== "user") return;

    const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_SITE_KEY;
    if (!turnstileLoaded || !window.turnstile || turnstileWidgetId.current)
      return;

    const container = document.getElementById("turnstile-container");
    if (!container || !siteKey) return;

    try {
      turnstileWidgetId.current = window.turnstile.render(container, {
        sitekey: siteKey,
        callback: (token: string) => {
          setCaptchaToken(token);
        },
        "expired-callback": () => {
          setCaptchaToken(null);
        },
        "error-callback": () => {
          setCaptchaToken(null);
        },
        theme: "dark",
      });
    } catch (error) {
      console.error("Error rendering Turnstile:", error);
    }

    return () => {
      if (turnstileWidgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(turnstileWidgetId.current);
          turnstileWidgetId.current = null;
        } catch (error) {
          console.error("Error removing Turnstile widget:", error);
        }
      }
    };
  }, [turnstileLoaded, loginType]);

  // ── User Login ──────────────────────────────────────────────────────────────
  const onUserSubmit = async (data: UserLoginFormData) => {
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
    try {
      const response = await loginMutation.mutateAsync({
        email: data.email,
        password: data.password,
        captchaToken,
      });
      const result = response?.login;

      if (!result?.success || !result?.access_token) {
        toast({
          title: "Login failed",
          description: result?.message || "Invalid email or password.",
          variant: "destructive",
        });
        if (turnstileWidgetId.current && window.turnstile)
          window.turnstile.reset(turnstileWidgetId.current);
        setCaptchaToken(null);
        setIsLoading(false);
        return;
      }

      setCookie("lendgrid_cookie", result.access_token, 1);
      const decoded = decodeJwt(result.access_token);
      const role = decoded?.role;
      toast({
        title: "Login successful!",
        description: result.message || "Welcome back to LendGrid",
      });

      const nextParam = searchParams.get("next");

      if (nextParam) {
        router.push(nextParam);
      } else if (role === "aggregator_admin" || role === "AGGREGATOR_ADMIN") {
        router.push(navigationPaths.aggregator.dashboard);
      } else if (role === "aggregator_member" || role === "AGGREGATOR_MEMBER") {
        router.push(navigationPaths.aggregatorMember.applications);
      } else if (role === "super_admin" || role === "SUPER_ADMIN") {
        router.push(navigationPaths.superAdmin.dashboard);
      } else {
        router.push("/");
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error?.message || "Unable to login. Please try again.",
        variant: "destructive",
      });
      if (turnstileWidgetId.current && window.turnstile)
        window.turnstile.reset(turnstileWidgetId.current);
      setCaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Employee Login (OMS) ───────────────────────────────────────────────────────────
  const onEmployeeSubmit = async (data: EmployeeLoginFormData) => {
    setIsLoading(true);
    try {
      const result = await omsAuthApi.login({
        email: data.email,
        password: data.password,
      });

      if (!result?.access_token) {
        toast({
          title: "Login failed",
          description: "Invalid email or password.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Verify if the user has the 'sales' role before proceeding
      const decoded = decodeJwt(result.access_token);
      const omsRole = decoded?.role?.toLowerCase();

      if (omsRole !== 'sales') {
        toast({
          title: "Access Denied",
          description: "Only OMS staff with the 'Sales' role are authorized to login here.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Store standard user token, since Lendgrid treats OMS staff interchangeably
      setCookie("lendgrid_cookie", result.access_token, 1);
      toast({
        title: "Login successful!",
        description: "Welcome! Redirecting to Sales Workspace...",
      });

      // Wait a bit to ensure the cookie propagates for next navigation
      setTimeout(() => {
        router.push(navigationPaths.lendgridSales.dashboard);
      }, 500);

    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error?.response?.data?.message || error?.message || "Unable to login. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isEmployee = loginType === "employee";

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
                <ThemeLogo
                  alt="LendGrid"
                  className="w-12 h-12 object-contain"
                />
              </div>
              <h1
                className="text-3xl font-bold tracking-tight text-primary cursor-pointer"
                onClick={() => router.push("/")}
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
          {/* Login Type Toggle */}
          <div className="flex rounded-xl border border-border overflow-hidden mb-6">
            <button
              type="button"
              onClick={() => setLoginType("user")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all duration-200 ${!isEmployee
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
            >
              <Users className="w-4 h-4" />
              User Login
            </button>
            <button
              type="button"
              onClick={() => setLoginType("employee")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all duration-200 ${isEmployee
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
            >
              <UserCheck className="w-4 h-4" />
              OMS Staff
            </button>
          </div>

          {/* ── USER LOGIN FORM ── */}
          {!isEmployee && (
            <form
              onSubmit={userHandleSubmit(onUserSubmit)}
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label
                  htmlFor="user-email"
                  className="text-foreground font-medium"
                >
                  Email Address
                </Label>
                <Input
                  id="user-email"
                  type="email"
                  {...userRegister("email")}
                  className="h-11 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
                {userErrors.email && (
                  <p className="text-destructive text-sm mt-1 font-medium">
                    {userErrors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="user-password"
                  className="text-foreground font-medium"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="user-password"
                    type={showPassword ? "text" : "password"}
                    {...userRegister("password")}
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
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </Button>
                </div>

                <div className="flex justify-end mt-1">
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary hover:underline font-medium transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>

                {userErrors.password && (
                  <p className="text-destructive text-sm mt-1 font-medium">
                    {userErrors.password.message}
                  </p>
                )}
              </div>

              <div className="flex justify-center">
                <div id="turnstile-container"></div>
              </div>

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
          )}

          {/* ── EMPLOYEE LOGIN FORM ── */}
          {isEmployee && (
            <form
              onSubmit={empHandleSubmit(onEmployeeSubmit)}
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label
                  htmlFor="emp-email"
                  className="text-foreground font-medium"
                >
                  Work Email
                </Label>
                <Input
                  id="emp-email"
                  type="email"
                  {...empRegister("email")}
                  className="h-11 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
                  placeholder="Enter your work email"
                  disabled={isLoading}
                />
                {empErrors.email && (
                  <p className="text-destructive text-sm mt-1 font-medium">
                    {empErrors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="emp-password"
                  className="text-foreground font-medium"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="emp-password"
                    type={showPassword ? "text" : "password"}
                    {...empRegister("password")}
                    className="h-11 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
                    placeholder="Enter your OMS password"
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
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </Button>
                </div>

                <div className="flex justify-end mt-1">
                  <Link
                    href="/forgot-password?role=employee"
                    className="text-xs text-primary hover:underline font-medium transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>
                {empErrors.password && (
                  <p className="text-destructive text-sm mt-1 font-medium">
                    {empErrors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 mt-2 rounded-xl bg-primary text-primary-foreground text-md font-semibold hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/30 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin text-accent" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In as OMS Staff
                    <ArrowRight className="w-5 h-5 ml-2 text-accent" />
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground pt-1">
                Use your OMS Admin credentials to login
              </p>
            </form>
          )}

          {/* Sign Up Link (users only) */}
          {!isEmployee && (
            <div className="text-center pt-6 mt-6 border-t border-border space-y-2.5">
              <p className="text-muted-foreground text-sm">
                Don't have an account?{" "}
                <Link
                  href={`${navigationPaths.signup}?role=${selectedRole || ""}`}
                  className="text-primary hover:underline font-medium"
                >
                  Sign up
                </Link>
              </p>
              <div>
                <Link
                  href="/delete-account"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Request Delete Account
                </Link>
              </div>
            </div>
          )}
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
