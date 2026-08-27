'use client';
import { formatCurrency, formatPercentage, cn } from "@/lib/utils";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ChevronUp, ChevronDown, ExternalLink } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

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
    lastUpdatedAt?: string;
    dayChange?: number;
    dayChangePercent?: number;
    isCorporateActionAdjusted?: boolean;
    corporateActionHistory?: { actionType: string; actionDate: string; description: string; }[];
}

interface PortfolioTableProps {
    stocks: Stock[];
    onSell: (stock: Stock) => void;
    onAddMore: (stock: Stock) => void;
    onView: (stock: Stock) => void;
    onSort: (column: string) => void;
    sortConfig: { column: string; order: 'asc' | 'desc' };
}

export const PortfolioTable = ({ stocks, onSell, onAddMore, onView, onSort, sortConfig }: PortfolioTableProps) => {
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
            {/* Desktop Table View */}
            <table className="hidden md:table w-full text-left border-collapse text-sm">
                <thead className="sticky top-0 bg-white dark:bg-slate-800 z-10 shadow-sm transition-colors duration-300">
                    <tr className="border-b border-gray-100 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <th className="px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors" onClick={() => onSort('name')}>
                            Stock {renderSortArrow('name')}
                        </th>
                        <th className="px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors" onClick={() => onSort('qty')}>
                            Qty {renderSortArrow('qty')}
                        </th>
                        <th className="px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors" onClick={() => onSort('averagePrice')}>
                            Avg Price {renderSortArrow('averagePrice')}
                        </th>
                        <th className="px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors" onClick={() => onSort('ltp')}>
                            LTP {renderSortArrow('ltp')}
                        </th>
                        <th className="px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors" onClick={() => onSort('pl')}>
                            P&L (%) {renderSortArrow('pl')}
                        </th>
                        <th className="px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors" onClick={() => onSort('currentValue')}>
                            Current Value {renderSortArrow('currentValue')}
                        </th>
                        <th className="px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors" onClick={() => onSort('realizedPL')}>
                            Realized P&L {renderSortArrow('realizedPL')}
                        </th>
                        <th className="px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors" onClick={() => onSort('lastUpdatedAt')}>
                            Last Updated {renderSortArrow('lastUpdatedAt')}
                        </th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800 bg-white dark:bg-slate-800 transition-colors duration-300">
                    {stocks.map((stock: any) => {
                        const plPercentage = stock.pnlPercentage ?? (((stock.currentPrice - stock.averagePrice) / stock.averagePrice) * 100);
                        const isProfit = stock.unrealizedPL >= 0;
                        const isDayUp = (stock.dayChange || 0) >= 0;

                        return (
                            <tr key={stock.symbol} className={getRowClass(stock)}>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/dashboard/stocks/${stock.symbol}`}
                                            className="font-bold text-gray-900 dark:text-white text-base hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1 group-hover:underline"
                                        >
                                            <span>{stock.symbol}</span>
                                            <ExternalLink size={13} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </Link>
                                        {stock.isCorporateActionAdjusted && (
                                            <span
                                                className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 cursor-help"
                                                title={stock.corporateActionHistory?.map((h: any) => `${h.actionType} (${dayjs(h.actionDate).format('DD MMM YYYY')}): ${h.description}`).join('\n')}
                                            >
                                                CA
                                            </span>
                                        )}
                                    </div>
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
                                    {stock.lastUpdatedAt ? dayjs(stock.lastUpdatedAt).fromNow() : 'Never'}
                                </td>
                                <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                    <button
                                        onClick={() => onView(stock)}
                                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700"
                                    >
                                        Target
                                    </button>
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

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700/50">
                {stocks.map((stock: any) => {
                    const plPercentage = ((stock.currentPrice - stock.averagePrice) / stock.averagePrice) * 100;
                    const isProfit = stock.unrealizedPL >= 0;
                    const isDayUp = (stock.dayChange || 0) >= 0;

                    return (
                        <div key={stock.symbol} className="p-4 bg-white dark:bg-slate-800 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-black text-gray-900 dark:text-white leading-tight">{stock.symbol}</h3>
                                        {stock.isCorporateActionAdjusted && (
                                            <span
                                                className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 cursor-help"
                                                title={stock.corporateActionHistory?.map((h: any) => `${h.actionType} (${dayjs(h.actionDate).format('DD MMM YYYY')}): ${h.description}`).join('\n')}
                                            >
                                                CA
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate max-w-[150px]">{stock.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-base font-black text-gray-900 dark:text-white">{maskValue(stock.currentValue)}</p>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider">Market Value</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 py-3 border-y border-gray-50 dark:border-gray-700/30">
                                <div>
                                    <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mb-0.5">Holding Details</p>
                                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                        {stock.totalQuantity} Shares @ {maskValue(stock.averagePrice)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mb-0.5">Unrealized P&L</p>
                                    <p className={cn("text-xs font-black", isProfit ? "text-green-500" : "text-red-500")}>
                                        {isProfit ? '+' : ''}{maskValue(stock.unrealizedPL)} ({plPercentage.toFixed(2)}%)
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mb-0.5">Price (LTP)</p>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{maskValue(stock.currentPrice)}</span>
                                        <span className={cn("text-[10px] font-black", isDayUp ? "text-green-500" : "text-red-500")}>
                                            {isDayUp ? '▲' : '▼'} {Math.abs(stock.dayChangePercent || 0).toFixed(2)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mb-0.5">Status</p>
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                                        {stock.lastUpdatedAt ? dayjs(stock.lastUpdatedAt).fromNow() : '—'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => onView(stock)}
                                    className="flex-1 py-2 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all"
                                >
                                    Target
                                </button>
                                <button
                                    onClick={() => onAddMore(stock)}
                                    className="flex-1 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-sm active:scale-95 transition-all"
                                >
                                    Buy
                                </button>
                                <button
                                    onClick={() => onSell(stock)}
                                    className="flex-1 py-2 rounded-xl text-xs font-bold border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95 transition-all"
                                >
                                    Sell
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
