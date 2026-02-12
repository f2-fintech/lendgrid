'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
    Search, Plus, Eye, Edit, Trash2, User, Clock, Phone, Mail,
    Calendar, Building2, X, Users, Shield, Briefcase, MapPin,
    LayoutGrid, List, BadgeCheck, Ban, UserCog, Hash, CreditCard,
    IdCard
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
import { CardSkeleton, TableSkeleton } from '@/components/ui/loading-skeleton'
import { TablePagination } from '@/components/ui/pagination'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { AddEmployeeDialog } from './dialogs/Addf2EmployeeDialog'
import { useF2FintechEmployeesInfinite, type TransformedEmployee } from '@/hooks/use-f2fintech-employees'
import { useF2FintechDesignations } from '@/hooks/use-f2fintech-designations'

// Employee Status Configuration
const STATUS_STYLE: Record<string, string> = {
    "active": "bg-green-500/20 text-green-300 border-green-500/30",
    "inactive": "bg-gray-500/20 text-gray-300 border-gray-500/30",
    "on leave": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    "suspended": "bg-red-500/20 text-red-300 border-red-500/30",
    "probation": "bg-blue-500/20 text-blue-300 border-blue-500/30",
};

const STATUS_META: Record<string, { icon: JSX.Element }> = {
    "active": { icon: <BadgeCheck size={16} /> },
    "inactive": { icon: <Ban size={16} /> },
    "on leave": { icon: <Clock size={16} /> },
    "suspended": { icon: <Shield size={16} /> },
    "probation": { icon: <UserCog size={16} /> },
};

export const pretty = (v: string) => v?.toLowerCase()?.replace(/_/g, " ");

export const getStatusIcon = (status: string) =>
    STATUS_META[pretty(status)]?.icon || <User size={16} />;

// Info Components
const InfoItem = ({ icon: Icon, label, value, color }: {
    icon: React.ElementType,
    label: string,
    value: string | number,
    color: string
}) => (
    <div className="flex flex-col items-center justify-center p-4 bg-card/50 rounded-lg">
        <Icon className={`w-8 h-8 ${color} mb-2`} />
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground">{value}</p>
    </div>
);

// EMPLOYEE CARD COMPONENT
interface EmployeeCardProps {
    employee: any;
}

const EmployeeCard = ({ employee }: EmployeeCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-card/50 border border-border rounded-lg overflow-hidden hover:border-gold/50 transition-all duration-300 hover:shadow-lg hover:shadow-gold/10"
        >
            <div className="p-6">
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Employee ID</p>
                        <p className="text-foreground font-bold text-lg">{employee.employeeId}</p>
                    </div>
                    <Badge
                        className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border",
                            STATUS_STYLE[pretty(employee.status)]
                        )}
                    >
                        {getStatusIcon(employee.status)}
                        <span className="capitalize">{pretty(employee.status)}</span>
                    </Badge>
                </div>

                {/* Employee Info */}
                <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-border">
                    <Avatar className="w-12 h-12">
                        <AvatarImage src={employee.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-card text-foreground">
                            {employee.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-foreground font-semibold truncate">{employee.name}</p>
                        <p className="text-muted-foreground text-sm truncate">{employee.email}</p>
                    </div>
                </div>

                {/* Details Section */}
                <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Briefcase className="w-4 h-4" />
                            <span>Role</span>
                        </div>
                        <p className="text-foreground font-medium text-sm capitalize">{employee.role}</p>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Building2 className="w-4 h-4" />
                            <span>Department</span>
                        </div>
                        <p className="text-foreground text-sm">{employee.department}</p>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Phone className="w-4 h-4" />
                            <span>Phone</span>
                        </div>
                        <p className="text-foreground text-sm">{employee.phone}</p>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Calendar className="w-4 h-4" />
                            <span>Joined</span>
                        </div>
                        <p className="text-foreground text-sm">{employee.joinDate}</p>
                    </div>
                </div>

            </div>
        </motion.div>
    );
};

// TABLE ROW COMPONENT
interface EmployeeTableRowProps {
    employee: any;
    index: number;
}

const EmployeeTableRow = ({ employee, index }: EmployeeTableRowProps) => {
    return (
        <motion.tr
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="border-border hover:bg-card/50 transition-colors"
        >
            <TableCell>
                <div className="flex items-center gap-2">
                    <p className="font-medium">{employee.employeeId}</p>
                </div>
            </TableCell>
            <TableCell>
                <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                        <AvatarImage src={employee.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-card text-foreground text-xs">
                            {employee.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-muted-foreground text-sm">{employee.email}</p>
                    </div>
                </div>
            </TableCell>
            <TableCell>
                <p className="text-foreground font-medium capitalize">{employee.role}</p>
            </TableCell>
            <TableCell>
                <p className="text-foreground">{employee.department}</p>
            </TableCell>
            <TableCell>
                <Badge
                    className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border",
                        STATUS_STYLE[pretty(employee.status)]
                    )}
                >
                    {getStatusIcon(employee.status)}
                    <span className="capitalize">{pretty(employee.status)}</span>
                </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
                {employee.joinDate}
            </TableCell>
        </motion.tr>
    );
};

// GRID VIEW COMPONENT
interface EmployeesGridProps {
    employees: any[];
    isLoading: boolean;
}

const EmployeesGrid = ({ employees, isLoading }: EmployeesGridProps) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <CardSkeleton key={i} headerLines={2} bodyHeight={200} />
                ))}
            </div>
        );
    }

    if (!employees || employees.length === 0) {
        return (
            <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">No employees found</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((employee) => (
                <EmployeeCard
                    key={employee.employeeId}
                    employee={employee}
                />
            ))}
        </div>
    );
};

// MAIN COMPONENT
export function SuperAdminFintechEmployees() {
    const { user } = useAuth('super_admin')
    const { toast } = useToast()

    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [filterDepartment, setFilterDepartment] = useState('')
    const [filterStatus, setFilterStatus] = useState('')

    const [selectedEmployee, setSelectedEmployee] = useState<TransformedEmployee | null>(null)
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        role: '',
        department: '',
        status: 'active',
        joinDate: ''
    })

    const tableTopRef = useRef<HTMLDivElement | null>(null)

    // Debounce search input (500ms delay)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm)
        }, 500)

        return () => clearTimeout(timer)
    }, [searchTerm])

    // Fetch employees using infinite scroll
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error,
        refetch
    } = useF2FintechEmployeesInfinite({
        limit: 12,
        search: debouncedSearch,
        designation: filterDepartment && filterDepartment !== 'all' ? filterDepartment : '',
    })

    // Flatten all pages into single array
    const allEmployees = useMemo(() => {
        return data?.pages.flatMap(page => page.employees) ?? []
    }, [data])

    // Client-side status filtering (since API doesn't support it)
    const filteredEmployees = useMemo(() => {
        if (!filterStatus || filterStatus === 'all') return allEmployees
        return allEmployees.filter(emp => emp.status === filterStatus)
    }, [allEmployees, filterStatus])

    // Show error toast if API fails
    useEffect(() => {
        if (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to fetch employees',
                variant: 'destructive',
            })
        }
    }, [error, toast])

    // Infinite scroll handler
    const handleScroll = useCallback(() => {
        if (typeof window === 'undefined') return

        const scrollHeight = document.documentElement.scrollHeight
        const scrollTop = document.documentElement.scrollTop
        const clientHeight = document.documentElement.clientHeight

        // Load more when user is 500px from bottom
        if (scrollHeight - scrollTop - clientHeight < 500) {
            if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage()
            }
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage])

    // Attach scroll listener
    useEffect(() => {
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [handleScroll])



    const handleUpdateEmployee = async () => {
        try {
            // Add your update employee API call here
            toast({ title: 'Success', description: 'Employee updated successfully' })
            setIsEditDialogOpen(false)
        } catch (e: any) {
            toast({
                title: 'Error',
                description: e?.message || 'Failed to update employee',
                variant: 'destructive'
            })
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this employee?')) return
        try {
            // Add your delete employee API call here
            toast({ title: 'Success', description: 'Employee deleted successfully.' })
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Failed to delete employee.',
                variant: 'destructive',
            })
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount)
    }

    // Extract unique departments/designations from employees
    // Fetch designations from API
    const { data: designations = [] } = useF2FintechDesignations()

    const statuses = ['active', 'inactive', 'on leave', 'suspended', 'probation']

    return (
        <div className="space-y-6">
            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4"
            >
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-background/50 border-border text-foreground"
                    />
                </div>
                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                    <SelectTrigger className="w-48 bg-background/50 border-border text-foreground">
                        <SelectValue placeholder="Select Designation" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Designations</SelectItem>
                        {designations.map((designation) => (
                            <SelectItem key={designation._id} value={designation.title}>
                                {designation.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

            </motion.div>

            {/* Employees Table/Grid with View Toggle */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
            >
                <Card className="professional-card">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="h-12 rounded-lg flex items-center justify-center text-blue">
                                <Users className="w-6 h-6 mr-3" />
                                <div>
                                    <CardTitle className="text-foreground mb-1">F2fintech Employees</CardTitle>
                                    <CardDescription className="text-muted-foreground">
                                        Manage and track employee information
                                    </CardDescription>
                                </div>
                            </div>
                            {/* VIEW TOGGLE BUTTONS */}
                            <div className="flex items-center gap-2 border rounded-lg p-1 bg-muted/30">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant={viewMode === 'table' ? 'default' : 'ghost'}
                                            size="sm"
                                            onClick={() => setViewMode('table')}
                                            className={`${viewMode === 'table'
                                                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-foreground'
                                                : 'text-muted-foreground hover:text-foreground'
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
                                                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-foreground'
                                                : 'text-muted-foreground hover:text-foreground'
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
                            <div className="overflow-x-auto professional-table">
                                {isLoading ? (
                                    <TableSkeleton columns={7} rows={12} />
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Employee ID</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Department</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Join Date</TableHead>

                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredEmployees.map((employee, index) => (
                                                <EmployeeTableRow
                                                    key={employee.employeeId}
                                                    employee={employee}
                                                    index={index}
                                                />
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>
                        ) : (
                            // GRID VIEW
                            <EmployeesGrid
                                employees={filteredEmployees}
                                isLoading={isLoading}
                            />
                        )}

                        {/* Loading indicator for infinite scroll */}
                        {isFetchingNextPage && (
                            <div className="flex justify-center py-8">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                                    <span>Loading more employees...</span>
                                </div>
                            </div>
                        )}

                        {/* End of list indicator */}
                        {!hasNextPage && filteredEmployees.length > 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>You've reached the end of the list</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* View Employee Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent
                    className="bg-background border border-border text-foreground max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
                    onInteractOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                >
                    {selectedEmployee && (
                        <>
                            <DialogHeader className="border-b border-border/50 pb-4 flex justify-between items-center">
                                <div>
                                    <DialogTitle className="text-2xl font-bold text-foreground">
                                        Employee Details
                                    </DialogTitle>
                                    <DialogDescription className="text-muted-foreground text-sm">
                                        Complete information about this employee
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
                                {/* Status and Employee ID Section */}
                                <div className="flex gap-3 justify-between items-start flex-wrap">
                                    <div className="flex flex-wrap gap-2">
                                        <Badge
                                            className={`${STATUS_STYLE[pretty(selectedEmployee.status)]} border px-4 py-1.5 text-sm font-semibold`}
                                        >
                                            {pretty(selectedEmployee.status)}
                                        </Badge>
                                        <Badge className="bg-primary/20 text-primary border border-primary/30 px-4 py-1.5 text-sm font-semibold">
                                            ID: {selectedEmployee.employeeId}
                                        </Badge>
                                        <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-4 py-1.5 text-sm font-semibold">
                                            {selectedEmployee.department}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Personal Information Card */}
                                <div className="bg-card/50 rounded-lg p-6 border border-border backdrop-blur-sm">
                                    <h3 className="text-lg font-semibold mb-4 text-primary flex items-center gap-2">
                                        <User className="w-5 h-5" />
                                        Personal Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-blue-500/10 p-2 rounded-lg mt-1">
                                                <User className="w-4 h-4 text-blue-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-muted-foreground mb-1">Full Name</p>
                                                <p className="text-foreground font-semibold">{selectedEmployee.name}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div className="bg-green-500/10 p-2 rounded-lg mt-1">
                                                <Mail className="w-4 h-4 text-green-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-muted-foreground mb-1">Email Address</p>
                                                <p className="text-foreground font-semibold break-all">{selectedEmployee.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div className="bg-purple-500/10 p-2 rounded-lg mt-1">
                                                <Phone className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-muted-foreground mb-1">Contact Number</p>
                                                <p className="text-foreground font-semibold">{selectedEmployee.phone}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div className="bg-amber-500/10 p-2 rounded-lg mt-1">
                                                <CreditCard className="w-4 h-4 text-amber-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-muted-foreground mb-1">PAN Number</p>
                                                <p className="text-foreground font-semibold font-mono">{selectedEmployee.panNumber}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 md:col-span-2">
                                            <div className="bg-cyan-500/10 p-2 rounded-lg mt-1">
                                                <MapPin className="w-4 h-4 text-cyan-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-muted-foreground mb-1">Address</p>
                                                <p className="text-foreground font-semibold">{selectedEmployee.address}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Employment Details Card */}
                                <div className="bg-card/50 rounded-lg p-6 border border-border backdrop-blur-sm">
                                    <h3 className="text-lg font-semibold mb-4 text-cyan-400 flex items-center gap-2">
                                        <Briefcase className="w-5 h-5" />
                                        Employment Details
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div className="bg-muted/50 rounded-lg p-4 border border-border">
                                            <p className="text-xs text-muted-foreground mb-2">Role</p>
                                            <p className="text-xl font-bold text-primary capitalize">{selectedEmployee.role}</p>
                                        </div>

                                        <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                                            <p className="text-xs text-muted-foreground mb-2">Department</p>
                                            <p className="text-xl font-bold text-cyan-400">{selectedEmployee.department}</p>
                                        </div>

                                        <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                                            <p className="text-xs text-muted-foreground mb-2">Join Date</p>
                                            <p className="text-xl font-bold text-purple-400">{selectedEmployee.joinDate}</p>
                                        </div>

                                        <div className="bg-background/50 rounded-lg p-4 border border-border/50 md:col-span-3">
                                            <p className="text-xs text-muted-foreground mb-2">Annual Salary</p>
                                            <p className="text-xl font-bold text-emerald-400">{formatCurrency(selectedEmployee.salary)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Emergency Contact Card */}
                                <div className="bg-card/50 rounded-lg p-6 border border-border backdrop-blur-sm">
                                    <h3 className="text-lg font-semibold mb-4 text-amber-400 flex items-center gap-2">
                                        <Phone className="w-5 h-5" />
                                        Emergency Contact
                                    </h3>
                                    <div className="flex items-center gap-3 bg-muted/50 p-4 rounded-lg border border-border">
                                        <Phone className="w-5 h-5 text-red-400" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Emergency Number</p>
                                            <p className="text-foreground font-semibold text-lg">{selectedEmployee.emergencyContact}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Create Employee Dialog */}
            <AddEmployeeDialog
                isOpen={isCreateDialogOpen}
                onClose={() => setIsCreateDialogOpen(false)}
                refetch={() => {
                    // Refetch employees after creating new one
                    refetch()
                }}
            />

            {/* Edit Employee Dialog - Similar to Create */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="bg-background border-border max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Edit Employee</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Update employee details
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-foreground">Full Name</Label>
                                <Input
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="bg-card border-border text-foreground mt-2"
                                />
                            </div>
                            <div>
                                <Label className="text-foreground">Email</Label>
                                <Input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="bg-card border-border text-foreground mt-2"
                                />
                            </div>
                            <div>
                                <Label className="text-foreground">Phone</Label>
                                <Input
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    className="bg-card border-border text-foreground mt-2"
                                />
                            </div>
                            <div>
                                <Label className="text-foreground">Role</Label>
                                <Input
                                    value={form.role}
                                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                                    className="bg-card border-border text-foreground mt-2"
                                />
                            </div>
                            <div>
                                <Label className="text-foreground">Department</Label>
                                <Input
                                    value={form.department}
                                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                                    className="bg-card border-border text-foreground mt-2"
                                />
                            </div>
                            <div>
                                <Label className="text-foreground">Status</Label>
                                <Select value={form.status} onValueChange={(val) => setForm({ ...form, status: val })}>
                                    <SelectTrigger className="bg-card border-border text-foreground mt-2">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statuses.map((status) => (
                                            <SelectItem key={status} value={status} className="capitalize">
                                                {pretty(status)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsEditDialogOpen(false)}
                            className="border-border text-foreground hover:bg-card"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdateEmployee}
                            className="bg-gradient-to-r from-blue-600 to-cyan-500 text-foreground"
                        >
                            Update Employee
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
