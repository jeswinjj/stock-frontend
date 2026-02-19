'use client';
import { useState } from 'react';
import { Button, Input } from '@/components/ui/BaseComponents';
import { X } from 'lucide-react';
import api from '@/services/api';

interface AddFundsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AddFundsModal = ({ isOpen, onClose, onSuccess }: AddFundsModalProps) => {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api.post('/wallet/add-funds', { amount });
            onSuccess();
            onClose();
            setAmount('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to add funds');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Add Funds</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <X size={20} className="text-gray-400 dark:text-gray-500" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Amount (₹)</label>
                        <Input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount"
                            className="bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-slate-900 dark:text-white text-lg font-bold"
                            autoFocus
                        />
                        {error && <p className="text-red-500 text-sm mt-2 font-medium">{error}</p>}
                    </div>

                    <div className="flex gap-4">
                        <Button variant="outline" className="flex-1 h-12 font-bold" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white font-bold border-none"
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? 'Adding...' : 'Add Funds'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
