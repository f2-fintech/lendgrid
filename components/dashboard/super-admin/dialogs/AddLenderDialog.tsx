"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Cpu, Building, Landmark, Loader2, Eye, EyeOff } from "lucide-react";

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
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useToast } from "@/hooks/use-toast";
import { useRegister } from "@/hooks/use-users";
import { LenderType } from "@/lib";

// ZOD SCHEMA
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

    lenderType: z.enum(["bank", "nbfc", "fintech"], {
      required_error: "Please select lender type",
    }),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain 1 uppercase letter")
      .regex(/[a-z]/, "Must contain 1 lowercase letter")
      .regex(/[0-9]/, "Must contain 1 number")
      .regex(/[^\w]/, "Must contain 1 special character")
      .max(30, "Password cannot exceed 30 characters"),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export function AddLenderDialog({
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
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      email: "",
      companyName: "",
      lenderType: "bank",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (isOpen) reset();
  }, [isOpen, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      const payload = {
        username: data.fullName,
        email: data.email,
        password: data.password,
        companyName: data.companyName,
        lenderType: data.lenderType.toUpperCase(),
        role: "LENDER_ADMIN",
      };

      const res: any = await registerMutation.mutateAsync(payload);

      if (res?.createUser?.success) {
        toast({
          title: "Success",
          description: "Lender admin created successfully!",
        });

        onClose?.();
        refetch?.();
        return;
      }

      throw new Error(res?.createUser?.message || "Failed to create lender admin.");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to create lender admin",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => { }}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-lg w-[95%] rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add New Lender Admin</DialogTitle>
          <DialogDescription className="text-gray-400">
            Register a New Lender Administrator
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Company Name */}
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input
              {...register("companyName")}
              className="glass-input text-black h-12"
              placeholder="ABC Finance Pvt. Ltd."
            />
            {errors.companyName && (
              <p className="text-red-400 text-sm">{errors.companyName.message}</p>
            )}
          </div>

          {/* Lender Type */}
          <div className="space-y-2">
            <Label className="text-gray-300 font-medium">Lender Type</Label>
            <Select
              onValueChange={(value) => setValue("lenderType", value as LenderType, { shouldValidate: true })}
              defaultValue="bank"
            >
              <SelectTrigger className="glass-input text-black h-11">
                <SelectValue placeholder="Select Lender Type" />
              </SelectTrigger>
              <SelectContent className="glass-card border-white/10">
                <SelectItem value="bank" className="text-black hover:bg-white/10 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    <span>Bank</span>
                  </div>
                </SelectItem>
                <SelectItem value="nbfc" className="text-black hover:bg-white/10 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4" />
                    <span>NBFC</span>
                  </div>
                </SelectItem>
                <SelectItem value="fintech" className="text-black hover:bg-white/10 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4" />
                    <span>Fintech</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {/* Hidden field to sync with react-hook-form */}
            <input type="hidden" {...register("lenderType")} />
            {errors.lenderType && (
              <p className="text-red-400 text-sm">{errors.lenderType.message}</p>
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
              onClick={() => {
                reset();
                onClose?.();
              }}
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
                "Create Lender Admin"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
