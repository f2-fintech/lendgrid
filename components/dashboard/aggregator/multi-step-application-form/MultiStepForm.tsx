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

interface MultiStepFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    apiBaseUrl: string;
    providers: string[];
    onSuccess?: () => void;
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
}> = ({ apiBaseUrl, providers, onClose, onSuccess }) => {
    const {
        activeStep,
        customerId,
        setCustomerId,
        applicationNumber,
        setApplicationNumber,
        formData,
        setFormData,
        nextStep,
    } = useFormContext();

    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const [skippedSteps, setSkippedSteps] = useState<number[]>([])
    const [showStep0, setShowStep0] = useState(true);

    const token = getCookie("token")
    const decoded = decodeJwt(token)
    const isOmsEnabled = decoded?.isOmsEnabled ?? false

    const companyId =
        typeof window !== 'undefined'
            ? getCompanyId()
            : null;
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
                    has_running_loans: formData.hasRunningLoans === 'yes',
                    which_loan: formData.hasRunningLoans === 'yes' ? formData.whichLoan : null,
                    running_loan_amount: formData.hasRunningLoans === 'yes' ? Number(formData.runningLoanAmount) : null,
                    case_type: formData.caseType,
                    is_picked: isOmsEnabled ? 0 : 1
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
        <div className="relative flex gap-6 min-h-[600px]">
            {/* Left Side - Form Content */}
            <div className="flex-1 pr-4 overflow-y-auto max-h-[calc(90vh-100px)] scrollbar-hide">
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
            <div className="w-80 flex-shrink-0 pl-6 border-l border-border">
                <div className="sticky top-16 space-y-6">
                    {allSteps.map((step, idx) => {
                        const isActive = showStep0 ? idx === 0 : idx === activeStep + 1;
                        const isCompleted = showStep0
                            ? false
                            : idx === 0 || (idx > 0 && completedSteps.includes(idx - 1));
                        const isSkipped = !showStep0 && idx > 0 && skippedSteps.includes(idx - 1); // Add this line

                        return (
                            <div key={step.id} className="relative">
                                {/* Vertical Line */}
                                {idx < allSteps.length - 1 && (
                                    <div className="absolute left-7 top-14 w-0.5 h-24 bg-muted">
                                        <div
                                            className={`h-full transition-all duration-500 ${isCompleted || isActive
                                                ? 'bg-gradient-to-b from-green-500 to-blue-500'
                                                : isSkipped
                                                    ? 'bg-gradient-to-b from-yellow-500 to-orange-500'
                                                    : 'bg-muted'
                                                }`}
                                            style={{
                                                height: isCompleted ? '100%' : isActive ? '50%' : isSkipped ? '100%' : '0%',
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Step Item */}
                                <div className="flex items-start gap-4 mb-8">
                                    <div
                                        className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 z-10 ${isActive
                                            ? 'bg-gradient-to-br from-blue-500 to-cyan-500 border-2 border-blue-400 shadow-lg shadow-blue-500/50 ring-4 ring-blue-500/20 scale-110'
                                            : isCompleted
                                                ? 'bg-gradient-to-br from-green-600 to-green-500 border-2 border-green-400'
                                                : isSkipped
                                                    ? 'bg-gradient-to-br from-yellow-600 to-orange-500 border-2 border-yellow-400'
                                                    : 'bg-card border-2 border-border'
                                            }`}
                                    >
                                        {isCompleted ? (
                                            <Check className="w-7 h-7  text-foreground" />
                                        ) : isSkipped ? (
                                            <Ban className="w-6 h-6  text-foreground" />
                                            // <span className=" text-foreground text-2xl font-bold">⊘</span>
                                        ) : (
                                            <span className={`text-2xl ${isActive ? 'animate-pulse' : ''}`}>
                                                {step.icon}
                                            </span>
                                        )}
                                    </div>

                                    <div className="pt-3 flex-1">
                                        <p
                                            className={`text-base font-medium leading-tight transition-colors duration-300 ${isActive
                                                ? 'text-blue-400 font-semibold'
                                                : isCompleted
                                                    ? 'text-green-400'
                                                    : isSkipped
                                                        ? 'text-yellow-400'
                                                        : 'text-gray-500'
                                                }`}
                                        >
                                            {step.name}
                                        </p>
                                        {isActive && (
                                            <p className="text-sm  text-muted-foreground mt-1">In Progress</p>
                                        )}
                                        {isCompleted && (
                                            <p className="text-sm text-green-500 mt-1">Completed</p>
                                        )}
                                        {isSkipped && (
                                            <p className="text-sm text-yellow-500 mt-1">Skipped</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
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
                    />
                </FormProvider>
            </DialogContent>
        </Dialog>
    );
};
