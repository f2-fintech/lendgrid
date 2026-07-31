import React, { createContext, useContext, useState, useCallback } from 'react';

interface FormContextType {
    activeStep: number;
    setActiveStep: (step: number) => void;
    customerId: string | null;
    setCustomerId: (id: string | null) => void;
    applicationNumber: string | null;
    setApplicationNumber: (num: string | null) => void;
    formData: {
        amount: string;
        tenure: string;
        loanType: string;
        loanCategory: string;
        leadType: string;
        providers: string[];
        providerAmounts: { provider: string; amount: string }[];
        existingLoans: { hasRunningLoans: string; whichLoan: string; loanAmount: string; runningEmi: string }[];
        caseType: string;
        businessEntityType: string; // 'sole_proprietorship' | 'private_limited' | 'partnership' | ''
        referralCode?: string;
    };
    setFormData: (data: any) => void;
    nextStep: () => void;
    prevStep: () => void;
    resetForm: () => void;
    goToStep0: () => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export const useFormContext = () => {
    const context = useContext(FormContext);
    if (!context) {
        throw new Error('useFormContext must be used within FormProvider');
    }
    return context;
};

export const FormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [applicationNumber, setApplicationNumber] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        amount: '',
        tenure: '',
        loanType: '',
        loanCategory: '',
        leadType: 'null',
        providers: [] as string[],
        providerAmounts: [] as { provider: string; amount: string }[],
        existingLoans: [{ hasRunningLoans: '', whichLoan: '', loanAmount: '', runningEmi: '' }],
        caseType: 'fresh',
        businessEntityType: '',
        referralCode: '',
    });

    const nextStep = useCallback(() => {
        setActiveStep((prev) => Math.min(prev + 1, 3));
    }, []);

    const prevStep = useCallback(() => {
        setActiveStep((prev) => Math.max(prev - 1, 0));
    }, []);

    const resetForm = useCallback(() => {
        setActiveStep(0);
        setCustomerId(null);
        setApplicationNumber(null);
        setFormData({
            amount: '',
            tenure: '',
            loanType: '',
            loanCategory: '',
            leadType: 'null',
            providers: [],
            providerAmounts: [],
            existingLoans: [{ hasRunningLoans: '', whichLoan: '', loanAmount: '', runningEmi: '' }],
            caseType: 'fresh',
            businessEntityType: '',
            referralCode: '',
        });
    }, []);

    const goToStep0 = useCallback(() => {
        setActiveStep(0);
    }, []);

    return (
        <FormContext.Provider
            value={{
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
                goToStep0
            }}
        >
            {children}
        </FormContext.Provider>
    );
};
