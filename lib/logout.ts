import { useRouter } from 'next/navigation';

import { gqlFetch } from '@/lib/http-client';
import { deleteCookie } from '@/lib/utils';

export function useLogout() {
	const router = useRouter();

	return async () => {
		try {
			await gqlFetch({
				query: `mutation { logout }`,
			});
		} catch { }

		deleteCookie('lendgrid_cookie');

		localStorage.clear();
		router.replace('/login');
	};
}
