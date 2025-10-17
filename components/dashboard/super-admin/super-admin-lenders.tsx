"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { usersApi } from '@/lib/api-client'
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

// import { useLenders } from '@/hooks/use-lenders'

export function SuperAdminLenders() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [selectedLender, setSelectedLender] = useState<any>(null)
  const [editingLender, setEditingLender] = useState<any>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isTableLoading, setIsTableLoading] = useState(false)
  const { toast } = useToast()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const tableTopRef = useRef<HTMLDivElement | null>(null)

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [searchTerm, filterStatus, filterType])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-500/20 text-green-400'
      case 'Pending': return 'bg-orange-500/20 text-orange-400'
      case 'Inactive': return 'bg-gray-500/20 text-gray-400'
      case 'Rejected': return 'bg-red-500/20 text-red-400'
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

  // const {
  //   lenders,
  //   total,
  //   pages,
  //   metrics,
  //   loading: isTableLoading,
  //   error,
  //   mutate,
  // } = useLenders({ page, limit: pageSize })

  // const handleLenderUpdated = () => {
  //   mutate()
  // }

  // const filteredLenders = useMemo(() => {
  //   if (!lenders) return []
  //   return lenders.filter((lender) => {
  //     const matchesSearch =
  //       lender.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //       (lender.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()))
  //     const matchesStatus = !filterStatus || filterStatus === "all" || lender.status === filterStatus
  //     const matchesType = !filterType || filterType === "all" || lender.lenderType === filterType
  //     return matchesSearch && matchesStatus && matchesType
  //   })
  // }, [lenders, searchTerm, filterStatus, filterType])

  // // For server-side pagination, use filtered count
  // const totalFiltered = filteredLenders.length
  // const pagesFiltered = Math.ceil(totalFiltered / pageSize)

  // const paginated = useMemo(() => {
  //   const start = (page - 1) * pageSize
  //   return filteredLenders.slice(start, start + pageSize)
  // }, [filteredLenders, page, pageSize])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(1)
    tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const handleApprove = async (lenderId: string) => {
    try {
      await usersApi.updateUser({
        id: lenderId,
        status: 'active'
      })

      // Show success message
      toast({
        title: 'Success',
        description: 'Lender has been approved successfully.',
      })

      // Refresh data by updating the page state to trigger re-fetch
      // handleLenderUpdated()
    } catch (error) {
      console.error('Approve lender error:', error)
      toast({
        title: 'Error',
        description: 'Failed to approve lender. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleReject = async (lenderId: string) => {
    try {
      await usersApi.updateUser({
        id: lenderId,
        status: 'inactive'
      })

      // Show success message
      toast({
        title: 'Success',
        description: 'Lender has been rejected.',
      })

      // Refresh data by updating the page state to trigger re-fetch
      // handleLenderUpdated()
    } catch (error) {
      console.error('Reject lender error:', error)
      toast({
        title: 'Error',
        description: 'Failed to reject lender. Please try again.',
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
          <AddLenderDialog onLenderUpdated={() => { }} />
        </motion.div>

        {/* Metrics Cards */}
        {isTableLoading ? (
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
              // value={metrics?.totalLenders || 0}
              icon={Building2}
              color="bg-blue/20 text-blue"
              subtitle="Registered partners"
            />
            <MetricCard
              title="Active Lenders"
              // value={metrics?.activeLenders || 0}
              icon={CheckCircle}
              color="bg-green-500/20 text-green-400"
              subtitle="Currently operational"
            />
            <MetricCard
              title="Pending Approvals"
              // value={metrics?.pendingApprovals || 0}
              icon={AlertCircle}
              color="bg-orange-500/20 text-orange-400"
              subtitle="Awaiting review"
            />
            <MetricCard
              title="Avg Commission Rate"
              // value={`${metrics?.avgCommissionRate || 0}%`}
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
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
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
              {/* <div className="overflow-x-auto"> */}
              {/* {isTableLoading ? (
                  <TableSkeleton columns={9} rows={pageSize} />
                ) : paginated.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No lenders found matching your criteria.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="text-gray-300">Lender</TableHead>
                        <TableHead className="text-gray-300">Type</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-300">KYC Status</TableHead>
                        <TableHead className="text-gray-300">Total Volume</TableHead>
                        <TableHead className="text-gray-300">Products</TableHead>
                        <TableHead className="text-gray-300">Avg Commission</TableHead>
                        <TableHead className="text-gray-300">Join Date</TableHead>
                        <TableHead className="text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginated.map((lender, index) => (
                        <motion.tr
                          key={lender.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="border-gray-700 hover:bg-gray-800/50"
                        >
                          <TableCell>
                            <div>
                              <p className="text-white font-medium">{lender.name}</p>
                              <p className="text-sm text-gray-400">{lender.contactPerson}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-gray-600 text-gray-300">
                              {lender.lenderType || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(lender.status)}>
                              {lender.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getKycStatusColor(lender.kycStatus)}>
                              {lender.kycStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-white">
                            {lender.totalVolume > 0 ? formatCurrency(lender.totalVolume) : '-'}
                          </TableCell>
                          <TableCell className="text-white">{lender.productsCount}</TableCell>
                          <TableCell className="text-gold">
                            {lender.avgCommission > 0 ? `${lender.avgCommission}%` : '-'}
                          </TableCell>
                          <TableCell className="text-gray-300">{lender.joinDate}</TableCell>
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
                              <AddLenderDialog lender={lender} onLenderUpdated={handleLenderUpdated} />
                              {lender.status === 'Pending' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-green-400 hover:text-white hover:bg-gray-700"
                                    onClick={() => handleApprove(lender.id)}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-400 hover:text-white hover:bg-gray-700"
                                    onClick={() => handleReject(lender.id)}
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
              </div> */}

              {!isTableLoading && (
                <TablePagination
                  page={page}
                  pageSize={pageSize}
                  // total={totalFiltered}
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
                    <p className="text-white font-semibold mt-1">{selectedLender.name}</p>
                  </div>
                  <div>
                    <Label className="text-gray-300">Type</Label>
                    <p className="text-white font-semibold mt-1">{selectedLender.type}</p>
                  </div>
                  <div>
                    <Label className="text-gray-300">Status</Label>
                    <Badge className={`${getStatusColor(selectedLender.status)} mt-1`}>
                      {selectedLender.status}
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
                    <p className="text-white font-semibold mt-1">{selectedLender.contactPerson}</p>
                  </div>
                  <div>
                    <Label className="text-gray-300">Email</Label>
                    <p className="text-white font-semibold mt-1">{selectedLender.email}</p>
                  </div>
                  <div>
                    <Label className="text-gray-300">Phone</Label>
                    <p className="text-white font-semibold mt-1">{selectedLender.phone}</p>
                  </div>
                  <div>
                    <Label className="text-gray-300">Address</Label>
                    <p className="text-white font-semibold mt-1">{selectedLender.address}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <Label className="text-gray-300">Total Volume</Label>
                    <p className="text-white font-semibold mt-1">
                      {selectedLender.totalVolume > 0 ? formatCurrency(selectedLender.totalVolume) : 'No transactions yet'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-300">Products Count</Label>
                    <p className="text-white font-semibold mt-1">{selectedLender.productsCount}</p>
                  </div>
                  <div>
                    <Label className="text-gray-300">Avg Commission</Label>
                    <p className="text-white font-semibold mt-1">
                      {selectedLender.avgCommission > 0 ? `${selectedLender.avgCommission}%` : 'Not applicable'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-gray-300">Join Date</Label>
                    <p className="text-white font-semibold mt-1">{selectedLender.joinDate}</p>
                  </div>
                  <div>
                    <Label className="text-gray-300">Last Activity</Label>
                    <p className="text-white font-semibold mt-1">{selectedLender.lastActivity}</p>
                  </div>
                </div>

                {selectedLender.status === 'Pending' && (
                  <div className="flex items-center space-x-4 pt-4 border-t border-gray-700">
                    <Button
                      className="bg-green-500 hover:bg-green-600 text-white"
                      onClick={() => {
                        handleApprove(selectedLender.id)
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
                        handleReject(selectedLender.id)
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
      </div>
  )
}