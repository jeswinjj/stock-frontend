'use client';
import { useState, useRef, useEffect } from 'react';
import { Bell, Target, TrendingUp, AlertCircle } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

interface TargetPrice {
    _id: string;
    price: number;
    createdAt: string;
}

interface Stock {
    id: string;
    symbol: string;
    name: string;
    currentPrice: number;
    targets: TargetPrice[];
}

interface StockNotificationProps {
    stocks: Stock[];
}

export function StockNotification({ stocks }: StockNotificationProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter stocks that are near or have reached their target
    const notifications = stocks.flatMap(stock => {
        if (!stock.targets || stock.targets.length === 0) return [];

        // Sort targets to correctly identify Target 1, 2, 3
        const sortedTargets = [...stock.targets].sort((a, b) => a.price - b.price);

        return sortedTargets
            .map((target, index) => ({ target, index }))
            .filter(({ target }) => stock.currentPrice >= target.price * 0.95)
            .map(({ target, index }) => ({
                stockId: stock.id,
                symbol: stock.symbol,
                name: stock.name,
                currentPrice: stock.currentPrice,
                targetPrice: target.price,
                targetLabel: `Target ${index + 1}`,
                isReached: stock.currentPrice >= target.price,
                proximity: ((stock.currentPrice / target.price) * 100).toFixed(1)
            }));
    }).sort((a, b) => {
        // Sort by reached first, then proximity
        if (a.isReached && !b.isReached) return -1;
        if (!a.isReached && b.isReached) return 1;
        return parseFloat(b.proximity) - parseFloat(a.proximity);
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "relative h-11 w-11 md:h-12 md:w-12 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 transition-all shadow-sm",
                    isOpen 
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400" 
                        : "bg-white dark:bg-slate-800 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                )}
            >
                <Bell size={20} className={cn(notifications.length > 0 && !isOpen && "animate-bounce-slow")} />
                {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                        {notifications.length}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-[60] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="p-4 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Target size={16} className="text-blue-500" />
                            Target Alerts
                        </h3>
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                            {notifications.length} Active
                        </span>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto container-snap">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 dark:bg-slate-700/50 text-gray-300 dark:text-gray-600 mb-3">
                                    <Bell size={24} />
                                </div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No targets near yet.</p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">We'll notify you when a stock hits within 5% of your target.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                {notifications.map((note, idx) => (
                                    <div key={`${note.stockId}-${idx}`} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors cursor-default group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-gray-900 dark:text-white uppercase tracking-tight">{note.symbol}</span>
                                                    {note.isReached ? (
                                                        <span className="text-[9px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full font-bold">
                                                            TARGET HIT
                                                        </span>
                                                    ) : (
                                                        <span className="text-[9px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-full font-bold">
                                                            {note.proximity}% NEAR
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 truncate max-w-[150px]">{note.name}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-gray-900 dark:text-white">{formatCurrency(note.currentPrice)}</p>
                                                <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase">Current LTP</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between mt-3 bg-gray-50 dark:bg-slate-700/50 p-2 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "p-1.5 rounded-lg",
                                                    note.isReached ? "bg-green-100 dark:bg-green-900/30 text-green-600" : "bg-blue-100 dark:bg-blue-900/30 text-blue-600"
                                                )}>
                                                    <Target size={12} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase leading-none">{note.targetLabel} Price</p>
                                                    <p className="text-xs font-black text-gray-800 dark:text-white mt-1">{formatCurrency(note.targetPrice)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {notifications.length > 0 && (
                        <div className="p-3 bg-gray-50/80 dark:bg-slate-800/80 border-t border-gray-100 dark:border-gray-700 text-center">
                            <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center justify-center gap-2">
                                <AlertCircle size={10} />
                                Market prices may vary slightly
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
