'use client';
import { useState, useEffect, useCallback, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { StockHeader } from '@/components/stock/StockHeader';
import { StockPositionCard } from '@/components/stock/StockPositionCard';
import { StockChart } from '@/components/stock/StockChart';
import { TechnicalAnalysis } from '@/components/stock/TechnicalAnalysis';
import { FundamentalAnalysis } from '@/components/stock/FundamentalAnalysis';
import { StockAnalysis } from '@/components/stock/StockAnalysis';
import { TransactionModal } from '@/components/dashboard/TransactionModal';
import { SellModal } from '@/components/dashboard/SellModal';
import { StockDetailsModal } from '@/components/dashboard/StockDetailsModal';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function StockDetailPage({ params }: { params: Promise<{ symbol: string }> }) {
    const resolvedParams = use(params);
    const rawSymbol = resolvedParams.symbol || '';
    const symbol = rawSymbol.trim().toUpperCase();

    const { user, loading: authLoading } = useAuth();
    const [detail, setDetail] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);
    const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Toast
    const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 5000);
    };

    const fetchDetail = useCallback(async () => {
        if (!symbol) return;
        setLoading(true);
        setError(null);

        try {
            const res = await api.get(`/stocks/${symbol}/detail`);
            setDetail(res.data);
        } catch (err: any) {
            console.error('Failed to load stock detail:', err);
            setError(err.response?.data?.message || `Unable to load details for ${symbol}`);
        } finally {
            setLoading(false);
        }
    }, [symbol]);

    useEffect(() => {
        if (!authLoading && !user) {
            window.location.href = '/login';
        }
    }, [user, authLoading]);

    useEffect(() => {
        if (user && symbol) {
            fetchDetail();
        }
    }, [user, symbol, fetchDetail]);

    const handleBuySubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            await api.post('/stocks/buy', data);
            setIsBuyModalOpen(false);
            showToast('success', `${data.symbol} added to portfolio`);
            fetchDetail();
        } catch (err: any) {
            showToast('error', err.response?.data?.message || 'Error purchasing stock');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSellSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            await api.post('/stocks/sell', data);
            setIsSellModalOpen(false);
            showToast('success', `Sold ${data.quantity} shares of ${data.symbol}`);
            fetchDetail();
        } catch (err: any) {
            showToast('error', err.response?.data?.message || 'Error selling stock');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 p-4 md:p-12 transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
                {/* Toast Notification */}
                {toast && (
                    <div className={cn(
                        "fixed top-6 right-6 z-[100] p-4 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md animate-in slide-in-from-right-8 duration-300",
                        toast.type === 'success'
                            ? "bg-white/90 dark:bg-slate-800/90 border-green-100 dark:border-green-900/50 text-green-700 dark:text-green-400"
                            : "bg-white/90 dark:bg-slate-800/90 border-red-100 dark:border-red-900/50 text-red-700 dark:text-red-400"
                    )}>
                        {toast.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                        <p className="font-bold">{toast.message}</p>
                    </div>
                )}

                {/* Back to Dashboard Navigation */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 font-bold text-sm transition-all shadow-xs"
                    >
                        <ArrowLeft size={16} />
                        Back to Portfolio
                    </Link>
                </div>

                {/* 1. Stock Header */}
                <StockHeader
                    symbol={symbol}
                    name={detail?.name || symbol}
                    series={detail?.series}
                    quote={detail?.quote || null}
                    loading={loading}
                />

                {/* 2. Portfolio Position Card */}
                <StockPositionCard
                    symbol={symbol}
                    name={detail?.name || symbol}
                    currentPrice={detail?.quote?.price || detail?.position?.currentPrice || 0}
                    position={detail?.position || null}
                    onBuy={() => setIsBuyModalOpen(true)}
                    onSell={() => setIsSellModalOpen(true)}
                    onAddTarget={() => setIsTargetModalOpen(true)}
                />

                {/* 3. Stock Chart Section */}
                <section>
                    <StockChart symbol={symbol} />
                </section>

                {/* 4. Technical Analysis Section */}
                <section>
                    <TechnicalAnalysis symbol={symbol} />
                </section>

                {/* 5. Fundamental Analysis Section */}
                <section>
                    <FundamentalAnalysis symbol={symbol} />
                </section>

                {/* 6. Our Analysis Section (Rules-based signals & score) */}
                <section>
                    <StockAnalysis symbol={symbol} />
                </section>
            </div>

            {/* Modals for Buy / Sell / Target */}
            <TransactionModal
                isOpen={isBuyModalOpen}
                onClose={() => setIsBuyModalOpen(false)}
                onSubmit={handleBuySubmit}
                initialData={{ symbol, name: detail?.name || symbol, price: detail?.quote?.price || 0 }}
                isLoading={isSubmitting}
            />

            <SellModal
                isOpen={isSellModalOpen}
                onClose={() => setIsSellModalOpen(false)}
                onSubmit={handleSellSubmit}
                stock={detail?.position}
                isLoading={isSubmitting}
            />

            <StockDetailsModal
                isOpen={isTargetModalOpen}
                onClose={() => setIsTargetModalOpen(false)}
                stock={detail?.position}
                onRefresh={fetchDetail}
            />
        </div>
    );
}
