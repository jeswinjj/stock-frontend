'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { Button } from '@/components/ui/BaseComponents';
import { ArrowDownLeft, ArrowUpRight, Wallet, History, ArrowLeft } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { AddFundsModal } from '@/components/dashboard/wallet/AddFundsModal';
import { WithdrawFundsModal } from '@/components/dashboard/wallet/WithdrawFundsModal';
import Link from 'next/link';

interface Transaction {
    id: number;
    type: 'CREDIT' | 'DEBIT' | 'BUY' | 'SELL_PROFIT' | 'SELL_LOSS' | 'WITHDRAW';
    amount: string;
    description: string;
    created_at: string;
}

export default function WalletPage() {
    const { user, loading: authLoading } = useAuth();
    const [balance, setBalance] = useState<number>(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 5000);
    };

    const fetchWalletData = useCallback(async () => {
        try {
            const response = await api.get('/wallet');
            setBalance(response.data.balance);
            setTransactions(response.data.transactions);
        } catch (error) {
            console.error('Failed to fetch wallet data:', error);
            showToast('Failed to fetch wallet data.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        if (user) {
            fetchWalletData();
        }
    }, [user, fetchWalletData]);

    const getTransactionColor = (type: string) => {
        switch (type) {
            case 'CREDIT':
            case 'SELL_PROFIT':
                return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
            case 'WITHDRAW':
            case 'SELL_LOSS':
                return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
            case 'BUY':
                return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
            default:
                return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800';
        }
    };

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'CREDIT':
            case 'SELL_PROFIT':
                return <ArrowDownLeft size={18} />;
            case 'WITHDRAW':
            case 'SELL_LOSS':
            case 'BUY':
                return <ArrowUpRight size={18} />;
            default:
                return <History size={18} />;
        }
    };

    if (loading || authLoading) return <div className="flex items-center justify-center h-screen font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-900">Loading wallet...</div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 p-6 md:p-12 transition-colors duration-300">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Toast Notification */}
                {toast && (
                    <div className={cn(
                        "fixed top-6 right-6 z-[100] p-4 rounded-2xl shadow-2xl flex items-center gap-3 border animate-in slide-in-from-right-8 duration-300 backdrop-blur-md",
                        toast.type === 'success'
                            ? "bg-white/90 dark:bg-slate-800/90 border-green-100 dark:border-green-900/50 text-green-700 dark:text-green-400"
                            : "bg-white/90 dark:bg-slate-800/90 border-red-100 dark:border-red-900/50 text-red-700 dark:text-red-400"
                    )}>
                        {/* Build error/success icon if needed, or just text */}
                        <p className="font-bold">{toast.message}</p>
                    </div>
                )}

                <div className="flex items-center gap-4 mb-8">
                    <Link href="/dashboard">
                        <Button variant="outline" className="h-10 w-10 p-0 rounded-xl">
                            <ArrowLeft size={20} />
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Wallet</h1>
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

                {/* Transactions */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Transaction History</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-slate-800/80">
                                    <th className="p-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="p-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                                    <th className="p-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                                    <th className="p-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {transactions.length > 0 ? (
                                    transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="p-6 text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                                {new Date(tx.created_at).toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="p-6">
                                                <span className={cn(
                                                    "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold gap-1.5",
                                                    getTransactionColor(tx.type)
                                                )}>
                                                    {getTransactionIcon(tx.type)}
                                                    {tx.type.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="p-6 text-sm text-gray-700 dark:text-gray-200 font-medium">
                                                {tx.description}
                                            </td>
                                            <td className={cn(
                                                "p-6 text-sm font-bold text-right",
                                                ['CREDIT', 'SELL_PROFIT'].includes(tx.type) ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white"
                                            )}>
                                                {['WITHDRAW', 'BUY', 'SELL_LOSS'].includes(tx.type) ? '-' : '+'}
                                                {formatCurrency(parseFloat(tx.amount))}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="p-12 text-center text-gray-400 dark:text-gray-500 font-medium">
                                            No transactions yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
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
