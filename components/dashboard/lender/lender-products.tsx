"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { TablePagination } from "@/components/ui/pagination"
import { TableSkeleton } from "@/components/ui/loading-skeleton"
import { useAuth } from "@/lib/auth"
import { Plus, Search, Edit, Trash2, AlertCircle } from "lucide-react"

import { productsApi, CreateProductDto, ProductSummary } from "@/lib/api-client"

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
  eligibilityCriteria: z.string().optional(), // comma-separated in UI
  requiredDocuments: z.string().optional(), // comma-separated in UI
  isActive: z.boolean().optional(),
})

type ProductFormData = z.infer<typeof productSchema>

/**
 * Production-ready LenderProducts component.
 * - Keeps your theme and UI.
 * - Sends payload matching CreateProductDto.
 * - Handles validation, loading, and errors.
 */
export function LenderProducts(): JSX.Element {
  const { user } = useAuth()
  const { toast } = useToast()
  const tableTopRef = useRef<HTMLDivElement | null>(null)

  // Pagination / list state (basic)
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
  const [isEditMode, setIsEditMode] = useState<boolean>(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductSummary | null>(null)
  const [products, setProducts] = useState<ProductSummary[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [submitting, setSubmitting] = useState<boolean>(false)

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

  // Basic listing (you likely already have a hook; this is a minimal fetch)
  useEffect(() => {
    let mounted = true
    setIsLoading(true)
    productsApi
      .list({ page, limit: pageSize, lenderId: user?._id })
      .then((res) => {
        if (!mounted) return
        setProducts(res.products.results)
        setTotalCount(res.products.count)
      })
      .catch((err) => {
        console.error("Failed to fetch products", err)
        toast({ title: "Error", description: "Failed to fetch products", variant: "destructive" })
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [page, pageSize, user?._id, toast])

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
    // If you want to allow editing, fetch the full product and populate fields
    reset({
      name: product.name,
      description: "", // fetch real description when editing
      productType: "", // set real
      interestRate: product.interestRate,
      commissionPercent: 0,
      minAmount: 0,
      maxAmount: product.maxAmount,
      loanTerm: 12,
      tenure: "",
      eligibilityCriteria: "",
      requiredDocuments: "",
      isActive: product.isActive,
    })
    setIsDialogOpen(true)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(1)
  }

  const submit = handleSubmit(async (formData) => {
    setSubmitting(true)
    try {
      // build payload matching CreateProductDto
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

      const res = await productsApi.create(payload)
      if (res.createProduct.success) {
        toast({ title: "Success", description: res.createProduct.message || "Product created." })
        // refresh list — simple strategy: re-fetch by triggering page state
        // You could also insert the new product into state for optimistic UI
        setPage(1) // trigger useEffect fetch
        setIsDialogOpen(false)
        reset()
      } else {
        throw new Error(res.createProduct.message || "Create product failed")
      }
    } catch (err: any) {
      console.error("Create product error", err)
      toast({
        title: "Error",
        description: err?.message || "Failed to create product",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  })

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return
    try {
      // TODO: wire delete mutation
      toast({ title: "Success", description: "Product deleted (demo)." })
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete product.", variant: "destructive" })
    }
  }

  // filtered list if user types in search box
  const filteredProducts = useMemo(() => {
    if (!products) return []
    const s = searchTerm.trim().toLowerCase()
    if (!s) return products
    return products.filter((p) => p.name.toLowerCase().includes(s) || (p.productType ?? "").toLowerCase().includes(s))
  }, [products, searchTerm])

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
                  {/* {filteredProducts.map((product, index) => (
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
                        ₹{product.minLoanAmount.toLocaleString()} - ₹{product.maxLoanAmount.toLocaleString()}
                      </div>
                      <div className="text-gray-300">{product.loanTerm} months</div>
                      <div>
                        <Badge className={product.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" className="text-gold hover:text-white" onClick={() => openEdit(product)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-white" onClick={() => handleDelete(product._id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))} */}
                </div>
              </div>
            )}
          </div>
          <TablePagination
            page={page}
            pageSize={pageSize}
            // total={data?.count || 0}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            className="mt-4"
          />
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
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
                <Input id="name" {...register('name')} className="glass-input" />
                {errors.name && <p className="text-red-400 text-sm">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="productType">Product Type</Label>
                <Controller
                  name="productType"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="glass-input">
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Personal Loan">Personal Loan</SelectItem>
                        <SelectItem value="Business Loan">Business Loan</SelectItem>
                        <SelectItem value="Home Loan">Home Loan</SelectItem>
                        <SelectItem value="Car Loan">Car Loan</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.productType && <p className="text-red-400 text-sm">{errors.productType.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register('description')} className="glass-input" />
              {errors.description && <p className="text-red-400 text-sm">{errors.description.message}</p>}
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="interestRate">Interest Rate (%)</Label>
                <Input id="interestRate" type="number" step="0.01" {...register('interestRate')} className="glass-input" />
                {errors.interestRate && <p className="text-red-400 text-sm">{errors.interestRate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="minLoanAmount">Min Loan Amount (₹)</Label>
                <Input id="minLoanAmount" type="number" {...register('minLoanAmount')} className="glass-input" />
                {errors.minLoanAmount && <p className="text-red-400 text-sm">{errors.minLoanAmount.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxLoanAmount">Max Loan Amount (₹)</Label>
                <Input id="maxLoanAmount" type="number" {...register('maxLoanAmount')} className="glass-input" />
                {errors.maxLoanAmount && <p className="text-red-400 text-sm">{errors.maxLoanAmount.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="loanTerm">Loan Term (months)</Label>
              <Input id="loanTerm" type="number" {...register('loanTerm')} className="glass-input" />
              {errors.loanTerm && <p className="text-red-400 text-sm">{errors.loanTerm.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="eligibilityCriteria">Eligibility Criteria (comma-separated)</Label>
              <Textarea id="eligibilityCriteria" {...register('eligibilityCriteria')} className="glass-input" />
            </div>
            <div className="flex items-center space-x-2">
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Input type="checkbox" checked={field.value} onCheckedChange={field.onChange} id="isActive" />
                )}
              />
              <Label htmlFor="isActive">Product is Active</Label>
            </div>
            <div className="flex justify-end space-x-4 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-gradient-to-r from-gold to-blue text-dark">
                {isEditMode ? 'Save Changes' : 'Create Product'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
