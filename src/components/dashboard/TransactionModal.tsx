'use client';
import { useState, useEffect } from 'react';
import { Button, Input } from '../ui/BaseComponents';
import { X } from 'lucide-react';
import api from '@/services/api';
import { cn } from '@/lib/utils';
import { StockAutocomplete } from './StockAutocomplete';


interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
    isLoading?: boolean;
}

export const TransactionModal = ({ isOpen, onClose, onSubmit, initialData, isLoading }: TransactionModalProps) => {
    const [balance, setBalance] = useState<number>(0);
    const [formData, setFormData] = useState({
        symbol: '',
        name: '',
        price: '',
        quantity: '',
        type: 'BUY',
        date: new Date().toISOString().split('T')[0]
    });


    useEffect(() => {
        if (isOpen) {
            // Fetch wallet balance when modal opens
            api.get('/wallet')
                .then(res => setBalance(parseFloat(res.data.balance)))
                .catch(err => console.error('Failed to fetch wallet:', err));

            // Reset form data when opening
            setFormData({
                symbol: initialData?.symbol || '',
                name: initialData?.name || '',
                price: '',
                quantity: '',
                type: 'BUY',
                date: new Date().toISOString().split('T')[0]
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const totalCost = (parseFloat(formData.price) || 0) * (parseInt(formData.quantity) || 0);
    const isInsufficientFunds = totalCost > balance;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-200 transition-colors">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {initialData ? `Add More ${initialData.symbol}` : 'Add New Stock'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">
                            Wallet Balance: <span className="text-gray-900 dark:text-white font-bold">₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors" disabled={isLoading}>
                        <X size={20} className="text-gray-400 dark:text-gray-500" />
                    </button>
                </div>

                <div className="space-y-5">
                    {!initialData && (
                        <div>
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Stock Symbol (NSE)</label>
                            <StockAutocomplete
                                value={formData.symbol}
                                onChange={(symbol, name) => {
                                    setFormData({ ...formData, symbol, name: name || formData.name } as any);
                                }}
                                placeholder="Search by symbol or name..."
                                disabled={isLoading}
                                className="w-full"
                            />
                        </div>

                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Buy Price (₹)</label>
                            <Input
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                placeholder="0.00"
                                disabled={isLoading}
                                className="bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-slate-900 dark:text-white transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Quantity</label>
                            <Input
                                type="number"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                placeholder="0"
                                disabled={isLoading}
                                className="bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-slate-900 dark:text-white transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Purchase Date</label>
                        <Input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            disabled={isLoading}
                            className="bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-slate-900 dark:text-white transition-all"
                        />
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-900 p-3 rounded-lg border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Cost</span>
                        <span className={cn("font-bold", isInsufficientFunds ? "text-red-500" : "text-gray-900 dark:text-white")}>
                            ₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    {isInsufficientFunds && (
                        <p className="text-xs text-red-500 font-bold text-center">Insufficient wallet balance</p>
                    )}

                    <div className="flex gap-4 pt-2">
                        <Button variant="outline" className="flex-1 h-12 text-gray-600 dark:text-gray-300 font-bold" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button
                            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold border-none disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => onSubmit(formData)}
                            disabled={isInsufficientFunds || totalCost <= 0 || isLoading}
                        >
                            {isLoading ? 'Processing...' : 'Confirm'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
