"use client"

import { z } from 'zod'
import { Controller, useForm } from 'react-hook-form'
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CreditCard, Plus, Search, Edit, Trash2, Settings, TrendingUp, Percent, AlertCircle, Info } from 'lucide-react'
import { TablePagination } from "@/components/ui/pagination"
import { CardSkeleton, TableSkeleton } from "@/components/ui/loading-skeleton"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { toast } from '@/hooks/use-toast'
import {
    useCommissionRules,
    useCreateCommissionRule,
    useUpdateCommissionRule,
    useDeleteCommissionRule,
} from '@/hooks/use-commissions'
import {
    CommissionType,
    RuleStatus,
    ApplicableFor,
    AggregatorType,
    CreateCommissionRuleInput,
    DealLender
} from '@/lib/api-types'
import { dealLendersApi } from '@/lib/deal-lender-api'

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
                    <g id="sparkle-tab">
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

                <use href="#sparkle-tab" x="50" y="55" transform="scale(0.8)" />
                <use href="#sparkle-tab" x="165" y="105" transform="scale(1.2)" />
                <use href="#sparkle-tab" x="100" y="180" transform="scale(0.6)" />
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

// Schema with validation
export const commissionRuleSchema = z.object({
    ruleName: z
        .string()
        .min(3, "Rule name must be at least 3 characters")
        .max(100, "Rule name must be less than 100 characters"),

    icon: z.string().nullable().optional(),
    badgeLabel: z.string().nullable().optional(),

    productType: z
        .string()
        .min(1, "Product type is required"),

    commissionType: z.nativeEnum(CommissionType, {
        required_error: "Commission type is required",
    }),

    commissionRate: z
        .number({ invalid_type_error: "Commission rate is required" })
        .positive("Must be greater than 0")
        .max(100, "Rate cannot exceed 100%"),

    minAmount: z
        .number({ invalid_type_error: "Min amount is required" })
        .min(1000, "Minimum amount must be at least ₹1,000")
        .positive(),

    maxAmount: z
        .number({ invalid_type_error: "Max amount is required" })
        .positive(),

    applicableFor: z.nativeEnum(ApplicableFor, {
        required_error: "Applicability is required",
    }),

    priority: z
        .number()
        .int()
        .min(0, "Priority must be 0 or greater")
        .max(100, "Priority cannot exceed 100")
        .optional(),

    description: z
        .string()
        .max(500, "Description must be less than 500 characters")
        .optional(),

    status: z.nativeEnum(RuleStatus).optional(),
    lenderCommissions: z.array(
        z.object({
            lenderName: z.string(),
            securedRate: z.number().nullable().optional(),
            unsecuredRate: z.number().nullable().optional(),
        })
    ).optional(),
})
    .refine((data) => data.maxAmount > data.minAmount, {
        message: "Max amount must be greater than Min amount",
        path: ["maxAmount"],
    })

export type CommissionRuleFormValues = z.infer<typeof commissionRuleSchema>

interface CommissionRulesTabProps {
    aggregatorType: AggregatorType
}

export function CommissionRulesTab({ aggregatorType }: CommissionRulesTabProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState<RuleStatus | ''>('')
    const [filterProductType, setFilterProductType] = useState('')
    const [filterApplicableFor, setFilterApplicableFor] = useState<ApplicableFor | ''>('')
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [editingRule, setEditingRule] = useState<any>(null)
    const [dealLenders, setDealLenders] = useState<DealLender[]>([])
    const [viewingRule, setViewingRule] = useState<any>(null)
    const [isViewChartOpen, setIsViewChartOpen] = useState(false)

    useEffect(() => {
        dealLendersApi.getDealLenders()
            .then(data => setDealLenders(data))
            .catch(err => console.error("Failed to fetch deal lenders:", err))
    }, [])

    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const tableTopRef = useRef<HTMLDivElement | null>(null)

    const {
        data: rulesData,
        isLoading: isTableLoading,
        isError,
        error,
        refetch,
    } = useCommissionRules({
        page,
        limit: pageSize,
        filters: {
            status: filterStatus || undefined,
            productType: filterProductType || undefined,
            applicableFor: filterApplicableFor || undefined,
            aggregatorType: aggregatorType, // Filter by aggregator type
        },
    })

    const createRuleMutation = useCreateCommissionRule()
    const updateRuleMutation = useUpdateCommissionRule()
    const deleteRuleMutation = useDeleteCommissionRule()

    const {
        register,
        control,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<CommissionRuleFormValues>({
        resolver: zodResolver(commissionRuleSchema),
        defaultValues: {
            productType: "",
            icon: null,
            badgeLabel: null,
            commissionType: CommissionType.PERCENTAGE,
            commissionRate: undefined,
            minAmount: undefined,
            maxAmount: undefined,
            applicableFor: ApplicableFor.ALL_AGGREGATORS,
            priority: 0,
            description: "",
        },
    })

    const commissionTypeWatch = watch('commissionType')

    useEffect(() => {
        setPage(1)
    }, [filterStatus, filterProductType, filterApplicableFor])

    // Calculate metrics from actual data
    const metrics = useMemo(() => {
        if (!rulesData?.data) {
            return {
                totalRules: 0,
                activeRules: 0,
                avgCommissionRate: 0,
            }
        }

        const activeRules = rulesData.data.filter(rule => rule.status === RuleStatus.ACTIVE)
        const avgRate = activeRules.length > 0
            ? activeRules.reduce((sum, rule) => sum + rule.commissionRate, 0) / activeRules.length
            : 0

        return {
            totalRules: rulesData.total,
            activeRules: activeRules.length,
            avgCommissionRate: avgRate.toFixed(2),
        }
    }, [rulesData])

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount)
    }

    const getStatusColor = (status: RuleStatus) => {
        switch (status) {
            case RuleStatus.ACTIVE: return 'bg-green-500/20 text-green-400'
            case RuleStatus.INACTIVE: return 'bg-gray-500/20 text-muted-foreground'
            case RuleStatus.ARCHIVED: return 'bg-orange-500/20 text-orange-400'
            default: return 'bg-gray-500/20 text-muted-foreground'
        }
    }

    const getApplicableForLabel = (value: ApplicableFor) => {
        return value.replace('_AGGREGATORS', '').replace('_', ' ')
    }

    const handlePageChange = async (newPage: number) => {
        setPage(newPage)
        tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }

    const handlePageSizeChange = async (size: number) => {
        setPageSize(size)
        setPage(1)
        tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }

    const handleCreateRule = async (data: CommissionRuleFormValues) => {
        try {
            const filteredCommissions = ((data as any).lenderCommissions || [])
                .filter((lc: any) => lc.securedRate !== undefined && lc.securedRate !== null && lc.securedRate !== "" || lc.unsecuredRate !== undefined && lc.unsecuredRate !== null && lc.unsecuredRate !== "")
                .map((lc: any) => ({
                    lenderName: lc.lenderName,
                    securedRate: lc.securedRate !== undefined && lc.securedRate !== null && lc.securedRate !== "" ? parseFloat(lc.securedRate.toString()) : undefined,
                    unsecuredRate: lc.unsecuredRate !== undefined && lc.unsecuredRate !== null && lc.unsecuredRate !== "" ? parseFloat(lc.unsecuredRate.toString()) : undefined,
                }))

            const payload: CreateCommissionRuleInput = {
                ruleName: data.ruleName,
                productType: data.productType,
                commissionType: data.commissionType,
                commissionRate: data.commissionRate,
                minAmount: data.minAmount,
                maxAmount: data.maxAmount,
                applicableFor: data.applicableFor,
                aggregatorType: aggregatorType, // Auto-set based on active tab
                priority: data.priority,
                description: data.description,
                lenderCommissions: filteredCommissions,
                icon: data.icon || getTierIconFromBadgeLabel(data.badgeLabel, data.applicableFor),
                badgeLabel: data.badgeLabel || null,
                ...(editingRule && data.status && { status: data.status }), // Only include status when editing
            }

            if (editingRule) {
                await updateRuleMutation.mutateAsync({
                    id: editingRule.id,
                    input: payload,
                })
            } else {
                console.log(payload, 'this is commission rule')
                await createRuleMutation.mutateAsync(payload)
            }

            reset()
            setIsCreateDialogOpen(false)
            setEditingRule(null)
            refetch()
        } catch (error: any) {
            // Error toast is handled by the mutation hook
            console.error("Failed to save commission rule:", error)
        }
    }

    const handleCreateRuleButton = () => {
        setEditingRule(null)
        reset({
            productType: "",
            icon: null,
            badgeLabel: null,
            commissionType: CommissionType.PERCENTAGE,
            commissionRate: undefined,
            minAmount: undefined,
            maxAmount: undefined,
            applicableFor: ApplicableFor.ALL_AGGREGATORS,
            priority: 0,
            description: "",
            lenderCommissions: dealLenders.map(l => ({
                lenderName: l.name,
                securedRate: undefined,
                unsecuredRate: undefined,
            })),
        })
        setIsCreateDialogOpen(true)
    }

    const handleViewChart = (rule: any) => {
        setViewingRule(rule)
        setIsViewChartOpen(true)
    }

    const handleEditRule = (rule: any) => {
        setEditingRule(rule)
        setValue('ruleName', rule.ruleName)
        setValue('productType', rule.productType)
        setValue('icon', rule.icon || null)
        setValue('badgeLabel', rule.badgeLabel || null)
        setValue('commissionType', rule.commissionType)
        setValue('commissionRate', rule.commissionRate)
        setValue('minAmount', rule.minAmount)
        setValue('maxAmount', rule.maxAmount)
        setValue('applicableFor', rule.applicableFor)
        setValue('priority', rule.priority)
        setValue('description', rule.description || '')
        setValue('status', rule.status || RuleStatus.ACTIVE)

        const commissionsMap = new Map<string, { securedRate?: number; unsecuredRate?: number }>()
        rule.lenderCommissions?.forEach((lc: any) => {
            commissionsMap.set(lc.lenderName.toLowerCase(), {
                securedRate: lc.securedRate,
                unsecuredRate: lc.unsecuredRate,
            })
        })

        const formLenders = dealLenders.map(l => {
            const matched = commissionsMap.get(l.name.toLowerCase())
            return {
                lenderName: l.name,
                securedRate: matched?.securedRate,
                unsecuredRate: matched?.unsecuredRate,
            }
        })
        setValue('lenderCommissions', formLenders)
        setIsCreateDialogOpen(true)
    }

    const handleDeleteRule = async (id: string, currentRule: any) => {
        if (!confirm(`Are you sure you want to deactivate this commission rule?\n\nRule: ${currentRule.ruleName}\n\nThis will set the rule status to INACTIVE.`)) return

        try {
            // Set status to INACTIVE instead of deleting
            // Only send fields that are part of UpdateCommissionRuleInput
            await updateRuleMutation.mutateAsync({
                id: id,
                input: {
                    status: RuleStatus.INACTIVE,
                },
            })
            toast({
                title: 'Success',
                description: 'Commission rule deactivated successfully.',
            })
            refetch()
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to deactivate commission rule.',
                variant: 'destructive',
            })
            console.error("Failed to deactivate commission rule:", error)
        }
    }

    const handleDialogClose = (open: boolean) => {
        if (!open) {
            reset()
            setEditingRule(null)
        }
        setIsCreateDialogOpen(open)
    }

    const MetricCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className={`professional-card hover-lift ${color}`}>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{title}</p>
                            <p className="text-2xl font-bold text-foreground mt-2">{value}</p>
                            {subtitle && (<p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                            )}
                        </div>
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-opacity-20`}>
                            <Icon className="w-6 h-6" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )

    const aggregatorTypeLabel = aggregatorType === AggregatorType.SOURCER ? 'Sourcer' : 'Channel Partner'
    const aggregatorTypeColor = aggregatorType === AggregatorType.SOURCER
        ? 'text-green-400'
        : 'text-orange-400'
    const aggregatorTypeBgColor = aggregatorType === AggregatorType.SOURCER
        ? 'bg-green-500/10 border-green-500/30'
        : 'bg-orange-500/10 border-orange-500/30'

    return (
        <div className="space-y-6">
            {/* Header with Context-Aware Create Button */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
                <div className="w-full md:w-auto">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground">{aggregatorTypeLabel} Commission Rules</h2>
                        {/* <Badge className={`${aggregatorTypeBgColor} ${aggregatorTypeColor} border`}>
                            {aggregatorTypeLabel}
                        </Badge> */}
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">Manage commission rules for {aggregatorTypeLabel.toLowerCase()} aggregators</p>
                </div>
                <div className="w-full md:w-auto">
                    <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogClose}>
                        <Button
                            onClick={handleCreateRuleButton}
                            className={`w-full sm:w-auto ${aggregatorType === AggregatorType.SOURCER
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-orange-600 hover:bg-orange-700'} text-white shadow-lg`}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create {aggregatorTypeLabel} Rule
                        </Button>
                        <DialogContent
                            className="bg-background border-border text-foreground max-w-3xl max-h-[90vh] overflow-y-auto"
                            onInteractOutside={(e) => e.preventDefault()}
                        >
                            <DialogHeader className="space-y-4 pb-6 border-b border-border">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="space-y-2">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                            <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground">
                                                {editingRule ? 'Edit Commission Rule' : 'Create Commission Rule'}
                                            </DialogTitle>
                                        </div>
                                        <DialogDescription className="text-sm text-muted-foreground">
                                            {editingRule
                                                ? 'Update the commission rule details and configuration'
                                                : `Set up a new commission rule for ${aggregatorTypeLabel.toLowerCase()} loan products`}
                                        </DialogDescription>
                                    </div>
                                    <Badge className={`${aggregatorTypeBgColor} ${aggregatorTypeColor} border px-3 py-1 text-sm font-medium mt-2 sm:mt-0`}>
                                        {aggregatorTypeLabel}
                                    </Badge>
                                </div>
                            </DialogHeader>

                            <form onSubmit={handleSubmit(handleCreateRule)} className="space-y-6 mt-6">
                                {/* Basic Information Card */}
                                <Card className="border-border bg-card/50">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-8 h-8 rounded-lg ${aggregatorTypeBgColor} flex items-center justify-center`}>
                                                <Info className={`w-4 h-4 ${aggregatorTypeColor}`} />
                                            </div>
                                            <div>
                                                <CardTitle className="text-foreground text-lg">Basic Information</CardTitle>
                                                <CardDescription className="text-xs">Define the rule name and target product</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Rule Name, Badge Label & Icon Selection */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <Label htmlFor="ruleName" className="text-sm font-medium">
                                                    Rule Name <span className="text-red-400">*</span>
                                                </Label>
                                                <Input
                                                    id="ruleName"
                                                    {...register("ruleName")}
                                                    className="mt-1.5 bg-background border-border focus:ring-2 focus:ring-primary/20"
                                                    placeholder="e.g., Personal Loan - Gold Tier"
                                                />
                                                {errors.ruleName && (
                                                    <p className="text-sm text-red-400 mt-1.5 flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" />
                                                        {errors.ruleName.message}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <Label htmlFor="badgeLabel" className="text-sm font-medium">
                                                    Badge Label <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
                                                </Label>
                                                <Controller
                                                    control={control}
                                                    name="badgeLabel"
                                                    render={({ field }) => (
                                                        <Select value={field.value || 'NONE'} onValueChange={(val) => {
                                                            field.onChange(val === 'NONE' ? null : val);
                                                            if (val && val !== 'NONE') {
                                                                const mappedIcon = getTierIconFromBadgeLabel(val);
                                                                setValue('icon', mappedIcon, { shouldDirty: true });
                                                            }
                                                        }}>
                                                            <SelectTrigger id="badgeLabel" className="mt-1.5 bg-background border-border h-10">
                                                                <SelectValue placeholder="No Label" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-popover border-border text-popover-foreground">
                                                                <SelectItem value="NONE" className="cursor-pointer">
                                                                    <span className="text-sm font-medium">No Label</span>
                                                                </SelectItem>
                                                                <SelectItem value="Spark" className="cursor-pointer">Spark</SelectItem>
                                                                <SelectItem value="Pulse" className="cursor-pointer">Pulse</SelectItem>
                                                                <SelectItem value="Momentum" className="cursor-pointer">Momentum</SelectItem>
                                                                <SelectItem value="Catalyst" className="cursor-pointer">Catalyst</SelectItem>
                                                                <SelectItem value="Apex" className="cursor-pointer">Apex</SelectItem>
                                                                <SelectItem value="Vanguard" className="cursor-pointer">Vanguard</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="icon" className="text-sm font-medium">
                                                    Tier Icon <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
                                                </Label>
                                                <Controller
                                                    control={control}
                                                    name="icon"
                                                    render={({ field }) => (
                                                        <Select value={field.value || 'NONE'} onValueChange={(val) => field.onChange(val === 'NONE' ? null : val)}>
                                                            <SelectTrigger id="icon" className="mt-1.5 bg-background border-border h-10">
                                                                <SelectValue placeholder="No Icon" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-popover border-border text-popover-foreground">
                                                                <SelectItem value="NONE" className="cursor-pointer">
                                                                    <span className="text-sm font-medium">No Icon</span>
                                                                </SelectItem>
                                                                <SelectItem value="BRONZE" className="cursor-pointer">
                                                                    <div className="flex items-center gap-2">
                                                                        <CustomMedalIcon tier="BRONZE" className="w-5 h-6 flex-shrink-0" />
                                                                        <span>Spark Icon</span>
                                                                    </div>
                                                                </SelectItem>
                                                                <SelectItem value="SILVER" className="cursor-pointer">
                                                                    <div className="flex items-center gap-2">
                                                                        <CustomMedalIcon tier="SILVER" className="w-5 h-6 flex-shrink-0" />
                                                                        <span>Pulse Icon</span>
                                                                    </div>
                                                                </SelectItem>
                                                                <SelectItem value="GOLD" className="cursor-pointer">
                                                                    <div className="flex items-center gap-2">
                                                                        <CustomMedalIcon tier="GOLD" className="w-5 h-6 flex-shrink-0" />
                                                                        <span>Momentum Icon</span>
                                                                    </div>
                                                                </SelectItem>
                                                                <SelectItem value="DIAMOND" className="cursor-pointer">
                                                                    <div className="flex items-center gap-2">
                                                                        <CustomMedalIcon tier="DIAMOND" className="w-5 h-6 flex-shrink-0" />
                                                                        <span>Catalyst Icon</span>
                                                                    </div>
                                                                </SelectItem>
                                                                <SelectItem value="PLATINUM" className="cursor-pointer">
                                                                    <div className="flex items-center gap-2">
                                                                        <CustomMedalIcon tier="PLATINUM" className="w-5 h-6 flex-shrink-0" />
                                                                        <span>Apex Icon</span>
                                                                    </div>
                                                                </SelectItem>
                                                                <SelectItem value="VANGUARD" className="cursor-pointer">
                                                                    <div className="flex items-center gap-2">
                                                                        <CustomMedalIcon tier="VANGUARD" className="w-5 h-6 flex-shrink-0" />
                                                                        <span>Vanguard Icon</span>
                                                                    </div>
                                                                </SelectItem>
                                                                <SelectItem value="DIAMOND_GEM" className="cursor-pointer">
                                                                    <div className="flex items-center gap-2">
                                                                        <CustomMedalIcon tier="DIAMOND_GEM" className="w-5 h-6 flex-shrink-0" />
                                                                        <span>Diamond Gem Icon (Company Use)</span>
                                                                    </div>
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Product Type */}
                                            <div>
                                                <Label htmlFor="productType" className="text-sm font-medium">
                                                    Product Type <span className="text-red-400">*</span>
                                                </Label>
                                                <Input
                                                    id="productType"
                                                    {...register("productType")}
                                                    className="mt-1.5 bg-background border-border focus:ring-2 focus:ring-primary/20"
                                                    placeholder="e.g., Personal Loan"
                                                />
                                                {errors.productType && (
                                                    <p className="text-sm text-red-400 mt-1.5 flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" />
                                                        {errors.productType.message}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Applicable For */}
                                            <div>
                                                <Label htmlFor="applicableFor" className="text-sm font-medium">
                                                    Applicable For <span className="text-red-400">*</span>
                                                </Label>
                                                <Controller
                                                    control={control}
                                                    name="applicableFor"
                                                    render={({ field }) => (
                                                        <Select value={field.value} onValueChange={field.onChange}>
                                                            <SelectTrigger id="applicableFor" className="mt-1.5 bg-background border-border">
                                                                <SelectValue placeholder="Select tier" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-popover border-border text-popover-foreground">
                                                                {Object.values(ApplicableFor).map((tier) => (
                                                                    <SelectItem key={tier} value={tier} className="cursor-pointer">
                                                                        {getApplicableForLabel(tier)}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                                {errors.applicableFor && (
                                                    <p className="text-sm text-red-400 mt-1.5 flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" />
                                                        {errors.applicableFor.message}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Commission Configuration Card */}
                                <Card className="border-border bg-card/50">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                <Percent className="w-4 h-4 text-blue-400" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-foreground text-lg">Commission Configuration</CardTitle>
                                                <CardDescription className="text-xs">Set commission type and rate</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Commission Type */}
                                            <div>
                                                <Label htmlFor="commissionType" className="text-sm font-medium">
                                                    Commission Type <span className="text-red-400">*</span>
                                                </Label>
                                                <Controller
                                                    control={control}
                                                    name="commissionType"
                                                    render={({ field }) => (
                                                        <Select value={field.value} onValueChange={field.onChange}>
                                                            <SelectTrigger id="commissionType" className="mt-1.5 bg-background border-border">
                                                                <SelectValue placeholder="Select type" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-popover border-border text-popover-foreground">
                                                                <SelectItem className='cursor-pointer' value={CommissionType.PERCENTAGE}>
                                                                    Percentage (%)
                                                                </SelectItem>
                                                                <SelectItem className='cursor-pointer' value={CommissionType.FLAT}>
                                                                    Flat Amount (₹)
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                            </div>

                                            {/* Commission Rate */}
                                            <div>
                                                <Label htmlFor="commissionRate" className="text-sm font-medium">
                                                    Commission Rate <span className="text-red-400">*</span>
                                                </Label>
                                                <div className="relative mt-1.5">
                                                    <Input
                                                        id="commissionRate"
                                                        type="number"
                                                        step="0.01"
                                                        {...register("commissionRate", { valueAsNumber: true })}
                                                        className="bg-background border-border pr-10 focus:ring-2 focus:ring-primary/20"
                                                        placeholder={commissionTypeWatch === CommissionType.PERCENTAGE ? "3.5" : "5000"}
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                                                        {commissionTypeWatch === CommissionType.PERCENTAGE ? '%' : '₹'}
                                                    </span>
                                                </div>
                                                {errors.commissionRate && (
                                                    <p className="text-sm text-red-400 mt-1.5 flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" />
                                                        {errors.commissionRate.message}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <Alert className="bg-blue-500/10 border-blue-500/30">
                                            <Info className="h-4 w-4 text-blue-400" />
                                            <AlertDescription className="text-sm text-foreground">
                                                {commissionTypeWatch === CommissionType.PERCENTAGE
                                                    ? '💡 Commission will be calculated as a percentage of the loan amount'
                                                    : '💡 Commission will be a fixed amount regardless of loan size'}
                                            </AlertDescription>
                                        </Alert>
                                    </CardContent>
                                </Card>

                                {/* Amount Range Card */}
                                <Card className="border-border bg-card/50">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                                <CreditCard className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-foreground text-lg">Applicable Amount Range</CardTitle>
                                                <CardDescription className="text-xs">Define minimum and maximum loan amounts</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Min Amount */}
                                            <div>
                                                <Label htmlFor="minAmount" className="text-sm font-medium">
                                                    Min Amount (₹) <span className="text-red-400">*</span>
                                                </Label>
                                                <Input
                                                    id="minAmount"
                                                    type="number"
                                                    {...register("minAmount", { valueAsNumber: true })}
                                                    className="mt-1.5 bg-background border-border focus:ring-2 focus:ring-primary/20"
                                                    placeholder="100,000"
                                                />
                                                {errors.minAmount && (
                                                    <p className="text-sm text-red-400 mt-1.5 flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" />
                                                        {errors.minAmount.message}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Max Amount */}
                                            <div>
                                                <Label htmlFor="maxAmount" className="text-sm font-medium">
                                                    Max Amount (₹) <span className="text-red-400">*</span>
                                                </Label>
                                                <Input
                                                    id="maxAmount"
                                                    type="number"
                                                    {...register("maxAmount", { valueAsNumber: true })}
                                                    className="mt-1.5 bg-background border-border focus:ring-2 focus:ring-primary/20"
                                                    placeholder="10,00,000"
                                                />
                                                {errors.maxAmount && (
                                                    <p className="text-sm text-red-400 mt-1.5 flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" />
                                                        {errors.maxAmount.message}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Lender-wise Commission Rates */}
                                <Card className="border-border bg-card/50">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                                                <Settings className="w-4 h-4 text-teal-400" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-foreground text-lg">Lender-wise Commission Rates</CardTitle>
                                                <CardDescription className="text-xs">Define Secured & Unsecured rates (%) for each Bank/NBFC (Optional - defaults to rule rate if blank)</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="border border-border rounded-lg overflow-hidden bg-background max-h-[300px] overflow-y-auto">
                                            <Table>
                                                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                                    <TableRow className="border-border">
                                                        <TableHead className="w-2/5 font-semibold text-foreground bg-muted/50">Lender Name</TableHead>
                                                        <TableHead className="w-1/5 font-semibold text-foreground bg-muted/50">Type</TableHead>
                                                        <TableHead className="w-1/5 font-semibold text-foreground bg-muted/50">Secured Rate (%)</TableHead>
                                                        <TableHead className="w-1/5 font-semibold text-foreground bg-muted/50">Unsecured Rate (%)</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {dealLenders.map((lender, index) => {
                                                        return (
                                                            <TableRow key={lender.id} className="border-border hover:bg-muted/30">
                                                                <TableCell className="font-medium text-foreground py-3">
                                                                    {lender.name}
                                                                </TableCell>
                                                                <TableCell className="py-3">
                                                                    <Badge variant="outline" className="capitalize text-xs py-0.5 border-border">
                                                                        {lender.type}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="py-2">
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        className="h-8 bg-background border-border text-foreground text-sm py-1 focus:ring-1"
                                                                        placeholder="Use Default"
                                                                        value={watch(`lenderCommissions.${index}.securedRate`) ?? ''}
                                                                        onChange={(e) => {
                                                                            const val = e.target.value === '' ? undefined : parseFloat(e.target.value)
                                                                            setValue(`lenderCommissions.${index}.securedRate`, val, { shouldDirty: true })
                                                                        }}
                                                                    />
                                                                </TableCell>
                                                                <TableCell className="py-2">
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        className="h-8 bg-background border-border text-foreground text-sm py-1 focus:ring-1"
                                                                        placeholder="Use Default"
                                                                        value={watch(`lenderCommissions.${index}.unsecuredRate`) ?? ''}
                                                                        onChange={(e) => {
                                                                            const val = e.target.value === '' ? undefined : parseFloat(e.target.value)
                                                                            setValue(`lenderCommissions.${index}.unsecuredRate`, val, { shouldDirty: true })
                                                                        }}
                                                                    />
                                                                </TableCell>
                                                            </TableRow>
                                                        )
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Status Field - Only shown when editing */}
                                {editingRule && (
                                    <Card className="border-border bg-card/50">
                                        <CardHeader className="pb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                    <Settings className="w-4 h-4 text-blue-400" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base">Rule Status</CardTitle>
                                                    <CardDescription className="text-xs">Activate or deactivate this commission rule</CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div>
                                                <Label htmlFor="status" className="text-sm font-medium">
                                                    Status
                                                </Label>
                                                <Controller
                                                    control={control}
                                                    name="status"
                                                    render={({ field }) => (
                                                        <Select value={field.value} onValueChange={field.onChange}>
                                                            <SelectTrigger id="status" className="mt-1.5 bg-background border-border">
                                                                <SelectValue placeholder="Select status" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-popover border-border text-popover-foreground">
                                                                <SelectItem value={RuleStatus.ACTIVE} className="cursor-pointer">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                                                        Active
                                                                    </div>
                                                                </SelectItem>
                                                                <SelectItem value={RuleStatus.INACTIVE} className="cursor-pointer">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                                                        Inactive
                                                                    </div>
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Optional: Priority & Description */}
                                {/* <Card className="border-border bg-card/50">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                            <Settings className="w-4 h-4 text-amber-400" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">Additional Settings</CardTitle>
                                            <CardDescription className="text-xs">Optional priority and description</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="priority" className="text-sm font-medium">
                                            Priority (0-100)
                                        </Label>
                                        <Input
                                            id="priority"
                                            type="number"
                                            {...register("priority", { valueAsNumber: true })}
                                            className="mt-1.5 bg-background border-border focus:ring-2 focus:ring-primary/20"
                                            placeholder="0"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1.5">Higher priority rules are applied first</p>
                                    </div>

                                    <div>
                                        <Label htmlFor="description" className="text-sm font-medium">
                                            Description
                                        </Label>
                                        <Textarea
                                            id="description"
                                            {...register("description")}
                                            className="mt-1.5 bg-background border-border focus:ring-2 focus:ring-primary/20 min-h-[80px]"
                                            placeholder="Add any additional notes or context for this commission rule..."
                                        />
                                    </div>
                                </CardContent>
                            </Card> */}

                                {/* Action Buttons */}
                                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-border">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => handleDialogClose(false)}
                                        disabled={isSubmitting}
                                        className="border-border hover:bg-muted px-6 w-full sm:w-auto"
                                    >
                                        Cancel
                                    </Button>

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`w-full sm:w-auto ${aggregatorType === AggregatorType.SOURCER
                                            ? 'bg-green-600 hover:bg-green-700'
                                            : 'bg-orange-600 hover:bg-orange-700'} text-white px-6 shadow-lg`}
                                    >
                                        {isSubmitting
                                            ? (editingRule ? "Updating..." : "Creating...")
                                            : (editingRule ? "Update Rule" : `Create ${aggregatorTypeLabel} Rule`)}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </motion.div>

            {/* Error Alert */}
            {isError && (
                <Alert className="bg-red-500/10 border-red-500/30">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-400">
                        {error?.message || 'Failed to load commission rules. Please try again.'}
                    </AlertDescription>
                </Alert>
            )}

            {/* Metrics Cards
            {isTableLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <CardSkeleton headerLines={2} bodyHeight={20} />
                    <CardSkeleton headerLines={2} bodyHeight={20} />
                    <CardSkeleton headerLines={2} bodyHeight={20} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <MetricCard
                        title="Total Rules"
                        value={metrics.totalRules}
                        icon={Settings}
                        color={aggregatorType === AggregatorType.SOURCER ? "bg-green-500/10 text-green-400" : "bg-orange-500/10 text-orange-400"}
                        subtitle="Commission rules"
                    />
                    <MetricCard
                        title="Active Rules"
                        value={metrics.activeRules}
                        icon={CreditCard}
                        color="bg-blue-500/10 text-blue-400"
                        subtitle="Currently active"
                    />
                    <MetricCard
                        title="Avg Commission Rate"
                        value={`${metrics.avgCommissionRate}%`}
                        icon={Percent}
                        color="bg-purple-500/10 text-purple-400"
                        subtitle="Platform average"
                    />
                </div>
            )} */}

            {/* Commission Rules Table */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
            >
                <Card className="bg-card border-border">
                    <CardHeader>
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                            <div className="w-full lg:w-auto">
                                <CardTitle className="text-foreground">Commission Rules</CardTitle>
                                <CardDescription className="text-muted-foreground mt-1">
                                    Manage commission rates and rules for {aggregatorTypeLabel.toLowerCase()} loan products
                                </CardDescription>
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                                <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val as RuleStatus | '')}>
                                    <SelectTrigger className="w-full sm:w-32 bg-background border-border text-foreground">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border text-popover-foreground">
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value={RuleStatus.ACTIVE}>Active</SelectItem>
                                        <SelectItem value={RuleStatus.INACTIVE}>Inactive</SelectItem>
                                        <SelectItem value={RuleStatus.ARCHIVED}>Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={filterApplicableFor} onValueChange={(val) => setFilterApplicableFor(val as ApplicableFor | '')}>
                                    <SelectTrigger className="w-full sm:w-40 bg-background border-border text-foreground">
                                        <SelectValue placeholder="Rank" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border text-popover-foreground">
                                        {Object.values(ApplicableFor).map((tier) => (
                                            <SelectItem key={tier} value={tier}>
                                                {getApplicableForLabel(tier)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div ref={tableTopRef} />
                        <div className="overflow-hidden professional-table pb-4 w-full">
                            {isTableLoading ? (
                                <TableSkeleton columns={7} rows={pageSize} />
                            ) : rulesData?.data && rulesData.data.length > 0 ? (
                                <Table className="min-w-[1000px]">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Rule Name</TableHead>
                                            <TableHead>Product Type</TableHead>
                                            <TableHead>Amount Range</TableHead>
                                            <TableHead>Commission</TableHead>
                                            <TableHead>Applicable For</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rulesData.data.map((rule, index) => (
                                            <motion.tr
                                                key={rule.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className="border-border hover:bg-card/50"
                                            >
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {(() => {
                                                            const tierIcon = rule.icon || getTierIconFromBadgeLabel(rule.badgeLabel, rule.applicableFor);
                                                            return tierIcon ? (
                                                                <CustomMedalIcon tier={tierIcon} className="w-5 h-6 flex-shrink-0" />
                                                            ) : null;
                                                        })()}
                                                        <div>
                                                            <p className="font-medium">{rule.ruleName}</p>
                                                            {rule.badgeLabel && (
                                                                <p className="text-xs text-muted-foreground">Label: {rule.badgeLabel}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="border-border text-foreground">
                                                        {rule.productType}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-foreground">
                                                    <div>
                                                        <p className="text-sm">{formatCurrency(rule.minAmount)}</p>
                                                        <p className="text-xs text-muted-foreground">to {formatCurrency(rule.maxAmount)}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-accent font-semibold">
                                                        {rule.commissionType === CommissionType.PERCENTAGE
                                                            ? `${rule.commissionRate}%`
                                                            : formatCurrency(rule.commissionRate)}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {rule.commissionType === CommissionType.PERCENTAGE ? 'Percentage' : 'Flat'}
                                                    </p>
                                                </TableCell>
                                                <TableCell className="text-foreground">
                                                    {getApplicableForLabel(rule.applicableFor)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getStatusColor(rule.status)}>
                                                        {rule.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-teal-400 hover:text-foreground hover:bg-muted rounded-lg"
                                                                    onClick={() => handleViewChart(rule)}
                                                                >
                                                                    <TrendingUp className="w-4 h-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>View Rates Chart</p>
                                                            </TooltipContent>
                                                        </Tooltip>

                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-accent hover:text-foreground hover:bg-muted rounded-lg"
                                                                    onClick={() => handleEditRule(rule)}
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Edit Rule</p>
                                                            </TooltipContent>
                                                        </Tooltip>

                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-red-300 hover:text-foreground hover:bg-red-600/20 rounded-lg"
                                                                    onClick={() => handleDeleteRule(rule.id, rule)}
                                                                    disabled={updateRuleMutation.isPending}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Deactivate Rule</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </TableCell>
                                            </motion.tr>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center py-12">
                                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground text-lg">No commission rules found</p>
                                    <p className="text-muted-foreground text-sm mt-2">Create your first commission rule to get started</p>
                                </div>
                            )}
                        </div>

                        {rulesData?.data && rulesData.data.length > 0 && (
                            <TablePagination
                                page={page}
                                pageSize={pageSize}
                                total={rulesData.total}
                                onPageChange={handlePageChange}
                                onPageSizeChange={handlePageSizeChange}
                                className="mt-4"
                            />
                        )}
                    </CardContent>
                </Card>
            </motion.div>
            {/* View Rates Chart Dialog */}
            <Dialog open={isViewChartOpen} onOpenChange={setIsViewChartOpen}>
                <DialogContent className="bg-background border-border text-foreground max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader className="border-b border-border pb-4">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-teal-400" />
                            {viewingRule?.ruleName} - Commission Rates
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Lender-wise rates configured under this tier. Product: {viewingRule?.productType}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-lg border border-border">
                            <div>
                                <p className="text-xs text-muted-foreground">Rule Base Rate</p>
                                <p className="text-sm font-semibold text-foreground">
                                    {viewingRule?.commissionType === CommissionType.PERCENTAGE
                                        ? `${viewingRule?.commissionRate}%`
                                        : formatCurrency(viewingRule?.commissionRate || 0)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Applicable For</p>
                                <p className="text-sm font-semibold text-foreground">
                                    {viewingRule && getApplicableForLabel(viewingRule.applicableFor)}
                                </p>
                            </div>
                        </div>

                        <div className="border border-border rounded-lg overflow-hidden bg-background">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow className="border-border">
                                        <TableHead className="font-semibold text-foreground">Lender Name</TableHead>
                                        <TableHead className="font-semibold text-foreground">Type</TableHead>
                                        <TableHead className="font-semibold text-foreground text-center">Secured Rate (%)</TableHead>
                                        <TableHead className="font-semibold text-foreground text-center">Unsecured Rate (%)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dealLenders.length > 0 ? (
                                        dealLenders.map((lender) => {
                                            const matched = viewingRule?.lenderCommissions?.find(
                                                (lc: any) => lc.lenderName.toLowerCase() === lender.name.toLowerCase()
                                            )
                                            return (
                                                <TableRow key={lender.id} className="border-border hover:bg-muted/30">
                                                    <TableCell className="font-medium text-foreground">
                                                        {lender.name}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="capitalize text-xs py-0.5 border-border">
                                                            {lender.type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center font-semibold text-teal-400">
                                                        {matched?.securedRate != null ? `${matched.securedRate}%` : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-center font-semibold text-orange-400">
                                                        {matched?.unsecuredRate != null ? `${matched.unsecuredRate}%` : '-'}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                                                No deal lenders found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
