"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { usersApi } from './api-client'

export type AppRole = 'super_admin' | 'aggregator_admin' | 'lender_admin'

export function useAuth(requiredRole?: AppRole | AppRole[]) {
	const router = useRouter()
	const pathname = usePathname()
	const [loading, setLoading] = useState(true)
	const [role, setRole] = useState<AppRole | null>(null)
	const [user, setUser] = useState<any>(null)

	useEffect(() => {
		async function verify() {
			const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
			if (!token) {
				router.replace(`/login?next=${encodeURIComponent(pathname)}`)
				return
			}
			try {
				const profileResp: any = await usersApi.profile()
				const fetchedRole: AppRole | undefined = profileResp?.data?.role
				setUser(profileResp?.data)
				setRole(fetchedRole || (localStorage.getItem('userRole') as AppRole | null))
				if (requiredRole) {
					const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
					if (!fetchedRole || !roles.includes(fetchedRole)) {
						router.replace('/login')
						return
					}
				}
			} catch (e) {
				localStorage.removeItem('token')
				localStorage.removeItem('userRole')
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


