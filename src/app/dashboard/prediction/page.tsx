'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { StockAutocomplete } from '@/components/dashboard/StockAutocomplete';
import { PredictionMarketSetup } from '@/components/stock/PredictionMarketSetup';

export default function PredictionPage() {
    const { user, loading: authLoading } = useAuth();
    const [symbol, setSymbol] = useState('');
    const [name, setName] = useState('');

    useEffect(() => {
        if (!authLoading && !user) window.location.href = '/login';
    }, [authLoading, user]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 p-4 md:p-12">
            <main className="max-w-7xl mx-auto space-y-6 md:space-y-8">
                <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-violet-600 font-bold text-sm shadow-sm">
                    <ArrowLeft size={16} /> Back to Portfolio
                </Link>

                <section className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-black flex items-center gap-3"><BarChart3 className="text-violet-500" /> Prediction & Market Setup</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Choose an NSE stock to review its current rule-based technical setup.</p>
                        </div>
                        <div className="w-full md:w-96">
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Select stock</label>
                            <StockAutocomplete
                                value={symbol}
                                onChange={() => undefined}
                                onSelect={(nextSymbol, nextName) => { setSymbol(nextSymbol); setName(nextName || ''); }}
                                placeholder="Search by symbol or company name"
                            />
                        </div>
                    </div>
                </section>

                {symbol ? (
                    <section className="space-y-3">
                        <p className="px-1 text-sm font-bold text-gray-600 dark:text-gray-300">{symbol}{name ? ` — ${name}` : ''}</p>
                        <PredictionMarketSetup symbol={symbol} />
                    </section>
                ) : (
                    <section className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-12 text-center bg-white/50 dark:bg-slate-800/30">
                        <BarChart3 className="mx-auto text-violet-400 mb-3" size={36} />
                        <h2 className="font-bold">Select a stock to begin</h2>
                        <p className="text-sm text-gray-500 mt-1">Search for a symbol above, then select it from the list.</p>
                    </section>
                )}
            </main>
        </div>
    );
}
