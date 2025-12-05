'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Plus, MoreHorizontal, Eye, Edit, Trash2, FileText, Clock, CheckCircle, XCircle, AlertCircle, Phone, Mail,
  Calendar, DollarSign, Building2, User, X, Landmark, Percent, Contact2Icon,
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
import { useProducts } from '@/hooks/use-products'
import { useApplications, useCreateApplication, useUpdateApplication, useDeleteApplication } from '@/hooks/use-applications'
import { useLenders } from '@/hooks/use-lenders'
import { ApplicationStatus } from '@/lib'

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
  submitted: "bg-blue-500/20 text-blue-300 border-blue-500/30"
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
            <p className="text-xs text-gray-400 uppercase tracking-wider">Application</p>
            <p className="text-white font-bold text-lg">{application.applicationNumber}</p>
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
              <p className="text-white font-bold">{formatCurrency(application.loanAmount)}</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <FileText className="w-4 h-4" />
                <span>Product Type</span>
              </div>
              <p className="text-white text-sm">{application.product.productType.replace('_', ' ')}</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Building2 className="w-4 h-4" />
                <span>Lender</span>
              </div>
              <div className="text-right">
                <p className="text-white text-sm font-medium">{application.lender.lenderName}</p>
                <p className="text-gray-400 text-xs">{application.lender.lenderType}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Calendar className="w-4 h-4" />
                <span>Last Updated</span>
              </div>
              <p className="text-gray-300 text-sm">{new Date(application.updatedAt).toLocaleDateString()}</p>
            </div>

            {/* CARD ACTIONS SECTION - Status Badge & Action Buttons */}
            <div className="space-y-3 pt-4 border-t border-gray-700">
              {/* Status Badge - Clickable with hover effect */}
              <div
                onClick={onStatusClick}
                className={`w-full cursor-pointer rounded-lg transition-all duration-200 hover:scale-[1.02] ${STATUS_STYLE[pretty(application.status)]} p-3 flex items-center justify-center gap-2`}
                title="Click to update status"
              >
                {getStatusIcon(application.status)}
                <span className="font-medium">{pretty(application.status)}</span>
              </div>

              {/* Action Buttons - View, Delete & History */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={onView}
                  variant="outline"
                  size="sm"
                  className="w-full bg-gray-900/50 border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 hover:border-blue-500/50 transition-all"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>

                <Button
                  onClick={onDelete}
                  variant="outline"
                  size="sm"
                  className="w-full bg-gray-900/50 border-gray-600 text-red-400 hover:text-white hover:bg-red-600/20 hover:border-red-500/50 transition-all"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>

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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-6 w-6 p-0 text-yellow-300 hover:text-cyan-400 transition-colors"

                >
                  <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                    {isExpanded ? <ArrowRightCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </motion.div>
                </Button>
              </TooltipTrigger>
              <TooltipContent>History</TooltipContent>
            </Tooltip>
            <p className="text-white font-medium">{application.applicationNumber}</p>
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
            <p className="text-white font-medium">{formatCurrency(application.loanAmount)}</p>
            <p className="text-gray-400 text-sm">{application.product.productType.replace('_', ' ')}</p>
          </div>
        </TableCell>
        <TableCell>
          <div>
            <p className="text-white font-medium">{application.lender.lenderName}</p>
            <p className="text-white font-medium">{application.lender.lenderType}</p>
          </div>
        </TableCell>
        <TableCell>
          <Tooltip>
            <TooltipTrigger>
              <Badge
                onClick={onStatusClick}
                className={`cursor-pointer flex items-center gap-1 ${STATUS_STYLE[pretty(application.status)]} hover:scale-105 transition-transform`}>
                {getStatusIcon(application.status)}
                {pretty(application.status)}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>Click to update status</TooltipContent>
          </Tooltip>
        </TableCell>
        <TableCell className="text-gray-400">
          {new Date(application.updatedAt).toLocaleDateString()}
        </TableCell>
        <TableCell>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={onView} className="text-blue cursor-pointer hover:text-white">
                <Eye className="w-4 h-4 mr-2 " />
              </Button>
            </TooltipTrigger>
            <TooltipContent>View</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={onDelete} className="text-red-400 cursor-pointer hover:text-white">
                <Trash2 className="w-4 h-4 mr-2" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
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
                            <FileText className="w-4 h-4 text-cyan-400" />
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
  applications: any[];
  isLoading: boolean;
  onView: (app: any) => void;
  onDelete: (id: string) => void;
  onStatusClick: (app: any) => void;
  formatCurrency: (amount: number) => string;
}

const ApplicationsGrid = ({ applications, isLoading, onView, onDelete, onStatusClick, formatCurrency }: ApplicationsGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <CardSkeleton key={i} headerLines={2} bodyHeight={200} />
        ))}
      </div>
    );
  }

  if (!applications || applications.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400 text-lg">No applications found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {applications.map((application) => (
        <ApplicationCard
          key={application._id}
          application={application}
          onView={() => onView(application)}
          onDelete={() => onDelete(application._id)}
          onStatusClick={() => onStatusClick(application)}
          formatCurrency={formatCurrency}
        />
      ))}
    </div>
  );
};

export function AggregatorApplications() {
  const { user } = useAuth('aggregator_admin')
  const { toast } = useToast()

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterLender, setFilterLender] = useState('')

  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [selectedLenderId, setSelectedLenderId] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // For status update popup
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [statusComment, setStatusComment] = useState("");
  const [oldStatus, setOldStatus] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [approvedAmount, setApprovedAmount] = useState<number | undefined>();
  const [disbursedAmount, setDisbursedAmount] = useState<number | undefined>();
  const [approvedDate, setApprovedDate] = useState<string | undefined>();
  const [disbursedDate, setDisbursedDate] = useState<string | undefined>();


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

  // Fetch applications using the hook
  const {
    data: applications,
    isLoading: isTableLoading,
    refetch
  } = useApplications({
    page,
    limit: pageSize,
    aggregatorId: user?._id || user?.id,
    status: filterStatus && filterStatus !== 'all' ? filterStatus : undefined,
  })
  const total = applications?.count || 0

  // Fetch products for the dropdown
  const { data: products } = useProducts({ page, limit: 100 });
  const { data: lenderData } = useLenders({ page: 1, limit: 100 })
  const allLenders = lenderData?.results || []

  const createApplicationMutation = useCreateApplication();
  const updateApplicationMutation = useUpdateApplication();
  const deleteApplicationMutation = useDeleteApplication();

  // Calculate stats from real data
  const stats = useMemo(() => {
    const totalApps = applications?.results;
    const underReview = totalApps?.filter(app => app.status === 'UNDER_CREDIT_REVIEW').length || 0
    const approved = totalApps?.filter(app => app.status === 'APPROVED').length || 0
    const disbursed = totalApps?.filter(app => app.status === 'DISBURSED').length || 0

    return [
      {
        title: 'Total Applications',
        value: total.toString(),
        change: '+12%',
        icon: FileText,
        color: 'text-blue-400'
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
  }, [applications, total])

  // Client-side filtering for search and lender
  const filteredApplications = useMemo(() => {
    return applications?.results?.filter(app => {
      const matchesSearch = app.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.applicationNumber.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesLender = !filterLender || filterLender === 'all' || app.lenderName === filterLender
      return matchesSearch && matchesLender
    })
  }, [applications?.results, searchTerm, filterLender])

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

  const lenders = useMemo(() => {
    return allLenders.map((l) => ({
      id: l._id,
      name: l.lenderName
    }));
  }, [allLenders]);

  const productsByLender = useMemo(() => {
    if (!selectedLenderId) return [];
    return products?.results?.filter(
      (p) => p.lender?.profile._id === selectedLenderId
    ) || [];
  }, [products, selectedLenderId]);

  console.log(selectedApplication, 'this is selected application', filteredApplications)
  const handleCreateApplication = async () => {
    try {
      if (!selectedProduct) return;

      const payload = {
        aggregatorId: user?._id || user?.id,
        productId: form.productId,
        lenderId: form.lenderId,
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone,
        loanAmount: Number(form.loanAmount || 0),
      }

      const response = await createApplicationMutation.mutateAsync(payload)
      console.log(response.createApplication.application, 'create application response')

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
          description: response?.createApplication?.message || 'Failed to create application',
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete')) return
    try {
      await deleteApplicationMutation.mutateAsync(id);
      toast({ title: 'Success', description: 'Application deleted successfully.' })
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete Application.',
        variant: 'destructive',
      })
    }
  }

  const handleStatusUpdate = async () => {
    try {
      if (!selectedApplication) return;

      const payload: any = {
        id: selectedApplication._id,
        status: newStatus?.toUpperCase(),
        action: `${user?.username} changed Application Status from ${pretty(oldStatus)} to ${pretty(newStatus)}`,
        comment: statusComment
      };

      if (newStatus === ApplicationStatus.APPROVED) {
        payload.approvedAmount = approvedAmount;
        payload.approvedDate = approvedDate ? new Date(approvedDate) : undefined;
      }
      if (newStatus === ApplicationStatus.DISBURSED) {
        payload.disbursedAmount = disbursedAmount;
        payload.disbursedDate = disbursedDate ? new Date(disbursedDate) : undefined;
      }

      console.log("STATUS UPDATE PAYLOAD", payload);
      await updateApplicationMutation.mutateAsync({
        id: selectedApplication._id,
        payload
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const handleStatusClick = (application: any) => {
    setSelectedApplication(application);
    setOldStatus(application.status);
    setNewStatus(application.status);
    setStatusComment("");
    setApprovedAmount(application.approvedAmount);
    setDisbursedAmount(application.disbursedAmount);
    setApprovedDate(application.approvedDate ? new Date(application.approvedDate).toISOString().split('T')[0] : undefined);
    setDisbursedDate(application.disbursedDate ? new Date(application.disbursedDate).toISOString().split('T')[0] : undefined);
    setIsStatusDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white"> Loan Applications </h1>
          <p className="text-gray-400 mt-1">Manage and track all loan applications</p>
        </div>

        {/* Apply Button */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-gradient-to-r from-blue to-cyan-500 hover:to-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Application
            </Button>
          </DialogTrigger>
          {/* Apply Form */}
          <DialogContent className="bg-gradient-to-br from-gray-900 to-black border-gray-700 text-white max-h-screen rounded-xl shadow-xl">
            <DialogHeader className="flex-shrink-0">
              <div>
                <DialogTitle className="text-2xl font-bold text-white bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                  Create New Application
                </DialogTitle>
                <DialogDescription className="text-gray-400 pt-1">
                  Submit a new loan application for your customer
                </DialogDescription>
              </div>
            </DialogHeader>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCreateDialogOpen(false)}
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
                      setForm({ ...form, lenderId: id, productId: "" });
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
                        setForm({
                          ...form,
                          productId: prod?._id || "",
                          lenderId: prod?.lender?.profile?._id || ""
                        });
                      }}
                    >
                      <SelectTrigger className="bg-gray-800 border border-gray-700 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700 transition">
                        <SelectValue placeholder={selectedLenderId ? "Choose a product" : "Select a lender first"} />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d1117] text-white border border-gray-700">
                        {productsByLender.map((p) => (
                          <SelectItem key={p._id} value={p._id}>
                            {p.name}
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
                    <Label htmlFor="customerName" className="text-gray-300">Customer Name</Label>
                    <Input id="customerName" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} className="bg-gray-800 border-gray-700 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail" className="text-gray-300">Email</Label>
                    <Input id="customerEmail" type="email" value={form.customerEmail} onChange={e => setForm({ ...form, customerEmail: e.target.value })} className="bg-gray-800 border-gray-700 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone" className="text-gray-300">Phone</Label>
                    <Input id="customerPhone" value={form.customerPhone} onChange={e => setForm({ ...form, customerPhone: e.target.value })} className="bg-gray-800 border-gray-700 text-white" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="loanAmount" className="text-gray-300">Loan Amount</Label>
                    <Input id="loanAmount" type="number" value={form.loanAmount} onChange={e => setForm({ ...form, loanAmount: e.target.value })} className="bg-gray-800 border-gray-700 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex justify-between items-center pt-0  border-gray-700 flex-shrink-0">
              <Button
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                disabled={!form.customerName || !form.customerEmail || !form.productId || !form.loanAmount}
                onClick={handleCreateApplication}
                className="bg-gradient-to-r from-blue to-cyan-500 text-white "
              >
                Submit Application
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div >

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
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-900/50 border-gray-800 text-white"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 bg-gray-900/50 border-gray-800 text-white">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="DISBURSED">Disbursed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterLender} onValueChange={setFilterLender}>
          <SelectTrigger className="w-40 bg-gray-900/50 border-gray-800 text-white">
            <SelectValue placeholder="All Lenders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Lenders</SelectItem>
            {applications?.results?.map(app => (
              <SelectItem key={app.lender._id} value={app.lender.lenderName}>{app.lender.lenderName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Applications Table/Grid with View Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Applications Overview</CardTitle>
                <CardDescription className="text-gray-400">
                  Track and manage all loan applications
                </CardDescription>
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
                        <TableHead className="text-gray-300">Application Number</TableHead>
                        <TableHead className="text-gray-300">Customer</TableHead>
                        <TableHead className="text-gray-300">Product Details</TableHead>
                        <TableHead className="text-gray-300">Lender</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-300">Last Updated</TableHead>
                        <TableHead className="text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApplications?.map((application, index) => (
                        <ApplicationTableRow
                          key={application._id}
                          application={application}
                          index={index}
                          onView={() => {
                            setSelectedApplication(application)
                            setIsViewDialogOpen(true)
                          }}
                          onDelete={() => handleDelete(application._id)}
                          onStatusClick={() => handleStatusClick(application)}
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
                applications={filteredApplications || []}
                isLoading={isTableLoading}
                onView={(app) => {
                  setSelectedApplication(app);
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
                    <DialogTitle className="text-2xl font-bold text-white bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                      {selectedApplication.product.name}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400 pt-1">
                      Detailed overview of the loan product from <span className="font-semibold text-cyan-300">{selectedApplication.lender.lenderName}</span>
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
              <Badge className={`mt-1 flex items-center gap-1 ${STATUS_STYLE[pretty(selectedApplication.status)]}`}>
                {getStatusIcon(selectedApplication.status)}
                {pretty(selectedApplication.status)}
              </Badge>

              <div className="py-4 space-y-6">
                {/* Key Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <InfoItem icon={User} color="text-yellow-400" label="Customer" value={selectedApplication.customerName} />
                  <InfoItem icon={DollarSign} color="text-green-400" label="Loan Amount" value={formatCurrency(selectedApplication.loanAmount)} />
                  <InfoItem icon={Landmark} color="text-blue" label="Lender" value={selectedApplication.lender.lenderName} />
                  <InfoItem icon={Calendar} color="text-purple-400" label="Last Updated" value={new Date(selectedApplication.updatedAt).toLocaleDateString()} />
                </div>

                {/* Loan & Commission */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-800">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-cyan-300 mb-2 flex items-center gap-2"><DollarSign className="w-5 h-5" />Application Details</h3>
                    <InfoLine icon={FileText} color="text-yellow-400" label="Product Name" value={selectedApplication.product.name} />
                    <InfoLine icon={FileText} color="text-blue" label="Loan Type" value={selectedApplication.product.productType.replace('_', ' ')} />
                    <InfoLine icon={Percent} color="text-green-400" label="Commission" value={`${selectedApplication.product.commissionPercent}%`} />
                    <InfoLine icon={Percent} color="text-purple-400" label="Processing Fee" value={`${selectedApplication.product.processingFeePercent}%`} />
                  </div>

                  {/* Customer & Documents */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-cyan-300 mb-2 flex items-center gap-2"><Contact2Icon className="w-5 h-5" />Contact & Documents</h3>
                    <InfoLine icon={Mail} color="text-blue" label="Email" value={selectedApplication.customerEmail} />
                    <InfoLine icon={Phone} color="text-green-400" label="Phone" value={selectedApplication.customerPhone} />
                    <div className="pt-2">
                      <h4 className="font-semibold text-cyan-300 mb-2 flex items-center gap-2"><FileText className="w-5 h-5" />Documents</h4>
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

      {/* Status Change Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Update Application Status</DialogTitle>
            <DialogDescription className="text-gray-400">
              Choose a new status and enter a comment.
            </DialogDescription>
          </DialogHeader>

          {/* Status Select */}
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Select Status</Label>

              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="bg-gray-800 border border-gray-700 text-white">
                  <SelectValue placeholder="Select status" />
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
            </div>

            {/* Conditional Amount & Date Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {newStatus === ApplicationStatus.APPROVED && (
                <>
                  <div>
                    <Label className="text-gray-300">Approved Amount</Label>
                    <Input
                      type="number"
                      value={approvedAmount || ''}
                      onChange={(e) => setApprovedAmount(Number(e.target.value))}
                      className="bg-gray-800 border-gray-700 text-white mt-2"
                      placeholder="Enter approved amount"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Approved Date</Label>
                    <Input
                      type="date"
                      value={approvedDate || ''}
                      onChange={(e) => setApprovedDate(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white mt-2"
                    />
                  </div>
                </>
              )}
              {newStatus === ApplicationStatus.DISBURSED && (
                <>
                  <div>
                    <Label className="text-gray-300">Disbursed Amount</Label>
                    <Input
                      type="number"
                      value={disbursedAmount || ''}
                      onChange={(e) => setDisbursedAmount(Number(e.target.value))}
                      className="bg-gray-800 border-gray-700 text-white mt-2"
                      placeholder="Enter disbursed amount"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Disbursed Date</Label>
                    <Input
                      type="date"
                      value={disbursedDate || ''}
                      onChange={(e) => setDisbursedDate(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white mt-2"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Comment */}
            <div>
              <Label className="text-gray-300">Comment (required*)</Label>
              <Textarea
                value={statusComment}
                rows={4}
                onChange={(e) => setStatusComment(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white mt-2"
                placeholder="Why is the status being changed?"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsStatusDialogOpen(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>

            <Button
              disabled={!statusComment}
              onClick={handleStatusUpdate}
              className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white disabled:opacity-40"
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
