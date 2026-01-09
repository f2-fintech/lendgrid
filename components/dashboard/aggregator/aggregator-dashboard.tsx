"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, DollarSign, CreditCard, Building2, Download, Search, Calendar, Icon, ArrowRight, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProgressBar, ProfileCompletionBanner } from '@/components/ui/progressbar'
import { useAuth } from '@/lib/auth'
import { useProfile } from '@/hooks/use-users'
import { useAggregator } from '@/hooks/use-aggregators'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CardSkeleton, ChartSkeleton, TableSkeleton } from '@/components/ui/loading-skeleton'
import { TablePagination } from '@/components/ui/pagination'
import { ExportButton } from '@/components/ui/button-to-export'
import { exportRevenueReport } from '@/lib/exporter'
import { useToast } from '@/hooks/use-toast'
import { CommissionStatus } from '@/lib'

const mockData = {
  metrics: {
    totalDisbursed: 0,
    totalCommission: 0,
    pendingPayouts: 0
  },
  chartData: [
    { month: 'Jan', amount: 0 },
    { month: 'Feb', amount: 0 },
    { month: 'Mar', amount: 0 },
    { month: 'Apr', amount: 0 },
    { month: 'May', amount: 0 },
    { month: 'Jun', amount: 0 }
  ],
  applications: []
}

export function AggregatorDashboard() {
  const { user } = useAuth('aggregator_admin')
  const { data: userData, isLoading: userLoading } = useProfile(true)
  const { data: aggData, isLoading: aggLoading } = useAggregator(user?.profileId, true)
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLender, setFilterLender] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isTableLoading, setIsTableLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(true)
  const [cardsLoading, setCardsLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const tableTopRef = useRef<HTMLDivElement | null>(null)
  const { toast } = useToast()

  const [profileCompletePct, setProfileCompletePct] = useState<number>(100)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
      setPrefersReducedMotion(mq.matches)
      const handler = (e: any) => setPrefersReducedMotion(e.matches)
      if (mq.addEventListener) mq.addEventListener('change', handler)
      else mq.addListener(handler)
      return () => {
        if (mq.removeEventListener) mq.removeEventListener('change', handler)
        else mq.removeListener(handler)
      }
    }
  }, [])

  useEffect(() => {
    // calculate completeness when data loads
    if (!userData && !aggData) return

    const checks: boolean[] = []

    // user fields
    checks.push(Boolean(userData?.username))
    checks.push(Boolean(userData?.email))
    checks.push(Boolean(userData?.contact))
    checks.push(Boolean(userData?.photoUrl))
    checks.push(Boolean(userData?.status))

    // business fields
    checks.push(Boolean(aggData?.companyName))
    checks.push(Boolean(aggData?.rank))
    checks.push(Boolean(aggData?.businessType))
    checks.push(Boolean(aggData?.yearOfEstablishment))
    checks.push(Boolean(aggData?.registeredAddress))
    checks.push(Boolean(aggData?.city))
    checks.push(Boolean(aggData?.state))
    checks.push(Boolean(aggData?.pincode))
    checks.push(Boolean(aggData?.websiteUrl))
    checks.push(Boolean(aggData?.gstNumber))
    checks.push(Boolean(aggData?.panNumber))
    checks.push(Boolean(aggData?.aadhaarNumber))
    checks.push(Boolean(aggData?.cinNumber))
    checks.push(Boolean(aggData?.tanNumber))

    // banking
    checks.push(Boolean(aggData?.bankName))
    checks.push(Boolean(aggData?.accountNumber))
    checks.push(Boolean(aggData?.ifscCode))
    checks.push(Boolean(aggData?.accountHolderName))

    // documents
    const docs = (aggData as any)?.documents || {}
    const documentsChecks = [
      Boolean(docs?.aadhaarFront),
      Boolean(docs?.aadhaarBack),
      Boolean(docs?.panCard),
      Boolean(docs?.gstCertificate),
      Boolean(docs?.bankStatement),
      Boolean(docs?.incorporationCertificate),
      Boolean(docs?.bankStatement),
      Boolean(docs?.cancelledCheque),
    ]

    // include document checks so completeness matches settings page
    const allChecks = [...checks, ...documentsChecks]
    const total = allChecks.length
    const filled = allChecks.filter(Boolean).length
    const pct = total > 0 ? Math.round((filled / total) * 100) : 100
    setProfileCompletePct(pct)
  }, [userData, aggData])

  useEffect(() => {
    const t = setTimeout(() => {
      setIsTableLoading(false)
      setCardsLoading(false)
      setChartLoading(false)
    }, 1000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    setPage(1)
  }, [searchTerm, filterStatus, filterLender])

  const filteredRules = useMemo(() => {
    return mockData.applications.filter((rule) => {
      const matchesSearch =
        rule.provider.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = !filterStatus || filterStatus === "all" || rule.status === filterStatus
      return matchesSearch && matchesStatus
    })
  }, [searchTerm, filterStatus])

  const total = filteredRules.length
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredRules.slice(start, start + pageSize)
  }, [filteredRules, page, pageSize])

  const handlePageChange = async (newPage: number) => {
    setIsTableLoading(true)
    await new Promise((r) => setTimeout(r, 350))
    setPage(newPage)
    setIsTableLoading(false)
    tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }
  const handlePageSizeChange = async (size: number) => {
    setIsTableLoading(true)
    await new Promise((r) => setTimeout(r, 350))
    setPageSize(size)
    setPage(1)
    setIsTableLoading(false)
    tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  async function handleExport(format: "pdf" | "xlsx") {
    try {
      setExporting(true)
      await exportRevenueReport({
        format,
        fileName: "revenue-report",
        timeRange,
        selectedMetric,
        // chartElement: chartRef.current ?? undefined,
        metrics: mockData.metrics,
        revenueData: mockData.revenueData,
        lenderRevenue: mockData.lenderRevenue,
        recentTransactions: mockData.recentTransactions,
      })
      toast({ title: "Export complete", description: `Saved ${format.toUpperCase()} report for ${timeRange}.` })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Export failed", description: err?.message ?? "Something went wrong." })
    } finally {
      setExporting(false)
    }
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
      case CommissionStatus.PAID: return 'bg-green-500/20 text-green-400'
      case CommissionStatus.CALCULATED:
      case CommissionStatus.PENDING: return 'bg-orange-500/20 text-orange-400'
      case CommissionStatus.APPROVED: return 'bg-blue/20 text-blue'
      case CommissionStatus.DISPUTED: return 'bg-red-500/20 text-red-400'
      case CommissionStatus.REJECTED:
      case CommissionStatus.CANCELLED: return 'bg-gray-500/20 text-gray-400'
      default: return 'bg-gray-500/20 text-gray-400'
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

  const MetricCard = ({ index, title, value, icon: Icon, trend, color }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className="bg-gray-800/50 border-gray-700 hover:border-gold/50 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">{title}</p>
              <p className="text-2xl font-bold text-white mt-2">{value}</p>
              {trend && (
                <p className="text-sm text-green-400 mt-1 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {trend}
                </p>
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
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Welcome back! Here's your performance overview.</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" className="border-gray-600 text-white">
            <Calendar className="w-4 h-4 mr-2" />
            Last 30 days
          </Button>
          <ExportButton onExport={handleExport} disabled={exporting} />
        </div>
      </div>

      {/* Metrics Cards */}
      {cardsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardSkeleton headerLines={2} bodyHeight={20} />
          <CardSkeleton headerLines={2} bodyHeight={20} />
          <CardSkeleton headerLines={2} bodyHeight={20} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            index={0}
            title="Total Disbursed Amount"
            value={formatCurrency(mockData.metrics.totalDisbursed)}
            icon={DollarSign}
            trend="+12.5% from last month"
            color="bg-green-500/20 text-green-400"
          />
          <MetricCard
            index={1}
            title="Total Commission Earned"
            value={formatCurrency(mockData.metrics.totalCommission)}
            icon={TrendingUp}
            trend="+8.2% from last month"
            color="bg-gold/20 text-gold"
          />
          <MetricCard
            index={2}
            title="Pending Payouts"
            value={formatCurrency(mockData.metrics.pendingPayouts)}
            icon={CreditCard}
            trend="2 payouts pending"
            color="bg-orange-500/20 text-orange-400"
          />
        </div>
      )}

      {/* Chart */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Monthly Disbursal Trend</CardTitle>
          <CardDescription className="text-gray-400">
            Track your loan disbursal performance over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartLoading ? (
            <ChartSkeleton height={254} />
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockData.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                    formatter={(value) => [formatCurrency(value as number), 'Amount']}
                  />
                  {/* Change gradient ID reference here */}
                  <Bar dataKey="amount" fill="url(#blueGradient)" radius={[4, 4, 0, 0]} barSize={40} />

                  {/* Define new blue gradient */}
                  <defs>
                    <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" /> {/* top - blue-500 */}
                      <stop offset="100%" stopColor="#1E3A8A" /> {/* bottom - blue-900 */}
                    </linearGradient>
                  </defs>
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
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Commission History</CardTitle>
                <CardDescription className="text-gray-400">
                  Detailed record of all commission transactions
                </CardDescription>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-900 border-gray-600 text-white w-64"
                  />
                </div>
                <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val as CommissionStatus | '')}>
                  <SelectTrigger className="w-32 bg-gray-900 border-gray-600 text-white">
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
            {isTableLoading ? (
              <TableSkeleton columns={6} rows={pageSize} />
            ) : paginated.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No commission transactions found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="text-gray-300">Ticket ID</TableHead>
                        <TableHead className="text-gray-300">Lender</TableHead>
                        <TableHead className="text-gray-300">Loan Type</TableHead>
                        <TableHead className="text-gray-300">Loan Amount</TableHead>
                        <TableHead className="text-gray-300">Commission Rate</TableHead>
                        <TableHead className="text-gray-300">Commission Amount</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-300">Calculated Date</TableHead>
                        <TableHead className="text-gray-300">Paid Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginated.map((commission, index) => {
                        const StatusIcon = getStatusIcon(commission.status)
                        return (
                          <motion.tr
                            key={commission.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="border-gray-700 hover:bg-gray-800/50"
                          >
                            <TableCell className="text-white font-medium">#{commission.ticketId}</TableCell>
                            <TableCell className="text-white">{commission.provider || 'N/A'}</TableCell>
                            <TableCell className="text-gray-300">{commission.productType || 'N/A'}</TableCell>
                            <TableCell className="text-white">{formatCurrency(commission.disbursedAmount)}</TableCell>
                            <TableCell className="text-gold">{commission.commissionRate}%</TableCell>
                            <TableCell className="text-green-400 font-semibold">{formatCurrency(commission.commissionAmount)}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(commission.status)}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {getStatusLabel(commission.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-300">{formatDate(commission.calculatedAt)}</TableCell>
                            <TableCell className="text-gray-300">{formatDate(commission.paidAt)}</TableCell>
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
    </div>
  )
}
