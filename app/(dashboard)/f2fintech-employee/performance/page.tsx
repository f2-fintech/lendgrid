'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search, Download, Eye, X, ChevronLeft, ChevronRight,
    Calendar, TrendingUp, Hourglass, AlertCircle, Plus, Users
} from 'lucide-react';
import { useEmployeeAuth } from '@/lib/employee-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { perfApi } from '@/lib/performance-api';
import RoleBasedPerformanceForm from '@/components/performance/RoleBasedPerformanceForm';

// ─── helpers ─────────────────────────────────────────────────────────────────
const asNum = (v: any) => { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; };
const fmt = (n: number) => Intl.NumberFormat('en-IN').format(n || 0);
const rupee = (n: number) => `₹${fmt(n)}`;
const pct = (planned = 0, done = 0) => {
    const p = Number(planned) || 0; const d = Number(done) || 0;
    if (p <= 0) return d > 0 ? 100 : 0;
    return Math.max(0, Math.min(100, Math.round((d / p) * 100)));
};
function toISO(d: Date) { return d.toISOString().slice(0, 10); }
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ─── types ───────────────────────────────────────────────────────────────────
type SnapshotDoc = {
    _id: string; date: string; role: 'employee' | 'manager'; company_id: string; owner_id: string;
    re?: {
        morning: { phoneConnects: number; physicalMeet: number; expectedLogins: number; expectedApprovals: number; expectedDisbursal: number; tillDate: { login: number; approvalLacs: number; disbursalLacs: number } };
        evening: { phoneConnectsDone: number; physicalMeetDone: number; loginsDone: number; approvalsDone: number; disbursalDone: number };
    };
    manager?: {
        morning: { teamTargetLoanLacs: number; customerPhoneConnects: number; physicalMeet?: number; expected: { loginsTeam: number; approvalLacs: number; disbursalAmount: number }; ownContribution: { login: number; approvalLacs: number; disbursalLacs: number }; tillDate: { login: number; approvalLacs: number; disbursalLacs: number }; teamMembers: { working: number; total: number } };
        evening: { teamLoginsDone: number; teamApprovalDoneAmount: number; teamDisbursalDoneAmount?: number; customerPhoneConnectsDone: number; physicalMeetDone?: number; topApprovalPerformer: { name: string; valueLacs: number }; topDisbursalPerformer: { name: string; valueLacs: number }; topPerformer: { name: string; valueLacs: number }; overallSentiment: string; sentimentReason: string; filesStuckDescription: string; supportRequired: string };
    };
    employee?: { _id: string; first_name: string; last_name: string; image?: string; designation?: string; code?: string; role?: string };
};

// ─── StatRow inside card ─────────────────────────
function StatLine({ label, value }: { label: string; value: number }) {
    return (
        <p className="text-[13px] leading-6 flex justify-between">
            <span className="text-gray-600 tracking-tight">{label}: </span>
            <span className="font-semibold text-gray-900">{fmt(value)}</span>
        </p>
    );
}

// ─── Performance Card ─────────────────────────────────────────────────────────
function PerformanceCard({ doc, onDetails }: { doc: SnapshotDoc; onDetails: (d: SnapshotDoc) => void }) {
    const role = doc.role;
    const emp = doc.employee;
    const empMorn = doc.re?.morning || ({} as any);
    const empEven = doc.re?.evening || ({} as any);
    const mgrMorn = doc.manager?.morning || ({} as any);
    const mgrExp = mgrMorn?.expected || {};
    const mgrOwn = mgrMorn?.ownContribution || {};
    const mgrEven = doc.manager?.evening || ({} as any);

    const morningPhone = role === 'manager' ? asNum(mgrMorn.customerPhoneConnects) : asNum(empMorn.phoneConnects);
    const eveningPhone = role === 'manager' ? asNum(mgrEven.customerPhoneConnectsDone) : asNum(empEven.phoneConnectsDone);
    const morningPhysical = role === 'manager' ? asNum(mgrMorn.physicalMeet) : asNum(empMorn.physicalMeet);
    const eveningPhysical = role === 'manager' ? asNum(mgrEven.physicalMeetDone) : asNum(empEven.physicalMeetDone);
    const morningLogin = role === 'manager' ? asNum(mgrExp.loginsTeam) + asNum(mgrOwn.login) : asNum(empMorn.expectedLogins);
    const morningApproval = role === 'manager' ? asNum(mgrExp.approvalLacs) + asNum(mgrOwn.approvalLacs) : asNum(empMorn.expectedApprovals);
    const morningDisbursal = role === 'manager' ? asNum(mgrExp.disbursalAmount) + asNum(mgrOwn.disbursalLacs) : asNum(empMorn.expectedDisbursal);
    const eveningLogin = role === 'manager' ? asNum(mgrEven.teamLoginsDone) : asNum(empEven.loginsDone);
    const eveningApproval = role === 'manager' ? asNum(mgrEven.teamApprovalDoneAmount) : asNum(empEven.approvalsDone);
    const eveningDisbursal = role === 'manager' ? asNum((mgrEven as any).teamDisbursalDoneAmount ?? 0) : asNum(empEven.disbursalDone);

    const tillLogin = role === 'manager' ? asNum(mgrMorn?.tillDate?.login) : asNum(empMorn?.tillDate?.login);
    const tillApproval = role === 'manager' ? asNum(mgrMorn?.tillDate?.approvalLacs) : asNum(empMorn?.tillDate?.approvalLacs);
    const tillDisbursal = role === 'manager' ? asNum(mgrMorn?.tillDate?.disbursalLacs) : asNum(empMorn?.tillDate?.disbursalLacs);

    const fullName = `${emp?.first_name || ''} ${emp?.last_name || ''}`.trim() || '—';
    const initials = fullName.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
    const designation = String(emp?.role) === '2' ? 'Manager' : (emp?.designation || '—');

    const compRows = [
        { label: 'Connected Calls', morning: morningPhone, evening: eveningPhone },
        { label: 'Login', morning: morningLogin, evening: eveningLogin },
        { label: 'Approval (₹)', morning: morningApproval, evening: eveningApproval },
        { label: 'Disbursal (₹)', morning: morningDisbursal, evening: eveningDisbursal },
    ];

    const dateLabel = doc.date
        ? new Date(doc.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';

    return (
        <div className="bg-white rounded-xl shadow-[0_4px_18px_0_rgba(75,70,92,0.1)] border border-gray-100 p-6 transition-all hover:shadow-[0_4px_24px_0_rgba(75,70,92,0.15)] flex flex-col">
            <div className="flex items-center gap-4 mb-5">
                <Avatar className="w-[50px] h-[50px]">
                    <AvatarImage src={emp?.image || ''} alt={fullName} />
                    <AvatarFallback className="text-[17px] font-medium bg-[#e0e7ff] text-[#666CFF]">{initials}</AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="text-[17px] font-semibold text-[#3A3541de] leading-tight">{fullName}</h3>
                    <p className="text-[14px] text-[#3a354199] mt-0.5">{designation}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="border rounded-md p-4 border-dashed border-[#dcdcdf]">
                    <h4 className="text-[13px] font-semibold text-[#3A3541de] mb-3 uppercase tracking-wide flex items-center gap-1.5"><Hourglass className="w-4 h-4 text-blue-500"/> Morning Plan</h4>
                    <StatLine label="Connected Calls" value={morningPhone} />
                    <StatLine label="Physical Meets" value={morningPhysical} />
                    <StatLine label="Expected Logins" value={morningLogin} />
                    <StatLine label="Exp. Approval" value={morningApproval} />
                    <StatLine label="Exp. Disbursal" value={morningDisbursal} />
                </div>
                <div className="border rounded-md p-4 border-dashed border-[#dcdcdf]">
                    <h4 className="text-[13px] font-semibold text-[#3A3541de] mb-3 uppercase tracking-wide flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-green-500"/> Evening Delivery</h4>
                    <StatLine label="Connected Calls" value={eveningPhone} />
                    <StatLine label="Physical Meets" value={eveningPhysical} />
                    <StatLine label="Logins Done" value={eveningLogin} />
                    <StatLine label="Appr. Done" value={eveningApproval} />
                    <StatLine label="Disb. Done" value={eveningDisbursal} />
                </div>
            </div>

            <div className="mb-5 border border-[#dcdcdf] border-dashed rounded-md p-4">
                <h4 className="text-[13px] font-semibold text-[#3A3541de] uppercase tracking-wide mb-3">Till Date Snapshot</h4>
                <div className="flex justify-between text-center gap-4">
                    <div className="flex-1"><p className="text-[12px] text-gray-500 mb-1">Login</p><p className="font-bold text-[#3A3541de]">{fmt(tillLogin)}</p></div>
                    <div className="flex-1"><p className="text-[12px] text-gray-500 mb-1">Approval</p><p className="font-bold text-[#3A3541de]">₹{fmt(tillApproval)}</p></div>
                    <div className="flex-1"><p className="text-[12px] text-gray-500 mb-1">Disbursal</p><p className="font-bold text-[#3A3541de]">₹{fmt(tillDisbursal)}</p></div>
                </div>
            </div>

            <div className="mb-5 bg-[#F9FAFC] rounded-md p-4">
                <h4 className="text-[12px] font-bold text-gray-600 uppercase tracking-widest mb-3">Morning vs Evening</h4>
                <div className="space-y-2.5">
                    {compRows.map((row) => {
                        const m = Number(row.morning || 0);
                        const e = Number(row.evening || 0);
                        const progress = m === 0 ? (e > 0 ? 100 : 0) : Math.round((e / m) * 100);
                        return (
                            <div key={row.label} className="flex flex-col">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-[13px] text-gray-600 font-medium">{row.label}</span>
                                    <span className="text-[13px] font-bold text-gray-900">{progress}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#666CFF] rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4">
                <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-600 bg-gray-100 rounded-full px-3 py-1">
                    <Calendar className="w-4 h-4" /> {dateLabel}
                </span>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => onDetails(doc)} className="text-[#666CFF] border-[#666CFF]/50 hover:bg-[#666CFF]/10 text-[13px] h-8 font-medium">Details</Button>
                    <Button size="sm" className="bg-[#666CFF] hover:bg-[#5a5fe0] text-white text-[13px] h-8 font-medium">Edit</Button>
                </div>
            </div>
        </div>
    );
}

// ─── Details Drawer & Missing Modal (Simplified Placeholders) ─────────────────
function DetailsDrawer({ doc, onClose }: { doc: SnapshotDoc | null; onClose: () => void }) {
    if (!doc) return null;
    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col">
                <button onClick={onClose} className="absolute right-4 top-4 p-2 text-gray-500 hover:text-gray-900"><X className="w-5 h-5"/></button>
                <h2 className="text-xl font-bold mb-4">Details</h2>
                <div className="flex-1 overflow-y-auto">
                    <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto">{JSON.stringify(doc, null, 2)}</pre>
                </div>
            </div>
        </div>
    );
}
function MissingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
                <button onClick={onClose} className="absolute right-4 top-4 p-2 text-gray-500 hover:text-gray-900"><X className="w-5 h-5"/></button>
                <h2 className="text-xl font-bold mb-4">Missing Uploads</h2>
                <p className="text-gray-500 py-10 text-center">Missing metrics feature goes here.</p>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PerformancePage() {
    const { employee, loading: authLoading } = useEmployeeAuth();
    const router = useRouter();

    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [selectedDate, setSelectedDate] = useState('');
    const [keyword, setKeyword] = useState('');
    const [managerFilter, setManagerFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [data, setData] = useState<{ data: SnapshotDoc[]; total: number } | null>(null);
    const [loadingData, setLoadingData] = useState(false);
    const [detailDoc, setDetailDoc] = useState<SnapshotDoc | null>(null);
    const [showMissing, setShowMissing] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);

    const LIMIT = 12;
    const pickDate = selectedDate || toISO(now);

    const managerList = useMemo(() => {
        if (!data?.data) return [];
        const seen = new Set<string>();
        const list: { code: string; name: string }[] = [];
        data.data.forEach(doc => {
            if (doc.role === 'manager' && doc.employee?.code) {
                const code = doc.employee.code;
                if (!seen.has(code)) {
                    seen.add(code);
                    list.push({ code, name: `${doc.employee.first_name || ''} ${doc.employee.last_name || ''}`.trim() });
                }
            }
        });
        return list;
    }, [data]);

    const fetchData = useCallback(async () => {
        if (!employee) return;
        setLoadingData(true);
        try {
            const params: Record<string, any> = { page, limit: LIMIT, month: selectedMonth, year: selectedYear, date: pickDate };
            if (keyword.trim()) params.keyword = keyword.trim();
            const result = await perfApi.list(params);
            setData(result);
        } catch (e) { console.error(e); } finally { setLoadingData(false); }
    }, [employee, page, selectedMonth, selectedYear, keyword, pickDate]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const totalPages = data ? Math.ceil(data.total / LIMIT) : 0;
    const visibleItems = useMemo(() => {
        if (!data?.data) return [];
        if (managerFilter === 'all') return data.data;
        return data.data.filter(d => d.employee?.code === managerFilter || d.role === 'employee');
    }, [data, managerFilter]);

    if (authLoading || !employee) return <div className="flex mt-20 justify-center"><div className="w-8 h-8 border-4 border-[#666CFF] border-t-transparent inset-0 rounded-full animate-spin"/></div>;

    const isAdmin = String((employee as any)?.role ?? '3') === '1';

    return (
        <div className="space-y-6">
            {/* Header Area exactly matching HRMS */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[24px] font-bold text-[#3A3541de] leading-tight flex items-center gap-2">
                        Performance
                    </h1>
                    <p className="text-[14px] text-[#3a354199] mt-1">Dashboard / Performance</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    {/* Month Picker (Outline styling) */}
                    <div className="relative">
                        <fieldset className="absolute inset-0 border border-gray-300 rounded focus-within:border-[#666CFF] focus-within:border-[2px] transition-colors pointer-events-none" style={{ top: '-8px' }}>
                            <legend className="text-[12px] px-1 text-gray-500 whitespace-nowrap ml-2 opacity-100 font-medium">Select Month and Year</legend>
                        </fieldset>
                        <Select value={`${selectedYear}-${selectedMonth}`} onValueChange={v => { const [y, m] = v.split('-'); setSelectedYear(Number(y)); setSelectedMonth(Number(m)); setPage(1); }}>
                            <SelectTrigger className="w-[200px] bg-transparent border-0 h-10 shadow-none focus:ring-0 relative z-10 text-[15px] font-medium text-[#3A3541de]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[2024, 2025, 2026, 2027].flatMap(y => MONTHS.map((m, i) => <SelectItem key={`${y}-${i + 1}`} value={`${y}-${i + 1}`}>{m} {y}</SelectItem>))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Date Picker */}
                    <div className="relative">
                        <fieldset className="absolute inset-0 border border-gray-300 rounded focus-within:border-[#666CFF] focus-within:border-[2px] transition-colors pointer-events-none" style={{ top: '-8px' }}>
                            <legend className="text-[12px] px-1 text-gray-500 whitespace-nowrap ml-2 opacity-100 font-medium">Select Date</legend>
                        </fieldset>
                        <input type="date" value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setPage(1); }} className="w-[160px] bg-transparent border-0 h-10 px-3 shadow-none outline-none relative z-10 text-[15px] font-medium text-[#3A3541de]" />
                    </div>

                    {/* Action Buttons styled like HRMS */}
                    <button 
                        onClick={() => router.push('/f2fintech-employee/performance-upload')}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#666CFF80] text-[#666CFF] font-medium text-[14px] hover:bg-[#666CFF14] transition-colors uppercase tracking-wide">
                        <Eye className="w-5 h-5"/> View Performance
                    </button>
                    
                    <button 
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FDB528] text-white font-bold text-[14px] hover:bg-[#e6a323] transition-colors shadow-md shadow-[#FDB528]/30 uppercase tracking-wide">
                        <Plus className="w-5 h-5" strokeWidth={3} /> Add Performance
                    </button>

                    <button 
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#666CFF80] text-[#666CFF] font-medium text-[14px] hover:bg-[#666CFF14] transition-colors uppercase tracking-wide">
                        <Users className="w-5 h-5"/> Team Performance
                    </button>

                    <button 
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-bold text-[14px] hover:opacity-90 shadow-md transition-all uppercase tracking-wide"
                        style={{ background: 'linear-gradient(270deg, #FF6A00 0%, #EE0979 100%)' }}>
                        <Download className="w-5 h-5"/> Export
                    </button>
                </div>
            </div>

            {/* Filter Row matching HRMS */}
            <div className="flex items-center gap-4">
                <div className="relative">
                    <fieldset className="absolute inset-0 border border-gray-300 rounded focus-within:border-[#666CFF] focus-within:border-2 transition-colors pointer-events-none" style={{ top: '-8px' }}>
                        <legend className="text-[12px] px-1 text-gray-500 whitespace-nowrap ml-2 opacity-100 font-medium">Search employees</legend>
                    </fieldset>
                    <div className="flex relative z-10 h-10 px-3 items-center">
                        <Search className="w-4 h-4 text-gray-500 mr-2"/>
                        <input className="bg-transparent outline-none w-[200px] text-[15px] text-[#3A3541de]" value={keyword} onChange={e => {setKeyword(e.target.value); setPage(1);}} />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {loadingData ? (
                 <div className="flex mt-20 justify-center"><div className="w-8 h-8 border-4 border-[#666CFF] border-t-transparent inset-0 rounded-full animate-spin"/></div>
            ) : !visibleItems.length ? (
                // "No records" Exact HRMS Match
                <div>
                    <div className="bg-white border rounded-lg py-16 flex flex-col items-center justify-center text-center w-full mt-4" style={{ borderColor: 'rgba(58, 53, 65, 0.12)' }}>
                        <h2 className="text-[16px] font-medium text-[#3A3541de] mb-1">No records</h2>
                        <p className="text-[14px] text-[#3a354199]">Try changing month/year, date, search, or open My Team Performance.</p>
                    </div>
                    {/* Pagination for NO RECORDS exactly like HRMS */}
                    <div className="flex justify-end mt-4 text-[#3A3541de]">
                        <div className="flex items-center gap-1">
                            <button className="text-gray-400 p-1"><ChevronLeft className="w-5 h-5"/></button>
                            <button className="w-8 h-8 rounded-full bg-[#666CFF] text-white flex items-center justify-center text-[14px] shadow-md shadow-[#666CFF]/30 font-medium">1</button>
                            <button className="text-gray-400 p-1"><ChevronRight className="w-5 h-5"/></button>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                        {visibleItems.map(doc => <PerformanceCard key={doc._id} doc={doc} onDetails={d => setDetailDoc(d)} />)}
                    </div>
                    {totalPages > 1 && (
                        <div className="flex justify-end mt-4 text-[#3A3541de]">
                            <div className="flex items-center gap-1">
                                <button className="text-gray-400 hover:text-gray-800 p-1" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}><ChevronLeft className="w-5 h-5"/></button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                                    <button key={pg} onClick={() => setPage(pg)} className={`w-8 h-8 rounded-full flex items-center justify-center text-[14px] transition-colors ${page === pg ? 'bg-[#666CFF] text-white shadow-md shadow-[#666CFF]/30 font-medium' : 'text-[#3A3541de] hover:bg-gray-100 font-normal'}`}>
                                        {pg}
                                    </button>
                                ))}
                                <button className="text-gray-400 hover:text-gray-800 p-1" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}><ChevronRight className="w-5 h-5"/></button>
                            </div>
                        </div>
                    )}
                </>
            )}

            <DetailsDrawer doc={detailDoc} onClose={() => setDetailDoc(null)} />
            <MissingModal open={showMissing} onClose={() => setShowMissing(false)} />
            {showAddForm && (
                <RoleBasedPerformanceForm 
                    open={showAddForm} 
                    onClose={() => setShowAddForm(false)} 
                    currentDate={pickDate} 
                    onSuccess={() => fetchData()} 
                />
            )}
        </div>
    );
}
