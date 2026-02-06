import { useRouter } from 'next/navigation';

import { gqlFetch } from '@/lib/http-client';

export function useLogout() {
	const router = useRouter();

	return async () => {
		try {
			await gqlFetch({
				query: `mutation { logout }`,
			});
		} catch { }

		document.cookie =
			'token=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax';

		localStorage.clear();
		router.replace('/login');
	};
}
