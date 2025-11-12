"use client";

import { useState, useMemo, useEffect } from "react";
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

import { Plus, Loader2, Eye, EyeOff } from "lucide-react";

import { useToast } from "@/hooks/use-toast";

import { useRegister, useUpdateUser } from "@/hooks/use-users";
import { useCreateBranch } from "@/hooks/use-lenders";

// ----------------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------------
type GenderLower = "male" | "female" | "other";
type LenderTypeLower = "Bank" | "NBFC" | "Fintech";

export type LenderFormValues = {
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  lenderType: LenderTypeLower;
  address: string;
  pincode: string;
  gender: GenderLower;
  dob: string;
  password?: string;
  confirmPassword?: string;
};

// ----------------------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------------------

export function AddLenderDialog({
  isOpen,
  mode,
  editData,
  onClose,
  onSuccess,
  refetch,
}: {
  isOpen: boolean;
  mode: "add" | "edit";
  editData?: any;
  onClose: () => void;
  onSuccess: () => void;
  refetch?: () => void;
}) {
  const { toast } = useToast();

  const registerMutation = useRegister();
  const updateUserMutation = useUpdateUser();

  // Keep branch logic same as your original code
  useCreateBranch();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ----------------------------------------------------------------------------------
  // ✅ ZOD SCHEMA (Strong password same as AddAggregator)
  // ----------------------------------------------------------------------------------
  const formSchema = useMemo(() => {
    return z
      .object({
        fullName: z
          .string()
          .min(2, "Contact person name must be at least 2 characters")
          .max(50, "Name is too long")
          .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),

        email: z.string().email("Enter valid email").toLowerCase().trim(),

        phone: z
          .string()
          .min(10, "Phone must be at least 10 digits")
          .max(15, "Phone too long")
          .regex(/^[0-9]+$/, "Phone must contain only digits"),

        companyName: z.string().min(2, "Company name must be at least 2 characters"),

        lenderType: z.enum(["Bank", "NBFC", "Fintech"], {
          required_error: "Select lender type",
        }),

        address: z.string().min(5, "Enter a valid address"),

        pincode: z
          .string()
          .regex(/^[0-9]{4,10}$/, "Pincode must be numeric between 4-10 digits"),

        gender: z.enum(["male", "female", "other"], {
          required_error: "Select gender",
        }),

        dob: z.string().refine((v) => !isNaN(Date.parse(v)), {
          message: "Invalid date",
        }),

        password: z.string().optional(),
        confirmPassword: z.string().optional(),
      })
      .superRefine((data, ctx) => {
        // ADD MODE → validate passwords strongly
        if (mode === "add") {
          if (!data.password) {
            ctx.addIssue({
              code: "custom",
              message: "Password is required",
              path: ["password"],
            });
          } else {
            if (data.password.length < 8)
              ctx.addIssue({
                code: "custom",
                message: "Password must be 8+ characters",
                path: ["password"],
              });

            if (!/[A-Z]/.test(data.password))
              ctx.addIssue({
                code: "custom",
                message: "Must include 1 uppercase",
                path: ["password"],
              });

            if (!/[a-z]/.test(data.password))
              ctx.addIssue({
                code: "custom",
                message: "Must include 1 lowercase",
                path: ["password"],
              });

            if (!/[0-9]/.test(data.password))
              ctx.addIssue({
                code: "custom",
                message: "Must include 1 number",
                path: ["password"],
              });

            if (!/[^\w]/.test(data.password))
              ctx.addIssue({
                code: "custom",
                message: "Must include 1 special character",
                path: ["password"],
              });
          }

          if (data.password !== data.confirmPassword) {
            ctx.addIssue({
              code: "custom",
              message: "Passwords do not match",
              path: ["confirmPassword"],
            });
          }
        }

        // EDIT MODE → block password
        if (mode === "edit") {
          if (data.password || data.confirmPassword) {
            ctx.addIssue({
              code: "custom",
              message: "Password cannot be changed here",
              path: ["password"],
            });
          }
        }
      });
  }, [mode]);

  // ----------------------------------------------------------------------------------
  // ✅ DEFAULT VALUES
  // ----------------------------------------------------------------------------------
  const defaultValues: LenderFormValues = useMemo(() => {
    if (mode === "edit" && editData) {
      return {
        fullName: editData.user?.username ?? "",
        email: editData.user?.email ?? "",
        phone: editData.user?.contact ?? "",
        companyName: editData.companyName ?? "",
        lenderType: (editData.lenderType || editData.type) as LenderTypeLower,
        address: editData.user?.address ?? "",
        pincode: String(editData.user?.pincode ?? ""),
        gender: (editData.user?.gender?.toLowerCase() as GenderLower) ?? "male",
        dob: editData.user?.dob
          ? new Date(editData.user.dob).toISOString().split("T")[0]
          : "",
        password: undefined,
        confirmPassword: undefined,
      };
    }

    return {
      fullName: "",
      email: "",
      phone: "",
      companyName: "",
      lenderType: "Bank",
      address: "",
      pincode: "",
      gender: "male",
      dob: "",
      password: undefined,
      confirmPassword: undefined,
    };
  }, [mode, editData]);

  // ----------------------------------------------------------------------------------
  // ✅ UseForm
  // ----------------------------------------------------------------------------------
  const {
    register,
    setValue,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LenderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  useEffect(() => {
    if (isOpen) reset(defaultValues);
  }, [isOpen, defaultValues, reset]);

  // ----------------------------------------------------------------------------------
  // ✅ SUBMIT HANDLER
  // ----------------------------------------------------------------------------------
  const onSubmit = async (data: LenderFormValues) => {
    setIsLoading(true);

    try {
      const payload: any = {
        id: editData?.user?._id,
        username: data.fullName,
        email: data.email,
        contact: data.phone,
        companyName: data.companyName,
        address: data.address,
        role: "LENDER_ADMIN",
        gender: data.gender.toUpperCase(),
        dob: new Date(data.dob).toISOString(),
        pincode: Number(data.pincode),
        lenderType: data.lenderType,
      };

      if (mode === "add" && data.password) {
        payload.password = data.password;
      }

      if (mode === "edit") {
        await updateUserMutation.mutateAsync(payload);
      } else {
        await registerMutation.mutateAsync(payload);
      }

      toast({
        title: "Success",
        description:
          mode === "edit"
            ? "Lender updated successfully."
            : "Lender registered successfully.",
      });

      onSuccess?.();
      reset();
      onClose();
      refetch?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------------------------------------------------------------
  // ✅ RETURN JSX
  // ----------------------------------------------------------------------------------
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-4xl w-[95%] max-h-[95vh] overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {mode === "edit" ? "Edit Lender" : "Add New Lender"}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {mode === "edit"
              ? "Update the details of this lender."
              : "Register a new lender to the platform."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-6">
            {/* Company */}
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input
                {...register("companyName")}
                className="glass-input text-black h-12"
                placeholder="Enter company name"
              />
              {errors.companyName && (
                <p className="text-red-400 text-sm">
                  {errors.companyName.message}
                </p>
              )}
            </div>

            {/* Lender Type */}
            <div className="space-y-2">
              <Label>Lender Type</Label>
              <Select
                defaultValue={defaultValues.lenderType}
                onValueChange={(v) =>
                  setValue("lenderType", v as LenderTypeLower, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="glass-input text-gray-500 h-12">
                  <SelectValue placeholder="Select lender type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bank">Bank</SelectItem>
                  <SelectItem value="NBFC">NBFC</SelectItem>
                  <SelectItem value="Fintech">Fintech</SelectItem>
                </SelectContent>
              </Select>
              {errors.lenderType && (
                <p className="text-red-400 text-sm">
                  {errors.lenderType.message}
                </p>
              )}
            </div>

            {/* FullName */}
            <div className="space-y-2">
              <Label>Contact Person Name</Label>
              <Input
                {...register("fullName")}
                className="glass-input text-black h-12"
                placeholder="Enter name"
              />
              {errors.fullName && (
                <p className="text-red-400 text-sm">
                  {errors.fullName.message}
                </p>
              )}
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
              {errors.email && (
                <p className="text-red-400 text-sm">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                {...register("phone")}
                className="glass-input text-black h-12"
                placeholder="Enter phone"
              />
              {errors.phone && (
                <p className="text-red-400 text-sm">{errors.phone.message}</p>
              )}
            </div>

            {/* DOB */}
            <div className="space-y-2">
              <Label>DOB</Label>
              <Input
                type="date"
                {...register("dob")}
                className="glass-input text-black h-12"
              />
              {errors.dob && (
                <p className="text-red-400 text-sm">{errors.dob.message}</p>
              )}
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select
                defaultValue={defaultValues.gender}
                onValueChange={(v) =>
                  setValue("gender", v as GenderLower, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="glass-input text-gray-500 h-12">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && (
                <p className="text-red-400 text-sm">{errors.gender.message}</p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2 col-span-2">
              <Label>Address</Label>
              <Input
                {...register("address")}
                className="glass-input text-black h-12"
                placeholder="Enter address"
              />
              {errors.address && (
                <p className="text-red-400 text-sm">{errors.address.message}</p>
              )}
            </div>

            {/* Pincode */}
            <div className="space-y-2">
              <Label>Pincode</Label>
              <Input
                {...register("pincode")}
                className="glass-input text-black h-12"
                placeholder="Enter pincode"
              />
              {errors.pincode && (
                <p className="text-red-400 text-sm">{errors.pincode.message}</p>
              )}
            </div>

            {/* PASSWORD ONLY IN ADD MODE */}
            {mode === "add" && (
              <>
                {/* Password */}
                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      {...register("password")}
                      className="glass-input text-black pr-10 h-12"
                      placeholder="Enter password"
                    />
                    <Button
                      className="absolute right-0 top-0 h-full px-3"
                      type="button"
                      variant="ghost"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-sm">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      {...register("confirmPassword")}
                      className="glass-input text-black pr-10 h-12"
                      placeholder="Confirm password"
                    />
                    <Button
                      className="absolute right-0 top-0 h-full px-3"
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-400 text-sm">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onClose();
              }}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue to-cyan-500 text-dark"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {mode === "edit" ? "Updating Lender..." : "Adding Lender..."}
                </>
              ) : mode === "edit" ? (
                "Update Lender"
              ) : (
                "Add Lender"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
