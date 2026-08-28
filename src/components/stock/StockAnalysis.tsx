'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';
import { cn } from '@/lib/utils';
import { Award, CheckCircle2, AlertTriangle, Shield, RefreshCw, AlertCircle, HelpCircle, Info } from 'lucide-react';

interface StockAnalysisProps {
    symbol: string;
}

export function StockAnalysis({ symbol }: StockAnalysisProps) {
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalysis = useCallback(async () => {
        if (!symbol) return;
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/market-data/${symbol}/analysis`);
            setAnalysis(res.data);
        } catch (err: any) {
            console.error('Failed to load combined analysis:', err);
            setError(err.response?.data?.error || 'Unable to compute stock analysis score.');
        } finally {
            setLoading(false);
        }
    }, [symbol]);

    useEffect(() => {
        fetchAnalysis();
    }, [fetchAnalysis]);

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 animate-pulse space-y-6">
                <div className="h-6 w-48 bg-gray-200 dark:bg-slate-700 rounded-lg"></div>
                <div className="h-32 bg-gray-200 dark:bg-slate-700 rounded-3xl"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-40 bg-gray-200 dark:bg-slate-700 rounded-2xl"></div>
                    <div className="h-40 bg-gray-200 dark:bg-slate-700 rounded-2xl"></div>
                </div>
            </div>
        );
    }

    if (error || !analysis) {
        return (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 text-center">
                <AlertCircle className="text-amber-500 mx-auto mb-2" size={28} />
                <h4 className="text-base font-bold text-gray-800 dark:text-white">Analysis Unavailable</h4>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{error || 'Unable to calculate score'}</p>
            </div>
        );
    }

    const { signals } = analysis;
    if (!signals) return null;

    const { overallScore, technicalScore, fundamentalScore, riskScore, classification, riskLabel, positiveSignals, warningSignals, scoreBreakdown } = signals;

    const getClassificationColor = (cls: string) => {
        switch (cls) {
            case 'Strong': return 'bg-emerald-500 text-white';
            case 'Positive': return 'bg-green-500 text-white';
            case 'Neutral': return 'bg-amber-500 text-white';
            case 'Weak': return 'bg-orange-500 text-white';
            default: return 'bg-red-500 text-white';
        }
    };

    const getRiskBadgeColor = (score: number) => {
        if (score <= 25) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200';
        if (score <= 50) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200';
        if (score <= 75) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200';
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200';
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors duration-300 space-y-8">
            {/* Section Header */}
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700/60 pb-4">
                <div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <Award className="text-amber-500" size={22} />
                        OUR ANALYSIS
                    </h2>
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mt-0.5">
                        Transparent, 100% rule-based composite scoring and signal rationales
                    </p>
                </div>
                <button
                    onClick={fetchAnalysis}
                    className="p-2 rounded-xl text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all"
                    title="Refresh Analysis"
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* Score Banner */}
            <div className="bg-gradient-to-br from-blue-50/50 via-white to-slate-50 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-900 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-700 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">

                {/* Overall Score */}
                <div className="flex items-center gap-6">
                    <div className="relative flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full border-4 border-blue-100 dark:border-blue-900/50 flex flex-col items-center justify-center bg-white dark:bg-slate-800 shadow-sm">
                            <span className="text-3xl font-black text-gray-900 dark:text-white">{overallScore}</span>
                            <span className="text-[10px] font-bold text-gray-400">/ 100</span>
                        </div>
                    </div>
                    <div>
                        <span className="text-xs font-extrabold text-gray-400 uppercase tracking-widest block mb-1">Overall Stock Score</span>
                        <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">{symbol}</h3>
                            <span className={cn("px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider", getClassificationColor(classification))}>
                                {classification}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
                            Equal weight combination of Technical Setup (50%) and Fundamental Performance (50%).
                        </p>
                    </div>
                </div>

                {/* Sub-Scores (Technical, Fundamental, Risk) */}
                <div className="grid grid-cols-3 gap-4 w-full lg:w-auto">
                    <div className="bg-white dark:bg-slate-800/90 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 text-center">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Technical</span>
                        <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 block">{technicalScore}</span>
                    </div>

                    <div className="bg-white dark:bg-slate-800/90 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 text-center">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Fundamental</span>
                        <span className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 block">{fundamentalScore}</span>
                    </div>

                    <div className="bg-white dark:bg-slate-800/90 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 text-center">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Risk Score</span>
                        <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">{riskScore}</span>
                        <span className={cn("text-[9px] font-extrabold px-1.5 py-0.5 rounded border mt-1 inline-block", getRiskBadgeColor(riskScore))}>
                            {riskLabel}
                        </span>
                    </div>
                </div>
            </div>

            {/* Why & Warnings Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Positive Signals */}
                <div className="bg-green-50/40 dark:bg-green-900/10 p-6 rounded-3xl border border-green-100 dark:border-green-900/30 space-y-4">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-bold text-sm">
                        <CheckCircle2 size={18} />
                        <span>POSITIVE SIGNALS & RATIONALE</span>
                    </div>
                    {positiveSignals && positiveSignals.length > 0 ? (
                        <div className="space-y-2.5">
                            {positiveSignals.map((sig: any, idx: number) => (
                                <div key={idx} className="flex items-start gap-2 text-xs font-medium text-green-900 dark:text-green-200">
                                    <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                                    <span>{sig.message}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-400 font-normal">No positive technical or fundamental signals detected.</p>
                    )}
                </div>

                {/* Warning Signals */}
                <div className="bg-amber-50/40 dark:bg-amber-900/10 p-6 rounded-3xl border border-amber-100 dark:border-amber-900/30 space-y-4">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
                        <AlertTriangle size={18} />
                        <span>RISKS & WARNINGS</span>
                    </div>
                    {warningSignals && warningSignals.length > 0 ? (
                        <div className="space-y-2.5">
                            {warningSignals.map((sig: any, idx: number) => (
                                <div key={idx} className="flex items-start gap-2 text-xs font-medium text-amber-900 dark:text-amber-200">
                                    <span className="text-amber-600 dark:text-amber-400 font-bold">⚠</span>
                                    <span>{sig.message}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium">✓ No major risk flags or warnings detected.</p>
                    )}
                </div>

            </div>

            {/* Score Breakdown Detail Grid */}
            {scoreBreakdown && (
                <div className="space-y-3 pt-2">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">SCORE BREAKDOWN BY CATEGORY</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {Object.entries(scoreBreakdown).map(([key, val]: [string, any]) => (
                            <div key={key} className="bg-gray-50 dark:bg-slate-700/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block capitalize">{key}</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-lg font-black text-gray-900 dark:text-white">{val.points}</span>
                                    <span className="text-xs font-bold text-gray-400">/ {val.max}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Educational Disclaimer Banner */}
            <div className="bg-gray-50 dark:bg-slate-700/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <Info size={16} className="text-gray-400 shrink-0" />
                <p>
                    <strong>Educational Analysis Disclaimer:</strong> This score is generated using predefined, transparent quantitative rules. It is for informational and educational purposes only and does not constitute financial advice.
                </p>
            </div>
        </div>
    );
}
