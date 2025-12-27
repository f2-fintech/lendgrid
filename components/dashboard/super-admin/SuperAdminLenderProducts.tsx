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
import { Plus, Search, Edit, Trash2, AlertCircle, UserCheck } from "lucide-react"

import { CreateProductDto, ProductSummary, ProductType, productAssignmentsApi } from "@/lib"
import { useCreateProduct, useDeleteProduct, useUpdateProduct, useProducts, useAssignProduct } from "@/hooks/use-products"
import { useAggregators } from "@/hooks/use-aggregators"
import { useLenders } from "@/hooks/use-lenders"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const productSchema = z.object({
    lenderProfileId: z.string().nonempty("Lender is required"),
    name: z.string().min(3, 'Product name must be at least 3 characters'),
    description: z.string().optional(),
    productType: z.string().nonempty('Product type is required'),

    // amount & tenure
    minAmount: z.coerce.number().min(0, 'Min amount must be positive'),
    maxAmount: z.coerce.number().min(0, 'Max amount must be positive'),
    tenure: z.coerce.number().min(1, 'Min tenure must be positive'),

    // interest & commission
    interestRate: z.string().nonempty('Interest rate is required'),
    commissionPercent: z.coerce.number().min(0, "Commission must be >= 0"),
    processingFeePercent: z.coerce.number().min(0, "Processing fee must be >= 0").optional(),

    // eligibility
    ageRange: z.string().optional(),
    minIncome: z.coerce.number().optional(),
    minCreditScore: z.string().optional(),

    requiredDocuments: z.string().optional(),      // comma separated
    isActive: z.boolean().optional()
});

type ProductFormData = z.infer<typeof productSchema>

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value);

export function SuperAdminLenderProducts(): JSX.Element {
    const { toast } = useToast()
    const tableTopRef = useRef<HTMLDivElement | null>(null)

    const [page, setPage] = useState<number>(1)
    const [pageSize, setPageSize] = useState<number>(10)
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
    const [isEditMode, setIsEditMode] = useState<boolean>(false)
    const [selectedProduct, setSelectedProduct] = useState<ProductSummary | null>(null)

    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
    const [selectedProductForAssign, setSelectedProductForAssign] = useState<ProductSummary | null>(null)
    const [selectedAggregators, setSelectedAggregators] = useState<string[]>([])
    const [assignedAggregators, setAssignedAggregators] = useState<string[]>([])

    // --- Assignment dialog controls (search & sort) ---
    const [assignSearch, setAssignSearch] = useState<string>('')
    const [debouncedAssignSearch, setDebouncedAssignSearch] = useState<string>('')
    const [assignSortBy, setAssignSortBy] = useState<'ascending' | 'descending'>('ascending')

    const createProductMutation = useCreateProduct();
    const updateProductMutation = useUpdateProduct();
    const deleteProductMutation = useDeleteProduct();

    const {
        data,
        isLoading,
        error,
        refetch,
    } = useProducts({
        page,
        limit: pageSize
    });

    // Get the list of aggregators from db
    const { data: aggData, isLoading: isAggLoading } = useAggregators({ page: 1, limit: 100 })
    const aggregators = aggData?.results || []

    const { data: lenderData, isLoading: isLenderLoading } = useLenders({ page: 1, limit: 100 })
    const lenders = lenderData?.results || []

    const products = data?.results || []
    const total = data?.count || 0
    const assignProduct = useAssignProduct()

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
            lenderProfileId: "",
            name: "",
            description: "",
            productType: "",
            minAmount: 0,
            maxAmount: 0,
            tenure: 1,
            interestRate: "",
            commissionPercent: 0,
            processingFeePercent: 0,
            ageRange: "",
            minIncome: 0,
            minCreditScore: "",
            requiredDocuments: "",
            isActive: true,
        },
    })

    const openCreate = () => {
        setIsEditMode(false)
        setSelectedProduct(null)
        reset({
            lenderProfileId: "",
            name: "",
            description: "",
            productType: "",
            minAmount: 0,
            maxAmount: 0,
            tenure: 1,
            interestRate: "",
            commissionPercent: 0,
            processingFeePercent: 0,
            ageRange: "",
            minIncome: 0,
            minCreditScore: "",
            requiredDocuments: "",
            isActive: true,
        })
        setIsDialogOpen(true)
    }

    const openEdit = (product: any) => {
        setIsEditMode(true)
        setSelectedProduct(product)
        setIsDialogOpen(true)

        reset({
            lenderProfileId: product.lender?.profile?._id || "",
            name: product.name || "",
            description: product.description ?? "",
            productType: product.productType?.toLowerCase() || "",
            minAmount: Number(product.minAmount) || 0,
            maxAmount: Number(product.maxAmount) || 0,
            tenure: product.tenure || 1,
            interestRate: product.interestRate?.toString() || '',
            commissionPercent: Number(product.commissionPercent) || 0,
            processingFeePercent: Number(product.processingFeePercent) || 0,
            ageRange: product.ageRange || "",
            minIncome: Number(product.minIncome) || 0,
            minCreditScore: product.minCreditScore?.toString() || '',
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
        return products.filter((p) =>
            p.name.toLowerCase().includes(s) ||
            (p.productType ?? "").toLowerCase().includes(s) ||
            (p.lender?.profile?.lenderName ?? "").toLowerCase().includes(s)
        )
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
                lenderId: formData.lenderProfileId,
                name: formData.name,
                description: formData.description,
                productType: formData.productType,

                minAmount: Number(formData.minAmount),
                maxAmount: Number(formData.maxAmount),
                tenure: formData.tenure,

                interestRate: formData.interestRate,
                commissionPercent: Number(formData.commissionPercent),
                processingFeePercent: Number(formData.processingFeePercent),

                ageRange: formData.ageRange,
                minIncome: Number(formData.minIncome),
                minCreditScore: formData.minCreditScore,
                requiredDocuments:
                    formData.requiredDocuments?.trim().length
                        ? formData.requiredDocuments!.split(",").map((s) => s.trim()).filter(Boolean)
                        : [],
                isActive: formData.isActive ?? true,
            }

            if (isEditMode && selectedProduct) {
                await updateProductMutation.mutateAsync({
                    id: selectedProduct._id,
                    ...payload
                })
                toast({ title: 'Success', description: 'Product updated successfully.' })
            } else {
                console.log(payload, 'this is the payload for create product')
                await createProductMutation.mutateAsync(payload)
                toast({ title: 'Success', description: 'Product created successfully.' })
            }
            setIsDialogOpen(false);
            refetch?.()
        } catch (err) {
            toast({
                title: 'Error',
                description: `Failed to ${isEditMode ? 'update' : 'create'} product.`,
                variant: 'destructive',
            })
        }
    })

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return
        try {
            await deleteProductMutation.mutateAsync(id)
            toast({ title: 'Success', description: 'Product deleted successfully.' })
            refetch?.()
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Failed to delete product.',
                variant: 'destructive',
            })
        }
    }

    // Add this function to handle assign dialog
    const openAssignDialog = async (product: ProductSummary) => {
        setSelectedProductForAssign(product)

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

    // Debounce assignSearch -> debouncedAssignSearch
    useEffect(() => {
        const t = setTimeout(() => setDebouncedAssignSearch(assignSearch.trim().toLowerCase()), 250)
        return () => clearTimeout(t)
    }, [assignSearch])

    // Compute filtered + sorted aggregators for the dialog
    const visibleAggregators = useMemo(() => {
        if (isAggLoading) return []
        const s = debouncedAssignSearch
        const filtered = aggregators.filter((agg) => {
            const username = (agg.user?.username || '').toLowerCase()
            const email = (agg.user?.email || '').toLowerCase()
            const company = (agg.companyName || '').toLowerCase()
            if (!s) return true
            return username.includes(s) || email.includes(s) || company.includes(s)
        })

        const sorted = filtered.sort((a, b) => {
            const aKey = a.user?.username ?? ''
            const bKey = b.user?.username ?? ''
            const cmp = aKey.localeCompare(bKey, undefined, { sensitivity: 'base' })
            return assignSortBy === 'ascending' ? cmp : -cmp
        })

        return sorted
    }, [aggregators, debouncedAssignSearch, assignSortBy, isAggLoading])

    // Add this function to handle assignment
    const handleAssignProduct = async () => {
        if (!selectedProductForAssign) return

        const lenderProfileId = selectedProductForAssign.lender!.profile!._id!;
        // selectedAggregators and assignedAggregators are arrays of aggregator._id
        const toAssign = selectedAggregators.filter(id => !assignedAggregators.includes(id))
        const toUnassign = assignedAggregators.filter(id => !selectedAggregators.includes(id))

        try {
            if (toAssign.length > 0) {
                await assignProduct.mutateAsync({
                    productId: selectedProductForAssign._id,
                    lenderProfileId,
                    aggregatorIds: toAssign,
                })
                console.log(lenderProfileId, toAssign, selectedProductForAssign._id, 'this is payload for assign product')
            }
            if (toUnassign.length > 0) {
                await productAssignmentsApi.unassignFromAggregators(selectedProductForAssign._id, lenderProfileId, toUnassign)
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

    // helper to toggle selection by aggregator._id
    const toggleAggregatorSelection = (aggId: string) => {
        if (selectedAggregators.includes(aggId)) {
            setSelectedAggregators(selectedAggregators.filter(id => id !== aggId))
        } else {
            setSelectedAggregators([...selectedAggregators, aggId])
        }
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
                <h3 className="mt-2 text-sm font-medium text-white">Error loading products</h3>
                <p className="mt-1 text-sm text-gray-400">{error?.message}</p>
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
                <Button onClick={openCreate} className="bg-gradient-to-r from-blue to-cyan-500 hover:from-blue-600 hover:to-cyan-700 text-dark">
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
                    <div >
                        {isLoading ? (
                            <TableSkeleton columns={8} rows={pageSize} />
                        ) : (
                            <div className="min-w-full">
                                <div className="grid grid-cols-9 gap-3 py-3 px-3 bg-gray-900/60 backdrop-blur-sm sticky top-0 z-200 border-b border-gray-700 text-xs font-semibold tracking-wide text-gray-300 uppercase">
                                    <div className="w-52">Product</div>
                                    <div className="w-22 ">Lender</div>
                                    <div className="w-32 ">Type</div>
                                    <div className="w-36  ">Amount (Min-Max)</div>
                                    <div className="w-24 text-right">Interest</div>
                                    <div className="w-28 text-center">Commission</div>
                                    <div className="w-28 text-right">Tenure (In years)</div>
                                    <div className="w-24 text-center">Status</div>
                                    <div className="w-28 text-center">Actions</div>
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
                                                transition={{ duration: 0.25, delay: index * 0.03 }}
                                                className="grid grid-cols-9 gap-4 py-4 px-4 bg-gray-800/40 backdrop-blur-sm hover:bg-gray-800/60 border border-gray-700/40 rounded-xl shadow-sm transition-all duration-200"
                                            >
                                                {/* NAME */}
                                                <div className="w-52 overflow-hidden">
                                                    <p className="text-white font-semibold text-sm truncate">
                                                        {product.name}
                                                    </p>
                                                    <p className="text-xs text-gray-400 truncate mt-0.5">
                                                        {product.description}
                                                    </p>
                                                </div>

                                                {/* Lender */}
                                                <div className="w-44 text-white text-sm whitespace-nowrap">
                                                    {product.lender?.profile.lenderName}- {product.lender?.profile.lenderType}
                                                </div>

                                                {/* TYPE */}
                                                <div className="w-32 text-gray-300 uppercase text-sm font-medium truncate">
                                                    {product.productType.replace("_", " ")}
                                                </div>

                                                {/* LOAN AMOUNT */}
                                                <div className="w-36 text-right text-white text-sm whitespace-nowrap">
                                                    {formatCurrency(product.minAmount)} – {formatCurrency(product.maxAmount)}
                                                </div>

                                                {/* INTEREST */}
                                                <div className="w-24 text-right font-semibold text-amber-400 text-sm whitespace-nowrap">
                                                    {product.interestRate}%
                                                </div>

                                                {/* COMMISSION */}
                                                <div className="w-28 text-center text-cyan-300 font-medium text-sm whitespace-nowrap">
                                                    {product.commissionPercent}%
                                                </div>

                                                {/* TENURE */}
                                                <div className="w-20 text-right text-gray-300 text-sm whitespace-nowrap">
                                                    {product.tenure}
                                                </div>

                                                {/* STATUS */}
                                                <div className="w-24 flex justify-center">
                                                    <Badge
                                                        className={`px-3 py-1 text-xs font-semibold ${product.isActive ? "bg-green-600/20 text-green-400 border border-green-500/30" : "bg-red-600/20 text-red-400 border border-red-500/30"}`}
                                                    >
                                                        {product.isActive ? "Active" : "Inactive"}
                                                    </Badge>
                                                </div>

                                                {/* ACTIONS */}
                                                <div className="w-28 flex justify-center space-x-2">
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-violet-300 hover:text-white hover:bg-violet-600/20 rounded-lg"
                                                                onClick={() => openAssignDialog(product)}
                                                            >
                                                                <UserCheck className="w-4 h-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            Assign to Aggregators
                                                        </TooltipContent>
                                                    </Tooltip>

                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-yellow-300 hover:text-white hover:bg-yellow-600/20 rounded-lg"
                                                                onClick={() => openEdit(product)}
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            Edit Product
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-red-300 hover:text-white hover:bg-red-600/20 rounded-lg"
                                                                onClick={() => handleDelete(product._id)}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            Delete Product
                                                        </TooltipContent>
                                                    </Tooltip>
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

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-4xl w-[95%] max-h-[95vh] overflow-y-auto rounded-xl"
                    onInteractOutside={(e) => {
                        e.preventDefault();
                    }}>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">{isEditMode ? 'Edit Product' : 'Create New Product'}</DialogTitle>
                        <DialogDescription className="text-gray-400">{isEditMode ? 'Update the details of your existing product.' : 'Fill in the details to add a new product.'}</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submit} className="space-y-6 pt-4">
                        <div className="grid grid-cols-3 gap-3">
                            {/* LENDER SELECT */}
                            <div className="space-y-2">
                                <Label htmlFor="lenderProfileId">Select Lender</Label>

                                <Controller
                                    name="lenderProfileId"
                                    control={control}
                                    rules={{ required: "Lender is required" }}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value || ""}>
                                            <SelectTrigger className="glass-input text-black placeholder-gray-400 h-12">
                                                <SelectValue placeholder="Choose Lender" />
                                            </SelectTrigger>

                                            <SelectContent>
                                                {lenders.map((lender) => (
                                                    <SelectItem key={lender._id} value={lender._id}>
                                                        {lender.lenderName} ({lender.user?.email})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.lenderProfileId && (
                                    <p className="text-red-400 text-sm">{errors.lenderProfileId.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Product Name</Label>
                                <Input id="name" {...register('name')} className="glass-input text-black placeholder-gray-400 h-12" />
                                {errors.name && <p className="text-red-400 text-sm">{errors.name.message}</p>}
                            </div>

                            {/* PRODUCT TYPE */}
                            <div className="space-y-2">
                                <Label htmlFor="productType">Product Type</Label>

                                <Controller
                                    name="productType"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value || ""}
                                        >
                                            <SelectTrigger className="glass-input text-black placeholder-gray-400 h-12">
                                                <SelectValue placeholder="Select Product Type" />
                                            </SelectTrigger>

                                            <SelectContent>
                                                <SelectItem value={ProductType.PERSONAL_LOAN}>Personal Loan</SelectItem>
                                                <SelectItem value={ProductType.BUSINESS_LOAN}>Business Loan</SelectItem>
                                                <SelectItem value={ProductType.HOME_LOAN}>Home Loan</SelectItem>
                                                <SelectItem value={ProductType.EDUCATION_LOAN}>Education Loan</SelectItem>
                                                <SelectItem value={ProductType.AUTO_LOAN}>Auto Loan</SelectItem>
                                                <SelectItem value={ProductType.MACHINERY_LOAN}>Machinery Loan</SelectItem>
                                                <SelectItem value={ProductType.DOCTOR_LOAN}>Doctor Loan</SelectItem>
                                                <SelectItem value={ProductType.CA_LOAN}>CA Loan</SelectItem>
                                                <SelectItem value={ProductType.LAP}>Loan Against Property (LAP)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />

                                {errors.productType && (
                                    <p className="text-red-400 text-sm">{errors.productType.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" {...register('description')} className="glass-input text-black placeholder-gray-400 h-12" />
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="interestRate">Interest Rate (%)</Label>
                                <Input id="interestRate" type="string" {...register('interestRate')} className="glass-input text-black placeholder-gray-400 h-12" />
                                {errors.interestRate && <p className="text-red-400 text-sm">{errors.interestRate.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="minAmount">Min Loan Amount (₹)</Label>
                                <Input id="minAmount" type="number" {...register('minAmount', { valueAsNumber: true })} className="glass-input text-black placeholder-gray-400 h-12" />
                                {errors.minAmount && <p className="text-red-400 text-sm">{errors.minAmount.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="maxAmount">Max Loan Amount (₹)</Label>
                                <Input id="maxAmount" type="number" {...register('maxAmount', { valueAsNumber: true })} className="glass-input text-black placeholder-gray-400 h-12" />
                                {errors.maxAmount && <p className="text-red-400 text-sm">{errors.maxAmount.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="tenure">Tenure (in years)</Label>
                                <Input id="tenure" {...register('tenure')} className="glass-input text-black placeholder-gray-400 h-12" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="commissionPercent">Commission (%)</Label>
                                <Input id="commissionPercent" type="number" step="any" {...register('commissionPercent', { valueAsNumber: true })} className="glass-input text-black placeholder-gray-400 h-12" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="processingFeePercent">Processing Fee (%)</Label>
                                <Input id="processingFeePercent" type="number" step="any" {...register('processingFeePercent', { valueAsNumber: true })} className="glass-input text-black placeholder-gray-400 h-12" />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="ageRange">Age Range (e.g., "21-60")</Label>
                                <Input id="ageRange" {...register('ageRange')} className="glass-input text-black placeholder-gray-400 h-12" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="minIncome">Income</Label>
                                <Input id="minIncome" type="number" {...register('minIncome', { valueAsNumber: true })} className="glass-input text-black placeholder-gray-400 h-12" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="minCreditScore">Credit Score</Label>
                                <Input id="minCreditScore" type="string" {...register('minCreditScore')} className="glass-input text-black placeholder-gray-400 h-12" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="requiredDocuments">Required Documents (comma-separated)</Label>
                            <Textarea id="requiredDocuments" {...register('requiredDocuments')} className="glass-input text-black placeholder-gray-400 h-12" />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Controller name="isActive" control={control} render={({ field }) => (
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="isActive" checked={field.value} onCheckedChange={field.onChange} />
                                    <Label htmlFor="isActive">Product is Active</Label>
                                </div>
                            )} />
                        </div>

                        <div className="flex justify-end space-x-4 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-gradient-to-r from-blue to-cyan-500 text-dark">{isEditMode ? 'Save Changes' : 'Create Product'}</Button>
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

                    {/* Search + Sort controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-3 px-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Search aggregators..."
                                value={assignSearch}
                                onChange={(e) => setAssignSearch(e.currentTarget.value)}
                                className="pl-10 bg-gray-900 border-gray-600 text-white w-full"
                            />
                        </div>

                        <div className="flex items-center space-x-2 mt-3 sm:mt-0">
                            <Select onValueChange={(v) => setAssignSortBy(v as any)} defaultValue={assignSortBy}>
                                <SelectTrigger className="w-40 h-10 text-sm bg-gray-900 border-gray-600 text-white">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-900 text-white">
                                    <SelectItem value="ascending">Ascending</SelectItem>
                                    <SelectItem value="descending">Descending</SelectItem>
                                </SelectContent>
                            </Select>


                        </div>
                    </div>

                    <div className="space-y-4 max-h-[60vh] overflow-y-auto px-4">
                        {isAggLoading ? (
                            <div className="text-center py-8 text-gray-400">Loading aggregators...</div>
                        ) : visibleAggregators.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">No aggregators found</div>
                        ) : (
                            visibleAggregators.map((aggregator) => (
                                <div
                                    key={aggregator._id}
                                    className="flex items-center space-x-3 p-4 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors"
                                >
                                    <Checkbox
                                        id={aggregator.userId}
                                        checked={selectedAggregators.includes(aggregator.userId)}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setSelectedAggregators([...selectedAggregators, aggregator.userId])
                                            } else {
                                                setSelectedAggregators(selectedAggregators.filter(id => id !== aggregator.userId))
                                            }
                                        }}
                                    />
                                    <Label
                                        htmlFor={aggregator.userId}
                                        className="flex-1 cursor-pointer"
                                    >
                                        <div>
                                            <p className="font-medium text-white">{aggregator?.companyName}</p>
                                            <p className="text-sm text-gray-400">{aggregator.user?.email}</p>
                                            <p className="text-sm text-gray-500">{aggregator.user?.username}</p>
                                        </div>
                                    </Label>
                                    {assignedAggregators.includes(aggregator.userId) && (
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
