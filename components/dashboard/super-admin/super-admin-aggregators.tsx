"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { usersApi } from '@/lib/api-client'
import { AddAggregatorDialog } from './dialogs/add-aggregator-dialog'
import { Users, Plus, Search, Edit, CheckCircle, XCircle, Eye, AlertCircle, TrendingUp, CreditCard, Building2 } from 'lucide-react'
import { TablePagination } from "@/components/ui/pagination"
import { CardSkeleton, TableSkeleton } from "@/components/ui/loading-skeleton"

const mockData = {
  metrics: {
    totalAggregators: 24,
    activeAggregators: 21,
    pendingApprovals: 4,
    avgConversionRate: 68.5
  },
  aggregators: [
    {
      id: 'AGG001',
      name: 'FinTech Solutions Pvt Ltd',
      contactPerson: 'Rahul Sharma',
      email: 'rahul@fintechsolutions.com',
      phone: '+91 98765 43210',
      status: 'Active',
      joinDate: '2023-01-15',
      totalApplications: 1250,
      approvedApplications: 856,
      conversionRate: 68.5,
      totalCommission: 125000,
      address: 'Mumbai, Maharashtra',
      kycStatus: 'Verified',
      lastActivity: '2025-01-20'
    },
    {
      id: 'AGG002',
      name: 'Loan Connect India',
      contactPerson: 'Priya Patel',
      email: 'priya@loanconnect.in',
      phone: '+91 98765 43211',
      status: 'Active',
      joinDate: '2023-02-20',
      totalApplications: 980,
      approvedApplications: 672,
      conversionRate: 68.6,
      totalCommission: 98000,
      address: 'Bangalore, Karnataka',
      kycStatus: 'Verified',
      lastActivity: '2025-01-19'
    },
    {
      id: 'AGG003',
      name: 'Credit Bridge Solutions',
      contactPerson: 'Amit Kumar',
      email: 'amit@creditbridge.com',
      phone: '+91 98765 43212',
      status: 'Active',
      joinDate: '2023-03-10',
      totalApplications: 750,
      approvedApplications: 525,
      conversionRate: 70.0,
      totalCommission: 75000,
      address: 'Pune, Maharashtra',
      kycStatus: 'Verified',
      lastActivity: '2025-01-18'
    },
    {
      id: 'AGG004',
      name: 'Digital Loan Hub',
      contactPerson: 'Suresh Gupta',
      email: 'suresh@digitalloan.com',
      phone: '+91 98765 43213',
      status: 'Pending',
      joinDate: '2025-01-15',
      totalApplications: 0,
      approvedApplications: 0,
      conversionRate: 0,
      totalCommission: 0,
      address: 'Delhi, Delhi',
      kycStatus: 'Under Review',
      lastActivity: '2025-01-15'
    },
    {
      id: 'AGG005',
      name: 'Quick Finance Partners',
      contactPerson: 'Neha Singh',
      email: 'neha@quickfinance.com',
      phone: '+91 98765 43214',
      status: 'Suspended',
      joinDate: '2023-08-05',
      totalApplications: 320,
      approvedApplications: 192,
      conversionRate: 60.0,
      totalCommission: 32000,
      address: 'Chennai, Tamil Nadu',
      kycStatus: 'Verified',
      lastActivity: '2023-12-15'
    },
    {
      id: 'AGG006',
      name: 'Asset Partners',
      contactPerson: 'Gurmeet Singh',
      email: 'gurmeet@quickfinance.com',
      phone: '+91 98765 43214',
      status: 'Suspended',
      joinDate: '2023-08-05',
      totalApplications: 320,
      approvedApplications: 192,
      conversionRate: 60.0,
      totalCommission: 32000,
      address: 'Chennai, Tamil Nadu',
      kycStatus: 'Verified',
      lastActivity: '2023-12-15'
    }
  ]
}

export function SuperAdminAggregators() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedAggregator, setSelectedAggregator] = useState<any>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const { toast } = useToast()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [isTableLoading, setIsTableLoading] = useState(true)
  const [cardsLoading, setCardsLoading] = useState(true)
  const tableTopRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setIsTableLoading(false)
      setCardsLoading(false)
    }, 2000)
    return () => clearTimeout(t)
  }, [])

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-500/20 text-green-400'
      case 'Pending': return 'bg-orange-500/20 text-orange-400'
      case 'Suspended': return 'bg-red-500/20 text-red-400'
      case 'Inactive': return 'bg-gray-500/20 text-gray-400'
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
    return mockData.aggregators.filter((aggregator) => {
      const matchesSearch =
        aggregator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aggregator.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = !filterStatus || filterStatus === "all" || aggregator.status === filterStatus
      return matchesSearch && matchesStatus
    })
  }, [searchTerm, filterStatus])

  const total = filteredAggregators.length
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredAggregators.slice(start, start + pageSize)
  }, [filteredAggregators, page, pageSize])

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

  const handleApprove = async (aggregatorId: string) => {
    try {
      await usersApi.updateUser({
        id: aggregatorId,
        status: 'ACTIVE'
      })
      
      // Refresh data
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

      // Refresh data
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
          <h1 className="text-3xl font-bold text-white">Aggregator Management</h1>
          <p className="text-gray-400 mt-1">Manage and monitor all registered aggregators</p>
        </div>
        <AddAggregatorDialog />
      </motion.div>

      {/* Metrics Cards */}
      {cardsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardSkeleton headerLines={2} bodyHeight={20} />
          <CardSkeleton headerLines={2} bodyHeight={20} />
          <CardSkeleton headerLines={2} bodyHeight={20} />
          <CardSkeleton headerLines={2} bodyHeight={20} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Aggregators"
            value={mockData.metrics.totalAggregators}
            icon={Users}
            color="bg-blue/20 text-blue"
            subtitle="Registered partners"
          />
          <MetricCard
            title="Active Aggregators"
            value={mockData.metrics.activeAggregators}
            icon={CheckCircle}
            color="bg-green-500/20 text-green-400"
            subtitle="Currently operational"
          />
          <MetricCard
            title="Pending Approvals"
            value={mockData.metrics.pendingApprovals}
            icon={AlertCircle}
            color="bg-orange-500/20 text-orange-400"
            subtitle="Awaiting review"
          />
          <MetricCard
            title="Avg Conversion Rate"
            value={`${mockData.metrics.avgConversionRate}%`}
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
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={tableTopRef} />
            <div className="overflow-x-auto">
              {isTableLoading ? (
                <TableSkeleton columns={10} rows={pageSize} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">Aggregator</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">KYC Status</TableHead>
                      <TableHead className="text-gray-300">Applications</TableHead>
                      <TableHead className="text-gray-300">Conversion Rate</TableHead>
                      <TableHead className="text-gray-300">Total Commission</TableHead>
                      <TableHead className="text-gray-300">Join Date</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((aggregator, index) => (
                      <motion.tr
                        key={aggregator.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border-gray-700 hover:bg-gray-800/50"
                      >
                        <TableCell>
                          <div>
                            <p className="text-white font-medium">{aggregator.name}</p>
                            <p className="text-sm text-gray-400">{aggregator.contactPerson}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(aggregator.status)}>
                            {aggregator.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getKycStatusColor(aggregator.kycStatus)}>
                            {aggregator.kycStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white">
                          <div>
                            <p>{aggregator.totalApplications}</p>
                            <p className="text-sm text-gray-400">
                              {aggregator.approvedApplications} approved
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-gold">
                          {aggregator.conversionRate > 0 ? `${aggregator.conversionRate}%` : '-'}
                        </TableCell>
                        <TableCell className="text-white">
                          {aggregator.totalCommission > 0 ? formatCurrency(aggregator.totalCommission) : '-'}
                        </TableCell>
                        <TableCell className="text-gray-300">{aggregator.joinDate}</TableCell>
                        <TableCell>
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
                            <Button variant="ghost" size="sm" className="text-gold hover:text-white hover:bg-gray-700">
                              <Edit className="w-4 h-4" />
                            </Button>
                            {aggregator.status === 'Pending' && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-green-400 hover:text-white hover:bg-gray-700"
                                  onClick={() => handleApprove(aggregator.id)}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-400 hover:text-white hover:bg-gray-700"
                                  onClick={() => handleReject(aggregator.id)}
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
                  <Label className="text-gray-300">Company Name</Label>
                  <p className="text-white font-semibold mt-1">{selectedAggregator.name}</p>
                </div>
                <div>
                  <Label className="text-gray-300">Contact Person</Label>
                  <p className="text-white font-semibold mt-1">{selectedAggregator.contactPerson}</p>
                </div>
                <div>
                  <Label className="text-gray-300">Status</Label>
                  <Badge className={`${getStatusColor(selectedAggregator.status)} mt-1`}>
                    {selectedAggregator.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-gray-300">KYC Status</Label>
                  <Badge className={`${getKycStatusColor(selectedAggregator.kycStatus)} mt-1`}>
                    {selectedAggregator.kycStatus}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-gray-300">Email</Label>
                  <p className="text-white font-semibold mt-1">{selectedAggregator.email}</p>
                </div>
                <div>
                  <Label className="text-gray-300">Phone</Label>
                  <p className="text-white font-semibold mt-1">{selectedAggregator.phone}</p>
                </div>
                <div>
                  <Label className="text-gray-300">Address</Label>
                  <p className="text-white font-semibold mt-1">{selectedAggregator.address}</p>
                </div>
                <div>
                  <Label className="text-gray-300">Join Date</Label>
                  <p className="text-white font-semibold mt-1">{selectedAggregator.joinDate}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <Label className="text-gray-300">Total Applications</Label>
                  <p className="text-white font-semibold mt-1">{selectedAggregator.totalApplications}</p>
                </div>
                <div>
                  <Label className="text-gray-300">Approved Applications</Label>
                  <p className="text-white font-semibold mt-1">{selectedAggregator.approvedApplications}</p>
                </div>
                <div>
                  <Label className="text-gray-300">Conversion Rate</Label>
                  <p className="text-white font-semibold mt-1">
                    {selectedAggregator.conversionRate > 0 ? `${selectedAggregator.conversionRate}%` : 'Not applicable'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-gray-300">Total Commission Earned</Label>
                  <p className="text-white font-semibold mt-1">
                    {selectedAggregator.totalCommission > 0 ? formatCurrency(selectedAggregator.totalCommission) : 'No earnings yet'}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-300">Last Activity</Label>
                  <p className="text-white font-semibold mt-1">{selectedAggregator.lastActivity}</p>
                </div>
              </div>

              {selectedAggregator.status === 'Pending' && (
                <div className="flex items-center space-x-4 pt-4 border-t border-gray-700">
                  <Button 
                    className="bg-green-500 hover:bg-green-600 text-white"
                    onClick={() => {
                      handleApprove(selectedAggregator.id)
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
                      handleReject(selectedAggregator.id)
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
