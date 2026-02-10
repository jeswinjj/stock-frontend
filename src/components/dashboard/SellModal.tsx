'use client';
import { useState, useEffect } from 'react';
import { Button, Input } from '../ui/BaseComponents';
import { AlertCircle } from 'lucide-react';

interface SellModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    stock: any;
}

export const SellModal = ({ isOpen, onClose, onSubmit, stock }: SellModalProps) => {
    const [formData, setFormData] = useState({
        symbol: '',
        price: '',
        quantity: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (stock) {
            setFormData(prev => ({ ...prev, symbol: stock.symbol }));
        }
    }, [stock]);

    if (!isOpen || !stock) return null;

    const handleSubmit = () => {
        const qty = parseInt(formData.quantity);
        if (qty > stock.totalQuantity) {
            setError(`Cannot sell more than owned (${stock.totalQuantity} shares)`);
            return;
        }
        if (qty <= 0) {
            setError('Quantity must be greater than 0');
            return;
        }
        setError('');
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">Sell {stock.symbol}</h3>
                        <p className="text-sm text-gray-500">Currently owning: {stock.totalQuantity} shares</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 text-sm font-medium">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                <div className="space-y-5">
                    <div>
                        <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Sell Quantity</label>
                        <Input
                            type="number"
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            placeholder={`Max: ${stock.totalQuantity}`}
                            className="bg-gray-50 border-gray-200 focus:bg-white transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Sell Price (₹)</label>
                        <Input
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            placeholder={`Current LTP: ${stock.currentPrice}`}
                            className="bg-gray-50 border-gray-200 focus:bg-white transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Sell Date</label>
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
                        <Button className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white font-bold" onClick={handleSubmit}>
                            Sell Stock
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
