"use client";

import { useState, useEffect } from "react";
import { Loader2, User, Building, X, Search, Check, Sparkles, AlertCircle } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AggregatorProfile } from "@/lib";
import { useAssignAggregatorReferral, useAggregators } from "@/hooks/use-aggregators";
import { useAllOmsReferrals } from "@/hooks/use-oms-referrals";

interface AssignReferralSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aggregator: AggregatorProfile | null;
  onSuccess?: () => void;
}

export function AssignReferralSourceDialog({
  open,
  onOpenChange,
  aggregator,
  onSuccess,
}: AssignReferralSourceDialogProps) {
  const [sourceType, setSourceType] = useState<"OMS" | "AGGREGATOR" | "DIRECT">("OMS");
  const [selectedOmsId, setSelectedOmsId] = useState<string>("");
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>("");
  const [omsSearch, setOmsSearch] = useState<string>("");
  const [partnerSearch, setPartnerSearch] = useState<string>("");

  const assignMutation = useAssignAggregatorReferral();

  // Load OMS referrals list
  const { data: omsData, isLoading: isOmsLoading } = useAllOmsReferrals({
    limit: 200,
    searchTerm: omsSearch,
  });

  // Load active channel partners list (for partner-to-partner sourcing)
  const { data: aggregatorsData, isLoading: isAggLoading } = useAggregators({
    limit: 100,
  });

  // Pre-fill existing sourcing state when aggregator changes
  useEffect(() => {
    if (aggregator) {
      if (aggregator.omsReferredBy) {
        setSourceType("OMS");
        setSelectedOmsId(aggregator.omsReferredBy);
        setSelectedPartnerId("");
      } else if (aggregator.referredByAggregatorId) {
        setSourceType("AGGREGATOR");
        setSelectedPartnerId(aggregator.referredByAggregatorId);
        setSelectedOmsId("");
      } else {
        setSourceType("DIRECT");
        setSelectedOmsId("");
        setSelectedPartnerId("");
      }
    }
  }, [aggregator, open]);

  const omsStaffList = omsData?.items || [];
  const candidatePartners = (aggregatorsData?.results || []).filter(
    (p) => p._id !== aggregator?._id
  );

  const filteredCandidatePartners = candidatePartners.filter((p) => {
    if (!partnerSearch.trim()) return true;
    const term = partnerSearch.toLowerCase();
    return (
      p.companyName?.toLowerCase().includes(term) ||
      p.user?.username?.toLowerCase().includes(term) ||
      p.referralCode?.toLowerCase().includes(term)
    );
  });

  const handleSave = async () => {
    if (!aggregator?._id) return;

    await assignMutation.mutateAsync({
      aggregatorProfileId: aggregator._id,
      sourceType,
      omsEmployeeId: sourceType === "OMS" ? selectedOmsId : undefined,
      referredByAggregatorId: sourceType === "AGGREGATOR" ? selectedPartnerId : undefined,
    });

    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border text-foreground p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="border-b border-border/60 pb-3 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Sparkles className="w-5 h-5 text-primary" />
              Assign Referral Source
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Set or update who sourced <span className="font-semibold text-primary">{aggregator?.companyName || "this partner"}</span>
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Source Type Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Referral Source Type
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={sourceType === "OMS" ? "default" : "outline"}
                className={`h-11 flex flex-col items-center justify-center text-xs font-semibold rounded-xl transition-all ${
                  sourceType === "OMS"
                    ? "bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20"
                    : "hover:bg-muted"
                }`}
                onClick={() => setSourceType("OMS")}
              >
                <span>Sales / OMS Staff</span>
                <span className="text-[10px] font-normal opacity-80">Sales & F2 Team</span>
              </Button>

              <Button
                type="button"
                variant={sourceType === "AGGREGATOR" ? "default" : "outline"}
                className={`h-11 flex flex-col items-center justify-center text-xs font-semibold rounded-xl transition-all ${
                  sourceType === "AGGREGATOR"
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                    : "hover:bg-muted"
                }`}
                onClick={() => setSourceType("AGGREGATOR")}
              >
                <span>Channel Partner</span>
                <span className="text-[10px] font-normal opacity-80">Referrer DSA</span>
              </Button>

              <Button
                type="button"
                variant={sourceType === "DIRECT" ? "default" : "outline"}
                className={`h-11 flex flex-col items-center justify-center text-xs font-semibold rounded-xl transition-all ${
                  sourceType === "DIRECT"
                    ? "bg-secondary text-secondary-foreground shadow-sm"
                    : "hover:bg-muted"
                }`}
                onClick={() => setSourceType("DIRECT")}
              >
                <span>Direct</span>
                <span className="text-[10px] font-normal opacity-80">No Referrer</span>
              </Button>
            </div>
          </div>

          {/* SOURCING OPTION 1: OMS EMPLOYEE */}
          {sourceType === "OMS" && (
            <div className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">
                  Select Sales / OMS Team Member
                </Label>
                {selectedOmsId && (
                  <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px]">
                    Selected: {selectedOmsId}
                  </Badge>
                )}
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search by name, employee code or OMS code..."
                  value={omsSearch}
                  onChange={(e) => setOmsSearch(e.target.value)}
                  className="pl-9 h-10 text-xs bg-background border-border text-foreground rounded-lg"
                />
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {isOmsLoading ? (
                  <div className="py-6 flex items-center justify-center text-xs text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading OMS Staff...
                  </div>
                ) : omsStaffList.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No OMS staff found</p>
                ) : (
                  omsStaffList.map((emp) => {
                    const isSelected = selectedOmsId === emp.omsEmployeeId;
                    return (
                      <div
                        key={emp._id}
                        onClick={() => setSelectedOmsId(emp.omsEmployeeId)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all ${
                          isSelected
                            ? "bg-purple-500/15 border-purple-500 text-purple-400 font-medium"
                            : "bg-background border-border hover:bg-muted/60 text-foreground"
                        }`}
                      >
                        <div>
                          <p className="font-semibold">{emp.employeeName}</p>
                          <p className="text-[11px] text-muted-foreground">
                            Code: <span className="font-mono text-primary">{emp.referralCode}</span>
                            {emp.employeeCode ? ` • Emp #${emp.employeeCode}` : ""}
                            {emp.designation ? ` • ${emp.designation}` : ""}
                          </p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-purple-400" />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* SOURCING OPTION 2: CHANNEL PARTNER */}
          {sourceType === "AGGREGATOR" && (
            <div className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">
                  Select Referring Channel Partner
                </Label>
                {selectedPartnerId && (
                  <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px]">
                    Partner Selected
                  </Badge>
                )}
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search by company name, owner or AG code..."
                  value={partnerSearch}
                  onChange={(e) => setPartnerSearch(e.target.value)}
                  className="pl-9 h-10 text-xs bg-background border-border text-foreground rounded-lg"
                />
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {isAggLoading ? (
                  <div className="py-6 flex items-center justify-center text-xs text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading Channel Partners...
                  </div>
                ) : filteredCandidatePartners.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No other channel partners found</p>
                ) : (
                  filteredCandidatePartners.map((partner) => {
                    const isSelected = selectedPartnerId === partner._id;
                    return (
                      <div
                        key={partner._id}
                        onClick={() => setSelectedPartnerId(partner._id)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all ${
                          isSelected
                            ? "bg-blue-500/15 border-blue-500 text-blue-400 font-medium"
                            : "bg-background border-border hover:bg-muted/60 text-foreground"
                        }`}
                      >
                        <div>
                          <p className="font-semibold">{partner.companyName}</p>
                          <p className="text-[11px] text-muted-foreground">
                            Code: <span className="font-mono text-primary">{partner.referralCode || "N/A"}</span>
                            {partner.user?.username ? ` • Owner: ${partner.user.username}` : ""}
                          </p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* SOURCING OPTION 3: DIRECT */}
          {sourceType === "DIRECT" && (
            <div className="bg-muted/30 p-4 rounded-xl border border-border text-xs text-muted-foreground flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <p>
                This Channel Partner will be marked as a <span className="font-semibold text-foreground">Direct Signup</span>. No referral override commissions will be attached.
              </p>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-4">
          <Button
            type="button"
            variant="outline"
            className="text-xs h-9 px-4"
            onClick={() => onOpenChange(false)}
            disabled={assignMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold h-9 px-5 shadow-sm"
            onClick={handleSave}
            disabled={
              assignMutation.isPending ||
              (sourceType === "OMS" && !selectedOmsId) ||
              (sourceType === "AGGREGATOR" && !selectedPartnerId)
            }
          >
            {assignMutation.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Saving...
              </>
            ) : (
              "Save Referral Source"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
