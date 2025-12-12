"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Users,
  Plus,
  Search,
  Edit,
  CheckCircle,
  XCircle,
  Eye,
  AlertCircle,
  TrendingUp,
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Activity,
  Calendar,
  X,
  Trash2,
  UserCheck
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { TablePagination } from "@/components/ui/pagination"
import { CardSkeleton, TableSkeleton } from "@/components/ui/loading-skeleton"

import { AddAggregatorDialog } from './dialogs/AddAggregatorDialog'
import { AddTeamMemberDialog } from './dialogs/AddTeamMemberDialog'
import { useAggregators } from '@/hooks/use-aggregators'
import { useUpdateUser } from '@/hooks/use-users'
import { AggregatorProfile } from '@/lib'
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export function SuperAdminAggregators() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedAggregator, setSelectedAggregator] = useState<AggregatorProfile | null>(null)

  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isAddTeamMemberDialogOpen, setIsAddTeamMemberDialogOpen] = useState(false)
  const [selectedAggregatorForTeam, setSelectedAggregatorForTeam] = useState<AggregatorProfile | null>(null)

  const [isTeamMembersDialogOpen, setIsTeamMembersDialogOpen] = useState(false)
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<any[]>([])
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>("")

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const tableTopRef = useRef<HTMLDivElement | null>(null)
  const { mutate: updateUserStatus } = useUpdateUser()
  const { toast } = useToast()

  const {
    data,
    isLoading: isTableLoading,
    isError,
    error,
    refetch,
  } = useAggregators({ page, limit: pageSize })

  const aggregators = data?.results || []
  const total = data?.count || 0

  const metrics = useMemo(() => ({
    totalAggregators: total,
    activeAggregators: aggregators.filter(a => a.user?.status === 'ACTIVE').length,
    pendingApprovals: aggregators.filter(a => a.user?.status === 'PENDING_APPROVAL').length,
  }), [aggregators, total])

  useEffect(() => {
    setPage(1)
  }, [searchTerm, filterStatus])

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

  const filteredAggregators = useMemo(() => {
    return aggregators.filter((aggregator) => {
      const username = aggregator.user?.username || ''
      const email = aggregator.user?.email || ''
      const matchesSearch =
        username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = !filterStatus || filterStatus === "all" || aggregator.user?.status === filterStatus
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

  // Robust lastLogin extraction: handles string entries or objects with createdAt/lastLogin
  const rawLastLogin = selectedAggregator?.user?.loginHistory?.at(-1)
  const lastLogin = rawLastLogin
    ? (typeof rawLastLogin === 'string' ? rawLastLogin : (rawLastLogin.createdAt || rawLastLogin.lastLogin || null))
    : null

  const handleApprove = (userId: string | undefined) => {
    if (!userId) return
    updateUserStatus(
      { id: userId, status: 'ACTIVE' },
      {
        onSuccess: () => {
          toast({
            title: 'Success',
            description: 'Aggregator approved successfully.',
          })
          refetch()
        },
        onError: (error: Error) => {
          toast({
            title: 'Error',
            description: error.message || 'Failed to approve aggregator.',
            variant: 'destructive',
          })
        },
      }
    )
  }

  const handleReject = (userId: string | undefined) => {
    if (!userId) return
    updateUserStatus(
      { id: userId, status: 'INACTIVE' },
      {
        onSuccess: () => {
          toast({
            title: 'Success',
            description: 'Aggregator rejected successfully.',
          })
          refetch()
        },
        onError: (error: Error) => {
          toast({
            title: 'Error',
            description: error.message || 'Failed to reject aggregator.',
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
            Error Loading Aggregators
          </h3>
          <p className="text-gray-400">{(error as Error)?.message}</p>
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
          onClick={() => setIsAddDialogOpen(true)}
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
            value={`0%`}
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
                <CardDescription className="text-gray-400 mt-1">
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
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
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
                  <div className="grid grid-cols-7 gap-2 py-4 px-4 bg-gray-900/50 rounded-t-lg font-medium text-gray-300 text-sm">
                    <div>Aggregator</div>
                    <div>Status</div>
                    <div>KYC Status</div>
                    <div>Applications</div>
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
                        className="grid grid-cols-7 gap-2 py-4 px-4 bg-gray-800/30 hover:bg-gray-800/50 rounded border-b border-gray-700 items-center"
                      >
                        <div>
                          <p className="text-white font-medium">{aggregator.companyName}</p>
                          <p className="text-sm text-gray-400 truncate">{aggregator.user?.email}</p>
                        </div>
                        <div>
                          <Badge className={getStatusColor(aggregator.user?.status)}>
                            {aggregator.user?.status}
                          </Badge>
                        </div>
                        <div>
                          <Badge className={getKycStatusColor(aggregator.kycStatus || 'UNKNOWN')}>
                            {aggregator.kycStatus || 'UNKNOWN'}
                          </Badge>
                        </div>
                        <div className="text-white">
                          <p>{aggregator.totalApplicationsSubmitted || 0} worked</p>
                          <p className="text-sm text-gray-400">
                            {aggregator.totalApplicationsSubmitted || 0} approved
                          </p>
                        </div>
                        <div className="text-white">
                          {(aggregator.totalCommissionEarned || 0) > 0 ? formatCurrency(aggregator.totalCommissionEarned || 0) : '0'}
                        </div>
                        <div className="text-gray-300">
                          {aggregator.createdAt ? new Date(aggregator.createdAt).toLocaleDateString() : '-'}
                        </div>
                        <div>
                          {/* <div className="flex items-center gap-2">
                            <span className="text-white font-medium">
                              {aggregator.teamMemberUsers?.length || 0}
                            </span>
                            {(aggregator.teamMemberUsers?.length || 0) > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedTeamMembers(aggregator.teamMemberUsers || [])
                                  setSelectedCompanyName(aggregator.companyName)
                                  setIsTeamMembersDialogOpen(true)
                                }}
                                className="text-cyan-400 hover:text-white hover:bg-gray-700 h-7 w-7 p-0"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                          </div> */}
                        </div>
                        <div>
                          <div className="flex items-center">
                            <Tooltip>
                              <TooltipTrigger>
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
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View Profile</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                  className="text-gold hover:text-white hover:bg-gray-700"
                                >
                                  <Link href={`/super-admin/aggregators/profile/${aggregator?._id}`}>
                                    <Edit className="w-4 h-4" />
                                  </Link>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit Aggregator</p>
                              </TooltipContent>
                            </Tooltip>
                            {/* <Tooltip>
                              <TooltipTrigger>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-violet-400 hover:text-white hover:bg-gray-700"
                                  onClick={() => {
                                    setSelectedAggregatorForTeam(aggregator)
                                    setIsAddTeamMemberDialogOpen(true)
                                  }}
                                >
                                  <UserCheck className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Add Team Member</p>
                              </TooltipContent>
                            </Tooltip> */}
                            <Tooltip>
                              <TooltipTrigger>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-300 hover:text-white hover:bg-red-600/20 rounded-lg"
                                  onClick={() => handleReject(aggregator.user?._id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Delete Aggregator</p>
                              </TooltipContent>
                            </Tooltip>
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

      {/* View Aggregator Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={(val) => {
        // prevent closing when clicked outside or ESC in DialogContent by handling open state here as fallback
        setIsViewDialogOpen(val)
      }}>
        <DialogContent
          className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 text-white max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="border-b border-gray-700/50 pb-4 flex justify-between items-center">
            <div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-white">
                Aggregator Profile
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-sm">
                Comprehensive overview of aggregator performance and details
              </DialogDescription>
            </div>

            <DialogClose asChild>
              <button
                className="p-2 rounded hover:bg-gray-700/50 transition"
                aria-label="Close"
                onClick={() => setIsViewDialogOpen(false)}
              >
                <X className="w-5 h-5 text-gray-300" />
              </button>
            </DialogClose>
          </DialogHeader>

          {selectedAggregator && (
            <div className="space-y-6 pt-4">

              {/* Status Badges Section */}
              <div className="flex gap-3 justify-between items-start">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    className={`${getStatusColor(selectedAggregator.user?.status)} border px-4 py-1.5 text-sm font-semibold`}
                  >
                    {selectedAggregator.user?.status}
                  </Badge>

                  <Badge
                    className={`${getKycStatusColor(selectedAggregator.kycStatus)} border px-4 py-1.5 text-sm font-semibold`}
                  >
                    KYC: {selectedAggregator.kycStatus}
                  </Badge>
                </div>

                {selectedAggregator.user?.status === "INACTIVE" && (
                  <div className="flex items-center space-x-4">
                    <Button
                      className="bg-green-500 hover:bg-green-600 text-white"
                      onClick={() => {
                        handleApprove(selectedAggregator.user?._id)
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
                        handleReject(selectedAggregator.user?._id)
                        setIsViewDialogOpen(false)
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Aggregator
                    </Button>
                  </div>
                )}
              </div>

              {/* Personal Information Card */}
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50 backdrop-blur-sm">
                <h3 className="text-lg font-semibold mb-4 text-blue-400 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500/10 p-2 rounded-lg mt-1">
                      <User className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 mb-1">Username</p>
                      <p className="text-white font-semibold">{selectedAggregator.user?.username}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-purple-500/10 p-2 rounded-lg mt-1">
                      <Mail className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 mb-1">Email</p>
                      <p className="text-white font-semibold break-all">{selectedAggregator.user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-green-500/10 p-2 rounded-lg mt-1">
                      <Phone className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 mb-1">Contact</p>
                      <p className="text-white font-semibold">{selectedAggregator.user?.contact || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-orange-500/10 p-2 rounded-lg mt-1">
                      <Building className="w-4 h-4 text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 mb-1">Company Name</p>
                      <p className="text-white font-semibold">{selectedAggregator.companyName || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 md:col-span-2">
                    <div className="bg-pink-500/10 p-2 rounded-lg mt-1">
                      <MapPin className="w-4 h-4 text-pink-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 mb-1">Address</p>
                      <p className="text-white font-semibold">{selectedAggregator.registeredAddress || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-lg p-6 border border-blue-700/30 backdrop-blur-sm">
                <h3 className="text-lg font-semibold mb-4 text-purple-400 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performance Metrics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                    <p className="text-xs text-gray-400 mb-2">Total Applications</p>
                    <p className="text-2xl font-bold text-blue-400">{selectedAggregator.totalApplicationsSubmitted || 0}</p>
                  </div>

                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                    <p className="text-xs text-gray-400 mb-2">Approved</p>
                    <p className="text-2xl font-bold text-green-400">{selectedAggregator.approvedApplications || 0}</p>
                  </div>

                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                    <p className="text-xs text-gray-400 mb-2">Conversion Rate</p>
                    <p className="text-2xl font-bold text-purple-400">
                      {(selectedAggregator.conversionRate || 0) > 0 ? `${selectedAggregator.conversionRate.toFixed(1)}%` : 'N/A'}
                    </p>
                  </div>

                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                    <p className="text-xs text-gray-400 mb-2">Commission Earned</p>
                    <p className="text-xl font-bold text-yellow-400">
                      {(selectedAggregator.totalCommissionEarned || 0) > 0
                        ? formatCurrency(selectedAggregator.totalCommissionEarned || 0)
                        : '₹0'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
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
                        {selectedAggregator?.user?.createdAt
                          ? new Date(selectedAggregator.user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-gray-900/50 p-4 rounded-lg border border-gray-700/30">
                    <Activity className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-xs text-gray-400">Last Activity</p>
                      <p className="text-white font-semibold">
                        {lastLogin
                          ? new Date(lastLogin).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer action buttons (shows only when selectedAggregator exists and is INACTIVE) */}
              {selectedAggregator && selectedAggregator.user?.status === 'INACTIVE' && (
                <div className="flex gap-4 pt-4 border-t border-gray-700/50">
                  <Button
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-white font-semibold py-3 shadow-lg shadow-green-500/20 transition-all duration-200"
                    onClick={() => {
                      handleApprove(selectedAggregator.user?._id)
                      setIsViewDialogOpen(false)
                    }}
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Approve Aggregator
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-semibold py-3 shadow-lg shadow-red-500/20 transition-all duration-200"
                    onClick={() => {
                      handleReject(selectedAggregator.user?._id)
                      setIsViewDialogOpen(false)
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Aggregator
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AddAggregatorDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        refetch={refetch}
      />

      {/* <AddTeamMemberDialog
        isOpen={isAddTeamMemberDialogOpen}
        onClose={() => {
          setIsAddTeamMemberDialogOpen(false)
          setSelectedAggregatorForTeam(null)
        }}
        aggregator={selectedAggregatorForTeam}
        refetch={refetch}
      /> */}

      {/* Team Members Dialog */}
      {/* <Dialog open={isTeamMembersDialogOpen} onOpenChange={setIsTeamMembersDialogOpen}>
        <DialogContent className="bg-gradient-to-br from-gray-900 to-black border-gray-700 text-white max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  Team Members
                </DialogTitle>
                <DialogDescription className="text-gray-400 mt-1">
                  <span className="font-semibold text-cyan-400">{selectedCompanyName}</span> - {selectedTeamMembers.length} member{selectedTeamMembers.length !== 1 ? 's' : ''}
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsTeamMembersDialogOpen(false)}
                className="text-gray-400 hover:text-white hover:bg-gray-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pr-2">
            {selectedTeamMembers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No team members found</p>
              </div>
            ) : (
              selectedTeamMembers.map((member, index) => (
                <motion.div
                  key={member._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-gray-800/50 rounded-lg p-5 border border-gray-700 hover:border-cyan-500/50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full w-14 h-14 flex items-center justify-center border-2 border-cyan-500/30">
                        <User className="w-7 h-7 text-cyan-400" />
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-white">
                            {member.username}
                          </h3>
                          <Badge className={getStatusColor(member.status)}>
                            {member.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex items-center gap-2">
                            <div className="bg-purple-500/10 p-1.5 rounded">
                              <Mail className="w-3.5 h-3.5 text-purple-400" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Email</p>
                              <p className="text-sm text-white font-medium truncate">
                                {member.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="bg-green-500/10 p-1.5 rounded">
                              <Phone className="w-3.5 h-3.5 text-green-400" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Contact</p>
                              <p className="text-sm text-white font-medium">
                                {member.contact || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                            {member.role?.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <style jsx>{`
      .overflow-y-auto::-webkit-scrollbar {
        width: 6px;
      }
      .overflow-y-auto::-webkit-scrollbar-track {
        background: rgba(31, 41, 55, 0.5);
        border-radius: 3px;
      }
      .overflow-y-auto::-webkit-scrollbar-thumb {
        background: rgba(75, 85, 99, 0.8);
        border-radius: 3px;
      }
      .overflow-y-auto::-webkit-scrollbar-thumb:hover {
        background: rgba(107, 114, 128, 1);
      }
    `}</style>
        </DialogContent>
      </Dialog> */}
    </div>
  )
}
