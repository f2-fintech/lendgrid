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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Eye, EyeOff } from "lucide-react";

import { useToast } from "@/hooks/use-toast";

// Validation SCHEMA
const schema = z
    .object({
        name: z
            .string()
            .min(2, "Name must be at least 2 characters")
            .max(50, "Name is too long")
            .trim()
            .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),

        email: z
            .string()
            .email("Please enter a valid email address")
            .toLowerCase()
            .trim(),

        phone: z
            .string()
            .min(10, "Phone must be at least 10 characters")
            .max(15, "Phone is too long")
            .regex(/^[0-9]+$/, "Phone can only contain numbers"),

        role: z
            .string()
            .min(2, "Role must be at least 2 characters")
            .max(50, "Role is too long")
            .trim(),

        department: z
            .string()
            .min(2, "Department must be at least 2 characters")
            .max(50, "Department is too long")
            .trim(),

        status: z.enum(["active", "inactive", "on leave", "suspended", "probation"]),

        joinDate: z.string().min(1, "Join date is required"),

        salary: z
            .string()
            .regex(/^[0-9]+$/, "Salary must be a number")
            .transform(Number)
            .refine((val) => val > 0, "Salary must be greater than 0"),

        panNumber: z
            .string()
            .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format (e.g., ABCDE1234F)")
            .toUpperCase()
            .trim(),

        address: z
            .string()
            .min(10, "Address must be at least 10 characters")
            .max(200, "Address is too long")
            .trim(),

        emergencyContact: z
            .string()
            .min(10, "Emergency contact must be at least 10 characters")
            .max(15, "Emergency contact is too long")
            .regex(/^[0-9]+$/, "Emergency contact can only contain numbers"),

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

export function AddEmployeeDialog({
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

    const { toast } = useToast();

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            role: "",
            department: "",
            status: "active",
            joinDate: "",
            salary: "" as any,
            panNumber: "",
            address: "",
            emergencyContact: "",
            password: "",
            confirmPassword: "",
        },
    });

    useEffect(() => {
        if (isOpen) reset();
    }, [isOpen, reset]);

    const onSubmit = async (data: FormValues) => {
        try {
            // Replace with your actual API call
            const payload = {
                name: data.name,
                email: data.email,
                phone: data.phone,
                role: data.role,
                department: data.department,
                status: data.status,
                joinDate: data.joinDate,
                salary: data.salary,
                panNumber: data.panNumber,
                address: data.address,
                emergencyContact: data.emergencyContact,
                password: data.password,
            };

            // TODO: Add your employee creation API call here
            // const response = await createEmployee(payload);

            console.log("Employee payload:", payload);

            toast({
                title: "Success",
                description: "Employee created successfully!",
            });

            reset();
            onClose?.();
            refetch?.();
        } catch (err: any) {
            toast({
                title: "Error",
                description: err?.message || "Failed to create employee",
                variant: "destructive",
            });
        }
    };

    const statusValue = watch("status");

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-background border-border text-foreground max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-foreground">
                        Add New Employee
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Register a new F2fintech employee with complete details.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        {/* Full Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name *</Label>
                            <Input
                                id="name"
                                {...register("name")}
                                className="bg-background border-border h-11"
                                placeholder="e.g., John Doe"
                            />
                            {errors.name && (
                                <p className="text-red-400 text-sm">{errors.name.message}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address *</Label>
                            <Input
                                id="email"
                                type="email"
                                {...register("email")}
                                className="bg-background border-border h-11"
                                placeholder="e.g., john.doe@f2fintech.com"
                            />
                            {errors.email && (
                                <p className="text-red-400 text-sm">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number *</Label>
                            <Input
                                id="phone"
                                {...register("phone")}
                                className="bg-background border-border h-11"
                                placeholder="e.g., 9876543210"
                            />
                            {errors.phone && (
                                <p className="text-red-400 text-sm">{errors.phone.message}</p>
                            )}
                        </div>

                        {/* Role */}
                        <div className="space-y-2">
                            <Label htmlFor="role">Role / Designation *</Label>
                            <Input
                                id="role"
                                {...register("role")}
                                className="bg-background border-border h-11"
                                placeholder="e.g., Senior Developer"
                            />
                            {errors.role && (
                                <p className="text-red-400 text-sm">{errors.role.message}</p>
                            )}
                        </div>

                        {/* Department */}
                        <div className="space-y-2">
                            <Label htmlFor="department">Department *</Label>
                            <Input
                                id="department"
                                {...register("department")}
                                className="bg-background border-border h-11"
                                placeholder="e.g., Engineering"
                            />
                            {errors.department && (
                                <p className="text-red-400 text-sm">{errors.department.message}</p>
                            )}
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <Label htmlFor="status">Employment Status *</Label>
                            <Select
                                value={statusValue}
                                onValueChange={(value) => setValue("status", value as any)}
                            >
                                <SelectTrigger className="bg-background border-border h-11">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="on leave">On Leave</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                    <SelectItem value="probation">Probation</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.status && (
                                <p className="text-red-400 text-sm">{errors.status.message}</p>
                            )}
                        </div>

                        {/* Join Date */}
                        <div className="space-y-2">
                            <Label htmlFor="joinDate">Join Date *</Label>
                            <Input
                                id="joinDate"
                                type="date"
                                {...register("joinDate")}
                                className="bg-background border-border h-11"
                            />
                            {errors.joinDate && (
                                <p className="text-red-400 text-sm">{errors.joinDate.message}</p>
                            )}
                        </div>

                        {/* Salary */}
                        <div className="space-y-2">
                            <Label htmlFor="salary">Annual Salary (₹) *</Label>
                            <Input
                                id="salary"
                                {...register("salary")}
                                className="bg-background border-border h-11"
                                placeholder="e.g., 1200000"
                            />
                            {errors.salary && (
                                <p className="text-red-400 text-sm">{errors.salary.message}</p>
                            )}
                        </div>

                        {/* PAN Number */}
                        <div className="space-y-2">
                            <Label htmlFor="panNumber">PAN Number *</Label>
                            <Input
                                id="panNumber"
                                {...register("panNumber")}
                                className="bg-background border-border h-11"
                                placeholder="e.g., ABCDE1234F"
                                maxLength={10}
                            />
                            {errors.panNumber && (
                                <p className="text-red-400 text-sm">{errors.panNumber.message}</p>
                            )}
                        </div>

                        {/* Emergency Contact */}
                        <div className="space-y-2">
                            <Label htmlFor="emergencyContact">Emergency Contact *</Label>
                            <Input
                                id="emergencyContact"
                                {...register("emergencyContact")}
                                className="bg-background border-border h-11"
                                placeholder="e.g., 9876543211"
                            />
                            {errors.emergencyContact && (
                                <p className="text-red-400 text-sm">
                                    {errors.emergencyContact.message}
                                </p>
                            )}
                        </div>

                        {/* Address - Full Width */}
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="address">Address *</Label>
                            <Input
                                id="address"
                                {...register("address")}
                                className="bg-background border-border h-11"
                                placeholder="e.g., 123 Tech Street, Bangalore, Karnataka"
                            />
                            {errors.address && (
                                <p className="text-red-400 text-sm">{errors.address.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Set Password *</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    {...register("password")}
                                    className="bg-background border-border h-11 pr-10"
                                    placeholder="Create a strong password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
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
                            <Label htmlFor="confirmPassword">Confirm Password *</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    {...register("confirmPassword")}
                                    className="bg-background border-border h-11 pr-10"
                                    placeholder="Re-enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-red-400 text-sm">
                                    {errors.confirmPassword.message}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end space-x-4 pt-5 border-t border-border">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                reset();
                                onClose?.();
                            }}
                            className="border-border text-foreground hover:bg-muted"
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Employee"
                            )}
                        </Button>
                    </div>
                </form>

                {/* Custom Scrollbar Styles */}
                <style jsx>{`
                    .overflow-y-auto::-webkit-scrollbar {
                        width: 6px;
                    }
                    .overflow-y-auto::-webkit-scrollbar-track {
                        background: rgba(31, 41, 55, 0.5);
                        border-radius: 3px;
                    }
                    .overflow-y-auto::-webkit-scrollbar-thumb {
                        background: rgba(75, 85, 99, 0.8);
                        border-radius: 3px;
                    }
                    .overflow-y-auto::-webkit-scrollbar-thumb:hover {
                        background: rgba(107, 114, 128, 1);
                    }
                `}</style>
            </DialogContent>
        </Dialog>
    );
}
