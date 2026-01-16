"use client"

import { useEffect, useRef, useState, useMemo } from 'react'
import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, Calendar, Download, Search, Filter, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CardSkeleton, ChartSkeleton } from '@/components/ui/loading-skeleton'
import { useAuth } from '@/lib/auth'
import { CommissionStatus } from '@/lib/api-types'
import { ExportButton } from '@/components/ui/button-to-export'
import { TablePagination } from '@/components/ui/pagination'
import { useToast } from "@/hooks/use-toast"
import { useCommissionTransactions } from '@/hooks/use-commissions'

export function AggregatorCommission() {
  const { user } = useAuth('aggregator_admin')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<CommissionStatus | ''>('')
  const [filterProductType, setFilterProductType] = useState('')
  const [dateRange, setDateRange] = useState('30d')
  const [exporting, setExporting] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const chartRef = useRef<HTMLDivElement | null>(null)
  const tableTopRef = useRef<HTMLDivElement | null>(null)
  const { theme } = useTheme()
  const { toast } = useToast()

  // Fetch commission transactions
  const {
    data: transactionsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useCommissionTransactions({
    page,
    limit: pageSize,
    filters: {
      aggregatorId: user?._id,
      status: filterStatus || undefined,
      productType: filterProductType || undefined,
    },
  })

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [filterStatus, filterProductType])

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

  // Calculate metrics from actual data
  const metrics = useMemo(() => {
    if (!transactionsData?.data) {
      return {
        totalEarned: 0,
        pendingAmount: 0,
        paidAmount: 0,
        avgCommissionRate: 0
      }
    }

    const transactions = transactionsData.data

    const totalEarned = transactions.reduce((sum, t) => sum + t.commissionAmount, 0)
    const pendingAmount = transactions
      .filter(t => t.status === CommissionStatus.CALCULATED || t.status === CommissionStatus.PENDING)
      .reduce((sum, t) => sum + t.commissionAmount, 0)
    const paidAmount = transactions
      .filter(t => t.status === CommissionStatus.PAID)
      .reduce((sum, t) => sum + t.commissionAmount, 0)
    const avgRate = transactions.length > 0
      ? transactions.reduce((sum, t) => sum + t.commissionRate, 0) / transactions.length
      : 0

    return {
      totalEarned,
      pendingAmount,
      paidAmount,
      avgCommissionRate: avgRate
    }
  }, [transactionsData])

  // Generate commission trends data by month
  const commissionTrends = useMemo(() => {
    if (!transactionsData?.data) return []

    const monthlyData: Record<string, { earned: number; paid: number; pending: number }> = {}

    transactionsData.data.forEach(transaction => {
      const date = new Date(transaction.calculatedAt)
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { earned: 0, paid: 0, pending: 0 }
      }

      monthlyData[monthKey].earned += transaction.commissionAmount

      if (transaction.status === CommissionStatus.PAID) {
        monthlyData[monthKey].paid += transaction.commissionAmount
      } else {
        monthlyData[monthKey].pending += transaction.commissionAmount
      }
    })

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month: month.split(' ')[0],
        ...data
      }))
      .slice(-6)
  }, [transactionsData])

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

  // EXPORT FUNCTIONALITY
  const exportToExcel = () => {
    if (!transactionsData?.data || transactionsData.data.length === 0) {
      toast({
        variant: "destructive",
        title: "No data to export",
        description: "There are no commission transactions to export."
      })
      return
    }

    // Prepare data for Excel
    const excelData = transactionsData.data.map((transaction, index) => ({
      'S.No': index + 1,
      'Ticket ID': transaction.ticketId,
      'Transaction ID': transaction.id,
      'Lender/Provider': transaction.provider || 'N/A',
      'Loan Type': transaction.productType || 'N/A',
      'Aggregator Rank': transaction.aggregatorRank || 'N/A',
      'Loan Amount (₹)': transaction.disbursedAmount,
      'Commission Rate (%)': transaction.commissionRate,
      'Commission Type': transaction.commissionType,
      'Commission Amount (₹)': transaction.commissionAmount,
      'Status': getStatusLabel(transaction.status),
      'Calculated Date': formatDate(transaction.calculatedAt),
      'Approved Date': formatDate(transaction.approvedAt),
      'Paid Date': formatDate(transaction.paidAt),
      'Remarks': transaction.remarks || '-',
      'Created At': formatDate(transaction.createdAt),
      'Updated At': formatDate(transaction.updatedAt),
    }))

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    // Set column widths
    const colWidths = [
      { wch: 6 },   // S.No
      { wch: 12 },  // Ticket ID
      { wch: 25 },  // Transaction ID
      { wch: 20 },  // Lender
      { wch: 15 },  // Loan Type
      { wch: 15 },  // Aggregator Rank
      { wch: 15 },  // Loan Amount
      { wch: 15 },  // Commission Rate
      { wch: 15 },  // Commission Type
      { wch: 18 },  // Commission Amount
      { wch: 12 },  // Status
      { wch: 15 },  // Calculated Date
      { wch: 15 },  // Approved Date
      { wch: 15 },  // Paid Date
      { wch: 30 },  // Remarks
      { wch: 15 },  // Created At
      { wch: 15 },  // Updated At
    ]
    ws['!cols'] = colWidths

    // Add summary sheet
    const summaryData = [
      { Metric: 'Total Commission Earned', Value: formatCurrency(metrics.totalEarned) },
      { Metric: 'Pending Payouts', Value: formatCurrency(metrics.pendingAmount) },
      { Metric: 'Paid Amount', Value: formatCurrency(metrics.paidAmount) },
      { Metric: 'Average Commission Rate', Value: `${metrics.avgCommissionRate.toFixed(2)}%` },
      { Metric: 'Total Transactions', Value: transactionsData.total },
      { Metric: 'Report Generated', Value: new Date().toLocaleString('en-IN') },
      { Metric: 'Exported By', Value: user?.username || user?.email || 'N/A' },
    ]
    const wsSummary = XLSX.utils.json_to_sheet(summaryData)
    wsSummary['!cols'] = [{ wch: 30 }, { wch: 25 }]

    // Add worksheets to workbook
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions')

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const fileName = `Commission_Report_${timestamp}.xlsx`

    // Save file
    XLSX.writeFile(wb, fileName)
  }

  const exportToPDF = () => {
    if (!transactionsData?.data || transactionsData.data.length === 0) {
      toast({
        variant: "destructive",
        title: "No data to export",
        description: "There are no commission transactions to export."
      })
      return
    }

    const doc = new jsPDF('landscape')
    const pageWidth = doc.internal.pageSize.getWidth()

    // Add header
    doc.setFontSize(18)
    doc.setTextColor(0, 102, 204)
    doc.text('Commission Report', pageWidth / 2, 15, { align: 'center' })

    // Add summary information
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 25)
    doc.text(`Exported By: ${user?.username || user?.email || 'N/A'}`, 14, 30)

    // Add metrics summary
    doc.setFontSize(12)
    doc.setTextColor(0, 102, 204)
    doc.text('Summary', 14, 40)

    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    const summaryY = 45
    doc.text(`Total Commission Earned: ${formatCurrency(metrics.totalEarned)}`, 14, summaryY)
    doc.text(`Pending Payouts: ${formatCurrency(metrics.pendingAmount)}`, 100, summaryY)
    doc.text(`Paid Amount: ${formatCurrency(metrics.paidAmount)}`, 180, summaryY)
    doc.text(`Avg Commission Rate: ${metrics.avgCommissionRate.toFixed(2)}%`, 14, summaryY + 5)
    doc.text(`Total Transactions: ${transactionsData.total}`, 100, summaryY + 5)

    // Prepare table data
    const tableData = transactionsData.data.map((transaction, index) => [
      index + 1,
      transaction.ticketId,
      transaction.provider || 'N/A',
      transaction.productType || 'N/A',
      formatCurrency(transaction.disbursedAmount),
      `${transaction.commissionRate}%`,
      formatCurrency(transaction.commissionAmount),
      getStatusLabel(transaction.status),
      formatDate(transaction.calculatedAt),
      formatDate(transaction.paidAt),
    ])

    // Add table
    autoTable(doc, {
      startY: summaryY + 15,
      head: [[
        'S.No',
        'Ticket ID',
        'Lender',
        'Loan Type',
        'Loan Amount',
        'Rate',
        'Commission',
        'Status',
        'Calculated',
        'Paid Date'
      ]],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 102, 204],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [0, 0, 0],
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 10 },  // S.No
        1: { cellWidth: 18 },  // Ticket ID
        2: { cellWidth: 30 },  // Lender
        3: { cellWidth: 25 },  // Loan Type
        4: { cellWidth: 25 },  // Loan Amount
        5: { cellWidth: 15 },  // Rate
        6: { cellWidth: 25 },  // Commission
        7: { cellWidth: 20 },  // Status
        8: { cellWidth: 22 },  // Calculated
        9: { cellWidth: 22 },  // Paid Date
      },
      margin: { left: 14, right: 14 },
    })

    // Add footer with page numbers
    const pageCount = doc.internal.pages.length - 1
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(128, 128, 128)
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      )
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const fileName = `Commission_Report_${timestamp}.pdf`

    // Save file
    doc.save(fileName)
  }

  async function handleExport(format: "pdf" | "xlsx") {
    try {
      setExporting(true)
      if (format === "xlsx") {
        exportToExcel()
      } else {
        exportToPDF()
      }

      toast({
        title: "Export complete",
        description: `Saved ${format.toUpperCase()} report successfully.`
      })
    } catch (err: any) {
      console.error('Export error:', err)
      toast({
        variant: "destructive",
        title: "Export failed",
        description: err?.message ?? "Something went wrong."
      })
    } finally {
      setExporting(false)
    }
  }

  const filteredCommissions = useMemo(() => {
    if (!transactionsData?.data) return []

    return transactionsData.data.filter(commission => {
      const matchesSearch =
        commission.ticketId.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (commission.provider || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (commission.productType || '').toLowerCase().includes(searchTerm.toLowerCase())

      return matchesSearch
    })
  }, [transactionsData, searchTerm])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(1)
    tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const MetricCard = ({ index, title, value, icon: Icon, color, subtitle, trend }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className="professional-card hover-lift hover:border-gold/50 transition-all duration-300 hover:shadow-lg hover:shadow-gold/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold text-foreground mt-2">{value}</p>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
              )}
              {trend && (
                <p className="text-sm text-success mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {trend}
                </p>
              )}
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-opacity-20 ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  if (isError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className=" text-foreground text-lg">Failed to load commission data</p>
          <p className=" text-muted-foreground mt-2">{error?.message || 'Something went wrong'}</p>
          <Button onClick={() => refetch()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
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
          <h1 className="text-3xl font-bold text-foreground">Commission Tracking</h1>
          <p className=" text-muted-foreground mt-1">Monitor your earnings and payout status</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32 bg-card border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <ExportButton onExport={handleExport} disabled={exporting || isLoading} />
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
            index={0}
            title="Total Commission Earned"
            value={formatCurrency(metrics.totalEarned)}
            icon={DollarSign}
            color="metric-card-accent"
          // trend="+12.5% from last month"
          />
          <MetricCard
            index={1}
            title="Pending Payouts"
            value={formatCurrency(metrics.pendingAmount)}
            icon={Clock}
            color="metric-card-warning"
            subtitle="Awaiting payment"
          />
          <MetricCard
            index={2}
            title="Paid Amount"
            value={formatCurrency(metrics.paidAmount)}
            icon={CheckCircle}
            color="metric-card-success"
            subtitle="Successfully received"
          />
          <MetricCard
            index={3}
            title="Avg Commission Rate"
            value={`${metrics.avgCommissionRate.toFixed(2)}%`}
            icon={TrendingUp}
            color="metric-card-primary"
            subtitle="Across all lenders"
          />
        </div>
      )}

      {/* Commission Analytics */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="bg-card border-border space-x-3">
          <TabsTrigger value="trends" className="data-[state=active]:bg-gradient-to-r from-blue to-cyan-500 data-[state=active]:text-dark">
            Commission Trends
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
            <Card className="professional-card">
              <CardHeader>
                <CardTitle className="text-foreground">Commission Trends</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Monthly commission earnings and payout status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <ChartSkeleton height={354} />
                ) : commissionTrends.length === 0 ? (
                  <div className="h-96 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No commission data available yet</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-96 w-full" ref={chartRef}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={commissionTrends}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                        <XAxis dataKey="month" stroke={theme === 'dark' ? '#9CA3AF' : '#6b7280'} />
                        <YAxis stroke={theme === 'dark' ? '#9CA3AF' : '#6b7280'} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: theme === 'dark' ? '#1F2937' : '#ffffff',
                            border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
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

        <TabsContent value="history">
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
                    <Input
                      placeholder="Product type..."
                      value={filterProductType}
                      onChange={(e) => setFilterProductType(e.target.value)}
                      className="professional-input w-40"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div ref={tableTopRef} />
                {isLoading ? (
                  <div className="space-y-4">
                    <CardSkeleton headerLines={1} bodyHeight={60} />
                    <CardSkeleton headerLines={1} bodyHeight={60} />
                    <CardSkeleton headerLines={1} bodyHeight={60} />
                  </div>
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
                            <TableHead>Paid Date</TableHead>
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
                                <TableCell>{formatDate(commission.paidAt)}</TableCell>
                              </motion.tr>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    <TablePagination
                      page={page}
                      pageSize={pageSize}
                      total={transactionsData?.total || 0}
                      onPageChange={handlePageChange}
                      onPageSizeChange={handlePageSizeChange}
                      className="mt-4"
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
