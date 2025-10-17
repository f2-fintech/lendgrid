"use client"

import { useEffect, useState } from 'react'
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

interface EditAggregatorData {
    _id: string
    username: string
    email: string
    contact: string
    gender?: string
    dob?: string
    address?: string
    pincode?: string
    companyName?: string
}

interface AddAggregatorDialogProps {
    onSuccess?: () => void
    editData?: EditAggregatorData | null  // Make it explicitly nullable
    mode?: 'add' | 'edit'
    isOpen?: boolean
    onClose?: () => void  // Add this new prop
}

// Replace the existing schema with conditional validatio

export function AddAggregatorDialog({
    onSuccess,
    editData,
    mode = 'add',
    isOpen = false,
    onClose  // ✅ defined here    
}: AddAggregatorDialogProps = {}) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()

    const addAggregatorSchema = z.object({
        fullName: z.string().min(2, 'Person Name must be at least 2 characters'),
        email: z.string().email('Please enter a valid email address'),
        phone: z.string().min(10, 'Phone number must be at least 10 digits'),
        companyName: z.string().min(2, 'Company name must be at least 2 characters'),
        address: z.string().min(5, 'Please enter a valid address'),
        pincode: z.string().regex(/^\d+$/, 'Pincode must be a number string'),
        gender: z.enum(['male', 'female', 'other']),
        dob: z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: 'Date of Birth must be a valid date',
        }),
        password: z.string().optional(),
        confirmPassword: z.string().optional(),
    }).superRefine((data, ctx) => {
        // Only validate passwords in add mode
        if (mode === 'add') {
            if (!data.password || data.password.length < 8) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Password must be at least 8 characters',
                    path: ['password'],
                })
            }
            if (data.password !== data.confirmPassword) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Passwords don't match",
                    path: ['confirmPassword'],
                })
            }
        }
    })

    type AddAggregatorFormData = z.infer<typeof addAggregatorSchema>

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors },
    } = useForm<AddAggregatorFormData>({
        resolver: zodResolver(addAggregatorSchema),
        defaultValues: mode === 'edit' && editData ? {
            fullName: editData.username,
            email: editData.email,
            phone: editData.contact,
            companyName: editData.designation || '',
            address: editData.address || '',
            pincode: editData.pincode || '',
            gender: (editData.gender as 'male' | 'female' | 'other') || 'male',
            dob: editData.dob ? new Date(editData.dob).toISOString().split('T')[0] : '',
        } : undefined
    })

    // useEffect(() => {
    //     if (mode === 'edit') {
    //         setOpen(true)
    //     }
    // }, [mode])

    useEffect(() => {
        if (mode === 'edit' && editData) {
            setValue('fullName', editData.username)
            setValue('email', editData.email)
            setValue('phone', editData.contact)
            setValue('companyName', editData.designation || '')
            setValue('address', editData.address || '')
            setValue('pincode', editData.pincode || '')
            setValue('gender', (editData.gender as 'male' | 'female' | 'other') || 'male')
            setValue('dob', editData.dob ? new Date(editData.dob).toISOString().split('T')[0] : '')
        } else {
            // ✅ RESET form when switching to 'add' mode or closing
            reset();
        }
    }, [editData, mode, setValue, reset, isOpen])

    const onSubmit = async (data: AddAggregatorFormData) => {
        setIsLoading(true)
        try {
            if (mode === 'add') {
                const payload = {
                    username: data.fullName,
                    email: data.email,
                    password: data.password!,
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
                    description: 'Aggregator registration successful.',
                })
            } else {
                // Edit mode
                const payload = {
                    id: editData!._id,
                    username: data.fullName,
                    email: data.email,
                    contact: data.phone,
                    designation: data.companyName,
                    address: data.address,
                    pincode: data.pincode,
                    gender: data.gender.toLowerCase(),
                    dob: new Date(data.dob).toISOString(),
                }

                await usersApi.updateUser(payload)

                toast({
                    title: 'Success',
                    description: 'Aggregator updated successfully.',
                })
            }

            reset()
            setOpen(false)
            onSuccess?.()
            onClose?.()
            reset();
        } catch (error) {
            console.error(`${mode} aggregator error:`, error)
            toast({
                title: 'Error',
                description: `Failed to ${mode} aggregator. Please try again.`,
                variant: 'destructive'
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(newOpen) => {
            // setOpen(newOpen)
            if (!newOpen) {
                onClose?.() // Call onClose when dialog is closed
            }
        }}>
            <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                        {mode === 'add' ? 'Add New Aggregator' : 'Edit Aggregator'}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        {mode === 'add'
                            ? 'Register a new loan aggregator to the platform'
                            : 'Update aggregator information'
                        }
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
                            <Select
                                onValueChange={(value) => setValue('gender', value as 'male' | 'female' | 'other')}
                                defaultValue={mode === 'edit' && editData?.gender ? editData.gender : undefined}
                            >
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

                        {mode === 'add' && (
                            <>
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
                            </>
                        )}
                    </div>

                    <div className="flex justify-end space-x-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                onClose?.() // Add this line
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
                                    {mode === 'add' ? 'Adding Aggregator...' : 'Updating Aggregator...'}
                                </>
                            ) : (
                                mode === 'add' ? 'Add Aggregator' : 'Update Aggregator'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
