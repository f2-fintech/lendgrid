"use client";

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    User,
    Building2,
    CreditCard,
    Bell,
    Upload,
    Save,
    Building,
    Landmark,
    Cpu,
} from "lucide-react"
import { CardSkeleton } from "@/components/ui/loading-skeleton"
import { useForm, FormProvider, useFormContext } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useToast } from "@/hooks/use-toast"

import { useAuth } from "@/lib/auth";
import { useProfile, useUpdateUser } from "@/hooks/use-users"
import {
    useAggregator,
    useUpdateAggregatorProfile,
    useUpdateAggregatorKycStatus,
} from "@/hooks/use-aggregators"
import { BusinessType } from "@/lib";
import { createPublicFilePath } from "@/lib/utils"

/* -------------------------------
   Validation Schema (optional, validated)
   - Fields are optional
   - When provided, they must match the format
   - Zod provides clear messages used by RHF
   ------------------------------- */
const profileSchema = z.object({
    userId: z.string().optional(),

    firstName: z
        .string()
        .optional()
        .refine(val => !val || val.trim().length >= 2, "First name must be at least 2 chars"),

    lastName: z
        .string()
        .optional(),

    email: z
        .string()
        .optional()
        .refine(val => !val || /\S+@\S+\.\S+/.test(val), "Invalid email"),

    contact: z
        .string()
        .optional()
        .refine(val => !val || /^[0-9]{10}$/.test(val), "Phone must be 10 digits"),

    status: z.string().optional(),
    photoUrl: z.string().optional(),
})

const kycSchema = z.object({
    kycStatus: z.string().optional(),
    kycRejectionReason: z.string().optional(),
    kycApprovedAt: z.string().optional(),
    kycApprovedBy: z.string().optional(),
})

const businessSchema = z.object({
    id: z.string().optional(),

    companyName: z
        .string()
        .optional()
        .refine(val => !val || val.trim().length >= 2, "Company name must be at least 2 chars"),

    businessType: z
        .nativeEnum(BusinessType)
        .optional(),

    registeredAddress: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),

    pincode: z
        .string()
        .optional()
        .refine(val => !val || /^[0-9]{6}$/.test(val), "Pincode must be 6 digits"),

    websiteUrl: z
        .string()
        .optional()
        .refine(val => !val || /^https?:\/\/.+/.test(val), "Invalid website URL"),

    gstNumber: z
        .string()
        .optional()
        .refine(
            val => !val || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(val),
            "Invalid GST Number"
        ),

    panNumber: z
        .string()
        .optional()
        .refine(
            val => !val || /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(val),
            "Invalid PAN Number"
        ),

    tanNumber: z.string().optional(),
    cinNumber: z.string().optional(),
    pocName: z.string().optional(),

    // Team members — simple comma separated input in UI, converted to array on save
    teamMembers: z.string().optional(),

    // Financials
    totalApplicationsSubmitted: z.number().optional(),
    totalApplicationsDisbursed: z.number().optional(),
    totalCommissionEarned: z.number().optional(),
    totalPaidOut: z.number().optional(),
    pendingPayout: z.number().optional(),
})

const bankSchema = z.object({
    accountHolderName: z.string().optional(),

    accountNumber: z
        .string()
        .optional()
        .refine(val => !val || /^[0-9]{9,18}$/.test(val), "Invalid account number"),

    ifscCode: z
        .string()
        .optional()
        .refine(val => !val || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(val), "Invalid IFSC code"),

    bankName: z.string().optional(),
    isBankVerified: z.boolean().optional(),
})

const documentsSchema = z.object({
    aadhaarNumber: z
        .string()
        .optional()
        .refine(val => !val || /^[0-9]{12}$/.test(val), "Aadhaar must be 12 digits"),

    panNumber: z
        .string()
        .optional()
        .refine(val => !val || /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(val), "Invalid PAN Number"),

    gstNumber: z
        .string()
        .optional()
        .refine(
            val => !val || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(val),
            "Invalid GST Number"
        ),
    panCard: z.string().optional(),
    gstCertificate: z.string().optional(),
    aadhaarFront: z.string().optional(),
    aadhaarBack: z.string().optional(),
    incorporationCertificate: z.string().optional(),
    bankStatement: z.string().optional(),
    cancelledCheque: z.string().optional(),
    addressProof: z.string().optional(),
    authorizedSignatory: z.string().optional(),
})

const rootSchema = z.object({
    profile: profileSchema,
    business: businessSchema,
    bank: bankSchema,
    documents: documentsSchema,
    kyc: kycSchema,
})

type RootForm = z.infer<typeof rootSchema>

/* -------------------------------
   Helpers: formatters & small utils
   ------------------------------- */
const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

function formatPan(val?: string) {
    if (!val) return val
    return val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10)
}
function formatGst(val?: string) {
    if (!val) return val
    return val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15)
}
function formatIfsc(val?: string) {
    if (!val) return val
    return val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11)
}
function formatAadhaar(val?: string) {
    if (!val) return val
    return val.replace(/[^0-9]/g, "").slice(0, 12)
}
function formatPhone(val?: string) {
    if (!val) return val
    return val.replace(/[^0-9]/g, "").slice(0, 10)
}

/* ---------------------------------------------------------
   Profile Tab
--------------------------------------------------------- */
function ProfileTab() {
    const { register, setValue, watch, formState: { errors }, trigger } = useFormContext<RootForm>()
    const photo = watch("profile.photoUrl")
    const status = watch("profile.status")

    return (
        <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
                <CardTitle className="text-white">Profile Information</CardTitle>
                <CardDescription className="text-gray-400">Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center space-x-6">
                    <Avatar className="w-24 h-24">
                        <AvatarImage src={photo || "/placeholder.svg"} alt="Profile" />
                        <AvatarFallback className="bg-gradient-to-r from-gold to-blue text-dark text-xl">
                            {watch("profile.firstName")?.[0]}{watch("profile.lastName")?.[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <label className="inline-block">
                            <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    className="sr-only"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        try {
                                            const url = createPublicFilePath(file);
                                            // set the returned public path into the form
                                            setValue("profile.photoUrl", url, { shouldValidate: true });
                                            // trigger validation if you want
                                            trigger("profile.photoUrl");
                                        } catch (err: any) {
                                            console.error("Upload failed", err);
                                        }
                                    }}
                                />
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Photo
                            </Button>
                        </label>
                        <p className="text-gray-400 text-sm mt-2">JPG, PNG or GIF. Max size 2MB.</p>
                    </div>
                </div>

                <div className="flex items-center justify-start space-x-3">
                    <Switch id="profileIsActive" checked={status} onCheckedChange={(v) => setValue("profile.status", { shouldValidate: true })} />
                    <Label className="text-gray-300">{status ? "Active" : "Inactive"}</Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-white">First Name</Label>
                        <Input
                            id="firstName"
                            {...register("profile.firstName", {
                                onBlur: () => trigger("profile.firstName")
                            })}
                            className="bg-gray-800 border-gray-700 text-white"
                        />

                        {errors.profile?.firstName && <p className="text-red-400 text-sm">{errors.profile.firstName.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-white">Last Name</Label>
                        <Input id="lastName" {...register("profile.lastName", { onBlur: () => trigger("profile.lastName") })} className="bg-gray-800 border-gray-700 text-white" />
                        {errors.profile?.lastName && <p className="text-red-400 text-sm">{errors.profile.lastName.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-white">Email Address</Label>
                        <Input id="email" type="email" {...register("profile.email", { onBlur: () => trigger("profile.email") })} className="bg-gray-800 border-gray-700 text-white" />
                        {errors.profile?.email && <p className="text-red-400 text-sm">{errors.profile.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone" className="text-white">Phone Number</Label>
                        <Input
                            id="phone"
                            {...register("profile.contact", {
                                onBlur: (e: any) => {
                                    const formatted = formatPhone(e.target.value)
                                    e.target.value = formatted
                                    setValue("profile.contact", formatted, { shouldValidate: true })
                                    trigger("profile.contact")
                                }
                            })}
                            className="bg-gray-800 border-gray-700 text-white"
                        />
                        {errors.profile?.contact && <p className="text-red-400 text-sm">{errors.profile.contact.message}</p>}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

/* ---------------------------------------------------------
   Business Tab
--------------------------------------------------------- */
function BusinessTab() {
    const { register, setValue, trigger, watch, formState: { errors } } = useFormContext<RootForm>();
    const businessType = watch("business.businessType")
    return (
        <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
                <CardTitle className="text-white">Business Information</CardTitle>
                <CardDescription className="text-gray-400">Manage your organization details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="companyName" className="text-white">Company Name</Label>
                        <Input id="companyName" {...register("business.companyName", { onBlur: () => trigger("business.companyName") })} className="bg-gray-800 border-gray-700 text-white" />
                        {errors.business?.companyName && <p className="text-red-400 text-sm">{errors.business.companyName.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pocName" className="text-white">Point of Contact</Label>
                        <Input id="pocName" {...register("business.pocName", { onBlur: () => trigger("business.pocName") })} className="bg-gray-800 border-gray-700 text-white" />
                        {errors.business?.pocName && <p className="text-red-400 text-sm">{errors.business.pocName.message}</p>}
                    </div>
                    {/* Lender Type */}
                    <div className="space-y-2">
                        <Label className="text-gray-300 font-medium">Lender Type</Label>
                        <Select
                            value={businessType || ""}
                            onValueChange={(value) =>
                                setValue("business.businessType", value as BusinessType, { shouldValidate: true })
                            }
                        >
                            <SelectTrigger className="bg-gray-800 border-gray-700 text-white h-11">
                                <SelectValue placeholder="Select Lender Type" />
                            </SelectTrigger>
                            <SelectContent className="glass-card border-white/10">
                                <SelectItem value={BusinessType.PRIVATE_LIMITED} className="text-black hover:bg-white/10 cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <Building className="w-4 h-4" />
                                        <span>PRIVATE LIMITED</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value={BusinessType.PUBLIC_LIMITED} className="text-black hover:bg-white/10 cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <Landmark className="w-4 h-4" />
                                        <span>PUBLIC LIMITED</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value={BusinessType.PROPRIETORSHIP} className="text-black hover:bg-white/10 cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <Cpu className="w-4 h-4" />
                                        <span>PROPRIETORSHIP</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value={BusinessType.PARTNERSHIP} className="text-black hover:bg-white/10 cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <Cpu className="w-4 h-4" />
                                        <span>PARTNERSHIP</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value={BusinessType.LLP} className="text-black hover:bg-white/10 cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <Cpu className="w-4 h-4" />
                                        <span>LLP</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        {/* Hidden field to sync with react-hook-form */}
                        <input type="hidden" {...register("business.businessType")} />
                        {errors.business?.businessType && (
                            <p className="text-red-400 text-sm">{errors.business.businessType.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cinNumber" className="text-white">Registration Number</Label>
                        <Input id="cinNumber" {...register("business.cinNumber", { onBlur: () => trigger("business.cinNumber") })} className="bg-gray-800 border-gray-700 text-white" />
                        {errors.business?.cinNumber && <p className="text-red-400 text-sm">{errors.business.cinNumber.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="gstNumber" className="text-white">GST Number</Label>
                        <Input id="gstNumber" {...register("business.gstNumber", {
                            onBlur: (e: any) => {
                                const formatted = formatGst(e.target.value)
                                e.target.value = formatted
                                setValue("business.gstNumber", formatted, { shouldValidate: true })
                                trigger("business.gstNumber")
                            }
                        })} className="bg-gray-800 border-gray-700 text-white" />
                        {errors.business?.gstNumber && <p className="text-red-400 text-sm">{errors.business.gstNumber.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="panNumber" className="text-white">TAN Number</Label>
                        <Input id="panNumber" {...register("business.tanNumber", { onBlur: () => trigger("business.tanNumber") })} className="bg-gray-800 border-gray-700 text-white" />
                        {errors.business?.tanNumber && <p className="text-red-400 text-sm">{errors.business.tanNumber.message}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="address" className="text-white">Registered Address</Label>
                    <Textarea id="address" {...register("business.registeredAddress", { onBlur: () => trigger("business.registeredAddress") })} className="bg-gray-800 border-gray-700 text-white" rows={3} />
                    {errors.business?.registeredAddress && <p className="text-red-400 text-sm">{errors.business.registeredAddress.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="teamMembers" className="text-white">Team Members</Label>
                        <Textarea id="teamMembers" {...register("business.teamMembers")} className="bg-gray-800 border-gray-700 text-white" rows={2} placeholder="Comma separated list of team member emails or IDs" />
                        <p className="text-gray-400 text-sm">Add team members to your aggregator account (comma separated).</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-white font-semibold">Financial Snapshot</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="space-y-1">
                            <Label className="text-gray-300">Applications</Label>
                            <Input type="number" {...register("business.totalApplicationsSubmitted", { valueAsNumber: true })} className="bg-gray-800 border-gray-700 text-white" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-gray-300">Disbursed</Label>
                            <Input type="number" {...register("business.totalApplicationsDisbursed", { valueAsNumber: true })} className="bg-gray-800 border-gray-700 text-white" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-gray-300">Commission</Label>
                            <Input type="number" step="0.01" {...register("business.totalCommissionEarned", { valueAsNumber: true })} className="bg-gray-800 border-gray-700 text-white" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-gray-300">Paid Out</Label>
                            <Input type="number" step="0.01" {...register("business.totalPaidOut", { valueAsNumber: true })} className="bg-gray-800 border-gray-700 text-white" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-gray-300">Pending Payout</Label>
                            <Input type="number" step="0.01" {...register("business.pendingPayout", { valueAsNumber: true })} className="bg-gray-800 border-gray-700 text-white" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="website" className="text-white">Website</Label>
                        <Input id="website" {...register("business.websiteUrl", { onBlur: () => trigger("business.websiteUrl") })} className="bg-gray-800 border-gray-700 text-white" />
                        {errors.business?.websiteUrl && <p className="text-red-400 text-sm">{errors.business.websiteUrl.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="city" className="text-white">City</Label>
                        <Input id="city" {...register("business.city", { onBlur: () => trigger("business.city") })} className="bg-gray-800 border-gray-700 text-white" />
                        {errors.business?.city && <p className="text-red-400 text-sm">{errors.business.city.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="state" className="text-white">State</Label>
                        <Input id="state" {...register("business.state", { onBlur: () => trigger("business.state") })} className="bg-gray-800 border-gray-700 text-white" />
                        {errors.business?.state && <p className="text-red-400 text-sm">{errors.business.state.message}</p>}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

/* ---------------------------------------------------------
   Banking Tab
--------------------------------------------------------- */
function BankingTab() {
    const { register, formState: { errors }, trigger, setValue, watch } = useFormContext<RootForm>()
    const bankVerified = watch("bank.isBankVerified")
    return (
        <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
                <CardTitle className="text-white">Banking</CardTitle>
                <CardDescription className="text-gray-400">Update bank details for payouts</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-end mb-4">
                    <div className="flex items-center space-x-3">
                        <span className="text-gray-300">Bank Verified</span>
                        <Switch id="isBankVerified" checked={bankVerified} onCheckedChange={(v) => setValue("bank.isBankVerified", v as boolean, { shouldValidate: true })} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="accountHolderName" className="text-white">Account Holder Name</Label>
                        <Input id="accountHolderName" {...register("bank.accountHolderName", { onBlur: () => trigger("bank.accountHolderName") })} className="bg-gray-800 border-gray-700 text-white" />
                        {errors.bank?.accountHolderName && <p className="text-red-400 text-sm">{errors.bank.accountHolderName.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="accountNumber" className="text-white">Account Number</Label>
                        <Input id="accountNumber" {...register("bank.accountNumber", { onBlur: () => trigger("bank.accountNumber") })} className="bg-gray-800 border-gray-700 text-white" />
                        {errors.bank?.accountNumber && <p className="text-red-400 text-sm">{errors.bank.accountNumber.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ifsc" className="text-white">IFSC Code</Label>
                        <Input id="ifsc" {...register("bank.ifscCode", {
                            onBlur: (e: any) => {
                                const formatted = formatIfsc(e.target.value)
                                e.target.value = formatted
                                setValue("bank.ifscCode", formatted, { shouldValidate: true })
                                trigger("bank.ifscCode")
                            }
                        })} className="bg-gray-800 border-gray-700 text-white" />
                        {errors.bank?.ifscCode && <p className="text-red-400 text-sm">{errors.bank.ifscCode.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bankName" className="text-white">Bank Name</Label>
                        <Input id="bankName" {...register("bank.bankName", { onBlur: () => trigger("bank.bankName") })} className="bg-gray-800 border-gray-700 text-white" />
                        {errors.bank?.bankName && <p className="text-red-400 text-sm">{errors.bank.bankName.message}</p>}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

/* ---------------------------------------------------------
   KYC Tab
--------------------------------------------------------- */
function KycTab() {
    const { register, formState: { errors }, setValue, trigger } = useFormContext<RootForm>()
    const [aadhaarFrontPreview, setAadhaarFrontPreview] = useState<string | null>(null)
    const [aadhaarBackPreview, setAadhaarBackPreview] = useState<string | null>(null)
    const [panImagePreview, setPanImagePreview] = useState<string | null>(null)
    const [incorporationPreview, setIncorporationPreview] = useState<string | null>(null)
    const [bankStatementPreview, setBankStatementPreview] = useState<string | null>(null)
    const [cancelledChequePreview, setCancelledChequePreview] = useState<string | null>(null)
    const [addressProofPreview, setAddressProofPreview] = useState<string | null>(null)
    const [authorizedSignatoryPreview, setAuthorizedSignatoryPreview] = useState<string | null>(null)

    return (
        <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
                <CardTitle className="text-white">KYC Documents</CardTitle>
                <CardDescription className="text-gray-400">Upload your verification documents</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 p-4 bg-gray-800/30 rounded">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-white font-semibold">KYC Status</h4>
                            <p className="text-gray-400 text-sm">Set or review the KYC verification status.</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Select onValueChange={(v) => setValue("kyc.kycStatus", v as string, { shouldValidate: true })} defaultValue="">
                                <SelectTrigger className="glass-input text-black h-10 w-48">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent className="glass-card border-white/10">
                                    <SelectItem value="PENDING">PENDING</SelectItem>
                                    <SelectItem value="APPROVED">APPROVED</SelectItem>
                                    <SelectItem value="REJECTED">REJECTED</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-gray-300">Rejection Reason (if any)</Label>
                            <Input {...register("kyc.kycRejectionReason")} className="bg-gray-800 border-gray-700 text-white" />
                        </div>
                        <div>
                            <Label className="text-gray-300">Approved At</Label>
                            <Input type="datetime-local" {...register("kyc.kycApprovedAt")} className="bg-gray-800 border-gray-700 text-white" />
                        </div>
                        <div className="md:col-span-2">
                            <Label className="text-gray-300">Approved By</Label>
                            <Input {...register("kyc.kycApprovedBy")} className="bg-gray-800 border-gray-700 text-white" />
                        </div>
                    </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="aadhaarNumber" className="text-gray-300">Aadhaar Number</Label>
                    <Input id="aadhaarNumber" {...register("documents.aadhaarNumber", {
                        onBlur: (e: any) => {
                            const formatted = formatAadhaar(e.target.value)
                            e.target.value = formatted
                            setValue("documents.aadhaarNumber", formatted, { shouldValidate: true })
                            trigger("documents.aadhaarNumber")
                        }
                    })} className="bg-gray-800 border-gray-700 text-white" placeholder="Enter 12-digit Aadhaar" />
                    {errors.documents?.aadhaarNumber && <p className="text-red-400 text-sm">{errors.documents.aadhaarNumber.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="aadhaarFront" className="text-gray-300">Aadhaar Front</Label>
                    <input
                        id="aadhaarFront"
                        type="file"
                        accept="image/*"
                        className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-gray-800 file:text-gray-300"
                        onChange={(e) => {
                            if (e.target.files?.[0]) {
                                setAadhaarFrontPreview("https://placeholder.com/aadhaar-front.jpg")
                            }
                        }}
                    />
                    {aadhaarFrontPreview && <img src={aadhaarFrontPreview} alt="Preview" className="mt-2 h-32 rounded" />}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="aadhaarBack" className="text-gray-300">Aadhaar Back</Label>
                    <input
                        id="aadhaarBack"
                        type="file"
                        accept="image/*"
                        className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-gray-800 file:text-gray-300"
                        onChange={(e) => {
                            if (e.target.files?.[0]) {
                                setAadhaarBackPreview("https://placeholder.com/aadhaar-back.jpg")
                            }
                        }}
                    />
                    {aadhaarBackPreview && <img src={aadhaarBackPreview} alt="Preview" className="mt-2 h-32 rounded" />}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="panNumber" className="text-gray-300">PAN Number</Label>
                    <Input id="panNumber" {...register("documents.panNumber", {
                        onBlur: (e: any) => {
                            const formatted = formatPan(e.target.value)
                            e.target.value = formatted
                            setValue("documents.panNumber", formatted, { shouldValidate: true })
                            trigger("documents.panNumber")
                        }
                    })} className="bg-gray-800 border-gray-700 text-white" placeholder="Enter 10-character PAN" />
                    {errors.documents?.panNumber && <p className="text-red-400 text-sm">{errors.documents.panNumber.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="panImage" className="text-gray-300">PAN Card Image</Label>
                    <input
                        id="panImage"
                        type="file"
                        accept="image/*"
                        className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-gray-800 file:text-gray-300"
                        onChange={(e) => {
                            if (e.target.files?.[0]) {
                                setPanImagePreview("https://placeholder.com/pan-card.jpg")
                            }
                        }}
                    />
                    {panImagePreview && <img src={panImagePreview} alt="Preview" className="mt-2 h-32 rounded" />}
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="incorporationCertificate" className="text-gray-300">Incorporation Certificate</Label>
                    <input
                        id="incorporationCertificate"
                        type="file"
                        accept="image/*,application/pdf"
                        className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-gray-800 file:text-gray-300"
                        onChange={(e) => {
                            if (e.target.files?.[0]) {
                                setIncorporationPreview("https://placeholder.com/incorporation.jpg")
                            }
                        }}
                    />
                    {incorporationPreview && <img src={incorporationPreview} alt="Incorporation" className="mt-2 h-32 rounded" />}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="bankStatement" className="text-gray-300">Bank Statement</Label>
                    <input
                        id="bankStatement"
                        type="file"
                        accept="image/*,application/pdf"
                        className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-gray-800 file:text-gray-300"
                        onChange={(e) => {
                            if (e.target.files?.[0]) {
                                setBankStatementPreview("https://placeholder.com/bank-statement.jpg")
                            }
                        }}
                    />
                    {bankStatementPreview && <img src={bankStatementPreview} alt="Bank Statement" className="mt-2 h-32 rounded" />}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="cancelledCheque" className="text-gray-300">Cancelled Cheque</Label>
                    <input
                        id="cancelledCheque"
                        type="file"
                        accept="image/*,application/pdf"
                        className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-gray-800 file:text-gray-300"
                        onChange={(e) => {
                            if (e.target.files?.[0]) {
                                setCancelledChequePreview("https://placeholder.com/cheque.jpg")
                            }
                        }}
                    />
                    {cancelledChequePreview && <img src={cancelledChequePreview} alt="Cancelled Cheque" className="mt-2 h-32 rounded" />}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="addressProof" className="text-gray-300">Address Proof</Label>
                    <input
                        id="addressProof"
                        type="file"
                        accept="image/*,application/pdf"
                        className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-gray-800 file:text-gray-300"
                        onChange={(e) => {
                            if (e.target.files?.[0]) {
                                setAddressProofPreview("https://placeholder.com/address-proof.jpg")
                            }
                        }}
                    />
                    {addressProofPreview && <img src={addressProofPreview} alt="Address Proof" className="mt-2 h-32 rounded" />}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="authorizedSignatory" className="text-gray-300">Authorized Signatory ID</Label>
                    <input
                        id="authorizedSignatory"
                        type="file"
                        accept="image/*,application/pdf"
                        className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-gray-800 file:text-gray-300"
                        onChange={(e) => {
                            if (e.target.files?.[0]) {
                                setAuthorizedSignatoryPreview("https://placeholder.com/signatory.jpg")
                            }
                        }}
                    />
                    {authorizedSignatoryPreview && <img src={authorizedSignatoryPreview} alt="Authorized" className="mt-2 h-32 rounded" />}
                </div>
            </CardContent>
        </Card>
    )
}

/* ---------------------------------------------------------
   Main Component
--------------------------------------------------------- */
export function AggregatorProfilePage({ id }) {
    const { data: aggData, isLoading: aggLoading } = useAggregator(id ?? null, true)
    const updateUserHook = useUpdateUser()
    const updateAggHook = useUpdateAggregatorProfile()
    const updateKycStatusHook = useUpdateAggregatorKycStatus()
    const { toast } = useToast()

    const [activeTab, setActiveTab] = useState<"profile" | "business" | "banking" | "kyc">("profile")
    const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(["profile"]))
    const [isSaving, setIsSaving] = useState(false)

    console.log(aggData, id, 'this is aggregator data')
    const methods = useForm<RootForm>({
        resolver: zodResolver(rootSchema),
        mode: "onBlur",
        defaultValues: {
            profile: {
                firstName: "",
                lastName: "",
                email: "",
                contact: "",
                status: '',
            },
            business: {
                companyName: "",
                pocName: "",
                teamMembers: "",
                totalApplicationsSubmitted: undefined,
                totalApplicationsDisbursed: undefined,
                totalCommissionEarned: undefined,
                totalPaidOut: undefined,
                pendingPayout: undefined,
            },
            bank: {},
            documents: {},
            kyc: {},
        },
    })

    const { handleSubmit, trigger, reset } = methods
    // Populate form when data loads
    useEffect(() => {
        if (aggData) {
            const nameParts = aggData.user?.username?.split(" ") || ["", ""]

            reset({
                profile: {
                    userId: aggData.user?._id,
                    firstName: nameParts[0] || "",
                    lastName: nameParts.slice(1).join(" ") || "",
                    email: aggData.user?.email || "",
                    contact: aggData.user?.contact || "",
                    photoUrl: aggData.user?.photoUrl || "",
                    status: aggData.user?.status || "",
                },
                business: {
                    id: aggData._id,
                    companyName: aggData.companyName || "",
                    businessType: aggData.businessType
                        ? (aggData.businessType.toLowerCase() as BusinessType)
                        : undefined,
                    gstNumber: aggData.gstNumber || "",
                    panNumber: aggData.panNumber || "",
                    cinNumber: aggData.cinNumber || "",
                    websiteUrl: aggData.websiteUrl || "",
                    registeredAddress: aggData.registeredAddress || "",
                    city: aggData.city || "",
                    state: aggData.state || "",
                    pincode: aggData.pincode || "",
                    pocName: aggData.pocName || "",
                    teamMembers: (aggData.teamMembers && Array.isArray(aggData.teamMembers)) ? aggData.teamMembers.join(", ") : "",
                    totalApplicationsSubmitted: (aggData as any).totalApplicationsSubmitted || undefined,
                    totalApplicationsDisbursed: (aggData as any).totalApplicationsDisbursed || undefined,
                    totalCommissionEarned: (aggData as any).totalCommissionEarned || undefined,
                    totalPaidOut: (aggData as any).totalPaidOut || undefined,
                    pendingPayout: (aggData as any).pendingPayout || undefined,
                },
                bank: {
                    accountHolderName: aggData.accountHolderName || "",
                    accountNumber: aggData.accountNumber || "",
                    ifscCode: aggData.ifscCode || "",
                    bankName: aggData.bankName || "",
                    isBankVerified: (aggData as any).isBankVerified || false,
                },
                documents: {
                    aadhaarNumber: "",
                    panNumber: aggData.panNumber || "",
                    gstNumber: aggData.gstNumber || "",
                    incorporationCertificate: (aggData as any).documents?.incorporationCertificate || "",
                    bankStatement: (aggData as any).documents?.bankStatement || "",
                    cancelledCheque: (aggData as any).documents?.cancelledCheque || "",
                    addressProof: (aggData as any).documents?.addressProof || "",
                    authorizedSignatory: (aggData as any).documents?.authorizedSignatory || "",
                },
                kyc: {
                    kycStatus: (aggData as any).kycStatus || undefined,
                    kycRejectionReason: (aggData as any).kycRejectionReason || "",
                    kycApprovedAt: (aggData as any).kycApprovedAt || "",
                    kycApprovedBy: (aggData as any).kycApprovedBy || "",
                },
            })
        }
    }, [aggData, reset])

    useEffect(() => {
        setVisitedTabs((prev) => new Set(prev).add(activeTab))
    }, [activeTab])

    const allTabsVisited = visitedTabs.has("profile") && visitedTabs.has("business") &&
        visitedTabs.has("banking") && visitedTabs.has("kyc")

    const onSaveAll = handleSubmit(async (values) => {
        setIsSaving(true)
        console.log(values, 'onsubmit')
        try {
            // Update User
            const userPayload = {
                id: values.profile.userId!,
                username: `${values.profile.firstName} ${values.profile.lastName}`.trim(),
                email: values.profile.email,
                contact: values.profile.contact,
                photoUrl: values.profile.photoUrl,
            }

            console.log(userPayload, 'userpayload')
            await updateUserHook.mutateAsync(userPayload)

            // Update Aggregator Profile
            const aggPayload = {
                id: values.business.id!,
                companyName: values.business.companyName,
                businessType: values.business.businessType?.toUpperCase() as BusinessType,
                registeredAddress: values.business.registeredAddress,
                city: values.business.city,
                state: values.business.state,
                pincode: values.business.pincode,
                websiteUrl: values.business.websiteUrl,
                pocName: values.business.pocName,
                gstNumber: values.business.gstNumber,
                panNumber: values.business.panNumber,
                cinNumber: values.business.cinNumber,
                teamMembers: values.business.teamMembers ? values.business.teamMembers.split(",").map((s: string) => s.trim()).filter(Boolean) : undefined,
                totalApplicationsSubmitted: values.business.totalApplicationsSubmitted,
                totalApplicationsDisbursed: values.business.totalApplicationsDisbursed,
                totalCommissionEarned: values.business.totalCommissionEarned,
                totalPaidOut: values.business.totalPaidOut,
                pendingPayout: values.business.pendingPayout,
                bankName: values.bank.bankName,
                accountNumber: values.bank.accountNumber,
                ifscCode: values.bank.ifscCode,
                accountHolderName: values.bank.accountHolderName,
                isBankVerified: values.bank.isBankVerified,
                documents: {
                    panCard: values.documents?.panCard || "https://placeholder.com/pan-card.jpg",
                    aadhaarFront: values.documents?.aadhaarFront || "https://placeholder.com/aadhaar-front.jpg",
                    aadhaarBack: values.documents?.aadhaarBack || "https://placeholder.com/aadhaar-back.jpg",
                    gstCertificate: values.documents?.gstCertificate || "https://placeholder.com/gst-cert.jpg",
                    incorporationCertificate: values.documents?.incorporationCertificate || "https://placeholder.com/incorporation.jpg",
                    bankStatement: values.documents?.bankStatement || "https://placeholder.com/bank-statement.jpg",
                    cancelledCheque: values.documents?.cancelledCheque || "https://placeholder.com/cheque.jpg",
                    addressProof: values.documents?.addressProof || "https://placeholder.com/address-proof.jpg",
                    authorizedSignatory: values.documents?.authorizedSignatory || "https://placeholder.com/signatory.jpg",
                },
                kycStatus: values.kyc?.kycStatus,
                kycRejectionReason: values.kyc?.kycRejectionReason,
                kycApprovedAt: values.kyc?.kycApprovedAt,
                kycApprovedBy: values.kyc?.kycApprovedBy,
            }

            console.log(aggPayload, 'aggpayload')
            await updateAggHook.mutateAsync(aggPayload)

            toast({
                title: "Success",
                description: "Profile updated successfully",
            })
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update profile",
                variant: "destructive",
            })
        } finally {
            setIsSaving(false)
        }
    })

    if (aggLoading) {
        return (
            <div className="space-y-6">
                <CardSkeleton headerLines={2} bodyHeight={400} />
            </div>
        )
    }

    return (
        <FormProvider {...methods}>
            <div className="space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-between items-center"
                >
                    <div>
                        <h1 className="text-3xl font-bold text-white">Aggregator Profile</h1>
                        <p className="text-gray-400 mt-1">Manage Account and Business preferences</p>
                    </div>

                    <Button
                        className="bg-gradient-to-r from-blue to-cyan-500 text-dark"
                        onClick={async () => {
                            // trigger all fields validation before saving
                            const ok = await trigger()
                            if (!ok) {
                                toast({
                                    title: "Validation failed",
                                    description: "Please check all fields",
                                    variant: "destructive",
                                })
                                return
                            }
                            await onSaveAll()
                        }}
                        disabled={!allTabsVisited || isSaving}
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </motion.div>

                <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-6 ">
                    <TabsList className="bg-gray-900/50 border-gray-800 grid w-full grid-cols-4">
                        <TabsTrigger value="profile" className="data-[state=active]:bg-gradient-to-r from-blue to-cyan-500">
                            <User className="w-4 h-4 mr-2" />
                            Profile
                        </TabsTrigger>
                        <TabsTrigger value="business" className="data-[state=active]:bg-gradient-to-r from-blue to-cyan-500">
                            <Building2 className="w-4 h-4 mr-2" />
                            Business
                        </TabsTrigger>
                        <TabsTrigger value="banking" className="data-[state=active]:bg-gradient-to-r from-blue to-cyan-500">
                            <CreditCard className="w-4 h-4 mr-2" />
                            Banking
                        </TabsTrigger>
                        <TabsTrigger value="kyc" className="data-[state=active]:bg-gradient-to-r from-blue to-cyan-500">
                            <Bell className="w-4 h-4 mr-2" />
                            KYC
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile"><ProfileTab /></TabsContent>
                    <TabsContent value="business"><BusinessTab /></TabsContent>
                    <TabsContent value="banking"><BankingTab /></TabsContent>
                    <TabsContent value="kyc"><KycTab /></TabsContent>
                </Tabs>
            </div>
        </FormProvider>
    )
}
