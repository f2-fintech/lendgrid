'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
    Search, Plus, Eye, Edit, Trash2, FileText, Clock, Phone, Mail,
    Calendar, Building2, User, X,
    FileWarning,
    Upload,
    Send,
    PauseCircle,
    ThumbsUp,
    ArrowRightCircle,
    BadgeCheck,
    BadgeDollarSign,
    Ban,
    LucideTrash,
    LayoutGrid,
    List,
    ArrowRight,
    IndianRupee,
    CreditCard,
    MapPin,
    Briefcase,
    RotateCcw,
    Check,
    ChevronsUpDown
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CardSkeleton, TableSkeleton } from '@/components/ui/loading-skeleton'
import { TablePagination } from '@/components/ui/pagination'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { useCreateApplication, useUpdateApplication } from '@/hooks/use-applications'
import { ApplicationStatus } from '@/lib'
import { useApplicationsRest } from '@/hooks/use-applications-rest'
import { useLoanProviders } from '@/hooks/use-loan-providers'
import { cn, decodeJwt, getCookie } from '@/lib/utils'

export const pretty = (v: string) => v?.toLowerCase()?.replace(/_/g, " ");

export const STATUS_STYLE: Record<string, string> = {
    "under credit review": "bg-amber-500/15 text-amber-400 border-amber-500/30",
    operations: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    "pendency in file": "bg-rose-500/15 text-rose-400 border-rose-500/30",
    "file send to banker": "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    hold: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    "to be approved": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    "to be disbursed": "bg-purple-500/15 text-purple-400 border-purple-500/30",
    approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    disbursed: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    rejected: "bg-rose-600/15 text-rose-400 border-rose-600/30",
    drop: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    submitted: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    "carry forward": "bg-violet-500/15 text-violet-400 border-violet-500/30"
};

export const STATUS_META: Record<string, { icon: JSX.Element }> = {
    "under credit review": { icon: <FileWarning size={16} /> },
    operations: { icon: <Send size={16} /> },
    "pendency in file": { icon: <Clock size={16} /> },
    "file send to banker": { icon: <Send size={16} /> },
    hold: { icon: <PauseCircle size={16} /> },
    "to be approved": { icon: <ThumbsUp size={16} /> },
    "to be disbursed": { icon: <ArrowRightCircle size={16} /> },
    approved: { icon: <BadgeCheck size={16} /> },
    disbursed: { icon: <BadgeDollarSign size={16} /> },
    rejected: { icon: <Ban size={16} /> },
    drop: { icon: <LucideTrash size={16} /> },
    submitted: { icon: <Send size={16} /> }
};

export const getStatusIcon = (status: string) =>
    STATUS_META[pretty(status)]?.icon || <Clock size={16} />;

const InfoItem = ({ icon: Icon, label, value, color }: { icon: React.ElementType, label: string, value: string | number, color: string }) => (
    <div className="flex flex-col items-center justify-center p-4 bg-card/50 rounded-lg">
        <Icon className={`w-8 h-8 ${color} mb-2`} />
        <p className="text-sm  text-muted-foreground">{label}</p>
        <p className="text-lg font-bold  text-foreground">{value}</p>
    </div>
);

const InfoLine = ({ icon: Icon, label, value, color }: { icon: React.ElementType, label: string, value: string | number, color: string }) => (
    <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${color} mt-1`} />
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-semibold text-foreground">{value}</p>
        </div>
    </div>
);

// APPLICATION CARD COMPONENT
interface ApplicationCardProps {
    application: any;
    onView: () => void;
    onDelete: () => void;
    formatCurrency: (amount: number) => string;
    isOmsEnabled: boolean;
}

const ApplicationCard = ({ application, onView, onDelete, formatCurrency, isOmsEnabled }: ApplicationCardProps) => {
    // State to toggle between details and history
    const [showHistory, setShowHistory] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-card/50 border border-border rounded-lg overflow-hidden hover:border-gold/50 transition-all duration-300 hover:shadow-lg hover:shadow-gold/10"
        >
            <div className="p-6">
                {/* Card Header - Application Number Only */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Application</p>
                        <p className="text-foreground font-bold text-lg">{application.applicationNumber}</p>
                    </div>
                </div>

                {/* Customer Info */}
                <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-border">
                    <Avatar className="w-12 h-12">
                        <AvatarImage src={application.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-card text-foreground">
                            {application.customerName.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-foreground font-semibold truncate">{application.customerName}</p>
                        <p className="text-muted-foreground text-sm truncate">{application.customerEmail}</p>
                    </div>
                </div>

                {/* Flip Animation Container */}
                <div className="relative" style={{ minHeight: '280px' }}>
                    {/* FRONT SIDE - Product & Loan Details */}
                    <motion.div
                        initial={false}
                        animate={{
                            rotateY: showHistory ? 180 : 0,
                            opacity: showHistory ? 0 : 1,
                        }}
                        transition={{ duration: 0.6 }}
                        style={{
                            backfaceVisibility: 'hidden',
                            position: showHistory ? 'absolute' : 'relative',
                            width: '100%',
                        }}
                        className="space-y-3 mb-4"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <IndianRupee className="w-4 h-4" />
                                <span>Loan Amount</span>
                            </div>
                            <p className="text-foreground font-bold">{formatCurrency(application.applicationAmount)}</p>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <FileText className="w-4 h-4" />
                                <span>Product Type</span>
                            </div>
                            <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                                {application.loanType?.replace('_', ' ') || 'N/A'}
                            </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <Phone className="w-4 h-4" />
                                <span>Contact</span>
                            </div>
                            <p className="text-foreground text-sm font-medium">{application.customerContact || 'N/A'}</p>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <Building2 className="w-4 h-4" />
                                <span>Lender</span>
                            </div>
                            <div className="text-right">
                                <p className="text-foreground text-sm font-medium">{application.applicationProvider}</p>
                                {/* <p className="text-muted-foreground text-xs">{application.lender.lenderType}</p> */}
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <MapPin className="w-4 h-4" />
                                <span>Location</span>
                            </div>
                            <div className="text-right">
                                <p className="text-foreground text-sm font-medium truncate max-w-[180px]" title={`${application.customerLocation}, ${application.customerState}`}>
                                    {application.customerLocation}, {application.customerState}
                                </p>
                            </div>
                        </div>

                        {/* CARD ACTIONS SECTION - Status Badge & Action Buttons */}
                        <div className="space-y-2 pt-4 border-t border-border">
                            {/* Status Badge - Full Width */}
                            <Tooltip>
                                <TooltipTrigger className="w-full">
                                    <div
                                        className={`w-full ${isOmsEnabled ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'} rounded-lg transition-all duration-200 ${!isOmsEnabled && 'hover:scale-[1.01]'} ${STATUS_STYLE[pretty(application.loanStatus)]} p-3 flex items-center justify-center gap-2`}
                                    >
                                        {getStatusIcon(application.loanStatus)}
                                        <span className="capitalize font-semibold text-sm">{pretty(application.loanStatus)}</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {isOmsEnabled ? "Status managed by OMS" : "Click to view details"}
                                </TooltipContent>
                            </Tooltip>

                            {/* Action Buttons - 50/50 Split */}
                            <div className="grid grid-cols-1 gap-2">
                                <Button
                                    onClick={onView}
                                    variant="outline"
                                    size="sm"
                                    className="w-full bg-background/50 border-border text-foreground hover:text-foreground hover:bg-blue-500/10 hover:border-blue-500/50 transition-all"
                                >
                                    <Eye className="w-4 h-4 mr-1.5" />
                                    View Details
                                </Button>

                                {/* <Button
                  onClick={onDelete}
                  variant="outline"
                  size="sm"
                  className="w-full bg-background/50 border-border text-red-400 hover: text-foreground hover:bg-red-600/20 hover:border-red-500/50 transition-all"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button> */}

                                {/* <Button
                                    onClick={() => setShowHistory(true)}
                                    variant="outline"
                                    size="sm"
                                    className="w-full bg-background/50 border-border text-cyan-400 hover: text-foreground hover:bg-cyan-600/20 hover:border-cyan-500/50 transition-all"
                                >
                                    <Clock className="w-4 h-4 mr-1" />
                                    History
                                </Button> */}
                            </div>
                        </div>
                    </motion.div>

                    {/* BACK SIDE - Work History */}
                    <motion.div
                        initial={false}
                        animate={{
                            rotateY: showHistory ? 0 : -180,
                            opacity: showHistory ? 1 : 0,
                        }}
                        transition={{ duration: 0.6 }}
                        style={{
                            backfaceVisibility: 'hidden',
                            position: showHistory ? 'relative' : 'absolute',
                            width: '100%',
                            top: 0,
                        }}
                        className="space-y-3"
                    >
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-border">
                            <h3 className=" text-foreground font-semibold flex items-center gap-2">
                                <Clock className="w-5 h-5 text-cyan-400" />
                                Work History
                            </h3>
                        </div>

                        {/* History List - Scrollable */}
                        <div className="space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                            {application.workHistory && application.workHistory.length > 0 ? (
                                application.workHistory.map((history: any, index: number) => (
                                    <div
                                        key={index}
                                        className="bg-background/50 rounded-lg p-3 border border-border space-y-2"
                                    >
                                        <p className=" text-foreground text-sm font-medium leading-relaxed">
                                            {history.action}
                                        </p>
                                        {history.comment && (
                                            <p className=" text-muted-foreground text-xs italic">
                                                💬 {history.comment}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-border/50">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(history.timestamp).toLocaleString('en-IN', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <Clock className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                                    <p className="text-gray-500 text-sm">No history available</p>
                                </div>
                            )}
                        </div>

                        {/* Close History Button */}
                        <Button
                            onClick={() => setShowHistory(false)}
                            variant="outline"
                            size="sm"
                            className="w-full mt-3 bg-background/50 border-border text-cyan-400 hover: text-foreground hover:bg-cyan-600/20 hover:border-cyan-500/50 transition-all"
                        >
                            <X className="w-4 h-4 mr-1.5" />
                            Close History
                        </Button>
                    </motion.div>
                </div>
            </div>

            {/* Custom Scrollbar Styles */}
            <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.8);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 1);
        }
      `}</style>
        </motion.div>
    );
};


// TABLE ROW WITH ACCORDION
interface ApplicationTableRowProps {
    application: any;
    index: number;
    onView: () => void;
    onDelete: () => void;
    formatCurrency: (amount: number) => string;
    isOmsEnabled: boolean;
}

const ApplicationTableRow = ({ application, index, onView, onDelete, formatCurrency, isOmsEnabled }: ApplicationTableRowProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <>
            {/* Main Table Row */}
            <motion.tr
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className={`border-b border-border/50 hover:bg-muted/40 transition-colors ${isExpanded ? 'bg-muted/20' : ''}`}
            >
                <TableCell className="whitespace-nowrap font-mono text-xs font-semibold text-foreground/90 py-3.5">
                    {application.applicationNumber}
                </TableCell>
                <TableCell className="py-3.5">
                    <div className="flex items-center space-x-3 min-w-[180px]">
                        <Avatar className="w-7 h-7 flex-shrink-0 ring-1 ring-border/50">
                            <AvatarImage src={application.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-[10px]">
                                {application.customerName.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 max-w-[200px]">
                            <p className="font-semibold text-xs truncate text-foreground" title={application.customerName}>{application.customerName}</p>
                            <p className="text-muted-foreground text-[11px] truncate" title={application.customerEmail}>{application.customerEmail}</p>
                        </div>
                    </div>
                </TableCell>
                <TableCell className="whitespace-nowrap py-3.5">
                    <p className="text-foreground font-semibold text-xs">{formatCurrency(application.applicationAmount)}</p>
                </TableCell>

                {/* Product Type Column */}
                <TableCell className="hidden lg:table-cell whitespace-nowrap py-3.5">
                    <Badge variant="outline" className="text-[11px] font-medium border-primary/25 bg-primary/5 text-primary py-0.5 px-2">
                        <FileText className="w-3 h-3 mr-1 opacity-80" />
                        {application.loanType?.replace('_', ' ') || 'N/A'}
                    </Badge>
                </TableCell>

                {/* Contact Column */}
                <TableCell className="hidden md:table-cell whitespace-nowrap py-3.5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3 opacity-70" />
                        <span className="text-foreground/90">{application.customerContact || 'N/A'}</span>
                    </div>
                </TableCell>
                <TableCell className="whitespace-nowrap py-3.5">
                    <p className="text-foreground/90 font-medium text-xs">{application.applicationProvider}</p>
                </TableCell>

                {/* Location Column */}
                <TableCell className="hidden xl:table-cell whitespace-nowrap py-3.5">
                    <div className="flex items-center gap-1.5 text-xs truncate max-w-[150px]" title={`${application.customerLocation}, ${application.customerState}`}>
                        <MapPin className="w-3 h-3 text-muted-foreground/70 flex-shrink-0" />
                        <span className="truncate text-foreground/90">
                            {application.customerLocation}, {application.customerState}
                        </span>
                    </div>
                </TableCell>
                <TableCell className="whitespace-nowrap py-3.5">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Badge
                                className={cn(
                                    `inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-medium rounded-full border ${isOmsEnabled ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`,
                                    STATUS_STYLE[pretty(application.loanStatus)] || "bg-muted text-muted-foreground border-border"
                                )}
                            >
                                {getStatusIcon(application.loanStatus)}
                                <span className="capitalize">{pretty(application.loanStatus)}</span>
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent>Status Managed By OMS</TooltipContent>
                    </Tooltip>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs whitespace-nowrap py-3.5">
                    {application.applicationDate}
                </TableCell>
                <TableCell className="text-center whitespace-nowrap py-3.5">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                onClick={onView}
                                className="p-1.5 rounded-lg text-primary hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer inline-flex items-center justify-center select-none"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>View Application</TooltipContent>
                    </Tooltip>
                </TableCell>
            </motion.tr>
        </>
    );
};

// GRID VIEW COMPONENT
interface ApplicationsGridProps {
    applications: any[];
    isLoading: boolean;
    hasFilters?: boolean;
    onClearFilters?: () => void;
    onCreateClick?: () => void;
    onView: (app: any) => void;
    onDelete: (id: string) => void;
    formatCurrency: (amount: number) => string;
    isOmsEnabled: boolean;
}

const ApplicationsGrid = ({ applications, isLoading, hasFilters, onClearFilters, onCreateClick, onView, onDelete, formatCurrency, isOmsEnabled }: ApplicationsGridProps) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {[...Array(6)].map((_, i) => (
                    <CardSkeleton key={i} headerLines={2} bodyHeight={200} />
                ))}
            </div>
        );
    }

    if (!applications || applications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center select-none">
                <div className="relative mb-4 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl scale-150 animate-pulse" />
                    <div className="relative w-16 h-16 rounded-2xl bg-card border border-border/80 shadow-md flex items-center justify-center text-primary">
                        <FileText className="w-8 h-8 stroke-[1.5]" />
                    </div>
                </div>
                <h3 className="text-base font-bold text-foreground tracking-tight mb-1.5">
                    {hasFilters ? "No matching applications found" : "No applications available"}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-5 leading-relaxed">
                    {hasFilters
                        ? "We couldn't find any applications matching your search or active filters. Try adjusting or resetting them."
                        : "There are currently no loan applications created or assigned in this view."}
                </p>
                {hasFilters && onClearFilters ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onClearFilters}
                        className="h-8 px-4 text-xs font-medium border-border/70 hover:bg-muted gap-2 rounded-lg"
                    >
                        <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                        Reset All Filters
                    </Button>
                ) : onCreateClick ? (
                    <Button
                        size="sm"
                        onClick={onCreateClick}
                        className="h-8 px-4 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 rounded-lg shadow-sm"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Create Application
                    </Button>
                ) : null}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {applications.map((application) => (
                <ApplicationCard
                    key={application.applicationId}
                    application={application}
                    onView={() => onView(application)}
                    onDelete={() => onDelete(application.applicationId)}
                    formatCurrency={formatCurrency}
                    isOmsEnabled={isOmsEnabled}
                />
            ))}
        </div>
    );
};

export function AggregatorApplications({
    startDate,
    endDate
}: {
    startDate?: string | null;
    endDate?: string | null;
} = {}) {
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
    const [searchTerm, setSearchTerm] = useState('')
    const [filterLender, setFilterLender] = useState('')
    const [openProvider, setOpenProvider] = useState(false)
    const { providerOptions: lenderOptions } = useLoanProviders(1, 100)

    const [selectedApplication, setSelectedApplication] = useState<any>(null)
    const [selectedLenderId, setSelectedLenderId] = useState("")
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

    const { user } = useAuth(['aggregator_admin', 'aggregator_member', 'lendgrid_sales'])
    const { toast } = useToast()
    const token = getCookie("lendgrid_cookie")
    const decoded = decodeJwt(token)
    const isOmsEnabled = decoded?.isOmsEnabled ?? false

    const [form, setForm] = useState({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        loanAmount: '',
        productId: '',
        lenderId: ''
    })

    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const tableTopRef = useRef<HTMLDivElement | null>(null)
    const router = useRouter();

    const [companyIdOverride, setCompanyIdOverride] = useState<string>(() => {
        if (typeof window === 'undefined') return ''
        return localStorage.getItem('selectedCompanyId') || ''
    })

    useEffect(() => {
        const handleCompanyChange = (e: Event) => {
            const newCompanyId = (e as CustomEvent<string>).detail
            setCompanyIdOverride(newCompanyId)
            setPage(1)
            setSearchTerm('')
        }
        window.addEventListener('companyChanged', handleCompanyChange)
        return () => window.removeEventListener('companyChanged', handleCompanyChange)
    }, [])

    const roleLower = String(decoded?.role || user?.role || '').toLowerCase();
    const isSalesUser = (decoded?.source === 'oms' && roleLower === 'sales') || roleLower === 'sales' || roleLower === 'lendgrid_sales';
    const isAggregatorMember = roleLower === 'aggregator_member';
    const isAggregatorAdmin = roleLower === 'aggregator_admin';

    const effectiveSalesUserId = isSalesUser
        ? (decoded?.id ?? decoded?.userId ?? decoded?.sub ?? decoded?.salesUserId ?? decoded?.user_id ?? user?.omsUserId ?? user?.id)
        : (isAggregatorMember ? (decoded?.id || decoded?.sub || user?._id || user?.id) : undefined);

    const effectiveAggregatorId = isAggregatorAdmin ? (user?.profileId || user?._id || user?.id) : undefined;

    // Fetch applications New (REST + SWR), using f2fintech-admin-server api
    const {
        data: applications,
        isLoading: isTableLoading,
        refetch
    } = useApplicationsRest({
        page,
        limit: pageSize,
        search: searchTerm,
        companyIdOverride: companyIdOverride || undefined,
        salesUserId: effectiveSalesUserId,
        aggregatorId: effectiveAggregatorId,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
    })
    const total = applications?.count || 0

    const createApplicationMutation = useCreateApplication();
    const updateApplicationMutation = useUpdateApplication();

    // Client-side filtering for search and lender
    const filteredApplications = useMemo(() => {
        return applications?.results?.filter(app => {
            const matchesSearch = app.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                // app.applicationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                app.applicationProvider.toLowerCase().includes(searchTerm.toLocaleLowerCase())
            const matchesLender = !filterLender || filterLender === 'all' || app.applicationProvider === filterLender
            return matchesSearch && matchesLender
        })
    }, [applications?.results, searchTerm, filterLender])

    // Reset page when filters change
    const hasActiveFilters = Boolean(searchTerm.trim() || (filterLender && filterLender !== 'all'))

    const handleClearFilters = () => {
        setSearchTerm('')
        setFilterLender('')
        setPage(1)
    }

    useEffect(() => {
        setPage(1)
    }, [searchTerm, filterLender])

    const handlePageChange = async (newPage: number) => {
        setPage(newPage)
        tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }

    const handlePageSizeChange = async (size: number) => {
        setPageSize(size)
        setPage(1)
        tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }

    const handleCreateApplication = async () => {
        try {
            if (!selectedProduct) return;

            const payload = {
                aggregatorId: user?.profileId || user?._id || user?.id,
                productId: form.productId,
                lenderId: form.lenderId,
                customerName: form.customerName,
                customerEmail: form.customerEmail,
                customerPhone: form.customerPhone,
                loanAmount: Number(form.loanAmount || 0),
            }

            const response = await createApplicationMutation.mutateAsync(payload)
            // console.log(response.createApplication.application, 'create application response')

            if (response?.createApplication?.success) {
                toast({ title: 'Success', description: 'Application created successfully' })
                setIsCreateDialogOpen(false)
                setSelectedProduct(null);
                setSelectedLenderId("")
                setForm({
                    customerName: '',
                    customerEmail: '',
                    customerPhone: '',
                    loanAmount: '',
                    productId: '',
                    lenderId: ''
                })
                // Refetch applications
                refetch();
            } else {
                toast({
                    title: 'Error',
                    // description: response?.createApplication?.message || 'Failed to create application',
                    description: 'Failed to create application',
                    variant: 'destructive'
                })
            }
        } catch (e: any) {
            toast({
                title: 'Error',
                description: e?.message || 'Failed to create application',
                variant: 'destructive'
            })
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete')) return
        // try {
        //   await deleteApplicationMutation.mutateAsync(id);
        //   toast({ title: 'Success', description: 'Application deleted successfully.' })
        // } catch (err) {
        //   toast({
        //     title: 'Error',
        //     description: 'Failed to delete Application.',
        //     variant: 'destructive',
        //   })
        // }
    }


    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount)
    }

    return (
        <div className="space-y-6 w-full min-w-0 max-w-full">
            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="flex flex-col sm:flex-row gap-3 w-full"
            >
                <div className="relative flex-1 w-full min-w-0">
                    <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground/70 w-4 h-4" />
                    <Input
                        placeholder="Search applications by customer or lender..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-9.5 bg-card/80 border-border/80 text-foreground text-xs placeholder:text-muted-foreground/60 w-full rounded-lg shadow-sm focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/50"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
                <Popover open={openProvider} onOpenChange={setOpenProvider}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openProvider}
                            className="w-full sm:w-56 h-9.5 justify-between bg-card/80 border-border/80 text-foreground text-xs font-medium rounded-lg shadow-sm flex-shrink-0"
                        >
                            <span className="truncate">
                                {filterLender && filterLender !== 'all'
                                    ? lenderOptions.find((p) => p.value.toLowerCase() === filterLender.toLowerCase())?.label || filterLender
                                    : "All Lenders"}
                            </span>
                            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-0 z-50 bg-card border border-border shadow-xl">
                        <Command>
                            <CommandInput placeholder="Search lender..." className="text-xs h-9" />
                            <CommandList className="max-h-56">
                                <CommandEmpty className="py-3 text-xs text-muted-foreground text-center">No lender found.</CommandEmpty>
                                <CommandGroup>
                                    <CommandItem
                                        value="all"
                                        onSelect={() => {
                                            setFilterLender("")
                                            setOpenProvider(false)
                                        }}
                                        className="text-xs cursor-pointer"
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-3.5 w-3.5",
                                                !filterLender || filterLender === "" || filterLender === "all" ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        All Lenders
                                    </CommandItem>
                                    {lenderOptions.map((opt) => (
                                        <CommandItem
                                            key={opt.value}
                                            value={opt.label}
                                            onSelect={() => {
                                                setFilterLender(filterLender.toLowerCase() === opt.value.toLowerCase() ? "" : opt.value)
                                                setOpenProvider(false)
                                            }}
                                            className="text-xs cursor-pointer"
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-3.5 w-3.5",
                                                    filterLender?.toLowerCase() === opt.value.toLowerCase() ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {opt.label}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </motion.div>

            {/* Applications Table/Grid with View Toggle */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="w-full min-w-0"
            >
                <Card className="professional-card w-full min-w-0 max-w-full overflow-hidden border-border/70 shadow-sm">
                    <CardHeader className="py-4 px-5 border-b border-border/50">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm flex-shrink-0">
                                    <FileText className="w-4.5 h-4.5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-bold text-foreground tracking-tight">
                                        {isOmsEnabled ? 'Fresh Applications' : 'Loan Applications'}
                                    </CardTitle>
                                    <CardDescription className="text-xs text-muted-foreground">
                                        Track and manage fresh incoming loan applications
                                    </CardDescription>
                                </div>
                            </div>

                            {/* Actions & View Toggle */}
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                <Button
                                    size="sm"
                                    onClick={() => router.push('/aggregator/applications/new')}
                                    className="h-8 px-4 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 rounded-lg shadow-sm"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Create Application</span>
                                </Button>

                                <div className="flex items-center p-0.5 bg-muted/60 border border-border/60 rounded-lg">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                type="button"
                                                onClick={() => setViewMode('table')}
                                                className={cn(
                                                    "p-1.5 rounded-md text-xs font-medium transition-all cursor-pointer",
                                                    viewMode === 'table' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                <List className="w-3.5 h-3.5" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" sideOffset={6}>Table View</TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                type="button"
                                                onClick={() => setViewMode('grid')}
                                                className={cn(
                                                    "p-1.5 rounded-md text-xs font-medium transition-all cursor-pointer",
                                                    viewMode === 'grid' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                <LayoutGrid className="w-3.5 h-3.5" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" sideOffset={6}>Grid View</TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div ref={tableTopRef} />
                        {/* CONDITIONAL RENDERING: TABLE OR GRID */}
                        {viewMode === 'table' ? (
                            <div className="overflow-x-auto professional-table w-full min-w-0">
                                {isTableLoading ? (
                                    <TableSkeleton columns={6} rows={pageSize} />
                                ) : (
                                    <Table>
                                        <TableHeader className="bg-muted/40 border-b border-border">
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap py-3">App #</TableHead>
                                                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap py-3">Customer</TableHead>
                                                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap py-3">Loan Amount</TableHead>
                                                <TableHead className="hidden lg:table-cell text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap py-3">Product Type</TableHead>
                                                <TableHead className="hidden md:table-cell text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap py-3">Contact</TableHead>
                                                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap py-3">Lender</TableHead>
                                                <TableHead className="hidden xl:table-cell text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap py-3">Location</TableHead>
                                                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap py-3">Status</TableHead>
                                                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap py-3">Created</TableHead>
                                                <TableHead className="text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap py-3">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredApplications && filteredApplications.length > 0 ? (
                                                filteredApplications.map((application, index) => (
                                                    <ApplicationTableRow
                                                        key={application.applicationId}
                                                        application={application}
                                                        index={index}
                                                        onView={() => {
                                                            setSelectedApplication(application)
                                                            setIsViewDialogOpen(true)
                                                        }}
                                                        onDelete={() => handleDelete(application.applicationId)}
                                                        formatCurrency={formatCurrency}
                                                        isOmsEnabled={isOmsEnabled}
                                                    />
                                                ))
                                            ) : (
                                                <TableRow className="hover:bg-transparent">
                                                    <TableCell colSpan={10} className="h-72 text-center p-0">
                                                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center select-none">
                                                            <div className="relative mb-4 flex items-center justify-center">
                                                                <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl scale-150 animate-pulse" />
                                                                <div className="relative w-16 h-16 rounded-2xl bg-card border border-border/80 shadow-md flex items-center justify-center text-primary">
                                                                    <FileText className="w-8 h-8 stroke-[1.5]" />
                                                                </div>
                                                            </div>
                                                            <h3 className="text-base font-bold text-foreground tracking-tight mb-1.5">
                                                                {hasActiveFilters ? "No matching applications found" : "No applications available"}
                                                            </h3>
                                                            <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-5 leading-relaxed">
                                                                {hasActiveFilters
                                                                    ? "We couldn't find any applications matching your search or active filters. Try adjusting or resetting them."
                                                                    : "There are currently no loan applications created or assigned in this view."}
                                                            </p>
                                                            {hasActiveFilters ? (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={handleClearFilters}
                                                                    className="h-8 px-4 text-xs font-medium border-border/70 hover:bg-muted gap-2 rounded-lg"
                                                                >
                                                                    <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                                                                    Reset All Filters
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => router.push('/aggregator/applications/new')}
                                                                    className="h-8 px-4 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 rounded-lg shadow-sm"
                                                                >
                                                                    <Plus className="w-3.5 h-3.5" />
                                                                    Create Application
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>
                        ) : (
                            // GRID VIEW
                            <ApplicationsGrid
                                applications={filteredApplications || []}
                                isLoading={isTableLoading}
                                hasFilters={hasActiveFilters}
                                onClearFilters={handleClearFilters}
                                onCreateClick={() => router.push('/aggregator/applications/new')}
                                onView={(app) => {
                                    setSelectedApplication(app);
                                    setIsViewDialogOpen(true);
                                }}
                                onDelete={handleDelete}
                                formatCurrency={formatCurrency}
                                isOmsEnabled={isOmsEnabled}
                            />
                        )}
                        <div className="px-4 pb-4">
                            <TablePagination
                                page={page}
                                pageSize={pageSize}
                                total={total}
                                onPageChange={handlePageChange}
                                onPageSizeChange={handlePageSizeChange}
                                className="mt-4"
                            />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* View Application Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent
                    className="bg-background border border-border text-foreground max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
                    onInteractOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                >
                    {selectedApplication && (
                        <>
                            <DialogHeader className="border-b border-border/50 pb-4 flex justify-between items-center">
                                <div>
                                    <DialogTitle className="text-2xl font-bold text-foreground">
                                        Application Details
                                    </DialogTitle>
                                    <DialogDescription className="text-muted-foreground text-sm">
                                        Complete information about this loan application
                                    </DialogDescription>
                                </div>
                                <button
                                    className="p-2 rounded hover:bg-muted transition absolute right-6 top-6"
                                    aria-label="Close"
                                    onClick={() => setIsViewDialogOpen(false)}
                                >
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </DialogHeader>

                            <div className="space-y-6 pt-4">
                                {/* Status and Application Number Section */}
                                <div className="flex gap-3 justify-between items-start flex-wrap">
                                    <div className="flex flex-wrap gap-2">
                                        <Badge className="bg-primary/20 text-primary border border-primary/30 px-4 py-1.5 text-sm font-semibold">
                                            {selectedApplication.applicationNumber}
                                        </Badge>
                                        <Badge
                                            className={`${STATUS_STYLE[pretty(selectedApplication.loanStatus)]} border px-4 py-1.5 text-sm font-semibold`}
                                        >
                                            {pretty(selectedApplication.loanStatus)}
                                        </Badge>
                                        {selectedApplication.leadType && (
                                            <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-4 py-1.5 text-sm font-semibold">
                                                {selectedApplication.leadType}
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Customer Information Card */}
                                <div className="bg-card/50 rounded-lg p-6 border border-border backdrop-blur-sm">
                                    <h3 className="text-lg font-semibold mb-4 text-primary flex items-center gap-2">
                                        <User className="w-5 h-5" />
                                        Customer Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-blue-500/10 p-2 rounded-lg mt-1">
                                                <User className="w-4 h-4 text-blue-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-muted-foreground mb-1">Full Name</p>
                                                <p className="text-foreground font-semibold">{selectedApplication.customerName}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div className="bg-green-500/10 p-2 rounded-lg mt-1">
                                                <Mail className="w-4 h-4 text-green-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-muted-foreground mb-1">Email Address</p>
                                                <p className="text-foreground font-semibold break-all">{selectedApplication.customerEmail}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div className="bg-purple-500/10 p-2 rounded-lg mt-1">
                                                <Phone className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-muted-foreground mb-1">Contact Number</p>
                                                <p className="text-foreground font-semibold">{selectedApplication.customerContact}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div className="bg-amber-500/10 p-2 rounded-lg mt-1">
                                                <CreditCard className="w-4 h-4 text-amber-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-muted-foreground mb-1">PAN Number</p>
                                                <p className="text-foreground font-semibold font-mono">{selectedApplication.customerPAN}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div className="bg-cyan-500/10 p-2 rounded-lg mt-1">
                                                <Briefcase className="w-4 h-4 text-cyan-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-muted-foreground mb-1">Designation</p>
                                                <p className="text-foreground font-semibold capitalize">{selectedApplication.customerDesignation}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div className="bg-orange-500/10 p-2 rounded-lg mt-1">
                                                <MapPin className="w-4 h-4 text-orange-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-muted-foreground mb-1">Location</p>
                                                <p className="text-foreground font-semibold capitalize">
                                                    {selectedApplication.customerLocation}, {selectedApplication.customerState}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Loan Details Card */}
                                <div className="bg-card/50 rounded-lg p-6 border border-border backdrop-blur-sm">
                                    <h3 className="text-lg font-semibold mb-4 text-green-400 flex items-center gap-2">
                                        <IndianRupee className="w-5 h-5" />
                                        Loan Details
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div className="bg-muted/50 rounded-lg p-4 border border-border">
                                            <p className="text-xs text-muted-foreground mb-2">Loan Amount</p>
                                            <p className="text-xl font-bold text-primary">{formatCurrency(selectedApplication.applicationAmount)}</p>
                                        </div>

                                        <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                                            <p className="text-xs text-muted-foreground mb-2">Loan Type</p>
                                            <p className="text-xl font-bold text-cyan-400 capitalize">{pretty(selectedApplication.loanType)}</p>
                                        </div>

                                        <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                                            <p className="text-xs text-muted-foreground mb-2">Loan Category</p>
                                            <p className="text-xl font-bold text-purple-400 capitalize">{selectedApplication.loanCategory}</p>
                                        </div>

                                        <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                                            <p className="text-xs text-muted-foreground mb-2">Tenure</p>
                                            <p className="text-xl font-bold text-amber-400">{selectedApplication.applicationTenure} Years</p>
                                        </div>

                                        <div className="bg-background/50 rounded-lg p-4 border border-border/50 md:col-span-2">
                                            <p className="text-xs text-muted-foreground mb-2">Provider</p>
                                            <p className="text-xl font-bold text-emerald-400">{selectedApplication.applicationProvider}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Application Timeline Card */}
                                <div className="bg-card/50 rounded-lg p-6 border border-border backdrop-blur-sm">
                                    <h3 className="text-lg font-semibold mb-4 text-cyan-400 flex items-center gap-2">
                                        <Clock className="w-5 h-5" />
                                        Application Timeline
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3 bg-muted/50 p-4 rounded-lg border border-border">
                                            <Calendar className="w-5 h-5 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Application Date</p>
                                                <p className="text-foreground font-semibold text-sm">
                                                    {new Date(selectedApplication.applicationDate).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 bg-background/50 p-4 rounded-lg border border-border/30">
                                            <BadgeCheck className="w-5 h-5 text-green-400" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Current Status</p>
                                                <p className="text-foreground font-semibold text-sm capitalize">
                                                    {pretty(selectedApplication.loanStatus)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Referral Code Card */}
                                <div className="bg-card/50 rounded-lg p-6 border border-border backdrop-blur-sm">
                                    <h3 className="text-lg font-semibold mb-4 text-purple-400 flex items-center gap-2">
                                        <Briefcase className="w-5 h-5" />
                                        Referral Information
                                    </h3>
                                    <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                                        <p className="text-xs text-muted-foreground mb-2">Referral Code</p>
                                        {selectedApplication.referralCode ? (
                                            <p className="text-xl font-bold font-mono text-purple-400">{selectedApplication.referralCode}</p>
                                        ) : (
                                            <p className="text-muted-foreground italic">No referral code provided</p>
                                        )}
                                    </div>
                                </div>

                                {/* System Information Card */}
                                {/* <div className="bg-card/50 rounded-lg p-6 border border-border backdrop-blur-sm">
                                    <h3 className="text-lg font-semibold mb-4 text-amber-400 flex items-center gap-2">
                                        <FileText className="w-5 h-5" />
                                        System Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                                            <p className="text-xs text-muted-foreground mb-2">Application ID</p>
                                            <p className="text-foreground font-semibold font-mono">{selectedApplication.applicationId}</p>
                                        </div>

                                        <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                                            <p className="text-xs text-muted-foreground mb-2">Customer ID</p>
                                            <p className="text-foreground font-semibold font-mono">{selectedApplication.customerId}</p>
                                        </div>

                                        <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                                            <p className="text-xs text-muted-foreground mb-2">Company ID</p>
                                            <p className="text-foreground font-semibold font-mono">{selectedApplication.companyId}</p>
                                        </div>
                                    </div>
                                </div> */}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
