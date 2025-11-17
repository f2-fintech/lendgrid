"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
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

// SAME SCHEMA AS SIGNUP FORM
const schema = z
    .object({
        fullName: z
            .string()
            .min(2, "Name must be at least 2 characters")
            .max(50, "Name is too long")
            .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),

        email: z
            .string()
            .email("Please enter a valid email address")
            .toLowerCase()
            .trim(),

        companyName: z
            .string()
            .min(2, "Company name must be at least 2 characters")
            .max(50, "Company name is too long"),

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
    });

type FormValues = z.infer<typeof schema>;

export function AddAggregatorDialog({
    isOpen = false,
    onSuccess,
    onClose,
    refetch,
}: {
    isOpen?: boolean;
    onSuccess?: () => void;
    onClose?: () => void;
    refetch?: () => void;
}) {
    const { toast } = useToast();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            fullName: "",
            email: "",
            companyName: "",
            password: "",
            confirmPassword: "",
        },
    });

    useEffect(() => {
        if (isOpen) reset();
    }, [isOpen, reset]);

    const registerMutation = useRegister();

    const onSubmit = async (data: FormValues) => {
        try {
            const payload = {
                username: data.fullName,
                email: data.email,
                password: data.password,
                companyName: data.companyName,
                role: "AGGREGATOR_ADMIN",
            };

            const res: any = await registerMutation.mutateAsync(payload);

            if (res?.createUser?.success) {
                toast({
                    title: "Success",
                    description: "Aggregator created successfully!",
                });

                onSuccess?.();
                onClose?.();
                refetch?.();
                return;
            }

            throw new Error(res?.createUser?.message || "Failed to create aggregator");
        } catch (err: any) {
            toast({
                title: "Error",
                description: err?.message || "Failed to create aggregator",
                variant: "destructive",
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-lg w-[95%] rounded-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Add New Aggregator</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Register A New Aggregator Admin
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Company Name */}
                    <div className="space-y-2">
                        <Label>Company Name</Label>
                        <Input
                            {...register("companyName")}
                            className="glass-input text-black h-12"
                            placeholder="Your Company Ltd."
                        />
                        {errors.companyName && (
                            <p className="text-red-400 text-sm">{errors.companyName.message}</p>
                        )}
                    </div>

                    {/* Full Name */}
                    <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input
                            {...register("fullName")}
                            className="glass-input text-black h-12"
                            placeholder="John Doe"
                        />
                        {errors.fullName && (
                            <p className="text-red-400 text-sm">{errors.fullName.message}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                            type="email"
                            {...register("email")}
                            className="glass-input text-black h-12"
                            placeholder="john@company.com"
                        />
                        {errors.email && (
                            <p className="text-red-400 text-sm">{errors.email.message}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <Label>Password</Label>
                        <div className="relative">
                            <Input
                                type={showPassword ? "text" : "password"}
                                {...register("password")}
                                className="glass-input text-black h-12 pr-12"
                                placeholder="Create password"
                            />

                            <button
                                type="button"
                                className="absolute right-3 top-0 h-full flex items-center"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="w-5 h-5 text-gray-500" />
                                ) : (
                                    <Eye className="w-5 h-5 text-gray-500" />
                                )}
                            </button>
                        </div>

                        {errors.password && (
                            <p className="text-red-400 text-sm">{errors.password.message}</p>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                        <Label>Confirm Password</Label>
                        <div className="relative">
                            <Input
                                type={showConfirmPassword ? "text" : "password"}
                                {...register("confirmPassword")}
                                className="glass-input text-black h-12 pr-12"
                                placeholder="Confirm password"
                            />

                            <button
                                type="button"
                                className="absolute right-3 top-0 h-full flex items-center"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="w-5 h-5 text-gray-500" />
                                ) : (
                                    <Eye className="w-5 h-5 text-gray-500" />
                                )}
                            </button>
                        </div>

                        {errors.confirmPassword && (
                            <p className="text-red-400 text-sm">{errors.confirmPassword.message}</p>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end space-x-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-gradient-to-r from-blue to-cyan-500 text-dark"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
