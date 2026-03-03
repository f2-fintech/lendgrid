'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ArrowLeft, Download, Upload, Plus, Search, X, Eye, Pencil, Trash2,
    TrendingUp, CheckCircle, Trophy, Star, Users, Calendar, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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
        <div className={`relative rounded-2xl p-6 text-white overflow-hidden shadow-xl min-h-[140px] flex flex-col justify-between ${gradient}`}>
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />
            <div className="relative flex-1">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/25 flex items-center justify-center shadow-inner">
                        {icon}
                    </div>
                    <TrendingUp className="w-5 h-5 opacity-60" />
                </div>
                <p className="text-sm font-semibold opacity-90 mb-1.5 leading-tight">{label}</p>
                <p className="text-2xl font-black leading-tight tracking-tight">{value}</p>
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

    // Dialogs
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

    // derived
    const isAdmin = String(employee?.role) === '1';
    const isAsstOps = employee?.designation === 'Asst. Ops Manager';
    const canAddRow = isAdmin || isAsstOps;
    const canUpload = isAdmin || isAsstOps;

    // company_id from token
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
                } catch { /* */ }
            }
        }
        return '';
    }, []);

    // debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebounced(search.trim().toLowerCase()), 300);
        return () => clearTimeout(t);
    }, [search]);

    // fetch rows
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

            // fallback to latest date if no rows today
            if (!normalized.length && date === todayISO()) {
                try {
                    const dates = await perfUploadApi.dates(companyId);
                    const latestDate = dates?.[0]?.date;
                    if (latestDate && latestDate !== date) setDate(latestDate);
                } catch { /* */ }
            }
        } catch (e) {
            console.error(e);
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [date, companyId]);

    useEffect(() => { if (date) fetchList(); }, [date]); // eslint-disable-line

    // fetch team totals after rows load
    useEffect(() => {
        if (!rows.length || !companyId) return;
        perfUploadApi.teamTotals(companyId).then(setTeamTotals).catch(() => { });
    }, [rows, companyId]);

    // computed totals
    const totals = useMemo(() => {
        const sum = (k: string) => rows.reduce((a, r) => a + Number(r[k] || 0), 0);
        return {
            logins: sum('login'), approvals: sum('approval'), disbursal: sum('disbursal'),
            drop: sum('drop'), cashback: sum('cashback'),
            grossApproval: sum('gross_approval'), grossDisbursal: sum('gross_disbursal'), abnp: sum('abnp'),
        };
    }, [rows]);

    // star performers
    const starPerformers = useMemo(() => {
        if (!rows.length) return { approval: null as Row | null, disbursal: null as Row | null };
        return {
            approval: rows.reduce((best, r) => Number(r.approval) > Number(best?.approval || 0) ? r : best, rows[0]),
            disbursal: rows.reduce((best, r) => Number(r.disbursal) > Number(best?.disbursal || 0) ? r : best, rows[0]),
        };
    }, [rows]);

    // manager filter list from teamTotals
    const managerList = useMemo(() =>
        Object.entries(teamTotals).map(([code, info]) => ({
            code, name: info.teamName || code, role: info.role === 'manager' ? 'Manager' : 'Team Leader',
        })).sort((a, b) => a.role === 'Manager' ? -1 : 1),
        [teamTotals]);

    // filtered + sorted rows
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

    // manager autocomplete options
    const managerOptions = useMemo(() => {
        const s = new Set<string>();
        rows.forEach((r) => { if (r.manager_tl?.trim()) s.add(r.manager_tl.trim()); });
        return Array.from(s);
    }, [rows]);

    // ── Event Handlers ─────────────────────────────────────────────────────
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
        if (!form.employee_name.trim() || !form.manager_tl.trim()) {
            toast.error('Employee Name and Manager/TL are required'); return;
        }
        setFormSaving(true);
        const mul = amountUnit === 'lakhs' ? 100000 : 1;
        const payload = {
            date, employee_name: form.employee_name.trim(), code: form.code.trim() || undefined,
            manager_tl: form.manager_tl.trim(),
            total_logins: Number(form.total_logins || 0),
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
            setFormOpen(false);
            resetForm();
            await fetchList();
        } catch (err: any) {
            toast.error(err?.message || 'Failed to save');
        } finally {
            setFormSaving(false);
        }
    };

    const resetForm = () => {
        setForm({ employee_name: '', manager_tl: '', code: '', total_logins: '', approval_lakh: '', disbursal_lakh: '', drop_lakh: '', cashback_lakh: '' });
        setAmountUnit('rupees'); setEditingId(null);
    };

    const openEdit = (r: Row) => {
        setEditingId(r._id);
        setDate(r.date || date);
        setForm({
            employee_name: r.employee_name || '', manager_tl: r.manager_tl || '', code: r.code || '',
            total_logins: String(r.login || 0),
            approval_lakh: r.approval ? Number(r.approval).toLocaleString('en-IN') : '',
            disbursal_lakh: r.disbursal ? Number(r.disbursal).toLocaleString('en-IN') : '',
            drop_lakh: r.drop ? Number(r.drop).toLocaleString('en-IN') : '',
            cashback_lakh: r.cashback ? Number(r.cashback).toLocaleString('en-IN') : '',
        });
        setAmountUnit('rupees');
        setFormOpen(true);
    };

    const fetchTeamBreakdown = async (managerName: string) => {
        setTeamBreakdownLoading(true); setTeamModalOpen(true);
        try {
            const data = await perfUploadApi.teamBreakdown(managerName, companyId);
            setTeamBreakdown(data);
        } catch { setTeamBreakdown(null); }
        finally { setTeamBreakdownLoading(false); }
    };

    const exportCSV = () => {
        const header = ['S.No.', 'Date', 'Employee', 'Code', 'Manager/TL', 'Logins', 'Approval', 'Disbursal', 'Drop', 'Cashback'];
        const body = sortedRows.map((r, i) => [
            i + 1, r.date || '', r.employee_name || '', r.code || '', r.manager_tl || '',
            r.login || 0, r.approval || 0, r.disbursal || 0, r.drop || 0, r.cashback || 0,
        ]);
        const csv = [header, ...body].map((r) => r.join(',')).join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        a.download = `performance_${date}.csv`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    if (authLoading) return (
        <div className="p-8 space-y-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-64 w-full" />
        </div>
    );

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-sky-50 to-indigo-50 py-6 px-4 md:px-8">
            <div className="max-w-screen-xl mx-auto space-y-6">

                {/* ── Header Card ── */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6">
                    {/* Title row */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.back()}
                                className="w-10 h-10 rounded-xl bg-indigo-100 hover:bg-indigo-200 flex items-center justify-center transition-all"
                            >
                                <ArrowLeft className="w-5 h-5 text-indigo-700" />
                            </button>
                            <div>
                                <h1 className="text-xl font-extrabold text-slate-900">Performance Uploads</h1>
                                <p className="text-sm text-slate-500 mt-0.5">Daily login, approval &amp; disbursal tracking panel</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-2xl gap-1.5 border border-gray-200 bg-transparent hover:bg-gray-100"
                                onClick={exportCSV}
                            >
                                <Download className="w-4 h-4" /> Export
                            </Button>
                            {canAddRow && (
                                <>
                                    <Button size="sm" className="bg-primary gap-1.5 rounded-xl py-4 text-md text-white hover:opacity-90 shadow-2xl transition-all"
                                        onClick={() => { resetForm(); setFormOpen(true); }}>
                                        <Calendar className="w-4 h-4" /> Add Row
                                    </Button>
                                    <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onUpload} />
                                    {canUpload && (
                                        <Button size="sm" className="rounded-xl gap-1.5 text-white text-md bg-orange-500 hover:bg-orange-600 shadow-2xl transition-all"
                                            onClick={() => fileRef.current?.click()} disabled={uploading}>
                                            <Upload className="w-4 h-4" /> {uploading ? 'Uploading…' : 'Upload'}
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Filters row */}
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        {/* Search */}
                        <div className="relative flex-1 min-w-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                className="pl-9 pr-9 rounded-xl"
                                placeholder="Search employee / id / code..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            {search && (
                                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                                    onClick={() => { setSearch(''); setDebounced(''); }}>
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Date */}
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                            className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 min-w-[160px]" />

                        {/* Filter by Manager */}
                        <Select value={managerFilter} onValueChange={setManagerFilter}>
                            <SelectTrigger className="w-56 rounded-xl">
                                <SelectValue placeholder="Filter by Manager/TL" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Employees</SelectItem>
                                {managerList.map((m) => (
                                    <SelectItem key={m.code} value={m.code}>
                                        <span className={`inline-block text-xs px-1.5 py-0.5 rounded mr-1 font-semibold ${m.role === 'Manager' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{m.role}</span>
                                        {m.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Sort */}
                        <Select value={sortKey || 'none'} onValueChange={(v) => {
                            if (v === 'none' || !v) { setSortKey(null); return; }
                            setSortDir(sortKey === v ? (sortDir === 'asc' ? 'desc' : 'asc') : 'desc');
                            setSortKey(v as SortKey);
                        }}>
                            <SelectTrigger className="w-40 rounded-xl">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="login">Logins</SelectItem>
                                <SelectItem value="approval">Approvals</SelectItem>
                                <SelectItem value="disbursal">Disbursals</SelectItem>
                            </SelectContent>
                        </Select>
                        {sortKey && (
                            <Button variant="outline" size="sm" className="rounded-full"
                                onClick={() => setSortDir((d) => d === 'asc' ? 'desc' : 'asc')}>
                                {sortDir === 'asc' ? '↑ Asc' : '↓ Desc'}
                            </Button>
                        )}
                    </div>
                </div>

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Total Logins" value={totals.logins.toLocaleString('en-IN')}
                        gradient="bg-gradient-to-br from-orange-400 to-orange-600"
                        icon={<CheckCircle className="w-6 h-6" />} />
                    <StatCard label="Total Gross Approval" value={rupee(totals.grossApproval)}
                        gradient="bg-gradient-to-br from-indigo-500 to-indigo-700"
                        icon={<span className="text-xl font-bold">₹</span>} />
                    <StatCard label="Total Net Approval" value={rupee(totals.approvals)}
                        gradient="bg-gradient-to-br from-yellow-400 to-yellow-600"
                        icon={<Trophy className="w-6 h-6" />} />
                    <StatCard label="Total Gross Disbursal" value={rupee(totals.grossDisbursal)}
                        gradient="bg-gradient-to-br from-violet-500 to-violet-700"
                        icon={<span className="text-xl font-bold">₹</span>} />
                    <StatCard label="Total Net Disbursal" value={rupee(totals.disbursal)}
                        gradient="bg-gradient-to-br from-green-500 to-green-700"
                        icon={<Star className="w-6 h-6" />} />
                    <StatCard label="Total ABND" value={rupee(totals.abnp)}
                        gradient="bg-gradient-to-br from-slate-700 to-slate-900"
                        icon={<span className="text-xl font-bold">Δ</span>} />
                    <StatCard label="Total Drop" value={rupee(totals.drop)}
                        gradient="bg-gradient-to-br from-red-500 to-red-700"
                        icon={<span className="text-xl">↓</span>} />
                    <StatCard label="Total Cashback" value={rupee(totals.cashback)}
                        gradient="bg-gradient-to-br from-cyan-500 to-cyan-700"
                        icon={<span className="text-xl">₹</span>} />
                </div>

                {/* ── Star Performers ── */}
                {(starPerformers.approval || starPerformers.disbursal) && (
                    <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                <Trophy className="w-5 h-5 text-orange-500" />
                            </div>
                            <h2 className="text-lg font-extrabold text-slate-900">Star Performers</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {starPerformers.approval && (
                                <div className="relative overflow-hidden rounded-2xl bg-sky-50 border border-sky-100 p-5">
                                    <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-green-200/50" />
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <Trophy className="w-4 h-4 text-green-700" />
                                        <span className="text-sm font-semibold text-green-700">Top Approval</span>
                                    </div>
                                    <p className="text-base font-extrabold text-slate-900">{starPerformers.approval.employee_name || '—'}</p>
                                    <p className="text-2xl font-extrabold text-green-600 mt-1">{rupee(Number(starPerformers.approval.approval || 0))}</p>
                                </div>
                            )}
                            {starPerformers.disbursal && (
                                <div className="relative overflow-hidden rounded-2xl bg-indigo-50 border border-indigo-100 p-5">
                                    <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-indigo-200/50" />
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <Star className="w-4 h-4 text-indigo-700" />
                                        <span className="text-sm font-semibold text-indigo-700">Top Disbursal</span>
                                    </div>
                                    <p className="text-base font-extrabold text-slate-900">{starPerformers.disbursal.employee_name || '—'}</p>
                                    <p className="text-2xl font-extrabold text-indigo-600 mt-1">{rupee(Number(starPerformers.disbursal.disbursal || 0))}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Data Table ── */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                    {loading ? (
                        <div className="p-6 space-y-3">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : sortedRows.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto mb-3 flex items-center justify-center">
                                <Search className="w-7 h-7 text-slate-400" />
                            </div>
                            <h3 className="font-extrabold text-slate-900 text-lg">No records found</h3>
                            <p className="text-slate-500 text-sm mt-1">
                                {search ? `No results for "${search}"` : 'No data available for selected date'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-50 to-blue-50 text-slate-700">
                                        <th className="px-4 py-3 text-left font-bold">S.No.</th>
                                        <th className="px-4 py-3 text-left font-bold">Date</th>
                                        <th className="px-4 py-3 text-left font-bold">Employee</th>
                                        <th className="px-4 py-3 text-left font-bold">Code</th>
                                        <th className="px-4 py-3 text-left font-bold">Manager / TL</th>
                                        <th className="px-4 py-3 text-right font-bold">Logins</th>
                                        <th className="px-4 py-3 text-right font-bold">Approvals (₹)</th>
                                        <th className="px-4 py-3 text-right font-bold">Disbursal (₹)</th>
                                        <th className="px-4 py-3 text-right font-bold">Drop (₹)</th>
                                        <th className="px-4 py-3 text-right font-bold">Cashback (₹)</th>
                                        <th className="px-4 py-3 text-right font-bold">Gross Approval (₹)</th>
                                        <th className="px-4 py-3 text-right font-bold">Gross Disbursal (₹)</th>
                                        <th className="px-4 py-3 text-center font-bold">Team</th>
                                        {canAddRow && <th className="px-4 py-3 text-right font-bold">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {sortedRows.map((r, idx) => {
                                        const hasData = Number(r.login || 0) > 0 || Number(r.approval || 0) > 0 || Number(r.disbursal || 0) > 0;
                                        const teamInfo = r.code ? teamTotals[r.code] : null;
                                        return (
                                            <tr key={r._id}
                                                className={`hover:bg-slate-50 transition-colors ${hasData ? 'bg-gradient-to-r from-green-50/60 to-transparent' : ''}`}>
                                                <td className="px-4 py-3 font-bold text-slate-900">{idx + 1}</td>
                                                <td className="px-4 py-3 text-slate-500">{fmtDate(r.date)}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-bold text-purple-700">{r.employee_name || '—'}</span>
                                                        {Number(r.drop || 0) > 0 && (
                                                            <span title={`Drop: ${rupee(r.drop!)}`} className="text-rose-600 cursor-pointer">★</span>
                                                        )}
                                                        {Number(r.cashback || 0) > 0 && (
                                                            <span title={`Cashback: ${rupee(r.cashback!)}`} className="text-blue-700 cursor-pointer font-bold">#</span>
                                                        )}
                                                        {teamInfo && (
                                                            <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${teamInfo.role === 'manager' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                                                {teamInfo.role === 'manager' ? 'Manager' : 'TL'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {r.employee_id && <div className="text-xs text-slate-400">{r.employee_id}</div>}
                                                </td>
                                                <td className="px-4 py-3 text-slate-500">{r.code || '—'}</td>
                                                <td className="px-4 py-3">
                                                    {r.manager_tl ? (
                                                        <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-1 rounded-full">{r.manager_tl}</span>
                                                    ) : <span className="text-slate-400">—</span>}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded">{Number(r.login || 0)}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded">{rupee(Number(r.approval || 0))}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="text-xs bg-violet-100 text-violet-700 font-bold px-2 py-0.5 rounded">{rupee(Number(r.disbursal || 0))}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="text-xs bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded">{rupee(Number(r.drop || 0))}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="text-xs bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded">{rupee(Number(r.cashback || 0))}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="text-xs bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded">{rupee(Number(r.gross_approval || 0))}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="text-xs bg-violet-50 text-violet-600 font-bold px-2 py-0.5 rounded">{rupee(Number(r.gross_disbursal || 0))}</span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {teamInfo ? (
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className="text-xs text-slate-500 flex items-center gap-0.5">
                                                                <Users className="w-3 h-3" />{teamInfo.memberCount}
                                                            </span>
                                                            <button
                                                                onClick={() => fetchTeamBreakdown(teamInfo.teamName || r.code || '')}
                                                                className="w-7 h-7 rounded-lg bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center transition">
                                                                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                                            </button>
                                                        </div>
                                                    ) : <span className="text-slate-300">—</span>}
                                                </td>
                                                {canAddRow && (
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <button onClick={() => openEdit(r)}
                                                                className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition">
                                                                <Pencil className="w-3.5 h-3.5 text-blue-600" />
                                                            </button>
                                                            {isAdmin && (
                                                                <button onClick={() => onDelete(r._id)}
                                                                    className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition">
                                                                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                                                </button>
                                                            )}
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

            {/* ── Team Breakdown Modal ── */}
            <Dialog open={teamModalOpen} onOpenChange={(o) => { setTeamModalOpen(o); if (!o) setTeamBreakdown(null); }}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-600" /> Team Performance Breakdown
                        </DialogTitle>
                    </DialogHeader>
                    {teamBreakdownLoading ? (
                        <div className="space-y-3 p-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-32 w-full" /></div>
                    ) : teamBreakdown ? (
                        <div className="space-y-4">
                            {/* Summary */}
                            <div className="bg-slate-50 rounded-xl p-4">
                                <p className="text-lg font-bold text-slate-900">{teamBreakdown.employee?.name || teamBreakdown.team?.name}</p>
                                <p className="text-sm text-slate-500">{teamBreakdown.employee?.designation}</p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { label: 'Members', value: teamBreakdown.totals?.memberCount || 0, color: 'bg-green-100 text-green-700' },
                                    { label: 'Total Logins', value: teamBreakdown.totals?.totalLogins?.toLocaleString('en-IN') || 0, color: 'bg-blue-100 text-blue-700' },
                                    { label: 'Total Approval', value: rupee(teamBreakdown.totals?.totalApproval || 0), color: 'bg-violet-100 text-violet-700' },
                                    { label: 'Total Disbursal', value: rupee(teamBreakdown.totals?.totalDisbursal || 0), color: 'bg-green-100 text-green-700' },
                                ].map((s) => (
                                    <div key={s.label} className={`rounded-xl p-3 text-center ${s.color}`}>
                                        <p className="text-xs font-semibold">{s.label}</p>
                                        <p className="text-lg font-extrabold">{s.value}</p>
                                    </div>
                                ))}
                            </div>
                            {/* Member table */}
                            <div className="overflow-x-auto rounded-xl border border-slate-100">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-600">
                                            <th className="px-3 py-2 text-left font-bold">Employee</th>
                                            <th className="px-3 py-2 text-left font-bold">Code</th>
                                            <th className="px-3 py-2 text-right font-bold">Logins</th>
                                            <th className="px-3 py-2 text-right font-bold">Approval</th>
                                            <th className="px-3 py-2 text-right font-bold">Disbursal</th>
                                            <th className="px-3 py-2 text-right font-bold">Drop</th>
                                            <th className="px-3 py-2 text-right font-bold">Cashback</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {(teamBreakdown.memberBreakdown || []).map((m: any, i: number) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="px-3 py-2 font-semibold text-slate-800">{m.name}</td>
                                                <td className="px-3 py-2 text-slate-500">{m.code}</td>
                                                <td className="px-3 py-2 text-right"><span className="bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded">{m.logins || 0}</span></td>
                                                <td className="px-3 py-2 text-right"><span className="bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">{rupee(m.approval || 0)}</span></td>
                                                <td className="px-3 py-2 text-right"><span className="bg-violet-100 text-violet-700 font-bold px-1.5 py-0.5 rounded">{rupee(m.disbursal || 0)}</span></td>
                                                <td className="px-3 py-2 text-right"><span className="bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded">{rupee(m.drop || 0)}</span></td>
                                                <td className="px-3 py-2 text-right"><span className="bg-cyan-100 text-cyan-700 font-bold px-1.5 py-0.5 rounded">{rupee(m.cashback || 0)}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-slate-500 py-6">No data available</p>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTeamModalOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Add / Edit Dialog ── */}
            <Dialog open={formOpen} onOpenChange={(o) => { if (!formSaving) { setFormOpen(o); if (!o) resetForm(); } }}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Edit Performance' : 'Add Performance'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                        <div className="space-y-1.5">
                            <Label>Employee Name *</Label>
                            <Input value={form.employee_name} onChange={(e) => setForm((p) => ({ ...p, employee_name: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Code (optional)</Label>
                            <Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Manager / TL *</Label>
                            <Input value={form.manager_tl} onChange={(e) => setForm((p) => ({ ...p, manager_tl: e.target.value }))}
                                list="manager-options" />
                            <datalist id="manager-options">
                                {managerOptions.map((o) => <option key={o} value={o} />)}
                            </datalist>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Total Logins</Label>
                            <Input type="number" value={form.total_logins} onChange={(e) => setForm((p) => ({ ...p, total_logins: e.target.value }))} />
                        </div>

                        {/* Amount unit toggle */}
                        <div className="col-span-full flex items-center gap-3">
                            <Label className="text-sm text-slate-600">Amount in:</Label>
                            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                                {(['rupees', 'lakhs'] as const).map((u) => (
                                    <button key={u} onClick={() => setAmountUnit(u)}
                                        className={`px-3 py-1.5 text-sm font-medium transition ${amountUnit === u ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                                        {u === 'rupees' ? 'Rupees (₹)' : 'Lakhs (₹L)'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {[
                            { key: 'approval_lakh', label: `Approval (${amountUnit === 'rupees' ? '₹ Rupees' : '₹ Lakhs'})` },
                            { key: 'disbursal_lakh', label: `Disbursal (${amountUnit === 'rupees' ? '₹ Rupees' : '₹ Lakhs'})` },
                            { key: 'drop_lakh', label: `Drop Amount (${amountUnit === 'rupees' ? '₹ Rupees' : '₹ Lakhs'})` },
                            { key: 'cashback_lakh', label: `Cashback Amount (${amountUnit === 'rupees' ? '₹ Rupees' : '₹ Lakhs'})` },
                        ].map(({ key, label }) => (
                            <div key={key} className="space-y-1.5">
                                <Label>{label}</Label>
                                <Input
                                    value={(form as any)[key]}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        if (/^[0-9,]*$/.test(v) || v === '') setForm((p) => ({ ...p, [key]: v }));
                                    }}
                                    onBlur={() => {
                                        const raw = ((form as any)[key] || '').replace(/,/g, '');
                                        if (raw && !isNaN(Number(raw))) setForm((p) => ({ ...p, [key]: Number(raw).toLocaleString('en-IN') }));
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setFormOpen(false); resetForm(); }} disabled={formSaving}>Cancel</Button>
                        <Button onClick={onFormSubmit} disabled={formSaving}>
                            {formSaving ? 'Saving…' : editingId ? 'Update Row' : 'Save Row'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
