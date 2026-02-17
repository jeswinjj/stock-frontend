'use client';
import { formatCurrency, formatPercentage, cn } from "@/lib/utils";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

dayjs.extend(relativeTime);

interface Stock {
    symbol: string;
    name: string;
    totalQuantity: number;
    averagePrice: number;
    currentPrice: number;
    unrealizedPL: number;
    currentValue: number;
    invested_amount?: number;
    realized_pl?: number;
    last_updated_at?: string;
    dayChange?: number;
    dayChangePercent?: number;
}

interface PortfolioTableProps {
    stocks: Stock[];
    onSell: (stock: Stock) => void;
    onAddMore: (stock: Stock) => void;
    onSort: (column: string) => void;
    sortConfig: { column: string; order: 'asc' | 'desc' };
}

export const PortfolioTable = ({ stocks, onSell, onAddMore, onSort, sortConfig }: PortfolioTableProps) => {
    const { hideBalance } = useAuth();

    const renderSortArrow = (column: string) => {
        if (sortConfig.column !== column) return null;
        return sortConfig.order === 'asc' ? <ChevronUp size={14} className="inline ml-1 text-blue-500" /> : <ChevronDown size={14} className="inline ml-1 text-blue-500" />;
    };

    const maskValue = (value: number) => hideBalance ? "XXXXX" : formatCurrency(value);

    // Helper to determine row background based on performance
    const getRowClass = (stock: Stock) => {
        // Optional: add conditional styling based on performance
        return "hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group border-b border-gray-50 dark:border-gray-700/50 last:border-0";
    };

    return (
        <div className="overflow-x-auto max-h-[600px] scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-600">
            <table className="w-full text-left border-collapse text-sm">
                <thead className="sticky top-0 bg-white dark:bg-slate-800 z-10 shadow-sm transition-colors duration-300">
                    <tr className="border-b border-gray-100 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <th
                            className="px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                            onClick={() => onSort('name')}
                        >
                            Stock {renderSortArrow('name')}
                        </th>
                        <th className="px-6 py-4">Qty</th>
                        <th className="px-6 py-4">Avg Price</th>
                        <th className="px-6 py-4">LTP</th>
                        <th
                            className="px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                            onClick={() => onSort('pl')}
                        >
                            P&L (%) {renderSortArrow('pl')}
                        </th>
                        <th className="px-6 py-4">Current Value</th>
                        <th className="px-6 py-4">Realized P&L</th>
                        <th className="px-6 py-4">Last Updated</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800 bg-white dark:bg-slate-800 transition-colors duration-300">
                    {stocks.map((stock: any) => {
                        const plPercentage = ((stock.currentPrice - stock.averagePrice) / stock.averagePrice) * 100;
                        const isProfit = stock.unrealizedPL >= 0;
                        const isDayUp = (stock.dayChange || 0) >= 0;

                        return (
                            <tr key={stock.symbol} className={getRowClass(stock)}>
                                <td className="px-6 py-4">
                                    <span className="font-bold text-gray-900 dark:text-white block text-base">{stock.symbol}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{stock.name}</span>
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">{stock.totalQuantity}</td>
                                <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">{maskValue(stock.averagePrice)}</td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900 dark:text-white">{maskValue(stock.currentPrice)}</div>
                                    <div className={cn("text-[11px] font-bold mt-0.5", isDayUp ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                                        {isDayUp ? '+' : ''}{stock.dayChangePercent?.toFixed(2)}%
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={cn(
                                        "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ring-1 ring-inset",
                                        isProfit
                                            ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 ring-green-600/20 dark:ring-green-500/30"
                                            : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 ring-red-600/20 dark:ring-red-500/30"
                                    )}>
                                        {hideBalance ? "XXXXX" : formatCurrency(stock.unrealizedPL)} ({formatPercentage(plPercentage)})
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{maskValue(stock.currentValue)}</td>
                                <td className="px-6 py-4">
                                    <span className={cn("text-sm font-medium", stock.realizedPL >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                                        {maskValue(stock.realizedPL || 0)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-400 dark:text-gray-500">
                                    {stock.last_updated_at ? dayjs(stock.last_updated_at).fromNow() : 'Never'}
                                </td>
                                <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                    <button
                                        onClick={() => onAddMore(stock)}
                                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all border border-blue-100 dark:border-blue-800/50"
                                    >
                                        Add More
                                    </button>
                                    <button
                                        onClick={() => onSell(stock)}
                                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all border border-red-100 dark:border-red-800/50"
                                    >
                                        Sell
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
