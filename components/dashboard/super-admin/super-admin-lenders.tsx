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
import { Building2, Plus, Search, Filter, Edit, Trash2, CheckCircle, XCircle, Eye, AlertCircle, TrendingUp, Users, CreditCard } from 'lucide-react'
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
    // avgConversionRate: lenders.length
    //   ? Math.round(
    //     lenders.reduce((sum, a) => sum + (a.conversionRate || 0), 0) /
    //     lenders.length
    //   )
    //   : 0,
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
  console.log(selectedLender, paginated, 'lender')
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
            <div className="overflow-x-auto">
              {isTableLoading ? (
                <TableSkeleton columns={8} rows={pageSize} />
              ) : paginated.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No lenders found matching your criteria.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">Lender</TableHead>
                      {/* <TableHead className="text-gray-300">Type</TableHead> */}
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">KYC Status</TableHead>
                      <TableHead className="text-gray-300">Disbursed Amount</TableHead>
                      <TableHead className="text-gray-300">Products</TableHead>
                      <TableHead className="text-gray-300">Commission Paid</TableHead>
                      <TableHead className="text-gray-300">Join Date</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((lender, index) => (
                      <motion.tr
                        key={lender._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border-gray-700 hover:bg-gray-800/50"
                      >
                        <TableCell>
                          <div>
                            <p className="text-white font-medium">{lender.user?.username}</p>
                            {/* <p className="text-sm text-gray-400">{lender.contactPerson}</p> */}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-gray-600 text-gray-300">
                            {lender.lenderType || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(lender.user?.status)}>
                            {lender.user?.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getKycStatusColor(lender.kycStatus)}>
                            {lender.kycStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white">
                          {lender?.totalDisbursedAmount > 0 ? formatCurrency(lender.totalDisbursedAmount) : '-'}
                        </TableCell>
                        <TableCell className="text-white">{lender.productsCount || 0}</TableCell>
                        <TableCell className="text-gold">
                          {lender?.totalCommissionPaid > 0 ? `${lender.totalCommissionPaid}%` : '-'}
                        </TableCell>
                        <TableCell className="text-gray-300">{lender.createdAt}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
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
                                setIsViewDialogOpen(true)
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
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
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
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Lender Details</DialogTitle>
            <DialogDescription className="text-gray-400">
              Complete information about the selected lender
            </DialogDescription>
          </DialogHeader>
          {selectedLender && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-gray-300">Lender Name</Label>
                  <p className="text-white font-semibold mt-1">{selectedLender.lenderName}</p>
                </div>
                <div>
                  <Label className="text-gray-300">Type</Label>
                  <p className="text-white font-semibold mt-1">{selectedLender.type}</p>
                </div>
                <div>
                  <Label className="text-gray-300">Status</Label>
                  <Badge className={`${getStatusColor(selectedLender.user?.status)} mt-1`}>
                    {selectedLender.user?.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-gray-300">KYC Status</Label>
                  <Badge className={`${getKycStatusColor(selectedLender.kycStatus)} mt-1`}>
                    {selectedLender.kycStatus}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-gray-300">Contact Person</Label>
                  <p className="text-white font-semibold mt-1">{selectedLender.user?.username}</p>
                </div>
                <div>
                  <Label className="text-gray-300">Email</Label>
                  <p className="text-white font-semibold mt-1">{selectedLender.user?.email}</p>
                </div>
                <div>
                  <Label className="text-gray-300">Phone</Label>
                  <p className="text-white font-semibold mt-1">{selectedLender.user?.contact}</p>
                </div>
                <div>
                  <Label className="text-gray-300">Address</Label>
                  <p className="text-white font-semibold mt-1">{selectedLender.user?.address}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <Label className="text-gray-300">Disbursed Amount</Label>
                  <p className="text-white font-semibold mt-1">
                    {selectedLender.totalDisbursedAmount > 0 ? formatCurrency(selectedLender.totalDisbursedAmount) : 'No transactions yet'}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-300">Products Count</Label>
                  <p className="text-white font-semibold mt-1">{selectedLender.productsCount}</p>
                </div>
                <div>
                  <Label className="text-gray-300">Commission Paid</Label>
                  <p className="text-white font-semibold mt-1">
                    {selectedLender.totalCommissionPaid > 0 ? `${selectedLender.totalCommissionPaid}%` : 'Not applicable'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-gray-300">Join Date</Label>
                  <p className="text-white font-semibold mt-1">{selectedLender.createdAt}</p>
                </div>
                <div>
                  <Label className="text-gray-300">Last Activity</Label>
                  <p className="text-white font-semibold mt-1">{selectedLender.user?.loginHistory}</p>
                </div>
              </div>

              {selectedLender.user?.status === 'INACTIVE' && (
                <div className="flex items-center space-x-4 pt-4 border-t border-gray-700">
                  <Button
                    className="bg-green-500 hover:bg-green-600 text-white"
                    onClick={() => {
                      handleApprove(selectedLender.user?._id)
                      setIsViewDialogOpen(false)
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Lender
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                    onClick={() => {
                      handleReject(selectedLender.user?._id)
                      setIsViewDialogOpen(false)
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