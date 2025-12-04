"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { usersApi } from './users-api'
import { decodeJwt } from './utils'

export type AppRole = 'super_admin' | 'aggregator_admin' | 'aggregator_member' | 'lender_admin'

export function useAuth(requiredRole?: AppRole | AppRole[]) {
	const router = useRouter()
	const pathname = usePathname()
	const [loading, setLoading] = useState(true)
	const [role, setRole] = useState<AppRole | null>(null)
	const [user, setUser] = useState<any>(null)

	useEffect(() => {
		async function verify() {
			const cookieStr = typeof document !== 'undefined' ? document.cookie : ''
			const tokenMatch = cookieStr?.split('; ').find(c => c.startsWith('token='))
			const token = tokenMatch ? decodeURIComponent(tokenMatch.split('=')[1]) : null

			if (!token) {
				router.replace(`/login?next=${encodeURIComponent(pathname)}`)
				return
			}

			try {
				const decoded: any = decodeJwt(token)
				const decodedRole = decoded?.role?.toLowerCase?.()
				if (decodedRole) setRole(decodedRole as AppRole)

				const profileResp: any = await usersApi.profile()
				const fetchedRole = profileResp?.profile?.role?.toLowerCase?.() as AppRole | undefined

				setUser(profileResp?.profile)
				if (fetchedRole) setRole(fetchedRole)

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
					document.cookie = 'token=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax'
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
