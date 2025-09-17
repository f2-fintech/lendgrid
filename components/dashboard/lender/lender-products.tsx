"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import {
  Plus,
  Search,
  Filter,
  TrendingUp,
  Users,
  DollarSign,
  FileText,
  Edit,
  Eye,
  MoreHorizontal,
  Percent,
  Calendar,
  CreditCard,
  Target,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CardSkeleton } from "@/components/ui/loading-skeleton"
import { productsApi } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth'

const mockProducts = [
  {
    id: "1",
    name: "Personal Loan Premium",
    type: "Personal Loan",
    interestRate: 12.5,
    commissionPercent: 2.5,
    minAmount: 50000,
    maxAmount: 1000000,
    tenure: "12-60 months",
    applications: 245,
    approvalRate: 78,
    totalDisbursed: 12500000,
    isActive: true,
    eligibility: ["Salaried", "Age 21-60", "Min Income 25k"],
    requiredDocs: ["PAN", "Aadhaar", "Salary Slips", "Bank Statements"],
  },
  {
    id: "2",
    name: "Business Growth Loan",
    type: "Business Loan",
    interestRate: 15.0,
    commissionPercent: 3.0,
    minAmount: 100000,
    maxAmount: 5000000,
    tenure: "12-84 months",
    applications: 89,
    approvalRate: 65,
    totalDisbursed: 8900000,
    isActive: true,
    eligibility: ["Business Owner", "Age 25-65", "Min Turnover 10L"],
    requiredDocs: ["PAN", "GST Certificate", "ITR", "Bank Statements"],
  },
  {
    id: "3",
    name: "Home Loan Express",
    type: "Home Loan",
    interestRate: 8.5,
    commissionPercent: 1.5,
    minAmount: 500000,
    maxAmount: 10000000,
    tenure: "60-360 months",
    applications: 156,
    approvalRate: 82,
    totalDisbursed: 25600000,
    isActive: true,
    eligibility: ["Salaried/Self-employed", "Age 21-65", "Min Income 40k"],
    requiredDocs: ["PAN", "Aadhaar", "Income Proof", "Property Papers"],
  },
  {
    id: "4",
    name: "Vehicle Loan Fast",
    type: "Vehicle Loan",
    interestRate: 10.5,
    commissionPercent: 2.0,
    minAmount: 100000,
    maxAmount: 2000000,
    tenure: "12-84 months",
    applications: 198,
    approvalRate: 85,
    totalDisbursed: 15800000,
    isActive: false,
    eligibility: ["Salaried/Self-employed", "Age 21-65", "Min Income 20k"],
    requiredDocs: ["PAN", "Aadhaar", "Income Proof", "Vehicle Invoice"],
  },
]

export function LenderProducts() {
  const { loading, user } = useAuth('lender_admin')
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [cardsLoading, setCardsLoading] = useState(true)
  const { toast } = useToast()

  const [products, setProducts] = useState(mockProducts)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    type: '',
    interestRate: '',
    commissionPercent: '',
    minAmount: '',
    maxAmount: '',
    tenure: '12-60 months',
    eligibility: '',
    requiredDocs: '',
    isActive: true,
  })

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const lenderId = (user as any)?._id || (user as any)?.id
        const resp = await productsApi.list({ page: 1, limit: 50, lenderId })
        const results = resp?.data?.results || []
        if (mounted && results.length) {
          const mapped = results.map((r: any) => ({
            id: r._id,
            name: r.name,
            type: r.type,
            interestRate: r.interestRate,
            commissionPercent: r.commissionPercent,
            minAmount: r.minAmount,
            maxAmount: r.maxAmount,
            tenure: r.tenure,
            applications: 0,
            approvalRate: 0,
            totalDisbursed: 0,
            isActive: r.isActive,
            eligibility: r.eligibility || [],
            requiredDocs: r.requiredDocs || [],
          }))
          setProducts(mapped)
        } else if (mounted) {
          setProducts(mockProducts)
        }
      } finally {
        if (mounted) setCardsLoading(false)
      }
    }
    // Wait for user to be available
    if (!loading) {
      load()
    }
    return () => { mounted = false }
  }, [loading, user])

  const openCreate = () => {
    setIsEditMode(false)
    setEditingId(null)
    setForm({ name: '', type: '', interestRate: '', commissionPercent: '', minAmount: '', maxAmount: '', tenure: '12-60 months', eligibility: '', requiredDocs: '', isActive: true })
    setIsDialogOpen(true)
  }

  const openEdit = (p: any) => {
    setIsEditMode(true)
    setEditingId(p.id)
    setForm({
      name: p.name,
      type: p.type,
      interestRate: String(p.interestRate),
      commissionPercent: String(p.commissionPercent),
      minAmount: String(p.minAmount),
      maxAmount: String(p.maxAmount),
      tenure: p.tenure,
      eligibility: (p.eligibility || []).join(', '),
      requiredDocs: (p.requiredDocs || []).join(', '),
      isActive: !!p.isActive,
    })
    setIsDialogOpen(true)
  }

  const submit = async () => {
    try {
      const payload = {
        name: form.name,
        type: form.type,
        interestRate: Number(form.interestRate),
        commissionPercent: Number(form.commissionPercent),
        minAmount: Number(form.minAmount),
        maxAmount: Number(form.maxAmount),
        tenure: form.tenure,
        eligibility: form.eligibility ? form.eligibility.split(',').map(s => s.trim()).filter(Boolean) : [],
        requiredDocs: form.requiredDocs ? form.requiredDocs.split(',').map(s => s.trim()).filter(Boolean) : [],
        isActive: form.isActive,
      } as any

      if (isEditMode && editingId) {
        await productsApi.update(editingId, payload)
        toast({ title: 'Product updated' })
      } else {
        // Backend infers lenderId from JWT
        await productsApi.create(payload)
        toast({ title: 'Product created' })
      }

      const lenderId = (user as any)?._id || (user as any)?.id
      const refreshed = await productsApi.list({ page: 1, limit: 50, lenderId })
      const results = refreshed?.data?.results || []
      const mapped = results.map((r: any) => ({
        id: r._id,
        name: r.name,
        type: r.type,
        interestRate: r.interestRate,
        commissionPercent: r.commissionPercent,
        minAmount: r.minAmount,
        maxAmount: r.maxAmount,
        tenure: r.tenure,
        applications: 0,
        approvalRate: 0,
        totalDisbursed: 0,
        isActive: r.isActive,
        eligibility: r.eligibility || [],
        requiredDocs: r.requiredDocs || [],
      }))
      setProducts(mapped.length ? mapped : mockProducts)
      setIsDialogOpen(false)
    } catch (e: any) {
      toast({ title: 'Action failed', description: e?.message || 'Please try again.' })
    }
  }

  if (loading) {
    return (
      <DashboardLayout userRole="lender">
        <div className="space-y-6 p-6 text-white">Loading...</div>
      </DashboardLayout>
    )
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "active" && product.isActive) ||
      (filterStatus === "inactive" && !product.isActive)
    return matchesSearch && matchesFilter
  })

  const totalProducts = products.length
  const activeProducts = products.filter((p) => p.isActive).length
  const totalApplications = products.reduce((sum, p) => sum + (p as any).applications, 0)
  const avgApprovalRate = products.reduce((sum, p) => sum + (p as any).approvalRate, 0) / (products.length || 1)

  return (
    <DashboardLayout userRole="lender">
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-white">Product Management</h1>
            <p className="text-gray-400 mt-1">Manage your loan products and track performance</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} className="bg-gradient-to-r from-gold to-blue hover:from-gold/80 hover:to-blue/80 text-dark">
                <Plus className="w-4 h-4 mr-2" />
                Create Product
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle>{isEditMode ? 'Edit Product' : 'Create New Product'}</DialogTitle>
                <DialogDescription className="text-gray-400">
                  {isEditMode ? 'Update your loan product' : 'Add a new loan product to your portfolio'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="productName">Product Name</Label>
                  <Input id="productName" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter product name" className="bg-gray-800 border-gray-700" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productType">Product Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="Personal Loan">Personal Loan</SelectItem>
                      <SelectItem value="Business Loan">Business Loan</SelectItem>
                      <SelectItem value="Home Loan">Home Loan</SelectItem>
                      <SelectItem value="Vehicle Loan">Vehicle Loan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interestRate">Interest Rate (%)</Label>
                  <Input id="interestRate" type="number" value={form.interestRate} onChange={e => setForm({ ...form, interestRate: e.target.value })} placeholder="12.5" className="bg-gray-800 border-gray-700" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commission">Commission (%)</Label>
                  <Input id="commission" type="number" value={form.commissionPercent} onChange={e => setForm({ ...form, commissionPercent: e.target.value })} placeholder="2.5" className="bg-gray-800 border-gray-700" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minAmount">Min Amount (₹)</Label>
                  <Input id="minAmount" type="number" value={form.minAmount} onChange={e => setForm({ ...form, minAmount: e.target.value })} placeholder="50000" className="bg-gray-800 border-gray-700" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxAmount">Max Amount (₹)</Label>
                  <Input id="maxAmount" type="number" value={form.maxAmount} onChange={e => setForm({ ...form, maxAmount: e.target.value })} placeholder="1000000" className="bg-gray-800 border-gray-700" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenure">Tenure</Label>
                  <Select value={form.tenure} onValueChange={(v) => setForm({ ...form, tenure: v })}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Select tenure" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {/* Months */}
                      <SelectItem value="6-12 months">6-12 months</SelectItem>
                      <SelectItem value="12-24 months">12-24 months</SelectItem>
                      <SelectItem value="12-36 months">12-36 months</SelectItem>
                      <SelectItem value="12-60 months">12-60 months</SelectItem>
                      <SelectItem value="24-60 months">24-60 months</SelectItem>
                      <SelectItem value="36-84 months">36-84 months</SelectItem>
                      {/* Years */}
                      <SelectItem value="1-3 years">1-3 years</SelectItem>
                      <SelectItem value="1-5 years">1-5 years</SelectItem>
                      <SelectItem value="5-10 years">5-10 years</SelectItem>
                      <SelectItem value="10-30 years">10-30 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="eligibility">Eligibility Criteria</Label>
                  <Textarea id="eligibility" value={form.eligibility} onChange={e => setForm({ ...form, eligibility: e.target.value })} placeholder="Comma-separated list..." className="bg-gray-800 border-gray-700" />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="requiredDocs">Required Documents</Label>
                  <Textarea id="requiredDocs" value={form.requiredDocs} onChange={e => setForm({ ...form, requiredDocs: e.target.value })} placeholder="Comma-separated list..." className="bg-gray-800 border-gray-700" />
                </div>
                <div className="col-span-2 flex items-center space-x-2">
                  <Switch id="isActive" checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
                  <Label htmlFor="isActive">Active Product</Label>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={submit} className="bg-gradient-to-r from-gold to-blue text-dark">{isEditMode ? 'Save Changes' : 'Create Product'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {cardsLoading ? (
            <CardSkeleton headerLines={2} bodyHeight={16} />
          ) : (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Products</p>
                    <p className="text-2xl font-bold text-white">{totalProducts}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue" />
                </div>
              </CardContent>
            </Card>
          )}
          {cardsLoading ? (
            <CardSkeleton headerLines={2} bodyHeight={16} />
          ) : (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Active Products</p>
                    <p className="text-2xl font-bold text-white">{activeProducts}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          )}
          {cardsLoading ? (
            <CardSkeleton headerLines={2} bodyHeight={16} />
          ) : (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Applications</p>
                    <p className="text-2xl font-bold text-white">{totalApplications}</p>
                  </div>
                  <Users className="w-8 h-8 text-gold" />
                </div>
              </CardContent>
            </Card>
          )}

          {cardsLoading ? (
            <CardSkeleton headerLines={2} bodyHeight={16} />
          ) : (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Avg Approval Rate</p>
                    <p className="text-2xl font-bold text-white">{avgApprovalRate.toFixed(1)}%</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue" />
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-900/50 border-gray-800 text-white"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-48 bg-gray-900/50 border-gray-800 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-800">
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Products Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ y: -4 }}
              className="group"
            >
              {cardsLoading ? (
                <CardSkeleton bodyHeight={254} />
              ) : (
                <Card className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/60 border border-gray-700/50 hover:border-gold/30 transition-all duration-300 overflow-hidden group-hover:shadow-2xl group-hover:shadow-gold/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-blue/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <CardHeader className="pb-4 relative z-10">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${product.isActive ? "bg-green-400 shadow-lg shadow-green-400/50" : "bg-gray-500"} animate-pulse`}
                          />
                          <CardTitle className="text-xl font-bold text-white group-hover:text-gold transition-colors duration-300">
                            {product.name}
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={product.isActive ? "default" : "secondary"}
                            className={`${product.isActive
                              ? "bg-gradient-to-r from-green-500/20 to-green-400/20 text-green-400 border-green-400/30"
                              : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                              } font-medium`}
                          >
                            {product.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <CardDescription className="text-gray-300 font-medium">{product.type}</CardDescription>
                        </div>
                      </div>
                      {/* <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-gold hover:bg-gold/10 transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-gray-800 border-gray-700">
                          <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-700">
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-700">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Product
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu> */}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6 relative z-10">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-blue/10 to-blue/5 rounded-lg p-4 border border-blue/20 group-hover:border-blue/40 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <Percent className="w-4 h-4 text-blue" />
                          <p className="text-gray-400 text-sm font-medium">Interest Rate</p>
                        </div>
                        <p className="text-2xl font-bold text-white">{product.interestRate}%</p>
                      </div>

                      <div className="bg-gradient-to-br from-gold/10 to-gold/5 rounded-lg p-4 border border-gold/20 group-hover:border-gold/40 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-4 h-4 text-gold" />
                          <p className="text-gray-400 text-sm font-medium">Commission</p>
                        </div>
                        <p className="text-2xl font-bold text-white">{product.commissionPercent}%</p>
                      </div>

                      <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg p-4 border border-green-500/20 group-hover:border-green-500/40 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard className="w-4 h-4 text-green-400" />
                          <p className="text-gray-400 text-sm font-medium">Loan Range</p>
                        </div>
                        <p className="text-lg font-bold text-white">
                          ₹{(product.minAmount / 100000).toFixed(1)}L - ₹{(product.maxAmount / 100000).toFixed(1)}L
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-lg p-4 border border-purple-500/20 group-hover:border-purple-500/40 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-purple-400" />
                          <p className="text-gray-400 text-sm font-medium">Tenure</p>
                        </div>
                        <p className="text-lg font-bold text-white">{product.tenure}</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/30 rounded-xl p-4 border border-gray-600/30">
                      <h4 className="text-gray-300 font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-gold" />
                        Performance Metrics
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="bg-blue/10 rounded-lg p-3 mb-2">
                            <Users className="w-5 h-5 text-blue mx-auto mb-1" />
                            <p className="text-gray-400 text-xs font-medium">Applications</p>
                            <p className="text-xl font-bold text-white">{product.applications}</p>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="bg-green-500/10 rounded-lg p-3 mb-2">
                            <Target className="w-5 h-5 text-green-400 mx-auto mb-1" />
                            <p className="text-gray-400 text-xs font-medium">Approval Rate</p>
                            <p className="text-xl font-bold text-white">{product.approvalRate}%</p>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="bg-gold/10 rounded-lg p-3 mb-2">
                            <DollarSign className="w-5 h-5 text-gold mx-auto mb-1" />
                            <p className="text-gray-400 text-xs font-medium">Disbursed</p>
                            <p className="text-xl font-bold text-white">
                              ₹{(product.totalDisbursed / 10000000).toFixed(1)}Cr
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gray-600 text-gray-300 hover:bg-blue/10 hover:border-blue/50 hover:text-blue transition-all bg-transparent"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-gold to-blue hover:from-gold/80 hover:to-blue/80 text-dark font-medium transition-all"
                        onClick={() => openEdit(product)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Product
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
