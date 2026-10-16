import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Ban } from 'lucide-react';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

import { FormProvider, useFormContext } from './FormContext';
import { Step0Form } from './Step0Form';
import { Step1Form } from './Step1Form';
import { Step2Form } from './Step2Form';
import { Step3Form } from './Step3Form';
import { Step4Form } from './Step4Form';
import { Step1FormData, Step4FormData } from './validation';
import { DOC_KEY_TO_DB_TYPE, COAPP_DOC_KEY_TO_DB_TYPE } from './formConstants';
import { useToast } from '@/hooks/use-toast';
import { getCompanyId } from '@/lib/http-client';
import { decodeJwt, getCookie } from '@/lib/utils';
import { DesktopStepper } from './DesktopStepper';
import { MobileStepper } from './MobileStepper';

interface MultiStepFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    apiBaseUrl: string;
    providers: string[];
    onSuccess?: () => void;
    /** Guest/public mode props — set when no JWT is available */
    guestCompanyId?: string;
    aggregatorProfileId?: string;
    guestIsOmsEnabled?: boolean;
    guestSource?: string;
}

const allSteps = [
    { id: -1, name: 'Loan Details', icon: '💰' },
    { id: 0, name: 'Basic Details', icon: '📋' },
    { id: 1, name: 'Documents Upload', icon: '📄' },
    { id: 2, name: 'Core Documents', icon: '🆔' },
    { id: 3, name: 'Additional Details', icon: '💼' },
];

export const MultiStepFormContent: React.FC<{
    apiBaseUrl: string;
    providers: string[];
    onClose: () => void;
    onSuccess?: () => void;
    /** Guest/public mode — when set, skips JWT reads entirely */
    guestCompanyId?: string;
    aggregatorProfileId?: string;
    guestIsOmsEnabled?: boolean;
    guestSource?: string;
}> = ({ apiBaseUrl, providers, onClose, onSuccess, guestCompanyId, aggregatorProfileId, guestIsOmsEnabled, guestSource }) => {
    const {
        activeStep,
        setActiveStep,
        customerId,
        setCustomerId,
        applicationNumber,
        setApplicationNumber,
        formData,
        setFormData,
        nextStep,
        prevStep,
        resetForm,
    } = useFormContext();

    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const [skippedSteps, setSkippedSteps] = useState<number[]>([])
    const [showStep0, setShowStep0] = useState(true);
    const [isHydrated, setIsHydrated] = useState(false);

    // Scroll to top on step change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeStep, showStep0]);

    const token = getCookie("lendgrid_cookie")
    const decoded = decodeJwt(token)
    // Guest mode: use prop directly; authenticated mode: read from JWT
    const isOmsEnabled = guestIsOmsEnabled ?? (decoded?.isOmsEnabled ?? false)
    const roleLower = String(decoded?.role || '').toLowerCase()
    const isOmsSalesSession =
        decoded?.source === 'oms' ||
        roleLower === 'sales' ||
        roleLower === 'lendgrid_sales'
    const omsSalesUserId =
        decoded?.id ??
        decoded?.userId ??
        decoded?.sub ??
        decoded?.salesUserId ??
        decoded?.user_id;

    // Guest mode: use URL-sourced companyId; authenticated mode: read from JWT / localStorage
    const companyId =
        guestCompanyId ??
        (typeof window !== 'undefined' ? getCompanyId() : null);
    const resolvedCompanyId =
        companyId && companyId !== 'all' ? String(companyId) : '';
    const commonHeaders = {
        'Content-Type': 'application/json',
        ...(resolvedCompanyId ? { 'companyid': resolvedCompanyId } : {}),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };

    useEffect(() => {
        const savedCustomerId = localStorage.getItem('loanFormCustomerId');
        const savedAppNumber = localStorage.getItem('loanFormAppNumber');
        const savedFormData = localStorage.getItem('loanFormData');
        const savedActiveStep = localStorage.getItem('activeStep');
        const savedCompleted = localStorage.getItem('loanFormCompletedSteps');
        const savedSkipped = localStorage.getItem('loanFormSkippedSteps');

        let initialSkipped: number[] = [];
        if (savedSkipped) {
            try {
                initialSkipped = JSON.parse(savedSkipped);
                setSkippedSteps(initialSkipped);
            } catch (e) {
                console.error('Error parsing saved skipped steps', e);
            }
        }

        let initialCompleted: number[] = [];
        if (savedCompleted) {
            try {
                initialCompleted = JSON.parse(savedCompleted);
            } catch (e) {
                console.error('Error parsing saved completed steps', e);
            }
        }

        const parsedStep = savedActiveStep ? parseInt(savedActiveStep, 10) : 0;
        if (savedActiveStep) {
            setActiveStep(parsedStep);
        }

        // Backfill completed steps prior to activeStep if not recorded
        if (!isNaN(parsedStep) && parsedStep > 0) {
            for (let s = 0; s < parsedStep; s++) {
                if (!initialCompleted.includes(s) && !initialSkipped.includes(s)) {
                    initialCompleted.push(s);
                }
            }
        }

        // Reconcile with draft keys if present
        if (savedCustomerId || localStorage.getItem('step1CustomerDraft')) {
            if (!initialCompleted.includes(0)) initialCompleted.push(0);
        }
        if (localStorage.getItem('step2UploadedDocs') || localStorage.getItem('step2BankingPassword')) {
            if (!initialCompleted.includes(1) && !initialSkipped.includes(1)) initialCompleted.push(1);
        }
        if (localStorage.getItem('step3UploadedDocs')) {
            if (!initialCompleted.includes(2) && !initialSkipped.includes(2)) initialCompleted.push(2);
        }

        if (initialCompleted.length > 0) {
            setCompletedSteps(initialCompleted);
        }

        if (savedCustomerId) setCustomerId(savedCustomerId);
        if (savedAppNumber) setApplicationNumber(savedAppNumber);
        if (savedFormData) {
            try {
                const parsed = JSON.parse(savedFormData);
                if (parsed.amount && parsed.loanType && parsed.tenure && parsed.providers?.length > 0) {
                    setFormData(JSON.parse(savedFormData));
                    setShowStep0(false);
                }
            } catch (e) {
                console.error('Error parsing saved form data', e);
            }
        }

        setIsHydrated(true);
    }, []);

    // Keep completedSteps in sync with activeStep transitions (e.g. forward navigation)
    useEffect(() => {
        if (!isHydrated || showStep0) return;
        if (activeStep > 0) {
            setCompletedSteps((prev) => {
                const needed: number[] = [];
                for (let s = 0; s < activeStep; s++) {
                    if (!prev.includes(s) && !skippedSteps.includes(s)) {
                        needed.push(s);
                    }
                }
                return needed.length > 0 ? [...prev, ...needed] : prev;
            });
        }
    }, [activeStep, showStep0, skippedSteps, isHydrated]);

    useEffect(() => {
        if (!isHydrated) return;
        localStorage.setItem('activeStep', activeStep.toString());
        if (customerId) {
            localStorage.setItem('loanFormCustomerId', customerId);
        }
        if (applicationNumber) {
            localStorage.setItem('loanFormAppNumber', applicationNumber);
        }
        if (Object.keys(formData).length > 0) {
            localStorage.setItem('loanFormData', JSON.stringify(formData));
        }
        localStorage.setItem('loanFormCompletedSteps', JSON.stringify(completedSteps));
        localStorage.setItem('loanFormSkippedSteps', JSON.stringify(skippedSteps));
    }, [activeStep, customerId, applicationNumber, formData, completedSteps, skippedSteps, isHydrated]);

    const generateApplicationNumber = () => {
        return Math.floor(10000000 + Math.random() * 90000000).toString();
    };

    // API call to register customer
    const registerCustomer = async (customerData: any) => {
        const response = await fetch(`${apiBaseUrl}/create-customer`, {
            method: 'POST',
            headers: commonHeaders,
            body: JSON.stringify(customerData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Registration failed');
        }

        const result = await response.json();
        console.log('REGISTER CUSTOMER RESULT:', result);
        return result.data.id;
    };

    // API call to create customer info
    const createCustomerInfo = async (customerId: string | null, infoData: any) => {
        await fetch(`${apiBaseUrl}/create-customer-info`, {
            method: 'POST',
            headers: commonHeaders,
            body: JSON.stringify({
                customer_id: customerId,
                ...infoData,
            }),
        });
        console.log('CREATE CUSTOMER INFO:', {
            customer_id: customerId,
            ...infoData,
        });
    };

    // API call to create application
    const createApplication = async (appData: any) => {
        const response = await fetch(`${apiBaseUrl}/create-application`, {
            method: 'POST',
            headers: commonHeaders,
            body: JSON.stringify(appData),
        });

        const result = await response.json();
        return result.data.applicationId;
    };

    const createLoanTracking = async (applicationId: string) => {
        const response = await fetch(`${apiBaseUrl}/create-loan-tracking`, {
            method: 'POST',
            headers: commonHeaders,
            body: JSON.stringify({
                customer_application_id: applicationId,
                status: 'submitted',
                ...(resolvedCompanyId ? { company_id: Number(resolvedCompanyId) } : {}),
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create loan tracking');
        }
    };

    // API call to upload to S3
    const uploadToS3 = async (file: File, folder: string) => {
        const formData = new FormData();
        formData.append('document', file);
        formData.append('folder', `document/${folder}`);

        const response = await fetch(`${apiBaseUrl}/upload-to-s3`, {
            method: 'POST',
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: formData,
        });

        const result = await response.json();
        return result.data;
    };

    // API call to create document record
    const createDocument = async (documentData: any) => {
        await fetch(`${apiBaseUrl}/create-document`, {
            method: 'POST',
            headers: commonHeaders,
            body: JSON.stringify(documentData),
        });
        console.log('CREATE DOCUMENT:', documentData);
    };

    // API call to create customer partners
    const createCustomerPartners = async (partnersData: any[]) => {
        const response = await fetch(`${apiBaseUrl}/create-customer-partners`, {
            method: 'POST',
            headers: commonHeaders,
            body: JSON.stringify(partnersData),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create partners');
        }
        console.log('CREATE PARTNERS:', partnersData);
    };

    // API call to update customer info
    const updateCustomerInfo = async (customerId: string, updates: any) => {
        await fetch(`${apiBaseUrl}/customer-info-update`, {
            method: 'PATCH',
            headers: commonHeaders,
            body: JSON.stringify({
                customer_id: customerId,
                ...updates,
            }),
        });
        console.log('UPDATE CUSTOMER INFO:', {
            customer_id: customerId,
            ...updates,
        });
    };

    const handleStep0Submit = () => {
        setShowStep0(false);
        // The form data is already saved in context by Step0Form
    };

    const handleBackFromStep1 = () => {
        setShowStep0(true);       // show Step-0 again
    };

    // Handler for the "Start Fresh" button in the duplicate banner
    // Clears all form-related localStorage keys, resets context state,
    // and returns the user to the Loan Details screen (Step-0) with empty fields.
    const handleStartFresh = useCallback(() => {
        localStorage.removeItem('activeStep');
        localStorage.removeItem('loanFormCustomerId');
        localStorage.removeItem('loanFormAppNumber');
        localStorage.removeItem('loanFormData');
        localStorage.removeItem('step1CustomerDraft');
        localStorage.removeItem('step2BankingPassword');
        localStorage.removeItem('step2IsPdfProtected');
        localStorage.removeItem('step2UploadedDocs');
        localStorage.removeItem('step3UploadedDocs');
        localStorage.removeItem('loanFormCompletedSteps');
        localStorage.removeItem('loanFormSkippedSteps');
        resetForm();
        setShowStep0(true);
        setCompletedSteps([]);
        setSkippedSteps([]);
    }, [resetForm]);

    // Step 1 Submit Handler
    // ─────────────────────────────────────────────────────────────────────────
    // PORTED FROM f2fintech-admin (Step1Form.tsx → create() callback):
    //   At this step we ONLY create/update the customer + customer-info records.
    //   create-application and create-loan-tracking are intentionally deferred
    //   to Step 4 (the final submit), mirroring the admin portal's logic.
    // ─────────────────────────────────────────────────────────────────────────
    const handleStep1Submit = async (data: Step1FormData, existingCustomerId: string) => {
        setIsLoading(true);
        try {
            if (isOmsSalesSession && !resolvedCompanyId) {
                throw new Error('Please select an aggregator before creating the application.');
            }

            const randomFourDigit = 8462;

            // Prepare customer data
            const customerData = {
                title: data.title,
                name: `${data.title} ${data.name}`,
                email: data.email,
                contact: data.contact,
                dob: data.dob,
                password: `${data.name.replace(/\s/g, '')}@${randomFourDigit}`,
                status: 'active',
                ...(resolvedCompanyId ? { company_id: Number(resolvedCompanyId) } : {}),
            };

            // Register customer or use existing
            let newCustomerId: string = existingCustomerId || customerId || '';
            let customerInfoExists = false;

            if (newCustomerId) {
                try {
                    const infoRes = await fetch(`${apiBaseUrl}/customer-info/${newCustomerId}`, {
                        headers: commonHeaders,
                    });
                    if (infoRes.ok) {
                        const resData = await infoRes.json();
                        if (resData.status === 'Success' || resData.data || resData.statusCode === 200) {
                            customerInfoExists = true;
                        }
                    }
                } catch {
                    customerInfoExists = false;
                }
            }

            if (!newCustomerId) {
                newCustomerId = await registerCustomer(customerData);
                setCustomerId(newCustomerId);

                // For returning customers, check if customer_info already exists in DB
                try {
                    const infoRes = await fetch(`${apiBaseUrl}/customer-info/${newCustomerId}`, {
                        headers: commonHeaders,
                    });
                    if (infoRes.ok) {
                        const resData = await infoRes.json();
                        if (resData.status === 'Success' || resData.data || resData.statusCode === 200) {
                            customerInfoExists = true;
                        }
                    }
                } catch {
                    customerInfoExists = false;
                }
            }

            // Create or update customer info (addresses, PAN, employment type, etc.)
            const { title, name, email, contact, dob, ...restData } = data;
            if (!customerInfoExists) {
                await createCustomerInfo(newCustomerId, restData);
            } else {
                await updateCustomerInfo(newCustomerId, restData);
            }

            // Persist full customer data and employment_type into FormContext formData
            setFormData((prev: any) => ({
                ...prev,
                ...data,
                employment_type: data.employment_type,
            }));

            if (typeof window !== 'undefined') {
                localStorage.setItem('step1CustomerDraft', JSON.stringify(data));
            }

            // Use a placeholder so the form can progress without a real app number yet
            setApplicationNumber('pending');
            setCompletedSteps((prev) =>
                prev.includes(0) ? prev : [...prev, 0]
            );

            toast({
                title: 'Success',
                description: 'Basic details submitted successfully',
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to submit basic details',
                variant: 'destructive',
            });
            throw error; // Re-throw to prevent moving to next step
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2 Submit Handler (Loan-Specific Document Upload)
    // Named files are uploaded to S3 with their correct document-type strings.
    // Text fields (e.g. banking password, person details) are persisted into
    // pendingApplicationData in localStorage for use at final submission.
    const handleStep2Submit = async (
        namedFiles: Record<string, File | null>,
        textFields: Record<string, string>
    ) => {
        if (!customerId) return;

        setIsLoading(true);
        try {
            // Upload each named file with a descriptive type string
            const newlyUploaded: Record<string, { url: string; name: string }> = {};
            for (const [fieldKey, file] of Object.entries(namedFiles)) {
                if (!file) continue;

                let docType = DOC_KEY_TO_DB_TYPE[fieldKey] || fieldKey;
                if (fieldKey.includes('_aadhaar')) docType = 'aadhaar front';
                if (fieldKey.includes('_pan')) docType = 'pancard';

                const url = await uploadToS3(file, file.name);

                const cleanPassword = textFields.bankingPassword?.trim();

                await createDocument({
                    customer_id: customerId,
                    document_url: url,
                    type: docType,
                    ...(resolvedCompanyId ? { company_id: Number(resolvedCompanyId) } : {}),
                    ...(cleanPassword ? { pdf_password: cleanPassword } : {}),
                });

                newlyUploaded[fieldKey] = { url, name: file.name };
            }

            if (Object.keys(newlyUploaded).length > 0) {
                try {
                    const raw = localStorage.getItem('step2UploadedDocs');
                    const prev = raw ? JSON.parse(raw) : {};
                    localStorage.setItem('step2UploadedDocs', JSON.stringify({ ...prev, ...newlyUploaded }));
                } catch (e) {}
            }

            // Submit partner details if present
            if (textFields.personDetails) {
                try {
                    const parsedPartners = JSON.parse(textFields.personDetails);
                    if (Array.isArray(parsedPartners) && parsedPartners.length > 0) {
                        const entity = formData.businessEntityType || '';
                        const isPartnership = entity === 'partnership' || entity === 'llp';
                        const role = isPartnership ? 'partner' : 'director';
                        const partnersData = parsedPartners.map((p: any) => ({
                            customer_id: Number(customerId),
                            name: p.name || '',
                            email: p.email || '',
                            aadhaar: p.aadhaar || '',
                            pan: p.pan || '',
                            mobile: p.mobile || '',
                            role,
                            ...(resolvedCompanyId ? { company_id: Number(resolvedCompanyId) } : {}),
                        }));
                        await createCustomerPartners(partnersData);
                    }
                } catch (e) {
                    console.error("Failed to parse personDetails", e);
                }
            }

            // Merge text fields into formData
            if (Object.keys(textFields).length > 0) {
                const updatedFormData = { ...formData, step2TextFields: textFields };
                setFormData(updatedFormData);
            }

            setCompletedSteps((prev) =>
                prev.includes(1) ? prev : [...prev, 1]
            );
        } catch (error: any) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // Step 3 Submit Handler (Profile & Address Proof Documents)
    const handleStep3Submit = async (files: {
        aadharFront: File | null;
        aadharBack: File | null;
        pancard: File | null;
        passportSizePhoto: File | null;
        currentAddressProof: File | null;
        permanentAddressProof: File | null;
        salarySlip?: File | null;
        form26as?: File | null;
    }) => {
        if (!customerId) return;

        setIsLoading(true);
        try {
            const uploads = [
                { key: 'aadharFront', file: files.aadharFront, type: DOC_KEY_TO_DB_TYPE.aadharFront || 'aadhaar front' },
                { key: 'aadharBack', file: files.aadharBack, type: DOC_KEY_TO_DB_TYPE.aadharBack || 'aadhaar back' },
                { key: 'pancard', file: files.pancard, type: DOC_KEY_TO_DB_TYPE.pancard || 'pancard' },
                { key: 'passportSizePhoto', file: files.passportSizePhoto, type: DOC_KEY_TO_DB_TYPE.passportSizePhoto || 'profile photo' },
                { key: 'currentAddressProof', file: files.currentAddressProof, type: DOC_KEY_TO_DB_TYPE.currentAddressProof || 'current address proof' },
                { key: 'permanentAddressProof', file: files.permanentAddressProof, type: DOC_KEY_TO_DB_TYPE.permanentAddressProof || 'current address proof' },
                { key: 'salarySlip', file: files.salarySlip, type: DOC_KEY_TO_DB_TYPE.salarySlip || 'salary slip' },
                { key: 'form26as', file: files.form26as, type: DOC_KEY_TO_DB_TYPE.form26as || 'form 26 as' },
            ];

            const newlyUploaded: Record<string, { url: string; name: string }> = {};
            for (const { key, file, type } of uploads) {
                if (file) {
                    const url = await uploadToS3(file, file.name);
                    await createDocument({
                        customer_id: customerId,
                        document_url: url,
                        type,
                        ...(resolvedCompanyId ? { company_id: Number(resolvedCompanyId) } : {}),
                    });
                    newlyUploaded[key] = { url, name: file.name };
                }
            }

            if (Object.keys(newlyUploaded).length > 0) {
                try {
                    const raw = localStorage.getItem('step3UploadedDocs');
                    const prev = raw ? JSON.parse(raw) : {};
                    localStorage.setItem('step3UploadedDocs', JSON.stringify({ ...prev, ...newlyUploaded }));
                } catch (e) {}
            }

            setCompletedSteps((prev) =>
                prev.includes(2) ? prev : [...prev, 2]
            );
        } catch (error: any) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // Step 4 Submit Handler
    // ─────────────────────────────────────────────────────────────────────────
    // PORTED FROM f2fintech-admin (Step7Form.tsx → create() callback):
    //   This is the final submit. All deferred APIs that were intentionally
    //   skipped at Step 1 are fired here, once all form data is complete:
    //     1. PATCH /customer-info-update  (salary, EMI, liability, co-app details)
    //     2. POST  /create-application    (one record, providers comma-joined)
    //     3. POST  /create-loan-tracking
    //     4. POST  /upload-to-s3 + /create-document  (certificates, co-app files)
    // ─────────────────────────────────────────────────────────────────────────
    const handleStep4Submit = async (
        data: Step4FormData,
        certificates: File[],
        coAppDetails?: {
            coAppRelation: string;
            coAppEmploymentType: string;
            coAppEmail: string;
            coAppMobile: string;
            coAppMotherName: string;
        },
        coAppFiles?: Record<string, File | null>
    ) => {
        if (!customerId) return;

        setIsLoading(true);
        try {
            if (isOmsSalesSession && !resolvedCompanyId) {
                throw new Error('Please select an aggregator before creating the application.');
            }

            // 1. Update customer info with salary/EMI/liability and co-applicant details
            const customerInfoUpdates: Record<string, any> = {
                salary: data.salary,
                existing_emi: data.existing_emi,
                existing_liability: data.existing_liability,
            };

            if (coAppDetails) {
                if (coAppDetails.coAppRelation) customerInfoUpdates.co_applicant_relation = coAppDetails.coAppRelation;
                if (coAppDetails.coAppEmploymentType) customerInfoUpdates.co_applicant_employment_type = coAppDetails.coAppEmploymentType;
                if (coAppDetails.coAppEmail) customerInfoUpdates.co_applicant_email = coAppDetails.coAppEmail;
                if (coAppDetails.coAppMobile) customerInfoUpdates.co_applicant_contact = coAppDetails.coAppMobile;
                if (coAppDetails.coAppMotherName) customerInfoUpdates.co_applicant_mother_name = coAppDetails.coAppMotherName;
            }

            await updateCustomerInfo(customerId, customerInfoUpdates);

            // 2. Upload certificates (optional)
            for (const file of certificates) {
                const url = await uploadToS3(file, file.name);
                await createDocument({
                    customer_id: customerId,
                    document_url: url,
                    type: 'certificate',
                    ...(resolvedCompanyId ? { company_id: Number(resolvedCompanyId) } : {}),
                });
            }

            // 3. Upload Co-Applicant documents (Education Loan)
            if (coAppFiles) {
                for (const [docKey, file] of Object.entries(coAppFiles)) {
                    if (file) {
                        const url = await uploadToS3(file, file.name);
                        await createDocument({
                            customer_id: customerId,
                            document_url: url,
                            type: COAPP_DOC_KEY_TO_DB_TYPE[docKey] || docKey,
                            ...(resolvedCompanyId ? { company_id: Number(resolvedCompanyId) } : {}),
                        });
                    }
                }
            }

            // 4. Fire the deferred application APIs using data from context
            const activeProviders: string[] =
                formData.providers && formData.providers.length > 0
                    ? formData.providers
                    : ['Default Provider'];

            const primaryLoanType: string =
                formData.loanType || 'personal loan';

            const numericTenure: number = formData.tenure
                ? Number(String(formData.tenure).split(' ')[0])
                : 5;

            for (const provider of activeProviders) {
                const providerAmountRecord = formData.providerAmounts?.find((pa: any) => pa.provider === provider);
                const finalAmount = providerAmountRecord && providerAmountRecord.amount 
                    ? Number(providerAmountRecord.amount) 
                    : Number(formData.amount || 100000);

                const appNumber = generateApplicationNumber();

                const applicationPayload = {
                    customer_id: customerId,
                    application_no: appNumber,
                    amount: finalAmount,
                    tenure: numericTenure,
                    provider: provider,
                    loan_type: primaryLoanType,
                    loan_category: formData.loanCategory || 'unsecured',
                    lead_type: formData.leadType || 'null',
                    existing_loans: JSON.stringify(
                        (formData.existingLoans || []).map((l: any) => ({
                            has_running_loans: l.hasRunningLoans === 'yes' ? 1 : 0,
                            which_loan: l.whichLoan || null,
                            loan_amount: l.loanAmount ? Number(l.loanAmount) : null,
                            running_emi: l.runningEmi ? Number(l.runningEmi) : null,
                        }))
                    ),
                    case_type: formData.caseType || 'fresh',
                    source: 'lendgrid',
                    ...(formData.businessEntityType ? { business_entity_type: formData.businessEntityType } : {}),
                    ...(formData.company_official_email ? { company_official_email: formData.company_official_email } : {}),
                    ...(resolvedCompanyId ? { company_id: Number(resolvedCompanyId) } : {}),
                    ...(isOmsSalesSession && omsSalesUserId
                        ? { applied_by: Number(omsSalesUserId) }
                        : {}),
                    ...(aggregatorProfileId ? { aggregator_id: aggregatorProfileId } : {}),
                    ...(formData.referralCode?.trim() ? { referral_code: formData.referralCode.trim() } : {}),
                };

                const applicationId = await createApplication(applicationPayload);
                await createLoanTracking(applicationId);
            }

            // Clear localStorage immediately after successful application creation
            localStorage.removeItem('activeStep');
            localStorage.removeItem('loanFormCustomerId');
            localStorage.removeItem('loanFormAppNumber');
            localStorage.removeItem('loanFormData');
            localStorage.removeItem('step1CustomerDraft');
            localStorage.removeItem('step2BankingPassword');
            localStorage.removeItem('step2IsPdfProtected');
            localStorage.removeItem('step2UploadedDocs');
            localStorage.removeItem('step3UploadedDocs');
            localStorage.removeItem('loanFormCompletedSteps');
            localStorage.removeItem('loanFormSkippedSteps');

            // Reset form context state and local UI state
            resetForm();
            setShowStep0(true);
            setCompletedSteps([]);
            setSkippedSteps([]);

            if (onSuccess) {
                onSuccess();
            }
        } catch (error: any) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const currentStepIndex = showStep0 ? 0 : activeStep + 1;
    const progress = ((currentStepIndex) / (allSteps.length - 1)) * 100;

    return (
        <div className="relative flex flex-col lg:flex-row gap-6 min-h-[600px]">
            {/* Mobile Stepper (Visible only on small screens) */}
            <div className="block lg:hidden w-full -mx-4 px-4 sm:mx-0 sm:px-0">
                <MobileStepper
                    allSteps={allSteps}
                    showStep0={showStep0}
                    activeStep={activeStep}
                    completedSteps={completedSteps}
                    skippedSteps={skippedSteps}
                />
            </div>

            {/* Left Side - Form Content */}
            <div className="flex-1 lg:pr-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={showStep0 ? 'step0' : activeStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {showStep0 ? (
                            <Step0Form providers={providers} onSubmit={handleStep0Submit} />
                        ) : (
                            <>
                                {activeStep === 0 && (
                                    <Step1Form onSubmit={handleStep1Submit} isLoading={isLoading} onBack={handleBackFromStep1} apiBaseUrl={apiBaseUrl} onReset={handleStartFresh} />
                                )}
                                {activeStep === 1 && (
                                    <Step2Form
                                        onSubmit={handleStep2Submit}
                                        isLoading={isLoading}
                                        onSkip={() => {
                                            setSkippedSteps((prev) =>
                                                prev.includes(1) ? prev : [...prev, 1]
                                            );
                                            nextStep();
                                        }}
                                        onBack={prevStep}
                                    />
                                )}
                                {activeStep === 2 && (
                                    <Step3Form
                                        onSubmit={handleStep3Submit}
                                        isLoading={isLoading}
                                        onSkip={() => {
                                            setSkippedSteps((prev) =>
                                                prev.includes(2) ? prev : [...prev, 2]
                                            );
                                            nextStep();
                                        }}
                                    />
                                )}
                                {activeStep === 3 && (
                                    <Step4Form onSubmit={handleStep4Submit} isLoading={isLoading} />
                                )}
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Right Side - Vertical Progress Stepper */}
            <div className="hidden lg:block w-80 flex-shrink-0 pl-6 border-l border-border">
                <DesktopStepper
                    allSteps={allSteps}
                    showStep0={showStep0}
                    activeStep={activeStep}
                    completedSteps={completedSteps}
                    skippedSteps={skippedSteps}
                />
            </div>
        </div>
    );
};

export const MultiStepFormDialog: React.FC<MultiStepFormDialogProps> = ({
    open,
    onOpenChange,
    apiBaseUrl,
    providers,
    onSuccess,
    guestCompanyId,
    aggregatorProfileId,
    guestIsOmsEnabled,
    guestSource,
}) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-background border-border p-6">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold  text-foreground sr-only">
                        Loan Application Form
                    </DialogTitle>
                </DialogHeader>
                <FormProvider>
                    <MultiStepFormContent
                        apiBaseUrl={apiBaseUrl}
                        providers={providers}
                        onClose={() => onOpenChange(false)}
                        onSuccess={onSuccess}
                        guestCompanyId={guestCompanyId}
                        aggregatorProfileId={aggregatorProfileId}
                        guestIsOmsEnabled={guestIsOmsEnabled}
                        guestSource={guestSource}
                    />
                </FormProvider>
            </DialogContent>
        </Dialog>
    );
};
