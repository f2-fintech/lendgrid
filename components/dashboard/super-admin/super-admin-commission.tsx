"use client"

import { z } from 'zod'
import { Controller, useForm } from 'react-hook-form'
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CreditCard, Plus, Search, Edit, Trash2, Settings, TrendingUp, Percent, AlertCircle, Info } from 'lucide-react'
import { TablePagination } from "@/components/ui/pagination"
import { CardSkeleton, TableSkeleton } from "@/components/ui/loading-skeleton"
import { toast } from '@/hooks/use-toast'
import {
  useCommissionRules,
  useCreateCommissionRule,
  useUpdateCommissionRule,
  useDeleteCommissionRule,
} from '@/hooks/use-commissions'
import {
  CommissionType,
  RuleStatus,
  ApplicableFor,
  CreateCommissionRuleInput
} from '@/lib/api-types'

// Schema with validation
export const commissionRuleSchema = z.object({
  ruleName: z
    .string()
    .min(3, "Rule name must be at least 3 characters")
    .max(100, "Rule name must be less than 100 characters"),

  productType: z
    .string()
    .min(1, "Product type is required"),

  commissionType: z.nativeEnum(CommissionType, {
    required_error: "Commission type is required",
  }),

  commissionRate: z
    .number({ invalid_type_error: "Commission rate is required" })
    .positive("Must be greater than 0")
    .max(100, "Rate cannot exceed 100%"),

  minAmount: z
    .number({ invalid_type_error: "Min amount is required" })
    .min(1000, "Minimum amount must be at least ₹1,000")
    .positive(),

  maxAmount: z
    .number({ invalid_type_error: "Max amount is required" })
    .positive(),

  applicableFor: z.nativeEnum(ApplicableFor, {
    required_error: "Applicability is required",
  }),

  priority: z
    .number()
    .int()
    .min(0, "Priority must be 0 or greater")
    .max(100, "Priority cannot exceed 100")
    .optional(),

  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
})
  .refine((data) => data.maxAmount > data.minAmount, {
    message: "Max amount must be greater than Min amount",
    path: ["maxAmount"],
  })

export type CommissionRuleFormValues = z.infer<typeof commissionRuleSchema>

export function SuperAdminCommission() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<RuleStatus | ''>('')
  const [filterProductType, setFilterProductType] = useState('')
  const [filterApplicableFor, setFilterApplicableFor] = useState<ApplicableFor | ''>('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<any>(null)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const tableTopRef = useRef<HTMLDivElement | null>(null)

  const {
    data: rulesData,
    isLoading: isTableLoading,
    isError,
    error,
    refetch,
  } = useCommissionRules({
    page,
    limit: pageSize,
    filters: {
      status: filterStatus || undefined,
      productType: filterProductType || undefined,
      applicableFor: filterApplicableFor || undefined,
    },
  })

  const createRuleMutation = useCreateCommissionRule()
  const updateRuleMutation = useUpdateCommissionRule()
  const deleteRuleMutation = useDeleteCommissionRule()

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CommissionRuleFormValues>({
    resolver: zodResolver(commissionRuleSchema),
    defaultValues: {
      ruleName: "",
      productType: "",
      commissionType: CommissionType.PERCENTAGE,
      commissionRate: undefined,
      minAmount: undefined,
      maxAmount: undefined,
      applicableFor: ApplicableFor.ALL_AGGREGATORS,
      priority: 0,
      description: "",
    },
  })

  const commissionTypeWatch = watch('commissionType')

  useEffect(() => {
    setPage(1)
  }, [filterStatus, filterProductType, filterApplicableFor])

  // Calculate metrics from actual data
  const metrics = useMemo(() => {
    if (!rulesData?.data) {
      return {
        totalRules: 0,
        activeRules: 0,
        avgCommissionRate: 0,
      }
    }

    const activeRules = rulesData.data.filter(rule => rule.status === RuleStatus.ACTIVE)
    const avgRate = activeRules.length > 0
      ? activeRules.reduce((sum, rule) => sum + rule.commissionRate, 0) / activeRules.length
      : 0

    return {
      totalRules: rulesData.total,
      activeRules: activeRules.length,
      avgCommissionRate: avgRate.toFixed(2),
    }
  }, [rulesData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status: RuleStatus) => {
    switch (status) {
      case RuleStatus.ACTIVE: return 'bg-green-500/20 text-green-400'
      case RuleStatus.INACTIVE: return 'bg-gray-500/20 text-gray-400'
      case RuleStatus.ARCHIVED: return 'bg-orange-500/20 text-orange-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getApplicableForLabel = (value: ApplicableFor) => {
    return value.replace('_AGGREGATORS', '').replace('_', ' ')
  }

  const handlePageChange = async (newPage: number) => {
    setPage(newPage)
    tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const handlePageSizeChange = async (size: number) => {
    setPageSize(size)
    setPage(1)
    tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const handleCreateRule = async (data: CommissionRuleFormValues) => {
    try {
      const payload: CreateCommissionRuleInput = {
        ruleName: data.ruleName,
        productType: data.productType,
        commissionType: data.commissionType,
        commissionRate: data.commissionRate,
        minAmount: data.minAmount,
        maxAmount: data.maxAmount,
        applicableFor: data.applicableFor,
        priority: data.priority,
        description: data.description,
      }

      if (editingRule) {
        await updateRuleMutation.mutateAsync({
          id: editingRule.id,
          input: payload,
        })
      } else {
        console.log(payload, 'this is commission rule')
        await createRuleMutation.mutateAsync(payload)
      }

      reset()
      setIsCreateDialogOpen(false)
      setEditingRule(null)
      refetch()
    } catch (error: any) {
      // Error toast is handled by the mutation hook
      console.error("Failed to save commission rule:", error)
    }
  }

  const handleEditRule = (rule: any) => {
    setEditingRule(rule)
    setValue('ruleName', rule.ruleName)
    setValue('productType', rule.productType)
    setValue('commissionType', rule.commissionType)
    setValue('commissionRate', rule.commissionRate)
    setValue('minAmount', rule.minAmount)
    setValue('maxAmount', rule.maxAmount)
    setValue('applicableFor', rule.applicableFor)
    setValue('priority', rule.priority)
    setValue('description', rule.description || '')
    setIsCreateDialogOpen(true)
  }

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to archive this commission rule?')) return

    try {
      await deleteRuleMutation.mutateAsync(id)
      refetch()
    } catch (error) {
      // Error toast is handled by the mutation hook
      console.error("Failed to delete commission rule:", error)
    }
  }

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      reset()
      setEditingRule(null)
    }
    setIsCreateDialogOpen(open)
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
        <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue to-cyan-500 text-dark">
              <Plus className="w-4 h-4 mr-2" />
              Create New Rule
            </Button>
          </DialogTrigger>
          <DialogContent
            className="bg-gray-800 border-gray-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto"
            onInteractOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {editingRule ? 'Edit Commission Rule' : 'Create Commission Rule'}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                {editingRule
                  ? 'Update the commission rule details'
                  : 'Set up a new commission rule for loan products'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(handleCreateRule)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                  Basic Information
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {/* Rule Name */}
                  <div className="col-span-2">
                    <Label htmlFor="ruleName">
                      Rule Name <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="ruleName"
                      {...register("ruleName")}
                      className="bg-gray-900 border-gray-600"
                      placeholder="e.g., Personal Loan - Gold Tier"
                    />
                    {errors.ruleName && (
                      <p className="text-sm text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.ruleName.message}
                      </p>
                    )}
                  </div>

                  {/* Product Type */}
                  <div>
                    <Label htmlFor="productType">
                      Product Type <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="productType"
                      {...register("productType")}
                      className="bg-gray-900 border-gray-600"
                      placeholder="e.g., Personal Loan, Home Loan"
                    />
                    {errors.productType && (
                      <p className="text-sm text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.productType.message}
                      </p>
                    )}
                  </div>

                  {/* Applicable For */}
                  <div>
                    <Label htmlFor="applicableFor">
                      Applicable For <span className="text-red-400">*</span>
                    </Label>
                    <Controller
                      control={control}
                      name="applicableFor"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="applicableFor" className="bg-gray-900 border-gray-600">
                            <SelectValue placeholder="Select tier" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(ApplicableFor).map((tier) => (
                              <SelectItem key={tier} value={tier} className="cursor-pointer">
                                {getApplicableForLabel(tier)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.applicableFor && (
                      <p className="text-sm text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.applicableFor.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Commission Configuration */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                  Commission Configuration
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {/* Commission Type */}
                  <div>
                    <Label htmlFor="commissionType">
                      Commission Type <span className="text-red-400">*</span>
                    </Label>
                    <Controller
                      control={control}
                      name="commissionType"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="commissionType" className="bg-gray-900 border-gray-600">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem className='cursor-pointer' value={CommissionType.PERCENTAGE}>
                              Percentage (%)
                            </SelectItem>
                            <SelectItem className='cursor-pointer' value={CommissionType.FLAT}>
                              Flat Amount (₹)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* Commission Rate */}
                  <div>
                    <Label htmlFor="commissionRate">
                      Commission Rate <span className="text-red-400">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="commissionRate"
                        type="number"
                        step="0.01"
                        {...register("commissionRate", { valueAsNumber: true })}
                        className="bg-gray-900 border-gray-600 pr-8"
                        placeholder={commissionTypeWatch === CommissionType.PERCENTAGE ? "3.5" : "5000"}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {commissionTypeWatch === CommissionType.PERCENTAGE ? '%' : '₹'}
                      </span>
                    </div>
                    {errors.commissionRate && (
                      <p className="text-sm text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.commissionRate.message}
                      </p>
                    )}
                  </div>
                </div>

                <Alert className="bg-blue/10 border-blue/30">
                  <Info className="h-4 w-4 text-blue" />
                  <AlertDescription className="text-sm text-gray-300">
                    {commissionTypeWatch === CommissionType.PERCENTAGE
                      ? 'Commission will be calculated as a percentage of the loan amount'
                      : 'Commission will be a fixed amount regardless of loan size'}
                  </AlertDescription>
                </Alert>
              </div>

              {/* Amount Range */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                  Applicable Amount Range
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {/* Min Amount */}
                  <div>
                    <Label htmlFor="minAmount">
                      Min Amount (₹) <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="minAmount"
                      type="number"
                      {...register("minAmount", { valueAsNumber: true })}
                      className="bg-gray-900 border-gray-600"
                      placeholder="100000"
                    />
                    {errors.minAmount && (
                      <p className="text-sm text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.minAmount.message}
                      </p>
                    )}
                  </div>

                  {/* Max Amount */}
                  <div>
                    <Label htmlFor="maxAmount">
                      Max Amount (₹) <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="maxAmount"
                      type="number"
                      {...register("maxAmount", { valueAsNumber: true })}
                      className="bg-gray-900 border-gray-600"
                      placeholder="1000000"
                    />
                    {errors.maxAmount && (
                      <p className="text-sm text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.maxAmount.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                  Additional Settings
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {/* Priority */}
                  <div>
                    <Label htmlFor="priority">
                      Priority (Optional)
                    </Label>
                    <Input
                      id="priority"
                      type="number"
                      {...register("priority", { valueAsNumber: true })}
                      className="bg-gray-900 border-gray-600"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-400 mt-1">Higher priority rules are applied first</p>
                    {errors.priority && (
                      <p className="text-sm text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.priority.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    className="bg-gray-900 border-gray-600 min-h-[80px]"
                    placeholder="Add any additional notes or conditions for this rule..."
                  />
                  {errors.description && (
                    <p className="text-sm text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.description.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogClose(false)}
                  disabled={isSubmitting}
                  className="border-gray-600 hover:bg-gray-700"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-blue to-cyan-500 text-dark"
                >
                  {isSubmitting
                    ? (editingRule ? "Updating..." : "Creating...")
                    : (editingRule ? "Update Rule" : "Create Rule")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Error Alert */}
      {isError && (
        <Alert className="bg-red-500/10 border-red-500/30">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-400">
            {error?.message || 'Failed to load commission rules. Please try again.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Metrics Cards */}
      {isTableLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton headerLines={2} bodyHeight={20} />
          <CardSkeleton headerLines={2} bodyHeight={20} />
          <CardSkeleton headerLines={2} bodyHeight={20} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard
            title="Total Rules"
            value={metrics.totalRules}
            icon={Settings}
            color="bg-blue/20 text-blue"
            subtitle="Commission rules"
          />
          <MetricCard
            title="Active Rules"
            value={metrics.activeRules}
            icon={CreditCard}
            color="bg-green-500/20 text-green-400"
            subtitle="Currently active"
          />
          <MetricCard
            title="Avg Commission Rate"
            value={`${metrics.avgCommissionRate}%`}
            icon={Percent}
            color="bg-gold/20 text-gold"
            subtitle="Platform average"
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
                <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val as RuleStatus | '')}>
                  <SelectTrigger className="w-32 bg-gray-900 border-gray-600 text-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value={RuleStatus.ACTIVE}>Active</SelectItem>
                    <SelectItem value={RuleStatus.INACTIVE}>Inactive</SelectItem>
                    <SelectItem value={RuleStatus.ARCHIVED}>Archived</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterApplicableFor} onValueChange={(val) => setFilterApplicableFor(val as ApplicableFor | '')}>
                  <SelectTrigger className="w-40 bg-gray-900 border-gray-600 text-white">
                    <SelectValue placeholder="Tier" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ApplicableFor).map((tier) => (
                      <SelectItem key={tier} value={tier}>
                        {getApplicableForLabel(tier)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={tableTopRef} />
            <div className="overflow-x-auto">
              {isTableLoading ? (
                <TableSkeleton columns={7} rows={pageSize} />
              ) : rulesData?.data && rulesData.data.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">Rule Name</TableHead>
                      <TableHead className="text-gray-300">Product Type</TableHead>
                      <TableHead className="text-gray-300">Amount Range</TableHead>
                      <TableHead className="text-gray-300">Commission</TableHead>
                      <TableHead className="text-gray-300">Applicable For</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rulesData.data.map((rule, index) => (
                      <motion.tr
                        key={rule.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border-gray-700 hover:bg-gray-800/50"
                      >
                        <TableCell>
                          <div>
                            <p className="text-white font-medium">{rule.ruleName}</p>
                            <p className="text-sm text-gray-400">Priority: {rule.priority}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-gray-600 text-gray-300">
                            {rule.productType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white">
                          <div>
                            <p className="text-sm">{formatCurrency(rule.minAmount)}</p>
                            <p className="text-xs text-gray-400">to {formatCurrency(rule.maxAmount)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-gold font-semibold">
                            {rule.commissionType === CommissionType.PERCENTAGE
                              ? `${rule.commissionRate}%`
                              : formatCurrency(rule.commissionRate)}
                          </div>
                          <p className="text-xs text-gray-400">
                            {rule.commissionType === CommissionType.PERCENTAGE ? 'Percentage' : 'Flat'}
                          </p>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {getApplicableForLabel(rule.applicableFor)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(rule.status)}>
                            {rule.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gold hover:text-white hover:bg-gray-700"
                              onClick={() => handleEditRule(rule)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-white hover:bg-gray-700"
                              onClick={() => handleDeleteRule(rule.id)}
                              disabled={deleteRuleMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No commission rules found</p>
                  <p className="text-gray-500 text-sm mt-2">Create your first commission rule to get started</p>
                </div>
              )}
            </div>

            {rulesData?.data && rulesData.data.length > 0 && (
              <TablePagination
                page={page}
                pageSize={pageSize}
                total={rulesData.total}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                className="mt-4"
              />
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
