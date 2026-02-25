"use client"

import { motion } from 'framer-motion'
import { Target, CheckCircle2, Activity, AlertCircle, Clock } from 'lucide-react'
import { useEmployeeAuth, getEmployeeRoleLabel } from '@/lib/employee-auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

// ── Types ──────────────────────────────────────────────────────────────────
interface MetricCard { title: string; value: string; sub: string; border: string; icon: React.ElementType; iconColor: string }
interface Activity { initials: string; initBg: string; name: string; action: string; detail: string; time: string }
interface Announcement { title: string; body: string; urgent: boolean }

// ── Role-based metric cards ────────────────────────────────────────────────
function getMetrics(rp: string): MetricCard[] {
    const base = [
        { title: 'DAYS PRESENT', value: '—', sub: 'This month', border: 'border-l-cyan-400', icon: CheckCircle2, iconColor: 'text-cyan-400' },
        { title: 'LEAVE BALANCE', value: '—', sub: 'Days remaining', border: 'border-l-blue-400', icon: Target, iconColor: 'text-blue-400' },
        { title: 'PENDING TASKS', value: '—', sub: 'Needs attention', border: 'border-l-emerald-400', icon: Activity, iconColor: 'text-emerald-400' },
        { title: 'DAYS IN SERVICE', value: '—', sub: 'Since joining', border: 'border-l-slate-400', icon: AlertCircle, iconColor: 'text-slate-400' },
    ]
    if (rp === '1') return [
        { ...base[0], title: 'TOTAL EMPLOYEES', sub: 'Across company' },
        { ...base[1], title: 'ACTIVE TODAY', sub: 'Checked in' },
        { ...base[2], title: 'PENDING ACTIONS', sub: 'Need attention' },
        { ...base[3], title: 'OPEN LEAVES', sub: 'Under review' },
    ]
    if (rp === '2') return [
        { ...base[0], title: 'TEAM MEMBERS', sub: 'In your team' },
        { ...base[1], title: 'ACTIVE TODAY', sub: 'Checked in' },
        { ...base[2], title: 'PENDING REVIEWS', sub: 'Need attention' },
        { ...base[3], title: 'TEAM LEAVES', sub: 'This month' },
    ]
    return base
}

const recentActivity: Activity[] = [
    { initials: 'RK', initBg: 'bg-blue-100 text-blue-700', name: 'Rahul Kumar', action: 'Updated case status for', detail: 'Moved from Login to Credit Assessment', time: '2 hours ago' },
    { initials: 'SM', initBg: 'bg-purple-100 text-purple-700', name: 'Sanjana Mehta', action: 'Submitted daily report for', detail: 'Daily performance summary uploaded', time: '3 hours ago' },
    { initials: 'AP', initBg: 'bg-green-100 text-green-700', name: 'Ajay Patel', action: 'Leave request approved for', detail: '2 days casual leave approved', time: '5 hours ago' },
]

const announcements: Announcement[] = [
    { title: 'End of Month Push!', body: "All disbursements must be logged by 5 PM Friday to count for this month's incentive.", urgent: true },
    { title: 'New KYC Policy', body: 'Please ensure Aadhaar masking is enabled on all uploads starting today.', urgent: false },
]

// ── Metric Card ────────────────────────────────────────────────────────────
function MetricCard({ card, delay }: { card: MetricCard; delay: number }) {
    const Icon = card.icon
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.35 }}
            className={`bg-card border border-border ${card.border} border-l-4 rounded-xl px-5 py-4 flex items-start justify-between gap-4 shadow-sm`}
        >
            <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase mb-3">
                    {card.title}
                </p>
                {/* Dashed divider line like the screenshot */}
                <div className="border-t border-dashed border-border mb-3" />
                <p className="text-2xl font-bold text-foreground leading-none mb-1">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
            </div>
            <div className={`${card.iconColor} opacity-40 flex-shrink-0 mt-1`}>
                <Icon className="w-7 h-7" strokeWidth={1.5} />
            </div>
        </motion.div>
    )
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function F2FintechEmployeeDashboard() {
    const { employee } = useEmployeeAuth()
    if (!employee) return null

    const rp = employee.role ?? '3'
    const roleLabel = getEmployeeRoleLabel(rp)
    const fullName = `${employee.first_name} ${employee.last_name}`.trim()
    const initials = fullName.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()
    const metrics = getMetrics(rp)

    return (
        <div className="space-y-6 max-w-7xl mx-auto">

            {/* ── Welcome Banner ──────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
                <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 rounded-full ring-2 ring-primary/20 flex-shrink-0">
                        <AvatarImage src={employee.image || ''} alt={fullName} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground leading-tight">
                            Welcome back, <span className="text-primary">{employee.first_name}</span>
                        </h1>
                        <p className="text-sm text-muted-foreground">Here's your performance overview for today.</p>
                    </div>
                </div>

                {/* Role badges — top right, matching screenshot */}
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    <Badge variant="outline" className="gap-1.5 text-xs font-medium px-3 py-1">
                        {employee.designation}
                    </Badge>
                    <Badge className="text-xs font-medium px-3 py-1">
                        {roleLabel}
                    </Badge>
                    {employee.code && (
                        <Badge variant="secondary" className="font-mono text-xs px-3 py-1">
                            #{employee.code}
                        </Badge>
                    )}
                </div>
            </motion.div>

            {/* ── 4 Metric Cards ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {metrics.map((card, i) => (
                    <MetricCard key={card.title} card={card} delay={i * 0.08} />
                ))}
            </div>

            {/* ── Activity + Announcements ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

                {/* Recent Activity */}
                <motion.div
                    className="lg:col-span-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.35 }}
                >
                    <div className="bg-card border border-border rounded-xl shadow-sm h-full">
                        {/* Card header matching the screenshot — icon + title */}
                        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
                            <Activity className="w-4 h-4 text-primary" />
                            <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
                        </div>
                        <div className="divide-y divide-border">
                            {recentActivity.map((item, i) => (
                                <div key={i} className="flex items-start gap-3 px-5 py-4">
                                    {/* Initials avatar */}
                                    <div className={`w-8 h-8 rounded-full ${item.initBg} text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                        {item.initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-foreground leading-snug">
                                            {item.action}{' '}
                                            <span className="font-semibold text-primary hover:underline cursor-pointer">{item.name}</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                                        <p className="text-xs text-muted-foreground/60 mt-1.5 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />{item.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Team Announcements */}
                <motion.div
                    className="lg:col-span-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45, duration: 0.35 }}
                >
                    <div className="bg-card border border-border rounded-xl shadow-sm h-full">
                        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                            <h2 className="text-sm font-semibold text-foreground">Team Announcements</h2>
                        </div>
                        <div className="divide-y divide-border">
                            {announcements.map((item, i) => (
                                <div key={i} className="flex items-start gap-3 px-5 py-4">
                                    {/* Checkbox-style indicator matching the screenshot */}
                                    <div className={`flex-shrink-0 mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center ${item.urgent ? 'border-primary bg-primary/10' : 'border-muted-foreground/30'
                                        }`}>
                                        {item.urgent && (
                                            <svg className="w-2.5 h-2.5 text-primary" viewBox="0 0 10 10" fill="none">
                                                <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.body}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* ── Info Strip ──────────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                className="flex flex-wrap gap-5 text-xs text-muted-foreground pt-1"
            >
                {employee.company_id && (
                    <span className="flex items-center gap-1.5">
                        <span className="text-muted-foreground/50">⊞</span>
                        Company: <span className="font-mono text-foreground/70">{employee.company_id}</span>
                    </span>
                )}
                {employee.code && (
                    <span className="flex items-center gap-1.5">
                        <span className="text-muted-foreground/50">⊟</span>
                        Code: <span className="font-mono text-foreground/70">{employee.code}</span>
                    </span>
                )}
                <span className="flex items-center gap-1.5">
                    <span className="text-muted-foreground/50">@</span>
                    <span className="text-foreground/70">{employee.email}</span>
                </span>
            </motion.div>
        </div>
    )
}
