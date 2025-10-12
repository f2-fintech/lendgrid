"use client"

import { useState, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { TablePagination } from "@/components/ui/pagination"
import { TableSkeleton } from "@/components/ui/loading-skeleton"
import { useProducts, useCreateProduct, useUpdateProduct, useRemoveProduct, Product } from '@/hooks/use-products'
import { useAuth } from '@/lib/auth'
import { Plus, Search, Edit, Trash2, AlertCircle } from 'lucide-react'

const productSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  productType: z.string().nonempty("Product type is required"),
  interestRate: z.coerce.number().min(0, "Interest rate must be positive"),
  minLoanAmount: z.coerce.number().min(0, "Min loan amount must be positive"),
  maxLoanAmount: z.coerce.number().min(0, "Max loan amount must be positive"),
  loanTerm: z.coerce.number().min(1, "Loan term must be at least 1 month"),
  eligibilityCriteria: z.string().optional(),
  isActive: z.boolean().default(true),
})

type ProductFormData = z.infer<typeof productSchema>

export function LenderProducts() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const tableTopRef = useRef<HTMLDivElement | null>(null)

  const { data, isLoading, error } = useProducts({
    page,
    limit: pageSize,
    lenderId: user?._id,
    // Add search term to query variables if your backend supports it
  })

  const createProductMutation = useCreateProduct()
  const updateProductMutation = useUpdateProduct()
  const removeProductMutation = useRemoveProduct()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  })

  const filteredProducts = useMemo(() => {
    if (!data?.results) return []
    return data.results.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.productType.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [data, searchTerm])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(1)
  }

  const openCreate = () => {
    setIsEditMode(false)
    setSelectedProduct(null)
    reset({
      name: '',
      description: '',
      productType: '',
      interestRate: 0,
      minLoanAmount: 0,
      maxLoanAmount: 0,
      loanTerm: 0,
      eligibilityCriteria: '',
      isActive: true,
    })
    setIsDialogOpen(true)
  }

  const openEdit = (product: Product) => {
    setIsEditMode(true)
    setSelectedProduct(product)
    reset({
      ...product,
      eligibilityCriteria: product.eligibilityCriteria.join(', '),
    })
    setIsDialogOpen(true)
  }

  const submit = handleSubmit(async (formData) => {
    try {
      const payload = {
        ...formData,
        eligibilityCriteria: formData.eligibilityCriteria?.split(',').map(item => item.trim()) || [],
        lenderId: user._id,
      }

      if (isEditMode && selectedProduct) {
        await updateProductMutation.mutateAsync({ id: selectedProduct._id, ...payload })
        toast({ title: 'Success', description: 'Product updated successfully.' })
      } else {
        await createProductMutation.mutateAsync(payload)
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
        await removeProductMutation.mutateAsync(id)
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

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-white">Error loading products</h3>
        <p className="mt-1 text-sm text-gray-400">{error.message}</p>
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
          <h1 className="text-3xl font-bold text-white">My Products</h1>
          <p className="text-gray-400 mt-1">Manage your loan products and offerings</p>
        </div>
        <Button onClick={openCreate} className="bg-gradient-to-r from-gold to-blue hover:from-gold/80 hover:to-blue/80 text-dark">
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
                  {filteredProducts.map((product, index) => (
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
                  ))}
                </div>
              </div>
            )}
          </div>
          <TablePagination
            page={page}
            pageSize={pageSize}
            total={data?.count || 0}
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
                  control={control}
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
