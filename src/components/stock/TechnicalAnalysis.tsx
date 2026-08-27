'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';
import { formatCurrency, cn } from '@/lib/utils';
import { Activity, Gauge, TrendingUp, TrendingDown, Volume2, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

interface TechnicalAnalysisProps {
    symbol: string;
}

export function TechnicalAnalysis({ symbol }: TechnicalAnalysisProps) {
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalysis = useCallback(async () => {
        if (!symbol) return;
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/market-data/${symbol}/technical-analysis`);
            setAnalysis(res.data);
        } catch (err: any) {
            console.error('Failed to load technical analysis:', err);
            setError(err.response?.data?.error || 'Unable to calculate technical analysis.');
        } finally {
            setLoading(false);
        }
    }, [symbol]);

    useEffect(() => {
        fetchAnalysis();
    }, [fetchAnalysis]);

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 animate-pulse space-y-4">
                <div className="h-6 w-48 bg-gray-200 dark:bg-slate-700 rounded-lg"></div>
                <div className="h-24 w-full bg-gray-200 dark:bg-slate-700 rounded-2xl"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-32 bg-gray-200 dark:bg-slate-700 rounded-2xl"></div>
                    <div className="h-32 bg-gray-200 dark:bg-slate-700 rounded-2xl"></div>
                </div>
            </div>
        );
    }

    if (error || !analysis) {
        return (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 text-center">
                <AlertCircle className="text-amber-500 mx-auto mb-2" size={28} />
                <h4 className="text-base font-bold text-gray-800 dark:text-white">Technical Analysis Unavailable</h4>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{error || 'Insufficient historical data'}</p>
            </div>
        );
    }

    const { score, trend, momentum, volatility, volume, signals } = analysis;

    const getScoreBadgeColor = (val: number) => {
        if (val >= 75) return 'bg-emerald-500 text-white';
        if (val >= 60) return 'bg-green-500 text-white';
        if (val >= 40) return 'bg-amber-500 text-white';
        if (val >= 25) return 'bg-orange-500 text-white';
        return 'bg-red-500 text-white';
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors duration-300 space-y-8">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700/60 pb-4">
                <div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <Activity className="text-blue-500" size={22} />
                        TECHNICAL ANALYSIS
                    </h2>
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mt-0.5">
                        Quantitative trend, momentum, volatility, and volume metrics
                    </p>
                </div>
                <button
                    onClick={fetchAnalysis}
                    className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                    title="Refresh Technical Analysis"
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* Technical Score Banner */}
            <div className="bg-gray-50 dark:bg-slate-700/30 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Gauge className="text-blue-500" size={20} />
                        <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Technical Score</span>
                    </div>
                    <div className="flex items-baseline gap-3">
                        <span className="text-4xl font-black text-gray-900 dark:text-white">{score.value}</span>
                        <span className="text-lg font-bold text-gray-400">/ 100</span>
                        <span className={cn("px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider", getScoreBadgeColor(score.value))}>
                            {score.label}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md">
                        Objective composite score derived from EMA alignment (30%), RSI/MACD momentum (30%), Volatility channels (20%), and Volume strength (20%).
                    </p>
                </div>

                <div className="w-full md:w-64 space-y-2 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-500">Trend</span>
                        <span className="text-blue-600 dark:text-blue-400">{score.breakdown.trend.points}/{score.breakdown.trend.max}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-500">Momentum</span>
                        <span className="text-blue-600 dark:text-blue-400">{score.breakdown.momentum.points}/{score.breakdown.momentum.max}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-500">Volatility</span>
                        <span className="text-blue-600 dark:text-blue-400">{score.breakdown.volatility.points}/{score.breakdown.volatility.max}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-500">Volume</span>
                        <span className="text-blue-600 dark:text-blue-400">{score.breakdown.volume.points}/{score.breakdown.volume.max}</span>
                    </div>
                </div>
            </div>

            {/* 4 Categorized Indicator Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Trend */}
                <div className="bg-gray-50 dark:bg-slate-700/30 p-5 rounded-2xl space-y-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Trend Indicators</span>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-300 font-medium">Price vs EMA 20</span>
                            <span className={cn("font-bold text-xs px-2 py-0.5 rounded", trend.priceVsEma20 === 'ABOVE' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400")}>
                                {trend.priceVsEma20 || 'N/A'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-300 font-medium">Price vs EMA 50</span>
                            <span className={cn("font-bold text-xs px-2 py-0.5 rounded", trend.priceVsEma50 === 'ABOVE' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400")}>
                                {trend.priceVsEma50 || 'N/A'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-300 font-medium">Price vs EMA 200</span>
                            <span className={cn("font-bold text-xs px-2 py-0.5 rounded", trend.priceVsEma200 === 'ABOVE' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400")}>
                                {trend.priceVsEma200 || 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Momentum */}
                <div className="bg-gray-50 dark:bg-slate-700/30 p-5 rounded-2xl space-y-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Momentum Indicators</span>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-300 font-medium">RSI (14)</span>
                            <span className="font-bold text-gray-900 dark:text-white">{momentum.rsi !== null ? momentum.rsi : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-300 font-medium">MACD Line</span>
                            <span className="font-bold text-gray-900 dark:text-white">{momentum.macd !== null ? momentum.macd : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-300 font-medium">MACD Signal</span>
                            <span className="font-bold text-gray-900 dark:text-white">{momentum.signal !== null ? momentum.signal : 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Volatility */}
                <div className="bg-gray-50 dark:bg-slate-700/30 p-5 rounded-2xl space-y-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Volatility Indicators</span>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-300 font-medium">ATR (14)</span>
                            <span className="font-bold text-gray-900 dark:text-white">{volatility.atr ? formatCurrency(volatility.atr) : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-300 font-medium">Bollinger Upper</span>
                            <span className="font-bold text-gray-900 dark:text-white">{volatility.bollinger.upper ? formatCurrency(volatility.bollinger.upper) : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-300 font-medium">Bollinger Lower</span>
                            <span className="font-bold text-gray-900 dark:text-white">{volatility.bollinger.lower ? formatCurrency(volatility.bollinger.lower) : 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Volume & VWAP */}
                <div className="bg-gray-50 dark:bg-slate-700/30 p-5 rounded-2xl space-y-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Volume & VWAP</span>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-300 font-medium">Current Vol</span>
                            <span className="font-bold text-gray-900 dark:text-white">{volume.current.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-300 font-medium">Relative Vol</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">{volume.relative}x</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-300 font-medium">VWAP</span>
                            <span className="font-bold text-gray-900 dark:text-white">{analysis.vwap ? formatCurrency(analysis.vwap) : 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Indicator Signals List */}
            {signals && signals.length > 0 && (
                <div className="space-y-3 pt-2">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">ANALYTICAL SIGNALS & RATIONALE</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {signals.map((sig: any, idx: number) => (
                            <div
                                key={idx}
                                className={cn(
                                    "p-3.5 rounded-2xl border text-xs font-medium flex items-start gap-3",
                                    sig.type === 'BULLISH'
                                        ? "bg-green-50/60 dark:bg-green-900/10 border-green-100 dark:border-green-900/30 text-green-800 dark:text-green-300"
                                        : sig.type === 'BEARISH'
                                            ? "bg-red-50/60 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 text-red-800 dark:text-red-300"
                                            : "bg-gray-50 dark:bg-slate-700/30 border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                                )}
                            >
                                <span className={cn(
                                    "px-2 py-0.5 rounded font-black text-[10px] uppercase shrink-0 mt-0.5",
                                    sig.type === 'BULLISH'
                                        ? "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200"
                                        : sig.type === 'BEARISH'
                                            ? "bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200"
                                            : "bg-gray-200 text-gray-800 dark:bg-slate-600 dark:text-gray-200"
                                )}>
                                    {sig.type}
                                </span>
                                <div>
                                    <span className="font-bold block text-gray-900 dark:text-white">{sig.indicator}</span>
                                    <span>{sig.message}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
