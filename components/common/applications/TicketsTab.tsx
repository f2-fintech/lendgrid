'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
    Search, ClipboardList, Eye, Trash2, Clock, CheckCircle, AlertCircle, Phone, Mail,
    Calendar, Building2, User, X,
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
    ArrowRight,
    IndianRupee,
    FileText,
    TrendingUp,
    MapPin
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

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { CardSkeleton, TableSkeleton } from '@/components/ui/loading-skeleton'
import { TablePagination } from '@/components/ui/pagination'
import { useAuth } from '@/lib/auth'
import { ApplicationStatus } from '@/lib'
import { cn, decodeJwt, formatDateIndian, getCookie } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useGetTickets } from '@/hooks/use-tickets-rest'
import { TicketHistoryData, useGetTicketHistory } from '@/hooks/use-ticket-histories-rest'
import { FilterPanel } from '../FilterPanel'
import { DateRange } from 'react-day-picker'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { apiFetch } from '@/lib/http-client'

export const pretty = (v: string) => v?.toLowerCase()?.replace(/_/g, " ");

export const STATUS_STYLE: Record<string, string> = {
    "under credit review": "bg-amber-500/20 text-amber-300 border-amber-500/30",
    operations: "bg-sky-600/20 text-sky-400 border-sky-500/40",
    "pendency in file": "bg-red-500/20 text-red-300 border-red-500/30",
    "file send to banker": "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    hold: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    "to be approved": "bg-green-500/20 text-green-300 border-green-500/30",
    "to be disbursed": "bg-purple-500/20 text-purple-300 border-purple-500/30",
    approved: "bg-lime-500/20 text-lime-300 border-lime-500/30",
    disbursed: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    rejected: "bg-red-600/20 text-red-400 border-red-600/30",
    drop: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    submitted: "bg-blue-500/20 text-blue-400 border-blue-500/30"
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
            <p className="text-sm  text-muted-foreground">{label}</p>
            <p className="font-semibold  text-foreground">{value}</p>
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
    isOmsEnabled: boolean;
}

const ApplicationCard = ({ application, onView, onDelete, onStatusClick, formatCurrency, isOmsEnabled }: ApplicationCardProps) => {
    // State to toggle between details and history
    const [showHistory, setShowHistory] = useState(false);

    // Fetch ticket history only when history view is active
    const {
        value: ticketHistory,
        swrLoading: historyLoading,
        error: historyError
    } = useGetTicketHistory(
        application.ticketId,
        showHistory // Only fetch when history is shown
    );

    // Capitalize first letter utility
    const capitalizeFirstLetter = (text: string) => {
        if (!text) return '';
        // Remove HTML tags
        const cleanText = text.replace(/<\/?[^>]+(>|$)/g, '');
        return cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
    };

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
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Ticket ID</p>
                        <p className=" text-foreground font-bold text-lg">F2FIN-{application.ticketId}</p>
                    </div>
                </div>

                {/* Customer Info */}
                <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-border">
                    <Avatar className="w-12 h-12">
                        <AvatarImage src={application.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-card  text-foreground">
                            {application.customerName.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className=" text-foreground font-semibold truncate">{application.customerName}</p>
                        <p className=" text-muted-foreground text-sm truncate">{application.customerEmail}</p>
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
                            <div className="flex items-center gap-2  text-muted-foreground text-sm">
                                <IndianRupee className="w-4 h-4" />
                                <span>Loan Amount</span>
                            </div>
                            <p className=" text-foreground font-bold">{formatCurrency(application.applicationAmount)}</p>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2  text-muted-foreground text-sm">
                                <FileText className="w-4 h-4" />
                                <span>Product Type</span>
                            </div>
                            <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                                {application.loanCategory || 'N/A'}
                            </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2  text-muted-foreground text-sm">
                                <Phone className="w-4 h-4" />
                                <span>Contact</span>
                            </div>
                            <p className=" text-foreground text-sm font-medium">{application.customerContact || 'N/A'}</p>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2  text-muted-foreground text-sm">
                                <Building2 className="w-4 h-4" />
                                <span>Lender</span>
                            </div>
                            <div className="text-right">
                                <p className=" text-foreground text-sm font-medium">{application.applicationProvider}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2  text-muted-foreground text-sm">
                                <MapPin className="w-4 h-4" />
                                <span>Location</span>
                            </div>
                            <div className="text-right">
                                <p className=" text-foreground text-sm font-medium truncate max-w-[180px]" title={`${application.customerLocation}, ${application.customerState}`}>
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
                                        onClick={isOmsEnabled ? undefined : onStatusClick}
                                        className={`w-full ${isOmsEnabled ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'} rounded-lg transition-all duration-200 ${!isOmsEnabled && 'hover:scale-[1.01]'} ${STATUS_STYLE[pretty(application.ticketStatus)]} p-3 flex items-center justify-center gap-2`}
                                    >
                                        {getStatusIcon(application.ticketStatus)}
                                        <span className="capitalize font-semibold text-sm">{pretty(application.ticketStatus)}</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {isOmsEnabled ? "Status managed by OMS" : "Click to change status"}
                                </TooltipContent>
                            </Tooltip>

                            {/* Action Buttons - 50/50 Split */}
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    onClick={onView}
                                    variant="outline"
                                    size="sm"
                                    className="w-full bg-background/50 border-border text-foreground hover:text-foreground hover:bg-blue-500/10 hover:border-blue-500/50 transition-all"
                                >
                                    <Eye className="w-4 h-4 mr-1.5" />
                                    View
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

                                <Button
                                    onClick={() => setShowHistory(true)}
                                    variant="outline"
                                    size="sm"
                                    className="w-full bg-background/50 border-border text-cyan-400 hover:text-foreground hover:bg-cyan-600/10 hover:border-cyan-500/50 transition-all"
                                >
                                    <Clock className="w-4 h-4 mr-1.5" />
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
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-border">
                            <h3 className=" text-foreground font-semibold flex items-center gap-2">
                                <Clock className="w-5 h-5 text-cyan-400" />
                                Work History
                            </h3>
                        </div>

                        {/* History List - Scrollable */}
                        <div className="space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                            {historyLoading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
                                    <p className="text-gray-500 text-sm mt-2">Loading history...</p>
                                </div>
                            ) : historyError ? (
                                <div className="text-center py-8">
                                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                                    <p className="text-red-400 text-sm">Failed to load history</p>
                                </div>
                            ) : ticketHistory && ticketHistory.length > 0 ? (
                                ticketHistory.map((history: TicketHistoryData) => (
                                    <div
                                        key={history.id}
                                        className="bg-background/50 rounded-lg p-3 border border-border space-y-2"
                                    >
                                        <p className=" text-foreground text-sm font-medium leading-relaxed">
                                            {capitalizeFirstLetter(history.action || '')}
                                        </p>
                                        <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-border/50">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {formatDateIndian(history.created_at)}
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
    onStatusClick: () => void;
    formatCurrency: (amount: number) => string;
    isOmsEnabled: boolean;
}

const ApplicationTableRow = ({ application, index, onView, onDelete, onStatusClick, formatCurrency, isOmsEnabled }: ApplicationTableRowProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Fetch ticket history only when expanded
    const {
        value: ticketHistory,
        swrLoading: historyLoading,
        error: historyError
    } = useGetTicketHistory(
        application.ticketId,
        isExpanded // Only fetch when expanded
    );

    // Capitalize first letter utility
    const capitalizeFirstLetter = (text: string) => {
        if (!text) return '';
        const cleanText = text.replace(/<\/?[^>]+(>|$)/g, '');
        return cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
    };

    return (
        <>
            {/* Main Table Row */}
            <motion.tr
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`border-border hover:bg-card/50 transition-colors ${isExpanded ? 'bg-card/30' : ''}`}
            >
                <TableCell>
                    <div className="flex items-center gap-2">
                        <p className="font-medium">F2FIN-{application.ticketId}</p>
                    </div>
                </TableCell>
                <TableCell>
                    <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                            <AvatarImage src={application.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="bg-card text-foreground text-xs">
                                {application.customerName.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className=" text-foreground font-medium">{application.customerName}</p>
                            <p className=" text-muted-foreground text-sm">{application.customerEmail}</p>
                        </div>
                    </div>
                </TableCell>
                <TableCell>
                    <div>
                        <p className=" text-foreground font-medium">{formatCurrency(application.applicationAmount)}</p>
                    </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                    <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                        <FileText className="w-3 h-3 mr-1" />
                        {application.loanCategory || 'N/A'}
                    </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        <span className="text-foreground">{application.customerContact || 'N/A'}</span>
                    </div>
                </TableCell>
                <TableCell>
                    <div>
                        <p className=" text-foreground font-medium">{application.applicationProvider}</p>
                    </div>
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                    <div className="flex items-center gap-1.5 text-sm truncate max-w-[150px]" title={`${application.customerLocation}, ${application.customerState}`}>
                        <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="truncate text-foreground">{application.customerLocation}, {application.customerState}</span>
                    </div>
                </TableCell>
                <TableCell>
                    <Tooltip>
                        <TooltipTrigger>
                            <Badge
                                onClick={isOmsEnabled ? undefined : onStatusClick}
                                className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border",
                                    STATUS_STYLE[pretty(application.ticketStatus)],
                                    isOmsEnabled ? "cursor-not-allowed opacity-80" : "cursor-pointer"
                                )}
                            >
                                {getStatusIcon(application.ticketStatus)}
                                <span className="capitalize">{pretty(application.ticketStatus)}</span>
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            {isOmsEnabled ? "Status managed by OMS" : "Click here to change status"}
                        </TooltipContent>
                    </Tooltip>
                </TableCell>
                <TableCell className="text-center">
                    <div className="inline-flex items-center gap-1.5 bg-background/60 border-border rounded-lg px-2 py-1">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onView}
                                    className="h-8 w-8 text-blue hover: text-foreground hover:bg-blue-500/20"
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
                                    className="h-8 w-8 text-amber-400 hover: text-foreground hover:bg-amber-500/20"
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
                    className="border-border bg-background/50"
                >
                    <TableCell colSpan={10} className="p-0">
                        <motion.div
                            initial={{ y: -20 }}
                            animate={{ y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="p-6"
                        >
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                                <Clock className="w-5 h-5 text-cyan-400" />
                                <h3 className=" text-foreground font-semibold text-lg">Work History</h3>
                                <Badge variant="outline" className="ml-2 border-cyan-500/30 text-cyan-400">
                                    {ticketHistory?.length || 0} {ticketHistory?.length === 1 ? 'entry' : 'entries'}
                                </Badge>
                            </div>

                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                {historyLoading ? (
                                    <div className="text-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
                                        <p className="text-gray-500 text-sm mt-3">Loading history...</p>
                                    </div>
                                ) : historyError ? (
                                    <div className="text-center py-12">
                                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-3" />
                                        <p className="text-red-400 text-sm">Failed to load history</p>
                                        <p className="text-gray-500 text-xs mt-1">Please try again later</p>
                                    </div>
                                ) : ticketHistory && ticketHistory.length > 0 ? (
                                    <div className="space-y-3">
                                        {ticketHistory.map((history: TicketHistoryData, idx: number) => (
                                            <motion.div
                                                key={history.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: idx * 0.1 }}
                                                className="bg-card/50 rounded-lg p-4 border border-border hover:border-cyan-500/30 transition-colors"
                                            >
                                                <div className="flex items-start gap-3 mb-3">
                                                    <div className="bg-cyan-500/10 rounded-full p-2 mt-0.5">
                                                        <ClipboardList className="w-4 h-4 text-cyan-400" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className=" text-foreground text-sm font-medium leading-relaxed">
                                                            {capitalizeFirstLetter(history.action || '')}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-border/50">
                                                    <div className="flex items-center gap-1.5 bg-background/50 rounded-md px-2 py-1">
                                                        <Calendar className="w-3 h-3 text-green-400" />
                                                        <span className=" text-muted-foreground">
                                                            {formatDateIndian(history.created_at)}
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
    onDelete: (id: number) => void;
    onStatusClick: (app: any) => void;
    formatCurrency: (amount: number) => string;
    isOmsEnabled: boolean;
}

const ApplicationsGrid = ({ ticketsData, isLoading, onView, onDelete, onStatusClick, formatCurrency, isOmsEnabled }: ApplicationsGridProps) => {
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
                <p className=" text-muted-foreground text-lg">No ticketsData found</p>
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
                    isOmsEnabled={isOmsEnabled}
                />
            ))}
        </div>
    );
};

export function TicketsTab() {
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [filterLender, setFilterLender] = useState('')
    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [isExporting, setIsExporting] = useState(false)

    const [selectedApplication, setSelectedApplication] = useState<any>(null)
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const tableTopRef = useRef<HTMLDivElement | null>(null)

    // For status update popup
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
    const [statusComment, setStatusComment] = useState("");
    const [oldStatus, setOldStatus] = useState("");
    const [newStatus, setNewStatus] = useState("");
    const [approvedAmount, setApprovedAmount] = useState<number | undefined>();
    const [disbursedAmount, setDisbursedAmount] = useState<number | undefined>();
    const [approvedDate, setApprovedDate] = useState<string | undefined>();
    const [disbursedDate, setDisbursedDate] = useState<string | undefined>();

    const { user } = useAuth(['aggregator_admin', 'aggregator_member', 'lendgrid_sales'])
    const { toast } = useToast()
    const token = getCookie("lendgrid_cookie")
    const decoded = decodeJwt(token)
    const isOmsEnabled = decoded?.isOmsEnabled ?? true

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

    // Fetch tickets New (REST + SWR), using f2fintech-admin-server api
    const {
        value: ticketsData,
        swrLoading: isTableLoading,
        refetch
    } = useGetTickets(
        '/get-all-tickets',
        page,
        pageSize,
        searchTerm,
        dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd HH:mm:ss') : null,
        dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd HH:mm:ss') : null,
        companyIdOverride || undefined,
        decoded?.source === 'oms' && decoded?.role === 'sales' ? decoded?.id : undefined,
        filterStatus,
        filterLender
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
                // change: '+12%',
                icon: ClipboardList,
                color: 'text-blue'
            },
            {
                title: 'Under Credit Review',
                value: underReview.toString(),
                // change: '+5%',
                icon: Clock,
                color: 'text-yellow-400'
            },
            {
                title: 'Approved',
                value: approved.toString(),
                // change: '+18%',
                icon: CheckCircle,
                color: 'text-green-400'
            },
            {
                title: 'Disbursed',
                value: disbursed.toString(),
                // change: '+22%',
                icon: IndianRupee,
                color: 'text-purple-400'
            }
        ]
    }, [ticketsData, total])

    // Client-side filtering is no longer strictly needed if the API handles it all, but we keep it
    // if backend search does not cover all fields, however we rely on backend pagination so client filtering
    // shouldn't filter out things unless we know what we are doing.
    const filteredTickets = ticketsData?.results || [];

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

    const handleExportToExcel = async () => {
        try {
            setIsExporting(true);

            // Construct export URL
            const params = new URLSearchParams();
            params.set("page", "1");
            params.set("limit", "10000"); // fetch all

            if (searchTerm) params.set("name", searchTerm);
            if (dateRange?.from) params.set("startDate", format(dateRange.from, 'yyyy-MM-dd HH:mm:ss'));
            if (dateRange?.to) params.set("endDate", format(dateRange.to, 'yyyy-MM-dd HH:mm:ss'));
            if (companyIdOverride) params.set("companyId", companyIdOverride);

            // if sales user
            if (decoded?.source === 'oms' && decoded?.role === 'sales') {
                params.set("appliedBy", "sales");
            }

            if (filterStatus && filterStatus !== 'all') params.set("status", filterStatus);
            if (filterLender && filterLender !== 'all') params.set("provider", filterLender);

            const pathKey = `/get-all-tickets${decoded?.source === 'oms' && decoded?.role === 'sales' && decoded?.id ? `/${decoded.id}` : ''}`;
            const finalEndpoint = `${pathKey}?${params.toString()}`;

            const response = await apiFetch(finalEndpoint);
            const exportData = response.data?.results;

            if (!exportData || exportData.length === 0) {
                toast({
                    title: "Export Failed",
                    description: "No tickets found to export.",
                    variant: "destructive"
                });
                return;
            }

            // Report period formatting
            let reportPeriod = "All Time";
            const currentDate = new Date();
            const currentMonth = format(currentDate, "MMMM");
            const currentYear = format(currentDate, "yyyy");

            if (dateRange?.from && dateRange?.to) {
                reportPeriod = `${format(dateRange.from, "MM/dd/yyyy")} to ${format(dateRange.to, "MM/dd/yyyy")}`;
            } else if (dateRange?.from) {
                reportPeriod = `From ${format(dateRange.from, "MM/dd/yyyy")} to ${format(currentDate, "MM/dd/yyyy")}`;
            } else if (dateRange?.to) {
                reportPeriod = `All records until ${format(dateRange.to, "MM/dd/yyyy")}`;
            } else {
                reportPeriod = `All records of ${currentMonth} ${currentYear} until ${format(currentDate, "MM/dd/yyyy")}`;
            }

            // Format data
            const formattedData = exportData.map((t: any, index: number) => ({
                "S.No": index + 1,
                "Ticket ID": t?.ticketId || "-",
                Name: t?.customerName || "-",
                Email: t?.customerEmail || "-",
                Amount: t?.applicationAmount || "-",
                Provider: t?.applicationProvider || "-",
                Tenure: t?.applicationTenure ? `${t.applicationTenure} ${t.applicationTenure > 1 ? "Years" : "Year"}` : "-",
                Status: t?.ticketStatus || "-",
                Location: `${t?.customerLocation || "-"}, ${t?.customerState || "-"}`,
                "Created At": t?.createdAt ? format(new Date(t.createdAt), "MM/dd/yyyy") : "-",
            }));

            // Excel building
            const worksheet = XLSX.utils.json_to_sheet(formattedData);

            // Add metadata
            const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
            const nextRow = range.e.r + 2;
            const userName = user?.name || decoded?.username || "Unknown User";
            const userRole = user?.role || decoded?.role || "Unknown Role";

            XLSX.utils.sheet_add_aoa(
                worksheet,
                [
                    [],
                    [],
                    [],
                    ["Report Generated By:", userName],
                    ["User Role:", userRole],
                    ["Report Period:", reportPeriod],
                    [
                        "Filters Applied:",
                        `Status: ${filterStatus || 'all'} , Provider: ${filterLender || 'all'}${searchTerm ? `, Search: ${searchTerm}` : ""}`
                    ],
                    ["Generated On:", format(new Date(), "MM/dd/yyyy hh:mm a")],
                    ["Total Records:", exportData.length]
                ],
                { origin: `A${nextRow}` }
            );

            // Update range
            const updatedRange = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
            updatedRange.e.r += 9;
            worksheet["!ref"] = XLSX.utils.encode_range(updatedRange);

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");

            XLSX.writeFile(workbook, `Tickets_${userRole}_${userName.replace(/\s+/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
        } catch (error) {
            console.error("Export error:", error);
            toast({
                title: "Export Failed",
                description: "There was an error generating the Excel file.",
                variant: "destructive"
            });
        } finally {
            setIsExporting(false);
        }
    };

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

    const handleStatusUpdate = async () => {
        try {
            if (!selectedApplication) return;

            const payload: any = {
                id: selectedApplication.tickedId,
                status: newStatus,
                // action: `${user?.username} changed Application Status from ${pretty(oldStatus)} to ${pretty(newStatus)}`,
                // comment: statusComment
            };

            if (newStatus === ApplicationStatus.APPROVED) {
                payload.approved_amount = approvedAmount;
                payload.approved_at = approvedDate ? new Date(approvedDate) : undefined;
            }
            if (newStatus === ApplicationStatus.DISBURSED) {
                payload.disbursed_amount = disbursedAmount;
                payload.disbursed_at = disbursedDate ? new Date(disbursedDate) : undefined;
            }
            console.log(payload, 'this is paylod of disburse')
            // Create ticket only if OMS is NOT enabled
            await fetch(`${process.env.NEXT_PUBLIC_ADMIN_URL}/update-ticket/${selectedApplication.ticketId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'companyid': selectedApplication.companyId,
                },
                body: JSON.stringify(payload),
            });

            toast({
                title: "Status Updated",
                description: "Application status updated successfully."
            });

            setIsStatusDialogOpen(false);
            refetch();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update status",
                variant: "destructive"
            });
        }
    };

    const handleStatusClick = (application: any) => {
        setSelectedApplication(application);
        setOldStatus(application.ticketStatus);
        setNewStatus(application.ticketStatus);
        setStatusComment("");
        setApprovedAmount(application.approvedAmount);
        setDisbursedAmount(application.disbursedAmount);
        setApprovedDate(application.approvedAt ? new Date(application.approvedAt).toISOString().split('T')[0] : undefined);
        setDisbursedDate(application.disbursedAt ? new Date(application.disbursedAt).toISOString().split('T')[0] : undefined);
        setIsStatusDialogOpen(true);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-6" ref={tableTopRef}>
                <div className="flex justify-between items-center bg-card/50 p-4 border border-border rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <ClipboardList className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">Tickets Overview</h2>
                            <p className="text-sm text-muted-foreground">Track and manage all loan tickets</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 p-1 bg-background/50 border border-border rounded-lg">
                        <Button
                            variant={viewMode === 'table' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('table')}
                            className={viewMode === 'table' ? "bg-blue-600 text-white hover:bg-blue-700" : "text-muted-foreground"}
                        >
                            <List className="w-4 h-4 mr-1.5" /> Table
                        </Button>
                        <Button
                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className={viewMode === 'grid' ? "bg-blue-600 text-white hover:bg-blue-700" : "text-muted-foreground"}
                        >
                            <LayoutGrid className="w-4 h-4 mr-1.5" /> Grid
                        </Button>
                    </div>
                </div>

                <FilterPanel
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder="Search tickets..."
                    status={filterStatus}
                    onStatusChange={setFilterStatus}
                    statusOptions={[
                        { label: "Under Credit Review", value: "under credit review" },
                        { label: "Operations", value: "operations" },
                        { label: "Pendency in File", value: "pendency in file" },
                        { label: "File Send to Banker", value: "file send to banker" },
                        { label: "Hold", value: "hold" },
                        { label: "To Be Approved", value: "to be approved" },
                        { label: "To Be Disbursed", value: "to be disbursed" },
                        { label: "Approved", value: "approved" },
                        { label: "Disbursed", value: "disbursed" },
                        { label: "Carry Forward", value: "carry forward" },
                        { label: "Drop", value: "drop" },
                        { label: "Rejected", value: "rejected" }
                    ]}
                    provider={filterLender}
                    onProviderChange={setFilterLender}
                    providerOptions={[
                        { label: "ABFL", value: "abfl" },
                        { label: "Axis", value: "axis" },
                        { label: "Bajaj Finance", value: "bajaj finance" },
                        { label: "Bajaj Market", value: "bajaj market" },
                        { label: "Bank of Baroda", value: "bank of baroda" },
                        { label: "BOI", value: "boi" },
                        { label: "Canara Bank", value: "canara bank" },
                        { label: "Cholamandalam", value: "cholamandalam" },
                        { label: "Credit Saison", value: "credit saison" },
                        { label: "Deutsche Bank", value: "deutsche bank" },
                        { label: "Godrej", value: "godrej" },
                        { label: "HDFC", value: "hdfc" },
                        { label: "HSBC Bank", value: "hsbc bank" },
                        { label: "ICICI", value: "icici" },
                        { label: "IDFC", value: "idfc" },
                        { label: "Indusind", value: "indusind" },
                        { label: "Incred", value: "incred" },
                        { label: "Kotak Bank", value: "kotak bank" },
                        { label: "L&T", value: "l&t" },
                        { label: "Lending Kart", value: "lending kart" },
                        { label: "Paysense", value: "paysense" },
                        { label: "PNB", value: "pnb" },
                        { label: "Poonawala", value: "poonawala" },
                        { label: "SBI", value: "sbi" },
                        { label: "Shriram", value: "shriram" },
                        { label: "SMFG", value: "smfg" },
                        { label: "Standard Chartered Bank", value: "standard chartered bank" },
                        { label: "Tata", value: "tata" },
                        { label: "YES Bank", value: "yes bank" }
                    ]}
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    onExport={handleExportToExcel}
                    isExporting={isExporting}
                />

                <Card className="border-border bg-card/50">
                    <CardContent className="p-0">
                        {/* CONDITIONAL RENDERING: TABLE OR GRID */}
                        {viewMode === 'table' ? (
                            <div className="overflow-x-auto professional-table">
                                {isTableLoading ? (
                                    <TableSkeleton columns={6} rows={pageSize} />
                                ) : (
                                    <Table>
                                        <TableHeader className="bg-muted border-b-2 border-border">
                                            <TableRow>
                                                <TableHead>Ticket ID</TableHead>
                                                <TableHead>Customer</TableHead>
                                                <TableHead>Loan Amount</TableHead>
                                                <TableHead className="hidden lg:table-cell">Product Type</TableHead>
                                                <TableHead className="hidden md:table-cell">Contact</TableHead>
                                                <TableHead>Lender</TableHead>
                                                <TableHead className="hidden xl:table-cell">Location</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-center">Actions</TableHead>
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
                                                    isOmsEnabled={isOmsEnabled}
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
                                isOmsEnabled={isOmsEnabled}
                            />
                        )}
                        <TablePagination
                            page={page}
                            pageSize={pageSize}
                            total={total}
                            onPageChange={handlePageChange}
                            onPageSizeChange={handlePageSizeChange}
                            className="p-4"
                        />
                    </CardContent>
                </Card>
            </div>

            {/* View Ticket Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent
                    className="bg-background border border-border text-foreground max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
                    onInteractOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                >
                    <DialogHeader className="border-b border-border/50 pb-4 flex justify-between items-center">
                        <div>
                            <DialogTitle className="text-2xl font-bold text-foreground">
                                Ticket Details
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground text-sm">
                                Complete information about this ticket
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

                    {selectedApplication && (
                        <div className="space-y-6 pt-4">
                            {/* Status and Ticket ID Section */}
                            <div className="flex gap-3 justify-between items-start flex-wrap">
                                <div className="flex flex-wrap gap-2">
                                    <Badge
                                        className={`${STATUS_STYLE[pretty(selectedApplication.ticketStatus)]} border px-4 py-1.5 text-sm font-semibold`}
                                    >
                                        {pretty(selectedApplication.ticketStatus)}
                                    </Badge>
                                    <Badge className="bg-primary/20 text-primary border border-primary/30 px-4 py-1.5 text-sm font-semibold">
                                        Ticket #F2FIN-{selectedApplication.ticketId}
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
                                        <p className="text-xs text-muted-foreground mb-2">Application Amount</p>
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

                            {/* Approval & Disbursement Details Card */}
                            {(selectedApplication.approvedAmount || selectedApplication.disbursedAmount || selectedApplication.approvedAt || selectedApplication.disbursedAt) && (
                                <div className="bg-card/50 rounded-lg p-6 border border-border backdrop-blur-sm">
                                    <h3 className="text-lg font-semibold mb-4 text-emerald-400 flex items-center gap-2">
                                        <BadgeCheck className="w-5 h-5" />
                                        Approval & Disbursement Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {selectedApplication.approvedAt && (
                                            <div className="flex items-start gap-3">
                                                <div className="bg-green-500/10 p-2 rounded-lg mt-1">
                                                    <Calendar className="w-4 h-4 text-green-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs text-muted-foreground mb-1">Approved Date</p>
                                                    <p className="text-foreground font-semibold">
                                                        {new Date(selectedApplication.approvedAt).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {selectedApplication.approvedAmount && (
                                            <div className="flex items-start gap-3">
                                                <div className="bg-lime-500/10 p-2 rounded-lg mt-1">
                                                    <IndianRupee className="w-4 h-4 text-lime-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs text-muted-foreground mb-1">Approved Amount</p>
                                                    <p className="text-foreground font-semibold">{formatCurrency(selectedApplication.approvedAmount)}</p>
                                                </div>
                                            </div>
                                        )}

                                        {selectedApplication.approvedCashbackAmount && (
                                            <div className="flex items-start gap-3">
                                                <div className="bg-yellow-500/10 p-2 rounded-lg mt-1">
                                                    <TrendingUp className="w-4 h-4 text-yellow-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs text-muted-foreground mb-1">Approved Cashback</p>
                                                    <p className="text-foreground font-semibold">{formatCurrency(selectedApplication.approvedCashbackAmount)}</p>
                                                </div>
                                            </div>
                                        )}

                                        {selectedApplication.disbursedAt && (
                                            <div className="flex items-start gap-3">
                                                <div className="bg-cyan-500/10 p-2 rounded-lg mt-1">
                                                    <Calendar className="w-4 h-4 text-cyan-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs text-muted-foreground mb-1">Disbursed Date</p>
                                                    <p className="text-foreground font-semibold">
                                                        {new Date(selectedApplication.disbursedAt).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {selectedApplication.disbursedAmount && (
                                            <div className="flex items-start gap-3">
                                                <div className="bg-emerald-500/10 p-2 rounded-lg mt-1">
                                                    <IndianRupee className="w-4 h-4 text-emerald-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs text-muted-foreground mb-1">Disbursed Amount</p>
                                                    <p className="text-foreground font-semibold">{formatCurrency(selectedApplication.disbursedAmount)}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Ticket Timeline Card */}
                            <div className="bg-card/50 rounded-lg p-6 border border-border backdrop-blur-sm">
                                <h3 className="text-lg font-semibold mb-4 text-cyan-400 flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    Ticket Timeline
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 bg-muted/50 p-4 rounded-lg border border-border">
                                        <Calendar className="w-5 h-5 text-primary" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Created At</p>
                                            <p className="text-foreground font-semibold text-sm">
                                                {new Date(selectedApplication.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 bg-background/50 p-4 rounded-lg border border-border/30">
                                        <Calendar className="w-5 h-5 text-green-400" />
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
                                        <BadgeCheck className="w-5 h-5 text-amber-400" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Ticket Status</p>
                                            <p className="text-foreground font-semibold text-sm capitalize">
                                                {pretty(selectedApplication.ticketStatus)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 bg-background/50 p-4 rounded-lg border border-border/30">
                                        <FileText className="w-5 h-5 text-purple-400" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Loan Status</p>
                                            <p className="text-foreground font-semibold text-sm capitalize">
                                                {pretty(selectedApplication.loanStatus)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* System Information Card */}
                            <div className="bg-card/50 rounded-lg p-6 border border-border backdrop-blur-sm">
                                <h3 className="text-lg font-semibold mb-4 text-amber-400 flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    System Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                                        <p className="text-xs text-muted-foreground mb-2">Ticket ID</p>
                                        <p className="text-foreground font-semibold font-mono">F2FIN-{selectedApplication.ticketId}</p>
                                    </div>

                                    <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                                        <p className="text-xs text-muted-foreground mb-2">Application ID</p>
                                        <p className="text-foreground font-semibold font-mono">{selectedApplication.applicationId}</p>
                                    </div>

                                    <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                                        <p className="text-xs text-muted-foreground mb-2">Customer ID</p>
                                        <p className="text-foreground font-semibold font-mono">{selectedApplication.customerId}</p>
                                    </div>

                                    <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                                        <p className="text-xs text-muted-foreground mb-2">User ID</p>
                                        <p className="text-foreground font-semibold font-mono">{selectedApplication.user_id}</p>
                                    </div>

                                    <div className="bg-muted/30 rounded-lg p-4 border border-border/50 md:col-span-2">
                                        <p className="text-xs text-muted-foreground mb-2">Company ID</p>
                                        <p className="text-foreground font-semibold font-mono">{selectedApplication.companyId}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Status Change Dialog */}
            <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
                <DialogContent className="bg-background border-border max-w-md">
                    <DialogHeader>
                        <DialogTitle className=" text-foreground">Update Application Status</DialogTitle>
                        <DialogDescription className=" text-muted-foreground">
                            Choose a new status and enter a comment.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Status Select */}
                    <div className="space-y-4">
                        <div>
                            <Label className=" text-foreground">Select Status</Label>

                            <Select value={newStatus} onValueChange={setNewStatus}>
                                <SelectTrigger className="bg-card border border-border  text-foreground">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>

                                <SelectContent className="bg-background border-border  text-foreground">
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
                        </div>

                        {/* Conditional Amount & Date Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {newStatus === ApplicationStatus.APPROVED && (
                                <>
                                    <div>
                                        <Label className=" text-foreground">Approved Amount</Label>
                                        <Input
                                            type="number"
                                            value={approvedAmount || ''}
                                            onChange={(e) => setApprovedAmount(Number(e.target.value))}
                                            className="bg-card border-border  text-foreground mt-2"
                                            placeholder="Enter approved amount"
                                        />
                                    </div>
                                    <div>
                                        <Label className=" text-foreground">Approved Date</Label>
                                        <Input
                                            type="date"
                                            value={approvedDate || ''}
                                            onChange={(e) => setApprovedDate(e.target.value)}
                                            className="bg-card border-border  text-foreground mt-2"
                                        />
                                    </div>
                                </>
                            )}
                            {newStatus === ApplicationStatus.DISBURSED && (
                                <>
                                    <div>
                                        <Label className=" text-foreground">Disbursed Amount</Label>
                                        <Input
                                            type="number"
                                            value={disbursedAmount || ''}
                                            onChange={(e) => setDisbursedAmount(Number(e.target.value))}
                                            className="bg-card border-border  text-foreground mt-2"
                                            placeholder="Enter disbursed amount"
                                        />
                                    </div>
                                    <div>
                                        <Label className=" text-foreground">Disbursed Date</Label>
                                        <Input
                                            type="date"
                                            value={disbursedDate || ''}
                                            onChange={(e) => setDisbursedDate(e.target.value)}
                                            className="bg-card border-border  text-foreground mt-2"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Comment */}
                        <div>
                            <Label className=" text-foreground">Comment (required*)</Label>
                            <Textarea
                                value={statusComment}
                                rows={4}
                                onChange={(e) => setStatusComment(e.target.value)}
                                className="bg-card border-border  text-foreground mt-2"
                                placeholder="Why is the status being changed?"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsStatusDialogOpen(false)}
                            className="border-border  text-foreground hover:bg-card"
                        >
                            Cancel
                        </Button>

                        <Button
                            disabled={!statusComment}
                            onClick={handleStatusUpdate}
                            className="bg-gradient-to-r from-blue-600 to-cyan-500  text-foreground disabled:opacity-40"
                        >
                            Save
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
