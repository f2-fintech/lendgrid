"use client"

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

import { useRegister, useUpdateUser, useProfile } from '@/hooks/use-users'
import { useAddTeamMember, useMyAggregatorProfile } from '@/hooks/use-aggregators'
import { useAuth } from '@/lib/auth'

type RoleValueLower = 'aggregator_admin' | 'aggregator_member'
type RoleEnumUpper = 'AGGREGATOR_ADMIN' | 'AGGREGATOR_MEMBER'
type GenderLower = 'male' | 'female' | 'other'
type GenderEnumUpper = 'MALE' | 'FEMALE' | 'OTHER'

const toGraphQLRole = (r: RoleValueLower): RoleEnumUpper =>
    r.toUpperCase() as RoleEnumUpper
const toGraphQLGender = (g: GenderLower): GenderEnumUpper =>
    g.toUpperCase() as GenderEnumUpper

interface EditAggregatorData {
    _id: string
    username: string
    email: string
    contact: string
    gender?: GenderLower | GenderEnumUpper
    dob?: string
    address?: string
    pincode?: string | number
    companyName?: string
    role?: RoleValueLower | RoleEnumUpper
}

interface AddAggregatorDialogProps {
    onSuccess?: () => void
    editData?: EditAggregatorData | null
    mode?: 'add' | 'edit'
    isOpen?: boolean
    onClose?: () => void
}

export function AddAggregatorDialog({
    onSuccess,
    editData,
    mode = 'add',
    isOpen = false,
    onClose
}: AddAggregatorDialogProps = {}) {
    const { user } = useAuth()
    const { toast } = useToast()
    const [addToTeam, setAddToTeam] = useState(false)

    // Logged-in user (for super admin or aggregator admin)
    const { data: userProfile } = useProfile(true)
    // Aggregator admin's profile (to link members)
    const { data: myAggregatorProfile } = useMyAggregatorProfile(true);
    const registerMutation = useRegister()
    const updateUserMutation = useUpdateUser()
    const addTeamMemberMutation = useAddTeamMember()

    const addAggregatorSchema = z
        .object({
            fullName: z.string().min(2, 'Person Name must be at least 2 characters'),
            email: z.string().email('Please enter a valid email address'),
            phone: z.string().min(10, 'Phone number must be at least 10 digits'),
            companyName: z.string().min(2, 'Company name must be at least 2 characters'),
            address: z.string().min(5, 'Please enter a valid address'),
            pincode: z.string().regex(/^\d+$/, 'Pincode must be numeric'),
            gender: z.enum(['male', 'female', 'other']),
            dob: z.string().refine((val) => !isNaN(Date.parse(val)), {
                message: 'Date of Birth must be valid',
            }),
            role: z.enum(['aggregator_admin', 'aggregator_member'], {
                required_error: 'Please select role',
            }),
            password: z.string().optional(),
            confirmPassword: z.string().optional(),
        })
        .superRefine((data, ctx) => {
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

    type FormData = z.infer<typeof addAggregatorSchema>

    const defaultRole: RoleValueLower =
        (editData?.role?.toString().toLowerCase() as RoleValueLower) || 'aggregator_admin'

    const defaultValues = useMemo(() => {
        if (mode === 'edit' && editData) {
            return {
                fullName: editData.username,
                email: editData.email,
                phone: editData.contact,
                companyName: editData.companyName || '',
                address: editData.address || '',
                pincode: String(editData.pincode ?? ''),
                gender: (editData.gender?.toString().toLowerCase() as GenderLower) || 'male',
                dob: editData.dob ? new Date(editData.dob).toISOString().split('T')[0] : '',
                role: defaultRole,
            }
        }
        return { role: 'aggregator_admin', gender: 'male' }
    }, [mode, editData, defaultRole])

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        resolver: zodResolver(addAggregatorSchema),
        defaultValues,
    })

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && editData) reset(defaultValues)
            else reset({ role: 'aggregator_admin', gender: 'male' })
        }
    }, [isOpen, mode, editData, reset, defaultValues])

    const onSubmit = async (data: FormData) => {
        const dobIso = new Date(data.dob).toISOString()
        const roleEnum = toGraphQLRole(data.role)
        const genderEnum = toGraphQLGender(data.gender)

        try {
            if (mode === 'add') {
                const payload = {
                    companyName: data.companyName,
                    username: data.fullName,
                    email: data.email,
                    contact: data.phone,
                    password: data.password!,
                    dob: dobIso,
                    address: data.address,
                    role: roleEnum,
                    gender: genderEnum,
                    pincode: Number(data.pincode),
                }

                const res: any = await registerMutation.mutateAsync(payload)
                if (res?.createUser?.success && res?.createUser?.user?._id) {
                    const newUserId = res.createUser.user._id

                    // If adding aggregator_member and toggle ON → link to admin's team
                    if (data.role === 'aggregator_member' && addToTeam && myAggregatorProfile?._id) {
                        await addTeamMemberMutation.mutateAsync({
                            id: myAggregatorProfile._id,
                            userId: newUserId,
                        })
                        toast({
                            title: 'Team Linked',
                            description: 'Member successfully added to your team.',
                        })
                    }

                    toast({ title: 'Success', description: 'Aggregator created successfully!' })
                    onSuccess?.()
                    onClose?.()
                    reset()
                    setAddToTeam(false)
                } else {
                    throw new Error(res?.createUser?.message || 'Failed to create user')
                }
            } else {
                const payload = {
                    id: editData!._id,
                    companyName: data.companyName,
                    username: data.fullName,
                    email: data.email,
                    contact: data.phone,
                    address: data.address,
                    pincode: Number(data.pincode),
                    gender: genderEnum,
                    dob: dobIso,
                    role: roleEnum,
                }

                await updateUserMutation.mutateAsync(payload)
                toast({ title: 'Updated', description: 'Aggregator updated successfully!' })
                onSuccess?.()
                onClose?.()
                reset()
            }
        } catch (error: any) {
            console.error(`${mode} aggregator error:`, error)
            toast({
                title: 'Error',
                description: error.message || `Failed to ${mode} aggregator`,
                variant: 'destructive',
            })
        }
    }

    const selectedRole = watch('role')
    const submitting =
        isSubmitting || registerMutation.isPending || updateUserMutation.isPending

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
            <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-4xl w-[95%] max-h-[95vh] overflow-y-auto rounded-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                        {mode === 'add' ? 'Add New Aggregator' : 'Edit Aggregator'}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        {mode === 'add'
                            ? 'Register a new loan aggregator or team member.'
                            : 'Update aggregator details.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        {/* Role Selector */}
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Select
                                defaultValue={defaultRole}
                                onValueChange={(v) =>
                                    setValue('role', v as RoleValueLower, { shouldValidate: true })
                                }
                            >
                                <SelectTrigger className="glass-input text-black h-12">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent className="glass-card border-white/10">
                                    <SelectItem value="aggregator_admin">Aggregator Admin</SelectItem>
                                    <SelectItem value="aggregator_member">Aggregator Member</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.role && (
                                <p className="text-red-400 text-sm">{errors.role.message}</p>
                            )}
                        </div>

                        {/* Only show toggle if adding member */}
                        {selectedRole === 'aggregator_member' && (
                            <div className="flex items-end space-x-2 pt-6">
                                <Checkbox
                                    id="addToTeam"
                                    checked={addToTeam}
                                    onCheckedChange={(v) => setAddToTeam(!!v)}
                                />
                                <Label htmlFor="addToTeam" className="text-gray-300 text-sm">
                                    Also add to my team
                                </Label>
                            </div>
                        )}

                        {/* Company Name */}
                        <div className="space-y-2">
                            <Label>Company Name</Label>
                            <Input
                                {...register('companyName')}
                                className="glass-input text-black h-12"
                                placeholder="Enter company name"
                            />
                        </div>

                        {/* Contact Name */}
                        <div className="space-y-2">
                            <Label>Contact Person</Label>
                            <Input
                                {...register('fullName')}
                                className="glass-input text-black h-12"
                                placeholder="Enter name"
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                {...register('email')}
                                className="glass-input text-black h-12"
                                placeholder="Enter email"
                            />
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input
                                {...register('phone')}
                                className="glass-input text-black h-12"
                                placeholder="Enter phone number"
                            />
                        </div>

                        {/* Gender */}
                        <div className="space-y-2">
                            <Label>Gender</Label>
                            <Select
                                defaultValue="male"
                                onValueChange={(v) =>
                                    setValue('gender', v as GenderLower, { shouldValidate: true })
                                }
                            >
                                <SelectTrigger className="glass-input text-black h-12">
                                    <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent className="glass-card border-white/10">
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* DOB */}
                        <div className="space-y-2">
                            <Label>Date of Birth</Label>
                            <Input type="date" {...register('dob')} className="glass-input text-black h-12" />
                        </div>

                        {/* Address */}
                        <div className="space-y-2 col-span-2">
                            <Label>Address</Label>
                            <Input
                                {...register('address')}
                                className="glass-input text-black h-12"
                                placeholder="Enter address"
                            />
                        </div>

                        {/* Pincode */}
                        <div className="space-y-2">
                            <Label>Pincode</Label>
                            <Input
                                {...register('pincode')}
                                className="glass-input text-black h-12"
                                placeholder="Enter pincode"
                            />
                        </div>

                        {/* Password fields only for Add */}
                        {mode === 'add' && (
                            <>
                                <div className="space-y-2">
                                    <Label>Password</Label>
                                    <Input
                                        type="password"
                                        {...register('password')}
                                        className="glass-input text-black h-12"
                                        placeholder="Enter password"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Confirm Password</Label>
                                    <Input
                                        type="password"
                                        {...register('confirmPassword')}
                                        className="glass-input text-black h-12"
                                        placeholder="Confirm password"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex justify-end space-x-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onClose?.()}
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="bg-gradient-to-r from-blue to-cyan-500 text-dark"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {mode === 'add' ? 'Adding...' : 'Updating...'}
                                </>
                            ) : mode === 'add' ? (
                                'Add Aggregator'
                            ) : (
                                'Update Aggregator'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
