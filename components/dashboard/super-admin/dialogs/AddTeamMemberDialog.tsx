"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "framer-motion"
import { X, UserPlus, Eye, EyeOff, Loader2 } from "lucide-react"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { AggregatorProfile } from "@/lib"
import { useRegister } from "@/hooks/use-users"
import { useAddTeamMember } from "@/hooks/use-aggregators"

// Validation Schema
const schema = z
    .object({
        fullName: z
            .string()
            .min(2, "Name must be at least 2 characters")
            .max(50, "Name is too long")
            .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),

        contact: z
            .string()
            .min(9, "Contact must be at least 9 characters")
            .max(20, "Contact is too long")
            .regex(/^[0-9]+$/, "Contact can only contain numbers"),

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

        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    })

type FormData = z.infer<typeof schema>

interface AddTeamMemberDialogProps {
    isOpen: boolean
    onClose: () => void
    aggregator: AggregatorProfile | null
    refetch: () => void
}

export function AddTeamMemberDialog({
    isOpen,
    onClose,
    aggregator,
    refetch,
}: AddTeamMemberDialogProps) {
    const { toast } = useToast()
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const registerMutation = useRegister();
    const addTeamMemberMutation = useAddTeamMember();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<FormData>({
        resolver: zodResolver(schema),
    })

    const onSubmit = async (data: FormData) => {
        if (!aggregator) {
            toast({
                title: "Error",
                description: "No aggregator selected",
                variant: "destructive",
            })
            return
        }

        setIsSubmitting(true)
        const payload = {
            username: data.fullName,
            email: data.email,
            contact: data.contact,
            password: data.password,
            role: "AGGREGATOR_MEMBER",
            parentAggregatorId: aggregator.user?._id,
        }

        console.log("=== ADD TEAM MEMBER PAYLOAD ===")
        console.log(payload)
        const registerUserResponse = await registerMutation.mutateAsync(payload);
        const result = (registerUserResponse as any)?.createUser;

        if (!result?.success) {
            toast({
                title: "Signup failed",
                description: result?.message || "Unable to create account.",
                variant: "destructive",
            });
            setIsSubmitting(false);
            reset()
            onClose()
            return;
        }
        const teamMemberMutationResponse = await addTeamMemberMutation.mutateAsync({
            id: aggregator!._id,
            userId: result?.user?._id
        });

        setIsSubmitting(false)
        toast({
            title: "Team Member Added",
            description: `${data.fullName} has been successfully added to ${aggregator.companyName}`,
        })
        reset()
        onClose?.()
        refetch?.();
    }

    const handleClose = () => {
        reset()
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="bg-gradient-to-br from-gray-900 to-black border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                                Add Team Member
                            </DialogTitle>
                            <DialogDescription className="text-gray-400 mt-1">
                                Add a new team member to{" "}
                                <span className="font-semibold text-cyan-400">
                                    {aggregator?.companyName || "the company"}
                                </span>
                            </DialogDescription>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleClose}
                            className="text-gray-400 hover:text-white hover:bg-gray-700 rounded-full"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
                    {/* Company Info Display */}
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-400">Company</p>
                                <p className="text-white font-semibold">
                                    {aggregator?.companyName || "N/A"}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-400">Role</p>
                                <p className="text-cyan-400 font-semibold">
                                    Aggregator Member
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Full Name */}
                    <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-gray-300">
                            Full Name <span className="text-red-400">*</span>
                        </Label>
                        <Input
                            id="fullName"
                            placeholder="Enter full name"
                            {...register("fullName")}
                            className={`bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 ${errors.fullName ? "border-red-500" : ""
                                }`}
                        />
                        {errors.fullName && (
                            <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-400 text-sm"
                            >
                                {errors.fullName.message}
                            </motion.p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-300">
                            Email Address <span className="text-red-400">*</span>
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="Enter email address"
                            {...register("email")}
                            className={`bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 ${errors.email ? "border-red-500" : ""
                                }`}
                        />
                        {errors.email && (
                            <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-400 text-sm"
                            >
                                {errors.email.message}
                            </motion.p>
                        )}
                    </div>

                    {/* Contact */}
                    <div className="space-y-2">
                        <Label htmlFor="contact" className="text-gray-300">
                            Contact Number <span className="text-red-400">*</span>
                        </Label>
                        <Input
                            id="contact"
                            placeholder="Enter contact number"
                            {...register("contact")}
                            className={`bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 ${errors.contact ? "border-red-500" : ""
                                }`}
                        />
                        {errors.contact && (
                            <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-400 text-sm"
                            >
                                {errors.contact.message}
                            </motion.p>
                        )}
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-gray-300">
                            Password <span className="text-red-400">*</span>
                        </Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter password"
                                {...register("password")}
                                className={`bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 pr-10 ${errors.password ? "border-red-500" : ""
                                    }`}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                            >
                                {showPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                        {errors.password && (
                            <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-400 text-sm"
                            >
                                {errors.password.message}
                            </motion.p>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-gray-300">
                            Confirm Password <span className="text-red-400">*</span>
                        </Label>
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Re-enter password"
                                {...register("confirmPassword")}
                                className={`bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 pr-10 ${errors.confirmPassword ? "border-red-500" : ""
                                    }`}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                        {errors.confirmPassword && (
                            <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-400 text-sm"
                            >
                                {errors.confirmPassword.message}
                            </motion.p>
                        )}
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-gray-700">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-700 hover:to-cyan-600"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Add Team Member
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}