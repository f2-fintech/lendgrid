/**
 * formConstants.ts
 *
 * Centralized repository of static labels, field configurations,
 * loan-type document lists, and helper resolvers across the multi-step apply flow.
 * Synced with f2fintech-admin (OMS).
 */

export interface LoanTypeOption {
  value: string;
  label: string;
}

export interface LoanTypesData {
  unsecured: LoanTypeOption[];
  secured: LoanTypeOption[];
}

export const LOAN_TYPES_DATA: LoanTypesData = {
  unsecured: [
    { value: "personal loan", label: "Personal Loan" },
    { value: "business loan", label: "Business Loan" },
    { value: "doctor", label: "Doctor (MBBS, BDS, BAMS, BHMS) Loan" },
    { value: "ca_cs_cma", label: "CA/CS/CMA Loan" },
    { value: "education loan", label: "Education Loan" },
    { value: "just inquiry", label: "Just Inquiry" },
  ],
  secured: [
    { value: "home loan", label: "Home Loan" },
    { value: "lap", label: "LAP (Loan Against Property)" },
    { value: "auto loan", label: "Auto Loan" },
    { value: "machinery loan", label: "Machinery Loan" },
  ],
};

export const BUSINESS_ENTITY_OPTIONS = [
  { value: "sole_proprietorship", label: "Sole Proprietorship" },
  { value: "private_limited", label: "Private Limited" },
  { value: "llp", label: "Limited Liability Partnership (LLP)" },
  { value: "huf", label: "HUF (Hindu Undivided Family)" },
  { value: "partnership", label: "Partnership" },
];

export const STEP2_FIELD_LABELS: Record<string, string> = {
  form16: "Form 16 (Last 2 Years – Part A & Part B)",
  itr: "ITR (Last 2 Financial Years)",
  salarySlip: "3 Months Salary Slip",
  banking: "Banking (Multiple Files)",
  computationOfIncome: "Computation of Income (Last 2 Financial Years)",
  financials: "Financials (Profit & Loss Statement & Balance Sheet - Last 2 Years)",
  udhyamCertificate: "Udyam Registration / Shop & Establishment Act Registration",
  udhyam: "Udyam Registration Certificate",
  gst: "GST Registration Certificate & Returns (Optional)",
  gstCertificate: "GST Registration Certificate",
  form26as: "Form 26AS (Last 2 Financial Years) (Optional)",
  listOfDirectors: "List of Directors (LOD)",
  listOfShareholders: "List of Shareholders",
  aoa: "Articles of Association (AOA)",
  moa: "Memorandum of Association (MOA)",
  companyPan: "Company PAN Card",
  companyFirmPan: "Company / Firm PAN Card",
  certificateOfIncorporation: "Certificate of Incorporation",
  boardResolution: "Board Resolution (BR)",
  llpAgreement: "LLP Agreement / Articles of Association",
  directorsKyc: "Directors KYC",
  partnershipDeed: "Partnership Deed",
  ugCertificate: "UG Certificate (MBBS, BDS, BAMS, BHMS)",
  pgCertificate: "PG Certificate (MD, MS, MCH) (Optional)",
  registration: "Registration",
  currentAddressProof: "Address Proof for Current Address",
  permanentAddressProof: "Address Proof for Permanent Address",
  hufDeed: "Deed of HUF / HUF Declaration",
  hufPan: "HUF PAN Card",
  bbaAts: "BBA and ATS (Builder Buyer Agreement / Agreement To Sell)",
  propertySalesDeed: "Property Sales DEED (In case of Resale)",
  sanctionLetter: "Sanction Letter (In case of Balance Transfer) (Optional)",
  soa: "SOA - Statement of Account (In case of Balance Transfer) (Optional)",
  copyRegistry: "Copy of Registry",
  salesDeed: "Sales Deed",
  gpa: "GPA / Power of Attorney",
  marksheets: "Marksheets (10th, 12th, Grad)",
  collegeOfferLetter: "College Offer Letter",
  feeStructure: "Fee Structure Document",
  entranceScorecard: "Entrance Exam Scorecard (Optional)",
  cancelledCheque: "Applicant Bank Cancelled Cheque",
  coAppAadhaar: "Co-Applicant Aadhaar Card",
  coAppPan: "Co-Applicant PAN Card",
  coAppCancelledCheque: "Co-Applicant Bank Cancelled Cheque",
  coAppForm16: "Form 16 Part A-B (2 Yrs)",
  coAppSalarySlips: "3 Months Salary Slips",
  coAppIdCard: "Company / Govt ID Card",
  ugDegree: "UG Degree (MBBS, BDS, BAMS, BHMS)",
  ugRegistration: "UG Registration Certificate",
  pgDegree: "PG Degree (MD, MS, MCH) (Optional)",
  pgRegistration: "PG Registration Certificate (Optional)",
  consultancyLetter: "Consultancy Letter",
  clinicLetterHead: "Doctor / Clinic Letter Head",
  coi: "Certificate of Incorporation (COI) (Optional)",
  udyam: "Udyam Registration Certificate (Optional)",
  copCertificate: "Certificate of Practice (COP)",
  comCertificate: "Certificate of Membership (COM)",
  firmCard: "Firm Card",
  letterHead: "Letter Head",
  itrCoi: "2 Yrs ITR & Computation (COI)",
  udyamShopReg: "Udyam & Shop Registration",
  proformaInvoice: "Vehicle Proforma Invoice / Dealer Quotation",
  drivingLicense: "Driving License / RC Copy (Optional)",
  machineryQuotation: "Machinery Quotation / Proforma Invoice",
  projectReport: "Project Report / Machine Installation Layout (Optional)",
};

// ── Loan-Type Document Field Sets ──────────────────────────────────────────

export const PERSONAL_LOAN_FIELDS: string[] = [
  "form16",
  "itr",
  "salarySlip",
  "banking",
];

export const HOME_LOAN_SALARIED_FIELDS: string[] = [
  "form16",
  "itr",
  "bbaAts",
  "propertySalesDeed",
  "sanctionLetter",
  "soa",
  "banking",
];

export const HOME_LOAN_SELF_EMPLOYED_FIELDS: string[] = [
  "partnershipDeed",
  "udhyam",
  "gstCertificate",
  "financials",
  "computationOfIncome",
  "bbaAts",
  "propertySalesDeed",
  "sanctionLetter",
  "soa",
  "banking",
];

export const LAP_SALARIED_FIELDS: string[] = [
  "form16",
  "itr",
  "copyRegistry",
  "salesDeed",
  "gpa",
  "banking",
];

export const LAP_SELF_EMPLOYED_FIELDS: string[] = [
  "partnershipDeed",
  "udhyam",
  "gstCertificate",
  "financials",
  "computationOfIncome",
  "copyRegistry",
  "salesDeed",
  "gpa",
  "banking",
];

export const EDUCATION_LOAN_FIELDS: string[] = [
  "marksheets",
  "collegeOfferLetter",
  "feeStructure",
  "entranceScorecard",
  "cancelledCheque",
  "banking",
];

export const SOLE_PROPRIETORSHIP_FIELDS: string[] = [
  "computationOfIncome",
  "financials",
  "udhyamCertificate",
  "gst",
  "itr",
  "banking",
];

export const HUF_FIELDS: string[] = [
  "hufDeed",
  "hufPan",
  "computationOfIncome",
  "financials",
  "itr",
  "banking",
  "udhyam",
];

export const PRIVATE_LIMITED_FIELDS: string[] = [
  "banking",
  "itr",
  "computationOfIncome",
  "financials",
  "gst",
  "listOfDirectors",
  "listOfShareholders",
  "aoa",
  "moa",
  "udhyam",
  "companyPan",
  "gstCertificate",
];

export const LLP_FIELDS: string[] = [
  "banking",
  "certificateOfIncorporation",
  "boardResolution",
  "listOfDirectors",
  "itr",
  "computationOfIncome",
  "financials",
  "gst",
  "listOfShareholders",
  "llpAgreement",
  "moa",
  "udhyam",
  "companyPan",
  "gstCertificate",
];

export const PARTNERSHIP_FIELDS: string[] = [
  "partnershipDeed",
  "udhyam",
  "gstCertificate",
  "financials",
  "computationOfIncome",
  "banking",
];

export const DOCTOR_LOAN_FIELDS: string[] = [
  "ugDegree",
  "ugRegistration",
  "pgDegree",
  "pgRegistration",
  "consultancyLetter",
  "clinicLetterHead",
  "itr",
  "coi",
  "udyam",
  "banking",
];

export const CA_CS_CMA_FIELDS: string[] = [
  "copCertificate",
  "comCertificate",
  "firmCard",
  "letterHead",
  "itrCoi",
  "udyamShopReg",
  "banking",
];

export const AUTO_LOAN_FIELDS: string[] = [
  "proformaInvoice",
  "itr",
  "form16",
  "banking",
  "drivingLicense",
];

export const MACHINERY_LOAN_FIELDS: string[] = [
  "machineryQuotation",
  "financials",
  "itr",
  "computationOfIncome",
  "gstCertificate",
  "gst",
  "udhyam",
  "banking",
  "projectReport",
];

export const FALLBACK_FIELDS: string[] = ["banking"];

// ── Helper Resolvers ───────────────────────────────────────────────────────

export const isDoctorLoan = (type: string): boolean => {
  const norm = String(type || "").toLowerCase().trim();
  return norm === "doctor" || norm.includes("doctor");
};

export const isCaCsCmaLoan = (type: string): boolean => {
  const norm = String(type || "").toLowerCase().trim();
  return (
    norm === "ca_cs_cma" ||
    norm.includes("ca_cs_cma") ||
    norm === "professional loan"
  );
};

export function getFieldKeys(loanType: string, entityType: string, employmentType?: string): string[] {
  const normLoan = String(loanType || "").toLowerCase().trim();
  const normEntity = String(entityType || "").toLowerCase().trim();
  const normEmp = String(employmentType || "").toLowerCase().trim();

  if (normLoan === "personal loan") return PERSONAL_LOAN_FIELDS;

  if (normLoan === "home loan") {
    if (
      normEmp === "self_employed" ||
      normEmp === "business" ||
      normEmp === "self employed" ||
      normEmp === "self_employed(business)" ||
      normEmp === "self-employed"
    ) {
      return HOME_LOAN_SELF_EMPLOYED_FIELDS;
    }
    return HOME_LOAN_SALARIED_FIELDS;
  }

  if (normLoan === "lap" || normLoan === "loan against property") {
    if (
      normEmp === "self_employed" ||
      normEmp === "business" ||
      normEmp === "self employed" ||
      normEmp === "self_employed(business)" ||
      normEmp === "self-employed"
    ) {
      return LAP_SELF_EMPLOYED_FIELDS;
    }
    return LAP_SALARIED_FIELDS;
  }

  if (normLoan === "education loan") return EDUCATION_LOAN_FIELDS;
  if (isDoctorLoan(normLoan)) return DOCTOR_LOAN_FIELDS;
  if (isCaCsCmaLoan(normLoan)) return CA_CS_CMA_FIELDS;
  if (normLoan === "auto loan") return AUTO_LOAN_FIELDS;
  if (normLoan === "machinery loan") return MACHINERY_LOAN_FIELDS;
  if (normLoan === "just inquiry") return ["banking", "itr"];

  if (normLoan === "business loan") {
    if (normEntity === "sole_proprietorship") return SOLE_PROPRIETORSHIP_FIELDS;
    if (normEntity === "huf") return HUF_FIELDS;
    if (normEntity === "private_limited") return PRIVATE_LIMITED_FIELDS;
    if (normEntity === "llp") return LLP_FIELDS;
    if (normEntity === "partnership") return PARTNERSHIP_FIELDS;
    return SOLE_PROPRIETORSHIP_FIELDS;
  }

  return FALLBACK_FIELDS;
}

export function getEntityLabel(entityType: string): string {
  if (entityType === "sole_proprietorship") return "Sole Proprietorship";
  if (entityType === "private_limited") return "Private Limited";
  if (entityType === "llp") return "Limited Liability Partnership (LLP)";
  if (entityType === "huf") return "HUF (Hindu Undivided Family)";
  if (entityType === "partnership") return "Partnership";
  return "";
}

export function getHeading(loanType: string, entityType?: string): string {
  if (loanType === "personal loan") return "Personal Loan Documents";
  if (loanType === "business loan") {
    if (entityType === "sole_proprietorship") return "Sole Proprietorship Documents";
    if (entityType === "private_limited") return "Private Limited Documents";
    if (entityType === "llp") return "Limited Liability Partnership Documents";
    if (entityType === "huf") return "Hindu Undivided Family Documents";
    if (entityType === "partnership") return "Partnership Documents";
    return "Business Loan Documents";
  }
  if (loanType === "home loan") return "Home Loan Documents";
  if (loanType === "lap" || loanType === "loan against property") return "Loan Against Property (LAP) Documents";
  if (loanType === "auto loan") return "Auto Loan Documents";
  if (loanType === "machinery loan") return "Machinery Loan Documents";
  if (loanType === "education loan") return "Education Loan Documents";
  if (isDoctorLoan(loanType)) return "Doctor Loan Documents";
  if (isCaCsCmaLoan(loanType)) return "CA / CS / CMA Loan Documents";
  if (loanType === "just inquiry") return "Just Inquiry Documents";
  return "Document Upload";
}

export function getSubheading(loanType: string, entityType?: string): string | null {
  if (loanType === "personal loan") {
    return "Customized document requirements for Personal Loan disbursal";
  }
  if (loanType === "home loan") {
    return "Customized document requirements for Home Loan disbursal";
  }
  if (loanType === "lap" || loanType === "loan against property") {
    return "Customized document requirements for Loan Against Property disbursal";
  }
  if (loanType === "auto loan") {
    return "Customized document requirements for Auto Loan disbursal";
  }
  if (loanType === "machinery loan") {
    return "Customized document requirements for Machinery Loan disbursal";
  }
  if (loanType === "education loan") {
    return "Customized document requirements for Education Loan disbursal";
  }
  if (loanType === "just inquiry") {
    return "Upload optional bank statement or supporting financial records for evaluation";
  }
  if (isDoctorLoan(loanType) || isCaCsCmaLoan(loanType)) {
    return "Customized document requirements for Professional Loan disbursal";
  }
  if (loanType === "business loan" && entityType === "sole_proprietorship") {
    return "Customized document requirements for Sole Proprietorship Business Loan disbursal";
  }
  if (loanType === "business loan" && entityType) {
    return `Customized document requirements for ${getEntityLabel(entityType)} Business Loan disbursal`;
  }
  return null;
}

// ── Step 3 Core Document Definitions ───────────────────────────────────────

export const STEP3_FIELD_LABELS: Record<string, string> = {
  aadharFront: "Aadhaar Card Front * (Mandatory)",
  aadharBack: "Aadhaar Card Back * (Mandatory)",
  pancard: "PAN Card * (Mandatory)",
  passportSizePhoto: "Passport Size Photo * (Mandatory)",
  currentAddressProof: "Address Proof for Current Address * (Mandatory)",
  permanentAddressProof: "Address Proof for Permanent Address * (Mandatory)",
  salarySlip: "3 Months Salary Slips (Optional)",
  form26as: "Form 26AS (Last 2 Financial Years) (Optional)",
};

export const STEP3_FIELD_HINTS: Record<string, string> = {
  aadharFront: "Upload front side of Aadhaar card with clear photo & text",
  aadharBack: "Upload back side of Aadhaar card with address details",
  pancard: "Upload clear copy of individual PAN card",
  passportSizePhoto: "Upload recent passport size photograph",
  currentAddressProof: "Electricity Bill, LPG Bill, Rent Agreement, etc.",
  permanentAddressProof: "Electricity Bill, LPG Bill, Home Tax, Water Tax, or Govt issued document",
  salarySlip: "Upload last 3 months salary slips if salaried employee",
  form26as: "Upload Form 26AS for last 2 years for income & tax verification",
};

// ── MySQL customer_document type ENUM Mappings ──────────────────────────────

export const DOC_KEY_TO_DB_TYPE: Record<string, string> = {
  form16: "form 16",
  itr: "itr",
  salarySlip: "salary slip",
  banking: "bank statement",
  computationOfIncome: "computation of income",
  financials: "financials",
  form26as: "form 26 as",
  udhyamCertificate: "udhyam certificate",
  udhyam: "udhyam certificate",
  udyam: "udhyam certificate",
  udyamShopReg: "udhyam certificate",
  gst: "gst",
  gstCertificate: "gst",
  listOfDirectors: "list of directors",
  listOfShareholders: "list of shareholders",
  aoa: "aoa",
  moa: "moa",
  companyPan: "company pan",
  companyFirmPan: "company pan",
  hufPan: "company pan",
  certificateOfIncorporation: "coi",
  coi: "coi",
  boardResolution: "board resolution",
  llpAgreement: "aoa",
  directorsKyc: "directors kyc",
  partnershipDeed: "partnership deed",
  ugCertificate: "ug certificate",
  ugDegree: "ug certificate",
  pgCertificate: "pg certificate",
  pgDegree: "pg certificate",
  ugRegistration: "registration",
  pgRegistration: "registration",
  consultancyLetter: "cop",
  clinicLetterHead: "com",
  copCertificate: "cop",
  comCertificate: "com",
  firmCard: "firm card",
  letterHead: "letter head",
  itrCoi: "itr",
  hufDeed: "huf deed",
  bbaAts: "ats",
  propertySalesDeed: "title deed",
  sanctionLetter: "lod",
  soa: "tpa",
  copyRegistry: "title deed",
  salesDeed: "title deed",
  gpa: "property papers",
  proformaInvoice: "property papers",
  machineryQuotation: "property papers",
  projectReport: "property papers",
  drivingLicense: "current address proof",
  marksheets: "graduation marksheet",
  collegeOfferLetter: "offer letter",
  feeStructure: "fee structure",
  entranceScorecard: "entrance exam result",
  cancelledCheque: "cancel cheque",
  currentAddressProof: "current address proof",
  permanentAddressProof: "current address proof",
  aadharFront: "aadhaar front",
  aadharBack: "aadhaar back",
  pancard: "pancard",
  passportSizePhoto: "profile photo",
};

export const COAPP_DOC_KEY_TO_DB_TYPE: Record<string, string> = {
  coAppAadhaar: "co-applicant aadhaar front",
  coAppPan: "co-applicant pan",
  coAppCancelledCheque: "cancel cheque",
  coAppForm16: "form 16",
  coAppSalarySlips: "salary slip",
  coAppIdCard: "company id card",
};
