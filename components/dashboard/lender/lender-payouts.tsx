"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Search, Filter, Download, Send, Clock, CheckCircle, XCircle, AlertCircle, DollarSign, TrendingUp, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { CardSkeleton } from '@/components/ui/loading-skeleton'

const mockPayouts = [
  {
    id: 'PO-2025-001',
    aggregatorName: 'FinanceHub',
    amount: 125000,
    commissionAmount: 3125,
    applications: 25,
    status: 'completed',
    requestDate: '2025-01-15',
    processedDate: '2025-01-16',
    utrNumber: 'UTR123456789',
    paymentMethod: 'NEFT'
  },
  {
    id: 'PO-2025-002',
    aggregatorName: 'LoanConnect',
    amount: 89000,
    commissionAmount: 2225,
    applications: 18,
    status: 'pending',
    requestDate: '2025-01-18',
    processedDate: null,
    utrNumber: null,
    paymentMethod: 'RTGS'
  },
  {
    id: 'PO-2025-003',
    aggregatorName: 'CreditBridge',
    amount: 156000,
    commissionAmount: 3900,
    applications: 31,
    status: 'processing',
    requestDate: '2025-01-20',
    processedDate: null,
    utrNumber: null,
    paymentMethod: 'IMPS'
  },
  {
    id: 'PO-2025-004',
    aggregatorName: 'MoneyLink',
    amount: 67000,
    commissionAmount: 1675,
    applications: 13,
    status: 'failed',
    requestDate: '2025-01-22',
    processedDate: null,
    utrNumber: null,
    paymentMethod: 'NEFT'
  },
  {
    id: 'PO-2025-005',
    aggregatorName: 'QuickLoan',
    amount: 198000,
    commissionAmount: 4950,
    applications: 39,
    status: 'completed',
    requestDate: '2025-01-25',
    processedDate: '2025-01-26',
    utrNumber: 'UTR987654321',
    paymentMethod: 'RTGS'
  }
]

const upcomingPayouts = [
  {
    id: 'UP-2025-001',
    aggregatorName: 'FinanceHub',
    amount: 145000,
    commissionAmount: 3625,
    applications: 29,
    dueDate: '2025-02-01',
    estimatedAmount: 145000
  },
  {
    id: 'UP-2025-002',
    aggregatorName: 'LoanConnect',
    amount: 112000,
    commissionAmount: 2800,
    applications: 22,
    dueDate: '2025-02-03',
    estimatedAmount: 112000
  },
  {
    id: 'UP-2025-003',
    aggregatorName: 'CreditBridge',
    amount: 178000,
    commissionAmount: 4450,
    applications: 35,
    dueDate: '2025-02-05',
    estimatedAmount: 178000
  }
]

export function LenderPayouts() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false)
  const [selectedPayout, setSelectedPayout] = useState(null)
  const [cardsLoading, setCardsLoading] = useState(true)

  const filteredPayouts = mockPayouts.filter(payout => {
    const matchesSearch = payout.aggregatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || payout.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />
      case 'processing': return <AlertCircle className="w-4 h-4 text-blue" />
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400'
      case 'pending': return 'bg-yellow-500/20 text-yellow-400'
      case 'processing': return 'bg-blue/20 text-blue'
      case 'failed': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const totalPayouts = mockPayouts.length
  const completedPayouts = mockPayouts.filter(p => p.status === 'completed').length
  const pendingPayouts = mockPayouts.filter(p => p.status === 'pending').length
  const totalAmount = mockPayouts.reduce((sum, p) => sum + p.amount, 0)

  useEffect(() => {
    const t = setTimeout(() => {
      setCardsLoading(false)
    }, 2000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-white">Commission Payouts</h1>
            <p className="text-gray-400 mt-1">Manage and track commission payments to aggregators</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue to-cyan-500  hover:to-blue/80 text-dark">
                  <Send className="w-4 h-4 mr-2" />
                  Process Payout
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-800 text-white">
                <DialogHeader>
                  <DialogTitle>Process Manual Payout</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Process a manual commission payout to an aggregator
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="aggregator">Select Aggregator</Label>
                    <Select>
                      <SelectTrigger className="bg-gray-800 border-gray-700">
                        <SelectValue placeholder="Choose aggregator" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="financehub">FinanceHub</SelectItem>
                        <SelectItem value="loanconnect">LoanConnect</SelectItem>
                        <SelectItem value="creditbridge">CreditBridge</SelectItem>
                        <SelectItem value="moneylink">MoneyLink</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount (₹)</Label>
                      <Input id="amount" type="number" placeholder="125000" className="bg-gray-800 border-gray-700" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="method">Payment Method</Label>
                      <Select>
                        <SelectTrigger className="bg-gray-800 border-gray-700">
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="neft">NEFT</SelectItem>
                          <SelectItem value="rtgs">RTGS</SelectItem>
                          <SelectItem value="imps">IMPS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="remarks">Remarks</Label>
                    <Textarea id="remarks" placeholder="Add any remarks..." className="bg-gray-800 border-gray-700" />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsProcessDialogOpen(false)}>Cancel</Button>
                  <Button className="bg-gradient-to-r from-blue to-cyan-500 text-dark">Process Payout</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {cardsLoading ? (
            <CardSkeleton headerLines={2} bodyHeight={16} />
          ) : (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Payouts</p>
                    <p className="text-2xl font-bold text-white">{totalPayouts}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue" />
                </div>

              </CardContent>
            </Card>
          )}

          {cardsLoading ? (
            <CardSkeleton headerLines={2} bodyHeight={16} />
          ) : (
            <Card className="bg-gray-900/50 border-gray-800">

              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Completed</p>
                    <p className="text-2xl font-bold text-white">{completedPayouts}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>

            </Card>
          )}

          {cardsLoading ? (
            <CardSkeleton headerLines={2} bodyHeight={16} />
          ) : (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Pending</p>
                    <p className="text-2xl font-bold text-white">{pendingPayouts}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>

            </Card>
          )}
          {cardsLoading ? (
            <CardSkeleton headerLines={2} bodyHeight={16} />
          ) : (
            <Card className="bg-gray-900/50 border-gray-800">

              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Amount</p>
                    <p className="text-2xl font-bold text-white">₹{(totalAmount / 100000).toFixed(1)}L</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-gold" />
                </div>
              </CardContent>

            </Card>
          )}
        </motion.div>

        {/* Payout Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="history" className="space-y-6">
            <TabsList className="bg-gray-900/50 border-gray-800 space-x-3">
              <TabsTrigger value="history" className="text-white data-[state=active]:bg-gray-800 bg-gradient-to-r from-blue to-cyan-500 ">Transaction History</TabsTrigger>
              <TabsTrigger value="upcoming" className="text-white data-[state=active]:bg-gray-800 bg-gradient-to-r from-blue to-cyan-500">Upcoming Payouts</TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="space-y-6">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search payouts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-900/50 border-gray-800 text-white"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-48 bg-gray-900/50 border-gray-800 text-white">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-800">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payouts List */}
              <div className="space-y-4">
                {filteredPayouts.map((payout, index) => (
                  <motion.div
                    key={payout.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Card className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-colors">
                      {cardsLoading ? (
                        <CardSkeleton headerLines={1} bodyHeight={10} />
                      ) :
                        <CardContent className="p-6">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-white font-semibold">{payout.id}</h3>
                                <Badge className={getStatusColor(payout.status)}>
                                  {getStatusIcon(payout.status)}
                                  <span className="ml-1 capitalize">{payout.status}</span>
                                </Badge>
                              </div>
                              <p className="text-gray-400 text-sm mb-1">{payout.aggregatorName}</p>
                              <p className="text-gray-500 text-xs">
                                Requested: {format(new Date(payout.requestDate), 'MMM dd, yyyy')}
                                {payout.processedDate && (
                                  <span> • Processed: {format(new Date(payout.processedDate), 'MMM dd, yyyy')}</span>
                                )}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-400">Amount</p>
                                <p className="text-white font-semibold">₹{payout.amount.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-400">Commission</p>
                                <p className="text-white font-semibold">₹{payout.commissionAmount.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-400">Applications</p>
                                <p className="text-white font-semibold">{payout.applications}</p>
                              </div>
                              <div>
                                <p className="text-gray-400">Method</p>
                                <p className="text-white font-semibold">{payout.paymentMethod}</p>
                              </div>
                            </div>
                            {payout.utrNumber && (
                              <div className="lg:text-right">
                                <p className="text-gray-400 text-xs">UTR Number</p>
                                <p className="text-white text-sm font-mono">{payout.utrNumber}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      }
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="upcoming" className="space-y-6">
              {cardsLoading ? (
                <CardSkeleton headerLines={1} bodyHeight={10} />
              ) :
                <Card className="bg-gray-900/50 border-gray-800">

                  <CardHeader>
                    <CardTitle className="text-white">Scheduled Payouts</CardTitle>
                    <CardDescription className="text-gray-400">Upcoming commission payments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {upcomingPayouts.map((payout, index) => (
                        <motion.div
                          key={payout.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="text-white font-medium">{payout.aggregatorName}</h4>
                              <Badge variant="outline" className="border-gold text-gold">
                                <Calendar className="w-3 h-3 mr-1" />
                                Due {format(new Date(payout.dueDate), 'MMM dd')}
                              </Badge>
                            </div>
                            <p className="text-gray-400 text-sm">{payout.applications} applications • ₹{payout.commissionAmount.toLocaleString()} commission</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-bold text-lg">₹{payout.amount.toLocaleString()}</p>
                            <Button size="sm" className="mt-2 bg-gradient-to-r from-blue to-cyan-500 text-dark">
                              Process Now
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              }
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
  )
}
