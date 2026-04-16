'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface RoleBasedPerformanceFormProps {
    open: boolean;
    onClose: () => void;
    currentDate: string;
    onSuccess?: () => void;
}

// ── Custom "Float/Outlined" TextField mimicking MUI ─────────────────────────
function MuiField({ label, type = 'text', value, onChange, placeholder, startIcon }: any) {
    return (
        <div className="relative pt-2">
            <fieldset 
                className="absolute inset-x-0 bottom-0 top-0 border border-gray-300 rounded hover:border-black focus-within:border-[#666CFF] focus-within:border-[2px] transition-colors pointer-events-none px-2" 
                style={{ marginTop: '-8px' }}
            >
                <legend className="text-[12px] px-1 text-gray-500 whitespace-nowrap ml-1 font-medium leading-none focus-within:text-[#666CFF]">
                    {label}
                </legend>
            </fieldset>
            <div className="flex items-center w-full px-3 py-2.5 relative z-10">
                {startIcon && <span className="mr-2 text-gray-500 font-sans text-[15px]">{startIcon}</span>}
                <input
                    type={type}
                    className="w-full bg-transparent border-none outline-none text-[#3A3541de] placeholder:text-gray-300 text-[15px]"
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                />
            </div>
        </div>
    );
}

export default function RoleBasedPerformanceForm({ open, onClose, currentDate, onSuccess }: RoleBasedPerformanceFormProps) {
    const [tab, setTab] = useState<'morning' | 'evening'>('morning');
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        phoneConnects: '', physicalMeet: '', expectedLogins: '', approvalExpected: '', disbursalExpected: '',
        tillDateLogins: '', tillDateApproval: '', tillDateDisbursal: '',
        phoneConnectsDone: '', physicalMeetDone: '', loginsDone: '', approvalsDone: '', disbursalDone: ''
    });

    const handleChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [key]: e.target.value }));
    };

    const handleSave = async () => {
        setSaving(true);
        setTimeout(() => {
            toast.success(`${tab === 'morning' ? 'Morning' : 'Evening'} snapshot saved!`);
            onSuccess?.();
            onClose();
            setSaving(false);
        }, 600);
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-[750px] p-0 overflow-hidden bg-white gap-0 rounded-xl shadow-2xl border-none">
                
                {/* ── Header ── */}
                <div className="flex items-start justify-between p-6 pb-2">
                    <div>
                        <h2 className="text-[20px] font-bold text-[#3A3541de] tracking-tight">Relationship Executive — Daily Snapshot</h2>
                        <p className="text-[14px] text-[#3A354199] mt-0.5">Morning plan • Evening delivery</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 pb-4">
                    {/* ── Date & Tabs Row ── */}
                    <div className="flex items-center gap-4 mt-2 mb-2">
                        <div className="w-[200px]">
                            <MuiField label="Date" type="date" value={currentDate || ''} onChange={() => {}} />
                        </div>
                        
                        <div className="flex rounded-md border border-gray-300 overflow-hidden h-11 ml-2">
                            <button 
                                onClick={() => setTab('morning')}
                                className={`px-5 text-[14px] font-medium transition-colors ${tab === 'morning' ? 'bg-[#E0E7FF] text-[#666CFF]' : 'bg-transparent text-[#3A354199] hover:bg-gray-50'}`}
                            >
                                Morning
                            </button>
                            <div className="w-[1px] bg-gray-300" />
                            <button 
                                onClick={() => setTab('evening')}
                                className={`px-5 text-[14px] font-medium transition-colors ${tab === 'evening' ? 'bg-[#E0E7FF] text-[#666CFF]' : 'bg-transparent text-[#3A354199] hover:bg-gray-50'}`}
                            >
                                Evening
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[50vh] overflow-y-auto pr-2 mt-4 space-y-6">
                        {tab === 'morning' && (
                            <div className="animate-in fade-in duration-300">
                                <div>
                                    <h3 className="text-[16px] font-bold text-[#3A3541de] mb-4">Morning Commitments</h3>
                                    <div className="space-y-5">
                                        <MuiField label="Connect with Customers on Phone" value={form.phoneConnects} onChange={handleChange('phoneConnects')} />
                                        <MuiField label="Connect with Customers on Physical Meet" value={form.physicalMeet} onChange={handleChange('physicalMeet')} />
                                        <MuiField label="Total Expected Logins" value={form.expectedLogins} onChange={handleChange('expectedLogins')} />
                                        <div className="relative">
                                            <MuiField label="Total Approval Expected (₹)" placeholder="₹" value={form.approvalExpected} onChange={handleChange('approvalExpected')} startIcon="₹" />
                                        </div>
                                        <MuiField label="Total Disbursal Expected (₹)" placeholder="₹" value={form.disbursalExpected} onChange={handleChange('disbursalExpected')} startIcon="₹" />
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <h3 className="text-[16px] font-bold text-[#3A3541de] mb-4">Till Date — Snapshot</h3>
                                    <div className="grid grid-cols-3 gap-4 pb-2">
                                        <MuiField label="Till Date Logins" value={form.tillDateLogins} onChange={handleChange('tillDateLogins')} />
                                        <MuiField label="Till Date Approval (Lacs)" placeholder="₹" value={form.tillDateApproval} onChange={handleChange('tillDateApproval')} startIcon="₹" />
                                        <MuiField label="Till Date Disbursal (Lacs)" placeholder="₹" value={form.tillDateDisbursal} onChange={handleChange('tillDateDisbursal')} startIcon="₹" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {tab === 'evening' && (
                            <div className="animate-in fade-in duration-300 space-y-5 pb-4">
                                <div>
                                    <h3 className="text-[16px] font-bold text-[#3A3541de] mb-4">Evening Delivery</h3>
                                    <div className="space-y-5">
                                        <MuiField label="Connected with Customers on Phone" value={form.phoneConnectsDone} onChange={handleChange('phoneConnectsDone')} />
                                        <MuiField label="Connected with Customers on Physical Meet" value={form.physicalMeetDone} onChange={handleChange('physicalMeetDone')} />
                                        <MuiField label="Total Logins Done" value={form.loginsDone} onChange={handleChange('loginsDone')} />
                                        <MuiField label="Total Approval Done (₹)" placeholder="₹" value={form.approvalsDone} onChange={handleChange('approvalsDone')} startIcon="₹" />
                                        <MuiField label="Total Disbursal Done (₹)" placeholder="₹" value={form.disbursalDone} onChange={handleChange('disbursalDone')} startIcon="₹" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 px-6 border-t border-gray-200 flex items-center justify-end gap-3 bg-white">
                    <button onClick={onClose} disabled={saving} className="px-5 py-2 rounded font-medium text-[#666CFF] border border-[#666CFF]/50 hover:bg-[#666CFF]/5 transition text-[14px]">
                        Cancel
                    </button>
                    <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded font-bold text-white bg-[#FDB528] hover:bg-[#e5a220] transition text-[14px] shadow-sm">
                        {saving ? 'Saving...' : `Save ${tab === 'morning' ? 'Morning' : 'Evening'}`}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
