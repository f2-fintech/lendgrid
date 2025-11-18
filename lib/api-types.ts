// API RESPONSE TYPES
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  page?: number
  count?: number
  error?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  message?: string
  results: T[]
  count: number
  page: number
  pages: number
}

export interface CreateResponse<T> {
  success: boolean
  message: string
  data?: T
}

// ENUMS
export enum KYCStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum BusinessType {
  PROPRIETORSHIP = 'proprietorship',
  PARTNERSHIP = 'partnership',
  PRIVATE_LIMITED = 'private_limited',
  PUBLIC_LIMITED = 'public_limited',
  LLP = 'llp',
}

export enum LenderType {
  BANK = 'bank',
  NBFC = 'nbfc',
  FINTECH = 'fintech',
}

export enum Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
}

// USER & AUTH TYPES
export type AppRole = 'super_admin' | 'aggregator_admin' | 'lender_admin'

export interface User {
  _id: string
  username: string
  email: string
  role: string
  contact?: string
  companyName?: string
  gender?: string
  address?: string
  pincode?: string
  profilePicture?: string
  status?: string
  loginHistory?: string[]
  createdAt?: string
  updatedAt?: string
}

// DOCUMENT TYPES
export type AggregatorDocuments = {
  panCard?: string
  gstCertificate?: string
  incorporationCertificate?: string
  bankStatement?: string
  cancelledCheque?: string
  addressProof?: string
  authorizedSignatory?: string
}

export type LenderDocuments = {
  panCard?: string
  gstCertificate?: string
  incorporationCertificate?: string
  rbiLicense?: string
  boardResolution?: string
  authorizedSignatory?: string
}

// PROFILE TYPES
export type AggregatorProfile = {
  approvedApplications: number
  conversionRate: number
  _id: string
  userId: string
  companyName: string
  businessType?: BusinessType
  registeredAddress?: string
  city?: string
  state?: string
  pincode?: string
  gstNumber?: string
  panNumber?: string
  tanNumber?: string
  cinNumber?: string
  websiteUrl?: string
  pocName?: string
  documents?: AggregatorDocuments
  kycStatus?: KYCStatus
  kycRejectionReason?: string
  kycApprovedAt?: string
  kycApprovedBy?: string
  bankName?: string
  accountNumber?: string
  ifscCode?: string
  accountHolderName?: string
  isBankVerified?: boolean
  teamMembers?: string[]
  totalApplicationsSubmitted?: number
  totalCommissionEarned?: number
  totalPaidOut?: number
  pendingPayout?: number
  deletedAt?: string
  createdAt: string
  updatedAt: string
  // Populated fields
  user?: User
  kycApprovedByUser?: User
  teamMemberUsers?: User[]
}

export type LenderProfile = {
  _id: string
  userId: string
  lenderName: string
  lenderType?: LenderType
  registeredAddress?: string
  city?: string
  state?: string
  pincode?: string
  gstNumber?: string
  panNumber: string
  tanNumber?: string
  cinNumber?: string
  rbiLicenseNumber?: string
  websiteUrl?: string
  pocName?: string
  documents?: LenderDocuments
  kycStatus?: KYCStatus
  kycRejectionReason?: string
  kycApprovedAt?: string
  kycApprovedBy?: string
  branches?: string[]
  totalApplicationsReceived?: number
  totalDisbursedAmount?: number
  totalCommissionPaid?: number
  pendingCommissionPayouts?: number
  deletedAt?: string
  createdAt: string
  updatedAt: string
  // Populated fields
  user?: User
  kycApprovedByUser?: User
}

export type LenderBranch = {
  _id: string
  lenderId: string
  branchName: string
  branchCode?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  contactPerson?: string
  contactEmail?: string
  contactPhone?: string
  managerId?: string
  status?: Status
  deletedAt?: string
  createdAt: string
  updatedAt: string
  // Populated fields
  lender?: LenderProfile
  manager?: User
}

// APPLICATION TYPES
export interface Application {
  _id: string
  aggregatorId: string
  lenderId: string
  productId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  loanAmount: number
  status: string
  documents: string[]
  formData?: Record<string, any>
  disbursedAmount?: number
  disbursedDate?: string
  commissionRate: number
  expectedCommission: number
  rejectionReason?: string
  createdAt: string
  updatedAt: string
  // Populated fields
  aggregator?: {
    _id: string
    username: string
    email: string
    companyName?: string
  }
  lender?: {
    _id: string
    username: string
    email: string
    companyName?: string
    lenderType?: string
  }
  product?: {
    _id: string
    name: string
    productType: string
    interestRate: number
    commissionPercent: number
    minAmount: number
    maxAmount: number
  }
}

// PRODUCT TYPES
export type Product = {
  _id: string
  name: string
  lenderName?: string
  description?: string
  productType: string
  interestRate: number
  commissionPercent: number
  minAmount: number
  maxAmount: number
  loanTerm: number
  tenure?: string
  eligibilityCriteria?: string[]
  requiredDocuments?: string[]
  isActive: boolean
  lender?: User
  createdAt?: string
  updatedAt?: string
}

export type ProductSummary = {
  _id: string
  name: string
  lenderName?: string
  interestRate: number
  maxAmount: number
  productType: string
  isActive: boolean
}

export type CreateProductDto = {
  lenderId?: string
  lenderName?: string
  name: string
  description?: string
  productType: string
  interestRate: number
  commissionPercent: number
  minAmount: number
  maxAmount: number
  loanTerm: number
  tenure?: string
  eligibilityCriteria?: string[]
  requiredDocuments?: string[]
  isActive?: boolean
}

// COMMISSION & PAYOUT TYPES
export interface Commission {
  id: string
  applicationId: string
  amount: number
  percentage: number
  status: 'Pending' | 'Paid' | 'Disputed'
  paidDate?: string
  aggregatorId: string
  lenderId: string
}

export interface Payout {
  id: string
  amount: number
  status: 'Pending' | 'Approved' | 'Rejected'
  requestDate: string
  approvalDate?: string
  utrNumber?: string
  comments?: string
  aggregatorId: string
  lenderId: string
}
