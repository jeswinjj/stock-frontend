'use client';
import { useState, useEffect, useRef } from 'react';
import { Input } from '../ui/BaseComponents';
import api from '@/services/api';
import { cn } from '@/lib/utils';
import { Search, Loader2 } from 'lucide-react';

interface Stock {
    symbol: string;
    name: string;
    series: string;
}

interface StockAutocompleteProps {
    value: string;
    onChange: (symbol: string, name?: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export const StockAutocomplete = ({ value, onChange, placeholder, disabled, className }: StockAutocompleteProps) => {
    const [query, setQuery] = useState(value);
    const [suggestions, setSuggestions] = useState<Stock[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setQuery(value);
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchStocks = async () => {
            if (query.length < 1) {
                setSuggestions([]);
                return;
            }

            setIsLoading(true);
            try {
                const response = await api.get(`/stocks/search?q=${query}`);
                setSuggestions(response.data);
                setIsOpen(true);
            } catch (err) {
                console.error('Failed to fetch stocks:', err);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchStocks, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSelect = (stock: Stock) => {
        setQuery(stock.symbol);
        onChange(stock.symbol, stock.name);
        setIsOpen(false);
    };

    return (
        <div className={cn("relative", className)} ref={containerRef}>
            <div className="relative">
                <Input
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value.toUpperCase());
                        onChange(e.target.value.toUpperCase());
                    }}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="pl-10 uppercase transition-all duration-300 focus:ring-blue-500/20"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {isLoading ? <Loader2 size={16} className="animate-spin text-blue-500" /> : <Search size={16} />}
                </div>
            </div>

            {isOpen && suggestions.length > 0 && (
                <div className="absolute z-[100] w-full mt-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {suggestions.map((stock) => (
                            <button
                                key={stock.symbol}
                                onClick={() => handleSelect(stock)}
                                className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-between group"
                            >
                                <div>
                                    <span className="font-bold text-gray-900 dark:text-white block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {stock.symbol}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                        {stock.name}
                                    </span>
                                </div>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 rounded-md uppercase tracking-wider">
                                    {stock.series}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
