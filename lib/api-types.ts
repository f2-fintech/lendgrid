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

export enum ProductType {
  PERSONAL_LOAN = 'personal_loan',
  BUSINESS_LOAN = 'business_loan',
  HOME_LOAN = 'home_loan',
  EDUCATION_LOAN = 'education_loan',
  AUTO_LOAN = 'auto_loan',
  MACHINERY_LOAN = 'machinery_loan',
  DOCTOR_LOAN = 'doctor_loan',
  CA_LOAN = 'ca_loan',
  LAP = 'lap',
  JUST_ENQUIRY = 'just_enquiry'
}

export enum Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
}

export enum ApplicationStatus {
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DISBURSED = 'disbursed',
  CANCELLED = 'cancelled'
}

// USER & AUTH TYPES
export type AppRole = 'super_admin' | 'aggregator_admin' | 'lender_admin'

export interface User {
  _id: string
  username: string
  email: string
  role: string
  contact?: string
  photoUrl?: string
  status?: string
  loginHistory?: string[]
  createdAt?: string
  updatedAt?: string
}

// DOCUMENT TYPES
export type AggregatorDocuments = {
  aadhaarFront?: string;
  aadhaarBack?: string;
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

  // IDs
  aggregatorId: string
  lenderId: string
  productId: string

  // Populated references
  aggregator?: User
  lender?: User
  product?: Product

  // Customer Details
  customerName: string
  customerEmail: string
  customerPhone: string
  customerPan?: string | null
  customerAddress?: string | null
  customerCity?: string | null
  customerState?: string | null
  customerPincode?: string | null

  // Loan Details
  loanAmount: number
  tenureMonths?: number | null
  status: string

  // Files
  documents: string[]

  // Stored JSON snapshot
  formData?: Record<string, any> | null

  // Disbursal Information
  approvedAmount?: number | null
  disbursedAmount?: number | null
  disbursedDate?: string | null

  // Commission Details
  commissionPercent?: number
  platformCommission?: number
  rejectionReason?: string | null

  // Admin actions
  rejectedBy?: string | null
  cancellationReason?: string | null
  cancelledBy?: string | null
  createdAt: string
  updatedAt: string
}

// PRODUCT TYPES
export type Product = {
  _id: string
  name: string
  lenderName?: string
  description?: string
  productType: string
  minAmount: number
  maxAmount: number
  tenureMonths?: string
  interestRate: number
  commissionPercent: number
  processingFeePercent?: number
  ageRange?: string
  minIncome?: number
  minCreditScore?: number
  requiredDocuments?: string[]
  isActive: boolean
  lender?: User
  createdAt?: string
  updatedAt?: string
}

export type ProductSummary = {
  _id: string
  lenderId?: string
  name: string
  description?: string
  productType: string
  minAmount: number
  maxAmount: number
  tenureMonths?: string
  interestRate: number
  commissionPercent: number
  processingFeePercent?: number
  ageRange?: string
  minIncome?: number
  minCreditScore?: number
  requiredDocuments?: string[]
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
  lender?: {
    profile: {
      _id: string;
      lenderName?: string;
      lenderType?: string;
      companyName?: string;
      gstNumber?: string;
      address?: string;
    };
    user: {
      _id: string;
      username?: string;
      email?: string;
      status?: string;
    };
  };
}

export type CreateProductDto = {
  lenderId?: string
  lenderName?: string
  name: string
  description?: string
  productType: string
  minAmount: number
  maxAmount: number
  tenureMonths?: string
  interestRate: number
  commissionPercent: number
  processingFeePercent?: number
  ageRange?: string,
  minIncome?: number,
  minCreditScore?: number
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
