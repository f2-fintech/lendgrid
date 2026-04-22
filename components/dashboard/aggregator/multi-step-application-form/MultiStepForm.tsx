import React, { useState, useEffect } from 'react';
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
    { id: 1, name: 'Statement Upload', icon: '📄' },
    { id: 2, name: 'Profile & Proof', icon: '🆔' },
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
        customerId,
        setCustomerId,
        applicationNumber,
        setApplicationNumber,
        formData,
        setFormData,
        nextStep,
        prevStep,
    } = useFormContext();

    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const [skippedSteps, setSkippedSteps] = useState<number[]>([])
    const [showStep0, setShowStep0] = useState(true);

    // Scroll to top on step change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeStep, showStep0]);

    const token = getCookie("lendgrid_cookie")
    const decoded = decodeJwt(token)
    // Guest mode: use prop directly; authenticated mode: read from JWT
    const isOmsEnabled = guestIsOmsEnabled ?? (decoded?.isOmsEnabled ?? false)

    // Guest mode: use URL-sourced companyId; authenticated mode: read from JWT / localStorage
    const companyId =
        guestCompanyId ??
        (typeof window !== 'undefined' ? getCompanyId() : null);
    const commonHeaders = {
        'Content-Type': 'application/json',
        ...(companyId ? { 'companyid': companyId } : {}),
    };

    useEffect(() => {
        const savedCustomerId = localStorage.getItem('loanFormCustomerId');
        const savedAppNumber = localStorage.getItem('loanFormAppNumber');
        const savedFormData = localStorage.getItem('loanFormData');

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
    }, []);

    useEffect(() => {
        if (customerId) {
            localStorage.setItem('loanFormCustomerId', customerId);
        }
        if (applicationNumber) {
            localStorage.setItem('loanFormAppNumber', applicationNumber);
        }
        if (Object.keys(formData).length > 0) {
            localStorage.setItem('loanFormData', JSON.stringify(formData));
        }
    }, [customerId, applicationNumber, formData]);

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
                ...(companyId ? { company_id: companyId } : {}),
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

    // Step 1 Submit Handler
    const handleStep1Submit = async (data: Step1FormData, existingCustomerId: string) => {
        setIsLoading(true);
        try {
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
            };

            // Register customer or use existing
            let newCustomerId = existingCustomerId || customerId;
            if (!newCustomerId) {
                newCustomerId = await registerCustomer(customerData);
                setCustomerId(newCustomerId);
            }

            // Create customer info
            const { title, name, email, contact, dob, ...restData } = data;
            await createCustomerInfo(newCustomerId, restData);

            // Create applications for each provider
            const appNumbers: string[] = [];
            for (const provider of formData.providers) {
                const providerAmount =
                    formData.providerAmounts.find((pa) => pa.provider === provider)?.amount ||
                    formData.amount;

                const appNumber = generateApplicationNumber();
                const applicationData = {
                    customer_id: newCustomerId,
                    application_no: appNumber,
                    amount: providerAmount,
                    tenure: formData.tenure,
                    provider,
                    loan_type: formData.loanType,
                    loan_category: formData.loanCategory,
                    lead_type: formData.leadType,
                    existing_loans: JSON.stringify(formData.existingLoans.map((l) => ({
                        has_running_loans: l.hasRunningLoans === 'yes' ? 1 : 0,
                        which_loan: l.whichLoan || null,
                        loan_amount: l.loanAmount ? Number(l.loanAmount) : null,
                        running_emi: l.runningEmi ? Number(l.runningEmi) : null
                    }))),
                    case_type: formData.caseType,
                    is_picked: isOmsEnabled ? 0 : 1,
                    source: guestSource || 'lendgrid',
                    // Guest mode: pass aggregator's MongoDB _id so the server can set aggregatorId without a JWT
                    ...(aggregatorProfileId ? { aggregator_id: aggregatorProfileId } : {}),
                };

                const applicationId = await createApplication(applicationData);
                await createLoanTracking(applicationId);
                appNumbers.push(appNumber);

                // Create ticket only if OMS is NOT enabled
                if (!isOmsEnabled) {
                    await fetch(`${process.env.NEXT_PUBLIC_ADMIN_URL}/create-ticket`, {
                        method: 'POST',
                        headers: commonHeaders,
                        body: JSON.stringify({
                            customer_application_id: applicationId,
                            user_id: companyId,
                            status: "operations",
                        }),
                    });
                }
            }

            setApplicationNumber(appNumbers[0]);
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

    // Step 2 Submit Handler (Statement Upload)
    const handleStep2Submit = async (files: File[]) => {
        if (!customerId) return;

        setIsLoading(true);
        try {
            for (const file of files) {
                const url = await uploadToS3(file, file.name);
                await createDocument({
                    customer_id: customerId,
                    document_url: url,
                    type: 'bank statement',
                });
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

    // Step 3 Submit Handler (Profile Documents)
    const handleStep3Submit = async (files: {
        aadharFront: File | null;
        aadharBack: File | null;
        pancard: File | null;
        passportSizePhoto: File | null;
    }) => {
        if (!customerId) return;

        setIsLoading(true);
        try {
            const uploads = [
                { file: files.aadharFront, type: 'aadhaar front' },
                { file: files.aadharBack, type: 'aadhaar back' },
                { file: files.pancard, type: 'pancard' },
                { file: files.passportSizePhoto, type: 'photo' },
            ];

            for (const { file, type } of uploads) {
                if (file) {
                    const url = await uploadToS3(file, file.name);
                    await createDocument({
                        customer_id: customerId,
                        document_url: url,
                        type,
                    });
                }
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
    const handleStep4Submit = async (data: Step4FormData, certificates: File[]) => {
        if (!customerId) return;

        setIsLoading(true);
        try {
            // Update customer info with salary data
            await updateCustomerInfo(customerId, {
                salary: data.salary,
                existing_emi: data.existing_emi,
                existing_liability: data.existing_liability,
            });

            // Upload certificates
            for (const file of certificates) {
                const url = await uploadToS3(file, file.name);
                await createDocument({
                    customer_id: customerId,
                    document_url: url,
                    type: 'certificate',
                });
            }

            // Clear localStorage
            localStorage.removeItem('loanFormCustomerId');
            localStorage.removeItem('loanFormAppNumber');
            localStorage.removeItem('loanFormData');

            setCompletedSteps((prev) => [...prev, 3]);

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
                                    <Step1Form onSubmit={handleStep1Submit} isLoading={isLoading} onBack={handleBackFromStep1} />
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
