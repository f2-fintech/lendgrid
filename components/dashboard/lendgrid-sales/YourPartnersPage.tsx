"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Search,
  Copy,
  Check,
  FileText,
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  ArrowRight,
  Ticket,
  Send,
  Sparkles,
  Phone,
  Mail,
  Lock,
  User,
  ExternalLink,
  IndianRupee,
  CreditCard,
  Briefcase,
  MapPin,
  Clock,
  BadgeCheck,
  X,
} from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import {
  useMyOmsReferralCode,
  useMyOmsPartners,
  useOmsPartnerApplications,
} from "@/hooks/use-oms-referrals";
import { usersApi } from "@/lib/users-api";
import { companiesApi } from "@/lib/companies-api";
import { useApplicationsRest } from "@/hooks/use-applications-rest";
import { CloneApplicationDialog } from "@/components/common/applications/CloneApplicationDialog";
import { pretty, STATUS_STYLE } from "@/components/common/applications/ApplicationsTab";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import useSWR from "swr";
import { apiFetch } from "@/lib/http-client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { OmsPartnerItem } from "@/lib/oms-referral-api";

const KYC_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  approved: {
    label: "KYC Approved",
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    icon: CheckCircle2,
  },
  pending: {
    label: "KYC Pending",
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: AlertCircle,
  },
  rejected: {
    label: "KYC Rejected",
    color: "text-rose-500 dark:text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    icon: XCircle,
  },
  under_review: {
    label: "Under Review",
    color: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    icon: Eye,
  },
};

function formatCurrency(amount?: number | string) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (!num || isNaN(num)) return "₹0";
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} L`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function PartnerCardStats({ partner }: { partner: OmsPartnerItem }) {
  const { data } = useApplicationsRest({
    companyIdOverride: partner.companyId ? String(partner.companyId) : undefined,
    enabled: !!partner.companyId,
    limit: 1,
  });

  const appsCount = data?.count ?? (partner.totalApplicationsSubmitted ?? 0);

  return (
    <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-muted/40 dark:bg-muted/20 border border-border/40 text-center">
      <div>
        <span className="text-[10px] text-muted-foreground uppercase font-semibold">
          Apps
        </span>
        <div className="font-extrabold text-sm text-foreground">
          {appsCount}
        </div>
      </div>
      <div className="border-x border-border/40">
        <span className="text-[10px] text-muted-foreground uppercase font-semibold">
          Approved
        </span>
        <div className="font-extrabold text-sm text-emerald-500">
          {partner.totalApplicationsApproved ?? 0}
        </div>
      </div>
      <div>
        <span className="text-[10px] text-muted-foreground uppercase font-semibold">
          Volume
        </span>
        <div className="font-extrabold text-xs text-indigo-500 truncate mt-0.5">
          {formatCurrency(partner.totalDisbursedAmount)}
        </div>
      </div>
    </div>
  );
}

export function YourPartnersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, role, loading: authLoading } = useAuth(["lendgrid_sales", "super_admin", "aggregator_admin"]);

  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [kycFilter, setKycFilter] = useState<string>("all");
  const [selectedPartner, setSelectedPartner] = useState<OmsPartnerItem | null>(null);
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);

  // Queries
  const {
    data: referralData,
    isLoading: isReferralLoading,
    refetch: refetchReferral,
  } = useMyOmsReferralCode();

  const {
    data: partnersData,
    isLoading: isPartnersLoading,
    isRefetching: isPartnersRefetching,
    refetch: refetchPartners,
  } = useMyOmsPartners();

  const partners = partnersData?.partners ?? [];
  const totalCount = partnersData?.totalCount ?? partners.length;

  // Filtered partners
  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      const matchesSearch =
        !searchTerm.trim() ||
        p.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(p.companyId || "").includes(searchTerm.trim());

      const status = (p.kycStatus || "pending").toLowerCase();
      const matchesKyc = kycFilter === "all" || status === kycFilter;

      return matchesSearch && matchesKyc;
    });
  }, [partners, searchTerm, kycFilter]);

  // Overall statistics
  const stats = useMemo(() => {
    let totalApps = 0;
    let totalApproved = 0;
    let totalDisbursed = 0;

    partners.forEach((p) => {
      totalApps += p.totalApplicationsSubmitted ?? 0;
      totalApproved += p.totalApplicationsApproved ?? 0;
      totalDisbursed += p.totalDisbursedAmount ?? 0;
    });

    return { totalApps, totalApproved, totalDisbursed };
  }, [partners]);

  // Copy referral code
  const handleCopyCode = async () => {
    if (!referralData?.referralCode) return;
    try {
      await navigator.clipboard.writeText(referralData.referralCode);
      setCopied(true);
      toast({
        title: "Code Copied!",
        description: `Referral code ${referralData.referralCode} copied to clipboard.`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Copy Failed",
        description: "Please copy the referral code manually.",
        variant: "destructive",
      });
    }
  };

  // WhatsApp Share
  const handleShareWhatsApp = () => {
    if (!referralData?.referralCode) return;
    const link =
      referralData.signupLink ||
      `https://lendgrid.in/signup?ref=${encodeURIComponent(referralData.referralCode)}&source=oms`;
    const message = `Hi! I'd like to onboard you as a Channel Partner on LendGrid.\n\nSign up using my referral link:\n${link}\n\nReferral Code: ${referralData.referralCode}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  // Start loan application for partner
  const handleStartApplication = (partner: OmsPartnerItem) => {
    const params = new URLSearchParams({
      aggregatorProfileId: partner._id,
      companyId: String(partner.companyId || ""),
      partnerName: partner.companyName || "",
    });
    router.push(`/aggregator/applications/new?${params.toString()}`);
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" />
            <span>Your Partners</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage your onboarded channel partners, submit loan applications on their behalf, and track progress.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchReferral();
              refetchPartners();
            }}
            disabled={isPartnersRefetching}
            className="text-xs font-semibold gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPartnersRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => setIsAddPartnerOpen(true)}
            className="text-xs font-semibold gap-1.5 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add Partner
          </Button>
        </div>
      </div>

      {/* ── Referral Code & Quick Stats Card ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Referral Box */}
        <Card className="lg:col-span-2 relative overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-lg">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg">Your OMS Referral Code</CardTitle>
                  <CardDescription className="text-xs">
                    Share this code or link with potential channel partners to onboard them directly.
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div
                onClick={handleCopyCode}
                className="flex-1 flex items-center justify-between px-4 py-3 rounded-xl bg-background/80 dark:bg-background/40 border border-primary/30 hover:border-primary transition-all cursor-pointer group shadow-inner"
              >
                <div className="font-mono text-xl sm:text-2xl font-black tracking-widest text-primary">
                  {isReferralLoading ? "Loading..." : referralData?.referralCode || "—"}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-500">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleShareWhatsApp}
                  className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  WhatsApp
                </Button>

                <Button
                  onClick={() => setIsAddPartnerOpen(true)}
                  className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Partner Now
                </Button>
              </div>
            </div>

            {referralData?.signupLink && (
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                <span className="font-semibold text-foreground">Direct Link:</span>
                <span className="truncate underline font-mono text-[11px] opacity-80">
                  {referralData.signupLink}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aggregate Stats Mini-Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-3">
          <Card className="border-border/60 bg-card/60 shadow-sm flex flex-col justify-center p-4">
            <span className="text-xs text-muted-foreground font-medium">Partners Onboarded</span>
            <div className="text-2xl font-black text-foreground mt-1 flex items-center justify-between">
              <span>{totalCount}</span>
              <Users className="w-5 h-5 text-primary opacity-60" />
            </div>
          </Card>

          <Card className="border-border/60 bg-card/60 shadow-sm flex flex-col justify-center p-4">
            <span className="text-xs text-muted-foreground font-medium">Applications Submitted</span>
            <div className="text-2xl font-black text-indigo-500 mt-1 flex items-center justify-between">
              <span>{stats.totalApps}</span>
              <FileText className="w-5 h-5 text-indigo-500 opacity-60" />
            </div>
          </Card>

          <Card className="col-span-2 sm:col-span-1 lg:col-span-1 border-border/60 bg-card/60 shadow-sm flex flex-col justify-center p-4">
            <span className="text-xs text-muted-foreground font-medium">Disbursed Volume</span>
            <div className="text-2xl font-black text-emerald-500 mt-1 flex items-center justify-between">
              <span>{formatCurrency(stats.totalDisbursed)}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                {stats.totalApproved} approved
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Partners List Section ── */}
      <Card className="border-border/60 bg-card shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <span>Channel Partners</span>
                <Badge variant="secondary" className="font-semibold text-xs">
                  {filteredPartners.length} of {totalCount}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Click &quot;Submit Application&quot; to apply on behalf of a partner, or &quot;Track & Details&quot; to see applications and tickets.
              </CardDescription>
            </div>

            {/* Search and KYC Status Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search partner or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-xs bg-background/50 border-border"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {["all", "approved", "pending", "under_review", "rejected"].map((st) => (
                  <Button
                    key={st}
                    variant={kycFilter === st ? "default" : "outline"}
                    size="sm"
                    onClick={() => setKycFilter(st)}
                    className="h-8 px-2.5 text-[11px] font-semibold capitalize whitespace-nowrap"
                  >
                    {st.replace("_", " ")}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isPartnersLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-muted-foreground font-medium">Loading your channel partners...</p>
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-muted/80 flex items-center justify-center mx-auto text-muted-foreground">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-foreground">No Channel Partners Found</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {searchTerm || kycFilter !== "all"
                  ? "No partners matched your filter criteria. Try clearing search filters."
                  : "You haven't onboarded any channel partners yet. Share your referral code or click Add Partner to onboard your first partner."}
              </p>
              <Button
                size="sm"
                onClick={() => setIsAddPartnerOpen(true)}
                className="mt-2 text-xs font-semibold gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add Your First Partner
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPartners.map((partner) => {
                const kyc =
                  KYC_CONFIG[partner.kycStatus?.toLowerCase() || "pending"] ||
                  KYC_CONFIG.pending;
                const KycIcon = kyc.icon;
                const initial = (partner.companyName || "?").charAt(0).toUpperCase();

                return (
                  <div
                    key={partner._id}
                    className="p-5 rounded-2xl border border-border/70 bg-card/80 hover:bg-card hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
                  >
                    {/* Top Row: Avatar + Name + KYC Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="w-11 h-11 rounded-xl border border-primary/20 bg-primary/10 text-primary font-black text-lg flex items-center justify-center shadow-sm">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {initial}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <h4
                            onClick={() => setSelectedPartner(partner)}
                            className="font-bold text-sm sm:text-base text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                            title={partner.companyName}
                          >
                            {partner.companyName}
                          </h4>
                          {partner.companyId ? (
                            <p className="text-xs text-muted-foreground font-mono">
                              ID: {partner.companyId}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div
                        className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${kyc.bg} ${kyc.color} ${kyc.border} shrink-0`}
                      >
                        <KycIcon className="w-3.5 h-3.5" />
                        <span>{kyc.label}</span>
                      </div>
                    </div>

                    {/* Live Partner Stats Strip */}
                    <PartnerCardStats partner={partner} />

                    {/* Joined date and Action Buttons */}
                    <div className="space-y-2.5 pt-1">
                      <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                        <span>Joined: {formatDate(partner.createdAt)}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleStartApplication(partner)}
                          className="w-full text-xs font-semibold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Apply Now
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedPartner(partner)}
                          className="w-full text-xs font-semibold gap-1 border-border/80 hover:bg-accent"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Track Apps
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Partner Details & Tracking Dialog ── */}
      {selectedPartner && (
        <PartnerTrackingDialog
          partner={selectedPartner}
          open={!!selectedPartner}
          onOpenChange={(open) => !open && setSelectedPartner(null)}
          onStartApplication={() => {
            const partner = selectedPartner;
            setSelectedPartner(null);
            handleStartApplication(partner);
          }}
        />
      )}

      {/* ── Add Partner Dialog ── */}
      <AddPartnerDialog
        open={isAddPartnerOpen}
        onOpenChange={setIsAddPartnerOpen}
        referralCode={referralData?.referralCode || ""}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.omsReferrals.partners() });
          refetchPartners();
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Partner Tracking & Detail Dialog Component
// ─────────────────────────────────────────────────────────────────────────────
function PartnerTrackingDialog({
  partner,
  open,
  onOpenChange,
  onStartApplication,
}: {
  partner: OmsPartnerItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartApplication: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"applications" | "tickets">("applications");
  const [selectedAppForView, setSelectedAppForView] = useState<any | null>(null);
  const [cloneTarget, setCloneTarget] = useState<any | null>(null);
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false);

  // Fetch loan applications from f2fintech-admin-server using partner companyId
  const {
    data: restAppsData,
    isLoading: isAppsLoading,
    refetch: refetchApps,
  } = useApplicationsRest({
    companyIdOverride: partner.companyId ? String(partner.companyId) : undefined,
    enabled: open && !!partner.companyId,
    limit: 50,
  });

  const handleOpenClone = (app: any) => {
    setCloneTarget({
      ...app,
      companyId: app.companyId || partner.companyId,
      companyName: app.companyName || partner.companyName,
      partnerName: app.companyName || partner.companyName,
      aggregatorProfileId: partner._id,
      partnerId: partner._id,
    });
    setIsCloneDialogOpen(true);
  };

  // REST API tickets for this partner's companyId
  const { data: ticketsData, isLoading: isTicketsLoading } = useSWR<{
    statusCode: number;
    message: string;
    data: { results: any[]; count: number };
  }>(
    open && activeTab === "tickets" && partner.companyId
      ? `/get-all-tickets?companyId=${partner.companyId}&page=1&limit=50`
      : null,
    (url: string) => apiFetch<any>(url)
  );

  const applications = restAppsData?.results ?? [];
  const tickets = ticketsData?.data?.results ?? [];
  const totalAppsCount = restAppsData?.count ?? applications.length;

  const kyc =
    KYC_CONFIG[partner.kycStatus?.toLowerCase() || "pending"] || KYC_CONFIG.pending;
  const KycIcon = kyc.icon;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border text-foreground p-0 rounded-2xl shadow-2xl">
          <DialogTitle className="sr-only">{partner.companyName} Tracking</DialogTitle>
          <DialogDescription className="sr-only">
            View applications and tickets submitted under this channel partner
          </DialogDescription>

          {/* Header Banner */}
          <div className="p-6 bg-gradient-to-r from-primary/10 via-indigo-500/10 to-transparent border-b border-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground font-black text-xl flex items-center justify-center shadow-md">
                  {(partner.companyName || "?").charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-foreground flex items-center gap-2">
                    <span>{partner.companyName}</span>
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    {partner.companyId && <span className="font-mono">Company ID: #{partner.companyId}</span>}
                    <span>•</span>
                    <span>Joined {formatDate(partner.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div
                  className={`flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full border ${kyc.bg} ${kyc.color} ${kyc.border}`}
                >
                  <KycIcon className="w-3.5 h-3.5" />
                  <span>{kyc.label}</span>
                </div>

                <Button
                  onClick={onStartApplication}
                  size="sm"
                  className="text-xs font-semibold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  Submit Application
                </Button>
              </div>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-6">
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-4">
              <TabsList className="bg-muted/60 p-1 rounded-xl">
                <TabsTrigger value="applications" className="text-xs font-semibold gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Applications ({totalAppsCount})
                </TabsTrigger>
                <TabsTrigger value="tickets" className="text-xs font-semibold gap-1.5">
                  <Ticket className="w-3.5 h-3.5" />
                  Tickets ({ticketsData?.data?.count ?? tickets.length})
                </TabsTrigger>
              </TabsList>

              {/* Applications Tab */}
              <TabsContent value="applications" className="space-y-4 mt-2">
                {isAppsLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs">Loading applications...</span>
                  </div>
                ) : applications.length === 0 ? (
                  <div className="py-12 text-center space-y-3 border border-dashed border-border/80 rounded-2xl">
                    <FileText className="w-10 h-10 mx-auto text-muted-foreground opacity-50" />
                    <div className="text-sm font-bold text-foreground">No Applications Yet</div>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      No loan applications have been submitted for this channel partner yet.
                    </p>
                    <Button
                      onClick={onStartApplication}
                      size="sm"
                      className="text-xs font-semibold gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      Submit First Application
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow>
                          <TableHead className="text-xs font-bold">Applicant</TableHead>
                          <TableHead className="text-xs font-bold">App ID</TableHead>
                          <TableHead className="text-xs font-bold">Loan Type</TableHead>
                          <TableHead className="text-xs font-bold">Amount</TableHead>
                          <TableHead className="text-xs font-bold">Status</TableHead>
                          <TableHead className="text-xs font-bold">Date</TableHead>
                          <TableHead className="text-xs font-bold text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {applications.map((app: any, idx: number) => {
                          const applicantName = app.customerName || app.applicantName || "Unknown Applicant";
                          const appId = app.applicationNumber || app.applicationId || "—";
                          const loanType = app.loanType || "Personal/Business";
                          const amount = app.applicationAmount ? Number(app.applicationAmount) : (app.loanAmount || 0);
                          const status = app.loanStatus || app.status || "Submitted";
                          const date = app.applicationDate || app.createdAt;
                          const key = app.applicationId || app._id || idx;

                          return (
                            <TableRow key={key} className="hover:bg-muted/30">
                              <TableCell className="font-semibold text-xs text-foreground">
                                {applicantName}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-muted-foreground">
                                #{appId}
                              </TableCell>
                              <TableCell className="text-xs capitalize text-muted-foreground">
                                {loanType}
                              </TableCell>
                              <TableCell className="font-bold text-xs text-primary">
                                {formatCurrency(amount)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-bold capitalize bg-primary/10 text-primary border-primary/20"
                                >
                                  {status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {formatDate(date)}
                              </TableCell>
                              <TableCell className="text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        type="button"
                                        onClick={() => setSelectedAppForView(app)}
                                        className="p-1.5 rounded-lg text-primary hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer inline-flex items-center justify-center select-none"
                                        title="View Application Details"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>View Application Details</TooltipContent>
                                  </Tooltip>

                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenClone(app)}
                                        className="p-1.5 rounded-lg text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer inline-flex items-center justify-center select-none"
                                        title="Clone / Edit Application"
                                      >
                                        <Copy className="w-4 h-4" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Clone / Edit Application</TooltipContent>
                                  </Tooltip>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* Tickets Tab */}
              <TabsContent value="tickets" className="space-y-4 mt-2">
                {isTicketsLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs">Loading tickets...</span>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="py-12 text-center space-y-2 border border-dashed border-border/80 rounded-2xl">
                    <Ticket className="w-10 h-10 mx-auto text-muted-foreground opacity-50" />
                    <div className="text-sm font-bold text-foreground">No Tickets Found</div>
                    <p className="text-xs text-muted-foreground">
                      There are no support tickets created for this company yet.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow>
                          <TableHead className="text-xs font-bold">Ticket ID</TableHead>
                          <TableHead className="text-xs font-bold">Customer</TableHead>
                          <TableHead className="text-xs font-bold">Provider</TableHead>
                          <TableHead className="text-xs font-bold">Status</TableHead>
                          <TableHead className="text-xs font-bold">Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tickets.map((t: any) => (
                          <TableRow key={t.ticketId || t.id} className="hover:bg-muted/30">
                            <TableCell className="font-mono text-xs font-bold text-primary">
                              #{t.ticketId || t.id}
                            </TableCell>
                            <TableCell className="font-semibold text-xs text-foreground">
                              {t.customerName || "—"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {t.applicationProvider || "—"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="text-[10px] font-bold capitalize bg-amber-500/10 text-amber-500 border-amber-500/20"
                              >
                                {t.ticketStatus || "Pending"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatDate(t.created_at || t.createdAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── View Application Details Dialog ── */}
      <Dialog open={!!selectedAppForView} onOpenChange={(v) => !v && setSelectedAppForView(null)}>
        <DialogContent
          className="bg-background border border-border text-foreground max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl z-[70]"
          onInteractOutside={(e) => e.preventDefault()}
        >
          {selectedAppForView && (
            <>
              <DialogHeader className="border-b border-border/50 pb-4 flex justify-between items-center">
                <div>
                  <DialogTitle className="text-2xl font-bold text-foreground">
                    Application Details
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground text-sm">
                    Complete information about this loan application
                  </DialogDescription>
                </div>
                <button
                  className="p-2 rounded hover:bg-muted transition absolute right-6 top-6"
                  aria-label="Close"
                  onClick={() => setSelectedAppForView(null)}
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </DialogHeader>

              <div className="space-y-6 pt-4">
                {/* Status, App # and Clone/Edit Action */}
                <div className="flex gap-3 justify-between items-start flex-wrap">
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-primary/20 text-primary border border-primary/30 px-4 py-1.5 text-sm font-semibold">
                      #{selectedAppForView.applicationNumber || selectedAppForView.applicationId}
                    </Badge>
                    <Badge
                      className={`${STATUS_STYLE[pretty(selectedAppForView.loanStatus || selectedAppForView.status)] || "bg-muted text-foreground border-border"} border px-4 py-1.5 text-sm font-semibold capitalize`}
                    >
                      {pretty(selectedAppForView.loanStatus || selectedAppForView.status)}
                    </Badge>
                    {selectedAppForView.leadType && (
                      <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-4 py-1.5 text-sm font-semibold capitalize">
                        {selectedAppForView.leadType}
                      </Badge>
                    )}
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const appToClone = selectedAppForView;
                      setSelectedAppForView(null);
                      handleOpenClone(appToClone);
                    }}
                    className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 border border-amber-500/30 font-medium text-xs gap-1.5 rounded-lg shadow-sm"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Clone / Edit Application</span>
                  </Button>
                </div>

                {/* Customer Information Card */}
                <div className="bg-card/50 rounded-lg p-6 border border-border backdrop-blur-sm">
                  <h3 className="text-lg font-semibold mb-4 text-primary flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500/10 p-2 rounded-lg mt-1">
                        <User className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Full Name</p>
                        <p className="text-foreground font-semibold">
                          {selectedAppForView.customerName || selectedAppForView.applicantName || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-green-500/10 p-2 rounded-lg mt-1">
                        <Mail className="w-4 h-4 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Email Address</p>
                        <p className="text-foreground font-semibold break-all">
                          {selectedAppForView.customerEmail || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-purple-500/10 p-2 rounded-lg mt-1">
                        <Phone className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Contact Number</p>
                        <p className="text-foreground font-semibold">
                          {selectedAppForView.customerContact || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-amber-500/10 p-2 rounded-lg mt-1">
                        <CreditCard className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">PAN Number</p>
                        <p className="text-foreground font-semibold font-mono">
                          {selectedAppForView.customerPAN || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-cyan-500/10 p-2 rounded-lg mt-1">
                        <Briefcase className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Designation</p>
                        <p className="text-foreground font-semibold capitalize">
                          {selectedAppForView.customerDesignation || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-orange-500/10 p-2 rounded-lg mt-1">
                        <MapPin className="w-4 h-4 text-orange-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Location</p>
                        <p className="text-foreground font-semibold capitalize">
                          {selectedAppForView.customerLocation || "—"}
                          {selectedAppForView.customerState ? `, ${selectedAppForView.customerState}` : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Loan Details Card */}
                <div className="bg-card/50 rounded-lg p-6 border border-border backdrop-blur-sm">
                  <h3 className="text-lg font-semibold mb-4 text-green-400 flex items-center gap-2">
                    <IndianRupee className="w-5 h-5" />
                    Loan Details
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-muted/50 rounded-lg p-4 border border-border">
                      <p className="text-xs text-muted-foreground mb-2">Loan Amount</p>
                      <p className="text-xl font-bold text-primary">
                        {formatCurrency(selectedAppForView.applicationAmount || selectedAppForView.loanAmount)}
                      </p>
                    </div>

                    <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-2">Loan Type</p>
                      <p className="text-xl font-bold text-cyan-400 capitalize">
                        {pretty(selectedAppForView.loanType)}
                      </p>
                    </div>

                    <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-2">Loan Category</p>
                      <p className="text-xl font-bold text-purple-400 capitalize">
                        {selectedAppForView.loanCategory || "—"}
                      </p>
                    </div>

                    <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-2">Tenure</p>
                      <p className="text-xl font-bold text-amber-400">
                        {selectedAppForView.applicationTenure || "—"} Years
                      </p>
                    </div>

                    <div className="bg-background/50 rounded-lg p-4 border border-border/50 md:col-span-2">
                      <p className="text-xs text-muted-foreground mb-2">Provider / Lender</p>
                      <p className="text-xl font-bold text-emerald-400">
                        {selectedAppForView.applicationProvider || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Application Timeline Card */}
                <div className="bg-card/50 rounded-lg p-6 border border-border backdrop-blur-sm">
                  <h3 className="text-lg font-semibold mb-4 text-cyan-400 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Application Timeline
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 bg-muted/50 p-4 rounded-lg border border-border">
                      <Calendar className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Application Date</p>
                        <p className="text-foreground font-semibold text-sm">
                          {formatDate(selectedAppForView.applicationDate || selectedAppForView.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-background/50 p-4 rounded-lg border border-border/30">
                      <BadgeCheck className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="text-xs text-muted-foreground">Current Status</p>
                        <p className="text-foreground font-semibold text-sm capitalize">
                          {pretty(selectedAppForView.loanStatus || selectedAppForView.status)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Partner / Referral Information Card */}
                <div className="bg-card/50 rounded-lg p-6 border border-border backdrop-blur-sm">
                  <h3 className="text-lg font-semibold mb-4 text-purple-400 flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Channel Partner Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">Partner Name</p>
                      <p className="text-base font-bold text-foreground">{partner.companyName}</p>
                      {partner.companyId && (
                        <p className="text-xs font-mono text-muted-foreground">ID: #{partner.companyId}</p>
                      )}
                    </div>
                    <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">Referral Code</p>
                      {selectedAppForView.referralCode ? (
                        <p className="text-base font-bold font-mono text-purple-400">
                          {selectedAppForView.referralCode}
                        </p>
                      ) : (
                        <p className="text-muted-foreground text-xs italic">Default Partner Referral</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Clone / Edit Application Dialog ── */}
      <CloneApplicationDialog
        open={isCloneDialogOpen}
        onOpenChange={setIsCloneDialogOpen}
        application={cloneTarget}
        onSuccess={() => {
          refetchApps();
        }}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add Channel Partner Dialog Component
// ─────────────────────────────────────────────────────────────────────────────
function AddPartnerDialog({
  open,
  onOpenChange,
  referralCode,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralCode: string;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [isFreelance, setIsFreelance] = useState(false);

  const resetForm = () => {
    setFullName("");
    setCompanyName("");
    setEmail("");
    setContact("");
    setPassword("");
    setIsFreelance(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !contact || !password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!isFreelance && !companyName) {
      toast({
        title: "Validation Error",
        description: "Company name is required for firm/business partners.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const finalCompanyName = isFreelance ? fullName : companyName;

      const payload = {
        username: fullName,
        email: email.toLowerCase().trim(),
        contact: contact.trim(),
        password: password,
        role: "AGGREGATOR_ADMIN",
        companyName: finalCompanyName,
        aggregatorType: "CHANNEL_PARTNER",
        isOmsEnabled: true,
        hasRegisteredBusiness: !isFreelance,
        referralCode: referralCode || undefined,
      };

      const res = await usersApi.register(payload);
      const data = res?.createUser;

      if (!data?.success) {
        throw new Error(data?.message || "Failed to create channel partner");
      }

      // Create company in OMS REST API
      const companyId = data.companyId;
      if (companyId) {
        await companiesApi.create({
          name: finalCompanyName,
          email: email.toLowerCase().trim(),
          contactNumber: contact.trim(),
          companyId,
        });
      }

      toast({
        title: "Partner Added 🎉",
        description: `Successfully onboarded ${finalCompanyName} under your referral code.`,
      });

      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast({
        title: "Failed to Add Partner",
        description: err.message || "An error occurred while creating the partner.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border text-foreground p-6 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <span>Add Channel Partner</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Directly onboard a new partner under your OMS referral code ({referralCode || "Default"}).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          {/* Profile Type Toggle */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Partner Profile Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsFreelance(false)}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  !isFreelance
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Firm / Business
              </button>
              <button
                type="button"
                onClick={() => setIsFreelance(true)}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  isFreelance
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Freelancer
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Full Name *</Label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Partner's full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>

          {/* Company Name (only if firm/business) */}
          {!isFreelance && (
            <div className="space-y-1">
              <Label className="text-xs font-medium">Company Name *</Label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Registered company name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required={!isFreelance}
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </div>
          )}

          {/* Email Address */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Email Address *</Label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                placeholder="partner@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>

          {/* Contact Number */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Contact Phone Number *</Label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="10-digit mobile number"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Initial Password *</Label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="text-xs font-semibold gap-1.5 bg-primary text-primary-foreground"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Onboard Partner
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
