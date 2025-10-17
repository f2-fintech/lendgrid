"use client"

import { useState, useEffect } from 'react'
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

const addLenderSchema = z.object({
  fullName: z.string().min(2, 'Contact person name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  lenderType: z.enum(['Bank', 'NBFC', 'Fintech']),
  address: z.string().min(5, 'Please enter a valid address'),
  pincode: z.string().regex(/^\d+$/, 'Pincode must be a number string'),
  gender: z.enum(['male', 'female', 'other']),
  dob: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Date of Birth must be a valid date',
  }),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type AddLenderFormData = z.infer<typeof addLenderSchema>

export function AddLenderDialog({ lender, onLenderUpdated }: { lender?: any, onLenderUpdated?: () => void }) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AddLenderFormData>({
    resolver: zodResolver(addLenderSchema),
  })

  useEffect(() => {
    if (open && lender) {
      reset({
        fullName: lender.name,
        email: lender.email,
        phone: lender.phone,
        companyName: lender.designation,
        lenderType: lender.type,
        address: lender.address,
        pincode: lender.pincode,
        gender: lender.gender,
        dob: lender.dob ? new Date(lender.dob).toISOString().split('T')[0] : '',
      })
    } else if (open && !lender) {
      reset()
    }
  }, [lender, open, reset])

  const onSubmit = async (data: AddLenderFormData) => {
    setIsLoading(true)
    try {
      const payload: any = {
        id: lender?.id,
        username: data.fullName,
        email: data.email,
        contact: data.phone,
        designation: data.companyName,
        role: 'LENDER_ADMIN',
        address: data.address,
        dob: new Date(data.dob).toISOString(),
        gender: data.gender.toUpperCase(),
        pincode: data.pincode,
        lenderType: data.lenderType,
      }

      if (data.password) {
        payload.password = data.password
      }

      if (lender) {
        console.log('Update payload:', payload, data, lender)
        await usersApi.updateUser(payload)
        toast({
          title: 'Success',
          description: 'Lender updated successfully.',
        })
        if (onLenderUpdated) {
          onLenderUpdated()
        }
      } else {
        await usersApi.register(payload)
        toast({
          title: 'Success',
          description: 'Lender registration successful. An invite email will be sent to the provided email address.',
        })
        if (onLenderUpdated) {
          onLenderUpdated()
        }
      }

      reset()
      setOpen(false)
    } catch (error) {
      console.error('Add/Update lender error:', error)
      toast({
        title: 'Error',
        description: `Failed to ${lender ? 'update' : 'register'} lender. Please try again.`,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {lender ? (
          <Button variant="ghost" size="sm">Edit</Button>
        ) : (
          <Button className="bg-gradient-to-r from-blue to-cyan-500 text-dark">
            <Plus className="w-4 h-4 mr-2" />
            Add New Lender
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-4xl w-[95%] max-h-[95vh] overflow-y-auto rounded-xl"
>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{lender ? 'Edit Lender' : 'Add New Lender'}</DialogTitle>
          <DialogDescription className="text-gray-400">
            {lender ? 'Update the details of the existing lending partner.' : 'Register a new lending partner to the platform'}
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
                className="glass-input text-black placeholder-gray-400 h-12"
                placeholder="Enter company name"
              />
              {errors.companyName && (
                <p className="text-red-400 text-sm">{errors.companyName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lenderType" className="text-gray-300 font-medium">
                Lender Type
              </Label>
              <Select onValueChange={(value) => setValue('lenderType', value as 'Bank' | 'NBFC' | 'Fintech')}>
                <SelectTrigger className="glass-input text-gray-500 h-12">
                  <SelectValue placeholder="Select lender type" />
                </SelectTrigger>
                <SelectContent className="glass-card border-white/10">
                  <SelectItem value="Bank" className="text-black hover:bg-white/10">Bank</SelectItem>
                  <SelectItem value="NBFC" className="text-black hover:bg-white/10">NBFC</SelectItem>
                  <SelectItem value="Fintech" className="text-black hover:bg-white/10">Fintech</SelectItem>
                </SelectContent>
              </Select>
              {errors.lenderType && (
                <p className="text-red-400 text-sm">{errors.lenderType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-gray-300 font-medium">
                Contact Person Name
              </Label>
              <Input
                id="fullName"
                {...register('fullName')}
                className="glass-input text-black placeholder-gray-400 h-12"
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
                className="glass-input text-black placeholder-gray-400 h-12"
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
                className="glass-input text-black placeholder-gray-400 h-12"
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
                className="glass-input text-black placeholder-gray-400 h-12"
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
                <SelectTrigger className="glass-input text-gray-500 h-12">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="glass-card border-white/10">
                  <SelectItem value="male" className="text-black hover:bg-white/10">Male</SelectItem>
                  <SelectItem value="female" className="text-black hover:bg-white/10">Female</SelectItem>
                  <SelectItem value="other" className="text-black hover:bg-white/10">Other</SelectItem>
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
                className="glass-input text-black placeholder-gray-400 h-12"
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
                className="glass-input text-black placeholder-gray-400 h-12"
                placeholder="Enter pincode"
              />
              {errors.pincode && (
                <p className="text-red-400 text-sm">{errors.pincode.message}</p>
              )}
            </div>

            {!lender && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300 font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    {...register('password')}
                    className="glass-input text-black placeholder-gray-400 h-12"
                    placeholder="Enter new password (optional)"
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
                    className="glass-input text-black placeholder-gray-400 h-12"
                    placeholder="Confirm new password"
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-400 text-sm">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </>
            )}
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
              className="bg-gradient-to-r from-blue to-cyan-500 text-dark"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {lender ? 'Updating Lender...' : 'Adding Lender...'}
                </>
              ) : (
                lender ? 'Update Lender' : 'Add Lender'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
