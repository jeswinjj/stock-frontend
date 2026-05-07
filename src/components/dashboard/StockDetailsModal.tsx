'use client';
import { useState, useEffect } from 'react';
import { X, Target, Trash2, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/BaseComponents';
import api from '@/services/api';
import { cn, formatCurrency } from '@/lib/utils';

interface TargetPrice {
    _id: string;
    price: number;
    createdAt: string;
}

interface StockDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    stock: any;
    onRefresh: () => void;
}

export function StockDetailsModal({ isOpen, onClose, stock, onRefresh }: StockDetailsModalProps) {
    const [newTarget, setNewTarget] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [localTargets, setLocalTargets] = useState<TargetPrice[]>([]);

    useEffect(() => {
        if (stock?.targets) {
            setLocalTargets(stock.targets);
        }
    }, [stock]);

    if (!isOpen || !stock) return null;

    const currentPrice = stock.currentPrice || 0;
    const avgPrice = stock.averagePrice || 0;

    const handleAddTarget = async (e: React.FormEvent) => {
        e.preventDefault();
        const price = parseFloat(newTarget);
        if (!price || isNaN(price) || price <= 0) return;

        setIsAdding(true);
        // Optimistic UI update could be done here, but API returns full updated targets anyway.
        try {
            const res = await api.post(`/stocks/${stock.id}/targets`, { price });
            if (res.data.targets) {
                setLocalTargets(res.data.targets);
            }
            setNewTarget('');
            onRefresh(); // Sync main dashboard list in background
        } catch (error) {
            console.error('Failed to add target', error);
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteTarget = async (targetId: string) => {
        setDeletingId(targetId);
        // Optimistic delete for immediate UI feedback
        setLocalTargets(prev => prev.filter(t => t._id !== targetId));
        try {
            const res = await api.delete(`/stocks/${stock.id}/targets/${targetId}`);
            if (res.data.targets) {
                setLocalTargets(res.data.targets);
            }
            onRefresh();
        } catch (error) {
            console.error('Failed to delete target', error);
            // Revert on error
            if (stock?.targets) setLocalTargets(stock.targets);
        } finally {
            setDeletingId(null);
        }
    };

    const isOverallProfit = stock.unrealizedPL >= 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 dark:bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 max-h-[90vh] flex flex-col">
                {/* Header Section */}
                <div className="flex-none flex justify-between items-center p-5 md:p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-slate-800/50">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{stock.symbol}</h2>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 truncate max-w-[200px]">{stock.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 bg-gray-50 dark:bg-slate-700/50 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 container-snap">
                    {/* Stock Info Section */}
                    <div className="p-5 md:p-6 grid grid-cols-2 gap-3 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-slate-800">
                        <div className="bg-gray-50 dark:bg-slate-700/30 p-3.5 rounded-2xl">
                            <p className="uppercase text-[9px] font-black tracking-widest text-gray-400 dark:text-gray-500 mb-1">Avg Price</p>
                            <p className="text-lg font-black text-gray-800 dark:text-white">{formatCurrency(avgPrice)}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-slate-700/30 p-3.5 rounded-2xl">
                            <p className="uppercase text-[9px] font-black tracking-widest text-gray-400 dark:text-gray-500 mb-1">Current Price (LTP)</p>
                            <p className="text-lg font-black text-gray-800 dark:text-white">{formatCurrency(currentPrice)}</p>
                        </div>

                        <div className="bg-gray-50 dark:bg-slate-700/30 p-3.5 rounded-2xl">
                            <p className="uppercase text-[9px] font-black tracking-widest text-gray-400 dark:text-gray-500 mb-1">Quantity</p>
                            <p className="text-lg font-black text-gray-800 dark:text-white">{stock.totalQuantity} <span className="text-xs font-bold text-gray-400">Shares</span></p>
                        </div>
                        <div className="bg-gray-50 dark:bg-slate-700/30 p-3.5 rounded-2xl">
                            <p className="uppercase text-[9px] font-black tracking-widest text-gray-400 dark:text-gray-500 mb-1">P&L (%)</p>
                            <p className={cn("text-lg font-black", isOverallProfit ? "text-green-500" : "text-red-500")}>
                                {isOverallProfit ? '+' : ''}{(stock.pnlPercentage || 0).toFixed(2)}%
                            </p>
                        </div>

                        <div className="bg-gray-50 dark:bg-slate-700/30 p-3.5 rounded-2xl col-span-2 flex justify-between items-center">
                            <div>
                                <p className="uppercase text-[9px] font-black tracking-widest text-gray-400 dark:text-gray-500 mb-1">Current Value</p>
                                <p className="text-xl font-black text-gray-800 dark:text-white">{formatCurrency(stock.currentValue)}</p>
                            </div>
                            <div className="text-right">
                                <p className="uppercase text-[9px] font-black tracking-widest text-gray-400 dark:text-gray-500 mb-1">Unrealized</p>
                                <p className={cn("text-base font-bold", isOverallProfit ? "text-green-500" : "text-red-500")}>
                                    {isOverallProfit ? '+' : ''}{formatCurrency(stock.unrealizedPL || 0)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Targets Section */}
                    <div className="px-5 md:px-6 py-6 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-4 text-gray-800 dark:text-white font-bold">
                            <Target size={18} className="text-blue-500" />
                            <h3>Target Prices ({localTargets.length}/3)</h3>
                        </div>

                        <div className="space-y-3 mb-6">
                            {localTargets.length === 0 ? (
                                <div className="text-center py-6 bg-gray-50 dark:bg-slate-700/20 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                    <p className="text-sm font-medium text-gray-400 dark:text-gray-500">No target prices set yet.</p>
                                </div>
                            ) : (
                                localTargets.map((t) => {
                                    // Target Return Calculated from Avg Price
                                    const expReturn = avgPrice > 0 ? ((t.price - avgPrice) / avgPrice) * 100 : 0;
                                    const expProfitParams = t.price - avgPrice;
                                    const isPositive = expProfitParams >= 0;

                                    return (
                                        <div key={t._id} className="group relative flex flex-col p-4 bg-white dark:bg-slate-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg font-black text-gray-800 dark:text-white">{formatCurrency(t.price)}</span>
                                                    {t.price <= currentPrice && (
                                                        <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-bold">
                                                            Reached
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteTarget(t._id)}
                                                    disabled={deletingId === t._id}
                                                    className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                                    title="Delete Target"
                                                >
                                                    {deletingId === t._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-4 text-xs font-bold">
                                                <div className={cn("flex flex-col", isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                                                    <span className="text-[9px] uppercase tracking-wider text-gray-400 dark:text-gray-500">Return (from Avg)</span>
                                                    <span className="flex items-center gap-1 mt-0.5">
                                                        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                        {expReturn.toFixed(2)}%
                                                    </span>
                                                </div>
                                                <div className={cn("flex flex-col border-l pl-4 border-gray-100 dark:border-gray-700", isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                                                    <span className="text-[9px] uppercase tracking-wider text-gray-400 dark:text-gray-500">Profit / Share</span>
                                                    <span className="mt-0.5">{isPositive ? '+' : ''}{formatCurrency(expProfitParams)}</span>
                                                </div>
                                                <div className={cn("flex flex-col border-l pl-4 border-gray-100 dark:border-gray-700", isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                                                    <span className="text-[9px] uppercase tracking-wider text-gray-400 dark:text-gray-500">Profit</span>
                                                    <span className="mt-0.5">{isPositive ? '+' : ''}{formatCurrency(expProfitParams * stock.totalQuantity)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Add Target Form */}
                        <form onSubmit={handleAddTarget} className="flex gap-2">
                            <div className="relative flex-1">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                                <input
                                    type="number"
                                    step="0.05"
                                    value={newTarget}
                                    onChange={(e) => setNewTarget(e.target.value)}
                                    placeholder="Enter Target Price"
                                    disabled={localTargets.length >= 3 || isAdding}
                                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-700/50 text-gray-800 dark:text-white font-bold text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={localTargets.length >= 3 || isAdding || !newTarget}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center justify-center min-w-[80px]"
                            >
                                {isAdding ? <Loader2 size={18} className="animate-spin" /> : 'Add'}
                            </Button>
                        </form>
                        {localTargets.length >= 3 && (
                            <p className="text-xs text-center font-bold text-orange-500 mt-3 animate-in fade-in">Maximum of 3 targets reached.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
