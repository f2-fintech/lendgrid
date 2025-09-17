'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Search, Plus, MoreHorizontal, Eye, Edit, Trash2, FileText, Clock, CheckCircle, XCircle, AlertCircle, Phone, Mail, MapPin, Calendar, DollarSign, Building2, User } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { CardSkeleton, TableSkeleton } from '@/components/ui/loading-skeleton'
import { TablePagination } from '@/components/ui/pagination'
import { applicationsApi } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth'

const mockApplications = [
  {
    id: 'APP001',
    customerName: 'Rajesh Kumar',
    customerEmail: 'rajesh.kumar@email.com',
    customerPhone: '+91 98765 43210',
    loanType: 'Personal Loan',
    loanAmount: 500000,
    lenderName: 'HDFC Bank',
    status: 'approved',
    applicationDate: '2025-01-15',
    lastUpdated: '2025-01-20',
    commissionRate: 4.0,
    expectedCommission: 20000,
    documents: ['PAN', 'Aadhaar', 'Salary Slip', 'Bank Statement'],
    avatar: '/placeholder.svg?height=40&width=40'
  },
  {
    id: 'APP002',
    customerName: 'Priya Sharma',
    customerEmail: 'priya.sharma@email.com',
    customerPhone: '+91 87654 32109',
    loanType: 'Home Loan',
    loanAmount: 2500000,
    lenderName: 'ICICI Bank',
    status: 'under_review',
    applicationDate: '2025-01-18',
    lastUpdated: '2025-01-22',
    commissionRate: 3.5,
    expectedCommission: 87500,
    documents: ['PAN', 'Aadhaar', 'Property Papers', 'Income Proof'],
    avatar: '/placeholder.svg?height=40&width=40'
  },
  {
    id: 'APP003',
    customerName: 'Amit Patel',
    customerEmail: 'amit.patel@email.com',
    customerPhone: '+91 76543 21098',
    loanType: 'Business Loan',
    loanAmount: 1000000,
    lenderName: 'Bajaj Finance',
    status: 'pending',
    applicationDate: '2025-01-20',
    lastUpdated: '2025-01-20',
    commissionRate: 4.5,
    expectedCommission: 45000,
    documents: ['PAN', 'Aadhaar', 'GST Certificate', 'Business Proof'],
    avatar: '/placeholder.svg?height=40&width=40'
  },
  {
    id: 'APP004',
    customerName: 'Sunita Gupta',
    customerEmail: 'sunita.gupta@email.com',
    customerPhone: '+91 65432 10987',
    loanType: 'Car Loan',
    loanAmount: 800000,
    lenderName: 'Axis Bank',
    status: 'rejected',
    applicationDate: '2025-01-12',
    lastUpdated: '2025-01-19',
    commissionRate: 3.8,
    expectedCommission: 0,
    documents: ['PAN', 'Aadhaar', 'Driving License', 'Income Proof'],
    avatar: '/placeholder.svg?height=40&width=40'
  },
  {
    id: 'APP005',
    customerName: 'Vikram Singh',
    customerEmail: 'vikram.singh@email.com',
    customerPhone: '+91 54321 09876',
    loanType: 'Personal Loan',
    loanAmount: 350000,
    lenderName: 'Kotak Bank',
    status: 'disbursed',
    applicationDate: '2025-01-10',
    lastUpdated: '2025-01-25',
    commissionRate: 4.2,
    expectedCommission: 14700,
    documents: ['PAN', 'Aadhaar', 'Salary Slip', 'Bank Statement'],
    avatar: '/placeholder.svg?height=40&width=40'
  }
]

const stats = [
  {
    title: 'Total Applications',
    value: '156',
    change: '+12%',
    icon: FileText,
    color: 'text-blue-400'
  },
  {
    title: 'Under Review',
    value: '23',
    change: '+5%',
    icon: Clock,
    color: 'text-yellow-400'
  },
  {
    title: 'Approved',
    value: '89',
    change: '+18%',
    icon: CheckCircle,
    color: 'text-green-400'
  },
  {
    title: 'Disbursed',
    value: '67',
    change: '+22%',
    icon: DollarSign,
    color: 'text-purple-400'
  }
]

export function AggregatorApplications() {
  const { user } = useAuth('aggregator_admin')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterLender, setFilterLender] = useState('')
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    loanType: '',
    loanAmount: '',
    lenderId: '',
    lenderName: '',
  })
  const { toast } = useToast()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isTableLoading, setIsTableLoading] = useState(true)
  const [cardsLoading, setCardsLoading] = useState(true)
  const tableTopRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setIsTableLoading(true)
      try {
        const resp = await applicationsApi.list({ page, limit: pageSize })
        // keep mock stats for now, but data populates table
        if (!mounted) return
        const results = resp?.data?.results || []
        if (results.length) {
          // replace mockApplications in memory
          ;(mockApplications as any).splice(0, mockApplications.length, ...results.map((r: any) => ({
            id: r._id,
            customerName: r.customerName,
            customerEmail: r.customerEmail,
            customerPhone: r.customerPhone,
            loanType: r.loanType,
            loanAmount: r.loanAmount,
            lenderName: r.lenderName,
            status: r.status,
            applicationDate: r.createdAt,
            lastUpdated: r.updatedAt,
            commissionRate: r.commissionRate,
            expectedCommission: r.expectedCommission,
            documents: r.documents || [],
            avatar: '/placeholder.svg?height=40&width=40',
          })))
        }
      } finally {
        if (mounted) {
          setIsTableLoading(false)
          setCardsLoading(false)
        }
      }
    }
    load()
    return () => { mounted = false }
  }, [page, pageSize])

  useEffect(() => {
    setPage(1)
  }, [searchTerm, filterStatus, filterLender])

  const filteredApplications = mockApplications.filter(app => {
    const matchesSearch = app.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || app.status === filterStatus
    const matchesLender = !filterLender || app.lenderName === filterLender
    return matchesSearch && matchesStatus && matchesLender
  })

  const total = filteredApplications.length
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredApplications.slice(start, start + pageSize)
  }, [filteredApplications, page, pageSize])

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'under_review': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'disbursed': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock
      case 'under_review': return AlertCircle
      case 'approved': return CheckCircle
      case 'rejected': return XCircle
      case 'disbursed': return DollarSign
      default: return Clock
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
    <DashboardLayout userRole="aggregator">
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-purple-400 bg-clip-text text-transparent">
              Loan Applications
            </h1>
            <p className="text-gray-400 mt-1">Manage and track all loan applications</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                New Application
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Application</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Submit a new loan application for your customer
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName" className="text-gray-300">Customer Name</Label>
                  <Input id="customerName" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} className="bg-gray-800 border-gray-700 text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerEmail" className="text-gray-300">Email</Label>
                  <Input id="customerEmail" type="email" value={form.customerEmail} onChange={e => setForm({ ...form, customerEmail: e.target.value })} className="bg-gray-800 border-gray-700 text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone" className="text-gray-300">Phone</Label>
                  <Input id="customerPhone" value={form.customerPhone} onChange={e => setForm({ ...form, customerPhone: e.target.value })} className="bg-gray-800 border-gray-700 text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loanType" className="text-gray-300">Loan Type</Label>
                  <Select value={form.loanType} onValueChange={(v) => setForm({ ...form, loanType: v })}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select loan type" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="Personal Loan">Personal Loan</SelectItem>
                      <SelectItem value="Home Loan">Home Loan</SelectItem>
                      <SelectItem value="Business Loan">Business Loan</SelectItem>
                      <SelectItem value="Vehicle Loan">Vehicle Loan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loanAmount" className="text-gray-300">Loan Amount</Label>
                  <Input id="loanAmount" type="number" value={form.loanAmount} onChange={e => setForm({ ...form, loanAmount: e.target.value })} className="bg-gray-800 border-gray-700 text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lender" className="text-gray-300">Preferred Lender</Label>
                  <Select value={form.lenderName} onValueChange={(v) => setForm({ ...form, lenderName: v, lenderId: v })}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select lender" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="HDFC Bank">HDFC Bank</SelectItem>
                      <SelectItem value="ICICI Bank">ICICI Bank</SelectItem>
                      <SelectItem value="Bajaj Finance">Bajaj Finance</SelectItem>
                      <SelectItem value="Axis Bank">Axis Bank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="notes" className="text-gray-300">Additional Notes</Label>
                  <Textarea id="notes" className="bg-gray-800 border-gray-700 text-white" />
                </div>
              </div>
              <Button
                onClick={async () => {
                  try {
                    const payload: any = {
                      aggregatorId: user?._id || user?.id,
                      lenderId: form.lenderId || 'L1',
                      lenderName: form.lenderName,
                      customerName: form.customerName,
                      customerEmail: form.customerEmail,
                      customerPhone: form.customerPhone,
                      loanType: form.loanType,
                      loanAmount: Number(form.loanAmount || 0),
                    }
                    await applicationsApi.create(payload)
                    toast({ title: 'Application submitted' })
                    setIsCreateDialogOpen(false)
                  } catch (e: any) {
                    toast({ title: 'Submission failed', description: e?.message || 'Try again.' })
                  }
                }}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 mt-4"
              >
                Submit Application
              </Button>
            </DialogContent>
          </Dialog>
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
                        <p className="text-green-400 text-sm mt-1">{stat.change} from last month</p>
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

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-900/50 border-gray-800 text-white"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 bg-gray-900/50 border-gray-800 text-white">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="disbursed">Disbursed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterLender} onValueChange={setFilterLender}>
            <SelectTrigger className="w-40 bg-gray-900/50 border-gray-800 text-white">
              <SelectValue placeholder="All Lenders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Lenders</SelectItem>
              <SelectItem value="HDFC Bank">HDFC Bank</SelectItem>
              <SelectItem value="ICICI Bank">ICICI Bank</SelectItem>
              <SelectItem value="Bajaj Finance">Bajaj Finance</SelectItem>
              <SelectItem value="Axis Bank">Axis Bank</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Applications Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Applications Overview</CardTitle>
              <CardDescription className="text-gray-400">
                Track and manage all loan applications
              </CardDescription>
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
                        <TableHead className="text-gray-300">Application</TableHead>
                        <TableHead className="text-gray-300">Customer</TableHead>
                        <TableHead className="text-gray-300">Loan Details</TableHead>
                        <TableHead className="text-gray-300">Lender</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-300">Commission</TableHead>
                        <TableHead className="text-gray-300">Date</TableHead>
                        <TableHead className="text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginated.map((application, index) => {
                        const StatusIcon = getStatusIcon(application.status)
                        return (
                          <motion.tr
                            key={application.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="border-gray-700 hover:bg-gray-800/50"
                          >
                            <TableCell>
                              <div>
                                <p className="text-white font-medium">{application.id}</p>
                                <p className="text-gray-400 text-sm">{application.loanType}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={application.avatar || "/placeholder.svg"} />
                                  <AvatarFallback className="bg-gray-800 text-gray-300 text-xs">
                                    {application.customerName.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-white font-medium">{application.customerName}</p>
                                  <p className="text-gray-400 text-sm">{application.customerEmail}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-white font-medium">{formatCurrency(application.loanAmount)}</p>
                                <p className="text-gray-400 text-sm">{application.loanType}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-300">{application.lenderName}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(application.status)}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {application.status.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-gold font-medium">{application.commissionRate}%</p>
                                <p className="text-gray-400 text-sm">
                                  {application.expectedCommission > 0 ? formatCurrency(application.expectedCommission) : '-'}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-400">
                              {new Date(application.applicationDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-gray-400">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-gray-900 border-gray-800">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedApplication(application)
                                      setIsViewDialogOpen(true)
                                    }}
                                    className="text-gray-300"
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-gray-300">
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-400">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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

        {/* View Application Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-800 max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-white">Application Details</DialogTitle>
              <DialogDescription className="text-gray-400">
                Complete information about the loan application
              </DialogDescription>
            </DialogHeader>
            {selectedApplication && (
              <div className="space-y-6">
                {/* Customer Information */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={selectedApplication.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-gray-800 text-gray-300">
                          {selectedApplication.customerName.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-white font-medium">{selectedApplication.customerName}</p>
                        <p className="text-gray-400 text-sm">Customer</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-gray-300">
                        <Mail className="w-4 h-4" />
                        <span>{selectedApplication.customerEmail}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-300">
                        <Phone className="w-4 h-4" />
                        <span>{selectedApplication.customerPhone}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Loan Information */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Loan Information
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-gray-400">Loan Type</Label>
                      <p className="text-white font-medium">{selectedApplication.loanType}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Loan Amount</Label>
                      <p className="text-white font-medium">{formatCurrency(selectedApplication.loanAmount)}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Lender</Label>
                      <p className="text-white font-medium">{selectedApplication.lenderName}</p>
                    </div>
                  </div>
                </div>

                {/* Application Status */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Application Status
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-gray-400">Current Status</Label>
                      <Badge className={`${getStatusColor(selectedApplication.status)} mt-1`}>
                        {selectedApplication.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-gray-400">Application Date</Label>
                      <p className="text-white font-medium">
                        {new Date(selectedApplication.applicationDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Last Updated</Label>
                      <p className="text-white font-medium">
                        {new Date(selectedApplication.lastUpdated).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Commission Information */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Building2 className="w-5 h-5 mr-2" />
                    Commission Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-400">Commission Rate</Label>
                      <p className="text-gold font-medium">{selectedApplication.commissionRate}%</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Expected Commission</Label>
                      <p className="text-gold font-medium">
                        {selectedApplication.expectedCommission > 0 ? formatCurrency(selectedApplication.expectedCommission) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Documents Submitted</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplication.documents.map((doc: string, index: number) => (
                      <Badge key={index} variant="outline" className="border-gray-600 text-gray-300">
                        {doc}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
