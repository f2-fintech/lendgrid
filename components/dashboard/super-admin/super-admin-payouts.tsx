"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, Search, Eye, Clock, Upload, AlertCircle, DollarSign, FileCheck, ChevronDown, CheckCircle, XCircle, Ban,
  AlertTriangle, Loader2, X, ImageIcon, User, Calendar, TrendingUp
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CardSkeleton, TableSkeleton } from '@/components/ui/loading-skeleton'
import { TablePagination } from '@/components/ui/pagination'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

import { useCommissionTransactions, useUpdateCommissionStatus } from '@/hooks/use-commissions'
import { useToast } from '@/hooks/use-toast'
import { uploadToS3 } from '@/lib/utils'

export function SuperAdminPayouts() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedPayout, setSelectedPayout] = useState<any>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)

  // Status update form state
  const [newStatus, setNewStatus] = useState('')
  const [utrNumber, setUtrNumber] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null)
  const [uploadedPaymentProofUrl, setUploadedPaymentProofUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isUploadingFile, setIsUploadingFile] = useState(false)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const tableTopRef = useRef<HTMLDivElement | null>(null)
  const { toast } = useToast()

  // Fetch commission transactions
  const { data: transactionsData, isLoading } = useCommissionTransactions({
    page,
    limit: pageSize,
    filters: {
      status: filterStatus && filterStatus !== 'all' ? filterStatus : undefined,
      productType: searchTerm || undefined,
    },
  })

  // Update commission status mutation
  const updateStatusMutation = useUpdateCommissionStatus()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; icon: any; bgColor: string }> = {
      'PAID': {
        color: 'text-green-400',
        icon: CheckCircle,
        bgColor: 'bg-green-500/20 hover:bg-green-500/30 border-green-500/30'
      },
      'APPROVED': {
        color: 'text-foreground',
        icon: CheckCircle,
        bgColor: 'bg-primary/20 hover:bg-primary/30 border-primary/30'
      },
      'CALCULATED': {
        color: 'text-cyan-400',
        icon: FileCheck,
        bgColor: 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/30'
      },
      'REJECTED': {
        color: 'text-red-400',
        icon: XCircle,
        bgColor: 'bg-red-500/20 hover:bg-red-500/30 border-red-500/30'
      },
      'CANCELLED': {
        color: 'text-muted-foreground',
        icon: Ban,
        bgColor: 'bg-gray-500/20 hover:bg-gray-500/30 border-gray-500/30'
      },
      'DISPUTED': {
        color: 'text-yellow-400',
        icon: AlertTriangle,
        bgColor: 'bg-yellow-500/20 hover:bg-yellow-500/30 border-yellow-500/30'
      },
    }
    return configs[status] || { color: 'text-muted-foreground', icon: FileText, bgColor: 'bg-gray-500/20' }
  }

  const getAvailableStatuses = (currentStatus: string, allowAllForAdmin: boolean = true) => {
    // For admins, show all statuses except current one
    if (allowAllForAdmin) {
      const allStatuses = ['CALCULATED', 'APPROVED', 'PAID', 'REJECTED', 'CANCELLED', 'DISPUTED']
      return allStatuses.filter(status => status !== currentStatus)
    }

    // Standard workflow transitions
    const transitions: Record<string, string[]> = {
      'CALCULATED': ['APPROVED', 'REJECTED', 'CANCELLED', 'DISPUTED'],
      'APPROVED': ['PAID', 'CANCELLED', 'DISPUTED'],
      'PAID': ['DISPUTED'],
      'REJECTED': ['CALCULATED'],
      'CANCELLED': [],
      'DISPUTED': ['APPROVED', 'REJECTED'],
    }
    return transitions[currentStatus] || []
  }

  const handleStatusClick = (payout: any) => {
    setSelectedPayout(payout)
    setNewStatus('')
    setUtrNumber(payout.utrNumber || '')
    setAdminNotes('')
    setPaymentProofPreview(payout.paymentProofUrl || null)
    setUploadedPaymentProofUrl(payout.paymentProofUrl || null)
    setIsStatusDialogOpen(true)
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'File size exceeds 5MB limit',
          variant: 'destructive',
        })
        return
      }

      // Show preview immediately
      const reader = new FileReader()
      reader.onloadend = () => {
        setPaymentProofPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to S3 immediately
      try {
        setIsUploadingFile(true)
        const uploadedUrl = await uploadToS3(file, 'commission-payments')
        setUploadedPaymentProofUrl(uploadedUrl)
        toast({
          title: 'Success',
          description: 'Payment proof uploaded successfully',
        })
      } catch (error) {
        console.error('Error uploading file:', error)
        setPaymentProofPreview(null)
        toast({
          title: 'Error',
          description: 'Failed to upload payment proof',
          variant: 'destructive',
        })
      } finally {
        setIsUploadingFile(false)
      }
    }
  }

  const handleRemoveFile = () => {
    setPaymentProofPreview(selectedPayout?.paymentProofUrl || null)
    setUploadedPaymentProofUrl(selectedPayout?.paymentProofUrl || null)
  }


  const handleUpdateStatus = async () => {
    if (!selectedPayout || !newStatus) {
      toast({
        title: 'Error',
        description: 'Please select a status',
        variant: 'destructive',
      })
      return
    }

    // Validate PAID status requirements
    if (newStatus === 'PAID') {
      if (!utrNumber) {
        toast({
          title: 'Error',
          description: 'UTR number is required for PAID status',
          variant: 'destructive',
        })
        return
      }
      if (!uploadedPaymentProofUrl) {
        toast({
          title: 'Error',
          description: 'Payment proof is required for PAID status',
          variant: 'destructive',
        })
        return
      }
    }

    try {
      setIsUploading(true)

      // Update commission status with the already-uploaded URL
      await updateStatusMutation.mutateAsync({
        id: selectedPayout.id,
        input: {
          status: newStatus,
          utrNumber: utrNumber || undefined,
          paymentProofUrl: uploadedPaymentProofUrl || undefined,
          adminNotes: adminNotes || undefined,
        },
      })

      setIsStatusDialogOpen(false)
      setSelectedPayout(null)
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const filteredPayouts = useMemo(() => {
    if (!transactionsData?.data) return []

    return transactionsData.data.filter((payout) => {
      const matchesSearch =
        payout.ticketId?.toString().includes(searchTerm) ||
        payout.id.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = !filterStatus || filterStatus === 'all' || payout.status === filterStatus

      return matchesSearch && matchesStatus
    })
  }, [transactionsData, searchTerm, filterStatus])

  const total = transactionsData?.total || 0
  const paginated = filteredPayouts

  const handlePageChange = async (newPage: number) => {
    setPage(newPage)
    tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const handlePageSizeChange = async (size: number) => {
    setPageSize(size)
    setPage(1)
    tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!transactionsData?.data) {
      return {
        totalPayouts: 0,
        pendingPayouts: 0,
        completedPayouts: 0,
        totalAmount: 0
      }
    }

    return {
      totalPayouts: transactionsData.total,
      pendingPayouts: transactionsData.data.filter(t =>
        ['PENDING', 'CALCULATED', 'APPROVED'].includes(t.status)
      ).length,
      completedPayouts: transactionsData.data.filter(t => t.status === 'PAID').length,
      totalAmount: transactionsData.data.reduce((sum, t) => sum + t.commissionAmount, 0)
    }
  }, [transactionsData])

  const MetricCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`professional-card hover-lift ${color}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold text-foreground mt-2">{value}</p>
              {subtitle && (<p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Commission Payouts</h1>
          <p className="text-muted-foreground mt-1">Manage commission payouts to aggregators</p>
        </div>
      </motion.div>

      {/* Metrics Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardSkeleton headerLines={2} bodyHeight={20} />
          <CardSkeleton headerLines={2} bodyHeight={20} />
          <CardSkeleton headerLines={2} bodyHeight={20} />
          <CardSkeleton headerLines={2} bodyHeight={20} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Payouts"
            value={metrics.totalPayouts}
            icon={FileText}
            color="bg-primary/20 text-primary"
            subtitle="All time"
          />
          <MetricCard
            title="Pending Payouts"
            value={metrics.pendingPayouts}
            icon={Clock}
            color="bg-orange-500/20 text-orange-400"
            subtitle="Awaiting processing"
          />
          <MetricCard
            title="Completed Payouts"
            value={metrics.completedPayouts}
            icon={FileCheck}
            color="metric-card-success"
            subtitle="Successfully processed"
          />
          <MetricCard
            title="Total Amount"
            value={formatCurrency(metrics.totalAmount)}
            icon={DollarSign}
            color="bg-accent/20 text-accent"
            subtitle="Total commission"
          />
        </div>
      )}

      {/* Payouts Table */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">All Commission Transactions</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Track and manage commission transactions
                </CardDescription>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by ticket ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-background border-border text-foreground w-64"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40 bg-background border-border text-foreground">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="CALCULATED">Calculated</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="DISPUTED">Disputed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={tableTopRef} />
            <div className="overflow-x-auto professional-table">
              {isLoading ? (
                <TableSkeleton columns={7} rows={pageSize} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket ID</TableHead>
                      <TableHead>Product Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Cashback</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>UTR / Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((payout, index) => {
                      const statusConfig = getStatusConfig(payout.status)
                      const StatusIcon = statusConfig.icon

                      return (
                        <motion.tr
                          key={payout.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="border-border hover:bg-card/50"
                        >
                          <TableCell>
                            <p className="text-foreground font-medium">#{payout.ticketId}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-foreground">{payout.productType}</p>
                          </TableCell>
                          <TableCell>
                            {formatCurrency(payout.disbursedAmount)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(payout.cashbackAmount)}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(payout.commissionAmount)}
                          </TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger>
                                <button
                                  onClick={() => handleStatusClick(payout)}
                                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${statusConfig.bgColor} ${statusConfig.color} cursor-pointer`}
                                >
                                  <StatusIcon className="w-4 h-4" />
                                  {payout.status}
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Click To Change Status</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            {payout.status === 'PAID' && payout.utrNumber ? (
                              <div className="flex flex-col">
                                <p className="text-foreground font-mono text-sm">{payout.utrNumber.toUpperCase()}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(payout.paidAt || payout.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            ) : (
                              <p className="text-muted-foreground text-sm">
                                {new Date(payout.createdAt).toLocaleDateString()}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedPayout(payout)
                                  setIsViewDialogOpen(true)
                                }}
                                className="text-primary hover:text-foreground hover:bg-muted"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {payout.status === 'PAID' && payout.paymentProofUrl && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(payout.paymentProofUrl, '_blank')}
                                  className="text-green-400 hover:text-foreground hover:bg-muted"
                                  title="View Payment Proof"
                                >
                                  <FileCheck className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </motion.tr>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </div>

            <TablePagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              className="mt-4"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* View Payout Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={(val) => {
        setIsViewDialogOpen(val)
      }}>
        <DialogContent
          className="bg-background border border-border text-foreground max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="border-b border-border/50 pb-4 flex justify-between items-center">
            <div>
              <DialogTitle className="text-2xl font-bold text-foreground">
                Commission Transaction Details
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm">
                Complete information about this commission payout
              </DialogDescription>
            </div>
            <button
              className="p-2 rounded hover:bg-muted transition absolute right-6 top-6"
              aria-label="Close"
              onClick={() => setIsViewDialogOpen(false)}
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </DialogHeader>

          {selectedPayout && (
            <div className="space-y-6 pt-4">

              {/* Status and ID Section */}
              <div className="flex gap-3 justify-between items-start">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    className={`${getStatusConfig(selectedPayout.status).bgColor} ${getStatusConfig(selectedPayout.status).color} border px-4 py-1.5 text-sm font-semibold`}
                  >
                    {selectedPayout.status}
                  </Badge>
                  <Badge className="bg-primary/20 text-primary border border-primary/30 px-4 py-1.5 text-sm font-semibold">
                    Ticket #{selectedPayout.ticketId}
                  </Badge>
                </div>
              </div>

              {/* Transaction Information Card */}
              <div className="bg-card/50 rounded-lg p-6 border border-border backdrop-blur-sm">
                <h3 className="text-lg font-semibold mb-4 text-primary flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Transaction Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500/10 p-2 rounded-lg mt-1">
                      <FileText className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Product Type</p>
                      <p className="text-foreground font-semibold">{selectedPayout.productType}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-purple-500/10 p-2 rounded-lg mt-1">
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Aggregator Rank</p>
                      <p className="text-foreground font-semibold">{selectedPayout.aggregatorRank || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-green-500/10 p-2 rounded-lg mt-1">
                      <DollarSign className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Provider</p>
                      <p className="text-foreground font-semibold">{selectedPayout.provider || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-orange-500/10 p-2 rounded-lg mt-1">
                      <FileCheck className="w-4 h-4 text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Commission Type</p>
                      <p className="text-foreground font-semibold">{selectedPayout.commissionType}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Details Card */}
              <div className="bg-card/50 rounded-lg p-6 border border-border backdrop-blur-sm">
                <h3 className="text-lg font-semibold mb-4 text-green-400 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Financial Breakdown
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4 border border-border">
                    <p className="text-xs text-muted-foreground mb-2">Disbursed Amount</p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(selectedPayout.disbursedAmount)}</p>
                  </div>

                  <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                    <p className="text-xs text-muted-foreground mb-2">Cashback Amount</p>
                    <p className="text-xl font-bold text-cyan-400">{formatCurrency(selectedPayout.cashbackAmount)}</p>
                  </div>

                  <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                    <p className="text-xs text-muted-foreground mb-2">Gross Commission</p>
                    <p className="text-xl font-bold text-purple-400">{formatCurrency(selectedPayout.grossCommissionAmount)}</p>
                  </div>

                  <div className="bg-background/50 rounded-lg p-4 border border-border/50 md:col-span-2">
                    <p className="text-xs text-muted-foreground mb-2">Net Commission Amount</p>
                    <p className="text-2xl font-bold text-green-400">{formatCurrency(selectedPayout.commissionAmount)}</p>
                  </div>

                  <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                    <p className="text-xs text-muted-foreground mb-2">Commission Rate</p>
                    <p className="text-xl font-bold text-yellow-400">
                      {selectedPayout.commissionType === 'PERCENTAGE'
                        ? `${selectedPayout.commissionRate}%`
                        : formatCurrency(selectedPayout.commissionRate)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Details Card (if paid) */}
              {(selectedPayout.utrNumber || selectedPayout.paymentProofUrl || selectedPayout.paidBy || selectedPayout.paidAt) && (
                <div className="bg-card/50 rounded-lg p-6 border border-border backdrop-blur-sm">
                  <h3 className="text-lg font-semibold mb-4 text-emerald-400 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Payment Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedPayout.utrNumber && (
                      <div className="flex items-start gap-3">
                        <div className="bg-emerald-500/10 p-2 rounded-lg mt-1">
                          <FileCheck className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">UTR Number</p>
                          <p className="text-foreground font-semibold font-mono">{selectedPayout.utrNumber.toUpperCase()}</p>
                        </div>
                      </div>
                    )}

                    {selectedPayout.paidAt && (
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-500/10 p-2 rounded-lg mt-1">
                          <Calendar className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">Paid On</p>
                          <p className="text-foreground font-semibold">
                            {new Date(selectedPayout.paidAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedPayout.paidBy && (
                      <div className="flex items-start gap-3">
                        <div className="bg-purple-500/10 p-2 rounded-lg mt-1">
                          <User className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">Paid By</p>
                          <p className="text-foreground font-semibold">{selectedPayout.paidBy}</p>
                        </div>
                      </div>
                    )}

                    {selectedPayout.paymentProofUrl && (
                      <div className="flex items-start gap-3">
                        <div className="bg-cyan-500/10 p-2 rounded-lg mt-1">
                          <ImageIcon className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">Payment Proof</p>
                          <a
                            href={selectedPayout.paymentProofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-semibold inline-flex items-center gap-1"
                          >
                            View Document
                            <Eye className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timeline Card */}
              <div className="bg-card/50 rounded-lg p-6 border border-border backdrop-blur-sm">
                <h3 className="text-lg font-semibold mb-4 text-cyan-400 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Activity Timeline
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 bg-muted/50 p-4 rounded-lg border border-border">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Calculated At</p>
                      <p className="text-foreground font-semibold text-sm">
                        {selectedPayout.calculatedAt
                          ? new Date(selectedPayout.calculatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {selectedPayout.approvedAt && (
                    <div className="flex items-center gap-3 bg-background/50 p-4 rounded-lg border border-border/30">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="text-xs text-muted-foreground">Approved At</p>
                        <p className="text-foreground font-semibold text-sm">
                          {new Date(selectedPayout.approvedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 bg-background/50 p-4 rounded-lg border border-border/30">
                    <Clock className="w-5 h-5 text-orange-400" />
                    <div>
                      <p className="text-xs text-muted-foreground">Created At</p>
                      <p className="text-foreground font-semibold text-sm">
                        {new Date(selectedPayout.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Remarks/Notes Section */}
              {(selectedPayout.remarks || selectedPayout.adminNotes) && (
                <div className="bg-card/50 rounded-lg p-6 border border-border backdrop-blur-sm">
                  <h3 className="text-lg font-semibold mb-4 text-amber-400 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Notes & Remarks
                  </h3>
                  <div className="space-y-4">
                    {selectedPayout.remarks && (
                      <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                        <p className="text-xs text-muted-foreground mb-2">System Remarks</p>
                        <p className="text-foreground text-sm">{selectedPayout.remarks}</p>
                      </div>
                    )}
                    {selectedPayout.adminNotes && (
                      <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                        <p className="text-xs text-muted-foreground mb-2">Admin Notes</p>
                        <p className="text-foreground text-sm">{selectedPayout.adminNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="bg-background border-border text-foreground max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Update Commission Status</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Change the status and add payment details
            </DialogDescription>
          </DialogHeader>
          {selectedPayout && (
            <div className="space-y-3">
              <div className="bg-background p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Ticket ID</p>
                    <p className="text-foreground font-semibold text-sm">#{selectedPayout.ticketId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Current Status</p>
                    <Badge className={`${getStatusConfig(selectedPayout.status).bgColor} ${getStatusConfig(selectedPayout.status).color} text-xs`}>
                      {selectedPayout.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Commission</p>
                    <p className="text-foreground font-semibold text-sm">{formatCurrency(selectedPayout.commissionAmount)}</p>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-foreground text-sm">New Status *</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="bg-background border-border text-foreground mt-1 h-9">
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    {getAvailableStatuses(selectedPayout.status).map((status) => {
                      const config = getStatusConfig(status)
                      const Icon = config.icon
                      return (
                        <SelectItem
                          key={status}
                          value={status}
                          className="hover:bg-accent hover:text-accent-foreground cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${config.color}`} />
                            <span>{status}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* UTR Number */}
              <div>
                <Label className="text-foreground text-sm">
                  UTR Number {newStatus === 'PAID' && <span className="text-red-400">*</span>}
                </Label>
                <Input
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                  placeholder="Enter UTR number"
                  className="bg-background border-border text-foreground mt-1 h-9 text-sm uppercase"
                />
              </div>

              <div>
                <Label className="text-foreground text-sm">
                  Payment Proof {newStatus === 'PAID' && !uploadedPaymentProofUrl && <span className="text-red-400">*</span>}
                </Label>
                <div className="mt-1">
                  {isUploadingFile ? (
                    <div className="border-2 border-dashed border-primary rounded-lg p-4 text-center bg-primary/5">
                      <Loader2 className="w-6 h-6 mx-auto mb-1 text-primary animate-spin" />
                      <p className="text-foreground text-xs">Uploading payment proof...</p>
                      <p className="text-xs text-muted-foreground">Please wait</p>
                    </div>
                  ) : !paymentProofPreview ? (
                    <label className="block">
                      <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-orange-400 hover:bg-muted/50 transition-all cursor-pointer">
                        <Upload className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-foreground text-xs">Click to upload payment proof</p>
                        <p className="text-xs text-muted-foreground">PDF, JPG, PNG (Max 5MB)</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="relative border-2 border-border rounded-lg p-2 bg-background/50">
                      {paymentProofPreview.startsWith('data:image') || (paymentProofPreview.startsWith('http') && (paymentProofPreview.includes('.jpg') || paymentProofPreview.includes('.jpeg') || paymentProofPreview.includes('.png') || paymentProofPreview.includes('.gif') || paymentProofPreview.includes('.webp'))) ? (
                        <img
                          src={paymentProofPreview}
                          alt="Payment proof preview"
                          className="w-full h-24 object-contain rounded"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-24">
                          <div className="text-center">
                            <FileText className="w-10 h-10 mx-auto mb-1 text-primary" />
                            <p className="text-xs text-foreground">
                              {uploadedPaymentProofUrl && uploadedPaymentProofUrl !== selectedPayout?.paymentProofUrl ? 'Uploaded payment proof' : 'Existing payment proof'}
                            </p>
                            {uploadedPaymentProofUrl && (
                              <a
                                href={uploadedPaymentProofUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline text-xs"
                              >
                                View Document
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                      <button
                        onClick={handleRemoveFile}
                        className="absolute top-1 right-1 p-1.5 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-md transition-colors"
                        title="Remove and upload another"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <label className="block mt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-7 text-xs"
                          onClick={(e) => {
                            e.preventDefault()
                            document.getElementById('file-upload-change')?.click()
                          }}
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          Change File
                        </Button>
                        <input
                          id="file-upload-change"
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-foreground text-sm">Admin Notes</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this status change..."
                  className="bg-background border-border text-foreground mt-1 text-sm"
                  rows={2}
                />
              </div>

              {newStatus === 'PAID' && (
                <div className="bg-primary/10 border border-primary p-2 rounded-lg flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Payment Status Requirements</p>
                    <p className="text-xs text-muted-foreground">
                      UTR number and payment proof are mandatory when marking as PAID
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsStatusDialogOpen(false)}
                  disabled={isUploading || isUploadingFile}
                  className="border-border text-foreground hover:bg-muted h-8"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground h-8"
                  onClick={handleUpdateStatus}
                  disabled={!newStatus || isUploading || isUploadingFile}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Update Status
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
