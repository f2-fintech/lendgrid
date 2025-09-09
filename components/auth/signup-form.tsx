"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Eye, EyeOff, CreditCard, Loader2, Building2, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { navigationPaths } from '@/lib/navigation'
import { usersApi } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  userType: z.enum(['aggregator', 'lender'], {
    required_error: 'Please select a user type'
  }),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions'
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

type SignupFormData = z.infer<typeof signupSchema>

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema)
  })

  const userType = watch('userType')

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    try {
      const roleMap: Record<string, 'aggregator_admin' | 'lender_admin'> = {
        aggregator: 'aggregator_admin',
        lender: 'lender_admin',
      }
      const payload = {
        username: data.fullName,
        email: data.email,
        password: data.password,
        contact: data.phone,
        designation: data.companyName,
        role: roleMap[data.userType],
        address: '',
        pincode: 0,
      }
      await usersApi.register(payload)
      const login = await usersApi.login({ email: data.email, password: data.password })
      const token = login?.data?.access_token
      const role = login?.data?.user?.role as 'aggregator_admin' | 'lender_admin' | 'super_admin' | undefined
      if (token) localStorage.setItem('token', token)
      if (role) localStorage.setItem('userRole', role)
      if (role === 'aggregator_admin') router.push(navigationPaths.aggregator.dashboard)
      else if (role === 'lender_admin') router.push(navigationPaths.lender.dashboard)
      else router.push('/')
    } catch (error) {
      console.error('Signup error:', error)
      toast({ title: 'Signup failed', description: 'Please review the form and try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-lg"
    >
      <Card className="enhanced-card">
        <CardHeader className="text-center pb-6">
          <motion.div 
            className="flex items-center justify-center mb-6"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-gold to-blue flex items-center justify-center shadow-2xl">
              <CreditCard className="w-7 h-7 text-dark" />
            </div>
          </motion.div>
          <CardTitle className="text-3xl font-bold text-white">Join LendGrid</CardTitle>
          <CardDescription className="text-gray-400 text-lg">
            Create your account to start connecting with financial partners
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-gray-300 font-medium">Full Name</Label>
              <Input
                id="fullName"
                {...register('fullName')}
                className="glass-input text-white placeholder-gray-400 h-12"
                placeholder="Enter your full name"
              />
              {errors.fullName && (
                <p className="text-red-400 text-sm">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                className="glass-input text-white placeholder-gray-400 h-12"
                placeholder="Enter your email address"
              />
              {errors.email && (
                <p className="text-red-400 text-sm">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-300 font-medium">Phone Number</Label>
              <Input
                id="phone"
                {...register('phone')}
                className="glass-input text-white placeholder-gray-400 h-12"
                placeholder="Enter your phone number"
              />
              {errors.phone && (
                <p className="text-red-400 text-sm">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-gray-300 font-medium">Company Name</Label>
              <Input
                id="companyName"
                {...register('companyName')}
                className="glass-input text-white placeholder-gray-400 h-12"
                placeholder="Enter your company name"
              />
              {errors.companyName && (
                <p className="text-red-400 text-sm">{errors.companyName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300 font-medium">User Type</Label>
              <Select onValueChange={(value) => setValue('userType', value as 'aggregator' | 'lender')}>
                <SelectTrigger className="glass-input text-white h-12">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent className="glass-card border-white/10">
                  <SelectItem value="aggregator" className="text-white hover:bg-white/10">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Loan Aggregator
                    </div>
                  </SelectItem>
                  <SelectItem value="lender" className="text-white hover:bg-white/10">
                    <div className="flex items-center">
                      <Building2 className="w-4 h-4 mr-2" />
                      Lender
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.userType && (
                <p className="text-red-400 text-sm">{errors.userType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300 font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className="glass-input text-white placeholder-gray-400 pr-12 h-12"
                  placeholder="Create a password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </Button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-300 font-medium">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  className="glass-input text-white placeholder-gray-400 pr-12 h-12"
                  placeholder="Confirm your password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-400 text-sm">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="agreeToTerms"
                {...register('agreeToTerms')}
                className="border-gray-600 data-[state=checked]:bg-gold data-[state=checked]:border-gold"
              />
              <Label htmlFor="agreeToTerms" className="text-sm text-gray-300 leading-relaxed">
                I agree to the{' '}
                <Link href="/terms" className="text-gold hover:underline">
                  Terms and Conditions
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-gold hover:underline">
                  Privacy Policy
                </Link>
              </Label>
            </div>
            {errors.agreeToTerms && (
              <p className="text-red-400 text-sm">{errors.agreeToTerms.message}</p>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary h-12 text-lg font-semibold rounded-xl mt-6"
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

            <div className="text-center pt-4">
              <p className="text-gray-400">
                Already have an account?{' '}
                <Link href={navigationPaths.login} className="text-gold hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
