"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AddLenderDialog } from './dialogs/add-lender-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Building2, Plus, Search, Filter, Edit, Trash2, CheckCircle, XCircle, Eye, AlertCircle, TrendingUp, Users, CreditCard, Activity, Calendar } from 'lucide-react'
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { TablePagination } from "@/components/ui/pagination"
import { CardSkeleton, TableSkeleton } from "@/components/ui/loading-skeleton"

import { LenderProfile } from '@/lib'
import { useLenders } from '@/hooks/use-lenders'
import { useUpdateUser } from '@/hooks/use-users'
import { useToast } from '@/hooks/use-toast'

export function SuperAdminLenders() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [selectedLender, setSelectedLender] = useState<LenderProfile | null>(null)
  const [editingLender, setEditingLender] = useState<any>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false)

  const { mutate: updateUserStatus } = useUpdateUser()
  const { toast } = useToast()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const tableTopRef = useRef<HTMLDivElement | null>(null)

  const {
    data,
    isLoading: isTableLoading,
    isError,
    error,
    refetch,
  } = useLenders({ page, limit: pageSize });

  const lenders = data?.results || []
  const total = data?.count || 0
  const pages = data?.pages || 1

  const metrics = useMemo(() => ({
    totalLenders: total,
    activeLenders: lenders.filter(l => l.user?.status === 'ACTIVE').length,
    pendingApprovals: lenders.filter(l => l.user?.status === 'PENDING_APPROVAL').length,
    avgCommissionRate: lenders.length
      ? Math.round(
        lenders.reduce((sum, a) => sum + (a.totalCommissionPaid || 0), 0) /
        lenders.length
      )
      : 0,
  }), [lenders, total])


  useEffect(() => {
    setPage(1)
  }, [searchTerm, filterStatus, filterType])

  const handleSuccess = () => {
    setIsAddEditDialogOpen(false)
    setEditingLender(null)
    refetch();
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-500/20 text-gray-400'
    switch (status.toUpperCase()) {
      case 'ACTIVE': return 'bg-green-500/20 text-green-400'
      case 'PENDING_APPROVAL': return 'bg-orange-500/20 text-orange-400'
      case 'SUSPENDED':
      case 'INACTIVE': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getKycStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-500/20 text-gray-400'
    switch (status) {
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-400'
      case 'UNDER_REVIEW': return 'bg-orange-500/20 text-orange-400'
      case 'APPROVED': return 'bg-green-500/20 text-green-400'
      case 'REJECTED': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const filteredLenders = useMemo(() => {
    return lenders.filter((lender) => {
      const matchesSearch =
        lender.user?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lender.user?.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = !filterStatus || filterStatus === "all" || lender.user?.status === filterStatus
      return matchesSearch && matchesStatus
    })
  }, [lenders, searchTerm, filterStatus])

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredLenders.slice(start, start + pageSize)
  }, [filteredLenders, page, pageSize])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(1)
    tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const handleApprove = (lenderId: string) => {
    updateUserStatus(
      { id: lenderId, status: 'ACTIVE' },
      {
        onSuccess: () => {
          toast({
            title: 'Success',
            description: 'Lender approved successfully.',
          })
          refetch() // re-fetch the Lender list
        },
        onError: (error: Error) => {
          toast({
            title: 'Error',
            description: error.message || 'Failed to approve Lender.',
            variant: 'destructive',
          })
        },
      }
    )
  }

  const handleReject = (lenderId: string) => {
    updateUserStatus(
      { id: lenderId, status: 'INACTIVE' },
      {
        onSuccess: () => {
          toast({
            title: 'Success',
            description: 'Lender rejected successfully.',
          })
          refetch()
        },
        onError: (error: Error) => {
          toast({
            title: 'Error',
            description: error.message || 'Failed to reject Lender.',
            variant: 'destructive',
          })
        },
      }
    )
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

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Error Loading Lenders
          </h3>
          <p className="text-gray-400">{(error as Error)?.message}</p>
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
          <h1 className="text-3xl font-bold text-white">Lender Management</h1>
          <p className="text-gray-400 mt-1">Manage and monitor all registered lenders</p>
        </div>
        <Button
          className="bg-gradient-to-r from-blue to-cyan-500 text-dark"
          onClick={() => {
            setEditingLender(null)
            setIsAddEditDialogOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Lender
        </Button>
      </motion.div>

      {/* Metrics Cards */}
      {!isTableLoading && !lenders.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardSkeleton headerLines={2} bodyHeight={20} />
          <CardSkeleton headerLines={2} bodyHeight={20} />
          <CardSkeleton headerLines={2} bodyHeight={20} />
          <CardSkeleton headerLines={2} bodyHeight={20} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Lenders"
            value={metrics?.totalLenders || 0}
            icon={Building2}
            color="bg-blue/20 text-blue"
            subtitle="Registered partners"
          />
          <MetricCard
            title="Active Lenders"
            value={metrics?.activeLenders || 0}
            icon={CheckCircle}
            color="bg-green-500/20 text-green-400"
            subtitle="Currently operational"
          />
          <MetricCard
            title="Pending Approvals"
            value={metrics?.pendingApprovals || 0}
            icon={AlertCircle}
            color="bg-orange-500/20 text-orange-400"
            subtitle="Awaiting review"
          />
          <MetricCard
            title="Avg Commission Rate"
            value={`${metrics?.avgCommissionRate || 0}%`}
            icon={TrendingUp}
            color="bg-gold/20 text-gold"
            subtitle="Platform average"
          />
        </div>
      )}

      {/* Lenders Table */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">All Lenders</CardTitle>
                <CardDescription className="text-gray-400">
                  Complete list of registered lenders and their status
                </CardDescription>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search lenders..."
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
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-32 bg-gray-900 border-gray-600 text-white">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Bank">Bank</SelectItem>
                    <SelectItem value="NBFC">NBFC</SelectItem>
                    <SelectItem value="Fintech">Fintech</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={tableTopRef} />
            <div>
              {isTableLoading ? (
                <TableSkeleton columns={8} rows={pageSize} />
              ) : paginated.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No lenders found matching your criteria.</p>
                </div>
              ) : (
                <div className="min-w-full">
                  <div className="grid grid-cols-8 gap-2 py-4 px-4 bg-gray-900/50 rounded-t-lg font-medium text-gray-300 text-sm">
                    <div>Lender</div>
                    <div>Status</div>
                    <div>KYC Status</div>
                    <div>Disbursed</div>
                    <div>Products</div>
                    <div>Commission Paid</div>
                    <div>Join Date</div>
                    <div>Actions</div>
                  </div>
                  <div className="space-y-1">
                    {paginated.map((lender, index) => (
                      <motion.div
                        key={lender._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="grid grid-cols-8 gap-2 py-4 px-4 bg-gray-800/30 hover:bg-gray-800/50 rounded items-center"
                      >
                        <div>
                          <p className="text-white font-medium">{lender.user?.username}</p>
                          <p className="text-sm text-gray-400 truncate">{lender.user?.email}</p>
                        </div>
                        <div>
                          <Badge className={getStatusColor(lender.user?.status)}>
                            {lender.user?.status}
                          </Badge>
                        </div>
                        <div>
                          <Badge className={getKycStatusColor(lender.kycStatus)}>
                            {lender.kycStatus}
                          </Badge>
                        </div>
                        <div className="text-white">
                          {lender?.totalDisbursedAmount > 0 ? formatCurrency(lender.totalDisbursedAmount) : '-'}
                        </div>
                        <div className="text-white">{lender.productsCount || 0}</div>
                        <div className="text-white">
                          {(lender.totalCommissionPaid || 0) > 0 ? formatCurrency(lender.totalCommissionPaid || 0) : '0'}
                        </div>
                        <div className="text-gray-300">
                          {new Date(lender.createdAt).toLocaleDateString()}
                        </div>
                        <div>
                          <div className="flex items-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedLender(lender)
                                setIsViewDialogOpen(true)
                              }}
                              className="text-blue hover:text-white hover:bg-gray-700"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gold hover:text-white hover:bg-gray-700"
                              onClick={() => {
                                setEditingLender(lender)
                                setIsAddEditDialogOpen(true)
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {lender.user?.status === 'ACTIVE' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-400 hover:text-white hover:bg-gray-700"
                                  onClick={() => handleApprove(lender.user?._id)}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-400 hover:text-white hover:bg-gray-700"
                                  onClick={() => handleReject(lender.user?._id)}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {!isTableLoading && (
              <TablePagination
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                className="mt-4"
              />
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* View Lender Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 text-white max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
          <DialogHeader className="border-b border-gray-700/50 pb-4">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-white">
              Lender Profile
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-sm">
              Comprehensive overview of lender performance and details
            </DialogDescription>
          </DialogHeader>

          {selectedLender && (
            <div className="space-y-6 pt-4 ">
              {/* Status Badges Section */}
              <div className="flex gap-3 justify-between items-start">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    className={`${getStatusColor(selectedLender.user?.status)} border px-4 py-1.5 text-sm font-semibold`}
                    title={`Status: ${selectedLender.user?.status}`}
                    aria-label={`Status ${selectedLender.user?.status}`}
                  >
                    {selectedLender.user?.status}
                  </Badge>

                  <Badge
                    className={`${getKycStatusColor(selectedLender.kycStatus)} border px-4 py-1.5 text-sm font-semibold`}
                    title={`KYC: ${selectedLender.kycStatus}`}
                    aria-label={`KYC status ${selectedLender.kycStatus}`}
                  >
                    KYC: {selectedLender.kycStatus}
                  </Badge>
                </div>

                {/* Top action buttons: show when application is pending */}
                <div>
                  {selectedLender.kycStatus === "PENDING" && (
                    <div className="flex items-center space-x-4">
                      <Button
                        className="bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => {
                          handleApprove(selectedLender.user?._id);
                          setIsViewDialogOpen(false);
                        }}
                        aria-label="Approve lender"
                        title="Approve lender"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Lender
                      </Button>

                      <Button
                        variant="outline"
                        className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                        onClick={() => {
                          handleReject(selectedLender.user?._id);
                          setIsViewDialogOpen(false);
                        }}
                        aria-label="Reject application"
                        title="Reject application"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Application
                      </Button>
                    </div>
                  )}
                </div>
              </div>


              {/* Personal Information Card */}
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50 backdrop-blur-sm">
                <h3 className="text-lg font-semibold mb-4 text-blue-400 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500/10 p-2 rounded-lg mt-1">
                      <Users className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 mb-1">Username</p>
                      <p className="text-white font-semibold">{selectedLender.user?.username}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-purple-500/10 p-2 rounded-lg mt-1">
                      <CreditCard className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 mb-1">Email</p>
                      <p className="text-white font-semibold break-all">{selectedLender.user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-green-500/10 p-2 rounded-lg mt-1">
                      <CreditCard className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 mb-1">Contact</p>
                      <p className="text-white font-semibold">{selectedLender.user?.contact || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-orange-500/10 p-2 rounded-lg mt-1">
                      <Building2 className="w-4 h-4 text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 mb-1">Company Name</p>
                      <p className="text-white font-semibold">{selectedLender.lenderName || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 md:col-span-2">
                    <div className="bg-pink-500/10 p-2 rounded-lg mt-1">
                      <CreditCard className="w-4 h-4 text-pink-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 mb-1">Address</p>
                      <p className="text-white font-semibold">{selectedLender.user?.address || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics Card */}
              <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-lg p-6 border border-blue-700/30 backdrop-blur-sm">
                <h3 className="text-lg font-semibold mb-4 text-purple-400 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performance Metrics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                    <p className="text-xs text-gray-400 mb-2">Total Disbursed</p>
                    <p className="text-2xl font-bold text-blue-400">{formatCurrency(selectedLender.totalDisbursedAmount || 0)}</p>
                  </div>

                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                    <p className="text-xs text-gray-400 mb-2">Products</p>
                    <p className="text-2xl font-bold text-green-400">{selectedLender.productsCount || 0}</p>
                  </div>

                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                    <p className="text-xs text-gray-400 mb-2">Commission Paid</p>
                    <p className="text-xl font-bold text-yellow-400">
                      {(selectedLender.totalCommissionPaid || 0) > 0 ? formatCurrency(selectedLender.totalCommissionPaid || 0) : '₹0'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Activity Timeline Card */}
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50 backdrop-blur-sm">
                <h3 className="text-lg font-semibold mb-4 text-green-400 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Activity Timeline
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 bg-gray-900/50 p-4 rounded-lg border border-gray-700/30">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-xs text-gray-400">Join Date</p>
                      <p className="text-white font-semibold">
                        {new Date(selectedLender.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-gray-900/50 p-4 rounded-lg border border-gray-700/30">
                    <Activity className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-xs text-gray-400">Last Activity</p>
                      <p className="text-white font-semibold">
                        {new Date(selectedLender.updatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedLender.user?.status === 'INACTIVE' && (
                <div className="flex gap-4 pt-4 border-t border-gray-700/50">
                  <Button
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-white font-semibold py-3 shadow-lg shadow-green-500/20 transition-all duration-200"
                    onClick={() => {
                      handleApprove(selectedLender.user?._id);
                      setIsViewDialogOpen(false);
                    }}
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Approve Lender
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-semibold py-3 shadow-lg shadow-red-500/20 transition-all duration-200"
                    onClick={() => {
                      handleReject(selectedLender.user?._id);
                      setIsViewDialogOpen(false);
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Lender
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AddLenderDialog
        isOpen={isAddEditDialogOpen}
        mode={editingLender ? 'edit' : 'add'}
        editData={editingLender}
        onSuccess={handleSuccess}
        onClose={() => {
          setIsAddEditDialogOpen(false)
          setEditingLender(null)
        }}
        refetch={refetch}
      />

    </div>
  )
}