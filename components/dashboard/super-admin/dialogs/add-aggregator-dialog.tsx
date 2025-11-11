"use client";

import { useEffect, useMemo, useState } from "react";
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

import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { useRegister, useUpdateUser, useProfile } from "@/hooks/use-users";
import { useAddTeamMember, useMyAggregatorProfile } from "@/hooks/use-aggregators";

type RoleValueLower = "aggregator_admin" | "aggregator_member";
type RoleEnumUpper = "AGGREGATOR_ADMIN" | "AGGREGATOR_MEMBER";
type GenderLower = "male" | "female" | "other";
type GenderEnumUpper = "MALE" | "FEMALE" | "OTHER";

interface EditAggregatorData {
    _id: string;
    username: string;
    email: string;
    contact: string;
    gender?: GenderLower | GenderEnumUpper;
    dob?: string;
    address?: string;
    pincode?: string | number;
    companyName?: string;
    role?: RoleValueLower | RoleEnumUpper;
}

interface AddAggregatorDialogProps {
    onSuccess?: () => void;
    editData?: EditAggregatorData | null;
    mode?: "add" | "edit";
    isOpen?: boolean;
    onClose?: () => void;
}

type FormValues = {
    fullName: string;
    email: string;
    phone: string;
    companyName: string;
    address: string;
    pincode: string;
    gender: GenderLower;
    dob: string;
    role: RoleValueLower;
    password?: string;
    confirmPassword?: string;
};

export function AddAggregatorDialog({
    onSuccess,
    editData,
    mode = "add",
    isOpen = false,
    onClose,
}: AddAggregatorDialogProps = {}) {
    const { toast } = useToast();
    const [addToTeam, setAddToTeam] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useProfile(true);
    const { data: myAggregatorProfile } = useMyAggregatorProfile(true);

    const registerMutation = useRegister();
    const updateUserMutation = useUpdateUser();
    const addTeamMemberMutation = useAddTeamMember();

    const schema = useMemo(() => {
        return z
            .object({
                fullName: z
                    .string()
                    .min(2, "Name must be at least 2 characters")
                    .max(50, "Name is too long")
                    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
                email: z.string().email("Please enter a valid email address").toLowerCase().trim(),
                phone: z
                    .string()
                    .min(10, "Phone number must be at least 10 digits")
                    .max(15, "Phone number is too long")
                    .regex(/^[0-9]+$/, "Phone must contain digits only"),
                companyName: z
                    .string()
                    .min(2, "Company name must be at least 2 characters")
                    .max(50, "Company name is too long"),
                address: z.string().min(5, "Address must be at least 5 characters"),
                pincode: z
                    .string()
                    .regex(/^[0-9]{4,10}$/, "Pincode must be numeric and between 4–10 digits"),
                gender: z.enum(["male", "female", "other"], { required_error: "Please select gender" }),
                dob: z.string().refine((v) => !isNaN(Date.parse(v)), { message: "Invalid date format" }),
                role: z.enum(["aggregator_admin", "aggregator_member"], { required_error: "Please select role" }),
                password: z.string().optional(),
                confirmPassword: z.string().optional(),
            })
            .superRefine((data, ctx) => {
                if (mode === "add") {
                    if (!data.password) {
                        ctx.addIssue({ code: "custom", message: "Password is required", path: ["password"] });
                    } else {
                        if (data.password.length < 8) {
                            ctx.addIssue({ code: "custom", message: "Password must be at least 8 characters", path: ["password"] });
                        }
                        if (!/[A-Z]/.test(data.password)) {
                            ctx.addIssue({ code: "custom", message: "Password must contain one uppercase letter", path: ["password"] });
                        }
                        if (!/[a-z]/.test(data.password)) {
                            ctx.addIssue({ code: "custom", message: "Password must contain one lowercase letter", path: ["password"] });
                        }
                        if (!/[0-9]/.test(data.password)) {
                            ctx.addIssue({ code: "custom", message: "Password must contain one number", path: ["password"] });
                        }
                        if (!/[^\w]/.test(data.password)) {
                            ctx.addIssue({ code: "custom", message: "Password must contain one special character", path: ["password"] });
                        }
                    }

                    if (data.password !== data.confirmPassword) {
                        ctx.addIssue({ code: "custom", message: "Passwords do not match", path: ["confirmPassword"] });
                    }
                }

                if (mode === "edit") {
                    if (data.password || data.confirmPassword) {
                        ctx.addIssue({ code: "custom", message: "Password cannot be changed here", path: ["password"] });
                    }
                }
            });
    }, [mode]);

    const defaultValues: FormValues = useMemo(() => {
        if (mode === "edit" && editData) {
            return {
                fullName: editData.username,
                email: editData.email,
                phone: editData.contact,
                companyName: editData.companyName ?? "",
                address: editData.address ?? "",
                pincode: String(editData.pincode ?? ""),
                gender: (editData.gender?.toString().toLowerCase() as GenderLower) ?? ("male" as GenderLower),
                dob: editData.dob ? new Date(editData.dob).toISOString().split("T")[0] : "",
                role: (editData.role?.toString().toLowerCase() as RoleValueLower) ?? ("aggregator_admin" as RoleValueLower),
                password: undefined,
                confirmPassword: undefined,
            };
        }
        return {
            fullName: "",
            email: "",
            phone: "",
            companyName: "",
            address: "",
            pincode: "",
            gender: "male",
            dob: "",
            role: "aggregator_admin",
            password: undefined,
            confirmPassword: undefined,
        };
    }, [mode, editData]);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues,
    });

    useEffect(() => {
        if (isOpen) {
            reset(defaultValues);
        }
    }, [isOpen, reset, defaultValues]);

    const selectedRole = watch("role");
    const submitting = isSubmitting || registerMutation.isPending || updateUserMutation.isPending;

    const onSubmit = async (data: FormValues) => {
        const dobIso = new Date(data.dob).toISOString();
        const roleEnum = data.role.toUpperCase();
        const genderEnum = data.gender.toUpperCase();

        try {
            if (mode === "add") {
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
                };

                const res: any = await registerMutation.mutateAsync(payload);
                if (res?.createUser?.success && res?.createUser?.user?._id) {
                    const newUserId = res.createUser.user._id;

                    if (data.role === "aggregator_member" && addToTeam && myAggregatorProfile?._id) {
                        await addTeamMemberMutation.mutateAsync({
                            id: myAggregatorProfile._id,
                            userId: newUserId,
                        });
                        toast({ title: "Team Linked", description: "Member successfully added to your team." });
                    }

                    toast({ title: "Success", description: "Aggregator created successfully!" });
                    onSuccess?.();
                    onClose?.();
                    reset();
                    setAddToTeam(false);
                } else {
                    throw new Error(res?.createUser?.message || "Failed to create user");
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
                };

                await updateUserMutation.mutateAsync(payload);
                toast({ title: "Updated", description: "Aggregator updated successfully!" });
                onSuccess?.();
                onClose?.();
                reset();
            }
        } catch (error: any) {
            console.error(`${mode} aggregator error:`, error);
            toast({
                title: "Error",
                description: error?.message || `Failed to ${mode} aggregator`,
                variant: "destructive",
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
            <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-4xl w-[95%] max-h-[95vh] overflow-y-auto rounded-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                        {mode === "add" ? "Add New Aggregator" : "Edit Aggregator"}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        {mode === "add" ? "Register a new loan aggregator or team member." : "Update aggregator details."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        {/* Role Selector */}
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Select
                                defaultValue={defaultValues.role}
                                onValueChange={(v) => setValue("role", v as RoleValueLower, { shouldValidate: true })}
                            >
                                <SelectTrigger className="glass-input text-black h-12">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent className="glass-card border-white/10">
                                    <SelectItem value="aggregator_admin">Aggregator Admin</SelectItem>
                                    <SelectItem value="aggregator_member">Aggregator Member</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.role && <p className="text-red-400 text-sm">{errors.role.message}</p>}
                        </div>

                        {/* Only show toggle if adding member */}
                        {selectedRole === "aggregator_member" && (
                            <div className="flex items-end space-x-2 pt-6">
                                <Checkbox id="addToTeam" checked={addToTeam} onCheckedChange={(v) => setAddToTeam(!!v)} />
                                <Label htmlFor="addToTeam" className="text-gray-300 text-sm">
                                    Also add to my team
                                </Label>
                            </div>
                        )}

                        {/* Company Name */}
                        <div className="space-y-2">
                            <Label>Company Name</Label>
                            <Input
                                {...register("companyName")}
                                className="glass-input text-black h-12"
                                placeholder="Enter company name"
                            />
                            {errors.companyName && <p className="text-red-400 text-sm">{errors.companyName.message}</p>}
                        </div>

                        {/* Contact Person */}
                        <div className="space-y-2">
                            <Label>Contact Person</Label>
                            <Input
                                {...register("fullName")}
                                className="glass-input text-black h-12"
                                placeholder="Enter name"
                            />
                            {errors.fullName && <p className="text-red-400 text-sm">{errors.fullName.message}</p>}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                {...register("email")}
                                className="glass-input text-black h-12"
                                placeholder="Enter email"
                            />
                            {errors.email && <p className="text-red-400 text-sm">{errors.email.message}</p>}
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input
                                {...register("phone")}
                                className="glass-input text-black h-12"
                                placeholder="Enter phone number"
                            />
                            {errors.phone && <p className="text-red-400 text-sm">{errors.phone.message}</p>}
                        </div>

                        {/* Gender */}
                        <div className="space-y-2">
                            <Label>Gender</Label>
                            <Select
                                defaultValue={defaultValues.gender}
                                onValueChange={(v) => setValue("gender", v as GenderLower, { shouldValidate: true })}
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
                            {errors.gender && <p className="text-red-400 text-sm">{errors.gender.message}</p>}
                        </div>

                        {/* DOB */}
                        <div className="space-y-2">
                            <Label>Date of Birth</Label>
                            <Input type="date" {...register("dob")} className="glass-input text-black h-12" />
                            {errors.dob && <p className="text-red-400 text-sm">{errors.dob.message}</p>}
                        </div>

                        {/* Address */}
                        <div className="space-y-2 col-span-2">
                            <Label>Address</Label>
                            <Input
                                {...register("address")}
                                className="glass-input text-black h-12"
                                placeholder="Enter address"
                            />
                            {errors.address && <p className="text-red-400 text-sm">{errors.address.message}</p>}
                        </div>

                        {/* Pincode */}
                        <div className="space-y-2">
                            <Label>Pincode</Label>
                            <Input
                                {...register("pincode")}
                                className="glass-input text-black h-12"
                                placeholder="Enter pincode"
                            />
                            {errors.pincode && <p className="text-red-400 text-sm">{errors.pincode.message}</p>}
                        </div>

                        {/* Password fields only for Add */}
                        {mode === "add" && (
                            <>
                                <div className="space-y-2">
                                    <Label>Password</Label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            {...register("password")}
                                            className="glass-input text-black h-12 pr-10"
                                            placeholder="Enter password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="text-red-400 text-sm">{errors.password.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Confirm Password</Label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            {...register("confirmPassword")}
                                            className="glass-input text-black h-12 pr-10"
                                            placeholder="Confirm password"
                                        />
                                    </div>
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
                                    {mode === "add" ? "Adding..." : "Updating..."}
                                </>
                            ) : mode === "add" ? (
                                "Add Aggregator"
                            ) : (
                                "Update Aggregator"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
