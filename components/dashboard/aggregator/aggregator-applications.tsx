'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Plus, MoreHorizontal, Eye, Edit, Trash2, FileText, Clock, CheckCircle, XCircle, AlertCircle, Phone, Mail, MapPin, Calendar, DollarSign, Building2, User, X, Landmark, Percent, Contact2Icon } from 'lucide-react'

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
import { CardSkeleton, TableSkeleton } from '@/components/ui/loading-skeleton'
import { TablePagination } from '@/components/ui/pagination'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { useProducts } from '@/hooks/use-products'
import { useApplications, useCreateApplication, useDeleteApplication } from '@/hooks/use-applications'
import React from 'react'

const InfoItem = ({ icon: Icon, label, value, color }: { icon: React.ElementType, label: string, value: string | number, color: string }) => (
  <div className="flex flex-col items-center justify-center p-4 bg-gray-800/50 rounded-lg">
    <Icon className={`w-8 h-8 ${color} mb-2`} />
    <p className="text-sm text-gray-400">{label}</p>
    <p className="text-lg font-bold text-white">{value}</p>
  </div>
);

const InfoLine = ({ icon: Icon, label, value, color }: { icon: React.ElementType, label: string, value: string | number, color: string }) => (
  <div className="flex items-start gap-3">
    <Icon className={`w-5 h-5 ${color} mt-1`} />
    <div>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="font-semibold text-white">{value}</p>
    </div>
  </div>
);

export function AggregatorApplications() {
  const { user } = useAuth('aggregator_admin')
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterLender, setFilterLender] = useState('')

  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [selectedLenderId, setSelectedLenderId] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    loanAmount: '',
    productId: '',
    lenderId: ''
  })

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
  const { data: products } = useProducts({ page, limit: 100 });

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


  // Client-side filtering for search and lender
  const filteredApplications = useMemo(() => {
    return applications?.results?.filter(app => {
      const matchesSearch = app.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.id.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesLender = !filterLender || filterLender === 'all' || app.lenderName === filterLender
      return matchesSearch && matchesLender
    })
  }, [applications?.results, searchTerm, filterLender])

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

  const lenders = useMemo(() => {
    if (!products?.results) return [];

    // Unique lenders
    const map = new Map();
    products.results.forEach(p => {
      if (p.lender?.profile?._id) {
        map.set(p.lender.profile._id, {
          id: p.lender.profile._id,
          name: p.lender.profile.lenderName,
        });
      }
    });

    return Array.from(map.values());
  }, [products]);

  const productsByLender = useMemo(() => {
    if (!selectedLenderId) return [];
    return products?.results?.filter(
      (p) => p.lender?.profile._id === selectedLenderId
    ) || [];
  }, [products, selectedLenderId]);

  console.log(form, 'this is form values', selectedApplication, 'this is appli')
  const handleCreateApplication = async () => {
    try {
      if (!selectedProduct) return;

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
      console.log(response.createApplication.application, 'create application')

      if (response?.createApplication?.success) {
        toast({ title: 'Success', description: 'Application created successfully' })
        setIsCreateDialogOpen(false)
        setSelectedProduct(null);
        setSelectedLenderId("")
        setForm({
          customerName: '',
          customerEmail: '',
          customerPhone: '',
          loanAmount: '',
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
    if (!confirm('Are you sure you want to delete')) return
    try {
      await deleteApplicationMutation.mutateAsync(id);
      toast({ title: 'Success', description: 'Application deleted successfully.' })
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete Application.',
        variant: 'destructive',
      })
    }
  }

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

  function setApplyDialogOpen(arg0: boolean): void {
    throw new Error('Function not implemented.')
  }

  return (

    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white"> Loan Applications </h1>
          <p className="text-gray-400 mt-1">Manage and track all loan applications</p>
        </div>

        {/* Apply Button */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-gradient-to-r from-blue to-cyan-500 hover:to-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Application
            </Button>
          </DialogTrigger>
          {/* Apply Form */}
          <DialogContent className="bg-gradient-to-br from-gray-900 to-black border-gray-700 text-white max-h-screen rounded-xl shadow-xl">
            <DialogHeader className="flex-shrink-0">
              <div>
                <DialogTitle className="text-2xl font-bold text-white bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                  Create New Application
                </DialogTitle>
                <DialogDescription className="text-gray-400 pt-1">
                  Submit a new loan application for your customer
                </DialogDescription>
              </div>
            </DialogHeader>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCreateDialogOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>

            <div className="space-y-2 py-2 flex-grow overflow-y-auto pr-2">
              {/* Lender & Product Selection */}
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-4">
                <h3 className="font-semibold text-lg text-cyan-300">1. Select Product</h3>
                <div className="space-y-2">
                  <Label className="text-gray-300">Lender</Label>
                  <Select
                    value={selectedLenderId}
                    onValueChange={(id) => {
                      setSelectedLenderId(id);
                      setSelectedProduct(null);
                      setForm({ ...form, lenderId: id, productId: "" });
                    }}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Choose a lender" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 text-white border-gray-700">
                      {lenders.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Product</Label>
                  {selectedLenderId && productsByLender.length === 0 ? (
                    <div className="w-full px-3 py-3 rounded-lg bg-gray-800 border-gray-700 text-gray-400 text-sm italic">
                      No products available for this lender.
                    </div>
                  ) : (
                    <Select
                      disabled={!selectedLenderId}
                      value={selectedProduct?._id}
                      onValueChange={(id) => {
                        const prod = productsByLender.find((p) => p._id === id);
                        setSelectedProduct(prod || null);
                        setForm({
                          ...form,
                          productId: prod?._id || "",
                          lenderId: prod?.lender?.profile?._id || ""
                        });
                      }}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white disabled:opacity-50">
                        <SelectValue placeholder={selectedLenderId ? "Choose a product" : "Select a lender first"} />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 text-white border-gray-700">
                        {productsByLender.map((p) => (
                          <SelectItem key={p._id} value={p._id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* Customer Details */}
              <div className="p-2 bg-gray-800/50 rounded-lg border border-gray-700 space-y-4">
                <h3 className="font-semibold text-lg text-cyan-300">2. Customer Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-2">
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
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="loanAmount" className="text-gray-300">Loan Amount</Label>
                    <Input id="loanAmount" type="number" value={form.loanAmount} onChange={e => setForm({ ...form, loanAmount: e.target.value })} className="bg-gray-800 border-gray-700 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex justify-between items-center pt-0  border-gray-700 flex-shrink-0">

              <Button
                disabled={!form.customerName || !form.customerEmail || !form.productId || !form.loanAmount}
                onClick={handleCreateApplication}
                className="bg-gradient-to-r from-blue to-cyan-500 text-white "
              >
                Submit Application
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div >

      {/* Stats Cards */}
      {
        isTableLoading ? (
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
        )
      }

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
            {applications?.results?.map(app => (
              <SelectItem key={app.lender._id} value={app.lender.lenderName}>{app.lender.lenderName}</SelectItem>
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
                      <TableHead className="text-gray-300">Application Number</TableHead>
                      <TableHead className="text-gray-300">Customer</TableHead>
                      <TableHead className="text-gray-300">Product Details</TableHead>
                      <TableHead className="text-gray-300">Lender</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Date</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications?.map((application, index) => {
                      const StatusIcon = getStatusIcon(application.status)
                      return (
                        <motion.tr
                          key={application._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="border-gray-700 hover:bg-gray-800/50"
                        >
                          <TableCell>
                            <div>
                              <p className="text-white font-medium">{application.applicationNumber}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={application.avatar || "/placeholder.svg"} />
                                <AvatarFallback className="bg-gray-800 text-gray-300 text-xs">
                                  {application.customerName.split(' ').map((n: string) => n[0]).join('')}
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
                              <p className="text-gray-400 text-sm">{application.product.productType.replace('_', ' ')}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-white font-medium">{application.lender.lenderName}</p>
                              <p className="text-white font-medium">{application.lender.lenderType}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(application.status)}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {application.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-400">
                            {new Date(application.createdAt).toLocaleDateString()}
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
                                <DropdownMenuItem className="text-red-400 cursor-pointer hover:text-white" onClick={() => handleDelete(application._id)}>
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
        <DialogContent className="bg-gradient-to-br from-gray-900 to-black border-gray-700 text-white max-w-3xl rounded-xl shadow-2xl">
          {selectedApplication && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <DialogTitle className="text-2xl font-bold text-white bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                      {selectedApplication.product.name}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400 pt-1">
                      Detailed overview of the loan product from <span className="font-semibold text-cyan-300">{selectedApplication.lender.lenderName}</span>
                    </DialogDescription>
                  </div>

                </div>

              </DialogHeader>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsViewDialogOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
              <Badge
                className={`${getStatusColor(selectedApplication.status)} border px-3 py-1 bg-transparent text-green-600 text-xs font-bold flex-shrink-0 w-min`}
              >
                {selectedApplication.status.replace('_', ' ')}
              </Badge>

              <div className="py-4 space-y-6">
                {/* Key Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <InfoItem icon={User} color="text-yellow-400" label="Customer" value={selectedApplication.customerName} />
                  <InfoItem icon={DollarSign} color="text-green-400" label="Loan Amount" value={formatCurrency(selectedApplication.loanAmount)} />
                  <InfoItem icon={Landmark} color="text-blue" label="Lender" value={selectedApplication.lender.lenderName} />
                  <InfoItem icon={Calendar} color="text-purple-400" label="Last Updated" value={new Date(selectedApplication.updatedAt).toLocaleDateString()} />
                </div>

                {/* Loan & Commission */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-800">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-cyan-300 mb-2 flex items-center gap-2"><DollarSign className="w-5 h-5" /> Details</h3>
                    <InfoLine icon={FileText} color="text-yellow-400" label="Product Name" value={selectedApplication.product.name} />
                    <InfoLine icon={FileText} color="text-blue" label="Loan Type" value={selectedApplication.product.productType.replace('_', ' ')} />
                    <InfoLine icon={Percent} color="text-green-400" label="Commission" value={`${selectedApplication.product.commissionPercent}%`} />
                    <InfoLine icon={Percent} color="text-purple-400" label="Processing Fee" value={`${selectedApplication.product.processingFeePercent}%`} />
                  </div>

                  {/* Customer & Documents */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-cyan-300 mb-2 flex items-center gap-2"><Contact2Icon className="w-5 h-5" />Contact & Documents</h3>
                    <InfoLine icon={Mail} color="text-blue" label="Email" value={selectedApplication.customerEmail} />
                    <InfoLine icon={Phone} color="text-green-400" label="Phone" value={selectedApplication.customerPhone} />
                    <div className="pt-2">
                      <h4 className="font-semibold text-cyan-300 mb-2 flex items-center gap-2"><FileText className="w-5 h-5" />Documents</h4>
                      {(selectedApplication.documents || []).length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedApplication.documents.map((doc: string, index: number) => (
                            <Badge key={index} variant="outline" className="border-gray-600 text-gray-300">{doc}</Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No documents submitted.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div >
  )
}
