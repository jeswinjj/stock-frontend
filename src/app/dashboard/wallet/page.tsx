'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { Button } from '@/components/ui/BaseComponents';
import { ArrowDownLeft, ArrowUpRight, Wallet, History, ArrowLeft, Download, ChevronDown, ChevronRight, Filter } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { AddFundsModal } from '@/components/dashboard/wallet/AddFundsModal';
import { WithdrawFundsModal } from '@/components/dashboard/wallet/WithdrawFundsModal';
import Link from 'next/link';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

interface Transaction {
    id: number;
    type: 'CREDIT' | 'DEBIT' | 'BUY' | 'SELL' | 'SELL_PROFIT' | 'SELL_LOSS' | 'WITHDRAW';
    amount: string;
    description: string;
    symbol?: string;
    quantity?: number;
    buyPrice?: number;
    sellPrice?: number;
    costPrice?: number;
    totalPL?: number;
    price?: number; // Legacy/Partial field
    created_at: string;
}

interface ParsedTransaction extends Transaction {
    normalizedType: string;
    symbol: string;
    displayBuyPrice: number | null;
    displaySellPrice: number | null;
    displayPL: number | null;
    displayNetValue: number;
    displayDate: string;
    monthKey: string;
}

export default function WalletPage() {
    const { user, loading: authLoading } = useAuth();
    const [balance, setBalance] = useState<number>(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'wallet' | 'trades'>('wallet');
    const [tradeFilter, setTradeFilter] = useState<'all' | 'buy' | 'sell'>('all');
    const [expandedMonths, setExpandedMonths] = useState<string[]>([]);
    const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 5000);
    }, []);

    const fetchWalletData = useCallback(async () => {
        try {
            const response = await api.get('/wallet');
            setBalance(response.data.balance);
            setTransactions(response.data.transactions);

            // By default, expand the latest month
            if (response.data.transactions.length > 0) {
                const latestMonth = dayjs(response.data.transactions[0].created_at).format('MMMM YYYY');
                setExpandedMonths([latestMonth]);
            }
        } catch (error) {
            console.error('Failed to fetch wallet data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchWalletData();
        }
    }, [user, fetchWalletData]);

    // Transformation Layer: Normalize and Sort all data sources with precision guards
    const parsedTransactions = useMemo(() => {
        // 1. Stable chronological sorting
        const sorted = [...transactions].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        return sorted.map(tx => {
            const isBuy = tx.type === 'BUY';
            const isSell = tx.type.startsWith('SELL');
            const amount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount;

            // 2. Robust Regex Fallbacks (Case-insensitive)
            const buyMatch = tx.description.match(/Bought \d+ ([A-Z0-9.\-]+) @ ([\d.]+)/i);
            const sellMatch = tx.description.match(/Sold \d+ ([A-Z0-9.\-]+) @ ([\d.]+)/i);
            const plMatch = tx.description.match(/(P\/L|Profit|Loss):\s*(-?[\d.]+)/i);

            const extractedSymbol = tx.symbol || (isBuy ? buyMatch?.[1] : isSell ? sellMatch?.[1] : 'Wallet');
            const extractedBuyPrice = isBuy ? (tx.buyPrice || tx.price || (buyMatch ? parseFloat(buyMatch[2]) : null)) : null;
            const extractedSellPrice = isSell ? (tx.sellPrice || tx.price || (sellMatch ? parseFloat(sellMatch[2]) : null)) : null;

            // 3. Strict P/L Priority (Structured > Regex > null)
            const extractedPL = tx.totalPL !== undefined && tx.totalPL !== null ? tx.totalPL : (plMatch ? parseFloat(plMatch[2]) : null);

            // 4. Guarded and Rounded Buy Price Derivation
            let displayBuyPrice = isBuy ? extractedBuyPrice : (tx.costPrice || null);
            if (!isBuy && !displayBuyPrice && extractedSellPrice !== null && extractedPL !== null && tx.quantity && tx.quantity > 0) {
                displayBuyPrice = Number((extractedSellPrice - (extractedPL / tx.quantity)).toFixed(2));
            }

            // 5. Corrected Net Value (Cash Flow Impact)
            let netValue = amount;
            if (['WITHDRAW', 'DEBIT', 'BUY'].includes(tx.type)) netValue = -amount;

            // 6. Data Validation Layer
            if (isSell && tx.type === 'SELL_LOSS' && extractedPL !== null && extractedPL > 0) {
                console.warn(`[Data Inconsistency] Transaction ${tx.id} marked as SELL_LOSS but has positive P/L: ${extractedPL}`);
            }
            if (isBuy && !extractedBuyPrice) {
                console.warn(`[Data Gap] BUY transaction ${tx.id} missing buyPrice/price.`);
            }

            return {
                ...tx,
                normalizedType: isSell ? 'SELL' : tx.type,
                symbol: extractedSymbol || 'Wallet',
                displayBuyPrice,
                displaySellPrice: extractedSellPrice,
                displayPL: extractedPL,
                displayNetValue: netValue,
                displayDate: dayjs(tx.created_at).format('DD MMM YYYY, HH:mm'),
                monthKey: dayjs(tx.created_at).format('MMMM YYYY')
            };
        });
    }, [transactions]);

    const filteredTransactions = useMemo(() => {
        return parsedTransactions.filter(tx => {
            if (activeTab === 'wallet') {
                return ['CREDIT', 'WITHDRAW', 'DEBIT'].includes(tx.type);
            } else {
                if (!tx.type.startsWith('BUY') && !tx.type.startsWith('SELL')) return false;
                if (tradeFilter === 'buy') return tx.type === 'BUY';
                if (tradeFilter === 'sell') return tx.normalizedType === 'SELL';
                return true;
            }
        });
    }, [parsedTransactions, activeTab, tradeFilter]);

    const groupedData = useMemo(() => {
        const groups: { [key: string]: ParsedTransaction[] } = {};
        filteredTransactions.forEach(tx => {
            if (!groups[tx.monthKey]) groups[tx.monthKey] = [];
            groups[tx.monthKey].push(tx);
        });
        return groups;
    }, [filteredTransactions]);

    const toggleMonth = (month: string) => {
        setExpandedMonths(prev =>
            prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
        );
    };

    const handleExportExcel = () => {
        const dataToExport = filteredTransactions.map(tx => ({
            Date: tx.displayDate,
            Type: tx.type.replace('_', ' '),
            Symbol: tx.symbol,
            Description: tx.description,
            'Quantity': tx.quantity || '—',
            'Buy Price': tx.displayBuyPrice ?? '—',
            'Sell Price': tx.displaySellPrice ?? '—',
            'P/L': tx.displayPL ?? '—',
            'Net Value (Wallet Impact)': tx.displayNetValue
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Transactions");
        XLSX.writeFile(wb, `trading-report-${dayjs().format('YYYY-MM-DD')}.xlsx`);
        showToast('Export successful');
    };

    const getTransactionColor = (tx: ParsedTransaction) => {
        if (tx.displayPL !== null) {
            return tx.displayPL >= 0
                ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
        }

        switch (tx.normalizedType) {
            case 'CREDIT':
                return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
            case 'WITHDRAW':
            case 'DEBIT':
                return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
            case 'BUY':
                return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
            default:
                return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800';
        }
    };

    const getTransactionIcon = (tx: ParsedTransaction) => {
        if (tx.displayPL !== null) {
            return tx.displayPL >= 0 ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />;
        }

        switch (tx.normalizedType) {
            case 'CREDIT':
                return <ArrowDownLeft size={18} />;
            case 'WITHDRAW':
            case 'DEBIT':
            case 'BUY':
                return <ArrowUpRight size={18} />;
            default:
                return <History size={18} />;
        }
    };

    if (loading || authLoading) return <div className="flex items-center justify-center h-screen font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-900">Loading wallet...</div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 p-6 md:p-12 transition-colors duration-300">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Toast Notification */}
                {toast && (
                    <div className={cn(
                        "fixed top-6 right-6 z-[100] p-4 rounded-2xl shadow-2xl flex items-center gap-3 border animate-in slide-in-from-right-8 duration-300 backdrop-blur-md",
                        toast.type === 'success'
                            ? "bg-white/90 dark:bg-slate-800/90 border-green-100 dark:border-green-900/50 text-green-700 dark:text-green-400"
                            : "bg-white/90 dark:bg-slate-800/90 border-red-100 dark:border-red-900/50 text-red-700 dark:text-red-400"
                    )}>
                        <p className="font-bold">{toast.message}</p>
                    </div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="outline" className="h-10 w-10 p-0 rounded-xl">
                                <ArrowLeft size={20} />
                            </Button>
                        </Link>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Wallet</h1>
                    </div>
                    <Button
                        onClick={handleExportExcel}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6"
                        disabled={filteredTransactions.length === 0}
                    >
                        <Download size={18} className="mr-2" /> Export to Excel
                    </Button>
                </div>

                {/* Balance Card */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Wallet size={200} />
                    </div>

                    <div className="relative z-10">
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Total Balance</p>
                        <h2 className="text-5xl font-black text-gray-900 dark:text-white mb-8">
                            {formatCurrency(balance)}
                        </h2>

                        <div className="flex flex-wrap gap-4">
                            <Button
                                className="h-12 px-8 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
                                onClick={() => setIsAddModalOpen(true)}
                            >
                                <ArrowDownLeft className="mr-2" size={20} /> Add Funds
                            </Button>
                            <Button
                                className="h-12 px-8 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
                                onClick={() => setIsWithdrawModalOpen(true)}
                            >
                                <ArrowUpRight className="mr-2" size={20} /> Withdraw
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Transactions Table Section */}
                <div className="space-y-4">
                    {/* Header with Tabs and Sub-filters */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden sticky top-4 z-40">
                        <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                            <div className="flex items-center gap-4">
                                <History className="text-blue-500" size={24} />
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white whitespace-nowrap">History</h2>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                                {/* Wallet vs Trades Tab */}
                                <div className="flex bg-gray-100 dark:bg-slate-900/50 p-1.5 rounded-2xl flex-1 md:flex-none">
                                    {(['wallet', 'trades'] as const).map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={cn(
                                                "px-6 py-2.5 text-sm font-black rounded-xl transition-all grow text-center",
                                                activeTab === tab
                                                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                                                    : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                                            )}
                                        >
                                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                        </button>
                                    ))}
                                </div>

                                {/* Buy/Sell Filter (Only for Trades) */}
                                {activeTab === 'trades' && (
                                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-900/50 p-1.5 rounded-2xl flex-1 md:flex-none">
                                        <Filter size={16} className="ml-2 text-gray-400" />
                                        {(['all', 'buy', 'sell'] as const).map(f => (
                                            <button
                                                key={f}
                                                onClick={() => setTradeFilter(f)}
                                                className={cn(
                                                    "px-4 py-2 text-xs font-bold rounded-lg transition-all capitalize",
                                                    tradeFilter === f
                                                        ? "bg-blue-600 text-white shadow-md"
                                                        : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                                                )}
                                            >
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Grouped Lists */}
                    <div className="space-y-4">
                        {Object.keys(groupedData).length === 0 ? (
                            <div className="bg-white dark:bg-slate-800 p-20 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm text-center">
                                <History size={48} className="mx-auto mb-4 text-gray-300 opacity-50" />
                                <p className="text-gray-400 font-medium italic">No transactions match your current filters.</p>
                            </div>
                        ) : (
                            Object.keys(groupedData).sort((a, b) => dayjs(b, 'MMMM YYYY').unix() - dayjs(a, 'MMMM YYYY').unix()).map(month => {
                                const isExpanded = expandedMonths.includes(month);
                                const monthTransactions = groupedData[month];
                                const monthPL = monthTransactions.reduce((acc, tx) => acc + (tx.totalPL || 0), 0);

                                return (
                                    <div key={month} className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-300">
                                        {/* Month Header */}
                                        <button
                                            onClick={() => toggleMonth(month)}
                                            className="w-full p-6 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-slate-800/80 transition-colors group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-gray-50 dark:bg-slate-900 rounded-lg group-hover:bg-white dark:group-hover:bg-slate-800 transition-colors shadow-sm">
                                                    {isExpanded ? <ChevronDown className="text-blue-500" size={20} /> : <ChevronRight className="text-gray-400" size={20} />}
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">{month}</h3>
                                                <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 dark:bg-slate-900 text-gray-500 dark:text-gray-400 rounded-md">
                                                    {monthTransactions.length} txs
                                                </span>
                                            </div>

                                            {activeTab === 'trades' && monthPL !== 0 && (
                                                <div className="text-right">
                                                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Monthly Net P/L</p>
                                                    <p className={cn("text-sm font-black", monthPL >= 0 ? "text-green-500" : "text-red-500")}>
                                                        {monthPL >= 0 ? '+' : ''}{formatCurrency(monthPL)}
                                                    </p>
                                                </div>
                                            )}
                                        </button>

                                        {/* Table (Collapsible) */}
                                        {isExpanded && (
                                            <div className="overflow-x-auto border-t border-gray-50 dark:border-gray-700 animate-in slide-in-from-top-2 duration-300">
                                                <table className="w-full text-left border-collapse table-fixed min-w-[700px] lg:min-w-full">
                                                    <thead>
                                                        <tr className="border-b border-gray-50 dark:border-gray-700/50 bg-gray-50/30 dark:bg-slate-900/50">
                                                            <th className="p-6 w-[180px] text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Date</th>
                                                            <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Action</th>
                                                            {activeTab === 'trades' && (
                                                                <>
                                                                    <th className="p-6 w-[100px] text-[10px] font-black text-gray-400 uppercase tracking-[2px] text-right">Shares</th>
                                                                    <th className="p-6 w-[120px] text-[10px] font-black text-gray-400 uppercase tracking-[2px] text-right">Buy Price</th>
                                                                    <th className="p-6 w-[120px] text-[10px] font-black text-gray-400 uppercase tracking-[2px] text-right">Sell Price</th>
                                                                    <th className="p-6 w-[150px] text-[10px] font-black text-gray-400 uppercase tracking-[2px] text-right">P/L</th>
                                                                </>
                                                            )}
                                                            <th className="p-6 w-[150px] text-[10px] font-black text-gray-400 uppercase tracking-[2px] text-right">Net Value</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700/30">
                                                        {monthTransactions.map((tx) => (
                                                            <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                                                <td className="p-6 text-xs font-bold text-gray-500 dark:text-gray-400">
                                                                    {tx.displayDate}
                                                                </td>
                                                                <td className="p-6">
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className={cn(
                                                                            "inline-flex items-center w-fit px-2.5 py-1 rounded-full text-[10px] font-black gap-1.5",
                                                                            getTransactionColor(tx)
                                                                        )}>
                                                                            {getTransactionIcon(tx)}
                                                                            {tx.type.replace('_', ' ')}
                                                                        </span>
                                                                        <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate pr-4">
                                                                            {tx.symbol}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                {activeTab === 'trades' && (
                                                                    <>
                                                                        <td className="p-6 text-sm font-bold text-gray-800 dark:text-gray-200 text-right">
                                                                            {tx.quantity || '—'}
                                                                        </td>
                                                                        <td className="p-6 text-sm font-bold text-gray-400 dark:text-gray-500 text-right">
                                                                            {tx.displayBuyPrice ? formatCurrency(tx.displayBuyPrice) : '—'}
                                                                        </td>
                                                                        <td className="p-6 text-sm font-bold text-gray-400 dark:text-gray-500 text-right">
                                                                            {tx.displaySellPrice ? formatCurrency(tx.displaySellPrice) : '—'}
                                                                        </td>
                                                                        <td className="p-6 text-right">
                                                                            {tx.displayPL !== null ? (
                                                                                <div className="flex flex-col items-end">
                                                                                    <span className={cn("text-sm font-black", tx.displayPL >= 0 ? "text-green-500" : "text-red-500")}>
                                                                                        {tx.displayPL >= 0 ? 'P/L: +' : 'P/L: '}{tx.displayPL.toFixed(2)}
                                                                                    </span>
                                                                                    <span className="text-[10px] font-medium text-gray-400 italic">Financial Snapshot</span>
                                                                                </div>
                                                                            ) : '—'}
                                                                        </td>
                                                                    </>
                                                                )}
                                                                <td className={cn(
                                                                    "p-6 text-base font-black text-right whitespace-nowrap",
                                                                    tx.type === 'BUY' ? "text-blue-600 dark:text-blue-400" : tx.displayPL !== null ? (tx.displayPL >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400") : tx.displayNetValue > 0 ? "text-green-600 dark:text-green-400" : tx.displayNetValue < 0 ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"
                                                                )}>
                                                                    {tx.displayNetValue >= 0 ? '+' : ''}{formatCurrency(tx.displayNetValue)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            <AddFundsModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={() => {
                    fetchWalletData();
                    showToast('Funds added successfully');
                }}
            />

            <WithdrawFundsModal
                isOpen={isWithdrawModalOpen}
                onClose={() => setIsWithdrawModalOpen(false)}
                onSuccess={() => {
                    fetchWalletData();
                    showToast('Funds withdrawn successfully');
                }}
                currentBalance={balance}
            />
        </div>
    );
}
