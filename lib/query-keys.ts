// Query key factory for type-safe query keys
export const queryKeys = {
    // Users
    users: {
        all: ['users'] as const,
        profile: () => [...queryKeys.users.all, 'profile'] as const,
        byRole: (role: string, page?: number, limit?: number) =>
            [...queryKeys.users.all, 'role', role, { page, limit }] as const,
        list: (page?: number, limit?: number, status?: string) =>
            [...queryKeys.users.all, 'list', { page, limit, status }] as const,
    },

    // Aggregators
    aggregators: {
        all: ['aggregators'] as const,
        list: (page?: number, limit?: number) =>
            [...queryKeys.aggregators.all, 'list', { page, limit }] as const,
        detail: (id: string) => [...queryKeys.aggregators.all, 'detail', id] as const,
        myProfile: () => [...queryKeys.aggregators.all, 'my-profile'] as const,
        byKycStatus: (status: string, page?: number, limit?: number) =>
            [...queryKeys.aggregators.all, 'kyc-status', status, { page, limit }] as const,
        search: (term: string, page?: number, limit?: number) =>
            [...queryKeys.aggregators.all, 'search', term, { page, limit }] as const,
    },

    // Lenders
    lenders: {
        all: ['lenders'] as const,
        list: (page?: number, limit?: number) =>
            [...queryKeys.lenders.all, 'list', { page, limit }] as const,
        detail: (id: string) => [...queryKeys.lenders.all, 'detail', id] as const,
        myProfile: () => [...queryKeys.lenders.all, 'my-profile'] as const,
        byKycStatus: (status: string, page?: number, limit?: number) =>
            [...queryKeys.lenders.all, 'kyc-status', status, { page, limit }] as const,
        byType: (type: string, page?: number, limit?: number) =>
            [...queryKeys.lenders.all, 'type', type, { page, limit }] as const,
        search: (term: string, page?: number, limit?: number) =>
            [...queryKeys.lenders.all, 'search', term, { page, limit }] as const,
    },

    // Lender Branches
    branches: {
        all: ['branches'] as const,
        list: (page?: number, limit?: number) =>
            [...queryKeys.branches.all, 'list', { page, limit }] as const,
        detail: (id: string) => [...queryKeys.branches.all, 'detail', id] as const,
        byLender: (lenderId: string, page?: number, limit?: number) =>
            [...queryKeys.branches.all, 'lender', lenderId, { page, limit }] as const,
        myBranches: (page?: number, limit?: number) =>
            [...queryKeys.branches.all, 'my-branches', { page, limit }] as const,
        byStatus: (status: string, page?: number, limit?: number) =>
            [...queryKeys.branches.all, 'status', status, { page, limit }] as const,
        byLocation: (city?: string, state?: string, page?: number, limit?: number) =>
            [...queryKeys.branches.all, 'location', { city, state, page, limit }] as const,
        search: (term: string, page?: number, limit?: number) =>
            [...queryKeys.branches.all, 'search', term, { page, limit }] as const,
    },

    // Applications
    applications: {
        all: ['applications'] as const,
        list: (filters?: {
            page?: number
            limit?: number
            aggregatorId?: string
            lenderId?: string
            productId?: string
            status?: string
        }) => [...queryKeys.applications.all, 'list', filters] as const,
    },

    // Products
    products: {
        all: ['products'] as const,
        list: (page?: number, limit?: number, lenderId?: string) =>
            [...queryKeys.products.all, 'list', { page, limit, lenderId }] as const,
        myAssigned: (page?: number, limit?: number) =>
            [...queryKeys.products.all, 'my-assigned', { page, limit }] as const,
        assignedAggregators: (productId: string) =>
            [...queryKeys.products.all, 'assigned-aggregators', productId] as const,
    },

    // Commissions
    commissions: {
        all: ['commissions'] as const,
        list: (page?: number, limit?: number, aggregatorId?: string) =>
            [...queryKeys.commissions.all, 'list', { page, limit, aggregatorId }] as const,
    },

    // KYC
    kyc: {
        all: ['kyc'] as const,
        get: () => [...queryKeys.kyc.all, 'get'] as const,
    },

    // Settings
    settings: {
        all: ['settings'] as const,
        get: () => [...queryKeys.settings.all, 'get'] as const,
    },
} as const
