'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import { Download, Calendar, TrendingUp, DollarSign, FileText, BarChart3, PieChartIcon, Activity, Target, Users, CreditCard } from 'lucide-react'
// Group layout provides DashboardLayout
import { useToast } from '@/hooks/use-toast'
import { exportRevenueReport } from '@/lib/exporter'
import { ExportButton } from '@/components/ui/button-to-export'
import { CardSkeleton, ChartSkeleton } from '@/components/ui/loading-skeleton'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

const mockData = {
  performanceMetrics: [
    { month: 'Jan', applications: 45, approvals: 36, disbursals: 34, commission: 85000 },
    { month: 'Feb', applications: 52, approvals: 42, disbursals: 40, commission: 98000 },
    { month: 'Mar', applications: 68, approvals: 54, disbursals: 51, commission: 127500 },
    { month: 'Apr', applications: 41, approvals: 33, disbursals: 31, commission: 77500 },
    { month: 'May', applications: 75, approvals: 60, disbursals: 57, commission: 142500 },
    { month: 'Jun', applications: 89, approvals: 71, disbursals: 68, commission: 170000 },
    { month: 'Jul', applications: 85, approvals: 75, disbursals: 68, commission: 170000 },
    { month: 'Aug', applications: 79, approvals: 61, disbursals: 68, commission: 170000 },
    { month: 'Sep', applications: 92, approvals: 66, disbursals: 68, commission: 170000 },
    { month: 'Oct', applications: 87, approvals: 77, disbursals: 68, commission: 170000 },
  ],
  loanTypeBreakdown: [
    { name: 'Personal Loan', value: 45, amount: 11250000, color: '#FFD700' },
    { name: 'Home Loan', value: 25, amount: 6250000, color: '#007AFF' },
    { name: 'Business Loan', value: 20, amount: 5000000, color: '#22c55e' },
    { name: 'Car Loan', value: 10, amount: 2500000, color: '#f97316' }
  ],
  lenderPerformance: [
    { name: 'HDFC Bank', applications: 89, approvals: 71, rate: 79.8, commission: 178000 },
    { name: 'ICICI Bank', applications: 67, approvals: 54, rate: 80.6, commission: 135000 },
    { name: 'Bajaj Finance', applications: 45, approvals: 38, rate: 84.4, commission: 95000 },
    { name: 'Axis Bank', applications: 34, approvals: 26, rate: 76.5, commission: 65000 },
    { name: 'Kotak Bank', applications: 28, approvals: 23, rate: 82.1, commission: 57500 }
  ],
  conversionFunnel: [
    { stage: 'Leads Generated', count: 1250, percentage: 100 },
    { stage: 'Applications Submitted', count: 890, percentage: 71.2 },
    { stage: 'Documents Verified', count: 712, percentage: 57.0 },
    { stage: 'Credit Approved', count: 534, percentage: 42.7 },
    { stage: 'Loans Disbursed', count: 489, percentage: 39.1 }
  ],
  monthlyTrends: [
    { month: 'Jan', revenue: 85000, volume: 3400000, customers: 34 },
    { month: 'Feb', revenue: 98000, volume: 3920000, customers: 40 },
    { month: 'Mar', revenue: 127500, volume: 5100000, customers: 51 },
    { month: 'Apr', revenue: 77500, volume: 3100000, customers: 31 },
    { month: 'May', revenue: 142500, volume: 5700000, customers: 57 },
    { month: 'Jun', revenue: 170000, volume: 6800000, customers: 68 }
  ]
}

const stats = [
  {
    title: 'Total Applications',
    value: '320',
    change: '+18%',
    icon: FileText,
    color: 'text-blue-400'
  },
  {
    title: 'Approval Rate',
    value: '79.4%',
    change: '+2.3%',
    icon: Target,
    color: 'text-green-400'
  },
  {
    title: 'Total Commission',
    value: '₹7.0L',
    change: '+25%',
    icon: DollarSign,
    color: 'text-purple-400'
  },
  {
    title: 'Active Customers',
    value: '281',
    change: '+12%',
    icon: Users,
    color: 'text-orange-400'
  }
]

export function AggregatorReports() {
  const [dateRange, setDateRange] = useState('6m')
  const [reportType, setReportType] = useState('performance')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isTableLoading, setIsTableLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(true)
  const [cardsLoading, setCardsLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const tableTopRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<HTMLDivElement | null>(null)
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
  }, [])

  // const paginated = useMemo(() => {
  //   const start = (page - 1) * pageSize
  //   return filteredRules.slice(start, start + pageSize)
  // }, [page, pageSize])

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

  const [timeRange, setTimeRange] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('revenue')

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue to-cyan-500 bg-clip-text text-transparent">
              Reports & Analytics
            </h1>
            <p className="text-gray-400 mt-1">Comprehensive insights into your loan aggregation performance</p>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32 bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">1 Month</SelectItem>
                <SelectItem value="3m">3 Months</SelectItem>
                <SelectItem value="6m">6 Months</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
              </SelectContent>
            </Select>
            <ExportButton onExport={handleExport} disabled={exporting} />
          </div>
        </motion.div>

        {/* Stats Cards */}
        {cardsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <CardSkeleton headerLines={2} bodyHeight={20} />
            <CardSkeleton headerLines={2} bodyHeight={20} />
            <CardSkeleton headerLines={2} bodyHeight={20} />
            <CardSkeleton headerLines={2} bodyHeight={20} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="bg-gray-800/50 border-gray-700 hover:border-gold/50 transition-all duration-300 hover:shadow-lg hover:shadow-gold/10">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">{stat.title}</p>
                        <p className="text-2xl font-bold text-white mt-2">{stat.value}</p>
                        <p className="text-green-400 text-sm mt-1 flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {stat.change} from last period
                        </p>
                      </div>
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-gray-900/50 ${stat.color}`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Report Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Tabs value={reportType} onValueChange={setReportType} className="space-y-6">
            <TabsList className="bg-gray-800 border-gray-700 space-x-3">
              <TabsTrigger value="performance" className="data-[state=active]:bg-gradient-to-r from-blue to-cyan-500 data-[state=active]:text-dark">
                <BarChart3 className="w-4 h-4 mr-2" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="breakdown" className="data-[state=active]:bg-gradient-to-r from-blue to-cyan-500 data-[state=active]:text-dark">
                <PieChartIcon className="w-4 h-4 mr-2" />
                Breakdown
              </TabsTrigger>
              <TabsTrigger value="trends" className="data-[state=active]:bg-gradient-to-r from-blue to-cyan-500 data-[state=active]:text-dark">
                <Activity className="w-4 h-4 mr-2" />
                Trends
              </TabsTrigger>
              <TabsTrigger value="conversion" className="data-[state=active]:bg-gradient-to-r from-blue to-cyan-500 data-[state=active]:text-dark">
                <Target className="w-4 h-4 mr-2" />
                Conversion
              </TabsTrigger>
            </TabsList>

            <TabsContent value="performance" className="space-y-6">
              {/* Performance Chart */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Monthly Performance Overview</CardTitle>
                  <CardDescription className="text-gray-400">
                    Applications, approvals, disbursals, and commission trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {chartLoading ? (
                    <ChartSkeleton height={254} />
                  ) : (
                    <ChartContainer
                      config={{
                        applications: { label: "Applications", color: "#007AFF" },
                        approvals: { label: "Approvals", color: "#22c55e" },
                        disbursals: { label: "Disbursals", color: "#FFD700" },
                      }}
                      className="h-96"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mockData.performanceMetrics}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="month" stroke="#9CA3AF" />
                          <YAxis stroke="#9CA3AF" />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="applications" fill="#007AFF" name="Applications" radius={[2, 2, 0, 0]} />
                          <Bar dataKey="approvals" fill="#22c55e" name="Approvals" radius={[2, 2, 0, 0]} />
                          <Bar dataKey="disbursals" fill="#FFD700" name="Disbursals" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              {/* Lender Performance Table */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Lender Performance Analysis</CardTitle>
                  <CardDescription className="text-gray-400">
                    Detailed breakdown by lender partner
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockData.lenderPerformance.map((lender, index) => (
                      <motion.div
                        key={lender.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue to-cyan-500 rounded-lg flex items-center justify-center text-dark font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{lender.name}</p>
                            <p className="text-sm text-gray-400">{lender.applications} applications</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-8">
                          <div className="text-center">
                            <p className="text-white font-semibold">{lender.approvals}</p>
                            <p className="text-xs text-gray-400">Approvals</p>
                          </div>
                          <div className="text-center">
                            <p className="text-green-400 font-semibold">{lender.rate}%</p>
                            <p className="text-xs text-gray-400">Rate</p>
                          </div>
                          <div className="text-center">
                            <p className="text-gold font-semibold">{formatCurrency(lender.commission)}</p>
                            <p className="text-xs text-gray-400">Commission</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="breakdown" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Loan Type Distribution */}
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Loan Type Distribution</CardTitle>
                    <CardDescription className="text-gray-400">
                      Breakdown by loan categories
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={mockData.loanTypeBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {mockData.loanTypeBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <ChartTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload
                                return (
                                  <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
                                    <p className="text-white font-medium">{data.name}</p>
                                    <p className="text-gray-300">{data.value}% ({formatCurrency(data.amount)})</p>
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 mt-4">
                      {mockData.loanTypeBreakdown.map((item) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-gray-300">{item.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-white font-semibold">{item.value}%</span>
                            <p className="text-xs text-gray-400">{formatCurrency(item.amount)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Commission Breakdown */}
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Commission Breakdown</CardTitle>
                    <CardDescription className="text-gray-400">
                      Monthly commission earnings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        commission: { label: "Commission", color: "#FFD700" },
                      }}
                      className="h-64"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={mockData.performanceMetrics}>
                          <defs>
                            <linearGradient id="commissionGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#FFD700" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#FFD700" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="month" stroke="#9CA3AF" />
                          <YAxis stroke="#9CA3AF" />
                          <ChartTooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
                                    <p className="text-white font-medium">{label}</p>
                                    <p className="text-gold">{formatCurrency(payload[0].value as number)}</p>
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="commission"
                            stroke="#FFD700"
                            strokeWidth={3}
                            fill="url(#commissionGradient)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Business Trends Analysis</CardTitle>
                  <CardDescription className="text-gray-400">
                    Revenue, volume, and customer growth trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      revenue: { label: "Revenue", color: "#22c55e" },
                      volume: { label: "Volume", color: "#007AFF" },
                      customers: { label: "Customers", color: "#f97316" },
                    }}
                    className="h-96"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mockData.monthlyTrends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="month" stroke="#9CA3AF" />
                        <YAxis yAxisId="left" stroke="#9CA3AF" />
                        <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
                        <ChartTooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
                                  <p className="text-white font-medium">{label}</p>
                                  {payload.map((entry, index) => (
                                    <p key={index} style={{ color: entry.color }}>
                                      {entry.name}: {
                                        entry.dataKey === 'revenue' ? formatCurrency(entry.value as number) :
                                          entry.dataKey === 'volume' ? formatCurrency(entry.value as number) :
                                            entry.value
                                      }
                                    </p>
                                  ))}
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="revenue"
                          stroke="#22c55e"
                          strokeWidth={3}
                          dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="volume"
                          stroke="#007AFF"
                          strokeWidth={3}
                          dot={{ fill: '#007AFF', strokeWidth: 2, r: 4 }}
                        />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="customers"
                          stroke="#f97316"
                          strokeWidth={3}
                          dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="conversion" className="space-y-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Conversion Funnel Analysis</CardTitle>
                  <CardDescription className="text-gray-400">
                    Track customer journey from lead to disbursal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {mockData.conversionFunnel.map((stage, index) => (
                      <motion.div
                        key={stage.stage}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="relative"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue to-cyan-500 rounded-full flex items-center justify-center text-dark font-bold text-sm">
                              {index + 1}
                            </div>
                            <span className="text-white font-medium">{stage.stage}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-white font-semibold">{stage.count.toLocaleString()}</span>
                            <span className="text-gray-400 ml-2">({stage.percentage}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-4 mb-2">
                          <motion.div
                            className="bg-gradient-to-r from-blue to-cyan-500 h-4 rounded-full flex items-center justify-end pr-2"
                            initial={{ width: 0 }}
                            animate={{ width: `${stage.percentage}%` }}
                            transition={{ duration: 1, delay: index * 0.2 }}
                          >
                            <span className="text-dark text-xs font-semibold">
                              {stage.percentage}%
                            </span>
                          </motion.div>
                        </div>
                        {index < mockData.conversionFunnel.length - 1 && (
                          <div className="text-center mt-2">
                            <Badge variant="outline" className="border-gray-600 text-gray-400">
                              {((mockData.conversionFunnel[index + 1].count / stage.count) * 100).toFixed(1)}% conversion
                            </Badge>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
  )
}
