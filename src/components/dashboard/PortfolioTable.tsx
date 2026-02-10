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
        return sortConfig.order === 'asc' ? <ChevronUp size={14} className="inline ml-1" /> : <ChevronDown size={14} className="inline ml-1" />;
    };

    const maskValue = (value: number) => hideBalance ? "XXXXX" : formatCurrency(value);

    return (
        <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white z-10 shadow-sm">
                    <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <th
                            className="px-4 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => onSort('name')}
                        >
                            Stock {renderSortArrow('name')}
                        </th>
                        <th className="px-4 py-4">Qty</th>
                        <th className="px-4 py-4">Avg Price</th>
                        <th className="px-4 py-4">LTP</th>
                        <th
                            className="px-4 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => onSort('pl')}
                        >
                            P&L (%) {renderSortArrow('pl')}
                        </th>
                        <th className="px-4 py-4">Current Value</th>
                        <th className="px-4 py-4">Realized P&L</th>
                        <th className="px-4 py-4">Last Updated</th>
                        <th className="px-4 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {stocks.map((stock: any) => {
                        const plPercentage = ((stock.currentPrice - stock.averagePrice) / stock.averagePrice) * 100;
                        const isProfit = stock.unrealizedPL >= 0;
                        const isDayUp = (stock.dayChange || 0) >= 0;

                        return (
                            <tr key={stock.symbol} className="hover:bg-blue-50/30 transition-colors group">
                                <td className="px-4 py-4">
                                    <span className="font-bold text-gray-900 block">{stock.symbol}</span>
                                    <span className="text-xs text-gray-500">{stock.name}</span>
                                </td>
                                <td className="px-4 py-4 font-medium">{stock.totalQuantity}</td>
                                <td className="px-4 py-4 font-medium">{maskValue(stock.averagePrice)}</td>
                                <td className="px-4 py-4">
                                    <div className="font-medium text-blue-600">{maskValue(stock.currentPrice)}</div>
                                    <div className={cn("text-[10px] font-bold", isDayUp ? "text-green-600" : "text-red-600")}>
                                        {isDayUp ? '+' : ''}{stock.dayChangePercent?.toFixed(2)}%
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <span className={cn("inline-flex items-center px-2 py-1 rounded-md text-xs font-bold", isProfit ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                                        {hideBalance ? "XXXXX" : formatCurrency(stock.unrealizedPL)} ({formatPercentage(plPercentage)})
                                    </span>
                                </td>
                                <td className="px-4 py-4 font-semibold">{maskValue(stock.currentValue)}</td>
                                <td className="px-4 py-4">
                                    <span className={cn("text-sm font-medium", stock.realizedPL >= 0 ? "text-green-600" : "text-red-600")}>
                                        {maskValue(stock.realizedPL || 0)}
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-xs text-gray-400">
                                    {stock.last_updated_at ? dayjs(stock.last_updated_at).fromNow() : 'Never'}
                                </td>
                                <td className="px-4 py-4 text-right space-x-2">
                                    <button
                                        onClick={() => onAddMore(stock)}
                                        className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all border border-blue-100"
                                    >
                                        Add More
                                    </button>
                                    <button
                                        onClick={() => onSell(stock)}
                                        className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 transition-all border border-red-100"
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
