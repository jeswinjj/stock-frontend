'use client';
import { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Legend
} from 'recharts';
import { formatCurrency, formatPercentage, cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface StockPerformance {
    symbol: string;
    name: string;
    invested: number;
    currentValue: number;
    profit: number;
    loss: number;
    pnlPercentage: number;
}

interface StockPerformanceChartProps {
    data: StockPerformance[];
}

export const StockPerformanceChart = ({ data }: StockPerformanceChartProps) => {
    const { hideBalance } = useAuth();

    const chartData = useMemo(() => {
        return data.map(stock => ({
            ...stock,
            base: Math.min(stock.invested, stock.currentValue),
            // We keep profit and loss separate for stacking colors
            profitSegment: stock.profit,
            lossSegment: stock.loss,
            displayName: stock.symbol
        }));
    }, [data]);

    const maskValue = (val: number) => hideBalance ? "₹ XXXXX" : formatCurrency(val);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const stock = payload[0].payload;
            const isProfit = stock.currentValue >= stock.invested;
            const pnl = stock.currentValue - stock.invested;

            return (
                <div className="bg-white dark:bg-slate-800 p-4 border border-gray-100 dark:border-gray-700 shadow-xl rounded-2xl animate-in fade-in zoom-in duration-200">
                    <p className="font-bold text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-700 pb-2 mb-2">{stock.name} ({stock.symbol})</p>
                    <div className="space-y-1.5">
                        <div className="flex justify-between gap-8 text-xs">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Invested:</span>
                            <span className="font-bold text-gray-900 dark:text-white">{maskValue(stock.invested)}</span>
                        </div>
                        <div className="flex justify-between gap-8 text-xs">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Current:</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">{maskValue(stock.currentValue)}</span>
                        </div>
                        <div className="flex justify-between gap-8 text-sm pt-1 border-t border-gray-50 dark:border-gray-700 mt-1">
                            <span className="text-gray-900 dark:text-white font-bold font-semibold uppercase tracking-wider text-[10px]">P/L:</span>
                            <span className={cn("font-extrabold", isProfit ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                                {hideBalance ? "XXXXX" : (pnl >= 0 ? "+" : "") + formatCurrency(pnl)} ({formatPercentage(stock.pnlPercentage)})
                            </span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    // Calculate width based on number of stocks to make it scrollable horizontally in container
    const chartWidth = Math.max(500, data.length * 60);

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex gap-4 px-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400">
                        <div className="w-3 h-3 bg-[#3B82F6] rounded-sm" /> Invested
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400">
                        <div className="w-3 h-3 bg-[#10B981] rounded-sm" /> Profit
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400">
                        <div className="w-3 h-3 bg-[#EF4444] rounded-sm" /> Loss
                    </div>
                </div>
            </div>

            <div className="bg-gray-50/30 dark:bg-slate-900/30 rounded-3xl p-2 md:p-6 border border-gray-100/50 dark:border-gray-700/50">
                <div
                    className="overflow-x-auto pb-4 custom-scrollbar"
                >
                    <div style={{ height: '400px', width: `${chartWidth}px` }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                layout="horizontal"
                                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                barGap={0}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                                <XAxis
                                    dataKey="displayName"
                                    type="category"
                                    tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 700 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    type="number"
                                    hide={hideBalance}
                                    tickFormatter={(val) => hideBalance ? "XXXXX" : `₹${val / 1000}k`}
                                    tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={{ fill: 'var(--tooltip-cursor, #F1F5F9)', opacity: 0.1 }}
                                />

                                <Bar dataKey="base" stackId="a" fill="#3B82F6" radius={[0, 0, 0, 0]} barSize={30} />
                                <Bar dataKey="profitSegment" stackId="a" fill="#10B981" radius={[6, 6, 0, 0]} />
                                <Bar dataKey="lossSegment" stackId="a" fill="#EF4444" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-600 font-medium text-center uppercase tracking-widest">
                Amounts in ₹ • Proportional Scaling enabled
            </p>
        </div>
    );
};
