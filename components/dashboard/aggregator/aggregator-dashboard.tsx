"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, DollarSign, CreditCard, Building2, Download, Search, Calendar } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

const mockData = {
  metrics: {
    totalDisbursed: 12500000,
    totalCommission: 500000,
    pendingPayouts: 125000,
    activeLenders: 8
  },
  chartData: [
    { month: 'Jan', amount: 1200000 },
    { month: 'Feb', amount: 1800000 },
    { month: 'Mar', amount: 2200000 },
    { month: 'Apr', amount: 1900000 },
    { month: 'May', amount: 2500000 },
    { month: 'Jun', amount: 2800000 }
  ],
  applications: [
    {
      id: 'APP001',
      lenderName: 'HDFC Bank',
      loanType: 'Personal Loan',
      disbursedAmount: 500000,
      disbursedDate: '2025-01-15',
      commissionPercent: 4,
      calculatedCommission: 20000,
      payoutStatus: 'Paid',
      payoutDate: '2025-01-20'
    },
    {
      id: 'APP002',
      lenderName: 'ICICI Bank',
      loanType: 'Home Loan',
      disbursedAmount: 2500000,
      disbursedDate: '2025-01-18',
      commissionPercent: 3.5,
      calculatedCommission: 87500,
      payoutStatus: 'Pending',
      payoutDate: null
    },
    {
      id: 'APP003',
      lenderName: 'Bajaj Finance',
      loanType: 'Business Loan',
      disbursedAmount: 1000000,
      disbursedDate: '2025-01-20',
      commissionPercent: 4.5,
      calculatedCommission: 45000,
      payoutStatus: 'Paid',
      payoutDate: '2025-01-25'
    }
  ]
}

export function AggregatorDashboard() {
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

  useEffect(() => {
    const t = setTimeout(() => {
      setIsTableLoading(false)
      setCardsLoading(false)
      setChartLoading(false)
    }, 2000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    setPage(1)
  }, [searchTerm, filterStatus, filterLender])

  const filteredRules = useMemo(() => {
    return mockData.applications.filter((rule) => {
      const matchesSearch =
        rule.lenderName.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = !filterStatus || filterStatus === "all" || rule.payoutStatus === filterStatus
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
            <ExportButton  onExport={handleExport} disabled={exporting}/>
          </div>
        </div>

        {/* Metrics Cards */}
        {cardsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <CardSkeleton headerLines={2} bodyHeight={20} />
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
            <MetricCard
              index={3}
              title="Active Lender Products"
              value={mockData.metrics.activeLenders}
              icon={Building2}
              trend="+2 new this month"
              color="bg-blue/20 text-blue"
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
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => [formatCurrency(value as number), 'Amount']}
                    />
                    <Bar dataKey="amount" fill="url(#goldGradient)" radius={[4, 4, 0, 0]} />
                    <defs>
                      <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FFD700" />
                        <stop offset="100%" stopColor="#FFA500" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Disbursed Applications</CardTitle>
                <CardDescription className="text-gray-400">
                  Track all your loan applications and commission status
                </CardDescription>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search applications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-900 border-gray-600 text-white w-64"
                  />
                </div>
                <Select value={filterLender} onValueChange={setFilterLender}>
                  <SelectTrigger className="w-40 bg-gray-900 border-gray-600 text-white">
                    <SelectValue placeholder="All Lenders" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Lenders</SelectItem>
                    <SelectItem value="hdfc">HDFC Bank</SelectItem>
                    <SelectItem value="icici">ICICI Bank</SelectItem>
                    <SelectItem value="bajaj">Bajaj Finance</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32 bg-gray-900 border-gray-600 text-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={tableTopRef} />
            <div className="overflow-x-auto">
              {isTableLoading ? (
                <TableSkeleton columns={6} rows={pageSize} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">App ID</TableHead>
                      <TableHead className="text-gray-300">Lender</TableHead>
                      <TableHead className="text-gray-300">Loan Type</TableHead>
                      <TableHead className="text-gray-300">Disbursed Amount</TableHead>
                      <TableHead className="text-gray-300">Commission %</TableHead>
                      <TableHead className="text-gray-300">Commission Amount</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Payout Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((app) => (
                      <TableRow key={app.id} className="border-gray-700 hover:bg-gray-800/50">
                        <TableCell className="text-white font-medium">{app.id}</TableCell>
                        <TableCell className="text-white">{app.lenderName}</TableCell>
                        <TableCell className="text-gray-300">{app.loanType}</TableCell>
                        <TableCell className="text-white">{formatCurrency(app.disbursedAmount)}</TableCell>
                        <TableCell className="text-gold">{app.commissionPercent}%</TableCell>
                        <TableCell className="text-green-400">{formatCurrency(app.calculatedCommission)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={app.payoutStatus === 'Paid' ? 'default' : 'secondary'}
                            className={app.payoutStatus === 'Paid' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}
                          >
                            {app.payoutStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {app.payoutDate || 'Pending'}
                        </TableCell>
                      </TableRow>
                    ))}
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
      </div>
  )
}
