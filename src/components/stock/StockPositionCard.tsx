'use client';
import { formatCurrency, formatPercentage, cn } from '@/lib/utils';
import { Button } from '@/components/ui/BaseComponents';
import { Briefcase, Plus, ShoppingBag, Target, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface TargetPrice {
    _id: string;
    price: number;
    createdAt: string;
}

interface Position {
    id: string;
    symbol: string;
    name: string;
    totalQuantity: number;
    averagePrice: number;
    investedAmount: number;
    currentPrice: number;
    currentValue: number;
    unrealizedPL: number;
    pnlPercentage: number;
    realizedPL: number;
    targets: TargetPrice[];
}

interface StockPositionCardProps {
    symbol: string;
    name: string;
    currentPrice: number;
    position: Position | null;
    onBuy: () => void;
    onSell: () => void;
    onAddTarget: () => void;
}

export function StockPositionCard({
    symbol,
    name,
    currentPrice,
    position,
    onBuy,
    onSell,
    onAddTarget
}: StockPositionCardProps) {
    const { hideBalance } = useAuth();

    const mask = (val: number) => (hideBalance ? 'XXXXX' : formatCurrency(val));

    if (!position) {
        return (
            <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors duration-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-bold text-sm">
                        <Briefcase size={18} className="text-gray-400" />
                        <span>Portfolio Position</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">Not in your portfolio</h3>
                    <p className="text-sm font-medium text-gray-400 dark:text-gray-500 mt-1">
                        You currently do not hold any shares of {symbol}.
                    </p>
                </div>
                <Button
                    onClick={onBuy}
                    className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md hover:shadow-lg active:scale-95 text-base w-full sm:w-auto"
                >
                    <Plus size={18} className="mr-2" /> Add to Portfolio
                </Button>
            </div>
        );
    }

    const isProfit = position.unrealizedPL >= 0;

    return (
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors duration-300 space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700/60 pb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        <Briefcase size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">YOUR POSITION</h3>
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">Active holding in your portfolio</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={onAddTarget}
                        className="h-10 px-3 md:px-4 rounded-xl border-purple-200 dark:border-purple-900/50 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 font-bold text-xs md:text-sm"
                    >
                        <Target size={15} className="mr-1.5" /> Target
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onSell}
                        className="h-10 px-3 md:px-4 rounded-xl border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold text-xs md:text-sm"
                    >
                        <ShoppingBag size={15} className="mr-1.5" /> Sell
                    </Button>
                    <Button
                        onClick={onBuy}
                        className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm"
                    >
                        <Plus size={15} className="mr-1.5" /> Buy More
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-gray-50 dark:bg-slate-700/30 p-4 rounded-2xl">
                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Quantity</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white mt-1 block">{position.totalQuantity}</span>
                </div>

                <div className="bg-gray-50 dark:bg-slate-700/30 p-4 rounded-2xl">
                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Avg Price</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white mt-1 block">{mask(position.averagePrice)}</span>
                </div>

                <div className="bg-gray-50 dark:bg-slate-700/30 p-4 rounded-2xl">
                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Invested</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white mt-1 block">{mask(position.investedAmount)}</span>
                </div>

                <div className="bg-gray-50 dark:bg-slate-700/30 p-4 rounded-2xl">
                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Current Value</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white mt-1 block">{mask(position.currentValue)}</span>
                </div>

                <div className="bg-gray-50 dark:bg-slate-700/30 p-4 rounded-2xl">
                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Unrealized P&L</span>
                    <div className={cn(
                        "text-lg font-bold mt-1 flex items-center gap-1",
                        isProfit ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    )}>
                        {isProfit ? '+' : ''}{mask(position.unrealizedPL)}
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-slate-700/30 p-4 rounded-2xl">
                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Return %</span>
                    <div className={cn(
                        "text-lg font-bold mt-1 flex items-center gap-1",
                        isProfit ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    )}>
                        {isProfit ? '+' : ''}{position.pnlPercentage.toFixed(2)}%
                    </div>
                </div>
            </div>

            {/* Target Prices */}
            {position.targets && position.targets.length > 0 && (
                <div className="pt-2">
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-2">
                        Target Prices
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {position.targets.map((tgt, idx) => {
                            const isReached = currentPrice >= tgt.price;
                            return (
                                <div
                                    key={tgt._id || idx}
                                    className={cn(
                                        "px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2",
                                        isReached
                                            ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
                                            : "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400"
                                    )}
                                >
                                    <Target size={14} />
                                    <span>Target {idx + 1}: {formatCurrency(tgt.price)}</span>
                                    {isReached && <span className="text-[10px] uppercase font-extrabold bg-green-200 dark:bg-green-800 px-1.5 py-0.5 rounded">Reached</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
