"use client"

import { motion } from 'framer-motion'
import { Mail, Briefcase, Calendar, User, Building } from 'lucide-react'

import { useEmployeeAuth, getEmployeeRoleLabel } from '@/lib/employee-auth'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

function ProfileField({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
    return (
        <div className="flex items-center gap-3 py-3">
            <div className="p-2 bg-muted rounded-lg flex-shrink-0"><Icon className="w-4 h-4 text-muted-foreground" /></div>
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
                <p className="text-sm font-medium text-foreground truncate">{value || '—'}</p>
            </div>
        </div>
    )
}

export default function EmployeeProfilePage() {
    const { employee } = useEmployeeAuth()
    if (!employee) return null

    const fullName = `${employee.first_name} ${employee.last_name}`.trim()
    const roleLabel = getEmployeeRoleLabel(employee.role ?? '3')
    const initials = fullName.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
                <p className="text-sm text-muted-foreground mt-1">Your HRMS employee information</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
                <Card className="enhanced-card">
                    <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6">
                            <Avatar className="h-20 w-20 rounded-2xl ring-2 ring-primary/20">
                                <AvatarImage src={employee.image || ''} alt={fullName} />
                                <AvatarFallback className="rounded-2xl bg-primary/10 text-primary text-2xl font-bold">{initials}</AvatarFallback>
                            </Avatar>
                            <div className="text-center sm:text-left">
                                <h2 className="text-xl font-bold text-foreground">{fullName}</h2>
                                <p className="text-sm text-muted-foreground">{employee.designation}</p>
                                <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start flex-wrap">
                                    <Badge variant="secondary">{roleLabel}</Badge>
                                    {employee.code && <Badge variant="outline" className="font-mono text-xs">#{employee.code}</Badge>}
                                </div>
                            </div>
                        </div>

                        <Separator className="mb-4" />

                        <div className="divide-y divide-border">
                            <ProfileField icon={Mail} label="Email" value={employee.email} />
                            <ProfileField icon={Building} label="Company ID" value={employee.company_id} />
                            <ProfileField icon={Briefcase} label="Designation" value={employee.designation} />
                            <ProfileField icon={User} label="Role" value={roleLabel} />
                            <ProfileField icon={User} label="Employee Code" value={employee.code} />
                            <ProfileField icon={Calendar} label="Joining Date" value={employee.joining_date} />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
