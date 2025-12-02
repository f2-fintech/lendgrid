"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Search, Plus, Eye, Landmark, Percent, Clock, Wallet, Calendar, User, FileText, BadgeCheck, X } from "lucide-react"

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
import { Badge } from "@/components/ui/badge"

const InfoItem = ({ icon: Icon, label, value, color }: { icon: React.ElementType, label: string, value: string | number, color: string }) => (
  <div className="flex flex-col items-center justify-center p-4 bg-gray-800/50 rounded-lg">
    <Icon className={`w-8 h-8 ${color} mb-2`} />
    <p className="text-sm text-gray-400">{label}</p>
    <p className="text-lg font-bold text-white">{value}</p>
  </div>
);

const InfoLine = ({ icon: Icon, label, value, color }: { icon: React.ElementType, label: string, value: string | number, color: string }) => (
  <div className="flex items-start gap-3">
    <Icon className={`w-5 h-5 ${color} mt-1`} />
    <div>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="font-semibold text-white">{value}</p>
    </div>
  </div>
);

export function AggregatorProducts() {
  const { user } = useAuth('aggregator_admin')
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [products, setProducts] = useState<any[]>([])

  // Apply modal state
  const [applyDialogOpen, setApplyDialogOpen] = useState(false)
  const [selectedLenderId, setSelectedLenderId] = useState("")
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

  console.log(allLenders, selectedLenderId, selectedProduct, 'this is all lenders')
  // LENDERS DROPDOWN LIST
  const lenders = useMemo(() => {
    return allLenders.map((l) => ({
      id: l._id,
      name: l.lenderName
    }));
  }, [allLenders]);

  // FILTER PRODUCTS BY SELECTED LENDER
  const productsByLender = useMemo(() => {
    if (!selectedLenderId) return [];
    return products.filter((p) => p.lender._id === selectedLenderId);
  }, [selectedLenderId, products]);

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
      setSelectedLenderId("")
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
                    <DialogContent className="bg-gradient-to-br from-gray-900 to-black border-gray-700 text-white max-h-screen rounded-xl shadow-xl">
            <DialogHeader className="flex-shrink-0">
              <div>
                <DialogTitle className="text-2xl font-bold text-white bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                  New Loan Application
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  Enter customer details to submit a new application.
                </DialogDescription>
              </div>
            </DialogHeader>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setApplyDialogOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>

            <div className="space-y-2 py-2 flex-grow overflow-y-auto pr-2">
              {/* Lender & Product Selection */}
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-4">
                <h3 className="font-semibold text-lg text-cyan-300">1. Select Product</h3>
                <div className="space-y-2">
                  <Label className="text-gray-300">Lender</Label>
                  <Select
                    value={selectedLenderId}
                    onValueChange={(id) => {
                      setSelectedLenderId(id);
                      setSelectedProduct(null);
                    }}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Choose a lender" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 text-white border-gray-700">
                      {lenders.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Product</Label>
                  {selectedLenderId && productsByLender.length === 0 ? (
                    <div className="w-full px-3 py-3 rounded-lg bg-gray-800 border-gray-700 text-gray-400 text-sm italic">
                      No products available for this lender.
                    </div>
                  ) : (
                    <Select
                      disabled={!selectedLenderId}
                      value={selectedProduct?._id}
                      onValueChange={(id) => {
                        const prod = productsByLender.find((p) => p._id === id);
                        setSelectedProduct(prod || null);
                      }}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white disabled:opacity-50">
                        <SelectValue placeholder={selectedLenderId ? "Choose a product" : "Select a lender first"} />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 text-white border-gray-700">
                        {productsByLender.map((p) => (
                          <SelectItem key={p._id} value={p._id}>
                            {p.product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* Customer Details */}
              <div className="p-2 bg-gray-800/50 rounded-lg border border-gray-700 space-y-4">
                <h3 className="font-semibold text-lg text-cyan-300">2. Customer Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-gray-300">Customer Name</Label>
                    <Input className="bg-gray-800 border-gray-700" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Email</Label>
                    <Input type="email" className="bg-gray-800 border-gray-700" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Phone</Label>
                    <Input className="bg-gray-800 border-gray-700" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-gray-300">Loan Amount (₹)</Label>
                    <Input type="number" className="bg-gray-800 border-gray-700" value={form.loanAmount} onChange={(e) => setForm({ ...form, loanAmount: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex justify-between items-center pt-0  border-gray-700 flex-shrink-0">

              <Button
                disabled={!selectedProduct || !form.customerName || !form.loanAmount}
                className="bg-gradient-to-r from-blue to-cyan-500 text-white "
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

                  const getStatusColor = (status?: string) => {
                    if (!status) return 'bg-gray-500/20 text-gray-400'
                    switch (status.toUpperCase()) {
                      case 'ACTIVE': return 'bg-green-500/20 text-green-400'
                      case 'PENDING_APPROVAL': return 'bg-orange-500/20 text-orange-400'
                      case 'SUSPENDED':
                      case 'INACTIVE': return 'bg-red-500/20 text-red-400'
                      default: return 'bg-gray-500/20 text-gray-400'
                    }
                  }

                  return (
                    <TableRow key={p._id}>
                      <TableCell className="text-white font-medium">{prod.name}</TableCell>

                      <TableCell className="text-gray-300">{lender.lenderName}</TableCell>

                      <TableCell className="text-gray-300">{prod.productType.replace('_', ' ')}</TableCell>

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

                          <DialogContent className="bg-gradient-to-br from-gray-900 to-black border-gray-700 text-white max-w-3xl rounded-xl shadow-2xl">
                            <DialogHeader>
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <DialogTitle className="text-2xl font-bold text-white bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                                    {prod.name}
                                  </DialogTitle>
                                  <DialogDescription className="text-gray-400 pt-1">
                                    Detailed overview of the loan product from <span className="font-semibold text-cyan-300">{lender.lenderName}</span>
                                  </DialogDescription>
                                  <Badge
                                    className={`${getStatusColor(prod?.isActive === true ? "active" : "inactive")} border px-3 py-1 my-2 text-xs font-bold flex-shrink-0`}
                                  >
                                    {prod?.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                              </div>
                              
                            </DialogHeader>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setViewDialogOpen(false)}
                              className="absolute top-4 right-4 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full"
                            >
                              <X className="w-5 h-5" />
                            </Button>
                            <div className="py-4 space-y-6">
                              {/* Key Details */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                                <InfoItem icon={Landmark} color="text-yellow-500" label="Lender" value={lender.lenderName} />
                                <InfoItem icon={Percent} color="text-blue" label="Interest Rate" value={`${prod.interestRate}%`} />
                                <InfoItem icon={Percent} color="text-green-400" label="Commission" value={`${prod.commissionPercent}%`} />
                                <InfoItem icon={Clock} color="text-red-400" label="Tenure" value={prod.tenureMonths} />
                              </div>

                              {/* Loan & Eligibility */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-800">
                                <div className="space-y-4">
                                  <h3 className="font-semibold text-lg text-cyan-300">Loan Details</h3>
                                  <InfoLine icon={Wallet} color="text-red-400" label="Loan Range" value={`₹${(prod.minAmount / 100000).toFixed(1)}L - ₹${(prod.maxAmount / 100000).toFixed(1)}L`} />
                                  <h3 className="font-semibold text-lg text-cyan-300 mb-3 flex items-center gap-2"><FileText className="w-5 h-5" />Required Documents</h3>
                                  {(prod.requiredDocuments || []).length > 0 ? (
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                                      {(prod.requiredDocuments || []).map((doc: string, idx: number) => (
                                        <div key={idx} className="flex items-center gap-2 text-gray-300">
                                          <BadgeCheck className="w-4 h-4 text-green-400" />
                                          <span>{doc}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-gray-500 italic">No specific documents listed.</p>
                                  )}
                                </div>
                                <div className="space-y-4">
                                  <h3 className="font-semibold text-lg text-cyan-300">Eligibility Criteria</h3>
                                  <InfoLine icon={Calendar} color="text-blue" label="Age Range" value={prod.ageRange || 'N/A'} />
                                  <InfoLine icon={Wallet} color="text-green-400" label="Minimum Income" value={prod.minIncome ? `₹${prod.minIncome.toLocaleString()}` : 'N/A'} />
                                  <InfoLine icon={User} color="text-yellow-500" label="Minimum Credit Score" value={prod.minCreditScore || 'N/A'} />

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
