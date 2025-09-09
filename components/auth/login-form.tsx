"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreditCard, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { navigationPaths } from '@/lib/navigation'
import { usersApi } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { CardSkeleton } from '../ui/loading-skeleton'

interface LoginFormData {
  email: string
  password: string
  role: 'super_admin' | 'aggregator_admin' | 'lender_admin'
}

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const [cardsLoading, setCardsLoading] = useState(true)
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<LoginFormData>()
  const selectedRole = watch('role')
  const { toast } = useToast()

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const resp = await usersApi.login({ email: data.email, password: data.password })
      const token = resp?.data?.access_token
      const role = resp?.data?.user?.role as LoginFormData['role'] | undefined
      if (token) localStorage.setItem('token', token)
      if (role) localStorage.setItem('userRole', role)

      switch (role || data.role) {
        case 'super_admin':
          router.push(navigationPaths.superAdmin.dashboard)
          break
        case 'aggregator_admin':
          router.push(navigationPaths.aggregator.dashboard)
          break
        case 'lender_admin':
          router.push(navigationPaths.lender.dashboard)
          break
        default:
          router.push('/')
      }
    } catch (err) {
      console.error(err)
      toast({ title: 'Login failed', description: 'Check your credentials and try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      setCardsLoading(false)
    }, 2000)
    return () => clearTimeout(t)
  }, [])



  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="w-full max-w-md"
    >

      <Card className="enhanced-card">

        <CardHeader className="text-center pb-8">
          <motion.div
            className="flex items-center justify-center space-x-2 mb-6"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="w-12 h-12 bg-gradient-to-r from-gold to-blue rounded-2xl flex items-center justify-center shadow-2xl">
              <CreditCard className="w-7 h-7 text-dark" />
            </div>
            <span className="text-3xl font-bold gradient-text">LendGrid</span>
          </motion.div>
          <CardTitle className="text-3xl text-white font-bold">Welcome Back</CardTitle>
          <CardDescription className="text-gray-400 text-lg">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {cardsLoading ? (
            <CardSkeleton bodyHeight={254} />
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="role" className="text-white font-medium">Role</Label>
                <Select onValueChange={(value) => setValue('role', value as any)}>
                  <SelectTrigger className="glass-input text-white h-12">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-white/10">
                    <SelectItem value="super_admin" className="text-white hover:bg-white/10">Super Admin</SelectItem>
                    <SelectItem value="aggregator_admin" className="text-white hover:bg-white/10">Aggregator Admin</SelectItem>
                    <SelectItem value="lender_admin" className="text-white hover:bg-white/10">Lender Admin</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-red-400 text-sm">{errors.role.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className="glass-input text-white placeholder-gray-400 h-12"
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="text-red-400 text-sm">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                    className="glass-input text-white placeholder-gray-400 pr-12 h-12"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-sm">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Link href={navigationPaths.forgotPassword} className="text-sm text-gold hover:text-gold/80 transition-colors">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary h-12 text-lg font-semibold rounded-xl"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Sign In</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </Button>
            </form>
          )}

          <div className="mt-8 text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link href={navigationPaths.signup} className="text-gold hover:text-gold/80 transition-colors font-medium">
                Sign up
              </Link>
            </p>
          </div>

        </CardContent>
      </Card>

    </motion.div>
  )
}

