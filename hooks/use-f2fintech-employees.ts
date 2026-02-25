import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCookie } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { f2fintechEmployeesApi } from '@/lib/f2fintech-employees-api'

// ============================================================================
// EMPLOYEE LOGIN HOOK
// ============================================================================

/**
 * React Query mutation hook for HRMS employee login.
 *
 * Calls the GraphQL `loginEmployee` mutation on lendgrid-server.
 * Stores the JWT as `employee_token` cookie (separate from the user `token`).
 *
 * @example
 * ```tsx
 * const loginEmployee = useEmployeeLogin();
 * const result = await loginEmployee.mutateAsync({ email, password });
 * const { token, employee } = result.loginEmployee;
 * ```
 */
export function useEmployeeLogin() {
    const { toast } = useToast()

    return useMutation({
        mutationFn: (payload: { email: string; password: string }) =>
            f2fintechEmployeesApi.login(payload),

        onSuccess: (data) => {
            const result = data?.loginEmployee
            if (result?.success && result?.token) {
                // Store employee token separately from user token to avoid conflicts
                document.cookie = `employee_token=${encodeURIComponent(result.token)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`
            }
        },

        onError: (error: Error) => {
            toast({
                title: 'Login Failed',
                description: error.message || 'Unable to login. Please try again.',
                variant: 'destructive',
            })
        },
    })
}

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Employee data structure from HRMS API
 */
export interface F2FintechEmployee {
    _id: string
    first_name: string
    last_name: string
    email: string
    work_email: string
    contact: string
    emergencycontact?: string
    relation_name?: string
    relation?: string
    role_priority: string
    manager_id?: string | null
    dob: string
    gender: string
    designation: string
    password: string
    joining_date: string
    leaving_date: string
    status: 'active' | 'inactive' | 'on leave' | 'suspended' | 'probation'
    image?: string
    code: string
    location: string
    bio: string
    company_id: string
    createdAt: string
    updatedAt: string
    __v: number
}

/**
 * Transformed employee for component consumption
 */
export interface TransformedEmployee {
    employeeId: string
    name: string
    email: string
    phone: string
    role: string
    department: string
    status: string
    joinDate: string
    avatar: string | null
    address: string
    emergencyContact: string
    salary: number
    panNumber: string
    workEmail: string
    dob: string
    gender: string
    location: string
    bio: string
    code: string
}

/**
 * Hook parameters for fetching employees
 */
interface UseF2FintechEmployeesParams {
    limit?: number
    search?: string
    designation?: string
    enabled?: boolean
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

const API_BASE_URL = 'https://hrms.f2fintech.in'

/**
 * Transform API employee data to component format
 */
function transformEmployee(employee: F2FintechEmployee): TransformedEmployee {
    return {
        employeeId: employee.code || employee._id,
        name: `${employee.first_name} ${employee.last_name}`.trim(),
        email: employee.email,
        workEmail: employee.work_email,
        phone: employee.contact,
        role: employee.designation,
        department: employee.designation, // Using designation as department for now
        status: employee.status,
        joinDate: employee.joining_date,
        avatar: employee.image || null,
        address: employee.location || '',
        emergencyContact: employee.emergencycontact || '',
        salary: 0, // Not provided by API
        panNumber: '', // Not provided by API
        dob: employee.dob,
        gender: employee.gender,
        location: employee.location,
        bio: employee.bio,
        code: employee.code,
    }
}

/**
 * Fetch employees from HRMS API
 */
async function fetchEmployeesPage({
    pageParam = 1,
    limit = 12,
    search = '',
    designation = '',
}: {
    pageParam?: number
    limit?: number
    search?: string
    designation?: string
}): Promise<{ employees: TransformedEmployee[]; nextPage: number | undefined }> {
    // Build query parameters
    const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: limit.toString(),
        search: search,
        designation: designation,
    })

    const url = `${API_BASE_URL}/employees/get?${params.toString()}`

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2YmI1ZWVkMmYxMjcwMzgwYjc3YTgxMyIsImVtYWlsIjoiaHJAZjJmaW50ZWNoLmNvbSIsInJvbGUiOiIxIiwiZGVzaWduYXRpb24iOiJBc3Npc3RhbnQgTWFuYWdlciBIciIsInBhc3N3b3JkIjoiJDJiJDEwJC92N0ltUHZ6bFA2dURKdVRQdGYvdHVnckkyN2pkeXJ6eGc1UzZTZnppTE9sOXFEL2NUZ1pDIiwiaW1hZ2UiOiJodHRwczovL2YyZmludGVjaC1ocm1zLnMzLmV1LW5vcnRoLTEuYW1hem9uYXdzLmNvbS9lbXBsb3llZXMvZjIlMjBpbWFnZS5qcGVnIiwiZmlyc3RfbmFtZSI6IkYyIiwibGFzdF9uYW1lIjoiRmludGVjaCIsImNvZGUiOiJGMDE5Iiwiam9pbmluZ19kYXRlIjoiMjAyNC0wOC0xMyIsImNvbXBhbnlfaWQiOiI2NzYxNTZmNDY1OTU2YzYwYjZjYWZhNzIiLCJpYXQiOjE3NzA3OTM1NjMsImV4cCI6MTc3MTA1Mjc2M30.EkuDmXNqjFH4IKRCvkaWUiJEcPNE39bqguNidgI8s7I 676156f465956c60b6cafa72`,
            'Content-Type': 'application/json',
        },
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch employees: ${response.status} ${errorText}`)
    }

    const data: F2FintechEmployee[] = await response.json()

    // Transform the data
    const employees = data.map(transformEmployee)

    // Determine if there are more pages
    const hasMore = data.length === limit
    const nextPage = hasMore ? pageParam + 1 : undefined

    return { employees, nextPage }
}

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

/**
 * Fetch F2Fintech employees with infinite scroll pagination
 * 
 * @example
 * ```tsx
 * const { 
 *   data,
 *   fetchNextPage,
 *   hasNextPage,
 *   isFetchingNextPage,
 *   isLoading
 * } = useF2FintechEmployeesInfinite({
 *   limit: 12,
 *   search: 'john',
 *   designation: 'Software Engineer'
 * })
 * 
 * // Access all employees
 * const allEmployees = data?.pages.flatMap(page => page.employees) ?? []
 * ```
 */
export function useF2FintechEmployeesInfinite({
    limit = 12,
    search = '',
    designation = '',
    enabled = true,
}: UseF2FintechEmployeesParams = {}) {
    return useInfiniteQuery({
        queryKey: ['f2fintech-employees-infinite', { limit, search, designation }],
        queryFn: ({ pageParam = 1 }) => fetchEmployeesPage({ pageParam, limit, search, designation }),
        getNextPageParam: (lastPage) => lastPage.nextPage,
        initialPageParam: 1,
        enabled,
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 2,
    })
}

/**
 * Delete employee mutation (placeholder - implement when API is available)
 */
export function useDeleteF2FintechEmployee() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: async (employeeId: string) => {
            const token = getCookie('token')
            if (!token) throw new Error('Authentication token not found')

            // TODO: Implement delete API call when endpoint is available
            throw new Error('Delete employee API not yet implemented')
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['f2fintech-employees-infinite'] })
            toast({
                title: 'Success',
                description: 'Employee deleted successfully',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete employee',
                variant: 'destructive',
            })
        },
    })
}

/**
 * Update employee mutation (placeholder - implement when API is available)
 */
export function useUpdateF2FintechEmployee() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: async (payload: { id: string; data: Partial<TransformedEmployee> }) => {
            const token = getCookie('token')
            if (!token) throw new Error('Authentication token not found')

            // TODO: Implement update API call when endpoint is available
            throw new Error('Update employee API not yet implemented')
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['f2fintech-employees-infinite'] })
            toast({
                title: 'Success',
                description: 'Employee updated successfully',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update employee',
                variant: 'destructive',
            })
        },
    })
}
