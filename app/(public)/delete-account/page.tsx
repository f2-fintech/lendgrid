"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, ArrowLeft, CheckCircle, Trash2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { navigationPaths } from "@/lib/navigation";
import { ThemeLogo } from "@/components/theme-logo";
import { useRequestDeletion } from "@/hooks/use-users";

const deleteAccountSchema = z.object({
  email: z.string().email("Please enter a valid email address").toLowerCase().trim(),
  password: z.string().min(1, "Password is required to confirm identity"),
  reason: z.string().optional(),
});

type DeleteAccountFormData = z.infer<typeof deleteAccountSchema>;

export default function DeleteAccountPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { mutateAsync: requestDeletion, isPending } = useRequestDeletion();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DeleteAccountFormData>({
    resolver: zodResolver(deleteAccountSchema),
    mode: "onBlur",
    defaultValues: { email: "", password: "", reason: "" },
  });

  const onSubmit = async (data: DeleteAccountFormData) => {
    try {
      const response = await requestDeletion({
        email: data.email,
        password: data.password,
        reason: data.reason,
      });

      if (response?.requestAccountDeletion?.success) {
        setIsSuccess(true);
      }
    } catch (error) {
      console.error("Deletion request error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 md:p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-8 items-start"
      >
        {/* Compliance and Data policy section */}
        <div className="md:col-span-7 space-y-6 text-foreground bg-card border border-border p-6 md:p-8 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center shadow-lg">
              <ThemeLogo alt="LendGrid" className="w-12 h-12 object-contain" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">
              LendGrid
            </h1>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-2">Account Deletion & Data Retention Policy</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              In compliance with Google Play Store guidelines and user privacy standards, LendGrid provides this secure portal to request the deletion of your account and associated data.
            </p>
          </div>

          <hr className="border-border" />

          <div className="space-y-3">
            <h3 className="text-md font-semibold text-primary">Steps to Request Deletion:</h3>
            <ol className="list-decimal list-inside text-sm space-y-1.5 text-muted-foreground">
              <li>Enter your registered email and password in the confirmation form.</li>
              <li>Optionally, share your reason for leaving to help us improve our platform.</li>
              <li>Click <strong>Confirm Request Deletion</strong> to submit your request.</li>
              <li>Our administration team will review and process your request within <strong>7 business days</strong>.</li>
            </ol>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 space-y-2">
              <h4 className="text-sm font-semibold text-destructive flex items-center gap-1.5">
                What data is deleted?
              </h4>
              <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                <li>KYC Documents & Uploaded Files</li>
                <li>Aadhaar & PAN details</li>
                <li>Bank Accounts & Payout Info</li>
                <li>Registered Address & Contacts</li>
                <li>Hashed Passwords & Login History</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-2">
              <h4 className="text-sm font-semibold text-primary flex items-center gap-1.5">
                What data is retained?
              </h4>
              <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                <li>Bare system ID & Email</li>
                <li>Registered Company Name</li>
                <li>Historical loan transactions</li>
                <li>Audit trail (financial compliance)</li>
              </ul>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <h4 className="text-xs font-semibold text-amber-500 mb-1">
              Important Compliance Notice:
            </h4>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Under financial regulatory compliance laws (such as AML/KYC audits), transactional data and past loan applications will be retained for a statutory retention period before complete archival. Account deletion will be blocked if you have active, undisbursed, or unrejected loan applications.
            </p>
          </div>
        </div>

        {/* Form Card section */}
        <div className="md:col-span-5 w-full">
          <Card className="enhanced-card">
            <CardHeader className="text-center pb-6">
              <motion.div
                className="flex flex-col items-center gap-2"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
              >
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Confirm Deletion
                </h2>
                <p className="text-sm text-muted-foreground">
                  Secure account deletion portal
                </p>
              </motion.div>
            </CardHeader>

            <CardContent>
              {isSuccess ? (
                <motion.div
                  className="flex flex-col items-center text-center gap-5 py-4"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <div className="w-16 h-16 rounded-full flex items-center justify-center bg-green-500/10 border border-green-500/25">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white mb-2">
                      Request Submitted
                    </h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Your request to delete your account has been recorded successfully.
                      <br />
                      The system administrator will review and process your request within 7 business days.
                    </p>
                  </div>
                  <Button
                    asChild
                    className="w-full h-12 mt-2 rounded-xl bg-primary text-primary-foreground text-md font-semibold hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/30"
                  >
                    <Link href={navigationPaths.login}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Login
                    </Link>
                  </Button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      className="h-11 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
                      placeholder="Enter your registered email"
                      disabled={isPending}
                    />
                    {errors.email && (
                      <p className="text-destructive text-sm mt-1 font-medium">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-foreground font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        {...register("password")}
                        className="h-11 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
                        placeholder="Enter your account password"
                        disabled={isPending}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isPending}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="text-destructive text-sm mt-1 font-medium">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason" className="text-foreground font-medium">
                      Reason for Deletion (Optional)
                    </Label>
                    <Textarea
                      id="reason"
                      {...register("reason")}
                      className="min-h-[100px] rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 resize-none"
                      placeholder="Please let us know why you would like to delete your account"
                      disabled={isPending}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full h-12 mt-2 rounded-xl bg-destructive text-destructive-foreground text-md font-semibold hover:bg-destructive/90 transition-all duration-200 shadow-lg shadow-destructive/30 disabled:opacity-50"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-5 h-5 mr-2" />
                        Confirm Request Deletion
                      </>
                    )}
                  </Button>

                  <div className="text-center pt-2">
                    <Link
                      href={navigationPaths.login}
                      className="text-sm inline-flex items-center gap-1.5 text-primary hover:underline font-medium transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back to Login
                    </Link>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
