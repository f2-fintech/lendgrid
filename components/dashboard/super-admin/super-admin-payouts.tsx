"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FileText, Plus, Search, Eye, CheckCircle, XCircle, Clock, TrendingUp, CreditCard, AlertCircle, DollarSign } from 'lucide-react'
import { CardSkeleton, TableSkeleton } from '@/components/ui/loading-skeleton'
import { TablePagination } from '@/components/ui/pagination'

const mockData = {
  metrics: {
    totalPayouts: 156,
    pendingPayouts: 12,
    completedPayouts: 132,
    totalAmount: 8500000
  },
  payouts: [
    {
      id: 'PO001',
      recipientType: 'Aggregator',
      recipientName: 'FinTech Solutions Pvt Ltd',
      amount: 125000,
      commissionPeriod: 'Dec 2023',
      status: 'Completed',
      requestDate: '2025-01-01',
      processedDate: '2025-01-03',
      utrNumber: 'UTR123456789',
      paymentMethod: 'NEFT',
      description: 'Commission payout for December 2023'
    },
    {
      id: 'PO002',
      recipientType: 'Lender',
      recipientName: 'HDFC Bank',
      amount: 85000,
      commissionPeriod: 'Dec 2023',
      status: 'Pending',
      requestDate: '2025-01-02',
      processedDate: null,
      utrNumber: null,
      paymentMethod: 'RTGS',
      description: 'Commission settlement for December 2023'
    },
    {
      id: 'PO003',
      recipientType: 'Aggregator',
      recipientName: 'Loan Connect India',
      amount: 98000,
      commissionPeriod: 'Dec 2023',
      status: 'Processing',
      requestDate: '2025-01-01',
      processedDate: null,
      utrNumber: null,
      paymentMethod: 'IMPS',
      description: 'Monthly commission payout'
    },
    {
      id: 'PO004',
      recipientType: 'Lender',
      recipientName: 'ICICI Bank',
      amount: 67000,
      commissionPeriod: 'Dec 2023',
      status: 'Completed',
      requestDate: '2023-12-31',
      processedDate: '2025-01-02',
      utrNumber: 'UTR987654321',
      paymentMethod: 'NEFT',
      description: 'Year-end commission settlement'
    },
    {
      id: 'PO005',
      recipientType: 'Aggregator',
      recipientName: 'Credit Bridge Solutions',
      amount: 45000,
      commissionPeriod: 'Dec 2023',
      status: 'Failed',
      requestDate: '2025-01-01',
      processedDate: null,
      utrNumber: null,
      paymentMethod: 'RTGS',
      description: 'Commission payout - retry required'
    }
  ]
}

export function SuperAdminPayouts() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterRecipientType, setFilterRecipientType] = useState('')
  const [selectedPayout, setSelectedPayout] = useState<any>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isTableLoading, setIsTableLoading] = useState(true)
  const [cardsLoading, setCardsLoading] = useState(true)
  const tableTopRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setIsTableLoading(false)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-500/20 text-green-400'
      case 'Pending': return 'bg-orange-500/20 text-orange-400'
      case 'Processing': return 'bg-blue-500/20 text-blue-400'
      case 'Failed': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const filteredPayouts = useMemo(() => {
    return mockData.payouts.filter((payout) => {
      const matchesSearch = payout.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payout.id.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = !filterStatus || filterStatus === 'all' || payout.status === filterStatus
      const matchesRecipientType = !filterRecipientType || filterRecipientType === 'all' || payout.recipientType === filterRecipientType
      return matchesSearch && matchesStatus && matchesRecipientType
    })
  }, [searchTerm, filterStatus, filterRecipientType])

  const total = filteredPayouts.length
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredPayouts.slice(start, start + pageSize)
  }, [filteredPayouts, page, pageSize])

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

  const MetricCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gray-800/50 border-gray-700 hover:border-gold/50 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">{title}</p>
              <p className="text-2xl font-bold text-white mt-2">{value}</p>
              {subtitle && (
                <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
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
          <h1 className="text-3xl font-bold text-white">Global Payouts</h1>
          <p className="text-gray-400 mt-1">Manage commission payouts to aggregators and lenders</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue to-cyan-500 text-dark">
              <Plus className="w-4 h-4 mr-2" />
              Create Payout
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Create New Payout</DialogTitle>
              <DialogDescription className="text-gray-400">
                Process a new commission payout
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Recipient Type</Label>
                  <Select>
                    <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                      <SelectValue placeholder="Select recipient type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aggregator">Aggregator</SelectItem>
                      <SelectItem value="lender">Lender</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-300">Recipient</Label>
                  <Select>
                    <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fintech">FinTech Solutions Pvt Ltd</SelectItem>
                      <SelectItem value="loanconnect">Loan Connect India</SelectItem>
                      <SelectItem value="hdfc">HDFC Bank</SelectItem>
                      <SelectItem value="icici">ICICI Bank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Amount (₹)</Label>
                  <Input className="bg-gray-900 border-gray-600 text-white" placeholder="125000" />
                </div>
                <div>
                  <Label className="text-gray-300">Commission Period</Label>
                  <Input className="bg-gray-900 border-gray-600 text-white" placeholder="Jan 2025" />
                </div>
              </div>
              <div>
                <Label className="text-gray-300">Payment Method</Label>
                <Select>
                  <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neft">NEFT</SelectItem>
                    <SelectItem value="rtgs">RTGS</SelectItem>
                    <SelectItem value="imps">IMPS</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300">Description</Label>
                <Textarea
                  className="bg-gray-900 border-gray-600 text-white"
                  placeholder="Enter payout description"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-gradient-to-r from-blue to-cyan-500 text-dark">
                  Create Payout
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
            title="Total Payouts"
            value={mockData.metrics.totalPayouts}
            icon={FileText}
            color="bg-blue/20 text-blue"
            subtitle="All time"
          />
          <MetricCard
            title="Pending Payouts"
            value={mockData.metrics.pendingPayouts}
            icon={Clock}
            color="bg-orange-500/20 text-orange-400"
            subtitle="Awaiting processing"
          />
          <MetricCard
            title="Completed Payouts"
            value={mockData.metrics.completedPayouts}
            icon={CheckCircle}
            color="bg-green-500/20 text-green-400"
            subtitle="Successfully processed"
          />
          <MetricCard
            title="Total Amount"
            value={formatCurrency(mockData.metrics.totalAmount)}
            icon={DollarSign}
            color="bg-gold/20 text-gold"
            subtitle="Total disbursed"
          />
        </div>
      )}

      {/* Payouts Table */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">All Payouts</CardTitle>
                <CardDescription className="text-gray-400">
                  Track and manage all commission payouts
                </CardDescription>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search payouts..."
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
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Processing">Processing</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterRecipientType} onValueChange={setFilterRecipientType}>
                  <SelectTrigger className="w-36 bg-gray-900 border-gray-600 text-white">
                    <SelectValue placeholder="Recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Recipients</SelectItem>
                    <SelectItem value="Aggregator">Aggregator</SelectItem>
                    <SelectItem value="Lender">Lender</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={tableTopRef} />
            <div className="overflow-x-auto">
              {isTableLoading ? (
                <TableSkeleton columns={8} rows={pageSize} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">Payout ID</TableHead>
                      <TableHead className="text-gray-300">Recipient</TableHead>
                      <TableHead className="text-gray-300">Amount</TableHead>
                      <TableHead className="text-gray-300">Period</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Request Date</TableHead>
                      <TableHead className="text-gray-300">Payment Method</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((payout, index) => (
                      <motion.tr
                        key={payout.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border-gray-700 hover:bg-gray-800/50"
                      >
                        <TableCell>
                          <p className="text-white font-medium">{payout.id}</p>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-white font-medium">{payout.recipientName}</p>
                            <p className="text-sm text-gray-400">{payout.recipientType}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-white font-semibold">
                          {formatCurrency(payout.amount)}
                        </TableCell>
                        <TableCell className="text-gray-300">{payout.commissionPeriod}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(payout.status)}>
                            {payout.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">{payout.requestDate}</TableCell>
                        <TableCell className="text-gray-300">{payout.paymentMethod}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPayout(payout)
                                setIsViewDialogOpen(true)
                              }}
                              className="text-blue hover:text-white hover:bg-gray-700"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {payout.status === 'Pending' && (
                              <>
                                <Button variant="ghost" size="sm" className="text-green-400 hover:text-white hover:bg-gray-700">
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-400 hover:text-white hover:bg-gray-700">
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </motion.tr>
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
      </motion.div>

      {/* View Payout Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Payout Details</DialogTitle>
            <DialogDescription className="text-gray-400">
              Complete information about the selected payout
            </DialogDescription>
          </DialogHeader>
          {selectedPayout && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-gray-300">Payout ID</Label>
                  <p className="text-white font-semibold mt-1">{selectedPayout.id}</p>
                </div>
                <div>
                  <Label className="text-gray-300">Status</Label>
                  <Badge className={`${getStatusColor(selectedPayout.status)} mt-1`}>
                    {selectedPayout.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-gray-300">Recipient Name</Label>
                  <p className="text-white font-semibold mt-1">{selectedPayout.recipientName}</p>
                </div>
                <div>
                  <Label className="text-gray-300">Recipient Type</Label>
                  <p className="text-white font-semibold mt-1">{selectedPayout.recipientType}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-gray-300">Amount</Label>
                  <p className="text-white font-semibold mt-1">{formatCurrency(selectedPayout.amount)}</p>
                </div>
                <div>
                  <Label className="text-gray-300">Commission Period</Label>
                  <p className="text-white font-semibold mt-1">{selectedPayout.commissionPeriod}</p>
                </div>
                <div>
                  <Label className="text-gray-300">Payment Method</Label>
                  <p className="text-white font-semibold mt-1">{selectedPayout.paymentMethod}</p>
                </div>
                <div>
                  <Label className="text-gray-300">Request Date</Label>
                  <p className="text-white font-semibold mt-1">{selectedPayout.requestDate}</p>
                </div>
              </div>

              {selectedPayout.processedDate && (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-gray-300">Processed Date</Label>
                    <p className="text-white font-semibold mt-1">{selectedPayout.processedDate}</p>
                  </div>
                  <div>
                    <Label className="text-gray-300">UTR Number</Label>
                    <p className="text-white font-semibold mt-1">{selectedPayout.utrNumber || 'N/A'}</p>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-gray-300">Description</Label>
                <p className="text-white font-semibold mt-1">{selectedPayout.description}</p>
              </div>

              {selectedPayout.status === 'Pending' && (
                <div className="flex items-center space-x-4 pt-4 border-t border-gray-700">
                  <Button className="bg-green-500 hover:bg-green-600 text-white">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Payout
                  </Button>
                  <Button variant="outline" className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white">
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Payout
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
