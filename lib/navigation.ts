export const navigationPaths = {
  // Public routes
  home: '/',
  login: '/login',
  signup: '/signup',
  forgotPassword: '/forgot-password',
  deleteAccount: '/delete-account',

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
    settings: '/super-admin/settings',
    f2fintechEmployees: '/super-admin/f2fintech-employees',
    salesUsers: '/super-admin/sales-users',
    deletionRequests: '/super-admin/deletion-requests'
  },

  aggregator: {
    dashboard: '/aggregator',
    products: '/aggregator/products',
    commission: '/aggregator/commission',
    reports: '/aggregator/reports',
    applications: '/aggregator/applications',
    training: '/aggregator/training',
    team: '/aggregator/team',
    settings: '/aggregator/settings',
    deletionRequests: '/aggregator/deletion-requests'
  },

  // Aggregator Member routes
  aggregatorMember: {
    // dashboard: '/aggregator-member',
    // products: '/aggregator-member/products',
    applications: '/aggregator-member/applications',
    // settings: '/aggregator-member/settings'
  },

  // Lender routes
  lender: {
    dashboard: '/lender',
    products: '/lender/products',
    insights: '/lender/insights',
    applications: '/lender/applications',
    payouts: '/lender/payouts',
    settings: '/lender/settings'
  },

  // F2Fintech Employee routes (role_priority 1/2/3)
  f2fintechEmployee: {
    dashboard: '/f2fintech-employee',
    profile: '/f2fintech-employee/profile',
    performance: '/f2fintech-employee/performance',
  },

  // Lendgrid Sales (OMS) routes
  lendgridSales: {
    dashboard: '/lendgrid-sales',
  }
}

export const getNavigationByRole = (role: string) => {
  switch (role) {
    case 'super_admin':
      return navigationPaths.superAdmin
    case 'aggregator_admin':
      return navigationPaths.aggregator
    case 'lendgrid_sales':
      return navigationPaths.lendgridSales
    case 'aggregator_member':
      return navigationPaths.aggregatorMember
    default:
      return navigationPaths.home
  }
}
