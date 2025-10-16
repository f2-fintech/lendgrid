"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, CreditCard, Loader2, Building2, Users } from 'lucide-react';

import { usersApi } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { navigationPaths } from '@/lib/navigation';
import { decodeJwt, setCookie } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Validation Schema
const signupSchema = z.object({
  fullName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name is too long')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),

  email: z.string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),

  companyName: z.string()
    .min(2, 'Company name must be at least 2 characters')
    .max(50, 'Company name is too long'),

  userType: z.enum(['aggregator', 'lender'], {
    required_error: 'Please select a user type'
  }),

  password: z.string()
    .min(8, "Password Must Be 8 Characters Long")
    .regex(/[A-Z]/, "Password Must Contain At Least 1 Uppercase Letter")
    .regex(/[a-z]/, "Password Must Contain At Least 1 Lowercase Letter")
    .regex(/[0-9]/, "Password Must Contain At Least 1 Number")
    .regex(/[^\w]/, "Password Must Contain At Least 1 Special Character")
    .max(30, "Password cannot be more than 30 characters"),

  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type SignupFormData = z.infer<typeof signupSchema>;

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onBlur'
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);

    try {
      const roleMap: Record<string, "AGGREGATOR_ADMIN" | "LENDER_ADMIN"> = {
        aggregator: "AGGREGATOR_ADMIN",
        lender: "LENDER_ADMIN",
      };

      const payload = {
        username: data.fullName,
        email: data.email,
        password: data.password,
        companyName: data.companyName,
        role: roleMap[data.userType],
      };

      // Register user
      const createdUser = await usersApi.register(payload);
      const result = createdUser?.createUser;

      // If registration failed, stop here and show toast
      if (!result?.success) {
        toast({
          title: "Signup failed",
          description: result?.message || "Unable to create account.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Auto login after successful registration
      const loginResponse = await usersApi.login({
        email: data.email,
        password: data.password,
      });

      const token = loginResponse?.login?.access_token;

      if (token) {
        // Store token in cookie for 1 day
        setCookie("token", token, 1);

        // Decode JWT to extract role
        const decoded = decodeJwt(token);
        const role = decoded?.role;

        toast({
          title: "Account created successfully!",
          description: "Welcome to LendGrid",
        });

        // Redirect based on role
        if (role === "aggregator_admin" || role === "AGGREGATOR_ADMIN") {
          router.push(navigationPaths.aggregator.dashboard);
        } else if (role === "lender_admin" || role === "LENDER_ADMIN") {
          router.push(navigationPaths.lender.dashboard);
        } else {
          router.push("/");
        }
      } else {
        throw new Error("No token returned from login");
      }
    } catch (error: any) {
      console.error("Signup error:", error);

      const errorMessage =
        error?.response?.data?.message ||
        "Unable to create account. Please try again.";

      toast({
        title: "Signup failed",
        description: errorMessage,
        variant: "destructive",
      });
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
        <CardHeader className="text-center pb-8">
          <motion.div
            className="flex items-center justify-center mb-6"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient items-center justify-center shadow-2xl">
              <img
                src="/logo.png" // Replace with your logo path
                alt="LendGrid Logo"
                className="w-12 h-10 rounded-xl "
              />
            </div>
            <span className="text-2xl font-bold gradient-text text-gold">LendGrid</span>
          </motion.div>
          <CardTitle className="text-3xl font-bold text-white">Join LendGrid</CardTitle>
          <CardDescription className="text-gray-400 text-base mt-2">
            Create your account to get started
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-gray-300 font-medium">
                Full Name
              </Label>
              <Input
                id="fullName"
                {...register('fullName')}
                className="glass-input text-black placeholder-gray-500 h-11"
                placeholder="John Doe"
                disabled={isLoading}
              />
              {errors.fullName && (
                <p className="text-red-400 text-sm mt-1">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                className="glass-input text-white placeholder-gray-500 h-11"
                placeholder="john@company.com"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300 font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className="glass-input text-black placeholder-gray-500 pr-11 h-11"
                  placeholder="Create a strong password"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-black hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </Button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-300 font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  className="glass-input text-white placeholder-gray-500 pr-11 h-11"
                  placeholder="Re-enter your password"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-black hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-400 text-sm mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-gray-300 font-medium">
                Company Name
              </Label>
              <Input
                id="companyName"
                {...register('companyName')}
                className="glass-input text-white placeholder-gray-500 h-11"
                placeholder="Your Company Ltd."
                disabled={isLoading}
              />
              {errors.companyName && (
                <p className="text-red-400 text-sm mt-1">{errors.companyName.message}</p>
              )}
            </div>

            {/* User Type */}
            <div className="space-y-2">
              <Label className="text-gray-300 font-medium">User Type</Label>
              <Select
                onValueChange={(value) => setValue('userType', value as 'aggregator' | 'lender')}
                disabled={isLoading}
              >
                <SelectTrigger className="glass-input text-bg-white/10 h-11">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent className="glass-card border-bg-white/10">
                  <SelectItem value="aggregator" className="text-bg-white/10 hover:bg-white/10 cursor-pointer">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Loan Aggregator
                    </div>
                  </SelectItem>
                  <SelectItem value="lender" className="text-bg-white/10 hover:bg-white/10 cursor-pointer">
                    <div className="flex items-center">
                      <Building2 className="w-4 h-4 mr-2 " />
                      Lender
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.userType && (
                <p className="text-red-400 text-sm mt-1">{errors.userType.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary h-12 text-gold font-semibold rounded-xl mt-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>

            {/* Sign In Link */}
            <div className="text-center pt-4">
              <p className="text-gray-400 text-sm">
                Already have an account?{' '}
                <Link
                  href={navigationPaths.login}
                  className="text-gold hover:underline font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
