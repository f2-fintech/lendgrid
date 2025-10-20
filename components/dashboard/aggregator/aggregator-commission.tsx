"use client"

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, Calendar, Download, Search, Filter, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { exportRevenueReport } from '@/lib/exporter'
import { useToast } from "@/hooks/use-toast"
import { ExportButton } from '@/components/ui/button-to-export'
import { CardSkeleton, ChartSkeleton } from '@/components/ui/loading-skeleton'
import { commissionsApi } from '@/lib/api-client'

const mockData = {
  metrics: {
    totalEarned: 485000,
    pendingAmount: 125000,
    paidAmount: 360000,
    avgCommissionRate: 4.2
  },
  commissionTrends: [
    { month: 'Jan', earned: 35000, paid: 32000, pending: 3000 },
    { month: 'Feb', earned: 42000, paid: 38000, pending: 4000 },
    { month: 'Mar', earned: 58000, paid: 52000, pending: 6000 },
    { month: 'Apr', earned: 45000, paid: 41000, pending: 4000 },
    { month: 'May', earned: 68000, paid: 62000, pending: 6000 },
    { month: 'Jun', earned: 75000, paid: 68000, pending: 7000 }
  ],
  lenderWiseCommission: [
    { name: 'HDFC Bank', commission: 125000, percentage: 25.8, color: '#FFD700' },
    { name: 'ICICI Bank', commission: 98000, percentage: 20.2, color: '#007AFF' },
    { name: 'Bajaj Finance', commission: 87000, percentage: 17.9, color: '#22c55e' },
    { name: 'Axis Bank', commission: 76000, percentage: 15.7, color: '#f97316' },
    { name: 'Others', commission: 99000, percentage: 20.4, color: '#8b5cf6' }
  ],
  commissionHistory: [
    {
      id: 'COM001',
      applicationId: 'APP001',
      lenderName: 'HDFC Bank',
      loanType: 'Personal Loan',
      disbursedAmount: 500000,
      commissionRate: 4.0,
      commissionAmount: 20000,
      status: 'Paid',
      disbursedDate: '2025-01-15',
      paidDate: '2025-01-20',
      payoutMethod: 'Bank Transfer',
      utrNumber: 'UTR123456789'
    },
    {
      id: 'COM002',
      applicationId: 'APP002',
      lenderName: 'ICICI Bank',
      loanType: 'Home Loan',
      disbursedAmount: 2500000,
      commissionRate: 3.5,
      commissionAmount: 87500,
      status: 'Pending',
      disbursedDate: '2025-01-18',
      paidDate: null,
      payoutMethod: 'Bank Transfer',
      utrNumber: null
    },
    {
      id: 'COM003',
      applicationId: 'APP003',
      lenderName: 'Bajaj Finance',
      loanType: 'Business Loan',
      disbursedAmount: 1000000,
      commissionRate: 4.5,
      commissionAmount: 45000,
      status: 'Paid',
      disbursedDate: '2025-01-20',
      paidDate: '2025-01-25',
      payoutMethod: 'UPI',
      utrNumber: 'UTR987654321'
    },
    {
      id: 'COM004',
      applicationId: 'APP004',
      lenderName: 'Axis Bank',
      loanType: 'Car Loan',
      disbursedAmount: 800000,
      commissionRate: 3.8,
      commissionAmount: 30400,
      status: 'Processing',
      disbursedDate: '2025-01-22',
      paidDate: null,
      payoutMethod: 'Bank Transfer',
      utrNumber: null
    },
    {
      id: 'COM005',
      applicationId: 'APP005',
      lenderName: 'Kotak Bank',
      loanType: 'Personal Loan',
      disbursedAmount: 350000,
      commissionRate: 4.2,
      commissionAmount: 14700,
      status: 'Disputed',
      disbursedDate: '2025-01-19',
      paidDate: null,
      payoutMethod: 'Bank Transfer',
      utrNumber: null
    }
  ]
}

export function AggregatorCommission() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterLender, setFilterLender] = useState('')
  const [dateRange, setDateRange] = useState('30d')
  const [chartLoading, setChartLoading] = useState(true)
  const [cardsLoading, setCardsLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const chartRef = useRef<HTMLDivElement | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const resp = await commissionsApi.list({ page: 1, limit: 25 })
        const results = resp?.data?.results || []
        if (mounted && results.length) {
          // map server results onto mock shape for now
          ;(mockData as any).commissionHistory = results.map((r: any) => ({
            id: r._id,
            applicationId: r.applicationId,
            lenderName: r.lenderName,
            loanType: r.loanType,
            disbursedAmount: r.disbursedAmount,
            commissionRate: r.commissionRate,
            commissionAmount: r.commissionAmount,
            status: r.status,
            disbursedDate: r.disbursedDate ? new Date(r.disbursedDate).toLocaleDateString() : '-',
            paidDate: r.paidDate ? new Date(r.paidDate).toLocaleDateString() : null,
            payoutMethod: '-',
            utrNumber: null,
          }))
        }
      } finally {
        if (mounted) {
          setCardsLoading(false)
          setChartLoading(false)
        }
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-500/20 text-green-400'
      case 'Pending': return 'bg-orange-500/20 text-orange-400'
      case 'Processing': return 'bg-blue/20 text-blue'
      case 'Disputed': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid': return CheckCircle
      case 'Pending': return Clock
      case 'Processing': return Clock
      case 'Disputed': return AlertCircle
      default: return Clock
    }
  }

  async function handleExport(format: "pdf" | "xlsx") {
    try {
      setExporting(true)
      await exportRevenueReport({
        format,
        fileName: "revenue-report",
        timeRange,
        selectedMetric,
        chartElement: chartRef.current ?? undefined,
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

  const filteredCommissions = mockData.commissionHistory.filter(commission => {
    const matchesSearch = commission.applicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commission.lenderName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || commission.status === filterStatus
    const matchesLender = !filterLender || commission.lenderName === filterLender
    return matchesSearch && matchesStatus && matchesLender
  })

  const MetricCard = ({ index, title, value, icon: Icon, color, subtitle, trend }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className="bg-gray-800/50 border-gray-700 hover:border-gold/50 transition-all duration-300 hover:shadow-lg hover:shadow-gold/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">{title}</p>
              <p className="text-2xl font-bold text-white mt-2">{value}</p>
              {subtitle && (
                <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
              )}
              {trend && (
                <p className="text-sm text-green-400 mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-white">Commission Tracking</h1>
            <p className="text-gray-400 mt-1">Monitor your earnings and payout status</p>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32 bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
              </SelectContent>
            </Select>
            <ExportButton onExport={handleExport} disabled={exporting} />
          </div>
        </motion.div>

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
              title="Total Commission Earned"
              value={formatCurrency(mockData.metrics.totalEarned)}
              icon={DollarSign}
              color="bg-gold/20 text-gold"
              trend="+12.5% from last month"
            />
            <MetricCard
              index={1}
              title="Pending Payouts"
              value={formatCurrency(mockData.metrics.pendingAmount)}
              icon={Clock}
              color="bg-orange-500/20 text-orange-400"
              subtitle="Awaiting payment"
            />
            <MetricCard
              index={2}
              title="Paid Amount"
              value={formatCurrency(mockData.metrics.paidAmount)}
              icon={CheckCircle}
              color="bg-green-500/20 text-green-400"
              subtitle="Successfully received"
            />
            <MetricCard
              index={3}
              title="Avg Commission Rate"
              value={`${mockData.metrics.avgCommissionRate}%`}
              icon={TrendingUp}
              color="bg-blue/20 text-blue"
              subtitle="Across all lenders"
            />
          </div>
        )}

        {/* Commission Analytics */}
        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList className="bg-gray-800 border-gray-700 space-x-3">
            <TabsTrigger value="trends" className="data-[state=active]:bg-gradient-to-r from-blue to-cyan-500 data-[state=active]:text-dark">
              Commission Trends
            </TabsTrigger>
            <TabsTrigger value="breakdown" className="data-[state=active]:bg-gradient-to-r from-blue to-cyan-500 data-[state=active]:text-dark">
              Lender Breakdown
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-gradient-to-r from-blue to-cyan-500 data-[state=active]:text-dark">
              Payment History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trends">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Commission Trends</CardTitle>
                  <CardDescription className="text-gray-400">
                    Monthly commission earnings and payout status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {chartLoading ? (
                    <ChartSkeleton height={354} />
                  ) : (
                    <div className="h-96 w-full" ref={chartRef}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mockData.commissionTrends}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="month" stroke="#9CA3AF" />
                          <YAxis stroke="#9CA3AF" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1F2937',
                              border: '1px solid #374151',
                              borderRadius: '8px'
                            }}
                            formatter={(value) => [formatCurrency(value as number), '']}
                          />
                          <Bar dataKey="earned" fill="#FFD700" name="Total Earned" radius={[2, 2, 0, 0]} />
                          <Bar dataKey="paid" fill="#22c55e" name="Paid" radius={[2, 2, 0, 0]} />
                          <Bar dataKey="pending" fill="#f97316" name="Pending" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="breakdown">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Commission by Lender</CardTitle>
                  <CardDescription className="text-gray-400">
                    Breakdown of earnings from each lender partner
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid lg:grid-cols-2 gap-8">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={mockData.lenderWiseCommission}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="commission"
                          >
                            {mockData.lenderWiseCommission.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1F2937',
                              border: '1px solid #374151',
                              borderRadius: '8px'
                            }}
                            formatter={(value) => [formatCurrency(value as number), 'Commission']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-4">
                      {mockData.lenderWiseCommission.map((lender, index) => (
                        <motion.div
                          key={lender.name}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: lender.color }}
                            />
                            <span className="text-white font-medium">{lender.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-semibold">{formatCurrency(lender.commission)}</p>
                            <p className="text-sm text-gray-400">{lender.percentage}%</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="history">
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
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-32 bg-gray-900 border-gray-600 text-white">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="Paid">Paid</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Processing">Processing</SelectItem>
                          <SelectItem value="Disputed">Disputed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={filterLender} onValueChange={setFilterLender}>
                        <SelectTrigger className="w-40 bg-gray-900 border-gray-600 text-white">
                          <SelectValue placeholder="Lender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Lenders</SelectItem>
                          <SelectItem value="HDFC Bank">HDFC Bank</SelectItem>
                          <SelectItem value="ICICI Bank">ICICI Bank</SelectItem>
                          <SelectItem value="Bajaj Finance">Bajaj Finance</SelectItem>
                          <SelectItem value="Axis Bank">Axis Bank</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-700">
                          <TableHead className="text-gray-300">Application ID</TableHead>
                          <TableHead className="text-gray-300">Lender</TableHead>
                          <TableHead className="text-gray-300">Loan Type</TableHead>
                          <TableHead className="text-gray-300">Disbursed Amount</TableHead>
                          <TableHead className="text-gray-300">Commission Rate</TableHead>
                          <TableHead className="text-gray-300">Commission Amount</TableHead>
                          <TableHead className="text-gray-300">Status</TableHead>
                          <TableHead className="text-gray-300">Disbursed Date</TableHead>
                          <TableHead className="text-gray-300">Paid Date</TableHead>
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
                              className="border-gray-700 hover:bg-gray-800/50"
                            >
                              <TableCell className="text-white font-medium">{commission.applicationId}</TableCell>
                              <TableCell className="text-white">{commission.lenderName}</TableCell>
                              <TableCell className="text-gray-300">{commission.loanType}</TableCell>
                              <TableCell className="text-white">{formatCurrency(commission.disbursedAmount)}</TableCell>
                              <TableCell className="text-gold">{commission.commissionRate}%</TableCell>
                              <TableCell className="text-green-400 font-semibold">{formatCurrency(commission.commissionAmount)}</TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(commission.status)}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {commission.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-gray-300">{commission.disbursedDate}</TableCell>
                              <TableCell className="text-gray-300">
                                {commission.paidDate || '-'}
                              </TableCell>
                            </motion.tr>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
  )
}
