'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';
import { formatCurrency, formatCompactCurrency, cn } from '@/lib/utils';
import dayjs from 'dayjs';
import { BarChart3, TrendingUp, ShieldCheck, DollarSign, PieChart, Layers, Clock, AlertCircle, RefreshCw } from 'lucide-react';

interface FundamentalAnalysisProps {
    symbol: string;
}

export function FundamentalAnalysis({ symbol }: FundamentalAnalysisProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFundamentals = useCallback(async () => {
        if (!symbol) return;
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/market-data/${symbol}/fundamentals`);
            setData(res.data);
        } catch (err: any) {
            console.error('Failed to load fundamentals:', err);
            setError(err.response?.data?.error || 'Unable to fetch fundamental metrics.');
        } finally {
            setLoading(false);
        }
    }, [symbol]);

    useEffect(() => {
        fetchFundamentals();
    }, [fetchFundamentals]);

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 animate-pulse space-y-6">
                <div className="h-6 w-48 bg-gray-200 dark:bg-slate-700 rounded-lg"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-44 bg-gray-200 dark:bg-slate-700 rounded-2xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 text-center">
                <AlertCircle className="text-amber-500 mx-auto mb-2" size={28} />
                <h4 className="text-base font-bold text-gray-800 dark:text-white">Fundamental Data Unavailable</h4>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{error || 'Metrics not available for this ticker'}</p>
            </div>
        );
    }

    const { valuation, growth, profitability, financialHealth, dividend, market, ownership, lastUpdated } = data;

    const fmtVal = (val: any, prefix = '', suffix = '') => {
        if (val === null || val === undefined) return <span className="text-gray-400 font-normal">—</span>;
        return `${prefix}${typeof val === 'number' ? val.toLocaleString() : val}${suffix}`;
    };

    const fmtCurr = (val: any) => {
        if (val === null || val === undefined) return <span className="text-gray-400 font-normal">—</span>;
        // Use compact formatter for large values, fallback to normal currency
        return formatCompactCurrency(val);
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors duration-300 space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 dark:border-gray-700/60 pb-4">
                <div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <BarChart3 className="text-purple-500" size={22} />
                        FUNDAMENTAL ANALYSIS
                    </h2>
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mt-0.5">
                        Financial health, growth rates, margins, and valuation metrics
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-400 dark:text-gray-500 flex items-center gap-1">
                        <Clock size={12} />
                        Updated: {lastUpdated ? dayjs(lastUpdated).format('DD MMM YYYY') : 'Latest'}
                    </span>
                    <button
                        onClick={fetchFundamentals}
                        className="p-2 rounded-xl text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
                        title="Refresh Fundamentals"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {/* 6 Category Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* 1. Valuation */}
                <div className="bg-gray-50 dark:bg-slate-700/30 p-5 rounded-3xl border border-gray-100 dark:border-gray-700/50 space-y-3">
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs uppercase tracking-wider">
                        <PieChart size={16} />
                        <span>Valuation</span>
                    </div>
                    <div className="space-y-2 text-sm divide-y divide-gray-100 dark:divide-gray-700/40">
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">P/E Ratio</span>
                            <span className="font-bold text-gray-900 dark:text-white">{fmtVal(valuation.pe)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Forward P/E</span>
                            <span className="font-bold text-gray-900 dark:text-white">{fmtVal(valuation.forwardPE)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">P/B Ratio</span>
                            <span className="font-bold text-gray-900 dark:text-white">{fmtVal(valuation.pb)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">P/S Ratio</span>
                            <span className="font-bold text-gray-900 dark:text-white">{fmtVal(valuation.ps)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">PEG Ratio</span>
                            <span className="font-bold text-gray-900 dark:text-white">{fmtVal(valuation.peg)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">EV / EBITDA</span>
                            <span className="font-bold text-gray-900 dark:text-white">{fmtVal(valuation.evToEbitda)}</span>
                        </div>
                    </div>
                </div>

                {/* 2. Growth */}
                <div className="bg-gray-50 dark:bg-slate-700/30 p-5 rounded-3xl border border-gray-100 dark:border-gray-700/50 space-y-3">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-xs uppercase tracking-wider">
                        <TrendingUp size={16} />
                        <span>Growth Metrics</span>
                    </div>
                    <div className="space-y-2 text-sm divide-y divide-gray-100 dark:divide-gray-700/40">
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Revenue Growth (YoY)</span>
                            <span className={cn("font-bold", (growth.revenueGrowth || 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                                {fmtVal(growth.revenueGrowth, (growth.revenueGrowth || 0) >= 0 ? '+' : '', '%')}
                            </span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Earnings Growth (YoY)</span>
                            <span className={cn("font-bold", (growth.earningsGrowth || 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                                {fmtVal(growth.earningsGrowth, (growth.earningsGrowth || 0) >= 0 ? '+' : '', '%')}
                            </span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">EPS Growth (QoQ)</span>
                            <span className={cn("font-bold", (growth.epsGrowth || 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                                {fmtVal(growth.epsGrowth, (growth.epsGrowth || 0) >= 0 ? '+' : '', '%')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3. Profitability */}
                <div className="bg-gray-50 dark:bg-slate-700/30 p-5 rounded-3xl border border-gray-100 dark:border-gray-700/50 space-y-3">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
                        <DollarSign size={16} />
                        <span>Profitability</span>
                    </div>
                    <div className="space-y-2 text-sm divide-y divide-gray-100 dark:divide-gray-700/40">
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">EPS (TTM)</span>
                            <span className="font-bold text-gray-900 dark:text-white">{fmtCurr(profitability.eps)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Return on Equity (ROE)</span>
                            <span className="font-bold text-gray-900 dark:text-white">{fmtVal(profitability.roe, '', '%')}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Return on Assets (ROA)</span>
                            <span className="font-bold text-gray-900 dark:text-white">{fmtVal(profitability.roa, '', '%')}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Operating Margin</span>
                            <span className="font-bold text-gray-900 dark:text-white">{fmtVal(profitability.operatingMargin, '', '%')}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Net Profit Margin</span>
                            <span className="font-bold text-gray-900 dark:text-white">{fmtVal(profitability.profitMargin, '', '%')}</span>
                        </div>
                    </div>
                </div>

                {/* 4. Financial Health */}
                <div className="bg-gray-50 dark:bg-slate-700/30 p-5 rounded-3xl border border-gray-100 dark:border-gray-700/50 space-y-3">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                        <ShieldCheck size={16} />
                        <span>Financial Health</span>
                    </div>
                    <div className="space-y-2 text-sm divide-y divide-gray-100 dark:divide-gray-700/40">
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Total Debt</span>
                            <span className="font-bold text-gray-900 dark:text-white">{formatCompactCurrency(financialHealth.totalDebt)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Total Cash</span>
                            <span className="font-bold text-gray-900 dark:text-white">{formatCompactCurrency(financialHealth.totalCash)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Debt to Equity</span>
                            <span className="font-bold text-gray-900 dark:text-white">{fmtVal(financialHealth.debtToEquity)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Current Ratio</span>
                            <span className="font-bold text-gray-900 dark:text-white">{fmtVal(financialHealth.currentRatio)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Free Cash Flow</span>
                            <span className="font-bold text-gray-900 dark:text-white">{formatCompactCurrency(financialHealth.freeCashFlow)}</span>
                        </div>
                    </div>
                </div>

                {/* 5. Dividend */}
                <div className="bg-gray-50 dark:bg-slate-700/30 p-5 rounded-3xl border border-gray-100 dark:border-gray-700/50 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                        <Layers size={16} />
                        <span>Dividend</span>
                    </div>
                    <div className="space-y-2 text-sm divide-y divide-gray-100 dark:divide-gray-700/40">
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Dividend Yield</span>
                            <span className="font-bold text-gray-900 dark:text-white">{fmtVal(dividend.dividendYield, '', '%')}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Dividend Rate</span>
                            <span className="font-bold text-gray-900 dark:text-white">
                                {formatCurrency(dividend.dividendRate)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Payout Ratio</span>
                            <span className="font-bold text-gray-900 dark:text-white">{fmtVal(dividend.payoutRatio, '', '%')}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Ex-Dividend Date</span>
                            <span className="font-bold text-gray-900 dark:text-white">
                                {dividend.exDividendDate ? dayjs(dividend.exDividendDate).format('DD MMM YYYY') : '—'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 6. Market Statistics */}
                <div className="bg-gray-50 dark:bg-slate-700/30 p-5 rounded-3xl border border-gray-100 dark:border-gray-700/50 space-y-3">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
                        <BarChart3 size={16} />
                        <span>Market Statistics</span>
                    </div>
                    <div className="space-y-2 text-sm divide-y divide-gray-100 dark:divide-gray-700/40">
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Market Cap</span>
                            <span className="font-bold text-gray-900 dark:text-white">{formatCompactCurrency(market.marketCap)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Enterprise Value</span>
                            <span className="font-bold text-gray-900 dark:text-white">{formatCompactCurrency(market.enterpriseValue)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">52W High</span>
                            <span className="font-bold text-gray-900 dark:text-white">
                                {fmtCurr(market.fiftyTwoWeekHigh)} ({fmtVal(market.distanceFrom52WHigh, '', '%')})
                            </span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">52W Low</span>
                            <span className="font-bold text-gray-900 dark:text-white">
                                {fmtCurr(market.fiftyTwoWeekLow)} ({fmtVal(market.distanceFrom52WLow, '+', '%')})
                            </span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
