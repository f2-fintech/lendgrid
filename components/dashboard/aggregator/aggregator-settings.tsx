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
import { ApplicableFor, BusinessType, KYCStatus } from "@/lib"
import { uploadToS3 } from "@/lib/utils"
import { ProfileCompletionBanner } from "@/components/ui/progressbar"

// VALIDATION SCHEMAS (Optional Fields with Format Validation)
const profileSchema = z.object({
  userId: z.string().optional(),
  firstName: z.string().optional().refine(val => !val || val.trim().length >= 2, "First name must be at least 2 chars"),
  lastName: z.string().optional(),
  email: z.string().optional().refine(val => !val || /\S+@\S+\.\S+/.test(val), "Invalid email"),
  contact: z.string().optional().refine(val => !val || /^[0-9]{10}$/.test(val), "Phone must be 10 digits"),
  status: z.string().optional(),
  photoUrl: z.string().optional(),
})

const businessSchema = z.object({
  id: z.string().optional(),
  companyName: z.string().optional().refine(val => !val || val.trim().length >= 2, "Company name must be at least 2 chars"),
  businessType: z.nativeEnum(BusinessType).optional(),
  rank: z.nativeEnum(ApplicableFor).optional(),
  yearOfEstablishment: z.string().optional().refine(val => !val || /^[0-9]{4}$/.test(val), "Must be YYYY format"),
  registeredAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional().refine(val => !val || /^[0-9]{6}$/.test(val), "Pincode must be 6 digits"),
  websiteUrl: z.string().optional().refine(val => !val || /^https?:\/\/.+/.test(val), "Invalid website URL"),
  gstNumber: z.string().optional().refine(
    val => !val || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(val),
    "Invalid GST Number"
  ),
  panNumber: z.string().optional().refine(val => !val || /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(val), "Invalid PAN Number"),
  aadhaarNumber: z.string().optional().refine(val => !val || /^[0-9]{12}$/.test(val), "Aadhaar must be 12 digits"),
  tanNumber: z.string().optional(),
  cinNumber: z.string().optional(),
})

const bankAndKycSchema = z.object({
  accountHolderName: z.string().optional(),
  accountNumber: z.string().optional().refine(val => !val || /^[0-9]{9,18}$/.test(val), "Invalid account number"),
  ifscCode: z.string().optional().refine(val => !val || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(val), "Invalid IFSC code"),
  bankName: z.string().optional(),
  kycStatus: z.string().optional(),
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
function ProfileAndContactTab() {
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
        <div className="flex items-center space-x-6 pb-6 border-b border-border">
          <div className="relative">
            <Avatar className="w-24 h-24">
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
          <div>
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

            <p className="text-muted-foreground text-sm mt-2">
              JPG, PNG or GIF. Max size 2MB.
            </p>
          </div>

          <div className="ml-auto">
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
function BusinessDetailsTab() {
  const { user } = useAuth()
  const { register, setValue, trigger, watch, formState: { errors } } = useFormContext<RootForm>()
  const businessType = watch("business.businessType")
  const rank = watch("business.rank")
  const isSuperAdmin = user?.role === "SUPER_ADMIN"

  return (
    <div className="space-y-6">
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
                      <SelectItem value={ApplicableFor.BRONZE_AGGREGATORS} className="text-foreground">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          <span>{ApplicableFor.BRONZE_AGGREGATORS}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value={ApplicableFor.SILVER_AGGREGATORS} className="text-foreground">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          <span>{ApplicableFor.SILVER_AGGREGATORS}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value={ApplicableFor.GOLD_AGGREGATORS} className="text-foreground">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          <span>{ApplicableFor.GOLD_AGGREGATORS}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value={ApplicableFor.PLATINUM_AGGREGATORS} className="text-foreground">
                        <div className="flex items-center gap-2">
                          <Landmark className="w-4 h-4" />
                          <span>{ApplicableFor.PLATINUM_AGGREGATORS}</span>
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
                    Rank is assigned by Admin
                  </p>
                </>
              )}
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
}

function DocumentUploadField({
  label,
  fieldName,
  currentValue,
  onFileSelect,
  onRemove,
  acceptTypes = "image/*"
}: DocumentUploadFieldProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Check if we have a saved URL from database
  const isUrl = typeof currentValue === "string" && currentValue.trim() !== "";
  const displayUrl = isUrl ? currentValue : "";
  const isImageUrl = isUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(displayUrl);
  const isPdfUrl = isUrl && /\.pdf$/i.test(displayUrl);

  // Determine if we're showing a preview of selected file or uploaded document
  const showingPreview = selectedFile !== null;
  const showingUploaded = !showingPreview && isUrl;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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

    // Store the file and create preview
    setSelectedFile(file);
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // Upload to S3
      const uploadedUrl = await uploadToS3(
        selectedFile,
        `documents/${fieldName}/${Date.now()}-${selectedFile.name}`
      );

      // Store the URL in form state
      onFileSelect(uploadedUrl);

      // Clear preview state
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedFile(null);
      setPreviewUrl(null);

      toast({
        title: "Upload Successful",
        description: "Document uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Unable to upload document",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    // Clear selected file preview
    if (selectedFile) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } else {
      // Clear uploaded document from form
      onRemove();
    }
  };

  const handleBoxClick = () => {
    if (!showingPreview && !showingUploaded) {
      fileInputRef.current?.click();
    }
  };

  const handlePdfClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPdfUrl && displayUrl) {
      window.open(displayUrl, '_blank');
    }
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="space-y-2">
      <Label className="text-foreground">{label}</Label>

      {!showingPreview && !showingUploaded ? (
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
      ) : (
        // PREVIEW OR UPLOADED STATE
        <div className="relative bg-card/50 border-2 border-border rounded-lg overflow-hidden group">
          {showingPreview ? (
            // Selected file preview (not yet uploaded)
            <>
              {selectedFile?.type.startsWith('image/') ? (
                <img
                  src={previewUrl!}
                  alt="Preview"
                  className="w-full h-48 object-contain bg-black/5"
                />
              ) : (
                <div className="w-full h-48 flex items-center justify-center bg-black/5">
                  <FileText className="w-16 h-16 text-blue-400" />
                  <p className="text-foreground text-sm ml-3">{selectedFile?.name}</p>
                </div>
              )}

              {/* Action buttons for preview */}
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="bg-green-500/90 hover:bg-green-600 text-white rounded-full p-2 transition-colors disabled:opacity-50"
                  title="Upload"
                >
                  {isUploading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="bg-red-500/90 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
                  title="Remove"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            // Uploaded document from database
            <>
              {isImageUrl ? (
                <img
                  src={displayUrl}
                  alt="Uploaded document"
                  className="w-full h-48 object-contain bg-black/5"
                />
              ) : isPdfUrl ? (
                <div
                  className="w-full h-48 flex items-center justify-center bg-black/5 cursor-pointer hover:bg-black/10 transition-colors"
                  onClick={handlePdfClick}
                >
                  <FileText className="w-16 h-16 text-blue-400" />
                  <p className="text-foreground text-sm ml-3">Click to view PDF</p>
                </div>
              ) : (
                <div className="w-full h-48 flex items-center justify-center bg-black/5">
                  <FileText className="w-16 h-16 text-blue-400" />
                  <p className="text-foreground text-sm ml-3">Document uploaded</p>
                </div>
              )}

              {/* Remove button for uploaded document */}
              <div className="absolute top-2 right-2">
                <button
                  type="button"
                  onClick={handleRemove}
                  className="bg-red-500/90 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
                  title="Remove"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// TAB 3: BANKING, KYC & DOCUMENTS
function BankingKycDocumentsTab() {
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
                onFileSelect={(url) => setValue("documents.aadhaarFront", url, { shouldDirty: true })}
                onRemove={() => setValue("documents.aadhaarFront", "")}
              />
              <DocumentUploadField
                label="Aadhaar Card - Back"
                fieldName="documents.aadhaarBack"
                currentValue={watch("documents.aadhaarBack")}
                onFileSelect={(url) => setValue("documents.aadhaarBack", url, { shouldDirty: true })}
                onRemove={() => setValue("documents.aadhaarBack", "")}
              />
              <DocumentUploadField
                label="PAN Card"
                fieldName="documents.panCard"
                currentValue={watch("documents.panCard")}
                onFileSelect={(url) => setValue("documents.panCard", url, { shouldDirty: true })}
                onRemove={() => setValue("documents.panCard", "")}
              />
              <DocumentUploadField
                label="Address Proof"
                fieldName="documents.addressProof"
                currentValue={watch("documents.addressProof")}
                onFileSelect={(url) => setValue("documents.addressProof", url, { shouldDirty: true })}
                onRemove={() => setValue("documents.addressProof", "")}
                acceptTypes="image/*,application/pdf"
              />
            </div>
          </div>

          <div>
            <h4 className="text-foreground font-semibold mb-4 pb-2 border-b border-border">Business Documents</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DocumentUploadField
                label="GST Certificate"
                fieldName="documents.gstCertificate"
                currentValue={watch("documents.gstCertificate")}
                onFileSelect={(url) => setValue("documents.gstCertificate", url, { shouldDirty: true })}
                onRemove={() => setValue("documents.gstCertificate", "")}
                acceptTypes="image/*,application/pdf"
              />
              <DocumentUploadField
                label="Certificate of Incorporation"
                fieldName="documents.incorporationCertificate"
                currentValue={watch("documents.incorporationCertificate")}
                onFileSelect={(url) => setValue("documents.incorporationCertificate", url, { shouldDirty: true })}
                onRemove={() => setValue("documents.incorporationCertificate", "")}
                acceptTypes="image/*,application/pdf"
              />
            </div>
          </div>

          <div>
            <h4 className="text-foreground font-semibold mb-4 pb-2 border-b border-border">Banking Documents</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DocumentUploadField
                label="Bank Statement (Last 6 months)"
                fieldName="documents.bankStatement"
                currentValue={watch("documents.bankStatement")}
                onFileSelect={(url) => setValue("documents.bankStatement", url, { shouldDirty: true })}
                onRemove={() => setValue("documents.bankStatement", "")}
                acceptTypes="image/*,application/pdf"
              />
              <DocumentUploadField
                label="Cancelled Cheque"
                fieldName="documents.cancelledCheque"
                currentValue={watch("documents.cancelledCheque")}
                onFileSelect={(url) => setValue("documents.cancelledCheque", url, { shouldDirty: true })}
                onRemove={() => setValue("documents.cancelledCheque", "")}
                acceptTypes="image/*,application/pdf"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

//  Main Component
export function AggregatorSettings() {
  const { user } = useAuth('aggregator_admin')
  const { data: userData, isLoading: userLoading } = useProfile(true)
  const { data: aggData, isLoading: aggLoading } = useAggregator(user?.profileId ?? null, true)
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
      profile: { firstName: "", lastName: "", email: "", contact: "", status: "" },
      business: { companyName: "" },
      bankAndKyc: {},
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
          status: userData.status || "",
        },
        business: {
          id: agg._id,
          companyName: agg.companyName || "",
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

    // groups checks
    const profileChecks = [
      Boolean(userData?.username),
      Boolean(userData?.email),
      Boolean(userData?.contact),
      Boolean(userData?.photoUrl),
      Boolean(userData?.status),
    ]

    const businessChecks = [
      Boolean(aggData?.companyName),
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

    const bankChecks = [
      Boolean(aggData?.bankName),
      Boolean(aggData?.accountNumber),
      Boolean(aggData?.ifscCode),
      Boolean(aggData?.accountHolderName),
    ]

    const docs = (aggData as any)?.documents || {}
    const documentsChecks = [
      Boolean(docs?.aadhaarFront),
      Boolean(docs?.aadhaarBack),
      Boolean(docs?.panCard),
      Boolean(docs?.gstCertificate),
      Boolean(docs?.bankStatement),
      Boolean(docs?.incorporationCertificate),
      Boolean(docs?.bankStatement),
      Boolean(docs?.cancelledCheque),
    ]

    const allChecks = [...profileChecks, ...businessChecks, ...bankChecks, ...documentsChecks]
    const total = allChecks.length
    const filled = allChecks.filter(Boolean).length
    const pct = total > 0 ? Math.round((filled / total) * 100) : 100
    setProfileCompletePct(pct)
  }, [userData, aggData])

  const allTabsVisited = visitedTabs.has("profile") && visitedTabs.has("business") && visitedTabs.has("banking");

  const onSaveAll = handleSubmit(async (values) => {
    setIsSaving(true)
    try {
      // Update User
      const userPayload = {
        id: values.profile.userId!,
        username: `${values.profile.firstName} ${values.profile.lastName}`.trim(),
        email: values.profile.email,
        contact: values.profile.contact,
        photoUrl: values.profile.photoUrl,
        status: values.profile.status,
      };

      console.log(userPayload, 'userpayload')
      await updateUserHook.mutateAsync(userPayload)

      // Update Aggregator Profile
      const aggPayload = {
        id: values.business.id!,
        companyName: values.business.companyName,
        businessType: values.business.businessType?.toUpperCase() as BusinessType,
        rank: values.business.rank,
        yearOfEstablishment: values.business.yearOfEstablishment,
        registeredAddress: values.business.registeredAddress,
        city: values.business.city,
        state: values.business.state,
        pincode: values.business.pincode,
        websiteUrl: values.business.websiteUrl,
        gstNumber: values.business.gstNumber,
        panNumber: values.business.panNumber,
        aadhaarNumber: values.business.aadhaarNumber,
        cinNumber: values.business.cinNumber,
        tanNumber: values.business.tanNumber,
        bankName: values.bankAndKyc.bankName,
        accountNumber: values.bankAndKyc.accountNumber,
        ifscCode: values.bankAndKyc.ifscCode,
        accountHolderName: values.bankAndKyc.accountHolderName,
        kycStatus: values.bankAndKyc?.kycStatus?.toUpperCase() as KYCStatus,
        kycRejectionReason: values.bankAndKyc.kycRejectionReason?.trim() || undefined,
        kycApprovedAt:
          values.bankAndKyc.kycApprovedAt && values.bankAndKyc.kycApprovedAt.trim() !== ""
            ? values.bankAndKyc.kycApprovedAt
            : undefined,
        kycApprovedBy:
          values.bankAndKyc.kycApprovedBy && /^[a-fA-F0-9]{24}$/.test(values.bankAndKyc.kycApprovedBy)
            ? values.bankAndKyc.kycApprovedBy
            : undefined,
        documents: {
          aadhaarFront: values.documents?.aadhaarFront,
          aadhaarBack: values.documents?.aadhaarBack,
          panCard: values.documents?.panCard,
          gstCertificate: values.documents?.gstCertificate,
          incorporationCertificate: values.documents?.incorporationCertificate,
          bankStatement: values.documents?.bankStatement,
          cancelledCheque: values.documents?.cancelledCheque,
          addressProof: values.documents?.addressProof,
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
      <div className="min-h-screen bg-background p-6 space-y-6">
        {/* Profile completion banner */}
        {profileCompletePct <= 100 && (
          <ProfileCompletionBanner
            percent={profileCompletePct}
            showAction={profileCompletePct < 100}
          />
        )}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Aggregator Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your profile, business details, and documents</p>
          </div>

          <Button className="bg-gradient-to-r from-blue to-cyan-500 text-dark hover:from-blue-600 hover:to-cyan-700" onClick={async () => {
            const ok = await trigger()
            if (!ok) {
              toast({ title: "Validation failed", description: "Please check all required fields", variant: "destructive" })
              return
            }
            await onSaveAll()
          }} disabled={!allTabsVisited || isSaving}>
            <Save className="w-5 h-5 mr-2" />{isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </motion.div>

        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-6">
          <TabsList className="bg-card border-border grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="data-[state=active]:bg-gradient-to-r from-blue to-cyan-500 data-[state=active]:text-dark">
              <User className="w-5 h-5 mr-2" />Profile & Contact
            </TabsTrigger>
            <TabsTrigger value="business" className="data-[state=active]:bg-gradient-to-r from-blue to-cyan-500 data-[state=active]:text-dark">
              <Building2 className="w-5 h-5 mr-2" />Business Details
            </TabsTrigger>
            <TabsTrigger value="banking" className="data-[state=active]:bg-gradient-to-r from-blue to-cyan-500 data-[state=active]:text-dark">
              <FileCheck className="w-5 h-5 mr-2" />Banking & KYC
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile"><ProfileAndContactTab /></TabsContent>
          <TabsContent value="business"><BusinessDetailsTab /></TabsContent>
          <TabsContent value="banking"><BankingKycDocumentsTab /></TabsContent>
        </Tabs>
      </div>
    </FormProvider>
  )
}
