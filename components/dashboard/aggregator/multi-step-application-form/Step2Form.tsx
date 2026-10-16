'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useFormContext } from './FormContext';
import { useToast } from '@/hooks/use-toast';
import {
    getFieldKeys,
    getHeading,
    getSubheading,
    STEP2_FIELD_LABELS,
} from './formConstants';
import { focusAndScrollToField, validatePartnerDetails } from './validation';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface FilePreview {
    file: File | null;
    preview: string;
    uploadedUrl?: string | null;
    uploadedName?: string | null;
}

type FilesState = Record<string, FilePreview>;
type TextFieldsState = Record<string, string>;

interface Step2FormProps {
    onSubmit: (namedFiles: Record<string, File | null>, textFields: TextFieldsState) => Promise<void>;
    isLoading: boolean;
    onSkip?: () => void;
    onBack: () => void;
}

const emptyFile = (): FilePreview => ({ file: null, preview: '', uploadedUrl: null, uploadedName: null });

function buildFilesState(fieldKeys: string[]): FilesState {
    let cached: Record<string, { url: string; name: string }> = {};
    if (typeof window !== 'undefined') {
        try {
            const raw = localStorage.getItem('step2UploadedDocs');
            if (raw) cached = JSON.parse(raw);
        } catch (e) {}
    }
    return Object.fromEntries(
        fieldKeys.map((k) => [
            k,
            {
                file: null,
                preview: cached[k]?.url || '',
                uploadedUrl: cached[k]?.url || null,
                uploadedName: cached[k]?.name || null,
            },
        ])
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Standalone Sub-components (Defined OUTSIDE Step2Form to prevent re-mounting
// flicker/shivering on every keystroke)
// ─────────────────────────────────────────────────────────────────────────────

interface FileUploadBoxProps {
    label: string;
    field: string;
    required?: boolean;
    fileData: FilePreview;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>, field: string) => void;
    onRemoveFile: (field: string) => void;
}

const FileUploadBox: React.FC<FileUploadBoxProps> = ({
    label,
    field,
    required = false,
    fileData,
    onFileChange,
    onRemoveFile,
}) => {
    const inputId = `step2-file-${field}`;
    const isImage = Boolean(
        fileData.file?.type.startsWith('image/') ||
        fileData.uploadedUrl?.match(/\.(jpg|jpeg|png|webp|gif)($|\?|#)/i)
    );
    const isPdf = Boolean(
        fileData.file?.type === 'application/pdf' ||
        fileData.uploadedUrl?.match(/\.pdf($|\?|#)/i)
    );

    const isOptional = typeof label === 'string' && label.includes('(Optional)');
    const cleanLabel = typeof label === 'string'
        ? label.replace(/\*\s*\(Mandatory\)/gi, '').replace(/\(Optional\)/gi, '').replace(/\*/g, '').trim()
        : label;

    const hasContent = Boolean(fileData.preview || fileData.uploadedUrl);

    return (
        <div id={`slot-${field}`} className="space-y-2">
            <Label className="text-foreground text-sm font-semibold flex items-center gap-1.5 flex-wrap">
                <span>{cleanLabel}</span>
                {required && !isOptional && (
                    <span style={{ color: '#e05353', fontSize: '11px', fontWeight: 500, letterSpacing: '0.2px' }}>
                        * (Mandatory)
                    </span>
                )}
                {isOptional && (
                    <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 500 }}>
                        (Optional)
                    </span>
                )}
            </Label>

            {!hasContent ? (
                <div
                    className="border-2 border-dashed border-border/80 rounded-lg p-6 text-center hover:border-gold transition-colors cursor-pointer bg-card/40 hover:bg-card/60"
                    onClick={() => document.getElementById(inputId)?.click()}
                >
                    <Upload className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-200" />
                    <p className="text-sm font-semibold text-slate-200 dark:text-slate-100">Click to upload document</p>
                    <p className="text-xs text-slate-400 dark:text-slate-300 mt-1">PDF, JPG, PNG, DOC (Max 10MB)</p>
                    <input
                        id={inputId}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => onFileChange(e, field)}
                        className="hidden"
                    />
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative bg-background/50 border-2 border-border rounded-lg overflow-hidden"
                >
                    {isImage ? (
                        <img
                            src={fileData.preview || fileData.uploadedUrl || ''}
                            alt={cleanLabel}
                            className="w-full h-36 object-contain bg-black/10"
                        />
                    ) : isPdf ? (
                        <div className="w-full h-36 flex flex-col items-center justify-center bg-black/10">
                            <FileText className="w-12 h-12 text-blue-400 mb-2" />
                            <p className="text-slate-100 text-sm font-semibold">PDF Document</p>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-36 bg-black/10">
                            <FileText className="w-12 h-12 text-slate-300" />
                        </div>
                    )}

                    <div className="p-2.5 bg-background/90 flex items-center justify-between border-t border-border">
                        <p
                            className="text-xs font-medium text-slate-100 truncate max-w-[200px]"
                            title={fileData.file?.name || fileData.uploadedName || 'Uploaded Document'}
                        >
                            {fileData.file?.name || fileData.uploadedName || 'Uploaded Document'}
                        </p>
                        {fileData.uploadedUrl && !fileData.file ? (
                            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                ✓ Uploaded
                            </span>
                        ) : (
                            <span className="text-[10px] text-slate-300">
                                {fileData.file ? (fileData.file.size / 1024 / 1024).toFixed(2) + ' MB' : ''}
                            </span>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => onRemoveFile(field)}
                        className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors shadow-sm"
                        title="Remove file"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </motion.div>
            )}
        </div>
    );
};

interface PersonRowsProps {
    label: string;
    numPersons: number;
    isLlp: boolean;
    shouldShowEmail?: boolean;
    personDetails: Array<{ name: string; email: string; aadhaar: string; pan: string; mobile: string }>;
    onNumPersonsChange: (val: string) => void;
    onUpdatePerson: (idx: number, field: 'name' | 'email' | 'aadhaar' | 'pan' | 'mobile', value: string) => void;
}

const PersonRows: React.FC<PersonRowsProps> = ({
    label,
    numPersons,
    isLlp,
    shouldShowEmail = true,
    personDetails,
    onNumPersonsChange,
    onUpdatePerson,
}) => (
    <div className="space-y-4 pt-4 border-t border-border mt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <Label className="text-foreground font-semibold">Number of {label}s</Label>
            <div className="w-48">
                <Select value={numPersons > 0 ? String(numPersons) : ''} onValueChange={onNumPersonsChange}>
                    <SelectTrigger className="bg-card border-border text-foreground">
                        <SelectValue placeholder={`Select ${label.toLowerCase()} count`} />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-popover-foreground">
                        {Array.from({ length: 10 }, (_, i) => i + (isLlp ? 2 : 1)).map((n) => (
                            <SelectItem key={n} value={String(n)} className="focus:bg-accent cursor-pointer">
                                {n} {label}s
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>

        {personDetails.map((person, idx) => (
            <div key={idx} className="border border-border/80 bg-card/40 rounded-xl p-5 space-y-4 shadow-sm">
                <div className="inline-flex">
                    <span className="inline-flex items-center text-[#3949ab] dark:text-[#93c5fd] font-bold bg-[#eef2ff] dark:bg-[#1e293b] border border-[#e0e7ff] dark:border-[#334155] px-2.5 py-1 rounded-md text-xs tracking-[0.2px] uppercase">
                        {label} #{idx + 1}
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label htmlFor={`person_${idx}_name`} className="text-foreground text-xs font-medium">
                            {label.includes('Director') ? 'Director Name (As per PAN)' : `${label} Name (As per PAN)`}{' '}
                            <span style={{ color: '#e05353', fontSize: '11px', fontWeight: 500, letterSpacing: '0.2px' }}>
                                * (Mandatory)
                            </span>
                        </Label>
                        <Input
                            id={`person_${idx}_name`}
                            value={person.name}
                            onChange={(e) => onUpdatePerson(idx, 'name', e.target.value)}
                            className="bg-card border-border text-foreground"
                            placeholder="Full Name as per PAN"
                        />
                    </div>

                    {shouldShowEmail && (
                        <div className="space-y-1">
                            <Label htmlFor={`person_${idx}_email`} className="text-foreground text-xs font-medium">
                                Email ID{' '}
                                <span style={{ color: '#e05353', fontSize: '11px', fontWeight: 500, letterSpacing: '0.2px' }}>
                                    * (Mandatory)
                                </span>
                            </Label>
                            <Input
                                id={`person_${idx}_email`}
                                value={person.email}
                                onChange={(e) => onUpdatePerson(idx, 'email', e.target.value)}
                                className="bg-card border-border text-foreground"
                                placeholder="Email address"
                                type="email"
                            />
                        </div>
                    )}

                    <div className="space-y-1">
                        <Label htmlFor={`person_${idx}_aadhaar`} className="text-foreground text-xs font-medium">
                            Aadhaar Number{' '}
                            <span style={{ color: '#e05353', fontSize: '11px', fontWeight: 500, letterSpacing: '0.2px' }}>
                                * (Mandatory)
                            </span>
                        </Label>
                        <Input
                            id={`person_${idx}_aadhaar`}
                            value={person.aadhaar}
                            onChange={(e) => onUpdatePerson(idx, 'aadhaar', e.target.value.replace(/\D/g, ''))}
                            className="bg-card border-border text-foreground"
                            placeholder="12-digit Aadhaar"
                            maxLength={12}
                        />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor={`person_${idx}_pan`} className="text-foreground text-xs font-medium">
                            PAN Number{' '}
                            <span style={{ color: '#e05353', fontSize: '11px', fontWeight: 500, letterSpacing: '0.2px' }}>
                                * (Mandatory)
                            </span>
                        </Label>
                        <Input
                            id={`person_${idx}_pan`}
                            value={person.pan}
                            onChange={(e) => onUpdatePerson(idx, 'pan', e.target.value.toUpperCase())}
                            className="bg-card border-border text-foreground uppercase"
                            placeholder="10-digit PAN"
                            maxLength={10}
                        />
                    </div>

                    <div className={cn("space-y-1", shouldShowEmail ? "col-span-1 md:col-span-2" : "")}>
                        <Label htmlFor={`person_${idx}_mobile`} className="text-foreground text-xs font-medium">
                            Mobile Number{' '}
                            <span style={{ color: '#e05353', fontSize: '11px', fontWeight: 500, letterSpacing: '0.2px' }}>
                                * (Mandatory)
                            </span>
                        </Label>
                        <Input
                            id={`person_${idx}_mobile`}
                            value={person.mobile}
                            onChange={(e) => onUpdatePerson(idx, 'mobile', e.target.value.replace(/\D/g, ''))}
                            className="bg-card border-border text-foreground"
                            placeholder="10-digit Mobile number"
                            maxLength={10}
                            type="tel"
                        />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Step2Form Component
// ─────────────────────────────────────────────────────────────────────────────

export const Step2Form: React.FC<Step2FormProps> = ({ onSubmit, isLoading, onSkip, onBack }) => {
    const { formData, nextStep } = useFormContext();
    const { toast } = useToast();

    const loanType = formData.loanType || '';
    const entityType = formData.businessEntityType || '';
    const employmentType = formData.employment_type || '';

    // ── Determine which file keys apply dynamically ──────────────────────────
    const fieldKeys = getFieldKeys(loanType, entityType, employmentType);

    // ── Files state (initialized from localStorage step2UploadedDocs if available) ──
    const [files, setFiles] = useState<FilesState>(() => buildFilesState(fieldKeys));

    // Reset/rebuild files state when loan type / entity / employment changes
    useEffect(() => {
        setFiles(buildFilesState(getFieldKeys(loanType, entityType, employmentType)));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loanType, entityType, employmentType]);

    // ── Bank Statement Password ───────────────────────────────────────────────
    const [isPdfProtected, setIsPdfProtected] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            try {
                return (
                    localStorage.getItem('step2IsPdfProtected') === 'true' ||
                    Boolean(localStorage.getItem('step2BankingPassword'))
                );
            } catch (e) {}
        }
        return false;
    });

    const [textFields, setTextFields] = useState<TextFieldsState>(() => {
        let bankingPassword = '';
        if (typeof window !== 'undefined') {
            try {
                bankingPassword = localStorage.getItem('step2BankingPassword') || '';
            } catch (e) {}
        }
        return { bankingPassword };
    });

    const handlePasswordChange = useCallback((val: string) => {
        setTextFields((prev) => ({ ...prev, bankingPassword: val }));
        try {
            localStorage.setItem('step2BankingPassword', val);
        } catch (e) {}
    }, []);

    const handleProtectedCheckboxChange = useCallback((checked: boolean) => {
        setIsPdfProtected(checked);
        try {
            localStorage.setItem('step2IsPdfProtected', String(checked));
        } catch (e) {}
    }, []);

    // ── Dynamic director / partner rows (business loan: pvt ltd, llp, partnership) ─
    const isBusinessEntityWithPartners =
        loanType === 'business loan' &&
        (entityType === 'private_limited' || entityType === 'llp' || entityType === 'partnership');
    const isLlp = loanType === 'business loan' && entityType === 'llp';
    const defaultNumPersons = isLlp ? 2 : 0;

    const [numPersons, setNumPersons] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            try {
                const raw = localStorage.getItem('step2NumPersons');
                if (raw) {
                    const parsed = parseInt(raw, 10);
                    if (!isNaN(parsed) && parsed > 0) return parsed;
                }
            } catch (e) {}
        }
        return defaultNumPersons;
    });

    const [personDetails, setPersonDetails] = useState<
        { name: string; email: string; aadhaar: string; pan: string; mobile: string }[]
    >(() => {
        if (typeof window !== 'undefined') {
            try {
                const raw = localStorage.getItem('step2PersonDetails');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                }
            } catch (e) {}
        }
        return Array.from({ length: defaultNumPersons }, () => ({
            name: '',
            email: '',
            aadhaar: '',
            pan: '',
            mobile: '',
        }));
    });

    // Synchronize minimum 2 partners for LLP
    useEffect(() => {
        if (isLlp && numPersons < 2) {
            setNumPersons(2);
            setPersonDetails((prev) => {
                if (prev.length < 2) {
                    const next = Array.from(
                        { length: 2 },
                        (_, i) => prev[i] || { name: '', email: '', aadhaar: '', pan: '', mobile: '' }
                    );
                    try {
                        localStorage.setItem('step2PersonDetails', JSON.stringify(next));
                        localStorage.setItem('step2NumPersons', '2');
                    } catch (e) {}
                    return next;
                }
                return prev;
            });
        }
    }, [isLlp, numPersons]);

    const handleNumPersonsChange = (val: string) => {
        const n = parseInt(val, 10) || 0;
        setNumPersons(n);
        const updated = Array.from(
            { length: n },
            (_, i) => personDetails[i] || { name: '', email: '', aadhaar: '', pan: '', mobile: '' }
        );
        setPersonDetails(updated);
        try {
            localStorage.setItem('step2NumPersons', String(n));
            localStorage.setItem('step2PersonDetails', JSON.stringify(updated));
        } catch (e) {}
    };

    const updatePerson = (
        idx: number,
        field: 'name' | 'email' | 'aadhaar' | 'pan' | 'mobile',
        value: string
    ) => {
        setPersonDetails((prev) => {
            const next = prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p));
            try {
                localStorage.setItem('step2PersonDetails', JSON.stringify(next));
            } catch (e) {}
            return next;
        });
    };

    // ── File change helpers ───────────────────────────────────────────────────
    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            toast({ title: 'File Too Large', description: `${file.name} exceeds 10MB`, variant: 'destructive' });
            return;
        }
        const preview = URL.createObjectURL(file);
        setFiles((prev) => ({
            ...prev,
            [field]: { file, preview, uploadedName: file.name, uploadedUrl: null },
        }));
    }, [toast]);

    const handleRemoveFile = useCallback((field: string) => {
        setFiles((prev) => {
            const existing = prev[field];
            if (existing?.preview && existing.file) {
                URL.revokeObjectURL(existing.preview);
            }
            return { ...prev, [field]: emptyFile() };
        });

        try {
            const raw = localStorage.getItem('step2UploadedDocs');
            if (raw) {
                const parsed = JSON.parse(raw);
                delete parsed[field];
                localStorage.setItem('step2UploadedDocs', JSON.stringify(parsed));
            }
        } catch (e) {}
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            Object.values(files).forEach((f) => {
                if (f.preview && f.file) URL.revokeObjectURL(f.preview);
            });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Check mandatory requirements ──────────────────────────────────────────
    const hasMandatoryFields = fieldKeys.some((k) =>
        (STEP2_FIELD_LABELS[k] || '').includes('* (Mandatory)')
    );

    // ── Upload / Proceed ──────────────────────────────────────────────────────
    const handleUpload = async () => {
        // 1. Mandatory check: at least ANY 1 document must be provided (uploaded or selected)
        const hasAnyDocument = Object.values(files).some(
            (v) => v.file !== null || Boolean(v.uploadedUrl)
        );
        if (!hasAnyDocument) {
            toast({
                title: 'Document Required',
                description: 'Please select at least one document to upload.',
                variant: 'destructive',
            });
            const firstSlotKey = fieldKeys[0];
            if (firstSlotKey) {
                focusAndScrollToField(`slot-${firstSlotKey}`);
            }
            return;
        }

        // 2. Bank password check
        if (isPdfProtected && (!textFields.bankingPassword || !textFields.bankingPassword.trim())) {
            toast({
                title: 'Password Required',
                description: 'Please enter the PDF password for your protected bank statement.',
                variant: 'destructive',
            });
            focusAndScrollToField('banking-password-input');
            return;
        }

        // 3. Partner / Director checks if applicable
        if (numPersons > 0) {
            const personLabel = (entityType === 'llp' || entityType === 'private_limited') ? 'Director' : 'Partner';
            const validation = validatePartnerDetails(personDetails, {
                label: personLabel,
                requireEmail: entityType !== 'partnership',
            });
            if (!validation.isValid) {
                toast({
                    title: 'Incomplete Details',
                    description: validation.error || 'Please fill partner/director details correctly.',
                    variant: 'destructive',
                });
                if (validation.fieldId) {
                    focusAndScrollToField(validation.fieldId);
                }
                return;
            }
        }

        const activeFiles = Object.entries(files).filter(([, v]) => v.file !== null);

        // If no new local files are queued, but all required files were previously uploaded, proceed cleanly!
        if (activeFiles.length === 0) {
            const hasUploaded = Object.values(files).some((v) => Boolean(v.uploadedUrl));
            if (hasUploaded) {
                const allTextFields: TextFieldsState = {
                    ...textFields,
                    bankingPassword: isPdfProtected ? (textFields.bankingPassword || '').trim() : '',
                    ...(numPersons > 0 ? { personDetails: JSON.stringify(personDetails) } : {}),
                };
                if (isPdfProtected) {
                    localStorage.setItem('step2BankingPassword', (textFields.bankingPassword || '').trim());
                    localStorage.setItem('step2IsPdfProtected', 'true');
                }
                toast({ title: 'Success', description: 'Documents verified. Proceeding...' });
                nextStep();
                return;
            }
        }

        try {
            const namedFiles: Record<string, File | null> = Object.fromEntries(
                Object.entries(files).map(([k, v]) => [k, v.file])
            );

            // Merge person details and cleaned password into textFields
            const allTextFields: TextFieldsState = {
                ...textFields,
                bankingPassword: isPdfProtected ? (textFields.bankingPassword || '').trim() : '',
                ...(numPersons > 0 ? { personDetails: JSON.stringify(personDetails) } : {}),
            };

            await onSubmit(namedFiles, allTextFields);

            if (isPdfProtected) {
                localStorage.setItem('step2BankingPassword', (textFields.bankingPassword || '').trim());
                localStorage.setItem('step2IsPdfProtected', 'true');
            }

            Object.values(files).forEach((f) => {
                if (f.preview && f.file) URL.revokeObjectURL(f.preview);
            });

            toast({ title: 'Success', description: 'Documents uploaded successfully' });
            setTimeout(() => nextStep(), 1500);
        } catch {
            toast({ title: 'Error', description: 'Failed to upload documents', variant: 'destructive' });
        }
    };

    const handleSkip = () => {
        Object.values(files).forEach((f) => {
            if (f.preview && f.file) URL.revokeObjectURL(f.preview);
        });
        if (onSkip) onSkip();
        else nextStep();
    };

    const hasAnyContent = Object.values(files).some((f) => f.file !== null || Boolean(f.uploadedUrl));

    const headingText = getHeading(loanType, entityType);
    const subheadingText = getSubheading(loanType, entityType);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-4xl mx-auto space-y-6"
        >
            {/* Header */}
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-foreground">
                    {headingText.split(' Documents')[0]} <span className="text-accent">Documents</span>
                </h2>
                <p className="text-muted-foreground text-sm">Step 2/4</p>
                {subheadingText && (
                    <p className="text-xs text-muted-foreground max-w-xl mx-auto">
                        {subheadingText}
                    </p>
                )}
            </div>

            <Card className="bg-card/50 border-border p-6 space-y-6">
                {/* Dynamic Loan-Type Documents Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {fieldKeys.map((key) => {
                        const rawLabel = STEP2_FIELD_LABELS[key] || key;
                        const isMandatory = rawLabel.includes('* (Mandatory)');
                        return (
                            <FileUploadBox
                                key={key}
                                label={rawLabel}
                                field={key}
                                required={isMandatory}
                                fileData={files[key] || emptyFile()}
                                onFileChange={handleFileChange}
                                onRemoveFile={handleRemoveFile}
                            />
                        );
                    })}
                </div>

                {/* Director / Partner Rows for Business Loans */}
                {isBusinessEntityWithPartners && (
                    <PersonRows
                        label={entityType === 'private_limited' || entityType === 'llp' ? 'Director' : 'Partner'}
                        numPersons={numPersons}
                        isLlp={isLlp}
                        shouldShowEmail={entityType !== 'partnership'}
                        personDetails={personDetails}
                        onNumPersonsChange={handleNumPersonsChange}
                        onUpdatePerson={updatePerson}
                    />
                )}

                {/* Bank Statement Password Checkbox & Input */}
                {(fieldKeys.includes('banking') || fieldKeys.includes('bank statement')) && (
                    <div className="pt-4 border-t border-border mt-4 space-y-3">
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="is-pdf-protected"
                                checked={isPdfProtected}
                                onChange={(e) => handleProtectedCheckboxChange(e.target.checked)}
                                className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                            />
                            <Label htmlFor="is-pdf-protected" className="text-foreground cursor-pointer font-medium text-sm">
                                Is your bank statement PDF password protected?
                            </Label>
                        </div>

                        {isPdfProtected && (
                            <div className="space-y-1.5 max-w-md pt-1">
                                <Label className="text-foreground text-xs font-medium">
                                    PDF Password{' '}
                                    <span style={{ color: '#e05353', fontSize: '11px', fontWeight: 500, letterSpacing: '0.2px' }}>
                                        * (Mandatory)
                                    </span>
                                </Label>
                                <Input
                                    id="banking-password-input"
                                    value={textFields.bankingPassword || ''}
                                    onChange={(e) => handlePasswordChange(e.target.value)}
                                    className="bg-card border-border text-foreground"
                                    placeholder="Enter bank statement PDF password"
                                    type="text"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4">
                    <Button
                        variant="outline"
                        type="button"
                        onClick={onBack}
                        className="border-border text-foreground hover:bg-muted"
                    >
                        Back
                    </Button>

                    <div className="flex gap-3">
                        {!hasMandatoryFields && (
                            <Button
                                variant="ghost"
                                type="button"
                                onClick={handleSkip}
                                disabled={hasAnyContent}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                Skip
                            </Button>
                        )}

                        <Button
                            type="button"
                            onClick={handleUpload}
                            disabled={isLoading}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                'Upload & Proceed'
                            )}
                        </Button>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};
