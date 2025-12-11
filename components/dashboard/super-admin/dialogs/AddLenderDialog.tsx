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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-gray-900 to-black border-gray-700 text-white max-w-3xl rounded-xl shadow-2xl"
        onInteractOutside={(e) => {
          e.preventDefault();
        }}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
            Add New Lender Admin
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Register a new Lender Administrator and their company profile.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                {...register("companyName")}
                className="bg-gray-800 border-gray-700 h-11"
                placeholder="e.g., ABC Finance Pvt. Ltd."
              />
              {errors.companyName && (
                <p className="text-red-400 text-sm">{errors.companyName.message}</p>
              )}
            </div>

            {/* Lender Type */}
            <div className="space-y-2">
              <Label>Lender Type</Label>
              <Select
                onValueChange={(value) => setValue("lenderType", value as LenderType, { shouldValidate: true })}
                defaultValue="bank"
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 h-11">
                  <SelectValue placeholder="Select Lender Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">
                    <div className="flex items-center gap-2"><Building className="w-4 h-4" /><span>Bank</span></div>
                  </SelectItem>
                  <SelectItem value="nbfc">
                    <div className="flex items-center gap-2"><Landmark className="w-4 h-4" /><span>NBFC</span></div>
                  </SelectItem>
                  <SelectItem value="fintech">
                    <div className="flex items-center gap-2"><Cpu className="w-4 h-4" /><span>Fintech</span></div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.lenderType && (
                <p className="text-red-400 text-sm">{errors.lenderType.message}</p>
              )}
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                {...register("fullName")}
                className="bg-gray-800 border-gray-700 h-11"
                placeholder="e.g., John Doe"
              />
              {errors.fullName && (
                <p className="text-red-400 text-sm">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                className="bg-gray-800 border-gray-700 h-11"
                placeholder="e.g., john.doe@company.com"
              />
              {errors.email && (
                <p className="text-red-400 text-sm">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Set Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  className="bg-gray-800 border-gray-700 h-11 pr-10"
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-white"
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
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  className="bg-gray-800 border-gray-700 h-11 pr-10"
                  placeholder="Re-enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-400 text-sm">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-5 border-t border-gray-700/50">
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
              className="bg-gradient-to-r from-blue to-cyan-500 text-white shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
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
