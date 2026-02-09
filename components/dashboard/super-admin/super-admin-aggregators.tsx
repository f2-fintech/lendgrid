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
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { TablePagination } from "@/components/ui/pagination"
import { CardSkeleton, TableSkeleton } from "@/components/ui/loading-skeleton"

import { AddAggregatorDialog } from './dialogs/AddAggregatorDialog'
import { AddTeamMemberDialog } from './dialogs/AddTeamMemberDialog'
import { useAggregators, useUpdateAggregatorProfile } from '@/hooks/use-aggregators'
import { useUpdateUser } from '@/hooks/use-users'
import { AggregatorProfile } from '@/lib'
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useApplicationCount } from '@/hooks/use-applications-rest'

const ApplicationCountCell = ({ companyId }: { companyId?: number }) => {
  const { count, isLoading } = useApplicationCount(companyId, 'super_admin')

  if (isLoading) return <p className="text-muted-foreground animate-pulse text-xs">Loading...</p>

  return (
    <div className="text-foreground">
      <p>{count} submitted</p>
      {/* <p className="text-sm text-muted-foreground">0 approved</p> */}
    </div>
  )
}

export function SuperAdminAggregators() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedAggregator, setSelectedAggregator] = useState<AggregatorProfile | null>(null)

  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isOmsDialogOpen, setIsOmsDialogOpen] = useState(false)
  const [isAddTeamMemberDialogOpen, setIsAddTeamMemberDialogOpen] = useState(false)
  const [selectedAggregatorForTeam, setSelectedAggregatorForTeam] = useState<AggregatorProfile | null>(null)

  const [isTeamMembersDialogOpen, setIsTeamMembersDialogOpen] = useState(false)
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<any[]>([])
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>("")

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const tableTopRef = useRef<HTMLDivElement | null>(null)
  const { mutate: updateUserStatus } = useUpdateUser()
  const updateAggHook = useUpdateAggregatorProfile()
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
  const isInactiveView = filterStatus === 'INACTIVE'

  const metrics = useMemo(() => {
    const allAggregators = aggregators // All aggregators
    const activeOnly = allAggregators.filter(a => a.user?.status === 'ACTIVE')
    const inactiveOnly = allAggregators.filter(a => a.user?.status === 'INACTIVE')

    return {
      totalAggregators: allAggregators.length,
      activeAggregators: activeOnly.length,
      inactiveAggregators: inactiveOnly.length,
    }
  }, [aggregators])

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
    if (!status) return 'bg-muted/20 text-muted-foreground'
    switch (status.toUpperCase()) {
      case 'ACTIVE': return 'bg-green-500/20 text-green-400'
      case 'PENDING_APPROVAL': return 'bg-orange-500/20 text-orange-400'
      case 'SUSPENDED':
      case 'INACTIVE': return 'bg-red-500/20 text-red-400'
      default: return 'bg-muted/20 text-muted-foreground'
    }
  }

  const getKycStatusColor = (status?: string) => {
    if (!status) return 'bg-muted/20 text-muted-foreground'
    switch (status) {
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-400'
      case 'UNDER_REVIEW': return 'bg-orange-500/20 text-orange-400'
      case 'APPROVED': return 'bg-green-500/20 text-green-400'
      case 'REJECTED': return 'bg-red-500/20 text-red-400'
      default: return 'bg-muted/20 text-muted-foreground'
    }
  }

  const filteredAggregators = useMemo(() => {
    return aggregators.filter((aggregator) => {
      const username = aggregator.user?.username || ''
      const email = aggregator.user?.email || ''
      const matchesSearch =
        username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase())

      // Default to showing only ACTIVE aggregators
      const statusToFilter = filterStatus || 'ACTIVE'
      const matchesStatus = statusToFilter === "all" || aggregator.user?.status === statusToFilter

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
    ? (typeof rawLastLogin === 'string' ? rawLastLogin : (rawLastLogin?.createdAt || null))
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

  const handleRestore = (userId: string | undefined) => {
    if (!userId) return
    updateUserStatus(
      { id: userId, status: 'ACTIVE' },
      {
        onSuccess: () => {
          toast({
            title: 'Success',
            description: 'Aggregator restored successfully.',
          })
          refetch()
        },
        onError: (error: Error) => {
          toast({
            title: 'Error',
            description: error.message || 'Failed to restore aggregator.',
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
            description: 'Aggregator deleted successfully.',
          })
          refetch()
        },
        onError: (error: Error) => {
          toast({
            title: 'Error',
            description: error.message || 'Failed to delete aggregator.',
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
      <Card className={`professional-card hover-lift ${color}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold text-foreground mt-2">{value}</p>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-opacity-20`}>
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
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Error Loading Aggregators
          </h3>
          <p className="text-muted-foreground">{(error as Error)?.message}</p>
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
          <h1 className="text-3xl font-bold text-foreground">Aggregator Management</h1>
          <p className="text-muted-foreground mt-1">
            {isInactiveView
              ? 'View and restore inactive aggregators'
              : 'Manage and monitor active aggregators'
            }
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Aggregator
          </Button>

          <Button
            className={
              isInactiveView
                ? 'bg-green-500 hover:bg-green-600 text-foreground'
                : 'bg-red-500 hover:bg-red-600 text-foreground'
            }
            onClick={() => setFilterStatus(isInactiveView ? '' : 'INACTIVE')}
          >
            {isInactiveView ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Active Aggregators
                {metrics.activeAggregators > 0 && (
                  <Badge className="ml-2 bg-foreground/20 text-foreground border-none">
                    {metrics.activeAggregators}
                  </Badge>
                )}
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Deleted Aggregators
                {metrics.inactiveAggregators > 0 && (
                  <Badge className="ml-2 bg-foreground/20 text-foreground border-none">
                    {metrics.inactiveAggregators}
                  </Badge>
                )}
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Metrics Cards */}
      {!isInactiveView && (
        <>
          {!isTableLoading && !aggregators.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CardSkeleton headerLines={2} bodyHeight={20} />
              <CardSkeleton headerLines={2} bodyHeight={20} />
              <CardSkeleton headerLines={2} bodyHeight={20} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                color="metric-card-success"
                subtitle="Currently operational"
              />
              <MetricCard
                title="Deleted Aggregators"
                value={metrics.inactiveAggregators}
                icon={AlertCircle}
                color="bg-red-500/20 text-red-400"
                subtitle="Awaiting review"
              />
            </div>
          )}
        </>
      )}

      {/* Aggregators Table */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">
                  {isInactiveView
                    ? 'Deleted Aggregators'
                    : 'Active Aggregators'
                  }
                </CardTitle>
                <CardDescription className="text-muted-foreground mt-1">
                  Complete list of  {isInactiveView ? 'deleted aggregators' : 'active aggregators and their performance'}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search aggregators..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-background border-border text-foreground w-64"
                  />
                </div>
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
                  <div className="grid grid-cols-8 gap-2 py-4 px-4 bg-muted/50 rounded-t-lg font-medium text-muted-foreground text-sm">
                    <div>Aggregator</div>
                    <div>Type</div>
                    <div>Total Applications</div>
                    <div>Total Commission</div>
                    <div>Join Date</div>
                    <div>Account Status</div>
                    <div>OMS Status</div>
                    <div className="text-center">Actions</div>
                  </div>
                  <div className="space-y-1">
                    {paginatedAggregators.map((aggregator, index) => (
                      <motion.div
                        key={aggregator._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="grid grid-cols-8 gap-2 py-4 px-4 bg-card/30 hover:bg-card/50 rounded border-b border-border items-center"
                      >
                        <div className="flex flex-col">
                          <p className="text-foreground font-medium truncate max-w-[200px]" title={aggregator.companyName}>
                            {aggregator.companyName}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">{aggregator.user?.email}</p>
                        </div>
                        <div>
                          {aggregator.aggregatorType === 'SOURCER' ? (
                            <Badge className="bg-green-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-green-500/30 transition-all text-[10px] px-2 h-5 font-semibold">
                              <UserCheck className="w-3 h-3 mr-1" />
                              Sourcer
                            </Badge>
                          ) : aggregator.aggregatorType === 'CHANNEL_PARTNER' ? (
                            <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 transition-all text-[10px] px-2 h-5 font-semibold">
                              <Building className="w-3 h-3 mr-1" />
                              Channel Partner
                            </Badge>
                          ) : (
                            <Badge className="bg-muted text-muted-foreground border border-border text-[10px] px-2 h-5">
                              Not Set
                            </Badge>
                          )}
                        </div>
                        <ApplicationCountCell companyId={aggregator.companyId} />
                        <div className="text-foreground">
                          {(aggregator.totalCommissionEarned || 0) > 0 ? formatCurrency(aggregator.totalCommissionEarned || 0) : '₹0'}
                        </div>
                        <div className="text-foreground">
                          {aggregator.createdAt ? new Date(aggregator.createdAt).toLocaleDateString() : '-'}
                        </div>
                        <div>
                          <Badge className={getStatusColor(aggregator.user?.status)}>
                            {aggregator.user?.status}
                          </Badge>
                        </div>
                        {/* <div className="flex items-center gap-2">
                            <span className="text-foreground font-medium">
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
                                className="text-primary hover:text-foreground hover:bg-muted h-7 w-7 p-0"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                          </div> */}
                        <div>
                          {aggregator.isOmsEnabled ? (
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/20 border border-green-500/30">
                                  <CheckCircle className="w-5 h-5 text-green-400" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>OMS Enabled</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger>
                                <button
                                  onClick={() => {
                                    setSelectedAggregator(aggregator)
                                    setIsOmsDialogOpen(true)
                                  }}
                                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-500/20 border border-orange-500/30 hover:bg-orange-500/30 transition-all"
                                >
                                  <XCircle className="w-5 h-5 text-orange-400" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Click to Enable OMS</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center justify-center gap-2">
                            {aggregator.user?.status === 'INACTIVE' ? (
                              // Restore button for deleted aggregators
                              <Tooltip>
                                <TooltipTrigger>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-green-400 hover:text-foreground hover:bg-green-600/20 rounded-lg"
                                    onClick={() => handleRestore(aggregator.user?._id)}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Restore Aggregator</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              // Normal actions for active aggregators
                              <>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedAggregator(aggregator)
                                        setIsViewDialogOpen(true)
                                      }}
                                      className="text-primary hover:text-foreground hover:bg-muted"
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
                                      className="text-accent hover:text-foreground hover:bg-muted"
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

                                <Tooltip>
                                  <TooltipTrigger>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-300 hover:text-foreground hover:bg-red-600/20 rounded-lg"
                                      onClick={() => handleReject(aggregator.user?._id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Delete Aggregator</p>
                                  </TooltipContent>
                                </Tooltip>
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

            {!isTableLoading && filterStatus === 'INACTIVE' && paginatedAggregators.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No Deleted Aggregators
                </h3>
                <p className="text-muted-foreground">
                  All aggregators are currently active
                </p>
              </div>
            )}

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
          className="bg-background border border-border text-foreground max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="border-b border-border/50 pb-4 flex justify-between items-center">
            <div>
              <DialogTitle className="text-2xl font-bold text-foreground">
                Aggregator Profile
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm">
                Comprehensive overview of aggregator performance and details
              </DialogDescription>
            </div>

            <DialogClose asChild>
              <button
                className="p-2 rounded hover:bg-muted transition"
                aria-label="Close"
                onClick={() => setIsViewDialogOpen(false)}
              >
                <X className="w-5 h-5 text-muted-foreground" />
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
                      className="bg-green-500 hover:bg-green-600 text-foreground"
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
                      className="border-red-500 text-red-400 hover:bg-red-500 hover:text-foreground"
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
              <div className="bg-card/50 rounded-lg p-6 border border-border backdrop-blur-sm">
                <h3 className="text-lg font-semibold mb-4 text-primary flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg mt-1">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Username</p>
                      <p className="text-foreground font-semibold">{selectedAggregator.user?.username}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-purple-500/10 p-2 rounded-lg mt-1">
                      <Mail className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Email</p>
                      <p className="text-foreground font-semibold break-all">{selectedAggregator.user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-green-500/10 p-2 rounded-lg mt-1">
                      <Phone className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Contact</p>
                      <p className="text-foreground font-semibold">{selectedAggregator.user?.contact || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-orange-500/10 p-2 rounded-lg mt-1">
                      <Building className="w-4 h-4 text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Company Name</p>
                      <p className="text-foreground font-semibold">{selectedAggregator.companyName || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-cyan-500/10 p-2 rounded-lg mt-1">
                      <UserCheck className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Aggregator Type</p>
                      {selectedAggregator.aggregatorType === 'SOURCER' ? (
                        <Badge className="bg-green-500/20 text-emerald-400 border border-emerald-500/30">
                          <UserCheck className="w-3 h-3 mr-1" />
                          Sourcer
                        </Badge>
                      ) : selectedAggregator.aggregatorType === 'CHANNEL_PARTNER' ? (
                        <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30">
                          <Building className="w-3 h-3 mr-1" />
                          Channel Partner
                        </Badge>
                      ) : (
                        <Badge className="bg-muted/50 text-muted-foreground border border-border">
                          Not Set
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3 md:col-span-2">
                    <div className="bg-pink-500/10 p-2 rounded-lg mt-1">
                      <MapPin className="w-4 h-4 text-pink-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Address</p>
                      <p className="text-foreground font-semibold">{selectedAggregator.registeredAddress || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-card/50 rounded-lg p-6 border border-border backdrop-blur-sm">
                <h3 className="text-lg font-semibold mb-4 text-purple-400 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performance Metrics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4 border border-border">
                    <p className="text-xs text-muted-foreground mb-2">Total Applications</p>
                    <p className="text-2xl font-bold text-primary">{selectedAggregator.totalApplicationsSubmitted || 0}</p>
                  </div>

                  <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                    <p className="text-xs text-muted-foreground mb-2">Approved</p>
                    <p className="text-2xl font-bold text-green-400">{selectedAggregator.totalApplicationsApproved || 0}</p>
                  </div>

                  <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                    <p className="text-xs text-muted-foreground mb-2">Conversion Rate</p>
                    <p className="text-2xl font-bold text-purple-400">
                      {(selectedAggregator.conversionRate || 0) > 0 ? `${selectedAggregator.conversionRate.toFixed(1)}%` : 'N/A'}
                    </p>
                  </div>

                  <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                    <p className="text-xs text-muted-foreground mb-2">Commission Earned</p>
                    <p className="text-xl font-bold text-yellow-400">
                      {(selectedAggregator.totalCommissionEarned || 0) > 0
                        ? formatCurrency(selectedAggregator.totalCommissionEarned || 0)
                        : '₹0'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="bg-card/50 rounded-lg p-6 border border-border backdrop-blur-sm">
                <h3 className="text-lg font-semibold mb-4 text-green-400 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Activity Timeline
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 bg-muted/50 p-4 rounded-lg border border-border">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Join Date</p>
                      <p className="text-foreground font-semibold">
                        {selectedAggregator?.user?.createdAt
                          ? new Date(selectedAggregator.user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-background/50 p-4 rounded-lg border border-border/30">
                    <Activity className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-xs text-muted-foreground">Last Activity</p>
                      <p className="text-foreground font-semibold">
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
                <div className="flex gap-4 pt-4 border-t border-border/50">
                  <Button
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-foreground font-semibold py-3 shadow-lg shadow-green-500/20 transition-all duration-200"
                    onClick={() => {
                      handleApprove(selectedAggregator.user?._id)
                      setIsViewDialogOpen(false)
                    }}
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Approve Aggregator
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-foreground font-semibold py-3 shadow-lg shadow-red-500/20 transition-all duration-200"
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

      {/* Enable OMS Confirmation Dialog */}
      <Dialog open={isOmsDialogOpen} onOpenChange={setIsOmsDialogOpen}>
        <DialogContent className="bg-background border border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              Enable OMS
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to enable OMS for <span className="font-semibold text-foreground">{selectedAggregator?.companyName}</span>?
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsOmsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              disabled={updateAggHook.isPending}
              onClick={async () => {
                if (selectedAggregator?._id) {
                  updateAggHook.mutate(
                    { id: selectedAggregator._id, isOmsEnabled: true },
                    {
                      onSuccess: async () => {
                        try {
                          // Create Company in OMS
                          const companyRes = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_URL}/companies`, {
                            method: "POST",
                            headers: {
                              'Content-Type': 'application/json',
                              'companyid': String(selectedAggregator.companyId),
                            },
                            body: JSON.stringify({
                              name: selectedAggregator.companyName,
                              email: selectedAggregator.user?.email,
                              contactNumber: selectedAggregator.user?.contact,
                              companyId: selectedAggregator.companyId,
                            }),
                          });

                          if (!companyRes.ok) {
                            throw new Error("Company creation in OMS failed");
                          }

                          toast({
                            title: 'Success',
                            description: 'OMS Enabled Successfully',
                          })

                          setIsOmsDialogOpen(false)
                          setSelectedAggregator(null)
                          refetch()
                        } catch (error) {
                          toast({
                            title: 'Error',
                            description: error instanceof Error ? error.message : 'Failed to enable OMS',
                            variant: 'destructive',
                          })
                        }
                      },
                    }
                  )
                }
              }}
            >
              {updateAggHook.isPending ? 'Enabling...' : 'Yes, Enable'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
        <DialogContent className="bg-background border-border text-foreground max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-accent">
                  Team Members
                </DialogTitle>
                <DialogDescription className="text-muted-foreground mt-1">
                  <span className="font-semibold text-accent">{selectedCompanyName}</span> - {selectedTeamMembers.length} member{selectedTeamMembers.length !== 1 ? 's' : ''}
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsTeamMembersDialogOpen(false)}
                className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pr-2">
            {selectedTeamMembers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No team members found</p>
              </div>
            ) : (
              selectedTeamMembers.map((member, index) => (
                <motion.div
                  key={member._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-card/50 rounded-lg p-5 border border-border hover:border-cyan-500/50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full w-14 h-14 flex items-center justify-center border-2 border-cyan-500/30">
                        <User className="w-7 h-7 text-cyan-400" />
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-foreground">
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
                              <p className="text-xs text-muted-foreground">Email</p>
                              <p className="text-sm text-foreground font-medium truncate">
                                {member.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="bg-green-500/10 p-1.5 rounded">
                              <Phone className="w-3.5 h-3.5 text-green-400" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Contact</p>
                              <p className="text-sm text-foreground font-medium">
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
