import { useQuery } from '@tanstack/react-query'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Designation {
    _id: string
    title: string
    description: string
    grade: number | null
    company_id: string
    createdAt: string
    updatedAt: string
    __v: number
}

interface DesignationsResponse {
    designations: Designation[]
    total: number
    page: string
    limit: string
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

const API_BASE_URL = 'https://hrms.f2fintech.in'

/**
 * Fetch all designations from HRMS API
 */
async function fetchDesignations(): Promise<Designation[]> {
    const url = `${API_BASE_URL}/designation/get?page=1&limit=0&keyword=`

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2YmI1ZWVkMmYxMjcwMzgwYjc3YTgxMyIsImVtYWlsIjoiaHJAZjJmaW50ZWNoLmNvbSIsInJvbGUiOiIxIiwiZGVzaWduYXRpb24iOiJBc3Npc3RhbnQgTWFuYWdlciBIciIsInBhc3N3b3JkIjoiJDJiJDEwJC92N0ltUHZ6bFA2dURKdVRQdGYvdHVnckkyN2pkeXJ6eGc1UzZTZnppTE9sOXFEL2NUZ1pDIiwiaW1hZ2UiOiJodHRwczovL2YyZmludGVjaC1ocm1zLnMzLmV1LW5vcnRoLTEuYW1hem9uYXdzLmNvbS9lbXBsb3llZXMvZjIlMjBpbWFnZS5qcGVnIiwiZmlyc3RfbmFtZSI6IkYyIiwibGFzdF9uYW1lIjoiRmludGVjaCIsImNvZGUiOiJGMDE5Iiwiam9pbmluZ19kYXRlIjoiMjAyNC0wOC0xMyIsImNvbXBhbnlfaWQiOiI2NzYxNTZmNDY1OTU2YzYwYjZjYWZhNzIiLCJpYXQiOjE3NzA3OTM1NjMsImV4cCI6MTc3MTA1Mjc2M30.EkuDmXNqjFH4IKRCvkaWUiJEcPNE39bqguNidgI8s7I 676156f465956c60b6cafa72`,
            'Content-Type': 'application/json',
        },
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch designations: ${response.status} ${errorText}`)
    }

    const data: DesignationsResponse = await response.json()

    // Sort designations alphabetically by title
    return data.designations.sort((a, b) =>
        a.title.toLowerCase().localeCompare(b.title.toLowerCase())
    )
}

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

/**
 * Fetch all designations for the dropdown filter
 * 
 * @example
 * ```tsx
 * const { data: designations = [], isLoading } = useF2FintechDesignations()
 * ```
 */
export function useF2FintechDesignations() {
    return useQuery({
        queryKey: ['f2fintech-designations'],
        queryFn: fetchDesignations,
        staleTime: 1000 * 60 * 30, // 30 minutes (designations don't change often)
        retry: 2,
    })
}
