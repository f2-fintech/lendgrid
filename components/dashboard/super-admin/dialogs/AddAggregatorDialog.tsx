"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { Loader2, Eye, EyeOff, Percent, Info, AlertCircle, Building2, User, KeyRound } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { useToast } from "@/hooks/use-toast";
import { useRegister } from "@/hooks/use-users";
import { buildHeaders } from "@/lib/http-client";

// Available lenders for commission mapping
const AVAILABLE_LENDERS = [
    'ABFL',
    'Axis',
    'Bajaj Finance',
    'Bajaj Market',
    'Bank of Baroda',
    'BOI',
    'Canara Bank',
    'Cholamandalam',
    'Credit Saison',
    'Deutsche bank',
    'Godrej',
    'HDFC',
    'HSBC Bank',
    'ICICI',
    'IDFC',
    'Indusind',
    'Incred',
    'Kotak Bank',
    'L&T',
    'Lending Kart',
    'Paysense',
    'PNB',
    'Poonawala',
    'SBI',
    'Shriram',
    'SMFG',
    'STANDARD Chartered Bank',
    'Tata',
    'YES Bank',
] as const;

// Lender commission entry schema
const lenderCommissionSchema = z.object({
    lenderName: z.string(),
    commissionPercent: z
        .union([z.number().min(0).max(100), z.nan(), z.null()])
        .optional()
        .transform((val) => (val === null || val === undefined || Number.isNaN(val) ? undefined : val)),
});

// Main validation schema
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

        aggregatorType: z.enum(['SOURCER', 'CHANNEL_PARTNER'], {
            required_error: 'Please select aggregator type',
        }),

        password: z
            .string()
            .min(8, "Password Must Be 8 Characters Long")
            .regex(/[A-Z]/, "Password Must Contain At Least 1 Uppercase Letter")
            .regex(/[a-z]/, "Password Must Contain At Least 1 Lowercase Letter")
            .regex(/[0-9]/, "Password Must Contain At Least 1 Number")
            .regex(/[^\w]/, "Password Must Contain At Least 1 Special Character")
            .max(20, "Password cannot be more than 20 characters")
            .trim(),

        confirmPassword: z.string(),

        fixedCommissionPercent: z
            .union([z.number().min(0, "Must be 0 or more").max(100, "Cannot exceed 100%"), z.nan(), z.null()])
            .optional()
            .transform((val) => (val === null || val === undefined || Number.isNaN(val) ? undefined : val)),

        lenderCommissions: z.array(lenderCommissionSchema).optional(),
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
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        mode: "onBlur",
        defaultValues: {
            fullName: "",
            contact: "",
            email: "",
            companyName: "",
            aggregatorType: "CHANNEL_PARTNER",
            password: "",
            confirmPassword: "",
            fixedCommissionPercent: undefined,
            lenderCommissions: AVAILABLE_LENDERS.map((name) => ({
                lenderName: name,
                commissionPercent: undefined,
            })),
        },
    });

    const aggregatorType = watch("aggregatorType");
    const isChannelPartner = aggregatorType === "CHANNEL_PARTNER";

    useEffect(() => {
        if (isOpen) reset();
    }, [isOpen, reset]);

    const onSubmit = async (data: FormValues) => {
        const DEFAULT_BASE_URL_REST = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3010/api/v1'
        try {
            // Build lender commissions — only include lenders with a value set
            const filledLenderCommissions = isChannelPartner
                ? (data.lenderCommissions || [])
                    .filter((lc) => lc.commissionPercent !== undefined && lc.commissionPercent !== null)
                    .map((lc) => ({
                        lenderName: lc.lenderName,
                        commissionPercent: lc.commissionPercent,
                    }))
                : undefined;

            const payload: Record<string, any> = {
                username: data.fullName,
                contact: data.contact,
                email: data.email,
                password: data.password,
                role: "AGGREGATOR_ADMIN",
                // Aggregator Profile Fields
                companyName: data.companyName,
                aggregatorType: data.aggregatorType,
                isOmsEnabled: true,
            };

            // Add fixed commission for both types
            if (data.fixedCommissionPercent !== undefined && data.fixedCommissionPercent !== null) {
                payload.fixedCommissionPercent = data.fixedCommissionPercent;
            }

            // Add lender-wise commissions only for channel partners
            if (isChannelPartner && filledLenderCommissions && filledLenderCommissions.length > 0) {
                payload.lenderCommissions = filledLenderCommissions;
            }

            const res = await registerMutation.mutateAsync(payload);
            if (!res?.createUser?.success) {
                throw new Error(res?.createUser?.message || "User creation failed");
            }

            const { companyId } = res.createUser;
            if (!companyId) {
                throw new Error("Aggregator profile not created");
            }

            // Create Company (REST Api)
            const companyRes = await fetch(`${DEFAULT_BASE_URL_REST}/companies`, {
                method: "POST",
                headers: buildHeaders(),
                body: JSON.stringify({
                    name: data.aggregatorType === 'SOURCER' ? data.fullName : data.companyName,
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
            <DialogContent className="bg-background border-border text-foreground max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl p-0">
                {/* Dialog Header */}
                <DialogHeader className="px-6 pt-6 pb-2">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <DialogTitle className="text-2xl font-bold text-foreground">
                                Add New Aggregator
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground mt-1">
                                Register a new Aggregator Admin and their company profile.
                            </DialogDescription>
                        </div>
                        {aggregatorType && (
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mt-2 sm:mt-0 ${isChannelPartner
                                ? 'bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30'
                                : 'bg-green-500/15 text-green-400 ring-1 ring-green-500/30'
                                }`}>
                                {isChannelPartner ? 'Channel Partner' : 'Sourcer'}
                            </span>
                        )}
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 pb-6">
                    {/* ─── Card 1: Company & Type ─── */}
                    <Card className="border-border bg-card/50">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                    <Building2 className="w-4 h-4 text-emerald-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-foreground text-lg">Company Details</CardTitle>
                                    <CardDescription className="text-xs">Business name and aggregator classification</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Company Name */}
                                <div>
                                    <Label htmlFor="companyName" className="text-sm font-medium">
                                        Company Name <span className="text-red-400">*</span>
                                    </Label>
                                    <Input
                                        id="companyName"
                                        {...register("companyName")}
                                        className="mt-1.5 bg-background border-border focus:ring-2 focus:ring-primary/20"
                                        placeholder="e.g., Acme Corporation"
                                    />
                                    {errors.companyName && (
                                        <p className="text-sm text-red-400 mt-1.5 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {errors.companyName.message}
                                        </p>
                                    )}
                                </div>

                                {/* Aggregator Type */}
                                <div>
                                    <Label htmlFor="aggregatorType" className="text-sm font-medium">
                                        Aggregator Type <span className="text-red-400">*</span>
                                    </Label>
                                    <Controller
                                        control={control}
                                        name="aggregatorType"
                                        render={({ field }) => (
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <SelectTrigger id="aggregatorType" className="mt-1.5 bg-background border-border">
                                                    <SelectValue placeholder="Select aggregator type" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-popover border-border text-popover-foreground">
                                                    <SelectItem value="SOURCER" className="cursor-pointer">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                                            Sourcer
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="CHANNEL_PARTNER" className="cursor-pointer">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                                                            Channel Partner
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.aggregatorType && (
                                        <p className="text-sm text-red-400 mt-1.5 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {errors.aggregatorType.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ─── Card 2: User Details ─── */}
                    <Card className="border-border bg-card/50">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <User className="w-4 h-4 text-blue-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-foreground text-lg"> {aggregatorType.replace("_", " ")} Details</CardTitle>
                                    <CardDescription className="text-xs">Personal and contact information for the aggregator admin</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Full Name */}
                                <div>
                                    <Label htmlFor="fullName" className="text-sm font-medium">
                                        Full Name <span className="text-red-400">*</span>
                                    </Label>
                                    <Input
                                        id="fullName"
                                        {...register("fullName")}
                                        className="mt-1.5 bg-background border-border focus:ring-2 focus:ring-primary/20"
                                        placeholder="e.g., John Doe"
                                    />
                                    {errors.fullName && (
                                        <p className="text-sm text-red-400 mt-1.5 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {errors.fullName.message}
                                        </p>
                                    )}
                                </div>

                                {/* Contact */}
                                <div>
                                    <Label htmlFor="contact" className="text-sm font-medium">
                                        Phone Number <span className="text-red-400">*</span>
                                    </Label>
                                    <Input
                                        id="contact"
                                        {...register('contact')}
                                        className="mt-1.5 bg-background border-border focus:ring-2 focus:ring-primary/20"
                                        placeholder="e.g., 9876543210"
                                    />
                                    {errors.contact && (
                                        <p className="text-sm text-red-400 mt-1.5 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {errors.contact.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Email — full width */}
                            <div>
                                <Label htmlFor="email" className="text-sm font-medium">
                                    Email Address <span className="text-red-400">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    {...register("email")}
                                    className="mt-1.5 bg-background border-border focus:ring-2 focus:ring-primary/20"
                                    placeholder="e.g., john.doe@acme.com"
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-400 mt-1.5 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Password */}
                                <div>
                                    <Label htmlFor="password" className="text-sm font-medium">
                                        Set Password <span className="text-red-400">*</span>
                                    </Label>
                                    <div className="relative mt-1.5">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            {...register("password")}
                                            className="bg-background border-border pr-10 focus:ring-2 focus:ring-primary/20"
                                            placeholder="Create a strong password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="text-sm text-red-400 mt-1.5 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {errors.password.message}
                                        </p>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <Label htmlFor="confirmPassword" className="text-sm font-medium">
                                        Confirm Password <span className="text-red-400">*</span>
                                    </Label>
                                    <div className="relative mt-1.5">
                                        <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            {...register("confirmPassword")}
                                            className="bg-background border-border pr-10 focus:ring-2 focus:ring-primary/20"
                                            placeholder="Re-enter your password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && (
                                        <p className="text-sm text-red-400 mt-1.5 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {errors.confirmPassword.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ─── Card 3: Commission Configuration ─── */}
                    <Card className="border-border bg-card/50">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                    <Percent className="w-4 h-4 text-purple-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-foreground text-lg">Commission Configuration</CardTitle>
                                    <CardDescription className="text-xs">
                                        {isChannelPartner
                                            ? 'Set fixed and lender-wise commission rates for this channel partner'
                                            : 'Set the fixed commission rate for this sourcer'}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Fixed Commission Rate */}
                            <div>
                                <Label htmlFor="fixedCommissionPercent" className="text-sm font-medium">
                                    Fixed Commission Rate
                                </Label>
                                <div className="relative mt-1.5 max-w-xs">
                                    <Input
                                        id="fixedCommissionPercent"
                                        type="number"
                                        step="0.01"
                                        {...register("fixedCommissionPercent", { valueAsNumber: true })}
                                        className="bg-background border-border pr-10 focus:ring-2 focus:ring-primary/20"
                                        placeholder="e.g., 3.5"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">%</span>
                                </div>
                                {errors.fixedCommissionPercent && (
                                    <p className="text-sm text-red-400 mt-1.5 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.fixedCommissionPercent.message}
                                    </p>
                                )}
                            </div>

                            {/* Lender-wise Commission Grid — Channel Partners only */}
                            {isChannelPartner && (
                                <>
                                    <div className="space-y-3 pt-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-medium">Lender-wise Commission Overrides</Label>
                                            <span className="text-xs text-muted-foreground">Leave blank if not applicable</span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[340px] overflow-y-auto pr-1">
                                            {AVAILABLE_LENDERS.map((lender, index) => (
                                                <div
                                                    key={lender}
                                                    className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2 hover:border-primary/30 transition-colors"
                                                >
                                                    <span className="text-sm text-foreground truncate min-w-0 flex-1" title={lender}>
                                                        {lender}
                                                    </span>
                                                    <div className="relative w-24 flex-shrink-0">
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            {...register(`lenderCommissions.${index}.commissionPercent` as const, {
                                                                valueAsNumber: true,
                                                            })}
                                                            className="bg-background border-border h-8 text-sm pr-7 w-full focus:ring-2 focus:ring-primary/20"
                                                            placeholder="—"
                                                        />
                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <Alert className="bg-blue-500/10 border-blue-500/30">
                                        <Info className="h-4 w-4 text-blue-400" />
                                        <AlertDescription className="text-sm text-foreground">
                                            💡 Fixed commission applies as the default rate. Lender-specific overrides take priority when set.
                                        </AlertDescription>
                                    </Alert>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* ─── Action Buttons ─── */}
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-border">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                reset();
                                onClose?.();
                            }}
                            disabled={isSubmitting}
                            className="border-border hover:bg-muted px-6 w-full sm:w-auto"
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full sm:w-auto ${isChannelPartner
                                ? 'bg-orange-600 hover:bg-orange-700'
                                : 'bg-green-600 hover:bg-green-700'
                                } text-white px-6 shadow-lg`}
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
