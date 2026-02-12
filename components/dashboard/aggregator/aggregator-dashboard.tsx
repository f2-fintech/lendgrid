"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { TrendingUp, ClipboardList, IndianRupee, Banknote, FileText, Eye, Search, Calendar, ArrowRight, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfileCompletionBanner } from '@/components/ui/progressbar'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CardSkeleton, ChartSkeleton, TableSkeleton } from '@/components/ui/loading-skeleton'
import { TablePagination } from '@/components/ui/pagination'
import { CommissionStatus } from '@/lib'
import { navigationPaths } from '@/lib/navigation'

import { useProfile } from '@/hooks/use-users'
import { useAggregator } from '@/hooks/use-aggregators'
import { useToast } from '@/hooks/use-toast'
import { useCommissionTransactions } from '@/hooks/use-commissions'
import { useApplicationCount } from '@/hooks/use-applications-rest'
import { getCookie, decodeJwt } from "@/lib/utils"
import { useDashboardTicketStats, useDisbursedTicketsByMonth } from '@/hooks/use-tickets-rest'

export function AggregatorDashboard() {
  const [profileCompletePct, setProfileCompletePct] = useState<number>(100)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filterStatus, setFilterStatus] = useState<CommissionStatus | ''>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [exporting, setExporting] = useState(false)
  const tableTopRef = useRef<HTMLDivElement | null>(null)

  const { user } = useAuth('aggregator_admin')
  const { data: userData, isLoading: userLoading } = useProfile(true)
  const { data: aggData, isLoading: aggLoading } = useAggregator(user?.profileId, true)
  const { count: totalApplicationsCount } = useApplicationCount(
    undefined,
    'aggregator_admin'
  )
  const {
    count: disbursedCount,
    amount: disbursedAmount,
  } = useDashboardTicketStats(
    { status: 'disbursed' },
    'aggregator_admin'
  )
  const {
    count: approvedCount,
    amount: approvedAmount,
  } = useDashboardTicketStats(
    { status: 'approved' },
    'aggregator_admin'
  )
  const {
    count: rejectedCount,
  } = useDashboardTicketStats(
    { status: 'rejected' },
    'aggregator_admin'
  )

  const { data: disbursedByMonth, isLoading: chartLoading } =
    useDisbursedTicketsByMonth(
      new Date().getFullYear(),
      undefined,
      'aggregator_admin'
    )

  const router = useRouter()
  const { theme } = useTheme()
  const { toast } = useToast()

  const {
    data: commissionData,
    isLoading: isCommissionLoading,
    isError: isCommissionError,
    error: commissionError,
    refetch: refetchCommission,
  } = useCommissionTransactions({
    page,
    limit: pageSize,
    filters: {
      aggregatorId: user?._id,
      status: filterStatus || undefined,
    },
  })

  // compute profile completeness
  useEffect(() => {
    if (!userData && !aggData) return

    const token = getCookie("token")
    const decoded = decodeJwt(token)
    const aggregatorType = decoded?.aggregatorType
    const isSourcer = aggregatorType === "SOURCER" // Check against string value stored in cookie

    // groups checks
    const profileChecks = [
      Boolean(userData?.username),
      Boolean(userData?.email),
      Boolean(userData?.contact),
      Boolean(userData?.photoUrl),
      Boolean(userData?.status),
    ]

    let businessChecks = []
    let bankChecks: boolean[] = []
    let documentsChecks: boolean[] = []

    if (isSourcer) {
      // SOURCER REQUIREMENTS: Basic info only
      businessChecks = [
        Boolean(aggData?.companyName),
        Boolean(aggData?.aggregatorType),
        Boolean(aggData?.rank),
        Boolean(aggData?.businessType),
      ]
      // No bank or document checks for sourcer
    } else {
      // CHANNEL_PARTNER / DEFAULT REQUIREMENTS: Full checks
      businessChecks = [
        Boolean(aggData?.companyName),
        Boolean(aggData?.aggregatorType),
        Boolean(aggData?.rank),
        Boolean(aggData?.businessType),
        Boolean(aggData?.yearOfEstablishment),
        Boolean(aggData?.registeredAddress),
        Boolean(aggData?.city),
        Boolean(aggData?.state),
        Boolean(aggData?.pincode),
        Boolean(aggData?.websiteUrl),
        Boolean(aggData?.gstNumber),
        Boolean(aggData?.panNumber),
        Boolean(aggData?.aadhaarNumber),
        Boolean(aggData?.cinNumber),
        Boolean(aggData?.tanNumber),
      ]

      bankChecks = [
        Boolean(aggData?.bankName),
        Boolean(aggData?.accountNumber),
        Boolean(aggData?.ifscCode),
        Boolean(aggData?.accountHolderName),
      ]

      const docs = (aggData as any)?.documents || {}
      documentsChecks = [
        Boolean(docs?.aadhaarFront),
        Boolean(docs?.aadhaarBack),
        Boolean(docs?.panCard),
        Boolean(docs?.gstCertificate),
        Boolean(docs?.bankStatement),
        Boolean(docs?.incorporationCertificate),
        Boolean(docs?.cancelledCheque),
        Boolean(docs?.addressProof),
      ]
    }

    const allChecks = [...profileChecks, ...businessChecks, ...bankChecks, ...documentsChecks]
    const total = allChecks.length
    const filled = allChecks.filter(Boolean).length
    const pct = total > 0 ? Math.round((filled / total) * 100) : 100
    setProfileCompletePct(pct)
  }, [userData, aggData])

  useEffect(() => {
    setPage(1)
  }, [searchTerm, filterStatus])

  const filteredCommissions = useMemo(() => {
    if (!commissionData?.data) return []

    return commissionData.data.filter(commission => {
      const matchesSearch =
        commission.ticketId.toString().includes(searchTerm) ||
        (commission.provider || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (commission.productType || '').toLowerCase().includes(searchTerm.toLowerCase())

      return matchesSearch
    })
  }, [commissionData, searchTerm])
  const total = commissionData?.total || 0

  const commissionSummary = useMemo(() => {
    let total = 0
    let paid = 0
    let pending = 0

    for (const tx of commissionData?.data ?? []) {
      total += tx.commissionAmount

      if (tx.status === CommissionStatus.PAID) {
        paid += tx.commissionAmount
      }

      if (
        tx.status === CommissionStatus.PENDING ||
        tx.status === CommissionStatus.CALCULATED
      ) {
        pending += tx.commissionAmount
      }
    }

    return { total, paid, pending }
  }, [commissionData])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(1)
    tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: CommissionStatus) => {
    switch (status) {
      case CommissionStatus.PAID: return 'badge-success'
      case CommissionStatus.CALCULATED:
      case CommissionStatus.PENDING: return 'badge-warning'
      case CommissionStatus.APPROVED: return 'badge-primary'
      case CommissionStatus.DISPUTED: return 'badge-error'
      case CommissionStatus.REJECTED:
      case CommissionStatus.CANCELLED: return 'badge-muted'
      default: return 'badge-muted'
    }
  }

  const getStatusIcon = (status: CommissionStatus) => {
    switch (status) {
      case CommissionStatus.PAID: return CheckCircle
      case CommissionStatus.CALCULATED:
      case CommissionStatus.PENDING: return Clock
      case CommissionStatus.APPROVED: return CheckCircle
      case CommissionStatus.DISPUTED: return AlertCircle
      case CommissionStatus.REJECTED:
      case CommissionStatus.CANCELLED: return XCircle
      default: return Clock
    }
  }

  const getStatusLabel = (status: CommissionStatus) => {
    switch (status) {
      case CommissionStatus.CALCULATED: return 'Calculated'
      case CommissionStatus.PENDING: return 'Pending'
      case CommissionStatus.APPROVED: return 'Approved'
      case CommissionStatus.PAID: return 'Paid'
      case CommissionStatus.REJECTED: return 'Rejected'
      case CommissionStatus.CANCELLED: return 'Cancelled'
      case CommissionStatus.DISPUTED: return 'Disputed'
      default: return status
    }
  }

  const MetricCard = ({
    title,
    count,
    amount,
    countLabel,
    icon: Icon,
    colorClass,
    navigationPath,
  }: {
    title: string
    count?: number
    amount?: number
    countLabel?: string
    icon: any
    colorClass: string
    navigationPath: string
  }) => (
    <Card
      className={`professional-card hover-lift cursor-pointer ${colorClass}`}
      onClick={() => router.push(navigationPath)}
    >
      <CardContent className="p-6 flex flex-col items-center text-center gap-2">
        {/* Icon */}
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-black/10">
          <Icon className="w-6 h-6" />
        </div>

        {/* Amount */}
        {typeof amount === 'number' && (
          <p className="text-xl font-bold text-foreground">
            {formatCurrency(amount)}
          </p>
        )}

        {/* Count */}
        {typeof count === 'number' && (
          <p className="text-sm text-muted-foreground">
            {count} {countLabel ?? 'tickets'}
          </p>
        )}

        {/* Title */}
        <p className="text-sm font-medium text-foreground whitespace-nowrap">
          {title}
        </p>
      </CardContent>
    </Card>
  )

  const chartColors = {
    grid: theme === 'dark' ? '#374151' : '#e5e7eb',
    axis: theme === 'dark' ? '#9CA3AF' : '#6b7280',
    tooltipBg: theme === 'dark' ? '#1F2937' : '#ffffff',
    tooltipBorder: theme === 'dark' ? '#374151' : '#e5e7eb',
    tooltipText: theme === 'dark' ? '#F9FAFB' : '#111827'
  }

  const chartData = useMemo(() => {
    return disbursedByMonth.map((item: any) => ({
      month: item.month.slice(0, 3), // Jan, Feb
      count: item.count,
    }))
  }, [disbursedByMonth])

  {
    isCommissionError && (
      <div className="text-center py-12">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-muted-foreground">
          {commissionError?.message || 'Failed to load commission data'}
        </p>
        <Button size="sm" onClick={() => refetchCommission()} className="mt-3">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Profile completion banner */}
      {profileCompletePct <= 100 && (
        <ProfileCompletionBanner
          percent={profileCompletePct}
          onAction={() => router.push('/aggregator/settings')}
          showAction={profileCompletePct < 100}
        />
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's your performance overview.</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" className="border-border">
            <Calendar className="w-4 h-4 mr-2" />
            {new Date().toLocaleDateString('en-US', { day: "numeric", month: 'long', year: 'numeric' })}
          </Button>
          {/* <ExportButton onExport={handleExport} disabled={exporting} /> */}
        </div>
      </div>

      {/* Metrics Cards */}
      {isCommissionLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardSkeleton headerLines={2} bodyHeight={20} />
          <CardSkeleton headerLines={2} bodyHeight={20} />
          <CardSkeleton headerLines={2} bodyHeight={20} />
          <CardSkeleton headerLines={2} bodyHeight={20} />
          <CardSkeleton headerLines={2} bodyHeight={20} />
          <CardSkeleton headerLines={2} bodyHeight={20} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Row 1 */}
          <MetricCard
            title="Submitted Applications"
            count={totalApplicationsCount}
            countLabel="submitted"
            icon={FileText}
            colorClass="metric-card-primary"
            navigationPath={navigationPaths.aggregator.applications}
          />

          <MetricCard
            title="Approved Loans"
            amount={approvedAmount}
            count={approvedCount}
            countLabel="approved"
            icon={CheckCircle}
            colorClass="metric-card-success"
            navigationPath={navigationPaths.aggregator.applications}
          />

          <MetricCard
            title="Disbursed Loans"
            amount={disbursedAmount}
            count={disbursedCount}
            countLabel="disbursed"
            icon={Banknote}
            colorClass="metric-card-success"
            navigationPath={navigationPaths.aggregator.applications}
          />

          <MetricCard
            title="Rejected Applications"
            count={rejectedCount}
            countLabel="rejected"
            icon={XCircle}
            colorClass="metric-card-warning"
            navigationPath={navigationPaths.aggregator.applications}
          />

          {/* Row 2 */}
          <MetricCard
            title="Commission Transactions"
            count={commissionData?.total ?? 0}
            countLabel="transactions"
            icon={ClipboardList}
            colorClass="metric-card-primary"
            navigationPath={navigationPaths.aggregator.commission}
          />

          <MetricCard
            title="Commission Earned"
            amount={commissionSummary.total}
            icon={IndianRupee}
            colorClass="metric-card-accent"
            navigationPath={navigationPaths.aggregator.commission}
          />

          <MetricCard
            title="Commission Paid"
            amount={commissionSummary.paid}
            icon={TrendingUp}
            colorClass="metric-card-accent"
            navigationPath={navigationPaths.aggregator.commission}
          />

          <MetricCard
            title="Commission Pending"
            amount={commissionSummary.pending}
            icon={Clock}
            colorClass="metric-card-warning"
            navigationPath={navigationPaths.aggregator.commission}
          />
        </div>
      )}

      {/* Chart */}
      <Card className="professional-card">
        <CardHeader>
          <CardTitle className="text-foreground">Monthly Disbursal Trend</CardTitle>
          <CardDescription className="text-muted-foreground">
            Track your loan disbursal performance over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartLoading ? (
            <ChartSkeleton height={254} />
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="month" stroke={chartColors.axis} />
                  <YAxis stroke={chartColors.axis} allowDecimals={false} />
                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      backgroundColor: chartColors.tooltipBg,
                      border: `1px solid ${chartColors.tooltipBorder}`,
                      borderRadius: '8px',
                      color: chartColors.tooltipText
                    }}
                    formatter={(value) => [`${value} loans`, 'Disbursed']}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Applications Table */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="professional-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Commission History</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Detailed record of all commission transactions
                </CardDescription>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 professional-input w-64"
                  />
                </div>
                <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val as CommissionStatus | '')}>
                  <SelectTrigger className="w-32 professional-input">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value={CommissionStatus.PAID}>Paid</SelectItem>
                    <SelectItem value={CommissionStatus.PENDING}>Pending</SelectItem>
                    <SelectItem value={CommissionStatus.CALCULATED}>Calculated</SelectItem>
                    <SelectItem value={CommissionStatus.APPROVED}>Approved</SelectItem>
                    <SelectItem value={CommissionStatus.DISPUTED}>Disputed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={tableTopRef} />
            {isCommissionLoading ? (
              <TableSkeleton columns={6} rows={pageSize} />
            ) : filteredCommissions.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No commission transactions found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto professional-table">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticket ID</TableHead>
                        <TableHead>Lender</TableHead>
                        <TableHead>Loan Type</TableHead>
                        <TableHead>Loan Amount</TableHead>
                        <TableHead>Commission Rate</TableHead>
                        <TableHead>Commission Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Calculated Date</TableHead>
                        <TableHead>UTR / Paid Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCommissions.map((commission, index) => {
                        const StatusIcon = getStatusIcon(commission.status)
                        return (
                          <motion.tr
                            key={commission.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="border-border hover:bg-card/50"
                          >
                            <TableCell className="font-medium">#{commission.ticketId}</TableCell>
                            <TableCell>{commission.provider || 'N/A'}</TableCell>
                            <TableCell>{commission.productType || 'N/A'}</TableCell>
                            <TableCell>{formatCurrency(commission.disbursedAmount)}</TableCell>
                            <TableCell className="text-accent">{commission.commissionRate}%</TableCell>
                            <TableCell className="text-success font-semibold">{formatCurrency(commission.commissionAmount)}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(commission.status)}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {getStatusLabel(commission.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(commission.calculatedAt)}</TableCell>
                            <TableCell>
                              {commission.status === CommissionStatus.PAID && commission.utrNumber ? (
                                <div className="flex flex-col gap-1">
                                  {/* UTR */}
                                  <p className="text-foreground font-mono text-xs">
                                    {commission.utrNumber.toUpperCase()}
                                  </p>

                                  {/* Paid Date */}
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(commission.paidAt)}
                                  </p>

                                  {/* Payment Proof */}
                                  {commission.paymentProofUrl && (
                                    <button
                                      onClick={() => window.open(commission.paymentProofUrl, '_blank')}
                                      className="inline-flex items-center gap-1 text-primary text-xs hover:underline"
                                    >
                                      <Eye className="w-3 h-3" />
                                      View Proof
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <p className="text-muted-foreground text-sm">
                                  {formatDate(commission.paidAt)}
                                </p>
                              )}
                            </TableCell>
                          </motion.tr>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
                <TablePagination
                  page={page}
                  pageSize={pageSize}
                  total={total || 0}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  className="mt-4"
                />
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* <Card className="professional-card">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates on your commissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>Commission paid for Ticket #65</span>
            <span className="ml-auto text-xs text-muted-foreground">2 days ago</span>
          </div>
        </CardContent>
      </Card> */}

    </div>
  )
}
