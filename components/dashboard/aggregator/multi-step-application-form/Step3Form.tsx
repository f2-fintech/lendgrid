'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { getCookie, normalizeApiUrl } from '@/lib/utils';
import { getCompanyId } from '@/lib/http-client';
import { useFormContext } from './FormContext';
import { useToast } from '@/hooks/use-toast';
import { focusAndScrollToField } from './validation';

interface Step3FormProps {
  onSubmit: (files: {
    aadharFront: File | null;
    aadharBack: File | null;
    pancard: File | null;
    passportSizePhoto: File | null;
    currentAddressProof: File | null;
    permanentAddressProof: File | null;
    salarySlip: File | null;
    form26as: File | null;
  }) => Promise<void>;
  isLoading: boolean;
  onSkip?: () => void;
}

interface FilePreview {
  file: File | null;
  preview: string;
  uploadedUrl?: string | null;
  uploadedName?: string | null;
}

type Step3FilesKey =
  | 'aadharFront'
  | 'aadharBack'
  | 'pancard'
  | 'passportSizePhoto'
  | 'currentAddressProof'
  | 'permanentAddressProof'
  | 'salarySlip'
  | 'form26as';

const DEFAULT_STEP3_KEYS: Step3FilesKey[] = [
  'aadharFront',
  'aadharBack',
  'pancard',
  'passportSizePhoto',
  'currentAddressProof',
  'permanentAddressProof',
  'salarySlip',
  'form26as',
];

const emptyFile = (): FilePreview => ({
  file: null,
  preview: '',
  uploadedUrl: null,
  uploadedName: null,
});

function buildInitialStep3Files(): Record<Step3FilesKey, FilePreview> {
  let cached: Record<string, { url: string; name: string }> = {};
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('step3UploadedDocs');
      if (raw) cached = JSON.parse(raw);
    } catch (e) { }
  }
  const result: any = {};
  DEFAULT_STEP3_KEYS.forEach((k) => {
    result[k] = {
      file: null,
      preview: cached[k]?.url || '',
      uploadedUrl: cached[k]?.url || null,
      uploadedName: cached[k]?.name || null,
    };
  });
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Standalone FileUploadBox (outside Step3Form to prevent re-mounting)
// ─────────────────────────────────────────────────────────────────────────────

interface Step3FileUploadBoxProps {
  label: string;
  field: Step3FilesKey;
  required?: boolean;
  hint?: string;
  fileData: FilePreview;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>, field: Step3FilesKey) => void;
  onRemoveFile: (field: Step3FilesKey) => void;
}

const FileUploadBox: React.FC<Step3FileUploadBoxProps> = ({
  label,
  field,
  required = false,
  hint,
  fileData,
  onFileChange,
  onRemoveFile,
}) => {
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
        {isOptional && <span className="text-slate-400 text-xs font-medium">(Optional)</span>}
      </Label>
      {hint && (
        <p className="text-xs text-slate-400 dark:text-slate-300">{hint}</p>
      )}

      {!hasContent ? (
        <div
          className="border-2 border-dashed border-border/80 rounded-lg p-6 text-center hover:border-gold transition-colors cursor-pointer bg-card/40 hover:bg-card/60"
          onClick={() => document.getElementById(field)?.click()}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-200" />
          <p className="text-sm font-semibold text-slate-200 dark:text-slate-100">Click to upload</p>
          <p className="text-xs text-slate-400 dark:text-slate-300 mt-1">PDF, JPG, PNG, DOC (Max 10MB)</p>
          <input
            id={field}
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

// ─────────────────────────────────────────────────────────────────────────────
// Step3Form Main Component
// ─────────────────────────────────────────────────────────────────────────────

export const Step3Form: React.FC<Step3FormProps> = ({ onSubmit, isLoading, onSkip }) => {
  const { nextStep, prevStep, customerId } = useFormContext();
  const { toast } = useToast();

  const [files, setFiles] = useState<Record<Step3FilesKey, FilePreview>>(() => buildInitialStep3Files());

  // Auto-fetch existing customer KYC documents if in edit mode (customerId present)
  useEffect(() => {
    const activeCustId = customerId || (typeof window !== 'undefined' ? localStorage.getItem('loanFormCustomerId') : null);
    if (!activeCustId) return;

    let cachedDocs: any = null;
    try {
      const raw = localStorage.getItem('step3UploadedDocs');
      if (raw) cachedDocs = JSON.parse(raw);
    } catch (e) {}

    if (cachedDocs && Object.keys(cachedDocs).length > 0) {
      setFiles(buildInitialStep3Files());
      return;
    }

    const fetchExistingKycDocs = async () => {
      try {
        const companyId = getCompanyId();
        const token = getCookie('lendgrid_cookie');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(companyId ? { 'companyid': String(companyId) } : {}),
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
        const apiBase = normalizeApiUrl(process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:8080');
        const res = await fetch(`${apiBase}/get-customer-documents/${activeCustId}`, { headers });
        if (res.ok) {
          const json = await res.json();
          const docs = json?.data || json;
          if (Array.isArray(docs) && docs.length > 0) {
            setFiles((prev) => {
              const updated = { ...prev };
              const cacheToSave: Record<string, { url: string; name: string }> = {};

              docs.forEach((d: any) => {
                const url = d.document_url;
                const type = (d.type || '').toLowerCase().trim();
                if (!url) return;
                const fileName = url.split('/').pop() || 'Uploaded Document';

                if (type === 'aadhaar front' || type === 'aadhar front' || type === 'aadhaar card') {
                  updated.aadharFront = { file: null, preview: url, uploadedUrl: url, uploadedName: fileName };
                  cacheToSave.aadharFront = { url, name: fileName };
                } else if (type === 'aadhaar back' || type === 'aadhar back') {
                  updated.aadharBack = { file: null, preview: url, uploadedUrl: url, uploadedName: fileName };
                  cacheToSave.aadharBack = { url, name: fileName };
                } else if (type === 'pancard' || type === 'pan card' || type === 'pan') {
                  updated.pancard = { file: null, preview: url, uploadedUrl: url, uploadedName: fileName };
                  cacheToSave.pancard = { url, name: fileName };
                } else if (type === 'profile photo' || type === 'passport photo' || type === 'photo') {
                  updated.passportSizePhoto = { file: null, preview: url, uploadedUrl: url, uploadedName: fileName };
                  cacheToSave.passportSizePhoto = { url, name: fileName };
                } else if (type === 'salary slip' || type === 'salary_slip') {
                  updated.salarySlip = { file: null, preview: url, uploadedUrl: url, uploadedName: fileName };
                  cacheToSave.salarySlip = { url, name: fileName };
                } else if (type === 'form 26as' || type === 'form26as') {
                  updated.form26as = { file: null, preview: url, uploadedUrl: url, uploadedName: fileName };
                  cacheToSave.form26as = { url, name: fileName };
                } else if (type === 'current address proof' || type === 'address proof' || type === 'electricity bill') {
                  if (!updated.currentAddressProof?.uploadedUrl) {
                    updated.currentAddressProof = { file: null, preview: url, uploadedUrl: url, uploadedName: fileName };
                    cacheToSave.currentAddressProof = { url, name: fileName };
                  } else if (!updated.permanentAddressProof?.uploadedUrl) {
                    updated.permanentAddressProof = { file: null, preview: url, uploadedUrl: url, uploadedName: fileName };
                    cacheToSave.permanentAddressProof = { url, name: fileName };
                  }
                }
              });

              if (Object.keys(cacheToSave).length > 0) {
                localStorage.setItem('step3UploadedDocs', JSON.stringify(cacheToSave));
              }
              return updated;
            });
          }
        }
      } catch (err) {
        console.warn('Error fetching existing KYC docs in Step3Form:', err);
      }
    };
    fetchExistingKycDocs();
  }, [customerId]);

  const [sameAsCurrentAddress, setSameAsCurrentAddress] = useState<boolean>(false);

  const handleSameAsCurrentChange = (checked: boolean) => {
    setSameAsCurrentAddress(checked);
    if (checked) {
      setFiles((prev) => ({
        ...prev,
        permanentAddressProof: {
          file: prev.currentAddressProof.file,
          preview: prev.currentAddressProof.preview,
          uploadedUrl: prev.currentAddressProof.uploadedUrl,
          uploadedName: prev.currentAddressProof.uploadedName,
        },
      }));
    } else {
      setFiles((prev) => ({
        ...prev,
        permanentAddressProof: emptyFile(),
      }));
    }
  };

  const handleFileChange = useCallback((
    event: React.ChangeEvent<HTMLInputElement>,
    field: Step3FilesKey
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'File must be less than 10MB',
        variant: 'destructive',
      });
      return;
    }

    const preview = URL.createObjectURL(file);
    setFiles((prev) => {
      const next = {
        ...prev,
        [field]: { file, preview, uploadedUrl: null, uploadedName: file.name },
      };
      if (field === 'currentAddressProof' && sameAsCurrentAddress) {
        next.permanentAddressProof = { file, preview, uploadedUrl: null, uploadedName: file.name };
      }
      return next;
    });
  }, [sameAsCurrentAddress, toast]);

  const handleRemoveFile = useCallback((field: Step3FilesKey) => {
    setFiles((prev) => {
      if (prev[field].preview && prev[field].file) {
        URL.revokeObjectURL(prev[field].preview);
      }
      const next = {
        ...prev,
        [field]: emptyFile(),
      };
      if (field === 'currentAddressProof' && sameAsCurrentAddress) {
        next.permanentAddressProof = emptyFile();
      }
      return next;
    });

    try {
      const raw = localStorage.getItem('step3UploadedDocs');
      if (raw) {
        const parsed = JSON.parse(raw);
        delete parsed[field];
        if (field === 'currentAddressProof' && sameAsCurrentAddress) {
          delete parsed.permanentAddressProof;
        }
        localStorage.setItem('step3UploadedDocs', JSON.stringify(parsed));
      }
    } catch (e) { }
  }, [sameAsCurrentAddress]);

  const handleUpload = async () => {
    const activeFiles = Object.entries(files).filter(([, v]) => v.file !== null);

    // If no new files were selected, advance directly
    if (activeFiles.length === 0) {
      nextStep();
      return;
    }

    try {
      await onSubmit({
        aadharFront: files.aadharFront.file,
        aadharBack: files.aadharBack.file,
        pancard: files.pancard.file,
        passportSizePhoto: files.passportSizePhoto.file,
        currentAddressProof: files.currentAddressProof.file,
        permanentAddressProof: sameAsCurrentAddress
          ? files.currentAddressProof.file
          : files.permanentAddressProof.file,
        salarySlip: files.salarySlip.file,
        form26as: files.form26as.file,
      });

      // Cleanup previews
      Object.values(files).forEach((f) => {
        if (f.preview && f.file) URL.revokeObjectURL(f.preview);
      });

      toast({
        title: 'Success',
        description: 'Core documents uploaded successfully',
      });
      setTimeout(() => {
        nextStep();
      }, 1500);
    } catch (error: any) {
      toast({
        title: 'Upload Failed',
        description: error?.message || 'Failed to upload documents. Please check file sizes and formats.',
        variant: 'destructive',
      });
    }
  };


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(files).forEach((f) => {
        if (f.preview && f.file) URL.revokeObjectURL(f.preview);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          Core <span className="text-accent">Documents</span>
        </h2>
        <p className="text-muted-foreground text-sm">Step 3/4</p>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Upload individual KYC identification and valid address proofs for loan processing
        </p>
      </div>

      {/* Upload Forms */}
      <Card className="bg-card/50 border-border p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FileUploadBox
            label="Aadhaar Card (Front)"
            field="aadharFront"
            required
            hint="Upload front side of Aadhaar card with clear photo & text"
            fileData={files.aadharFront}
            onFileChange={handleFileChange}
            onRemoveFile={handleRemoveFile}
          />

          <FileUploadBox
            label="Aadhaar Card (Back)"
            field="aadharBack"
            required
            hint="Upload back side of Aadhaar card with address details"
            fileData={files.aadharBack}
            onFileChange={handleFileChange}
            onRemoveFile={handleRemoveFile}
          />

          <FileUploadBox
            label="PAN Card"
            field="pancard"
            required
            hint="Upload clear copy of individual PAN card"
            fileData={files.pancard}
            onFileChange={handleFileChange}
            onRemoveFile={handleRemoveFile}
          />

          <FileUploadBox
            label="Passport Size Photo"
            field="passportSizePhoto"
            required
            hint="Upload recent passport size photograph"
            fileData={files.passportSizePhoto}
            onFileChange={handleFileChange}
            onRemoveFile={handleRemoveFile}
          />
        </div>

        {/* Address Proofs Section */}
        <div className="pt-4 border-t border-border mt-4 space-y-4">
          <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">
            Address Verification Documents
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <FileUploadBox
                label="Address Proof for Current Address"
                field="currentAddressProof"
                required
                hint="Electricity Bill, LPG Bill, Rent Agreement, etc."
                fileData={files.currentAddressProof}
                onFileChange={handleFileChange}
                onRemoveFile={handleRemoveFile}
              />

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="same-as-current-address"
                  checked={sameAsCurrentAddress}
                  onChange={(e) => handleSameAsCurrentChange(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                />
                <Label
                  htmlFor="same-as-current-address"
                  className="text-foreground cursor-pointer text-xs font-medium"
                >
                  Permanent address same as current address
                </Label>
              </div>
            </div>

            <FileUploadBox
              label="Address Proof for Permanent Address"
              field="permanentAddressProof"
              required
              hint="Electricity Bill, Passport, Voter ID, etc."
              fileData={files.permanentAddressProof}
              onFileChange={handleFileChange}
              onRemoveFile={handleRemoveFile}
            />
          </div>
        </div>

        {/* Income & Tax Verification Documents */}
        <div className="pt-4 border-t border-border mt-4 space-y-4">
          <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">
            Income & Tax Documents
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileUploadBox
              label="3 Months Salary Slips (Optional)"
              field="salarySlip"
              hint="Upload last 3 months salary slips if salaried employee"
              fileData={files.salarySlip}
              onFileChange={handleFileChange}
              onRemoveFile={handleRemoveFile}
            />

            <FileUploadBox
              label="Form 26AS (Last 2 Financial Years) (Optional)"
              field="form26as"
              hint="Upload Form 26AS for last 2 years for income & tax verification"
              fileData={files.form26as}
              onFileChange={handleFileChange}
              onRemoveFile={handleRemoveFile}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            className="border-border text-foreground hover:bg-muted"
          >
            Back
          </Button>

          <div className="flex gap-3">
            {onSkip && (
              <Button
                type="button"
                variant="outline"
                onClick={onSkip}
                className="border-amber-500/40 text-amber-500 dark:text-amber-400 hover:bg-amber-500/10 hover:text-amber-400"
              >
                Skip Documents
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
