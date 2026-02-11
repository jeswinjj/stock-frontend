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
                <div className="bg-white p-4 border border-gray-100 shadow-xl rounded-2xl animate-in fade-in zoom-in duration-200">
                    <p className="font-bold text-gray-900 border-b border-gray-50 pb-2 mb-2">{stock.name} ({stock.symbol})</p>
                    <div className="space-y-1.5">
                        <div className="flex justify-between gap-8 text-xs">
                            <span className="text-gray-500 font-medium">Invested:</span>
                            <span className="font-bold text-gray-900">{maskValue(stock.invested)}</span>
                        </div>
                        <div className="flex justify-between gap-8 text-xs">
                            <span className="text-gray-500 font-medium">Current:</span>
                            <span className="font-bold text-blue-600">{maskValue(stock.currentValue)}</span>
                        </div>
                        <div className="flex justify-between gap-8 text-sm pt-1 border-t border-gray-50 mt-1">
                            <span className="text-gray-900 font-bold font-semibold uppercase tracking-wider text-[10px]">P/L:</span>
                            <span className={cn("font-extrabold", isProfit ? "text-green-600" : "text-red-600")}>
                                {hideBalance ? "XXXXX" : (pnl >= 0 ? "+" : "") + formatCurrency(pnl)} ({formatPercentage(stock.pnlPercentage)})
                            </span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    // Calculate height based on number of stocks to make it scrollable in container
    const chartHeight = Math.max(400, data.length * 45);

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex gap-4 px-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                        <div className="w-3 h-3 bg-[#3B82F6] rounded-sm" /> Invested
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                        <div className="w-3 h-3 bg-[#10B981] rounded-sm" /> Profit
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                        <div className="w-3 h-3 bg-[#EF4444] rounded-sm" /> Loss
                    </div>
                </div>
            </div>

            <div className="bg-gray-50/30 rounded-3xl p-4 md:p-6 border border-gray-100/50">
                <div
                    className="overflow-y-auto pr-2 custom-scrollbar"
                    style={{ maxHeight: '600px' }}
                >
                    <div style={{ height: `${chartHeight}px`, width: '100%', minWidth: '400px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                barGap={0}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                <XAxis
                                    type="number"
                                    hide={hideBalance}
                                    tickFormatter={(val) => hideBalance ? "XXXXX" : `₹${val / 1000}k`}
                                    tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    dataKey="displayName"
                                    type="category"
                                    tick={{ fontSize: 11, fill: '#1E293B', fontWeight: 700 }}
                                    width={60}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F1F5F9' }} />

                                <Bar dataKey="base" stackId="a" fill="#3B82F6" radius={[0, 0, 0, 0]} barSize={24} />
                                <Bar dataKey="profitSegment" stackId="a" fill="#10B981" radius={[0, 6, 6, 0]} />
                                <Bar dataKey="lossSegment" stackId="a" fill="#EF4444" radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            <p className="text-[10px] text-gray-400 font-medium text-center uppercase tracking-widest">
                Amounts in ₹ • Proportional Scaling enabled
            </p>
        </div>
    );
};
