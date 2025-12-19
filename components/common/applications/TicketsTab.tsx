'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
    Search, ClipboardList, Eye, Edit, Trash2, Clock, CheckCircle, XCircle, AlertCircle, Phone, Mail,
    Calendar, DollarSign, Building2, User, X, Landmark, Percent, Contact2Icon,
    FileWarning,
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
    ArrowRight
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'

import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CardSkeleton, TableSkeleton } from '@/components/ui/loading-skeleton'
import { TablePagination } from '@/components/ui/pagination'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { ApplicationStatus } from '@/lib'
import { useGetTickets } from '@/hooks/use-tickets-rest'
import { cn } from '@/lib/utils'

export const pretty = (v: string) => v?.toLowerCase()?.replace(/_/g, " ");

export const STATUS_STYLE: Record<string, string> = {
    "under credit review": "bg-amber-500/15 text-amber-300 border-amber-500/25",
    operations: "bg-sky-600/15 text-sky-400 border-sky-500/40",
    "pendency in file": "bg-red-500/15 text-red-300 border-red-500/25",
    "file send to banker": "bg-indigo-500/15 text-indigo-300 border-indigo-500/25",
    hold: "bg-yellow-500/15 text-yellow-300 border-yellow-500/25",
    "to be approved": "bg-green-500/15 text-green-300 border-green-500/25",
    "to be disbursed": "bg-purple-500/15 text-purple-300 border-purple-500/25",
    approved: "bg-lime-500/15 text-lime-300 border-lime-500/25",
    disbursed: "bg-cyan-500/15 text-cyan-300 border-cyan-500/25",
    rejected: "bg-red-600/15 text-red-400 border-red-600/25",
    drop: "bg-orange-500/15 text-orange-300 border-orange-500/25",
    submitted: "bg-blue text-gray-300 border-blue-500/25"
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

// APPLICATION CARD COMPONENT
interface ApplicationCardProps {
    application: any;
    onView: () => void;
    onDelete: () => void;
    onStatusClick: () => void;
    formatCurrency: (amount: number) => string;
}

const ApplicationCard = ({ application, onView, onDelete, onStatusClick, formatCurrency }: ApplicationCardProps) => {
    // State to toggle between details and history
    const [showHistory, setShowHistory] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden hover:border-gold/50 transition-all duration-300 hover:shadow-lg hover:shadow-gold/10"
        >
            <div className="p-6">
                {/* Card Header - Application Number Only */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Ticket ID</p>
                        <p className="text-white font-bold text-lg">F2FIN-{application.ticketId}</p>
                    </div>
                </div>

                {/* Customer Info */}
                <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-gray-700">
                    <Avatar className="w-12 h-12">
                        <AvatarImage src={application.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-gray-800 text-gray-300">
                            {application.customerName.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold truncate">{application.customerName}</p>
                        <p className="text-gray-400 text-sm truncate">{application.customerEmail}</p>
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
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                <DollarSign className="w-4 h-4" />
                                <span>Loan Amount</span>
                            </div>
                            <p className="text-white font-bold">{formatCurrency(application.applicationAmount)}</p>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                <ClipboardList className="w-4 h-4" />
                                <span>Product Type</span>
                            </div>
                            {/* <p className="text-white text-sm">{application.product.productType.replace('_', ' ')}</p> */}
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                <Building2 className="w-4 h-4" />
                                <span>Lender</span>
                            </div>
                            <div className="text-right">
                                <p className="text-white text-sm font-medium">{application.applicationProvider}</p>
                                {/* <p className="text-gray-400 text-xs">{application.lender.lenderType}</p> */}
                            </div>
                        </div>

                        {/* CARD ACTIONS SECTION - Status Badge & Action Buttons */}
                        <div className="space-y-3 pt-4 border-t border-gray-700">
                            {/* Status Badge - Clickable with hover effect */}
                            <div
                                //onClick={onStatusClick}
                                className={`w-full cursor-pointer rounded-lg transition-all duration-200 hover:scale-[1.02] ${STATUS_STYLE[pretty(application.ticketStatus)]} p-3 flex items-center justify-center gap-2`}
                            >
                                {getStatusIcon(application.ticketStatus)}
                                <span className="font-medium">{pretty(application.ticketStatus)}</span>
                            </div>

                            {/* Action Buttons - View, Delete & History */}
                            <div className="grid grid-cols-2 gap-2 ">
                                <Button
                                    onClick={onView}
                                    variant="outline"
                                    size="sm"
                                    className="w-full bg-gray-900/50 border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 hover:border-blue-500/50 transition-all"
                                >
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
                                </Button>

                                {/* <Button
                  onClick={onDelete}
                  variant="outline"
                  size="sm"
                  className="w-full bg-gray-900/50 border-gray-600 text-red-400 hover:text-white hover:bg-red-600/20 hover:border-red-500/50 transition-all"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button> */}

                                <Button
                                    onClick={() => setShowHistory(true)}
                                    variant="outline"
                                    size="sm"
                                    className="w-full bg-gray-900/50 border-gray-600 text-cyan-400 hover:text-white hover:bg-cyan-600/20 hover:border-cyan-500/50 transition-all"
                                >
                                    <Clock className="w-4 h-4 mr-1" />
                                    History
                                </Button>
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
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-700">
                            <h3 className="text-white font-semibold flex items-center gap-2">
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
                                        className="bg-gray-900/50 rounded-lg p-3 border border-gray-700 space-y-2"
                                    >
                                        <p className="text-white text-sm font-medium leading-relaxed">
                                            {history.action}
                                        </p>
                                        {history.comment && (
                                            <p className="text-gray-400 text-xs italic">
                                                💬 {history.comment}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-700/50">
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
                            className="w-full mt-3 bg-gray-900/50 border-gray-600 text-cyan-400 hover:text-white hover:bg-cyan-600/20 hover:border-cyan-500/50 transition-all"
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
    onStatusClick: () => void;
    formatCurrency: (amount: number) => string;
}

const ApplicationTableRow = ({ application, index, onView, onDelete, onStatusClick, formatCurrency }: ApplicationTableRowProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <>
            {/* Main Table Row */}
            <motion.tr
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`border-gray-700 hover:bg-gray-800/50 transition-colors ${isExpanded ? 'bg-gray-800/30' : ''}`}
            >
                <TableCell>
                    <div className="flex items-center gap-2">

                        <p className="text-white font-medium">F2FIN-{application.ticketId}</p>
                    </div>
                </TableCell>
                <TableCell>
                    <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                            <AvatarImage src={application.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="bg-gray-800 text-gray-300 text-xs">
                                {application.customerName.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-white font-medium">{application.customerName}</p>
                            <p className="text-gray-400 text-sm">{application.customerEmail}</p>
                        </div>
                    </div>
                </TableCell>
                <TableCell>
                    <div>
                        <p className="text-white font-medium">{formatCurrency(application.applicationAmount)}</p>
                        {/* <p className="text-gray-400 text-sm">{application.}</p> */}
                    </div>
                </TableCell>
                <TableCell>
                    <div>
                        <p className="text-white font-medium">{application.applicationProvider}</p>
                        {/* <p className="text-white font-medium">{application.lender.lenderType}</p> */}
                    </div>
                </TableCell>
                <TableCell>
                    <Badge
                        // onClick={onStatusClick}
                        className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border",
                            STATUS_STYLE[pretty(application.ticketStatus)]
                        )}
                    >
                        {getStatusIcon(application.ticketStatus)}
                        <span className="capitalize">{pretty(application.ticketStatus)}</span>
                    </Badge>
                </TableCell>
                <TableCell className="text-center">
                    <div className="inline-flex items-center gap-1.5 bg-gray-900/60 border-gray-700 rounded-lg px-2 py-1">

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onView}
                                    className="h-8 w-8 text-blue hover:text-white hover:bg-blue-500/20"
                                >
                                    <Eye className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>View</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="h-8 w-8 text-amber-400 hover:text-white hover:bg-amber-500/20"
                                >
                                    <motion.div
                                        animate={{ rotate: isExpanded ? 90 : 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Clock className="w-4 h-4" />
                                    </motion.div>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>History</TooltipContent>
                        </Tooltip>
                    </div>
                </TableCell>

            </motion.tr>

            {/* Expandable History Row */}
            {isExpanded && (
                <motion.tr
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-gray-700 bg-gray-900/50"
                >
                    <TableCell colSpan={7} className="p-0">
                        <motion.div
                            initial={{ y: -20 }}
                            animate={{ y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="p-6"
                        >
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-700">
                                <Clock className="w-5 h-5 text-cyan-400" />
                                <h3 className="text-white font-semibold text-lg">Work History</h3>
                                <Badge variant="outline" className="ml-2 border-cyan-500/30 text-cyan-400">
                                    {application.workHistory?.length || 0} {application.workHistory?.length === 1 ? 'entry' : 'entries'}
                                </Badge>
                            </div>

                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                {application.workHistory && application.workHistory.length > 0 ? (
                                    <div className="space-y-3">
                                        {application.workHistory.map((history: any, idx: number) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: idx * 0.1 }}
                                                className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-cyan-500/30 transition-colors"
                                            >
                                                <div className="flex items-start gap-3 mb-3">
                                                    <div className="bg-cyan-500/10 rounded-full p-2 mt-0.5">
                                                        <ClipboardList className="w-4 h-4 text-cyan-400" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-white text-sm font-medium leading-relaxed">
                                                            {history.action}
                                                        </p>
                                                        {history.comment && (
                                                            <div className="mt-2 bg-gray-900/50 rounded-md p-3 border-l-2 border-cyan-500/50">
                                                                <p className="text-gray-400 text-xs flex items-start gap-2">
                                                                    <span className="text-cyan-400 mt-0.5">💬</span>
                                                                    <span className="italic">{history.comment}</span>
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-700/50">
                                                    <div className="flex items-center gap-1.5 bg-gray-900/50 rounded-md px-2 py-1">
                                                        <Calendar className="w-3 h-3 text-green-400" />
                                                        <span className="text-gray-400">
                                                            {new Date(history.timestamp).toLocaleString('en-IN', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                                hour12: true
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Clock className="w-16 h-16 text-gray-600 mx-auto mb-3" />
                                        <p className="text-gray-500 text-sm">No work history available</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </TableCell>
                </motion.tr>
            )}
        </>
    );
};

// GRID VIEW COMPONENT
interface ApplicationsGridProps {
    ticketsData: any[];
    isLoading: boolean;
    onView: (app: any) => void;
    onDelete: (id: string) => void;
    onStatusClick: (app: any) => void;
    formatCurrency: (amount: number) => string;
}

const ApplicationsGrid = ({ ticketsData, isLoading, onView, onDelete, onStatusClick, formatCurrency }: ApplicationsGridProps) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <CardSkeleton key={i} headerLines={2} bodyHeight={200} />
                ))}
            </div>
        );
    }

    if (!ticketsData || ticketsData.length === 0) {
        return (
            <div className="text-center py-12">
                <ClipboardList className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No ticketsData found</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ticketsData.map((ticket) => (
                <ApplicationCard
                    key={ticket.ticketId}
                    application={ticket}
                    onView={() => onView(ticket)}
                    onDelete={() => onDelete(ticket.ticketId)}
                    onStatusClick={() => onStatusClick(ticket)}
                    formatCurrency={formatCurrency}
                />
            ))}
        </div>
    );
};

export function TicketsTab() {
    const { user } = useAuth('aggregator_admin')
    const { toast } = useToast()

    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [filterLender, setFilterLender] = useState('')

    const [selectedApplication, setSelectedApplication] = useState<any>(null)
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const tableTopRef = useRef<HTMLDivElement | null>(null)

    // Fetch tickets New (REST + SWR), using f2fintech-admin-server api
    const {
        value: ticketsData,
        swrLoading: isTableLoading
    } = useGetTickets(
        '/get-all-tickets',
        page,
        pageSize,
        searchTerm
    )
    const total = ticketsData?.count || 0

    // Calculate stats from real data
    const stats = useMemo(() => {
        const totalApps = ticketsData?.results;
        const underReview = totalApps?.filter(app => app.ticketStatus === 'under credit review').length || 0
        const approved = totalApps?.filter(app => app.ticketStatus === 'approved').length || 0
        const disbursed = totalApps?.filter(app => app.ticketStatus === 'disbursed').length || 0

        return [
            {
                title: 'Total Tickets',
                value: total.toString(),
                change: '+12%',
                icon: ClipboardList,
                color: 'text-blue'
            },
            {
                title: 'Under Credit Review',
                value: underReview.toString(),
                change: '+5%',
                icon: Clock,
                color: 'text-yellow-400'
            },
            {
                title: 'Approved',
                value: approved.toString(),
                change: '+18%',
                icon: CheckCircle,
                color: 'text-green-400'
            },
            {
                title: 'Disbursed',
                value: disbursed.toString(),
                change: '+22%',
                icon: DollarSign,
                color: 'text-purple-400'
            }
        ]
    }, [ticketsData, total])

    // Client-side filtering for search and lender
    const filteredTickets = useMemo(() => {
        return ticketsData?.results?.filter(ticket => {
            const matchesSearch =
                ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticket.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesStatus =
                !filterStatus ||
                filterStatus === 'all' ||
                pretty(ticket.ticketStatus) === pretty(filterStatus)

            return matchesSearch && matchesStatus
        })
    }, [ticketsData?.results, searchTerm, filterStatus])

    // Reset page when filters change
    useEffect(() => {
        setPage(1)
    }, [searchTerm, filterStatus, filterLender])

    const handlePageChange = async (newPage: number) => {
        setPage(newPage)
        tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }

    const handlePageSizeChange = async (size: number) => {
        setPageSize(size)
        setPage(1)
        tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
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

    const handleStatusClick = (application: any) => {
        setSelectedApplication(application);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            {/* <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold text-white"> Loan Applications </h1>
                    <p className="text-gray-400 mt-1">Manage and track all loan </p>
                </div>

                <Button
                    onClick={() => setIsMultiStepFormOpen(true)}
                    className="bg-gradient-to-r from-blue to-cyan-500 hover:to-blue-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Application
                </Button>
            </motion.div> */}

            {/* Stats Cards */}
            {isTableLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <CardSkeleton headerLines={2} bodyHeight={20} />
                    <CardSkeleton headerLines={2} bodyHeight={20} />
                    <CardSkeleton headerLines={2} bodyHeight={20} />
                    <CardSkeleton headerLines={2} bodyHeight={20} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <Card className="bg-gray-800/50 border-gray-700 hover:border-gold/50 transition-all duration-300 hover:shadow-lg hover:shadow-gold/10">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-400">{stat.title}</p>
                                            <p className="text-2xl font-bold text-white mt-2">{stat.value}</p>
                                            <p className="text-green-400 text-sm mt-1">{stat.change} from last month</p>
                                        </div>
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-gray-900/50 ${stat.color}`}>
                                            <stat.icon className="w-6 h-6" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4"
            >
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        placeholder="Search ticketsData..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-gray-900/50 border-gray-800 text-white"
                    />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40 bg-gray-900/50 border-gray-800 text-white">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700 text-white">
                        {Object.values(ApplicationStatus).map((status) => {
                            const key = pretty(status);
                            return (
                                <SelectItem key={status} value={status}>
                                    <div className="flex items-center gap-2">
                                        {/* Dot */}
                                        <span
                                            className="w-3 h-3 rounded-full inline-block"
                                            style={{
                                                backgroundColor: STATUS_STYLE[key]?.split(" ")[0]?.replace("bg-", "").replace("/20", "")
                                            }}
                                        />
                                        {/* Icon */}
                                        {STATUS_META[key]?.icon}
                                        {/* Label */}
                                        {key}
                                    </div>
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
                {/* <Select value={filterLender} onValueChange={setFilterLender}>
                    <SelectTrigger className="w-40 bg-gray-900/50 border-gray-800 text-white">
                        <SelectValue placeholder="All Lenders" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Lenders</SelectItem>
                        {ticketsData?.results?.map((app, idx) => (
                            <SelectItem key={idx} value={app.applicationProvider}>{app.applicationProvider}</SelectItem>
                        ))}
                    </SelectContent>
                </Select> */}
            </motion.div>

            {/* Tickets Table/Grid with View Toggle */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
            >
                <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className={`h-12 rounded-lg flex items-center justify-center bg-gray-900/50 text-blue`}>
                                <ClipboardList className="w-6 h-6 mr-3" />
                                <div>
                                    <CardTitle className="text-white mb-1">Tickets Overview</CardTitle>
                                    <CardDescription className="text-gray-400">
                                        Track and manage all loan tickets
                                    </CardDescription>
                                </div>
                            </div>
                            {/* VIEW TOGGLE BUTTONS */}
                            <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-1">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant={viewMode === 'table' ? 'default' : 'ghost'}
                                            size="sm"
                                            onClick={() => setViewMode('table')}
                                            className={`${viewMode === 'table'
                                                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
                                                : 'text-gray-400 hover:text-white'
                                                }`}
                                        >
                                            <List className="w-4 h-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Table View</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                                            size="sm"
                                            onClick={() => setViewMode('grid')}
                                            className={`${viewMode === 'grid'
                                                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
                                                : 'text-gray-400 hover:text-white'
                                                }`}
                                        >
                                            <LayoutGrid className="w-4 h-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Grid View</TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <div ref={tableTopRef} />
                        {/* CONDITIONAL RENDERING: TABLE OR GRID */}
                        {viewMode === 'table' ? (
                            <div className="overflow-x-auto">
                                {isTableLoading ? (
                                    <TableSkeleton columns={6} rows={pageSize} />
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-gray-700">
                                                <TableHead className="text-gray-300">Ticket ID</TableHead>
                                                <TableHead className="text-gray-300">Customer</TableHead>
                                                <TableHead className="text-gray-300">Loan Amount</TableHead>
                                                <TableHead className="text-gray-300">Lender</TableHead>
                                                <TableHead className="text-gray-300">Status</TableHead>
                                                <TableHead className="text-gray-300 text-center">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredTickets?.map((ticket, index) => (
                                                <ApplicationTableRow
                                                    key={ticket.ticketId}
                                                    application={ticket}
                                                    index={index}
                                                    onView={() => {
                                                        setSelectedApplication(ticket)
                                                        setIsViewDialogOpen(true)
                                                    }}
                                                    onDelete={() => handleDelete(ticket.ticketId)}
                                                    onStatusClick={() => handleStatusClick(ticket)}
                                                    formatCurrency={formatCurrency}
                                                />
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>
                        ) : (
                            // GRID VIEW
                            <ApplicationsGrid
                                ticketsData={filteredTickets || []}
                                isLoading={isTableLoading}
                                onView={(ticket) => {
                                    setSelectedApplication(ticket);
                                    setIsViewDialogOpen(true);
                                }}
                                onDelete={handleDelete}
                                onStatusClick={handleStatusClick}
                                formatCurrency={formatCurrency}
                            />
                        )}
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
            </motion.div>

            {/* View Application Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="bg-gradient-to-br from-gray-900 to-black border-gray-700 text-white max-w-3xl rounded-xl shadow-2xl">
                    {selectedApplication && (
                        <>
                            <DialogHeader>
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        {/* <DialogTitle className="text-2xl font-bold text-white bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                      {selectedApplication.product.name}
                    </DialogTitle> */}
                                        <DialogDescription className="text-gray-400 pt-1">
                                            Detailed overview of the loan product from <span className="font-semibold text-cyan-300">{selectedApplication.applicationProvider}</span>
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsViewDialogOpen(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                            <Badge className={`mt-1 flex items-center gap-1 ${STATUS_STYLE[pretty(selectedApplication.ticketStatus)]}`}>
                                {getStatusIcon(selectedApplication.ticketStatus)}
                                {pretty(selectedApplication.ticketStatus)}
                            </Badge>

                            <div className="py-4 space-y-6">
                                {/* Key Details */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                    <InfoItem icon={User} color="text-yellow-400" label="Customer" value={selectedApplication.customerName} />
                                    <InfoItem icon={DollarSign} color="text-green-400" label="Loan Amount" value={formatCurrency(selectedApplication.applicationAmount)} />
                                    <InfoItem icon={Landmark} color="text-blue" label="Lender" value={selectedApplication.applicationProvider} />
                                    {/* <InfoItem icon={Calendar} color="text-purple-400" label="Last Updated" value={new Date(selectedApplication.updatedAt).toLocaleDateString()} /> */}
                                </div>

                                {/* Loan & Commission */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-800">
                                    {/* <div className="space-y-4">
                                        <h3 className="font-semibold text-lg text-cyan-300 mb-2 flex items-center gap-2"><DollarSign className="w-5 h-5" />Application Details</h3>
                                        <InfoLine icon={ClipboardList} color="text-yellow-400" label="Product Name" value={selectedApplication.product.name} />
                                        <InfoLine icon={ClipboardList} color="text-blue" label="Loan Type" value={selectedApplication.product.productType.replace('_', ' ')} />
                                         <InfoLine icon={Percent} color="text-green-400" label="Commission" value={`${selectedApplication.product.commissionPercent}%`} />
                    <InfoLine icon={Percent} color="text-purple-400" label="Processing Fee" value={`${selectedApplication.product.processingFeePercent}%`} />
                                    </div> */}

                                    {/* Customer & Documents */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg text-cyan-300 mb-2 flex items-center gap-2"><Contact2Icon className="w-5 h-5" />Contact & Documents</h3>
                                        <InfoLine icon={Mail} color="text-blue" label="Email" value={selectedApplication.customerEmail} />
                                        <InfoLine icon={Phone} color="text-green-400" label="Phone" value={selectedApplication.customerContact} />
                                        <div className="pt-2">
                                            <h4 className="font-semibold text-cyan-300 mb-2 flex items-center gap-2"><ClipboardList className="w-5 h-5" />Documents</h4>
                                            {(selectedApplication.documents || []).length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedApplication.documents.map((doc: string, index: number) => (
                                                        <Badge key={index} variant="outline" className="border-gray-600 text-gray-300">{doc}</Badge>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 italic">No documents submitted.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
