"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { usersApi } from '@/lib/api-client'
import { AddAggregatorDialog } from './dialogs/add-aggregator-dialog'
import { Users, Plus, Search, Edit, CheckCircle, XCircle, Eye, AlertCircle, TrendingUp } from 'lucide-react'
import { TablePagination } from "@/components/ui/pagination"
import { CardSkeleton, TableSkeleton } from "@/components/ui/loading-skeleton"
import { useAggregators } from '@/hooks/use-aggregators'

export function SuperAdminAggregators() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedAggregator, setSelectedAggregator] = useState(null)
  const [editingAggregator, setEditingAggregator] = useState(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false)
  const { toast } = useToast()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const tableTopRef = useRef<HTMLDivElement | null>(null)

  const {
    aggregators,
    total,
    pages,
    metrics,
    loading: isTableLoading,
    error,
    mutate,
  } = useAggregators({ page, limit: pageSize })

  useEffect(() => {
    setPage(1)
  }, [searchTerm, filterStatus])

  const handleSuccess = () => {
    setIsAddEditDialogOpen(false)
    setEditingAggregator(null)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE': return 'bg-green-500/20 text-green-400'
      case 'PENDING': return 'bg-orange-500/20 text-orange-400'
      case 'SUSPENDED':
      case 'INACTIVE': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case 'Verified': return 'bg-green-500/20 text-green-400'
      case 'Under Review': return 'bg-orange-500/20 text-orange-400'
      case 'Rejected': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const filteredAggregators = useMemo(() => {
    return aggregators.filter((aggregator) => {
      const matchesSearch =
        aggregator.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aggregator.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = !filterStatus || filterStatus === "all" || aggregator.status === filterStatus
      return matchesSearch && matchesStatus
    })
  }, [aggregators, searchTerm, filterStatus])

  const paginatedAggregators = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredAggregators.slice(start, start + pageSize)
  }, [filteredAggregators, page, pageSize])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(1)
    tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const handleApprove = async (aggregatorId: string) => {
    try {
      await usersApi.updateUser({
        id: aggregatorId,
        status: 'ACTIVE'
      })
      toast({
        title: 'Success',
        description: 'Aggregator has been approved successfully.',
      })
    } catch (error) {
      console.error('Approve aggregator error:', error)
      toast({
        title: 'Error',
        description: 'Failed to approve aggregator. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleReject = async (aggregatorId: string) => {
    try {
      await usersApi.updateUser({
        id: aggregatorId,
        status: 'INACTIVE'
      })
      toast({
        title: 'Success',
        description: 'Aggregator has been rejected.',
      })
    } catch (error) {
      console.error('Reject aggregator error:', error)
      toast({
        title: 'Error',
        description: 'Failed to reject aggregator. Please try again.',
        variant: 'destructive',
      })
    }
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

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Error Loading Aggregators</h3>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Aggregator Management</h1>
          <p className="text-gray-400 mt-1">Manage and monitor all registered aggregators</p>
        </div>
        <Button
          className="bg-gradient-to-r from-blue to-cyan-500 text-dark"
          onClick={() => {
            setEditingAggregator(null)
            setIsAddEditDialogOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Aggregator
        </Button>
      </motion.div>

      {/* Metrics Cards */}
      {!isTableLoading && !aggregators.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ">
          <CardSkeleton headerLines={2} bodyHeight={20} />
          <CardSkeleton headerLines={2} bodyHeight={20} />
          <CardSkeleton headerLines={2} bodyHeight={20} />
          <CardSkeleton headerLines={2} bodyHeight={20} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Aggregators"
            value={metrics.totalAggregators}
            icon={Users}
            color="bg-blue/20 text-blue"
            subtitle="Registered partners"
          />
          <MetricCard
            title="Active Aggregators"
            value={metrics.activeAggregators}
            icon={CheckCircle}
            color="bg-green-500/20 text-green-400"
            subtitle="Currently operational"
          />
          <MetricCard
            title="Pending Approvals"
            value={metrics.pendingApprovals}
            icon={AlertCircle}
            color="bg-orange-500/20 text-orange-400"
            subtitle="Awaiting review"
          />
          <MetricCard
            title="Avg Conversion Rate"
            value={`${metrics.avgConversionRate}%`}
            icon={TrendingUp}
            color="bg-gold/20 text-gold"
            subtitle="Platform average"
          />
        </div>
      )}

      {/* Aggregators Table */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">All Aggregators</CardTitle>
                <CardDescription className="text-gray-400">
                  Complete list of registered aggregators and their performance
                </CardDescription>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search aggregators..."
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
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
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
                <div className="min-w-full">
                  <div className="grid grid-cols-8 gap-4 py-3 px-4 bg-gray-900/50 rounded-t-lg font-medium text-gray-300 text-sm">
                    <div>Aggregator</div>
                    <div>Status</div>
                    <div>KYC Status</div>
                    <div>Applications</div>
                    <div>Conversion Rate</div>
                    <div>Total Commission</div>
                    <div>Join Date</div>
                    <div>Actions</div>
                  </div>
                  <div className="space-y-1">
                    {paginatedAggregators.map((aggregator, index) => (
                      <motion.div
                        key={aggregator._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="grid grid-cols-8 gap-4 py-4 px-4 bg-gray-800/30 hover:bg-gray-800/50 rounded border-b border-gray-700 items-center"
                      >
                        <div>
                          <p className="text-white font-medium">{aggregator.username}</p>
                          <p className="text-sm text-gray-400">{aggregator.email}</p>
                        </div>
                        <div>
                          <Badge className={getStatusColor(aggregator.status)}>
                            {aggregator.status}
                          </Badge>
                        </div>
                        <div>
                          <Badge className={getKycStatusColor(aggregator.kycStatus || 'Verified')}>
                            {aggregator.kycStatus || 'Verified'}
                          </Badge>
                        </div>
                        <div className="text-white">
                          <p>{aggregator.totalApplications || 0}</p>
                          <p className="text-sm text-gray-400">
                            {aggregator.approvedApplications || 0} approved
                          </p>
                        </div>
                        <div className="text-gold">
                          {(aggregator.conversionRate || 0) > 0 ? `${aggregator.conversionRate}%` : '-'}
                        </div>
                        <div className="text-white">
                          {(aggregator.totalCommission || 0) > 0 ? formatCurrency(aggregator.totalCommission || 0) : '-'}
                        </div>
                        <div className="text-gray-300">
                          {new Date(aggregator.createdAt).toLocaleDateString()}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedAggregator(aggregator)
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
                                setEditingAggregator(aggregator)
                                setIsAddEditDialogOpen(true)
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {aggregator.status === 'PENDING' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-400 hover:text-white hover:bg-gray-700"
                                  onClick={() => handleApprove(aggregator._id)}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-400 hover:text-white hover:bg-gray-700"
                                  onClick={() => handleReject(aggregator._id)}
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

      {/* View Aggregator Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Aggregator Details</DialogTitle>
            <DialogDescription className="text-gray-400">
              Complete information about the selected aggregator
            </DialogDescription>
          </DialogHeader>
          {selectedAggregator && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-gray-300">Username</Label>
                  <p className="text-white font-semibold mt-1">{selectedAggregator.username}</p>
                </div>
                <div>
                  <Label className="text-gray-300">Email</Label>
                  <p className="text-white font-semibold mt-1">{selectedAggregator.email}</p>
                </div>
                <div>
                  <Label className="text-gray-300">Status</Label>
                  <Badge className={`${getStatusColor(selectedAggregator.status)} mt-1`}>
                    {selectedAggregator.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-gray-300">KYC Status</Label>
                  <Badge className={`${getKycStatusColor(selectedAggregator.kycStatus || 'Verified')} mt-1`}>
                    {selectedAggregator.kycStatus || 'Verified'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-gray-300">Contact</Label>
                  <p className="text-white font-semibold mt-1">{selectedAggregator.contact || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-gray-300">Company Name</Label>
                  <p className="text-white font-semibold mt-1">{selectedAggregator.companyName || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-gray-300">Address</Label>
                  <p className="text-white font-semibold mt-1">{selectedAggregator.address || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-gray-300">Join Date</Label>
                  <p className="text-white font-semibold mt-1">
                    {new Date(selectedAggregator.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <Label className="text-gray-300">Total Applications</Label>
                  <p className="text-white font-semibold mt-1">{selectedAggregator.totalApplications || 0}</p>
                </div>
                <div>
                  <Label className="text-gray-300">Approved Applications</Label>
                  <p className="text-white font-semibold mt-1">{selectedAggregator.approvedApplications || 0}</p>
                </div>
                <div>
                  <Label className="text-gray-300">Conversion Rate</Label>
                  <p className="text-white font-semibold mt-1">
                    {(selectedAggregator.conversionRate || 0) > 0 ? `${selectedAggregator.conversionRate}%` : 'Not applicable'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-gray-300">Total Commission Earned</Label>
                  <p className="text-white font-semibold mt-1">
                    {(selectedAggregator.totalCommission || 0) > 0 ? formatCurrency(selectedAggregator.totalCommission || 0) : 'No earnings yet'}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-300">Last Activity</Label>
                  <p className="text-white font-semibold mt-1">
                    {new Date(selectedAggregator.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {selectedAggregator.status === 'PENDING' && (
                <div className="flex items-center space-x-4 pt-4 border-t border-gray-700">
                  <Button
                    className="bg-green-500 hover:bg-green-600 text-white"
                    onClick={() => {
                      handleApprove(selectedAggregator._id)
                      setIsViewDialogOpen(false)
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Aggregator
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                    onClick={() => {
                      handleReject(selectedAggregator._id)
                      setIsViewDialogOpen(false)
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Application
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AddAggregatorDialog
        isOpen={isAddEditDialogOpen}
        mode={editingAggregator ? 'edit' : 'add'}
        editData={editingAggregator}
        onSuccess={handleSuccess}
        onClose={() => {
          setIsAddEditDialogOpen(false)
          setEditingAggregator(null)
        }}
      />
    </div>
  )
}