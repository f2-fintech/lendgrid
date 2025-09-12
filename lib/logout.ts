"use client"

import { useRouter } from 'next/navigation'

export function useLogout() {
	const router = useRouter()
	return () => {
		if (typeof document !== 'undefined') {
			document.cookie = 'token=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax'
		}
		router.replace('/login')
	}
}


