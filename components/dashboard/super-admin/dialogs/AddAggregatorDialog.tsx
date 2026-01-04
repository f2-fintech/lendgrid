"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { number, z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { useRegister } from "@/hooks/use-users";
import { buildHeaders } from "@/lib/http-client";

// Validation SCHEMA
const schema = z
    .object({
        fullName: z
            .string()
            .min(2, "Name must be at least 2 characters")
            .max(50, "Name is too long")
            .trim()
            .toLowerCase()
            .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),

        contact: z.string()
            .min(9, 'Contact must be at least 9 characters')
            .max(20, 'Contact is too long')
            .regex(/^[0-9]+$/, 'Contact can only contain numbers'),

        email: z
            .string()
            .email("Please enter a valid email address")
            .toLowerCase()
            .trim(),

        companyName: z
            .string()
            .min(2, "Company name must be at least 2 characters")
            .max(50, "Company name is too long")
            .trim()
            .toLowerCase(),

        password: z
            .string()
            .min(8, "Password Must Be 8 Characters Long")
            .regex(/[A-Z]/, "Password Must Contain At Least 1 Uppercase Letter")
            .regex(/[a-z]/, "Password Must Contain At Least 1 Lowercase Letter")
            .regex(/[0-9]/, "Password Must Contain At Least 1 Number")
            .regex(/[^\w]/, "Password Must Contain At Least 1 Special Character")
            .max(30, "Password cannot be more than 30 characters")
            .trim(),

        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

type FormValues = z.infer<typeof schema>;

export function AddAggregatorDialog({
    isOpen = false,
    onClose,
    refetch,
}: {
    isOpen?: boolean;
    onClose?: () => void;
    refetch?: () => void;
}) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const registerMutation = useRegister();
    const { toast } = useToast();

    const {
        control,
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            fullName: "",
            contact: "",
            email: "",
            companyName: "",
            password: "",
            confirmPassword: ""
        },
    });

    useEffect(() => {
        if (isOpen) reset();
    }, [isOpen, reset]);

    const onSubmit = async (data: FormValues) => {
        const DEFAULT_BASE_URL_REST = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3010/api/v1'
        try {
            const payload = {
                username: data.fullName,
                contact: data.contact,
                email: data.email,
                password: data.password,
                role: "AGGREGATOR_ADMIN",
                // Aggregator Profile Fields
                companyName: data.companyName,
                // isOmsEnabled: data.isOmsEnabled,
            };

            const res = await registerMutation.mutateAsync(payload);

            if (!res?.createUser?.success) {
                throw new Error(res?.createUser?.message || "User creation failed");
            }

            const { companyId } = res.createUser;

            if (!companyId) {
                throw new Error("Aggregator profile not created");
            }

            // Create Company (REST)
            const companyRes = await fetch(`${DEFAULT_BASE_URL_REST}/companies`, {
                method: "POST",
                headers: buildHeaders(),
                body: JSON.stringify({
                    name: data.companyName,
                    email: data.email,
                    contactNumber: data.contact,
                    companyId,
                }),
            });
            if (!companyRes.ok) {
                throw new Error("Company creation failed");
            }

            // Create OMS user (REST)
            // const omsRes = await fetch(`${DEFAULT_BASE_URL_REST}/create-user`, {
            //     method: "POST",
            //     headers: buildHeaders(),
            //     credentials: "include",
            //     body: JSON.stringify({
            //         username: data.fullName,
            //         email: data.email,
            //         password: data.password,
            //         number: data.contact,
            //         companyId,
            //         role: "admin",
            //         status: "active",
            //     }),
            // });
            // if (!omsRes.ok) {
            //     throw new Error("OMS user creation failed");
            // }

            toast({
                title: "Success",
                description: "Aggregator created successfully!",
            });

            onClose?.();
            refetch?.();
        } catch (err: any) {
            toast({
                title: "Error",
                description: err?.message || "Failed to create aggregator",
                variant: "destructive",
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-gradient-to-br from-gray-900 to-black border-gray-700 text-white max-w-3xl rounded-xl shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-white bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                        Add New Aggregator
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Register a new Aggregator Admin and their company profile.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        {/* Company Name */}
                        <div className="space-y-2">
                            <Label htmlFor="companyName">Company Name</Label>
                            <Input
                                id="companyName"
                                {...register("companyName")}
                                className="bg-gray-800 border-gray-700 h-11"
                                placeholder="e.g., Acme Corporation"
                            />
                            {errors.companyName && (
                                <p className="text-red-400 text-sm">{errors.companyName.message}</p>
                            )}
                        </div>

                        {/* Full Name */}
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                {...register("fullName")}
                                className="bg-gray-800 border-gray-700 h-11"
                                placeholder="e.g., John Doe"
                            />
                            {errors.fullName && (
                                <p className="text-red-400 text-sm">{errors.fullName.message}</p>
                            )}
                        </div>

                        {/* Contact */}
                        <div className="space-y-2">
                            <Label htmlFor="contact">Phone Number</Label>
                            <Input
                                id="contact"
                                {...register('contact')}
                                className="bg-gray-800 border-gray-700 h-11"
                                placeholder="e.g., 9876543210"
                            />
                            {errors.contact && (<p className="text-red-400 text-sm mt-1">{errors.contact.message}</p>)}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                {...register("email")}
                                className="bg-gray-800 border-gray-700 h-11"
                                placeholder="e.g., john.doe@acme.com"
                            />
                            {errors.email && (
                                <p className="text-red-400 text-sm">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Set Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    {...register("password")}
                                    className="bg-gray-800 border-gray-700 h-11 pr-10"
                                    placeholder="Create a strong password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-white"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-red-400 text-sm">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    {...register("confirmPassword")}
                                    className="bg-gray-800 border-gray-700 h-11 pr-10"
                                    placeholder="Re-enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-white"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-red-400 text-sm">{errors.confirmPassword.message}</p>
                            )}
                        </div>
                    </div>

                    {/* OMS Enabled */}
                    {/* <div className="flex items-center space-x-3 pt-4 border-t border-gray-700/50">
                        <Controller name="isOmsEnabled" control={control} render={({ field }) => (
                            <>
                                <Checkbox id="isOmsEnabled" checked={field.value} onCheckedChange={field.onChange} />
                                <Label htmlFor="isOmsEnabled" className="cursor-pointer text-gray-300">
                                    Enable OMS Integration for this Aggregator
                                </Label>
                            </>
                        )} />
                    </div> */}

                    {/* Buttons */}
                    <div className="flex justify-end space-x-4 pt-5 border-t border-gray-700/50">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                reset();
                                onClose?.();
                            }}
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-gradient-to-r from-blue to-cyan-500 text-white shadow-lg disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Aggregator"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
