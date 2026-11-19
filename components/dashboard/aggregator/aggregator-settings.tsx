"use client";

import React, { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import confetti from 'canvas-confetti';
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
import { Badge } from "@/components/ui/badge"
import {
  User,
  Building2,
  FileCheck,
  Upload,
  Save,
  Building,
  Landmark,
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  X,
  FileText,
  UserCheck,
} from "lucide-react"
import { CardSkeleton } from "@/components/ui/loading-skeleton"
import { useForm, FormProvider, useFormContext } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useToast } from "@/hooks/use-toast"

import { useAuth } from "@/lib/auth"
import { useProfile, useUpdateUser } from "@/hooks/use-users"
import {
  useAggregator,
  useUpdateAggregatorProfile
} from "@/hooks/use-aggregators"
import { ApplicableFor, AggregatorType, BusinessType, KYCStatus } from "@/lib"
import { uploadToS3, getCookie, decodeJwt } from "@/lib/utils"
import { ProfileCompletionBanner } from "@/components/ui/progressbar"

// VALIDATION SCHEMAS (Optional Fields with Format Validation)
const profileSchema = z.object({
  userId: z.string().optional(),
  firstName: z.string().optional().refine(val => !val || val.trim().length >= 2, "First name must be at least 2 chars"),
  lastName: z.string().optional(),
  email: z.string().optional().refine(val => !val || val.trim() === "" || /\S+@\S+\.\S+/.test(val.trim()), "Invalid email"),
  contact: z.string().optional().refine(val => !val || val.trim() === "" || /^[0-9]{10}$/.test(val.replace(/\D/g, "")), "Phone must be 10 digits"),
  status: z.string().optional(),
  photoUrl: z.string().optional(),
})

const businessSchema = z.object({
  id: z.string().optional(),
  companyName: z.string().optional().refine(val => !val || val.trim().length >= 2, "Company name must be at least 2 chars"),
  aggregatorType: z.any().optional(),
  businessType: z.any().optional(),
  rank: z.any().optional(),
  yearOfEstablishment: z.string().optional().refine(val => !val || val.trim() === "" || /^[0-9]{4}$/.test(val.trim()), "Must be YYYY format"),
  registeredAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional().refine(val => !val || val.trim() === "" || /^[0-9]{6}$/.test(val.trim()), "Pincode must be 6 digits"),
  websiteUrl: z.string().optional(),
  gstNumber: z.string().optional().refine(
    val => !val || val.trim() === "" || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i.test(val.trim()),
    "Invalid GST Number"
  ),
  panNumber: z.string().optional().refine(
    val => !val || val.trim() === "" || /^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(val.trim()),
    "Invalid PAN Number"
  ),
  aadhaarNumber: z.string().optional().refine(
    val => !val || val.trim() === "" || /^[0-9]{12}$/.test(val.replace(/\D/g, "")),
    "Aadhaar must be 12 digits"
  ),
  tanNumber: z.string().optional(),
  cinNumber: z.string().optional(),
})

const bankAndKycSchema = z.object({
  accountHolderName: z.string().optional(),
  accountNumber: z.string().optional().refine(
    val => !val || val.trim() === "" || /^[0-9]{9,18}$/.test(val.replace(/\s/g, "")),
    "Invalid account number"
  ),
  ifscCode: z.string().optional().refine(
    val => !val || val.trim() === "" || /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(val.trim()),
    "Invalid IFSC code"
  ),
  bankName: z.string().optional(),
  kycStatus: z.any().optional(),
  kycRejectionReason: z.string().optional(),
  kycApprovedAt: z.string().optional(),
  kycApprovedBy: z.string().optional(),
})

const documentsSchema = z.object({
  aadhaarFront: z.string().optional(),
  aadhaarBack: z.string().optional(),
  panCard: z.string().optional(),
  gstCertificate: z.string().optional(),
  incorporationCertificate: z.string().optional(),
  bankStatement: z.string().optional(),
  cancelledCheque: z.string().optional(),
  addressProof: z.string().optional()
})

const rootSchema = z.object({
  profile: profileSchema,
  business: businessSchema,
  bankAndKyc: bankAndKycSchema,
  documents: documentsSchema,
})

type RootForm = z.infer<typeof rootSchema>

//  Helper functions
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

const getStatusColor = (status?: string) => {
  if (!status) return 'bg-gray-500/20 text-muted-foreground'
  switch (status.toUpperCase()) {
    case 'ACTIVE': return 'bg-green-500/20 text-green-400'
    case 'PENDING_APPROVAL': return 'bg-orange-500/20 text-orange-400'
    case 'SUSPENDED':
    case 'INACTIVE': return 'bg-red-500/20 text-red-400'
    default: return 'bg-gray-500/20 text-muted-foreground'
  }
}

const getKycStatusColor = (status?: string) => {
  switch (status?.toUpperCase()) {
    case 'APPROVED': return 'bg-green-500/20 text-green-400 border-green-500/50'
    case 'REJECTED': return 'bg-red-500/20 text-red-400 border-red-500/50'
    case 'UNDER_REVIEW': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
    case 'PENDING': return 'bg-gray-500/20 text-muted-foreground border-gray-500/50'
    default: return 'bg-gray-500/20 text-muted-foreground border-gray-500/50'
  }
}

const getKycStatusIcon = (status?: string) => {
  switch (status?.toUpperCase()) {
    case 'APPROVED': return <CheckCircle2 className="w-5 h-5 text-green-400" />
    case 'REJECTED': return <XCircle className="w-5 h-5 text-red-400" />
    case 'UNDER_REVIEW': return <Clock className="w-5 h-5 text-yellow-400" />
    case 'PENDING': return <AlertCircle className="w-5 h-5 text-muted-foreground" />
    default: return <AlertCircle className="w-5 h-5 text-muted-foreground" />
  }
}

//  TAB 1: PROFILE & CONTACT
function ProfileAndContactTab({ readonly = false }: { readonly?: boolean }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { register, setValue, watch, formState: { errors }, trigger } = useFormContext<RootForm>()

  const profileStatus = watch("profile.status")
  const savedPhotoUrl = watch("profile.photoUrl")
  const displayPhoto = previewUrl || savedPhotoUrl
  const uploadButtonLabel = savedPhotoUrl ? "Re-upload Photo" : "Upload Photo"

  return (
    <Card className="bg-background/50 border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <User className="w-5 h-5" />
          Profile & Contact Information
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Personal details and primary contact information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Photo Section */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 pb-6 border-b border-border text-center sm:text-left">
          <div className="relative">
            <Avatar className="w-20 h-20 sm:w-24 sm:h-24">
              <AvatarImage src={displayPhoto || undefined} alt="Profile" />
              <AvatarFallback className="bg-muted text-xl font-semibold">
                {watch("profile.firstName")?.[0]}
                {watch("profile.lastName")?.[0]}
              </AvatarFallback>
            </Avatar>

            {/* Remove button */}
            {previewUrl && (
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(previewUrl)
                  setPreviewUrl(null)
                  setValue("profile.photoUrl", savedPhotoUrl || "", {
                    shouldDirty: true,
                  })
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ""
                  }
                }}
                className="absolute -top-2 -right-2 bg-black/70 hover:bg-black text-white rounded-full p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Upload Button */}
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return

                if (file.size > 2 * 1024 * 1024) {
                  console.error("File exceeds 2MB")
                  return
                }

                const localPreview = URL.createObjectURL(file)
                setPreviewUrl(localPreview)

                const uploadedUrl = await uploadToS3(
                  file,
                  `profile-photos/${Date.now()}-${file.name}`
                )

                setValue("profile.photoUrl", uploadedUrl, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploadButtonLabel}
            </Button>

            <p className="text-muted-foreground text-xs sm:text-sm mt-2">
              JPG, PNG or GIF. Max size 2MB.
            </p>
          </div>

          <div className="w-full sm:w-auto flex justify-center sm:justify-end mt-2 sm:mt-0">
            <Badge className={`${getStatusColor(profileStatus)} px-4 py-1.5`}>
              {profileStatus || "N/A"}
            </Badge>
          </div>
        </div>

        {/* Name & Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-foreground">First Name *</Label>
            <Input
              id="firstName"
              {...register("profile.firstName", { onBlur: () => trigger("profile.firstName") })}
              className="bg-card border-border text-foreground"
              placeholder="Enter first name"
            />
            {errors.profile?.firstName && <p className="text-red-400 text-sm">{errors.profile.firstName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-foreground">Last Name</Label>
            <Input
              id="lastName"
              {...register("profile.lastName", { onBlur: () => trigger("profile.lastName") })}
              className="bg-card border-border text-foreground"
              placeholder="Enter last name"
            />
            {errors.profile?.lastName && <p className="text-red-400 text-sm">{errors.profile.lastName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email Address *</Label>
            <Input
              id="email"
              type="email"
              {...register("profile.email", { onBlur: () => trigger("profile.email") })}
              className="bg-card border-border text-foreground"
              placeholder="email@example.com"
              disabled={readonly}
            />
            {errors.profile?.email && <p className="text-red-400 text-sm">{errors.profile.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-foreground">Phone Number *</Label>
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
              className="bg-card border-border text-foreground"
              placeholder="10-digit mobile number"
            />
            {errors.profile?.contact && <p className="text-red-400 text-sm">{errors.profile.contact.message}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

//  TAB 2: BUSINESS & STATUTORY DETAILS
function BusinessDetailsTab({ readonly = false }: { readonly?: boolean }) {
  const { user } = useAuth()
  const { register, setValue, trigger, watch, formState: { errors } } = useFormContext<RootForm>()
  const businessType = watch("business.businessType")
  const rank = watch("business.rank")
  const isSuperAdmin = user?.role === "SUPER_ADMIN"

  return (
    <div className="space-y-6">
      {readonly && (
        <p className="text-xs text-muted-foreground italic px-1">
          🔒 Contact your Aggregator Admin to update company details.
        </p>
      )}
      <fieldset disabled={readonly} style={{ all: 'unset', display: 'contents' }}>
        {/* Company Information */}
        <Card className="bg-background/50 border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Company Information
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Organization details and business structure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-foreground">Company Name *</Label>
                <Input
                  id="companyName"
                  {...register("business.companyName", { onBlur: () => trigger("business.companyName") })}
                  className="bg-card border-border text-foreground"
                  placeholder="Registered company name"
                />
                {errors.business?.companyName && <p className="text-red-400 text-sm">{errors.business.companyName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-medium">Company Rank *</Label>
                {isSuperAdmin ? (
                  <>
                    <Select
                      value={rank || ""}
                      onValueChange={(value) =>
                        setValue("business.rank", value as ApplicableFor, { shouldValidate: true, shouldDirty: true })
                      }
                    >
                      <SelectTrigger className="bg-card border-border text-foreground h-11">
                        <SelectValue placeholder="Select Aggregator Rank" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value={ApplicableFor.GOLD_AGGREGATORS} className="text-foreground">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-amber-400" />
                            <span>Cat C — Gold (Individual Partners)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value={ApplicableFor.PLATINUM_AGGREGATORS} className="text-foreground">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-purple-400" />
                            <span>Cat B — Platinum (DSA Partners &lt; 1 Cr/Month)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value={ApplicableFor.MAGNUS_AGGREGATORS} className="text-foreground">
                          <div className="flex items-center gap-2">
                            <Landmark className="w-4 h-4 text-emerald-400" />
                            <span>Cat A — Magnus (Top DSA Partners)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <input type="hidden" {...register("business.rank")} />
                    {errors.business?.rank && <p className="text-red-400 text-sm">{errors.business.rank.message}</p>}
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between bg-card/50 border border-border rounded-lg px-4 py-3">
                      <span className="text-muted-foreground">Assigned Rank</span>
                      <Badge variant="outline" className="font-semibold">
                        {rank || "N/A"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Assigned by Admin
                    </p>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-medium">Aggregator Type *</Label>
                <div className="flex items-center justify-between bg-card/50 border border-border rounded-lg px-4 py-3">
                  <span className="text-muted-foreground">Assigned Type</span>
                  <Badge variant="outline" className="font-semibold flex items-center gap-1.5">
                    {watch("business.aggregatorType") === AggregatorType.SOURCER ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Sourcer</span>
                      </>
                    ) : watch("business.aggregatorType") === AggregatorType.CHANNEL_PARTNER ? (
                      <>
                        <Building className="w-3.5 h-3.5" />
                        <span>Channel Partner</span>
                      </>
                    ) : (
                      "N/A"
                    )}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Assigned by Admin
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-medium">Business Type *</Label>
                <Select
                  value={businessType || ""}
                  onValueChange={(value) =>
                    setValue("business.businessType", value as BusinessType, { shouldValidate: true })
                  }
                >
                  <SelectTrigger className="bg-card border-border text-foreground h-11">
                    <SelectValue placeholder="Select Business Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value={BusinessType.PROPRIETORSHIP} className="text-foreground">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        <span>Proprietorship</span>
                      </div>
                    </SelectItem>
                    <SelectItem value={BusinessType.PARTNERSHIP} className="text-foreground">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        <span>Partnership</span>
                      </div>
                    </SelectItem>
                    <SelectItem value={BusinessType.PRIVATE_LIMITED} className="text-foreground">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        <span>Private Limited</span>
                      </div>
                    </SelectItem>
                    <SelectItem value={BusinessType.PUBLIC_LIMITED} className="text-foreground">
                      <div className="flex items-center gap-2">
                        <Landmark className="w-4 h-4" />
                        <span>Public Limited</span>
                      </div>
                    </SelectItem>
                    <SelectItem value={BusinessType.LLP} className="text-foreground">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        <span>LLP</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <input type="hidden" {...register("business.businessType")} />
                {errors.business?.businessType && <p className="text-red-400 text-sm">{errors.business.businessType.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearOfEstablishment" className="text-foreground">Year of Establishment</Label>
                <Input
                  id="yearOfEstablishment"
                  {...register("business.yearOfEstablishment", { onBlur: () => trigger("business.yearOfEstablishment") })}
                  className="bg-card border-border text-foreground"
                  placeholder="YYYY (e.g., 2020)"
                />
                {errors.business?.yearOfEstablishment && <p className="text-red-400 text-sm">{errors.business.yearOfEstablishment.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="websiteUrl" className="text-foreground">Website URL</Label>
                <Input
                  id="websiteUrl"
                  {...register("business.websiteUrl", { onBlur: () => trigger("business.websiteUrl") })}
                  className="bg-card border-border text-foreground"
                  placeholder="https://example.com"
                />
                {errors.business?.websiteUrl && <p className="text-red-400 text-sm">{errors.business.websiteUrl.message}</p>}
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="registeredAddress" className="text-foreground">Registered Address *</Label>
              <Textarea
                id="registeredAddress"
                {...register("business.registeredAddress", { onBlur: () => trigger("business.registeredAddress") })}
                className="bg-card border-border text-foreground"
                rows={3}
                placeholder="Complete registered office address"
              />
              {errors.business?.registeredAddress && <p className="text-red-400 text-sm">{errors.business.registeredAddress.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-foreground">City *</Label>
                <Input
                  id="city"
                  {...register("business.city", { onBlur: () => trigger("business.city") })}
                  className="bg-card border-border text-foreground"
                  placeholder="City name"
                />
                {errors.business?.city && <p className="text-red-400 text-sm">{errors.business.city.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state" className="text-foreground">State *</Label>
                <Input
                  id="state"
                  {...register("business.state", { onBlur: () => trigger("business.state") })}
                  className="bg-card border-border text-foreground"
                  placeholder="State name"
                />
                {errors.business?.state && <p className="text-red-400 text-sm">{errors.business.state.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pincode" className="text-foreground">Pincode *</Label>
                <Input
                  id="pincode"
                  {...register("business.pincode", { onBlur: () => trigger("business.pincode") })}
                  className="bg-card border-border text-foreground"
                  placeholder="6-digit pincode"
                />
                {errors.business?.pincode && <p className="text-red-400 text-sm">{errors.business.pincode.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statutory Details */}
        <Card className="bg-background/50 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Statutory Details</CardTitle>
            <CardDescription className="text-muted-foreground">
              Tax registration and identification numbers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="panNumber" className="text-foreground">PAN Number *</Label>
                <Input
                  id="panNumber"
                  {...register("business.panNumber", {
                    onBlur: (e: any) => {
                      const formatted = formatPan(e.target.value)
                      e.target.value = formatted
                      setValue("business.panNumber", formatted, { shouldValidate: true })
                      trigger("business.panNumber")
                    }
                  })}
                  className="bg-card border-border text-foreground"
                  placeholder="ABCDE1234F"
                />
                {errors.business?.panNumber && <p className="text-red-400 text-sm">{errors.business.panNumber.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstNumber" className="text-foreground">GST Number</Label>
                <Input
                  id="gstNumber"
                  {...register("business.gstNumber", {
                    onBlur: (e: any) => {
                      const formatted = formatGst(e.target.value)
                      e.target.value = formatted
                      setValue("business.gstNumber", formatted, { shouldValidate: true })
                      trigger("business.gstNumber")
                    }
                  })}
                  className="bg-card border-border text-foreground"
                  placeholder="15-character GST"
                />
                {errors.business?.gstNumber && <p className="text-red-400 text-sm">{errors.business.gstNumber.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="aadhaarNumber" className="text-foreground">Aadhaar Number (Proprietor)</Label>
                <Input
                  id="aadhaarNumber"
                  {...register("business.aadhaarNumber", {
                    onBlur: (e: any) => {
                      const formatted = formatAadhaar(e.target.value)
                      e.target.value = formatted
                      setValue("business.aadhaarNumber", formatted, { shouldValidate: true })
                      trigger("business.aadhaarNumber")
                    }
                  })}
                  className="bg-card border-border text-foreground"
                  placeholder="12-digit Aadhaar"
                />
                {errors.business?.aadhaarNumber && <p className="text-red-400 text-sm">{errors.business.aadhaarNumber.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cinNumber" className="text-foreground">CIN / Registration Number</Label>
                <Input
                  id="cinNumber"
                  {...register("business.cinNumber", { onBlur: () => trigger("business.cinNumber") })}
                  className="bg-card border-border text-foreground"
                  placeholder="Company/LLP registration number"
                />
                {errors.business?.cinNumber && <p className="text-red-400 text-sm">{errors.business.cinNumber.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tanNumber" className="text-foreground">TAN Number</Label>
                <Input
                  id="tanNumber"
                  {...register("business.tanNumber", { onBlur: () => trigger("business.tanNumber") })}
                  className="bg-card border-border text-foreground"
                  placeholder="Tax Deduction Account Number"
                />
                {errors.business?.tanNumber && <p className="text-red-400 text-sm">{errors.business.tanNumber.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </fieldset>
    </div>
  )
}

// Document Upload Field Component
interface DocumentUploadFieldProps {
  label: string;
  fieldName: string;
  currentValue: string | null | undefined;
  onFileSelect: (url: string) => void;
  onRemove: () => void;
  acceptTypes?: string;
  readonly?: boolean;
}

function DocumentUploadField({
  label,
  fieldName,
  currentValue,
  onFileSelect,
  onRemove,
  acceptTypes = "image/*",
  readonly = false,
}: DocumentUploadFieldProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  // Check if we have a saved URL from database or recent upload
  const isUrl = typeof currentValue === "string" && currentValue.trim() !== "";
  const displayUrl = isUrl ? currentValue.trim() : (localPreviewUrl || "");
  const isImageUrl = displayUrl && /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(displayUrl);
  const isPdfUrl = displayUrl && /\.pdf(\?.*)?$/i.test(displayUrl);

  const hasContent = isUrl || localPreviewUrl !== null;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Max file size is 2MB",
        variant: "destructive",
      });
      return;
    }

    // Generate local preview immediately
    const tempUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(tempUrl);
    setIsUploading(true);

    try {
      const cleanFieldName = fieldName.replace(/[^a-zA-Z0-9_-]/g, "_");
      const uploadedUrl = await uploadToS3(
        file,
        `documents/${cleanFieldName}/${Date.now()}-${file.name}`
      );

      // Store in form state
      onFileSelect(uploadedUrl);

      // Clean temp preview
      URL.revokeObjectURL(tempUrl);
      setLocalPreviewUrl(null);

      toast({
        title: "Upload Successful",
        description: `${label} uploaded successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error?.message || "Unable to upload document",
        variant: "destructive",
      });
      URL.revokeObjectURL(tempUrl);
      setLocalPreviewUrl(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
      setLocalPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onRemove();
  };

  const handleBoxClick = () => {
    if (!hasContent && !readonly && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleDocClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (displayUrl && !isUploading) {
      window.open(displayUrl, '_blank');
    }
  };

  // Cleanup local preview URL on unmount
  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  return (
    <div className="space-y-2">
      <Label className="text-foreground">{label}</Label>

      {!hasContent ? (
        readonly ? (
          <div className="border border-dashed border-border rounded-lg p-6 text-center bg-card/20">
            <p className="text-sm text-muted-foreground">No document uploaded</p>
          </div>
        ) : (
          // EMPTY STATE - Click to upload
          <div
            className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-gold transition-colors cursor-pointer"
            onClick={handleBoxClick}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Click to upload</p>
            <p className="text-xs text-gray-500 mt-1">Max Size 2MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptTypes}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )
      ) : (
        // UPLOADED OR UPLOADING STATE
        <div className="relative bg-card/50 border-2 border-border rounded-lg overflow-hidden group">
          {/* Uploading progress overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10 text-white gap-2">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium">Uploading document...</p>
            </div>
          )}

          {isImageUrl ? (
            <div className="relative cursor-pointer" onClick={handleDocClick} title="Click to view full image">
              <img
                src={displayUrl}
                alt="Uploaded document"
                className="w-full h-48 object-contain bg-black/5"
              />
              <div className="absolute bottom-1 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">
                Click to view
              </div>
            </div>
          ) : isPdfUrl ? (
            <div
              className="w-full h-48 flex flex-col items-center justify-center bg-black/5 cursor-pointer hover:bg-black/10 transition-colors"
              onClick={handleDocClick}
              title="Click to view PDF"
            >
              <FileText className="w-16 h-16 text-blue-400 mb-1" />
              <p className="text-foreground text-sm font-medium">PDF Document</p>
              <p className="text-xs text-muted-foreground mt-1">Click to view PDF</p>
            </div>
          ) : (
            <div
              className="w-full h-48 flex flex-col items-center justify-center bg-black/5 cursor-pointer hover:bg-black/10 transition-colors"
              onClick={handleDocClick}
              title="Click to view document"
            >
              <FileText className="w-16 h-16 text-blue-400 mb-1" />
              <p className="text-foreground text-sm font-medium">Document Uploaded</p>
              <p className="text-xs text-muted-foreground mt-1">Click to view document</p>
            </div>
          )}

          {/* Remove button for uploaded document */}
          {!readonly && !isUploading && (
            <div className="absolute top-2 right-2 z-20">
              <button
                type="button"
                onClick={handleRemove}
                className="bg-red-500/90 hover:bg-red-600 text-white rounded-full p-2 transition-colors shadow-md"
                title="Remove"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// TAB 3: BANKING, KYC & DOCUMENTS
function BankingKycDocumentsTab({ hasRegisteredBusiness = true, readonly = false }: { hasRegisteredBusiness?: boolean, readonly?: boolean }) {
  const { register, formState: { errors }, setValue, trigger, watch } = useFormContext<RootForm>()
  const { user } = useAuth()    // Get current user
  const kycStatus = watch("bankAndKyc.kycStatus")
  const approvedBy = watch("bankAndKyc.kycApprovedBy")
  const kycRejectionReason = watch("bankAndKyc.kycRejectionReason")
  const kycApprovedAt = watch("bankAndKyc.kycApprovedAt")

  // Check if current user is super admin
  const isSuperAdmin = user?.role === "SUPER_ADMIN"

  return (
    <div className="space-y-6">
      {/* Banking Details */}
      <Card className="bg-background/50 border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2"><Landmark className="w-5 h-5" />Banking Details</CardTitle>
          <CardDescription className="text-muted-foreground">Bank account for commission payouts</CardDescription>
        </CardHeader>
        <CardContent>
          {readonly && (
            <p className="text-xs text-muted-foreground italic mb-4">
              🔒 Bank account and payout details are managed by your Aggregator Admin.
            </p>
          )}
          <fieldset disabled={readonly} style={{ all: 'unset', display: 'contents' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="accountHolderName" className="text-foreground">Account Holder Name</Label>
                <Input id="accountHolderName" {...register("bankAndKyc.accountHolderName")} className="bg-card border-border text-foreground" placeholder="As per bank" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber" className="text-foreground">Account Number</Label>
                <Input id="accountNumber" {...register("bankAndKyc.accountNumber")} className="bg-card border-border text-foreground" placeholder="9-18 digits" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ifscCode" className="text-foreground">IFSC Code</Label>
                <Input id="ifscCode" {...register("bankAndKyc.ifscCode", {
                  onBlur: (e: any) => {
                    const formatted = formatIfsc(e.target.value)
                    e.target.value = formatted
                    setValue("bankAndKyc.ifscCode", formatted, { shouldValidate: true })
                  }
                })} className="bg-card border-border text-foreground" placeholder="SBIN0001234" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankName" className="text-foreground">Bank Name</Label>
                <Input id="bankName" {...register("bankAndKyc.bankName")} className="bg-card border-border text-foreground" placeholder="Bank name" />
              </div>
            </div>
          </fieldset>
        </CardContent>
      </Card>

      {/* KYC STATUS */}
      <Card className="bg-background/50 border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
            KYC Verification Status
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {isSuperAdmin
              ? "Set or review KYC status after document verification"
              : "Your KYC verification status"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-card/30 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {getKycStatusIcon(kycStatus)}
                <div>
                  <h4 className="text-foreground font-semibold">Current Status</h4>
                  <p className="text-muted-foreground text-sm">
                    {isSuperAdmin
                      ? "Update after document review"
                      : "Your documents are being reviewed"}
                  </p>
                </div>
              </div>

              {/* Status Selector - Only for Super Admin */}
              {isSuperAdmin ? (
                <Select
                  value={kycStatus?.toUpperCase()}
                  onValueChange={(v) => setValue("bankAndKyc.kycStatus", v)}
                >
                  <SelectTrigger className="bg-card border-border text-foreground h-10 w-48">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value={KYCStatus.PENDING} className="text-foreground">PENDING</SelectItem>
                    <SelectItem value={KYCStatus.UNDER_REVIEW} className="text-foreground">UNDER REVIEW</SelectItem>
                    <SelectItem value={KYCStatus.APPROVED} className="text-foreground">APPROVED</SelectItem>
                    <SelectItem value={KYCStatus.REJECTED} className="text-foreground">REJECTED</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                // Read-only badge for Aggregators
                <Badge className={`${getKycStatusColor(kycStatus)} px-4 py-2 text-sm font-semibold`}>
                  {kycStatus?.toUpperCase() || "PENDING"}
                </Badge>
              )}
            </div>

            {/* Conditional Fields - Only show if data exists OR if Super Admin */}
            {(isSuperAdmin || kycRejectionReason) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-foreground">Rejection Reason</Label>
                  {isSuperAdmin ? (
                    <Textarea
                      {...register("bankAndKyc.kycRejectionReason")}
                      className="bg-card border-border text-foreground mt-2"
                      rows={2}
                      placeholder="Specify reason if rejected"
                    />
                  ) : kycRejectionReason ? (
                    <div className="bg-card/50 border border-border text-red-400 px-3 py-2 rounded mt-2">
                      {kycRejectionReason}
                    </div>
                  ) : null}
                </div>

                {(isSuperAdmin || kycApprovedAt) && (
                  <div>
                    <Label className="text-foreground">Approved At</Label>
                    {isSuperAdmin ? (
                      <Input
                        type="datetime-local"
                        {...register("bankAndKyc.kycApprovedAt")}
                        className="bg-card border-border text-foreground mt-2"
                      />
                    ) : kycApprovedAt ? (
                      <div className="bg-card/50 border border-border text-green-400 px-3 py-2 rounded mt-2">
                        {new Date(kycApprovedAt).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}

            {/* Approved By - Only show if data exists OR if Super Admin */}
            {(isSuperAdmin || approvedBy) && (
              <div className="mt-4">
                <Label className="text-foreground">
                  {isSuperAdmin ? "Approved By (Admin ID)" : "Approved By"}
                </Label>
                <div className="bg-card/50 border border-border text-foreground px-3 py-2 rounded mt-2">
                  {approvedBy ? (
                    <span className="text-foreground">{approvedBy}</span>
                  ) : isSuperAdmin ? (
                    <span className="text-gray-500">Auto-populated on approval</span>
                  ) : (
                    <span className="text-gray-500">Not yet approved</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* DOCUMENT UPLOADS */}
      <Card className="bg-background/50 border-border">
        <CardHeader>
          <CardTitle className="text-foreground">KYC Documents</CardTitle>
          <CardDescription className="text-muted-foreground">Upload all required verification documents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="text-foreground font-semibold mb-4 pb-2 border-b border-border">Identity Documents</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DocumentUploadField
                label="Aadhaar Card - Front"
                fieldName="documents.aadhaarFront"
                currentValue={watch("documents.aadhaarFront")}
                onFileSelect={(url) => setValue("documents.aadhaarFront", url, { shouldDirty: true, shouldValidate: true })}
                onRemove={() => setValue("documents.aadhaarFront", "", { shouldDirty: true, shouldValidate: true })}
                readonly={readonly}
              />
              <DocumentUploadField
                label="Aadhaar Card - Back"
                fieldName="documents.aadhaarBack"
                currentValue={watch("documents.aadhaarBack")}
                onFileSelect={(url) => setValue("documents.aadhaarBack", url, { shouldDirty: true, shouldValidate: true })}
                onRemove={() => setValue("documents.aadhaarBack", "", { shouldDirty: true, shouldValidate: true })}
                readonly={readonly}
              />
              <DocumentUploadField
                label="PAN Card"
                fieldName="documents.panCard"
                currentValue={watch("documents.panCard")}
                onFileSelect={(url) => setValue("documents.panCard", url, { shouldDirty: true, shouldValidate: true })}
                onRemove={() => setValue("documents.panCard", "", { shouldDirty: true, shouldValidate: true })}
                readonly={readonly}
              />
              <DocumentUploadField
                label="Address Proof"
                fieldName="documents.addressProof"
                currentValue={watch("documents.addressProof")}
                onFileSelect={(url) => setValue("documents.addressProof", url, { shouldDirty: true, shouldValidate: true })}
                onRemove={() => setValue("documents.addressProof", "", { shouldDirty: true, shouldValidate: true })}
                acceptTypes="image/*,application/pdf"
                readonly={readonly}
              />
            </div>
          </div>

          {hasRegisteredBusiness && (
            <div>
              <h4 className="text-foreground font-semibold mb-4 pb-2 border-b border-border">Business Documents</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DocumentUploadField
                  label="GST Certificate"
                  fieldName="documents.gstCertificate"
                  currentValue={watch("documents.gstCertificate")}
                  onFileSelect={(url) => setValue("documents.gstCertificate", url, { shouldDirty: true, shouldValidate: true })}
                  onRemove={() => setValue("documents.gstCertificate", "", { shouldDirty: true, shouldValidate: true })}
                  acceptTypes="image/*,application/pdf"
                  readonly={readonly}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

//  Main Component
export function AggregatorSettings() {
  const { user, role } = useAuth(['aggregator_admin', 'aggregator_member'])
  const isAggregatorMember = role === 'aggregator_member'
  const { data: userData, isLoading: userLoading } = useProfile(true)
  const targetProfileId = userData?.profileId || user?.profileId || null
  const { data: aggData, isLoading: aggLoading } = useAggregator(targetProfileId, !!targetProfileId)
  const updateUserHook = useUpdateUser()
  const updateAggHook = useUpdateAggregatorProfile()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<"profile" | "business" | "banking">("profile")
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(["profile"]))
  const [isSaving, setIsSaving] = useState(false)
  const [profileCompletePct, setProfileCompletePct] = useState<number>(100)

  const methods = useForm<RootForm>({
    resolver: zodResolver(rootSchema),
    mode: "onBlur",
    defaultValues: {
      profile: { userId: "", firstName: "", lastName: "", email: "", contact: "", status: "", photoUrl: "" },
      business: { id: "", companyName: "" },
      bankAndKyc: {},
      documents: {},
    },
  })

  const { handleSubmit, trigger, reset, register } = methods

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
          status: userData.status || "",
        },
        business: {
          id: agg._id,
          companyName: agg.companyName || "",
          aggregatorType: aggData.aggregatorType
            ? (aggData.aggregatorType as AggregatorType)
            : undefined,
          businessType: agg.businessType
            ? (agg.businessType.toLowerCase() as BusinessType)
            : undefined,
          rank: agg.rank
            ? (agg.rank as ApplicableFor)
            : undefined,
          yearOfEstablishment: agg.yearOfEstablishment || "",
          registeredAddress: agg.registeredAddress || "",
          city: agg.city || "",
          state: agg.state || "",
          pincode: agg.pincode || "",
          websiteUrl: agg.websiteUrl || "",
          gstNumber: agg.gstNumber || "",
          panNumber: agg.panNumber || "",
          aadhaarNumber: agg.aadhaarNumber || "",
          cinNumber: agg.cinNumber || "",
          tanNumber: agg.tanNumber || "",
        },
        bankAndKyc: {
          accountHolderName: agg.accountHolderName || "",
          accountNumber: agg.accountNumber || "",
          ifscCode: agg.ifscCode || "",
          bankName: agg.bankName || "",
          kycStatus: (agg as any).kycStatus?.toLowerCase() || "",
          kycRejectionReason: (agg as any).kycRejectionReason || "",
          kycApprovedAt: (agg as any).kycApprovedAt || "",
          kycApprovedBy: (agg as any).kycApprovedBy || "",
        },
        documents: {
          aadhaarFront: (agg as any).documents?.aadhaarFront || "",
          aadhaarBack: (agg as any).documents?.aadhaarBack || "",
          panCard: (agg as any).documents?.panCard || "",
          gstCertificate: (agg as any).documents?.gstCertificate || "",
          incorporationCertificate: (agg as any).documents?.incorporationCertificate || "",
          bankStatement: (agg as any).documents?.bankStatement || "",
          cancelledCheque: (agg as any).documents?.cancelledCheque || "",
          addressProof: (agg as any).documents?.addressProof || "",
        },
      })
    }
  }, [userData, aggData, reset])

  useEffect(() => {
    setVisitedTabs((prev) => new Set(prev).add(activeTab))
  }, [activeTab])

  // compute profile completeness
  useEffect(() => {
    if (!userData && !aggData) return

    const token = getCookie("lendgrid_cookie")
    const decoded = decodeJwt(token)
    const aggregatorType = decoded?.aggregatorType
    const isSourcer = aggregatorType === "SOURCER" // Check against string value stored in cookie

    // groups checks
    const profileChecks = [
      Boolean(userData?.username),
      Boolean(userData?.email),
      Boolean(userData?.contact),
      Boolean(userData?.photoUrl),
      Boolean(userData?.status),
    ]

    let businessChecks = []
    let bankChecks: boolean[] = []
    let documentsChecks: boolean[] = []

    if (isSourcer) {
      // SOURCER REQUIREMENTS: Basic info only
      businessChecks = [
        Boolean(aggData?.companyName),
        Boolean(aggData?.aggregatorType),
        Boolean(aggData?.rank),
        Boolean(aggData?.businessType),
      ]
      // No bank or document checks for sourcer
    } else {
      // CHANNEL_PARTNER / DEFAULT REQUIREMENTS: Full checks
      const isFreelance = aggData?.hasRegisteredBusiness === false
      businessChecks = isFreelance
        ? []
        : [
          Boolean(aggData?.companyName),
          Boolean(aggData?.aggregatorType),
          Boolean(aggData?.rank),
          Boolean(aggData?.businessType),
          Boolean(aggData?.yearOfEstablishment),
          Boolean(aggData?.registeredAddress),
          Boolean(aggData?.city),
          Boolean(aggData?.state),
          Boolean(aggData?.pincode),
          Boolean(aggData?.websiteUrl),
          Boolean(aggData?.gstNumber),
          Boolean(aggData?.panNumber),
          Boolean(aggData?.aadhaarNumber),
          Boolean(aggData?.cinNumber),
          Boolean(aggData?.tanNumber),
        ]

      bankChecks = [
        Boolean(aggData?.bankName),
        Boolean(aggData?.accountNumber),
        Boolean(aggData?.ifscCode),
        Boolean(aggData?.accountHolderName),
      ]

      const docs = (aggData as any)?.documents || {}
      documentsChecks = [
        Boolean(docs?.aadhaarFront),
        Boolean(docs?.aadhaarBack),
        Boolean(docs?.panCard),
        Boolean(docs?.addressProof),
        ...(isFreelance ? [] : [Boolean(docs?.gstCertificate)]),
      ]
    }

    const allChecks = [...profileChecks, ...businessChecks, ...bankChecks, ...documentsChecks]
    const total = allChecks.length
    const filled = allChecks.filter(Boolean).length
    const pct = total > 0 ? Math.round((filled / total) * 100) : 100
    setProfileCompletePct(pct)
  }, [userData, aggData])

  const isFreelance = aggData?.hasRegisteredBusiness === false;
  const allTabsVisited = isFreelance
    ? visitedTabs.has("profile") && visitedTabs.has("banking")
    : visitedTabs.has("profile") && visitedTabs.has("business") && visitedTabs.has("banking");

  useEffect(() => {
    if (isFreelance && activeTab === "business") {
      setActiveTab("profile");
    }
  }, [isFreelance, activeTab]);

  const onSaveAll = handleSubmit(
    async (values) => {
      setIsSaving(true)
      try {
        // Determine User ID with fallbacks
        const targetUserId =
          values.profile?.userId ||
          userData?._id ||
          (userData as any)?.id ||
          user?._id ||
          user?.id ||
          aggData?.userId;

        if (!targetUserId) {
          toast({
            title: "Error",
            description: "User ID not found. Please refresh and try again.",
            variant: "destructive",
          });
          setIsSaving(false);
          return;
        }

        // Update User
        const fullName = `${values.profile?.firstName || ""} ${values.profile?.lastName || ""}`.trim();
        const userPayload: any = {
          id: targetUserId,
          username: fullName || undefined,
          email: values.profile?.email || undefined,
          contact: values.profile?.contact || undefined,
          photoUrl: values.profile?.photoUrl || undefined,
        };

        // Only pass status if it is a valid non-empty Status enum
        const validStatus = (values.profile?.status || userData?.status)?.trim().toUpperCase();
        if (validStatus && ["ACTIVE", "INACTIVE", "PENDING_APPROVAL", "SUSPENDED"].includes(validStatus)) {
          userPayload.status = validStatus;
        }

        console.log(userPayload, 'userpayload')
        await updateUserHook.mutateAsync(userPayload)

        // Aggregator Member only updates user profile, not aggregator business/bank profile
        if (isAggregatorMember) {
          toast({
            title: "Success",
            description: "Profile updated successfully",
          })
          setIsSaving(false)
          return
        }

        // Determine Aggregator Profile ID with fallbacks
        const targetAggId =
          values.business?.id ||
          aggData?._id ||
          (aggData as any)?.id ||
          user?.profileId;

        if (!targetAggId) {
          toast({
            title: "Error",
            description: "Aggregator profile ID not found. Please refresh and try again.",
            variant: "destructive",
          });
          setIsSaving(false);
          return;
        }

        // Update Aggregator Profile
        const rawBusinessType = values.business?.businessType?.toString().trim().toUpperCase();
        const validBusinessType = rawBusinessType && ["LLP", "PARTNERSHIP", "PRIVATE_LIMITED", "PROPRIETORSHIP", "PUBLIC_LIMITED"].includes(rawBusinessType)
          ? (rawBusinessType as BusinessType)
          : undefined;

        const rawKycStatus = values.bankAndKyc?.kycStatus?.toString().trim().toUpperCase();
        const validKycStatus = rawKycStatus && ["APPROVED", "PENDING", "REJECTED", "RESUBMIT", "UNDER_REVIEW"].includes(rawKycStatus)
          ? (rawKycStatus as KYCStatus)
          : undefined;

        const aggPayload: any = {
          id: targetAggId,
          ...(isFreelance
            ? {}
            : {
              companyName: values.business?.companyName || undefined,
              businessType: validBusinessType,
              rank: values.business?.rank || undefined,
              yearOfEstablishment: values.business?.yearOfEstablishment || undefined,
              registeredAddress: values.business?.registeredAddress || undefined,
              city: values.business?.city || undefined,
              state: values.business?.state || undefined,
              pincode: values.business?.pincode || undefined,
              websiteUrl: values.business?.websiteUrl || undefined,
              gstNumber: values.business?.gstNumber || undefined,
              panNumber: values.business?.panNumber || undefined,
              aadhaarNumber: values.business?.aadhaarNumber || undefined,
              cinNumber: values.business?.cinNumber || undefined,
              tanNumber: values.business?.tanNumber || undefined,
            }),
          bankName: values.bankAndKyc?.bankName || undefined,
          accountNumber: values.bankAndKyc?.accountNumber ? values.bankAndKyc.accountNumber.replace(/\s/g, "") : undefined,
          ifscCode: values.bankAndKyc?.ifscCode ? values.bankAndKyc.ifscCode.toUpperCase().trim() : undefined,
          accountHolderName: values.bankAndKyc?.accountHolderName || undefined,
          kycStatus: validKycStatus,
          kycRejectionReason: values.bankAndKyc?.kycRejectionReason?.trim() || undefined,
          kycApprovedAt:
            values.bankAndKyc?.kycApprovedAt && values.bankAndKyc.kycApprovedAt.trim() !== ""
              ? values.bankAndKyc.kycApprovedAt
              : undefined,
          kycApprovedBy:
            values.bankAndKyc?.kycApprovedBy && /^[a-fA-F0-9]{24}$/.test(values.bankAndKyc.kycApprovedBy)
              ? values.bankAndKyc.kycApprovedBy
              : undefined,
          documents: {
            aadhaarFront: values.documents?.aadhaarFront || undefined,
            aadhaarBack: values.documents?.aadhaarBack || undefined,
            panCard: values.documents?.panCard || undefined,
            gstCertificate: isFreelance ? undefined : (values.documents?.gstCertificate || undefined),
            incorporationCertificate: isFreelance ? undefined : (values.documents?.incorporationCertificate || undefined),
            bankStatement: values.documents?.bankStatement || undefined,
            cancelledCheque: values.documents?.cancelledCheque || undefined,
            addressProof: values.documents?.addressProof || undefined,
          },
        }
        console.log(aggPayload, 'aggpayload')
        await updateAggHook.mutateAsync(aggPayload)

        var duration = 3 * 1000;
        var end = Date.now() + duration;

        (function frame() {
          // Left bottom cannon
          confetti({
            particleCount: 25,
            angle: 60,
            spread: 60,
            startVelocity: 50,
            gravity: 0.8,
            scalar: 1.1,
            ticks: 300,
            origin: { x: 0, y: 1 }
          });

          // Right bottom cannon
          confetti({
            particleCount: 25,
            angle: 120,
            spread: 60,
            startVelocity: 50,
            gravity: 0.8,
            scalar: 1.1,
            ticks: 300,
            origin: { x: 1, y: 1 }
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        })();

        toast({
          title: "Success",
          description: "Profile updated successfully",
        })
        setTimeout(() => {
          setActiveTab('profile');
        }, 2000)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to update profile",
          variant: "destructive",
        })
      } finally {
        setIsSaving(false)
      }
    },
    (formErrors) => {
      console.error("Form validation errors:", formErrors);
      let errorMsg = "";
      if (formErrors.profile) {
        const first = Object.values(formErrors.profile).find((e: any) => e?.message);
        if (first) errorMsg = (first as any).message;
      }
      if (!errorMsg && !isFreelance && !isAggregatorMember && formErrors.business) {
        const first = Object.values(formErrors.business).find((e: any) => e?.message);
        if (first) errorMsg = (first as any).message;
      }
      if (!errorMsg && !isAggregatorMember && formErrors.bankAndKyc) {
        const first = Object.values(formErrors.bankAndKyc).find((e: any) => e?.message);
        if (first) errorMsg = (first as any).message;
      }
      toast({
        title: "Validation Error",
        description: errorMsg || "Please check the entered values",
        variant: "destructive",
      });
    }
  )

  if (userLoading || aggLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton headerLines={2} bodyHeight={400} />
      </div>
    )
  }

  return (
    <FormProvider {...methods}>
      {/* Hidden inputs to guarantee form tracking of critical IDs across tabs */}
      <input type="hidden" {...register("profile.userId")} />
      <input type="hidden" {...register("business.id")} />
      <div className="min-h-screen bg-background p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Profile completion banner */}
        {profileCompletePct <= 100 && (
          <ProfileCompletionBanner
            percent={profileCompletePct}
            showAction={profileCompletePct < 100}
          />
        )}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Aggregator Settings</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage your profile, business details, and documents</p>
          </div>

          <Button
            className="w-full sm:w-auto bg-gradient-to-r from-blue to-cyan-500 text-dark hover:from-blue-600 hover:to-cyan-700"
            onClick={() => onSaveAll()}
            disabled={isSaving}
          >
            <Save className="w-5 h-5 mr-2" />{isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </motion.div>

        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-6">
          <TabsList className={`bg-card border-border flex flex-col sm:grid ${isFreelance ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} w-full h-auto p-1 gap-1`}>
            <TabsTrigger value="profile" className="w-full data-[state=active]:bg-gradient-to-r from-blue to-cyan-500 data-[state=active]:text-dark">
              <User className="w-5 h-5 mr-2" />Profile & Contact
            </TabsTrigger>
            {!isFreelance && (
              <TabsTrigger value="business" className="w-full data-[state=active]:bg-gradient-to-r from-blue to-cyan-500 data-[state=active]:text-dark">
                <Building2 className="w-5 h-5 mr-2" />Business Details
              </TabsTrigger>
            )}
            <TabsTrigger value="banking" className="w-full data-[state=active]:bg-gradient-to-r from-blue to-cyan-500 data-[state=active]:text-dark">
              <FileCheck className="w-5 h-5 mr-2" />Banking & KYC
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile"><ProfileAndContactTab readonly={isAggregatorMember} /></TabsContent>
          {!isFreelance && <TabsContent value="business"><BusinessDetailsTab readonly={isAggregatorMember} /></TabsContent>}
          <TabsContent value="banking"><BankingKycDocumentsTab hasRegisteredBusiness={!isFreelance} readonly={isAggregatorMember} /></TabsContent>
        </Tabs>
      </div>
    </FormProvider>
  )
}
