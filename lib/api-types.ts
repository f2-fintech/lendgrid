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
  UNDER_CREDIT_REVIEW = 'under_credit_review',
  OPERATIONS = 'operations',
  PENDENCY_IN_FILE = 'pendency_in_file',
  FILE_SEND_TO_BANKER = 'file_send_to_banker',
  TO_BE_APPROVED = 'to_be_approved',
  APPROVED = 'approved',
  TO_BE_DISBURSED = 'to_be_disbursed',
  DISBURSED = 'disbursed',
  REJECTED = 'rejected',
  DROP = 'drop',
  HOLD = 'hold',
  SUBMITTED = 'submitted'
}

export enum CommissionType {
  PERCENTAGE = 'PERCENTAGE',
  FLAT = 'FLAT',
}

export enum RuleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum CommissionStatus {
  PENDING = 'PENDING',
  CALCULATED = 'CALCULATED',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
}

export enum ApplicableFor {
  ALL_AGGREGATORS = 'ALL_AGGREGATORS',
  BRONZE_AGGREGATORS = 'BRONZE_AGGREGATORS',
  SILVER_AGGREGATORS = 'SILVER_AGGREGATORS',
  GOLD_AGGREGATORS = 'GOLD_AGGREGATORS',
  PLATINUM_AGGREGATORS = 'PLATINUM_AGGREGATORS',
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
  aadhaarNumber?: string
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
export interface WorkHistoryEntry {
  action: string;
  comment: string;
  timestamp: string;
  updatedBy?: string | null;
}

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
  tenure?: number | null
  status: string

  // Files
  documents: string[]

  // Disbursal Information
  approvedAmount?: number | null
  approvedDate?: string | null
  disbursedAmount?: number | null
  disbursedDate?: string | null

  // Admin audit actions
  platformCommission?: number
  rejectedBy?: string | null
  rejectionReason?: string | null
  workHistory?: WorkHistoryEntry[];
  createdBy?: string | null;
  updatedBy?: string | null;
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
  tenure?: number
  interestRate: string
  commissionPercent: number
  processingFeePercent?: number
  ageRange?: string
  minIncome?: number
  minCreditScore?: string
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
  tenure?: number
  interestRate: string
  commissionPercent: number
  processingFeePercent?: number
  ageRange?: string
  minIncome?: number
  minCreditScore?: string
  requiredDocuments?: string[]
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
  lender?: {
    profile: {
      _id: string;
      lenderName?: string;
      lenderType?: string;
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
  tenure?: number
  interestRate: string
  commissionPercent: number
  processingFeePercent?: number
  ageRange?: string,
  minIncome?: number,
  minCreditScore?: string,
  requiredDocuments?: string[]
  isActive?: boolean
}

// COMMISSION & PAYOUT TYPES
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

export interface CommissionRule {
  id: string;
  ruleName: string;
  productType: string;
  commissionType: CommissionType;
  commissionRate: number;
  minAmount: number;
  maxAmount: number;
  applicableFor: ApplicableFor;
  status: RuleStatus;
  priority: number;
  description?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    username: string;
    email: string;
  };
  updatedBy?: {
    id: string;
    username: string;
    email: string;
  };
}

export interface CommissionTransaction {
  id: string;
  ticketId: number;
  aggregatorId: string;
  ruleId: string;
  disbursedAmount: number;
  disbursedDate: string;
  commissionAmount: number;
  commissionType: CommissionType;
  commissionRate: number;
  status: CommissionStatus;
  aggregatorRank?: ApplicableFor;
  provider: string;
  productType: string;
  calculatedAt: string;
  approvedAt?: string;
  paidAt?: string;
  paymentReference?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
  aggregator?: {
    id: string;
    username: string;
    email: string;
  };
  rule?: {
    id: string;
    ruleName: string;
    commissionType: CommissionType;
  };
  approvedBy?: {
    id: string;
    username: string;
  };
  paidBy?: {
    id: string;
    username: string;
  };
}

export interface CreateCommissionRuleInput {
  ruleName: string;
  productType: string;
  commissionType: CommissionType;
  commissionRate: number;
  minAmount: number;
  maxAmount: number;
  applicableFor: ApplicableFor;
  priority?: number;
  description?: string;
  effectiveFrom?: Date;
  effectiveTo?: Date;
}

export interface UpdateCommissionRuleInput {
  ruleName?: string;
  commissionRate?: number;
  minAmount?: number;
  maxAmount?: number;
  status?: RuleStatus;
  description?: string;
  priority?: number;
}

export interface CalculateCommissionInput {
  ticketId: number;
  disbursedAmount: number;
}

export interface UpdateCommissionStatusInput {
  status: CommissionStatus;
  paymentReference?: string;
  remarks?: string;
}

export interface CommissionRuleFilterInput {
  productType?: string;
  status?: RuleStatus;
  applicableFor?: ApplicableFor;
}

export interface CommissionTransactionFilterInput {
  aggregatorId?: string;
  status?: CommissionStatus;
  productType?: string;
}

export interface PaginatedCommissionRules {
  success: boolean;
  message: string;
  data: CommissionRule[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PaginatedCommissionTransactions {
  success: boolean;
  message: string;
  data: CommissionTransaction[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface CommissionRuleResponse {
  success: boolean;
  message: string;
  data?: CommissionRule;
}

export interface CommissionTransactionResponse {
  success: boolean;
  message: string;
  data?: CommissionTransaction;
}
