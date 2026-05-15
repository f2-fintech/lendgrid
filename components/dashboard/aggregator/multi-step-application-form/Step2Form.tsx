'use client';

import React, { useState, useEffect } from 'react';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useFormContext } from './FormContext';
import { useToast } from '@/hooks/use-toast';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface FilePreview {
    file: File | null;
    preview: string;
}

type FilesState = Record<string, FilePreview>;
type TextFieldsState = Record<string, string>;

interface Step2FormProps {
    onSubmit: (namedFiles: Record<string, File | null>, textFields: TextFieldsState) => Promise<void>;
    isLoading: boolean;
    onSkip?: () => void;
    onBack: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers to build the initial files state for each loan type / entity
// ─────────────────────────────────────────────────────────────────────────────

const emptyFile = (): FilePreview => ({ file: null, preview: '' });

const personalLoanFields: string[] = [
    'form16',
    'itr',
    'salarySlip',
    'banking',
];

const soleProprietorshipFields: string[] = [
    'computationOfIncome',
    'financials',
    'udhyamCertificate',
    'gst',
    'itr',
    'banking',
];

const privateLimitedFields: string[] = [
    'banking',
    'form26as',
    'itr',
    'financials',
    'gst',
    'listOfDirectors',
    'listOfShareholders',
    'aoa',
    'moa',
    'udhyam',
    'companyPan',
    'directorsKyc',
];

const partnershipFields: string[] = [
    'partnershipDeed',
    'banking',
    'udhyam',
    'gst',
    'financials',
    'computationOfIncome',
];

const professionalLoanFields: string[] = [
    'ugCertificate',
    'pgCertificate',
    'registration',
    'banking',
    'itr',
    'computationOfIncome',
];

const fieldLabels: Record<string, string> = {
    form16: 'Form 16',
    itr: 'ITR',
    salarySlip: '3 Months Salary Slip',
    banking: 'Banking (Multiple Files)',
    computationOfIncome: '2 Year Computation of Income',
    financials: '2 Financials (P/L, B/S)',
    udhyamCertificate: 'Udhyam Certificate',
    udhyam: 'Udhyam',
    gst: 'GST',
    form26as: 'Form 26 AS',
    listOfDirectors: 'List of Directors',
    listOfShareholders: 'List of Shareholders',
    aoa: 'Article of Association (AOA)',
    moa: 'Memorandum of Association (MOA)',
    companyPan: 'Company PAN ID',
    directorsKyc: 'Directors KYC',
    partnershipDeed: 'Partnership Deed',
    ugCertificate: 'UG Certificate (MBBS, BDS, BAMS, BHMS)',
    pgCertificate: 'PG Certificate (MD, MS, MCH)',
    registration: 'Registration',
};



function buildFilesState(fieldKeys: string[]): FilesState {
    return Object.fromEntries(fieldKeys.map((k) => [k, emptyFile()]));
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const Step2Form: React.FC<Step2FormProps> = ({ onSubmit, isLoading, onSkip, onBack }) => {
    const { formData, nextStep } = useFormContext();
    const { toast } = useToast();

    const loanType = formData.loanType || '';
    const entityType = formData.businessEntityType || '';

    // ── Determine which file keys apply ──────────────────────────────────────
    const getFieldKeys = (): string[] => {
        if (loanType === 'personal loan') return personalLoanFields;
        if (loanType === 'business loan') {
            if (entityType === 'sole_proprietorship') return soleProprietorshipFields;
            if (entityType === 'private_limited') return privateLimitedFields;
            if (entityType === 'partnership') return partnershipFields;
            return []; // entity not yet chosen (shouldn't happen — blocked in Step0)
        }
        if (loanType === 'professional loan') return professionalLoanFields;
        // Fallback (secured loans etc.) — single bank-statement upload
        return ['bank statement'];
    };

    const fieldKeys = getFieldKeys();

    // ── Files state ───────────────────────────────────────────────────────────
    const [files, setFiles] = useState<FilesState>(() => buildFilesState(fieldKeys));

    // Reset files state when loan type / entity changes
    useEffect(() => {
        setFiles(buildFilesState(getFieldKeys()));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loanType, entityType]);

    // ── Text fields state (personal loan only) ────────────────────────────────
    const [textFields, setTextFields] = useState<TextFieldsState>({
        bankingPassword: '',
    });

    // ── Dynamic director / partner rows (business loan) ───────────────────────
    const [numPersons, setNumPersons] = useState<number>(0);
    const [personDetails, setPersonDetails] = useState<
        { aadhaar: string; pan: string; mobile: string }[]
    >([]);

    const handleNumPersonsChange = (val: string) => {
        const n = parseInt(val, 10) || 0;
        setNumPersons(n);
        setPersonDetails(
            Array.from({ length: n }, (_, i) => personDetails[i] || { aadhaar: '', pan: '', mobile: '' })
        );
    };

    const updatePerson = (idx: number, field: 'aadhaar' | 'pan' | 'mobile', value: string) => {
        setPersonDetails((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
    };

    // ── File change helpers ───────────────────────────────────────────────────
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            toast({ title: 'File Too Large', description: `${file.name} exceeds 10MB`, variant: 'destructive' });
            return;
        }
        const preview = URL.createObjectURL(file);
        setFiles((prev) => ({ ...prev, [field]: { file, preview } }));
    };

    const handleRemoveFile = (field: string) => {
        if (files[field]?.preview) URL.revokeObjectURL(files[field].preview);
        setFiles((prev) => ({ ...prev, [field]: emptyFile() }));
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            Object.values(files).forEach((f) => { if (f.preview) URL.revokeObjectURL(f.preview); });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Upload ────────────────────────────────────────────────────────────────
    const handleUpload = async () => {
        try {
            const namedFiles: Record<string, File | null> = Object.fromEntries(
                Object.entries(files).map(([k, v]) => [k, v.file])
            );

            // Merge person details into textFields
            const allTextFields: TextFieldsState = {
                ...textFields,
                ...(numPersons > 0 ? { personDetails: JSON.stringify(personDetails) } : {}),
            };

            await onSubmit(namedFiles, allTextFields);

            Object.values(files).forEach((f) => { if (f.preview) URL.revokeObjectURL(f.preview); });

            toast({ title: 'Success', description: 'Documents uploaded successfully' });
            setTimeout(() => nextStep(), 2000);
        } catch {
            toast({ title: 'Error', description: 'Failed to upload documents', variant: 'destructive' });
        }
    };

    const handleSkip = () => {
        Object.values(files).forEach((f) => { if (f.preview) URL.revokeObjectURL(f.preview); });
        if (onSkip) onSkip();
        else nextStep();
    };

    const hasAnyFile = Object.values(files).some((f) => f.file !== null);

    // ── FileUploadBox — exact same pattern as Step3Form ───────────────────────
    const FileUploadBox = ({
        label,
        field,
        required = false,
    }: {
        label: string;
        field: string;
        required?: boolean;
    }) => {
        const fileData = files[field] ?? emptyFile();
        const isPdf = fileData.file?.type === 'application/pdf';
        const inputId = `step2-file-${field}`;

        return (
            <div className="space-y-2">
                <Label className="text-foreground">
                    {label}
                    {required && <span className="text-red-400 ml-0.5">*</span>}
                </Label>

                {!fileData.preview ? (
                    <div
                        className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-gold transition-colors cursor-pointer"
                        onClick={() => document.getElementById(inputId)?.click()}
                    >
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Click to upload</p>
                        <input
                            id={inputId}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            onChange={(e) => handleFileChange(e, field)}
                            className="hidden"
                        />
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative bg-background/50 border-2 border-border rounded-lg overflow-hidden"
                    >
                        {fileData.file?.type.startsWith('image/') ? (
                            <img src={fileData.preview} alt={label} className="w-full h-40 object-contain bg-black/5" />
                        ) : isPdf ? (
                            <div className="w-full h-40 flex flex-col items-center justify-center bg-black/5">
                                <FileText className="w-12 h-12 text-blue-400 mb-2" />
                                <p className="text-foreground text-sm">PDF Document</p>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-40 bg-black/5">
                                <FileText className="w-12 h-12 text-muted-foreground" />
                            </div>
                        )}

                        <div className="p-2 bg-background/80">
                            <p className="text-sm text-muted-foreground truncate">{fileData.file?.name}</p>
                        </div>

                        <button
                            type="button"
                            onClick={() => handleRemoveFile(field)}
                            className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </div>
        );
    };

    // ── Section heading helper ────────────────────────────────────────────────
    const SectionHeading = ({ title }: { title: string }) => (
        <h3 className="text-sm font-semibold text-primary uppercase tracking-wide border-b border-border pb-2 mb-4">
            {title}
        </h3>
    );

    // ── Dynamic per-person rows (directors / partners) ────────────────────────
    const PersonRows = ({ label }: { label: string }) => (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-foreground">Number of {label}s</Label>
                <Select value={numPersons > 0 ? String(numPersons) : ''} onValueChange={handleNumPersonsChange}>
                    <SelectTrigger className="bg-card border-border text-foreground">
                        <SelectValue placeholder={`Select number of ${label.toLowerCase()}s`} />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-popover-foreground">
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                            <SelectItem key={n} value={String(n)} className="focus:bg-accent cursor-pointer">
                                {n}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {personDetails.map((person, idx) => (
                <div key={idx} className="border-2 border-primary/30 bg-card/50 rounded-xl p-5 space-y-4 shadow-sm">
                    <div className="inline-flex">
                        <span className="text-xs font-bold bg-primary text-primary-foreground px-3 py-1.5 rounded-md uppercase tracking-widest shadow-sm">
                            {label} #{idx + 1}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                        <div className="space-y-1">
                            <Label className="text-foreground text-sm">Aadhaar Number</Label>
                            <Input
                                value={person.aadhaar}
                                onChange={(e) => updatePerson(idx, 'aadhaar', e.target.value)}
                                className="bg-card border-border text-foreground"
                                placeholder="12-digit Aadhaar"
                                maxLength={12}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-foreground text-sm">PAN Number</Label>
                            <Input
                                value={person.pan}
                                onChange={(e) => updatePerson(idx, 'pan', e.target.value.toUpperCase())}
                                className="bg-card border-border text-foreground uppercase"
                                placeholder="ABCDE1234F"
                                maxLength={10}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-foreground text-sm">Mobile Number</Label>
                            <Input
                                value={person.mobile}
                                onChange={(e) => updatePerson(idx, 'mobile', e.target.value)}
                                className="bg-card border-border text-foreground"
                                placeholder="10-digit mobile"
                                maxLength={10}
                                type="tel"
                            />
                        </div>
                    </div>

                    {/* Dynamic File Uploads for each partner/director */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pt-4 border-t border-border border-dashed">
                        <FileUploadBox label="Aadhaar Document" field={`person_${idx}_aadhaar`} />
                        <FileUploadBox label="PAN Document" field={`person_${idx}_pan`} />
                    </div>
                </div>
            ))}
        </div>
    );

    // ── Determine page heading ────────────────────────────────────────────────
    const pageHeading =
        loanType === 'personal loan' ? 'Personal Loan Documents'
            : loanType === 'business loan' ? 'Business Loan Documents'
                : loanType === 'professional loan' ? 'Professional Loan Documents'
                    : 'Statement Upload';

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-3xl mx-auto space-y-6"
        >
            {/* Header */}
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-foreground">
                    {loanType === 'personal loan' ? (
                        <>Personal Loan <span className="text-accent">Documents</span></>
                    ) : loanType === 'business loan' ? (
                        <>Business Loan <span className="text-accent">Documents</span></>
                    ) : loanType === 'professional loan' ? (
                        <>Professional Loan <span className="text-accent">Documents</span></>
                    ) : (
                        <>Statement <span className="text-accent">Upload</span></>
                    )}
                </h2>
                <p className="text-muted-foreground">Step 2/4</p>
                {loanType === 'business loan' && entityType && (
                    <p className="text-sm text-muted-foreground">
                        Entity:{' '}
                        <span className="text-accent font-medium">
                            {entityType === 'sole_proprietorship' ? 'Sole Proprietorship'
                                : entityType === 'private_limited' ? 'Private Limited'
                                    : 'Partnership Firm'}
                        </span>
                    </p>
                )}
            </div>

            <Card className="bg-card/50 border-border p-6 space-y-6">

                {/* ── PERSONAL LOAN ───────────────────────────────────────────── */}
                {loanType === 'personal loan' && (
                    <>
                        <SectionHeading title="Required Documents" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FileUploadBox label="Form 16" field="form16" />
                            <FileUploadBox label="ITR" field="itr" />
                            <FileUploadBox label="3 Months Salary Slip" field="salarySlip" />
                            <FileUploadBox label="Banking (Multiple Files)" field="banking" />
                        </div>


                    </>
                )}

                {/* ── BUSINESS LOAN — SOLE PROPRIETORSHIP ────────────────────── */}
                {loanType === 'business loan' && entityType === 'sole_proprietorship' && (
                    <>
                        <SectionHeading title="Sole Proprietorship Documents" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FileUploadBox label="2 Year Computation of Income" field="computationOfIncome" />
                            <FileUploadBox label="2 Financials (P/L, B/S)" field="financials" />
                            <FileUploadBox label="Udhyam Certificate" field="udhyamCertificate" />
                            <FileUploadBox label="GST" field="gst" />
                            <FileUploadBox label="2 Year ITR" field="itr" />
                            <FileUploadBox label="1 Year Banking" field="banking" />
                        </div>
                    </>
                )}

                {/* ── BUSINESS LOAN — PRIVATE LIMITED ────────────────────────── */}
                {loanType === 'business loan' && entityType === 'private_limited' && (
                    <>
                        <SectionHeading title="Private Limited Documents" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FileUploadBox label="1 Year Banking" field="banking" />
                            <FileUploadBox label="Form 26 AS" field="form26as" />
                            <FileUploadBox label="2 Year ITR" field="itr" />
                            <FileUploadBox label="2 Year Financials (P/L, B/S)" field="financials" />
                            <FileUploadBox label="GST" field="gst" />
                            <FileUploadBox label="List of Directors" field="listOfDirectors" />
                            <FileUploadBox label="List of Shareholders" field="listOfShareholders" />
                            <FileUploadBox label="Article of Association (AOA)" field="aoa" />
                            <FileUploadBox label="Memorandum of Association (MOA)" field="moa" />
                            <FileUploadBox label="Udhyam" field="udhyam" />
                            <FileUploadBox label="Company PAN ID" field="companyPan" />
                            <FileUploadBox label="Directors KYC" field="directorsKyc" />
                        </div>

                        {/* Dynamic: Number of Directors */}
                        <div className="pt-2">
                            <SectionHeading title="Director Details" />
                            <PersonRows label="Director" />
                        </div>
                    </>
                )}

                {/* ── BUSINESS LOAN — PARTNERSHIP ─────────────────────────────── */}
                {loanType === 'business loan' && entityType === 'partnership' && (
                    <>
                        <SectionHeading title="Partnership Firm Documents" />

                        {/* Dynamic: Number of Partners */}
                        <PersonRows label="Partner" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            <FileUploadBox label="Partnership Deed" field="partnershipDeed" />
                            <FileUploadBox label="1 Year Banking" field="banking" />
                            <FileUploadBox label="Udhyam" field="udhyam" />
                            <FileUploadBox label="GST" field="gst" />
                            <FileUploadBox label="2 Year Financials" field="financials" />
                            <FileUploadBox label="2 Year Computation of Income" field="computationOfIncome" />
                        </div>
                    </>
                )}

                {/* ── PROFESSIONAL LOAN ───────────────────────────────────────── */}
                {loanType === 'professional loan' && (
                    <>
                        <SectionHeading title="Degree & Registration Documents" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FileUploadBox label="UG Certificate (MBBS, BDS, BAMS, BHMS)" field="ugCertificate" />
                            <FileUploadBox label="PG Certificate (MD, MS, MCH)" field="pgCertificate" />
                            <FileUploadBox label="Registration" field="registration" />
                            <FileUploadBox label="Banking" field="banking" />
                            <FileUploadBox label="ITR" field="itr" />
                            <FileUploadBox label="Computation of Income" field="computationOfIncome" />
                        </div>
                    </>
                )}

                {/* ── FALLBACK (secured / other loans) ────────────────────────── */}
                {loanType !== 'personal loan' &&
                    loanType !== 'business loan' &&
                    loanType !== 'professional loan' && (
                        <>
                            <p className="text-sm text-muted-foreground mb-4">
                                Upload your recent 6 months Bank Statement.{' '}
                                Maximum File Upload Limit is <span className="text-accent">10</span>
                            </p>
                            <FileUploadBox label="Bank Statement" field="banking" />
                        </>
                    )}

                {/* ── SHARED FIELDS ─────────────────────────────────────────────── */}
                {(fieldKeys.includes('banking') || fieldKeys.includes('bank statement')) && (
                    <div className="pt-4 border-t border-border mt-4 mb-4">
                        <SectionHeading title="Bank Statement Password" />
                        <div className="space-y-2 max-w-md">
                            <Input
                                value={textFields.bankingPassword || ''}
                                onChange={(e) => setTextFields((prev) => ({ ...prev, bankingPassword: e.target.value }))}
                                className="bg-card border-border text-foreground"
                                placeholder="Enter PDF password if protected"
                                type="text"
                            />
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4">
                    <Button
                        variant="outline"
                        onClick={onBack}
                        className="border-border text-foreground hover:bg-muted"
                    >
                        Back
                    </Button>

                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            onClick={handleSkip}
                            disabled={hasAnyFile}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Skip
                        </Button>

                        <Button
                            onClick={handleUpload}
                            disabled={!hasAnyFile || isLoading}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                'Upload'
                            )}
                        </Button>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};
