'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Beaker, Play, RotateCcw, TrendingUp, ShieldAlert, Sparkles, Activity } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { StockAutocomplete } from '@/components/dashboard/StockAutocomplete';
import { Button } from '@/components/ui/BaseComponents';
import api from '@/services/api';
import { cn, formatCurrency } from '@/lib/utils';

const Metric = ({ 
    label, 
    value, 
    tone 
}: { 
    label: string; 
    value: string | number; 
    tone?: 'positive' | 'negative' | 'neutral'; 
}) => (
    <div className="rounded-2xl bg-gray-50 dark:bg-slate-700/30 p-4 border border-gray-100/80 dark:border-gray-700/50">
        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">{label}</p>
        <p className={cn('mt-1 text-lg font-black', 
            tone === 'positive' ? 'text-emerald-600 dark:text-emerald-400' : 
            tone === 'negative' ? 'text-red-500 dark:text-red-400' : 
            'text-gray-800 dark:text-gray-100'
        )}>
            {value}
        </p>
    </div>
);

export default function PaperTradingPage() {
    const { user, loading: authLoading } = useAuth();
    const [symbol, setSymbol] = useState('');
    const [portfolios, setPortfolios] = useState<any[]>([]);
    const [activeKey, setActiveKey] = useState('OPENING_RANGE_BREAKOUT_3M_V1');
    const [running, setRunning] = useState(false);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            const res = await api.get('/paper-trading/portfolios');
            setPortfolios(res.data.portfolios || []);
            if (res.data.portfolios?.length > 0 && !res.data.portfolios.some((p: any) => p.strategy.key === activeKey)) {
                setActiveKey(res.data.portfolios[0].strategy.key);
            }
        } catch (err: any) {
            setMessage(err.response?.data?.error || 'Unable to load paper portfolios.');
        } finally {
            setLoading(false);
        }
    }, [activeKey]);

    useEffect(() => {
        if (!authLoading && !user) window.location.href = '/login';
    }, [authLoading, user]);

    useEffect(() => {
        if (user) load();
    }, [user, load]);

    const runAll = async () => {
        if (!symbol) return setMessage('Select a stock first.');
        setRunning(true);
        setMessage(null);
        try {
            const keys = portfolios.length > 0 
                ? portfolios.map(p => p.strategy.key)
                : ['TREND_MOMENTUM_BREAKOUT_V1', 'MEAN_REVERSION_SUPPORT_V1', 'OPENING_RANGE_BREAKOUT_3M_V1'];

            await Promise.all(keys.map(strategyKey => 
                api.post('/paper-trading/backtest', { symbol, strategyKey })
            ));
            await load();
            setMessage(`All virtual portfolios were successfully backtested for ${symbol}.`);
        } catch (err: any) {
            setMessage(err.response?.data?.details || err.response?.data?.error || 'One or more backtests could not be completed.');
        } finally {
            setRunning(false);
        }
    };

    const reset = async () => {
        if (!window.confirm('Reset all virtual portfolios and delete their saved paper backtests?')) return;
        setRunning(true);
        setMessage(null);
        try {
            await api.post('/paper-trading/reset');
            await load();
            setMessage('All paper portfolios have been reset to ₹1,00,000.');
        } catch (err: any) {
            const response = err.response?.data;
            setMessage(response?.details ? `${response.error}: ${response.details}` : (response?.error || 'Portfolio reset failed.'));
        } finally {
            setRunning(false);
        }
    };

    const active = portfolios.find(item => item.strategy.key === activeKey) || portfolios[0];
    const run = active?.latestRun;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 p-4 md:p-12">
            <main className="max-w-7xl mx-auto space-y-6 md:space-y-8">
                <Link 
                    href="/dashboard" 
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-violet-600 font-bold text-sm shadow-sm transition-all"
                >
                    <ArrowLeft size={16} /> Back to Portfolio
                </Link>

                {/* Header Banner */}
                <section className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 md:p-8">
                    <div className="flex flex-col lg:flex-row justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 text-xs font-bold mb-3">
                                <Sparkles size={14} /> Algorithmic Backtest & Paper Lab
                            </div>
                            <h1 className="text-3xl font-black flex items-center gap-3">
                                <Beaker className="text-violet-500" /> Paper Trading Lab
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-2xl">
                                Compare independent ₹1,00,000 virtual portfolios using historical NSE candles, realistic slippage, brokerage, and strict risk parameters.
                            </p>
                        </div>
                        <div className="w-full lg:w-96">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Backtest a stock</label>
                            <StockAutocomplete 
                                value={symbol} 
                                onChange={() => undefined} 
                                onSelect={next => setSymbol(next)} 
                                placeholder="Search & select an NSE stock" 
                            />
                            <Button 
                                onClick={runAll} 
                                disabled={running || !symbol} 
                                className="mt-3 w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                            >
                                <Play size={16} />
                                {running ? 'Running backtests…' : 'Run All Portfolios'}
                            </Button>
                        </div>
                    </div>
                </section>

                {message && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900/30 p-4 text-sm text-amber-800 dark:text-amber-300">
                        {message}
                    </div>
                )}

                {/* Strategy Cards Grid */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {loading ? (
                        <div className="col-span-full h-48 bg-white dark:bg-slate-800 animate-pulse rounded-3xl" />
                    ) : (
                        portfolios.map(item => {
                            const latest = item.latestRun;
                            const selected = item.strategy.key === activeKey;
                            const isOrb = item.strategy.key === 'OPENING_RANGE_BREAKOUT_3M_V1';

                            return (
                                <button
                                    key={item.strategy.key}
                                    onClick={() => setActiveKey(item.strategy.key)}
                                    className={cn(
                                        'text-left bg-white dark:bg-slate-800 rounded-3xl border p-6 shadow-sm transition-all flex flex-col justify-between',
                                        selected 
                                            ? 'border-violet-500 ring-2 ring-violet-200 dark:ring-violet-900/40 bg-violet-50/20 dark:bg-violet-900/10' 
                                            : 'border-gray-100 dark:border-gray-700 hover:border-violet-300'
                                    )}
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300">
                                                {isOrb ? '3-Min Intraday' : 'Daily Swing'}
                                            </span>
                                            <span className="font-black text-xs text-gray-400">₹1L Virtual</span>
                                        </div>
                                        <h2 className="mt-2 text-lg font-black text-gray-900 dark:text-white leading-tight">
                                            {item.strategy.name}
                                        </h2>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">
                                            {item.strategy.description}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                                        <Metric 
                                            label="Equity" 
                                            value={formatCurrency(item.portfolio.finalEquity)} 
                                            tone={item.portfolio.finalEquity >= item.portfolio.initialCapital ? 'positive' : 'negative'} 
                                        />
                                        <Metric 
                                            label="Return" 
                                            value={latest ? `${latest.totalReturn}%` : '—'} 
                                            tone={latest?.totalReturn >= 0 ? 'positive' : 'negative'} 
                                        />
                                        <Metric 
                                            label="Win Rate" 
                                            value={latest ? `${latest.winRate}%` : '—'} 
                                            tone={latest?.winRate >= 50 ? 'positive' : 'neutral'} 
                                        />
                                    </div>
                                </button>
                            );
                        })
                    )}
                </section>

                {/* Strategy Details & Audit Trail */}
                <section className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 md:p-8 space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                        <div>
                            <div className="flex items-center gap-2">
                                <Activity className="text-violet-500" size={20} />
                                <h2 className="text-xl font-black">{active?.strategy?.name || 'Strategy Results'}</h2>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {active?.strategy?.key === 'OPENING_RANGE_BREAKOUT_3M_V1' 
                                    ? '3-minute OHLCV candles (9:15–9:18 opening range) with Break + Retest confirmation, 1% target, first candle SL, and EOD intraday exit.'
                                    : 'Signals are generated at daily close and executed at next open with conservative slippage and fees.'
                                }
                            </p>
                        </div>
                        <Button 
                            variant="outline" 
                            onClick={reset} 
                            disabled={running} 
                            className="text-red-500 hover:text-red-600 border-red-200 dark:border-red-900/40 shrink-0"
                        >
                            <RotateCcw size={15} className="mr-2" /> Reset All
                        </Button>
                    </div>

                    {run ? (
                        <>
                            {/* Key Performance Metrics */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
                                <Metric label="Total return" value={`${run.totalReturn}%`} tone={run.totalReturn >= 0 ? 'positive' : 'negative'} />
                                <Metric label="Total Trades" value={run.totalTrades} />
                                <Metric label="Win rate" value={`${run.winRate}%`} tone={run.winRate >= 50 ? 'positive' : 'negative'} />
                                <Metric label="Avg return / trade" value={`${run.averageReturn}%`} tone={run.averageReturn >= 0 ? 'positive' : 'negative'} />
                                <Metric label="Max drawdown" value={`${run.maxDrawdown}%`} tone="negative" />
                                <Metric label="Profit factor" value={run.profitFactor ?? (run.winningTrades > 0 ? '∞' : '0')} />
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
                                <Metric label="Winning trades" value={run.winningTrades} tone="positive" />
                                <Metric label="Losing trades" value={run.losingTrades} tone="negative" />
                                <Metric label="Avg Profit (Wins)" value={run.averageProfit ? formatCurrency(run.averageProfit) : '—'} tone="positive" />
                                <Metric label="Avg Loss (Losses)" value={run.averageLoss ? formatCurrency(run.averageLoss) : '—'} tone="negative" />
                                <Metric label="Max Losing Streak" value={run.losingStreak ?? '—'} tone={run.losingStreak > 2 ? 'negative' : 'neutral'} />
                                <Metric label="Estimated fees" value={formatCurrency(run.totalFees)} />
                            </div>

                            {/* Trade Audit Log */}
                            <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-black flex items-center gap-2">
                                        <TrendingUp size={18} className="text-violet-500" /> Trade Audit Trail ({run.trades?.length || 0} Trades)
                                    </h3>
                                    <span className="text-xs text-gray-400">Max 1 trade / day per stock</span>
                                </div>

                                {run.trades?.length ? (
                                    <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700/60">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 dark:bg-slate-700/40 text-xs uppercase font-bold text-gray-400">
                                                <tr>
                                                    <th className="text-left p-3.5">Side</th>
                                                    <th className="text-left p-3.5">Entry</th>
                                                    <th className="text-left p-3.5">Exit</th>
                                                    <th className="text-right p-3.5">Qty</th>
                                                    <th className="text-right p-3.5">P&L</th>
                                                    <th className="text-right p-3.5">Return</th>
                                                    <th className="text-left p-3.5">Exit Reason</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                                {run.trades.map((trade: any, index: number) => {
                                                    const isWin = trade.pnl > 0;
                                                    const side = trade.side || 'BUY';

                                                    return (
                                                        <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                                            <td className="p-3.5">
                                                                <span className={cn(
                                                                    'text-[10px] font-black uppercase px-2 py-0.5 rounded',
                                                                    side === 'BUY' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                                                                )}>
                                                                    {side}
                                                                </span>
                                                            </td>
                                                            <td className="p-3.5">
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {new Date(trade.entryDate).toLocaleDateString('en-IN')}
                                                                </div>
                                                                <div className="font-bold text-gray-900 dark:text-white mt-0.5">
                                                                    {formatCurrency(trade.entryPrice)}
                                                                </div>
                                                            </td>
                                                            <td className="p-3.5">
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {new Date(trade.exitDate).toLocaleDateString('en-IN')}
                                                                </div>
                                                                <div className="font-bold text-gray-900 dark:text-white mt-0.5">
                                                                    {formatCurrency(trade.exitPrice)}
                                                                </div>
                                                            </td>
                                                            <td className="p-3.5 text-right font-semibold text-gray-700 dark:text-gray-300">
                                                                {trade.quantity}
                                                            </td>
                                                            <td className={cn('p-3.5 text-right font-black', isWin ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400')}>
                                                                {isWin ? '+' : ''}{formatCurrency(trade.pnl)}
                                                            </td>
                                                            <td className={cn('p-3.5 text-right font-bold', isWin ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400')}>
                                                                {trade.returnPercent > 0 ? `+${trade.returnPercent}%` : `${trade.returnPercent}%`}
                                                            </td>
                                                            <td className="p-3.5">
                                                                <span className={cn(
                                                                    'text-xs font-bold px-2 py-0.5 rounded-full inline-block',
                                                                    trade.exitReason === 'TARGET' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                                                                    trade.exitReason === 'STOP_LOSS' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                                                                    'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
                                                                )}>
                                                                    {trade.exitReason?.replace(/_/g, ' ')}
                                                                </span>
                                                                {trade.holdingMinutes && (
                                                                    <span className="text-[10px] text-gray-400 block mt-0.5">
                                                                        Duration: {trade.holdingMinutes}m
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center bg-gray-50 dark:bg-slate-700/20 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                        <ShieldAlert size={28} className="text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm font-semibold text-gray-500">No qualifying trades triggered for this period.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="p-12 text-center bg-gray-50 dark:bg-slate-700/20 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                            <Beaker size={32} className="text-violet-400 mx-auto mb-2" />
                            <p className="font-bold text-gray-700 dark:text-gray-300">Select an NSE stock and click "Run All Portfolios"</p>
                            <p className="text-xs text-gray-400 mt-1">This will run simultaneous backtests across all 3 algorithmic strategies.</p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
