"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { decodeJwt } from './utils'

// ── Role mapping ─────────────────────────────────────────────────────────────
export type EmployeeRolePriority = '1' | '2' | '3'

export const EMPLOYEE_ROLE_LABELS: Record<EmployeeRolePriority, string> = {
    '1': 'Admin',
    '2': 'Manager',
    '3': 'Employee',
}

export function getEmployeeRoleLabel(priority: string): string {
    return EMPLOYEE_ROLE_LABELS[priority as EmployeeRolePriority] ?? 'Employee'
}

/** All role_priority values land on the same dashboard route */
export function getEmployeeDashboardPath(): string {
    return '/f2fintech-employee'
}

// ── Employee token helpers ───────────────────────────────────────────────────
export function getEmployeeToken(): string | null {
    if (typeof document === 'undefined') return null
    const value = `; ${document.cookie}`
    const parts = value.split(`; employee_token=`)
    if (parts.length === 2) {
        return decodeURIComponent(parts.pop()!.split(';').shift() || '') || null
    }
    return null
}

export function clearEmployeeToken() {
    document.cookie = 'employee_token=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax'
}

// ── Employee decoded type ────────────────────────────────────────────────────
export interface DecodedEmployee {
    id: string
    email: string
    role: EmployeeRolePriority   // role_priority from HRMS
    designation: string
    first_name: string
    last_name: string
    image?: string
    code?: string
    company_id?: string
    joining_date?: string
    type: 'hrms_employee'
    iat?: number
    exp?: number
}

// ── useEmployeeAuth hook ─────────────────────────────────────────────────────
/**
 * Auth hook for HRMS employees.
 * Reads `employee_token` cookie — completely separate from the `useAuth` hook
 * that reads the `token` cookie for regular lendgrid users.
 *
 * Redirects to /login if no valid token is found.
 */
export function useEmployeeAuth() {
    const router = useRouter()
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [employee, setEmployee] = useState<DecodedEmployee | null>(null)

    useEffect(() => {
        const token = getEmployeeToken()

        if (!token) {
            router.replace(`/login`)
            return
        }

        try {
            const decoded = decodeJwt(token) as DecodedEmployee

            // Validate it's an HRMS employee token
            if (!decoded || decoded.type !== 'hrms_employee') {
                clearEmployeeToken()
                router.replace('/login')
                return
            }

            // Check expiry
            if (decoded.exp && decoded.exp * 1000 < Date.now()) {
                clearEmployeeToken()
                router.replace('/login')
                return
            }

            setEmployee(decoded)
        } catch {
            clearEmployeeToken()
            router.replace('/login')
        } finally {
            setLoading(false)
        }
    }, [])  // eslint-disable-line react-hooks/exhaustive-deps

    return { loading, employee }
}
