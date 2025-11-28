"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Search, Plus, Eye } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CardSkeleton } from "@/components/ui/loading-skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { productAssignmentsApi, ProductType } from "@/lib"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { useLenders } from "@/hooks/use-lenders"
import { useCreateApplication } from "@/hooks/use-applications"

export function AggregatorProducts() {
  const { user } = useAuth('aggregator_admin')
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [products, setProducts] = useState<any[]>([])

  // Apply modal state
  const [applyDialogOpen, setApplyDialogOpen] = useState(false)
  const [selectedLender, setSelectedLender] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)

  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewProduct, setViewProduct] = useState<any | null>(null)

  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    loanAmount: '',
  })

  const createApplicationMutation = useCreateApplication();
  const { data: lenderData } = useLenders({ page: 1, limit: 100 })
  const allLenders = lenderData?.results || []

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
      const prod = p.product;

      const matchesSearch =
        prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prod.productType.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType =
        typeFilter === "all" || prod.productType === typeFilter.toUpperCase();

      return matchesSearch && matchesType;
    });
  }, [products, searchTerm, typeFilter]);

  console.log(allLenders, selectedLender, selectedProduct, 'this is all lenders')
  // LENDERS DROPDOWN LIST
  const lenders = useMemo(() => {
    return allLenders.map((l) => ({
      id: l._id,
      name: l.lenderName
    }));
  }, [allLenders]);

  // FILTER PRODUCTS BY SELECTED LENDER
  const productsByLender = useMemo(() => {
    if (!selectedLender) return [];
    return products.filter((p) => p.lender._id === selectedLender);
  }, [selectedLender, products]);

  // SUBMIT APPLICATION
  async function submitApplication() {
    try {
      if (!selectedProduct) return

      const payload = {
        aggregatorId: user?._id || user?.id,
        lenderId: selectedProduct.lender._id,
        productId: selectedProduct.product._id,
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone,
        loanAmount: Number(form.loanAmount),
      };

      console.log(payload, 'this is application payload')
      await createApplicationMutation.mutateAsync(payload)
      toast({ title: "Application submitted successfully" })

      setApplyDialogOpen(false)
      setSelectedProduct(null)
      setSelectedLender("")
      setForm({ customerName: "", customerEmail: "", customerPhone: "", loanAmount: "" })
    } catch (e: any) {
      toast({ title: "Submission failed", description: e?.message || "Try again." })
    }
  }

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

        {/* Apply Button */}
        <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue to-cyan-500 hover:to-blue/80 text-white mt-4 sm:mt-0">
              <Plus className="w-4 h-4 mr-2" /> Apply
            </Button>
          </DialogTrigger>

          {/* Apply Form */}
          <DialogContent className="bg-[#0d1117] border border-gray-700 text-white max-w-lg rounded-xl shadow-2xl">
            <DialogHeader className="border-b border-gray-700 pb-3">
              <DialogTitle className="text-xl font-semibold text-white">
                Submit Application
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Fill customer details and select lender & product
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-4">
              {/* LENDER */}
              <div className="space-y-2">
                <Label className="text-gray-300">Select Lender</Label>
                <Select
                  value={selectedLender}
                  onValueChange={(id) => {
                    setSelectedLender(id);
                    setSelectedProduct(null);
                  }}
                >
                  <SelectTrigger className="bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 transition">
                    <SelectValue placeholder="Choose Lender" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d1117] text-white border border-gray-700">
                    {lenders.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* PRODUCT */}
              <div className="space-y-2">
                <Label className="text-gray-300">Select Product</Label>

                {/* If lender selected but has 0 products */}
                {selectedLender && productsByLender.length === 0 ? (
                  <div className="w-full px-3 py-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 text-sm italic">
                    No products available for this lender.
                  </div>
                ) : (
                  <Select
                    disabled={!selectedLender}
                    value={selectedProduct?._id}
                    onValueChange={(id) => {
                      const prod = productsByLender.find((p) => p._id === id);
                      setSelectedProduct(prod || null);
                    }}
                  >
                    <SelectTrigger className="bg-gray-800 border border-gray-700 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700 transition">
                      <SelectValue
                        placeholder={
                          selectedLender ? "Choose Product" : "Select lender first"
                        }
                      />
                    </SelectTrigger>

                    <SelectContent className="bg-[#0d1117] text-white border border-gray-700">
                      {productsByLender.map((p) => (
                        <SelectItem key={p._id} value={p._id}>
                          {p.product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* FORM FIELDS */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label className="text-gray-300">Customer Name</Label>
                  <Input
                    className="bg-gray-800 border-gray-700 text-white"
                    value={form.customerName}
                    onChange={(e) =>
                      setForm({ ...form, customerName: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Email</Label>
                  <Input
                    type="email"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={form.customerEmail}
                    onChange={(e) =>
                      setForm({ ...form, customerEmail: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Phone</Label>
                  <Input
                    className="bg-gray-800 border-gray-700 text-white"
                    value={form.customerPhone}
                    onChange={(e) =>
                      setForm({ ...form, customerPhone: e.target.value })
                    }
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label className="text-gray-300">Loan Amount</Label>
                  <Input
                    type="number"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={form.loanAmount}
                    onChange={(e) =>
                      setForm({ ...form, loanAmount: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex justify-end gap-3 border-t border-gray-700 pt-4">
              <Button
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                onClick={() => setApplyDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                disabled={!selectedProduct}
                className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:to-blue-700 text-white shadow-lg disabled:opacity-40"
                onClick={submitApplication}
              >
                Submit Application
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative max-w-xs w-full">
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

      {/* Products Table */}
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

                      <TableCell className="text-center space-x-2">
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
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewProduct(p)}
                              className="text-blue hover:text-white hover:bg-gray-700"
                            >
                              <Eye className="w-5 h-5" />
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
