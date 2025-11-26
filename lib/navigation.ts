export const navigationPaths = {
  // Public routes
  home: '/',
  login: '/login',
  signup: '/signup',
  forgotPassword: '/forgot-password',

  // Super Admin routes
  superAdmin: {
    dashboard: '/super-admin',
    revenue: '/super-admin/revenue',
    analytics: '/super-admin/analytics',
    lenders: '/super-admin/lenders',
    lendersProfile: '/super-admin/lenders/profile',
    products: '/super-admin/lenders/products',
    aggregators: '/super-admin/aggregators',
    aggregatorsProfile: '/super-admin/aggregators/profile',
    commission: '/super-admin/commission',
    payouts: '/super-admin/payouts',
    settings: '/super-admin/settings'
  },

  // Aggregator routes
  aggregator: {
    dashboard: '/aggregator',
    products: '/aggregator/products',
    commission: '/aggregator/commission',
    reports: '/aggregator/reports',
    applications: '/aggregator/applications',
    settings: '/aggregator/settings'
  },

  // Lender routes
  lender: {
    dashboard: '/lender',
    products: '/lender/products',
    insights: '/lender/insights',
    applications: '/lender/applications',
    payouts: '/lender/payouts',
    settings: '/lender/settings'
  }
}

export const getNavigationByRole = (role: string) => {
  switch (role) {
    case 'super_admin':
      return navigationPaths.superAdmin
    case 'aggregator_admin':
      return navigationPaths.aggregator
    default:
      return navigationPaths.home
  }
}
