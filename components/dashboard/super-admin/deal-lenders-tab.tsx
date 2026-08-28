"use client"

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Edit, Trash2, Landmark, CheckCircle, AlertCircle, XCircle, Loader2, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { TablePagination } from "@/components/ui/pagination"
import { useToast } from "@/hooks/use-toast"
import { dealLendersApi } from '@/lib/deal-lender-api'
import { DealLender } from '@/lib/api-types'

export function DealLendersTab() {
  const [lenders, setLenders] = useState<DealLender[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const tableTopRef = useRef<HTMLDivElement | null>(null)
  const { toast } = useToast()

  // Add/Edit modal state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLender, setEditingLender] = useState<DealLender | null>(null)
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState<'bank' | 'nbfc' | 'fintech'>('bank')
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active')
  const [submitting, setSubmitting] = useState(false)

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [lenderToDelete, setLenderToDelete] = useState<DealLender | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Debounce search term to prevent excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    setPage(1)
  }, [filterType])

  const loadLenders = useCallback(async () => {
    try {
      setLoading(true)
      const res = await dealLendersApi.getAllDealLendersPaginated({
        page,
        limit: pageSize,
        search: debouncedSearch || undefined,
        type: filterType !== 'all' ? filterType : undefined,
      })
      setLenders(res.data || [])
      setTotal(res.total || 0)
    } catch (err: any) {
      console.error("Failed to load deal lenders:", err)
      toast({
        variant: "destructive",
        title: "Error loading lenders",
        description: err?.message || "Failed to fetch the list of lenders."
      })
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, debouncedSearch, filterType, toast])

  useEffect(() => {
    loadLenders()
  }, [loadLenders])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(1)
    tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const handleOpenAdd = () => {
    setEditingLender(null)
    setFormName('')
    setFormType('bank')
    setFormStatus('active')
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (lender: DealLender) => {
    setEditingLender(lender)
    setFormName(lender.name)
    setFormType(lender.type)
    setFormStatus(lender.status || 'active')
    setIsDialogOpen(true)
  }

  const handleOpenDelete = (lender: DealLender) => {
    setLenderToDelete(lender)
    setIsDeleteOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Lender name is required."
      })
      return
    }

    try {
      setSubmitting(true)
      if (editingLender) {
        // Update
        await dealLendersApi.updateDealLender({
          id: editingLender.id,
          name: formName.trim(),
          type: formType,
          status: formStatus
        })
        toast({
          title: "Lender updated",
          description: `Successfully updated lender details for ${formName}`
        })
      } else {
        // Create
        await dealLendersApi.createDealLender({
          name: formName.trim(),
          type: formType
        })
        toast({
          title: "Lender created",
          description: `Successfully added lender ${formName} to the directory.`
        })
      }
      setIsDialogOpen(false)
      loadLenders()
    } catch (err: any) {
      console.error("Failed to save lender:", err)
      toast({
        variant: "destructive",
        title: "Operation failed",
        description: err?.message || "Something went wrong while saving lender details."
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!lenderToDelete) return
    try {
      setDeleting(true)
      await dealLendersApi.deleteDealLender(lenderToDelete.id)
      toast({
        title: "Lender deleted",
        description: `Successfully deleted lender ${lenderToDelete.name}.`
      })
      setIsDeleteOpen(false)
      setLenderToDelete(null)
      loadLenders()
    } catch (err: any) {
      console.error("Failed to delete lender:", err)
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: err?.message || "Something went wrong while deleting the lender."
      })
    } finally {
      setDeleting(false)
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'bank': return 'bg-sky-500/10 text-sky-400 border-sky-500/20'
      case 'nbfc': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'fintech': return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls Card */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Landmark className="w-5 h-5 text-primary" />
                Lender Directory
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-1">
                Manage Banks, NBFCs, and Fintech partners populated in commission configurations.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={loadLenders} variant="outline" size="icon" disabled={loading} className="text-muted-foreground hover:text-foreground">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button onClick={handleOpenAdd} className="bg-primary hover:bg-primary/95 text-primary-foreground gap-2 font-medium">
                <Plus className="w-4 h-4" />
                Add Deal Lender
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between w-full">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search lender name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-muted/30 border-border text-foreground"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Filter Type:</span>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-40 bg-muted/30 border-border text-foreground">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="nbfc">NBFC</SelectItem>
                  <SelectItem value="fintech">Fintech</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lenders Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div ref={tableTopRef} />
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">Loading lenders...</p>
            </div>
          ) : lenders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="p-4 bg-muted rounded-full text-muted-foreground mb-4">
                <Landmark className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-foreground text-base">No Lenders Found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                {searchTerm || filterType !== 'all' 
                  ? "Adjust filters or search keywords to find what you are looking for."
                  : "No deal lenders have been added to the platform directory yet."}
              </p>
              {!searchTerm && filterType === 'all' && (
                <Button onClick={handleOpenAdd} className="mt-4 gap-2">
                  <Plus className="w-4 h-4" /> Add Lender
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto professional-table">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Lender Name</TableHead>
                    <TableHead className="text-muted-foreground">Lender Type</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground text-right w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {lenders.map((lender) => (
                      <TableRow key={lender.id} className="border-border hover:bg-muted/20 transition-colors">
                        <TableCell className="font-medium text-foreground py-3.5">
                          {lender.name}
                        </TableCell>
                        <TableCell className="py-3.5">
                          <Badge variant="outline" className={`capitalize border font-semibold text-xs px-2.5 py-0.5 ${getTypeBadgeColor(lender.type)}`}>
                            {lender.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3.5">
                          {lender.status === 'inactive' ? (
                            <Badge className="bg-red-500/10 text-red-400 border border-red-500/25 text-xs px-2.5 py-0.5">
                              Inactive
                            </Badge>
                          ) : (
                            <Badge className="bg-green-500/10 text-emerald-400 border border-green-500/25 text-xs px-2.5 py-0.5">
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(lender)}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                              title="Edit Lender"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDelete(lender)}
                              className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              title="Delete Lender"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && (
            <TablePagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              className="p-4 border-t border-border"
            />
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border border-border text-foreground max-w-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Landmark className="w-5 h-5 text-primary" />
                {editingLender ? 'Edit Deal Lender' : 'Add New Deal Lender'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Define a bank or NBFC which can be populated in aggregator commission overrides.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Lender Name</label>
                <Input
                  placeholder="e.g. HDFC Bank, ABFL, etc."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="bg-muted/40 border-border text-foreground focus-visible:ring-1 focus-visible:ring-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Lender Type</label>
                  <Select value={formType} onValueChange={(val: any) => setFormType(val)}>
                    <SelectTrigger className="bg-muted/40 border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">Bank</SelectItem>
                      <SelectItem value="nbfc">NBFC</SelectItem>
                      <SelectItem value="fintech">Fintech</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editingLender && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Status</label>
                    <Select value={formStatus} onValueChange={(val: any) => setFormStatus(val)}>
                      <SelectTrigger className="bg-muted/40 border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-medium">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingLender ? 'Save Changes' : 'Create Lender'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="bg-card border border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-red-500">
              <AlertCircle className="w-5 h-5" />
              Delete Deal Lender?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold text-foreground">{lenderToDelete?.name}</span>? This action is permanent and will remove the lender from the platform directory.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button onClick={handleDelete} disabled={deleting} className="bg-red-500 hover:bg-red-600 text-white font-medium gap-2">
              {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
