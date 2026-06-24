"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Calendar,
  X,
  FileText
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { TablePagination } from "@/components/ui/pagination";
import { TableSkeleton } from "@/components/ui/loading-skeleton";
import { useDeletionRequests, useProcessDeletionRequest } from "@/hooks/use-users";

export function DeletionRequestsTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { toast } = useToast();

  const { data, isLoading, isError, error, refetch } = useDeletionRequests({
    page,
    limit: pageSize
  });

  const { mutateAsync: processRequest, isPending: isProcessing } = useProcessDeletionRequest();

  // Confirmation dialog states
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [confirmAction, setConfirmAction] = useState<"APPROVE" | "REJECT" | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Full reason text dialog states
  const [selectedReasonText, setSelectedReasonText] = useState<string>("");
  const [isReasonOpen, setIsReasonOpen] = useState(false);

  const requests = data?.results || [];
  const total = data?.count || 0;

  // Filter requests locally by search term
  const filteredRequests = requests.filter((req: any) =>
    req.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (req.reason && req.reason.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
      case "APPROVED":
        return "bg-green-500/20 text-green-400 border border-green-500/30";
      case "REJECTED":
        return "bg-red-500/20 text-red-400 border border-red-500/30";
      default:
        return "bg-muted/20 text-muted-foreground";
    }
  };

  const handleActionClick = (request: any, action: "APPROVE" | "REJECT") => {
    setSelectedRequest(request);
    setConfirmAction(action);
    setIsConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!selectedRequest || !confirmAction) return;

    try {
      const response = await processRequest({
        id: selectedRequest._id,
        action: confirmAction
      });

      if (response?.processDeletionRequest?.success) {
        setIsConfirmOpen(false);
        setSelectedRequest(null);
        setConfirmAction(null);
        refetch();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4 animate-bounce" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Error Loading Deletion Requests
          </h3>
          <p className="text-muted-foreground">{error?.message || "Please try again later"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="bg-card border-border shadow-xl">
          <CardHeader>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-400" />
                  Account Deletion Requests
                </CardTitle>
                <CardDescription className="text-muted-foreground mt-1">
                  Manage and process requests from users seeking to delete their account.
                </CardDescription>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by email, username or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background border-border text-foreground w-full"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto pb-4">
              {isLoading ? (
                <TableSkeleton columns={6} rows={pageSize} />
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-12 bg-card/20 rounded-lg border border-dashed border-border">
                  <FileText className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    No Deletion Requests Found
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    There are no account deletion requests matching your query.
                  </p>
                </div>
              ) : (
                <div className="min-w-[900px]">
                  <div className="grid grid-cols-12 gap-2 py-4 px-4 bg-muted/50 rounded-t-lg font-semibold text-muted-foreground text-sm border-b border-border">
                    <div className="col-span-2">Email</div>
                    <div className="col-span-2">Username</div>
                    <div className="col-span-3">Reason</div>
                    <div className="col-span-2">Date Submitted</div>
                    <div className="col-span-1 text-center">Eligible</div>
                    <div className="col-span-1 text-center">Status</div>
                    <div className="col-span-1 text-center">Actions</div>
                  </div>
                  <div className="space-y-1">
                    {filteredRequests.map((request: any, index: number) => (
                      <motion.div
                        key={request._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.04 }}
                        className="grid grid-cols-12 gap-2 py-4 px-4 bg-card/30 hover:bg-card/60 rounded border-b border-border/50 items-center transition-colors"
                      >
                        <div className="col-span-2 font-medium text-foreground truncate" title={request.email}>
                          {request.email}
                        </div>
                        <div className="col-span-2 text-foreground font-medium truncate" title={request.username || "N/A"}>
                          {request.username || <span className="text-muted-foreground/60 italic">-</span>}
                        </div>
                        <div className="col-span-3 text-muted-foreground text-sm pr-2 min-w-0" title={request.reason || "No reason provided"}>
                          {request.reason ? (
                            request.reason.length > 35 ? (
                              <div className="flex items-center gap-1.5 w-full justify-between">
                                <span className="truncate flex-1">{request.reason}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedReasonText(request.reason);
                                    setIsReasonOpen(true);
                                  }}
                                  className="text-[11px] text-primary hover:underline hover:text-primary/80 font-semibold flex-shrink-0 bg-primary/10 px-1.5 py-0.5 rounded transition-colors"
                                >
                                  See More
                                </button>
                              </div>
                            ) : (
                              <span className="truncate">{request.reason}</span>
                            )
                          ) : (
                            <span className="italic text-muted-foreground/50">No reason provided</span>
                          )}
                        </div>
                        <div className="col-span-2 text-muted-foreground text-sm flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 opacity-60" />
                          {request.createdAt ? new Date(request.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          }) : "-"}
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <Badge className={request.eligible === "yes" ? "bg-green-500/20 text-green-400 border border-green-500/30 font-semibold text-[10px] px-2 py-0.5 rounded-full capitalize" : "bg-red-500/20 text-red-400 border border-red-500/30 font-semibold text-[10px] px-2 py-0.5 rounded-full capitalize"}>
                            {request.eligible || "yes"}
                          </Badge>
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <Badge className={`${getStatusColor(request.status)} font-semibold text-[10px] px-2 py-0.5 rounded-full capitalize`}>
                            {request.status.toLowerCase()}
                          </Badge>
                        </div>
                        <div className="col-span-1">
                          <div className="flex items-center justify-center gap-2">
                            {request.status === "PENDING" ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-full"
                                  onClick={() => handleActionClick(request, "APPROVE")}
                                  title="Approve Request"
                                >
                                  <CheckCircle className="w-5 h-5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full"
                                  onClick={() => handleActionClick(request, "REJECT")}
                                  title="Reject Request"
                                >
                                  <XCircle className="w-5 h-5" />
                                </Button>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground/60 italic">-</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {!isLoading && total > pageSize && (
              <TablePagination
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={(newPage) => setPage(newPage)}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setPage(1);
                }}
                className="mt-4"
              />
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="bg-background border border-border text-foreground shadow-2xl rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {confirmAction === "APPROVE" ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  Approve Account Deletion
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-400" />
                  Reject Deletion Request
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {confirmAction === "APPROVE" ? (
                <>
                  Are you sure you want to approve the deletion request for{" "}
                  <strong className="text-foreground">{selectedRequest?.email}</strong>?
                  {selectedRequest?.eligible === "no" && (
                    <span className="block mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs leading-relaxed">
                      ⚠️ User has pending applications or active tickets that are not yet Disbursed or Rejected. Account deletion cannot be approved. Please wait 15 to 30 days for these files to be processed and finalized.
                    </span>
                  )}
                  <br className="my-2" />
                  This will <strong className="text-red-400">soft delete & scrub</strong> the user's account, setting their status to{" "}
                  <span className="font-semibold text-foreground">INACTIVE</span>.
                </>
              ) : (
                <>
                  Are you sure you want to reject the deletion request for{" "}
                  <strong className="text-foreground">{selectedRequest?.email}</strong>?
                  <br />
                  The user's account status will remain unchanged, and the request status will be marked as{" "}
                  <span className="font-semibold text-foreground">REJECTED</span>.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline" className="border-border text-foreground hover:bg-muted" disabled={isProcessing}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              className={confirmAction === "APPROVE" ? "bg-green-500 hover:bg-green-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"}
              onClick={handleConfirmSubmit}
              disabled={isProcessing || (confirmAction === "APPROVE" && selectedRequest?.eligible === "no")}
            >
              {isProcessing ? "Processing..." : confirmAction === "APPROVE" ? "Approve & Delete" : "Reject Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full Reason Dialog */}
      <Dialog open={isReasonOpen} onOpenChange={setIsReasonOpen}>
        <DialogContent className="bg-background border border-border text-foreground shadow-2xl rounded-2xl max-w-lg md:max-w-xl w-full">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              Full Deletion Reason
            </DialogTitle>
            <DialogDescription className="sr-only">
              This dialog shows the full account deletion request reason.
            </DialogDescription>
          </DialogHeader>
          <div className="text-foreground mt-2 text-sm leading-relaxed max-h-[50vh] overflow-y-auto bg-muted/40 p-5 rounded-xl border border-border/50 break-all break-words whitespace-pre-wrap">
            {selectedReasonText}
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white px-6">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
