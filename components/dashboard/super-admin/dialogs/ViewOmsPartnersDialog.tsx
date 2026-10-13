"use client"

import {
  Building2,
  Loader2,
  X,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useOmsPartnersForAdmin } from "@/hooks/use-oms-referrals"
import { OmsReferralItem } from "@/lib/oms-referral-api"
import { capitalizeEachWord } from "@/lib/utils"

interface ViewOmsPartnersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  referral: OmsReferralItem | null
}

function getInitials(name?: string) {
  if (!name || !name.trim()) return "OMS"
  return name
    .trim()
    .split(/\s+/)
    .map((s) => s.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("")
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—"
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

export function ViewOmsPartnersDialog({
  open,
  onOpenChange,
  referral,
}: ViewOmsPartnersDialogProps) {
  const { data, isLoading } = useOmsPartnersForAdmin(referral?.omsEmployeeId, open)

  const partners = data?.partners ?? []
  const totalPartners = partners.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl sm:max-w-4xl bg-card border-border text-card-foreground max-h-[90vh] overflow-y-auto shadow-2xl p-0 rounded-2xl">
        <DialogTitle className="sr-only">
          {referral ? `${referral.employeeName} - Referred Channel Partners` : "Referred Channel Partners"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          List of channel partners onboarded via OMS referral
        </DialogDescription>

        {/* Top Header Banner */}
        <div className="h-20 sm:h-24 bg-muted/60 dark:bg-slate-950/60 border-b border-border relative px-6 sm:px-8">
          {/* Extreme Top Right Circular Close Button with Blue Ring & Crimson Rose/Red Hover */}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 sm:top-5 sm:right-6 w-9 h-9 rounded-full border-2 border-primary bg-background dark:bg-card text-foreground hover:border-rose-500 hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center transition-all cursor-pointer shadow-lg z-30 hover:scale-105 active:scale-95 group"
            aria-label="Close"
          >
            <X className="w-4 h-4 stroke-[2.5] transition-colors" />
          </button>
        </div>

        {/* Profile Content Container */}
        <div className="px-6 sm:px-8 pb-6 sm:pb-8 relative">
          {/* Profile Hero Section */}
          {referral && (
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 -mt-10 sm:-mt-12 mb-6">
              {/* Avatar & Details */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-5">
                {/* Avatar with Status Dot */}
                <div className="relative flex-shrink-0">
                  <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-card shadow-2xl bg-muted">
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white text-2xl sm:text-3xl font-bold">
                      {getInitials(referral.employeeName || referral.employeeCode || "OMS")}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500 border-2 border-card absolute bottom-1 right-1 shadow-lg z-20"
                    title="Active Member"
                  />
                </div>

                {/* Name & Meta */}
                <div className="pb-1">
                  <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight mb-2">
                    {capitalizeEachWord(referral.employeeName)?.trim()}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground font-medium">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-medium text-xs px-2.5 py-0.5">
                      OMS
                    </Badge>
                    <span>•</span>
                    <span className="uppercase tracking-wider">
                      Employee ID: {referral?.omsEmployeeId}
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Status Pill */}
              <Badge className="px-4 py-1 text-xs font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-full self-start sm:self-end mb-1">
                Active
              </Badge>
            </div>
          )}

          {/* Referred Channel Partners Directory Section */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Referred Channel Partners ({totalPartners})
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Channel partners onboarded through {referral?.referralCode}
                </p>
              </div>
            </div>

            {/* Table or Empty state */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading referred channel partners...</p>
              </div>
            ) : totalPartners === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/40 rounded-xl border border-border">
                <div className="p-4 bg-muted rounded-full mb-3">
                  <Building2 className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-base font-semibold text-foreground">No Channel Partners Onboarded</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  No channel partners have signed up using "{referral?.referralCode}" referral code yet.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden bg-card">
                <ScrollArea className="max-h-[360px]">
                  <Table>
                    <TableHeader className="bg-muted/70 dark:bg-slate-900/60 sticky top-0 z-10 border-b border-border">
                      <TableRow className="border-b border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground font-semibold">Company Name</TableHead>
                        <TableHead className="text-muted-foreground font-semibold text-center">Applications</TableHead>
                        <TableHead className="text-muted-foreground font-semibold text-right">Disbursed Amount</TableHead>
                        <TableHead className="text-muted-foreground font-semibold text-right">Joined Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partners.map((partner) => (
                        <TableRow
                          key={partner._id}
                          className="border-b border-border hover:bg-muted/40 transition-colors"
                        >
                          {/* Company Name & ID */}
                          <TableCell className="py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-4 h-4 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground text-sm truncate">
                                  {partner.companyName
                                    ? capitalizeEachWord(partner.companyName)
                                    : "Unnamed Partner"}
                                </p>
                                {partner.companyId && (
                                  <p className="text-xs text-muted-foreground font-mono">
                                    ID: {partner.companyId}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Applications */}
                          <TableCell className="text-center py-3.5">
                            <span className="text-sm font-bold text-foreground">
                              {partner.totalApplicationsSubmitted ?? 0}
                            </span>
                          </TableCell>

                          {/* Disbursed Amount */}
                          <TableCell className="text-right py-3.5 font-semibold text-foreground text-sm">
                            {formatCurrency(partner.totalDisbursedAmount || 0)}
                          </TableCell>

                          {/* Joined Date */}
                          <TableCell className="text-right py-3.5 text-xs text-muted-foreground">
                            {formatDate(partner.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

