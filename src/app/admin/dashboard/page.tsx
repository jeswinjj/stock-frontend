'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { Button } from '@/components/ui/BaseComponents';
import { ArrowLeft, CheckCircle2, AlertCircle, RefreshCw, Eye, Trash2, Plus, Users, Zap, Search, Shield, Key } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import { StockAutocomplete } from '@/components/dashboard/StockAutocomplete';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'users' | 'corporate'>('users');
    const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Users state
    const [users, setUsers] = useState<any[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [editingUser, setEditingUser] = useState<any>(null);
    const [editForm, setEditForm] = useState({ name: '', email: '', role: '', password: '' });

    // Corporate Actions state (transferred from CorporateActionsPage)
    const [pendingActions, setPendingActions] = useState<any[]>([]);
    const [corporateLoading, setCorporateLoading] = useState(false);
    const [actionType, setActionType] = useState<'SPLIT' | 'BONUS' | 'DEMERGER'>('SPLIT');
    const [parentSymbol, setParentSymbol] = useState('');
    const [recordDate, setRecordDate] = useState('');
    const [effectiveDate, setEffectiveDate] = useState('');
    const [notes, setNotes] = useState('');
    const [splitNewShares, setSplitNewShares] = useState('');
    const [splitForEvery, setSplitForEvery] = useState('');
    const [bonusShares, setBonusShares] = useState('');
    const [bonusForEvery, setBonusForEvery] = useState('');
    const [demergerChildren, setDemergerChildren] = useState<any[]>([
        { childSymbol: '', entitlementRatio: { parentShares: '', childShares: '' }, costPercent: '' }
    ]);
    const [parentCostPct, setParentCostPct] = useState('100');
    const [isCreating, setIsCreating] = useState(false);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewSummary, setPreviewSummary] = useState('');
    const [previewData, setPreviewData] = useState<any>(null);
    const [previewId, setPreviewId] = useState<string | null>(null);
    const [isApplying, setIsApplying] = useState<string | null>(null);

    // Confirmation Modal state
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant: 'primary' | 'danger';
    }>({
        isOpen: false, title: '', message: '', onConfirm: () => { }, variant: 'primary'
    });

    const showToast = useCallback((type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 5000);
    }, []);

    // Redirect if not admin
    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) {
            router.push('/dashboard');
        }
    }, [user, authLoading, router]);

    const fetchUsers = useCallback(async () => {
        setUsersLoading(true);
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setUsersLoading(false);
        }
    }, []);

    const fetchCorporateData = useCallback(async () => {
        setCorporateLoading(true);
        try {
            const res = await api.get('/corporate-actions/pending');
            setPendingActions(res.data);
        } catch (error) {
            console.error('Failed to fetch corporate actions', error);
        } finally {
            setCorporateLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user?.role === 'admin') {
            if (activeTab === 'users') fetchUsers();
            if (activeTab === 'corporate') fetchCorporateData();
        }
    }, [user, activeTab, fetchUsers, fetchCorporateData]);

    // User Management Handlers
    const handleEditUser = (u: any) => {
        setEditingUser(u);
        setEditForm({ name: u.name, email: u.email, role: u.role, password: '' });
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = { ...editForm };
            if (!payload.password) delete payload.password; // Don't update if empty

            await api.patch(`/admin/users/${editingUser._id}`, payload);
            showToast('success', 'User updated successfully');
            setEditingUser(null);
            fetchUsers();
        } catch (err: any) {
            showToast('error', err.response?.data?.message || 'Failed to update user');
        }
    };

    const handleDeleteUser = (id: string, name: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete User',
            message: `Are you sure you want to delete ${name}? This will remove all their portfolio data. This cannot be undone.`,
            variant: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(`/admin/users/${id}`);
                    showToast('success', 'User deleted');
                    setUsers(prev => prev.filter(u => u._id !== id));
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                } catch (err: any) {
                    showToast('error', err.response?.data?.message || 'Failed to delete user');
                }
            }
        });
    };

    // Corporate Action Handlers (copied & slightly adjusted)
    const addChild = () => setDemergerChildren([...demergerChildren, { childSymbol: '', entitlementRatio: { parentShares: '', childShares: '' }, costPercent: '' }]);
    const removeChild = (i: number) => demergerChildren.length > 1 && setDemergerChildren(demergerChildren.filter((_, idx) => idx !== i));
    const updateChild = (i: number, f: string, v: any) => {
        const nc = [...demergerChildren];
        if (f.includes('.')) {
            const [fld, sub] = f.split('.');
            nc[i] = { ...nc[i], [fld]: { ...nc[i][fld], [sub]: v } };
        } else {
            nc[i] = { ...nc[i], [f]: v };
        }
        setDemergerChildren(nc);
    };

    const isFormValid = () => {
        if (!parentSymbol || !recordDate || !effectiveDate) return false;
        if (actionType === 'SPLIT') {
            const n = Number(splitNewShares), e = Number(splitForEvery);
            return n > 0 && e > 0 && n > e && Number.isInteger(n) && Number.isInteger(e);
        }
        if (actionType === 'BONUS') {
            const b = Number(bonusShares), e = Number(bonusForEvery);
            return b > 0 && e > 0 && Number.isInteger(b) && Number.isInteger(e);
        }
        if (actionType === 'DEMERGER') {
            const sum = Number(parentCostPct) + demergerChildren.reduce((s, c) => s + Number(c.costPercent || 0), 0);
            if (Math.abs(sum - 100) > 0.01) return false;
            return demergerChildren.every(c => c.childSymbol && Number(c.entitlementRatio.parentShares) > 0 && Number(c.entitlementRatio.childShares) > 0 && Number(c.costPercent) > 0);
        }
        return false;
    };

    const handleCreateCorporate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const payload: any = { actionType, parentSymbol: parentSymbol.toUpperCase(), recordDate, effectiveDate, notes };
            if (actionType === 'SPLIT') payload.splitConfig = { ratio: { newShares: Number(splitNewShares), forEveryShares: Number(splitForEvery) } };
            else if (actionType === 'BONUS') payload.bonusConfig = { ratio: { bonusShares: Number(bonusShares), forEveryShares: Number(bonusForEvery) } };
            else if (actionType === 'DEMERGER') payload.demergerConfig = { parentCostPercent: Number(parentCostPct), children: demergerChildren.map(c => ({ childSymbol: c.childSymbol.toUpperCase(), entitlementRatio: { parentShares: Number(c.entitlementRatio.parentShares), childShares: Number(c.entitlementRatio.childShares) }, costPercent: Number(c.costPercent) })) };

            await api.post('/corporate-actions/create', payload);
            showToast('success', 'Corporate action created');
            setParentSymbol(''); setRecordDate(''); setEffectiveDate(''); setNotes('');
            setSplitNewShares(''); setSplitForEvery(''); setBonusShares(''); setBonusForEvery('');
            setDemergerChildren([{ childSymbol: '', entitlementRatio: { parentShares: '', childShares: '' }, costPercent: '' }]);
            setParentCostPct('100');
            fetchCorporateData();
        } catch (error: any) {
            showToast('error', error.response?.data?.error || 'Failed to create action');
        } finally {
            setIsCreating(false);
        }
    };

    const handleApplyBulk = (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Apply to ALL Users',
            message: 'Are you sure you want to apply this corporate action to EVERY user who holds this stock? This is a heavy operation and cannot be undone.',
            variant: 'primary',
            onConfirm: async () => {
                setIsApplying(id);
                try {
                    await api.post('/corporate-actions/apply-bulk', { corporateActionId: id });
                    showToast('success', 'Bulk application started successfully');
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    fetchCorporateData();
                } catch (err: any) {
                    showToast('error', err.response?.data?.error || 'Bulk application failed');
                } finally {
                    setIsApplying(null);
                }
            }
        });
    };

    const handleDeleteCorporate = (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Action',
            message: 'Are you sure you want to delete this pending corporate action?',
            variant: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(`/corporate-actions/${id}`);
                    showToast('success', 'Action deleted');
                    setPendingActions(prev => prev.filter(a => a._id !== id));
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                } catch (err: any) {
                    showToast('error', 'Failed to delete action');
                }
            }
        });
    };

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
        u.email.toLowerCase().includes(userSearch.toLowerCase())
    );

    if (authLoading || !user || user.role !== 'admin') return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900"><RefreshCw className="animate-spin text-blue-500" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 p-4 md:p-8 lg:p-12 transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-8">
                {toast && (
                    <div className={cn(
                        "fixed top-4 right-4 z-[100] p-4 rounded-2xl shadow-2xl flex items-center gap-3 border animate-in slide-in-from-right-8 duration-300 backdrop-blur-md",
                        toast.type === 'success' ? "bg-white/90 dark:bg-slate-800/90 border-green-100 text-green-700 dark:text-green-400" : "bg-white/90 dark:bg-slate-800/90 border-red-100 text-red-700 dark:text-red-400"
                    )}>
                        {toast.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                        <p className="font-bold text-sm">{toast.message}</p>
                    </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="outline" className="h-10 w-10 p-0 rounded-xl"><ArrowLeft size={20} /></Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Super Admin Portal</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Manage users and global corporate actions</p>
                        </div>
                    </div>
                    
                    <div className="flex bg-white dark:bg-slate-800 p-1 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <button 
                            onClick={() => setActiveTab('users')}
                            className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all", activeTab === 'users' ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700")}
                        >
                            <Users size={16} /> User Management
                        </button>
                        <button 
                            onClick={() => setActiveTab('corporate')}
                            className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all", activeTab === 'corporate' ? "bg-purple-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700")}
                        >
                            <Zap size={16} /> Corporate Actions
                        </button>
                    </div>
                </div>

                {activeTab === 'users' ? (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-900 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-700 w-full md:w-96">
                                <Search size={18} className="text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search users by name or email..." 
                                    className="bg-transparent border-none outline-none text-sm w-full"
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 border-b border-gray-100 dark:border-gray-700">
                                        <tr>
                                            <th className="p-4 font-bold">User</th>
                                            <th className="p-4 font-bold">Email</th>
                                            <th className="p-4 font-bold">Auto-Refresh</th>
                                            <th className="p-4 font-bold">Role</th>
                                            <th className="p-4 font-bold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {usersLoading ? (
                                            <tr><td colSpan={4} className="p-12 text-center"><RefreshCw className="animate-spin inline mr-2" /> Loading users...</td></tr>
                                        ) : filteredUsers.length === 0 ? (
                                            <tr><td colSpan={4} className="p-12 text-center text-gray-500">No users found.</td></tr>
                                        ) : filteredUsers.map(u => (
                                            <tr key={u._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/20">
                                                <td className="p-4 font-bold text-gray-900 dark:text-white">{u.name}</td>
                                                <td className="p-4 text-gray-600 dark:text-gray-400">{u.email}</td>
                                                <td className="p-4">
                                                    {u.autoRefreshEnabled ? (
                                                        <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-bold text-xs">
                                                            <RefreshCw size={12} className="animate-spin-slow" />
                                                            Enabled
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs font-medium">Disabled</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black uppercase border", u.role === 'admin' ? "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800" : "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800")}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex gap-2 justify-end">
                                                        <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" onClick={() => handleEditUser(u)}>
                                                            Edit
                                                        </Button>
                                                        <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400" onClick={() => handleDeleteUser(u._id, u.name)}>
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Create Action Form */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><Plus className="text-blue-500" /> New Corporate Action</h2>
                                <form onSubmit={handleCreateCorporate} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Action Type</label>
                                        <select 
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                                            value={actionType} onChange={(e) => setActionType(e.target.value as any)}
                                        >
                                            <option value="SPLIT">SPLIT</option>
                                            <option value="BONUS">BONUS</option>
                                            <option value="DEMERGER">DEMERGER</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Symbol</label>
                                        <StockAutocomplete value={parentSymbol} onChange={setParentSymbol} placeholder="Search symbol..." />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Record Date</label>
                                            <input type="date" required className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 outline-none" value={recordDate} onChange={e => setRecordDate(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Effective Date</label>
                                            <input type="date" required className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 outline-none" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} />
                                        </div>
                                    </div>

                                    {/* Action Specific UI (simplified for sidebar) */}
                                    {actionType === 'SPLIT' && (
                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                            <div className="grid grid-cols-2 gap-3">
                                                <input type="number" placeholder="For every..." className="px-3 py-1.5 rounded-lg border text-sm" value={splitForEvery} onChange={e => setSplitForEvery(e.target.value)} />
                                                <input type="number" placeholder="Becomes..." className="px-3 py-1.5 rounded-lg border text-sm" value={splitNewShares} onChange={e => setSplitNewShares(e.target.value)} />
                                            </div>
                                        </div>
                                    )}

                                    {actionType === 'BONUS' && (
                                        <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-900/30">
                                            <div className="grid grid-cols-2 gap-3">
                                                <input type="number" placeholder="Bonus shares..." className="px-3 py-1.5 rounded-lg border text-sm" value={bonusShares} onChange={e => setBonusShares(e.target.value)} />
                                                <input type="number" placeholder="For every..." className="px-3 py-1.5 rounded-lg border text-sm" value={bonusForEvery} onChange={e => setBonusForEvery(e.target.value)} />
                                            </div>
                                        </div>
                                    )}

                                    {actionType === 'DEMERGER' && (
                                        <div className="space-y-3">
                                            <div className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/30">
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Parent Cost %</label>
                                                <input type="number" className="w-full px-3 py-1 rounded-lg border text-sm" value={parentCostPct} onChange={e => setParentCostPct(e.target.value)} />
                                            </div>
                                            {demergerChildren.map((c, i) => (
                                                <div key={i} className="p-3 bg-white dark:bg-slate-700 rounded-xl border border-gray-200 dark:border-gray-600 space-y-2 relative">
                                                    <StockAutocomplete value={c.childSymbol} onChange={v => updateChild(i, 'childSymbol', v)} placeholder="Child..." />
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <input type="number" placeholder="Par" className="px-2 py-1 rounded border text-xs" value={c.entitlementRatio.parentShares} onChange={e => updateChild(i, 'entitlementRatio.parentShares', e.target.value)} />
                                                        <input type="number" placeholder="Chd" className="px-2 py-1 rounded border text-xs" value={c.entitlementRatio.childShares} onChange={e => updateChild(i, 'entitlementRatio.childShares', e.target.value)} />
                                                        <input type="number" placeholder="%" className="px-2 py-1 rounded border text-xs" value={c.costPercent} onChange={e => updateChild(i, 'costPercent', e.target.value)} />
                                                    </div>
                                                    <button type="button" onClick={() => removeChild(i)} className="absolute -top-1 -right-1 bg-red-500 text-white p-0.5 rounded-full"><Trash2 size={10} /></button>
                                                </div>
                                            ))}
                                            <Button type="button" variant="outline" size="sm" onClick={addChild} className="w-full text-xs h-8"><Plus size={12} /> Add Child</Button>
                                        </div>
                                    )}

                                    <Button type="submit" disabled={isCreating || !isFormValid()} className="w-full h-11 bg-blue-600 text-white rounded-xl font-bold mt-4 shadow-lg active:scale-95">
                                        {isCreating ? 'Creating...' : 'Create Action'}
                                    </Button>
                                </form>
                            </div>
                        </div>

                        {/* Pending Actions Table */}
                        <div className="lg:col-span-2">
                            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-gray-50 dark:border-gray-700">
                                    <h2 className="text-lg font-bold">Pending Global Actions</h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500">
                                            <tr>
                                                <th className="p-4 font-bold">Stock</th>
                                                <th className="p-4 font-bold">Type</th>
                                                <th className="p-4 font-bold">Effective</th>
                                                <th className="p-4 font-bold text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {corporateLoading ? (
                                                <tr><td colSpan={4} className="p-12 text-center"><RefreshCw className="animate-spin inline" /></td></tr>
                                            ) : pendingActions.length === 0 ? (
                                                <tr><td colSpan={4} className="p-12 text-center text-gray-500">No pending actions.</td></tr>
                                            ) : pendingActions.map(a => (
                                                <tr key={a._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/20">
                                                    <td className="p-4 font-black text-gray-900 dark:text-white">{a.parentSymbol}</td>
                                                    <td className="p-4">
                                                        <span className={cn("px-2 py-0.5 text-[10px] font-bold rounded uppercase border", 
                                                            a.actionType === 'SPLIT' ? "bg-blue-50 text-blue-600 border-blue-200" : 
                                                            a.actionType === 'BONUS' ? "bg-green-50 text-green-600 border-green-200" : 
                                                            "bg-purple-50 text-purple-600 border-purple-200"
                                                        )}>{a.actionType}</span>
                                                    </td>
                                                    <td className="p-4 text-gray-500">{dayjs(a.effectiveDate).format('DD MMM')}</td>
                                                    <td className="p-4">
                                                        <div className="flex gap-2 justify-end">
                                                            <Button size="sm" className="h-8 bg-blue-600 text-white text-[10px]" onClick={() => handleApplyBulk(a._id)} disabled={isApplying === a._id}>
                                                                {isApplying === a._id ? 'Applying...' : 'Apply Bulk'}
                                                            </Button>
                                                            <Button size="sm" variant="outline" className="h-8 text-red-500 border-red-200 p-2" onClick={() => handleDeleteCorporate(a._id)}>
                                                                <Trash2 size={14} />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                            <Shield className="text-blue-500" />
                            <h2 className="text-xl font-bold">Edit User: {editingUser.name}</h2>
                        </div>
                        <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Name</label>
                                <input type="text" required className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email</label>
                                <input type="email" required className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Role</label>
                                <select className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900" value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})}>
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
                                <label className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 uppercase mb-2"><Key size={14} /> Update Password (Optional)</label>
                                <input type="password" placeholder="Leave blank to keep current" className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800" value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} />
                            </div>
                            
                            <div className="flex gap-3 pt-4">
                                <Button type="button" variant="outline" className="flex-1 rounded-xl h-11" onClick={() => setEditingUser(null)}>Cancel</Button>
                                <Button type="submit" className="flex-1 rounded-xl h-11 bg-blue-600 text-white font-bold shadow-lg">Save Changes</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4", confirmModal.variant === 'danger' ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600")}>
                                <AlertCircle size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{confirmModal.title}</h3>
                            <p className="text-sm text-gray-500">{confirmModal.message}</p>
                        </div>
                        <div className="p-6 bg-gray-50 dark:bg-slate-800/50 border-t flex gap-3">
                            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setConfirmModal({...confirmModal, isOpen: false})}>Cancel</Button>
                            <Button className={cn("flex-1 rounded-xl text-white font-bold", confirmModal.variant === 'danger' ? "bg-red-600" : "bg-blue-600")} onClick={confirmModal.onConfirm}>Confirm</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
