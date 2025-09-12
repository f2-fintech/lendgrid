"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { usersApi } from '@/lib/api-client'

const addAggregatorSchema = z.object({
  fullName: z.string().min(2, 'Contact person name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  address: z.string().min(5, 'Please enter a valid address'),
  pincode: z.string().regex(/^\d+$/, 'Pincode must be a number string'),
  gender: z.enum(['male', 'female', 'other']),
  dob: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Date of Birth must be a valid date',
  }),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type AddAggregatorFormData = z.infer<typeof addAggregatorSchema>

export function AddAggregatorDialog() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AddAggregatorFormData>({
    resolver: zodResolver(addAggregatorSchema),
  })

  const onSubmit = async (data: AddAggregatorFormData) => {
    setIsLoading(true)
    try {
      const payload = {
        username: data.fullName,
        email: data.email,
        password: data.password,
        contact: data.phone,
        designation: data.companyName,
        role: 'aggregator_admin',
        address: data.address,
        dob: new Date(data.dob).toISOString(),
        gender: data.gender.toLowerCase(),
        pincode: data.pincode,
      }
      
      await usersApi.register(payload)
      
      toast({ 
        title: 'Success',
        description: 'Aggregator registration successful. An invite email will be sent to the provided email address.',
      })
      
      reset()
      setOpen(false)
    } catch (error) {
      console.error('Add aggregator error:', error)
      toast({ 
        title: 'Error', 
        description: 'Failed to register aggregator. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-gold to-blue text-dark">
          <Plus className="w-4 h-4 mr-2" />
          Add New Aggregator
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add New Aggregator</DialogTitle>
          <DialogDescription className="text-gray-400">
            Register a new loan aggregator to the platform
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-gray-300 font-medium">
                Company Name
              </Label>
              <Input
                id="companyName"
                {...register('companyName')}
                className="glass-input text-white placeholder-gray-400 h-12"
                placeholder="Enter company name"
              />
              {errors.companyName && (
                <p className="text-red-400 text-sm">{errors.companyName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-gray-300 font-medium">
                Contact Person Name
              </Label>
              <Input
                id="fullName"
                {...register('fullName')}
                className="glass-input text-white placeholder-gray-400 h-12"
                placeholder="Enter contact person name"
              />
              {errors.fullName && (
                <p className="text-red-400 text-sm">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                className="glass-input text-white placeholder-gray-400 h-12"
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="text-red-400 text-sm">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-300 font-medium">
                Phone Number
              </Label>
              <Input
                id="phone"
                {...register('phone')}
                className="glass-input text-white placeholder-gray-400 h-12"
                placeholder="Enter phone number"
              />
              {errors.phone && (
                <p className="text-red-400 text-sm">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob" className="text-gray-300 font-medium">
                Date of Birth
              </Label>
              <Input
                id="dob"
                type="date"
                {...register('dob')}
                className="glass-input text-white placeholder-gray-400 h-12"
                placeholder="Select date of birth"
              />
              {errors.dob && (
                <p className="text-red-400 text-sm">{errors.dob.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender" className="text-gray-300 font-medium">
                Gender
              </Label>
              <Select onValueChange={(value) => setValue('gender', value as 'male' | 'female' | 'other')}>
                <SelectTrigger className="glass-input text-white h-12">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="glass-card border-white/10">
                  <SelectItem value="male" className="text-white hover:bg-white/10">Male</SelectItem>
                  <SelectItem value="female" className="text-white hover:bg-white/10">Female</SelectItem>
                  <SelectItem value="other" className="text-white hover:bg-white/10">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && (
                <p className="text-red-400 text-sm">{errors.gender.message}</p>
              )}
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="address" className="text-gray-300 font-medium">
                Address
              </Label>
              <Input
                id="address"
                {...register('address')}
                className="glass-input text-white placeholder-gray-400 h-12"
                placeholder="Enter complete address"
              />
              {errors.address && (
                <p className="text-red-400 text-sm">{errors.address.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pincode" className="text-gray-300 font-medium">
                Pincode
              </Label>
              <Input
                id="pincode"
                {...register('pincode')}
                className="glass-input text-white placeholder-gray-400 h-12"
                placeholder="Enter pincode"
              />
              {errors.pincode && (
                <p className="text-red-400 text-sm">{errors.pincode.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300 font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                className="glass-input text-white placeholder-gray-400 h-12"
                placeholder="Enter password"
              />
              {errors.password && (
                <p className="text-red-400 text-sm">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-300 font-medium">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                className="glass-input text-white placeholder-gray-400 h-12"
                placeholder="Confirm password"
              />
              {errors.confirmPassword && (
                <p className="text-red-400 text-sm">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                reset()
                setOpen(false)
              }}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-gold to-blue text-dark"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding Aggregator...
                </>
              ) : (
                'Add Aggregator'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
