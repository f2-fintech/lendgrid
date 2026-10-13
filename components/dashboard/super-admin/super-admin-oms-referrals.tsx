"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Share2,
  Users,
  Copy,
  Check,
  Search,
  Eye,
  Loader2,
  UserPlus,
  Building2,
  IndianRupee,
  FileText,
  BadgeCheck,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { TablePagination } from "@/components/ui/pagination"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { useAllOmsReferrals } from "@/hooks/use-oms-referrals"
import { OmsReferralItem } from "@/lib/oms-referral-api"
import { capitalizeEachWord } from "@/lib/utils"
import { GenerateOmsReferralDialog } from "./dialogs/GenerateOmsReferralDialog"
import { ViewOmsPartnersDialog } from "./dialogs/ViewOmsPartnersDialog"

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
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

function MetricCard({
  index,
  title,
  amount,
  count,
  countLabel,
  icon: Icon,
  colorClass,
}: {
  index: number
  title: string
  amount?: number | string
  count?: number
  countLabel?: string
  icon: any
  colorClass: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className={`professional-card hover-lift ${colorClass}`}>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-xl flex flex-shrink-0 items-center justify-center bg-white/15">
              <Icon className="w-6 h-6 text-current" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground opacity-90 truncate">
                {title}
              </p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <p className="text-2xl font-bold text-foreground">
                  {amount ?? "-"}
                </p>
                {(typeof count === "number" || countLabel) && (
                  <p className="text-xs text-muted-foreground font-medium">
                    ({typeof count === "number" ? `${count} ` : ""}
                    {countLabel})
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function SuperAdminOmsReferrals() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
  const [selectedReferralForPartners, setSelectedReferralForPartners] = useState<OmsReferralItem | null>(null)

  const tableTopRef = useRef<HTMLDivElement | null>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const { data, isLoading } = useAllOmsReferrals({
    page,
    limit: pageSize,
    searchTerm: debouncedSearch || undefined,
  })

  const referrals = data?.items ?? []
  const totalCount = data?.totalCount ?? 0
  const metrics = data?.metrics ?? {
    totalReferrers: 0,
    totalPartnersOnboarded: 0,
    totalDisbursedVolume: 0,
  }

  const existingOmsEmployeeIds = referrals.map((r) => r.omsEmployeeId)

  const handleCopyLink = (referral: OmsReferralItem) => {
    if (!referral.signupLink) return
    navigator.clipboard.writeText(referral.signupLink)
    setCopiedCode(referral.referralCode)
    toast({
      title: "Referral Link Copied!",
      description: `Copied signup link for ${referral.employeeName} (${referral.referralCode})`,
    })
    setTimeout(() => setCopiedCode(null), 2500)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(1)
    tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            OMS Referrals Management
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Track and generate referral links used by OMS operations staff to onboard Channel Partners.
          </p>
        </div>

        <Button
          onClick={() => setIsGenerateDialogOpen(true)}
          className="gap-2 shadow-sm font-semibold"
        >
          <UserPlus className="w-4 h-4" />
          Generate Referral Code
        </Button>
      </motion.div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
        <MetricCard
          index={0}
          title="Total Referrers"
          amount={metrics.totalReferrers}
          countLabel="active staff"
          icon={Users}
          colorClass="metric-card-primary"
        />
        <MetricCard
          index={1}
          title="Partners Onboarded"
          amount={metrics.totalPartnersOnboarded}
          countLabel="channel partners"
          icon={Building2}
          colorClass="metric-card-success"
        />
        <MetricCard
          index={2}
          title="Disbursed Volume"
          amount={formatCurrency(metrics.totalDisbursedVolume)}
          countLabel="total loans"
          icon={IndianRupee}
          colorClass="metric-card-warning"
        />
      </div>

      {/* Main Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-primary" />
                  Staff Referral Directory
                </CardTitle>
                <CardDescription className="mt-1 ml-6">
                  {totalCount} referral record{totalCount !== 1 ? "s" : ""} found
                </CardDescription>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, code or referral code…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-muted/50 border-border text-foreground"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div ref={tableTopRef} />

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm">Loading referral directory…</p>
              </div>
            ) : referrals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="p-5 bg-muted rounded-full mb-4">
                  <Share2 className="w-10 h-10 text-muted-foreground" />
                </div>
                <p className="text-base font-semibold text-foreground mb-1">
                  {searchTerm ? "No referral links match your search" : "No referral links generated yet"}
                </p>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  {searchTerm
                    ? "Try adjusting your search criteria or clear the query."
                    : "Generate your first referral code to start tracking partner signups."}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => setIsGenerateDialogOpen(true)}
                    variant="outline"
                    className="gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Generate First Code
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto professional-table">
                <Table>
                  <TableHeader className="bg-muted/70 dark:bg-slate-900/60 border-b border-border">
                    <TableRow className="border-b border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground font-semibold">Employee</TableHead>
                      <TableHead className="text-muted-foreground font-semibold">Referral Code</TableHead>
                      <TableHead className="text-muted-foreground font-semibold text-center">Referred Partners</TableHead>
                      <TableHead className="text-muted-foreground font-semibold text-center">Applications</TableHead>
                      <TableHead className="text-muted-foreground font-semibold text-right">Disbursed Volume</TableHead>
                      <TableHead className="text-muted-foreground font-semibold text-right">Created Date</TableHead>
                      <TableHead className="text-muted-foreground font-semibold text-right w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrals.map((item, idx) => {
                      const isCopied = copiedCode === item.referralCode

                      return (
                        <motion.tr
                          key={item._id}
                          initial={{ opacity: 0, x: -16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.03 }}
                          className="border-b border-border hover:bg-muted/30 transition-colors"
                        >
                          {/* Employee */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-9 h-9 rounded-lg">
                                <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                                  {getInitials(item.employeeName || item.employeeCode || "OMS")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-foreground text-sm">
                                  {capitalizeEachWord(item.employeeName)?.trim()}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Referral Code */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-primary/10 text-primary border-primary/20 font-mono text-xs px-2 py-0.5">
                                {item.referralCode}
                              </Badge>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleCopyLink(item)}
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  >
                                    {isCopied ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{isCopied ? "Copied!" : "Copy Signup Link"}</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>

                          {/* Referred Partners */}
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={`font-semibold text-xs ${item.referredPartnersCount > 0
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "text-muted-foreground border-border"
                                }`}
                            >
                              {item.referredPartnersCount} Partner{item.referredPartnersCount !== 1 ? "s" : ""}
                            </Badge>
                          </TableCell>

                          {/* Applications */}
                          <TableCell className="text-center">
                            <span className="text-sm font-medium text-foreground">
                              {item.totalApplicationsSubmitted}
                            </span>
                          </TableCell>

                          {/* Disbursed Volume */}
                          <TableCell className="text-right font-medium text-foreground text-sm">
                            {formatCurrency(item.totalDisbursedAmount)}
                          </TableCell>

                          {/* Created Date */}
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {formatDate(item.createdAt)}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedReferralForPartners(item)}
                              className="h-8 gap-1.5 text-xs border-border hover:bg-muted"
                            >
                              <Eye className="w-3.5 h-3.5 text-primary" />
                              View
                            </Button>
                          </TableCell>
                        </motion.tr>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {!isLoading && totalCount > 0 && (
              <div className="p-4 border-t border-border">
                <TablePagination
                  page={page}
                  pageSize={pageSize}
                  total={totalCount}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialogs */}
      <GenerateOmsReferralDialog
        open={isGenerateDialogOpen}
        onOpenChange={setIsGenerateDialogOpen}
        existingOmsEmployeeIds={existingOmsEmployeeIds}
      />

      <ViewOmsPartnersDialog
        open={!!selectedReferralForPartners}
        onOpenChange={(open) => !open && setSelectedReferralForPartners(null)}
        referral={selectedReferralForPartners}
      />
    </div>
  )
}
