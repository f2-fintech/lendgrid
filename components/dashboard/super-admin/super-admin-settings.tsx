"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShieldCheck,
  Upload,
  Save,
  X,
  User,
  Mail,
  Phone,
  Activity,
  Sparkles,
  Camera,
  Calendar,
  Globe,
  AlertCircle,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { CardSkeleton } from "@/components/ui/loading-skeleton";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useProfile, useUpdateUser } from "@/hooks/use-users";
import { uploadToS3, capitalizeEachWord } from "@/lib/utils";

// ─── Schema ─────────────────────────────────────────────────────────────────
const profileSchema = z.object({
  userId: z.string().optional(),
  firstName: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.trim().length >= 2,
      "First name must be at least 2 chars"
    ),
  lastName: z.string().optional(),
  email: z
    .string()
    .optional()
    .refine((val) => !val || /\S+@\S+\.\S+/.test(val), "Invalid email"),
  contact: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[0-9]{10}$/.test(val),
      "Phone must be 10 digits"
    ),
  status: z.string().optional(),
  photoUrl: z.string().optional(),
  createdAt: z.string().optional(),
});

const rootSchema = z.object({ profile: profileSchema });
type RootForm = z.infer<typeof rootSchema>;

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatPhone(val?: string) {
  if (!val) return val;
  return val.replace(/[^0-9]/g, "").slice(0, 10);
}

// ─── Field wrapper ───────────────────────────────────────────────────────────
function Field({
  icon: Icon,
  label,
  children,
  error,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-amber-400/80 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </Label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

// ─── Profile form section ────────────────────────────────────────────────────
function ProfileForm({ createdAt }: { createdAt?: string }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    register,
    setValue,
    watch,
    formState: { errors },
    trigger,
  } = useFormContext<RootForm>();

  const profileStatus = watch("profile.status");
  const savedPhotoUrl = watch("profile.photoUrl");
  const firstName = watch("profile.firstName") || "";
  const lastName = watch("profile.lastName") || "";
  const displayPhoto = previewUrl || savedPhotoUrl;
  const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "SA";

  const memberSince = createdAt
    ? new Date(createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    : "—";

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* ── Hero Banner ─────────────────────────────────────────────── */}
        <div className="xl:col-span-5 relative flex flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 border border-border shadow-xl">
          {/* Decorative radial glow */}
          <div className="pointer-events-none absolute -top-20 -right-20 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-60 w-60 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative flex-1 flex flex-col px-6 pt-8 pb-6">
            {/* Top label */}
            <div className="flex items-center gap-2 mb-6">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
                Platform Administrator
              </span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400/60" />
            </div>

            {/* Avatar + name row */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
              {/* Avatar with glow ring */}
              <div className="relative shrink-0">
                {/* Amber glow ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 blur-sm scale-110 opacity-40" />
                <div className="relative rounded-full p-[3px] bg-gradient-to-br from-amber-400 to-orange-500">
                  <Avatar className="w-24 h-24 rounded-full border-2 border-slate-900">
                    <AvatarImage src={displayPhoto || undefined} alt="Profile" />
                    <AvatarFallback className="bg-slate-800 text-amber-400 text-2xl font-bold rounded-full">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Camera upload button overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-lg transition-colors cursor-pointer"
                  title="Change photo"
                >
                  <Camera className="w-4 h-4" />
                </button>

                {/* Remove preview button */}
                {previewUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                      setValue("profile.photoUrl", savedPhotoUrl || "", {
                        shouldDirty: true,
                      });
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full bg-red-500 hover:bg-red-400 text-white shadow cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 2 * 1024 * 1024) return;
                    setPreviewUrl(URL.createObjectURL(file));
                    const url = await uploadToS3(
                      file,
                      `profile-photos/${Date.now()}-${file.name}`
                    );
                    setValue("profile.photoUrl", url, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                />
              </div>

              {/* Name + role */}
              <div className="text-center sm:text-left pb-1">
                <h2 className="text-2xl font-bold text-foreground dark:text-white">
                  {capitalizeEachWord(firstName)} {capitalizeEachWord(lastName)}
                </h2>
                <p className="text-sm text-muted-foreground dark:text-slate-400 mt-0.5">Super Admin</p>
                <p className="text-xs text-muted-foreground dark:text-slate-500 mt-0.5">
                  JPG, PNG or GIF · Max 2MB
                </p>
              </div>

              {/* Status badge — pushed to right on desktop */}
              <div className="sm:ml-auto">
                <Badge
                  className={`px-4 py-1.5 text-sm font-semibold tracking-wide ${profileStatus?.toUpperCase() === "ACTIVE"
                    ? "bg-green-500/15 text-green-400 border border-green-500/30"
                    : "bg-red-500/15 text-red-400 border border-red-500/30"
                    }`}
                >
                  {profileStatus || "—"}
                </Badge>
              </div>
            </div>

            {/* Stat pills row */}
            <div className="flex flex-wrap gap-3 mt-auto pt-6 border-t border-border dark:border-white/10">
              <div className="flex items-center gap-2 rounded-full bg-background dark:bg-white/5 border border-border dark:border-white/10 px-3 py-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs text-muted-foreground dark:text-slate-300">Super Admin</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-background dark:bg-white/5 border border-border dark:border-white/10 px-3 py-1.5">
                <Activity className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs text-muted-foreground dark:text-slate-300">
                  {profileStatus || "—"}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-background dark:bg-white/5 border border-border dark:border-white/10 px-3 py-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs text-muted-foreground dark:text-slate-300">
                  Member since {memberSince}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Form card ───────────────────────────────────────────────── */}
        <div className="xl:col-span-7 h-full rounded-2xl border border-border bg-card/60 backdrop-blur-sm shadow-xl p-6 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-border">
            <User className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-foreground">
              Personal Information
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* First Name */}
            <Field
              icon={User}
              label="First Name"
              error={errors.profile?.firstName?.message}
            >
              <Input
                id="firstName"
                {...register("profile.firstName", {
                  onBlur: () => trigger("profile.firstName"),
                })}
                className="bg-background border-border dark:border-zinc-600 text-foreground focus-visible:ring-amber-500/40 focus-visible:border-amber-500 transition-colors cursor-text"
                placeholder="Enter first name"
              />
            </Field>

            {/* Last Name */}
            <Field icon={User} label="Last Name" error={errors.profile?.lastName?.message}>
              <Input
                id="lastName"
                {...register("profile.lastName", {
                  onBlur: () => trigger("profile.lastName"),
                })}
                className="bg-background border-border dark:border-zinc-600 text-foreground focus-visible:ring-amber-500/40 focus-visible:border-amber-500 transition-colors cursor-text"
                placeholder="Enter last name"
              />
            </Field>

            {/* Email */}
            <Field
              icon={Mail}
              label="Email Address"
              error={errors.profile?.email?.message}
            >
              <Input
                id="email"
                type="email"
                {...register("profile.email", {
                  onBlur: () => trigger("profile.email"),
                })}
                className="bg-background border-border dark:border-zinc-600 text-foreground focus-visible:ring-amber-500/40 focus-visible:border-amber-500 transition-colors cursor-text"
                placeholder="email@example.com"
              />
            </Field>

            {/* Phone */}
            <Field
              icon={Phone}
              label="Phone Number"
              error={errors.profile?.contact?.message}
            >
              <Input
                id="phone"
                {...register("profile.contact", {
                  onBlur: (e: any) => {
                    const formatted = formatPhone(e.target.value);
                    e.target.value = formatted;
                    setValue("profile.contact", formatted, {
                      shouldValidate: true,
                    });
                    trigger("profile.contact");
                  },
                })}
                className="bg-background border-border dark:border-zinc-600 text-foreground focus-visible:ring-amber-500/40 focus-visible:border-amber-500 transition-colors cursor-text"
                placeholder="10-digit mobile number"
              />
            </Field>

            {/* Status */}
            <Field icon={Activity} label="Account Status">
              <Select
                value={profileStatus || ""}
                onValueChange={(val) =>
                  setValue("profile.status", val, { shouldDirty: true })
                }
              >
                <SelectTrigger
                  id="status"
                  className="bg-background border-border dark:border-zinc-600 text-foreground focus:ring-amber-500/40 focus:border-amber-500 transition-colors cursor-pointer"
                >
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE" className="cursor-pointer">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-400 inline-block" />
                      Active
                    </span>
                  </SelectItem>
                  <SelectItem value="INACTIVE" className="cursor-pointer">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-400 inline-block" />
                      Inactive
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>
      </div>

      {/* ── System Status Overview ───────────────────── */}
      <div className="mt-6">
        {/* System Status */}
        <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm shadow-lg p-6 space-y-5">
          <div className="flex items-center gap-2 pb-4 border-b border-border">
            <AlertCircle className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">System Status</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Live monitoring and maintenance</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col justify-between space-y-2 border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 md:pr-6">
              <div>
                <Label className="text-sm text-foreground">Health Monitoring</Label>
                <p className="text-xs text-muted-foreground">All systems operational</p>
              </div>
              <div className="pt-2">
                <Badge className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20">
                  Active
                </Badge>
              </div>
            </div>
            <div className="flex flex-col justify-between space-y-2 border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 md:pr-6 md:pl-2">
              <div>
                <Label className="text-sm text-foreground">Maintenance Mode</Label>
                <p className="text-xs text-muted-foreground">System is currently live</p>
              </div>
              <div className="pt-2">
                <Switch checked={false} disabled />
              </div>
            </div>
            <div className="flex flex-col justify-between space-y-2 md:pl-2">
              <div>
                <Label className="text-xs text-foreground">Last Automated Backup</Label>
                <p className="text-xs text-muted-foreground">Daily encrypted snapshots</p>
              </div>
              <div className="pt-2">
                <p className="text-sm font-medium text-foreground">Today, 02:00 AM UTC</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    {/* ── Platform Configuration Overview ───────────────────── */}
    <div className="mt-6">
      {/* Platform Configuration */}
      <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm shadow-lg p-6 space-y-5">
        <div className="flex items-center gap-2 pb-4 border-b border-border">
          <Globe className="w-4 h-4 text-blue-400" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Platform Configuration</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Core system information</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col justify-between space-y-2 border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 md:pr-6">
            <div>
              <Label className="text-sm text-foreground">Platform Name</Label>
              <p className="text-xs text-muted-foreground">Registered application name</p>
            </div>
            <div className="pt-2">
              <p className="text-sm font-medium text-foreground">LendGrid SaaS</p>
            </div>
          </div>
          <div className="flex flex-col justify-between space-y-2 border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 md:pr-6 md:pl-2">
            <div>
              <Label className="text-sm text-foreground">Support Contact</Label>
              <p className="text-xs text-muted-foreground">Primary escalation details</p>
            </div>
            <div className="pt-2 space-y-2 mt-1">
              <a href="mailto:wecare@f2fintech.com" className="flex items-center gap-2 text-sm font-medium text-amber-500 hover:underline w-fit">
                <Mail className="w-3.5 h-3.5" />
                wecare@f2fintech.com
              </a>
              <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                +91 8810600135
              </p>
              <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                +91 8860600555
              </p>
            </div>
          </div>
          <div className="flex flex-col justify-between space-y-2 md:pl-2">
            <div>
              <Label className="text-sm text-foreground">Platform Environment</Label>
              <p className="text-xs text-muted-foreground">Current deployment stage</p>
            </div>
            <div className="pt-2">
              <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/20">Production</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

// ─── Main exported component ─────────────────────────────────────────────────
export function SuperAdminSettings() {
  const { data: userData, isLoading } = useProfile(true);
  const updateUserHook = useUpdateUser();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const methods = useForm<RootForm>({
    resolver: zodResolver(rootSchema),
    mode: "onBlur",
    defaultValues: {
      profile: {
        userId: "",
        firstName: "",
        lastName: "",
        email: "",
        contact: "",
        status: "",
        photoUrl: "",
        createdAt: "",
      },
    },
  });

  const { handleSubmit, trigger, reset, watch, register } = methods;
  const createdAt = watch("profile.createdAt");

  useEffect(() => {
    if (userData) {
      const nameParts = userData.username?.split(" ") || ["", ""];
      reset({
        profile: {
          userId: userData._id,
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          email: userData.email || "",
          contact: userData.contact || "",
          photoUrl: userData.photoUrl || "",
          status: userData.status || "",
          createdAt: (userData as any).createdAt || "",
        },
      });
    }
  }, [userData, reset]);

  const onSave = handleSubmit(async (values) => {
    setIsSaving(true);
    try {
      const targetUserId =
        values.profile?.userId ||
        userData?._id ||
        (userData as any)?.id;

      if (!targetUserId) {
        toast({
          title: "Error",
          description: "User ID not found. Please refresh and try again.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      const fullName = `${values.profile?.firstName || ""} ${values.profile?.lastName || ""}`.trim();
      const userPayload: any = {
        id: targetUserId,
        username: fullName || undefined,
        email: values.profile?.email || undefined,
        contact: values.profile?.contact || undefined,
        photoUrl: values.profile?.photoUrl || undefined,
      };

      const validStatus = (values.profile?.status || userData?.status)?.trim().toUpperCase();
      if (validStatus && ["ACTIVE", "INACTIVE", "PENDING_APPROVAL", "SUSPENDED"].includes(validStatus)) {
        userPayload.status = validStatus;
      }

      await updateUserHook.mutateAsync(userPayload);
      toast({ title: "Profile updated", description: "Changes saved successfully." });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <CardSkeleton headerLines={2} bodyHeight={400} />
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <input type="hidden" {...register("profile.userId")} />
      <div className="min-h-screen bg-background p-4 sm:p-8">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6"
        >
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                My Profile
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1 ml-8">
              Manage your super admin account settings
            </p>
          </div>

          <Button
            className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-semibold shadow-lg shadow-amber-500/20 transition-all duration-200"
            onClick={async () => {
              const ok = await trigger();
              if (!ok) {
                toast({
                  title: "Validation failed",
                  description: "Please check all required fields",
                  variant: "destructive",
                });
                return;
              }
              await onSave();
            }}
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="w-full"
        >
          <ProfileForm createdAt={createdAt} />
        </motion.div>
      </div>
    </FormProvider>
  );
}
