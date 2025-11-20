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
  aadhaarFront: z.string().optional(),
  aadhaarBack: z.string().optional(),
})

const rootSchema = z.object({
  profile: profileSchema,
  business: businessSchema,
  bank: bankSchema,
  documents: documentsSchema,
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
  console.log(businessType, 'businesstype')
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
          {/* Lender Type */}
          <div className="space-y-2">
            <Label className="text-gray-300 font-medium">Lender Type</Label>
            <Select
              value={businessType || ""}
              onValueChange={(value) =>
                setValue("business.businessType", value as BusinessType, { shouldValidate: true })
              }
            >
              <SelectTrigger className="glass-input text-black h-11">
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
  const { register, formState: { errors }, trigger, setValue } = useFormContext<RootForm>()
  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Banking</CardTitle>
        <CardDescription className="text-gray-400">Update bank details for payouts</CardDescription>
      </CardHeader>
      <CardContent>
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

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">KYC Documents</CardTitle>
        <CardDescription className="text-gray-400">Upload your verification documents</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </CardContent>
    </Card>
  )
}

/* ---------------------------------------------------------
   Main Component
--------------------------------------------------------- */
export function AggregatorSettings() {
  const { user } = useAuth('aggregator_admin')
  const { data: userData, isLoading: userLoading } = useProfile(true)
  const { data: aggData, isLoading: aggLoading } = useAggregator(user?.profileId, true)
  const updateUserHook = useUpdateUser()
  const updateAggHook = useUpdateAggregatorProfile()
  const updateKycStatusHook = useUpdateAggregatorKycStatus()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<"profile" | "business" | "banking" | "kyc">("profile")
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(["profile"]))
  const [isSaving, setIsSaving] = useState(false)

  const methods = useForm<RootForm>({
    resolver: zodResolver(rootSchema),
    mode: "onBlur",
    defaultValues: {
      profile: {
        firstName: "",
        lastName: "",
        email: "",
        contact: "",
      },
      business: {
        companyName: "",
      },
      bank: {},
      documents: {},
    },
  })

  const { handleSubmit, trigger, reset } = methods
  // Populate form when data loads
  useEffect(() => {
    if (userData && aggData) {
      const agg = aggData

      const nameParts = userData.username?.split(" ") || ["", ""]

      reset({
        profile: {
          userId: userData._id,
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          email: userData.email || "",
          contact: userData.contact || "",
          photoUrl: userData.photoUrl || "",
        },
        business: {
          id: agg._id,
          companyName: agg.companyName || "",
          businessType: agg.businessType
            ? (agg.businessType.toLowerCase() as BusinessType)
            : undefined,
          gstNumber: agg.gstNumber || "",
          panNumber: agg.panNumber || "",
          cinNumber: agg.cinNumber || "",
          websiteUrl: agg.websiteUrl || "",
          registeredAddress: agg.registeredAddress || "",
          city: agg.city || "",
          state: agg.state || "",
          pincode: agg.pincode || ""
        },
        bank: {
          accountHolderName: agg.accountHolderName || "",
          accountNumber: agg.accountNumber || "",
          ifscCode: agg.ifscCode || "",
          bankName: agg.bankName || "",
        },
        documents: {
          aadhaarNumber: "",
          panNumber: agg.panNumber || "",
          gstNumber: agg.gstNumber || "",
        },
      })
    }
  }, [userData, aggData, reset])

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
        gstNumber: values.business.gstNumber,
        panNumber: values.business.panNumber,
        cinNumber: values.business.cinNumber,
        bankName: values.bank.bankName,
        accountNumber: values.bank.accountNumber,
        ifscCode: values.bank.ifscCode,
        accountHolderName: values.bank.accountHolderName,
        documents: {
          panCard: "https://placeholder.com/pan-card.jpg",
          aadhaarFront: "https://placeholder.com/aadhaar-front.jpg",
          aadhaarBack: "https://placeholder.com/aadhaar-back.jpg",
          gstCertificate: "https://placeholder.com/gst-cert.jpg",
        },
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

  if (userLoading || aggLoading) {
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
            <h1 className="text-3xl font-bold text-white">Settings</h1>
            <p className="text-gray-400 mt-1">Manage your account and business preferences</p>
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

        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-6">
          <TabsList className="bg-gray-900/50 border-gray-800 grid w-full grid-cols-4">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="business">
              <Building2 className="w-4 h-4 mr-2" />
              Business
            </TabsTrigger>
            <TabsTrigger value="banking">
              <CreditCard className="w-4 h-4 mr-2" />
              Banking
            </TabsTrigger>
            <TabsTrigger value="kyc">
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
