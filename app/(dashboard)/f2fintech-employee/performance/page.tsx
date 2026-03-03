'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    Download,
    Eye,
    X,
    ChevronLeft,
    ChevronRight,
    Calendar,
    TrendingUp,
    Hourglass,
    AlertCircle,
} from 'lucide-react';
import { useEmployeeAuth } from '@/lib/employee-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { perfApi } from '@/lib/performance-api';

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

// ─── StatRow inside card (plain text like screenshot) ─────────────────────────
function StatLine({ label, value }: { label: string; value: number }) {
    return (
        <p className="text-sm leading-6">
            <span className="text-gray-700 font-medium">{label}: </span>
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

    // Comparison rows: label, morning val, evening val
    const compRows = [
        { label: 'Connected Calls', morning: morningPhone, evening: eveningPhone },
        { label: 'Login', morning: morningLogin, evening: eveningLogin },
        { label: 'Approval (₹)', morning: morningApproval, evening: eveningApproval },
        { label: 'Disbursal (₹)', morning: morningDisbursal, evening: eveningDisbursal },
    ];

    const borderAccent = role === 'manager' ? 'border-l-indigo-500' : 'border-l-orange-400';

    const dateLabel = doc.date
        ? new Date(doc.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';

    return (
        <div className={`relative bg-white border border-gray-200 ${borderAccent} border-l-4 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200`}
            style={{ background: 'radial-gradient(circle at -10% -20%, rgba(99,102,241,0.07) 0, transparent 50%), linear-gradient(180deg,#ffffff 0%,#f7f8ff 100%)' }}>

            {/* ── Header: avatar + name/designation + code ── */}
            <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-shrink-0">
                    <div className="absolute inset-[-4px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(129,140,248,0.35) 0, transparent 60%)' }} />
                    <Avatar className="relative w-12 h-12 border-2 border-white shadow-md">
                        <AvatarImage src={emp?.image || ''} alt={fullName} />
                        <AvatarFallback className="text-sm font-bold bg-indigo-100 text-indigo-700">{initials}</AvatarFallback>
                    </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-black text-gray-900 leading-tight truncate">{fullName}</p>
                    <p className="text-xs text-gray-500 font-semibold truncate">{designation}</p>
                </div>
                {emp?.code && (
                    <span className="text-xs font-mono text-gray-600 border border-gray-300 rounded-full px-3 py-0.5 flex-shrink-0">
                        Code: {emp.code}
                    </span>
                )}
            </div>

            {/* ── Morning & Evening side-by-side boxes ── */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Morning */}
                <div className="rounded-xl border border-gray-200 p-3" style={{ background: 'linear-gradient(135deg,#f9fafb 0%,#eff6ff 100%)' }}>
                    <div className="flex items-center gap-1.5 mb-2">
                        <Hourglass className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-[11px] font-extrabold uppercase tracking-wide text-gray-700">Morning Commitment</span>
                    </div>
                    <StatLine label="Total Connected Calls" value={morningPhone} />
                    <StatLine label="Physical Meetings" value={morningPhysical} />
                    <StatLine label="Login" value={morningLogin} />
                    <StatLine label="Approval" value={morningApproval} />
                    <StatLine label="Disbursal" value={morningDisbursal} />
                </div>

                {/* Evening */}
                <div className="rounded-xl border border-gray-200 p-3" style={{ background: 'linear-gradient(135deg,#f9fafb 0%,#ecfdf3 100%)' }}>
                    <div className="flex items-center gap-1.5 mb-2">
                        <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-[11px] font-extrabold uppercase tracking-wide text-gray-700">Evening Delivery</span>
                    </div>
                    <StatLine label="Total Connected Calls" value={eveningPhone} />
                    <StatLine label="Physical Meetings" value={eveningPhysical} />
                    <StatLine label="Login" value={eveningLogin} />
                    <StatLine label="Approval" value={eveningApproval} />
                    <StatLine label="Disbursal" value={eveningDisbursal} />
                </div>
            </div>

            {/* ── Manager-only: Top Performers ── */}
            {role === 'manager' && (mgrEven?.topApprovalPerformer?.name || mgrEven?.topDisbursalPerformer?.name || mgrEven?.topPerformer?.name) && (
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                    {(mgrEven?.topApprovalPerformer?.name || mgrEven?.topDisbursalPerformer?.name) && (
                        <p className="text-[11px] font-extrabold text-gray-800 mb-2">Top Performers</p>
                    )}
                    <div className="space-y-1.5">
                        {mgrEven?.topApprovalPerformer?.name && (
                            <div className="p-2 bg-white border border-gray-200 rounded-lg">
                                <p className="text-[11px] font-bold text-gray-600">Approval Performer:</p>
                                <p className="text-sm font-semibold text-gray-900">{mgrEven.topApprovalPerformer.name} • ₹{asNum(mgrEven.topApprovalPerformer.valueLacs)} L</p>
                            </div>
                        )}
                        {mgrEven?.topDisbursalPerformer?.name && (
                            <div className="p-2 bg-white border border-gray-200 rounded-lg">
                                <p className="text-[11px] font-bold text-gray-600">Disbursal Performer:</p>
                                <p className="text-sm font-semibold text-gray-900">{mgrEven.topDisbursalPerformer.name} • ₹{asNum(mgrEven.topDisbursalPerformer.valueLacs)} L</p>
                            </div>
                        )}
                        {mgrEven?.topPerformer?.name && (
                            <div className="p-2 bg-white border border-gray-200 rounded-lg">
                                <p className="text-[11px] font-extrabold text-indigo-700">⭐ Top Performers</p>
                                <p className="text-[15px] font-bold text-indigo-700">{mgrEven.topPerformer.name}</p>
                            </div>
                        )}
                        {mgrEven?.filesStuckDescription && (
                            <div className="p-2 bg-white border border-gray-200 rounded-lg flex items-center gap-2">
                                <span className="text-[11px] font-bold text-gray-700">Files Stuck Reason:</span>
                                <span className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{mgrEven.filesStuckDescription}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Till Date Snapshot ── */}
            <div className="mb-4 p-3 rounded-xl border border-gray-200" style={{ background: 'linear-gradient(180deg,#ffffff 0%,#fafbff 100%)', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                <p className="text-[11px] font-black uppercase tracking-wide text-gray-800 mb-3">Till Date — Snapshot</p>
                <div className="grid grid-cols-3 gap-2">
                    <div>
                        <p className="text-xs text-gray-500 mb-0.5">Login</p>
                        <p className="text-xl font-extrabold text-gray-900">{fmt(tillLogin)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 mb-0.5">Approval (₹)</p>
                        <p className="text-xl font-extrabold text-gray-900">₹{fmt(tillApproval)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 mb-0.5">Disbursal (₹)</p>
                        <p className="text-xl font-extrabold text-gray-900">₹{fmt(tillDisbursal)}</p>
                    </div>
                </div>
            </div>

            {/* ── Morning vs Evening comparison grid ── */}
            <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-[11px] font-extrabold text-gray-700 mb-2 uppercase tracking-wide">
                    Morning vs Evening – Calls / Login / Approval / Disbursal
                </p>
                <div className="space-y-1.5">
                    {compRows.map((row) => {
                        const m = Number(row.morning || 0);
                        const e = Number(row.evening || 0);
                        const progress = m === 0 ? (e > 0 ? 100 : 0) : Math.round((e / m) * 100);
                        let pctColor = '#6b7280';
                        let arrow = '→';
                        if (progress > 100) { pctColor = '#059669'; arrow = '↑'; }
                        else if (progress < 100) { pctColor = '#dc2626'; arrow = '↓'; }
                        return (
                            <div key={row.label} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg flex-wrap">
                                <span className="text-[11px] font-extrabold text-gray-800 min-w-[100px] flex-shrink-0">{row.label}</span>
                                <span className="inline-flex items-center text-[11px] border border-gray-300 rounded-full px-2 py-0.5 bg-white">Mrng: {fmt(m)}</span>
                                <span className="inline-flex items-center text-[11px] border border-green-400 text-green-700 rounded-full px-2 py-0.5 bg-green-50">Eve: {fmt(e)}</span>
                                <span className="text-[11px] font-black ml-auto" style={{ color: pctColor }}>{arrow} {progress}% Achieved</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Footer: date + buttons ── */}
            <div className="flex items-center justify-between border-t border-gray-200 pt-3 mt-1">
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 border border-gray-300 rounded-full px-3 py-1 font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    {dateLabel}
                </span>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-full text-xs font-semibold h-8 px-4"
                        onClick={() => onDetails(doc)}>Details</Button>
                    <Button size="sm" className="rounded-full text-xs font-bold h-8 px-4 bg-blue-500 hover:bg-blue-600 text-white">
                        Edit
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Details Drawer ───────────────────────────────────────────────────────────
type Pair = { key: string; label: string; planned: number; done: number; unit: 'count' | 'rupee' };
const prettyNum = (n: number, unit: 'rupee' | 'count') => unit === 'rupee' ? rupee(n) : `${n || 0}`;

function buildPairs(doc: SnapshotDoc): Pair[] {
    if (doc.role === 'employee') {
        const m = doc.re?.morning || ({} as any);
        const e = doc.re?.evening || ({} as any);
        return [
            { key: 'phone', label: 'Phone Connects', planned: asNum(m.phoneConnects), done: asNum(e.phoneConnectsDone), unit: 'count' },
            { key: 'meet', label: 'Physical Meets', planned: asNum(m.physicalMeet), done: asNum(e.physicalMeetDone), unit: 'count' },
            { key: 'login', label: 'Logins', planned: asNum(m.expectedLogins), done: asNum(e.loginsDone), unit: 'count' },
            { key: 'appr', label: 'Approvals (₹)', planned: asNum(m.expectedApprovals), done: asNum(e.approvalsDone), unit: 'rupee' },
            { key: 'disb', label: 'Disbursals (₹)', planned: asNum(m.expectedDisbursal), done: asNum(e.disbursalDone), unit: 'rupee' },
        ];
    }
    const m = doc.manager?.morning || ({} as any);
    const e = doc.manager?.evening || ({} as any);
    const exp = m?.expected || {};
    const own = m?.ownContribution || {};
    return [
        { key: 'logins', label: 'Team Logins', planned: asNum(exp.loginsTeam) + asNum(own.login), done: asNum(e.teamLoginsDone), unit: 'count' },
        { key: 'appr', label: 'Team Approvals (₹)', planned: asNum(exp.approvalLacs) + asNum(own.approvalLacs), done: asNum(e.teamApprovalDoneAmount), unit: 'rupee' },
        { key: 'disb', label: 'Team Disbursal (₹)', planned: asNum(exp.disbursalAmount) + asNum(own.disbursalLacs), done: asNum((e as any).teamDisbursalDoneAmount ?? 0), unit: 'rupee' },
    ];
}

function DetailsDrawer({ doc, onClose }: { doc: SnapshotDoc | null; onClose: () => void }) {
    if (!doc) return null;
    const role = doc.role;
    const emp = doc.employee;
    const pairs = buildPairs(doc);
    const totals = pairs.reduce((acc, p) => ({ planned: acc.planned + p.planned, done: acc.done + p.done }), { planned: 0, done: 0 });
    const fullName = `${emp?.first_name || ''} ${emp?.last_name || ''}`.trim() || '—';
    const initials = fullName.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
    const mgrEven = doc.manager?.evening || ({} as any);
    const sentimentMap: Record<string, string> = { green: 'bg-green-500', yellow: 'bg-amber-400', red: 'bg-red-500' };

    return (
        <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/40" onClick={onClose} />
            <div className="w-full sm:w-[520px] bg-white border-l border-gray-200 overflow-y-auto shadow-2xl animate-in slide-in-from-right">
                {/* Header band */}
                <div className={`p-5 relative overflow-hidden ${role === 'manager' ? '' : ''}`}
                    style={{ background: role === 'manager' ? 'linear-gradient(135deg,#1E3368 0%,#6E8EF5 100%)' : 'linear-gradient(135deg,#0EA5E9 0%,#22C55E 100%)' }}>
                    <Button variant="ghost" size="icon" className="absolute top-3 right-3 text-white/80 hover:text-white hover:bg-white/10 h-8 w-8" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-11 w-11 ring-2 ring-white/40">
                            <AvatarImage src={emp?.image || ''} alt={fullName} />
                            <AvatarFallback className="bg-white/20 text-white font-bold">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="font-black text-white text-base">{role === 'manager' ? 'Manager Snapshot' : 'Employee Snapshot'}</p>
                            <p className="text-white/80 text-sm truncate">{fullName} • {doc.date}</p>
                        </div>
                        <span className="text-xs border border-white/40 text-white rounded-full px-2.5 py-0.5 capitalize">{role}</span>
                    </div>
                </div>

                <div className="p-5 space-y-6">
                    {/* Comparison */}
                    <div>
                        <p className="text-[11px] font-extrabold uppercase tracking-widest text-gray-500 mb-1">Comparison — Morning vs Evening</p>
                        <hr className="mb-3" />
                        <div className="space-y-3">
                            {pairs.map((pair) => {
                                const progress = pct(pair.planned, pair.done);
                                const pending = Math.max(pair.planned - pair.done, 0);
                                return (
                                    <div key={pair.key} className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-gray-900">{pair.label}</span>
                                            <span className={`text-xs font-semibold ${progress >= 100 ? 'text-green-600' : progress >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{progress}%</span>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Commitment: <b>{prettyNum(pair.planned, pair.unit)}</b>
                                            {' '}• Delivery: <b>{prettyNum(pair.done, pair.unit)}</b>
                                            {' '}• Pending: <b>{prettyNum(pending, pair.unit)}</b>
                                        </p>
                                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${progress >= 100 ? 'bg-green-500' : progress >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(progress, 100)}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Summary */}
                    <div>
                        <p className="text-[11px] font-extrabold uppercase tracking-widest text-gray-500 mb-1">Summary (Selected Date)</p>
                        <hr className="mb-3" />
                        <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-4 border border-gray-200">
                            <div><p className="text-xs text-gray-500">Total Planned</p><p className="text-lg font-black text-gray-900">{fmt(totals.planned)}</p></div>
                            <div><p className="text-xs text-gray-500">Total Done</p><p className="text-lg font-black text-gray-900">{fmt(totals.done)}</p></div>
                            <div className="col-span-2">
                                <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(pct(totals.planned, totals.done), 100)}%` }} />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{pct(totals.planned, totals.done)}% achieved for this date</p>
                            </div>
                        </div>
                    </div>

                    {/* Manager extras */}
                    {role === 'manager' && (
                        <div>
                            <p className="text-[11px] font-extrabold uppercase tracking-widest text-gray-500 mb-1">Manager Details</p>
                            <hr className="mb-3" />
                            <div className="space-y-2 text-sm">
                                {mgrEven?.overallSentiment && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500">Overall Sentiment</span>
                                        <span className="flex items-center gap-1.5 font-semibold capitalize">
                                            <span className={`w-2.5 h-2.5 rounded-full ${sentimentMap[mgrEven.overallSentiment] ?? 'bg-gray-400'}`} />
                                            {mgrEven.overallSentiment}
                                        </span>
                                    </div>
                                )}
                                {mgrEven?.sentimentReason && <p className="text-xs text-gray-500 bg-gray-50 rounded p-2">{mgrEven.sentimentReason}</p>}
                                {mgrEven?.supportRequired && (
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">Support Required</p>
                                        <p className="text-xs bg-amber-50 text-amber-800 rounded p-2 mt-1">{mgrEven.supportRequired}</p>
                                    </div>
                                )}
                                {mgrEven?.filesStuckDescription && (
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">Files Stuck</p>
                                        <p className="text-xs bg-red-50 text-red-800 rounded p-2 mt-1">{mgrEven.filesStuckDescription}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Missing Upload Modal ─────────────────────────────────────────────────────
const ALLOWED_DESIGNATIONS = [
    'Relationship Executive', 'Relationship Manager', 'Asst. Team Leader', 'Team Leader',
    'Branch Manager', 'Area Head', 'Manager', 'Senior Team Leader',
    'Channel Partnership & Operations Executive', 'Sales Manager',
    'Financial Sales Intern', 'Growth Manager', 'Assistant Growth Manager',
];

function MissingModal({ open, onClose, pickDate }: { open: boolean; onClose: () => void; pickDate: string }) {
    const [data, setData] = useState<any>(null);
    const [missingList, setMissingList] = useState<any[]>([]);
    const [submittedCount, setSubmittedCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [keyword, setKeyword] = useState('');

    const fetchMissing = useCallback(async (kw = '') => {
        setLoading(true);
        try {
            const res = await perfApi.missingList({ date: pickDate, keyword: kw });
            // lendgrid-server returns: { employees, totalEmployees, missingCount, uploadedCount }
            const raw: any[] = res?.employees || res?.missingEmployees || [];
            setSubmittedCount(res?.uploadedCount || res?.submittedCount || 0);
            setData(res);
            setMissingList(raw);
        } catch {
            setMissingList([]);
        } finally {
            setLoading(false);
        }
    }, [pickDate]);

    useEffect(() => {
        if (open) { setKeyword(''); fetchMissing(''); }
    }, [open, fetchMissing]);

    if (!open) return null;

    const filtered = missingList.filter(e => ALLOWED_DESIGNATIONS.includes(e.designation || ''));
    const displayed = keyword.trim()
        ? filtered.filter(e => {
            const name = (e.name || '').toLowerCase();
            const code = (e.code || '').toLowerCase();
            const kw = keyword.toLowerCase();
            return name.includes(kw) || code.includes(kw);
        })
        : filtered;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="p-5 border-b border-gray-200">
                    <h2 className="text-base font-black text-gray-900">Missing Performance – {pickDate}</h2>
                </div>

                {/* Search */}
                <div className="px-5 pt-4 pb-2">
                    <Input
                        placeholder="Search employee..."
                        value={keyword}
                        onChange={(e) => {
                            setKeyword(e.target.value);
                            fetchMissing(e.target.value);
                        }}
                        className="h-10"
                    />
                </div>

                {/* Stats */}
                {data && !loading && filtered.length > 0 && (
                    <div className="px-5 py-2">
                        <p className="text-sm font-semibold text-gray-800">
                            <span className="text-green-600">✔️ Submitted Morning Employees ({submittedCount})</span>
                            {' || '}
                            <span className="text-red-500">❌ Missing Evening Employees ({displayed.length})</span>
                        </p>
                    </div>
                )}

                {/* List */}
                <div className="flex-1 overflow-y-auto px-5 pb-5 mt-2 space-y-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : displayed.length === 0 ? (
                        <p className="text-center text-green-600 font-medium py-10">All employees submitted performance 🎉</p>
                    ) : (
                        displayed.map((emp: any) => (
                            <div key={String(emp._id || emp.id)} className="p-3.5 bg-white border border-gray-200 rounded-xl">
                                <p className="font-bold text-gray-900 text-sm">{emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || '—'}</p>
                                <p className="text-xs text-gray-500 mt-0.5">Code: {emp.code || '—'} • {emp.designation || '—'}</p>
                                <div className="flex gap-2 mt-2">
                                    <span className={`text-xs font-semibold rounded-full px-3 py-1 ${emp.filledMorning ? 'bg-white border border-green-500 text-green-700' : 'bg-red-500 text-white'}`}>
                                        Morning {emp.filledMorning ? '✓' : '✗'}
                                    </span>
                                    <span className={`text-xs font-semibold rounded-full px-3 py-1 ${emp.filledEvening ? 'bg-white border border-green-500 text-green-700' : 'bg-red-500 text-white'}`}>
                                        Evening {emp.filledEvening ? '✓' : '✗'}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PerformancePage() {
    const { employee, loading: authLoading } = useEmployeeAuth();

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

    const LIMIT = 12;

    // Build the date to use: user-picked or today
    const pickDate = selectedDate || toISO(now);

    // Derive unique managers from returned data for filter dropdown
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
            const params: Record<string, any> = {
                page, limit: LIMIT, month: selectedMonth, year: selectedYear,
                date: pickDate,
            };
            if (keyword.trim()) params.keyword = keyword.trim();
            const result = await perfApi.list(params);
            setData(result);
        } catch (e) {
            console.error('Performance fetch error', e);
        } finally {
            setLoadingData(false);
        }
    }, [employee, page, selectedMonth, selectedYear, keyword, pickDate]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const totalPages = data ? Math.ceil(data.total / LIMIT) : 0;

    // Apply manager filter client-side
    const visibleItems = useMemo(() => {
        if (!data?.data) return [];
        if (managerFilter === 'all') return data.data;
        // filter employees that belong to the selected manager's team
        // Since we don't have team membership data client-side, filter by manager code match
        return data.data.filter(d => d.employee?.code === managerFilter || d.role === 'employee');
    }, [data, managerFilter]);

    const handleExport = () => {
        if (!visibleItems.length) return;
        const rows = visibleItems.map(doc => {
            const emp = doc.employee;
            const empMorn = doc.re?.morning || ({} as any);
            const empEven = doc.re?.evening || ({} as any);
            const mgrEven = doc.manager?.evening || ({} as any);
            return {
                Date: doc.date, Role: doc.role,
                Name: `${emp?.first_name || ''} ${emp?.last_name || ''}`.trim(),
                Code: emp?.code || '',
                'Morning Login': doc.role === 'employee' ? empMorn.expectedLogins : '',
                'Evening Login Done': doc.role === 'employee' ? empEven.loginsDone : mgrEven.teamLoginsDone,
                'Morning Approval': doc.role === 'employee' ? empMorn.expectedApprovals : '',
                'Evening Approval Done': doc.role === 'employee' ? empEven.approvalsDone : mgrEven.teamApprovalDoneAmount,
                'Evening Disbursal Done': doc.role === 'employee' ? empEven.disbursalDone : (mgrEven as any).teamDisbursalDoneAmount,
            };
        });
        const header = Object.keys(rows[0]).join(',');
        const csv = [header, ...rows.map(r => Object.values(r).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `performance-${selectedYear}-${selectedMonth}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    const router = useRouter();

    if (authLoading || !employee) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const rolePriority = String((employee as any)?.role ?? '3');
    const isAdmin = rolePriority === '1';

    return (
        <div className="space-y-4 max-w-[1400px] mx-auto">
            {/* ── Header toolbar ── */}
            <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4"
                style={{ background: 'linear-gradient(180deg,#ffffff 0%,#fafbff 100%)' }}>
                <div className="flex flex-wrap items-center gap-3">
                    {/* Title */}
                    <div className="mr-2">
                        <h1 className="text-3xl font-black text-gray-900 leading-tight">Performance</h1>
                        <p className="text-xs text-gray-500 font-semibold">Dashboard / Performance</p>
                    </div>

                    {/* Month/Year picker */}
                    <div className="flex items-center gap-1.5 border border-gray-300 rounded-xl px-3 py-2 bg-white">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <Select value={`${selectedYear}-${selectedMonth}`} onValueChange={v => {
                            const [y, m] = v.split('-'); setSelectedYear(Number(y)); setSelectedMonth(Number(m)); setPage(1);
                        }}>
                            <SelectTrigger className="h-auto border-0 bg-transparent p-0 text-sm font-semibold shadow-none focus:ring-0 w-36">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[2024, 2025, 2026, 2027].flatMap(y =>
                                    MONTHS.map((m, i) => (
                                        <SelectItem key={`${y}-${i + 1}`} value={`${y}-${i + 1}`}>{m} {y}</SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    {/* Date picker */}
                    <div className="flex items-center gap-1.5 border border-gray-300 rounded-xl px-3 py-2 bg-white">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <input type="date" className="bg-transparent border-0 text-sm font-medium text-gray-700 outline-none w-36"
                            value={selectedDate}
                            onChange={e => { setSelectedDate(e.target.value); setPage(1); }} />
                        {selectedDate && (
                            <button onClick={() => setSelectedDate('')} className="text-gray-400 hover:text-gray-600">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    {/* Action buttons on the right */}
                    <div className="ml-auto flex items-center gap-2 flex-wrap">
                        <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-blue-600 border-blue-400 hover:bg-blue-50"
                            onClick={() => router.push('/f2fintech-employee/performance-upload')}>
                            <Eye className="w-4 h-4" />
                            View Performance
                        </Button>
                        {isAdmin && (
                            <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-red-600 border-red-400 hover:bg-red-50"
                                onClick={() => setShowMissing(true)}>
                                <AlertCircle className="w-4 h-4" />
                                Missing Upload
                            </Button>
                        )}
                        <Button size="sm" className="gap-1.5 rounded-lg font-bold text-white"
                            style={{ backgroundImage: 'linear-gradient(45deg,#1E3368 0%,#F09819 51%,#FF512F 100%)' }}
                            onClick={handleExport}>
                            <Download className="w-4 h-4" />
                            Export
                        </Button>
                    </div>
                </div>

                {/* Second row: search + manager filter */}
                <div className="flex flex-wrap items-center gap-3 mt-3">
                    {/* Search */}
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input className="pl-9 h-10" placeholder="Search Employee"
                            value={keyword}
                            onChange={e => { setKeyword(e.target.value); setPage(1); }} />
                    </div>

                    {/* Filter by Manager/TL */}
                    {managerList.length > 0 && (
                        <div className="w-64">
                            <Select value={managerFilter} onValueChange={v => { setManagerFilter(v); setPage(1); }}>
                                <SelectTrigger className="h-10 text-sm">
                                    <SelectValue placeholder="Filter by Manager/TL" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all"><em>All Employees</em></SelectItem>
                                    {managerList.map(m => (
                                        <SelectItem key={m.code} value={m.code}>
                                            <span className="flex items-center gap-2">
                                                <Badge className="h-5 text-[10px] bg-blue-100 text-blue-700 hover:bg-blue-100">Manager</Badge>
                                                {m.code}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {data && (
                        <p className="text-sm text-gray-500 ml-auto">
                            Showing <b>{visibleItems.length}</b> of <b>{data.total}</b> records
                        </p>
                    )}
                </div>
            </div>

            {/* ── Cards Grid ── */}
            {loadingData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                                <div className="flex-1"><div className="h-4 bg-gray-200 rounded w-3/4 mb-2" /><div className="h-3 bg-gray-100 rounded w-1/2" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="h-36 bg-gray-100 rounded-xl" /><div className="h-36 bg-gray-100 rounded-xl" />
                            </div>
                            <div className="h-20 bg-gray-50 rounded-xl mb-3" />
                            <div className="h-28 bg-gray-50 rounded-xl" />
                        </div>
                    ))}
                </div>
            ) : !visibleItems.length ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 rounded-2xl text-center">
                    <p className="text-lg font-black text-gray-800">No records</p>
                    <p className="text-sm text-gray-500 mt-1">Try changing month/year, date or search term</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visibleItems.map(doc => (
                        <PerformanceCard key={doc._id} doc={doc} onDetails={d => setDetailDoc(d)} />
                    ))}
                </div>
            )}

            {/* ── Pagination ── */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 pt-2">
                    <Button variant="outline" size="icon" className="h-9 w-9" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(pg => (
                        <Button key={pg} variant={page === pg ? 'default' : 'outline'} size="icon" className="h-9 w-9 text-xs" onClick={() => setPage(pg)}>{pg}</Button>
                    ))}
                    <Button variant="outline" size="icon" className="h-9 w-9" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* ── Details Drawer ── */}
            {detailDoc && <DetailsDrawer doc={detailDoc} onClose={() => setDetailDoc(null)} />}

            {/* ── Missing Upload Modal ── */}
            <MissingModal open={showMissing} onClose={() => setShowMissing(false)} pickDate={pickDate} />
        </div>
    );
}
