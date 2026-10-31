"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { usersApi } from './users-api'
import { decodeJwt } from './utils'

export type AppRole = 'super_admin' | 'aggregator_admin' | 'aggregator_member' | 'lender_admin' | 'lendgrid_sales'

export function useAuth(requiredRole?: AppRole | AppRole[]) {
	const router = useRouter()
	const pathname = usePathname()
	const [loading, setLoading] = useState(true)
	const [role, setRole] = useState<AppRole | null>(null)
	const [user, setUser] = useState<any>(null)

	useEffect(() => {
		async function verify() {
			const cookieStr = typeof document !== 'undefined' ? document.cookie : ''
			const tokenMatch = cookieStr?.split('; ').find(c => c.startsWith('lendgrid_cookie='))
			const token = tokenMatch ? decodeURIComponent(tokenMatch.split('=')[1]) : null

			if (!token) {
				// If an employee_token is present, let DashboardLayout handle it — don't redirect
				const hasEmployeeToken = cookieStr?.split('; ').some(c => c.startsWith('employee_token='))
				if (hasEmployeeToken) {
					setLoading(false)
					return
				}
				router.replace(`/login?next=${encodeURIComponent(pathname)}`)
				return
			}

			try {
				const decoded: any = decodeJwt(token)
				
				const isOms = decoded?.source === 'oms';
				const rawRole = decoded?.role?.toLowerCase();

				// Map OMS roles to Lendgrid roles (any OMS staff belongs to lendgrid_sales workspace)
				const mapRole = (r: string): AppRole => {
					const lower = r?.toLowerCase()
					if (isOms || lower === 'sales' || lower === 'sub_admin') return 'lendgrid_sales'
					return lower as AppRole
				}

				const decodedRole = decoded?.role ? mapRole(decoded.role) : (isOms ? 'lendgrid_sales' : null)
				if (decodedRole) setRole(decodedRole)

				let fetchedRole = undefined;

				// Bypass usersApi.profile for OMS staff as they don't exist in Lendgrid DB
				if (isOms || decodedRole === 'lendgrid_sales') {
					setUser({
						username: decoded?.username || decoded?.name || decoded?.first_name || 'OMS Staff',
						email: decoded?.email || '',
						role: decoded?.role,
						omsRole: rawRole,
						isSales: rawRole === 'sales',
						omsUserId: decoded?.id || decoded?.sub,
						source: 'oms',
					});
					fetchedRole = 'lendgrid_sales';
				} else {
					const profileResp: any = await usersApi.profile()
					fetchedRole = profileResp?.profile?.role ? mapRole(profileResp.profile.role) : undefined

					setUser(profileResp?.profile)
					if (fetchedRole) setRole(fetchedRole)
				}

				if (requiredRole) {
					const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
					const effectiveRole = fetchedRole || decodedRole

					if (!effectiveRole || !roles.includes(effectiveRole)) {
						router.replace('/login')
						return
					}
				}
			} catch (e) {
				if (typeof document !== 'undefined') {
					document.cookie = 'lendgrid_cookie=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax'
				}
				router.replace('/login')
				return
			} finally {
				setLoading(false)
			}
		}

		verify()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return { loading, role, user }
}
