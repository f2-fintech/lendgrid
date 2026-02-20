'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useFormContext } from './FormContext';
import { useToast } from '@/hooks/use-toast';

interface Step2FormProps {
    onSubmit: (files: File[]) => Promise<void>;
    isLoading: boolean;
    onSkip?: () => void;
    onBack: () => void;
}

interface FileWithPreview {
    file: File;
    preview: string;
}

export const Step2Form: React.FC<Step2FormProps> = ({ onSubmit, isLoading, onSkip, onBack }) => {
    const { nextStep } = useFormContext();
    const { toast } = useToast();
    const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        const totalFiles = selectedFiles.length + files.length;

        if (totalFiles > 10) {
            toast({
                title: 'Too Many Files',
                description: 'Maximum 10 files allowed',
                variant: 'destructive',
            });
            return;
        }

        const validFiles = files.filter((file) => {
            if (file.size > 10 * 1024 * 1024) {
                toast({
                    title: 'File Too Large',
                    description: `${file.name} exceeds 10MB limit`,
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

        setSelectedFiles((prev) => [...prev, ...filesWithPreview]);
    };

    const handleRemoveFile = (index: number) => {
        const fileToRemove = selectedFiles[index];
        if (fileToRemove.preview) {
            URL.revokeObjectURL(fileToRemove.preview);
        }
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    const handleUpload = async () => {
        try {
            const files = selectedFiles.map((f) => f.file);
            console.log(
                'STEP 2 FILES:',
                files.map((f) => ({
                    name: f.name,
                    size: f.size,
                    type: f.type,
                }))
            );
            await onSubmit(files);

            // Cleanup previews
            selectedFiles.forEach((f) => URL.revokeObjectURL(f.preview));

            toast({
                title: 'Success',
                description: 'Documents uploaded successfully',
            });
            setTimeout(() => {
                nextStep();
            }, 2000);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to upload documents',
                variant: 'destructive',
            });
        }
    };

    const handleSkip = () => {
        // Cleanup previews before skipping
        selectedFiles.forEach((f) => URL.revokeObjectURL(f.preview));
        if (onSkip) {
            onSkip();
        } else {
            nextStep();
        }
    };

    const isPdf = (filename: string) => /\.pdf$/i.test(filename);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl mx-auto space-y-6"
        >
            {/* Header */}
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-foreground">
                    Statement <span className="text-accent">Upload</span>
                </h2>
                <p className="text-muted-foreground">Step 2/4</p>
                <p className="text-sm text-muted-foreground">
                    Upload your recent 6 months Bank Statement
                    <br />
                    Maximum File Upload Limit is <span className="text-accent">10</span>
                </p>
            </div>

            {/* Upload Area */}
            <Card className="bg-card/50 border-border p-8">
                <div className="space-y-6">
                    {/* Drop Zone */}
                    {selectedFiles.length < 10 && (
                        <div
                            className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-gold transition-colors cursor-pointer"
                            onClick={() => inputRef.current?.click()}
                        >
                            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-foreground mb-2">
                                Click to upload or drag and drop
                            </p>
                            <p className="text-sm text-muted-foreground">
                                PDF, DOC, DOCX, JPG, PNG (Max 10MB per file)
                            </p>
                            <input
                                ref={inputRef}
                                type="file"
                                multiple
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>
                    )}

                    {/* Selected Files List with Previews */}
                    {selectedFiles.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Selected Files ({selectedFiles.length}/10)
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                {selectedFiles.map((fileData, index) => (
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
                                                className="w-full h-32 object-contain bg-black/5"
                                            />
                                        ) : (
                                            <div className="w-full h-32 flex flex-col items-center justify-center bg-black/5 p-2">
                                                <FileText className="w-12 h-12 text-blue-400 mb-2" />
                                                <p className="text-foreground text-xs truncate w-full text-center px-2">
                                                    {fileData.file.name}
                                                </p>
                                            </div>
                                        )}

                                        <div className="p-2 bg-background/80">
                                            <p className="text-foreground text-xs truncate">
                                                {fileData.file.name}
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleRemoveFile(index)}
                                            className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="w-full flex justify-between items-center pt-4">
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
                                disabled={selectedFiles.length > 0}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                Skip
                            </Button>

                            <Button
                                onClick={handleUpload}
                                disabled={selectedFiles.length === 0 || isLoading}
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
                </div>
            </Card>
        </motion.div>
    );
};
