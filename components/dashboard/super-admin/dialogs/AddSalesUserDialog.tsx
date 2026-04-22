"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "framer-motion"
import { X, Eye, EyeOff, Loader2 } from "lucide-react"

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
import { useRegister } from "@/hooks/use-users"
import { useAuth } from "@/lib/auth"

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

interface AddSalesUserDialogProps {
    isOpen: boolean
    onClose: () => void
    refetch: () => void
}

export function AddSalesUserDialog({
    isOpen,
    onClose,
    refetch,
}: AddSalesUserDialogProps) {
    const { toast } = useToast()
    const { user } = useAuth()
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const registerMutation = useRegister();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<FormData>({
        resolver: zodResolver(schema),
    })

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true)
        const payload = {
            username: data.fullName,
            email: data.email,
            contact: data.contact,
            password: data.password,
            role: "LENDGRID_SALES",
            createdBy: user?._id,
            captchaToken: "", // Bypassed in backend due to createdBy
        }

        console.log("=== ADD SALES USER PAYLOAD ===")
        console.log(payload)
        try {
            const registerUserResponse = await registerMutation.mutateAsync(payload);
            const result = (registerUserResponse as any)?.createUser;

            if (!result?.success) {
                toast({
                    title: "Registration failed",
                    description: result?.message || "Unable to create account.",
                    variant: "destructive",
                });
                setIsSubmitting(false);
                return;
            }

            toast({
                title: "Sales User Added",
                description: `${data.fullName} has been successfully added to the LendGrid Sales Team.`,
            })
            reset()
            onClose?.()
            refetch?.();
        } catch (error: any) {
            toast({
                title: "Registration failed",
                description: error?.message || "Unable to create account.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        if (isSubmitting) return
        reset()
        setIsSubmitting(false)
        setShowPassword(false)
        setShowConfirmPassword(false)
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) handleClose()
        }}>
            <DialogContent 
                onInteractOutside={(e) => e.preventDefault()}
                className="bg-background border-border text-foreground max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl p-0"
            >
                <DialogHeader className="px-6 pt-6 pb-2">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <DialogTitle className="text-2xl font-bold text-foreground">
                                Add Sales User
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground mt-1">
                                Create a new LendGrid Sales Team member account.
                            </DialogDescription>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleClose}
                            className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full w-8 h-8 flex-shrink-0"
                            disabled={isSubmitting}
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 px-6 pb-6 pt-2">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* Full Name */}
                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="text-foreground font-medium">
                                Full Name <span className="text-red-400">*</span>
                            </Label>
                            <Input
                                id="fullName"
                                placeholder="Enter full name"
                                {...register("fullName")}
                                className={`bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 ${errors.fullName ? "border-red-500" : ""
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
                            <Label htmlFor="email" className="text-foreground font-medium">
                                Email Address <span className="text-red-400">*</span>
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter email address"
                                {...register("email")}
                                className={`bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 ${errors.email ? "border-red-500" : ""
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
                            <Label htmlFor="contact" className="text-foreground font-medium">
                                Contact Number <span className="text-red-400">*</span>
                            </Label>
                            <Input
                                id="contact"
                                placeholder="Enter contact number"
                                {...register("contact")}
                                className={`bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 ${errors.contact ? "border-red-500" : ""
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
                        
                        <div className="hidden md:block"></div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-foreground font-medium">
                                Password <span className="text-red-400">*</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter password"
                                    {...register("password")}
                                    className={`bg-background border-border text-foreground placeholder:text-muted-foreground pr-10 focus:ring-2 focus:ring-primary/20 ${errors.password ? "border-red-500" : ""
                                        }`}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
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
                            <Label htmlFor="confirmPassword" className="text-foreground font-medium">
                                Confirm Password <span className="text-red-400">*</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Re-enter password"
                                    {...register("confirmPassword")}
                                    className={`bg-background border-border text-foreground placeholder:text-muted-foreground pr-10 focus:ring-2 focus:ring-primary/20 ${errors.confirmPassword ? "border-red-500" : ""
                                        }`}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
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
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-border mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            className="w-full sm:w-auto border-border text-foreground hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-colors px-6"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-6 shadow-lg"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Sales User"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
