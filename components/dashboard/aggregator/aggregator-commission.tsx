"use client"

import { useEffect, useRef, useState, useMemo } from 'react'
import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'
import { TrendingUp, Calendar, Download, Eye, FileCheck, Search, Clock, CheckCircle, AlertCircle, XCircle, ClipboardList, Award, Lock, Unlock, Percent, Shield, Medal, Trophy, Crown, Gem } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CardSkeleton, ChartSkeleton } from '@/components/ui/loading-skeleton'
import { useAuth } from '@/lib/auth'
import { CommissionStatus, RuleStatus, ApplicableFor, AggregatorType } from '@/lib/api-types'
import { aggregatorProfileApi } from '@/lib/aggregator-api'
import { commissionsApi } from '@/lib/commission-api'
import { dealLendersApi } from '@/lib/deal-lender-api'
import { ExportButton } from '@/components/ui/button-to-export'
import { TablePagination } from '@/components/ui/pagination'
import { useToast } from "@/hooks/use-toast"
import { useCommissionTransactions, useCommissionTrendsByMonth } from '@/hooks/use-commissions'

const CustomMedalIcon = ({ tier, className = "w-16 h-20" }: { tier: string; className?: string }) => {
  const t = (tier || '').toUpperCase()

  // 1. Keep Diamond Gem icon for personal/company use
  if (t === 'DIAMOND_GEM') {
    return (
      <svg viewBox="0 0 200 245" className={className} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="diam-g1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          <linearGradient id="diam-g2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#bae6fd" />
          </linearGradient>
          <linearGradient id="diam-g3" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#bae6fd" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id="diam-g4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>
          <linearGradient id="diam-g5" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          <linearGradient id="diam-g6" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#075985" />
          </linearGradient>
          <g id="sparkle-agg">
            <path d="M 0,-8 Q 0,0 8,0 Q 0,0 0,8 Q 0,0 0,-8 Z" fill="#ffffff" filter="drop-shadow(0 0 4px #38bdf8)" />
          </g>
        </defs>
        
        <circle cx="100" cy="135" r="70" fill="#38bdf8" opacity="0.15" filter="blur(20px)" />
        
        <g filter="drop-shadow(0 10px 15px rgba(3,105,161,0.3))">
          <path d="M 60,60 L 20,110 L 75,110 Z" fill="url(#diam-g1)" stroke="#ffffff" strokeWidth="1" strokeLinejoin="round" />
          <path d="M 60,60 L 75,110 L 125,110 L 140,60 Z" fill="url(#diam-g2)" stroke="#ffffff" strokeWidth="1" strokeLinejoin="round" />
          <path d="M 140,60 L 125,110 L 180,110 Z" fill="url(#diam-g3)" stroke="#ffffff" strokeWidth="1" strokeLinejoin="round" />
          <path d="M 20,110 L 100,210 L 75,110 Z" fill="url(#diam-g4)" stroke="#ffffff" strokeWidth="1" strokeLinejoin="round" />
          <path d="M 75,110 L 100,210 L 125,110 Z" fill="url(#diam-g5)" stroke="#ffffff" strokeWidth="1" strokeLinejoin="round" />
          <path d="M 125,110 L 100,210 L 180,110 Z" fill="url(#diam-g6)" stroke="#ffffff" strokeWidth="1" strokeLinejoin="round" />
        </g>
        
        <use href="#sparkle-agg" x="50" y="55" transform="scale(0.8)" />
        <use href="#sparkle-agg" x="165" y="105" transform="scale(1.2)" />
        <use href="#sparkle-agg" x="100" y="180" transform="scale(0.6)" />
      </svg>
    )
  }

  // Standard normalized categories: render modern premium geometric shape
  let startColor = "#3b82f6"
  let endColor = "#1d4ed8"
  let glowColor = "rgba(59, 130, 246, 0.3)"
  let customSvgContent = null

  if (t === 'BRONZE') {
    // Spark - Amber/Orange Sparkle Star
    startColor = "#f59e0b"
    endColor = "#b45309"
    glowColor = "rgba(245, 158, 11, 0.3)"
    customSvgContent = (
      <path d="M 100 65 Q 100 120 155 120 Q 100 120 100 175 Q 100 120 45 120 Q 100 120 100 65 Z" fill="#ffffff" />
    )
  } else if (t === 'SILVER') {
    // Pulse - Teal ECG Line
    startColor = "#0d9488"
    endColor = "#115e59"
    glowColor = "rgba(13, 148, 136, 0.3)"
    customSvgContent = (
      <path d="M 50 120 L 75 120 L 85 90 L 97 150 L 109 105 L 119 135 L 127 120 L 150 120" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    )
  } else if (t === 'GOLD') {
    // Momentum - Blue Chevrons
    startColor = "#2563eb"
    endColor = "#1e3a8a"
    glowColor = "rgba(37, 99, 235, 0.3)"
    customSvgContent = (
      <g stroke="#ffffff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M 65 105 L 100 75 L 135 105" />
        <path d="M 65 125 L 100 95 L 135 125" />
        <path d="M 65 145 L 100 115 L 135 145" />
      </g>
    )
  } else if (t === 'DIAMOND') {
    // Catalyst - Emerald Atom/Network
    startColor = "#10b981"
    endColor = "#064e3b"
    glowColor = "rgba(16, 185, 129, 0.3)"
    customSvgContent = (
      <g stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <line x1="100" y1="120" x2="135" y2="85" />
        <line x1="100" y1="120" x2="65" y2="85" />
        <line x1="100" y1="120" x2="135" y2="155" />
        <line x1="100" y1="120" x2="65" y2="155" />
        <circle cx="100" cy="120" r="10" fill="#ffffff" stroke="none" />
        <circle cx="135" cy="85" r="7" fill="#ffffff" stroke="none" />
        <circle cx="65" cy="85" r="7" fill="#ffffff" stroke="none" />
        <circle cx="135" cy="155" r="7" fill="#ffffff" stroke="none" />
        <circle cx="65" cy="155" r="7" fill="#ffffff" stroke="none" />
      </g>
    )
  } else if (t === 'PLATINUM') {
    // Apex - Purple Overlapping Peaks
    startColor = "#a855f7"
    endColor = "#581c87"
    glowColor = "rgba(168, 85, 247, 0.3)"
    customSvgContent = (
      <g fill="#ffffff" stroke="#ffffff" strokeWidth="2" strokeLinejoin="round">
        <polygon points="100,80 60,150 140,150" opacity="0.6" />
        <polygon points="120,95 85,150 155,150" />
      </g>
    )
  } else if (t === 'VANGUARD') {
    // Vanguard - Rose Shield with Star
    startColor = "#f43f5e"
    endColor = "#881337"
    glowColor = "rgba(244, 63, 94, 0.3)"
    customSvgContent = (
      <g fill="#ffffff">
        <path d="M 70 80 L 130 80 L 130 120 C 130 150 100 165 100 165 C 100 165 70 150 70 120 Z" opacity="0.9" stroke="#ffffff" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="100,98 103,107 112,107 105,113 107,122 100,116 93,122 95,113 88,107 97,107" fill={endColor} />
      </g>
    )
  } else {
    customSvgContent = (
      <circle cx="100" cy="120" r="30" fill="#ffffff" />
    )
  }

  return (
    <svg viewBox="0 0 200 245" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`bg-grad-${t}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={startColor} />
          <stop offset="100%" stopColor={endColor} />
        </linearGradient>
      </defs>
      <rect x="30" y="52" width="140" height="140" rx="35" fill={startColor} opacity="0.15" filter="blur(15px)" />
      <rect x="30" y="52" width="140" height="140" rx="35" fill={`url(#bg-grad-${t})`} stroke="rgba(255,255,255,0.2)" strokeWidth="2" filter="drop-shadow(0 8px 16px rgba(0,0,0,0.2))" />
      {customSvgContent}
    </svg>
  )
}

export const getTierIconFromBadgeLabel = (badgeLabel?: string | null, applicableFor?: string) => {
  if (badgeLabel) {
    const label = badgeLabel.toLowerCase();
    if (label.includes('spark')) return 'BRONZE';
    if (label.includes('pulse')) return 'SILVER';
    if (label.includes('momentum')) return 'GOLD';
    if (label.includes('catalyst')) return 'DIAMOND';
    if (label.includes('apex')) return 'PLATINUM';
    if (label.includes('vanguard')) return 'VANGUARD';
  }
  
  if (applicableFor) {
    const tier = applicableFor.toUpperCase();
    if (tier.includes('BRONZE')) return 'BRONZE';
    if (tier.includes('SILVER')) return 'SILVER';
    if (tier.includes('GOLD')) return 'GOLD';
    if (tier.includes('DIAMOND')) return 'DIAMOND';
    if (tier.includes('PLATINUM')) return 'PLATINUM';
    if (tier.includes('VANGUARD')) return 'VANGUARD';
  }
  
  return 'GOLD'; // default fallback
}

export function AggregatorCommission() {
  const { user } = useAuth('aggregator_admin')
  const [searchTerm, setSearchTerm] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [myRules, setMyRules] = useState<any[]>([])
  const [ratesProductType, setRatesProductType] = useState<string>('')
  const [dealLenders, setDealLenders] = useState<any[]>([])
  const [loadingRates, setLoadingRates] = useState(false)
  const [activeTab, setActiveTab] = useState('trends')

  const getTierColors = (applicableFor: string) => {
    const tier = applicableFor || ''
    if (tier.includes('BRONZE')) {
      return {
        borderLeft: 'border-l-amber-600',
        iconColor: 'text-amber-500',
        bgGradient: 'from-amber-950/10 to-card/30',
        color: '#d97706',
        fillColor: 'rgba(217, 119, 6, 0.1)',
      }
    }
    if (tier.includes('DIAMOND_GEM')) {
      return {
        borderLeft: 'border-l-cyan-500',
        iconColor: 'text-cyan-400',
        bgGradient: 'from-cyan-950/10 to-card/30',
        color: '#06b6d4',
        fillColor: 'rgba(6, 182, 212, 0.1)',
      }
    }
    if (tier.includes('SILVER')) {
      return {
        borderLeft: 'border-l-teal-500',
        iconColor: 'text-teal-400',
        bgGradient: 'from-teal-950/10 to-card/30',
        color: '#0d9488',
        fillColor: 'rgba(13, 148, 136, 0.1)',
      }
    }
    if (tier.includes('GOLD')) {
      return {
        borderLeft: 'border-l-blue-500',
        iconColor: 'text-blue-400',
        bgGradient: 'from-blue-950/10 to-card/30',
        color: '#2563eb',
        fillColor: 'rgba(37, 99, 235, 0.1)',
      }
    }
    if (tier.includes('DIAMOND')) {
      return {
        borderLeft: 'border-l-emerald-500',
        iconColor: 'text-emerald-400',
        bgGradient: 'from-emerald-950/10 to-card/30',
        color: '#10b981',
        fillColor: 'rgba(16, 185, 129, 0.1)',
      }
    }
    if (tier.includes('PLATINUM')) {
      return {
        borderLeft: 'border-l-purple-500',
        iconColor: 'text-purple-400',
        bgGradient: 'from-purple-950/10 to-card/30',
        color: '#a855f7',
        fillColor: 'rgba(168, 85, 247, 0.1)',
      }
    }
    if (tier.includes('VANGUARD')) {
      return {
        borderLeft: 'border-l-rose-500',
        iconColor: 'text-rose-400',
        bgGradient: 'from-rose-950/10 to-card/30',
        color: '#f43f5e',
        fillColor: 'rgba(244, 63, 94, 0.1)',
      }
    }
    return {
      borderLeft: 'border-l-blue-500',
      iconColor: 'text-blue-400',
      bgGradient: 'from-blue-950/10 to-card/30',
      color: '#3b82f6',
      fillColor: 'rgba(59, 130, 246, 0.1)',
    }
  }

  const getTierBadge = (applicableFor: string, badgeLabel?: string) => {
    const tier = applicableFor || ''
    const defaultLabel = tier.includes('BRONZE') ? 'Bronze' : tier.includes('SILVER') ? 'Silver' : tier.includes('GOLD') ? 'Gold' : tier.includes('DIAMOND_GEM') ? 'Diamond Gem' : tier.includes('DIAMOND') ? 'Diamond' : tier.includes('PLATINUM') ? 'Platinum' : tier.includes('VANGUARD') ? 'Vanguard' : 'Standard';
    const label = badgeLabel || defaultLabel;

    if (tier.includes('BRONZE')) {
      return (
        <Badge className="bg-amber-900/25 text-amber-400 border border-amber-800/30 font-semibold px-3 py-1 text-xs uppercase tracking-wider flex items-center gap-1.5">
          <CustomMedalIcon tier="BRONZE" className="w-4 h-5" />
          {label} Tier
        </Badge>
      )
    }
    if (tier.includes('DIAMOND_GEM')) {
      return (
        <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-semibold px-3 py-1 text-xs uppercase tracking-wider flex items-center gap-1.5">
          <CustomMedalIcon tier="DIAMOND_GEM" className="w-4 h-5" />
          {label} Tier
        </Badge>
      )
    }
    if (tier.includes('SILVER')) {
      return (
        <Badge className="bg-teal-500/20 text-teal-400 border border-teal-500/30 font-semibold px-3 py-1 text-xs uppercase tracking-wider flex items-center gap-1.5">
          <CustomMedalIcon tier="SILVER" className="w-4 h-5" />
          {label} Tier
        </Badge>
      )
    }
    if (tier.includes('GOLD')) {
      return (
        <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold px-3 py-1 text-xs uppercase tracking-wider flex items-center gap-1.5">
          <CustomMedalIcon tier="GOLD" className="w-4 h-5" />
          {label} Tier
        </Badge>
      )
    }
    if (tier.includes('DIAMOND')) {
      return (
        <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold px-3 py-1 text-xs uppercase tracking-wider flex items-center gap-1.5">
          <CustomMedalIcon tier="DIAMOND" className="w-4 h-5" />
          {label} Tier
        </Badge>
      )
    }
    if (tier.includes('PLATINUM')) {
      return (
        <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30 font-semibold px-3 py-1 text-xs uppercase tracking-wider flex items-center gap-1.5">
          <CustomMedalIcon tier="PLATINUM" className="w-4 h-5" />
          {label} Tier
        </Badge>
      )
    }
    if (tier.includes('VANGUARD')) {
      return (
        <Badge className="bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold px-3 py-1 text-xs uppercase tracking-wider flex items-center gap-1.5">
          <CustomMedalIcon tier="VANGUARD" className="w-4 h-5" />
          {label} Tier
        </Badge>
      )
    }
    return (
      <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold px-3 py-1 text-xs uppercase tracking-wider flex items-center gap-1.5">
        <CustomMedalIcon tier={tier} className="w-4 h-5" />
        {label} Tier
      </Badge>
    )
  }

  const getTierBigMedal = (applicableFor: string) => {
    return (
      <div className="relative flex items-center justify-center">
        <CustomMedalIcon tier={applicableFor} className="w-20 h-24 drop-shadow-[0_0_12px_rgba(0,0,0,0.15)] animate-pulse-slow" />
      </div>
    )
  }


  const loadRates = async () => {
    try {
      setLoadingRates(true)
      const lenders = await dealLendersApi.getDealLenders()
      setDealLenders(lenders)

      const profileResp = await aggregatorProfileApi.getMyProfile()
      const myProfile = profileResp?.myAggregatorProfile
      setProfile(myProfile)

      const ruleResp = await commissionsApi.myCommissionRule()
      if (ruleResp?.data) {
        setMyRules([ruleResp.data])
        setRatesProductType(ruleResp.data.productType)
      } else {
        setMyRules([])
      }
    } catch (err) {
      console.error("Failed to load my commission rates:", err)
    } finally {
      setLoadingRates(false)
    }
  }

  useEffect(() => {
    loadRates()
  }, [])

  const availableProducts = useMemo(() => {
    const products = myRules.map((r: any) => r.productType)
    return Array.from(new Set(products))
  }, [myRules])

  const activeRule = useMemo(() => {
    if (myRules.length === 0) return null
    if (ratesProductType) {
      return myRules.find((r: any) => r.productType === ratesProductType) || myRules[0]
    }
    return myRules[0]
  }, [myRules, ratesProductType])

  const tierColors = useMemo(() => {
    const computedIcon = getTierIconFromBadgeLabel(activeRule?.badgeLabel, activeRule?.applicableFor);
    return getTierColors(activeRule?.icon || computedIcon || activeRule?.applicableFor || '')
  }, [activeRule])
  const [filterStatus, setFilterStatus] = useState<CommissionStatus | ''>('')
  const [filterProductType, setFilterProductType] = useState('')
  const [dateRange, setDateRange] = useState('30d')
  const [exporting, setExporting] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const chartRef = useRef<HTMLDivElement | null>(null)
  const tableTopRef = useRef<HTMLDivElement | null>(null)
  const { theme } = useTheme()
  const { toast } = useToast()

  // Fetch commission transactions
  const {
    data: transactionsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useCommissionTransactions({
    page,
    limit: pageSize,
    filters: {
      aggregatorId: user?._id,
      status: filterStatus || undefined,
      loanType: filterProductType || undefined,
    },
  })

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [filterStatus, filterProductType])

  useEffect(() => {
    if (activeTab === 'rates') {
      loadRates()
    } else if (activeTab === 'history') {
      refetch()
    }
  }, [activeTab, refetch])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Calculate metrics from actual data
  const metrics = useMemo(() => {
    if (!transactionsData?.data) {
      return {
        totalEarned: 0,
        pendingAmount: 0,
        paidAmount: 0,
        avgCommissionRate: 0
      }
    }

    const transactions = transactionsData.data

    const totalEarned = transactions.reduce((sum, t) => sum + t.finalCommission, 0)
    const pendingAmount = transactions
      .filter(t => t.status === CommissionStatus.CALCULATED || t.status === CommissionStatus.PENDING)
      .reduce((sum, t) => sum + t.finalCommission, 0)
    const paidAmount = transactions
      .filter(t => t.status === CommissionStatus.PAID)
      .reduce((sum, t) => sum + t.finalCommission, 0)
    const avgRate = transactions.length > 0
      ? transactions.reduce((sum, t) => sum + t.commissionRate, 0) / transactions.length
      : 0

    return {
      totalEarned,
      pendingAmount,
      paidAmount,
      avgCommissionRate: avgRate
    }
  }, [transactionsData])

  // Fetch commission trends data by month using the new hook
  const { data: commissionTrends = [], isLoading: trendsLoading } = useCommissionTrendsByMonth(
    new Date().getFullYear(),
    user?._id
  )

  const getStatusColor = (status: CommissionStatus) => {
    switch (status) {
      case CommissionStatus.PAID: return 'badge-success'
      case CommissionStatus.CALCULATED:
      case CommissionStatus.PENDING: return 'badge-warning'
      case CommissionStatus.APPROVED: return 'badge-primary'
      case CommissionStatus.DISPUTED: return 'badge-error'
      case CommissionStatus.REJECTED:
      case CommissionStatus.CANCELLED: return 'badge-muted'
      default: return 'badge-muted'
    }
  }

  const getStatusIcon = (status: CommissionStatus) => {
    switch (status) {
      case CommissionStatus.PAID: return CheckCircle
      case CommissionStatus.CALCULATED:
      case CommissionStatus.PENDING: return Clock
      case CommissionStatus.APPROVED: return CheckCircle
      case CommissionStatus.DISPUTED: return AlertCircle
      case CommissionStatus.REJECTED:
      case CommissionStatus.CANCELLED: return XCircle
      default: return Clock
    }
  }

  const getStatusLabel = (status: CommissionStatus) => {
    switch (status) {
      case CommissionStatus.CALCULATED: return 'Calculated'
      case CommissionStatus.PENDING: return 'Pending'
      case CommissionStatus.APPROVED: return 'Approved'
      case CommissionStatus.PAID: return 'Paid'
      case CommissionStatus.REJECTED: return 'Rejected'
      case CommissionStatus.CANCELLED: return 'Cancelled'
      case CommissionStatus.DISPUTED: return 'Disputed'
      default: return status
    }
  }

  // EXPORT FUNCTIONALITY
  const exportToExcel = () => {
    if (!transactionsData?.data || transactionsData.data.length === 0) {
      toast({
        variant: "destructive",
        title: "No data to export",
        description: "There are no commission transactions to export."
      })
      return
    }

    // Prepare data for Excel
    const excelData = transactionsData.data.map((transaction, index) => ({
      'S.No': index + 1,
      'Ticket ID': transaction.ticketId,
      'Transaction ID': transaction.id,
      'Lender/Provider': transaction.provider || 'N/A',
      'Loan Type': transaction.loanType || 'N/A',
      'Aggregator Rank': transaction.aggregatorRank || 'N/A',
      'Loan Amount (₹)': transaction.disbursedAmount,
      'Commission Rate (%)': transaction.commissionRate,
      'Commission Type': transaction.commissionType,
      'Commission Amount (₹)': transaction.finalCommission,
      'Status': getStatusLabel(transaction.status),
      'Calculated Date': formatDate(transaction.calculatedAt),
      'Approved Date': formatDate(transaction.approvedAt),
      'Paid Date': formatDate(transaction.paidAt),
      'Remarks': transaction.remarks || '-',
      'Created At': formatDate(transaction.createdAt),
      'Updated At': formatDate(transaction.updatedAt),
    }))

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    // Set column widths
    const colWidths = [
      { wch: 6 },   // S.No
      { wch: 12 },  // Ticket ID
      { wch: 25 },  // Transaction ID
      { wch: 20 },  // Lender
      { wch: 15 },  // Loan Type
      { wch: 15 },  // Aggregator Rank
      { wch: 15 },  // Loan Amount
      { wch: 15 },  // Commission Rate
      { wch: 15 },  // Commission Type
      { wch: 18 },  // Commission Amount
      { wch: 12 },  // Status
      { wch: 15 },  // Calculated Date
      { wch: 15 },  // Approved Date
      { wch: 15 },  // Paid Date
      { wch: 30 },  // Remarks
      { wch: 15 },  // Created At
      { wch: 15 },  // Updated At
    ]
    ws['!cols'] = colWidths

    // Add summary sheet
    const summaryData = [
      { Metric: 'Total Commission Earned', Value: formatCurrency(metrics.totalEarned) },
      { Metric: 'Pending Payouts', Value: formatCurrency(metrics.pendingAmount) },
      { Metric: 'Paid Amount', Value: formatCurrency(metrics.paidAmount) },
      { Metric: 'Average Commission Rate', Value: `${metrics.avgCommissionRate.toFixed(2)}%` },
      { Metric: 'Total Transactions', Value: transactionsData.total },
      { Metric: 'Report Generated', Value: new Date().toLocaleString('en-IN') },
      { Metric: 'Exported By', Value: user?.username || user?.email || 'N/A' },
    ]
    const wsSummary = XLSX.utils.json_to_sheet(summaryData)
    wsSummary['!cols'] = [{ wch: 30 }, { wch: 25 }]

    // Add worksheets to workbook
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions')

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const fileName = `Commission_Report_${timestamp}.xlsx`

    // Save file
    XLSX.writeFile(wb, fileName)
  }

  const exportToPDF = () => {
    if (!transactionsData?.data || transactionsData.data.length === 0) {
      toast({
        variant: "destructive",
        title: "No data to export",
        description: "There are no commission transactions to export."
      })
      return
    }

    const doc = new jsPDF('landscape')
    const pageWidth = doc.internal.pageSize.getWidth()

    // Add header
    doc.setFontSize(18)
    doc.setTextColor(0, 102, 204)
    doc.text('Commission Report', pageWidth / 2, 15, { align: 'center' })

    // Add summary information
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 25)
    doc.text(`Exported By: ${user?.username || user?.email || 'N/A'}`, 14, 30)

    // Add metrics summary
    doc.setFontSize(12)
    doc.setTextColor(0, 102, 204)
    doc.text('Summary', 14, 40)

    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    const summaryY = 45
    doc.text(`Total Commission Earned: ${formatCurrency(metrics.totalEarned)}`, 14, summaryY)
    doc.text(`Pending Payouts: ${formatCurrency(metrics.pendingAmount)}`, 100, summaryY)
    doc.text(`Paid Amount: ${formatCurrency(metrics.paidAmount)}`, 180, summaryY)
    doc.text(`Avg Commission Rate: ${metrics.avgCommissionRate.toFixed(2)}%`, 14, summaryY + 5)
    doc.text(`Total Transactions: ${transactionsData.total}`, 100, summaryY + 5)

    // Prepare table data
    const tableData = transactionsData.data.map((transaction, index) => [
      index + 1,
      transaction.ticketId,
      transaction.provider || 'N/A',
      transaction.loanType || 'N/A',
      formatCurrency(transaction.disbursedAmount),
      `${transaction.commissionRate}%`,
      formatCurrency(transaction.finalCommission),
      getStatusLabel(transaction.status),
      formatDate(transaction.calculatedAt),
      formatDate(transaction.paidAt),
    ])

    // Add table
    autoTable(doc, {
      startY: summaryY + 15,
      head: [[
        'S.No',
        'Ticket ID',
        'Lender',
        'Loan Type',
        'Loan Amount',
        'Rate',
        'Commission',
        'Status',
        'Calculated',
        'Paid Date'
      ]],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 102, 204],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [0, 0, 0],
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 10 },  // S.No
        1: { cellWidth: 18 },  // Ticket ID
        2: { cellWidth: 30 },  // Lender
        3: { cellWidth: 25 },  // Loan Type
        4: { cellWidth: 25 },  // Loan Amount
        5: { cellWidth: 15 },  // Rate
        6: { cellWidth: 25 },  // Commission
        7: { cellWidth: 20 },  // Status
        8: { cellWidth: 22 },  // Calculated
        9: { cellWidth: 22 },  // Paid Date
      },
      margin: { left: 14, right: 14 },
    })

    // Add footer with page numbers
    const pageCount = doc.internal.pages.length - 1
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(128, 128, 128)
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      )
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const fileName = `Commission_Report_${timestamp}.pdf`

    // Save file
    doc.save(fileName)
  }

  async function handleExport(format: "pdf" | "xlsx") {
    try {
      setExporting(true)
      if (format === "xlsx") {
        exportToExcel()
      } else {
        exportToPDF()
      }

      toast({
        title: "Export complete",
        description: `Saved ${format.toUpperCase()} report successfully.`
      })
    } catch (err: any) {
      console.error('Export error:', err)
      toast({
        variant: "destructive",
        title: "Export failed",
        description: err?.message ?? "Something went wrong."
      })
    } finally {
      setExporting(false)
    }
  }

  const filteredCommissions = useMemo(() => {
    if (!transactionsData?.data) return []

    return transactionsData.data.filter(commission => {
      const matchesSearch =
        commission.ticketId.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (commission.provider || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (commission.loanType || '').toLowerCase().includes(searchTerm.toLowerCase())

      return matchesSearch
    })
  }, [transactionsData, searchTerm])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(1)
    tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const MetricCard = ({
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
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className={`professional-card hover-lift ${colorClass}`}>
        <CardContent className="p-4 sm:p-6 text-center space-y-2">
          {/* Icon */}
          <div className="mx-auto w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-white/10">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>

          {/* Amount / Value */}
          <p className="text-xl sm:text-2xl font-bold text-foreground">
            {amount ?? '-'}
          </p>

          {/* Count (labelled) */}
          {(typeof count === 'number' || countLabel) && (
            <p className="text-xs sm:text-sm text-muted-foreground">
              {typeof count === 'number' ? `${count} ` : ''}
              {countLabel}
            </p>
          )}

          {/* Title */}
          <p className="text-xs sm:text-sm font-medium text-foreground">
            {title}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )

  if (isError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className=" text-foreground text-lg">Failed to load commission data</p>
          <p className=" text-muted-foreground mt-2">{error?.message || 'Something went wrong'}</p>
          <Button onClick={() => refetch()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Commission Tracking</h1>
          <p className=" text-sm sm:text-base text-muted-foreground mt-1">Monitor your earnings and payout status</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full sm:w-32 bg-card border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <div className="w-full sm:w-auto">
            <ExportButton onExport={handleExport} disabled={exporting || isLoading} />
          </div>
        </div>
      </motion.div>

      {/* Metrics Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <CardSkeleton headerLines={2} bodyHeight={20} />
          <CardSkeleton headerLines={2} bodyHeight={20} />
          <CardSkeleton headerLines={2} bodyHeight={20} />
          <CardSkeleton headerLines={2} bodyHeight={20} />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <MetricCard
            index={0}
            title="Commission Transactions"
            amount={formatCurrency(metrics.totalEarned)}
            count={transactionsData?.total ?? 0}
            countLabel="transactions"
            icon={ClipboardList}
            colorClass="metric-card-primary"
          />

          <MetricCard
            index={1}
            title="Commission Paid"
            amount={formatCurrency(metrics.paidAmount)}
            count={
              transactionsData?.data?.filter(
                t => t.status === CommissionStatus.PAID
              ).length ?? 0
            }
            countLabel="paid"
            icon={CheckCircle}
            colorClass="metric-card-success"
          />

          <MetricCard
            index={2}
            title="Commission Pending"
            amount={formatCurrency(metrics.pendingAmount)}
            count={
              transactionsData?.data?.filter(
                t =>
                  t.status === CommissionStatus.PENDING ||
                  t.status === CommissionStatus.CALCULATED
              ).length ?? 0
            }
            countLabel="pending"
            icon={Clock}
            colorClass="metric-card-warning"
          />

          <MetricCard
            index={3}
            title="Avg Commission Rate"
            amount={`${metrics.avgCommissionRate.toFixed(2)}%`}
            countLabel="Across all lenders"
            icon={TrendingUp}
            colorClass="metric-card-accent"
          />
        </div>
      )}

      {/* Commission Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-card border-border space-x-3">
          <TabsTrigger value="trends" className="data-[state=active]:bg-gradient-to-r from-blue to-cyan-500 data-[state=active]:text-dark">
            Commission Trends
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-gradient-to-r from-blue to-cyan-500 data-[state=active]:text-dark">
            Payment History
          </TabsTrigger>
          <TabsTrigger value="rates" className="data-[state=active]:bg-gradient-to-r from-blue to-cyan-500 data-[state=active]:text-dark">
            My Commission Rates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="professional-card">
              <CardHeader>
                <CardTitle className="text-foreground">Commission Trends</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Monthly commission earnings and payout status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading || trendsLoading ? (
                  <ChartSkeleton height={354} />
                ) : commissionTrends.length === 0 ? (
                  <div className="h-96 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No commission data available yet</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-80 w-full" ref={chartRef}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={commissionTrends}>
                        <defs>
                          <linearGradient id="colorEarned" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#FFD700" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#FFD700" stopOpacity={0.3} />
                          </linearGradient>
                          <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#22c55e" stopOpacity={0.3} />
                          </linearGradient>
                          <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f97316" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#f97316" stopOpacity={0.3} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} opacity={0.3} />
                        <XAxis
                          dataKey="month"
                          stroke={theme === 'dark' ? '#9CA3AF' : '#6b7280'}
                          style={{ fontSize: '12px', fontWeight: 500 }}
                        />
                        <YAxis
                          stroke={theme === 'dark' ? '#9CA3AF' : '#6b7280'}
                          allowDecimals={false}
                          style={{ fontSize: '12px', fontWeight: 500 }}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                          contentStyle={{
                            backgroundColor: theme === 'dark' ? '#1F2937' : '#ffffff',
                            border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                            borderRadius: '8px'
                          }}
                          formatter={(value, name) => {
                            const labels: Record<string, string> = {
                              earned: 'Total Earned',
                              paid: 'Paid',
                              pending: 'Pending'
                            }
                            return [formatCurrency(value as number), labels[name as string] || name]
                          }}
                        />
                        <Legend
                          verticalAlign="top"
                          height={36}
                          iconType="circle"
                          formatter={(value) => {
                            const labels: Record<string, string> = {
                              earned: 'Total Earned',
                              paid: 'Paid',
                              pending: 'Pending'
                            }
                            return labels[value] || value
                          }}
                          wrapperStyle={{
                            paddingBottom: '20px',
                            fontSize: '14px',
                            fontWeight: 500
                          }}
                        />
                        <Bar dataKey="earned" fill="url(#colorEarned)" name="Total Earned" radius={[8, 8, 0, 0]} barSize={40} />
                        <Bar dataKey="paid" fill="url(#colorPaid)" name="Paid" radius={[8, 8, 0, 0]} barSize={40} />
                        <Bar dataKey="pending" fill="url(#colorPending)" name="Pending" radius={[8, 8, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="history">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="professional-card">
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-foreground">Commission History</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Detailed record of all commission transactions
                    </CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    <div className="relative w-full sm:w-auto">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 professional-input w-full sm:w-64"
                      />
                    </div>
                    <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val as CommissionStatus | '')}>
                      <SelectTrigger className="w-full sm:w-32 professional-input">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value={CommissionStatus.PAID}>Paid</SelectItem>
                        <SelectItem value={CommissionStatus.PENDING}>Pending</SelectItem>
                        <SelectItem value={CommissionStatus.CALCULATED}>Calculated</SelectItem>
                        <SelectItem value={CommissionStatus.APPROVED}>Approved</SelectItem>
                        <SelectItem value={CommissionStatus.DISPUTED}>Disputed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Product type..."
                      value={filterProductType}
                      onChange={(e) => setFilterProductType(e.target.value)}
                      className="professional-input w-full sm:w-40"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div ref={tableTopRef} />
                {isLoading ? (
                  <div className="space-y-4">
                    <CardSkeleton headerLines={1} bodyHeight={60} />
                    <CardSkeleton headerLines={1} bodyHeight={60} />
                    <CardSkeleton headerLines={1} bodyHeight={60} />
                  </div>
                ) : filteredCommissions.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No commission transactions found</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto professional-table">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ticket ID</TableHead>
                            <TableHead>Lender</TableHead>
                            <TableHead>Loan Type</TableHead>
                            <TableHead>Loan Amount</TableHead>
                            <TableHead>Commission Rate</TableHead>
                            <TableHead>Commission Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Calculated Date</TableHead>
                            <TableHead>UTR / Paid Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCommissions.map((commission, index) => {
                            const StatusIcon = getStatusIcon(commission.status)
                            return (
                              <motion.tr
                                key={commission.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className="border-border hover:bg-card/50"
                              >
                                <TableCell className="font-medium">F2FIN-{commission.ticketId}</TableCell>
                                <TableCell>{commission.provider || 'N/A'}</TableCell>
                                <TableCell>{commission.loanType || 'N/A'}</TableCell>
                                <TableCell>{formatCurrency(commission.disbursedAmount)}</TableCell>
                                <TableCell className="text-accent">{commission.commissionRate}%</TableCell>
                                <TableCell className="text-success font-semibold">{formatCurrency(commission.finalCommission)}</TableCell>
                                <TableCell>
                                  <Badge className={getStatusColor(commission.status)}>
                                    <StatusIcon className="w-3 h-3 mr-1" />
                                    {getStatusLabel(commission.status)}
                                  </Badge>
                                </TableCell>
                                <TableCell>{formatDate(commission.calculatedAt)}</TableCell>
                                <TableCell>
                                  {commission.status === CommissionStatus.PAID && commission.utrNumber ? (
                                    <div className="flex flex-col gap-1">
                                      {/* UTR */}
                                      <p className="text-foreground font-mono text-xs">
                                        {commission.utrNumber.toUpperCase()}
                                      </p>

                                      {/* Paid Date */}
                                      <p className="text-xs text-muted-foreground">
                                        {formatDate(commission.paidAt)}
                                      </p>

                                      {/* Payment Proof */}
                                      {commission.paymentProofUrl && (
                                        <button
                                          onClick={() => window.open(commission.paymentProofUrl, '_blank')}
                                          className="inline-flex items-center gap-1 text-primary text-xs hover:underline"
                                        >
                                          <Eye className="w-3 h-3" />
                                          View Proof
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-muted-foreground text-sm">
                                      {formatDate(commission.paidAt)}
                                    </p>
                                  )}
                                </TableCell>
                              </motion.tr>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    <TablePagination
                      page={page}
                      pageSize={pageSize}
                      total={transactionsData?.total || 0}
                      onPageChange={handlePageChange}
                      onPageSizeChange={handlePageSizeChange}
                      className="mt-4"
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="rates">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {loadingRates ? (
              <div className="space-y-6">
                <CardSkeleton headerLines={2} bodyHeight={120} />
                <CardSkeleton headerLines={1} bodyHeight={250} />
              </div>
            ) : !activeRule ? (
              <Card className="professional-card bg-card border-border">
                <CardContent className="p-8 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="p-3 bg-yellow-500/10 rounded-full border border-yellow-500/20 text-yellow-500">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">No Commission Tier Found</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md">
                      There is no active commission tier structure mapped to your account rank ({profile?.rank || 'N/A'}). Please contact system administration to configure your tier rates.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Active Tier Header Info */}
                <Card className={`professional-card border-l-4 ${tierColors.borderLeft} bg-gradient-to-r ${tierColors.bgGradient} border-border`}>
                  <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left side: Medal and text info */}
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6">
                        {/* Prominent Medal Icon */}
                        <div className="flex-shrink-0 p-3 rounded-2xl bg-card border border-border/80 shadow-inner flex items-center justify-center">
                          {getTierBigMedal(activeRule.icon || getTierIconFromBadgeLabel(activeRule.badgeLabel, activeRule.applicableFor) || activeRule.applicableFor)}
                        </div>

                        {/* Header Info */}
                        <div className="space-y-1 text-center sm:text-left">
                          <CardTitle className="text-xl md:text-2xl font-bold text-foreground">
                            Active Commission Tier: {activeRule.badgeLabel || activeRule.ruleName}
                          </CardTitle>
                          <CardDescription className="text-muted-foreground text-xs md:text-sm">
                            {activeRule.description || "You are mapped to this rule-based tier rate chart for all automatic payouts."}
                          </CardDescription>
                        </div>
                      </div>

                      {/* Right side: Product select and active badges */}
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                        {availableProducts.length > 1 && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Product:</span>
                            <Select value={ratesProductType} onValueChange={setRatesProductType}>
                              <SelectTrigger className="w-44 bg-card border-border text-foreground h-9">
                                <SelectValue placeholder="Select Product" />
                              </SelectTrigger>
                              <SelectContent className="bg-popover border-border text-popover-foreground">
                                {availableProducts.map((prod) => (
                                  <SelectItem key={prod} value={prod} className="capitalize cursor-pointer">
                                    {prod.replace('_', ' ').toLowerCase()}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-500/20 text-emerald-400 border border-emerald-500/30 font-semibold px-3 py-1 text-xs uppercase tracking-wider">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Active Plan
                          </Badge>
                          {getTierBadge(activeRule.icon || getTierIconFromBadgeLabel(activeRule.badgeLabel, activeRule.applicableFor) || activeRule.applicableFor, activeRule.badgeLabel)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Base Commission Rate</p>
                        <p className="text-lg md:text-xl font-bold flex items-center gap-1" style={{ color: tierColors.color }}>
                          <Percent className="w-4 h-4" />
                          {activeRule.commissionRate}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Applicable Product</p>
                        <p className="text-sm md:text-base font-semibold text-foreground capitalize">
                          {activeRule.productType ? activeRule.productType.replace(/_/g, ' ').toLowerCase() : 'All Products'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Min Ticket Size</p>
                        <p className="text-sm md:text-base font-semibold text-foreground">
                          {formatCurrency(activeRule.minAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Max Ticket Size</p>
                        <p className="text-sm md:text-base font-semibold text-foreground">
                          {activeRule.maxAmount ? formatCurrency(activeRule.maxAmount) : 'No Limit'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Lender Rates Table */}
                <Card className="professional-card bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-foreground">
                      Lender-wise Rates Chart
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Specific percentages resolved per lender for Secured and Unsecured loans. Rates default to the tier base percentage if not customized.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border border-border rounded-lg overflow-hidden bg-background">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow className="border-border">
                            <TableHead className="font-semibold text-foreground w-1/3">Lender Name</TableHead>
                            <TableHead className="font-semibold text-foreground w-1/6">Category</TableHead>
                            <TableHead className="font-semibold text-foreground text-center w-1/4">
                              <span className="flex items-center justify-center gap-1">
                                <Lock className="w-3.5 h-3.5 text-teal-400" />
                                Secured Rate (%)
                              </span>
                            </TableHead>
                            <TableHead className="font-semibold text-foreground text-center w-1/4">
                              <span className="flex items-center justify-center gap-1">
                                <Unlock className="w-3.5 h-3.5 text-orange-400" />
                                Unsecured Rate (%)
                              </span>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dealLenders.length > 0 ? (
                            dealLenders.map((lender) => {
                              const matched = activeRule?.lenderCommissions?.find(
                                (lc: any) => lc.lenderName.toLowerCase() === lender.name.toLowerCase()
                              )
                              
                              const securedDisplay = matched?.securedRate != null 
                                ? { val: `${matched.securedRate}%`, isBase: false }
                                : { val: `${activeRule.commissionRate}%`, isBase: true }
                                
                              const unsecuredDisplay = matched?.unsecuredRate != null
                                ? { val: `${matched.unsecuredRate}%`, isBase: false }
                                : { val: `${activeRule.commissionRate}%`, isBase: true }

                              return (
                                <TableRow key={lender.id} className="border-border hover:bg-card/40 transition-colors">
                                  <TableCell className="font-medium text-foreground py-3">
                                    {lender.name}
                                  </TableCell>
                                  <TableCell className="py-3">
                                    <Badge variant="outline" className="capitalize text-[11px] py-0.5 border-border">
                                      {lender.type}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-center py-3">
                                    {securedDisplay.isBase ? (
                                      <span className="text-muted-foreground text-sm font-medium">
                                        {securedDisplay.val} <span className="text-[10px] text-muted-foreground/60">(Base)</span>
                                      </span>
                                    ) : (
                                      <Badge className="bg-teal-500/15 text-teal-400 border border-teal-500/20 font-semibold px-2 py-0.5 hover:bg-teal-500/15">
                                        {securedDisplay.val}
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center py-3">
                                    {unsecuredDisplay.isBase ? (
                                      <span className="text-muted-foreground text-sm font-medium">
                                        {unsecuredDisplay.val} <span className="text-[10px] text-muted-foreground/60">(Base)</span>
                                      </span>
                                    ) : (
                                      <Badge className="bg-orange-500/15 text-orange-400 border border-orange-500/20 font-semibold px-2 py-0.5 hover:bg-orange-500/15">
                                        {unsecuredDisplay.val}
                                      </Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              )
                            })
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                No lenders configured.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
