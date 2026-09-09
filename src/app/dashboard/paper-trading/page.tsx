'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Beaker, Play, RotateCcw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { StockAutocomplete } from '@/components/dashboard/StockAutocomplete';
import { Button } from '@/components/ui/BaseComponents';
import api from '@/services/api';
import { cn, formatCurrency } from '@/lib/utils';

const Metric = ({ label, value, tone }: { label: string, value: string | number, tone?: 'positive' | 'negative' }) => <div className="rounded-2xl bg-gray-50 dark:bg-slate-700/30 p-4"><p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">{label}</p><p className={cn('mt-1 text-lg font-black', tone === 'positive' ? 'text-emerald-600' : tone === 'negative' ? 'text-red-500' : '')}>{value}</p></div>;

export default function PaperTradingPage() {
    const { user, loading: authLoading } = useAuth();
    const [symbol, setSymbol] = useState('');
    const [portfolios, setPortfolios] = useState<any[]>([]);
    const [activeKey, setActiveKey] = useState('TREND_MOMENTUM_BREAKOUT_V1');
    const [running, setRunning] = useState(false);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<string | null>(null);
    const load = useCallback(async () => {
        try { setPortfolios((await api.get('/paper-trading/portfolios')).data.portfolios); }
        catch (err: any) { setMessage(err.response?.data?.error || 'Unable to load paper portfolios.'); }
        finally { setLoading(false); }
    }, []);
    useEffect(() => { if (!authLoading && !user) window.location.href = '/login'; }, [authLoading, user]);
    useEffect(() => { if (user) load(); }, [user, load]);
    const runBoth = async () => {
        if (!symbol) return setMessage('Select a stock first.');
        setRunning(true); setMessage(null);
        try {
            await Promise.all(['TREND_MOMENTUM_BREAKOUT_V1', 'MEAN_REVERSION_SUPPORT_V1'].map(strategyKey => api.post('/paper-trading/backtest', { symbol, strategyKey })));
            await load();
            setMessage(`Both ₹1,00,000 portfolios were backtested for ${symbol}.`);
        } catch (err: any) { setMessage(err.response?.data?.error || 'One or more backtests could not be completed.'); }
        finally { setRunning(false); }
    };
    const reset = async () => {
        if (!window.confirm('Reset both virtual portfolios and delete their saved paper backtests?')) return;
        setRunning(true); setMessage(null);
        try { await api.post('/paper-trading/reset'); await load(); }
        catch (err: any) {
            const response = err.response?.data;
            setMessage(response?.details ? `${response.error}: ${response.details}` : (response?.error || 'Portfolio reset failed.'));
        }
        finally { setRunning(false); }
    };
    const active = portfolios.find(item => item.strategy.key === activeKey);
    const run = active?.latestRun;
    return <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 p-4 md:p-12"><main className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-violet-600 font-bold text-sm shadow-sm"><ArrowLeft size={16} /> Back to Portfolio</Link>
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 md:p-8"><div className="flex flex-col lg:flex-row justify-between gap-6"><div><h1 className="text-3xl font-black flex items-center gap-3"><Beaker className="text-violet-500" /> Paper Trading Lab</h1><p className="text-sm text-gray-500 mt-2 max-w-2xl">Compare two independent ₹1,00,000 virtual portfolios using identical historical data, fees, slippage, and next-day execution.</p></div><div className="w-full lg:w-96"><label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Backtest a stock</label><StockAutocomplete value={symbol} onChange={() => undefined} onSelect={next => setSymbol(next)} placeholder="Search and select a stock" /><Button onClick={runBoth} disabled={running || !symbol} className="mt-3 w-full bg-violet-600 hover:bg-violet-700"><Play size={16} className="mr-2" />{running ? 'Running both backtests…' : 'Run Both Portfolios'}</Button></div></div></section>
        {message && <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900/30 p-4 text-sm text-amber-800 dark:text-amber-300">{message}</div>}
        <section className="grid lg:grid-cols-2 gap-5">{loading ? <div className="lg:col-span-2 h-48 bg-white dark:bg-slate-800 animate-pulse rounded-3xl" /> : portfolios.map(item => { const latest = item.latestRun, selected = item.strategy.key === activeKey; return <button key={item.strategy.key} onClick={() => setActiveKey(item.strategy.key)} className={cn('text-left bg-white dark:bg-slate-800 rounded-3xl border p-6 shadow-sm transition-all', selected ? 'border-violet-500 ring-2 ring-violet-200 dark:ring-violet-900/40' : 'border-gray-100 dark:border-gray-700 hover:border-violet-300')}><div className="flex justify-between gap-3"><div><p className="text-[11px] uppercase font-black tracking-wider text-violet-500">Virtual portfolio</p><h2 className="mt-1 text-xl font-black">{item.strategy.name}</h2><p className="text-xs text-gray-500 mt-2 min-h-8">{item.strategy.description}</p></div><p className="font-black text-lg">₹1L</p></div><div className="grid grid-cols-3 gap-3 mt-5"><Metric label="Equity" value={formatCurrency(item.portfolio.finalEquity)} tone={item.portfolio.finalEquity >= item.portfolio.initialCapital ? 'positive' : 'negative'} /><Metric label="Return" value={latest ? `${latest.totalReturn}%` : '—'} tone={latest?.totalReturn >= 0 ? 'positive' : 'negative'} /><Metric label="Max DD" value={latest ? `${latest.maxDrawdown}%` : '—'} tone="negative" /></div></button>; })}</section>
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 md:p-8"><div className="flex justify-between items-center gap-4"><div><h2 className="text-xl font-black">{active?.strategy?.name || 'Strategy Results'}</h2><p className="text-xs text-gray-400 mt-1">Signals are generated at a completed close and executed at the next daily open. This is an educational simulation, not a guarantee of future performance.</p></div><Button variant="outline" onClick={reset} disabled={running} className="text-red-500 hover:text-red-600 shrink-0"><RotateCcw size={15} className="mr-2" /> Reset both</Button></div>{run ? <><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6"><Metric label="Total return" value={`${run.totalReturn}%`} tone={run.totalReturn >= 0 ? 'positive' : 'negative'} /><Metric label="Trades" value={run.totalTrades} /><Metric label="Win rate" value={`${run.winRate}%`} /><Metric label="Average return" value={`${run.averageReturn}%`} tone={run.averageReturn >= 0 ? 'positive' : 'negative'} /><Metric label="Max drawdown" value={`${run.maxDrawdown}%`} tone="negative" /><Metric label="Profit factor" value={run.profitFactor ?? '∞'} /></div><div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4"><Metric label="Winning trades" value={run.winningTrades} tone="positive" /><Metric label="Losing trades" value={run.losingTrades} tone="negative" /><Metric label="Average holding" value={`${run.averageHoldingPeriod} days`} /><Metric label="Estimated fees" value={formatCurrency(run.totalFees)} /></div><div className="overflow-x-auto mt-7 border-t border-gray-100 dark:border-gray-700 pt-5"><h3 className="font-black mb-3">Trade Audit Trail</h3>{run.trades?.length ? <table className="w-full text-sm"><thead className="bg-gray-50 dark:bg-slate-700/30 text-xs uppercase text-gray-400"><tr><th className="text-left p-3">Entry</th><th className="text-left p-3">Exit</th><th className="text-right p-3">Quantity</th><th className="text-right p-3">P&L</th><th className="text-right p-3">Return</th><th className="text-left p-3">Exit</th></tr></thead><tbody>{run.trades.map((trade: any, index: number) => <tr key={index} className="border-t border-gray-100 dark:border-gray-700"><td className="p-3">{new Date(trade.entryDate).toLocaleDateString('en-IN')}<br /><b>{formatCurrency(trade.entryPrice)}</b></td><td className="p-3">{new Date(trade.exitDate).toLocaleDateString('en-IN')}<br /><b>{formatCurrency(trade.exitPrice)}</b></td><td className="p-3 text-right">{trade.quantity}</td><td className={cn('p-3 text-right font-bold', trade.pnl >= 0 ? 'text-emerald-600' : 'text-red-500')}>{formatCurrency(trade.pnl)}</td><td className={cn('p-3 text-right font-bold', trade.returnPercent >= 0 ? 'text-emerald-600' : 'text-red-500')}>{trade.returnPercent}%</td><td className="p-3"><span className="text-xs font-bold">{trade.exitReason.replace('_', ' ')}</span></td></tr>)}</tbody></table> : <p className="text-sm text-gray-500">No qualifying trades were produced for this period.</p>}</div></> : <p className="text-sm text-gray-500 mt-6">Select a stock and run both portfolios to see the comparison.</p>}</section>
    </main></div>;
}
