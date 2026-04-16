'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ArrowLeft, Download, Upload, Plus, Search, X, Eye, Pencil, Trash2,
    TrendingUp, Trophy, Star, Users, Calendar, CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useEmployeeAuth } from '@/lib/employee-auth';
import { perfUploadApi } from '@/lib/performance-upload-api';

// ── Types ─────────────────────────────────────────────────────────────────────
type Row = {
    _id: string; date: string; employee_name?: string; employee_id?: string;
    manager_tl?: string; login?: number; approval?: number; disbursal?: number;
    drop?: number; cashback?: number; gross_approval?: number; gross_disbursal?: number; abnp?: number;
    code?: string;[k: string]: any;
};
type SortKey = 'login' | 'approval' | 'disbursal' | null;
type TeamTotalsMap = Record<string, {
    role: string; teamName: string; memberCodes: string[];
    memberCount: number; teamTotalLogins: number; teamTotalApproval: number;
    teamTotalDisbursal: number;
}>;

// ── Helpers ───────────────────────────────────────────────────────────────────
const rupee = (n: number) => `₹${Intl.NumberFormat('en-IN').format(Number(n || 0))}`;
const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d: string) => {
    if (!d) return '—';
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? d : `${String(dt.getDate()).padStart(2, '0')}-${String(dt.getMonth() + 1).padStart(2, '0')}-${dt.getFullYear()}`;
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, gradient, icon }: { label: string; value: string; gradient: string; icon: React.ReactNode }) {
    return (
        <div className={`relative rounded-[16px] p-5 text-white overflow-hidden shadow-[0_4px_18px_0_rgba(0,0,0,0.15)] min-h-[120px] flex flex-col justify-between ${gradient} transition-transform hover:-translate-y-1 duration-200`}>
            {/* Subtle light reflections */}
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-white/10 blur-xl" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-black/5 blur-xl" />
            
            <div className="relative flex-1">
                <div className="flex justify-between items-start mb-3">
                    <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/20">
                        {icon}
                    </div>
                    <TrendingUp className="w-5 h-5 text-white/50" />
                </div>
                <p className="text-[13px] font-semibold text-white/90 mb-0.5 tracking-wide uppercase">{label}</p>
                <p className="text-[26px] font-black leading-none tracking-tight">{value}</p>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PerformanceUploadPage() {
    const router = useRouter();
    const q = useSearchParams();
    const { employee, loading: authLoading } = useEmployeeAuth();
    const fileRef = useRef<HTMLInputElement | null>(null);

    const [date, setDate] = useState(() => q?.get('date') || todayISO());
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [search, setSearch] = useState('');
    const [debounced, setDebounced] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [managerFilter, setManagerFilter] = useState('all');
    const [teamTotals, setTeamTotals] = useState<TeamTotalsMap>({});

    const [formOpen, setFormOpen] = useState(false);
    const [formSaving, setFormSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [teamModalOpen, setTeamModalOpen] = useState(false);
    const [teamBreakdown, setTeamBreakdown] = useState<any>(null);
    const [teamBreakdownLoading, setTeamBreakdownLoading] = useState(false);

    const [form, setForm] = useState({
        employee_name: '', manager_tl: '', code: '',
        total_logins: '', approval_lakh: '', disbursal_lakh: '', drop_lakh: '', cashback_lakh: '',
    });
    const [amountUnit, setAmountUnit] = useState<'rupees' | 'lakhs'>('rupees');

    const isAdmin = String(employee?.role) === '1';
    const isAsstOps = employee?.designation === 'Asst. Ops Manager';
    const canAddRow = isAdmin || isAsstOps;
    const canUpload = isAdmin || isAsstOps;

    const companyId = useMemo(() => {
        if (typeof window === 'undefined') return '';
        const value = `; ${document.cookie}`;
        for (const cookieName of ['token', 'employee_token']) {
            const parts = value.split(`; ${cookieName}=`);
            if (parts.length === 2) {
                try {
                    const token = decodeURIComponent(parts.pop()!.split(';').shift() || '');
                    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
                    if (payload?.company_id) return String(payload.company_id);
                } catch { }
            }
        }
        return '';
    }, []);

    useEffect(() => {
        const t = setTimeout(() => setDebounced(search.trim().toLowerCase()), 300);
        return () => clearTimeout(t);
    }, [search]);

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const data = await perfUploadApi.list({ date, company_id: companyId });
            const raw: any[] = Array.isArray(data) ? data : data?.data || [];
            const normalized: Row[] = raw.map((r) => {
                const login = Number(r.login ?? r.total_logins ?? 0);
                const approval = Number(r.approval ?? r.approval_amount ?? 0);
                const disbursal = Number(r.disbursal ?? r.disbursal_amount ?? 0);
                const drop = Number(r.drop ?? r.drop_amount ?? 0);
                const cashback = Number(r.cashback ?? r.cashback_amount ?? 0);
                const gross_approval = Number(r.gross_approval ?? 0);
                const gross_disbursal = Number(r.gross_disbursal ?? 0);
                const abnp = Math.max(approval - (disbursal + drop + cashback), 0);
                return { ...r, login, approval, disbursal, drop, cashback, gross_approval, gross_disbursal, abnp };
            });
            setRows(normalized);

            if (!normalized.length && date === todayISO()) {
                try {
                    const dates = await perfUploadApi.dates(companyId);
                    const latestDate = dates?.[0]?.date;
                    if (latestDate && latestDate !== date) setDate(latestDate);
                } catch { }
            }
        } catch (e) {
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [date, companyId]);

    useEffect(() => { if (date) fetchList(); }, [date]);

    useEffect(() => {
        if (!rows.length || !companyId) return;
        perfUploadApi.teamTotals(companyId).then(setTeamTotals).catch(() => { });
    }, [rows, companyId]);

    const totals = useMemo(() => {
        const sum = (k: string) => rows.reduce((a, r) => a + Number(r[k] || 0), 0);
        return {
            logins: sum('login'), approvals: sum('approval'), disbursal: sum('disbursal'),
            drop: sum('drop'), cashback: sum('cashback'),
            grossApproval: sum('gross_approval'), grossDisbursal: sum('gross_disbursal'), abnp: sum('abnp'),
        };
    }, [rows]);

    const starPerformers = useMemo(() => {
        if (!rows.length) return { approval: null as Row | null, disbursal: null as Row | null };
        return {
            approval: rows.reduce((best, r) => Number(r.approval) > Number(best?.approval || 0) ? r : best, rows[0]),
            disbursal: rows.reduce((best, r) => Number(r.disbursal) > Number(best?.disbursal || 0) ? r : best, rows[0]),
        };
    }, [rows]);

    const managerList = useMemo(() =>
        Object.entries(teamTotals).map(([code, info]) => ({
            code, name: info.teamName || code, role: info.role === 'manager' ? 'Manager' : 'Team Leader',
        })).sort((a, b) => a.role === 'Manager' ? -1 : 1),
        [teamTotals]);

    const filteredRows = useMemo(() => {
        let result = rows;
        if (managerFilter !== 'all') {
            const teamInfo = teamTotals[managerFilter];
            if (teamInfo?.memberCodes) {
                const codes = new Set(teamInfo.memberCodes);
                result = result.filter((r) => codes.has(r.code || ''));
            } else {
                result = result.filter((r) => r.manager_tl === managerFilter);
            }
        }
        if (debounced) {
            result = result.filter((r) =>
                (r.employee_name || '').toLowerCase().includes(debounced) ||
                (r.code || '').toLowerCase().includes(debounced) ||
                (r.employee_id || '').toLowerCase().includes(debounced)
            );
        }
        return result;
    }, [rows, debounced, managerFilter, teamTotals]);

    const sortedRows = useMemo(() => {
        if (!sortKey) return filteredRows;
        return [...filteredRows].sort((a, b) => {
            const av = Number(a[sortKey] || 0), bv = Number(b[sortKey] || 0);
            return sortDir === 'asc' ? av - bv : bv - av;
        });
    }, [filteredRows, sortKey, sortDir]);

    const managerOptions = useMemo(() => {
        const s = new Set<string>();
        rows.forEach((r) => { if (r.manager_tl?.trim()) s.add(r.manager_tl.trim()); });
        return Array.from(s);
    }, [rows]);

    const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            await perfUploadApi.uploadFile(file, companyId);
            toast.success('Upload successful');
            await fetchList();
        } catch (err: any) {
            toast.error(err?.message || 'Upload failed');
        } finally {
            if (fileRef.current) fileRef.current.value = '';
            setUploading(false);
        }
    };

    const onDelete = async (id: string) => {
        if (!confirm('Delete this row?')) return;
        try {
            await perfUploadApi.deleteRow(id);
            toast.success('Row deleted');
            await fetchList();
        } catch {
            toast.error('Delete failed');
        }
    };

    const sanitizeMoney = (v: string) => Number(String(v || '0').replace(/,/g, '') || 0);

    const onFormSubmit = async () => {
        if (!form.employee_name.trim() || !form.manager_tl.trim()) { toast.error('Employee Name and Manager/TL are required'); return; }
        setFormSaving(true);
        const mul = amountUnit === 'lakhs' ? 100000 : 1;
        const payload = {
            date, employee_name: form.employee_name.trim(), code: form.code.trim() || undefined,
            manager_tl: form.manager_tl.trim(), total_logins: Number(form.total_logins || 0),
            approval_amount: Math.round(sanitizeMoney(form.approval_lakh) * mul),
            disbursal_amount: Math.round(sanitizeMoney(form.disbursal_lakh) * mul),
            drop_amount: Math.round(sanitizeMoney(form.drop_lakh) * mul),
            cashback_amount: Math.round(sanitizeMoney(form.cashback_lakh) * mul),
            company_id: companyId || undefined,
        };
        try {
            if (editingId) await perfUploadApi.updateRow(editingId, payload);
            else await perfUploadApi.addRows([payload]);
            toast.success(editingId ? 'Row updated' : 'Row saved');
            setFormOpen(false); resetForm(); await fetchList();
        } catch (err: any) { toast.error(err?.message || 'Failed to save'); } finally { setFormSaving(false); }
    };

    const resetForm = () => {
        setForm({ employee_name: '', manager_tl: '', code: '', total_logins: '', approval_lakh: '', disbursal_lakh: '', drop_lakh: '', cashback_lakh: '' });
        setAmountUnit('rupees'); setEditingId(null);
    };

    const openEdit = (r: Row) => {
        setEditingId(r._id); setDate(r.date || date);
        setForm({
            employee_name: r.employee_name || '', manager_tl: r.manager_tl || '', code: r.code || '',
            total_logins: String(r.login || 0), approval_lakh: r.approval ? Number(r.approval).toLocaleString('en-IN') : '',
            disbursal_lakh: r.disbursal ? Number(r.disbursal).toLocaleString('en-IN') : '',
            drop_lakh: r.drop ? Number(r.drop).toLocaleString('en-IN') : '', cashback_lakh: r.cashback ? Number(r.cashback).toLocaleString('en-IN') : '',
        });
        setAmountUnit('rupees'); setFormOpen(true);
    };

    const fetchTeamBreakdown = async (managerName: string) => {
        setTeamBreakdownLoading(true); setTeamModalOpen(true);
        try { setTeamBreakdown(await perfUploadApi.teamBreakdown(managerName, companyId)); } 
        catch { setTeamBreakdown(null); } finally { setTeamBreakdownLoading(false); }
    };

    const exportCSV = () => {
        const header = ['S.No.', 'Date', 'Employee', 'Code', 'Manager/TL', 'Logins', 'Approval', 'Disbursal', 'Drop', 'Cashback'];
        const body = sortedRows.map((r, i) => [i + 1, r.date || '', r.employee_name || '', r.code || '', r.manager_tl || '', r.login || 0, r.approval || 0, r.disbursal || 0, r.drop || 0, r.cashback || 0]);
        const csv = [header, ...body].map((r) => r.join(',')).join('\n');
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        a.download = `performance_${date}.csv`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    if (authLoading) return <div className="flex mt-20 justify-center"><div className="w-8 h-8 border-4 border-[#666CFF] border-t-transparent inset-0 rounded-full animate-spin"/></div>;

    // EXACT HRMS STYLING
    return (
        <div className="min-h-screen bg-[#F4F6F8] py-8 px-4 md:px-8 font-sans">
            <div className="max-w-[1440px] mx-auto space-y-6">

                {/* ── Top Bar Container ── */}
                <div className="bg-white rounded-2xl shadow-[0_4px_18px_0_rgba(75,70,92,0.1)] border border-[#dcdcdf] p-6 pb-6">
                    {/* Header Row */}
                    <div className="flex items-start md:items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-[#E0E7FF] hover:bg-[#c7d2fe] flex items-center justify-center transition-colors">
                                <ArrowLeft className="w-5 h-5 text-[#666CFF]" strokeWidth={2.5} />
                            </button>
                            <div>
                                <h1 className="text-[20px] md:text-[22px] font-black text-[#3A3541de] tracking-tight">Performance Uploads</h1>
                                <p className="text-[13px] text-[#3a354199] font-medium mt-0.5">Daily login, approval & disbursal tracking panel</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {canAddRow && (
                                <>
                                    <Button onClick={() => { resetForm(); setFormOpen(true); }} className="h-10 px-5 rounded-full bg-[#6B7280] hover:bg-[#4B5563] text-white font-bold text-[14px] shadow-sm uppercase tracking-wide gap-2">
                                        <Plus className="w-4 h-4 text-white" /> Add Row
                                    </Button>
                                    <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onUpload} />
                                    {canUpload && (
                                        <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="h-10 px-5 rounded-full bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold text-[14px] shadow-sm uppercase tracking-wide gap-2">
                                            <Upload className="w-4 h-4 text-white" /> {uploading ? 'Wait' : 'Upload'}
                                        </Button>
                                    )}
                                </>
                            )}
                            <Button onClick={exportCSV} variant="outline" className="h-10 px-5 rounded-full border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 text-[14px] uppercase tracking-wide gap-2 bg-white">
                                <Download className="w-4 h-4" /> Export
                            </Button>
                        </div>
                    </div>

                    {/* Filters Row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {/* Search */}
                        <div className="lg:col-span-2 relative h-12">
                            <fieldset className="absolute inset-0 border border-gray-300 rounded-[10px] focus-within:border-[#666CFF] focus-within:border-2 transition-colors pointer-events-none" style={{ top: '-8px' }}>
                                <legend className="text-[12px] px-1 text-gray-500 whitespace-nowrap ml-2 opacity-100 font-medium tracking-wide">Search employee / id / code...</legend>
                            </fieldset>
                            <div className="relative z-10 flex items-center h-full px-4">
                                <Search className="w-[18px] h-[18px] text-gray-400 mr-2" />
                                <input className="bg-transparent border-none outline-none text-[#3A3541de] placeholder:text-gray-400 w-full text-[15px]" value={search} onChange={(e) => setSearch(e.target.value)} />
                                {search && <button onClick={() => { setSearch(''); setDebounced(''); }} className="text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>}
                            </div>
                        </div>

                        {/* Date */}
                        <div className="relative h-12">
                            <fieldset className="absolute inset-0 border border-gray-300 rounded-[10px] focus-within:border-[#666CFF] focus-within:border-2 transition-colors pointer-events-none" style={{ top: '-8px' }}>
                                <legend className="text-[12px] px-1 text-gray-500 whitespace-nowrap ml-2 opacity-100 font-medium tracking-wide">Date</legend>
                            </fieldset>
                            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full h-full px-4 bg-transparent border-none outline-none text-[15px] text-[#3A3541de] relative z-10" />
                        </div>

                        {/* Filter by Manager */}
                        <div className="relative h-12">
                            <fieldset className="absolute inset-0 border border-gray-300 rounded-[10px] focus-within:border-[#666CFF] focus-within:border-2 transition-colors pointer-events-none" style={{ top: '-8px' }}>
                                <legend className="text-[12px] px-1 text-gray-500 whitespace-nowrap ml-2 opacity-100 font-medium tracking-wide">Filter by Manager/TL</legend>
                            </fieldset>
                            <Select value={managerFilter} onValueChange={setManagerFilter}>
                                <SelectTrigger className="w-full h-full px-4 bg-transparent border-none shadow-none focus:ring-0 relative z-10 text-[15px] text-[#3A3541de]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Employees</SelectItem>
                                    {managerList.map((m) => (
                                        <SelectItem key={m.code} value={m.code}>
                                            <span className="flex items-center gap-2">
                                                <Badge className={`h-5 text-[10px] uppercase font-bold ${m.role === 'Manager' ? 'bg-[#E0E7FF] text-[#666CFF] hover:bg-[#E0E7FF]' : 'bg-[#DCFCE7] text-[#16A34A] hover:bg-[#DCFCE7]'}`}>{m.role}</Badge>
                                                {m.name}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Sort */}
                        <div className="relative h-12">
                            <fieldset className="absolute inset-0 border border-gray-300 rounded-[10px] focus-within:border-[#666CFF] focus-within:border-2 transition-colors pointer-events-none" style={{ top: '-8px' }}>
                                <legend className="text-[12px] px-1 text-gray-500 whitespace-nowrap ml-2 opacity-100 font-medium tracking-wide">Sort by</legend>
                            </fieldset>
                            <Select value={sortKey || 'none'} onValueChange={(v) => { if (v === 'none') { setSortKey(null); return; } setSortDir(sortKey === v ? (sortDir === 'asc' ? 'desc' : 'asc') : 'desc'); setSortKey(v as SortKey); }}>
                                <SelectTrigger className="w-full h-full px-4 bg-transparent border-none shadow-none focus:ring-0 relative z-10 text-[15px] text-[#3A3541de]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    <SelectItem value="login">Logins</SelectItem>
                                    <SelectItem value="approval">Approvals</SelectItem>
                                    <SelectItem value="disbursal">Disbursals</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                    <StatCard label="Total Logins" value={totals.logins.toLocaleString('en-IN')} gradient="bg-[linear-gradient(135deg,#FF8A00,#FF5E3A)]" icon={<CheckCircle className="w-5 h-5 text-white" />} />
                    <StatCard label="Total Gross Approval" value={rupee(totals.grossApproval)} gradient="bg-[linear-gradient(135deg,#3B82F6,#2563EB)]" icon={<span className="text-[18px] font-bold text-white">₹</span>} />
                    <StatCard label="Total Net Approval" value={rupee(totals.approvals)} gradient="bg-[linear-gradient(135deg,#FDB528,#F58B00)]" icon={<Trophy className="w-5 h-5 text-white" />} />
                    <StatCard label="Total Gross Disbursal" value={rupee(totals.grossDisbursal)} gradient="bg-[linear-gradient(135deg,#8B5CF6,#7C3AED)]" icon={<span className="text-[18px] font-bold text-white">₹</span>} />
                    <StatCard label="Total Net Disbursal" value={rupee(totals.disbursal)} gradient="bg-[linear-gradient(135deg,#10B981,#059669)]" icon={<Star className="w-5 h-5 text-white" />} />
                    <StatCard label="Total ABND" value={rupee(totals.abnp)} gradient="bg-[linear-gradient(135deg,#334155,#1E293B)]" icon={<span className="text-[18px] font-bold text-white">Δ</span>} />
                    <StatCard label="Total Drop" value={rupee(totals.drop)} gradient="bg-[linear-gradient(135deg,#EF4444,#DC2626)]" icon={<span className="text-[18px] text-white">↓</span>} />
                    <StatCard label="Total Cashback" value={rupee(totals.cashback)} gradient="bg-[linear-gradient(135deg,#06B6D4,#0891B2)]" icon={<span className="text-[18px] text-white">₹</span>} />
                </div>

                {/* ── Star Performers ── */}
                {(starPerformers.approval || starPerformers.disbursal) && (
                    <div className="bg-white rounded-2xl shadow-[0_4px_18px_0_rgba(75,70,92,0.1)] border border-[#dcdcdf] p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 rounded-full bg-[#FFF7E8] flex items-center justify-center">
                                <Trophy className="w-5 h-5 text-[#FDB528]" />
                            </div>
                            <h2 className="text-[18px] font-black text-[#3A3541de]">Star Performers</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {starPerformers.approval && (
                                <div className="relative overflow-hidden rounded-[16px] bg-[#E8FAED] border border-[#DCFCE7] p-4 flex flex-col items-start min-h-[100px] justify-center shadow-sm">
                                    <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-[#16A34A]/10 blur-xl" />
                                    <div className="flex items-center gap-1.5 mb-1 bg-white/60 px-2 py-0.5 rounded-full border border-green-200">
                                        <Trophy className="w-3.5 h-3.5 text-[#16A34A]" />
                                        <span className="text-[11px] font-extrabold text-[#16A34A] uppercase tracking-wide">Top Approval</span>
                                    </div>
                                    <p className="text-[15px] font-black text-[#065F46] uppercase leading-tight mt-1">{starPerformers.approval.employee_name || '—'}</p>
                                    <p className="text-[22px] font-black text-[#16A34A] leading-none mt-1 shadow-sm">{rupee(Number(starPerformers.approval.approval || 0))}</p>
                                </div>
                            )}
                            {starPerformers.disbursal && (
                                <div className="relative overflow-hidden rounded-[16px] bg-[#EEF2FF] border border-[#E0E7FF] p-4 flex flex-col items-start min-h-[100px] justify-center shadow-sm">
                                    <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-[#666CFF]/10 blur-xl" />
                                    <div className="flex items-center gap-1.5 mb-1 bg-white/60 px-2 py-0.5 rounded-full border border-indigo-200">
                                        <Star className="w-3.5 h-3.5 text-[#666CFF]" />
                                        <span className="text-[11px] font-extrabold text-[#666CFF] uppercase tracking-wide">Top Disbursal</span>
                                    </div>
                                    <p className="text-[15px] font-black text-[#312E81] uppercase leading-tight mt-1">{starPerformers.disbursal.employee_name || '—'}</p>
                                    <p className="text-[22px] font-black text-[#666CFF] leading-none mt-1 shadow-sm">{rupee(Number(starPerformers.disbursal.disbursal || 0))}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Data Table ── */}
                <div className="bg-white rounded-2xl shadow-[0_4px_18px_0_rgba(75,70,92,0.1)] border border-[#dcdcdf] overflow-hidden">
                    {loading ? (
                        <div className="p-6 space-y-3">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : sortedRows.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto mb-3 flex items-center justify-center">
                                <Search className="w-7 h-7 text-slate-400" />
                            </div>
                            <h3 className="font-extrabold text-slate-900 text-[18px]">No records found</h3>
                            <p className="text-slate-500 text-[14px] mt-1">
                                {search ? `No results for "${search}"` : 'No data available for selected date'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto style-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#f0f4f9] border-b border-[#dcdcdf]">
                                        <th className="px-5 py-4 text-[13px] font-bold text-[#3A3541de] uppercase tracking-wide whitespace-nowrap">S.No.</th>
                                        <th className="px-5 py-4 text-[13px] font-bold text-[#3A3541de] uppercase tracking-wide whitespace-nowrap">Date</th>
                                        <th className="px-5 py-4 text-[13px] font-bold text-[#3A3541de] uppercase tracking-wide whitespace-nowrap">Employee</th>
                                        <th className="px-5 py-4 text-[13px] font-bold text-[#3A3541de] uppercase tracking-wide whitespace-nowrap">Code</th>
                                        <th className="px-5 py-4 text-[13px] font-bold text-[#3A3541de] uppercase tracking-wide whitespace-nowrap">Manager / TL</th>
                                        <th className="px-5 py-4 text-[13px] font-bold text-[#3A3541de] uppercase tracking-wide whitespace-nowrap text-right">Logins</th>
                                        <th className="px-5 py-4 text-[13px] font-bold text-[#3A3541de] uppercase tracking-wide whitespace-nowrap text-right">Approvals (₹)</th>
                                        <th className="px-5 py-4 text-[13px] font-bold text-[#3A3541de] uppercase tracking-wide whitespace-nowrap text-right">Disbursal (₹)</th>
                                        <th className="px-5 py-4 text-[13px] font-bold text-[#3A3541de] uppercase tracking-wide whitespace-nowrap text-right">Drop (₹)</th>
                                        <th className="px-5 py-4 text-[13px] font-bold text-[#3A3541de] uppercase tracking-wide whitespace-nowrap text-right">Cashback (₹)</th>
                                        {canAddRow && <th className="px-5 py-4" />}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#dcdcdf]">
                                    {sortedRows.map((r, idx) => {
                                        return (
                                            <tr key={r._id} className="hover:bg-slate-50 transition-colors bg-white">
                                                <td className="px-5 py-3 text-[14px] font-bold text-[#3A3541de]">{idx + 1}</td>
                                                <td className="px-5 py-3 text-[14px] text-gray-600 font-medium">{fmtDate(r.date)}</td>
                                                <td className="px-5 py-3 text-[14px]">
                                                    <span className="font-bold text-[#3A3541de]">{r.employee_name || '—'}</span>
                                                </td>
                                                <td className="px-5 py-3 text-[14px] text-gray-600 font-medium">{r.code || '—'}</td>
                                                <td className="px-5 py-3 text-[14px]">
                                                    {r.manager_tl ? <span className="font-medium text-[#3A3541de]">{r.manager_tl}</span> : <span className="text-gray-400">—</span>}
                                                </td>
                                                <td className="px-5 py-3 text-[14px] font-bold text-gray-900 text-right">{Number(r.login || 0)}</td>
                                                <td className="px-5 py-3 text-[14px] font-bold text-gray-900 text-right">{rupee(Number(r.approval || 0))}</td>
                                                <td className="px-5 py-3 text-[14px] font-bold text-gray-900 text-right">{rupee(Number(r.disbursal || 0))}</td>
                                                <td className="px-5 py-3 text-[14px] font-bold text-[#EF4444] text-right">{rupee(Number(r.drop || 0))}</td>
                                                <td className="px-5 py-3 text-[14px] font-bold text-[#06B6D4] text-right">{rupee(Number(r.cashback || 0))}</td>
                                                {canAddRow && (
                                                    <td className="px-5 py-3 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => openEdit(r)} className="w-8 h-8 rounded-full bg-[#E0E7FF] hover:bg-[#c7d2fe] flex items-center justify-center transition"><Pencil className="w-4 h-4 text-[#666CFF]" /></button>
                                                            {isAdmin && <button onClick={() => onDelete(r._id)} className="w-8 h-8 rounded-full bg-[#FEE2E2] hover:bg-[#fecaca] flex items-center justify-center transition"><Trash2 className="w-4 h-4 text-[#EF4444]" /></button>}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Same Add/Edit form + Modals below */}
            <Dialog open={formOpen} onOpenChange={(o) => { if (!formSaving) { setFormOpen(o); if (!o) resetForm(); } }}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>{editingId ? 'Edit Performance' : 'Add Performance'}</DialogTitle></DialogHeader>
                    {/* ... omitted for brevity but keeping original structure */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                        <div className="space-y-1.5"><Label>Employee Name *</Label><Input value={form.employee_name} onChange={(e) => setForm((p) => ({ ...p, employee_name: e.target.value }))} /></div>
                        <div className="space-y-1.5"><Label>Code (optional)</Label><Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} /></div>
                        <div className="space-y-1.5"><Label>Manager / TL *</Label><Input value={form.manager_tl} onChange={(e) => setForm((p) => ({ ...p, manager_tl: e.target.value }))} list="manager-options" /><datalist id="manager-options">{managerOptions.map((o) => <option key={o} value={o} />)}</datalist></div>
                        <div className="space-y-1.5"><Label>Total Logins</Label><Input type="number" value={form.total_logins} onChange={(e) => setForm((p) => ({ ...p, total_logins: e.target.value }))} /></div>
                        {['approval_lakh', 'disbursal_lakh', 'drop_lakh', 'cashback_lakh'].map((key) => <div key={key} className="space-y-1.5"><Label>{key.replace('_', ' ').toUpperCase()}</Label><Input value={(form as any)[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} /></div>)}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setFormOpen(false); resetForm(); }} disabled={formSaving}>Cancel</Button>
                        <Button onClick={onFormSubmit} disabled={formSaving}>{formSaving ? 'Saving…' : editingId ? 'Update Row' : 'Save Row'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
