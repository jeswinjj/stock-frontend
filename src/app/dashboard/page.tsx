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
import { Button } from '@/components/ui/BaseComponents';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogOut, Plus, RefreshCw, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WalletCard } from '@/components/dashboard/WalletCard';

export default function Dashboard() {
    const { user, logout, hideBalance, togglePrivacy, loading: authLoading } = useAuth();
    const [summary, setSummary] = useState<any>(null);
    const [stocks, setStocks] = useState<any[]>([]);
    const [performance, setPerformance] = useState<any[]>([]);
    const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);
    const [selectedStock, setSelectedStock] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
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
        try {
            await api.post('/stocks/buy', data);
            setIsBuyModalOpen(false);
            setSelectedStock(null);
            showToast('success', `${data.symbol} added to portfolio`);
            fetchData();
        } catch (err: any) {
            showToast('error', err.response?.data?.message || 'Error occurred');
        }
    };

    const handleSellSubmit = async (data: any) => {
        try {
            await api.post('/stocks/sell', data);
            setIsSellModalOpen(false);
            setSelectedStock(null);
            showToast('success', `Sold ${data.quantity} shares of ${data.symbol}`);
            fetchData();
        } catch (err: any) {
            showToast('error', err.response?.data?.message || 'Error occurred');
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
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 p-6 md:p-12 transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-8">
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
                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Portfolio</h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Monitoring {stocks.length} assets</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="mr-2">
                            <WalletCard />
                        </div>
                        {/* <ThemeToggle /> */}

                        <Button
                            variant="outline"
                            onClick={togglePrivacy}
                            className="h-12 w-12 p-0 rounded-xl border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all shadow-sm"
                            title={hideBalance ? "Show Balances" : "Hide Balances"}
                        >
                            {hideBalance ? <EyeOff size={20} /> : <Eye size={20} />}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={fetchLatestPrices}
                            disabled={isFetching}
                            className="h-12 px-6 rounded-xl border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-bold transition-all shadow-sm"
                        >
                            <RefreshCw size={20} className={cn("mr-2", isFetching && "animate-spin")} />
                            {isFetching ? 'Refreshing...' : 'Refresh Prices'}
                        </Button>
                        <Button
                            onClick={() => { setSelectedStock(null); setIsBuyModalOpen(true); }}
                            className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
                        >
                            <Plus size={20} className="mr-2" /> Add Stock
                        </Button>
                        <Button
                            variant="outline"
                            onClick={logout}
                            className="h-12 w-12 p-0 rounded-xl border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shadow-sm"
                        >
                            <LogOut size={20} />
                        </Button>
                    </div>
                </header>

                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <SummaryCard title="Invested" value={summary?.totalInvested || 0} />
                    <SummaryCard title="Current Value" value={summary?.currentValue || 0} />
                    <SummaryCard
                        title="Total P&L"
                        value={summary?.totalPL || 0}
                        subValue={`${summary?.plPercentage?.toFixed(2)}%`}
                        isProfit={summary?.totalPL >= 0}
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
                    <section className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Portfolio Distribution</h2>
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
                        <div className="p-8 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-slate-800/50">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Your Holdings</h2>
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
                            onSort={handleSort}
                            sortConfig={sortConfig}
                        />
                    </section>

                    <section className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Stock-wise Performance</h2>
                                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wider">Invested Capital vs Current Value</p>
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
            />

            <SellModal
                isOpen={isSellModalOpen}
                onClose={() => { setIsSellModalOpen(false); setSelectedStock(null); }}
                onSubmit={handleSellSubmit}
                stock={selectedStock}
            />
        </div>
    );
}
