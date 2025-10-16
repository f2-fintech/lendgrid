"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CreditCard, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

import { usersApi } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  role: z.enum(['super_admin', 'aggregator_admin', 'lender_admin'], {
    required_error: 'Please select your role'
  })
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur'
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const response = await usersApi.login({
        email: data.email,
        password: data.password
      });

      const result = response?.login;

      if (!result?.success || !result?.access_token) {
        toast({
          title: 'Login failed',
          description: result?.message || 'Invalid email or password. Please try again.',
          variant: 'destructive'
        });
        setIsLoading(false);
        return;
      }

      const token = result.access_token;

      // Store token in cookie for 1 day
      setCookie("token", token, 1);

      // Decode JWT to extract role
      const decoded = decodeJwt(token);
      const role = decoded?.role;

      toast({
        title: 'Login successful!',
        description: result.message || 'Welcome back to LendGrid'
      });

      // Redirect based on role
      if (role === "aggregator_admin" || role === "AGGREGATOR_ADMIN") {
        router.push(navigationPaths.aggregator.dashboard);
      } else if (role === "lender_admin" || role === "LENDER_ADMIN") {
        router.push(navigationPaths.lender.dashboard);
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
            <div className="w-12 h-12 bg-gradient flex items-center justify-center shadow-2xl">
              <img
                src="/logo.png" // Replace with your logo path
                alt="LendGrid Logo"
                className="w-12 h-10 rounded-xl "
              />
            </div>
            <span className="text-2xl font-bold gradient-text text-gold">LendGrid</span>
          </motion.div>
          <CardTitle className="text-3xl font-bold text-white">Welcome Back</CardTitle>
          <CardDescription className="text-gray-400 text-base mt-2">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-gray-300 font-medium">
                Role
              </Label>
              <Select
                onValueChange={(value) => setValue('role', value as 'super_admin' | 'aggregator_admin' | 'lender_admin')}
                disabled={isLoading}
              >
                <SelectTrigger className="glass-input text-black h-11">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent className="glass-card border-white/10">
                  <SelectItem value="super_admin" className="text-black hover:bg-white/10 cursor-pointer">
                    Super Admin
                  </SelectItem>
                  <SelectItem value="aggregator_admin" className="text-black hover:bg-white/10 cursor-pointer">
                    Aggregator Admin
                  </SelectItem>
                  <SelectItem value="lender_admin" className="text-black hover:bg-white/10 cursor-pointer">
                    Lender Admin
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-red-400 text-sm mt-1">{errors.role.message}</p>
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
                className="glass-input text-black placeholder-gray-500 h-11"
                placeholder="Enter your email"
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
                  className="glass-input text-white placeholder-gray-500 pr-11 h-11"
                  placeholder="Enter your password"
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

            {/* Forgot Password Link */}
            {/* <div className="flex items-center justify-end">
              <Link
                href={navigationPaths.forgotPassword}
                className="text-sm text-gold hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div> */}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary h-12 text-gold font-semibold rounded-xl mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin text-gold "/>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5 ml-2 text-gold" />
                </>
              )}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="text-center pt-6 mt-6 border-t border-white/10">
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <Link
                href={navigationPaths.signup}
                className="text-gold hover:underline font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
