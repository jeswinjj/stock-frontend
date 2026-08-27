'use client';
import { formatCurrency, cn } from '@/lib/utils';
import dayjs from 'dayjs';
import { TrendingUp, TrendingDown, Clock, ShieldAlert } from 'lucide-react';

interface StockHeaderProps {
    symbol: string;
    name: string;
    series?: string;
    quote: {
        price: number;
        change: number;
        changePercent: number;
        lastUpdatedAt: string;
    } | null;
    loading?: boolean;
}

export function StockHeader({ symbol, name, series = 'EQ', quote, loading }: StockHeaderProps) {
    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 animate-pulse flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-2">
                    <div className="h-8 w-40 bg-gray-200 dark:bg-slate-700 rounded-lg"></div>
                    <div className="h-4 w-60 bg-gray-200 dark:bg-slate-700 rounded-lg"></div>
                </div>
                <div className="space-y-2">
                    <div className="h-8 w-32 bg-gray-200 dark:bg-slate-700 rounded-lg"></div>
                    <div className="h-4 w-24 bg-gray-200 dark:bg-slate-700 rounded-lg"></div>
                </div>
            </div>
        );
    }

    const isProfit = (quote?.change || 0) >= 0;

    return (
        <header className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">{symbol}</h1>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                        NSE: {series}
                    </span>
                </div>
                <p className="text-sm md:text-base font-medium text-gray-500 dark:text-gray-400 mt-1">{name}</p>
            </div>

            {quote ? (
                <div className="flex flex-col md:items-end">
                    <div className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                        {formatCurrency(quote.price)}
                    </div>
                    <div className={cn(
                        "flex items-center gap-1.5 text-sm md:text-base font-bold mt-1",
                        isProfit ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    )}>
                        {isProfit ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                        <span>
                            {isProfit ? '+' : ''}{quote.change.toFixed(2)} ({isProfit ? '+' : ''}{quote.changePercent.toFixed(2)}%)
                        </span>
                    </div>
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-1.5 flex items-center gap-1">
                        <Clock size={12} />
                        Last updated: {dayjs(quote.lastUpdatedAt).format('DD MMM YYYY, h:mm A')}
                    </p>
                </div>
            ) : (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    <ShieldAlert size={18} />
                    <span className="text-sm font-semibold">Market data currently unavailable</span>
                </div>
            )}
        </header>
    );
}
