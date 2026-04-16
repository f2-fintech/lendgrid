"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import {
    Users,
    UserPlus,
    UserMinus,
    Mail,
    Phone,
    BadgeCheck,
    ShieldAlert,
    Search,
    MoreHorizontal,
    Loader2,
    Eye,
    Trash2,
    Calendar,
    Activity,
    CheckCircle
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { useAggregator, useRemoveTeamMember, useAddTeamMember } from "@/hooks/use-aggregators"
import { useAuth } from "@/lib/auth"
import { AddTeamMemberDialog } from "@/components/dashboard/super-admin/dialogs/AddTeamMemberDialog"
import { getCookie, decodeJwt } from "@/lib/utils"

const ROLE_LABEL: Record<string, string> = {
    AGGREGATOR_MEMBER: "Aggregator Member",
    AGGREGATOR_ADMIN: "Aggregator Admin",
}

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

export function TeamManagement() {
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
    const tableTopRef = useRef<HTMLDivElement | null>(null)

    // useAuth already calls usersApi.profile() which returns profileId = AggregatorProfile._id
    const { user, loading: authLoading } = useAuth('aggregator_admin')
    const profileId: string | undefined = user?.profileId

    // companyName from JWT token (available after next login once backend change is live)
    const token = getCookie("token")
    const decoded = decodeJwt(token)
    const companyNameFromToken: string | null = decoded?.companyName ?? null

    const { data: profile, isLoading, refetch } = useAggregator(profileId || '', !!profileId)
    const removeTeamMemberMutation = useRemoveTeamMember()
    const addTeamMemberMutation = useAddTeamMember()

    // companyName: prefer JWT (no extra call), fall back to profile from API
    const companyName = companyNameFromToken || profile?.companyName || null

    const teamMembers: any[] = profile?.teamMemberUsers || []
    
    const activeCount = teamMembers.filter((m) => m.status === "ACTIVE").length
    const inactiveCount = teamMembers.filter((m) => m.status === "INACTIVE").length

    const filtered = teamMembers.filter((m: any) => {
        const matchesStatus = isInactiveView ? m.status === "INACTIVE" : m.status !== "INACTIVE"
        if (!matchesStatus) return false
        
        const q = searchTerm.toLowerCase()
        return (
            m.username?.toLowerCase().includes(q) ||
            m.email?.toLowerCase().includes(q) ||
            m.contact?.toLowerCase().includes(q)
        )
    })

    const handlePageChange = (newPage: number) => {
        setPage(newPage)
        tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }

    const handlePageSizeChange = (size: number) => {
        setPageSize(size)
        setPage(1)
        tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }

    const paginatedMembers = filtered.slice((page - 1) * pageSize, page * pageSize)

    const handleConfirmRemove = async () => {
        if (!memberToRemove || !profile?._id) return
        try {
            await removeTeamMemberMutation.mutateAsync({
                id: profile._id,
                userId: memberToRemove.id,
            })
            toast({
                title: "Member Removed",
                description: `${memberToRemove.name} has been removed from the team.`,
            })
            refetch()
        } catch (err: any) {
            toast({
                title: "Error",
                description: err?.message || "Failed to remove team member.",
                variant: "destructive",
            })
        } finally {
            setIsConfirmOpen(false)
            setMemberToRemove(null)
        }
    }

    const handleRestore = async (userId: string | undefined) => {
        if (!userId || !profile?._id) return
        try {
            await addTeamMemberMutation.mutateAsync({
                id: profile._id,
                userId: userId,
            })
            // onSuccess handles toast and refetch implicitly if handled in hook, but let's refresh explicitly
            refetch()
        } catch (err: any) {
            // Error is handled in the hook's toast
        }
    }

    if (authLoading || isLoading) {
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
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">Team Management</h1>
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">
                        {isInactiveView ? 'View and restore deleted team members for ' : 'Manage your active team members for '}
                        <span className="text-primary font-medium">
                            {companyName || profile?.companyName || "your company"}
                        </span>
                    </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-2 md:mt-0">
                    {!isInactiveView && (
                        <Button
                            onClick={() => setIsAddDialogOpen(true)}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                        >
                            <UserPlus className="w-4 h-4" />
                            Add Member
                        </Button>
                    )}
                    
                    <Button
                        className={
                            isInactiveView
                                ? 'bg-green-500 hover:bg-green-600 text-foreground'
                                : 'bg-red-500 hover:bg-red-600 text-foreground'
                        }
                        onClick={() => setFilterStatus(isInactiveView ? '' : 'INACTIVE')}
                    >
                        {isInactiveView ? (
                            <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Active Members
                                {activeCount > 0 && (
                                    <Badge className="ml-2 bg-foreground/20 text-foreground border-none">
                                        {activeCount}
                                    </Badge>
                                )}
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Deleted Members
                                {inactiveCount > 0 && (
                                    <Badge className="ml-2 bg-foreground/20 text-foreground border-none">
                                        {inactiveCount}
                                    </Badge>
                                )}
                            </>
                        )}
                    </Button>
                </div>
            </motion.div>

            {/* Stats */}
            {!isInactiveView && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
                <MetricCard
                    index={0}
                    title="Total Members"
                    amount={teamMembers.length}
                    countLabel="members"
                    icon={Users}
                    colorClass="metric-card-primary"
                />
                <MetricCard
                    index={1}
                    title="Active Members"
                    amount={teamMembers.filter((m) => m.status === "ACTIVE").length}
                    countLabel="active"
                    icon={BadgeCheck}
                    colorClass="metric-card-success"
                />
                <MetricCard
                    index={2}
                    title="Inactive Members"
                    amount={teamMembers.filter((m) => m.status !== "ACTIVE").length}
                    countLabel="inactive"
                    icon={ShieldAlert}
                    colorClass="metric-card-error"
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
                                    {isInactiveView ? 'Deleted Members' : 'Active Members'}
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    {filtered.length} member{filtered.length !== 1 ? "s" : ""} found
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
                        {filtered.length === 0 ? (
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
                                        : isInactiveView ? "All members are currently active." : "Click \"Add Member\" to invite your first team member."}
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
                                                        {ROLE_LABEL[member.role] || member.role || "—"}
                                                    </span>
                                                </TableCell>

                                                {/* Status */}
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-xs ${STATUS_STYLE[member.status] || "bg-muted/30 text-muted-foreground"}`}
                                                    >
                                                        {member.status || "—"}
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
                                                        {member.status === "INACTIVE" ? (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleRestore(member._id)}
                                                                disabled={addTeamMemberMutation.isPending}
                                                                className="h-8 w-8 text-green-400 hover:text-green-500 hover:bg-green-500/10 transition-colors"
                                                                title="Restore Member"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => {
                                                                    setMemberToRemove({
                                                                        id: member._id,
                                                                        name: member.username || member.email,
                                                                    })
                                                                    setIsConfirmOpen(true)
                                                                }}
                                                                className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                                                title="Remove Member"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </motion.tr>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {filtered.length > 0 && (
                            <div className="p-4 border-t border-border">
                                <TablePagination
                                    page={page}
                                    pageSize={pageSize}
                                    total={filtered.length}
                                    onPageChange={handlePageChange}
                                    onPageSizeChange={handlePageSizeChange}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Add Member Dialog — reuses the SuperAdmin's AddTeamMemberDialog */}
            <AddTeamMemberDialog
                isOpen={isAddDialogOpen}
                onClose={() => setIsAddDialogOpen(false)}
                aggregator={profile ?? null}
                refetch={refetch}
            />

            {/* Remove Confirm Dialog */}
            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-foreground">Remove Team Member</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            Are you sure you want to remove{" "}
                            <span className="font-semibold text-foreground">
                                {memberToRemove?.name}
                            </span>{" "}
                            from your team? This action can be reversed by adding them again.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-border text-foreground hover:bg-muted">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmRemove}
                            disabled={removeTeamMemberMutation.isPending}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {removeTeamMemberMutation.isPending ? (
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
                <DialogContent className="max-w-md bg-card border-border p-0 overflow-hidden shadow-2xl">
                    {selectedMemberForDetails && (
                        <>
                            <DialogHeader className="p-6 pb-0">
                                <DialogTitle className="text-xl">Member Details</DialogTitle>
                                <DialogDescription>Full profile information</DialogDescription>
                            </DialogHeader>
                            <div className="p-6 space-y-4">
                                <div className="flex items-center gap-4">
                                    <Avatar className="w-16 h-16">
                                        <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                                            {getInitials(selectedMemberForDetails.username)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground">{selectedMemberForDetails.username}</h3>
                                        <p className="text-sm text-primary font-medium">{ROLE_LABEL[selectedMemberForDetails.role] || selectedMemberForDetails.role}</p>
                                    </div>
                                </div>
                                
                                <div className="grid gap-4 pt-5 border-t border-border mt-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
                                            <Mail className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Email Address</p>
                                            <p className="text-sm font-medium text-foreground">{selectedMemberForDetails.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
                                            <Phone className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Contact Number</p>
                                            <p className="text-sm font-medium text-foreground">{selectedMemberForDetails.contact}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
                                            <Activity className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Status</p>
                                            <Badge variant="outline" className={`mt-0.5 text-[10px] uppercase font-bold py-0 h-5 ${STATUS_STYLE[selectedMemberForDetails.status] || "bg-muted/30 text-muted-foreground"}`}>
                                                {selectedMemberForDetails.status || "—"}
                                            </Badge>
                                        </div>
                                    </div>
                                    {selectedMemberForDetails.createdAt && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
                                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Date Added</p>
                                                <p className="text-sm font-medium text-foreground">
                                                    {new Date(selectedMemberForDetails.createdAt).toLocaleDateString(undefined, { 
                                                        year: 'numeric', 
                                                        month: 'long', 
                                                        day: 'numeric' 
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
