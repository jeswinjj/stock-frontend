'use client';
import { useState, useEffect } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
    ComposedChart
} from 'recharts';
import { formatCurrency, cn } from "@/lib/utils";
import api from '@/services/api';
import { Button } from '../ui/BaseComponents';
import { Minus, Plus, ChevronUp, ChevronDown } from 'lucide-react';

interface HistoryData {
    date: string;
    totalInvested: number;
    currentValue: number;
    totalPL: number;
    dayChange: number;
}

export const PortfolioHistoryChart = () => {
    const [data, setData] = useState<HistoryData[]>([]);
    const [range, setRange] = useState<'1D' | '1M' | '3M' | '1Y' | 'ALL'>('1M');
    const [loading, setLoading] = useState(true);
    const [isMinimized, setIsMinimized] = useState(true);

    useEffect(() => {
        if (isMinimized) return;

        const fetchHistory = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/portfolio/history?range=${range}`);
                setData(response.data);
            } catch (error) {
                console.error('Failed to fetch history:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [range, isMinimized]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-slate-800 p-4 border border-gray-100 dark:border-gray-700 shadow-xl rounded-2xl animate-in fade-in zoom-in duration-200">
                    <p className="font-bold text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-700 pb-2 mb-2">
                        {new Date(label).toLocaleDateString(undefined, {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        })}
                    </p>
                    <div className="space-y-1.5">
                        <div className="flex justify-between gap-8 text-xs">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Invested:</span>
                            <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(payload[0].payload.totalInvested)}</span>
                        </div>
                        <div className="flex justify-between gap-8 text-xs">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Current:</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(payload[0].payload.currentValue)}</span>
                        </div>
                        <div className="flex justify-between gap-8 text-xs pt-1 border-t border-gray-50 dark:border-gray-700 mt-1">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">P/L:</span>
                            <span className={cn("font-bold", payload[0].payload.totalPL >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                                {formatCurrency(payload[0].payload.totalPL)}
                            </span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div
            className={cn(
                "bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all duration-300 ease-in-out overflow-hidden",
                isMinimized ? "p-4 h-auto" : "p-6 md:p-8 h-auto"
            )}
        >
            <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => setIsMinimized(prev => !prev)}
            >
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Portfolio Performance</h2>
                    {!isMinimized && (
                        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wider animate-in fade-in duration-300">
                            Historical Value & Growth
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {!isMinimized && (
                        <div
                            className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl animate-in fade-in slide-in-from-right-4 duration-300"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {(['1D', '1M', '3M', '1Y', 'ALL'] as const).map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setRange(r)}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200",
                                        range === r
                                            ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                                            : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                    )}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    )}

                    <button
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                        aria-label={isMinimized ? "Maximize" : "Minimize"}
                    >
                        {isMinimized ? <Plus size={20} /> : <Minus size={20} />}
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <div className="mt-8 h-[400px] w-full animate-in fade-in duration-500">
                    {loading ? (
                        <div className="h-full w-full flex items-center justify-center text-gray-400 dark:text-gray-500 font-medium animate-pulse">
                            Loading history...
                        </div>
                    ) : data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(str) => {
                                        const date = new Date(str);
                                        return range === '1D'
                                            ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                            : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                                    }}
                                    tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }}
                                    axisLine={false}
                                    tickLine={false}
                                    minTickGap={30}
                                />
                                <YAxis
                                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                                    tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }}
                                    axisLine={false}
                                    tickLine={false}
                                    domain={['auto', 'auto']}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3B82F6', strokeWidth: 2, strokeDasharray: '5 5' }} />
                                <Area
                                    type="monotone"
                                    dataKey="currentValue"
                                    stroke="#3B82F6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorValue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 font-medium">
                            <p>No history data available yet.</p>
                            <p className="text-xs mt-2 opacity-70">Refresh prices to generate your first snapshot.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
