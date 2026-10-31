'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy,
  Building2,
  IndianRupee,
  Clock,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Loader2,
  Layers,
  ChevronDown
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLoanProviders } from '@/hooks/use-loan-providers';
import { decodeJwt, getCookie, normalizeApiUrl } from '@/lib/utils';
import { getCompanyId } from '@/lib/http-client';
import { DOC_KEY_TO_DB_TYPE } from '@/components/dashboard/aggregator/multi-step-application-form/formConstants';

const DEFAULT_PROVIDERS = [
  'ABFL',
  'Axis',
  'Bajaj Finance',
  'Bajaj Market',
  'Bank of Baroda',
  'BOI',
  'Canara Bank',
  'Cholamandalam',
  'Credit Saison',
  'Deutsche bank',
  'Godrej',
  'HDFC',
  'HSBC Bank',
  'ICICI',
  'IDFC',
  'Indusind',
  'Incred',
  'Kotak Bank',
  'L&T',
  'Lending Kart',
  'Paysense',
  'PNB',
  'Poonawala',
  'SBI',
  'Shriram',
  'SMFG',
  'STANDARD Chartered Bank',
  'Tata',
  'YES Bank'
];

const LOAN_TYPES = [
  { value: 'personal loan', label: 'Personal Loan' },
  { value: 'business loan', label: 'Business Loan' },
  { value: 'professional loan', label: 'Professional Loan' },
  { value: 'home loan', label: 'Home Loan' },
  { value: 'lap', label: 'Loan Against Property (LAP)' },
  { value: 'education loan', label: 'Education Loan' },
  { value: 'machinery loan', label: 'Machinery Loan' },
  { value: 'auto loan', label: 'Auto Loan' },
  { value: 'doctor', label: 'Doctor Loan' },
  { value: 'ca_cs_cma', label: 'CA / CS / CMA Loan' }
];

export interface CloneApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: any | null;
  onSuccess?: () => void;
}

export const sanitizeAmount = (amt: any): string => {
  if (amt === undefined || amt === null || amt === '') return '';
  const str = String(amt).trim();
  // Strip decimals if present (e.g. "10000000.00" -> "10000000")
  if (str.includes('.')) {
    const parts = str.split('.');
    const integerPart = parts[0].replace(/[^0-9]/g, '');
    return integerPart || '0';
  }
  return str.replace(/[^0-9]/g, '');
};

export function CloneApplicationDialog({
  open,
  onOpenChange,
  application,
  onSuccess
}: CloneApplicationDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { providerOptions } = useLoanProviders(1, 100);

  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [loanAmount, setLoanAmount] = useState<string>('');
  const [tenure, setTenure] = useState<string>('5');
  const [loanType, setLoanType] = useState<string>('personal loan');
  const [loanCategory, setLoanCategory] = useState<'secured' | 'unsecured'>('unsecured');
  const [leadType, setLeadType] = useState<string>('');
  const [caseType, setCaseType] = useState<string>('fresh');
  const [referralCode, setReferralCode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isPreFilling, setIsPreFilling] = useState<boolean>(false);
  const [duplicateInfo, setDuplicateInfo] = useState<{
    isDuplicate: boolean;
    message: string;
    daysRemaining?: number;
    application?: any;
    ticket?: any;
  } | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState<boolean>(false);

  // Combine provider options from API with standard fallback (case-insensitive deduplication)
  const allProviders = useMemo(() => {
    const map = new Map<string, string>();
    DEFAULT_PROVIDERS.forEach(p => {
      if (p && p.trim()) map.set(p.trim().toLowerCase(), p.trim());
    });
    providerOptions.forEach(p => {
      if (p.value && p.value.trim()) map.set(p.value.trim().toLowerCase(), p.value.trim());
    });
    if (application?.applicationProvider && application.applicationProvider.trim()) {
      map.set(application.applicationProvider.trim().toLowerCase(), application.applicationProvider.trim());
    }
    if (application?.provider && application.provider.trim()) {
      map.set(application.provider.trim().toLowerCase(), application.provider.trim());
    }
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [providerOptions, application?.applicationProvider, application?.provider]);

  const targetAppId = application?.applicationId || application?.id || application?.applicationNumber;

  // Sync initial state ONLY when dialog opens or target application changes
  useEffect(() => {
    if (open && application) {
      const currentProvider = application.applicationProvider || application.provider || '';
      // Default to existing lender so user can easily edit without unintended cloning
      setSelectedProvider(currentProvider);

      const rawAmount = sanitizeAmount(application.applicationAmount);
      setLoanAmount(rawAmount || '500000');

      const rawTenure = application.applicationTenure ? String(application.applicationTenure) : '5';
      setTenure(rawTenure);

      setLoanType(application.loanType || 'personal loan');
      setLoanCategory(application.loanCategory === 'secured' ? 'secured' : 'unsecured');
      setLeadType(application.leadType || '');
      setReferralCode(application.referralCode || '');
      setCaseType('fresh');
    }
  }, [open, targetAppId]);

  // Real-time duplicate check whenever selectedProvider changes
  useEffect(() => {
    if (!open || !application || !selectedProvider) {
      setDuplicateInfo(null);
      setIsCheckingDuplicate(false);
      return;
    }

    let isCancelled = false;
    const checkDuplicate = async () => {
      setIsCheckingDuplicate(true);
      try {
        const token = getCookie('lendgrid_cookie');
        const companyId = getCompanyId();
        const mobile = (application.customerContact || application.contact || application.customerPhone || '').trim();
        const pan = (application.customerPAN || application.pan || application.customerPan || '').trim().toUpperCase();
        const appId = application.applicationId || application.id || application.customer_application_id;
        const customerId = application.customerId || application.customer_id;

        const bodyData = {
          customerId: customerId ? Number(customerId) : undefined,
          mobile: mobile || undefined,
          pan: pan || undefined,
          providers: [selectedProvider.trim()],
          excludeApplicationId: appId ? Number(appId) : undefined,
        };

        const lendgridServerUrl = process.env.NEXT_PUBLIC_API_BASE_URL
          ? `${process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/graphql\/?$/, '')}/api/v1`
          : 'http://localhost:4000/api/v1';

        let dupData: any = null;
        try {
          const resp = await fetch(`${lendgridServerUrl}/check-duplicate-application`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(companyId && companyId !== 'all' ? { companyid: String(companyId) } : {}),
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify(bodyData)
          });
          if (resp.ok) {
            const json = await resp.json();
            dupData = json?.data;
          }
        } catch (e) {}

        if (!dupData) {
          const f2ServerUrl = process.env.NEXT_PUBLIC_WEB_URL
            ? `${process.env.NEXT_PUBLIC_WEB_URL.replace(/\/api\/v1\/?$/, '')}/api/v1`
            : 'http://localhost:8080/api/v1';

          try {
            const resp = await fetch(`${f2ServerUrl}/check-duplicate-application`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(companyId && companyId !== 'all' ? { companyid: String(companyId) } : {}),
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              },
              body: JSON.stringify(bodyData)
            });
            if (resp.ok) {
              const json = await resp.json();
              dupData = json?.data;
            }
          } catch (e) {}
        }

        if (!isCancelled) {
          if (dupData?.isDuplicate) {
            setDuplicateInfo(dupData);
          } else {
            setDuplicateInfo(null);
          }
        }
      } catch (err) {
        console.warn('[CloneApplicationDialog] Duplicate check failed:', err);
      } finally {
        if (!isCancelled) {
          setIsCheckingDuplicate(false);
        }
      }
    };

    const timer = setTimeout(checkDuplicate, 250);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [open, selectedProvider, targetAppId, application?.customerId]);

  if (!application) return null;

  const currentProvider = application.applicationProvider || application.provider || 'Not Specified';
  const isSameProvider = selectedProvider.trim().toLowerCase() === currentProvider.trim().toLowerCase();

  const formatCurrencyINR = (val: string | number) => {
    const clean = sanitizeAmount(val);
    const num = Number(clean);
    if (isNaN(num) || num === 0) return '₹ 0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // Direct Submit Handler: Updates existing if same provider, clones if different provider
  const handleDirectClone = async () => {
    if (!selectedProvider) {
      toast({
        title: 'Lender Required',
        description: 'Please select a lender/provider.',
        variant: 'destructive'
      });
      return;
    }

    if (duplicateInfo?.isDuplicate) {
      toast({
        title: 'Duplicate Application Detected',
        description: duplicateInfo.message || `An application with lender "${selectedProvider}" already exists for this customer within 30 days.`,
        variant: 'destructive'
      });
      return;
    }

    const cleanAmount = sanitizeAmount(loanAmount);
    const numAmount = Number(cleanAmount);
    if (!numAmount || numAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid loan amount.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = getCookie('lendgrid_cookie');
      const decoded = decodeJwt(token);
      const companyId = getCompanyId() || application.companyId;

      const roleLower = String(decoded?.role || '').toLowerCase();
      const isOmsSalesSession =
        decoded?.source === 'oms' ||
        roleLower === 'sales' ||
        roleLower === 'lendgrid_sales';

      const omsSalesUserId =
        decoded?.id ??
        decoded?.userId ??
        decoded?.sub ??
        decoded?.salesUserId ??
        decoded?.user_id ??
        application.appliedBy;

      const commonHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(companyId ? { companyid: String(companyId) } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      // ── CASE A: SAME PROVIDER -> UPDATE EXISTING APPLICATION IN PLACE ────────
      if (isSameProvider) {
        const appId = application.applicationId || application.customer_application_id || application.id;
        const updatePayload = {
          applicationId: Number(appId),
          amount: numAmount,
          tenure: Number(tenure) || 5,
          provider: selectedProvider,
          loan_type: loanType,
          loanType: loanType,
          loan_category: loanCategory,
          loanCategory: loanCategory,
          lead_type: leadType || null,
          leadType: leadType || null,
          case_type: caseType,
          caseType: caseType,
          ...(referralCode.trim() ? { referral_code: referralCode.trim(), referralCode: referralCode.trim() } : {}),
          ...(companyId ? { company_id: Number(companyId), companyId: Number(companyId) } : {})
        };

        const lendgridServerUrl = process.env.NEXT_PUBLIC_API_BASE_URL
          ? `${process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/graphql\/?$/, '')}/api/v1`
          : 'http://localhost:4000/api/v1';

        let updated = false;
        try {
          const resp = await fetch(`${lendgridServerUrl}/update-application/${appId}`, {
            method: 'PATCH',
            headers: commonHeaders,
            body: JSON.stringify(updatePayload)
          });
          if (resp.ok) {
            updated = true;
          } else if (resp.status === 409) {
            const errData = await resp.json().catch(() => ({}));
            if (errData.data?.isDuplicate) setDuplicateInfo(errData.data);
            throw new Error(errData.message || `An application with lender "${selectedProvider}" already exists for this customer within 30 days.`);
          }
        } catch (e: any) {
          if (e.message && e.message.includes('already exists')) throw e;
        }

        if (!updated) {
          const f2ServerUrl = process.env.NEXT_PUBLIC_WEB_URL
            ? `${process.env.NEXT_PUBLIC_WEB_URL.replace(/\/api\/v1\/?$/, '')}/api/v1`
            : 'http://localhost:8080/api/v1';

          let resp = await fetch(`${f2ServerUrl}/update-application/${appId}`, {
            method: 'PATCH',
            headers: commonHeaders,
            body: JSON.stringify(updatePayload)
          });

          if (!resp.ok && resp.status !== 409) {
            resp = await fetch(`${f2ServerUrl}/update-application`, {
              method: 'POST',
              headers: commonHeaders,
              body: JSON.stringify(updatePayload)
            });
          }

          if (!resp.ok) {
            const errData = await resp.json().catch(() => ({}));
            if (errData.data?.isDuplicate) setDuplicateInfo(errData.data);
            throw new Error(errData.message || (resp.status === 409 ? `An application with lender "${selectedProvider}" already exists within 30 days.` : 'Failed to update application'));
          }
        }

        toast({
          title: 'Application Updated Successfully! 🎉',
          description: `Application #${application.applicationNumber || appId} details updated with ${selectedProvider}.`,
          className: 'bg-emerald-600 text-white border-none'
        });

        onOpenChange(false);
        onSuccess?.();
        return;
      }

      // ── CASE B: DIFFERENT PROVIDER -> CREATE NEW CLONED APPLICATION ──────────
      const randomAppNumber = Math.floor(10000000 + Math.random() * 90000000).toString();

      const payload = {
        customerId: application.customerId,
        customer_id: application.customerId,
        application_no: randomAppNumber,
        amount: numAmount,
        tenure: Number(tenure) || 5,
        provider: selectedProvider,
        loanType: loanType,
        loan_type: loanType,
        loanCategory: loanCategory,
        loan_category: loanCategory,
        leadType: leadType || null,
        lead_type: leadType || null,
        caseType: caseType,
        case_type: caseType,
        source: 'lendgrid',
        companyId: companyId ? Number(companyId) : undefined,
        company_id: companyId ? Number(companyId) : undefined,
        ...(isOmsSalesSession && omsSalesUserId ? { appliedBy: Number(omsSalesUserId), applied_by: Number(omsSalesUserId) } : {}),
        ...(referralCode.trim() ? { referralCode: referralCode.trim(), referral_code: referralCode.trim() } : {}),
        existingLoans: application.existingLoans || application.existing_loans || []
      };

      let success = false;
      let createdAppId: any = null;

      // 1. Try lendgrid-server /api/v1/clone-application first
      const lendgridServerUrl = process.env.NEXT_PUBLIC_API_BASE_URL
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/graphql\/?$/, '')}/api/v1`
        : 'http://localhost:4000/api/v1';

      try {
        const resp = await fetch(`${lendgridServerUrl}/clone-application`, {
          method: 'POST',
          headers: commonHeaders,
          body: JSON.stringify(payload)
        });
        if (resp.ok) {
          const resData = await resp.json();
          createdAppId = resData?.data?.applicationId;
          success = true;
        } else if (resp.status === 409) {
          const errData = await resp.json().catch(() => ({}));
          if (errData.data?.isDuplicate) setDuplicateInfo(errData.data);
          throw new Error(errData.message || `An application with lender "${selectedProvider}" already exists for this customer within 30 days.`);
        }
      } catch (err: any) {
        if (err.message && err.message.includes('already exists')) throw err;
        // Fallback to direct create-application
      }

      // 2. Fallback to f2fintech-server /create-application if needed
      if (!success) {
        const f2ServerUrl = process.env.NEXT_PUBLIC_WEB_URL
          ? `${process.env.NEXT_PUBLIC_WEB_URL.replace(/\/api\/v1\/?$/, '')}/api/v1`
          : 'http://localhost:8080/api/v1';

        const appResp = await fetch(`${f2ServerUrl}/create-application`, {
          method: 'POST',
          headers: commonHeaders,
          body: JSON.stringify(payload)
        });

        if (!appResp.ok) {
          const errData = await appResp.json().catch(() => ({}));
          if (errData.data?.isDuplicate) setDuplicateInfo(errData.data);
          throw new Error(errData.message || (appResp.status === 409 ? `An application with lender "${selectedProvider}" already exists for this customer within 30 days.` : 'Failed to create cloned application'));
        }

        const appResult = await appResp.json();
        createdAppId = appResult?.data?.applicationId || appResult?.data?.id;

        if (createdAppId) {
          await fetch(`${f2ServerUrl}/create-loan-tracking`, {
            method: 'POST',
            headers: commonHeaders,
            body: JSON.stringify({
              customer_application_id: createdAppId,
              status: 'submitted',
              ...(companyId ? { company_id: Number(companyId) } : {})
            })
          }).catch(err => console.error('Loan tracking creation note:', err));
        }
        success = true;
      }

      toast({
        title: 'Application Cloned Successfully! 🎉',
        description: `New application (#${randomAppNumber}) created with ${selectedProvider} for ${application.customerName}.`,
        className: 'bg-emerald-600 text-white border-none'
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast({
        title: isSameProvider ? 'Update Failed' : 'Clone Failed',
        description: err?.message || (isSameProvider ? 'Unable to update application.' : 'Unable to clone application. Please try again.'),
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit in Full Form Handler (Prepopulates context + localStorage)
  const handleEditInFullForm = async () => {
    if (!selectedProvider) {
      toast({
        title: 'Lender Required',
        description: 'Please select a lender/provider first.',
        variant: 'destructive'
      });
      return;
    }

    setIsPreFilling(true);
    try {
      const cleanAmount = sanitizeAmount(loanAmount || application.applicationAmount || application.amount || '500000');
      
      let parsedExistingLoans = [{ hasRunningLoans: 'no', whichLoan: '', loanAmount: '', runningEmi: '' }];
      const rawExisting = application.existingLoans || application.existing_loans;
      if (rawExisting) {
        try {
          const arr = typeof rawExisting === 'string' ? JSON.parse(rawExisting) : rawExisting;
          if (Array.isArray(arr) && arr.length > 0) {
            parsedExistingLoans = arr.map((item: any) => ({
              hasRunningLoans: item.has_running_loans === 1 || item.hasRunningLoans === 'yes' ? 'yes' : 'no',
              whichLoan: item.which_loan || item.whichLoan || '',
              loanAmount: item.loan_amount ? String(item.loan_amount) : (item.loanAmount ? String(item.loanAmount) : ''),
              runningEmi: item.running_emi ? String(item.running_emi) : (item.runningEmi ? String(item.runningEmi) : '')
            }));
          }
        } catch (e) {}
      }

      const resolvedLeadType = (leadType && leadType !== 'null')
        ? leadType
        : (application.leadType && application.leadType !== 'null'
            ? application.leadType
            : (application.lead_type && application.lead_type !== 'null' ? application.lead_type : ''));

      const prefillData = {
        amount: cleanAmount,
        tenure: `${tenure || application.applicationTenure || application.tenure || 5} Years`,
        loanType: loanType || application.loanType || application.loan_type || 'personal loan',
        loanCategory: loanCategory || application.loanCategory || application.loan_category || 'unsecured',
        leadType: resolvedLeadType,
        providers: [selectedProvider],
        providerAmounts: [{ provider: selectedProvider, amount: cleanAmount }],
        existingLoans: parsedExistingLoans,
        caseType: application.case_type || application.caseType || caseType || 'fresh',
        businessEntityType: application.business_entity_type || application.businessEntityType || '',
        company_official_email: application.company_official_email || '',
        referralCode: referralCode || application.referralCode || application.referral_code || ''
      };

      let initialCustomerName = (application.customerName || '').trim();
      let detectedTitle = (application.customerDesignation === 'doctor' ? 'Dr' : 'Mr');
      const titleMatch = initialCustomerName.match(/^(Mr|Mrs|Miss|Dr|Ca)\.?\s+(.*)$/i);
      if (titleMatch) {
        detectedTitle = titleMatch[1].charAt(0).toUpperCase() + titleMatch[1].slice(1).toLowerCase();
        if (detectedTitle === 'Ca') detectedTitle = 'Ca';
        initialCustomerName = titleMatch[2].trim();
      }

      const step1Draft: Record<string, any> = {
        name: initialCustomerName,
        email: application.customerEmail || '',
        contact: application.customerContact || '',
        pan: application.customerPAN || '',
        city: application.customerLocation || '',
        state: application.customerState || '',
        employment_type: application.customerDesignation || 'salaried',
        title: detectedTitle,
        permanent_address: application.customerLocation || '',
        working_address: application.customerLocation || '',
        current_address: application.customerLocation || '',
      };

      const targetCustomerId = application.customerId;
      if (targetCustomerId) {
        try {
          const apiBaseUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:8080');
          const companyId = getCompanyId();
          const token = getCookie('lendgrid_cookie');
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(companyId ? { 'companyid': String(companyId) } : {}),
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          };

          const [infoRes, custRes, docsRes] = await Promise.allSettled([
            fetch(`${apiBaseUrl}/customer-info/${targetCustomerId}`, { headers }),
            fetch(`${apiBaseUrl}/get-customer/${targetCustomerId}`, { headers }),
            fetch(`${apiBaseUrl}/get-customer-documents/${targetCustomerId}`, { headers })
          ]);

          if (infoRes.status === 'fulfilled' && infoRes.value.ok) {
            const infoJson = await infoRes.value.json();
            const info = infoJson?.data || infoJson;
            if (info) {
              if (info.title) step1Draft.title = info.title;
              if (info.pan) step1Draft.pan = info.pan;
              if (info.father_name) step1Draft.father_name = info.father_name;
              if (info.mother_name) step1Draft.mother_name = info.mother_name;
              if (info.working_address) step1Draft.working_address = info.working_address;
              if (info.permanent_address) step1Draft.permanent_address = info.permanent_address;
              if (info.current_address) step1Draft.current_address = info.current_address;
              if (info.city) step1Draft.city = info.city;
              if (info.state) step1Draft.state = info.state;
              if (info.employment_type) step1Draft.employment_type = info.employment_type;
              if (info.dob) step1Draft.dob = info.dob;

              if (info.salary) localStorage.setItem('step4Salary', String(info.salary));
              if (info.existing_emi) localStorage.setItem('step4ExistingEmi', String(info.existing_emi));
              if (info.existing_liability) localStorage.setItem('step4ExistingLiability', String(info.existing_liability));
            }
          }

          if (custRes.status === 'fulfilled' && custRes.value.ok) {
            const custJson = await custRes.value.json();
            const cust = custJson?.data || custJson;
            if (cust) {
              let custName = (cust.name || '').trim();
              const custTitleMatch = custName.match(/^(Mr|Mrs|Miss|Dr|Ca)\.?\s+(.*)$/i);
              if (custTitleMatch) {
                step1Draft.title = custTitleMatch[1].charAt(0).toUpperCase() + custTitleMatch[1].slice(1).toLowerCase();
                if (step1Draft.title === 'Ca') step1Draft.title = 'Ca';
                custName = custTitleMatch[2].trim();
              }
              if (custName) step1Draft.name = custName;
              if (cust.email) step1Draft.email = cust.email;
              if (cust.contact) step1Draft.contact = cust.contact;
              if (cust.dob) step1Draft.dob = cust.dob;
            }
          }

          if (docsRes.status === 'fulfilled' && docsRes.value.ok) {
            const docsJson = await docsRes.value.json();
            const docs = docsJson?.data || docsJson;
            if (Array.isArray(docs) && docs.length > 0) {
              const step2Cache: Record<string, { url: string; name: string }> = {};
              const step3Cache: Record<string, { url: string; name: string }> = {};

              docs.forEach((doc: any) => {
                const url = doc.document_url;
                const type = (doc.type || '').toLowerCase().trim();
                if (!url) return;
                const name = url.split('/').pop() || 'Uploaded Document';

                // Step 3 KYC documents mapping
                if (type === 'aadhaar front' || type === 'aadhar front' || type === 'aadhaar card') {
                  step3Cache.aadharFront = { url, name };
                } else if (type === 'aadhaar back' || type === 'aadhar back') {
                  step3Cache.aadharBack = { url, name };
                } else if (type === 'pancard' || type === 'pan card' || type === 'pan') {
                  step3Cache.pancard = { url, name };
                } else if (type === 'profile photo' || type === 'passport photo' || type === 'photo') {
                  step3Cache.passportSizePhoto = { url, name };
                } else if (type === 'salary slip' || type === 'salary_slip') {
                  step3Cache.salarySlip = { url, name };
                } else if (type === 'form 26as' || type === 'form26as') {
                  step3Cache.form26as = { url, name };
                } else if (type === 'current address proof' || type === 'address proof' || type === 'electricity bill') {
                  if (!step3Cache.currentAddressProof) step3Cache.currentAddressProof = { url, name };
                  else if (!step3Cache.permanentAddressProof) step3Cache.permanentAddressProof = { url, name };
                }

                // Step 2 business/loan documents mapping
                Object.entries(DOC_KEY_TO_DB_TYPE).forEach(([k, dbType]) => {
                  if (type === (dbType as string).toLowerCase().trim()) {
                    step2Cache[k] = { url, name };
                  }
                });
                if (type === 'itr') step2Cache.itr = { url, name };
                if (type === 'bank statement') step2Cache.banking = { url, name };
                if (type === 'form 16') step2Cache.form16 = { url, name };
                if (type === 'gst') step2Cache.gstCertificate = { url, name };
                if (type === 'coi') step2Cache.certificateOfIncorporation = { url, name };
                if (type === 'ug certificate') step2Cache.ugCertificate = { url, name };
              });

              if (Object.keys(step2Cache).length > 0) {
                localStorage.setItem('step2UploadedDocs', JSON.stringify(step2Cache));
              }
              if (Object.keys(step3Cache).length > 0) {
                localStorage.setItem('step3UploadedDocs', JSON.stringify(step3Cache));
              }
            }
          }
        } catch (fetchErr) {
          console.warn('Could not prefetch extra customer details:', fetchErr);
        }
      }

      localStorage.setItem('loanFormData', JSON.stringify(prefillData));
      localStorage.setItem('loanFormCustomerId', String(application.customerId));
      localStorage.setItem('step1CustomerDraft', JSON.stringify(step1Draft));
      localStorage.setItem('activeStep', '0');
      localStorage.setItem('startAtStep0', 'true');

      // Set editing application markers in localStorage
      const appId = String(application.applicationId || application.customer_application_id || application.id || '');
      const appNum = String(application.applicationNumber || application.application_no || '');
      const origProv = String(application.applicationProvider || application.provider || currentProvider || '');

      localStorage.setItem('editingApplicationId', appId);
      localStorage.setItem('editingApplicationNumber', appNum);
      localStorage.setItem('originalProvider', origProv);

      onOpenChange(false);

      toast({
        title: isSameProvider ? 'Application Editor' : 'Form Pre-filled',
        description: isSameProvider
          ? `Editing existing application #${appNum || appId} with ${selectedProvider}...`
          : `Redirecting to application editor with new lender ${selectedProvider}...`
      });

      const queryParams = new URLSearchParams();
      if (application.companyId) queryParams.set('companyId', String(application.companyId));
      if (application.aggregatorProfileId || application.partnerId) {
        queryParams.set('aggregatorProfileId', String(application.aggregatorProfileId || application.partnerId));
      }
      if (application.companyName || application.partnerName) {
        queryParams.set('partnerName', String(application.companyName || application.partnerName));
      }

      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      router.push(`/aggregator/applications/new${queryString}`);
    } catch (e) {
      console.error('Error prefilling form:', e);
    } finally {
      setIsPreFilling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card border border-border text-foreground p-0 overflow-hidden shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 bg-muted/30 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-sm ${
              isSameProvider
                ? 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
            }`}>
              {isSameProvider ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>{isSameProvider ? 'Edit Application Details' : 'Clone Application with Different Provider'}</span>
                <Badge variant="outline" className={`text-[10px] font-mono ${
                  isSameProvider
                    ? 'border-blue-500/30 bg-blue-500/5 text-blue-500'
                    : 'border-amber-500/30 bg-amber-500/5 text-amber-500'
                }`}>
                  {isSameProvider ? 'Update Existing' : 'Clone New'}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {isSameProvider
                  ? `Update parameters for existing application #${application.applicationNumber || application.applicationId} with ${currentProvider}.`
                  : `Re-apply for this customer with alternative lender (${selectedProvider}) as a new application.`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Customer Summary Card */}
          <div className="bg-muted/40 border border-border/80 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="w-10 h-10 ring-1 ring-border">
                  <AvatarImage src={application.customerProfileImage?.[0] || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                    {application.customerName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'CU'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-foreground truncate">{application.customerName}</p>
                  <p className="text-xs text-muted-foreground truncate">{application.customerEmail || 'No Email'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs font-mono bg-background">
                  #{application.applicationNumber || application.applicationId || 'N/A'}
                </Badge>
                <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-medium">
                  Current: {currentProvider}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Phone:</span>
                <span className="font-semibold text-foreground">{application.customerContact || 'N/A'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">PAN:</span>
                <span className="font-semibold text-foreground font-mono">{application.customerPAN || 'N/A'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Location:</span>
                <span className="font-semibold text-foreground truncate block">
                  {application.customerLocation || application.customerState || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Customer ID:</span>
                <span className="font-semibold text-foreground font-mono">#{application.customerId}</span>
              </div>
            </div>
          </div>

          {/* Provider Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                {isSameProvider ? 'Lender / Provider' : 'Select Alternative Lender / Provider'} <span className="text-destructive">*</span>
              </Label>
              {isSameProvider ? (
                <span className="text-[11px] text-blue-500 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Same Lender — Will update existing application
                </span>
              ) : (
                <span className="text-[11px] text-amber-500 font-medium flex items-center gap-1">
                  <Copy className="w-3 h-3" /> Alternative Lender — Will create new cloned application
                </span>
              )}
            </div>

            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger className="w-full h-11 bg-background border-border text-sm font-medium rounded-lg">
                <SelectValue placeholder="Choose lender/provider" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {allProviders.map(p => {
                  const isCurrent = p.toLowerCase() === currentProvider.toLowerCase();
                  return (
                    <SelectItem key={p} value={p} className="text-xs font-medium flex items-center justify-between">
                      <span>{p}</span>
                      {isCurrent && (
                        <span className="ml-2 text-[10px] text-muted-foreground italic">(Current Provider)</span>
                      )}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              {isSameProvider
                ? 'Keeping the same lender will update this existing application in place without creating a duplicate.'
                : 'Choosing a different lender will generate a brand new cloned application while keeping this existing one intact.'}
            </p>

            {/* Duplicate Check Loading Indicator */}
            {isCheckingDuplicate && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground p-2.5 bg-muted/40 rounded-lg border border-border/50 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                <span>Checking lender availability for this customer...</span>
              </div>
            )}

            {/* Duplicate Application Alert Banner */}
            {!isCheckingDuplicate && duplicateInfo?.isDuplicate && (
              <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 space-y-3 animate-in fade-in-50 duration-200">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-destructive/20 text-destructive flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-destructive flex items-center gap-1.5">
                        Duplicate Application Detected
                      </h4>
                      {duplicateInfo.daysRemaining !== undefined && (
                        <Badge variant="destructive" className="text-[11px] font-mono">
                          {duplicateInfo.daysRemaining} {duplicateInfo.daysRemaining === 1 ? 'day' : 'days'} remaining
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-foreground/90 font-medium leading-relaxed">
                      {duplicateInfo.message || `An application with lender "${selectedProvider}" already exists for this customer within 30 days.`}
                    </p>
                  </div>
                </div>

                {duplicateInfo.application && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 rounded-lg bg-background/80 border border-border/80 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Existing App No:</span>
                      <span className="font-mono font-bold text-foreground">
                        #{duplicateInfo.application.application_no}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Applied On:</span>
                      <span className="font-medium text-foreground">
                        {duplicateInfo.application.application_date
                          ? new Date(duplicateInfo.application.application_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : 'Recent'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Status:</span>
                      <span className="font-medium text-foreground capitalize">
                        {duplicateInfo.ticket?.status || (duplicateInfo.application.is_picked === 1 ? 'Under Review' : 'Submitted')}
                      </span>
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-destructive flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Please select a different lender to clone or update this application.</span>
                </p>
              </div>
            )}
          </div>

          {/* Loan Details Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-primary" />
                Loan Amount (₹) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  value={loanAmount}
                  onChange={e => setLoanAmount(e.target.value)}
                  placeholder="e.g. 500000"
                  className="h-10 text-sm font-semibold pl-8 bg-background"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">
                  ₹
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">
                {formatCurrencyINR(loanAmount)}
              </span>
            </div>

            {/* Tenure */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-primary" />
                Tenure (Years) <span className="text-destructive">*</span>
              </Label>
              <Select value={tenure} onValueChange={setTenure}>
                <SelectTrigger className="h-10 text-sm bg-background">
                  <SelectValue placeholder="Select tenure" />
                </SelectTrigger>
                <SelectContent className="max-h-52">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30].map(yr => (
                    <SelectItem key={yr} value={String(yr)} className="text-xs">
                      {yr} {yr === 1 ? 'Year' : 'Years'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Loan Type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-primary" />
                Loan Type
              </Label>
              <Select value={loanType} onValueChange={setLoanType}>
                <SelectTrigger className="h-10 text-sm bg-background">
                  <SelectValue placeholder="Select loan type" />
                </SelectTrigger>
                <SelectContent className="max-h-52">
                  {LOAN_TYPES.map(lt => (
                    <SelectItem key={lt.value} value={lt.value} className="text-xs">
                      {lt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Loan Category */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-primary" />
                Loan Category
              </Label>
              <Select value={loanCategory} onValueChange={(val: any) => setLoanCategory(val)}>
                <SelectTrigger className="h-10 text-sm bg-background">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unsecured" className="text-xs">
                    Unsecured
                  </SelectItem>
                  <SelectItem value="secured" className="text-xs">
                    Secured
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Footer with dual action buttons */}
        <DialogFooter className="p-4 px-6 bg-muted/20 border-t border-border flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Option 2: Edit in Full Application Form */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleEditInFullForm}
              disabled={isSubmitting || isPreFilling || !selectedProvider}
              className="text-xs font-medium border-border/80 hover:bg-muted text-foreground gap-1.5"
            >
              {isPreFilling ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading Details...</span>
                </>
              ) : (
                <>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Edit Full Application Form</span>
                </>
              )}
            </Button>

            {/* Option 1: Direct 1-Click Update or Clone & Submit */}
            <Button
              type="button"
              size="sm"
              onClick={handleDirectClone}
              disabled={isSubmitting || !selectedProvider || Boolean(duplicateInfo?.isDuplicate) || isCheckingDuplicate}
              title={duplicateInfo?.isDuplicate ? 'Duplicate application exists with this lender' : undefined}
              className={`text-xs font-semibold text-white gap-1.5 shadow-sm transition-all ${
                Boolean(duplicateInfo?.isDuplicate)
                  ? 'bg-destructive/70 hover:bg-destructive/70 cursor-not-allowed opacity-60'
                  : isSameProvider
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{isSameProvider ? 'Updating Application...' : 'Cloning Application...'}</span>
                </>
              ) : duplicateInfo?.isDuplicate ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Duplicate Lender (Blocked)</span>
                </>
              ) : isSameProvider ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Update Application</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Clone with Different Provider</span>
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
