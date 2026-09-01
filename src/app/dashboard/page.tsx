'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { PortfolioBarChart } from '@/components/dashboard/PortfolioBarChart';
import { PortfolioTable } from '@/components/dashboard/PortfolioTable';
import { StockPerformanceChart } from '@/components/dashboard/StockPerformanceChart';
import { PortfolioHistoryChart } from '@/components/dashboard/PortfolioHistoryChart';
import { TransactionModal } from '@/components/dashboard/TransactionModal';
import { SellModal } from '@/components/dashboard/SellModal';
import { StockDetailsModal } from '../../components/dashboard/StockDetailsModal';
import { Button } from '@/components/ui/BaseComponents';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogOut, Plus, RefreshCw, AlertCircle, CheckCircle2, Eye, EyeOff, Clock, Briefcase, Shield, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WalletCard } from '@/components/dashboard/WalletCard';
import { StockNotification } from '@/components/dashboard/StockNotification';
import Link from 'next/link';

export default function Dashboard() {
    const { user, logout, hideBalance, togglePrivacy, loading: authLoading, autoRefreshEnabled, toggleAutoRefresh } = useAuth();
    const [summary, setSummary] = useState<any>(null);
    const [stocks, setStocks] = useState<any[]>([]);
    const [performance, setPerformance] = useState<any[]>([]);
    const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedStock, setSelectedStock] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [sortConfig, setSortConfig] = useState<{ column: string; order: 'asc' | 'desc' }>({
        column: 'name',
        order: 'asc'
    });

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 5000);
    };

    const fetchData = useCallback(async () => {
        if (!user) return;
        try {
            const [sumRes, stockRes, perfRes] = await Promise.all([
                api.get('portfolio/summary'),
                api.get(`stocks?sort=${sortConfig.column}&order=${sortConfig.order}`),
                api.get('portfolio/stock-performance')
            ]);
            setSummary(sumRes.data);
            setStocks(stockRes.data);
            setPerformance(perfRes.data);
        } catch (err) {
            console.error('Dashboard fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [sortConfig, user]);

    useEffect(() => {
        if (!authLoading && !user) {
            window.location.href = '/login'; // Use window.location for hard redirect if router isn't ready
        }
    }, [user, authLoading]);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [fetchData, user]);

    const fetchLatestPrices = async () => {
        setIsFetching(true);
        try {
            const response = await api.post('/stocks/fetch-prices');
            if (response.data.success) {
                showToast('success', 'Prices updated successfully!');
                fetchData();
            } else {
                showToast('error', response.data.message || 'Failed to fetch prices');
            }
        } catch (err: any) {
            showToast('error', err.response?.data?.message || 'Error occurred while fetching prices');
        } finally {
            setIsFetching(false);
        }
    };

    const handleBuySubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            await api.post('/stocks/buy', data);
            setIsBuyModalOpen(false);
            setSelectedStock(null);
            showToast('success', `${data.symbol} added to portfolio`);
            fetchData();
        } catch (err: any) {
            showToast('error', err.response?.data?.message || 'Error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSellSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            await api.post('/stocks/sell', data);
            setIsSellModalOpen(false);
            setSelectedStock(null);
            showToast('success', `Sold ${data.quantity} shares of ${data.symbol}`);
            fetchData();
        } catch (err: any) {
            showToast('error', err.response?.data?.message || 'Error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSort = (column: string) => {
        setSortConfig(prev => ({
            column,
            order: prev.column === column && prev.order === 'asc' ? 'desc' : 'asc'
        }));
    };

    if (loading) return <div className="flex items-center justify-center h-screen font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-900">Loading your portfolio...</div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 p-4 md:p-12 transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
                {/* Toast Notification */}
                {toast && (
                    <div className={cn(
                        "fixed top-6 right-6 z-[100] p-4 rounded-2xl shadow-2xl flex items-center gap-3 border animate-in slide-in-from-right-8 duration-300 backdrop-blur-md",
                        toast.type === 'success'
                            ? "bg-white/90 dark:bg-slate-800/90 border-green-100 dark:border-green-900/50 text-green-700 dark:text-green-400"
                            : "bg-white/90 dark:bg-slate-800/90 border-red-100 dark:border-red-900/50 text-red-700 dark:text-red-400"
                    )}>
                        {toast.type === 'success' ? <CheckCircle2 className="text-green-500 dark:text-green-400" size={24} /> : <AlertCircle className="text-red-500 dark:text-red-400" size={24} />}
                        <p className="font-bold">{toast.message}</p>
                    </div>
                )}

                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Portfolio</h1>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">Monitoring {stocks.length} assets</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="mr-2">
                            <WalletCard />
                        </div>
                        {/* <ThemeToggle /> */}
                        <StockNotification stocks={stocks} />
                        <Link href="/dashboard/prediction">
                            <Button
                                variant="outline"
                                className="h-11 md:h-12 px-3 md:px-4 rounded-xl border-violet-200 dark:border-violet-900/50 text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 font-bold transition-all shadow-sm text-xs md:text-sm"
                            >
                                <BarChart3 size={16} className="mr-1.5" /> Market Setup
                            </Button>
                        </Link>

                        <Button
                            variant="outline"
                            onClick={togglePrivacy}
                            className="h-11 w-11 md:h-12 md:w-12 p-0 rounded-xl border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all shadow-sm"
                            title={hideBalance ? "Show Balances" : "Hide Balances"}
                        >
                            {hideBalance ? <EyeOff size={18} /> : <Eye size={18} />}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={toggleAutoRefresh}
                            className={cn(
                                "h-11 md:h-12 px-3 md:px-4 rounded-xl border-gray-200 dark:border-gray-700 transition-all shadow-sm flex items-center gap-2",
                                autoRefreshEnabled ? "text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/30 bg-green-50/50 dark:bg-green-900/10" : "text-gray-400 dark:text-gray-500"
                            )}
                            title={autoRefreshEnabled ? "Auto-Refresh is ON (4 PM Weekdays)" : "Auto-Refresh is OFF"}
                        >
                            <Clock size={16} className={cn(autoRefreshEnabled && "animate-pulse")} />
                            <span className="text-[10px] md:text-xs font-bold whitespace-nowrap">{autoRefreshEnabled ? 'Auto ON' : 'Auto OFF'}</span>
                        </Button>
                        <Button
                            variant="outline"
                            onClick={fetchLatestPrices}
                            disabled={isFetching}
                            className="h-11 md:h-12 px-4 md:px-6 rounded-xl border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-bold transition-all shadow-sm text-xs md:text-base grow md:grow-0"
                        >
                            <RefreshCw size={18} className={cn("mr-1.5 md:mr-2", isFetching && "animate-spin")} />
                            {isFetching ? 'Refreshing...' : 'Refresh Prices'}
                        </Button>
                        {user?.role === 'admin' && (
                            <Link href="/admin/dashboard">
                                <Button
                                    variant="outline"
                                    className="h-11 md:h-12 px-4 md:px-6 rounded-xl border-purple-200 dark:border-purple-900/50 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 font-bold transition-all shadow-sm text-xs md:text-base grow md:grow-0"
                                >
                                    <Shield size={18} className="mr-1.5 md:mr-2" />
                                    Admin
                                </Button>
                            </Link>
                        )}
                        <Button
                            onClick={() => { setSelectedStock(null); setIsBuyModalOpen(true); }}
                            className="h-11 md:h-12 px-4 md:px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md hover:shadow-lg active:scale-95 text-sm md:text-base grow md:grow-0"
                        >
                            <Plus size={18} className="mr-1.5 md:mr-2" /> Add Stock
                        </Button>
                        <Button
                            variant="outline"
                            onClick={logout}
                            className="h-11 w-11 md:h-12 md:w-12 p-0 rounded-xl border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shadow-sm"
                        >
                            <LogOut size={18} />
                        </Button>
                    </div>
                </header>

                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <SummaryCard title="Invested" value={summary?.totalInvested || 0} />
                    <SummaryCard
                        title="Current Value"
                        value={summary?.currentValue || 0}
                        isProfit={summary?.unrealizedPL >= 0}
                    />
                    <SummaryCard
                        title="Holdings P&L"
                        value={summary?.unrealizedPL || 0}
                        subValue={summary?.totalInvested > 0 ? `${(summary.unrealizedPL / summary.totalInvested * 100).toFixed(2)}%` : "0.00%"}
                        isProfit={summary?.unrealizedPL >= 0}
                    />
                    <SummaryCard
                        title="Today's Change"
                        value={summary?.todayChange || 0}
                        subValue={`${summary?.todayChangePercentage?.toFixed(2)}%`}
                        isProfit={summary?.todayChange >= 0}
                    />
                    <SummaryCard
                        title="Realized P&L"
                        value={summary?.realizedPL || 0}
                        isProfit={summary?.realizedPL >= 0}
                    />
                </section>

                <div className="grid grid-cols-1 gap-8">
                    <section className="bg-white dark:bg-slate-800 p-4 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors duration-300">
                        <div className="flex justify-between items-center mb-4 md:mb-6">
                            <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white">Portfolio Distribution</h2>
                        </div>
                        <PortfolioBarChart
                            invested={summary?.totalInvested || 0}
                            currentValue={summary?.currentValue || 0}
                        />
                    </section>

                    {/* Historic Performance Chart */}
                    <section className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors duration-300 overflow-hidden">
                        <PortfolioHistoryChart />
                    </section>

                    <section className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-colors duration-300">
                        <div className="p-4 md:p-8 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-slate-800/50">
                            <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white">Your Holdings</h2>
                        </div>
                        <PortfolioTable
                            stocks={stocks}
                            onAddMore={(stock) => {
                                setSelectedStock(stock);
                                setIsBuyModalOpen(true);
                            }}
                            onSell={(stock) => {
                                setSelectedStock(stock);
                                setIsSellModalOpen(true);
                            }}
                            onView={(stock) => {
                                setSelectedStock(stock);
                                setIsViewModalOpen(true);
                            }}
                            onSort={handleSort}
                            sortConfig={sortConfig}
                        />
                    </section>

                    <section className="bg-white dark:bg-slate-800 p-4 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors duration-300">
                        <div className="flex justify-between items-center mb-4 md:mb-6">
                            <div>
                                <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white">Stock-wise Performance</h2>
                                <p className="text-[10px] md:text-xs font-medium text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wider">Invested Capital vs Current Value</p>
                            </div>
                        </div>
                        <StockPerformanceChart data={performance} />
                    </section>
                </div>
            </div>

            <TransactionModal
                isOpen={isBuyModalOpen}
                onClose={() => { setIsBuyModalOpen(false); setSelectedStock(null); }}
                onSubmit={handleBuySubmit}
                initialData={selectedStock}
                isLoading={isSubmitting}
            />

            <SellModal
                isOpen={isSellModalOpen}
                onClose={() => { setIsSellModalOpen(false); setSelectedStock(null); }}
                onSubmit={handleSellSubmit}
                stock={selectedStock}
                isLoading={isSubmitting}
            />

            <StockDetailsModal
                isOpen={isViewModalOpen}
                onClose={() => { setIsViewModalOpen(false); setSelectedStock(null); }}
                stock={selectedStock}
                onRefresh={fetchData}
            />
        </div>
    );
}
