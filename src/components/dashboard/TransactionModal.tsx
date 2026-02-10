'use client';
import { useState, useEffect } from 'react';
import { Button, Input } from '../ui/BaseComponents';
import { X } from 'lucide-react';

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
}

export const TransactionModal = ({ isOpen, onClose, onSubmit, initialData }: TransactionModalProps) => {
    const [formData, setFormData] = useState({
        symbol: '',
        price: '',
        quantity: '',
        type: 'BUY',
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                symbol: initialData.symbol || '',
                price: '', // Start empty for "Add More"
                quantity: '',
                type: 'BUY',
                date: new Date().toISOString().split('T')[0]
            });
        } else {
            setFormData({
                symbol: '',
                price: '',
                quantity: '',
                type: 'BUY',
                date: new Date().toISOString().split('T')[0]
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900">
                        {initialData ? `Add More ${initialData.symbol}` : 'Add New Stock'}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <div className="space-y-5">
                    {!initialData && (
                        <div>
                            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Stock Symbol (NSE)</label>
                            <Input
                                value={formData.symbol}
                                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                                placeholder="e.g. RELIANCE"
                                className="bg-gray-50 border-gray-200 focus:bg-white transition-all uppercase"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Buy Price (₹)</label>
                            <Input
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                placeholder="0.00"
                                className="bg-gray-50 border-gray-200 focus:bg-white transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Quantity</label>
                            <Input
                                type="number"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                placeholder="0"
                                className="bg-gray-50 border-gray-200 focus:bg-white transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Purchase Date</label>
                        <Input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="bg-gray-50 border-gray-200 focus:bg-white transition-all"
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button variant="outline" className="flex-1 h-12 text-gray-600 font-bold" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold" onClick={() => onSubmit(formData)}>
                            Confirm
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
