"use client"

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CardSkeleton } from '@/components/ui/loading-skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { applicationsApi, productAssignmentsApi, ProductType } from '@/lib'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { Search, Plus, Percent, Calendar, CreditCard, Users, TrendingUp } from 'lucide-react'

export function AggregatorProducts() {
  const { user } = useAuth('aggregator_admin')
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [products, setProducts] = useState<any[]>([])
  const [applyDialogOpen, setApplyDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewProduct, setViewProduct] = useState<any | null>(null)

  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    loanAmount: '',
  })

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const resp = await productAssignmentsApi.getMyAssignedProducts(1, 50)
        const results = resp?.getMyAssignedProducts?.results || []

        if (!mounted) return
        setProducts(results)
      } catch (e: any) {
        toast({
          title: "Failed to load products",
          description: e?.message || "Try again."
        })
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [])

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const prod = p.product
      console.log(prod, 'product')
      const matchesSearch =
        prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prod.productType.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType = typeFilter === "all" || prod.productType === typeFilter.toUpperCase()

      return matchesSearch && matchesType
    })
  }, [products, searchTerm, typeFilter])

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Browse Loan Products</h1>
          <p className="text-gray-400 mt-1">Pick a product and submit an application</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
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
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-gradient-to-r from-blue to-cyan-500 border-none text-white">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent className="bg-white text-black border-none">
            <SelectItem value="all">All Types</SelectItem>
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
      </motion.div>

      {isLoading ? (
        <CardSkeleton bodyHeight={300} />
      ) : (
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Available Products</CardTitle>
            <CardDescription className="text-gray-400">From partner lenders</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-300">Product</TableHead>
                  <TableHead className="text-gray-300">Lender</TableHead>
                  <TableHead className="text-gray-300">Type</TableHead>
                  <TableHead className="text-gray-300">Interest</TableHead>
                  <TableHead className="text-gray-300">Commission</TableHead>
                  <TableHead className="text-gray-300">Loan Range</TableHead>
                  <TableHead className="text-gray-300 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => {
                  const prod = p.product
                  const lender = p.lender

                  return (
                    <TableRow key={p._id}>
                      <TableCell className="text-white font-medium">{prod.name}</TableCell>

                      <TableCell className="text-gray-300">{lender.lenderName}</TableCell>

                      <TableCell className="text-gray-300">{prod.productType}</TableCell>

                      <TableCell className="text-gray-300">{prod.interestRate}%</TableCell>

                      <TableCell className="text-gray-300">{prod.commissionPercent}%</TableCell>

                      <TableCell className="text-gray-300">
                        ₹{(prod.minAmount / 100000).toFixed(1)}L - ₹
                        {(prod.maxAmount / 100000).toFixed(1)}L
                      </TableCell>

                      <TableCell className="text-right space-x-2">

                        {/* VIEW PRODUCT */}
                        <Dialog
                          open={viewDialogOpen && viewProduct?._id === p._id}
                          onOpenChange={(o) => {
                            if (!o) setViewProduct(null)
                            setViewDialogOpen(o)
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-gray-700 text-gray-300 hover:bg-gray-800"
                              onClick={() => setViewProduct(p)}
                            >
                              View
                            </Button>
                          </DialogTrigger>

                          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{prod.name}</DialogTitle>
                              <DialogDescription className="text-gray-400">
                                Product details
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                              <div>
                                <div className="text-gray-400 text-sm">Lender</div>
                                <div className="text-white">{lender.lenderName}</div>
                              </div>
                              <div>
                                <div className="text-gray-400 text-sm">Type</div>
                                <div className="text-white">{prod.productType}</div>
                              </div>
                              <div>
                                <div className="text-gray-400 text-sm">Interest</div>
                                <div className="text-white">{prod.interestRate}%</div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-gray-400 text-sm">Commission</div>
                                <div className="text-white">{prod.commissionPercent}%</div>
                              </div>
                              <div>
                                <div className="text-gray-400 text-sm">Tenure</div>
                                <div className="text-white">{prod.tenureMonths}</div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-gray-400 text-sm">Loan Range</div>
                                <div className="text-white">₹{(prod.minAmount / 100000).toFixed(1)}L - ₹{(prod.maxAmount / 100000).toFixed(1)}L</div>
                              </div>
                              <div className="md:col-span-2 space-y-1">
                                <div className="text-gray-400 text-sm">Required Documents</div>
                                <div className="text-white">
                                  {(prod.requiredDocuments || []).length ? (
                                    <ul className="list-disc pl-5 space-y-1 text-gray-200">
                                      {(prod.requiredDocuments || []).map((d: string, idx: number) => (
                                        <li key={idx}>{d}</li>
                                      ))}
                                    </ul>
                                  ) : '—'}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {/* APPLY */}
                        <Dialog
                          open={applyDialogOpen && selectedProduct?._id === p._id}
                          onOpenChange={(o) => {
                            if (!o) setSelectedProduct(null)
                            setApplyDialogOpen(o)
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-blue to-cyan-500  hover:to-blue/80 text-white"
                              onClick={() => setSelectedProduct(p)}
                            >
                              <Plus className="w-4 h-4 mr-2" /> Apply
                            </Button>
                          </DialogTrigger>

                          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Apply for {prod.name}</DialogTitle>
                              <DialogDescription className="text-gray-400">Submit customer details to initiate application</DialogDescription>
                            </DialogHeader>

                            {/* Form */}
                            <div className="grid grid-cols-2 gap-4 py-2">
                              <div className="col-span-2 space-y-1">
                                <Label>Customer Name</Label>
                                <Input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="bg-gray-800 border-gray-700" />
                              </div>
                              <div className="space-y-1">
                                <Label>Email</Label>
                                <Input type="email" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} className="bg-gray-800 border-gray-700" />
                              </div>
                              <div className="space-y-1">
                                <Label>Phone</Label>
                                <Input value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} className="bg-gray-800 border-gray-700" />
                              </div>
                              <div className="col-span-2 space-y-1">
                                <Label>Loan Amount</Label>
                                <Input type="number" value={form.loanAmount} onChange={(e) => setForm({ ...form, loanAmount: e.target.value })} className="bg-gray-800 border-gray-700" />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setApplyDialogOpen(false)}>Cancel</Button>
                              <Button
                                className="bg-gradient-to-r from-blue to-cyan-500 hover:to-blue/80 text-white"
                                onClick={async () => {
                                  try {
                                    if (!selectedProduct) return
                                    await applicationsApi.create({
                                      aggregatorId: (user as any)?._id || (user as any)?.id,
                                      lenderId: p.lenderId._id,
                                      productId: p.productId._id,
                                      customerName: form.customerName,
                                      customerEmail: form.customerEmail,
                                      customerPhone: form.customerPhone,
                                      loanAmount: Number(form.loanAmount || 0),
                                    })
                                    toast({ title: 'Application submitted' })
                                    setApplyDialogOpen(false)
                                    setSelectedProduct(null)
                                    setForm({ customerName: '', customerEmail: '', customerPhone: '', loanAmount: '' })
                                  } catch (e: any) {
                                    toast({ title: 'Submission failed', description: e?.message || 'Try again.' })
                                  }
                                }}
                              >
                                Submit Application
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
