'use client';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/BaseComponents';
import { X, Download, Calendar, Filter, FileSpreadsheet, Check, Sparkles, AlertCircle } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

interface Transaction {
    id: number;
    type: 'CREDIT' | 'DEBIT' | 'BUY' | 'SELL' | 'SELL_PROFIT' | 'SELL_LOSS' | 'WITHDRAW' | 'CORPORATE_ACTION';
    amount: string;
    description: string;
    symbol?: string;
    quantity?: number;
    buyPrice?: number;
    sellPrice?: number;
    costPrice?: number;
    totalPL?: number;
    price?: number;
    created_at: string;
}

interface ParsedTransaction extends Transaction {
    normalizedType: string;
    symbol: string;
    displayBuyPrice: number | null;
    displaySellPrice: number | null;
    displayPL: number | null;
    displayNetValue: number;
    displayDate: string;
    monthKey: string;
}

interface ExportTransactionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactions: ParsedTransaction[];
    currentTab: 'wallet' | 'trades';
    tradeFilter: 'all' | 'buy' | 'sell';
    onSuccess: (message: string) => void;
}

// Helper to calculate Indian Financial Year (starts April 1st, ends March 31st)
const getFinancialYearDates = (offsetYears: number = 0) => {
    const now = dayjs();
    const currentYear = now.year();
    const currentMonth = now.month(); // 0-indexed: April is 3
    const baseYear = currentMonth >= 3 ? currentYear : currentYear - 1;
    const startYear = baseYear + offsetYears;
    const endYear = startYear + 1;

    return {
        key: `FY${startYear}-${String(endYear).slice(-2)}`,
        label: `FY ${startYear}–${String(endYear).slice(-2)}`,
        startDate: `${startYear}-04-01`,
        endDate: `${endYear}-03-31`
    };
};

export const ExportTransactionsModal = ({
    isOpen,
    onClose,
    transactions,
    currentTab,
    tradeFilter,
    onSuccess
}: ExportTransactionsModalProps) => {
    // Scope: current view, all activity, trades only, wallet only
    const [scope, setScope] = useState<'current' | 'all' | 'trades' | 'wallet'>('current');
    const [activePreset, setActivePreset] = useState<string>('all_time');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [selectedFY, setSelectedFY] = useState<string>('');

    // Pre-calculate Indian Financial Years (current + past 4 years)
    const financialYears = useMemo(() => {
        return [0, -1, -2, -3, -4].map(offset => getFinancialYearDates(offset));
    }, []);

    // Reset dates when modal opens
    useEffect(() => {
        if (isOpen) {
            setActivePreset('all_time');
            setStartDate('');
            setEndDate('');
            setSelectedMonth('');
            setSelectedFY('');
            setScope('current');
        }
    }, [isOpen]);

    // Handle Quick Presets
    const handleApplyPreset = (presetKey: string) => {
        setActivePreset(presetKey);
        setSelectedFY('');
        setSelectedMonth('');

        const now = dayjs();
        switch (presetKey) {
            case 'all_time':
                setStartDate('');
                setEndDate('');
                break;
            case 'this_fy': {
                const fy = getFinancialYearDates(0);
                setStartDate(fy.startDate);
                setEndDate(fy.endDate);
                setSelectedFY(fy.key);
                break;
            }
            case 'last_fy': {
                const fy = getFinancialYearDates(-1);
                setStartDate(fy.startDate);
                setEndDate(fy.endDate);
                setSelectedFY(fy.key);
                break;
            }
            case 'this_month':
                setStartDate(now.startOf('month').format('YYYY-MM-DD'));
                setEndDate(now.endOf('month').format('YYYY-MM-DD'));
                break;
            case 'last_month': {
                const lastM = now.subtract(1, 'month');
                setStartDate(lastM.startOf('month').format('YYYY-MM-DD'));
                setEndDate(lastM.endOf('month').format('YYYY-MM-DD'));
                break;
            }
            case 'this_year':
                setStartDate(now.startOf('year').format('YYYY-MM-DD'));
                setEndDate(now.endOf('year').format('YYYY-MM-DD'));
                break;
            case 'last_year': {
                const lastY = now.subtract(1, 'year');
                setStartDate(lastY.startOf('year').format('YYYY-MM-DD'));
                setEndDate(lastY.endOf('year').format('YYYY-MM-DD'));
                break;
            }
            default:
                break;
        }
    };

    // Handle Financial Year dropdown change
    const handleFYChange = (fyKey: string) => {
        if (!fyKey) {
            handleApplyPreset('all_time');
            return;
        }
        const found = financialYears.find(f => f.key === fyKey);
        if (found) {
            setSelectedFY(fyKey);
            setActivePreset(fyKey);
            setSelectedMonth('');
            setStartDate(found.startDate);
            setEndDate(found.endDate);
        }
    };

    // Handle Month Picker change
    const handleMonthChange = (monthStr: string) => {
        setSelectedMonth(monthStr);
        if (monthStr) {
            setActivePreset('month');
            setSelectedFY('');
            const m = dayjs(monthStr);
            setStartDate(m.startOf('month').format('YYYY-MM-DD'));
            setEndDate(m.endOf('month').format('YYYY-MM-DD'));
        }
    };

    // Filter transactions based on selected scope and date range
    const filteredData = useMemo(() => {
        return transactions.filter(tx => {
            // 1. Filter by Scope
            if (scope === 'current') {
                if (currentTab === 'wallet') {
                    if (!['CREDIT', 'WITHDRAW', 'DEBIT'].includes(tx.type)) return false;
                } else {
                    if (tx.type === 'CORPORATE_ACTION') return true;
                    if (!tx.type.startsWith('BUY') && !tx.type.startsWith('SELL')) return false;
                    if (tradeFilter === 'buy' && tx.type !== 'BUY') return false;
                    if (tradeFilter === 'sell' && tx.normalizedType !== 'SELL') return false;
                }
            } else if (scope === 'trades') {
                if (!tx.type.startsWith('BUY') && !tx.type.startsWith('SELL') && tx.type !== 'CORPORATE_ACTION') {
                    return false;
                }
            } else if (scope === 'wallet') {
                if (!['CREDIT', 'WITHDRAW', 'DEBIT'].includes(tx.type)) {
                    return false;
                }
            }

            // 2. Filter by Date
            const txTime = new Date(tx.created_at).getTime();
            if (startDate) {
                const startTime = new Date(`${startDate}T00:00:00`).getTime();
                if (txTime < startTime) return false;
            }
            if (endDate) {
                const endTime = new Date(`${endDate}T23:59:59.999`).getTime();
                if (txTime > endTime) return false;
            }

            return true;
        });
    }, [transactions, scope, currentTab, tradeFilter, startDate, endDate]);

    // Financial calculations for preview
    const previewSummary = useMemo(() => {
        let totalNetValue = 0;
        let totalPL = 0;
        let plCount = 0;

        filteredData.forEach(tx => {
            totalNetValue += tx.displayNetValue || 0;
            if (tx.displayPL !== null && tx.displayPL !== undefined) {
                totalPL += tx.displayPL;
                plCount++;
            }
        });

        return {
            count: filteredData.length,
            totalNetValue,
            totalPL,
            hasPL: plCount > 0
        };
    }, [filteredData]);

    const handleExport = () => {
        if (filteredData.length === 0) return;

        const dataToExport = filteredData.map(tx => ({
            'Date': tx.displayDate,
            'Type': tx.type.replace('_', ' '),
            'Symbol': tx.symbol,
            'Description': tx.description,
            'Quantity': tx.quantity || '—',
            'Buy Price': tx.displayBuyPrice ?? '—',
            'Sell Price': tx.displaySellPrice ?? '—',
            'P/L': tx.displayPL ?? '—',
            'Net Value (Wallet Impact)': tx.displayNetValue
        }));

        // Determine filename
        let fileSuffix = 'all-time';
        if (selectedFY) {
            fileSuffix = selectedFY;
        } else if (startDate && endDate) {
            fileSuffix = `${startDate}_to_${endDate}`;
        } else if (startDate) {
            fileSuffix = `from_${startDate}`;
        } else if (endDate) {
            fileSuffix = `upto_${endDate}`;
        }

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Transactions");
        XLSX.writeFile(wb, `wallet-report-${fileSuffix}.xlsx`);

        onSuccess(`Exported ${filteredData.length} transactions successfully`);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                            <FileSpreadsheet size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Export to Excel</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Choose date range, financial year, and scope</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* 1. Scope Selection */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Filter size={13} /> Export Scope
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                                { id: 'current', label: `Current View (${currentTab})` },
                                { id: 'all', label: 'All Records' },
                                { id: 'trades', label: 'Trades Only' },
                                { id: 'wallet', label: 'Wallet Only' }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setScope(item.id as any)}
                                    className={cn(
                                        "py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all truncate",
                                        scope === item.id
                                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                            : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                                    )}
                                    title={item.label}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. Quick Presets */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Sparkles size={13} /> Quick Selection
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { id: 'all_time', label: 'All Time' },
                                { id: 'this_fy', label: 'This FY' },
                                { id: 'last_fy', label: 'Last FY' },
                                { id: 'this_month', label: 'This Month' },
                                { id: 'last_month', label: 'Last Month' },
                                { id: 'this_year', label: 'This Year' },
                                { id: 'last_year', label: 'Last Year' }
                            ].map(preset => (
                                <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => handleApplyPreset(preset.id)}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-bold rounded-xl border transition-all",
                                        activePreset === preset.id
                                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                                            : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                                    )}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3. Financial Year & Month Pickers */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                                Select Financial Year
                            </label>
                            <select
                                value={selectedFY}
                                onChange={(e) => handleFYChange(e.target.value)}
                                className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">-- Choose Financial Year --</option>
                                {financialYears.map(fy => (
                                    <option key={fy.key} value={fy.key}>
                                        {fy.label} (Apr – Mar)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                                Select Specific Month
                            </label>
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => handleMonthChange(e.target.value)}
                                className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* 4. Date Range Fields */}
                    <div>
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                            <Calendar size={13} /> Custom Date Range
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <span className="text-[11px] text-gray-400 block mb-1">From Date</span>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => {
                                        setStartDate(e.target.value);
                                        setActivePreset('custom');
                                        setSelectedFY('');
                                        setSelectedMonth('');
                                    }}
                                    className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <span className="text-[11px] text-gray-400 block mb-1">To Date</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => {
                                        setEndDate(e.target.value);
                                        setActivePreset('custom');
                                        setSelectedFY('');
                                        setSelectedMonth('');
                                    }}
                                    className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 5. Live Summary Preview Card */}
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900/70 border border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Export Summary
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                {previewSummary.count} {previewSummary.count === 1 ? 'Transaction' : 'Transactions'}
                            </span>
                        </div>

                        <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                            {startDate || endDate ? (
                                <span>Range: {startDate ? dayjs(startDate).format('DD MMM YYYY') : 'Start'} → {endDate ? dayjs(endDate).format('DD MMM YYYY') : 'Present'}</span>
                            ) : (
                                <span>Range: All recorded history</span>
                            )}
                        </div>

                        {previewSummary.count > 0 && (
                            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50 text-xs">
                                <div>
                                    <span className="text-gray-400 block text-[11px]">Net Wallet Impact</span>
                                    <span className={cn("font-bold text-sm", previewSummary.totalNetValue >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                                        {formatCurrency(previewSummary.totalNetValue)}
                                    </span>
                                </div>
                                {previewSummary.hasPL && (
                                    <div className="text-right">
                                        <span className="text-gray-400 block text-[11px]">Realized P/L</span>
                                        <span className={cn("font-bold text-sm", previewSummary.totalPL >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                                            {previewSummary.totalPL >= 0 ? '+' : ''}{formatCurrency(previewSummary.totalPL)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {previewSummary.count === 0 && (
                            <div className="flex items-center gap-2 mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                                <AlertCircle size={14} />
                                <span>No transactions found matching this date range and scope.</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-slate-800/50 flex flex-col sm:flex-row justify-end items-center gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="w-full sm:w-auto rounded-xl px-5 py-2 font-bold text-gray-700 dark:text-gray-300"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleExport}
                        disabled={previewSummary.count === 0}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6 py-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none"
                    >
                        <Download size={16} className="mr-2" />
                        Export {previewSummary.count > 0 ? `(${previewSummary.count})` : ''}
                    </Button>
                </div>
            </div>
        </div>
    );
};
