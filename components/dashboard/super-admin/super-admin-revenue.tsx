"use client"

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DollarSign, TrendingUp, Calendar, Download, Filter, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { CardSkeleton, ChartSkeleton } from '@/components/ui/loading-skeleton'
import { ExportButton } from "@/components/ui/button-to-export"
import { InvoiceButton } from "@/components/ui/button-for-invoice"
import {
  exportRevenueReport,
  type TimeRange,
  filterByTimeRange,
  generateInvoicePDF,
  type Invoice,
} from "@/lib/exporter"
import { useToast } from "@/hooks/use-toast"

const mockData = {
  metrics: {
    totalRevenue: 2450000,
    monthlyGrowth: 18.5,
    avgCommissionRate: 1.2,
    topLenderRevenue: 450000
  },
  revenueData: [
    { month: 'Jan', revenue: 185000, transactions: 1850, avgTicket: 100 },
    { month: 'Feb', revenue: 220000, transactions: 2100, avgTicket: 105 },
    { month: 'Mar', revenue: 280000, transactions: 2600, avgTicket: 108 },
    { month: 'Apr', revenue: 195000, transactions: 1900, avgTicket: 103 },
    { month: 'May', revenue: 315000, transactions: 2900, avgTicket: 109 },
    { month: 'Jun', revenue: 380000, transactions: 3400, avgTicket: 112 },
    { month: 'Jul', revenue: 425000, transactions: 3700, avgTicket: 115 },
    { month: 'Aug', revenue: 390000, transactions: 3300, avgTicket: 118 },
    { month: 'Sep', revenue: 460000, transactions: 3800, avgTicket: 121 },
    { month: 'Oct', revenue: 520000, transactions: 4200, avgTicket: 124 },
    { month: 'Nov', revenue: 485000, transactions: 3900, avgTicket: 124 },
    { month: 'Dec', revenue: 590000, transactions: 4600, avgTicket: 128 }
  ],
  lenderRevenue: [
    { name: 'HDFC Bank', revenue: 450000, percentage: 18.4, growth: 12.5 },
    { name: 'ICICI Bank', revenue: 380000, percentage: 15.5, growth: 8.2 },
    { name: 'Bajaj Finance', revenue: 320000, percentage: 13.1, growth: 15.8 },
    { name: 'Axis Bank', revenue: 280000, percentage: 11.4, growth: -2.1 },
    { name: 'Kotak Bank', revenue: 245000, percentage: 10.0, growth: 22.3 },
    { name: 'IDFC First', revenue: 195000, percentage: 8.0, growth: 5.7 },
    { name: 'Others', revenue: 580000, percentage: 23.6, growth: 9.8 }
  ],
  recentTransactions: [
    { id: 'TXN001', lender: 'HDFC Bank', aggregator: 'F2 Fintech', amount: 2500000, commission: 25000, date: '2025-01-20', status: 'Completed' },
    { id: 'TXN002', lender: 'ICICI Bank', aggregator: 'LoanKart', amount: 1800000, commission: 18000, date: '2025-01-20', status: 'Completed' },
    { id: 'TXN003', lender: 'Bajaj Finance', aggregator: 'QuickLoan DSA', amount: 950000, commission: 9500, date: '2025-01-19', status: 'Pending' },
    { id: 'TXN004', lender: 'Axis Bank', aggregator: 'FinanceHub', amount: 3200000, commission: 32000, date: '2025-01-19', status: 'Completed' },
    { id: 'TXN005', lender: 'Kotak Bank', aggregator: 'F2 Fintech', amount: 1200000, commission: 12000, date: '2025-01-18', status: 'Completed' }
  ]
}

export function SuperAdminRevenue() {
  const [timeRange, setTimeRange] = useState<TimeRange>('12m')
  const [selectedMetric, setSelectedMetric] = useState<'transactions' | 'revenue' | 'avgTicket'>('revenue')
  const [chartLoading, setChartLoading] = useState(true)
  const [cardsLoading, setCardsLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [invoicing, setInvoicing] = useState(false)

  const chartRef = useRef<HTMLDivElement | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const t = setTimeout(() => {
      setChartLoading(false)
      setCardsLoading(false)
    }, 2000)
    return () => clearTimeout(t)
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
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

  async function handleGenerateInvoice() {
    try {
      setInvoicing(true)
      // Build invoice from current time range and transactions (commission items)
      const months = filterByTimeRange(mockData.revenueData, timeRange).map((d) => d.month)
      const transactionsForRange = mockData.recentTransactions // Example: using latest sample. Replace with filtered server data if available.

      const items: Invoice["items"] = transactionsForRange.map((t) => ({
        description: `Commission ${t.id} — ${t.lender} → ${t.aggregator} (${t.date})`,
        quantity: 1,
        unitPrice: t.commission,
      }))

      const invoice: Invoice = {
        invoiceNo: `REV-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10),
        seller: {
          name: "LendGrid Platform",
          address: "BKC, Mumbai, Maharashtra, IN",
          email: "billing@lendgrid.example",
        },
        buyer: {
          name: "Acme Finance Pvt Ltd",
          address: "Bangalore, Karnataka, IN",
          email: "accounts@acme.example",
        },
        items,
        taxRatePct: 18,
        notes: `Automated invoice for period: ${months[0]} – ${months[months.length - 1]}.`,
        currency: "INR",
      }

      await generateInvoicePDF(invoice, `invoice-${invoice.invoiceNo}`)
      toast({ title: "Invoice generated", description: `Saved PDF invoice ${invoice.invoiceNo}.` })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Invoice failed", description: err?.message ?? "Something went wrong." })
    } finally {
      setInvoicing(false)
    }
  }

  const MetricCard = ({ title, value, change, icon: Icon, isPositive }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gray-800/50 border-gray-700 hover:border-gold/50 transition-all duration-300 hover:shadow-lg hover:shadow-gold/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">{title}</p>
              <p className="text-2xl font-bold text-white mt-2">{value}</p>
              <div className="flex items-center mt-2">
                {isPositive ? (
                  <ArrowUpRight className="w-4 h-4 text-green-400 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-400 mr-1" />
                )}
                <span className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {Math.abs(change)}%
                </span>
                <span className="text-sm text-gray-400 ml-1">vs last month</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-gold/20 rounded-lg flex items-center justify-center">
              <Icon className="w-6 h-6 text-gold" />
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
            <h1 className="text-3xl font-bold text-white">Platform Revenue</h1>
            <p className="text-gray-400 mt-1">Track and analyze platform commission revenue streams</p>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={timeRange} onValueChange={(val) => setTimeRange(val as TimeRange)}>
              <SelectTrigger className="w-32 bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">1 Month</SelectItem>
                <SelectItem value="3m">3 Months</SelectItem>
                <SelectItem value="6m">6 Months</SelectItem>
                <SelectItem value="12m">12 Months</SelectItem>
              </SelectContent>
            </Select>
            <InvoiceButton onGenerate={handleGenerateInvoice} disabled={invoicing} />
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
              title="Total Platform Revenue"
              value={formatCurrency(mockData.metrics.totalRevenue)}
              change={mockData.metrics.monthlyGrowth}
              icon={DollarSign}
              isPositive={true}
            />
            <MetricCard
              title="Monthly Growth Rate"
              value={`${mockData.metrics.monthlyGrowth}%`}
              change={5.2}
              icon={TrendingUp}
              isPositive={true}
            />
            <MetricCard
              title="Avg Commission Rate"
              value={`${mockData.metrics.avgCommissionRate}%`}
              change={0.3}
              icon={Calendar}
              isPositive={true}
            />
            <MetricCard
              title="Top Lender Revenue"
              value={formatCurrency(mockData.metrics.topLenderRevenue)}
              change={12.5}
              icon={DollarSign}
              isPositive={true}
            />
          </div>
        )}
        {/* Revenue Trend Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Revenue Trend Analysis</CardTitle>
                  <CardDescription className="text-gray-400">
                    Monthly platform revenue and transaction metrics
                  </CardDescription>
                </div>
                <Select value={selectedMetric} onValueChange={(val) => setSelectedMetric(val as any)}>
                  <SelectTrigger className="w-40 bg-gray-900 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="transactions">Transactions</SelectItem>
                    <SelectItem value="avgTicket">Avg Ticket Size</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {chartLoading ? (
                <ChartSkeleton height={384} />
              ) : (
                <div className="h-96 w-full" ref={chartRef}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockData.revenueData}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FFD700" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#FFD700" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                        formatter={(value, name) => [
                          selectedMetric === 'revenue' ? formatCurrency(value as number) : value,
                          selectedMetric === 'revenue' ? 'Revenue' : selectedMetric === 'transactions' ? 'Transactions' : 'Avg Ticket Size'
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey={selectedMetric}
                        stroke="#FFD700"
                        strokeWidth={3}
                        fill="url(#revenueGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Revenue by Lender & Recent Transactions */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Revenue by Lender */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {cardsLoading ? (
              <CardSkeleton headerLines={2} bodyHeight={456} />
            ) : (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Revenue by Lender</CardTitle>
                  <CardDescription className="text-gray-400">
                    Top performing lenders by commission revenue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockData.lenderRevenue.map((lender, index) => (
                      <motion.div
                        key={lender.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue to-cyan-500 rounded-lg flex items-center justify-center text-dark font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{lender.name}</p>
                            <p className="text-sm text-gray-400">{lender.percentage}% of total</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold">{formatCurrency(lender.revenue)}</p>
                          <div className="flex items-center">
                            {lender.growth > 0 ? (
                              <ArrowUpRight className="w-3 h-3 text-green-400 mr-1" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3 text-red-400 mr-1" />
                            )}
                            <span className={`text-xs ${lender.growth > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {Math.abs(lender.growth)}%
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Recent High-Value Transactions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {cardsLoading ? (
              <CardSkeleton headerLines={2} bodyHeight={416} />
            ) : (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Recent High-Value Transactions</CardTitle>
                  <CardDescription className="text-gray-400">
                    Latest commission-generating transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockData.recentTransactions.map((transaction, index) => (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-white">{transaction.id}</p>
                          <p className="text-sm text-gray-400">{transaction.lender} → {transaction.aggregator}</p>
                          <p className="text-xs text-gray-500">{transaction.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold">{formatCurrency(transaction.amount)}</p>
                          <p className="text-gold text-sm">+{formatCurrency(transaction.commission)}</p>
                          <Badge
                            variant={transaction.status === 'Completed' ? 'default' : 'secondary'}
                            className={transaction.status === 'Completed' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}
                          >
                            {transaction.status}
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
  )
}
