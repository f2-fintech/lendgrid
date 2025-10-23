"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { TablePagination } from "@/components/ui/pagination"
import { TableSkeleton } from "@/components/ui/loading-skeleton"
import { useAuth } from "@/lib/auth"
import { Plus, Search, Edit, Trash2, AlertCircle, UserCheck } from "lucide-react"

import { productsApi, CreateProductDto, ProductSummary, productAssignmentsApi } from "@/lib/api-client"
import { createProduct, removeProduct, updateProduct, useProducts } from "@/hooks/use-products"
import { useAggregators } from "@/hooks/use-aggregators"

const productSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").optional(),
  productType: z.string().nonempty("Product type is required"),
  interestRate: z.coerce.number().min(0, "Interest rate must be positive"),
  commissionPercent: z.coerce.number().min(0, "Commission percent must be positive"),
  minAmount: z.coerce.number().min(0, "Min amount must be positive"),
  maxAmount: z.coerce.number().min(0, "Max amount must be positive"),
  loanTerm: z.coerce.number().min(1, "Loan term must be at least 1 month"),
  tenure: z.string().optional(),
  eligibilityCriteria: z.string().optional(),
  requiredDocuments: z.string().optional(),
  isActive: z.boolean().optional(),
})

type ProductFormData = z.infer<typeof productSchema>

export function LenderProducts(): JSX.Element {
  const { user } = useAuth()
  const { toast } = useToast()
  const tableTopRef = useRef<HTMLDivElement | null>(null)

  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
  const [isEditMode, setIsEditMode] = useState<boolean>(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductSummary | null>(null)

  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedProductForAssign, setSelectedProductForAssign] = useState<ProductSummary | null>(null)
  const [selectedAggregators, setSelectedAggregators] = useState<string[]>([])
  const [assignedAggregators, setAssignedAggregators] = useState<string[]>([])

  const {
    products,
    total,
    loading: isTableLoading,
    pages,
    error
  } = useProducts({
    page,
    limit: pageSize,
    lenderId: user?._id,
  })

  // Get the list of aggregators from db
  const {
    aggregators,
    loading: loadingAggregators,
    mutate
  } = useAggregators({ page, limit: pageSize });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      description: "",
      productType: "",
      interestRate: 0,
      commissionPercent: 0,
      minAmount: 0,
      maxAmount: 0,
      loanTerm: 12,
      tenure: "",
      eligibilityCriteria: "",
      requiredDocuments: "",
      isActive: true,
    },
  })

  const openCreate = () => {
    setIsEditMode(false)
    setSelectedProduct(null)
    reset({
      name: "",
      description: "",
      productType: "",
      interestRate: 0,
      commissionPercent: 0,
      minAmount: 0,
      maxAmount: 0,
      loanTerm: 12,
      tenure: "",
      eligibilityCriteria: "",
      requiredDocuments: "",
      isActive: true,
    })
    setIsDialogOpen(true)
  }

  const openEdit = (product: ProductSummary) => {
    setIsEditMode(true)
    setSelectedProduct(product)
    setIsDialogOpen(true)

    reset({
      name: product.name || "",
      description: product.description ?? "",
      productType: product.productType || "",
      interestRate: Number(product.interestRate) || 0,
      commissionPercent: Number(product.commissionPercent) || 0,
      minAmount: Number(product.minAmount) || 0,
      maxAmount: Number(product.maxAmount) || 0,
      loanTerm: Number(product.loanTerm) || 12,
      tenure: product.tenure || "",
      eligibilityCriteria: Array.isArray(product.eligibilityCriteria)
        ? product.eligibilityCriteria.join(", ")
        : "",
      requiredDocuments: Array.isArray(product.requiredDocuments)
        ? product.requiredDocuments.join(", ")
        : "",
      isActive: product.isActive ?? true,
    })
  }


  const filteredProducts = useMemo(() => {
    if (!products) return []
    const s = searchTerm.trim().toLowerCase()
    if (!s) return products
    return products.filter((p) => p.name.toLowerCase().includes(s) || (p.productType ?? "").toLowerCase().includes(s))
  }, [products, searchTerm])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(1)
  }

  const submit = handleSubmit(async (formData) => {
    try {
      const payload: CreateProductDto = {
        lenderId: user?._id,
        lenderName: user?.name,
        name: formData.name,
        description: formData.description,
        productType: formData.productType,
        interestRate: Number(formData.interestRate),
        commissionPercent: Number(formData.commissionPercent),
        minAmount: Number(formData.minAmount),
        maxAmount: Number(formData.maxAmount),
        loanTerm: Number(formData.loanTerm),
        tenure: formData.tenure ? formData.tenure : undefined,
        eligibilityCriteria:
          formData.eligibilityCriteria?.trim().length
            ? formData.eligibilityCriteria!.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
        requiredDocuments:
          formData.requiredDocuments?.trim().length
            ? formData.requiredDocuments!.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
        isActive: formData.isActive ?? true,
      }

      if (isEditMode && selectedProduct) {
        await updateProduct(selectedProduct._id, payload)
        toast({ title: 'Success', description: 'Product updated successfully.' })
      } else {
        await createProduct(payload)
        toast({ title: 'Success', description: 'Product created successfully.' })
      }
      setIsDialogOpen(false)
    } catch (err) {
      toast({
        title: 'Error',
        description: `Failed to ${isEditMode ? 'update' : 'create'} product.`,
        variant: 'destructive',
      })
    }
  })

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await removeProduct(id)
        toast({ title: 'Success', description: 'Product deleted successfully.' })
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to delete product.',
          variant: 'destructive',
        })
      }
    }
  }

  // const fetchAggregators = async () => {
  //   setLoadingAggregators(true)
  //   try {
  //     const response = await usersApi.getAggregators({ page: 1, limit: 100 })
  //     setAggregators(response.usersByRole.results)
  //   } catch (error) {
  //     toast({
  //       title: 'Error',
  //       description: 'Failed to load aggregators',
  //       variant: 'destructive',
  //     })
  //   } finally {
  //     setLoadingAggregators(false)
  //   }
  // }

  // Add this function to handle assign dialog
  const openAssignDialog = async (product: ProductSummary) => {
    setSelectedProductForAssign(product)
    await mutate;

    // Fetch already assigned aggregators
    try {
      const response = await productAssignmentsApi.getAssignedAggregators(product._id)
      setAssignedAggregators(response.getAssignedAggregators)
      setSelectedAggregators(response.getAssignedAggregators)
    } catch (error) {
      console.error('Failed to fetch assigned aggregators', error)
    }

    setIsAssignDialogOpen(true)
  }

  // Add this function to handle assignment
  const handleAssignProduct = async () => {
    if (!selectedProductForAssign) return

    const toAssign = selectedAggregators.filter(id => !assignedAggregators.includes(id))
    const toUnassign = assignedAggregators.filter(id => !selectedAggregators.includes(id))

    try {
      if (toAssign.length > 0) {
        await productAssignmentsApi.assignToAggregators(selectedProductForAssign._id, toAssign)
      }
      if (toUnassign.length > 0) {
        await productAssignmentsApi.unassignFromAggregators(selectedProductForAssign._id, toUnassign)
      }

      toast({
        title: 'Success',
        description: 'Product assignments updated successfully',
      })
      setIsAssignDialogOpen(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update assignments',
        variant: 'destructive',
      })
    }
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-white">Error loading products</h3>
        <p className="mt-1 text-sm text-gray-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 bg-blue-900">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">My Products</h1>
          <p className="text-gray-400 mt-1">Manage your loan products and offerings</p>
        </div>
        <Button onClick={openCreate} className="bg-gradient-to-r from-blue to-cyan-500  hover:to-blue/80 text-dark">
          <Plus className="w-4 h-4 mr-2" />
          Add New Product
        </Button>
      </motion.div>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Product List</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-900 border-gray-600 text-white w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={tableTopRef} />
          <div className="overflow-x-auto">
            {isLoading ? (
              <TableSkeleton columns={7} rows={pageSize} />
            ) : (
              <div className="min-w-full">
                <div className="grid grid-cols-7 gap-4 py-3 px-4 bg-gray-900/50 rounded-t-lg font-medium text-gray-300 text-sm">
                  <div>Product Name</div>
                  <div>Type</div>
                  <div>Interest Rate</div>
                  <div>Loan Amount</div>
                  <div>Term</div>
                  <div>Status</div>
                  <div>Actions</div>
                </div>
                <div className="space-y-1">
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-400">No products found</p>
                    </div>
                  ) : (
                    filteredProducts.map((product, index) => (
                      <motion.div
                        key={product._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="grid grid-cols-7 gap-4 py-4 px-4 bg-gray-800/30 hover:bg-gray-800/50 rounded border-b border-gray-700 items-center"
                      >
                        <div>
                          <p className="text-white font-medium">{product.name}</p>
                          <p className="text-sm text-gray-400 truncate">{product.description}</p>
                        </div>
                        <div className="text-gray-300">{product.productType}</div>
                        <div className="text-gold">{product.interestRate}%</div>
                        <div className="text-white">
                          ₹{product.minAmount} - ₹{product.maxAmount}
                        </div>
                        <div className="text-gray-300">{product.loanTerm} months</div>
                        <div>
                          <Badge className={product.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-violet-400 hover:text-white"
                            onClick={() => openAssignDialog(product)}
                            title="Assign to Aggregators"
                          >
                            <UserCheck className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-gold hover:text-white" onClick={() => openEdit(product)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-400 hover:text-white" onClick={() => handleDelete(product._id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))
                  )}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-4xl w-[95%] max-h-[95vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{isEditMode ? 'Edit Product' : 'Create New Product'}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {isEditMode ? 'Update the details of your existing product.' : 'Fill in the details to add a new product.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  {...register('name')}
                  className="glass-input text-black placeholder-gray-400 h-12"
                />
                {errors.name &&
                  <p className="text-red-400 text-sm">{errors.name.message}</p>
                }
              </div>
              <div className="space-y-2">
                <Label htmlFor="productType">Product Type</Label>
                <Controller
                  name="productType"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="glass-input text-black placeholder-gray-400 h-12">
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Personal Loan" className="text-black hover:bg-white/10">Personal Loan</SelectItem>
                        <SelectItem value="Business Loan" className="text-black hover:bg-white/10">Business Loan</SelectItem>
                        <SelectItem value="Home Loan" className="text-black hover:bg-white/10">Home Loan</SelectItem>
                        <SelectItem value="Car Loan" className="text-black hover:bg-white/10">Car Loan</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.productType && <p className="text-red-400 text-sm">{errors.productType.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                className="glass-input text-black placeholder-gray-400 h-12"
              />
              {errors.description && <p className="text-red-400 text-sm">{errors.description.message}</p>}
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="interestRate">Interest Rate (%)</Label>
                <Input
                  id="interestRate"
                  type="number"
                  {...register('interestRate')}
                  className="glass-input text-black placeholder-gray-400 h-12"
                />
                {errors.interestRate && <p className="text-red-400 text-sm">{errors.interestRate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="minAmount">Min Loan Amount (₹)</Label>
                <Input
                  id="minAmount"
                  type="number"
                  {...register('minAmount')}
                  className="glass-input text-black placeholder-gray-400 h-12"
                />
                {errors.minAmount && <p className="text-red-400 text-sm">{errors.minAmount.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxAmount">Max Loan Amount (₹)</Label>
                <Input
                  id="maxAmount"
                  type="number"
                  {...register('maxAmount')}
                  className="glass-input text-black placeholder-gray-400 h-12"
                />
                {errors.maxAmount && <p className="text-red-400 text-sm">{errors.maxAmount.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="loanTerm">Loan Term (months)</Label>
              <Input
                id="loanTerm"
                type="number"
                {...register('loanTerm')}
                className="glass-input text-black placeholder-gray-400 h-12"
              />
              {errors.loanTerm && <p className="text-red-400 text-sm">{errors.loanTerm.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="eligibilityCriteria">Eligibility Criteria (comma-separated)</Label>
              <Textarea
                id="eligibilityCriteria"
                {...register('eligibilityCriteria')}
                className="glass-input text-black placeholder-gray-400 h-12"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isActive"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <Label htmlFor="isActive">Product is Active</Label>
                  </div>
                )}
              />
            </div>
            <div className="flex justify-end space-x-4 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-gradient-to-r from-blue to-cyan-500 text-dark">
                {isEditMode ? 'Save Changes' : 'Create Product'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Product Assignment Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Product to Aggregators</DialogTitle>
            <DialogDescription className="text-gray-400">
              Select aggregators to assign "{selectedProductForAssign?.name}" to
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {loadingAggregators ? (
              <div className="text-center py-8 text-gray-400">Loading aggregators...</div>
            ) : aggregators.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No aggregators found</div>
            ) : (
              aggregators.map((aggregator) => (
                <div
                  key={aggregator._id}
                  className="flex items-center space-x-3 p-4 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors"
                >
                  <Checkbox
                    id={aggregator._id}
                    checked={selectedAggregators.includes(aggregator._id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedAggregators([...selectedAggregators, aggregator._id])
                      } else {
                        setSelectedAggregators(selectedAggregators.filter(id => id !== aggregator._id))
                      }
                    }}
                  />
                  <Label
                    htmlFor={aggregator._id}
                    className="flex-1 cursor-pointer"
                  >
                    <div>
                      <p className="font-medium text-white">{aggregator.username}</p>
                      <p className="text-sm text-gray-400">{aggregator.email}</p>
                      {aggregator.companyName && (
                        <p className="text-sm text-gray-500">{aggregator.companyName}</p>
                      )}
                    </div>
                  </Label>
                  {assignedAggregators.includes(aggregator._id) && (
                    <Badge className="bg-green-500/20 text-green-400">Currently Assigned</Badge>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignProduct}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
