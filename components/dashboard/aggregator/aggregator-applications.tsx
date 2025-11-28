'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Plus, MoreHorizontal, Eye, Edit, Trash2, FileText, Clock, CheckCircle, XCircle, AlertCircle, Phone, Mail, MapPin, Calendar, DollarSign, Building2, User } from 'lucide-react'

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
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { CardSkeleton, TableSkeleton } from '@/components/ui/loading-skeleton'
import { TablePagination } from '@/components/ui/pagination'
import { useAuth } from '@/lib/auth'
import { applicationsApi } from '@/lib/applications-api'
import { useToast } from '@/hooks/use-toast'
import { useProducts } from '@/hooks/use-products'
import { useApplications, useCreateApplication, useDeleteApplication } from '@/hooks/use-applications'


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
    loanAmount: '',
    loanType: '',
    productId: '',
    lenderId: ''
  })
  const { toast } = useToast()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const tableTopRef = useRef<HTMLDivElement | null>(null)

  // Fetch applications using the hook
  const {
    data: applications,
    isLoading: isTableLoading,
    refetch
  } = useApplications({
    page,
    limit: pageSize,
    aggregatorId: user?._id || user?.id,
    status: filterStatus && filterStatus !== 'all' ? filterStatus : undefined,
  })
  const total = applications?.count || 0

  // Fetch products for the dropdown
  const {
    data: products,
    isLoading: loading,
    error,
  } = useProducts({ page, limit: 100 });

  const createApplicationMutation = useCreateApplication();
  const deleteApplicationMutation = useDeleteApplication();

  // Calculate stats from real data
  const stats = useMemo(() => {
    const totalApps = applications?.results;
    const underReview = totalApps?.filter(app => app.status === 'UNDER_REVIEW').length || 0
    const approved = totalApps?.filter(app => app.status === 'APPROVED').length || 0
    const disbursed = totalApps?.filter(app => app.status === 'DISBURSED').length || 0

    return [
      {
        title: 'Total Applications',
        value: total.toString(),
        change: '+12%',
        icon: FileText,
        color: 'text-blue-400'
      },
      {
        title: 'Under Review',
        value: underReview.toString(),
        change: '+5%',
        icon: Clock,
        color: 'text-yellow-400'
      },
      {
        title: 'Approved',
        value: approved.toString(),
        change: '+18%',
        icon: CheckCircle,
        color: 'text-green-400'
      },
      {
        title: 'Disbursed',
        value: disbursed.toString(),
        change: '+22%',
        icon: DollarSign,
        color: 'text-purple-400'
      }
    ]
  }, [applications, total])

  // Transform API data to match UI format
  const transformedApplications = useMemo(() => {
    return applications?.results.map(app => ({
      id: app._id,
      customerName: app.customerName,
      customerEmail: app.customerEmail,
      customerPhone: app.customerPhone,
      loanType: app.product?.productType || app.product?.name || 'N/A',
      loanAmount: app.loanAmount,
      lenderName: app.lender?.companyName || app.lender?.username || 'N/A',
      status: app.status,
      applicationDate: app.createdAt,
      lastUpdated: app.updatedAt,
      commissionRate: app.commissionPercent,
      documents: app.documents || [],
      avatar: '/placeholder.svg?height=40&width=40',
      // Keep original data for view dialog
      _original: app
    }))
  }, [applications?.results])

  // Client-side filtering for search and lender
  const filteredApplications = useMemo(() => {
    return transformedApplications?.filter(app => {
      const matchesSearch = app.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.id.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesLender = !filterLender || filterLender === 'all' || app.lenderName === filterLender
      return matchesSearch && matchesLender
    })
  }, [transformedApplications, searchTerm, filterLender])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [searchTerm, filterStatus, filterLender])

  const handlePageChange = async (newPage: number) => {
    setPage(newPage)
    tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const handlePageSizeChange = async (size: number) => {
    setPageSize(size)
    setPage(1)
    tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const handleCreateApplication = async () => {
    try {
      const payload = {
        aggregatorId: user?._id || user?.id,
        productId: form.productId,
        lenderId: form.lenderId,
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone,
        loanAmount: Number(form.loanAmount || 0),
      }

      const response = await createApplicationMutation.mutateAsync(payload)
      if (response?.createApplication?.success) {
        toast({ title: 'Success', description: 'Application created successfully' })
        setIsCreateDialogOpen(false)
        setForm({
          customerName: '',
          customerEmail: '',
          customerPhone: '',
          loanAmount: '',
          loanType: '',
          productId: '',
          lenderId: ''
        })
        // Refetch applications
        refetch();
      } else {
        toast({
          title: 'Error',
          description: response?.createApplication?.message || 'Failed to create application',
          variant: 'destructive'
        })
      }
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e?.message || 'Failed to create application',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteApplicationMutation.mutateAsync(id);
        toast({ title: 'Success', description: 'Product deleted successfully.' })
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to delete product.',
          variant: 'destructive',
        })
      }
    }
  }

  // Get unique lenders for filter dropdown
  const uniqueLenders = useMemo(() => {
    const lenders = new Set(transformedApplications?.map(app => app.lenderName))
    return Array.from(lenders)
  }, [transformedApplications])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'UNDER_REVIEW': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'APPROVED': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'REJECTED': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'DISBURSED': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return Clock
      case 'UNDER_REVIEW': return AlertCircle
      case 'APPROVED': return CheckCircle
      case 'REJECTED': return XCircle
      case 'DISBURSED': return DollarSign
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
            Loan Applications
          </h1>
          <p className="text-gray-400 mt-1">Manage and track all loan applications</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-gradient-to-r from-blue to-cyan-500 hover:to-blue-700">
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
                <Label htmlFor="product" className="text-gray-300">Product</Label>
                <Select value={form.productId} onValueChange={(v) => {
                  const selectedProduct = products?.results?.find(p => p._id === v)
                  setForm({
                    ...form,
                    productId: v,
                    lenderId: selectedProduct?.lender?._id || ''
                  })
                }}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {products?.results?.map(product => (
                      <SelectItem key={product._id} value={product._id}>
                        {product.name} - {product.productType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="loanAmount" className="text-gray-300">Loan Amount</Label>
                <Input id="loanAmount" type="number" value={form.loanAmount} onChange={e => setForm({ ...form, loanAmount: e.target.value })} className="bg-gray-800 border-gray-700 text-white" />
              </div>
              {/* <div className="space-y-2">
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
              </div> */}
              <div className="col-span-2 space-y-2">
                <Label htmlFor="notes" className="text-gray-300">Additional Notes</Label>
                <Textarea id="notes" className="bg-gray-800 border-gray-700 text-white" />
              </div>
            </div>
            <Button
              onClick={handleCreateApplication}
              disabled={!form.customerName || !form.customerEmail || !form.productId || !form.loanAmount}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 mt-4"
            >
              Submit Application
            </Button>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Stats Cards */}
      {isTableLoading ? (
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
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="DISBURSED">Disbursed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterLender} onValueChange={setFilterLender}>
          <SelectTrigger className="w-40 bg-gray-900/50 border-gray-800 text-white">
            <SelectValue placeholder="All Lenders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Lenders</SelectItem>
            {uniqueLenders.map(lender => (
              <SelectItem key={lender} value={lender}>{lender}</SelectItem>
            ))}
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
                    {filteredApplications?.map((application, index) => {
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
                              <p className="text-white font-medium">{application.id.slice(0, 4)}</p>
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
                                <DropdownMenuItem className="text-red-400 cursor-pointer hover:text-white" onClick={() => handleDelete(application.id)}>
                                  <Trash2 className="w-4 h-4" />
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
                    <Label className="text-gray-400">Commission Percent</Label>
                    <p className="text-gold font-medium">{selectedApplication.commissionRate}%</p>
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
  )
}
