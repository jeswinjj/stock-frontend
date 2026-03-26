'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Wallet } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import api from '@/services/api';

export const WalletCard = () => {
    const [balance, setBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const response = await api.get('/wallet');
                setBalance(response.data.balance);
            } catch (error) {
                console.error('Failed to fetch wallet balance:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBalance();
    }, []);

    return (
        <Link href="/dashboard/wallet">
            <div className="bg-gray-900 dark:bg-gray-900 border border-gray-700 rounded-xl p-3 md:p-4 shadow-lg hover:shadow-xl hover:border-gray-600 transition-all cursor-pointer group flex items-center justify-between gap-4 h-full">
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-gray-800 rounded-lg group-hover:bg-gray-700 transition-colors">
                        <Wallet className="text-blue-400 w-[18px] h-[18px] md:w-[20px] md:h-[20px]" />
                    </div>
                    <div>
                        <p className="text-[10px] md:text-xs text-gray-400 font-medium uppercase tracking-wider">Wallet Balance</p>
                        {loading ? (
                            <div className="h-5 md:h-6 w-20 md:w-24 bg-gray-800 rounded animate-pulse mt-1"></div>
                        ) : (
                            <p className="text-lg md:text-xl font-bold text-white tracking-tight">
                                {formatCurrency(balance || 0)}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
};
