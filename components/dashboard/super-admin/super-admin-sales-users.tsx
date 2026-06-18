"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Users,
    UserPlus,
    Mail,
    Phone,
    BadgeCheck,
    ShieldAlert,
    Search,
    Loader2,
    Eye,
    Trash2,
    Calendar,
    Activity,
    CheckCircle,
    X
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { TablePagination } from "@/components/ui/pagination"
import { useToast } from "@/hooks/use-toast"
import { useUsersByRole, useUpdateUser } from "@/hooks/use-users"
import { AddSalesUserDialog } from "@/components/dashboard/super-admin/dialogs/AddSalesUserDialog"

const STATUS_STYLE: Record<string, string> = {
    ACTIVE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    INACTIVE: "bg-red-500/15 text-red-400 border-red-500/30",
    PENDING: "bg-amber-500/15 text-amber-400 border-amber-500/30",
}

function getInitials(name: string) {
    return (name || "U")
        .split(" ")
        .map((s) => s.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("")
}

function MetricCard({
    index,
    title,
    amount,
    count,
    countLabel,
    icon: Icon,
    colorClass,
}: {
    index: number
    title: string
    amount?: number | string
    count?: number
    countLabel?: string
    icon: any
    colorClass: string
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
        >
            <Card className={`professional-card hover-lift ${colorClass}`}>
                <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center gap-4 text-left">
                        {/* Icon */}
                        <div className="w-12 h-12 rounded-xl flex flex-shrink-0 items-center justify-center bg-white/15">
                            <Icon className="w-6 h-6 text-current" />
                        </div>

                        {/* Text Content */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground opacity-90 truncate">
                                {title}
                            </p>
                            <div className="flex items-baseline gap-2 mt-0.5">
                                <p className="text-2xl font-bold text-foreground">
                                    {amount ?? '-'}
                                </p>
                                {(typeof count === 'number' || countLabel) && (
                                    <p className="text-xs text-muted-foreground font-medium">
                                        ({typeof count === 'number' ? `${count} ` : ''}
                                        {countLabel})
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}

export function SuperAdminSalesUsers() {
    const { toast } = useToast()
    const [searchTerm, setSearchTerm] = useState("")
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [selectedMemberForDetails, setSelectedMemberForDetails] = useState<any | null>(null)
    const [filterStatus, setFilterStatus] = useState<'' | 'INACTIVE'>('')
    const isInactiveView = filterStatus === 'INACTIVE'

    // Pagination state
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const tableTopRef = useRef<HTMLDivElement | null>(null)

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm)
            setPage(1)
        }, 350)
        return () => clearTimeout(timer)
    }, [searchTerm])

    const { data: usersData, isLoading, refetch } = useUsersByRole('LENDGRID_SALES', {
        page,
        limit: pageSize,
        status: filterStatus || undefined,
        searchTerm: debouncedSearch || undefined
    })
    const updateUserMutation = useUpdateUser()

    const salesMembers: any[] = usersData?.results || []
    const totalCount = usersData?.count || 0
    const activeCount = usersData?.activeCount || 0
    const inactiveCount = usersData?.inactiveCount || 0

    const handlePageChange = (newPage: number) => {
        setPage(newPage)
        tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }

    const handlePageSizeChange = (size: number) => {
        setPageSize(size)
        setPage(1)
        tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }

    const paginatedMembers = salesMembers

    const handleConfirmRemove = async () => {
        if (!memberToRemove) return
        try {
            await updateUserMutation.mutateAsync({
                id: memberToRemove.id,
                status: "INACTIVE"
            })
            // Toast will be shown by hook
            refetch()
        } catch (err: any) {
            // Error managed by hook toast
        } finally {
            setIsConfirmOpen(false)
            setMemberToRemove(null)
        }
    }

    const handleRestore = async (userId: string | undefined) => {
        if (!userId) return
        try {
            await updateUserMutation.mutateAsync({
                id: userId,
                status: "ACTIVE"
            })
            refetch()
        } catch (err: any) {
            // Error managed by hook
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-muted-foreground text-sm">Loading team data…</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
                <div className="w-full md:w-auto">
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">Sales Team Management</h1>
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">
                        {isInactiveView ? 'View and restore deleted ' : 'Manage your active '}
                        <span className="text-primary font-medium">
                            LendGrid Sales
                        </span>
                        {' members'}
                    </p>
                </div>
            </motion.div>

            {/* Stats */}
            {!isInactiveView && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
                    <MetricCard
                        index={0}
                        title="Total Members"
                        amount={totalCount}
                        countLabel=""
                        icon={Users}
                        colorClass="metric-card-primary"
                    />
                    <MetricCard
                        index={1}
                        title="Active Members"
                        amount={activeCount}
                        countLabel=""
                        icon={BadgeCheck}
                        colorClass="metric-card-success"
                    />
                    <MetricCard
                        index={2}
                        title="Inactive Members"
                        amount={inactiveCount}
                        countLabel=""
                        icon={ShieldAlert}
                        colorClass="metric-card-warning"
                    />
                </div>
            )}

            {/* Members Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
            >
                <Card className="bg-card border-border">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div>
                                <CardTitle className="text-foreground flex items-center gap-2">
                                    <Users className="w-5 h-5 text-primary" />
                                    {isInactiveView ? 'Deleted Sales Members' : 'Active Sales Members'}
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    {totalCount} member{totalCount !== 1 ? "s" : ""} found
                                </CardDescription>
                            </div>
                            <div className="relative w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name, email or contact…"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 bg-muted/50 border-border text-foreground"
                                />
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {paginatedMembers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                                <div className="p-5 bg-muted rounded-full mb-4">
                                    <Users className="w-12 h-12 text-muted-foreground" />
                                </div>
                                <p className="text-base font-semibold text-foreground mb-1">
                                    {searchTerm ? "No members match your search" : isInactiveView ? "No deleted members" : "No team members yet"}
                                </p>
                                <p className="text-sm text-muted-foreground mb-6">
                                    {searchTerm
                                        ? "Try adjusting your search term."
                                        : isInactiveView ? "All members are currently active." : "Click \"Add Sales User\" to invite your first team member."}
                                </p>
                                {!searchTerm && !isInactiveView && (
                                    <Button
                                        onClick={() => setIsAddDialogOpen(true)}
                                        variant="outline"
                                        className="gap-2"
                                    >
                                        <UserPlus className="w-4 h-4" />
                                        Add First Member
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto professional-table">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border hover:bg-transparent">
                                            <TableHead className="text-muted-foreground">Member</TableHead>
                                            <TableHead className="text-muted-foreground">Contact</TableHead>
                                            <TableHead className="text-muted-foreground">Role</TableHead>
                                            <TableHead className="text-muted-foreground">Status</TableHead>
                                            <TableHead className="text-muted-foreground w-16">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedMembers.map((member, idx) => (
                                            <motion.tr
                                                key={member._id}
                                                initial={{ opacity: 0, x: -16 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: idx * 0.04 }}
                                                className="border-border hover:bg-muted/30 transition-colors"
                                            >
                                                {/* Member */}
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="w-9 h-9">
                                                            <AvatarFallback className="bg-primary/15 text-primary text-sm font-semibold">
                                                                {getInitials(member.username)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium text-foreground text-sm">
                                                                {member.username || "—"}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Mail className="w-3 h-3" />
                                                                {member.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Contact */}
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                                                        <Phone className="w-3.5 h-3.5" />
                                                        {member.contact || "—"}
                                                    </div>
                                                </TableCell>

                                                {/* Role */}
                                                <TableCell>
                                                    <span className="text-sm text-foreground">
                                                        LendGrid Sales
                                                    </span>
                                                </TableCell>

                                                {/* Status */}
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-xs ${STATUS_STYLE[member.status] || "bg-muted/30 text-muted-foreground"}`}
                                                    >
                                                        {member.status?.toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase()) || "—"}
                                                    </Badge>
                                                </TableCell>

                                                {/* Actions */}
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setSelectedMemberForDetails(member)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </motion.tr>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {totalCount > 0 && (
                            <div className="p-4 border-t border-border">
                                <TablePagination
                                    page={page}
                                    pageSize={pageSize}
                                    total={totalCount}
                                    onPageChange={handlePageChange}
                                    onPageSizeChange={handlePageSizeChange}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Add Member Dialog */}
            <AddSalesUserDialog
                isOpen={isAddDialogOpen}
                onClose={() => setIsAddDialogOpen(false)}
                refetch={refetch}
            />

            {/* Remove Confirm Dialog */}
            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-foreground">Remove Sales Member</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            Are you sure you want to delete{" "}
                            <span className="font-semibold text-foreground">
                                {memberToRemove?.name}
                            </span>{" "}
                            from the sales team? This action will set the member to inactive.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-border text-foreground hover:bg-muted">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmRemove}
                            disabled={updateUserMutation.isPending}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {updateUserMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Removing…
                                </>
                            ) : (
                                "Remove"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Member Details Dialog */}
            <Dialog open={!!selectedMemberForDetails} onOpenChange={(val) => !val && setSelectedMemberForDetails(null)}>
                <DialogContent className="max-w-2xl bg-card border-border p-0 overflow-hidden shadow-2xl rounded-2xl">
                    {selectedMemberForDetails && (
                        <div className="flex flex-col w-full">
                            {/* Header Banner */}
                            <div className="h-28 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 relative">
                                <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]"></div>
                                <div className="absolute top-4 left-6">
                                    <h2 className="text-white/90 text-sm font-medium tracking-wider uppercase">Profile Overview</h2>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/20 hover:bg-red-500 text-white transition-all z-20 hover:scale-110 active:scale-95"
                                    onClick={() => setSelectedMemberForDetails(null)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Profile Section */}
                            <div className="px-8 pb-8 relative">
                                <div className="flex flex-col sm:flex-row sm:items-end gap-6 -mt-10 mb-8">
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full group-hover:opacity-40 transition-opacity"></div>
                                        <Avatar className="w-24 h-24 border-4 border-card shadow-2xl relative z-10">
                                            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white text-3xl font-bold">
                                                {getInitials(selectedMemberForDetails.username)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-card z-20 shadow-lg" title="Active Account"></div>
                                    </div>
                                    <div className="flex-1 pb-1">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex flex-col items-start">
                                                <h3 className="text-2xl font-bold text-foreground tracking-tight leading-none mb-2">{selectedMemberForDetails.username.charAt(0).toUpperCase() + selectedMemberForDetails.username.slice(1)}</h3>
                                                <div className="flex items-center gap-2 -ml-2.5">
                                                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-none hover:bg-blue-500/20 transition-colors">
                                                        LendGrid Sales
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">•</span>
                                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Member ID: #{selectedMemberForDetails._id?.toString().slice(0, 4) || "0000"}</span>
                                                </div>
                                            </div>
                                            <Badge className={`px-4 py-1 text-xs font-bold uppercase tracking-widest ${STATUS_STYLE[selectedMemberForDetails.status]}`}>
                                                {selectedMemberForDetails.status?.toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase())}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Information Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-border/50">
                                    {/* Email */}
                                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/30 border border-border/20 hover:bg-muted/50 transition-all duration-300 group">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Email Address</p>
                                            <p className="text-sm font-semibold text-foreground truncate" title={selectedMemberForDetails.email}>
                                                {selectedMemberForDetails.email}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Contact */}
                                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/30 border border-border/20 hover:bg-muted/50 transition-all duration-300 group">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                                            <Phone className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Contact Number</p>
                                            <p className="text-sm font-semibold text-foreground">{selectedMemberForDetails.contact}</p>
                                        </div>
                                    </div>

                                    {/* Account Created */}
                                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/30 border border-border/20 hover:bg-muted/50 transition-all duration-300 group">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Registration Date</p>
                                            <p className="text-sm font-semibold text-foreground">
                                                {selectedMemberForDetails.createdAt ? new Date(selectedMemberForDetails.createdAt).toLocaleDateString('en-IN', {
                                                    day: '2-digit',
                                                    month: 'long',
                                                    year: 'numeric'
                                                }) : 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Additional Info / Security */}
                                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/30 border border-border/20 hover:bg-muted/50 transition-all duration-300 group">
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                                            <CheckCircle className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Security Status</p>
                                            <p className="text-sm font-semibold text-emerald-500 flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                Verified Member
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
