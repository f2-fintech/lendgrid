'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, X, FileText, Loader2, IndianRupee } from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { step4Schema, Step4FormData } from './validation';
import { useFormContext } from './FormContext';
import { useToast } from '@/hooks/use-toast';

interface Step4FormProps {
  onSubmit: (
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
  ) => Promise<void>;
  isLoading: boolean;
}

interface FileWithPreview {
  file: File;
  preview: string;
}

export const Step4Form: React.FC<Step4FormProps> = ({ onSubmit, isLoading }) => {
  const { formData, prevStep, resetForm } = useFormContext();
  const { toast } = useToast();
  const [certificates, setCertificates] = useState<FileWithPreview[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const loanType = String(formData.loanType || '').toLowerCase().trim();
  const isEducationLoan = loanType === 'education loan';

  // ── Co-Applicant State (for Education Loan) ───────────────────────────────
  const [coAppRelation, setCoAppRelation] = useState<string>('Father');
  const [coAppEmploymentType, setCoAppEmploymentType] = useState<string>('Salaried');
  const [coAppEmail, setCoAppEmail] = useState<string>('');
  const [coAppMobile, setCoAppMobile] = useState<string>('');
  const [coAppMotherName, setCoAppMotherName] = useState<string>('');

  const [coAppFiles, setCoAppFiles] = useState<
    Record<string, { file: File | null; preview: string }>
  >({
    coAppAadhaar: { file: null, preview: '' },
    coAppPan: { file: null, preview: '' },
    coAppCancelledCheque: { file: null, preview: '' },
    coAppForm16: { file: null, preview: '' },
    coAppSalarySlips: { file: null, preview: '' },
    coAppIdCard: { file: null, preview: '' },
  });

  const handleCoAppFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldKey: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: `${file.name} exceeds 10MB limit`,
        variant: 'destructive',
      });
      return;
    }
    const preview = URL.createObjectURL(file);
    setCoAppFiles((prev) => ({
      ...prev,
      [fieldKey]: { file, preview },
    }));
  };

  const handleRemoveCoAppFile = (fieldKey: string) => {
    if (coAppFiles[fieldKey]?.preview) {
      URL.revokeObjectURL(coAppFiles[fieldKey].preview);
    }
    setCoAppFiles((prev) => ({
      ...prev,
      [fieldKey]: { file: null, preview: '' },
    }));
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<Step4FormData>({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      salary: (formData as any)?.salary || (typeof window !== 'undefined' ? localStorage.getItem('step4Salary') || '' : ''),
      existing_emi: (formData as any)?.existing_emi || (typeof window !== 'undefined' ? localStorage.getItem('step4ExistingEmi') || '' : ''),
      existing_liability: (formData as any)?.existing_liability || (typeof window !== 'undefined' ? localStorage.getItem('step4ExistingLiability') || '' : ''),
    }
  });

  useEffect(() => {
    const savedSalary = (formData as any)?.salary || (typeof window !== 'undefined' ? localStorage.getItem('step4Salary') || '' : '');
    const savedEmi = (formData as any)?.existing_emi || (typeof window !== 'undefined' ? localStorage.getItem('step4ExistingEmi') || '' : '');
    const savedLiability = (formData as any)?.existing_liability || (typeof window !== 'undefined' ? localStorage.getItem('step4ExistingLiability') || '' : '');

    if (savedSalary || savedEmi || savedLiability) {
      reset({
        salary: savedSalary,
        existing_emi: savedEmi,
        existing_liability: savedLiability,
      });
    }
  }, [formData, reset]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const totalFiles = certificates.length + files.length;

    if (totalFiles > 4) {
      toast({
        title: 'Too Many Files',
        description: 'Maximum 4 certificate files allowed',
        variant: 'destructive',
      });
      return;
    }

    const validFiles = files.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: `${file.name} exceeds 5MB limit`,
          variant: 'destructive',
        });
        return false;
      }
      return true;
    });

    const filesWithPreview = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setCertificates((prev) => [...prev, ...filesWithPreview]);
  };

  const handleRemoveFile = (index: number) => {
    const fileToRemove = certificates[index];
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    setCertificates((prev) => prev.filter((_, i) => i !== index));
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      certificates.forEach((f) => URL.revokeObjectURL(f.preview));
      Object.values(coAppFiles).forEach((f) => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFormSubmit = async (data: Step4FormData) => {
    // Validate Co-Applicant mobile if Education Loan
    if (isEducationLoan) {
      if (coAppMobile && coAppMobile.length !== 10) {
        toast({
          title: 'Invalid Mobile',
          description: 'Co-applicant mobile number must be exactly 10 digits',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      const files = certificates.map((c) => c.file);

      const coAppDetailsPayload = isEducationLoan
        ? {
          coAppRelation,
          coAppEmploymentType,
          coAppEmail,
          coAppMobile,
          coAppMotherName,
        }
        : undefined;

      const coAppFilesPayload: Record<string, File | null> = isEducationLoan
        ? Object.fromEntries(Object.entries(coAppFiles).map(([k, v]) => [k, v.file]))
        : {};

      await onSubmit(data, files, coAppDetailsPayload, coAppFilesPayload);

      // Cleanup previews
      certificates.forEach((f) => URL.revokeObjectURL(f.preview));
      Object.values(coAppFiles).forEach((f) => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });

      toast({
        title: 'Success',
        description: 'Application submitted successfully',
      });
      setTimeout(() => {
        resetForm();
      }, 800);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to submit application',
        variant: 'destructive',
      });
    }
  };

  const CoAppUploadBox = ({
    fieldKey,
    label,
    required = true,
  }: {
    fieldKey: string;
    label: string;
    required?: boolean;
  }) => {
    const fileData = coAppFiles[fieldKey] || { file: null, preview: '' };
    const isPdf = fileData.file?.type === 'application/pdf';
    const inputId = `coapp-file-${fieldKey}`;

    const isOptional = label.includes('(Optional)');
    const cleanLabel = label
      .replace(/\*\s*\(Mandatory\)/gi, '')
      .replace(/\(Optional\)/gi, '')
      .replace(/\*/g, '')
      .trim();

    return (
      <div className="space-y-2">
        <Label className="text-foreground text-xs font-medium flex items-center gap-1.5 flex-wrap">
          <span>{cleanLabel}</span>
          {isOptional && (
            <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 500 }}>
              (Optional)
            </span>
          )}
        </Label>

        {!fileData.preview ? (
          <div
            className="border-2 border-dashed border-border rounded-lg p-5 text-center hover:border-gold transition-colors cursor-pointer bg-card/30"
            onClick={() => document.getElementById(inputId)?.click()}
          >
            <Upload className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Click to upload document</p>
            <input
              id={inputId}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => handleCoAppFileChange(e, fieldKey)}
              className="hidden"
            />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-background/50 border-2 border-border rounded-lg overflow-hidden"
          >
            {fileData.file?.type.startsWith('image/') ? (
              <img src={fileData.preview} alt={label} className="w-full h-28 object-contain bg-black/5" />
            ) : isPdf ? (
              <div className="w-full h-28 flex flex-col items-center justify-center bg-black/5">
                <FileText className="w-10 h-10 text-blue-400 mb-1" />
                <p className="text-foreground text-xs font-medium">PDF Document</p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-28 bg-black/5">
                <FileText className="w-10 h-10 text-muted-foreground" />
              </div>
            )}

            <div className="p-1.5 bg-background/80 flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground truncate max-w-[160px]">{fileData.file?.name}</p>
            </div>

            <button
              type="button"
              onClick={() => handleRemoveCoAppFile(fieldKey)}
              className="absolute top-1.5 right-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-full p-1 transition-colors shadow-sm"
              title="Remove file"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </div>
    );
  };

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
          Additional <span className="text-accent">Details</span>
        </h2>
        <p className="text-muted-foreground text-sm">Step 4/4</p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <Card className="bg-card/50 border-border p-6 space-y-4">
          <h3 className="text-sm font-semibold text-primary uppercase tracking-wide border-b border-border pb-2 mb-2">
            Financial & Income Information
          </h3>

          {/* Salary/Turnover */}
          <div>
            <Label htmlFor="salary" className="text-foreground text-sm font-medium flex items-center gap-1.5 flex-wrap">
              <span>( Salary / Turnover ) p.a</span>
              <span style={{ color: '#e05353', fontSize: '11px', fontWeight: 500, letterSpacing: '0.2px' }}>
                * (Mandatory)
              </span>
            </Label>
            <div className="relative mt-2">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                {...register('salary')}
                type="text"
                className="bg-card border-border text-foreground pl-10"
                placeholder="Enter annual salary or turnover"
              />
            </div>
            {errors.salary && (
              <p className="text-red-400 text-sm mt-1">{errors.salary.message}</p>
            )}
          </div>

          {/* Existing EMI */}
          <div>
            <Label htmlFor="existing_emi" className="text-foreground text-sm font-medium flex items-center gap-1.5 flex-wrap">
              <span>Existing EMI Amount</span>
              <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 500 }}>(Optional)</span>
            </Label>
            <div className="relative mt-2">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                {...register('existing_emi')}
                type="number"
                className="bg-card border-border text-foreground pl-10"
                placeholder="Enter existing EMI amount"
              />
            </div>
            {errors.existing_emi && (
              <p className="text-red-400 text-sm mt-1">
                {errors.existing_emi.message}
              </p>
            )}
          </div>

          {/* Existing Liability */}
          <div>
            <Label htmlFor="existing_liability" className="text-foreground text-sm font-medium flex items-center gap-1.5 flex-wrap">
              <span>Existing Credit Card Liability</span>
              <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 500 }}>(Optional)</span>
            </Label>
            <div className="relative mt-2">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                {...register('existing_liability')}
                type="number"
                className="bg-card border-border text-foreground pl-10"
                placeholder="Enter credit card liability"
              />
            </div>
            {errors.existing_liability && (
              <p className="text-red-400 text-sm mt-1">
                {errors.existing_liability.message}
              </p>
            )}
          </div>
        </Card>

        {/* ── EDUCATION LOAN CO-APPLICANT SECTION vs DEGREE/REGISTRATION CERTIFICATES ── */}
        {isEducationLoan ? (
          <Card className="bg-card/50 border-border p-6 space-y-5">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wide border-b border-border pb-2">
              Education Loan Co-Applicant Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-foreground text-xs font-medium flex items-center gap-1.5 flex-wrap">
                  <span>Relation with Applicant</span>
                  <span style={{ color: '#e05353', fontSize: '11px', fontWeight: 500, letterSpacing: '0.2px' }}>
                    * (Mandatory)
                  </span>
                </Label>
                <Select value={coAppRelation} onValueChange={setCoAppRelation}>
                  <SelectTrigger className="bg-card border-border text-foreground">
                    <SelectValue placeholder="Select relation" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    {['Father', 'Mother', 'Brother', 'Sister', 'Spouse', 'Guardian', 'Other'].map((r) => (
                      <SelectItem key={r} value={r} className="focus:bg-accent cursor-pointer">
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-foreground text-xs font-medium flex items-center gap-1.5 flex-wrap">
                  <span>Employment Type</span>
                  <span style={{ color: '#e05353', fontSize: '11px', fontWeight: 500, letterSpacing: '0.2px' }}>
                    * (Mandatory)
                  </span>
                </Label>
                <Select value={coAppEmploymentType} onValueChange={setCoAppEmploymentType}>
                  <SelectTrigger className="bg-card border-border text-foreground">
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    {['Salaried', 'Self Employed', 'Business', 'Professional', 'Other'].map((e) => (
                      <SelectItem key={e} value={e} className="focus:bg-accent cursor-pointer">
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-foreground text-xs font-medium flex items-center gap-1.5 flex-wrap">
                  <span>Co-Applicant Email ID</span>
                  <span style={{ color: '#e05353', fontSize: '11px', fontWeight: 500, letterSpacing: '0.2px' }}>
                    * (Mandatory)
                  </span>
                </Label>
                <Input
                  value={coAppEmail}
                  onChange={(e) => setCoAppEmail(e.target.value)}
                  className="bg-card border-border text-foreground"
                  placeholder="coapplicant@example.com"
                  type="email"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-foreground text-xs font-medium flex items-center gap-1.5 flex-wrap">
                  <span>Co-Applicant Mobile No.</span>
                  <span style={{ color: '#e05353', fontSize: '11px', fontWeight: 500, letterSpacing: '0.2px' }}>
                    * (Mandatory)
                  </span>
                </Label>
                <Input
                  value={coAppMobile}
                  onChange={(e) => setCoAppMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="bg-card border-border text-foreground"
                  placeholder="10-digit mobile"
                  maxLength={10}
                  type="tel"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <Label className="text-foreground text-xs font-medium flex items-center gap-1.5 flex-wrap">
                  <span>Co-Applicant Mother's Name</span>
                  <span style={{ color: '#e05353', fontSize: '11px', fontWeight: 500, letterSpacing: '0.2px' }}>
                    * (Mandatory)
                  </span>
                </Label>
                <Input
                  value={coAppMotherName}
                  onChange={(e) => setCoAppMotherName(e.target.value)}
                  className="bg-card border-border text-foreground"
                  placeholder="Enter co-applicant mother's full name"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border mt-4">
              <h4 className="text-xs font-semibold text-primary uppercase tracking-wide mb-3">
                Co-Applicant Documents
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <CoAppUploadBox fieldKey="coAppAadhaar" label="Co-Applicant Aadhaar Card" required={false} />
                <CoAppUploadBox fieldKey="coAppPan" label="Co-Applicant PAN Card" required={false} />
                <CoAppUploadBox fieldKey="coAppCancelledCheque" label="Cancelled Cheque" required={false} />
                <CoAppUploadBox fieldKey="coAppForm16" label="Form 16 Part A-B (2 Yrs)" required={false} />
                <CoAppUploadBox fieldKey="coAppSalarySlips" label="3 Months Salary Slips" required={false} />
                <CoAppUploadBox fieldKey="coAppIdCard" label="Company / Govt ID Card" required={false} />
              </div>
            </div>
          </Card>
        ) : (
          /* Certificate Upload (Hidden in Education Loans exactly like OMS) */
          <Card className="bg-card/50 border-border p-6">
            <Label className="text-foreground mb-4 block font-medium flex items-center gap-1.5 flex-wrap">
              <span>Degree and Registration Certificate</span>
              <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 500 }}>(Optional)</span>
            </Label>

            {/* Upload Button */}
            {certificates.length < 4 && (
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-gold transition-colors cursor-pointer mb-4 bg-card/30"
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-foreground text-sm font-medium mb-1">Click to upload certificates</p>
                <p className="text-xs text-muted-foreground">
                  PDF, DOC, DOCX, JPG, PNG (Max 5MB per file, up to 4 files)
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            )}

            {/* Selected Files List with Previews */}
            {certificates.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-2">
                  Selected Files ({certificates.length}/4)
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {certificates.map((fileData, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative bg-background/50 border-2 border-border rounded-lg overflow-hidden"
                    >
                      {fileData.file.type.startsWith('image/') ? (
                        <img
                          src={fileData.preview}
                          alt={fileData.file.name}
                          className="w-full h-28 object-contain bg-black/5"
                        />
                      ) : (
                        <div className="w-full h-28 flex flex-col items-center justify-center bg-black/5 p-2">
                          <FileText className="w-10 h-10 text-blue-400 mb-1" />
                          <p className="text-foreground text-xs truncate w-full text-center px-1">
                            {fileData.file.name}
                          </p>
                        </div>
                      )}

                      <div className="p-1.5 bg-background/80">
                        <p className="text-foreground text-[11px] truncate">
                          {fileData.file.name}
                        </p>
                        <p className="text-muted-foreground text-[10px]">
                          {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="absolute top-1.5 right-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-full p-1 transition-colors shadow-sm"
                        title="Remove file"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            className="border-border text-foreground hover:bg-muted"
          >
            Back
          </Button>

          <Button
            type="submit"
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Application'
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

