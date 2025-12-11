"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CreditCard, Plus, Search, Edit, Trash2, Settings, TrendingUp, Percent, Building2, Users } from 'lucide-react'
import { TablePagination } from "@/components/ui/pagination"
import { CardSkeleton, TableSkeleton } from "@/components/ui/loading-skeleton"

const mockData = {
  metrics: {
    totalRules: 12,
    activeRules: 10,
    avgCommissionRate: 4.2,
    totalCommissionPaid: 2500000
  },
  commissionRules: [
    {
      id: 'CR001',
      name: 'Personal Loan - Tier 1',
      productType: 'Personal Loan',
      lenderType: 'Bank',
      minAmount: 100000,
      maxAmount: 1000000,
      commissionRate: 3.5,
      commissionType: 'Percentage',
      status: 'Active',
      createdDate: '2023-01-15',
      lastModified: '2025-01-10',
      applicableFor: 'All Aggregators'
    },
    {
      id: 'CR002',
      name: 'Home Loan - Premium',
      productType: 'Home Loan',
      lenderType: 'Bank',
      minAmount: 1000000,
      maxAmount: 10000000,
      commissionRate: 2.8,
      commissionType: 'Percentage',
      status: 'Active',
      createdDate: '2023-02-20',
      lastModified: '2025-01-08',
      applicableFor: 'Premium Aggregators'
    },
    {
      id: 'CR003',
      name: 'Business Loan - NBFC',
      productType: 'Business Loan',
      lenderType: 'NBFC',
      minAmount: 500000,
      maxAmount: 5000000,
      commissionRate: 4.5,
      commissionType: 'Percentage',
      status: 'Active',
      createdDate: '2023-03-10',
      lastModified: '2025-01-05',
      applicableFor: 'All Aggregators'
    },
    {
      id: 'CR004',
      name: 'Car Loan - Standard',
      productType: 'Car Loan',
      lenderType: 'Bank',
      minAmount: 200000,
      maxAmount: 2000000,
      commissionRate: 3.0,
      commissionType: 'Percentage',
      status: 'Active',
      createdDate: '2023-04-15',
      lastModified: '2025-01-03',
      applicableFor: 'All Aggregators'
    },
    {
      id: 'CR005',
      name: 'Education Loan - Special',
      productType: 'Education Loan',
      lenderType: 'Bank',
      minAmount: 100000,
      maxAmount: 3000000,
      commissionRate: 2.5,
      commissionType: 'Percentage',
      status: 'Inactive',
      createdDate: '2023-05-20',
      lastModified: '2023-12-15',
      applicableFor: 'Selected Aggregators'
    }
  ]
}

export function SuperAdminCommission() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterProductType, setFilterProductType] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
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
  }, [searchTerm, filterStatus, filterProductType])

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
      case 'Inactive': return 'bg-gray-500/20 text-gray-400'
      case 'Draft': return 'bg-orange-500/20 text-orange-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const filteredRules = useMemo(() => {
    return mockData.commissionRules.filter((rule) => {
      const matchesSearch =
        rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.productType.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = !filterStatus || filterStatus === "all" || rule.status === filterStatus
      const matchesProductType =
        !filterProductType || filterProductType === "all" || rule.productType === filterProductType
      return matchesSearch && matchesStatus && matchesProductType
    })
  }, [searchTerm, filterStatus, filterProductType])

  const total = filteredRules.length
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredRules.slice(start, start + pageSize)
  }, [filteredRules, page, pageSize])

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
          <h1 className="text-3xl font-bold text-white">Commission Management</h1>
          <p className="text-gray-400 mt-1">Configure and manage commission rules across the platform</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue to-cyan-500 text-dark">
              <Plus className="w-4 h-4 mr-2" />
              Create New Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl"
            onInteractOutside={(e) => {
              e.preventDefault();
            }}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Create Commission Rule</DialogTitle>
              <DialogDescription className="text-gray-400">
                Set up a new commission rule for loan products
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Rule Name</Label>
                  <Input className="bg-gray-900 border-gray-600 text-white" placeholder="Enter rule name" />
                </div>
                <div>
                  <Label className="text-gray-300">Product Type</Label>
                  <Select>
                    <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                      <SelectValue placeholder="Select product type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal Loan</SelectItem>
                      <SelectItem value="home">Home Loan</SelectItem>
                      <SelectItem value="business">Business Loan</SelectItem>
                      <SelectItem value="car">Car Loan</SelectItem>
                      <SelectItem value="education">Education Loan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Lender Type</Label>
                  <Select>
                    <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                      <SelectValue placeholder="Select lender type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">Bank</SelectItem>
                      <SelectItem value="nbfc">NBFC</SelectItem>
                      <SelectItem value="fintech">Fintech</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-300">Commission Type</Label>
                  <Select>
                    <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                      <SelectValue placeholder="Select commission type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Min Amount (₹)</Label>
                  <Input className="bg-gray-900 border-gray-600 text-white" placeholder="100000" />
                </div>
                <div>
                  <Label className="text-gray-300">Max Amount (₹)</Label>
                  <Input className="bg-gray-900 border-gray-600 text-white" placeholder="1000000" />
                </div>
              </div>
              <div>
                <Label className="text-gray-300">Commission Rate (%)</Label>
                <Input className="bg-gray-900 border-gray-600 text-white" placeholder="3.5" />
              </div>
              <div>
                <Label className="text-gray-300">Applicable For</Label>
                <Select>
                  <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                    <SelectValue placeholder="Select applicability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Aggregators</SelectItem>
                    <SelectItem value="premium">Premium Aggregators</SelectItem>
                    <SelectItem value="selected">Selected Aggregators</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-gradient-to-r from-blue to-cyan-500 text-dark">
                  Create Rule
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
            title="Total Rules"
            value={mockData.metrics.totalRules}
            icon={Settings}
            color="bg-blue/20 text-blue"
            subtitle="Commission rules"
          />
          <MetricCard
            title="Active Rules"
            value={mockData.metrics.activeRules}
            icon={CreditCard}
            color="bg-green-500/20 text-green-400"
            subtitle="Currently active"
          />
          <MetricCard
            title="Avg Commission Rate"
            value={`${mockData.metrics.avgCommissionRate}%`}
            icon={Percent}
            color="bg-gold/20 text-gold"
            subtitle="Platform average"
          />
          <MetricCard
            title="Total Commission Paid"
            value={formatCurrency(mockData.metrics.totalCommissionPaid)}
            icon={TrendingUp}
            color="bg-purple-500/20 text-purple-400"
            subtitle="This month"
          />
        </div>
      )}

      {/* Commission Rules Table */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Commission Rules</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage commission rates and rules for different loan products
                </CardDescription>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search rules..."
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
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterProductType} onValueChange={setFilterProductType}>
                  <SelectTrigger className="w-40 bg-gray-900 border-gray-600 text-white">
                    <SelectValue placeholder="Product Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="Personal Loan">Personal Loan</SelectItem>
                    <SelectItem value="Home Loan">Home Loan</SelectItem>
                    <SelectItem value="Business Loan">Business Loan</SelectItem>
                    <SelectItem value="Car Loan">Car Loan</SelectItem>
                    <SelectItem value="Education Loan">Education Loan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
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
                      <TableHead className="text-gray-300">Rule Name</TableHead>
                      <TableHead className="text-gray-300">Product Type</TableHead>
                      <TableHead className="text-gray-300">Lender Type</TableHead>
                      <TableHead className="text-gray-300">Amount Range</TableHead>
                      <TableHead className="text-gray-300">Commission Rate</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Applicable For</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((rule, index) => (
                      <motion.tr
                        key={rule.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border-gray-700 hover:bg-gray-800/50"
                      >
                        <TableCell>
                          <div>
                            <p className="text-white font-medium">{rule.name}</p>
                            <p className="text-sm text-gray-400">ID: {rule.id}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-gray-600 text-gray-300">
                            {rule.productType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">{rule.lenderType}</TableCell>
                        <TableCell className="text-white">
                          <div>
                            <p>{formatCurrency(rule.minAmount)}</p>
                            <p className="text-sm text-gray-400">to {formatCurrency(rule.maxAmount)}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-gold font-semibold">
                          {rule.commissionRate}%
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(rule.status)}>
                            {rule.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">{rule.applicableFor}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" className="text-gold hover:text-white hover:bg-gray-700">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-400 hover:text-white hover:bg-gray-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
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
    </div>
  )
}
