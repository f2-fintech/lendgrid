import React, { useState, useEffect } from 'react';
import { Controller, useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    IndianRupee,
    Clock,
    Building2,
    Edit,
    ArrowRight,
    AlertCircle,
    Plus,
} from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"

import { step0Schema, Step0FormData } from './validation';
import { useFormContext } from './FormContext';
import { useToast } from '@/hooks/use-toast';

interface Step0FormProps {
    providers: string[];
    onSubmit: () => void;
}

const loanTypes = {
    unsecured: [
        { value: 'personal loan', label: 'Personal Loan' },
        { value: 'business loan', label: 'Business Loan' },
        { value: 'professional loan', label: 'Professional Loan' },
        { value: 'education loan', label: 'Education Loan' },
        { value: 'just inquiry', label: 'Just Inquiry' },
    ],
    secured: [
        { value: 'home loan', label: 'Home Loan' },
        { value: 'lap', label: 'LAP (Loan Against Property)' },
        { value: 'auto loan', label: 'Auto Loan' },
        { value: 'machinery loan', label: 'Machinery Loan' },
    ],
};

const tenureOptions = {
    unsecured: ['1 Year', '2 Years', '3 Years', '4 Years', '5 Years', '6 Years', '7 Years', '8 Years'],
    secured: ['5 Years', '8 Years', '10 Years', '15 Years', '20 Years', '25 Years', '30 Years'],
};

const leadTypeOptions = [
    { value: 'null', label: 'Null' },
    { value: 'notion', label: 'Notion' },
    { value: 'dialler', label: 'Dialler' },
    { value: 'field visit', label: 'Field Visit' },
    { value: 'sourcer', label: 'Sourcer' },
    { value: 'channel partner', label: 'Channel Partner' },
    { value: 'ref from customer', label: 'Ref from Customer' },
    { value: 'left employee follow up', label: 'Left Employee Follow Up' },
];

export const Step0Form: React.FC<Step0FormProps> = ({ providers, onSubmit }) => {
    const [amountDialogOpen, setAmountDialogOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState<string | null>(null);

    const { formData, setFormData, nextStep } = useFormContext();
    const { toast } = useToast();

    // React Hook Form setup with Zod validation
    const {
        control,
        handleSubmit: handleFormSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<Step0FormData>({
        resolver: zodResolver(step0Schema),
        defaultValues: {
            amount: formData.amount || '',
            loanType: formData.loanType || '',
            loanCategory: formData.loanCategory || '',
            tenure: formData.tenure || '',
            leadType: formData.leadType || 'null',
            providers: formData.providers || [],
            providerAmounts: formData.providerAmounts || [],
            existingLoans: formData.existingLoans || [{ hasRunningLoans: '', whichLoan: '', loanAmount: '', runningEmi: '' }],
            caseType: formData.caseType || 'fresh',
            businessEntityType: formData.businessEntityType || '',
        },
    });

    // Watch form values for reactive updates
    const amount = watch('amount');
    const loanType = watch('loanType');
    const loanCategory = watch('loanCategory');
    const tenure = watch('tenure');
    const leadType = watch('leadType');
    const selectedProviders = watch('providers');
    const providerAmounts = watch('providerAmounts');
    const existingLoans = watch('existingLoans');
    const businessEntityType = watch('businessEntityType');

    const canAddAnotherLoan = existingLoans?.every(loan =>
        loan.hasRunningLoans === 'yes' &&
        loan.whichLoan &&
        loan.loanAmount
    );

    const { fields: loanFields, append: appendLoan, remove: removeLoan } = useFieldArray({
        control,
        name: "existingLoans"
    });

    // Determine loan category based on loan type
    const getLoanCategory = (type: string): string => {
        const securedTypes = ['home loan', 'lap', 'auto loan', 'machinery loan'];
        const unsecuredTypes = [
            'personal loan',
            'business loan',
            'professional loan',
            'education loan',
            'just inquiry',
        ];

        if (securedTypes.includes(type)) return 'secured';
        if (unsecuredTypes.includes(type)) return 'unsecured';
        return '';
    };

    // Handle loan type change
    const handleLoanTypeChange = (value: string) => {
        setValue('loanType', value);
        const category = getLoanCategory(value);
        setValue('loanCategory', category);
        setValue('tenure', ''); // Reset tenure when loan type changes
        // Clear entity type if switching away from business loan
        if (value !== 'business loan') {
            setValue('businessEntityType', '');
        }
    };

    // Handle provider selection
    const handleProviderToggle = (provider: string) => {
        const newProviders = selectedProviders.includes(provider)
            ? selectedProviders.filter((p) => p !== provider)
            : [...selectedProviders, provider];

        setValue('providers', newProviders);

        // Initialize amount for newly selected provider
        if (!selectedProviders.includes(provider)) {
            setValue('providerAmounts', [
                ...providerAmounts,
                { provider, amount: amount || '' },
            ]);
        } else {
            // Remove amount for deselected provider
            setValue('providerAmounts', providerAmounts.filter((pa) => pa.provider !== provider));
        }
    };

    // Update provider amount
    const updateProviderAmount = (provider: string, newAmount: string) => {
        setValue('providerAmounts',
            providerAmounts.map((pa) => (pa.provider === provider ? { ...pa, amount: newAmount } : pa))
        );
    };

    // Handle form submission with React Hook Form
    const onFormSubmit = (data: Step0FormData) => {
        setFormData(data);
        onSubmit();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl mx-auto space-y-6"
        >
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-foreground">
                    Enter the details to get started
                </h2>
            </div>

            <form onSubmit={handleFormSubmit(onFormSubmit)} className="space-y-4">
                {/* Loan Amount */}
                <div>
                    <Label className="text-foreground">Loan Amount*</Label>
                    <div className="relative mt-2">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            type="text"
                            value={amount}
                            onChange={(e) => setValue('amount', e.target.value)}
                            className="bg-card border-border text-foreground pl-10 focus:ring-2 focus:ring-primary/20"
                            placeholder="Enter amount"
                        />
                    </div>
                    {errors.amount && (
                        <p className="text-sm text-red-400 mt-1.5 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.amount.message}
                        </p>
                    )}
                </div>

                {/* Loan Type */}
                <div>
                    <Label className="text-foreground">Loan Type*</Label>
                    <Controller
                        control={control}
                        name="loanType"
                        render={({ field }) => (
                            <Select value={field.value} onValueChange={(value) => {
                                field.onChange(value);
                                handleLoanTypeChange(value);
                            }}>
                                <SelectTrigger className="bg-card border-border text-foreground mt-2">
                                    <div className="flex items-center">
                                        <Building2 className="w-4 h-4 mr-2" />
                                        <SelectValue placeholder="Choose loan type" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border text-popover-foreground">
                                    <div className="px-2 py-1 text-xs font-semibold text-primary select-none">
                                        Unsecured Loans
                                    </div>
                                    {loanTypes.unsecured.map((loan) => (
                                        <SelectItem
                                            key={loan.value}
                                            value={loan.value}
                                            className="focus:bg-accent focus:text-accent-foreground cursor-pointer"
                                        >
                                            {loan.label}
                                        </SelectItem>
                                    ))}
                                    <div className="px-2 py-1 text-xs font-semibold text-primary mt-2 select-none">
                                        Secured Loans
                                    </div>
                                    {loanTypes.secured.map((loan) => (
                                        <SelectItem
                                            key={loan.value}
                                            value={loan.value}
                                            className="focus:bg-accent focus:text-accent-foreground cursor-pointer"
                                        >
                                            {loan.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.loanType && (
                        <p className="text-sm text-red-400 mt-1.5 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.loanType.message}
                        </p>
                    )}
                </div>

                {/* Business Entity Type — only shown for Business Loan */}
                {loanType === 'business loan' && (
                    <div>
                        <Label className="text-foreground">Type of Business Entity*</Label>
                        <Controller
                            control={control}
                            name="businessEntityType"
                            render={({ field }) => (
                                <Select value={field.value || ''} onValueChange={field.onChange}>
                                    <SelectTrigger className="bg-card border-border text-foreground mt-2">
                                        <SelectValue placeholder="Select entity type" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border text-popover-foreground">
                                        <SelectItem value="sole_proprietorship" className="focus:bg-accent focus:text-accent-foreground cursor-pointer">
                                            Sole Proprietorship
                                        </SelectItem>
                                        <SelectItem value="private_limited" className="focus:bg-accent focus:text-accent-foreground cursor-pointer">
                                            Private Limited
                                        </SelectItem>
                                        <SelectItem value="partnership" className="focus:bg-accent focus:text-accent-foreground cursor-pointer">
                                            Partnership Firm
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {loanType === 'business loan' && !businessEntityType && (
                            <p className="text-sm text-amber-400 mt-1.5">Please select a business entity type to continue</p>
                        )}
                    </div>
                )}

                {/* Tenure */}
                <div>
                    <Label className="text-foreground">Loan Tenure*</Label>
                    <Controller
                        control={control}
                        name="tenure"
                        render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange} disabled={!loanCategory}>
                                <SelectTrigger className="bg-card border-border text-foreground mt-2">
                                    <div className="flex items-center">
                                        <Clock className="w-4 h-4 mr-2" />
                                        <SelectValue
                                            placeholder={
                                                loanCategory ? 'Choose tenure' : 'Select loan type first'
                                            }
                                        />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border text-popover-foreground">
                                    {(loanCategory ? tenureOptions[loanCategory as keyof typeof tenureOptions] : []).map((option: string) => (
                                        <SelectItem
                                            key={option}
                                            value={option}
                                            className="focus:bg-accent focus:text-accent-foreground cursor-pointer"
                                        >
                                            {option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.tenure && (
                        <p className="text-sm text-red-400 mt-1.5 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.tenure.message}
                        </p>
                    )}
                </div>

                {/* Providers Multi-Select Combobox */}
                <div>
                    <Label className="text-foreground">Select Providers* (Multiple)</Label>
                    <div className="mt-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between bg-card border border-border text-foreground hover:bg-accent hover:text-accent-foreground font-normal"
                                >
                                    {selectedProviders.length > 0
                                        ? `${selectedProviders.length} selected`
                                        : "Select providers..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0 bg-popover border-border" align="start">
                                <Command className="bg-popover text-popover-foreground">
                                    <CommandInput placeholder="Search provider..." className="h-9" />
                                    <CommandEmpty>No provider found.</CommandEmpty>
                                    <CommandGroup className="max-h-64 overflow-y-auto">
                                        {providers.map((provider) => (
                                            <CommandItem
                                                key={provider}
                                                value={provider}
                                                onSelect={() => handleProviderToggle(provider)}
                                                className="cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
                                            >
                                                <div
                                                    className={cn(
                                                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                        selectedProviders.includes(provider)
                                                            ? "bg-primary text-primary-foreground"
                                                            : "opacity-50 [&_svg]:invisible"
                                                    )}
                                                >
                                                    <Check className={cn("h-4 w-4")} />
                                                </div>
                                                {provider}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Selected Providers with Custom Amounts */}
                    {selectedProviders.length > 0 && (
                        <div className="mt-4 flex flex-col gap-2.5">
                            {selectedProviders.map((provider) => {
                                const providerAmount =
                                    providerAmounts.find((pa) => pa.provider === provider)?.amount ||
                                    amount;
                                return (
                                    <div
                                        key={provider}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/60 p-3.5 rounded-xl border border-border/60 shadow-sm transition-all hover:bg-card hover:border-primary/30"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                                                <Building2 className="w-4 h-4 text-primary" />
                                            </div>
                                            <span className="text-foreground font-semibold text-sm">{provider}</span>
                                        </div>
                                        <div className="flex items-center gap-2 self-end sm:self-auto">
                                            <Badge
                                                variant="secondary"
                                                className="bg-primary/5 text-primary border border-primary/20 hover:bg-primary/10 transition-colors cursor-pointer px-3 py-1.5 flex items-center gap-1.5 rounded-lg shadow-sm"
                                                onClick={() => {
                                                    setEditingProvider(provider);
                                                    setAmountDialogOpen(true);
                                                }}
                                            >
                                                <span>₹{providerAmount || 'Not set'}</span>
                                                <Edit className="w-3.5 h-3.5 opacity-70" />
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0"
                                                onClick={() => handleProviderToggle(provider)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {errors.providers && (
                        <p className="text-red-400 text-sm mt-2">{errors.providers.message}</p>
                    )}
                </div>

                {/* Existing Loans Array */}
                <div className="w-full max-w-2xl mx-auto space-y-4 mt-8 mb-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Building2 className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold text-primary uppercase tracking-wide">
                            Existing Loans
                        </h3>
                    </div>

                    {loanFields.map((field, index) => {
                        const loanErr = errors.existingLoans?.[index];
                        const hasRunningLoans = existingLoans?.[index]?.hasRunningLoans;

                        return (
                            <div
                                key={field.id}
                                className="border border-border rounded-xl p-5 mb-4 bg-card shadow-sm relative"
                            >
                                <div className="flex justify-between items-center mb-5">
                                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 rounded-md font-medium">
                                        Loan Record #{index + 1}
                                    </Badge>
                                    {loanFields.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeLoan(index)}
                                            className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    {/* Has Running Loans */}
                                    <div>
                                        <Label className="text-foreground">Existing Loans*</Label>
                                        <Controller
                                            control={control}
                                            name={`existingLoans.${index}.hasRunningLoans`}
                                            render={({ field: inputField }) => (
                                                <Select value={inputField.value} onValueChange={(val) => {
                                                    inputField.onChange(val);
                                                    if (val === 'no') {
                                                        setValue(`existingLoans.${index}.whichLoan`, '');
                                                        setValue(`existingLoans.${index}.loanAmount`, '');
                                                        setValue(`existingLoans.${index}.runningEmi`, '');
                                                    }
                                                }}>
                                                    <SelectTrigger className="bg-card border-border text-foreground mt-2">
                                                        <SelectValue placeholder="Select option" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-popover border-border text-popover-foreground">
                                                        <SelectItem value="yes" className="focus:bg-accent focus:text-accent-foreground cursor-pointer">Yes</SelectItem>
                                                        <SelectItem value="no" className="focus:bg-accent focus:text-accent-foreground cursor-pointer">No</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {loanErr?.hasRunningLoans && (
                                            <p className="text-sm text-red-400 mt-1.5 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" />
                                                {loanErr.hasRunningLoans.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Conditional Internal Fields for This Loan */}
                                    {hasRunningLoans === 'yes' && (
                                        <>
                                            {/* Which Loan */}
                                            <div>
                                                <Label className="text-foreground">Loan Type*</Label>
                                                <Controller
                                                    control={control}
                                                    name={`existingLoans.${index}.whichLoan`}
                                                    render={({ field: inputField }) => (
                                                        <Select value={inputField.value} onValueChange={inputField.onChange}>
                                                            <SelectTrigger className="bg-card border-border text-foreground mt-2">
                                                                <SelectValue placeholder="Choose loan type" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-popover border-border text-popover-foreground">
                                                                <div className="px-2 py-1 text-xs font-semibold text-primary select-none opacity-100 uppercase tracking-widest">
                                                                    Unsecured
                                                                </div>
                                                                {loanTypes.unsecured.map((l) => (
                                                                    <SelectItem key={l.value} value={l.value} className="focus:bg-accent focus:text-accent-foreground cursor-pointer">
                                                                        {l.label}
                                                                    </SelectItem>
                                                                ))}
                                                                <div className="px-2 py-1 text-xs font-semibold text-primary mt-2 select-none opacity-100 uppercase tracking-widest">
                                                                    Secured
                                                                </div>
                                                                {loanTypes.secured.map((l) => (
                                                                    <SelectItem key={l.value} value={l.value} className="focus:bg-accent focus:text-accent-foreground cursor-pointer">
                                                                        {l.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                                {loanErr?.whichLoan && (
                                                    <p className="text-sm text-red-400 mt-1.5 flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" />
                                                        {loanErr.whichLoan.message}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Outstanding Amount & Running EMI grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div>
                                                    <Label className="text-foreground">Outstanding Amount*</Label>
                                                    <div className="relative mt-2">
                                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                                        <Controller
                                                            control={control}
                                                            name={`existingLoans.${index}.loanAmount`}
                                                            render={({ field: inputField }) => (
                                                                <Input
                                                                    type="text"
                                                                    value={inputField.value || ''}
                                                                    onChange={inputField.onChange}
                                                                    placeholder="0.00"
                                                                    className="bg-card border-border text-foreground pl-10 focus:ring-2 focus:ring-primary/20"
                                                                />
                                                            )}
                                                        />
                                                    </div>
                                                    {loanErr?.loanAmount && (
                                                        <p className="text-sm text-red-400 mt-1.5 flex items-center gap-1">
                                                            <AlertCircle className="w-3 h-3" />
                                                            {loanErr.loanAmount.message}
                                                        </p>
                                                    )}
                                                </div>

                                                <div>
                                                    <Label className="text-foreground">Running EMI (Optional)</Label>
                                                    <div className="relative mt-2">
                                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                                        <Controller
                                                            control={control}
                                                            name={`existingLoans.${index}.runningEmi`}
                                                            render={({ field: inputField }) => (
                                                                <Input
                                                                    type="text"
                                                                    value={inputField.value || ''}
                                                                    onChange={inputField.onChange}
                                                                    placeholder="0.00"
                                                                    className="bg-card border-border text-foreground pl-10 focus:ring-2 focus:ring-primary/20"
                                                                />
                                                            )}
                                                        />
                                                    </div>
                                                    {loanErr?.runningEmi && (
                                                        <p className="text-sm text-red-400 mt-1.5 flex items-center gap-1">
                                                            <AlertCircle className="w-3 h-3" />
                                                            {loanErr.runningEmi.message}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {canAddAnotherLoan && (
                        <div className="flex flex-start mt-2 pb-4">
                            <Button
                                type="button"
                                onClick={() => appendLoan({ hasRunningLoans: 'yes', whichLoan: '', loanAmount: '', runningEmi: '' })}
                                variant="outline"
                                size="sm"
                                className="text-primary border-primary hover:bg-primary/10 transition-all rounded-lg text-sm px-4 shadow-sm"
                            >
                                <Plus className="w-4 h-4 mr-1.5" />
                                Add Another Loan Record
                            </Button>
                        </div>
                    )}
                </div>

                {/* Referral Code (Optional) */}
                <div className="bg-card/50 rounded-xl p-6 border border-border mt-6">
                    <Label className="text-foreground flex items-center gap-2">
                        Referral Code
                        <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                    </Label>
                    <div className="relative mt-2">
                        <Input
                            type="text"
                            value={formData.referralCode || ''}
                            onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                            placeholder="e.g. REF-AGENT001"
                            className="bg-card border-border text-foreground focus:ring-2 focus:ring-primary/20 uppercase"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Agar kisi ke referral se aya h toh referral code daalen, warna khali chhod sakte hain.
                    </p>
                </div>

                {/* Submit Button */}
                <Button
                    type="submit"
                    disabled={loanType === 'business loan' && !businessEntityType}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Let's Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </form>

            {/* Amount Edit Dialog */}
            <Dialog open={amountDialogOpen} onOpenChange={setAmountDialogOpen}>
                <DialogContent className="bg-background border-border">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">
                            Set Amount for {editingProvider}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                type="number"
                                value={
                                    providerAmounts.find((pa) => pa.provider === editingProvider)
                                        ?.amount || amount
                                }
                                onChange={(e) => {
                                    if (editingProvider) {
                                        updateProviderAmount(editingProvider, e.target.value);
                                    }
                                }}
                                className="bg-card border-border text-foreground pl-10"
                                placeholder="Enter amount"
                            />
                        </div>
                        <p className="text-muted-foreground text-sm">
                            Amount must be between 50,000 and 10,00,00,000 and divisible by 5
                        </p>
                        <Button
                            onClick={() => setAmountDialogOpen(false)}
                            className="w-full bg-primary hover:bg-primary/90"
                        >
                            Done
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
};
