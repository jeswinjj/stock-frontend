'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, LineSeries, IChartApi, CandlestickData, HistogramData, LineData } from 'lightweight-charts';
import api from '@/services/api';
import { Button } from '@/components/ui/BaseComponents';
import { RefreshCw, BarChart2, Eye, Sliders, Maximize2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StockChartProps {
    symbol: string;
    onDataLoaded?: (bars: any[]) => void;
}

const TIMEFRAMES = [
    { label: '1D', value: '1D', resolution: '5m' },
    { label: '1W', value: '1W', resolution: '15m' },
    { label: '1M', value: '1M', resolution: '1D' },
    { label: '3M', value: '3M', resolution: '1D' },
    { label: '6M', value: '6M', resolution: '1D' },
    { label: '1Y', value: '1Y', resolution: '1D' },
    { label: '5Y', value: '5Y', resolution: '1W' },
    { label: 'MAX', value: 'MAX', resolution: '1M' }
];

export function StockChart({ symbol, onDataLoaded }: StockChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartInstanceRef = useRef<IChartApi | null>(null);

    const [selectedTf, setSelectedTf] = useState('1Y');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [barsData, setBarsData] = useState<any[]>([]);

    // Indicator toggles
    const [showEma20, setShowEma20] = useState(true);
    const [showEma50, setShowEma50] = useState(true);
    const [showEma200, setShowEma200] = useState(false);

    const fetchBars = useCallback(async () => {
        if (!symbol) return;
        setLoading(true);
        setError(null);

        const tfConfig = TIMEFRAMES.find(t => t.value === selectedTf) || TIMEFRAMES[5];

        try {
            const res = await api.get(`/market-data/${symbol}/history`, {
                params: { resolution: tfConfig.resolution, timeframe: selectedTf }
            });

            const bars = res.data.bars || [];
            if (bars.length === 0) {
                setError('No historical data available for this stock and timeframe.');
                setBarsData([]);
            } else {
                setBarsData(bars);
                if (onDataLoaded) onDataLoaded(bars);
            }
        } catch (err: any) {
            console.error('Failed to load chart data:', err);
            setError(err.response?.data?.error || 'Unable to load market data. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [symbol, selectedTf, onDataLoaded]);

    useEffect(() => {
        fetchBars();
    }, [fetchBars]);

    // Initialize Lightweight Chart
    useEffect(() => {
        if (!chartContainerRef.current || barsData.length === 0) return;

        // Clean existing chart instance
        if (chartInstanceRef.current) {
            chartInstanceRef.current.remove();
            chartInstanceRef.current = null;
        }

        const isDark = document.documentElement.classList.contains('dark');

        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 480,
            layout: {
                background: { color: 'transparent' },
                textColor: isDark ? '#94a3b8' : '#64748b'
            },
            grid: {
                vertLines: { color: isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)' },
                horzLines: { color: isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)' }
            },
            crosshair: {
                mode: 1
            },
            rightPriceScale: {
                borderColor: isDark ? '#334155' : '#e2e8f0'
            },
            timeScale: {
                borderColor: isDark ? '#334155' : '#e2e8f0',
                timeVisible: true,
                secondsVisible: false
            }
        });

        chartInstanceRef.current = chart;

        // 1. Candlestick Series using lightweight-charts v4+ addSeries API
        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#10b981',
            downColor: '#ef4444',
            borderVisible: false,
            wickUpColor: '#10b981',
            wickDownColor: '#ef4444'
        });

        const candleData: CandlestickData[] = barsData.map(b => ({
            time: (b.time) as any,
            open: b.open,
            high: b.high,
            low: b.low,
            close: b.close
        }));

        candleSeries.setData(candleData);

        // 2. Volume Series
        const volumeSeries = chart.addSeries(HistogramSeries, {
            color: '#3b82f6',
            priceFormat: { type: 'volume' },
            priceScaleId: 'volume'
        });

        // Configure Volume price scale margins after series creation
        chart.priceScale('volume').applyOptions({
            scaleMargins: {
                top: 0.8,
                bottom: 0
            }
        });

        const volumeData: HistogramData[] = barsData.map(b => ({
            time: (b.time) as any,
            value: b.volume || 0,
            color: b.close >= b.open ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
        }));

        volumeSeries.setData(volumeData);


        // Helper EMA
        const calculateEMA = (period: number) => {
            if (barsData.length < period) return [];
            const k = 2 / (period + 1);
            let sum = 0;
            for (let i = 0; i < period; i++) sum += barsData[i].close;
            let ema = sum / period;
            const res: LineData[] = [{ time: barsData[period - 1].time as any, value: ema }];
            for (let i = period; i < barsData.length; i++) {
                ema = (barsData[i].close - ema) * k + ema;
                res.push({ time: barsData[i].time as any, value: Number(ema.toFixed(2)) });
            }
            return res;
        };

        // 3. Indicators Overlays
        if (showEma20) {
            const ema20Data = calculateEMA(20);
            if (ema20Data.length > 0) {
                const ema20Series = chart.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 2, title: 'EMA 20' });
                ema20Series.setData(ema20Data);
            }
        }

        if (showEma50) {
            const ema50Data = calculateEMA(50);
            if (ema50Data.length > 0) {
                const ema50Series = chart.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 2, title: 'EMA 50' });
                ema50Series.setData(ema50Data);
            }
        }

        if (showEma200) {
            const ema200Data = calculateEMA(200);
            if (ema200Data.length > 0) {
                const ema200Series = chart.addSeries(LineSeries, { color: '#8b5cf6', lineWidth: 2, title: 'EMA 200' });
                ema200Series.setData(ema200Data);
            }
        }

        chart.timeScale().fitContent();

        const handleResize = () => {
            if (chartContainerRef.current && chartInstanceRef.current) {
                chartInstanceRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (chartInstanceRef.current) {
                chartInstanceRef.current.remove();
                chartInstanceRef.current = null;
            }
        };
    }, [barsData, showEma20, showEma50, showEma200]);

    return (
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors duration-300 space-y-6">
            {/* Chart Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 dark:border-gray-700/60 pb-4">
                <div className="flex flex-wrap items-center gap-1.5 bg-gray-100 dark:bg-slate-700/40 p-1 rounded-2xl">
                    {TIMEFRAMES.map(tf => (
                        <button
                            key={tf.value}
                            onClick={() => setSelectedTf(tf.value)}
                            className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                                selectedTf === tf.value
                                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            )}
                        >
                            {tf.label}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setShowEma20(!showEma20)}
                        className={cn(
                            "h-9 px-3 text-xs font-bold rounded-xl border transition-all",
                            showEma20 ? "border-blue-300 text-blue-600 bg-blue-50 dark:bg-blue-900/20" : "text-gray-400 border-gray-200 dark:border-gray-700"
                        )}
                    >
                        EMA 20
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setShowEma50(!showEma50)}
                        className={cn(
                            "h-9 px-3 text-xs font-bold rounded-xl border transition-all",
                            showEma50 ? "border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-900/20" : "text-gray-400 border-gray-200 dark:border-gray-700"
                        )}
                    >
                        EMA 50
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setShowEma200(!showEma200)}
                        className={cn(
                            "h-9 px-3 text-xs font-bold rounded-xl border transition-all",
                            showEma200 ? "border-purple-300 text-purple-600 bg-purple-50 dark:bg-purple-900/20" : "text-gray-400 border-gray-200 dark:border-gray-700"
                        )}
                    >
                        EMA 200
                    </Button>
                    <Button
                        variant="outline"
                        onClick={fetchBars}
                        disabled={loading}
                        className="h-9 w-9 p-0 rounded-xl border-gray-200 dark:border-gray-700 text-gray-500"
                        title="Refresh Chart"
                    >
                        <RefreshCw size={14} className={cn(loading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* Chart Body */}
            <div className="relative min-h-[480px] w-full">
                {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 dark:bg-slate-800/70 backdrop-blur-xs rounded-2xl">
                        <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400 font-bold">
                            <RefreshCw className="animate-spin" size={24} />
                            <span>Loading market data...</span>
                        </div>
                    </div>
                )}

                {error ? (
                    <div className="flex flex-col items-center justify-center h-[480px] border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-6 text-center">
                        <AlertCircle className="text-amber-500 mb-3" size={32} />
                        <h4 className="text-base font-bold text-gray-800 dark:text-white">Chart Unavailable</h4>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 max-w-md">{error}</p>
                    </div>
                ) : (
                    <div ref={chartContainerRef} className="w-full h-[480px] rounded-2xl overflow-hidden" />
                )}
            </div>
        </div>
    );
}
