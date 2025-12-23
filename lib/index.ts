/**
 * LendGrid API Client
 * 
 * Main entry point for all API modules
 */

// Export HTTP clients
export { apiFetch, gqlFetch } from './http-client'

// Export all types and enums
export * from './api-types'

// Export API modules
export { aggregatorProfileApi } from './aggregator-api'
export { lenderProfileApi, lenderBranchApi } from './lender-api'
export { usersApi } from './users-api'
export { applicationsApi } from './applications-api'
export { productsApi, productAssignmentsApi } from './products-api'
export { commissionsApi } from './commission-api'
export { kycApi, settingsApi } from './misc-apis'
